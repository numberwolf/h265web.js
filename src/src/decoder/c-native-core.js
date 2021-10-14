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
/* ***************************************************
 *
 * 					CNativeCoreModule
 *
 * ***************************************************/

// const YUVBuffer     = require('yuv-buffer');
// const YUVCanvas     = require('yuv-canvas');
// const Module      = require('./missile.js');
const BUFF_FRAME	= require('../demuxer/bufferFrame');
const BUFFMOD		= require('../demuxer/buffer');
const CacheYUV      = require('./cache');
const CacheYUVStruct= require('./cacheYuv');

const RenderEngine420P 	= require('../render-engine/webgl-420p');
const AVCommon 			= require('./av-common');
const AudioEnginePCM	= require('./audio-native-core');
const AudioModule   	= require('./audio-core');
const def 			= require('../consts');
const VersionModule = require('../version');

const PROBE_SIZE 	= 4524611;
const AU_FMT_READ 	= 10;

const READ_EOF_CODE	= -404;

const VIDEO_CACHE_LEN = 50;
const AUDIO_CACHE_LEN = 200;

const VIDEO_CACHE_WARN_COUNT = 15;
const AUDIO_CACHE_WARN_COUNT = 50;

const CHECK_AU_SAMP_LEN_C_DUR_MS = 1000;
const CHECK_AU_SAMP_RETRY_MAX = 5;

/*
 * Equal Native
 */
// const V_CODEC_NAME_HEVC = 265;
// const V_CODEC_NAME_AVC  = 264;
// const V_CODEC_NAME_UNKN = 500;
// const A_CODEC_NAME_AAC  = 112;
// const A_CODEC_NAME_MP3  = 113;
// const A_CODEC_NAME_UNKN = 500;

// const AVCommon.GetMsTime = () => {
//     return new Date().getTime();
// };

class CNativeVideoFrame {
	constructor(data_y, data_u, data_v, 
    	line1, line2, line3, 
    	width, height, pts) {
		this.pts = pts;
		this.data_y = data_y;
		this.data_u = data_u;
		this.data_v = data_v;
		this.line1 	= line1;
		this.line2 	= line2;
		this.line3 	= line3;
		this.width = width;
		this.height = height;
		// byte align incrment number
		this.byteAlignIncr = this.line1 - this.width;
		// console.log("bytes align:", this.line1, this.width, this.byteAlignIncr);
	}

}

// class CNativeAudioFrame {
// 	constructor(buffer, line1, channel, pts) {
// 		this.buffer = buffer;
// 		this.line1 = line1;
// 		this.channel = channel;
// 		this.pts = pts;
// 	}
// }

class CNativeCoreModule {
	constructor(config) {
		this.config = {
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            token: config.token || null,
            readyShow: config.readyShow || false,
            checkProbe: config.checkProbe,
            ignoreAudio: config.ignoreAudio,
            playMode: config.playMode || def.PLAYER_MODE_VOD,
        };
        // console.log("CNativeCoreModule config ==> ", this.config);
        this.probeSize = PROBE_SIZE;
        // this.audioPlayer = null; // pcm audio player
        this.audioWAudio= null; // web audio aac decoder player
        this.audioVoice	= 1.0;

        /*
         * buf info
         */
        this.frameCallTag	= 0;
        this.seekTarget     = 0;
        this.avSeekVState   = false;
        // this.avSeekAState   = false;
        this.isNewSeek		= false;
        this.openFrameCall 	= true;
        this.bufRecvStat	= false;
        this.bufObject		= BUFFMOD();
        this.bufLastVDTS	= 0.0;
        this.bufLastADTS	= 0.0;
        this.yuvMaxTime		= 0.0;

        /*	
         * 	BufferFrameStruct
         *		constructor(pts, isKey, data, video)
		 *			this.pts 	= pts;
		 *			this.isKey 	= isKey;
		 *			this.data 	= data;
		 */
		// playing data pipeline
        this.playVPipe	= []; // pop from BUFFMOD: bufferFrame
        // this.playAPipe	= [];

        /*
         * Queue YUVFrame
         */
        this._videoQueue = [];

        /*
		 * Attribute
		 */
		this.duration		= -1;
		this.channels 		= -1;
		this.width 			= -1;
		this.height 		= -1;
		this.isPlaying 		= false;
		this.isCheckDisplay = false;
		this.frameTime 		= 1000.0 / this.config.fps; // micro second
		this.vCodecID 		= def.V_CODEC_NAME_UNKN;
		this.audioIdx		= -1;
		this.audioNone		= false;
		this.frameDur		= 0.0;

		this.canvasBox 	= null;
        this.canvas 	= null;
        this.yuv 		= null;

		this.retryAuSampleNo = 0;
		this.cacheStatus	= false;
		this.showScreen		= false;

		this.playPTS		= 0;
		this.vCachePTS		= 0;
		this.aCachePTS		= 0;

        this.reFull         = false; // refull
        this.bufOK          = false;

        /*
         * Interval
         */
        this.avRecvInterval		= null;
        this.avFeedVideoInterval= null;
        this.avFeedAudioInterval= null;
        this.decVFrameInterval 	= null; // cacheLoop
        this.playFrameInterval 	= null;

        /*
         * Event @todo
         */
        this.onProbeFinish		= null;
        this.onPlayingTime 		= null;
        this.onPlayingFinish 	= null;
        this.onSeekFinish 		= null;
        this.onLoadCache 		= null;
        this.onLoadCacheFinshed = null;
        this.onRender 			= null;
        this.onCacheProcess		= null;
        this.onReadyShowDone    = null;

		/*
		 * Init Module
		 */
		// Module['ENVIRONMENT_IS_PTHREAD'] = true;
		this.corePtr = Module.cwrap('AVSniffStreamInit', 
            'number', 
            ['string', 'string'])(this.config.token, VersionModule.PLAYER_VERSION);

        console.log("finish AVSniffStreamInit ,corePtr : ", this.corePtr);

        console.log("start add function probeCallback");
        let probeCallback = Module.addFunction(this._probeFinCallback.bind(this));
        console.log("start add function frameCallback");
        let frameCallback = Module.addFunction(this._frameCallback.bind(this));
        console.log("start add function naluCallback");
        let naluCallback = Module.addFunction(this._naluCallback.bind(this));
        console.log("start add function sampleCallback");
        let sampleCallback = Module.addFunction(this._samplesCallback.bind(this));
        console.log("start add function aacCallback");
        let aacCallback = Module.addFunction(this._aacFrameCallback.bind(this));

        let mode = this.config.playMode === def.PLAYER_MODE_NOTIME_LIVE ? 1 : 0;
        console.log(
            "start add initializeSniffStreamModuleWithAOpt", this.config.ignoreAudio, this.config.playMode, mode);
        let initRet = Module.cwrap('initializeSniffStreamModuleWithAOpt', 'number', 
        	['number', 'number', 'number', 'number', 'number'])(
            this.corePtr, probeCallback, frameCallback, naluCallback, sampleCallback, aacCallback, 
            this.config.ignoreAudio, mode);

        console.log("initRet : ", initRet);
    }

