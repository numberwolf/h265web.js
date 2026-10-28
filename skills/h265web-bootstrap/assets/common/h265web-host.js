// Application adapter for the public SDK. This module is safe to import during SSR.
const SDK_STATE = Symbol.for('h265web.bootstrap.sdk-loader.v1');
const hostQueues = new WeakMap();
const unsafeHosts = new WeakMap();
let nextId = 0;

function browser() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('播放器只能在浏览器挂载后创建。');
  }
  return window;
}

export function loadSDK(input, timeoutMs = 20000) {
  const scope = browser();
  const url = new URL(input, document.baseURI).href;
  if (!['http:', 'https:'].includes(new URL(url).protocol)) {
    return Promise.reject(new Error('请通过 HTTP(S) 提供 SDK。'));
  }
  let state = scope[SDK_STATE];
  if (state && state.url !== url) {
    return Promise.reject(new Error('本页已使用另一份 SDK。请统一版本后重新加载页面。'));
  }
  if (state?.promise) return state.promise;
  if (typeof scope.H265webjsPlayer === 'function') {
    const existing = [...document.scripts].some(script => script.src === url);
    if (!state && !existing) {
      return Promise.reject(new Error('已有播放器工厂，但无法确认 SDK 来源。请统一脚本地址。'));
    }
    scope[SDK_STATE] = {url, promise: Promise.resolve(scope.H265webjsPlayer)};
    return scope[SDK_STATE].promise;
  }
  state ||= {url, promise: null};
  scope[SDK_STATE] = state;
  const script = document.createElement('script');
  script.src = url;
  script.async = true;
  state.promise = new Promise((resolve, reject) => {
    let done = false;
    const finish = error => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) {
        script.remove();
        state.promise = null; // Same URL can be retried; another SDK cannot race this one.
        reject(error);
      } else resolve(scope.H265webjsPlayer);
    };
    const timer = setTimeout(() => finish(new Error('SDK 加载超时，请检查网络和资源地址。')), timeoutMs);
    script.onerror = () => finish(new Error('SDK 脚本加载失败，请查看 Network。'));
    script.onload = () => finish(typeof scope.H265webjsPlayer === 'function' ? null :
      new Error('脚本已响应，但没有播放器工厂，请检查版本和响应内容。'));
    document.head.appendChild(script);
  });
  return state.promise;
}

function serial(container, work) {
  const previous = hostQueues.get(container) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => {
    if (unsafeHosts.has(container)) throw unsafeHosts.get(container);
    return work();
  });
  hostQueues.set(container, next.catch(() => {}));
  return next;
}

function releasePlayer(player, container, timeoutMs) {
  if (!player) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let done = false;
    const complete = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const fail = error => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      // Do not call a timeout a successful release or let a new player reuse its DOM.
      unsafeHosts.set(container, error);
      reject(error);
    };
    const timer = setTimeout(() => fail(new Error('播放器未确认释放，此容器暂停复用。')), timeoutMs);
    try { player.release(complete); } catch (error) { fail(error); }
  });
}

