/**
 * Audio
 */
const AudioContext 	= window.AudioContext || window.webkitAudioContext;
const AUDIO_WAIT 	= 0.04; // 40ms ~ 2frame
const def = require('../consts')

function AudioImp() {

}

AudioImp.prototype.init = function(options={}) {
	var _this 			= this;
	_this.sourceChannel = -1;
	// https://webaudio.github.io/web-audio-api/#dictdef-audiocontextoptions

	var sampleRate = 44100;
	if ("sampleRate" in options) {
		sampleRate = options["sampleRate"];
	}

	_this.appendType = def.APPEND_TYPE_STREAM;
	if ("appendType" in options) {
		_this.appendType = options["appendType"];
	}
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
		console.log("swap source " + sourceIndex + " to " + dstIndex)
		_this.sourceList[sourceIndex].disconnect(_this.audioCtx.destination);
		_this.sourceList[sourceIndex] = null;
	} catch (e) {
		console.log("[DEFINE ERROR]disconnect source Index:" + sourceIndex + " error happened!");
		return null;
	}


	_this.decodeSample(dstIndex, sourceIndex);
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

 	if (this.durationMs > 0 && sampleArr["pts"] * 1000 >= this.durationMs - 10) {
 		return true;
 	}
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
	var _this = this;
	_this.sourceChannel = sourceIndex;

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

	var maxCount = _this.sampleQueue.length >= 50 ? 50 : _this.sampleQueue.length;


	var addSure = false;
	var track 	= _this.sampleQueue[0]; // 先不shift
	for (var i = 0; i < maxCount; ) { // i++
		/*
			 {
				pts: int
				data: Uint8Array
			 }
		 */
		
		if (addSure == false && global.VIDEO_PTS_VAL >= 0) {
			var firstPts 	= track["pts"];

			console.log("audio pts " + firstPts + ",VIDEO_PTS_VAL " + global.VIDEO_PTS_VAL);
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
					// num: do not continue, or thread will be block
					// console.log("continue await " + firstPts + "," + global.VIDEO_PTS_VAL);

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

	var inputArrayBuffer = inputBuf.buffer;

	try {
		_this.audioCtx.decodeAudioData(
			inputArrayBuffer, function(buffer) {

				_this.sourceList[sourceIndex].buffer = buffer;
				_this.sourceList[sourceIndex].connect(_this.audioCtx.destination);
				_this.sourceList[sourceIndex].start();
	    	},
			function(e) {
				"Error with decoding audio data" + e.err;
			}
		);
	} catch (e) {
        alert('Crash[brower]! Please refresh your page');
        return -2;
    }

	return 0;
};

AudioImp.prototype.play = function() {
	if (this.startStatus == false) {
		this.startStatus = true;
		// this.startTime = Date.now();
		this.decodeSample(0, 1);
	}
};

AudioImp.prototype.pause = function() {
	var _this = this;
	_this.startStatus = false;

	if (_this.sourceList[_this.sourceChannel] != null) {
		_this.sourceList[_this.sourceChannel].stop()
		_this.sourceList[_this.sourceChannel].disconnect(_this.audioCtx.destination);
		_this.sourceList[_this.sourceChannel] = null;
	}
};

AudioImp.prototype.stop = function() {
	var _this = this;
	_this.pause();
	_this.sampleQueue = [];
	_this.sourceChannel = -1;
};

AudioImp.prototype.cleanQueue = function() {
	this.sampleQueue = [];
};

module.exports = AudioImp
