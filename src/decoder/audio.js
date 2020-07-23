/**
 * Audio
 */
const AudioContext 	= window.AudioContext || window.webkitAudioContext;
const AUDIO_WAIT 	= 0.04; // 40ms ~ 2frame
const def = require('../consts')
/**
 * @brief: construct
 */
function AudioImp() {
	// Class Object
}

AudioImp.prototype.init = function(options={}) {
	var _this 			= this;
	// https://webaudio.github.io/web-audio-api/#dictdef-audiocontextoptions

	var sampleRate = 44100;
	if ("sampleRate" in options) {
		sampleRate = options["sampleRate"];
	}

	_this.appendType = def.APPEND_TYPE_STREAM;
	if ("appendType" in options) {
		_this.appendType = options["appendType"];
	}

	// console.log(options);
	// console.log(_this.appendType);

	_this.audioCtx 		= new AudioContext({
		latencyHint : "interactive",
		sampleRate 	: sampleRate
	});
    // console.log("this.audioContext=%o", _this.audioCtx);
    _this.sourceList		= [];
    _this.startStatus 		= false;
    _this.sampleQueue		= [];

    _this.sourceList.push(_this.audioCtx.createBufferSource());
    _this.sourceList.push(_this.audioCtx.createBufferSource());

    _this.sourceList[0].onended = function() {
    	_this.swapSource(0, 1);
    };

    _this.sourceList[1].onended = function() {
	    _this.swapSource(1, 0);
	};

	_this.durationMs = -1;

	// _this.startTime 		= -1.0;
	// _this.pauseTime			= -1.0;
	// _this.useDuration		= -1.0;

    return true;
};

AudioImp.prototype.setDurationMs = function(durationMs = -1) {
    this.durationMs = durationMs;
};

/**
 * @brief Swap SourceNode To Play When before node play end
 */
AudioImp.prototype.swapSource = function(sourceIndex = -1, dstIndex = -1) {
	var _this = this;

	if (_this.startStatus == false) {
		return null;
	}

	if (sourceIndex < 0 || sourceIndex >= _this.sourceList.length) {
		return null;
	}

	if (dstIndex < 0 || dstIndex >= _this.sourceList.length) {
		return null;
	}
	
	try {
		_this.sourceList[sourceIndex].disconnect(_this.audioCtx.destination);
		_this.sourceList[sourceIndex] = null;
	} catch (e) {
		//console.log("[DEFINE ERROR]disconnect source Index:" + sourceIndex + " error happened!");
		return null;
	}

	//console.log("ended 1");
	// if (_this.sourceList[dstIndex] == null || !_this.sourceList[dstIndex] || _this.sourceList[dstIndex] == undefined) {
	// 	_this.sourceList[dstIndex] 			= _this.audioCtx.createBufferSource();
	// 	_this.sourceList[dstIndex].onended 	= function() {
	// 		_this.swapSource(dstIndex, sourceIndex);
	// 	};
	// }
	// 把刚才生成的片段加入到 音频片段源节点(AudioBufferSourceNode)。
	// _this.sourceList[0].buffer 	= myArrayBuffer;
	// setTimeout(function(){
		_this.decodeSample(dstIndex, sourceIndex);
	// }, 1);
	// var decodeRet = _this.decodeSample(dstIndex, sourceIndex);
	// return decodeRet;
};

// @TODO seek
AudioImp.prototype.seek = function(sourceIndex = -1, timeData = 0.0) {
	var _this = this;
	_this.sourceList[sourceIndex].start(0, timeData);
}

 /**
  * @Param sampleArrBuf : UInt8Array 
  * If Use arr.buffer is ArrayBuffer
  */
