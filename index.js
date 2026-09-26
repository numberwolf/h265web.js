const wasm_js_uri = './static/h265web_wasm.js';
const wasm_wasm_uri = './static/h265web_wasm.wasm';
const ext_src_js_uri = './static/extjs.js';
const ext_wasm_js_uri = './static/extwasm.js';

const locale = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';

const TEXT = {
    en: {
        presetHevcMp4: 'HEVC MP4 Demo',
        presetFlatH264: 'Flat H.264/AAC MP4',
        presetVrH264: 'VR360 H.264/AAC MP4 (ERP 2:1)',
        presetVrHevc: 'VR360 HEVC/AAC MP4 (ERP 2:1)',
        presetVrHevcScene: 'VR360 HEVC/AAC scene (ERP 2:1)',
        featureTags: 'Feature Tags',
        yes: 'Yes',
        no: 'No',
        unsure: 'Unsure',
        proSubtitle: 'Free now · strongest feature set for browser playback',
        outdatedLabel: 'h265web.js Outdated',
        outdatedSubtitle: 'Community edition for feature comparison',
        nativeSubtitle: 'Native browser baseline reference',
        loading: 'Loading player...',
        play: 'Play',
        pause: 'Pause',
        seconds: ' s',
        requestPkt: (v, a) => `request pkt v=${v} a=${a}`,
        volumeSet: (value) => `volume -> ${value}`,
        gestureArmed: (reason) => `audio gesture armed -> ${reason}`,
        audioKick: (reason) => `audio kick scheduled -> ${reason}`,
        probe: (mediaInfo, durationSec) => `probe codec=${mediaInfo.codec} fmt=${mediaInfo.fmt || '-'} fps=${mediaInfo.fps} sampleRate=${mediaInfo.sampleRate} duration=${durationSec > 0 ? durationSec.toFixed(3) : '-'}`,
        readyShowDone: 'ready show done',
        audioRender: (pts) => `audio render pts=${formatPts(pts)}`,
        playFinished: 'play finished',
        seekStart: (target) => `seek start ${target}`,
        seekDone: (target) => `seek done ${target}`,
        error: (payload) => `error ${JSON.stringify(payload)}`,
        playerAlreadyExists: 'player already exists',
        buildFailed: 'build failed',
        createOk: (config) => `create ok core=${config.core || 'auto'} autoplay=${config.auto_play}`,
        mediaUrlEmpty: 'media url is empty',
        load: (url) => `load -> ${url}`,
        createAndLoad: (url) => `create + load -> ${url}`,
        playIgnored: 'play ignored, player not created',
        pauseIgnored: 'pause ignored, player not created',
        releaseIgnored: 'release ignored, player not created',
        seekIgnored: 'seek/rate ignored, player not created',
        playbackRate: (rate) => `playback rate -> ${rate.toFixed(2)}`,
        seek: (target) => `seek -> ${target.toFixed(2)}`,
        progressSeekIgnored: 'progress seek ignored, player not created',
        progressSeek: (target) => `progress seek -> ${target.toFixed(2)}`,
        preset: (label) => `preset -> ${label}; click Create + Load to switch videos`,
        projectionRequested: (value) => `view requested -> ${value}`,
        projectionRejected: (value) => `view change rejected -> ${value}`,
        projectionUnavailable: 'this SDK build does not expose VR360 view switching',
        fullscreenIgnored: 'fullscreen ignored, player not created',
        fullscreen: 'fullscreen',
        playAction: 'play',
        pauseAction: 'pause',
        release: 'release',
        demoReady: 'demo ready',
        unknown: '-',
        timeValue: (value) => `${formatPts(value)} s`,
        naluStatus: (pts, dts) => `pts ${formatPts(pts)} / dts ${formatPts(dts)}`,
        frameStatus: (cacheSize, pts, w, h) => `cache ${cacheSize} / pts ${formatPts(pts)} / ${w}x${h}`,
        audioCacheStatus: (cacheSize, pts) => `cache ${cacheSize} / pts ${formatPts(pts)}`,
    },
    zh: {
        presetHevcMp4: 'HEVC MP4 演示',
        presetFlatH264: '普通 H.264/AAC MP4',
        presetVrH264: 'VR360 H.264/AAC MP4（ERP 2:1）',
        presetVrHevc: 'VR360 HEVC/AAC MP4（ERP 2:1）',
        presetVrHevcScene: 'VR360 HEVC/AAC 实景（ERP 2:1）',
        featureTags: '能力标签',
        yes: '支持',
        no: '不支持',
        unsure: '视环境而定',
        proSubtitle: '当前免费 · 浏览器播放能力最完整',
        outdatedLabel: 'h265web.js 旧版本',
        outdatedSubtitle: '用于能力对比的旧开源版本',
        nativeSubtitle: '浏览器原生能力基线',
        loading: '播放器加载中...',
        play: '播放',
        pause: '暂停',
        seconds: ' 秒',
        requestPkt: (v, a) => `请求数据包 v=${v} a=${a}`,
        volumeSet: (value) => `音量 -> ${value}`,
        gestureArmed: (reason) => `音频手势已激活 -> ${reason}`,
        audioKick: (reason) => `音频唤醒已安排 -> ${reason}`,
        probe: (mediaInfo, durationSec) => `probe codec=${mediaInfo.codec} fmt=${mediaInfo.fmt || '-'} fps=${mediaInfo.fps} sampleRate=${mediaInfo.sampleRate} duration=${durationSec > 0 ? durationSec.toFixed(3) : '-'}`,
        readyShowDone: '首帧已就绪',
        audioRender: (pts) => `音频渲染 pts=${formatPts(pts)}`,
        playFinished: '播放结束',
        seekStart: (target) => `seek 开始 ${target}`,
        seekDone: (target) => `seek 完成 ${target}`,
        error: (payload) => `错误 ${JSON.stringify(payload)}`,
        playerAlreadyExists: '播放器已创建',
        buildFailed: 'build 失败',
        createOk: (config) => `创建成功 core=${config.core || 'auto'} autoplay=${config.auto_play}`,
        mediaUrlEmpty: '媒体地址为空',
        load: (url) => `加载 -> ${url}`,
        createAndLoad: (url) => `创建并加载 -> ${url}`,
        playIgnored: '未创建播放器，忽略播放',
        pauseIgnored: '未创建播放器，忽略暂停',
        releaseIgnored: '未创建播放器，忽略释放',
        seekIgnored: '未创建播放器，忽略 seek/倍速',
        playbackRate: (rate) => `倍速 -> ${rate.toFixed(2)}`,
        seek: (target) => `seek -> ${target.toFixed(2)}`,
        progressSeekIgnored: '未创建播放器，忽略进度跳转',
        progressSeek: (target) => `进度跳转 -> ${target.toFixed(2)}`,
        preset: (label) => `预设 -> ${label}；点击“创建并加载”切换视频`,
        projectionRequested: (value) => `已请求观看方式 -> ${value}`,
        projectionRejected: (value) => `观看方式切换未被接受 -> ${value}`,
        projectionUnavailable: '当前 SDK 构建没有 VR360 观看方式切换 API',
        fullscreenIgnored: '未创建播放器，忽略全屏',
        fullscreen: '全屏',
        playAction: '播放',
        pauseAction: '暂停',
        release: '释放',
        demoReady: '演示页已就绪',
        unknown: '-',
        timeValue: (value) => `${formatPts(value)} 秒`,
        naluStatus: (pts, dts) => `pts ${formatPts(pts)} / dts ${formatPts(dts)}`,
        frameStatus: (cacheSize, pts, w, h) => `缓存 ${cacheSize} / pts ${formatPts(pts)} / ${w}x${h}`,
        audioCacheStatus: (cacheSize, pts) => `缓存 ${cacheSize} / pts ${formatPts(pts)}`,
    }
}[locale];

