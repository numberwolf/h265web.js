const M3U8Base = require('./m3u8base');
const MPEG_JS = require('mpeg.js');
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
	}

	// time onFinish -> onDemuxed
	demux(videoURL) {
		let _this = this;
		this.vPreFramePTS = 0.0;
		this.aPreFramePTS = 0.0;

		this.hls.onTransportStream = (streamURI, streamDur) => {
			// console.log("Event onTransportStream ===> ", streamURI, streamDur);
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

		this.mpegTsObj.onDemuxed = () => {
			if (_this.mediaInfo == null) {
				_this.mediaInfo = _this.mpegTsObj.readMediaInfo();
				// console.log("mediaInfo: ",_this.mediaInfo);

				// _this.durationMs 	= _this.mediaInfo.duration * 1000;
	            _this.fps 			= _this.mediaInfo.vFps;
	            _this.sampleRate 	= _this.mediaInfo.sampleRate;
	            // console.log("samplerate:" + _this.sampleRate);
	        }
	        if (_this.extensionInfo == null) {
	        	_this.extensionInfo = _this.mpegTsObj.readExtensionInfo();
	            if (_this.extensionInfo.vWidth > 0 && _this.extensionInfo.vHeight > 0) {
	            	_this.size.width = _this.extensionInfo.vWidth;
	            	_this.size.height = _this.extensionInfo.vHeight;
	            }
	        }

			// console.log("DURATION===>" + _this.mediaInfo.duration);

			if (_this.onDemuxed != null) {
            	_this.onDemuxed(_this.onReadyOBJ);
            }

            let firstPts = -1;
            let needIncrStart = false;
	        while(1) {
	            let readData = _this.mpegTsObj.readPacket();
	            if (readData.size <= 0) {
	                break;
	            }
	            let pts = readData.dtime > 0 ? readData.dtime : readData.ptime;
	            if (pts < 0) {
	            	continue;
	            }
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
	        }
	        // vStartTime += mediaInfo.vDuration;
	        // aStartTime += mediaInfo.aDuration;
	        // console.log(_this.lockWait.lockMember.dur);
	        _this.vStartTime += parseFloat(_this.lockWait.lockMember.dur);
	        _this.aStartTime += parseFloat(_this.lockWait.lockMember.dur);
	        // console.log("vStartTime:" + _this.vStartTime);
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
	    	if (_this.tsList.length > 0 && _this.lockWait.state == false) {
	    		let item = _this.tsList.shift();
	    		let itemURI = item.streamURI;
	    		let itemDur = item.streamDur;

	    		// console.log("Vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv> ENTRY " + itemURI);
	    		_this.lockWait.state = true;
	    		_this.lockWait.lockMember.dur = itemDur;
	    		_this.mpegTsObj.demuxURL(itemURI);
	    		// console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^> NEXT ");
	    	}
	    }, 50);
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
	    if (track_id == 1) {
	    	// console.log("ptsec : " + ptsec);
	    	// console.log(this.bufObject.vFrame(ptsec));
	        return this.bufObject.vFrame(ptsec);
	    } else if (track_id == 2) {
	        return this.bufObject.aFrame(ptsec);
	    } else {}
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
	        // console.log("toSeek: " + realPos);
	    }
	    // console.log(this.bufObject.idrIdxBuffer);
	    // this.mp4boxfile.start();
	}

}

exports.M3u8 = M3u8ParserModule;