AudioImp.prototype.addSample = function(sampleArr = null) {
 	if (sampleArr == null || !sampleArr || sampleArr == undefined) {
 		return false;
 	}
 	// console.log("vvvvvvvvvvvvvvvvvvvvvvvvv");
 	// console.log(sampleArr);
 	// console.log(this.sampleQueue.length);
 	if (this.durationMs > 0 && sampleArr["pts"] * 1000 >= this.durationMs - 10) {
 		return true;
 	}
 	// if (this.sampleQueue.length > 0 &&sampleArr["pts"] < this.sampleQueue[this.sampleQueue.length-1]["pts"]) {
 	// 	this.sampleQueue = [];
 	// }
 	// console.log("push sampleArr");
	this.sampleQueue.push(sampleArr);

    return true;
};

/**
 * @return 
 * 1 queue length == 0, no frame
 * 0 OK
 * -1 sourceIndex out of bounds
 * -2 decode Error
 */
AudioImp.prototype.decodeSample = function(sourceIndex = -1, dstIndex = -1) {
	// console.log("decodeSample");
	var _this = this;

	// console.log("queue length:" + _this.sampleQueue.length);
	if (sourceIndex < 0 || sourceIndex >= _this.sourceList.length) {
		return -1;
	}

	if (_this.sourceList[sourceIndex] == null || _this.sourceList[sourceIndex] == undefined || !_this.sourceList[sourceIndex]) {
		_this.sourceList[sourceIndex] = _this.audioCtx.createBufferSource();
		_this.sourceList[sourceIndex].onended = function() {
			_this.swapSource(sourceIndex, dstIndex);
		};
	}

	if (_this.sampleQueue.length == 0) {
		_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
		_this.sourceList[sourceIndex].start();
		_this.sourceList[sourceIndex].stop();

		return 1;
	}

	var mergeBuf = null;

	/*
	var mergeTmp = new Uint8Array(lenOld + lenPush);
	mergeTmp.set(this.stream,0);
	mergeTmp.set(streamPushInput,lenOld);
	*/

	var maxCount = _this.sampleQueue.length >= 50 ? 50 : _this.sampleQueue.length;
	// console.log("maxCount：" + maxCount);
	// console.log(global.VIDEO_PTS_VAL);
	// @TODO
	var addSure = false;
	var track 	= _this.sampleQueue[0]; // 先不shift
	for (var i = 0; i < maxCount; ) { // i++
		/*
			 {
				pts: int
				data: Uint8Array
			 }
		 */
		// console.log("global.VIDEO_PTS_VAL:" + global.VIDEO_PTS_VAL);
		// var track 		= _this.sampleQueue.shift();
		// console.log(track["pts"]);

		// if (track == null) {
		// 	_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
		// 	_this.sourceList[sourceIndex].start();
		// 	_this.sourceList[sourceIndex].stop();
		// 	return 1;
		// }
		
		if (addSure == false && global.VIDEO_PTS_VAL >= 0) {
			var firstPts 	= track["pts"];

			console.log("audio pts " + firstPts + ",VIDEO_PTS_VAL " + global.VIDEO_PTS_VAL);
			// if (_this.durationMs > 0 && firstPts * 1000 > _this.durationMs) {
			// 	track = _this.sampleQueue = []; //hift();
			// 	// firstPts 	= track["pts"];
			// 	_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
			// 		_this.sourceList[sourceIndex].start();
			// 		_this.sourceList[sourceIndex].stop();
			// }

			var distince	= firstPts - global.VIDEO_PTS_VAL;
			if (
				(distince > 0 && distince <= AUDIO_WAIT)  // < 1 frame
				|| (distince < 0 && -1 * distince <= AUDIO_WAIT) // < 1 frame
				|| distince == 0
			) { // OK
				addSure = true;
				// track 	= _this.sampleQueue
			} else {
				if (distince > 0) {
					// 这里不能continue  会阻塞主线程
					// console.log("continue await " + firstPts + "," + global.VIDEO_PTS_VAL);
					// continue;

					_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
					_this.sourceList[sourceIndex].start();
					_this.sourceList[sourceIndex].stop();
					return 1;
				}

				if (distince < 0) { // throw this frame
					console.log("throw this frame");
					track = _this.sampleQueue.shift();
					console.log(track);
					i++;
					continue;
				}
			}
		}

		if (track == null) {
			track = _this.sampleQueue.shift();
		}

		i++;

		var arrayBuf = null;
		if (_this.appendType == def.APPEND_TYPE_STREAM) {
			arrayBuf = track;
		} else { // APPEND_TYPE_FRAME
			arrayBuf = track["data"];
		}

		if (mergeBuf == null) {
			mergeBuf = new Uint8Array(arrayBuf);
		} else {
			var mergeTmp = new Uint8Array(arrayBuf.length + mergeBuf.length);
			mergeTmp.set(mergeBuf, 0);
			mergeTmp.set(arrayBuf, mergeBuf.length);

			mergeBuf = mergeTmp;
		}

		track = null;
	}

	var inputBuf = null;
	var inputBuf = mergeBuf;
	// // mp3 Windows (pcm count) padding
	// if (mergeBuf.length < 1152) {
	// 	inputBuf = new Uint8Array(1152);
	// 	inputBuf.set(mergeBuf ,0);
	// } else {
	// 	inputBuf = mergeBuf;
	// }

	if (inputBuf == null || inputBuf.length < 1) {
		_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
		_this.sourceList[sourceIndex].start();
		_this.sourceList[sourceIndex].stop();
		return 1;
	}

	// .buffer;
	// console.log("get buf");
	// console.log(inputBuf);

	var inputArrayBuffer = inputBuf.buffer;

	try {
		_this.audioCtx.decodeAudioData(
			inputArrayBuffer, function(buffer) {
				// console.log(buffer.duration);
				// console.log(_this.sourceList[sourceIndex]);

				_this.sourceList[sourceIndex].buffer = buffer;
				//console.log("to connect");
				_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
				//console.log("connected");
				// _this.sourceList[sourceIndex].loop = true;

				_this.sourceList[sourceIndex].start();

				// console.log("to_start " + sourceIndex + " and start()");
				// console.log("--------------^^^^^^-----------------");
	    	},
			function(e) {
				"Error with decoding audio data" + e.err;
			}
		);
	} catch (e) {
        alert('Crash[brower]! Please refresh your page');
        return -2;
    }

    // console.log(sourceIndex + "numberOfInputs:" + _this.sourceList[sourceIndex].numberOfInputs);
    // console.log(sourceIndex + "numberOfOutputs:" + _this.sourceList[sourceIndex].numberOfOutputs);

	return 0;
};

