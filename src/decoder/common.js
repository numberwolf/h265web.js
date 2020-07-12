// global.SLICE_TAG_AUDIO = 0x08;
// global.SLICE_TAG_VIDEO = 0x09

// ================================ CONST
/*
 * Video
 *      APPEND_TYPE_STREAM 	: Uint8Array(str1 + str2 + ...)
 * 		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 * Audio
 * 		APPEND_TYPE_STREAM 	: [ Uint8Array(...) , ...]
 *		APPEND_TYPE_FRAME	: [ {pts:xxx, data:Uint8Array(...) }, ...]
 */
global.APPEND_TYPE_STREAM   = 0x00;
global.APPEND_TYPE_FRAME    = 0x01;

global.DEFAULT_WIDTH     	= 400;
global.DEFAULT_HEIGHT    	= 400;
global.DEFAULT_FPS       	= 25;
global.DEFAULT_FIXED     	= false;
global.DEFAULT_SAMPLERATE	= 44100;

// ================================ VALUE
global.VIDEO_PTS_VAL = -1;
global.VIDEO_TEST_SEEK = true;

// ================================ FUNC
global.SLEEP_WAIT = function(d){
  for(var t = Date.now();Date.now() - t <= d;);
};