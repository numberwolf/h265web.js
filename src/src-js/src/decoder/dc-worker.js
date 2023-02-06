// importScripts('missile-v20220421-worker.js');
let _worker_ready = false;
let _corePtr = 0;
/*
 * func ptr
 */
let _ptr_probeCallback     = null;
let _ptr_frameCallback     = null;
let _ptr_naluCallback      = null;
let _ptr_sampleCallback    = null;
let _ptr_aacCallback       = null;

function _probeFinCallback(duration, width, height, fps,
    	audioIdx,
    	sample_rate, channels, vcodec_name_id, sample_fmt) {
}

function _naluCallback(data, len, isKey, width, height, pts, dts) {

}

function _aacFrameCallback(adts, buffer, line1, channel, pts) {
	// console.log("dc-worker.js _aacFrameCallback", line, channel, pts);
}

class yuv {
	constructor(y, u, v) {
		this.y = new Uint8Array(y.buffer);
		this.u = new Uint8Array(u.buffer);
		this.v = new Uint8Array(v.buffer);

		console.log("new yuv", this);
	}
}

function _frameCallback(
    	data_y, data_u, data_v, 
    	line1, line2, line3, 
    	width, height, pts, tag) 
{
	console.log("dc-worker.js _frameCallback 0 =>", 
		line1, line2, line3, width, height, pts, tag);

	let out_y = Module.HEAPU8.subarray(data_y, data_y + line1 * height);
    let out_u = Module.HEAPU8.subarray(data_u, data_u + (line2 * height) / 2);
    let out_v = Module.HEAPU8.subarray(data_v, data_v + (line3 * height) / 2);
    let buf_y = out_y.buffer.slice(0, out_y.buffer.byteLength);
    let buf_u = out_u.buffer.slice(0, out_u.buffer.byteLength);
    let buf_v = out_v.buffer.slice(0, out_v.buffer.byteLength);

    console.log("dc-worker.js _frameCallback 1 =>", 
    	out_y, out_u, out_v, buf_y, buf_u, buf_v);

    // let b1 = out_y.buffer.slice(0, out_y.buffer.byteLength);
    // self.postMessage(b1, [b1]);
    let postData = {
        cmd: '_frameCallback',
        params: {
        	buf_y: buf_y,
        	buf_u: buf_u,
        	buf_v: buf_v,
	    	line1: line1,
	    	line2: line2,
	    	line3: line3,
	    	width: width,
	    	height: height,
	    	pts: pts,
	    	tag: tag
        }
    };
	postMessage(postData, [buf_y, buf_u, buf_v]);
}

// 不用了
function _samplesCallback(buffer, line1, channel, pts) {
	// let pcm_buf = Module.HEAPU8.subarray(buffer, buffer + line1);
	// let pcm_buf_out = new Uint8Array(pcm_buf);
    // console.log("audio line1", line1);
	// this.audioPlayer.pushBuffer(pcm_buf_out);
}

function _removeBindFuncPtr() {
    if (_ptr_probeCallback !== null) 
        Module.removeFunction(_ptr_probeCallback);
    if (_ptr_frameCallback !== null) 
        Module.removeFunction(_ptr_frameCallback);
    if (_ptr_naluCallback !== null) 
        Module.removeFunction(_ptr_naluCallback);
    if (_ptr_sampleCallback !== null) 
        Module.removeFunction(_ptr_sampleCallback);
    if (_ptr_aacCallback !== null) 
        Module.removeFunction(_ptr_aacCallback);

    _ptr_probeCallback = null;
    _ptr_frameCallback = null;
    _ptr_naluCallback = null;
    _ptr_sampleCallback = null;
    _ptr_aacCallback = null;
}

console.log("dc-worker.js ==> file");

Module.onRuntimeInitialized = () => {
	if (_worker_ready === false) {
		_worker_ready = true;
		console.log("dc-worker.js ==> onRuntimeInitialized");
		postMessage({
	        cmd: 'onRuntimeInitialized',
	        params: []
	    });
	}
}; // onRuntimeInitialized