const DEFAULT_MEDIA_URL = './hevc_test_moov_set_head_16s_hvc1.mp4';
const MEDIA_PRESETS = [
    { label: TEXT.presetHevcMp4, url: DEFAULT_MEDIA_URL, projection: 'flat' },
    { label: TEXT.presetFlatH264, url: './resource/flat-h264-aac.mp4', projection: 'flat' },
    { label: TEXT.presetVrH264, url: './resource/vr360-erp-h264-aac.mp4', projection: 'erp360' },
    { label: TEXT.presetVrHevc, url: './resource/vr360-erp-hevc-aac.mp4', projection: 'erp360' },
    { label: TEXT.presetVrHevcScene, url: './resource/vr360-erp-hevc-aac-scene.mp4', projection: 'erp360' },
];

const FEATURE_COLUMNS = [
    'H.265 SIMD', 'H.265', 'H.264', 'AV1', 'WebCodec', 'Wasm+SIMD', 'Wasm', 'MSE',
    'SuperGpuCache', 'SuperCpuCache', 'PlayBack H265', 'PlayBack H264', 'PlayBack AV1',
    'FLV', 'MP4', 'RawData H265', 'HTTP-FLV', 'HTTP-TS', 'Websocket FLV', 'Websocket TS',
    'Websocket H265', 'MPEG-TS', 'M3U8', 'HLS', 'MKV', 'G711A alaw', 'G711U ulaw', 'AAC',
    'MP3', 'Capture Frame', 'Auto Play', 'Next Frame', 'MediaInfo(Probe)', 'WebRTC'
];

