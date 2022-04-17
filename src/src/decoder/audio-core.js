/********************************************************* 
 * LICENSE: LICENSE-Free_CN.MD
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
const AudioContext 	= window.AudioContext || window.webkitAudioContext;
const AUDIO_WAIT 	= 0.04; // 40ms ~ 2frame, 44100 -> 20ms 22050 40ms
const def = require('../consts');
const AVCommon = require('./av-common');

// const AVCommon.GetMsTime = () => {
// 	return new Date().getTime();
// };

module.exports = options => {
	let audioModule = {
		options: {
			sampleRate: options.sampleRate || def.DEFAULT_SAMPLERATE,
			appendType: options.appendType || def.APPEND_TYPE_STREAM,
			playMode: options.playMode || def.AUDIO_MODE_SWAP,
		},
		// testdebug: 0,
		sourceChannel: -1,
		audioCtx: new AudioContext({
			latencyHint : "interactive",
			sampleRate 	: options.sampleRate
		}), // console.log("this.audioContext=%o", _this.audioCtx);
		// biquadFilter: audioModule.audioCtx.createBiquadFilter(),
		// distortion: audioModule.audioCtx.createWaveShaper(),
		// scriptNode: null,
		gainNode: null,
	    sourceList: 	[],
	    startStatus: 	false,
	    sampleQueue: 	[],
	    /*
	     {
			"data" : xxx,
			"pts" : xxx
	     }
	     */
	    nextBuffer: null,
	    playTimestamp: 0.0,
	    playStartTime: 0,
	    durationMs: 	-1,
	    isLIVE: false,
		// voice 0.0 ~ 1.0
		voice: 1.0,
		onLoadCache: null
	};
	audioModule.resetStartParam = () => {
		audioModule.playTimestamp = 0.0;
	    audioModule.playStartTime = 0;
	};
	audioModule.setOnLoadCache = (callback) => {
		audioModule.onLoadCache = callback;
	};
	audioModule.setDurationMs = (durationMs = -1) => {
	    audioModule.durationMs = durationMs;
	};
	audioModule.setVoice = (voice = 1.0) => {
		console.log("playFunc ==> setVoic ", voice);
		audioModule.voice = voice;
		audioModule.gainNode.gain.value = voice;
	};
	audioModule.getAlignVPTS = () => {
		// let pts = audioModule.audioCtx.currentTime - audioModule.lastPlay + audioModule.seekPos;
		// - audioModule.lastPlay 
		// let pts = audioModule.audioCtx.currentTime
		// 		+ audioModule.seekPos;
		// console.log("audio pts:" + audioModule.audioCtx.currentTime);
		// return pts;
		return audioModule.playTimestamp + (AVCommon.GetMsTime() - audioModule.playStartTime) / 1000;
	};
	/**
	 * @brief Swap SourceNode To Play When before node play end
	 */
	audioModule.swapSource = (sourceIndex = -1, dstIndex = -1) => {
		console.log("audioModule.swapSource", sourceIndex, dstIndex);
		if (audioModule.startStatus == false) {
			return null;
		}
		if (sourceIndex < 0 || sourceIndex >= audioModule.sourceList.length) {
			return null;
		}
		if (dstIndex < 0 || dstIndex >= audioModule.sourceList.length) {
			return null;
		}

		try {
			if (audioModule.sourceChannel === sourceIndex && 
				audioModule.sourceList[sourceIndex] !== null) {

				audioModule.sourceList[sourceIndex].disconnect(audioModule.gainNode);
				audioModule.sourceList[sourceIndex] = null;
			}
		} catch (e) {
			console.error("[DEFINE ERROR] audioModule disconnect source Index:" + sourceIndex + " error happened!", e);
			// return null;
		}

		audioModule.sourceChannel = dstIndex;

		let ret = audioModule.decodeSample(dstIndex, sourceIndex);
		// console.log("in swapSource -> decodeSample ret", ret);
		if (ret == -2 && audioModule.isLIVE) {
			if (audioModule.getAlignVPTS() >= (audioModule.durationMs / 1000.0 - AUDIO_WAIT)) {
				audioModule.pause();
			} else {
				// audioModule.swapSource(dstIndex, sourceIndex);
				if (audioModule.onLoadCache !== null) {
					// console.log("================> audioModule.onLoadCache", audioModule.onLoadCache !== null);
					audioModule.onLoadCache();
				}
			}
		}
	};
	/**
	 * @param sampleObj : {data:Uint8Array, pts:xxx}
	 */
	audioModule.addSample = (sampleObj = null) => {
	 	if (sampleObj == null || !sampleObj || sampleObj == undefined) {
	 		return false;
	 	}

	 	if (audioModule.sampleQueue.length == 0) {
	 		audioModule.seekPos = sampleObj["pts"];
	 	}
	 	// if (audioModule.durationMs > 0
	 	// 	&& sampleObj["pts"] * 1000 >= audioModule.durationMs - 10) {
	 	// 	return true
	 	// }
		audioModule.sampleQueue.push(sampleObj);
		// console.log(audioModule.sampleQueue.length);
	    return true;
	};
	audioModule.runNextBuffer = () => {
		window.setInterval(() => {
			if (audioModule.nextBuffer != null 
				|| audioModule.sampleQueue.length < def.DEFAULT_CONSU_SAMPLE_LEN) {
				return;
			}

			audioModule.nextBuffer = {
				data : null,
				pts : -1
			}

			// pack
			let addSure 	= false;
			let track 		= null;
			// let firstPts 	= track["pts"];
			for (let i = 0; i < def.DEFAULT_CONSU_SAMPLE_LEN; i++) { // i++
				// track = audioModule.sampleQueue[0];
				// console.log(track);
				// let firstPts = track["pts"];
				/*
				 {
					pts: int
					data: Uint8Array
				 }
				 */
				// Feed
				track = audioModule.sampleQueue.shift();

				let arrayBuf = null;
				if (audioModule.options.appendType == def.APPEND_TYPE_STREAM) {
					arrayBuf = track;
				} else { // APPEND_TYPE_FRAME
					arrayBuf = track["data"];
				}

				if (audioModule.nextBuffer.pts < 0) {
					audioModule.nextBuffer.pts = track["pts"];
				}

				if (audioModule.nextBuffer.data == null) {
					audioModule.nextBuffer.data = new Uint8Array(arrayBuf);
				} else {
					let mergeTmp = new Uint8Array(arrayBuf.length + audioModule.nextBuffer.data.length)
					mergeTmp.set(audioModule.nextBuffer.data, 0);
					mergeTmp.set(arrayBuf, audioModule.nextBuffer.data.length);
					audioModule.nextBuffer.data = mergeTmp;
				}
				if (audioModule.sampleQueue.length <= 0) {
					break;
				}
				track = null;
			}

		}, 10);
	};
	/**
	 * @return
	 * 1 queue length == 0, no frame
	 * 0 OK
	 * -1 sourceIndex out of bounds
	 * -2 decode Error
	 */
	audioModule.decodeSample = (sourceIndex = -1, dstIndex = -1) => {
		// console.log("start audioModule.decodeSample", sourceIndex, dstIndex);

		// audioModule.sourceChannel = sourceIndex;
		if (sourceIndex < 0 || sourceIndex >= audioModule.sourceList.length) {
			return -1;
		}

		if (audioModule.sourceList[sourceIndex] == null
			|| audioModule.sourceList[sourceIndex] == undefined
			|| !audioModule.sourceList[sourceIndex]) {
			audioModule.sourceList[sourceIndex] = audioModule.audioCtx.createBufferSource();
			audioModule.sourceList[sourceIndex].onended = function() {
				audioModule.swapSource(sourceIndex, dstIndex);
			};
		}

		if (audioModule.sampleQueue.length == 0) {
			// @todo
			if (audioModule.isLIVE) {
				audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
				audioModule.sourceList[sourceIndex].start();
				audioModule.sourceList[sourceIndex].onended = function() {
					audioModule.swapSource(sourceIndex, dstIndex);
				};
				audioModule.sourceList[sourceIndex].stop();
				// audioModule.decodeSample(sourceIndex, dstIndex);
				console.log("audioModule.sampleQueue.length is 0, return 0");
				return 0;
			}
			console.log("audioModule.sampleQueue.length is 0, return -2");
			return -2;
		}

		// AAC 1frame= 1024*1000000/44100/1000 = 23.2ms
		// ~ 0.02s * 20 ~ 0.4s

		// mp3 Windows (pcm count) padding
		/*
		if (mergeBuf.length < 1152) {
			inputBuf = new Uint8Array(1152);
			inputBuf.set(mergeBuf ,0);
		} else {
			inputBuf = mergeBuf;
		}
		*/

		// 如果有buffer提前释放播放了
		if (audioModule.sourceList[sourceIndex].buffer) {
			console.log("audioModule play clear not buffer");
			console.log(
				audioModule.sourceList[sourceIndex], 
				audioModule.sourceList[dstIndex],
				audioModule.gainNode);

			// audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
			// if (audioModule.sourceList[sourceIndex].startState === true) {
			// 	audioModule.sourceList[sourceIndex].stop();
			// } else {
			// 	audioModule.sourceList[sourceIndex].start();
			// 	audioModule.sourceList[sourceIndex].startState = true;
			// }
			audioModule.swapSource(sourceIndex, dstIndex);
			return 0;
		}

		if (audioModule.nextBuffer == null || audioModule.nextBuffer.data.length < 1) 
		{
			// console.warn(
			// 			"2 audioModule.sourceList ctx state before", 
			// 			audioModule.sourceList[sourceIndex].context.state);

			audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
			audioModule.sourceList[sourceIndex].start();
			audioModule.sourceList[sourceIndex].startState = true;
			audioModule.sourceList[sourceIndex].stop();
			// console.log("audioModule.nextBuffer is null, return 1");

			// console.warn(
			// 			"2 audioModule.sourceList ctx state after", 
			// 			audioModule.sourceList[sourceIndex].context.state);
			return 1;
		}

		let inputArrayBuffer = audioModule.nextBuffer.data.buffer;
		audioModule.playTimestamp = audioModule.nextBuffer.pts;
		audioModule.playStartTime = AVCommon.GetMsTime();

		// console.log("audioModule inputArrayBuffer.pts ", audioModule.playTimestamp);
		try {

			audioModule.audioCtx.decodeAudioData(
				inputArrayBuffer, function(buffer) {
					// audioModule.testdebug ++;
					// if (audioModule.sourceList[sourceIndex].context.state == "running") {
						// try {
						// 	audioModule.sourceList[sourceIndex].stop();
						// } catch(error) {
						// 	console.error("audio stop error", error);
						// }
					// }
					// console.warn(
					// 	"3 audioModule.sourceList ctx state before", 
					// 	// audioModule.sourceList[sourceIndex],
					// 	audioModule.sourceList[sourceIndex].context.state);

					// if (audioModule.sourceList[sourceIndex] === null) {
					// }
					if (audioModule.sourceList[sourceIndex] !== null) {
						audioModule.sourceList[sourceIndex].buffer = buffer;
						audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
						audioModule.sourceList[sourceIndex].start();
						audioModule.sourceList[sourceIndex].startState = true;
					}
					// console.log(audioModule.sourceList[sourceIndex]);

					// console.warn(
					// 	"3 audioModule.sourceList ctx state after", 
					// 	audioModule.sourceList[sourceIndex].context.state);
		    	},
				function(e) {
					console.log("Error with decoding audio data", e);
				}
			);
		} catch (e) {
			audioModule.nextBuffer = null;
	        console.log('decodeAudioData error', e);
	        return -3;
	    }
	    audioModule.nextBuffer = null;
		return 0;
	};
	/**
	 * @return
	 * 1 queue length == 0, no frame
	 * 0 OK
	 * -1 sourceIndex out of bounds
	 * -2 decode Error
	 */
	audioModule.decodeWholeSamples = (sourceIndex = -1) => {
		audioModule.sourceChannel = sourceIndex;
		if (sourceIndex < 0 || sourceIndex >= audioModule.sourceList.length) {
			return -1;
		}
		if (audioModule.sourceList[sourceIndex] == null
			|| audioModule.sourceList[sourceIndex] == undefined
			|| !audioModule.sourceList[sourceIndex]) {
			audioModule.sourceList[sourceIndex] = audioModule.audioCtx.createBufferSource();
			audioModule.sourceList[sourceIndex].onended = function() {
				// audioModule.sourceList[sourceIndex].stop();
			}
		}
		if (audioModule.sampleQueue.length == 0) {
			return -2;
		}
		// AAC 1frame= 1024*1000000/44100/1000 = 23.2ms
		// ~ 0.02s * 20 ~ 0.4s
		let mergeBuf = null;

		let addSure 	= false;
		/*
		 * {
		 *		pts: double
		 *		data: Uint8Array
		 *	}
		 */
		let track 		= null;
		// let firstPts 	= track["pts"];
		for (let i = 0; i < audioModule.sampleQueue.length; i++) {
			/*
			 {
				pts: double
				data: Uint8Array
			 }
			 */
			// Feed
			track = audioModule.sampleQueue.shift();

			let arrayBuf = null;
			if (audioModule.options.appendType == def.APPEND_TYPE_STREAM) {
				arrayBuf = track;
			} else { // APPEND_TYPE_FRAME
				arrayBuf = track["data"];
			}

			if (mergeBuf == null) {
				mergeBuf = new Uint8Array(arrayBuf);
			} else {
				let mergeTmp = new Uint8Array(arrayBuf.length + mergeBuf.length)
				mergeTmp.set(mergeBuf, 0);
				mergeTmp.set(arrayBuf, mergeBuf.length);
				mergeBuf = mergeTmp;
			}
			if (audioModule.sampleQueue.length <= 0) {
				break;
			}
			track = null;
		}
		let inputBuf = mergeBuf;
		if (inputBuf == null || inputBuf.length < 1) {
			audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
			audioModule.sourceList[sourceIndex].start();
			audioModule.sourceList[sourceIndex].stop();
			return 1;
		}

		let inputArrayBuffer = inputBuf.buffer;
		try {
			audioModule.audioCtx.decodeAudioData(
				inputArrayBuffer, function(buffer) {
					console.warn(
						"audioModule.sourceList ctx state before", 
						audioModule.sourceList[sourceIndex].state);

					audioModule.sourceList[sourceIndex].buffer = buffer;
					audioModule.sourceList[sourceIndex].connect(audioModule.gainNode);
					audioModule.sourceList[sourceIndex].start();
					audioModule.sourceList[sourceIndex].startState = true;
					// console.log(audioModule.sourceList[sourceIndex]);

					console.warn(
						"audioModule.sourceList ctx state after", 
						audioModule.sourceList[sourceIndex].state);
		    	},
				function(e) {
					"Error with decoding audio data" + e.err;
				}
			);
		} catch (e) {
	        alert('Crash[brower]! Please refresh your page');
	        return -3;
	    }
		return 0;
	};
	audioModule.play = () => {
		console.log("____________________________________audioModule.play");
		if (audioModule.startStatus == false) {
			audioModule.startStatus = true;
			// this.startTime = Date.now();
			let ret = 0;
			if (audioModule.options.playMode == def.AUDIO_MODE_ONCE) {
				ret = audioModule.decodeWholeSamples(0);
			} else {
				// ret = audioModule.decodeSample(0, 1);
				ret = audioModule.swapSource(0, 1);
			}
			if (ret == -2) {
				audioModule.pause();
			}
		}
	};
	audioModule.pause = () => {
		console.log("____________________________________audioModule.pause");
		audioModule.startStatus = false;
		for (let i = 0; i < audioModule.sourceList.length; i++) {
			if (audioModule.sourceList[i] !== undefined 
				&& audioModule.sourceList[i] !== null) 
			{
				console.warn("audio pause", audioModule.sourceList[i], audioModule.gainNode);
				try {
					if (audioModule.sourceList[i].buffer !== undefined 
						&& audioModule.sourceList[i].buffer !== null) 
					{
						audioModule.sourceList[i].stop();
						audioModule.sourceList[i].disconnect(audioModule.gainNode);
					} else {
						console.warn("audio pause buffer is null");
					}
					audioModule.sourceList[i] = null;
				} catch (e) {
					console.error("audio pause error ", e);
				}
			}
		}
	};
	audioModule.stop = () => {
		audioModule.pause();
		// audioModule.sampleQueue = []
		audioModule.cleanQueue();
		audioModule.nextBuffer = null;
		audioModule.sourceChannel = -1;
	};
	audioModule.cleanQueue = () => {
		// audioModule.audioCtx.currentTime = 0;
		audioModule.sampleQueue.length = 0;
		for (let i = 0; i < audioModule.sourceList.length; i++) {
			try {
				if (audioModule.sourceList[i].buffer !== undefined 
					&& audioModule.sourceList[i].buffer !== null) 
				{
					audioModule.sourceList[i].stop();
					audioModule.sourceList[i].disconnect(audioModule.gainNode);
				}
				audioModule.sourceList[i] = null;
			} catch (e) {
				console.log("[SAVE cleanQueue]===>", e);
			}
		}
	};
	/* Construct */
	audioModule.sourceList.push(audioModule.audioCtx.createBufferSource());
    audioModule.sourceList.push(audioModule.audioCtx.createBufferSource());

    audioModule.sourceList[0].onended = function() {
    	console.log("sourceList onended 0");
    	audioModule.swapSource(0, 1);
    };
    audioModule.sourceList[1].onended = function() {
    	console.log("sourceList onended 1");
	    audioModule.swapSource(1, 0);
	};
	audioModule.gainNode = audioModule.audioCtx.createGain();
	audioModule.gainNode.gain.value = audioModule.voice;
	audioModule.gainNode.connect(audioModule.audioCtx.destination);

	// @TODO chan =2 hard code
	// audioModule.scriptNode = audioModule.audioCtx.createScriptProcessor(4096, 2, 2);
	// audioModule.scriptNode.connect(audioModule.audioCtx.destination);

	// audioModule.scriptNode.onaudioprocess = (e) => {
	// 	console.log("compare onaudioprocess : ",e);
	// };
	console.log("AUDIO OPTIONS:", audioModule.options);

	audioModule.runNextBuffer();

	return audioModule;
}
