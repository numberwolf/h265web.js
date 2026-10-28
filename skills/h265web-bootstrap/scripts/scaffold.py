#!/usr/bin/env python3
"""Generate a new runnable h265web.js demo without modifying an existing app."""
import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

SKILL = Path(__file__).resolve().parents[1]
ASSETS = SKILL / 'assets'
VERSIONS = {
    'react': '19.3.1', 'react-dom': '19.3.1', 'vite': '8.3.4',
    '@vitejs/plugin-react': '6.1.2', 'vue': '3.5.44', '@vitejs/plugin-vue': '6.0.10',
    'svelte': '5.57.2', '@sveltejs/vite-plugin-svelte': '7.3.1', 'next': '16.4.1',
    'nuxt': '4.6.1', '@angular/core': '22.2.2', '@angular/compiler': '22.2.2',
    '@angular/common': '22.2.2', '@angular/platform-browser': '22.2.2',
    'zone.js': '0.16.3', 'rxjs': '7.8.2',
}
HEADERS = {'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp'}
SDK_FILES = ('h265web.js', 'h265web_wasm.js', 'h265web_wasm.wasm')


def write(root, relative, text):
    destination = root / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(text, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--framework', choices=['vanilla', 'react', 'vue', 'angular', 'svelte', 'next', 'nuxt'], default='vanilla')
    parser.add_argument('--output', type=Path, required=True, help='New directory; an existing directory is never overwritten')
    source = parser.add_mutually_exclusive_group()
    source.add_argument('--sdk-dir', type=Path, help='Directory containing the three matching SDK files')
    source.add_argument('--sdk-base', help='Explicit HTTP(S) SDK directory ending in /; browser downloads it')
    parser.add_argument('--media', help='Existing local VOD file or complete HTTP(S)/WS(S)/webrtc URL')
    parser.add_argument('--scenario', choices=['vod', 'live', 'webrtc', 'vr360'], default='vod')
    parser.add_argument('--core', choices=['auto', 'mse_hevc', 'webcodec_hevc', 'wasm_hevc', 'webrtc'], default='auto')
    parser.add_argument('--with-sr', action='store_true', help='Include complete optional SR models and controls; enhancement remains off')
    parser.add_argument('--sr-models-dir', type=Path, help='Complete matching models/sr directory (required with remote SDK for SR)')
    parser.add_argument('--sr-input-color', choices=['unknown', 'sdr'], default='unknown', help='Declare sdr only for this verified input, never infer it from resolution')
    parser.add_argument('--format-type', choices=['mp4', 'webm', 'flv', 'ts', 'hls', 'raw265'])
    args = parser.parse_args()
    output = args.output.expanduser().absolute()
    if output.exists() or output.is_symlink():
        parser.error('Output already exists. Choose a new directory; integrate manually into an existing app.')
    sdk_dir = args.sdk_dir.expanduser().resolve() if args.sdk_dir else None
    if not sdk_dir and not args.sdk_base:
        adjacent = SKILL.parents[1] / 'static'
        if adjacent.is_dir():
            sdk_dir = adjacent
        else:
            parser.error('Provide --sdk-dir with matching runtime files, or --sdk-base with an explicit release URL.')
    if sdk_dir:
        for name in SDK_FILES:
            path = sdk_dir / name
            if not path.is_file() or path.stat().st_size == 0:
                parser.error(f'Missing SDK asset: {name}')
        with (sdk_dir / SDK_FILES[2]).open('rb') as file:
            if file.read(4) != b'\0asm':
                parser.error('WASM asset does not contain a WebAssembly header.')
    if args.sdk_base:
        url = urlsplit(args.sdk_base)
        if url.scheme not in ('https', 'http') or not url.netloc or not url.path.endswith('/') or url.query or url.fragment or url.username is not None or url.password is not None:
            parser.error('--sdk-base must be an HTTP(S) directory URL ending in /, without credentials/query/fragment.')
    models_dir = None
    if args.sr_models_dir and not args.with_sr: parser.error('--sr-models-dir requires --with-sr')
    if args.sr_input_color != 'unknown' and not args.with_sr: parser.error('--sr-input-color requires --with-sr')
    if args.with_sr:
        models_dir = args.sr_models_dir.expanduser().resolve() if args.sr_models_dir else sdk_dir / 'models/sr' if sdk_dir else None
        if not models_dir or not models_dir.is_dir(): parser.error('SR needs complete matching models/sr assets; provide --sr-models-dir or current --sdk-dir. Old SDK can run without --with-sr.')
        for path in models_dir.rglob('*'):
            if path.is_symlink(): parser.error('SR assets must be physical files, not symlinks')
        try:
            manifest = json.loads((models_dir / 'model.json').read_text())
            weights = models_dir / manifest['weights']
            if not weights.resolve().is_relative_to(models_dir): raise ValueError('Weights escape model directory')
            data = weights.read_bytes()
            if manifest.get('id') != 'anime4k-cnn-2x-s-an' or manifest.get('recipe') != 'rgb-cnn4-clamp-x2-bicubic-v1' or len(data) != manifest['bytes'] or hashlib.sha256(data).hexdigest() != manifest['sha256']:
                raise ValueError('SR manifest/weights do not match fixed AN recipe')
            for name in ['ANIME4K-LICENSE.txt', 'WEBSR-LICENSE.txt', 'README.md']:
                if not (models_dir / name).is_file() or not (models_dir / name).stat().st_size: raise ValueError('Missing complete SR license/source information')
        except (OSError, ValueError, KeyError, TypeError) as error: parser.error(str(error))
    if args.scenario != 'vod' and not args.media:
        parser.error('Live/RTC/VR require --media with a real stream or confirmed ERP source.')
    media_file = None
    if args.media:
        candidate = Path(args.media).expanduser()
        if candidate.is_file():
            if args.scenario in ('live', 'webrtc'):
                parser.error('A local file does not create a live stream. Supply a real playback URL.')
            media_file = candidate.resolve()
            media_url = '/media/sample' + (candidate.suffix or '.bin')
        else:
            parsed = urlsplit(args.media)
            if parsed.scheme not in ('http', 'https', 'ws', 'wss', 'webrtc') or not parsed.netloc or parsed.username is not None or parsed.password is not None:
                parser.error('--media must be an existing file or complete supported playback URL.')
            if args.scenario == 'webrtc' and '/whip' in parsed.path.lower():
                parser.error('WHIP is ingestion. Use a WHEP/playback signaling URL.')
            media_url = args.media
    else:
        media_file = ASSETS / 'common' / 'demo.mp4'
        media_url = '/media/sample.mp4'
    base = args.sdk_base or '/sdk/'
    build = {'audio_leveling':'None', 'auto_play': False, 'ignore_audio': False, 'width': '100%', 'height': 360}
    if args.with_sr: build['super_resolution'] = {'enabled':False, 'level':'light', 'targetKey':None, 'input_color':args.sr_input_color, 'model_manifest_uri':'/sdk/models/sr/model.json'}
    if args.core != 'auto': build['core'] = args.core
    if args.format_type: build['format_type'] = args.format_type
    if args.scenario == 'vr360':
        build.update(projection='erp360', vr={'mouse_control': True, 'touch_control': True})
    config = {'sdkBase': base, 'sdkUrl': base + 'h265web.js', 'mediaUrl': media_url.replace('/media/', '/demo-media/', 1) if args.framework == 'nuxt' and media_file else media_url,
              'isLive': args.scenario in ('live', 'webrtc'), 'build': build, 'features':{'superResolution':args.with_sr}}
    if args.with_sr and args.sr_input_color == 'sdr': config['srVerifiedMediaUrl'] = config['mediaUrl']
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.h265web-demo-', dir=output.parent))
    try:
        shutil.copytree(ASSETS / 'common', stage / 'common', ignore=shutil.ignore_patterns('demo.mp4', 'serve.py', 'nuxt-media-range.js', '.gitignore', '__pycache__', '*.pyc'))
        shutil.copy2(ASSETS / 'common' / 'serve.py', stage / 'serve.py')
        write(stage, 'demo-config.js', 'export const demoConfig = ' + json.dumps(config, ensure_ascii=False, indent=2) + ';\n')
        public = stage if args.framework == 'vanilla' else stage / 'public'
        hashes = {}
        if sdk_dir:
            (public / 'sdk').mkdir(parents=True)
            for name in SDK_FILES:
                shutil.copy2(sdk_dir / name, public / 'sdk' / name)
                hashes[name] = hashlib.sha256((sdk_dir / name).read_bytes()).hexdigest()
        if models_dir:
            for name in ['model.json', manifest['weights'], 'ANIME4K-LICENSE.txt', 'WEBSR-LICENSE.txt', 'README.md']:
                target = public / 'sdk/models/sr' / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(models_dir / name, target)
                hashes['models/sr/' + name] = hashlib.sha256(target.read_bytes()).hexdigest()
        if media_file:
            target = public / media_url.lstrip('/')
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(media_file, target)
        write(stage, 'sdk-assets.json', json.dumps({'sdkBase': base, 'sha256': hashes}, indent=2) + '\n')
        write(stage, 'README.md', '# h265web.js 播放示例\n\n' +
              ('运行 `python3 serve.py`，打开终端显示的本地 URL。\n' if args.framework == 'vanilla' else
               '使用 Node >=24.15，运行 `npm install`、`npm run dev`，打开终端显示的本地 URL。\n') +
              '\nSDK/媒体配置在 demo-config.js，实际复制资源哈希在 sdk-assets.json。默认音量为零，点击播放后可自行调节。\n\n' +
              '音量均衡与超分默认关闭，使用可键盘操作的滑块开关；播放前可预设、播放中可切换。' +
              ('超分默认升一档（light），可选自动或 SDK 当前有效尺寸；选档不自动开启。' if args.with_sr else
               '本示例未附加超分模型；重新生成时显式使用 --with-sr 才包含模型与超分控件。') +
              '请求开启不等于实际生效，查看实际状态/旁路原因；暂停或首帧前需新画面评估。' +
              '暂停时开关均衡或调音量维持暂停；需要解锁时使用明确的“播放并激活音频”按钮。\n\n' +
              '任意新媒体地址默认未知色彩。确认 SDR 后可暂存声明，点击“应用并重新加载”才应用；' +
              '点播从头开始、直播重新连接。渲染器要求重建时同样需要显式点击，保留用户音量/静音和增强首选项。' +
              '旧 SDK 缺少增强 API 时禁用对应控件，继续普通播放。\n')
        dependencies, dev = {}, {}
        root_tag = '<app-root></app-root>' if args.framework == 'angular' else '<div id="app"></div>'
        entry = 'src/main.jsx' if args.framework == 'react' else 'src/main.js'
        html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>h265web.js 播放示例</title></head><body>'
        if args.framework == 'vanilla':
            write(stage, 'index.html', html + '<link rel="stylesheet" href="common/player.css"><main><h1>h265web.js 播放示例</h1><div id="app"></div></main><script type="module" src="main.js"></script></body></html>')
            write(stage, 'main.js', "import {createDemo} from './common/h265web-demo.js';\nimport {demoConfig} from './demo-config.js';\nconst demo = createDemo(document.getElementById('app'), demoConfig);\nwindow.addEventListener('pagehide', () => { void demo.destroy().catch(error => console.error(error.message)); }, {once:true});\n")
        elif args.framework in ('react', 'vue', 'svelte', 'angular'):
            shutil.copytree(ASSETS / args.framework, stage / 'src')
            write(stage, 'index.html', html + root_tag + f'<script type="module" src="/{entry}"></script></body></html>')
            dev['vite'] = VERSIONS['vite']
            plugins = []
            imports = "import {defineConfig} from 'vite';\n"
            if args.framework in ('react', 'vue', 'svelte'):
                plugin = {'react': '@vitejs/plugin-react', 'vue': '@vitejs/plugin-vue', 'svelte': '@sveltejs/vite-plugin-svelte'}[args.framework]
                dev[plugin] = VERSIONS[plugin]
                imports += (f"import plugin from '{plugin}';\n" if args.framework != 'svelte' else f"import {{svelte as plugin}} from '{plugin}';\n")
                plugins = ['plugin()']
            names = {'react': ['react', 'react-dom'], 'vue': ['vue'], 'svelte': ['svelte'],
                     'angular': ['@angular/core', '@angular/compiler', '@angular/common', '@angular/platform-browser', 'zone.js', 'rxjs']}[args.framework]
            dependencies = {name: VERSIONS[name] for name in names}
            write(stage, 'vite.config.js', imports + 'export default defineConfig({plugins:[' + ','.join(plugins) + '],server:{host:"127.0.0.1",headers:' + json.dumps(HEADERS) + '}});\n')
        elif args.framework == 'next':
            dependencies = {name: VERSIONS[name] for name in ['next', 'react', 'react-dom']}
            write(stage, 'components/Player.jsx', "'use client';\n" + (ASSETS / 'react' / 'Player.jsx').read_text())
            write(stage, 'app/page.jsx', "import Player from '../components/Player.jsx';\nexport default function Page(){return <main><h1>h265web.js 播放示例</h1><Player/></main>;}\n")
            write(stage, 'app/layout.jsx', "import '../common/player.css';\nexport default function Layout({children}){return <html lang=\"zh-CN\"><body>{children}</body></html>;}\n")
            headers = [{'key': key, 'value': value} for key, value in HEADERS.items()]
            write(stage, 'next.config.mjs', 'export default {async headers(){return [{source:"/:path*",headers:' + json.dumps(headers) + '}];}};\n')
        else:
            dependencies = {name: VERSIONS[name] for name in ['nuxt', 'vue']}
            write(stage, 'server/middleware/media-range.js', (ASSETS / 'common' / 'nuxt-media-range.js').read_text())
            component = (ASSETS / 'vue' / 'Player.vue').read_text().replace('../common/', '../../common/').replace('../demo-config.js', '../../demo-config.js')
            write(stage, 'app/components/Player.client.vue', component)
            write(stage, 'app/app.vue', '<script setup>\nimport "../common/player.css";\n</script>\n<template><main><h1>h265web.js 播放示例</h1><ClientOnly><Player/><template #fallback><p>正在准备播放器…</p></template></ClientOnly></main></template>\n')
            write(stage, 'nuxt.config.mjs', 'export default defineNuxtConfig({devtools:{enabled:false},routeRules:{"/**":{headers:' + json.dumps(HEADERS) + '}}});\n')
        if args.framework != 'vanilla':
            scripts = {'dev': 'vite', 'build': 'vite build', 'preview': 'vite preview --host 127.0.0.1'}
            if args.framework == 'next': scripts = {'dev': 'next dev --webpack', 'build': 'next build --webpack', 'start': 'next start'}
            if args.framework == 'nuxt': scripts = {'dev': 'nuxt dev --host 127.0.0.1', 'build': 'nuxt build', 'start': 'node .output/server/index.mjs'}
            write(stage, 'package.json', json.dumps({'name': 'h265web-demo', 'version': '0.0.0', 'private': True, 'type': 'module', 'scripts': scripts,
                  'engines': {'node': '>=24.15.0'}, 'dependencies': dependencies, 'devDependencies': dev}, indent=2) + '\n')
        # Check again before atomic publication: an independently created output must survive.
        if output.exists() or output.is_symlink(): parser.error('Output appeared during generation; refusing to overwrite it.')
        stage.rename(output)
    finally:
        if stage.exists(): shutil.rmtree(stage)
    print(f'Created: {output}')
    print('Edit demo-config.js to change SDK/media/config. Initial playback stays muted.')
    print('Run from that directory: ' + ('python3 serve.py' if args.framework == 'vanilla' else 'npm install, then npm run dev (Node >=24.15)'))


if __name__ == '__main__':
    main()
