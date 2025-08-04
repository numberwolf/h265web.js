var ylplayer = null;
/**
 * load workers
 */
// 需要加载的h265web的wasm的js文件(完整http地址)
const wasm_js_uri = window.location.origin + '/output/h265web_wasm.js';
// 需要加载的h265web的wasm文件(完整http地址)
const wasm_wasm_uri =  window.location.origin + '/output/h265web_wasm.wasm';
// 需要加载的扩展wasm的js文件(完整http地址)
const ext_src_js_uri = window.location.origin + '/output/extjs.js';
// 需要加载的扩展wasm的js文件(完整http地址)
const ext_wasm_js_uri = window.location.origin + '/output/extwasm.js';

const play_url = window.location.origin + '/resource/hevc_test_moov_set_head_16s.mp4';

// 当前播放的时间位置记录
var play_pts = 0;

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 创建播放器
function create(mode=0) {
    if (ylplayer) {
        ylplayer.release(); // 释放掉播放器
        ylplayer = null;
        // appendLog(5, "ylplayer released!");
    }
    // 创建播放器方法
    ylplayer = H265webjsPlayer();
    // 构建播放器 config为播放器的配置
    const player_config ={
        player_id: "canvas111", // 装载播放器的div的ID
        wasm_js_uri: wasm_js_uri, // h265web的wasm的js文件的地址(完整http地址)
        wasm_wasm_uri: wasm_wasm_uri, // h265web的wasm文件的地址(完整http地址)
        ext_src_js_uri: ext_src_js_uri, //  需要加载的扩展wasm的js文件(完整http地址), 有hls的播放则必须填写
        ext_wasm_js_uri: ext_wasm_js_uri, //  需要加载的扩展wasm文件(完整http地址), 有hls的播放则必须填写
        width: "100%", // div的长
        height: isMobileDevice() ? "100%" : 640, // 手机端100%高度
        color: "antiquewhite", // 背景颜色
        auto_play: true, // 是否自动播放, 默认否
        readframe_multi_times: -1,
        enable_play_button: true,
        // core: 'mse_hevc',
        // core: 'wasm_hevc',
        // core: 'webcodec_hevc', // 优先使用的内核，不填写则自动识别
        ignore_audio: false // 是否要忽略掉音频，默认否
    };
    if (mode === 1) {
        player_config.core = 'webcodec_hevc';
    } else if (mode === 2) {
        player_config.core = 'wasm_hevc';
    } else if (mode === 3) {
        player_config.core = 'mse_hevc';
    }
    ylplayer.build(player_config);

    /*
     播放器的所有回调
     */
    // 是否请求pkt（webcodec wasm则需要）
    // ylplayer.request_pkt_callback = function (vpkt_count, apkt_count) {
    //     // appendLog(5, "request_pkt_callback vpkt_count: " + vpkt_count + " apkt_count: " + apkt_count);
    // }
    // 当前缓存的进度
    ylplayer.on_cache_process_callback = function (timestamp) {
        // appendLog(5, "on_cache_process_callback " + timestamp);
    };
    // 缓存中
    ylplayer.on_load_caching_callback = function () {
        // appendLog(5, "on_load_caching_callback " + v_cache_size);
    };
    // 缓存完成 至少有1帧
    ylplayer.on_finish_cache_callback = function (data) {
        // appendLog(5, "on_finish_cache_callback " + data.store_length);
    };
    // 播放结束
    ylplayer.on_play_finished = function () {
        // appendLog(5, "on_play_finished");
    };
    // 视频分析完成
    ylplayer.video_probe_callback = function (mediaInfo) {
        // appendLog(5, JSON.stringify(mediaInfo));
        console.log("===============>", mediaInfo);
    };
    // 首帧加载完成, 可以播放了
    ylplayer.on_ready_show_done_callback = function () {
        // appendLog(5, "on_ready_show_done_callback");
    };
    // nalu单元回调（webcodec wasm）
    ylplayer.video_nalu_callback = function (pts, dts) {
        // appendLog(5, 'video_nalu_callback pts: ' + pts + ' dts:'+ dts);
        // document.getElementById("nalu_info").innerHTML = `nalu pts: ${pts} dts: ${dts}`;
    }
    // 视频图像回调进度
    ylplayer.video_frame_callback = function (pts, w, h, cache_size) {
        v_cache_size = cache_size;
        // appendLog(5, "video_frame_callback: cache_size: " + cache_size + " pts:" + pts + " w: " + w + " h: " + h);
        // document.getElementById("vframe_info").innerHTML = `vframe cache_size: ${cache_size} pts: ${pts}`;
        // console.log("===============>", pts, w, h);
    };
    // 音频帧回调进度
    ylplayer.audio_frame_callback = function (pts, cache_size) {
        // appendLog(5, "audio_frame_callback cache_size: " + cache_size + " pts: " + pts);
        // document.getElementById("aframe_info").innerHTML = `aframe cache_size: ${cache_size} pts: ${pts}`;
    };
    // 视频渲染进度
    ylplayer.video_render_callback = function (pts, w, h) {
        const audio_pts_info = ylplayer.get_audio_pts();
        // appendLog(5, 
        //     "video_render_callback pts: " + pts + " w: " + w + " h: " + h + 
        //     " audio_pts=" + Math.floor(audio_pts_info.pts * 1000) + " dur: " + audio_pts_info.duration
        // );
        play_pts = pts;
    };
    // 音频渲染进度
    ylplayer.audio_render_callback = function (pts) {
        // appendLog(4, "audio_render_callback pts: " + pts);
    };
    // nalu长度
    ylplayer.nalu_length_callback = function (nalu_len) {
        // appendLog(1, "nalu_length_callback nalu_len: " + nalu_len);
    }
    // 这里不需要
    ylplayer.tex_length_callback = function (tex_len) {
        // appendLog(1, "tex_length_callback tex_len: " + tex_len);
    }
    // 当前播放进度
    ylplayer.on_play_time = function(pts) {
        const float_pts = pts; // 保留两位小数
        // document.getElementById("time_info").innerHTML = `play_pts: ${float_pts}`;
    }
    // seek开始
    ylplayer.on_seek_start_callback = function (seekTarget) {
        // appendLog(5, "on_seek_start_callback seekTarget: " + seekTarget);
    }
    // seek结束
    ylplayer.on_seek_done_callback = function (seekTarget) {
        // appendLog(5, "on_seek_done_callback seekTarget: " + seekTarget);
    }
} // end create

