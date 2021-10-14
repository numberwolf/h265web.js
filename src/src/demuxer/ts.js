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
const MPEG_JS = require('./mpegts/mpeg.js');
const BUFFMOD = require('./buffer');
const HEVC_IMP = require('../decoder/hevc-imp');

class TsParserModule {
    constructor() {
    	this.seekPos       = -1;

	    this.durationMs    = -1.0;
	    this.fps           = -1;
	    this.sampleRate    = -1;
        this.aCodec        = "";
        this.vCodec        = "";
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

    	// event
    	this.onReady = null;
    	this.onDemuxed = null;
    	this.onReadyOBJ = null;
    }

    initMPEG() {
    	let _this = this;
    	this.mpegTsObj = new MPEG_JS.MPEG_JS({});

    	this.mpegTsObj.onDemuxed = () => {
    		_this.mediaInfo = _this.mpegTsObj.readMediaInfo();
            console.log(_this.mediaInfo);

            _this.extensionInfo = _this.mpegTsObj.readExtensionInfo();
            console.log(_this.extensionInfo);

            _this.vCodec        = _this.mediaInfo.vCodec;
            _this.aCodec        = _this.mediaInfo.aCodec;
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
            // let readInterval = setInterval(function() {
                readData = _this.mpegTsObj.readPacket();
                if (readData.size <= 0) {
                    break;
                    // clearInterval(readInterval);
                    // readInterval = null;
                    // return;
                }

                let pts = readData.dtime;
                // console.log(pts);
                if (readData.type == 0) {
                    // console.log(readData);

                	let pktFrame = HEVC_IMP.PACK_NALU(readData.layer);
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
            // }, 1);
            }
            console.log(_this.bufObject.videoBuffer);
            console.log(_this.bufObject.audioBuffer);

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
    /*
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
    */

    bindReady(bindObject) {
    	this.onReadyOBJ = bindObject;
    }

    releaseTsDemuxer() {
        this.mpegTsObj && this.mpegTsObj.releaseTsDemuxer();
        this.mpegTsObj = null;
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

    isHEVC() {
        return this.mpegTsObj.isHEVC();
    }

    getACodec() {
        return this.aCodec;
    }

    getVCodec() {
        return this.vCodec;
    }

    getAudioNone() {
        return this.mpegTsObj.mediaAttr.audioNone;
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

exports.MpegTs = TsParserModule;