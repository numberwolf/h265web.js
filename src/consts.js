/*
 * Video
 *      APPEND_TYPE_STREAM 	: Uint8Array(str1 + str2 + ...)
 * 		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 * Audio
 * 		APPEND_TYPE_STREAM 	: [ Uint8Array(...) , ...]
 *		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 */
module.exports = {
  // SLICE_TAG_AUDIO: 0x08,
  // SLICE_TAG_VIDEO: 0x09,
  // PLAY_CMD: 1001,
  // DISCONN_CMD: 1002,
  APPEND_TYPE_STREAM: 0x00,
   APPEND_TYPE_FRAME: 0x01,
       DEFAULT_WIDTH: 400,
      DEFAULT_HEIGHT: 400,
         DEFAULT_FPS: 25,
       DEFAULT_FIXED: false,
  DEFAULT_SAMPLERATE: 44100,
}
