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
const M3U8Base = require('./m3u8base');
const MPEG_JS = require('./mpegts/mpeg.js');
const BUFFER_FRAME = require('./bufferFrame');
const BUFFMOD = require('./buffer');
const HEVC_IMP = require('../decoder/hevc-imp');
const def = require('../consts');

class M3u8ParserModule {
	constructor() {
		this.hls = new M3U8Base.M3u8Base();
		this.mpegTsObj = new MPEG_JS.MPEG_JS({});
		this.mpegTsWasmState = false;
		this.mpegTsWasmRetryLoadTimes = 0;

		this.tsList = [];
		this.vStartTime = 0;
		this.aStartTime = 0;
		this.lockWait = {
			state : false,
			lockMember : {
				dur : 0
			}
		};
		this.timerFeed = null;
		this.timerTsWasm = null;

		this.seekPos       	= -1;
		this.vPreFramePTS	= 0;
		this.aPreFramePTS	= 0;

		this.audioNone		= false;
		this.isHevcParam	= false;
		this.vCodec			= false;
		this.aCodec			= false;
		this.aChannel		= 0;
	    this.durationMs    	= -1.0;
		this.bufObject 		= BUFFMOD();
		this.fps           	= -1;
	    this.sampleRate    	= -1;
	    this.size          	= {
	        width   : -1,
	        height  : -1
	    };
	    this.mediaInfo 	= null;
    	this.extensionInfo = null;

    	// event
    	this.onReadyOBJ = null;
    	this.onFinished = null;
    	this.onDemuxed = null;
    	this.onSamples = null;
    	this.onCacheProcess = null;
	}

	getCachePTS() {
		return Math.max(this.vPreFramePTS, this.aPreFramePTS);
	}

