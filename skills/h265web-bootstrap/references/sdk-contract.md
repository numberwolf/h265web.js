# SDK contract and version boundary

Local API compatibility baseline: 2026-10-17 (unpublished), with actual-playback follow-up on 2026-10-19 and no host/API changes. The capability matrix retains the dated baseline hashes; those are not the identity of a current browser response. Inspect actual loaded asset bytes/version and matching runtime files. Sealed `732e1735318752f7a22c84df28d6dd42a3717ab5` remains supported for ordinary playback; it has no audio-leveling/SR API. CDN may still be sealed.

## Initialization and URLs

Browser script → `window.H265webjsPlayer()` → bind callbacks → `build(config)` → `load_media(url)`. SDK code must not evaluate on the server. `build` returns boolean; load acceptance does not prove readiness or actual presented frames. Ready does not mean playing. Audio-only RTC can be ready without video.

```js
const player = window.H265webjsPlayer();
player.video_probe_callback = info => console.log('probe', info);
player.on_ready_show_done_callback = () => { /* enable controls */ };
player.on_error_callback = error => { /* inspect actual error shape */ };
const sdkBase = new URL('/sdk/', window.location.href).href;
if (player.build({player_id: 'unique-host', base_url: sdkBase,
  wasm_js_uri: new URL('h265web_wasm.js', sdkBase).href,
  wasm_wasm_uri: new URL('h265web_wasm.wasm', sdkBase).href,
  width: 640, height: 360, auto_play: false, ignore_audio: false})) {
  player.set_voice(0);
  player.load_media(new URL('/media/video.mp4', window.location.href).href);
}
```

Three matching runtime files, no current ext/legacy route. Blob Worker factories import the WASM glue; do not invent separate worker filenames. Auto can defer WASM until needed; absence of a WASM request is not necessarily an error. Explicit software cores prepare it earlier.

`base_url` resolves SDK **and media**. Give media an independently resolved absolute URL. A base of `https://cdn.example/sdk/` and media `./media/a.mp4` would target the CDN's `/sdk/media/a.mp4`. Unknown URL suffix defaults cannot prove container; confirmed opaque WebM uses `format_type:'webm'`.

Config: `player_id`, `wasm_js_uri`, `wasm_wasm_uri`, `base_url`, `width/height`, `color`, `auto_play`, `ignore_audio`, `core`, `hls_strategy`, `format_type`, `media_uri`, `projection`, `vr`. Auto omits core; values are `mse_hevc`, `webcodec_hevc`, `wasm_hevc`, `webrtc`. HLS `auto`/`mainline` only. Optional `media_uri` loads from build; do not also load a second time unintentionally.

## Controls

| API | Meaning / limitations |
| --- | --- |
| `play()`, `pause()` | Results vary by core; not a universal Promise. Audible play needs user gesture. |
| `notify_user_gesture()` | Present in this snapshot. Feature-check older builds; do not defer gesture until after network await. |
| `set_voice(volume)`, `set_mute()` | Reversible mute; use 0..1. `ignore_audio:true` removes the audio path and needs rebuild to restore. |
| `seek(seconds)` | Rejects invalid/out-of-range live seek; software HLS constrained by downloaded range. Completion callback alone does not prove target presentation. |
| `set_playback_rate(rate)` | Route-specific; native RTC live fixed 1x. |
| `resize(width,height)` | Positive visible dimensions. Percent config is initially measured, not continuous responsiveness. |
| `screenshot(imgId)` | Writes an existing unique image target. No uniform returned URL/Promise; Worker output may be async and CORS readability matters. |
| `fullScreen()`, `closeFullScreen()` | Gesture/permission; flat may use video/canvas, ERP/RTC use container. |
| `next_frame()` | Software render step; native currentTime+1/fps approximation; RTC rejects it. |
| `release(callback)` | Completion after core/Worker cleanup, sometimes synchronous. Awaiting its return does not universally wait. |
| `change_media(url)`, `rebuild(reload)` | Preserve only part of config/VR. Auto-play, volume/rate and cross-format hints are not full business-state persistence. |
| `stop()` | Ordinary non-RTC currently returns false; not general cleanup. |
| `hlsInfo()` | HLS route/window/cache snapshot; null outside HLS, not universal getCore. |
| `get_nalu_len()`, `get_tex_len()`, `gpu_memory_info()` | Suitable core and callbacks required. GPU info is texture-size capability, not VRAM total. |

## Callbacks, actual core and time

