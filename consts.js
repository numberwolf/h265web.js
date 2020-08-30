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
    PLAYER_IN_TYPE_TS: "ts",
    PLAYER_IN_TYPE_MPEGTS: "mpegts",
    PLAYER_IN_TYPE_M3U8_VOD: "m3u8",
    PLAYER_IN_TYPE_M3U8_LIVE: "hls",
    APPEND_TYPE_STREAM: 0x00,
    APPEND_TYPE_FRAME:  0x01,
    APPEND_TYPE_SEQUENCE:  0x02, // sec
    DEFAULT_WIDTH:      600,
    DEFAULT_HEIGHT:     600,
    DEFAULT_FPS:        25,
    DEFAULT_FRAME_DUR:  40,
    DEFAULT_FIXED:      false,
    DEFAULT_SAMPLERATE: 44100,
    DEFAULT_CONSU_SAMPLE_LEN: 20
}