const FEATURE_ROWS = [
    {
        label: 'h265web.js PRO',
        link: 'https://github.com/numberwolf/h265web.js',
        subtitle: TEXT.proSubtitle,
        highlight: true,
        statuses: [
            'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes',
            'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes',
            'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'
        ]
    },
    {
        label: TEXT.outdatedLabel,
        link: 'https://github.com/numberwolf/h265web.js/tree/outdated-version',
        subtitle: TEXT.outdatedSubtitle,
        statuses: [
            'no', 'yes', 'yes', 'unsure', 'no', 'no', 'yes', 'yes', 'no', 'no', 'no', 'yes', 'unsure',
            'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes',
            'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no'
        ]
    },
    {
        label: 'Video Element',
        subtitle: TEXT.nativeSubtitle,
        statuses: [
            'no', 'unsure', 'yes', 'unsure', 'no', 'no', 'no', 'yes', 'no', 'no', 'no', 'yes', 'unsure',
            'no', 'yes', 'no', 'no', 'no', 'no', 'no', 'no', 'no', 'unsure', 'unsure', 'unsure', 'no', 'no',
            'unsure', 'yes', 'no', 'unsure', 'no', 'yes', 'no'
        ]
    }
];

const elements = {
    mediaUrl: document.getElementById('media-url'),
    mediaSourceCombobox: document.getElementById('media-source-combobox'),
    mediaSourceToggle: document.getElementById('media-source-toggle'),
    mediaSourceList: document.getElementById('media-source-list'),
    coreSelect: document.getElementById('core-select'),
    projectionSelect: document.getElementById('projection-select'),
    autoplaySelect: document.getElementById('autoplay-select'),
    volumeInput: document.getElementById('volume-input'),
    volumeValue: document.getElementById('volume-value'),
    seekInput: document.getElementById('seek-input'),
    rateInput: document.getElementById('rate-input'),
    playPts: document.getElementById('play-pts'),
    naluStatus: document.getElementById('nalu-status'),
    videoCache: document.getElementById('video-cache'),
    audioCache: document.getElementById('audio-cache'),
    runtimeLog: document.getElementById('runtime-log'),
    buildConfig: document.getElementById('build-config'),
    featureHeadRow: document.getElementById('feature-head-row'),
    featureBody: document.getElementById('feature-body'),
    createLoadButton: document.getElementById('create-load-button'),
    createButton: document.getElementById('create-button'),
    loadButton: document.getElementById('load-button'),
    playButton: document.getElementById('play-button'),
    pauseButton: document.getElementById('pause-button'),
    fullscreenButton: document.getElementById('fullscreen-button'),
    releaseButton: document.getElementById('release-button'),
    seekButton: document.getElementById('seek-button'),
    hoverLoading: document.getElementById('player-hover-loading'),
    hoverToggle: document.getElementById('player-hover-toggle'),
    hoverProgress: document.getElementById('player-hover-progress'),
    hoverProgressFill: document.getElementById('player-hover-progress-fill'),
    hoverTime: document.getElementById('player-hover-time'),
};

