# `h265web.js PRO` How To Use

> Offline quick guide for real integration work. This file summarizes the official docs so you can still build and use the player even if the website is unavailable.

## What This Guide Covers

This guide focuses on the practical public browser SDK flow:

1. Prepare the runtime files
2. Create the player container
3. Build the player
4. Bind the minimum required callbacks
5. Load media
6. Play, pause, seek, resize, screenshot, fullscreen, and switch media

If you only need one page to get started quickly, read this file first.

## 1. Runtime Files You Need

For normal browser playback, keep these files together:

- `h265web.js`
- `h265web_wasm.js`
- `h265web_wasm.wasm`
- `extjs.js`
- `extwasm.js`

A common local layout looks like this:

```text
root/
├── index.html
├── index.js
├── resource/
│   └── demo.mp4
└── output/
    ├── h265web.js
    ├── h265web_wasm.js
    ├── h265web_wasm.wasm
    ├── extjs.js
    └── extwasm.js
```

## 2. Path Rules

Both SDK resource paths and media URLs support:

- Full URL: `https://example.com/output/h265web_wasm.js`
- Site-absolute path: `/output/h265web_wasm.js`
- Relative path: `./output/h265web_wasm.js`

If the four SDK runtime files are in the same directory, use `base_url` and keep the file names short.

## 3. Minimal HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>h265web.js PRO Demo</title>
    <script src="./output/h265web.js"></script>
  </head>
  <body>
    <div id="canvas111"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

## 4. Minimal Working Flow

This is the recommended public integration flow:

1. Create the player object
2. Bind callbacks
3. Call `build(config)`
4. Call `load_media(mediaUrl)`
5. Let `auto_play` start playback, or call `play()` after the first frame is ready

## 5. Minimal Working Example

```js
const ylplayer = H265webjsPlayer();

ylplayer.on_ready_show_done_callback = function () {
  console.log('first frame ready');
};

ylplayer.video_probe_callback = function (mediaInfo) {
  console.log('media info', mediaInfo);
};

ylplayer.build({
  player_id: 'canvas111',
  base_url: './output/',
  wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm',
  ext_src_js_uri: 'extjs.js',
  ext_wasm_js_uri: 'extwasm.js',
  width: '100%',
  height: 480,
  color: '#101318',
  auto_play: true,
  readframe_multi_times: -1,
  ignore_audio: false
});

ylplayer.load_media('./resource/demo.mp4');
```

## 6. The Two Callbacks You Should Always Wire First

These are the minimum callbacks you should wire before doing anything else.

### `on_ready_show_done_callback`

Fires when the first frame is ready and visible.

```js
ylplayer.on_ready_show_done_callback = function () {
  console.log('on_ready_show_done_callback');
};
```

### `video_probe_callback(mediaInfo)`

Fires when media probing finishes and basic stream info becomes available.

```js
ylplayer.video_probe_callback = function (mediaInfo) {
  console.log('video_probe_callback', mediaInfo);
};
```

## 7. Useful Additional Callbacks

Use these when you need progress, cache state, seek state, or finish state.

```js
ylplayer.on_cache_process_callback = function (timestamp) {
  console.log('on_cache_process_callback', timestamp);
};

ylplayer.on_load_caching_callback = function () {
  console.log('on_load_caching_callback');
};

ylplayer.on_finish_cache_callback = function (data) {
  console.log('on_finish_cache_callback', data);
};

ylplayer.on_play_time = function (pts) {
  console.log('on_play_time', pts);
};

ylplayer.on_play_finished = function () {
  console.log('on_play_finished');
};

ylplayer.on_seek_start_callback = function (seekTarget) {
  console.log('on_seek_start_callback', seekTarget);
};

ylplayer.on_seek_done_callback = function (seekTarget) {
  console.log('on_seek_done_callback', seekTarget);
};
```

If your stream carries extra SEI metadata, wire feature callbacks like this.

```js
ylplayer.video_sei_raw_callback = function (rawSei, pts, dts, codec) {
  console.log('video_sei_raw_callback', rawSei, pts, dts, codec);
};

ylplayer.video_sei_text_callback = function (text, pts, dts, codec) {
  console.log('video_sei_text_callback', text, pts, dts, codec);
};
```

## 8. Build Config Reference

