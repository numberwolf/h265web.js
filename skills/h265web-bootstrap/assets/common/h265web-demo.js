import {createPlayerHost} from './h265web-host.js';
let nextDemo = 0;

// Optional demo UI. The framework owns the root; this widget owns its child section.
export function createDemo(root, config) {
  const session = config.sessionState || {};
  const identity = url => new URL(url, document.baseURI).href;
  const initialMedia = identity(config.mediaUrl);
  const sameSource = session.srMedia === initialMedia;
  const savedSR = {...session.superResolution};
  if (!sameSource) savedSR.targetKey = null;
  const verifiedColor = config.srVerifiedMediaUrl && identity(config.srVerifiedMediaUrl) === initialMedia &&
    config.build?.super_resolution?.input_color === 'sdr' ? 'sdr' : 'unknown';
  const build = {...config.build, audio_leveling: session.audioLeveling ?? config.build?.audio_leveling ?? 'None',
    super_resolution: {enabled:false, level:'light', targetKey:null, ...config.build?.super_resolution, ...savedSR,
      input_color:sameSource ? session.srAppliedColor || 'unknown' : verifiedColor}};
  let appliedMedia = initialMedia, stagedMedia = initialMedia, appliedColor = build.super_resolution.input_color, loadEpoch = 0;
  let cachedChoices = [], choicesContext = null, blockedChoicesVersion = null;
  const section = document.createElement('section');
  section.className = 'player-demo';
  section.innerHTML = `<label>媒体地址 <input data-role="source" type="url"></label>
    <button data-action="load">加载</button><div class="player-stage"><div data-role="host"></div></div>
    <p data-role="status" role="status">准备加载…</p><p data-role="time">0.0 秒</p>
    <div class="controls"><button data-action="play" disabled>播放</button>
    <button data-action="pause">暂停</button><button data-action="sound">打开声音</button>
    <button data-action="mute">静音</button><label>音量 <input data-role="volume" type="range" min="0" max="1" step="0.05" value="0"></label><button data-action="seek" disabled>跳到中间</button>
    <button data-action="rate" disabled>切换 1× / 2×</button><button data-action="capture">截图</button>
    <button data-action="fullscreen">全屏</button><button data-action="close">关闭播放器</button></div>
    <fieldset class="enhancements"><legend>可选播放增强</legend>
    <label class="enhancement-switch"><span>音量均衡</span><span class="switch-control"><input data-role="leveling" type="checkbox" role="switch" aria-label="音量均衡"><span class="switch-track" aria-hidden="true"></span></span></label>
    <p>播放前可预设，播放中可随时开关；音量和静音由你控制。</p>
    <p data-role="leveling-state" role="status" aria-live="polite">默认关闭。</p><button data-action="audio-activate" hidden>播放并激活音频</button>
    <div data-role="sr-controls"><label class="enhancement-switch"><span>超分 · 实验性</span><span class="switch-control"><input data-role="sr" type="checkbox" role="switch" aria-label="超分 · 实验性"><span class="switch-track" aria-hidden="true"></span></span></label>
    <p>开启默认升一档。支持运行时开关；首帧前或暂停时，需要新画面来评估效果。</p>
    <label>增强档位 <select data-role="sr-target"><option value="step">升一档（默认）</option><option value="">自动</option></select></label>
    <label>片源色彩 <select data-role="sr-color"><option value="unknown">未知 / HDR · 保持原画</option><option value="sdr">我确认片源是 SDR</option></select></label>
    <p data-role="sr-state" role="status" aria-live="polite">默认关闭；未知色彩仅旁路。</p><p data-role="sr-next"></p>
    <button data-action="sr-rebuild" hidden>应用并重新加载</button>
    <p data-role="sr-reload-note" hidden>重新加载会让点播从头开始、直播重新接入；自动播放关闭时，再点播放。</p>
    </div></fieldset>
    <label><input data-role="erp" type="checkbox">360° 模式（仅用于真实全景片源）</label>
    <div class="controls"><button data-action="left">向左看</button><button data-action="right">向右看</button>
    <button data-action="reset">重置视角</button></div><img data-role="capture" alt="播放截图">`;
  root.appendChild(section);
  const find = role => section.querySelector(`[data-role="${role}"]`);
  const action = name => section.querySelector(`[data-action="${name}"]`);
  const image = find('capture'); image.id = `h265web-capture-${++nextDemo}`;
  find('source').value = config.mediaUrl;
  find('volume').value = String(session.voice ?? 0);
  find('sr-controls').hidden = !config.features?.superResolution;
  find('sr-color').value = appliedColor;
  for (const name of ['leveling','sr']) {
    find(name+'-state').id = image.id+'-'+name+'-state';
    find(name).setAttribute('aria-describedby', find(name+'-state').id);
  }
  find('erp').checked = config.build?.projection === 'erp360';
  let alive = true, rate = session.playbackRate ?? 1, progressAt = 0;
  const show = text => { if (alive) find('status').textContent = text; };
  const host = createPlayerHost(find('host'), {
    sdkUrl: config.sdkUrl, resourceBase: config.sdkBase, config: build, voice: session.voice ?? 0, playbackRate: session.playbackRate ?? 1,
    onStatus(event) {
      if (!alive) return;
      section.dataset.state = event.state;
      if (event.state === 'loading') {
        section.dataset.ready = 'false'; action('play').disabled = true;
        action('seek').disabled = action('rate').disabled = true;
        show('正在加载…');
      } else if (event.state === 'accepted') {
        action('play').disabled = false;
        show(host.snapshot().ready ? '首帧已就绪，点击播放。' : '加载请求已接受，可以点击播放。');
      } else if (event.state === 'ready') {
        section.dataset.ready = 'true'; action('play').disabled = false;
        const info = host.snapshot().info;
        const vod = !config.isLive && Number(info?.duration) > 0;
        action('seek').disabled = action('rate').disabled = !vod;
        show('首帧已就绪，点击播放。');
      } else if (event.state === 'display-fallback') show('360°显示不可用，继续普通画面。');
      else if (event.state === 'error') show(`播放失败：${event.detail?.message || event.detail?.code || '请查看控制台与网络'}`);
      else if (event.state === 'play-requested') show('已请求播放；若未出画，请检查媒体与自动播放策略。');
    },
    callbacks: {
      on_play_time(seconds) {
        if (!alive || performance.now() - progressAt < 150) return;
        progressAt = performance.now();
        find('time').textContent = `${Number(seconds).toFixed(1)} 秒`;
        section.dataset.time = String(seconds);
      },
      on_play_finished() { show('播放结束，可以再次播放。'); },
      on_seek_done_callback() { show('跳转完成。'); }
    }
  });
  const remember = () => {
    const snapshot = host.snapshot();
    session.voice = snapshot.voice; session.playbackRate = snapshot.playbackRate;
    session.audioLeveling = snapshot.enhancements.audioLeveling.requested;
    const requested = snapshot.enhancements.superResolution.requested;
    session.superResolution = {enabled: requested?.enabled === true, level: requested?.level || 'light', targetKey:requested?.targetKey ?? null};
    session.srMedia = appliedMedia; session.srAppliedColor = appliedColor;
  };
  const reasons = {
    'input-color-unknown':'片源尚未确认为 SDR', 'no-frame':'等待新画面；暂停时请点播放',
    'evaluating':'等待新画面评估', 'no-source':'等待加载视频',
    'renderer-recreate-required':'当前渲染器需要重新加载才能开启超分',
    'display-no-upscale':'当前窗口没有可用的更高档位，可放大播放器后再试',
    'target-unavailable':'所选尺寸不可用，请选升一档或自动',
    'performance-evaluating':'正在评估 GPU 性能', 'performance-budget':'设备性能预算不足，保持原画',
    'input-descriptor-unsupported':'片源色彩或像素格式不支持',
    'input-color-unsupported':'片源不符合 SDR 增强要求', 'source-range-unsupported':'源尺寸不在增强范围',
    'projection-unsupported':'全景模式使用原画', 'source-cors':'片源不允许读取画面',
    'context-suspended':'等待手势激活音频处理', 'audio-unavailable':'没有可用音轨',
    'audio-disabled':'配置关闭了音频', 'audio-worklet-unavailable':'浏览器不支持所需音频处理'
  };
  const explain = reason => reasons[reason] || reason || '无额外原因';
  const unsubscribe = host.subscribeEnhancements(features => {
    if (!alive) return;
    const audio = features.audioLeveling, sr = features.superResolution;
    const snapshot = host.snapshot(), state = sr.state;
    find('leveling').disabled = audio.supported === false;
    find('leveling').checked = audio.requested === 'StableVolume';
    const audioLabels = {disabled:'原声 · 均衡关闭', pending:'已请求 · 等待音轨或音频激活', active:'正在均衡音量', unavailable:'未生效 · 继续原声'};
    find('leveling-state').textContent = audio.supported === false ? '当前 SDK 无稳定音量接口；普通声音保持。' :
      !audio.state ? (audio.requested === 'StableVolume' ? '已预设 · 播放后应用。' : '默认关闭；播放前或播放中可开启。') :
      `${audioLabels[audio.state.status] || audio.state.status}；${explain(audio.state.reason)}`;
    action('audio-activate').hidden = audio.state?.status !== 'pending' || audio.requested !== 'StableVolume';
    find('sr').disabled = sr.supported === false;
    find('sr').checked = sr.requested?.enabled === true;
    const labels = {off:'原画 · 超分关闭', loading:'开启中 · 加载模型', warming:'评估中', active:'超分已生效', bypass:'未生效 · 保持原画', released:'已释放'};
    const waiting = sr.requested?.enabled && (!snapshot.ready || !snapshot.playRequested);
    find('sr-state').textContent = sr.supported === false ? '当前 SDK 无超分接口；继续普通播放。' :
      !state ? (sr.requested?.enabled ? '已预设 · 有新画面后按所选档位尝试增强。' : '默认关闭；可随时请求开启。') :
      `${waiting ? '已请求 · 等待播放的新画面评估' : labels[state.status] || state.status}；实际 ${state.status}；${explain(state.reason)}；` +
      `输入 ${state.source ? JSON.stringify(state.source) : '未知'}；输出 ${state.output ? JSON.stringify(state.output) : '无'}（实验性）`;
    const select = find('sr-target'), reportedChoices = state?.options || [];
    const bounds = find('host').getBoundingClientRect?.() || {};
    const video = find('host').querySelector('video');
    const panorama = find('erp').checked || state?.reason === 'projection-unsupported';
    const width = video?.videoWidth || snapshot.info?.width || snapshot.info?.w || state?.source?.width;
    const height = video?.videoHeight || snapshot.info?.height || snapshot.info?.h || state?.source?.height;
    const context = {media:snapshot.mediaUrl, panorama,
      viewport:JSON.stringify([Math.round(bounds.width || 0), Math.round(bounds.height || 0)]),
      source:width > 0 && height > 0 ? `${width}x${height}` : null};
    const reportVersion = JSON.stringify([state?.generation, state?.attachmentId,
      state?.srRevision, state?.inputDescriptorRevision]);
    if (!state || sr.supported !== true || !context.media) {
      cachedChoices = []; choicesContext = null; blockedChoicesVersion = null;
    } else {
      if (!choicesContext || context.media !== choicesContext.media) {
        cachedChoices = []; blockedChoicesVersion = null;
      } else if (context.viewport !== choicesContext.viewport || context.panorama !== choicesContext.panorama ||
          context.source && choicesContext.source && context.source !== choicesContext.source) {
        cachedChoices = []; blockedChoicesVersion = reportVersion;
      }
      if (panorama || state.status === 'bypass' && !reportedChoices.length && state.reason !== 'performance-budget') {
        cachedChoices = []; blockedChoicesVersion = reportVersion;
      }
      // A getter may still expose a report from before resize. Do not attach
      // that report to the new context; wait for a new SDK revision instead.
      if (reportedChoices.length && !panorama && reportVersion !== blockedChoicesVersion) {
        cachedChoices = reportedChoices.map(choice => ({...choice})); blockedChoicesVersion = null;
      }
      context.source ||= choicesContext?.source || null;
      choicesContext = context;
    }
    // Off clears SDK state, not the user's known size choices. Never synthesize
    // targets or carry this menu across source/viewport changes.
    const choices = panorama ? [] : reportedChoices.length ? reportedChoices : state?.status === 'off' ? cachedChoices : [];
    const selected = sr.requested?.targetKey || (sr.requested?.level === 'standard' ? '' : 'step');
    const key = JSON.stringify([choices, context, selected]);
    if (select.dataset.options !== key) {
      select.replaceChildren(new Option('升一档（默认）', 'step'), new Option('自动', ''));
      for (const choice of choices) select.add(new Option(`${choice.width}×${choice.height}（${choice.scale}×）`, choice.targetKey));
      select.dataset.options = key;
    }
    if (selected && selected !== 'step' && ![...select.options].some(option => option.value === selected)) {
      const unavailable = new Option(`${selected}（当前不可用）`, selected); unavailable.disabled = true; select.add(unavailable);
    }
    select.value = selected; select.disabled = sr.supported === false;
    find('sr-color').disabled = sr.supported === false;
    const pendingColor = stagedMedia !== appliedMedia || find('sr-color').value !== appliedColor;
    const recreate = sr.requested?.enabled && state?.reason === 'renderer-recreate-required';
    action('sr-rebuild').hidden = sr.supported === false || !(pendingColor || recreate);
    find('sr-reload-note').hidden = action('sr-rebuild').hidden;
    find('sr-next').textContent = pendingColor ? '色彩修改待应用。点击“应用并重新加载”后生效；当前播放暂用原设置。' :
      recreate ? '当前渲染器需要显式重新加载；此操作保留音量、静音和首选项。' :
      find('sr-color').value === 'unknown' ? '确认片源是 SDR 后再声明；任意新地址默认未知，不从分辨率推断。' :
      '升一档选择 SDK 实际最低可用增强档位；自动交由 SDK 选档。选档不会自动开启超分。';
    section.dataset.audioState = audio.state?.status || 'unknown';
    section.dataset.srState = state?.status || 'unknown';
    remember();
  });
  const attempt = operation => {
    try {
      const result = operation();
      remember();
      if (result && typeof result.catch === 'function') result.catch(error => show(error.message));
      else if (result === false || result === -1) show('当前播放路径不接受此操作。');
    } catch (error) { show(error.message); }
  };
  const loadSource = async (applyColor = false) => {
    const media = identity(find('source').value), generation = ++loadEpoch;
    const changed = media !== appliedMedia;
    const color = applyColor && stagedMedia === media ? find('sr-color').value : changed ? 'unknown' : appliedColor;
    const result = await host.setSource(media, {
      projection: find('erp').checked ? 'erp360' : 'flat',
      vr: {mouse_control:find('erp').checked, touch_control:find('erp').checked},
      super_resolution: {input_color:color, ...(changed ? {targetKey:null} : {})}
    });
    if (alive && generation === loadEpoch && result?.accepted) {
      appliedMedia = media; appliedColor = color; remember();
      // Publish the now-applied creation setting without changing SDK state.
      refreshColor();
    }
    return result;
  };
  const refreshColor = () => {
    const sr = host.snapshot().enhancements.superResolution;
    const pendingColor = stagedMedia !== appliedMedia || find('sr-color').value !== appliedColor;
    const reload = pendingColor || sr.requested?.enabled && sr.state?.reason === 'renderer-recreate-required';
    action('sr-rebuild').hidden = sr.supported === false || !reload;
    find('sr-reload-note').hidden = action('sr-rebuild').hidden;
    find('sr-next').textContent = pendingColor ? '媒体或色彩修改待应用。点击“应用并重新加载”后生效；当前播放暂用原设置。' :
      reload ? '当前渲染器需要显式重新加载。' : '色彩设置已应用；选档不自动开启超分。';
  };
  action('load').onclick = () => attempt(() => loadSource());
  action('play').onclick = () => attempt(() => host.play());
  action('pause').onclick = () => attempt(() => host.pause());
  action('sound').onclick = () => attempt(() => { find('volume').value = '1'; return host.setVoice(1); });
  action('mute').onclick = () => attempt(() => { find('volume').value = '0'; return host.setVoice(0); });
  find('volume').oninput = () => attempt(() => host.setVoice(Number(find('volume').value)));
  find('leveling').onchange = () => attempt(() => host.setAudioLeveling(find('leveling').checked ? 'StableVolume' : 'None'));
  find('sr').onchange = () => attempt(() => host.setSuperResolution({enabled:find('sr').checked, level:host.snapshot().enhancements.superResolution.requested?.level || 'light', targetKey:host.snapshot().enhancements.superResolution.requested?.targetKey ?? null}));
  find('sr-target').onchange = () => attempt(() => {
    const choice = find('sr-target').value;
    return host.setSuperResolution({enabled:host.snapshot().enhancements.superResolution.requested?.enabled === true, level:choice === 'step' ? 'light' : 'standard', targetKey:choice && choice !== 'step' ? choice : null});
  });
  find('source').oninput = () => {
    try {
      const media = identity(find('source').value);
      if (media !== stagedMedia) { stagedMedia = media; find('sr-color').value = 'unknown'; }
      refreshColor();
    } catch { /* An incomplete URL is not a source declaration. */ }
  };
  find('sr-color').onchange = () => { stagedMedia = identity(find('source').value); refreshColor(); };
  action('audio-activate').onclick = () => attempt(() => host.activateAudio());
  // This button is the explicit user-approved renderer creation boundary.
  action('sr-rebuild').onclick = () => attempt(() => loadSource(true));
  action('seek').onclick = () => attempt(() => host.seek(Number(host.snapshot().info.duration) / 2));
  action('rate').onclick = () => attempt(() => host.setRate(rate = rate === 1 ? 2 : 1));
  action('capture').onclick = () => attempt(() => host.screenshot(image.id));
  action('fullscreen').onclick = () => attempt(() => host.fullscreen());
  const stopControls = message => {
    for (const control of section.querySelectorAll('button,input,select')) control.disabled = true;
    find('leveling-state').textContent = find('sr-state').textContent = message;
    section.dataset.audioState = section.dataset.srState = 'closed';
    action('sr-rebuild').hidden = true;
  };
  action('close').onclick = () => attempt(async () => {
    remember(); unsubscribe(); stopControls('正在关闭，旧处理状态已清除。'); await host.dispose();
    section.dataset.closed = 'true'; show('播放器已关闭；重新挂载组件可再次创建。');
    stopControls('播放器已关闭，处理状态已清除。');
  });
  find('erp').onchange = () => attempt(() => {
    const enabled = find('erp').checked;
    host.projection(enabled ? 'erp360' : 'flat');
    host.vrControls({mouse: enabled, touch: enabled});
  });
  action('left').onclick = () => attempt(() => host.rotate({yaw: -30}));
  action('right').onclick = () => attempt(() => host.rotate({yaw: 30}));
  action('reset').onclick = () => attempt(() => host.resetView());
  // Do not add frame/render/SEI callbacks just to make this UI appear alive.
  attempt(() => host.setSource(config.mediaUrl));
  let destroyed = null;
  return {
    host,
    destroy() {
      if (destroyed) return destroyed;
      remember(); unsubscribe(); stopControls('正在释放，旧处理状态已清除。');
      alive = false;
      for (const button of section.querySelectorAll('button')) button.onclick = null;
      find('erp').onchange = null; find('volume').oninput = null;
      find('source').oninput = null;
      find('leveling').onchange = find('sr').onchange = find('sr-target').onchange = find('sr-color').onchange = null;
      destroyed = host.dispose().then(() => section.remove());
      return destroyed;
    }
  };
}