const state = {
    player: null,
    audioResumePending: false,
    logLines: [],
    durationSec: 16,
    currentPtsSec: 0,
    isReady: false,
    isPaused: true,
};

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function appendLog(message, level = 'info') {
    const now = new Date().toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-GB', { hour12: false });
    const line = `<div class="log-line"><strong>[${now}]</strong> ${escapeHtml(level.toUpperCase())} ${escapeHtml(message)}</div>`;
    state.logLines.push(line);
    if (state.logLines.length > 120) {
        state.logLines.shift();
    }
    elements.runtimeLog.innerHTML = state.logLines.join('');
    elements.runtimeLog.scrollTop = elements.runtimeLog.scrollHeight;
}

function setStatus(target, value) {
    if (target) {
        target.textContent = value;
    }
}

function formatPts(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return TEXT.unknown;
    }
    return Number(value).toFixed(3);
}

function normalizeDurationSec(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
        return -1;
    }
    return num > 1000 ? num / 1000.0 : num;
}

function formatDurationLabel(currentSec, durationSec) {
    const safeDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 16;
    const safeCurrent = Math.max(0, Math.min(Number.isFinite(currentSec) ? currentSec : 0, safeDuration));
    return `${safeCurrent.toFixed(3)} / ${safeDuration.toFixed(3)}${TEXT.seconds}`;
}

function syncHoverLoadingState() {
    if (!elements.hoverLoading) {
        return;
    }
    elements.hoverLoading.style.opacity = state.isReady ? '0' : '1';
    elements.hoverLoading.style.pointerEvents = state.isReady ? 'none' : 'auto';
}

function syncHoverToggleLabel() {
    if (!elements.hoverToggle) {
        return;
    }
    elements.hoverToggle.textContent = state.isPaused ? TEXT.play : TEXT.pause;
}

function updateProgressUI(currentSec = state.currentPtsSec, durationSec = state.durationSec) {
    const safeDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 16;
    const safeCurrent = Math.max(0, Math.min(Number.isFinite(currentSec) ? currentSec : 0, safeDuration));
    const ratio = safeDuration > 0 ? (safeCurrent / safeDuration) * 100 : 0;
    if (elements.hoverProgressFill) {
        elements.hoverProgressFill.style.width = `${ratio}%`;
    }
    if (elements.hoverTime) {
        elements.hoverTime.textContent = formatDurationLabel(safeCurrent, safeDuration);
    }
}

function resetHoverUi() {
    state.currentPtsSec = 0;
    state.durationSec = 16;
    state.isReady = false;
    state.isPaused = true;
    syncHoverLoadingState();
    syncHoverToggleLabel();
    updateProgressUI();
}

function updateVolumeLabel() {
    const value = Number(elements.volumeInput.value);
    elements.volumeValue.textContent = Number.isNaN(value) ? '1.00' : value.toFixed(2);
}

function getCurrentVolume() {
    const value = Number(elements.volumeInput.value);
    if (Number.isNaN(value)) {
        return 1.0;
    }
    return Math.max(0, Math.min(1, value));
}

function applyVolume(withLog = true) {
    updateVolumeLabel();
    if (state.player) {
        state.player.set_voice(getCurrentVolume());
        if (withLog) {
            appendLog(TEXT.volumeSet(getCurrentVolume().toFixed(2)));
        }
    }
}

function markUserGesture(reason = 'gesture') {
    state.audioResumePending = true;
    if (state.player && typeof state.player.notify_user_gesture === 'function') {
        state.player.notify_user_gesture();
    }
    appendLog(TEXT.gestureArmed(reason));
}