    release() {
        if (this.canvas !== undefined && this.canvas !== null) {
            this.canvas.remove();
            this.canvas = null;
        }

        if (this.playFrameInterval !== null) {
            window.clearInterval(this.playFrameInterval);
            this.playFrameInterval = null;
        }

        if (this.avFeedVideoInterval !== null) {
            window.clearInterval(this.avFeedVideoInterval);
            this.avFeedVideoInterval = null;
        }

        if (this.avFeedAudioInterval !== null) {
            window.clearInterval(this.avFeedAudioInterval);
            this.avFeedAudioInterval = null;
        }

        if (this.avRecvInterval !== null) {
            window.clearInterval(this.avRecvInterval);
            this.avRecvInterval = null;
        }
        this._clearDecInterval();
    	let releaseRet = Module.cwrap(
    		'releaseSniffStream', 'number', ['number'])(this.corePtr);
    	this.audioWAudio && this.audioWAudio.stop();
    	this.audioWAudio = null;

    	this.bufRecvStat = false;

    	this.bufObject.cleanPipeline();

    	this.playVPipe.length = 0;
    	// this.playAPipe.length = 0;
    	return releaseRet;
    }

    setScreen(setVal = false) {
    	this.showScreen = setVal;
        if (this.canvas) {
            if (setVal) {
                this.canvas.setAttribute('hidden', true);
            } else {
                this.canvas.removeAttribute('hidden');
            }
        }
    }

    getCachePTS() {
    	if (this.config.ignoreAudio === 1 || !this.audioWAudio) {
    		return this.vCachePTS;
    	} else {
	    	return Math.max(this.vCachePTS, this.aCachePTS);
	    }
    }

    getMaxPTS() {
    	return Math.max(this.vCachePTS, this.aCachePTS);
    }

    /*
     *
     * Control
     *
     */
    isPlayingState() {
        return this.isPlaying;
    }

    pushDone() {
    	this.pushEOF = true;
    }

    _clearDecInterval() {
        // console.warn("_clearDecInterval RUN");
    	this.decVFrameInterval && window.clearInterval(this.decVFrameInterval);
        this.decVFrameInterval = null;
    }

    _checkPlayFinished() {
        if (this.config.playMode === def.PLAYER_MODE_VOD) {
        	// console.log("CHECK ================> FINISHED PLAY!", 
        	// 	this.duration, this.playPTS, this.frameDur);
        	// if (this.duration - this.playPTS < this.frameDur) { // play finish 2

        	// 已经接收完毕buffer之后看是否是最后一个DTS
        	// 或者看通过时长去想减一下，是否是最后一帧
        	if (
        		( // condition1
    	    		this.bufRecvStat === true && 
    	    		(
    	    			this.playPTS >= this.bufLastVDTS 
    	    			|| (this.audioWAudio && this.playPTS >= this.bufLastADTS)
    	    		)
        		)
        		|| this.duration - this.playPTS < this.frameDur // condition2
        	) { // play finish 2
        		this.pause();
    			this._clearDecInterval();
    			
    			/*
    			* when data eof, but pts < duration
    			* then set pts = duration, let user feel end
    			*/
    			this.onPlayingTime && this.onPlayingTime(this.duration);

    			// this._avFeedData(0);
    			console.warn("================> FINISHED PLAY!");

    			this.onLoadCacheFinshed && this.onLoadCacheFinshed();
    			this.onPlayingFinish && this.onPlayingFinish();
    			return true;
    		}
        }

		return false;
    }