function loadMedia() {
    // 加载视频API
    ylplayer && ylplayer.load_media(play_url);
}

function change_media() {
    // appendLog(5, 'click change_media!');
    // 切换视频API
    ylplayer && ylplayer.change_media(play_url);
}

function screenshot() {
    // appendLog(5, 'click screenshot!');
    // 截图API 输入的是img的ID
    ylplayer && ylplayer.screenshot("screenshot");
}

function cache_demux() {
    // appendLog(5, 'click cache_demux!');
    // 缓存视频API
    ylplayer && ylplayer.cache_demux(1, 1);
}

function get_nalu_len() {
    // appendLog(5, 'click get_nalu_len!');
    // 获取nalu长度API
    ylplayer && ylplayer.get_nalu_len();
}

function get_tex_len() {
    // appendLog(5, 'click get_tex_len!');
    // 获取tex长度API
    ylplayer && ylplayer.get_tex_len();
}

function render_tex() {
    // appendLog(5, 'click render_tex!');
    // 渲染tex API
    ylplayer && ylplayer.render_tex();
}

function next_frame() {
    // appendLog(5, 'click next_frame!');
    // 跳转下一帧API
    ylplayer && ylplayer.next_frame();
}

function audioPlay() {
    // appendLog(5, 'click audioPlay!');
    // 音频播放API
    ylplayer && ylplayer.audio_play();
}

function set_mute() {
    // appendLog(5, 'click set_mute!');
    // 音频静音API
    ylplayer && ylplayer.set_voice(0);
}

function set_voice() {
    // appendLog(5, 'click set_voice!');
    // 音频音量API
    ylplayer && ylplayer.set_voice(1.0);
}

function resize(width, height) {
    // appendLog(5, `click resize! width: ${width} height: ${height}`);
    // 视频尺寸调整API
    ylplayer && ylplayer.resize(width, height);
}

function play() {
    // appendLog(5, 'click play!');
    // 视频播放API
    ylplayer && ylplayer.play();
}

function pause() {
    // appendLog(5, 'click pause!');
    // 视频暂停API
    ylplayer && ylplayer.pause();
}

function seek() {
    let seekTime = Number(document.getElementById("seek-input").value);
    // appendLog(5, `click seek! seekTime: ${seekTime}`);
    // 视频seek API
    ylplayer && ylplayer.seek(seekTime);
}

function set_playback_rate() {
    let playback_rate = Number(document.getElementById("playback-rate-input").value);
    // appendLog(5, `click set_playback_rate! playback_rate: ${playback_rate}`);
    // 视频倍速API
    ylplayer && ylplayer.set_playback_rate(playback_rate);
}

function fullScreen() {
    // appendLog(5, 'click fullScreen!');
    // 视频全屏API
    ylplayer && ylplayer.fullScreen();
}

function closeFullScreen() {
    // appendLog(5, 'click closeFullScreen!');
    // 视频退出全屏API
    ylplayer && ylplayer.closeFullScreen();
}

function release() {
    // appendLog(5, 'click release!');
    // 视频释放API
    ylplayer && ylplayer.release();
    ylplayer = null;
    refresh();
    // appendLog(5, 'release done!');
}

function build_player(mode=0) {
    create(mode);
    loadMedia();
}

window.onload = function() {
    build_player();
};
