const MPEG_JS = require('mpeg.js');
const BUFFMOD = require('./buffer');

class TsParserClazz {
    constructor() {
    	this.seekPos       = -1;
	    this.movieInfo     = null;

	    this.durationMs    = -1.0;
	    this.fps           = -1;
	    this.sampleRate    = -1;
	    this.size          = {
	        width   : -1,
	        height  : -1
	    };
	    this.bufObject     = BUFFMOD();
	    // _this.video_start_time = -1;
	    // _this.audio_start_time = -1;

	    /*
	     * item : {pts: 0, frame: Uint8Array}
	     */
	    // this.trackVideos   = [];
	    // this.trackAudios   = [];

	    // OBJ
	    this.mpegTsObj = null;
    	this.bufObject = BUFFMOD();
    	this.mediaInfo = {};
    	this.extensionInfo = {};

    	this.onReady = null;
    	this.onDemuxed = null;
    	this.onReadyOBJ = null;
    }

    initMPEG() {
    	let _this = this;
    	this.mpegTsObj = new MPEG_JS.MPEG_JS({});

    	this.mpegTsObj.onDemuxed = () => {
    		_this.mediaInfo = _this.mpegTsObj.readMediaInfo();
            // console.log(_this.mediaInfo);

            _this.extensionInfo = _this.mpegTsObj.readExtensionInfo();
            // console.log(_this.extensionInfo);

            _this.durationMs 	= _this.mediaInfo.duration * 1000;
            _this.fps 			= _this.mediaInfo.vFps;
            _this.sampleRate 	= _this.mediaInfo.sampleRate;
            // console.log("samplerate:" + _this.sampleRate);

            if (_this.extensionInfo.vWidth > 0 && _this.extensionInfo.vHeight > 0) {
            	_this.size.width = _this.extensionInfo.vWidth;
            	_this.size.height = _this.extensionInfo.vHeight;
            }

         	// if (this.aacDec == null) {
	        //     this.aacDec = new AACDecoder.AACDecoder(_this.mediaInfo);
	        // } else {
	        //     this.aacDec.updateConfig(_this.mediaInfo);
	        // }

            let readData = null;
            while(1) {
                readData = _this.mpegTsObj.readPacket();
                if (readData.size <= 0) {
                    break;
                }

                let pts = readData.dtime;
                if (readData.type == 0) {

                	let pktFrame = _this._packetHandle(readData.layer);
                	let isKey = readData.keyframe == 1 ? true : false;
                	_this.bufObject.appendFrame(pts, pktFrame, true, isKey);

                } else {
                	// console.log("pts: " + pts);
                	// console.log(readData.data.length);
                	if (_this.mediaInfo.aCodec == "aac") {

                		// console.log(readData.data);
                		let aacDataList = readData.data;

                		// let debugData = null;
                		// let tempIdx = 0;
                		for (var i = 0; i < aacDataList.length; i++) {
                			let aacDataItem = aacDataList[i];
                			_this.bufObject.appendFrame(aacDataItem.ptime, aacDataItem.data, false, true);
                		}
                		// _this.bufObject.appendFrame(readData.ptime, readData.src, false, true);
                	} else {
                		_this.bufObject.appendFrame(pts, readData.data, false, true);
                	}
                }
                // console.log(pts);
            }
            // console.log(_this.bufObject.videoBuffer);
            // console.log(_this.bufObject.audioBuffer);

            if (_this.onDemuxed != null) {
            	_this.onDemuxed(_this.onReadyOBJ);
            }
    	};
    	
    	this.mpegTsObj.onReady = () => {
    		// console.log("ready");
    		if (_this.onReady != null) {
            	// console.log("on ready");
            	_this.onReady(_this.onReadyOBJ);
            }
    	};

    	this.mpegTsObj.initDemuxer();
    }

    _packetHandle(layer) {
    	let naluLayer 	= layer.nalu;
    	let vlcLayer 	= layer.vlc;
    	let vlc 		= vlcLayer.vlc;

    	let pktFrame	= new Uint8Array(
	    		naluLayer.vps.length 
	    		+ naluLayer.sps.length 
	    		+ naluLayer.pps.length 
	    		+ naluLayer.sei.length 
	    		+ vlc.length
		);

    	pktFrame.set(naluLayer.vps, 0);

    	pktFrame.set(naluLayer.sps, 
    		naluLayer.vps.length);

    	pktFrame.set(naluLayer.pps, 
    		naluLayer.vps.length + naluLayer.sps.length);

    	pktFrame.set(naluLayer.sei, 
    		naluLayer.vps.length + naluLayer.sps.length + naluLayer.pps.length);

    	pktFrame.set(vlc, 
    		naluLayer.vps.length + naluLayer.sps.length + naluLayer.pps.length + naluLayer.sei.length);

    	return pktFrame;
    }

    bindReady(bindObject) {
    	this.onReadyOBJ = bindObject;
    }

    // public
    demux(uint8buffer) {
    	this.mpegTsObj.demuxUint8Buf(uint8buffer);
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

exports.MpegTs = TsParserClazz;