### Common fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `player_id` | `string` | Yes | Container element id |
| `wasm_js_uri` | `string` | Yes | Path to `h265web_wasm.js` |
| `wasm_wasm_uri` | `string` | Yes | Path to `h265web_wasm.wasm` |
| `ext_src_js_uri` | `string` | No | Path to `extjs.js` |
| `ext_wasm_js_uri` | `string` | No | Path to `extwasm.js` |
| `base_url` | `string` | No | Shared base path for the four SDK runtime files |
| `width` | `number \| string` | No | Player width |
| `height` | `number \| string` | No | Player height |
| `color` | `string` | No | Player background color |
| `auto_play` | `boolean` | No | Auto start playback after media is ready |
| `readframe_multi_times` | `number` | No | Demux read scale |
| `ignore_audio` | `boolean` | No | Ignore audio track |
| `core` | `string` | No | Explicit core: `mse_hevc`, `wasm_hevc`, `webcodec_hevc` |
| `hls_strategy` | `string` | No | HLS route policy: `auto` (default), `mainline`, or `legacy` |
| `projection` | `'flat' \| 'erp360'` | No | Presentation only; default `flat`, available in the local Job5 build |
| `vr` | `object` | No | Optional ERP view `{yaw, pitch, fov, mouse_control, touch_control}` in the local Job5 build |
| `media_uri` | `string` | No | Optional media URL, but public usage still recommends `build()` then `load_media()` |

### HLS route policy

| Configuration | Result |
|---|---|
| Omitted | Uses `auto`; tries compatible mainline candidates only and never loads `past-core/ext*` |
| `hls_strategy: 'auto'` | Selects a compatible mainline route from browser capabilities, the requested `core`, and bound callbacks; never loads `past-core/ext*` |
| `hls_strategy: 'mainline'` | Uses mainline candidates only; never loads `past-core/ext*` |
| `hls_legacy_fallback: true` only | No effect. This deprecated option no longer enables an automatic legacy fallback |
| `hls_strategy: 'legacy'` | Directly uses the historical `past-core/ext*` HLS core; no mainline candidate is attempted |

Use `legacy` only when you intentionally need the historical core. `ext_src_js_uri` and `ext_wasm_js_uri` are only used by that explicit legacy route. If all mainline candidates fail under `auto` or `mainline`, the player reports an HLS route error instead of silently switching to `ext*`.

### VR360 Video Playback (local Job5 build)