function scheduleReadyAudioKick(reason = 'ready') {
    if (!state.audioResumePending || !state.player) {
        return;
    }
    const targetPlayer = state.player;
    const volume = getCurrentVolume();
    [0, 80, 220].forEach((delay, index) => {
        setTimeout(() => {
            if (state.player !== targetPlayer) {
                return;
            }
            if (typeof targetPlayer.notify_user_gesture === 'function') {
                targetPlayer.notify_user_gesture();
            }
            targetPlayer.set_voice(volume);
            targetPlayer.audio_play();
            if (index === 2) {
                state.audioResumePending = false;
            }
        }, delay);
    });
    appendLog(TEXT.audioKick(reason));
}

function getPlayerConfig() {
    const config = {
        player_id: 'demo-player',
        wasm_js_uri,
        wasm_wasm_uri,
        ext_src_js_uri,
        ext_wasm_js_uri,
        width: 960,
        height: 540,
        color: 'black',
        auto_play: elements.autoplaySelect.value === 'true',
        ignore_audio: false,
        core: elements.coreSelect.value || null,
    };
    if (elements.projectionSelect.value === 'erp360') {
        // The source must already be an ERP panorama; this does not convert a flat video.
        config.projection = 'erp360';
        config.vr = { yaw: 0, pitch: 0, fov: 75, mouse_control: true, touch_control: true };
    }
    return config;
}

function applyProjectionToPlayer() {
    const projection = elements.projectionSelect.value;
    refreshConfigPreview();
    if (!state.player) {
        return;
    }
    if (typeof state.player.set_projection !== 'function') {
        appendLog(TEXT.projectionUnavailable, 'warn');
        return;
    }
    if (projection === 'erp360' && typeof state.player.set_vr_controls === 'function') {
        state.player.set_vr_controls({ mouse: true, touch: true });
    }
    // A running player changes presentation only; its decoder and media URL stay intact.
    const accepted = state.player.set_projection(projection);
    appendLog(accepted ? TEXT.projectionRequested(projection) : TEXT.projectionRejected(projection),
        accepted ? 'info' : 'warn');
}

function refreshConfigPreview() {
    elements.buildConfig.textContent = JSON.stringify(getPlayerConfig(), null, 2);
}

function renderFeatureMatrix() {
    const headCells = ['<th>' + escapeHtml(TEXT.featureTags) + '</th>']
        .concat(FEATURE_COLUMNS.map((label) => `<th>${escapeHtml(label)}</th>`))
        .join('');
    elements.featureHeadRow.innerHTML = headCells;

    const statusLabel = {
        yes: TEXT.yes,
        no: TEXT.no,
        unsure: TEXT.unsure,
    };

    elements.featureBody.innerHTML = FEATURE_ROWS.map((row) => {
        const titleHtml = row.link
            ? `<a href="${row.link}" target="_blank" rel="noreferrer">${escapeHtml(row.label)}</a>`
            : escapeHtml(row.label);
        const firstCell = row.subtitle
            ? `<td><div class="feature-row-title"><strong>${titleHtml}</strong><span>${escapeHtml(row.subtitle)}</span></div></td>`
            : `<td>${titleHtml}</td>`;
        const cells = row.statuses
            .map((status) => `<td><span class="feature-status ${status}">${statusLabel[status] || status}</span></td>`)
            .join('');
        return `<tr${row.highlight ? ' class="row-highlight"' : ''}>${firstCell}${cells}</tr>`;
    }).join('');
}

