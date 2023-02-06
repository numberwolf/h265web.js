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
// const AUDIO_WAIT 	= 0.08; // 40ms ~ 2frame, 44100 -> 20ms 22050 40ms
const def = require('../consts');
const AVCommon = require('./av-common');

// const AVCommon.GetMsTime = () => {
// 	return new Date().getTime();
// };

module.exports = () => {
	let audioPcmModule = {
		options: {
			sampleRate: def.DEFAULT_SAMPLERATE,
			appendType: def.APPEND_TYPE_FRAME,
			playMode: def.AUDIO_MODE_SWAP,
		},
		// testdebug: 0,
		sourceChannel: -1,
		audioCtx: new AudioContext({
			latencyHint : "interactive",
			sampleRate 	: def.DEFAULT_SAMPLERATE
		}), // console.log("this.audioContext=%o", _this.audioCtx);
		// biquadFilter: audioPcmModule.audioCtx.createBiquadFilter(),
		// distortion: audioPcmModule.audioCtx.createWaveShaper(),
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
	audioPcmModule.resetStartParam = () => {
		audioPcmModule.playTimestamp = 0.0;
	    audioPcmModule.playStartTime = 0;
	};
	audioPcmModule.setOnLoadCache = (callback) => {
		audioPcmModule.onLoadCache = callback;
	};
	audioPcmModule.setDurationMs = (durationMs = -1) => {
	    audioPcmModule.durationMs = durationMs;
	};
	audioPcmModule.setVoice = (voice = 1.0) => {
		// console.log("playFunc ==> setVoic ", voice);
		audioPcmModule.voice = voice;
		audioPcmModule.gainNode.gain.value = voice;
	};
	audioPcmModule.getAlignVPTS = () => {
		// let pts = audioPcmModule.audioCtx.currentTime - audioPcmModule.lastPlay + audioPcmModule.seekPos;
		// - audioPcmModule.lastPlay 
		// let pts = audioPcmModule.audioCtx.currentTime
		// 		+ audioPcmModule.seekPos;
		// console.log("audio pts:" + audioPcmModule.audioCtx.currentTime);
		// return pts;
		return audioPcmModule.playTimestamp + (AVCommon.GetMsTime() - audioPcmModule.playStartTime) / 1000;
	};
	/**
	 * @brief Swap SourceNode To Play When before node play end
	 */
	audioPcmModule.swapSource = (sourceIndex = -1, dstIndex = -1) => {
		// console.log("audioPcmModule.swapSource", sourceIndex, dstIndex);
		if (audioPcmModule.startStatus == false) {
			return null;
		}
		if (sourceIndex < 0 || sourceIndex >= audioPcmModule.sourceList.length) {
			return null;
		}
		if (dstIndex < 0 || dstIndex >= audioPcmModule.sourceList.length) {
			return null;
		}

		try {
			if (audioPcmModule.sourceChannel === sourceIndex && 
				audioPcmModule.sourceList[sourceIndex] !== null) {

				audioPcmModule.sourceList[sourceIndex].disconnect(audioPcmModule.gainNode);
				audioPcmModule.sourceList[sourceIndex] = null;
			}
		} catch (e) {
			console.error("[DEFINE ERROR] audioPcmModule disconnect source Index:" + sourceIndex + " error happened!", e);
			// return null;
		}

		audioPcmModule.sourceChannel = dstIndex;

		let ret = audioPcmModule.decodeSample(dstIndex, sourceIndex);
		console.log("audioPcmModule in swapSource -> decodeSample ret", ret);
		if (ret == -2 && audioPcmModule.isLIVE) {
			if (audioPcmModule.getAlignVPTS() >= (audioPcmModule.durationMs / 1000.0 - AUDIO_WAIT)) {
				audioPcmModule.pause();
			} else {
				// audioPcmModule.swapSource(dstIndex, sourceIndex);
				if (audioPcmModule.onLoadCache !== null) {
					// console.log("================> audioPcmModule.onLoadCache", audioPcmModule.onLoadCache !== null);
					audioPcmModule.onLoadCache();
				}
			}
		}
	};
	/**
	 * @param sampleObj : {data:Uint8Array, pts:xxx}
	 */
	audioPcmModule.addSample = (sampleObj = null) => {
	 	if (sampleObj == null || !sampleObj || sampleObj == undefined) {
	 		return false;
	 	}

	 	if (audioPcmModule.sampleQueue.length == 0) {
	 		audioPcmModule.seekPos = sampleObj["pts"];
	 	}
	 	// if (audioPcmModule.durationMs > 0
	 	// 	&& sampleObj["pts"] * 1000 >= audioPcmModule.durationMs - 10) {
	 	// 	return true
	 	// }
		audioPcmModule.sampleQueue.push(sampleObj);
		console.log("audioPcmModule sampleQueue:", audioPcmModule.sampleQueue.length);
	    return true;
	};
	audioPcmModule.runNextBuffer = () => {
		window.setInterval(() => {
			if (audioPcmModule.nextBuffer != null 
				|| audioPcmModule.sampleQueue.length < def.DEFAULT_CONSU_SAMPLE_LEN) {
				return;
			}

			audioPcmModule.nextBuffer = {
				data : null,
				pts : -1
			}

			// pack
			let addSure 	= false;
			let track 		= null;
			// let firstPts 	= track["pts"];
			for (let i = 0; i < def.DEFAULT_CONSU_SAMPLE_LEN; i++) { // i++
				// track = audioPcmModule.sampleQueue[0];
				// console.log(track);
				// let firstPts = track["pts"];
				/*
				 {
					pts: int
					data: Uint8Array
				 }
				 */
				// Feed
				track = audioPcmModule.sampleQueue.shift();

				let arrayBuf = null;
				if (audioPcmModule.options.appendType == def.APPEND_TYPE_STREAM) {
					arrayBuf = track;
				} else { // APPEND_TYPE_FRAME
					arrayBuf = track["data"];
				}

				console.log("audioPcmModule arrayBuf ", arrayBuf);

				if (audioPcmModule.nextBuffer.pts < 0) {
					audioPcmModule.nextBuffer.pts = track["pts"];
				}

				if (audioPcmModule.nextBuffer.data == null) {
					audioPcmModule.nextBuffer.data = new Float32Array(arrayBuf);
					console.log("audioPcmModule.nextBuffer.data new ", arrayBuf.length, audioPcmModule.nextBuffer.data.length);
				} else {
					let mergeTmp = new Float32Array(arrayBuf.length + audioPcmModule.nextBuffer.data.length)
					mergeTmp.set(audioPcmModule.nextBuffer.data, 0);
					mergeTmp.set(arrayBuf, audioPcmModule.nextBuffer.data.length);
					audioPcmModule.nextBuffer.data = mergeTmp;
					console.log("audioPcmModule.nextBuffer.data merge ", arrayBuf.length, audioPcmModule.nextBuffer.data.length);
				}
				if (audioPcmModule.sampleQueue.length <= 0) {
					break;
				}
				track = null;
			}

			const len1 = audioPcmModule.nextBuffer.data.length;
			console.log("audioPcmModule.nextBuffer result ", len1);

		}, 10);
	};
	/**
	 * @return
	 * 1 queue length == 0, no frame
	 * 0 OK
	 * -1 sourceIndex out of bounds
	 * -2 decode Error
	 */
	audioPcmModule.decodeSample = (sourceIndex = -1, dstIndex = -1) => {
		console.log("start audioPcmModule.decodeSample", sourceIndex, dstIndex);

		// audioPcmModule.sourceChannel = sourceIndex;
		if (sourceIndex < 0 || sourceIndex >= audioPcmModule.sourceList.length) {
			return -1;
		}

		if (audioPcmModule.sourceList[sourceIndex] == null
			|| audioPcmModule.sourceList[sourceIndex] == undefined
			|| !audioPcmModule.sourceList[sourceIndex]) {
			audioPcmModule.sourceList[sourceIndex] = audioPcmModule.audioCtx.createBufferSource();
			audioPcmModule.sourceList[sourceIndex].onended = function() {
				audioPcmModule.swapSource(sourceIndex, dstIndex);
			};
		}

		if (audioPcmModule.sampleQueue.length == 0) {
			// @todo
			if (audioPcmModule.isLIVE) {
				audioPcmModule.sourceList[sourceIndex].connect(audioPcmModule.gainNode);
				audioPcmModule.sourceList[sourceIndex].start();
				audioPcmModule.sourceList[sourceIndex].onended = function() {
					audioPcmModule.swapSource(sourceIndex, dstIndex);
				};
				audioPcmModule.sourceList[sourceIndex].stop();
				// audioPcmModule.decodeSample(sourceIndex, dstIndex);
				console.log("audioPcmModule.sampleQueue.length is 0, return 0");
				return 0;
			}
			console.log("audioPcmModule.sampleQueue.length is 0, return -2");
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
		if (audioPcmModule.sourceList[sourceIndex].buffer) {
			audioPcmModule.swapSource(sourceIndex, dstIndex);
			return 0;
		}

		if (audioPcmModule.nextBuffer == null || audioPcmModule.nextBuffer.data.length < 1) 
		{
			// console.warn(
			// 			"2 audioPcmModule.sourceList ctx state before", 
			// 			audioPcmModule.sourceList[sourceIndex].context.state);

			audioPcmModule.sourceList[sourceIndex].connect(audioPcmModule.gainNode);
			audioPcmModule.sourceList[sourceIndex].start();
			audioPcmModule.sourceList[sourceIndex].startState = true;
			audioPcmModule.sourceList[sourceIndex].stop();
			console.log("audioPcmModule.nextBuffer is null, return 1");

			// console.warn(
			// 			"2 audioPcmModule.sourceList ctx state after", 
			// 			audioPcmModule.sourceList[sourceIndex].context.state);
			return 1;
		}

		// .buffer.slice(0, out_y.buffer.byteLength)
		// const nextArrBuf = audioPcmModule.nextBuffer.data.buffer;
		const inputArrayBuffer = audioPcmModule.nextBuffer.data;
		// .slice(0, audioPcmModule.nextBuffer.data.buffer.byteLength);
		// alert(inputArrayBuffer.byteLength);
		audioPcmModule.playTimestamp = audioPcmModule.nextBuffer.pts;
		audioPcmModule.playStartTime = AVCommon.GetMsTime();

		console.log("audioPcmModule inputArrayBuffer.pts ", inputArrayBuffer, audioPcmModule.nextBuffer.data, audioPcmModule.playTimestamp);
		try {
			const aud_buf = audioPcmModule.audioCtx.createBuffer(1, inputArrayBuffer.length, audioPcmModule.options.sampleRate);
		    // copy our fetched data to its first channel
		    aud_buf.copyToChannel(inputArrayBuffer, 0);
		    if (audioPcmModule.sourceList[sourceIndex] !== null) {
				audioPcmModule.sourceList[sourceIndex].buffer = aud_buf;
				audioPcmModule.sourceList[sourceIndex].connect(audioPcmModule.gainNode);
				audioPcmModule.sourceList[sourceIndex].start();
				audioPcmModule.sourceList[sourceIndex].startState = true;
			}
		} catch (e) {
			audioPcmModule.nextBuffer = null;
			/*
			audioPcmModule decodeAudioData error TypeError: Failed to execute 'copyToChannel' on 'AudioBuffer': parameter 1 is not of type 'Float32Array'.
			    at Object.decodeSample (dist-play.js:31352:15)
			    at Object.swapSource (dist-play.js:31305:21)
			    at Object.play (dist-play.js:31391:90)
			    at e.value (dist-play.js:32103:57)
			    at e.value (dist-play.js:35276:27)
			    at playAction (dist-play.js:36854:17)
			    at playerDom.onmouseup (dist-play.js:36867:5)
			    */
	        console.log('audioPcmModule decodeAudioData error', e);
	        return -3;
	    }
	    audioPcmModule.nextBuffer = null;
		return 0;
	};
	/**
	 * @return
	 * 1 queue length == 0, no frame
	 * 0 OK
	 * -1 sourceIndex out of bounds
	 * -2 decode Error
	 */
	audioPcmModule.decodeWholeSamples = (sourceIndex = -1) => {
		audioPcmModule.sourceChannel = sourceIndex;
		if (sourceIndex < 0 || sourceIndex >= audioPcmModule.sourceList.length) {
			return -1;
		}
		if (audioPcmModule.sourceList[sourceIndex] == null
			|| audioPcmModule.sourceList[sourceIndex] == undefined
			|| !audioPcmModule.sourceList[sourceIndex]) {
			audioPcmModule.sourceList[sourceIndex] = audioPcmModule.audioCtx.createBufferSource();
			audioPcmModule.sourceList[sourceIndex].onended = function() {
				// audioPcmModule.sourceList[sourceIndex].stop();
			}
		}
		if (audioPcmModule.sampleQueue.length == 0) {
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
		for (let i = 0; i < audioPcmModule.sampleQueue.length; i++) {
			/*
			 {
				pts: double
				data: Uint8Array
			 }
			 */
			// Feed
			track = audioPcmModule.sampleQueue.shift();

			let arrayBuf = null;
			if (audioPcmModule.options.appendType == def.APPEND_TYPE_STREAM) {
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
			if (audioPcmModule.sampleQueue.length <= 0) {
				break;
			}
			track = null;
		}
		let inputBuf = mergeBuf;
		if (inputBuf == null || inputBuf.length < 1) {
			audioPcmModule.sourceList[sourceIndex].connect(audioPcmModule.gainNode);
			audioPcmModule.sourceList[sourceIndex].start();
			audioPcmModule.sourceList[sourceIndex].stop();
			return 1;
		}

		let inputArrayBuffer = inputBuf.buffer;
		try {
			const aud_buf = audioPcmModule.audioCtx.createBuffer(1, inputArrayBuffer.byteLength, audioPcmModule.options.sampleRate);
		    // copy our fetched data to its first channel
		    aud_buf.copyToChannel(inputArrayBuffer, 0);
		    audioPcmModule.sourceList[sourceIndex].buffer = aud_buf;
			audioPcmModule.sourceList[sourceIndex].connect(audioPcmModule.gainNode);
			audioPcmModule.sourceList[sourceIndex].start();
			audioPcmModule.sourceList[sourceIndex].startState = true;
			// console.log(audioPcmModule.sourceList[sourceIndex]);
		} catch (e) {
	        alert('Crash[brower]! Please refresh your page');
	        return -3;
	    }
		return 0;
	};
	audioPcmModule.play = () => {
		console.log("____________________________________audioModule.play");
		if (audioPcmModule.startStatus == false) {
			audioPcmModule.startStatus = true;
			// this.startTime = Date.now();
			let ret = 0;
			if (audioPcmModule.options.playMode == def.AUDIO_MODE_ONCE) {
				ret = audioPcmModule.decodeWholeSamples(0);
			} else {
				// ret = audioPcmModule.decodeSample(0, 1);
				ret = audioPcmModule.swapSource(0, 1);
			}
			if (ret == -2) {
				audioPcmModule.pause();
			}
		}
	};
	audioPcmModule.pause = () => {
		console.log("____________________________________audioModule.pause");
		audioPcmModule.startStatus = false;
		for (let i = 0; i < audioPcmModule.sourceList.length; i++) {
			if (audioPcmModule.sourceList[i] !== undefined 
				&& audioPcmModule.sourceList[i] !== null) 
			{
				console.warn("audio pause", audioPcmModule.sourceList[i], audioPcmModule.gainNode);
				try {
					if (audioPcmModule.sourceList[i].buffer !== undefined 
						&& audioPcmModule.sourceList[i].buffer !== null) 
					{
						audioPcmModule.sourceList[i].stop();
						audioPcmModule.sourceList[i].disconnect(audioPcmModule.gainNode);
					} else {
						console.warn("audio pause buffer is null");
					}
					audioPcmModule.sourceList[i] = null;
				} catch (e) {
					console.error("audio pause error ", e);
				}
			}
		}
	};
	audioPcmModule.stop = () => {
		audioPcmModule.pause();
		// audioPcmModule.sampleQueue = []
		audioPcmModule.cleanQueue();
		audioPcmModule.nextBuffer = null;
		audioPcmModule.sourceChannel = -1;
	};
	audioPcmModule.cleanQueue = () => {
		// audioPcmModule.audioCtx.currentTime = 0;
		audioPcmModule.sampleQueue.length = 0;
		for (let i = 0; i < audioPcmModule.sourceList.length; i++) {
			try {
				if (audioPcmModule.sourceList[i].buffer !== undefined 
					&& audioPcmModule.sourceList[i].buffer !== null) 
				{
					audioPcmModule.sourceList[i].stop();
					audioPcmModule.sourceList[i].disconnect(audioPcmModule.gainNode);
				}
				audioPcmModule.sourceList[i] = null;
			} catch (e) {
				console.log("[SAVE cleanQueue]===>", e);
			}
		}
	};
	/* Construct */
	audioPcmModule.sourceList.push(audioPcmModule.audioCtx.createBufferSource());
    audioPcmModule.sourceList.push(audioPcmModule.audioCtx.createBufferSource());

    audioPcmModule.sourceList[0].onended = function() {
    	// console.log("sourceList onended 0");
    	audioPcmModule.swapSource(0, 1);
    };
    audioPcmModule.sourceList[1].onended = function() {
    	// console.log("sourceList onended 1");
	    audioPcmModule.swapSource(1, 0);
	};
	audioPcmModule.gainNode = audioPcmModule.audioCtx.createGain();
	audioPcmModule.gainNode.gain.value = audioPcmModule.voice;
	audioPcmModule.gainNode.connect(audioPcmModule.audioCtx.destination);

	// @TODO chan =2 hard code
	// audioPcmModule.scriptNode = audioPcmModule.audioCtx.createScriptProcessor(4096, 2, 2);
	// audioPcmModule.scriptNode.connect(audioPcmModule.audioCtx.destination);

	// audioPcmModule.scriptNode.onaudioprocess = (e) => {
	// 	console.log("compare onaudioprocess : ",e);
	// };
	console.log("AUDIO OPTIONS:", audioPcmModule.options);

	audioPcmModule.runNextBuffer();

	return audioPcmModule;
};