	// time onFinish -> onDemuxed
	demux(videoURL) {
		let _this = this;
		this.vPreFramePTS = 0.0;
		this.aPreFramePTS = 0.0;

		this.hls.onTransportStream = (streamURI, streamDur) => {
			console.warn("Event onTransportStream ===> ", streamURI, streamDur, _this.lockWait.state, _this.tsList.length);
			// demuxURL(streamURI);
			_this.tsList.push({
				streamURI : streamURI,
				streamDur : streamDur
			});
		};

		this.hls.onFinished = (callFinData) => {
			// console.log("onFinished : ");
			// console.log(callFinData);

			if (callFinData.type == def.PLAYER_IN_TYPE_M3U8_VOD) {
				_this.durationMs = callFinData.duration * 1000;
			} else {
				_this.durationMs = -1;
			}

			if (_this.onFinished != null) {
				_this.onFinished(_this.onReadyOBJ, callFinData);
			}
		};

		this.mpegTsObj.onDemuxedFailed = (error, url) => {
			console.error("onDemuxedFailed: ", error, url);
			_this.lockWait.state = false;
		};

		this.mpegTsObj.onDemuxed = () => {
			console.warn("this.mpegTsObj.onDemuxed");
			if (_this.mediaInfo == null) {
				_this.mediaInfo = _this.mpegTsObj.readMediaInfo();
				console.log("mediaInfo: ",_this.mediaInfo);

				_this.isHevcParam	= _this.mpegTsObj.isHEVC();
				_this.vCodec		= _this.mpegTsObj.vCodec;
				_this.aCodec		= _this.mediaInfo.aCodec;
				_this.aChannel		= _this.mediaInfo.sampleChannel;
				// _this.durationMs 	= _this.mediaInfo.duration * 1000;
	            _this.fps 			= _this.mediaInfo.vFps;
	            _this.sampleRate 	= _this.mediaInfo.sampleRate;
	            // console.log("samplerate:" + _this.sampleRate);

	            if (_this.aCodec === null || _this.aCodec === "" 
	            	|| _this.aChannel <= 0) {
	            	_this.audioNone = true;
	            }
	        }
	        if (_this.extensionInfo == null) {
	        	_this.extensionInfo = _this.mpegTsObj.readExtensionInfo();
	            if (_this.extensionInfo.vWidth > 0 && _this.extensionInfo.vHeight > 0) {
	            	_this.size.width = _this.extensionInfo.vWidth;
	            	_this.size.height = _this.extensionInfo.vHeight;
	            }
	        }

			console.log("DURATION===>" + _this.mediaInfo.duration);

			if (_this.onDemuxed != null) {
            	_this.onDemuxed(_this.onReadyOBJ);
            }

            let firstPts = -1;
            let needIncrStart = false;
	        while(1) {
	        	if (_this.mpegTsObj === undefined || _this.mpegTsObj === null) {
	        		break;
	        	}
	            let readData = _this.mpegTsObj.readPacket();
	            console.log("readData=>", readData);
	            if (readData.size <= 0) {
	                break;
	            }
	            let pts = readData.dtime > 0 ? readData.dtime : readData.ptime;
	            if (pts < 0) {
	            	continue;
	            }
	            // console.log(pts);
	            if (readData.type == 0) {
	            	if (firstPts < 0 && pts <= _this.vPreFramePTS) {
		            	needIncrStart = true;
		            }
	            	// console.log("vStartTime:" + _this.vStartTime);
	            	// console.log(pts + _this.vStartTime);

	            	let pktFrame = HEVC_IMP.PACK_NALU(readData.layer);
                	let isKey = readData.keyframe == 1 ? true : false;
                	let vPts = needIncrStart == true ? pts + _this.vStartTime : pts;

                	let bufFrame = new BUFFER_FRAME.BufferFrame(vPts, isKey, pktFrame, true);
                	_this.bufObject.appendFrame(bufFrame.pts, bufFrame.data, true, bufFrame.isKey);
                	_this.vPreFramePTS = vPts;

                	if (_this.onSamples != null) _this.onSamples(_this.onReadyOBJ, bufFrame);

	            } else {
	            	if (firstPts < 0 && pts <= _this.aPreFramePTS) {
		            	needIncrStart = true;
		            }
	            	// console.log(pts + aStartTime);
	            	if (_this.mediaInfo.aCodec == "aac") {
                		// console.log(readData.data);
                		let aacDataList = readData.data;

                		// let debugData = null;
                		// let tempIdx = 0;
                		// AAC 多片 不能直接引用同一个对象修改，不然会发生内存地址错误问题 播放错误
                		for (var i = 0; i < aacDataList.length; i++) {
                			let aacDataItem = aacDataList[i];
                			// let aacPts = aacDataItem.ptime + _this.vStartTime;
		                	// let aacData = aacDataItem.data;
		                	let aPts = needIncrStart == true ? aacDataItem.ptime + _this.vStartTime : pts;
		                	let bufFrame = new BUFFER_FRAME.BufferFrame(aPts, true, aacDataItem.data, false);

                			_this.bufObject.appendFrameByBufferFrame(bufFrame);
                			_this.aPreFramePTS = aPts;
                			if (_this.onSamples != null) _this.onSamples(_this.onReadyOBJ, bufFrame);
                			// console.log(bufFrame);
                		}
                		// _this.bufObject.appendFrame(readData.ptime, readData.src, false, true);
                	} else {
                		// bufFrame.pts = pts + _this.vStartTime;
	                	// bufFrame.data = readData.data;
	                	// bufFrame.isKey = true;
	                	// bufFrame.video = false;

	                	let aPts = needIncrStart == true ? pts + _this.vStartTime : pts;
	                	let bufFrame = new BUFFER_FRAME.BufferFrame(aPts, true, readData.data, false);

                		_this.bufObject.appendFrameByBufferFrame(bufFrame);
                		_this.aPreFramePTS = aPts;
                		if (_this.onSamples != null) _this.onSamples(_this.onReadyOBJ, bufFrame);
                	}
	            }

	            // console.log("media cache pts:", this.getCachePTS());
	            this.onCacheProcess && this.onCacheProcess(this.getCachePTS());
	        }
	        // vStartTime += mediaInfo.vDuration;
	        // aStartTime += mediaInfo.aDuration;
	        // console.log(_this.lockWait.lockMember.dur);
	        _this.vStartTime += parseFloat(_this.lockWait.lockMember.dur);
	        _this.aStartTime += parseFloat(_this.lockWait.lockMember.dur);
	        console.log("vStartTime:" + _this.vStartTime);
	        _this.lockWait.state = false;
	    };

		this.mpegTsObj.onReady = () => {
	        _this._onTsReady(videoURL);
	    };

	    _this.mpegTsObj.initDemuxer();

	    this.timerTsWasm = window.setInterval(() => {
	    	if (!_this.mpegTsWasmState) {
	    		if (_this.mpegTsWasmRetryLoadTimes >= 3) {
	    			_this._onTsReady(videoURL);
	    			window.clearInterval(_this.timerTsWasm);
		    		_this.timerTsWasm = null;
	    		} else {
		    		console.log("retry request wasm");
		    		_this.mpegTsWasmRetryLoadTimes += 1;
			    	_this.mpegTsObj.initDemuxer();
			    }
		    } else {
		    	window.clearInterval(_this.timerTsWasm);
		    	_this.timerTsWasm = null;
		    }
	    }, 3000);
	}