onmessage = (event) => {
	// let offset = Module._malloc(1);
	console.log("dc-worker.js ==> onmessage ", _worker_ready, event);

	if (_worker_ready === false) {
		return false;
	}

	/**
	 * cmd : xxx
	 * params : [xxx]
	 */
	let data = event.data;

	let cmd = data.cmd;
	let params = data.params;

	switch(cmd) {
		case 'AVSniffStreamInit':
			_corePtr = Module.cwrap('AVSniffStreamInit', 
	            'number', 
	            ['string', 'string'])(params[0], params[1]);

	        console.log("dc-worker.js ==> onmessage:", cmd, " _corePtr:", _corePtr);

	        // const functions = data.functions;

	        console.log("start add function probeCallback");
	        _ptr_probeCallback = Module.addFunction(_probeFinCallback);
	        console.log("start add function frameCallback");
	        _ptr_frameCallback = Module.addFunction(_frameCallback);
	        console.log("start add function naluCallback");
	        _ptr_naluCallback = Module.addFunction(_naluCallback);
	        console.log("start add function sampleCallback");
	        _ptr_sampleCallback = Module.addFunction(_samplesCallback);
	        console.log("start add function aacCallback");
	        _ptr_aacCallback = Module.addFunction(_aacFrameCallback);

	        const MISSILE_SNIFFSTREAM_MODE_DECODER = 2;
	        const MISSILE_IGNORE_AUDIO = 0; // no used

	        let initRet = Module.cwrap(
	        	'initializeSniffStreamModuleWithAOpt', 'number', 
		        	[
		        		'number', 
		        		'number', 'number', 'number', 'number', 'number', 
		        		'number', 'number'
		        	]
	        	)
	        	(
		            _corePtr, 
		            _ptr_probeCallback, 
		            _ptr_frameCallback, _ptr_naluCallback, 
		            _ptr_sampleCallback, _ptr_aacCallback, 
		            MISSILE_IGNORE_AUDIO, MISSILE_SNIFFSTREAM_MODE_DECODER
		        );

	        console.log("dc-worker.js ==> onmessage:", cmd, " initRet:", initRet);

	        postMessage({
		        cmd: 'onInitDecOK',
		        params: []
		    });

			break;
		case 'decodeVideoFrame':
			// params: {
			// 	nalBuf: nalBuf,
			// 	ptsMS: ptsMS,
			// 	dtsMS: dtsMS
			// }

			postMessage({
		        cmd: 'decodeVideoFrame_Start',
		        params: []
		    });

			let nalBuf = params.nalBuf;
			console.log("dc-worker.js ==> onmessage:", cmd, " nalBuf:", nalBuf);

			let offset = Module._malloc(nalBuf.length);
			Module.HEAP8.set(nalBuf, offset);
			let ptsMS = params.ptsMS;
			let dtsMS = params.dtsMS;

			let decRet = Module.cwrap('decodeVideoFrame', 
	            'number', 
	            ['number', 'number', 'number', 'number', 'number'])
				(_corePtr, offset, nalBuf.length, ptsMS, dtsMS);

	        console.log(
	        	"dc-worker.js ==> onmessage:", cmd, " decRet:", decRet);

	        Module._free(offset);
        	offset = null;

        	postMessage({
		        cmd: 'decodeVideoFrame_End',
		        params: [decRet]
		    });

		    break;
        case 'stop':
        	console.log("dc-worker.js stop execute");
        	_removeBindFuncPtr();
	        if (_corePtr !== undefined && _corePtr !== null) {
	        	let releaseRet = Module.cwrap(
	        		'releaseSniffStream', 'number', ['number'])(_corePtr);
	            _corePtr = null;
	            console.log("dc-worker.js stop ret", releaseRet);
	        }
	        console.log("dc-worker.js stop finished");
	        postMessage({
		        cmd: 'stop_End',
		        params: []
		    });

        	break;
		default:
			break;
	}

	// Module.cwrap(
	// 	'decodeVideoFrame', 'number', 
	// 	['number', 'number', 'number', 'number', 'number'])(
	// 	data._corePtr,
	// 	data.offset,
	// 	data.nalBufLen,
	// 	data.ptsMS,
	// 	data.dtsMS);
};