function wireCallbacks(player) {
    player.request_pkt_callback = function(vpktCount, apktCount) {
        appendLog(TEXT.requestPkt(vpktCount, apktCount));
    };

    player.video_probe_callback = function(mediaInfo) {
        const durationSec = normalizeDurationSec(mediaInfo.duration);
        if (durationSec > 0) {
            state.durationSec = durationSec;
        }
        updateProgressUI();
        appendLog(TEXT.probe(mediaInfo, durationSec), 'info');
    };

    player.on_ready_show_done_callback = function() {
        state.isReady = true;
        state.isPaused = elements.autoplaySelect.value !== 'true';
        syncHoverLoadingState();
        syncHoverToggleLabel();
        appendLog(TEXT.readyShowDone);
        scheduleReadyAudioKick('ready show done');
    };

    player.video_nalu_callback = function(pts, dts) {
        setStatus(elements.naluStatus, TEXT.naluStatus(pts, dts));
    };

    player.video_sei_raw_callback = function(rawSei, pts, dts, codec) {
        console.log('video_sei_raw_callback', {
            rawSei,
            pts,
            dts,
            codec
        });
    };

    player.video_sei_text_callback = function(text, pts, dts, codec) {
        console.log('video_sei_text_callback', {
            text,
            pts,
            dts,
            codec
        });
    };

    player.video_frame_callback = function(pts, w, h, cacheSize) {
        setStatus(elements.videoCache, TEXT.frameStatus(cacheSize, pts, w, h));
    };

    player.audio_frame_callback = function(pts, cacheSize) {
        setStatus(elements.audioCache, TEXT.audioCacheStatus(cacheSize, pts));
    };

    player.video_render_callback = function(pts) {
        setStatus(elements.playPts, TEXT.timeValue(pts));
    };

    player.audio_render_callback = function(pts) {
        appendLog(TEXT.audioRender(pts));
    };

    player.on_play_time = function(pts) {
        state.currentPtsSec = Number(pts) || 0;
        state.isReady = true;
        syncHoverLoadingState();
        setStatus(elements.playPts, TEXT.timeValue(pts));
        updateProgressUI();
    };

    player.on_play_finished = function() {
        state.currentPtsSec = state.durationSec;
        state.isPaused = true;
        syncHoverToggleLabel();
        updateProgressUI();
        appendLog(TEXT.playFinished, 'warn');
    };

    player.on_seek_start_callback = function(seekTarget) {
        appendLog(TEXT.seekStart(seekTarget));
    };

    player.on_seek_done_callback = function(seekTarget) {
        appendLog(TEXT.seekDone(seekTarget));
    };

    player.on_error_callback = function(errorPayload) {
        appendLog(TEXT.error(errorPayload), 'error');
    };
}

function createPlayer() {
    if (state.player) {
        appendLog(TEXT.playerAlreadyExists);
        return state.player;
    }

    const player = H265webjsPlayer();
    const config = getPlayerConfig();
    const buildRet = player.build(config);
    if (!buildRet) {
        appendLog(TEXT.buildFailed, 'error');
        return null;
    }

    state.player = player;
    state.isReady = false;
    state.isPaused = !config.auto_play;
    wireCallbacks(player);
    player.set_voice(getCurrentVolume());

    if (state.audioResumePending && typeof player.notify_user_gesture === 'function') {
        player.notify_user_gesture();
    }

    syncHoverLoadingState();
    syncHoverToggleLabel();
    appendLog(TEXT.createOk(config));
    refreshConfigPreview();
    return player;
}

function loadPlayer() {
    const mediaUrl = elements.mediaUrl.value.trim();
    if (!mediaUrl) {
        appendLog(TEXT.mediaUrlEmpty, 'warn');
        return;
    }

    const alreadyBuilt = Boolean(state.player);
    const player = createPlayer();
    if (!player) {
        return;
    }
    if (alreadyBuilt) {
        applyProjectionToPlayer();
    }

    state.durationSec = 16;
    state.currentPtsSec = 0;
    state.isReady = false;
    syncHoverLoadingState();
    updateProgressUI();
    player.load_media(mediaUrl);
    appendLog(TEXT.load(mediaUrl));
    refreshConfigPreview();
}

function createAndLoadPlayer() {
    markUserGesture('create-load');
    if (state.player) {
        releasePlayer(true);
    }
    const player = createPlayer();
    if (!player) {
        return;
    }
    const mediaUrl = elements.mediaUrl.value.trim();
    if (mediaUrl) {
        state.durationSec = 16;
        state.currentPtsSec = 0;
        state.isReady = false;
        syncHoverLoadingState();
        updateProgressUI();
        player.load_media(mediaUrl);
        appendLog(TEXT.createAndLoad(mediaUrl));
        refreshConfigPreview();
    }
}

