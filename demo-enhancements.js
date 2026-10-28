/* Shared demo UI. Playback and enhancement decisions belong to the public SDK. */
(function (root) {
    'use strict';
    root.observeDemoPlayerSize = function (box, getPlayer) {
        const last = new WeakMap();
        function size() {
            const style = getComputedStyle(box);
            const width = Math.max(1, Math.floor(box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)));
            return {width, height:Math.round(width * 9 / 16)};
        }
        function refresh() {
            const p = getPlayer(); if (!p || typeof p.resize !== 'function' || !box.isConnected) return;
            const next = size(), previous = last.get(p);
            if (!previous || previous.width !== next.width || previous.height !== next.height) {
                last.set(p, next); p.resize(next.width, next.height);
            }
        }
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
        if (observer) observer.observe(box); else root.addEventListener('resize', refresh);
        return {size, refresh, disconnect() { if (observer) observer.disconnect(); else root.removeEventListener('resize', refresh); }};
    };
    root.createPlaybackEnhancementControls = function (panel, getPlayer, actions = {}) {
        const zh = panel.dataset.locale !== 'en';
        const t = (en, cn) => zh ? cn : en;
        panel.classList.add('demo-enhancements');
        const switchMarkup = (name, title) => `<label class="enhancement-switch"><span>${title}</span><span class="enhancement-switch-control"><input type="checkbox" role="switch" data-enhancement="${name}" aria-label="${title}"><span class="enhancement-switch-track" aria-hidden="true"></span><span data-enhancement="${name}-request" aria-hidden="true"></span></span></label>`;
        panel.innerHTML = `
            <legend>${t('Picture & sound', '画质与声音')}</legend>
            <section class="enhancement-feature">
                ${switchMarkup('audio', t('Stable volume', '音量均衡'))}
                <p class="enhancement-help">${t('Switch on or off while playing. Balances quiet and loud passages; your volume and mute stay unchanged.', '支持播放中随时开关。自动平衡忽大忽小的声音；音量和静音由你控制。')}</p>
                <output data-enhancement="audio-state" role="status" aria-live="polite"></output>
                <button type="button" class="enhancement-action" data-enhancement="audio-resume" hidden>${t('Play & activate audio', '播放并激活音频')}</button>
            </section>
            <section class="enhancement-feature">
                ${switchMarkup('sr', t('Super resolution · experimental', '超分 · 实验性'))}
                <p class="enhancement-help">${t('Starts one available step above the source. Switch while playing; a new frame is needed to evaluate the result. Some renderers require a reload.', '开启默认升一档，无需再选。可在播放中切换；需要新画面来判断效果，部分渲染器需重新加载。')}</p>
                <div class="enhancement-settings">
                    <label>${t('Quality', '增强档位')} <select data-enhancement="target"></select></label>
                    <label>${t('Source color', '片源色彩')} <select data-enhancement="color"><option value="unknown">${t('Unknown / HDR · original picture', '未知 / HDR · 保持原画')}</option><option value="sdr">${t('I confirm this source is SDR', '我确认片源是 SDR')}</option></select></label>
                </div>
                <output data-enhancement="sr-state" role="status" aria-live="polite"></output>
                <p data-enhancement="next" class="enhancement-help"></p>
                <button type="button" class="enhancement-action" data-enhancement="recreate" hidden>${t('Apply & reload', '应用并重新加载')}</button>
                <small data-enhancement="reload-note" hidden>${t('Reload restarts VOD from the beginning or reconnects live video. Then press Play if autoplay is off.', '重新加载会让点播从头开始、直播重新接入；自动播放关闭时，再点 Play。')}</small>
            </section>`;
        const field = name => panel.querySelector(`[data-enhancement="${name}"]`);
        const audio = field('audio'), sr = field('sr'), target = field('target'), color = field('color');
        color.value = panel.dataset.inputColor === 'sdr' ? 'sdr' : 'unknown';
        let requestedAudio = false, requestedSR = false, quality = 'step', requestedTarget = null;
        let appliedColor = color.value, detach = null, audioRejected = false, srRejected = false;
        let boundPlayer = null, audioRefreshTimer = null;
        function sourceKey(value) {
            if (value === undefined) value = typeof actions.getSource === 'function' ? actions.getSource() : actions.sourceInput ? actions.sourceInput.value : '';
            value = String(value || '').trim();
            if (!value) return '';
            try { return new URL(value, root.location.href).href; } catch (_) { return value; }
        }
        let confirmedSource = color.value === 'sdr' ? sourceKey() : null, builtSource = sourceKey();
        function syncSource() {
            if (color.value === 'sdr' && confirmedSource !== sourceKey()) {
                color.value = 'unknown'; confirmedSource = null;
            }
        }
        function cancelAudioRefresh() {
            if (audioRefreshTimer !== null) root.clearTimeout(audioRefreshTimer);
            audioRefreshTimer = null;
        }
        const hasAudio = p => p && typeof p.set_audio_leveling === 'function' && typeof p.get_audio_leveling_state === 'function';
        const hasSR = p => p && typeof p.set_super_resolution === 'function' && typeof p.get_super_resolution_state === 'function';
        const reasons = {
            'no-source':t('Load a video to evaluate', '等待加载视频'),
            'no-frame':t('Waiting for a new video frame; press Play if paused', '等待新画面；暂停时请点 Play'),
            'evaluating':t('Waiting for a new video frame to evaluate', '等待新画面评估效果'),
            'input-color-unknown':t('Source color has not been confirmed as SDR', '片源尚未确认为 SDR'),
            'display-no-upscale':t('No larger size fits this player. Enlarge the player to try again.', '当前窗口没有可用的更高档位，可放大播放器后再试'),
            'renderer-recreate-required':t('This renderer needs a reload to enable SR', '当前渲染器需要重新加载才能开启超分'),
            'projection-unsupported':t('Panorama uses the original picture; switch to flat to enhance', '全景模式使用原画，切回 Flat 后可再试'),
            'performance-evaluating':t('Measuring GPU performance', '正在评估 GPU 性能'),
            'target-unavailable':t('This size is unavailable. Choose One step up or Automatic.', '所选尺寸不可用，请选“升一档”或“自动”'),
            'performance-budget':t('Device performance is insufficient for this size; using the original picture', '设备性能不足以稳定增强此档位，当前使用原画'),
            'source-range-unsupported':t('Source dimensions are outside the supported range', '源分辨率不在当前超分支持范围'),
            'source-cors':t('The source does not allow pixel access', '片源不允许读取画面'),
            'input-descriptor-unsupported':t('Source color or pixel format is unsupported', '片源色彩或像素格式不支持'),
            'native-video-surface':t('Keeping native picture-in-picture or fullscreen', '保留原生画中画或全屏'),
            'audio-unavailable':t('This stream has no usable audio track', '当前流没有可用音轨'),
            'webgl2-unavailable':t('This device cannot use the required graphics renderer', '当前设备不支持所需图形渲染'),
            'input-color-unsupported':t('This source is not compatible SDR video', '片源色彩不符合当前 SDR 增强要求'),
            'input-format-unsupported':t('This pixel format cannot be enhanced', '当前像素格式不支持增强'),
            'source-path-unsupported':t('This playback output does not support enhancement', '当前播放输出路径不支持增强'),
            'audio-disabled':t('Audio is disabled in this player configuration', '播放器配置关闭了音频'),
            'audio-worklet-unavailable':t('This browser cannot run audio processing', '当前浏览器不支持所需音频处理'),
            'audio-output-unavailable':t('This audio output cannot apply leveling', '当前音频输出不支持均衡'),
            'media-origin-unavailable':t('This source does not allow audio processing', '片源权限不允许处理音频'),
            'raw-media-audio-unavailable':t('The audio track cannot be accessed', '无法接入当前音轨'),
            'raw-media-audio-pending':t('Waiting for an accessible audio track', '等待可用音轨'),
            'worklet-init-failed':t('Audio processing could not start', '音频处理初始化失败'),
            'processor-error':t('Audio processing stopped; original sound continues', '音频处理停止，继续播放原声'),
            'released':t('Released', '已释放')
        };
        const reasonLabel = reason => reasons[reason] || (/^model-/.test(reason) ? t('Model loading or validation failed; check its resources', '模型加载或校验未完成，请检查模型资源') : /^(gpu-|shader-|webgl2-|float-framebuffer)/.test(reason) ? t('Graphics processing is unavailable; keeping the original picture', '图形处理暂不可用，保留原画') : t('Reason: ', '原因：') + reason);
        function refresh() {
            syncSource();
            const p = getPlayer(), a = hasAudio(p), s = hasSR(p);
            audio.checked = requestedAudio; sr.checked = requestedSR;
            audio.disabled = !!p && !a; sr.disabled = !!p && !s;
            color.disabled = !!p && (!s || typeof actions.recreate !== 'function');
            field('audio-request').textContent = requestedAudio ? t('On', '开') : t('Off', '关');
            field('sr-request').textContent = requestedSR ? t('On', '开') : t('Off', '关');
            const audioState = a ? p.get_audio_leveling_state() : null;
            const audioOutput = field('audio-state');
            audioOutput.dataset.status = audioState && audioState.status || 'unavailable';
            audioOutput.dataset.reason = audioState && audioState.reason || '';
            const audioLabels = zh ? {disabled:'原声 · 未开启均衡', pending:'已请求 · 等待音轨或音频激活', active:'正在均衡音量', unavailable:'均衡未生效 · 继续原声'} :
                {disabled:'Original sound · off', pending:'Requested · waiting for audio or activation', active:'Volume leveling is running', unavailable:'Leveling unavailable · original sound'};
            audioOutput.textContent = audioRejected ? t('Request was not accepted. Recreate the player and retry.', '请求未接受，请重新创建播放器后再试') : !p ?
                (requestedAudio ? t('Saved · applies when playback starts', '已预设 · 播放后应用') : t('Off · you can switch on before or during playback', '已关闭 · 播放前或播放中都可开启')) : !a ? t('This SDK does not support stable volume', '当前 SDK 不支持音量均衡') :
                (audioLabels[audioState.status] || audioLabels.unavailable) + (audioState.reason ? ' · ' + reasonLabel(audioState.reason) : '');
            field('audio-resume').hidden = !(requestedAudio && audioState && audioState.status === 'pending' && typeof p.play === 'function');
            // AudioWorklet can settle while video is paused; observe only pending
            // audio UI state, never playback clocks or queues. Release cancels it.
            if (p && p === boundPlayer && panel.isConnected && requestedAudio && audioState && audioState.status === 'pending') {
                if (audioRefreshTimer === null) audioRefreshTimer = root.setTimeout(() => {
                    audioRefreshTimer = null;
                    if (getPlayer() === p && boundPlayer === p && panel.isConnected) refresh();
                }, 500);
            } else cancelAudioRefresh();
            const state = s ? p.get_super_resolution_state() : null, options = state && state.options || [];
            const signature = JSON.stringify([requestedTarget, options.map(x => [x.targetKey, x.width, x.height])]);
            if (target.dataset.signature !== signature) {
                target.textContent = '';
                target.add(new Option(t('One step up (default)', '升一档（默认）'), 'step'));
                target.add(new Option(t('Automatic', '自动'), ''));
                for (const x of options) target.add(new Option(`${x.width} × ${x.height}`, x.targetKey));
                if (requestedTarget && !options.some(x => x.targetKey === requestedTarget)) {
                    const unavailable = new Option(t('Requested size unavailable: ', '所选尺寸不可用：') + requestedTarget, requestedTarget);
                    unavailable.disabled = true; target.add(unavailable);
                }
                target.dataset.signature = signature;
            }
            target.value = quality === 'step' ? 'step' : requestedTarget || '';
            target.disabled = !!p && !s;
            const labels = zh ? {off:'原画 · 超分关闭', loading:'开启中 · 正在加载模型', warming:'评估中', active:'超分已生效', bypass:'超分未生效 · 当前原画', released:'已释放'} :
                {off:'Original picture · off', loading:'Starting · loading model', warming:'Evaluating', active:'Super resolution is active', bypass:'SR not applied · original picture', released:'Released'};
            const output = field('sr-state'); output.dataset.status = state && state.status || 'unavailable';
            output.dataset.reason = state && state.reason || '';
            output.textContent = srRejected ? t('Request was not accepted. Check the selected size or recreate the player.', '请求未接受，请检查档位或重新创建播放器') : !p ?
                (requestedSR ? t('Saved · will try one step up when frames arrive', '已预设 · 有画面后按所选档位尝试增强') : t('Off · switch on whenever you want', '已关闭 · 可随时请求开启')) : !s ? t('This SDK does not support super resolution', '当前 SDK 不支持超分') :
                (labels[state.status] || labels.bypass) + (state.source ? ` · ${state.source.width} × ${state.source.height}` : '') +
                (state.output ? ` → ${state.output.width} × ${state.output.height}` : '') + (state.reason ? ' · ' + reasonLabel(state.reason) : '');
            const colorChanged = !!p && color.value !== appliedColor;
            const sourceChanged = !!p && appliedColor === 'sdr' && sourceKey() !== builtSource;
            const rendererReload = requestedSR && state && state.reason === 'renderer-recreate-required';
            const reload = colorChanged || sourceChanged || rendererReload;
            field('recreate').hidden = !reload || typeof actions.recreate !== 'function' || !s;
            field('reload-note').hidden = field('recreate').hidden;
            field('next').textContent = sourceChanged ? t('The source address changed. Confirm its color again if known, then Apply & reload. Current playback continues until you apply.', '片源地址已更换，请按新片源重新确认色彩，再点击“应用并重新加载”；应用前继续播放当前视频。') :
                colorChanged ? t('Source color is a creation setting. Apply & reload to use this change; current playback is unchanged until then.', '片源色彩在创建时应用。点击“应用并重新加载”后生效，当前播放暂用原设置。') :
                color.value === 'unknown' ? t('For a known SDR video, select “I confirm this source is SDR”. Keep unknown or HDR sources as they are.', '确认是 SDR 视频后，选择“我确认片源是 SDR”；不确定或 HDR 片源请保持原画。') :
                rendererReload ? t('Use Apply & reload to enable SR with this renderer.', '点击“应用并重新加载”，让当前渲染器应用超分。') :
                t('Switching off restores the original picture. One step up uses the smallest available enhancement; Automatic lets the SDK choose.', '关闭即恢复原画。“升一档”选择当前最低可用增强档位；“自动”交由 SDK 选档。');
        }
        function setAudio(next) {
            const p = getPlayer();
            if (typeof next !== 'boolean') return false;
            // A gesture notification can play an encoded WebRTC core. Changing
            // the leveling preference must not resume paused media.
            const accepted = !p || hasAudio(p) && p.set_audio_leveling(next ? 'StableVolume' : 'None');
            audioRejected = !accepted;
            if (accepted) requestedAudio = next;
            refresh(); return !!accepted;
        }
        const requestSR = (enabled, mode, key) => ({enabled, level:mode === 'step' ? 'light' : 'standard', targetKey:key});
        audio.addEventListener('change', () => setAudio(audio.checked));
        field('audio-resume').addEventListener('click', () => {
            const p = getPlayer();
            if (p && typeof p.play === 'function') {
                if (typeof p.notify_user_gesture === 'function') p.notify_user_gesture();
                if (typeof actions.play === 'function') actions.play(); else p.play();
            }
            refresh();
        });
        sr.addEventListener('change', function () {
            const p = getPlayer(), next = sr.checked;
            const accepted = !p || hasSR(p) && p.set_super_resolution(requestSR(next, quality, requestedTarget));
            srRejected = !accepted;
            if (accepted) requestedSR = next;
            refresh();
        });
        target.addEventListener('change', function () {
            const p = getPlayer(), value = target.value, mode = value === 'step' ? 'step' : value ? 'manual' : 'auto';
            const key = mode === 'manual' ? value : null;
            const accepted = !p || hasSR(p) && p.set_super_resolution(requestSR(requestedSR, mode, key));
            srRejected = !accepted;
            if (accepted) { quality = mode; requestedTarget = key; }
            refresh();
        });
        color.addEventListener('change', function () { confirmedSource = color.value === 'sdr' ? sourceKey() : null; refresh(); });
        if (actions.sourceInput) {
            actions.sourceInput.addEventListener('input', refresh);
            actions.sourceInput.addEventListener('change', refresh);
        }
        field('recreate').addEventListener('click', function () { if (typeof actions.recreate === 'function') actions.recreate(); refresh(); });
        function buildConfig(p) {
            const config = {};
            if (hasAudio(p)) config.audio_leveling = requestedAudio ? 'StableVolume' : 'None';
            if (hasSR(p)) config.super_resolution = {...requestSR(requestedSR, quality, requestedTarget), input_color:color.value === 'sdr' && confirmedSource === sourceKey() ? 'sdr' : 'unknown'};
            return config;
        }
        function bind(p) {
            if (detach) detach();
            syncSource();
            boundPlayer = p; appliedColor = color.value; builtSource = sourceKey(); audioRejected = false; srRejected = false;
            const callbacks = ['on_play_time', 'on_super_resolution_state', 'on_ready_show_done_callback'];
            const previous = callbacks.map(name => p[name]);
            const wrappers = callbacks.map((name, i) => function (...args) {
                try { if (typeof previous[i] === 'function') previous[i].apply(this, args); }
                finally { if (getPlayer() === p) refresh(); }
            });
            callbacks.forEach((name, i) => { p[name] = wrappers[i]; });
            detach = function () { cancelAudioRefresh(); boundPlayer = null; callbacks.forEach((name, i) => { if (p[name] === wrappers[i]) p[name] = previous[i]; }); detach = null; };
            refresh();
        }
        function unbind() { if (detach) detach(); refresh(); }
        function canLoad(value) {
            refresh();
            // input_color belongs to build(). Loading another source on an SDR
            // instance must wait for the user's explicit recreation action.
            return !getPlayer() || appliedColor !== 'sdr' || sourceKey(value) === builtSource;
        }
        refresh();
        return {buildConfig, bind, unbind, refresh, setAudio, canLoad};
    };
}(window));