    /**
     * @brief Start play
     */
    play() {
        console.warn("play=========>");
        if (!this.playFrameInterval 
        	|| null === this.playFrameInterval 
        	|| undefined == this.playFrameInterval) {

        	if (this._videoQueue.length > 0) {
        		this.isPlaying = true;
        	}

        	let calcuteStartTime 	= 0;
        	let nowTimestamp 		= 0;
        	let playFrameCostTime 	= 0;

            if (this.config.playMode === def.PLAYER_MODE_NOTIME_LIVE) {
                console.warn("LIVE start play =========>");
            	this.playFrameInterval = window.setInterval(() => {
                    if (this._videoQueue.length > 0) {
                		let videoFrame = this._videoQueue.shift();
                		console.warn("LIVE ==> shift videoFrame.pts play", videoFrame.pts);
                		RenderEngine420P.renderFrame(
        		            this.yuv,
        		            videoFrame.data_y, videoFrame.data_u, videoFrame.data_v,
        		            videoFrame.line1, videoFrame.height);
                    }
            	}, this.frameDur * 1000);
                // }, 1000);
            } else {

    			this.playFrameInterval = window.setInterval(() => {
                    // console.warn("playFrameInterval", 
                    //     nowTimestamp, calcuteStartTime, 
                    //     ">=", 
                    //     this.frameTime, playFrameCostTime);
    				nowTimestamp = AVCommon.GetMsTime();
    				if (this._videoQueue.length > 0) {

    					/*
    					 * Calcute time
    					 */
    					if (nowTimestamp - calcuteStartTime >= this.frameTime - playFrameCostTime) { // play
                            // console.warn("playFrameInterval handle frame");
    						// if (this.playVPipe.length > 0) { // debug
    						// 	console.log("==> shift videoFrame.pts playVPipe length", 
    						// 		this.playVPipe.length, 
    						// 		this.playVPipe[this.playVPipe.length - 1].pts, 
    						// 		this.bufObject.videoBuffer.length);
    						// }
    						let videoFrame = this._videoQueue.shift();
    						// let videoFrame = this._videoQueue[this.playIdx++];

    						let diff = 0;
    						if (!this.isNewSeek 
    							&& this.audioWAudio !== null 
    							&& this.audioWAudio !== undefined) {
    							diff = (videoFrame.pts - this.audioWAudio.getAlignVPTS()) * 1000;
    							// console.warn(
    							// 	"vpts: ", videoFrame.pts,
    							// 	",apts: ", this.audioWAudio.getAlignVPTS(),
    							// 	",diff:", diff);

    							this.playPTS = Math.max(this.audioWAudio.getAlignVPTS(), this.playPTS);
    						}
    						calcuteStartTime = nowTimestamp;
                            console.log("after set calcuteStartTime", calcuteStartTime);

    						let startR = AVCommon.GetMsTime();
    						// console.warn("shift videoFrame.pts", 
    						// 	videoFrame.pts, this.seekTarget, this.isNewSeek);
    						this.playPTS = Math.max(videoFrame.pts, this.playPTS);

    						if (this.isNewSeek 
    							&& this.seekTarget - this.frameDur > videoFrame.pts) {
    							playFrameCostTime = this.frameTime; // 快进呀
    							return;
    						} else { // render
    							if (this.isNewSeek) {
                                    // alert("after seek, play"
                                    //     + ", target:" + this.seekTarget
                                    //     + ", playVPipe pts:" + this.playVPipe[0].pts
                                    //     + ", vpts:" + videoFrame.pts
                                    //     + ", apts:" + this.audioWAudio.getAlignVPTS());
    								this.audioWAudio && this.audioWAudio.setVoice(this.audioVoice);
    								this.audioWAudio && this.audioWAudio.play();
    								playFrameCostTime = 0;
    								// calcuteStartTime = 0;
    								this.isNewSeek = false;
    								this.seekTarget = 0;

    							}

    							// console.warn("TO RENDER videoFrame.pts", videoFrame.pts);

    							if (this.showScreen) { // on render
    								// Render callback
    								this.onRender		&& this.onRender(
    									videoFrame.line1, videoFrame.height, 
    									videoFrame.data_y, videoFrame.data_u, videoFrame.data_v);
    							} else {
                                    console.warn("RenderEngine420P.renderFrame videoFrame.pts", videoFrame.pts);
    								RenderEngine420P.renderFrame(
    									this.yuv,
    									videoFrame.data_y, videoFrame.data_u, videoFrame.data_v,
    									videoFrame.line1, videoFrame.height);
    							}

    							/*
    							 * Event Call
    							 */
    							this.onPlayingTime 	&& this.onPlayingTime(videoFrame.pts);
    						}

    						// 正常播放
    						// Video慢于Audio时候: 小于1帧
    						// Video快于Audio:
    						if (!this.isNewSeek && this.audioWAudio && (
    							(diff < 0 && diff * (-1) <= this.frameTime) 
    							|| diff >= 0
    							)
    						) {
    							// Check Finished
    							// console.log("pts: ", videoFrame.pts, " duration:", this.duration);
                                if (this.config.playMode === def.PLAYER_MODE_VOD) {
        							if (videoFrame.pts >= this.duration) { // play finish 1
        								this.onLoadCacheFinshed && this.onLoadCacheFinshed();
        								this.onPlayingFinish && this.onPlayingFinish();
        								this._clearDecInterval();
        								this.pause();
        							} else {
        								if (this._checkPlayFinished()) { // play finish 2
        									return;
        								}
        							}
                                }
    							/*
    							 * Cost Time
    							 */
    							playFrameCostTime = AVCommon.GetMsTime() - nowTimestamp;
    							// console.log("shift videoFrame.pts 常规", playFrameCostTime);
    						} else if (!this.isNewSeek && this.audioWAudio) {
    							if (diff < 0 && diff * (-1) > this.frameTime) {
    								// Video特别慢于Audio: > 1帧
    								playFrameCostTime = this.frameTime; // 快进呀
    								// console.log("shift videoFrame.pts 快进", this.frameTime);
    							} else { // @TODO
    								playFrameCostTime = this.frameTime;
    								// console.log("shift videoFrame.pts 快进2", this.frameTime);
    							}
    						}

    					} else {
    						console.warn("shift videoFrame.pts 等待");
    					} // end if check play timestamp
    				} else {
                        console.warn("playFrameInterval this._videoQueue.length < 0");
                    } // end if videoQueue > 0

    				if (this._checkPlayFinished()) { // play finish 2
                        // console.warn("native-core FINISHED!");
    					return;
    				}

    			}, 1); // end playFrameInterval
            } // end check playMode
	    } // end if !this.playFrameInterval

	    if (!this.isNewSeek) {
		    this.audioWAudio && this.audioWAudio.play();
		}
    }

    /**
     * @brief Pause play
     */
    pause() {
    	this.isPlaying = false;
    	this._pause();
    }

    _pause() {
    	console.log("=================> pause");
    	this.playFrameInterval && window.clearInterval(this.playFrameInterval);
    	this.playFrameInterval 	= null;
    	this.audioWAudio && this.audioWAudio.pause();
    }

    seek(execCall, options = {}) {
    	this.openFrameCall = false;
    	this.pause();

    	this._clearDecInterval();

    	if (this.avFeedVideoInterval !== null) {
			window.clearInterval(this.avFeedVideoInterval);
    		this.avFeedVideoInterval = null;
    	}

    	if (this.avFeedAudioInterval !== null) {
			window.clearInterval(this.avFeedAudioInterval);
    		this.avFeedAudioInterval = null;
    	}

    	this.yuvMaxTime = 0.0;
    	this.playVPipe.length = 0;
    	this._videoQueue.length = 0;
        this.audioWAudio && this.audioWAudio.stop();

        if (execCall) {
            execCall();
        }

        this.isNewSeek = true;
        this.avSeekVState = true;
        this.seekTarget = options.seekTime;
        if (this.audioWAudio !== null && this.audioWAudio !== undefined) {
            this.audioWAudio.setVoice(0);
            this.audioWAudio.resetStartParam();
            this.audioWAudio.stop();
        }

    	this._avFeedData(options.seekTime);

    	// @TODO 粗暴一点
    	setTimeout(() => {
    		this.yuvMaxTime = 0.0;
    		this._videoQueue.length = 0;
    		this.openFrameCall = true;
    		this.frameCallTag += 1;
    		this._decVFrameIntervalFunc();
    	}, 1000);
    	
    }

    setVoice(voice) {
    	// this.audioPlayer && this.audioPlayer.setVoice(voice);
    	this.audioVoice = voice;
    	this.audioWAudio && this.audioWAudio.setVoice(voice);
    }

    cacheIsFull() {
        return this._videoQueue.length >= VIDEO_CACHE_LEN;
    }

    _checkDisplaySize(realW, widthIn, heightIn) {
    	let align = widthIn - realW;
    	let confWwithAlign = (this.config.width + Math.ceil(align / 2.0)); // 有些内存对齐的像素 需要挤出去 @todo 以后用gl解决

        //console.log("checkDisplaySize==========>", widthIn, heightIn);
        let biggerWidth = widthIn / this.config.width > heightIn / this.config.height;

        let fixedWidth = (confWwithAlign / widthIn).toFixed(2);
        let fixedHeight = (this.config.height / heightIn).toFixed(2);

        // let fixedWidth = (Math.ceil((confWwithAlign / widthIn) * 100) / 100).toFixed(2);
        // let fixedHeight = (Math.ceil((this.config.height / heightIn) * 100) / 100).toFixed(2);

        let scaleRatio = biggerWidth ? fixedWidth : fixedHeight;
        let isFixed = this.config.fixed;
        let width = isFixed ? confWwithAlign : parseInt(widthIn  * scaleRatio);
        let height = isFixed ? this.config.height : parseInt(heightIn * scaleRatio);
        // let width = isFixed ? confWwithAlign : parseInt(Math.ceil(widthIn  * scaleRatio));
        // let height = isFixed ? this.config.height : parseInt(Math.ceil(heightIn * scaleRatio));

        if (this.canvas.offsetWidth != width || this.canvas.offsetHeight != height) {
            let topMargin = parseInt((this.canvasBox.offsetHeight - height) / 2);
            let leftMargin = parseInt((this.canvasBox.offsetWidth - width) / 2);
            topMargin = topMargin < 0 ? 0 : topMargin;
            leftMargin = leftMargin < 0 ? 0 : leftMargin;
            //console.log(topMargin, leftMargin);
            this.canvas.style.marginTop = topMargin + 'px';
            this.canvas.style.marginLeft = leftMargin + 'px';
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }
        this.isCheckDisplay = true;
        return [width, height];
    }

