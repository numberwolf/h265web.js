---
name: h265web-bootstrap
description: Create runnable h265web.js demos and integrate the player into browser frontend projects, including framework lifecycle, SDK resources, and playback controls.
---

# H265web Bootstrap

Turn the user's video or live-stream requirement into a working browser integration. Use the user's language. Start from their task, not a request to pick an internal core.

## Choose the work

- **Existing app:** inspect framework/version, package manager, asset base, SSR boundary, components and existing SDK first. Integrate incrementally; do not scaffold over an existing app or upgrade its framework to fit a template.
- **New demo:** run `scripts/scaffold.py --help`, resolve this skill's actual directory, and generate into a new directory. Supply matching SDK assets or an explicit SDK base. A local VOD sample is included; live/RTC/VR require the corresponding real source.
- **Failing integration:** inspect existing evidence and [troubleshooting entry](references/troubleshooting-entry.md), fix the concrete issue, then finish the requested integration. Another skill need not be installed.

Always read [SDK contract](references/sdk-contract.md). Consult [capability matrix](references/capability-matrix.json) for relevant format/feature/core constraints. Source-confirmed behavior and verified templates are different; conditional rows are not browser compatibility promises.

## Read only the relevant guide

| Request | Reference |
| --- | --- |
| Plain HTML/JS/TS | [Vanilla](references/vanilla.md) |
| React | [React](references/react.md) |
| Vue 3 / Vue 2 | [Vue](references/vue.md) |
| Next / Nuxt / SSR | [SSR](references/ssr.md) and framework guide |
| Angular / Svelte / other browser frameworks | [Frameworks](references/frameworks.md) |
| URLs, hosting, workers | [Deployment](references/deployment.md) |
| VOD, FLV/TS/HLS, raw HEVC, codecs | [Media routes](references/media-routes.md) |
| WHEP / ZLM / encoded RTC | [WebRTC](references/webrtc.md) |
| ERP360, SEI, snapshots, stepping, fullscreen | [Feature controls](references/features.md) |
| Tokens, opaque recordings, modal/multiple players | [Authenticated sessions](references/auth-sessions.md) |

For stable volume or super resolution, read [enhancements](references/enhancements.md). Default None/off; actual status differs from request acceptance. Old SDK must keep ordinary playback.

## Preserve these invariants

1. SDK is a browser script exposing `H265webjsPlayer()`, not an assumed npm export. Bind callbacks before `build(config)` and `load_media(url)`. Check acceptance; acceptance is not media readiness/playing success.
2. Match `h265web.js`, `h265web_wasm.js`, `h265web_wasm.wasm`. Mainline has no legacy/ext route. Inspect actual loaded version, not just repository source.
3. Resolve media and SDK URLs separately: `base_url` affects media too. Never route page-relative media to the SDK CDN accidentally.
4. Default Auto/flat, retained audio, volume zero and visible play button; respect explicit choices. `ignore_audio` removes audio, not reversible mute. Live needs an existing stream.
5. Invalidate late script/auth/callback work. Release before reusing DOM and preserve full business configuration when rebuilding. `release(callback)` is not a universal Promise. Framework cleanup does not await a returned Promise automatically.
6. Bind only needed callbacks. Low-level frame/NAL/render/GPU/A-V callbacks can change core eligibility. Generated components must not access `_native_core`/Worker private state.
7. Public progress/duration/seek are seconds; low-level timestamps commonly milliseconds. Wrappers do not replace media clocks.
8. Nonfatal VR failure may preserve flat playback. Do not restart media or loop retries because ERP rendering failed.

`assets/common/h265web-host.js` is an optional **application wrapper**, not SDK API. Copy it with the selected component or preserve these invariants in the app's own architecture.

## Validate and deliver

- Build/type-check with app tools, then verify actual resources and presented frames, play/pause, relevant seek/rate, unmount and recreate. Releasing one player must leave others running. Exercise StrictMode/KeepAlive where applicable.
- Browser automation stays muted. Verify audio observations without speaker output. Do not start production streams or change server settings just to pass a demo.
- Record actual selected core. Fallback success is not requested-core success. API existence/build acceptance does not prove playback.
- Deliver file locations, startup command/URL, replacement media/SDK inputs, controls/lifecycle, verification and specific remaining limits. Do not invent a playback pass.
- Do not commit, publish, deploy, update CDN or send reports unless requested.
