#!/usr/bin/env python3
"""Inspect local media; never fetch URLs, overwrite media or play audio."""
import argparse
import sys
sys.dont_write_bytecode = True
import json
import shutil
import struct
import subprocess
from pathlib import Path
from diagnostic_common import clean


def mp4_boxes(path, limit=4096):
    size = path.stat().st_size
    boxes, offset, error = [], 0, None
    with path.open('rb') as file:
        while offset < size and len(boxes) < limit:
            file.seek(offset)
            header = file.read(8)
            if len(header) < 8:
                error = {'kind': 'truncated-header', 'offset': offset}; break
            length, raw_type = struct.unpack('>I4s', header)
            box_type = raw_type.decode('ascii', errors='replace')
            header_size = 8
            if length == 1:
                extended = file.read(8)
                if len(extended) != 8:
                    error = {'kind': 'truncated-extended-size', 'offset': offset}; break
                length = struct.unpack('>Q', extended)[0]; header_size = 16
            elif length == 0: length = size - offset
            if length < header_size:
                error = {'kind': 'invalid-size', 'offset': offset, 'size': length}; break
            if offset + length > size:
                error = {'kind': 'truncated-box', 'offset': offset, 'declaredSize': length, 'available': size - offset}; break
            boxes.append({'type': box_type, 'offset': offset, 'size': length, 'headerSize': header_size})
            offset += length  # Seek over mdat; do not allocate/read its contents.
    if len(boxes) == limit and offset < size: error = {'kind': 'box-limit', 'offset': offset}
    moov = [b['offset'] for b in boxes if b['type'] == 'moov']
    mdat = [b['offset'] for b in boxes if b['type'] == 'mdat']
    fragmented = any(b['type'] == 'moof' for b in boxes)
    layout = 'malformed' if error else 'fragmented' if fragmented else 'missing-moov' if not moov else 'missing-mdat' if not mdat else 'moov-before-mdat' if moov[0] < mdat[0] else 'moov-after-mdat'
    return {'boxes': boxes, 'layout': layout, 'fragmented': fragmented, 'error': error,
            'meaning': 'Top-level structure only; not codec validity, completeness of nested moov or browser compatibility.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--ffprobe', default='ffprobe')
    parser.add_argument('--timeout', type=float, default=15)
    args = parser.parse_args()
    path = args.file.expanduser()
    if not path.is_file(): parser.error('Provide an existing local media file. URLs are not fetched.')
    if not 0 < args.timeout <= 120: parser.error('timeout must be >0 and <=120 seconds')
    with path.open('rb') as file: prefix = file.read(64)
    lowered = prefix.lstrip().lower()
    content = 'html' if lowered.startswith((b'<!doctype html', b'<html', b'<head', b'<body')) else 'json-like' if lowered.startswith((b'{', b'[')) else 'binary-or-other'
    result = {'file': path.name, 'size': path.stat().st_size, 'content': content}
    if content == 'binary-or-other' and (path.suffix.lower() in ('.mp4', '.mov', '.m4v') or prefix[4:8] in (b'ftyp', b'moov', b'mdat', b'free', b'wide', b'styp')):
        result['mp4'] = mp4_boxes(path)
    executable = shutil.which(args.ffprobe)
    if not executable:
        result['ffprobe'] = {'status': 'unavailable', 'alternative': 'Use DevTools media/probe evidence; box structure alone cannot identify supported codecs.'}
    else:
        entries = 'format=format_name,duration,size,bit_rate:stream=index,codec_type,codec_name,codec_tag_string,profile,pix_fmt,width,height,sample_aspect_ratio,r_frame_rate,avg_frame_rate,sample_rate,channels'
        try:
            process = subprocess.run([executable, '-v', 'error', '-show_entries', entries, '-of', 'json', str(path.resolve())], capture_output=True, timeout=args.timeout)
            probe = {'status': 'ok' if process.returncode == 0 else 'failed', 'exitCode': process.returncode,
                     'error': process.stderr.decode(errors='replace')[:4000]}
            try: probe['summary'] = json.loads(process.stdout)
            except (ValueError, UnicodeDecodeError): probe['summary'] = None
            result['ffprobe'] = probe
        except subprocess.TimeoutExpired:
            result['ffprobe'] = {'status': 'timeout', 'timeoutSeconds': args.timeout}
        except OSError as error:
            result['ffprobe'] = {'status': 'failed', 'error': str(error)}
    print(json.dumps(clean(result), ensure_ascii=False, indent=2))


if __name__ == '__main__': main()