AudioImp.prototype.play = function() {
	if (this.startStatus == false) {
		this.startStatus = true;
		// this.startTime = Date.now();
		this.decodeSample(0, 1);
	}
};

// @TODO pause
// AudioImp.prototype.pausePlay = function() {
// 	this.startStatus 	= false;
// 	var nowTime 		= Date.now();
// 	this.pauseTime 		= Date.now();

// 	this.useDuration	= (this.pauseTime - this.startTime) / 1000;
// };

AudioImp.prototype.pause = function() {
	// console.log("AudioImp.prototype.pause");
	var _this = this;
	_this.startStatus = false;

	for (var i = 0; i < _this.sourceList.length; i++) {
		try {
			if (_this.sourceList[i] != null) {
				_this.sourceList[i].stop();
				_this.sourceList[i].disconnect(_this.audioCtx.destination);
				_this.sourceList[i] = null;
			}
		} catch (e) {
	        console.log("error:", e);
	    }
	}

	// console.log(_this.sourceList[0]);
};

AudioImp.prototype.stop = function() {
	var _this = this;
	_this.pause();
	_this.sampleQueue = [];
};

AudioImp.prototype.cleanQueue = function() {
	this.sampleQueue = [];
};

// @TODO continue
// AudioImp.prototype.continuePlay = function() {
// 	this.seek(0, this.useDuration);
// };
module.exports = AudioImp
