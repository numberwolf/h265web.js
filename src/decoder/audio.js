const AudioContext 	= window.AudioContext || window.webkitAudioContext;
const AUDIO_WAIT 	= 0.04; // 40ms ~ 2frame
const def = require('../consts');

module.exports = options => {
	const audioModule = {
		options: {
			sampleRate: options.sampleRate || 44100,
			appendType: options.appendType || def.APPEND_TYPE_STREAM
		},
		sourceChannel: -1,
		audioCtx: new AudioContext({
			latencyHint : "interactive",
			sampleRate 	: options.sampleRate
		}), // console.log("this.audioContext=%o", _this.audioCtx);
	    sourceList: 	[],
	    startStatus: 	false,
	    sampleQueue: 	[],
	    durationMs: 	-1,
	    alignVideoPTS: 	0
	}
	audioModule.setDurationMs = (durationMs = -1) => {
	    audioModule.durationMs = durationMs
	}
	audioModule.setAlignVPTS = (pts = -1) => {
		audioModule.alignVideoPTS = pts;
	}
	/**
	 * @brief Swap SourceNode To Play When before node play end
	 */
	audioModule.swapSource = (sourceIndex = -1, dstIndex = -1) => {
		if (audioModule.startStatus == false) {
			return null
		}
		if (sourceIndex < 0 || sourceIndex >= audioModule.sourceList.length) {
			return null
		}
		if (dstIndex < 0 || dstIndex >= audioModule.sourceList.length) {
			return null
		}
		try {
			console.log("swap source " + sourceIndex + " to " + dstIndex)
			audioModule.sourceList[sourceIndex].disconnect(audioModule.audioCtx.destination)
			audioModule.sourceList[sourceIndex] = null
		} catch (e) {
			console.log("[DEFINE ERROR]disconnect source Index:" + sourceIndex + " error happened!")
			return null
		}
		audioModule.decodeSample(dstIndex, sourceIndex)
	}
	audioModule.addSample = (sampleArr = null) => {
	 	if (sampleArr == null || !sampleArr || sampleArr == undefined) {
	 		return false
	 	}
	 	// if (audioModule.durationMs > 0 
	 	// 	&& sampleArr["pts"] * 1000 >= audioModule.durationMs - 10) {
	 	// 	return true
	 	// }
		audioModule.sampleQueue.push(sampleArr)
	    return true
	}
	/**
	 * @return 
	 * 1 queue length == 0, no frame
	 * 0 OK
	 * -1 sourceIndex out of bounds
	 * -2 decode Error
	 */
	audioModule.decodeSample = (sourceIndex = -1, dstIndex = -1) => {
		audioModule.sourceChannel = sourceIndex;
		if (sourceIndex < 0 || sourceIndex >= audioModule.sourceList.length) {
			return -1
		}
		if (audioModule.sourceList[sourceIndex] == null 
			|| audioModule.sourceList[sourceIndex] == undefined 
			|| !audioModule.sourceList[sourceIndex]) {
			audioModule.sourceList[sourceIndex] = audioModule.audioCtx.createBufferSource()
			audioModule.sourceList[sourceIndex].onended = function() {
				audioModule.swapSource(sourceIndex, dstIndex)
			}
		}
		if (audioModule.sampleQueue.length == 0) {
			audioModule.sourceList[sourceIndex].connect(audioModule.audioCtx.destination)
			audioModule.sourceList[sourceIndex].start()
			audioModule.sourceList[sourceIndex].stop()
			return 1
		}

		// AAC 1frame= 1024*1000000/44100 = 22.2ms
		// ~ 0.02s * 20 ~ 0.4s
		let mergeBuf = null;
		let maxCount = audioModule.sampleQueue.length >= def.DEFAULT_CONSU_SAMPLE_LEN ? def.DEFAULT_CONSU_SAMPLE_LEN : audioModule.sampleQueue.length;

		let addSure 	= false;
		let track 		= audioModule.sampleQueue[0];
		let firstPts 	= track["pts"];
		for (let i = 0; i < maxCount; ) { // i++
			// track = audioModule.sampleQueue[0];
			// let firstPts = track["pts"];
			/*
			 {
				pts: int
				data: Uint8Array
			 }
			 */
			if (addSure == false && audioModule.alignVideoPTS >= 0) {
				let distince = firstPts - audioModule.alignVideoPTS;
				if (
					(distince > 0 && distince <= AUDIO_WAIT)  // < 1 frame
					|| (distince < 0 && (-1 * distince) <= AUDIO_WAIT) // < 1 frame
					|| distince == 0
				) { // OK
					addSure = true;
				} else {
					console.log("audio pts " + firstPts + ",VIDEO_PTS_VAL " + audioModule.alignVideoPTS);
					if (distince > 0) {
						// num: do not continue, or thread will be block
						// console.log("continue await " + firstPts + "," + global.VIDEO_PTS_VAL);

						audioModule.sourceList[sourceIndex].connect(audioModule.audioCtx.destination)
						audioModule.sourceList[sourceIndex].start()
						audioModule.sourceList[sourceIndex].stop()
						return 1
					}

					if (distince < 0) { // throw this frame
						console.log("throw this frame");
						track = audioModule.sampleQueue.shift();
						firstPts = track["pts"];
						// i++
						continue;
					}
				}
			}

			// Feed
			if (track == null) {
				track = audioModule.sampleQueue.shift();
			}
			i++;

			let arrayBuf = null
			if (audioModule.options.appendType == def.APPEND_TYPE_STREAM) {
				arrayBuf = track
			} else { // APPEND_TYPE_FRAME
				arrayBuf = track["data"]
			}

			if (mergeBuf == null) {
				mergeBuf = new Uint8Array(arrayBuf)
			} else {
				let mergeTmp = new Uint8Array(arrayBuf.length + mergeBuf.length)
				mergeTmp.set(mergeBuf, 0)
				mergeTmp.set(arrayBuf, mergeBuf.length)
				mergeBuf = mergeTmp
			}
			if (audioModule.sampleQueue.length <= 0) {
				break;
			}
			track = null;
		}
		let inputBuf = mergeBuf
		// mp3 Windows (pcm count) padding
		/*
		if (mergeBuf.length < 1152) {
			inputBuf = new Uint8Array(1152);
			inputBuf.set(mergeBuf ,0);
		} else {
			inputBuf = mergeBuf;
		}
		*/

		if (inputBuf == null || inputBuf.length < 1) {
			audioModule.sourceList[sourceIndex].connect(audioModule.audioCtx.destination)
			audioModule.sourceList[sourceIndex].start()
			audioModule.sourceList[sourceIndex].stop()
			return 1
		}

		let inputArrayBuffer = inputBuf.buffer
		try {
			audioModule.audioCtx.decodeAudioData(
				inputArrayBuffer, function(buffer) {
					audioModule.sourceList[sourceIndex].buffer = buffer
					audioModule.sourceList[sourceIndex].connect(audioModule.audioCtx.destination)
					audioModule.sourceList[sourceIndex].start()
		    	},
				function(e) {
					"Error with decoding audio data" + e.err
				}
			);
		} catch (e) {
	        alert('Crash[brower]! Please refresh your page')
	        return -2
	    }
		return 0;
	}
	audioModule.play = () => {
		if (audioModule.startStatus == false) {
			audioModule.startStatus = true
			// this.startTime = Date.now();
			audioModule.decodeSample(0, 1)
		}
	}
	audioModule.pause = () => {
		audioModule.startStatus = false;
		if (audioModule.sourceList[audioModule.sourceChannel] != null) {
			audioModule.sourceList[audioModule.sourceChannel].stop()
			audioModule.sourceList[audioModule.sourceChannel].disconnect(audioModule.audioCtx.destination)
			audioModule.sourceList[audioModule.sourceChannel] = null
		}
	}
	audioModule.stop = () => {
		audioModule.pause()
		// audioModule.sampleQueue = []
		audioModule.cleanQueue()
		audioModule.sourceChannel = -1
	}
	audioModule.cleanQueue = () => {
		audioModule.sampleQueue.length = 0
	}
	/* Construct */
	audioModule.sourceList.push(audioModule.audioCtx.createBufferSource())
    audioModule.sourceList.push(audioModule.audioCtx.createBufferSource())
    audioModule.sourceList[0].onended = function() {
    	audioModule.swapSource(0, 1)
    }
    audioModule.sourceList[1].onended = function() {
	    audioModule.swapSource(1, 0)
	}

	return audioModule
}
