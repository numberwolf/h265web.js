#!/usr/bin/env python3
"""One explicit, bounded HTTP inspection; no credentials or raw body in output."""
import argparse
import sys
sys.dont_write_bytecode = True
import json
import re
import socket
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit
from diagnostic_common import clean, safe_url


class Redirects(urllib.request.HTTPRedirectHandler):
    def __init__(self): self.hops = []
    def redirect_request(self, request, fp, code, message, headers, target):
        if len(self.hops) >= 5: raise urllib.error.URLError('Redirect limit exceeded')
        parsed = urlsplit(target)
        if parsed.scheme not in ('http', 'https') or parsed.username or parsed.password:
            raise urllib.error.URLError('Unsupported or credential-bearing redirect')
        if urlsplit(request.full_url).scheme == 'https' and parsed.scheme != 'https':
            raise urllib.error.URLError('HTTPS downgrade redirect refused')
        self.hops.append({'status': code, 'from': safe_url(request.full_url), 'to': safe_url(target)})
        result = super().redirect_request(request, fp, code, message, headers, target)
        if result and urlsplit(request.full_url).netloc != parsed.netloc:
            for key in list(result.headers):
                if key.lower() not in ('accept', 'range', 'user-agent'):
                    result.remove_header(key)
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--url'); source.add_argument('--url-file', type=Path)
    parser.add_argument('--headers-file', type=Path, help='Private JSON object; not included in output')
    parser.add_argument('--method', choices=['GET', 'HEAD'], default='GET')
    parser.add_argument('--range')
    parser.add_argument('--one-time', action='store_true', help='Refuse a probe that could consume a one-time token')
    parser.add_argument('--max-bytes', type=int, default=65536)
    parser.add_argument('--timeout', type=float, default=10)
    args = parser.parse_args()
    if args.one_time: parser.error('One-time authorization: inspect the actual playback request in DevTools. No request sent.')
    if not 1 <= args.max_bytes <= 1048576 or not 0 < args.timeout <= 60: parser.error('Invalid bounded size/timeout')
    try:
        url = args.url or args.url_file.read_text().strip()
        parsed = urlsplit(url)
        if parsed.scheme not in ('http', 'https') or not parsed.netloc or parsed.username or parsed.password:
            parser.error('Use a complete HTTP(S) URL without user/password. WS requires browser handshake evidence.')
        headers = json.loads(args.headers_file.read_text()) if args.headers_file else {}
        if not isinstance(headers, dict) or not all(isinstance(k, str) and isinstance(v, str) and '\n' not in k + v and '\r' not in k + v for k, v in headers.items()):
            parser.error('headers-file must contain an object of single-line strings')
        if args.range:
            if not re.fullmatch(r'bytes=(?:\d+-\d*|-\d+)', args.range): parser.error('Use one byte Range, e.g. bytes=0-1023 or bytes=-1024')
            headers['Range'] = args.range
        headers.setdefault('Accept-Encoding', 'identity')
    except (OSError, ValueError) as error: parser.error(str(error))
    redirect = Redirects()
    opener = urllib.request.build_opener(redirect)
    result = {'url': safe_url(url), 'method': args.method, 'requestedRange': args.range,
              'limits': {'maxBytes': args.max_bytes, 'timeoutSeconds': args.timeout}, 'redirects': redirect.hops}
    started = time.monotonic()
    try:
        try: response = opener.open(urllib.request.Request(url, headers=headers, method=args.method), timeout=args.timeout)
        except urllib.error.HTTPError as error:
            response = error
            if 300 <= error.code < 400:
                result['error'] = 'Redirect chain not completed (bounded loop or invalid target)'
        with response:
            allowed = ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges', 'Access-Control-Allow-Origin',
                       'Access-Control-Allow-Credentials', 'Cross-Origin-Opener-Policy', 'Cross-Origin-Embedder-Policy',
                       'Cross-Origin-Resource-Policy', 'Content-Encoding', 'Cache-Control']
            result.update(status=response.status, finalUrl=safe_url(response.geturl()), headers={k: response.headers[k] for k in allowed if k in response.headers})
            data = bytearray()
            if args.method != 'HEAD':
                deadline = time.monotonic() + args.timeout
                while len(data) <= args.max_bytes:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0: raise TimeoutError('Body read deadline exceeded')
                    raw_socket = getattr(getattr(getattr(response, 'fp', None), 'raw', None), '_sock', None)
                    if raw_socket: raw_socket.settimeout(remaining)
                    chunk = response.read1(min(16384, args.max_bytes + 1 - len(data)))
                    if not chunk: break
                    data.extend(chunk)
            result['bytesRead'] = len(data)
            result['truncated'] = len(data) > args.max_bytes
            first = bytes(data[:128]).lstrip().lower()
            content_type = response.headers.get('Content-Type', '').lower()
            result['bodyKind'] = 'none' if not data else 'wasm' if data[:4] == b'\0asm' else 'html' if first.startswith((b'<!doctype html', b'<html', b'<head', b'<body')) or 'text/html' in content_type else 'json-like' if first.startswith((b'{', b'[')) or 'application/json' in content_type else 'hls-playlist' if first.startswith(b'#extm3u') else 'mp4-like' if data[4:8] in (b'ftyp', b'moov', b'mdat', b'free') else 'flv' if data[:3] == b'FLV' else 'binary-or-other'
            length = response.headers.get('Content-Range', '')
            match = re.fullmatch(r'bytes (\d+)-(\d+)/(\d+|\*)', length)
            result['rangeEvidence'] = 'not-requested' if not args.range else 'ignored-or-full-response' if response.status == 200 else 'invalid-or-stale-range' if response.status == 416 else 'partial-content-header-valid' if response.status == 206 and match and int(match[1]) <= int(match[2]) and (match[3] == '*' or int(match[2]) < int(match[3])) else 'unconfirmed'
            if match and not result['truncated'] and args.method != 'HEAD':
                result['rangeLengthMatches'] = len(data) == int(match[2]) - int(match[1]) + 1
            if match and args.range:
                lower, upper = args.range.removeprefix('bytes=').split('-', 1)
                start, end = int(match[1]), int(match[2])
                total = int(match[3]) if match[3] != '*' else None
                if lower:
                    expected_end = min(int(upper), total - 1) if upper and total else int(upper) if upper else total - 1 if total else None
                    result['requestedRangeMatches'] = start == int(lower) and (expected_end is None or end == expected_end)
                else:
                    result['requestedRangeMatches'] = start == max(0, total - int(upper)) and end == total - 1 if total else 'unknown-total'
            result['interpretation'] = 'No retries. HTTP reachability does not prove browser CORS, decoding or SDK Range behavior.'
    except (urllib.error.URLError, OSError, ValueError, socket.timeout) as error:
        result['error'] = str(error)
    result['elapsedSeconds'] = round(time.monotonic() - started, 3)
    print(json.dumps(clean(result), ensure_ascii=False, indent=2))


if __name__ == '__main__': main()