function number(value, minimum, maximum, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${name} 参数无效。`);
  }
  return value;
}

export function createPlayerHost(container, options) {
  browser();
  if (!container || container.ownerDocument !== document) throw new Error('播放器容器不存在。');
  if (!container.id) container.id = `h265web-host-${++nextId}`;
  if (document.getElementById(container.id) !== container ||
      [...document.querySelectorAll('[id]')].filter(el => el.id === container.id).length !== 1) {
    throw new Error('播放器容器 id 必须唯一。');
  }
  const base = new URL(options.resourceBase, document.baseURI);
  if (!base.pathname.endsWith('/')) throw new Error('SDK 目录地址必须以 / 结尾。');
  const callbacks = options.callbacks || {};
  const allowedCallbacks = new Set(['video_probe_callback', 'on_ready_show_done_callback', 'on_error_callback',
    'on_play_time', 'on_play_finished', 'on_cache_process_callback', 'on_load_caching_callback',
    'on_finish_cache_callback', 'on_seek_start_callback', 'on_seek_done_callback', 'on_release_done_callback',
    'on_open_fullscreen', 'on_close_fullscreen', 'video_nalu_callback', 'video_frame_callback',
    'audio_frame_callback', 'video_render_callback', 'audio_render_callback', 'video_sei_raw_callback',
    'video_sei_text_callback', 'gpu_info_callback', 'av_sync_callback', 'nalu_length_callback',
    'tex_length_callback', 'request_pkt_callback', 'on_super_resolution_state']);
  for (const [name, value] of Object.entries(callbacks)) {
    if (!allowedCallbacks.has(name) || typeof value !== 'function') {
      throw new TypeError(`不支持的回调：${name}`);
    }
  }
  let player = null, observer = null, closed = false, epoch = 0, disposeTask = null;
  let ready = false, info = null, voice = options.voice ?? 0, playbackRate = options.playbackRate ?? 1, playRequested = false;
  number(voice, 0, 1, '音量'); number(playbackRate, .25, 4, '倍速');
  let leveling = options.config?.audio_leveling ?? 'None';
  let srRequest = {...options.config?.super_resolution}, lastMedia = null, featureTimer = null;
  let support = {audioLeveling: null, superResolution: null}, audioState = null, srState = null;
  const listeners = new Set();
  const copy = value => value == null ? null : JSON.parse(JSON.stringify(value));
  const featureSnapshot = () => ({
    audioLeveling: {supported: support.audioLeveling, requested: leveling, state: copy(audioState)},
    superResolution: {supported: support.superResolution, requested: copy(srRequest), state: copy(srState)}
  });
  const publish = () => {
    if (closed) return;
    for (const listener of listeners) { try { listener(featureSnapshot()); } catch { /* UI subscriber only. */ } }
  };
  const sample = () => {
    if (!player || closed) return;
    try { if (support.audioLeveling) audioState = copy(player.get_audio_leveling_state()); } catch { audioState = null; }
    try { if (support.superResolution) srState = copy(player.get_super_resolution_state()); } catch { srState = null; }
    publish();
  };
  const stopFeatures = () => { if (featureTimer !== null) clearInterval(featureTimer); featureTimer = null; };
  const pollFeatures = () => {
    stopFeatures();
    // Audio has no public change callback. Read its public state only while requested.
    if (!closed && support.audioLeveling && leveling !== 'None') featureTimer = setInterval(sample, 500);
  };
  const emit = (state, detail = null) => {
    if (closed) return;
    try { options.onStatus?.({state, detail}); } catch { /* Consumer UI cannot break SDK cleanup. */ }
  };
  const disconnect = () => { observer?.disconnect(); observer = null; stopFeatures(); };
  const current = (candidate, generation) => !closed && player === candidate && generation === epoch;
  const invoke = (name, ...args) => {
    if (closed || !player) return false;
    if (typeof player[name] !== 'function') throw new Error(`当前 SDK 不支持 ${name}。`);
    return player[name](...args);
  };
  const api = {
    setSource(source, config = {}) {
      if (closed) return Promise.reject(new Error('播放器已经关闭。'));
      if (typeof source !== 'string' || !source.trim()) return Promise.reject(new Error('请提供媒体地址。'));
      const media = new URL(source, options.mediaBase || document.baseURI).href;
      if (!['http:', 'https:', 'ws:', 'wss:', 'webrtc:', 'blob:'].includes(new URL(media).protocol)) {
        return Promise.reject(new Error('不支持此媒体地址协议。'));
      }
      const generation = ++epoch;
      stopFeatures(); audioState = srState = null; support = {audioLeveling:null, superResolution:null}; publish();
      emit('loading');
      return serial(container, async () => {
        disconnect();
        const previous = player;
        player = null; ready = false; info = null;
        await releasePlayer(previous, container, options.releaseTimeoutMs || 10000);
        if (closed || generation !== epoch) return {superseded: true};
        const factory = await loadSDK(options.sdkUrl, options.loadTimeoutMs || 20000);
        if (closed || generation !== epoch) return {superseded: true};
        if (!container.isConnected || container.getBoundingClientRect().width <= 0) {
          throw new Error('播放器容器尚未显示，请在挂载并显示后加载。');
        }
        const candidate = factory();
        player = candidate;
        support = {
          audioLeveling: !!factory.AudioLeveling && ['None','StableVolume'].every(k => typeof factory.AudioLeveling[k] === 'string') &&
            typeof candidate.set_audio_leveling === 'function' && typeof candidate.get_audio_leveling_state === 'function',
          superResolution: typeof candidate.set_super_resolution === 'function' && typeof candidate.get_super_resolution_state === 'function'
        };
        const consume = (name, args) => {
          if (!current(candidate, generation)) return;
          try { callbacks[name]?.(...args); } catch (error) { emit('callback-error', error); }
        };
        for (const [name, callback] of Object.entries(callbacks)) {
          if (name === 'on_super_resolution_state' && !support.superResolution) continue;
          candidate[name] = (...args) => consume(name, args);
        }
        candidate.video_probe_callback = data => {
          if (!current(candidate, generation)) return;
          info = {...data};
          candidate.set_voice(voice);
          consume('video_probe_callback', [data]); sample();
        };
        candidate.on_ready_show_done_callback = () => {
          if (!current(candidate, generation)) return;
          ready = true;
          candidate.set_voice(voice);
          if (playbackRate !== 1) candidate.set_playback_rate(playbackRate);
          sample(); emit('ready');
          consume('on_ready_show_done_callback', []);
          if (current(candidate, generation) && playRequested) candidate.play();
        };
        candidate.on_error_callback = error => {
          if (!current(candidate, generation)) return;
          emit(error?.domain === 'vr' && error?.fatal === false ? 'display-fallback' : 'error', error);
          consume('on_error_callback', [error]);
        };
        if (support.superResolution) candidate.on_super_resolution_state = state => {
          if (!current(candidate, generation)) return;
          srState = copy(state); publish(); consume('on_super_resolution_state', [state]);
        };
        const settings = {...options.config, ...config,
          player_id: container.id, base_url: base.href,
          wasm_js_uri: new URL('h265web_wasm.js', base).href,
          wasm_wasm_uri: new URL('h265web_wasm.wasm', base).href};
        if (support.audioLeveling) settings.audio_leveling = config.audio_leveling ?? leveling;
        else delete settings.audio_leveling;
        if (support.superResolution) {
          settings.super_resolution = {...srRequest, ...config.super_resolution};
          if (lastMedia && lastMedia !== media) {
            settings.super_resolution.input_color = config.super_resolution?.input_color ?? 'unknown';
            settings.super_resolution.targetKey = config.super_resolution?.targetKey ?? null;
          }
        } else delete settings.super_resolution;
        delete settings.media_uri; // setSource is the sole source operation for this wrapper.
        settings.width ??= '100%'; settings.height ??= 360;
        settings.auto_play ??= false; settings.ignore_audio ??= false;
        try {
          if (settings.super_resolution?.model_manifest_uri) settings.super_resolution.model_manifest_uri =
            new URL(settings.super_resolution.model_manifest_uri, options.modelBase || document.baseURI).href;
          if (!candidate.build(settings)) throw new Error('播放器创建失败，请检查容器和运行资源。');
          if (!current(candidate, generation)) return {superseded: true};
          candidate.set_voice(voice);
          if (support.audioLeveling) leveling = settings.audio_leveling;
          if (support.superResolution) srRequest = {...settings.super_resolution};
          lastMedia = media;
          sample(); pollFeatures();
          if (!current(candidate, generation)) return {superseded: true};
          if (candidate.load_media(media) === false) throw new Error('媒体地址未被播放器接受。');
          if (!current(candidate, generation)) return {superseded: true};
          if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => {
              if (!current(candidate, generation)) return;
              const width = Math.round(container.parentElement?.getBoundingClientRect().width || 0);
              const height = Number(settings.height);
              if (width > 0 && height > 0) { candidate.resize(width, height); sample(); }
            });
            observer.observe(container.parentElement || container);
          }
          emit('accepted');
          return {accepted: true};
        } catch (error) {
          disconnect();
          if (player === candidate) { player = null; audioState = srState = null; publish(); }
          await releasePlayer(candidate, container, options.releaseTimeoutMs || 10000);
          throw error;
        }
      }).catch(error => { if (generation === epoch) emit('error', error); throw error; });
    },
    play() {
      playRequested = true;
      if (typeof player?.notify_user_gesture === 'function') invoke('notify_user_gesture');
      const result = invoke('play');
      emit('play-requested'); sample();
      return result;
    },
    pause() { playRequested = false; const result = invoke('pause'); sample(); return result; },
    activateAudio() {
      // Some RTC software routes treat a gesture as play. This is an explicit
      // playback action; background observations and setters never unlock it.
      if (closed) return false;
      return api.play();
    },
    setVoice(value) {
      voice = number(value, 0, 1, '音量');
      // A built-in SDK pause may bypass host intent; volume never implies play.
      const result = invoke('set_voice', voice); sample(); return result;
    },
    seek(value) { return invoke('seek', number(value, 0, Infinity, '跳转')); },
    setRate(value) { playbackRate = number(value, 0.25, 4, '倍速'); return invoke('set_playback_rate', playbackRate); },
    screenshot(imageId) { return invoke('screenshot', imageId); },
    fullscreen() { return invoke('fullScreen'); },
    projection(mode) { const result = invoke('set_projection', mode); sample(); return result; },
    view(view) { return invoke('set_vr_view', view); },
    rotate(delta) { return invoke('rotate_vr_view', delta); },
    resetView() { return invoke('reset_vr_view'); },
    vrControls(value) { return invoke('set_vr_controls', value); },
    subscribeEnhancements(listener) {
      if (typeof listener !== 'function') throw new TypeError('状态订阅必须是函数。');
      if (closed) return () => {};
      listeners.add(listener); listener(featureSnapshot());
      return () => listeners.delete(listener);
    },
    setAudioLeveling(strategy) {
      if (closed || !['None', 'StableVolume'].includes(strategy) || support.audioLeveling === false) return false;
      // Presets can arrive before the loader/build or while a source is being replaced.
      if (!player || support.audioLeveling === null) { leveling = strategy; publish(); return true; }
      const accepted = player.set_audio_leveling(strategy);
      if (accepted) { leveling = strategy; pollFeatures(); }
      sample(); return accepted;
    },
    setSuperResolution(value) {
      if (closed || support.superResolution === false) return false;
      const patch = typeof value === 'boolean' ? {enabled:value} : value;
      if (!patch || typeof patch !== 'object' || Array.isArray(patch) || !Object.keys(patch).length ||
          Object.keys(patch).some(key => !['enabled','level','targetKey'].includes(key)) ||
          ('enabled' in patch && typeof patch.enabled !== 'boolean') ||
          ('level' in patch && !['light','standard'].includes(patch.level)) ||
          ('targetKey' in patch && patch.targetKey !== null &&
            (typeof patch.targetKey !== 'string' || !/^\d+x\d+@(1\.25|1\.5|2)$/.test(patch.targetKey)))) return false;
      if (!player || support.superResolution === null) { srRequest = {...srRequest,...patch}; publish(); return true; }
      const accepted = player.set_super_resolution(value);
      if (accepted) srRequest = {...srRequest, ...patch};
      sample(); return accepted;
    },
    snapshot() { return {ready, info: info ? {...info} : null, closed, voice, playbackRate, playRequested, mediaUrl:lastMedia, enhancements:featureSnapshot()}; },
    hlsInfo() { return player && typeof player.hlsInfo === 'function' ? player.hlsInfo() : null; },
    dispose() {
      if (disposeTask) return disposeTask;
      closed = true; epoch++; disconnect(); listeners.clear(); audioState = srState = null;
      disposeTask = serial(container, async () => {
        const previous = player;
        player = null; ready = false;
        await releasePlayer(previous, container, options.releaseTimeoutMs || 10000);
      });
      return disposeTask;
    }
  };
  return api;
}