The default is flat playback. To view a **monoscopic equirectangular** source (normally a 2:1 visible raster), explicitly set `projection: 'erp360'` and optionally `vr: {yaw: 0, pitch: 0, fov: 75, mouse_control: true, touch_control: true}` in `build(config)`. The existing `load_media()` URL and selected decode core do not change. Runtime view APIs are `set_projection('flat' | 'erp360')`, `set_vr_view({yaw, pitch, fov})`, `rotate_vr_view({yaw, pitch, fov})`, `get_vr_view()`, `reset_vr_view()` and `set_vr_controls({mouse, touch})`. All angles are degrees; `fov` is vertical. Enable ERP only for an ERP source, not for an ordinary flat video. For cross-origin native video, the media server must allow texture-readable CORS. Explicit HLS `legacy` remains flat. The public CDN build may not yet contain Job5; check that the API exists before calling it. Full details: [site API Docs](https://h265web.com/markdown-docs/api-docs.php).

### Recommended public usage

Even though `media_uri` exists, the clean public usage is still:

```js
ylplayer.build(config);
ylplayer.load_media(mediaUrl);
```

That keeps player creation and media loading separate, and it matches the current docs and demos.

## 9. Core Methods You Will Use Most Often

### Load and release

```js
ylplayer.load_media('./resource/demo.mp4');
ylplayer.change_media('./resource/another-demo.mp4');
ylplayer.release();
```

### Playback control

```js
ylplayer.play();
ylplayer.pause();
ylplayer.seek(10);
ylplayer.set_playback_rate(2.0);
ylplayer.set_voice(0.5);
ylplayer.set_mute();
```

### Player utilities

```js
ylplayer.next_frame();
ylplayer.resize(640, 480);
ylplayer.fullScreen();
ylplayer.closeFullScreen();
ylplayer.screenshot('screenshot');
```

Screenshot example:

```html
<img id="screenshot" style="width:400px;height:340px;background:#e9e9e9;" />
```

## 10. Core Selection

If you want to force a specific playback path, use `core`.

```js
ylplayer.build({
  player_id: 'canvas111',
  base_url: './output/',
  wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm',
  ext_src_js_uri: 'extjs.js',
  ext_wasm_js_uri: 'extwasm.js',
  core: 'webcodec_hevc'
});
```

Current public core values:

- `mse_hevc`
- `wasm_hevc`
- `webcodec_hevc`

If you do not set `core`, the SDK chooses automatically.

## 11. Local Demo Example

### `index.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>h265web.js PRO Demo</title>
    <script src="./output/h265web.js"></script>
  </head>
  <body>
    <div id="canvas111"></div>
    <button id="play_btn" onclick="play()" disabled>PLAY</button>
    <button id="pause_btn" onclick="pause()" disabled>PAUSE</button>
    <button id="voice_btn" onclick="setVoice()" disabled>VOLUME</button>
    <script src="./index.js"></script>
  </body>
</html>
```

### `index.js`

```js
let ylplayer = null;
const mediaUrl = './resource/hevc_test_moov_set_head_16s.mp4';

function createPlayer(core = null) {
  if (ylplayer) {
    ylplayer.release();
    ylplayer = null;
  }

  ylplayer = H265webjsPlayer();

  ylplayer.on_ready_show_done_callback = function () {
    document.getElementById('play_btn').disabled = false;
    document.getElementById('pause_btn').disabled = false;
    document.getElementById('voice_btn').disabled = false;
  };

  ylplayer.video_probe_callback = function (mediaInfo) {
    console.log('mediaInfo', mediaInfo);
  };

  ylplayer.on_play_time = function (pts) {
    console.log('play pts', pts);
  };

  const playerConfig = {
    player_id: 'canvas111',
    base_url: './output/',
    wasm_js_uri: 'h265web_wasm.js',
    wasm_wasm_uri: 'h265web_wasm.wasm',
    ext_src_js_uri: 'extjs.js',
    ext_wasm_js_uri: 'extwasm.js',
    width: '100%',
    height: 480,
    color: '#101318',
    auto_play: true,
    readframe_multi_times: -1,
    ignore_audio: false
  };

  if (core) {
    playerConfig.core = core;
  }

  ylplayer.build(playerConfig);
}

function buildPlayer(core = null) {
  createPlayer(core);
  ylplayer.load_media(mediaUrl);
}

function play() {
  ylplayer && ylplayer.play();
}

function pause() {
  ylplayer && ylplayer.pause();
}

function setVoice() {
  ylplayer && ylplayer.set_voice(1.0);
}

window.onload = function () {
  buildPlayer();
};
```

## 12. Common Integration Notes

### Use a web server, not `file://`

Run a normal static web server:

```bash
python3 -m http.server 8080
```

### Keep resource paths consistent

The easiest pattern is:

- `base_url: './output/'`
- `wasm_js_uri: 'h265web_wasm.js'`
- `wasm_wasm_uri: 'h265web_wasm.wasm'`
- `ext_src_js_uri: 'extjs.js'`
- `ext_wasm_js_uri: 'extwasm.js'`

### Autoplay can still be blocked by the browser

Even if `auto_play: true` is set, browser policy can still restrict playback until user interaction in some cases.

If `auto_play` is `false`, `on_ready_show_done_callback` only signals an available frame; call `play()` to advance. A media file may itself have a black first frame.

### MP4 startup and HTTP Range

If MP4 startup stalls, inspect `moov`/`mdat` order with `ffprobe -v trace -i input.mp4 2>&1 | grep -E "type:'(moov|mdat)'"` and verify a `Range: bytes=0-1023` request receives `206 Partial Content`. A trailing `moov` can still play with working Range support; for faster startup, remux to a new file with `ffmpeg -i input.mp4 -map 0 -c copy -movflags +faststart output-faststart.mp4`. Also check the actual media URL and codec. See [QA WIKI](https://h265web.com/markdown-docs/qa-wiki.php) for CORS, WASM and codec diagnostics.

### Build first, then load media

For public integration and troubleshooting, keep this order:

```js
ylplayer.build(config);
ylplayer.load_media(mediaUrl);
```

### Start from the minimum callbacks

If you are debugging a new page, first confirm:

- `video_probe_callback`
- `on_ready_show_done_callback`

Only after those are correct should you continue to seek logic, cache logic, and UI logic.

## 13. Quick Checklist

- SDK files are present in `./output/`
- Page is served from a static web server
- `player_id` matches a real DOM element
- `build(config)` runs before `load_media(mediaUrl)`
- `video_probe_callback` is wired
- `on_ready_show_done_callback` is wired
- Media URL is reachable
- Browser autoplay restrictions are considered
- MP4 response and Range are checked if startup stalls; QA WIKI is consulted before changing core settings

## 14. Official Links

If the website is available, these are still the main public entry points:

- Public demo: `https://h265web.com/player.php`
- Docs: `https://h265web.com/markdown-docs/get-started.php`
- QA WIKI: `https://h265web.com/markdown-docs/qa-wiki.php`

This file exists so you still have a usable offline integration guide even when those pages are not reachable.
