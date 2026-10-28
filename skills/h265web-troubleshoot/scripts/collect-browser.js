// Paste into browser DevTools. No network fetches, player commands or private SDK state.
(() => {
  if (window.h265webDiagnostics?.diagnosticVersion === 1) window.h265webDiagnostics.stop();
  else if (window.h265webDiagnostics) throw new Error('Diagnostic name already in use.');
  const started = performance.now(), events = [], timings = {}, frames = new Map(), restorers = [], observed = new WeakMap(), players = new Map();
  let nextPlayer = 0;
  let stopped = false, probe = null;
  const safeURL = value => {
    try {
      const url = new URL(value, document.baseURI);
      url.username = url.password = '';
      for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, '[redacted]');
      if (url.hash) url.hash = '[redacted]';
      if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)) url.hostname = 'local.invalid';
      return url.href;
    } catch { return '[invalid URL]'; }
  };
  const text = value => String(value).slice(0, 4000)
    .replace(/(?:https?|wss?|webrtc):\/\/[^\s<>"'`]+/g, safeURL)
    .replace(/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, '[auth redacted]')
    .replace(/\b(token|password|secret|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\b(?:127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b/g, '[private IP]')
    .replace(/^.*(?:a=candidate:|a=ice-(?:pwd|ufrag):|c=IN IP[46]|v=0).*$/gm, '[private signaling redacted]');
  const append = (kind, detail) => {
    if (stopped) return;
    events.push({atMs: Math.round(performance.now() - started), kind, detail});
    if (events.length > 200) events.shift();
  };
  const select = (source, keys) => {
    const result = {};
    for (const key of keys) if (source?.[key] !== undefined) {
      const value = source[key];
      if (value === null || ['number', 'boolean'].includes(typeof value)) result[key] = value;
      else if (typeof value === 'string') result[key] = text(value);
    }
    return result;
  };
  const srInfo = state => {
    if (!state) return null;
    const result = select(state, ['status','requestedEnabled','effectiveBackend','reason','targetKey','requestedTargetKey',
      'modelId','modelHash','srRevision','generation','attachmentId','inputDescriptorRevision','lastEnhancedTime','experimental']);
    for (const key of ['source','output']) result[key] = state[key] ? select(state[key], ['width','height','displayWidth','displayHeight','format','inputColor']) : null;
    result.options = (Array.isArray(state.options) ? state.options : []).slice(0,2).map(option => select(option, ['width','height','scale','targetKey','experimental']));
    result.metrics = state.metrics ? select(state.metrics, ['gpuP95Ms','budgetMs','coverage','samples']) : null;
    return result;
  };
  const readFeature = (player, name, filter) => {
    if (typeof player[name] !== 'function') return {available:false,state:'unknown',reason:'api-unavailable'};
    try { return {available:true,state:filter(player[name]())}; }
    catch { return {available:true,state:'unknown',reason:'state-read-failed'}; }
  };
  const errorInfo = error => typeof error === 'object' && error !== null
    ? select(error, ['message', 'stack', 'type', 'code', 'status', 'domain', 'stage', 'fatal', 'fallback'])
    : {message: text(error)};
  const mark = name => {
    if (stopped) return;
    const key = text(name).slice(0, 64);
    if (Object.keys(timings).length < 40 || key in timings) timings[key] = Math.round(performance.now() - started);
  };
  const watchVideos = () => {
    if (stopped) return;
    for (const [video, state] of frames) if (!video.isConnected) {
      if (state.callback !== null) video.cancelVideoFrameCallback?.(state.callback);
      frames.delete(video);
    }
    for (const video of document.querySelectorAll('video')) {
      if (frames.has(video) || typeof video.requestVideoFrameCallback !== 'function') continue;
      const state = {presented: 0, mediaTimeSeconds: null, firstFrameAtMs: null, callback: null};
      frames.set(video, state);
      const record = (_now, metadata) => {
        if (stopped || !video.isConnected) return;
        state.presented++; state.mediaTimeSeconds = metadata.mediaTime;
        state.firstFrameAtMs ??= Math.round(performance.now() - started);
        state.callback = video.requestVideoFrameCallback(record);
      };
      state.callback = video.requestVideoFrameCallback(record);
    }
  };
  const onError = event => append('page-error', errorInfo(event.error || event.message));
  const onReject = event => append('unhandled-rejection', errorInfo(event.reason));
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onReject);
  const api = {
    diagnosticVersion: 1,
    mark,
    observe(player) {
      if (stopped || !player) throw new Error('Provide an existing public player while collection is active.');
      if (observed.has(player)) return observed.get(player);
      const registrations = [];
      const observerId = ++nextPlayer; players.set(observerId, player);
      let attached = true;
      for (const name of ['video_probe_callback', 'on_ready_show_done_callback', 'on_error_callback', 'on_play_time', 'on_super_resolution_state']) {
        const previous = player[name];
        if (name === 'on_super_resolution_state' && typeof previous !== 'function') continue;
        const wrapper = function (...args) {
          if (!stopped && attached) {
            if (name === 'video_probe_callback') {
              probe = select(args[0], ['wantedCore', 'selectedCore', 'videoCore', 'audioCore', 'audioState', 'audioFallbackReason',
                'hasAudio', 'duration', 'w', 'h', 'fps', 'sampleRate', 'channel']);
              mark('probe'); append('probe', probe);
            } else if (name === 'on_super_resolution_state') append('super-resolution-state', {observerId,...srInfo(args[0])});
            else if (name === 'on_ready_show_done_callback') { mark('ready'); append('ready', {}); }
            else if (name === 'on_error_callback') append('sdk-error', errorInfo(args[0]));
            else if (typeof args[0] === 'number') { /* Public seconds; avoid collecting every frame. */
              if (!events.length || performance.now() - started - events.at(-1).atMs > 500) append('progress-seconds', args[0]);
            }
          }
          try { return typeof previous === 'function' ? previous.apply(this, args) : undefined; }
          finally { watchVideos(); }
        };
        player[name] = wrapper;
        registrations.push(() => { if (player[name] === wrapper) player[name] = previous; });
      }
      let detached = false;
      const detach = () => { if (!detached) { detached = true; attached = false; players.delete(observerId); for (const restore of registrations.reverse()) restore(); observed.delete(player); } };
      observed.set(player, detach);
      restorers.push(detach); watchVideos(); return detach;
    },
    snapshot() {
      watchVideos();
      return {
        sdkSource: [...document.scripts].map(script => script.src).filter(url => /h265web(?:\.min)?\.js(?:[?#]|$)/.test(url)).map(safeURL),
        assetHashes: 'unknown', browserOS: {userAgent: navigator.userAgent, platform: navigator.platform},
        environment: {secureContext: window.isSecureContext, crossOriginIsolated: window.crossOriginIsolated,
          sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined', wasm: typeof WebAssembly !== 'undefined',
          videoDecoder: typeof VideoDecoder !== 'undefined', mse: typeof MediaSource !== 'undefined'},
        wantedCore: probe?.wantedCore ?? 'unknown', selectedCore: probe?.selectedCore ?? probe?.videoCore ?? 'unknown',
        audioLeveling: [...players].map(([observerId, player]) => ({observerId,
          ...readFeature(player, 'get_audio_leveling_state', state => select(state, ['strategy','status','active','reason','audioOutput','gainDb','latencyMs','algorithm']))})),
        superResolution: [...players].map(([observerId, player]) => ({observerId,
          ...readFeature(player, 'get_super_resolution_state', srInfo)})),
        mediaSummary: probe || 'unknown', stageTimings: {...timings}, events: events.map(event => ({...event})),
        nativeMedia: [...document.querySelectorAll('video')].map(video => ({source: safeURL(video.currentSrc || video.src),
          currentTimeSeconds: video.currentTime, durationSeconds: Number.isFinite(video.duration) ? video.duration : 'unknown',
          width: video.videoWidth, height: video.videoHeight, paused: video.paused, muted: video.muted, volume: video.volume,
          readyState: video.readyState, decodedFrames: video.getVideoPlaybackQuality?.().totalVideoFrames ?? 'unknown',
          framesPresentedObserved: frames.get(video)?.presented ?? 'unknown',
          firstFrameAtMs: frames.get(video)?.firstFrameAtMs ?? 'unknown',
          audioDecodedBytes: video.webkitAudioDecodedByteCount ?? 'unknown'})),
        canvases: [...document.querySelectorAll('canvas')].map(canvas => ({width: canvas.width, height: canvas.height, actualFrames: 'unknown'})),
        unknowns: ['API presence is not codec support.', 'Canvas/progress is not presented-frame or A/V sync proof.',
          'Collection began at installation; missing earlier events are not reconstructed.', 'Review path/prose privacy before sharing.']
      };
    },
    stop() {
      if (stopped) return;
      stopped = true;
      window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onReject);
      for (const restore of restorers.reverse()) restore();
      for (const [video, state] of frames) if (state.callback !== null) video.cancelVideoFrameCallback?.(state.callback);
      frames.clear(); players.clear(); restorers.length = 0;
    }
  };
  window.h265webDiagnostics = api;
})();
