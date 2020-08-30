const TsDemuxerJs = require('mpeg.js');
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
    	this.onReadyOBJ = null;
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

    // public
    demux(videoURL) {
    	let _this = this;
    	this.mpegTsObj = new TsDemuxerJs.TsDemuxerJsMod(videoURL, {});

    	let callback = () => {
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

            if (_this.onReady != null) {
            	console.log("on ready");
            	_this.onReady(_this.onReadyOBJ);
            }

            let readData = null;
            while(1) {
                readData = _this.mpegTsObj.readPacket();
                if (readData.size <= 0) {
                    break;
                }

                let pts = readData.dtime;
                // console.log(readData.data);
                if (readData.type == 0) {
                	let pktFrame = _this._packetHandle(readData.layer);
                	let isKey = readData.keyFrame == 1 ? 1 : 0;
                	_this.bufObject.appendFrame(pts, pktFrame, true, isKey);
                } else {
                	// console.log("pts: " + pts);
                	// console.log(readData.data);
                	_this.bufObject.appendFrame(pts, readData.data, false, true);
                }
                // console.log(pts);
            }
            // console.log(_this.bufObject.videoBuffer);
        };
    	/*
         * start
         */
        this.mpegTsObj.do(callback);
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