	_onTsReady(videoURL) {
		let _this = this;
		console.log("mpegts onReady");
		_this.hls.fetchM3u8(videoURL);
		_this.mpegTsWasmState = true;

		_this.timerFeed = window.setInterval(() => {
	    	if (_this.tsList.length > 0 && _this.lockWait.state == false) 
	    	{
	    		try {
		    		let item = _this.tsList.shift();
		    		if (item !== undefined && item !== null) {
			    		let itemURI = item.streamURI;
			    		let itemDur = item.streamDur;

			    		console.warn("_onTsReady Vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv> ENTRY " + itemURI);
			    		_this.lockWait.state = true;
			    		_this.lockWait.lockMember.dur = itemDur;
			    		_this.mpegTsObj.isLive = _this.hls.isLive();
			    		_this.mpegTsObj.demuxURL(itemURI);

			    	} else {
			    		console.error("_onTsReady need wait ");
			    	}
		    	} catch (err) {
		    		console.error("onTsReady ERROR:", err);
		    		_this.lockWait.state = false;
		    	}
	    	}
	    }, 50);
	}

	release() {
		this.hls && this.hls.release();
		this.hls = null;
		this.timerFeed && window.clearInterval(this.timerFeed);
		this.timerFeed = null;
		this.timerTsWasm && window.clearInterval(this.timerTsWasm);
		this.timerTsWasm = null;
	}

	bindReady(bindObject) {
    	this.onReadyOBJ = bindObject;
    }

	/*
	 * _this.sampleQueue.shift();
	 * @Param Int track_id 1Video 2Audio
	 */
    popBuffer (track_id = 1, ptsec = -1) {
	    if (ptsec < 0) {
	        return null;
	    }
	    if (track_id === 1) {
	    	// console.warn("popBuffer ptsec : " + ptsec);
	    	// console.warn(this.bufObject.vFrame(ptsec));

	    	if (ptsec + 1 > this.bufObject.videoBuffer.length) {
	    		return null;
	    	}

	        return this.bufObject.vFrame(ptsec);
	    } else if (track_id === 2) {

	    	if (ptsec + 1 > this.bufObject.audioBuffer.length) {
	    		return null;
	    	}

	        return this.bufObject.aFrame(ptsec);
	    } else {}
	}

	getVLen() {
		return this.bufObject.videoBuffer.length;
	}

	getALen() {
		return this.bufObject.audioBuffer.length;
	}

	getLastIdx() {
		return this.bufObject.videoBuffer.length - 1;
	}

	getALastIdx() {
		return this.bufObject.audioBuffer.length - 1;
	}

	getACodec () {
    	return this.aCodec;
	}

	getVCodec () {
    	return this.vCodec;
	}

	getDurationMs () {
    	return this.durationMs;
	}

	getFPS () {
	    return this.fps;
	}

	getSampleRate () {
	    return this.sampleRate;
	}

	getSampleChannel () {
	    return this.aChannel;
	}

	getSize () {
	    return this.size;
	}

	seek (pts) {
	    if (pts >= 0) {
	        // this.seekPos = parseInt(pts);
	        // console.log("to seek:" + this.seekPos);
	        // this.mp4boxfile.seek(this.seekPos, true);
	        // todo
	        let realPos = this.bufObject.seekIDR(pts);
	        this.seekPos = realPos;
	        console.warn("this.bufObject.seekIDR toSeek: "
	        	+ "[pts, realPos===> ", pts, realPos);
	    }
	    // console.log(this.bufObject.idrIdxBuffer);
	    // this.mp4boxfile.start();
	}

}

exports.M3u8 = M3u8ParserModule;