Start with probe/ready/error. Business-only callbacks include `on_play_time`, `on_play_finished`, cache/loading, seek, release/fullscreen. Probe may contain `wantedCore`, `selectedCore`, `videoCore`, `audioCore`, `audioState`, `audioFallbackReason`, dimensions/fps/duration. Missing information remains unknown. HLS route log is available via `hlsInfo()` where supported.

For a freeze or playback acceptance check, correlate the actual selected core, media time, presented frames and changing visible pixels from a source expected to change. Advancing progress or decoded-frame counters alone cannot establish healthy picture output. An HLS `mse_hls` route is distinct from native HLS; requested core/configuration names are not evidence of the active route.

Public play time, duration and seek targets use **seconds**. Frame/NAL/render/SEI and cache timestamps commonly use **milliseconds**, per callback; counts/lengths are not time. RTC encoded transport has its own unit contract. Do not alter media clocks or multiply arbitrary fields.

On MP4/FLV/TS/HLS, low-level NAL/frame/render/audio/GPU/queue/A-V callbacks require compatible software routes. `av_sync_callback` requires WebCodec there. SEI excludes incompatible native routes. Native RTC adapter can report meaningful render events but cannot fabricate raw NAL/YUV/SEI. Binding every callback changes the experiment. Non-HLS H.264 TS with software-only callbacks can report `CALLBACK_CONTRACT_H264_TS_UNSUPPORTED`.

## Routes and errors

MP4 Auto first tries compatible native video; native/software paths differ. WebM is native-only in this build, `WEBM_NATIVE_UNSUPPORTED` when incompatible, no VP8/VP9 software fallback. FLV/TS MSE uses the bundled mpegts adapter. HEVC TS has a WASM forcing condition before the generic software route; explicit core preference is not actual-core proof.

HLS candidates: native/MSE/WebCodec/WASM filtered by support and callback contract, bounded attempts. After first frame, only active native HLS terminal media errors 3/4 unlock recovery. JS source-session supports TS segments, rejects fMP4/encryption/byterange/LL-HLS/alternate audio-subtitle etc. Native HLS capability is separate; success there does not prove JS fallback support.

WHEP, `webrtc://` and ZLM private playback API identify RTC; default native. Encoded fallback requires an explicit compatible server `h265web-rtc-encoded/v1` protocol, not ordinary ZLM native RTC. HEVC WASM encoded requires Main 8bit/I420/Annex-B and parameter sets. Live RTC 1x/no seek; AV/video-only/audio-only follow actual negotiation.

Ordinary demux HTTP errors may be `{type:'http-transport',code,status,message}`. 4xx except 408/429 terminate; consecutive transient failures have a bound (successful responses reset counters). Other cores differ. Status 0 can be CORS or network failure. Error shapes are not uniform.

VR: `projection:'flat'|'erp360'`, actual mono ERP source, view APIs `set_projection`, `set_vr_view`, `rotate_vr_view`, `get_vr_view`, `reset_vr_view`, `set_vr_controls`. Setters accept requests, not proof of rendered ERP. Getter reflects requested state; nonfatal VR error (`domain:'vr',fatal:false,fallback:'flat'`) signals degraded display. Preserve media route/clock; don't rebuild on VR errors.

## Lifecycle and support evidence

Invalidate late callbacks, loader/auth work at unmount. Wait for release completion before reusing DOM (including StrictMode). Rebuild from full business config for changed formats/protocols/audio policy; old SDK objects retain callbacks. SDK API presence, metadata probes, native MSE support checks and historical README claims are not real-sample verification.

When diagnosing seek/resume, distinguish pause→resume at the prior position, immediate seek, natural-end replay and explicit seek from the end. Observe the real target frame; when playback with audio is intended, also verify new audio output after target presentation. A paused seek should remain paused. Callbacks can synchronously call `release` or `change_media`; later work must still belong to the current application session. Keep integration fixes on public APIs and lifecycle handling; SDK seek/audio alignment repairs do not belong in host clock or queue patches.

These skills do not add SDK APIs. Current builds provide audio leveling and experimental WebGL2 super resolution; read [enhancements](enhancements.md) for None/off defaults, actual state, source/color/model gates and explicit renderer recreation. Sealed builds disable those optional controls. DASH/DRM/subtitle switching are separate capabilities; container/codec claims still require route-specific validation.

Public references: [API](https://h265web.com/markdown-docs/api-docs.php), [中文 API](https://h265web.com/markdown-docs/zh/api-docs.php), [SDK repository](https://github.com/numberwolf/h265web.js). Sources inspected in development: `js/ylplayer.js`, `av-common.js`, `callback-contract.js`, HLS/RTC/VR modules, demux Worker and `cpp/mp4_probe_gate.h`. These references are not mandatory local dependencies of an installed skill.