    /*
     *
     * Callback Ptr
     *
     */
    _createYUVCanvas() {
    	this.canvasBox = document.querySelector('#' + this.config.playerId);
    	this.canvasBox.style.overflow = "hidden"; // 多于的像素不显示

    	// first remove all child, clean
        // while (this.canvasBox.hasChildNodes()) {
        //     this.canvasBox.removeChild(this.canvasBox.lastChild);
        // }

    	// second step create view
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = this.canvasBox.clientWidth + 'px';
        this.canvas.style.height = this.canvasBox.clientHeight + 'px';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvasBox.appendChild(this.canvas);

        this.yuv = RenderEngine420P.setupCanvas(this.canvas, {
            preserveDrawingBuffer: false
        });
    }

    /**
     * 解析mp4获取帧数据
     */
    _avRecvPackets() {

    	this.bufObject.cleanPipeline();
    	// this.playVPipe.length = 0;
    	// this.playAPipe.length = 0;

		if (this.avRecvInterval !== null) {
			window.clearInterval(this.avRecvInterval);
			this.avRecvInterval = null;
		}

		// 逻辑判断 性能优化
		if (this.config.checkProbe === true) {
    		this.avRecvInterval = window.setInterval(() => {
    			let decRet = Module.cwrap('getSniffStreamPkg', 'number', ['number'])(this.corePtr);
				// console.log("getSniffStreamPkg decRet : ", decRet);
				this._avCheckRecvFinish();
    		}, 5);
    	} else {
    		this.avRecvInterval = window.setInterval(() => {
    			let decRet = Module.cwrap('getSniffStreamPkgNoCheckProbe', 'number', ['number'])(this.corePtr);
				// console.log("getSniffStreamPkgNoCheckProbe decRet : ", decRet);
				this._avCheckRecvFinish();
    		}, 5);
    	}

    	// test
    	this._avFeedData(0, false);
    }

    /**
     * 检查avRecv是否结束
     */
    _avCheckRecvFinish() {
        if (this.config.playMode === def.PLAYER_MODE_VOD) {
        	// console.log("this.getMaxPTS() >= this.duration ", this.getMaxPTS(), this.duration, this.vCachePTS, this.aCachePTS);
        	let diff = this.duration - this.getMaxPTS();
        	if (diff < this.frameDur) {
        		console.log("break avRecv!");
        		this.bufRecvStat = true;
        		if (this.avRecvInterval !== null) {
    				window.clearInterval(this.avRecvInterval);
    				this.avRecvInterval = null;
                    this.bufOK = true;
    			}
        	}
        }
    }

    _afterAvFeedSeekToStartWithFinishedBuffer(pts) {
        let afterAvFeedSeekToStartInterval = window.setInterval(() => {
            console.log("afterAvFeedSeekToStartInterval length:", this._videoQueue.length);
            // @TODO 最后seek位置剩余帧数不足 VIDEO_CACHE_LEN怎么办
            if (this._videoQueue.length >= VIDEO_CACHE_LEN) {
                this.onSeekFinish && this.onSeekFinish();
                this.onPlayingTime && this.onPlayingTime(pts);
                this.play();
                window.clearInterval(afterAvFeedSeekToStartInterval);
                afterAvFeedSeekToStartInterval = null;
            }
        }, 10);
        return true;
    } // _afterAvFeedSeekToStartWithFinishedBuffer

    _afterAvFeedSeekToStartWithUnFinBuffer(pts) {
    	let afterAvFeedSeekToStartInterval = window.setInterval(() => {
            console.log("afterAvFeedSeekToStartInterval length:", this._videoQueue.length);
    		// @TODO 最后seek位置剩余帧数不足 VIDEO_CACHE_LEN怎么办
    		if (this._videoQueue.length >= VIDEO_CACHE_LEN) {
				this.onSeekFinish && this.onSeekFinish();
                this.onPlayingTime && this.onPlayingTime(pts);
                if (this.reFull === false) {
    				this.play();
                } else {
                    this.reFull = false;
                }
				window.clearInterval(afterAvFeedSeekToStartInterval);
				afterAvFeedSeekToStartInterval = null;
			}
    	}, 10);
    	return true;
    } // _afterAvFeedSeekToStartWithUnFinBuffer

    /**
     * @TODO feed数据流
     * 兼顾Seek能力
     * @param pts: double
     */
    _avFeedData(pts) {
    	this.playVPipe.length = 0;
    	this.audioWAudio && this.audioWAudio.cleanQueue();
    	// this.playAPipe.length = 0;

        // alert("_avFeedData" + pts);

    	// .push(xxx)

    	if (pts <= 0.0 && this.bufOK === false) { // only for start begin
    		// 考虑recv动态
    		// video
    		let videoSecIdx = 0;
    		this.avFeedVideoInterval = window.setInterval(() => {
    			let videoSecLen = this.bufObject.videoBuffer.length;
    			// console.warn("avFeedVideoInterval:", videoSecLen, videoSecIdx, this.getMaxPTS(), this.duration);

    			if ((videoSecLen - 1 > videoSecIdx) 
    			|| (this.duration - this.getMaxPTS() < this.frameDur && videoSecLen - 1 == videoSecIdx)
    			) {
    				let len = this.bufObject.videoBuffer[videoSecIdx].length;
                    if (len > 0) {
    	    			for (let i = 0; i < len; i++) {

    	    				this.playVPipe.push(BUFF_FRAME.ConstructWithDts(
    	    					this.bufObject.videoBuffer[videoSecIdx][i].pts, 
    	    					this.bufObject.videoBuffer[videoSecIdx][i].dts, 
    	    					this.bufObject.videoBuffer[videoSecIdx][i].isKey, 
    	    					this.bufObject.videoBuffer[videoSecIdx][i].data, true));

    	    				// console.warn("=============> ", 
    	    				// 	videoSecIdx,  
    	    				// 	this.bufObject.videoBuffer[videoSecIdx][i].pts, 
    	    				// 	this.bufObject.videoBuffer[videoSecIdx][len - 1].pts, 
    	    				// 	this.playVPipe);
    	    			}
    	    			videoSecIdx += 1;
                    }

	    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                        this.duration - this.getMaxPTS() < this.frameDur &&
	    				this.playVPipe.length > 0 && 
	    				this.playVPipe[this.playVPipe.length - 1].pts >= this.bufLastVDTS) {

	    				window.clearInterval(this.avFeedVideoInterval);
	    				this.avFeedVideoInterval = null;
	    				console.warn("======1=======> V BREAK ", 
                            this.playVPipe[this.playVPipe.length - 1].pts,
                            this.bufLastVDTS, 
                            this.bufObject.videoBuffer,
                            this.playVPipe
                        );
	    			}
	    		} else {
	    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                        this.playVPipe.length > 0 && 
                        this.playVPipe[this.playVPipe.length - 1].pts >= this.duration) { // break

	    				window.clearInterval(this.avFeedVideoInterval);
	    				this.avFeedVideoInterval = null;
	    				console.warn("=======2======> V BREAK ", 
                            this.playVPipe[this.playVPipe.length - 1].pts, 
                            this.duration,
                            this.bufObject.videoBuffer,
                            this.playVPipe);
	    			}
	    		}
                // 2 feed
                if (this.avSeekVState) {
                    console.warn("_afterAvFeedSeekToStartWithFinishedBuffer:", videoSecLen, videoSecIdx, this.getMaxPTS(), this.duration);

                    if (this.config.playMode === def.PLAYER_MODE_VOD) {
                        this._afterAvFeedSeekToStartWithFinishedBuffer(pts);
                        this.avSeekVState = false;
                    }
                } // this.avSeekVState
    		}, 5); // avFeedVideoInterval


