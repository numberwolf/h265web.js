"""Local diagnostic output filtering; arbitrary prose still needs human review."""
import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

PRIVATE = re.compile(r'(?:authorization|cookie|password|secret|token|sdp|candidate)', re.I)


def safe_url(value):
    try:
        parsed = urlsplit(value)
        host = parsed.hostname or ''
        if host == 'localhost' or re.match(r'^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)', host):
            host = 'local.invalid'
        if ':' in host and not host.startswith('['): host = '[' + host + ']'
        port = ':' + str(parsed.port) if parsed.port else ''
        query = urlencode([(key, '[redacted]') for key, _ in parse_qsl(parsed.query, keep_blank_values=True)])
        return urlunsplit((parsed.scheme, host + port, parsed.path, query, '[redacted]' if parsed.fragment else ''))
    except ValueError:
        return '[invalid URL]'


def redact_text(value):
    value = re.sub(r'(?:https?|wss?|webrtc)://[^\s<>"\'`]+', lambda m: safe_url(m.group()), str(value))
    value = re.sub(r'(?im)^.*(?:a=candidate:|a=ice-(?:pwd|ufrag):|c=IN IP[46]|v=0).*$','[private signaling redacted]', value)
    value = re.sub(r'(?i)\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+', '[auth redacted]', value)
    value = re.sub(r'(?i)\b(token|password|secret|authorization|cookie)\s*[:=]\s*[^\s,;]+', r'\1=[redacted]', value)
    value = re.sub(r'(?<![\d.])(?:127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?![\d.])', '[private IP]', value)
    return value[:16000]


def clean(value, depth=0):
    if depth > 8: return '[depth limit]'
    if isinstance(value, dict):
        return {redact_text(k): ('[redacted]' if PRIVATE.search(k) else clean(v, depth + 1))
                for k, v in list(value.items())[:100] if isinstance(k, str)}
    if isinstance(value, list): return [clean(v, depth + 1) for v in value[:100]]
    if isinstance(value, str): return redact_text(value)
    if value is None or isinstance(value, (bool, int, float)): return value
    return redact_text(value)