function playPlayer() {
    markUserGesture('play');
    if (!state.player) {
        appendLog(TEXT.playIgnored, 'warn');
        return;
    }
    state.player.play();
    state.isPaused = false;
    syncHoverToggleLabel();
    appendLog(TEXT.playAction);
}

function pausePlayer() {
    if (!state.player) {
        appendLog(TEXT.pauseIgnored, 'warn');
        return;
    }
    state.player.pause();
    state.isPaused = true;
    syncHoverToggleLabel();
    appendLog(TEXT.pauseAction);
}

function releasePlayer(silent = false) {
    if (!state.player) {
        if (!silent) {
            appendLog(TEXT.releaseIgnored, 'warn');
        }
        return;
    }

    state.player.release();
    state.player = null;
    state.audioResumePending = false;
    resetHoverUi();
    setStatus(elements.playPts, TEXT.unknown);
    setStatus(elements.naluStatus, TEXT.unknown);
    setStatus(elements.videoCache, TEXT.unknown);
    setStatus(elements.audioCache, TEXT.unknown);

    if (!silent) {
        appendLog(TEXT.release);
    }
}

function applySeekAndRate() {
    if (!state.player) {
        appendLog(TEXT.seekIgnored, 'warn');
        return;
    }

    const rate = Number(elements.rateInput.value);
    if (!Number.isNaN(rate)) {
        state.player.set_playback_rate(rate);
        appendLog(TEXT.playbackRate(rate));
    }

    const seekTarget = Number(elements.seekInput.value);
    if (!Number.isNaN(seekTarget) && seekTarget >= 0) {
        state.player.seek(seekTarget);
        state.currentPtsSec = seekTarget;
        updateProgressUI();
        appendLog(TEXT.seek(seekTarget));
    }
    refreshConfigPreview();
}

function seekFromProgress(event) {
    if (!state.player) {
        appendLog(TEXT.progressSeekIgnored, 'warn');
        return;
    }
    const rect = elements.hoverProgress.getBoundingClientRect();
    if (!rect.width) {
        return;
    }
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const target = ratio * state.durationSec;
    elements.seekInput.value = target.toFixed(2);
    state.currentPtsSec = target;
    updateProgressUI();
    state.player.seek(target);
    appendLog(TEXT.progressSeek(target));
}

function setSourceMenuOpen(open) {
    elements.mediaSourceList.hidden = !open;
    elements.mediaSourceToggle.setAttribute('aria-expanded', String(open));
    elements.mediaUrl.setAttribute('aria-expanded', String(open));
    if (open) {
        elements.mediaSourceList.querySelectorAll('.media-source-option').forEach((option) => {
            const preset = MEDIA_PRESETS[Number(option.dataset.presetIndex)];
            option.setAttribute('aria-selected', String(preset.url === elements.mediaUrl.value.trim()));
        });
    }
}

function selectMediaPreset(index) {
    const preset = MEDIA_PRESETS[index];
    if (!preset) return;
    elements.mediaUrl.value = preset.url;
    elements.projectionSelect.value = preset.projection;
    setSourceMenuOpen(false);
    elements.mediaUrl.focus();
    appendLog(TEXT.preset(preset.label));
    refreshConfigPreview();
}

function populatePresets() {
    MEDIA_PRESETS.forEach((preset, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'media-source-option';
        option.setAttribute('role', 'option');
        option.dataset.presetIndex = String(index);
        const label = document.createElement('span');
        label.className = 'media-source-option-label';
        label.textContent = preset.label;
        const url = document.createElement('span');
        url.className = 'media-source-option-url';
        url.textContent = preset.url;
        option.append(label, url);
        option.addEventListener('click', () => selectMediaPreset(index));
        elements.mediaSourceList.appendChild(option);
    });
    elements.mediaUrl.value = MEDIA_PRESETS[0].url;
    elements.projectionSelect.value = MEDIA_PRESETS[0].projection;
    setSourceMenuOpen(false);
}

