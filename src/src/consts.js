/********************************************************* 
 * LICENSE: GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.txt
 * 
 * Author: Numberwolf - ChangYanlong
 * QQ: 531365872
 * QQ Group:925466059
 * Wechat: numberwolf11
 * Discord: numberwolf#8694
 * E-Mail: porschegt23@foxmail.com
 * Github: https://github.com/numberwolf/h265web.js
 * 
 * 作者: 小老虎(Numberwolf)(常炎隆)
 * QQ: 531365872
 * QQ群: 531365872
 * 微信: numberwolf11
 * Discord: numberwolf#8694
 * 邮箱: porschegt23@foxmail.com
 * 博客: https://www.jianshu.com/u/9c09c1e00fd1
 * Github: https://github.com/numberwolf/h265web.js
 * 
 **********************************************************/
/*
 * Video
 *      APPEND_TYPE_STREAM 	: Uint8Array(str1 + str2 + ...)
 * 		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 *      APPEND_TYPE_SEQUENCE  : [ [{pts:xxx, data:Uint8Array(...) }], ...]
 * Audio
 * 		APPEND_TYPE_STREAM 	: [ Uint8Array(...) , ...]
 *		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 *      APPEND_TYPE_SEQUENCE  : [ [{pts:xxx, data:Uint8Array(...) }], ...]
 */
module.exports = {
    // SLICE_TAG_AUDIO: 0x08,
    // SLICE_TAG_VIDEO: 0x09,
    // PLAY_CMD: 1001,
    // DISCONN_CMD: 1002,
    DEFAILT_WEBGL_PLAY_ID: "glplayer",
    PLAYER_IN_TYPE_MP4: "mp4",
    PLAYER_IN_TYPE_FLV: "flv",
    PLAYER_IN_TYPE_HTTPFLV: "httpflv",
    PLAYER_IN_TYPE_RAW_265: "raw265",
    PLAYER_IN_TYPE_TS: "ts",
    PLAYER_IN_TYPE_MPEGTS: "mpegts",
    PLAYER_IN_TYPE_M3U8: "hls",
    PLAYER_IN_TYPE_M3U8_VOD: "m3u8",
    PLAYER_IN_TYPE_M3U8_LIVE: "hls",
    APPEND_TYPE_STREAM: 0x00,
    APPEND_TYPE_FRAME:  0x01,
    APPEND_TYPE_SEQUENCE:  0x02, // sec
    DEFAULT_WIDTH:      600,
    DEFAULT_HEIGHT:     600,
    DEFAULT_FPS:        30,
    DEFAULT_FRAME_DUR:  40,
    DEFAULT_FIXED:      false,
    DEFAULT_SAMPLERATE: 44100,
    DEFAULT_CHANNELS: 2,
    DEFAULT_CONSU_SAMPLE_LEN: 20,
    PLAYER_MODE_VOD: "vod",
    PLAYER_MODE_NOTIME_LIVE: "live",
    AUDIO_MODE_ONCE: "ONCE",
    AUDIO_MODE_SWAP: "SWAP",
    DEFAULT_STRING_LIVE: "LIVE",
    CODEC_H265: 0,
    CODEC_H264: 1,
    PLAYER_CORE_TYPE_DEFAULT: 0, // 默认播放器
    PLAYER_CORE_TYPE_CNATIVE: 1, // 包括demuxer decoder全部走C FFmpeg Native的

    FETCH_HTTP_FLV_TIMEOUT_MS: 7 * 1000,

    V_CODEC_NAME_HEVC : 265,
    V_CODEC_NAME_AVC  : 264,
    V_CODEC_NAME_UNKN : 500,

    A_CODEC_NAME_AAC  : 112,
    A_CODEC_NAME_MP3  : 113,
    A_CODEC_NAME_UNKN : 500,

    CACHE_NO_LOADCACHE      : 0xC0,
    CACHE_WITH_PLAY_SIGN    : 0xC1,
    CACHE_WITH_NOPLAY_SIGN  : 0xC2,
}; // module export
