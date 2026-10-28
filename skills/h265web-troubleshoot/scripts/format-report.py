#!/usr/bin/env python3
"""Generate a local redacted diagnosis/Issue draft, preserving unknowns."""
import argparse
import sys
sys.dont_write_bytecode = True
import json
from pathlib import Path
from diagnostic_common import clean

FIELDS = {
    'symptom': 'Actual symptom', 'expected': 'Expected', 'sdkSource': 'SDK source/version',
    'assetHashes': 'Asset hashes', 'framework': 'Framework/build', 'browserOS': 'Browser/OS',
    'mediaSummary': 'Media summary', 'wantedCore': 'Requested core', 'selectedCore': 'Actual core',
    'boundCallbacks': 'Bound callbacks', 'stageTimings': 'Observed stage timings (include units)',
    'reproduction': 'Minimal reproduction / startup', 'observations': 'Observed facts',
    'confirmedCauses': 'Confirmed causes', 'hypotheses': 'Unconfirmed hypotheses',
    'errors': 'Errors', 'checks': 'Checks (retain exit codes/failures)', 'changes': 'Changes tried',
    'retest': 'Retest / limits', 'unknowns': 'Remaining unknowns',
    'audioLeveling':'Audio leveling request / actual state', 'superResolution':'Super resolution request / actual state',
}
ZH_FIELDS = dict(zip(FIELDS, [
    '实际现象', '预期行为', 'SDK 来源与版本', '资源指纹', '框架与构建', '浏览器与系统',
    '媒体摘要', '请求核心', '实际核心', '绑定回调', '已观察的阶段时序（注明单位）',
    '最小复现与启动', '已观察事实', '已确认原因', '待验证假设', '错误',
    '检查结果（保留退出码与失败）', '尝试的变更', '复测结果与限制', '仍未知的信息',
    '稳定音量请求与实际状态', '超分请求与实际状态',
]))


def render(raw, language='zh'):
    lines = ['# h265web.js 排障 / Issue 草稿' if language == 'zh' else '# h265web.js diagnostic / Issue draft', '',
             '分享前人工预览：URL 参数和部分凭证已过滤，任意路径与正文仍可能包含隐私。' if language == 'zh' else
             'Review before sharing. URLs/query values and selected secrets are filtered; arbitrary paths/prose may still be private.', '']
    for key, title in FIELDS.items():
        value = clean(raw.get(key, 'unknown'))
        if value is None or value == '' or value == [] or value == {}: value = 'unknown'
        lines.extend(['## ' + (ZH_FIELDS[key] if language == 'zh' else title), ''])
        if isinstance(value, str):
            # Fence untrusted content; choose a fence longer than any embedded run.
            longest = max([len(s) for s in __import__('re').findall(r'`+', value)] or [2])
            fence = '`' * (longest + 1)
            lines.extend([fence + 'text', value, fence, ''])
        else:
            text = json.dumps(value, ensure_ascii=False, indent=2)
            longest = max([len(s) for s in __import__('re').findall(r'`+', text)] or [2])
            fence = '`' * (longest + 1)
            lines.extend([fence + 'json', text, fence, ''])
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--language', choices=['zh', 'en'], default='zh')
    args = parser.parse_args()
    try:
        if args.input.stat().st_size > 1048576: parser.error('Input is limited to 1 MiB; summarize locally first')
        raw = json.loads(args.input.read_text())
        if not isinstance(raw, dict): parser.error('Input must be a structured object')
        text = render(raw, args.language)
        if args.output:
            # Exclusive create rejects files, directories and symlinks.
            with args.output.open('x', encoding='utf-8') as output: output.write(text)
            print('Created local report. Preview it before sharing.')
        else: print(text)
    except (OSError, ValueError) as error: parser.error(str(error))


if __name__ == '__main__': main()