function syncPresetFromMediaUrl() {
    const preset = MEDIA_PRESETS.find(item => item.url === elements.mediaUrl.value.trim());
    if (preset) {
        // Selecting a known ERP URL chooses the VR view for the next load.
        // Arbitrary URLs stay editable; users choose their own view explicitly.
        elements.projectionSelect.value = preset.projection;
    }
    refreshConfigPreview();
}

function bindEvents() {
    elements.mediaSourceToggle.addEventListener('click', () => {
        setSourceMenuOpen(elements.mediaSourceList.hidden);
    });
    elements.mediaSourceToggle.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setSourceMenuOpen(false);
    });
    elements.mediaUrl.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSourceMenuOpen(true);
            elements.mediaSourceList.querySelector('.media-source-option').focus();
        } else if (event.key === 'Escape') {
            setSourceMenuOpen(false);
        }
    });
    elements.mediaSourceList.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setSourceMenuOpen(false);
            elements.mediaUrl.focus();
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const options = [...elements.mediaSourceList.querySelectorAll('.media-source-option')];
            const current = options.indexOf(document.activeElement);
            const next = event.key === 'ArrowDown'
                ? Math.min(current + 1, options.length - 1)
                : Math.max(current - 1, 0);
            options[next].focus();
        }
    });
    document.addEventListener('pointerdown', (event) => {
        if (!elements.mediaSourceCombobox.contains(event.target)) setSourceMenuOpen(false);
    });

    elements.mediaUrl.addEventListener('input', syncPresetFromMediaUrl);
    elements.coreSelect.addEventListener('change', refreshConfigPreview);
    elements.projectionSelect.addEventListener('change', applyProjectionToPlayer);
    elements.autoplaySelect.addEventListener('change', refreshConfigPreview);
    elements.seekInput.addEventListener('input', refreshConfigPreview);
    elements.rateInput.addEventListener('input', refreshConfigPreview);

    elements.volumeInput.addEventListener('input', () => {
        updateVolumeLabel();
        refreshConfigPreview();
    });
    elements.volumeInput.addEventListener('change', () => applyVolume(true));

    elements.createLoadButton.addEventListener('click', createAndLoadPlayer);
    elements.createButton.addEventListener('click', () => {
        markUserGesture('create');
        createPlayer();
    });
    elements.loadButton.addEventListener('click', () => {
        markUserGesture('load');
        loadPlayer();
    });
    elements.playButton.addEventListener('click', playPlayer);
    elements.pauseButton.addEventListener('click', pausePlayer);
    elements.fullscreenButton.addEventListener('click', () => {
        if (!state.player) {
            appendLog(TEXT.fullscreenIgnored, 'warn');
            return;
        }
        state.player.fullScreen();
        appendLog(TEXT.fullscreen);
    });
    elements.releaseButton.addEventListener('click', () => releasePlayer(false));
    elements.seekButton.addEventListener('click', applySeekAndRate);

    if (elements.hoverToggle) {
        elements.hoverToggle.addEventListener('click', () => {
            if (!state.player) {
                return;
            }
            if (state.isPaused) {
                playPlayer();
            } else {
                pausePlayer();
            }
        });
    }

    if (elements.hoverProgress) {
        elements.hoverProgress.addEventListener('click', seekFromProgress);
    }
}

function bootstrap() {
    populatePresets();
    updateVolumeLabel();
    resetHoverUi();
    refreshConfigPreview();
    renderFeatureMatrix();
    bindEvents();
    if (elements.hoverLoading) {
        const label = elements.hoverLoading.querySelector('span');
        if (label) {
            label.textContent = TEXT.loading;
        }
    }
    if (elements.hoverToggle) {
        elements.hoverToggle.textContent = TEXT.play;
    }
    appendLog(TEXT.demoReady);
    createAndLoadPlayer();
}

bootstrap();