    		// audio
    		// console.log("check avFeedAudioInterval:", 
	    	// 			this.audioWAudio, this.config.ignoreAudio);
    		if (this.audioWAudio !== undefined 
                && this.audioWAudio !== null 
                && this.config.ignoreAudio < 1
            ) {
	    		let audioSecIdx = 0;
	    		this.avFeedAudioInterval = window.setInterval(() => {
	    			let audioSecLen = this.bufObject.audioBuffer.length;
	    			// console.log("avFeedAudioInterval 1:", 
	    			// 	this.audioWAudio, audioSecLen, audioSecIdx, this.getMaxPTS(), this.duration);

	    			if ((audioSecLen - 1 > audioSecIdx) 
	    			|| (this.duration - this.getMaxPTS() < this.frameDur && audioSecLen - 1 == audioSecIdx)
	    			) {
	    				let len = this.bufObject.audioBuffer[audioSecIdx].length;
		    			for (let i = 0; i < len; i++) {

		    				this.audioWAudio.addSample(new BUFF_FRAME.BufferFrame(
		    					this.bufObject.audioBuffer[audioSecIdx][i].pts, 
		    					this.bufObject.audioBuffer[audioSecIdx][i].isKey, 
		    					this.bufObject.audioBuffer[audioSecIdx][i].data,
		    					false));

		    				// console.log("=============> ", 
		    				// 	audioSecIdx,  
		    				// 	this.bufObject.audioBuffer[audioSecIdx][i].pts, 
		    				// 	this.bufObject.audioBuffer[audioSecIdx][len - 1].pts, 
		    				// 	this.audioWAudio.sampleQueue);
		    			}
		    			audioSecIdx += 1;

		    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                            this.duration - this.getMaxPTS() < this.frameDur && 
		    				this.audioWAudio.sampleQueue.length > 0 && 
		    				this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts >= this.bufLastADTS) {

		    				window.clearInterval(this.avFeedAudioInterval);
		    				this.avFeedAudioInterval = null;
		    				console.warn("========1=====> A BREAK ", 
		    					this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts, 
		    					this.bufObject.audioBuffer);
		    			}
		    		} else {
		    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                            this.audioWAudio.sampleQueue.length > 0 && 
                            this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts >= this.duration) { // break

		    				window.clearInterval(this.avFeedAudioInterval);
		    				this.avFeedAudioInterval = null;
		    				console.warn("=======2======> A BREAK ", 
		    					this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts, 
		    					this.bufObject.audioBuffer);
		    			}
		    		}
	    		}, 5);
	    	}

    		
    	} else { // seek

    		let realPos = this.bufObject.seekIDR(pts);
    		console.warn("realPos:", realPos, pts);
    		let posInt = parseInt(realPos, 10); // floor
    		this.playPTS = 0;

    		// 考虑recv动态
    		// video

    		let videoSecIdx = posInt;
    		this.avFeedVideoInterval = window.setInterval(() => {
                let videoSecLen = this.bufObject.videoBuffer.length;

                if ((videoSecLen - 1 > videoSecIdx) 
                || (
                    this.duration - this.getMaxPTS() < this.frameDur && videoSecLen - 1 == videoSecIdx
                    )
                ) {
                    let len = this.bufObject.videoBuffer[videoSecIdx].length;
                    // console.warn("avFeedVideoInterval branch 1 ", videoSecIdx, videoSecLen, len);
                    if (len > 0) {
                        // console.warn(
                            // "====> avFeedVideoInterval branch 1 feed ",
                            // videoSecIdx, videoSecLen, len);
                        for (let i = 0; i < len; i++) {
                            this.playVPipe.push(BUFF_FRAME.ConstructWithDts(
                                this.bufObject.videoBuffer[videoSecIdx][i].pts, 
                                this.bufObject.videoBuffer[videoSecIdx][i].dts, 
                                this.bufObject.videoBuffer[videoSecIdx][i].isKey, 
                                this.bufObject.videoBuffer[videoSecIdx][i].data, true));

                            // console.log("=============> ", 
                            //  videoSecIdx,  
                            //  this.bufObject.videoBuffer[videoSecIdx][i].pts, 
                            //  this.bufObject.videoBuffer[videoSecIdx][len - 1].pts, 
                            //  this.playVPipe);
                        }
                        videoSecIdx += 1;
                    }

                    if (this.config.playMode === def.PLAYER_MODE_VOD &&
                        this.duration - this.getMaxPTS() < this.frameDur &&
                        this.playVPipe.length > 0 && 
                        this.playVPipe[this.playVPipe.length - 1].pts >= this.bufLastVDTS) {

                        window.clearInterval(this.avFeedVideoInterval);
                        this.avFeedVideoInterval = null;
                        // alert("======3=======> V BREAK");
                        // console.warn("======3=======> V BREAK ", 
                        //     this.playVPipe[this.playVPipe.length - 1].pts,
                        //     this.bufLastVDTS, 
                        //     this.bufObject.videoBuffer
                        // );
                    }
                } else {
                    console.log("avFeedVideoInterval branch 2 ", videoSecIdx, videoSecLen);
                    if (this.config.playMode === def.PLAYER_MODE_VOD &&
                        this.playVPipe.length > 0 && 
                        this.playVPipe[this.playVPipe.length - 1].pts >= this.duration) { // break

                        window.clearInterval(this.avFeedVideoInterval);
                        this.avFeedVideoInterval = null;
                        // alert("======4=======> V BREAK");
                        // console.warn("=======4======> V BREAK ", 
                        //     this.playVPipe[this.playVPipe.length - 1].pts, 
                        //     this.duration,
                        //     this.bufObject.videoBuffer);
                    }
                }

                // 2 feed
                if (this.avSeekVState) {
                    console.warn(
                        "avFeedVideo_afterAvFeedSeekToStartWithUnFinBufferInterval:", 
                        videoSecLen, videoSecIdx, this.getMaxPTS(), this.duration);

                    if (this.config.playMode === def.PLAYER_MODE_VOD) {
                        this._afterAvFeedSeekToStartWithUnFinBuffer(pts);
                        this.avSeekVState = false;
                    }
                } // this.avSeekVState
    		}, 5); // end video seek


    		// audio
    		if (this.audioWAudio && this.config.ignoreAudio < 1) {
    			let posAudioInt = parseInt(pts, 10); // floor

	    		let audioSecIdx = posAudioInt;
	    		this.avFeedAudioInterval = window.setInterval(() => {
	    			let audioSecLen = this.bufObject.audioBuffer.length;
	    			// console.log("avFeedAudioInterval:", 
	    			// 	audioSecLen, audioSecIdx, this.getMaxPTS(), this.duration);

	    			if ((audioSecLen - 1 > audioSecIdx) 
	    			|| (this.duration - this.getMaxPTS() < this.frameDur && audioSecLen - 1 == audioSecIdx)
	    			) {
	    				let len = this.bufObject.audioBuffer[audioSecIdx].length;
		    			for (let i = 0; i < len; i++) {

		    				let framePts = this.bufObject.audioBuffer[audioSecIdx][i].pts;
		    				if (framePts < this.seekTarget) {
		    					continue;
		    				}

		    				this.audioWAudio.addSample(new BUFF_FRAME.BufferFrame(
		    					this.bufObject.audioBuffer[audioSecIdx][i].pts, 
		    					this.bufObject.audioBuffer[audioSecIdx][i].isKey, 
		    					this.bufObject.audioBuffer[audioSecIdx][i].data,
		    					false));

		    				// console.log("=============> ", 
		    				// 	audioSecIdx,  
		    				// 	this.bufObject.audioBuffer[audioSecIdx][i].pts, 
		    				// 	this.bufObject.audioBuffer[audioSecIdx][len - 1].pts, 
		    				// 	this.audioWAudio.sampleQueue);
		    			}
		    			audioSecIdx += 1;

		    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                            this.duration - this.getMaxPTS() < this.frameDur && 
		    				this.audioWAudio.sampleQueue.length > 0 && 
		    				this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts >= this.bufLastADTS) {

		    				window.clearInterval(this.avFeedAudioInterval);
		    				this.avFeedAudioInterval = null;
		    				// console.warn("======3=======> A BREAK ", 
		    				// 	this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts, 
		    				// 	this.bufObject.audioBuffer);
		    			}
		    		} else {
		    			if (this.config.playMode === def.PLAYER_MODE_VOD &&
                            this.audioWAudio.sampleQueue.length > 0 && 
                            this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts >= this.duration) { // break

		    				window.clearInterval(this.avFeedAudioInterval);
		    				this.avFeedAudioInterval = null;
		    				// console.warn("=======4======> A BREAK ", 
		    				// 	this.audioWAudio.sampleQueue[this.audioWAudio.sampleQueue.length - 1].pts, 
		    				// 	this.bufObject.audioBuffer);
		    			}
		    		}
	    		}, 5);
	    	} // end audio seek

    	}
    }

    _probeFinCallback(duration, width, height, fps,
    	audioIdx,
    	sample_rate, channels, vcodec_name_id, sample_fmt) {
    	// 600 1280 720 25 44100 2 13709528
    	// console.log("_probeFinCallback ===> ", duration, width, height, fps, 
    	// 	sample_rate, channels, sample_fmt);

    	let _this = this;
    	this._createYUVCanvas();

    	console.warn("_probeFinCallback codec name:", 
            vcodec_name_id, def.V_CODEC_NAME_HEVC, duration, fps);

    	this.config.fps = fps * 1.0;
    	this.frameTime 	= 1000.0 / this.config.fps; // micro second
    	this.width 		= width;
    	this.height 	= height;
    	this.frameDur	= 1.0 / this.config.fps;
    	this.duration 	= duration - this.frameDur; // 时长计算都是结束时刻，而每一帧pts是开始时刻，所以要减去1frame time
    	this.vCodecID 	= vcodec_name_id;

    	this.config.sampleRate 	= sample_rate;
    	this.channels 			= channels;
    	this.audioIdx			= audioIdx;

        if (this.duration < 0) {
            this.config.playMode = def.PLAYER_MODE_NOTIME_LIVE;
            console.warn(
                "_probeFinCallback set to live mode", 
                this.frameTime, this.frameDur);
        }

    	// 获取const char*的指针地址这里是, 没长度，但是按照编码规律 读取上10个顶天了
    	// eg fltp s16le s16be s32le s32be
    	// char = uint8 = 8bits = 1Byte
    	const hex = Module.HEAPU8.subarray(sample_fmt, sample_fmt + AU_FMT_READ);
    	let sample_fmt_str = "";
    	for (let i = 0; i < hex.length; i++) {
    		let char = String.fromCharCode(hex[i]);
    		sample_fmt_str += char;
    	}
    	// console.log(sample_fmt_str);
    	// console.log(this);

    	/*
    	 * if not 264 native player
    	 */
    	if (def.V_CODEC_NAME_HEVC === this.vCodecID) {
    		console.log("_probeFinCallback codec is 265!");

	    	/*
	    	 * Audio Player Init
	    	 */
	    	if (audioIdx >= 0 && this.config.ignoreAudio < 1) {
		    	// const audioConfig = {
		    	// 	sampleRate : this.config.sampleRate,
		    	// 	channels : this.channels,
		    	// 	segDur : 3 // @TODO segment duration
		    	// };
		    	// this.audioPlayer = new AudioEnginePCM.AudioPcmPlayer(audioConfig);

		    	if (undefined !== this.audioWAudio && null !== this.audioWAudio) {
		    		this.audioWAudio.stop();
		    		this.audioWAudio = null;
			    }
			    // console.log("create audio = ignoreAudio:", this.config.ignoreAudio < 1);
			    this.audioWAudio = AudioModule({
		            sampleRate: sample_rate,
		            appendType: def.APPEND_TYPE_FRAME
		        });
		        this.audioWAudio.setDurationMs(duration * 1000.0);

		        if (this.onLoadCache) {
		        	this.audioWAudio.setOnLoadCache(() => {
		        		console.log("================> a cachinggggggggg ",_this.retryAuSampleNo, CHECK_AU_SAMP_RETRY_MAX);
		        		if (_this.retryAuSampleNo <= CHECK_AU_SAMP_RETRY_MAX) {
			        		_this.pause();
			        		_this.onLoadCache && _this.onLoadCache();

			        		let checkAudioQueueInterval = window.setInterval(() => {
			        			console.log("================> a cachinggggggggg interval ",
			        				_this.retryAuSampleNo, 
			        				CHECK_AU_SAMP_RETRY_MAX,
			        				_this.audioWAudio.sampleQueue.length);

			        			if (_this.audioWAudio.sampleQueue.length > 2) {

			        				console.log("================> a1 onLoadCacheFinshed");
			        				_this.onLoadCacheFinshed && _this.onLoadCacheFinshed();
			        				_this.play();
			        				_this.retryAuSampleNo = 0;
			        				window.clearInterval(checkAudioQueueInterval);
			        				checkAudioQueueInterval = null;

			        				return;
			        			}
			        			_this.retryAuSampleNo += 1;

			        			if (_this.retryAuSampleNo > CHECK_AU_SAMP_RETRY_MAX) {
			        				_this.play();
			        				console.log("================> a2 onLoadCacheFinshed");
			        				_this.onLoadCacheFinshed && _this.onLoadCacheFinshed();
			        				window.clearInterval(checkAudioQueueInterval);
			        				checkAudioQueueInterval = null;
			        				return;
			        			}
			        		}, CHECK_AU_SAMP_LEN_C_DUR_MS);
			        	}
		        	});
		        }
		    } else {
		    	this.audioNone = true;
		    }

		    this._avRecvPackets();
	    	this._decVFrameIntervalFunc();
    	} else {
    		// h264 native player
            console.log("_probeFinCallback codec is 264!");
    	}

    	this.onProbeFinish && this.onProbeFinish();
    }

    _ptsFixed2(pts) {
    	return Math.ceil(pts * 100.0) / 100.0;
    }

    /**
     * nalu callback
     */
    _naluCallback(data, len, isKey, width, height, pts, dts) {
    	let ptsFixed = this._ptsFixed2(pts);
    	// let dtsFixed = this._ptsFixed2(dts);
    	console.warn("LIVE naluCallback => ", len, isKey, width, height, ptsFixed, dts);

    	let outData = Module.HEAPU8.subarray(data, data + len);
        let bufData = new Uint8Array(outData);
    	this.bufObject.appendFrameWithDts(
    		ptsFixed, dts, bufData, true, isKey);


        this.bufLastVDTS = Math.max(dts, this.bufLastVDTS);

    	// console.log("bufObject=============>");
    	// console.log(this.bufObject.videoBuffer[this.bufObject.videoBuffer.length-1]);
    	// console.log(this.bufObject.audioBuffer);
    	// console.log(this.bufObject.idrIdxBuffer);

    	this.vCachePTS = Math.max(ptsFixed, this.vCachePTS);
	    this.onCacheProcess && this.onCacheProcess(this.getCachePTS());
    }

    // 不用了
    _samplesCallback(buffer, line1, channel, pts) {
    	// let pcm_buf = Module.HEAPU8.subarray(buffer, buffer + line1);
		// let pcm_buf_out = new Uint8Array(pcm_buf);
        // console.log("audio line1", line1);
    	// this.audioPlayer.pushBuffer(pcm_buf_out);
    }

    // @TODO
    _aacFrameCallback(adts, buffer, line1, channel, pts) {
    	let ptsFixed = this._ptsFixed2(pts);
    	if (this.audioWAudio) {
	    	let pcmFrame = new Uint8Array(7 + line1);

	    	let adts_buf = Module.HEAPU8.subarray(adts, adts + 7);
	    	pcmFrame.set(adts_buf, 0);
	    	// let adts_out = new Uint8Array(adts_buf);

	    	let aac_buf = Module.HEAPU8.subarray(buffer, buffer + line1);
	    	pcmFrame.set(aac_buf, 7);

	    	this.bufObject.appendFrame(ptsFixed, pcmFrame, false, true);
        	this.bufLastADTS = Math.max(ptsFixed, this.bufLastADTS);

	    	// let aac_buf_out = new Uint8Array(aac_buf);

	    	// console.log("_aacFrameCallback============>", pcmFrame, pts);
	    	// let sampleObject = {
	    	// 	data: pcmFrame, 
	    	// 	pts: pts
	    	// };
	    	this.aCachePTS = Math.max(ptsFixed, this.aCachePTS);
	    	this.onCacheProcess && this.onCacheProcess(this.getCachePTS());
	    	// this.audioWAudio.addSample(sampleObject);
	    }
    }

    /*
    _decPktIntervalFunc() {
    	// console.log(this._videoQueue.length);

    	if ((this._videoQueue.length < VIDEO_CACHE_WARN_COUNT 
    		|| (this.audioWAudio 
    			&& this.audioWAudio.sampleQueue.length < AUDIO_CACHE_WARN_COUNT))
    	) {
    		if (this.cacheStatus === false) {
	    		this.cacheStatus = true;
	    		this._pause();
	    		this.audioWAudio && console.log("pause===>sampleQueue:", this.audioWAudio.sampleQueue.length);
	    	}
    		this.onLoadCache && this.onLoadCache();
    	}

    	// tmp
    	if (this.config.checkProbe === true) {
			let decRet = Module.cwrap('getSniffStreamPkg', 'number', ['number'])(this.corePtr);
		    console.log("getSniffStreamPkg decRet : ", decRet);
		    if (decRet == READ_EOF_CODE) {
		    	this.readEOF = true;
		    }
		} else {
    		let decRet = Module.cwrap('getSniffStreamPkgNoCheckProbe', 'number', ['number'])(this.corePtr);
		    console.log("getSniffStreamPkgNoCheckProbe decRet : ", decRet);
		    if (decRet == READ_EOF_CODE) {
		    	this.readEOF = true;
		    }
		}

    	if (this.cacheStatus === true) {
    		if (
    			this._videoQueue.length >= VIDEO_CACHE_LEN && 
    			(
    				(this.audioWAudio === null || this.audioWAudio === undefined) || 
    				(this.audioWAudio 
    					&& this.audioWAudio.sampleQueue.length >= AUDIO_CACHE_LEN)
    			)
    		) {
    			this.cacheStatus = false;
    			this.onLoadCacheFinshed && this.onLoadCacheFinshed();
    			if (this.isPlaying) this.play();
    			this.audioWAudio && console.log("play===>sampleQueue:", this.audioWAudio.sampleQueue.length);
    		} else {
				// if (this.config.checkProbe === true) {
				// 	let decRet = Module.cwrap('getSniffStreamPkg', 'number', ['number'])(this.corePtr);
				// 	// console.log("getSniffStreamPkg decRet : ", decRet);
				// 	if (decRet == READ_EOF_CODE) {
				// 		this.readEOF = true;
				// 	}
				// } else {
				// 	let decRet = Module.cwrap('getSniffStreamPkgNoCheckProbe', 'number', ['number'])(this.corePtr);
				// 	// console.log("getSniffStreamPkgNoCheckProbe decRet : ", decRet);
				// 	if (decRet == READ_EOF_CODE) {
				// 		this.readEOF = true;
				// 	}
				// }
    		}
    	}
    }
    */

    _decVFrameIntervalFunc() {
    	if (this.decVFrameInterval == null) {
    		this.decVFrameInterval = window.setInterval(() => {
    			// console.log("decVFrameInterval _videoQueue, playVPipe", this._videoQueue.length, this.playVPipe.length);
    			if (this._videoQueue.length < VIDEO_CACHE_LEN) {
    				// SniffStreamContext *sniffStreamContext,
        			// uint8_t *buff, uint64_t len, long pts
        			if (this.playVPipe.length > 0) {
        				let frame = this.playVPipe.shift(); // nal
        				let nalBuf = frame.data;
        				let offset = Module._malloc(nalBuf.length);
        				Module.HEAP8.set(nalBuf, offset);
        				let ptsMS = parseInt(frame.pts * 1000, 10);
        				let dtsMS = parseInt(frame.dts * 1000, 10);

        				this.yuvMaxTime = Math.max(frame.pts, this.yuvMaxTime);
        				console.warn("+++++decVFrameRet : ", ptsMS, dtsMS);

	    				let decVFrameRet = Module.cwrap('decodeVideoFrame', 
	    					'number', 
	    					['number', 'number', 'number', 'number', 'number'])(
	    					this.corePtr, 
	    					offset, 
	    					nalBuf.length, 
	    					ptsMS,
	    					dtsMS,
	    					this.frameCallTag);
	    				// console.log("---------- to decVFrameRet:", decVFrameRet, ptsMS, this.frameCallTag);

	    				Module._free(offset);
	    				offset = null;
    				}
    			} else {

    			}
    		}, 10);
    	}
    }

    _frameCallback(
    	data_y, data_u, data_v, 
    	line1, line2, line3, 
    	width, height, pts, tag) {

        console.warn(
            "++++++++++++ LIVE _frameCallback successed pts===========",
            pts, this._videoQueue.length);

    	if (this.openFrameCall === false 
    		|| tag !== this.frameCallTag 
    		|| pts > this.yuvMaxTime + this.frameDur) { 
            // 预防seek之后又出现上次的回调尾巴
            // console.log("++++++++++++_frameCallback continue frame call===========", 
                // pts, this._videoQueue.length);
            console.warn("LIVE yuvMaxTime remove CALL YUV");
    		return;
    	}

    	
        if (this.isNewSeek && this.seekTarget - pts > this.frameDur * 3) {
            // console.log(
            // "++++++++++++_frameCallback continue for seek pts===========",
            // pts, this.isNewSeek, this.seekTarget, this._videoQueue.length);
            return;
        }

        

    	// @TODO 暂时加个健壮性判断，如果 pts_new - pts_last > 1.0 ,return
    	let len = this._videoQueue.length;
        // @TODO
    	// if (len > 0 && pts - this._videoQueue[len - 1].pts > 1.0) {
        //     console.warn("LIVE pts - lastPTS > 1.0");
    	// 	   return;
    	// }

    	// check canvas width/height
        if (this.canvas.width != line1 || this.canvas.height != height) {
            this.canvas.width = line1;
            this.canvas.height = height;

			if (!this.isCheckDisplay) { // resize by callback
	            // let displayWH = this._checkDisplaySize(line1, height);
	            let displayWH = this._checkDisplaySize(width, line1, height);
	        }
        }

        if (this.playPTS > pts) {
            console.warn("LIVE playPTS > pts");
        	return;
        }

        

    	// for (let i = 0; i < this._videoQueue.length; i++) {
    	// 	if (this._videoQueue[i].pts === pts) {
    	// 		return;
    	// 	}
    	// }

    	let out_y = Module.HEAPU8.subarray(data_y, data_y + line1 * height);
        let out_u = Module.HEAPU8.subarray(data_u, data_u + (line2 * height) / 2);
        let out_v = Module.HEAPU8.subarray(data_v, data_v + (line3 * height) / 2);
        let buf_y = new Uint8Array(out_y);
        let buf_u = new Uint8Array(out_u);
        let buf_v = new Uint8Array(out_v);
        
        // console.log(out_y, buf_y);
        // console.log(buf_u);
        // console.log(buf_v);

        // let alignCropData = AVCommon.frameDataAlignCrop(
        // 	line1, line2, line3, 
        // 	width, height, buf_y, buf_u, buf_v);
        // console.log(alignCropData);
        // console.log([buf_y, buf_u, buf_v]);

        /*
    	 * readyShow
    	 */
    	if (this.config.readyShow) {
            console.warn("this.config.readyShow --- DEBUG");
    		RenderEngine420P.renderFrame(
	            this.yuv,
	            buf_y, buf_u, buf_v,
	            line1, height);
    		// RenderEngine420P.renderFrame(
	     //        this.yuv,
	     //        alignCropData[0], alignCropData[1], alignCropData[2],
	     //        width, height);
    		this.config.readyShow = false;
            this.onReadyShowDone && this.onReadyShowDone();
    	} // end if readyShow

    	let frameUnit = new CNativeVideoFrame(
	    	buf_y, buf_u, buf_v, 
	    	line1, line2, line3, 
	    	width, height, pts);

    	if (len <= 0 || pts > this._videoQueue[len - 1].pts) {
    		this._videoQueue.push(frameUnit);

    	} else if (pts < this._videoQueue[0].pts) {
    		this._videoQueue.splice(0, 0, frameUnit);

    	} else if (pts < this._videoQueue[len - 1].pts) {

	    	for (let i = 0; i < len; i++) {
	    		if (
	    			pts > this._videoQueue[i].pts && 
	    			(i + 1 < len && pts < this._videoQueue[i + 1].pts)
	    		) {
	    			this._videoQueue.splice(i + 1, 0, frameUnit);
	    			// console.log(i + 1, pts, this._videoQueue);
	    			break;
	    		}
	    	}
	    }

        console.warn("LIVE frameCall videoQueueRet:", this._videoQueue);

	    this.vCachePTS = Math.max(pts, this.vCachePTS);
	    this.onCacheProcess && this.onCacheProcess(this.getCachePTS());
        
    }

    /* ******************************************
     *
     *				Public Core
     *
     * ******************************************/

    // reFull() {
    //     this._avFeedData(0);
    // }

    setProbeSize(size) {
    	this.probeSize = size;
    }

    /**
     * @brief append buffer 
     * @param buffer uint8array
     * @return
     */
    pushBuffer(buffer) {
    	let offset = Module._malloc(buffer.length);
    	Module.HEAP8.set(buffer, offset);
    	let pushRet = Module.cwrap('pushSniffStreamData', 'number', 
        	['number', 'number', 'number', 'number'])(
            this.corePtr, offset, buffer.length, this.probeSize);
        console.log("cnative pushRet : ", pushRet);

        // @TODO
        return pushRet;
    }

}

exports.CNativeCore = CNativeCoreModule;