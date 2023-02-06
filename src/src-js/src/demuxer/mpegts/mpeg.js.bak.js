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
// const Module = require('../../decoder/missile.js');
const AACDecoder = require('./decoder/aac');
const def = require('./consts');

class MPEG_JS_Module {
	constructor(config) {
        this.configFormat = {
        };

        // this.initState = false;

        // this.testdebug = 0;
        this.isLive = 0;

        // member
        this.mediaAttr = {
        	sampleRate : 0,
        	sampleChannel : 0,
        	// vWidth : 0,
        	// vHeight : 0,
        	vFps : 0,
        	vGop : 0,
        	vDuration : 0,
        	aDuration : 0,
        	duration : 0,
            aCodec: "",
            vCodec: "",
            audioNone: false,
        };

        this.extensionInfo = {
            vWidth : 0,
            vHeight : 0,
        };

        this.controller = new AbortController();

        this.offsetDemux = null;

        this.wasmState = 0;

        this.onReady = null;
        this.onDemuxed = null;
        this.onDemuxedFailed = null;
        this.aacDec = null;
        // this.init();

	}

	// @TODO outside
	initDemuxer() {
		let _this = this;
        // this.initState = true;
        if (!window.WebAssembly) {
            let tip = 'unsupport WASM!';
            if (/iPhone|iPad/.test(window.navigator.userAgent)) {
                tip += ' ios:min-version 11'
            }
            alert(tip);
            alert("Please check your browers, it not support wasm! See:https://www.caniuse.com/#search=wasm");
        } else {
			console.log("TSDemuxer to onRuntimeInitialized");

            Module.run();
            console.log("run");
            // Module.postRun();

            if (global.STATIC_MEM_wasmDecoderState === 1) {
                _this.wasmState = 1;
                console.warn("TSDemuxer postRun onready!");
                _this.onReady();
            } else {
                Module["onRuntimeInitialized"] = () => {
                    console.log('TSDemuxer WASM initialized');
                    if (_this.onReady != null && _this.wasmState == 0) {
                        _this.wasmState = 1;
                        console.warn("TSDemuxer onready!");
                        _this.onReady();
                    }
                };

                Module["postRun"] = () => {
                    console.log('TSDemuxer postRun WASM initialized');

                    if (_this.onReady != null && _this.wasmState == 0) {
                        _this.wasmState = 1;
                        console.warn("TSDemuxer postRun onready!");
                        _this.onReady();
                    }
                };
            }

	    }

        return true;
	}

    demuxURL(videoURL) {
        this._demuxerTsInit(videoURL);
    }

    demuxUint8Buf(buffer) {
        this._demuxCore(buffer);
    }

	// inside
	_demuxerTsInit(videoURL) {
        // this.testdebug++;
        // if (this.testdebug % 10 === 0) {
        //     videoURL = videoURL.replace(".ts", ".404ts");
        // }

		let _this = this;
        console.warn("_demuxerTsInit ==> ", videoURL);

        // OK
        let signal = this.controller.signal;
		fetch(videoURL, {signal})
		.then(res => res.arrayBuffer())
		.then(streamBuffer => {
            // if (_this.initState) {
    			streamBuffer.fileStart = 0;

    			// array buffer to unit8array
    			let streamUint8Buf = new Uint8Array(streamBuffer);
                if (streamUint8Buf !== undefined && streamUint8Buf !== null) {
                    _this._demuxCore(streamUint8Buf);
                } else {
                    console.error("demuxerTsInit ERROR fetch res is null ==> ", videoURL);
                }
                streamUint8Buf = null;
            // }
		}).catch(error => {
            console.error("demuxerTsInit ERROR fetch ERROR ==> ", error);
            // alert("demuxerTsInit ERROR fetch ERROR ==> ");
            // alert(error);
            _this._releaseOffset();
            _this.onDemuxedFailed && _this.onDemuxedFailed(error, videoURL);
        });
	}

    _releaseOffset() {
        if (this.offsetDemux !== undefined && this.offsetDemux !== null) {
            console.warn("------------> _releaseOffset");
            Module._free(this.offsetDemux);
            this.offsetDemux = null;
        }
    }

    _demuxCore(streamUint8Buf) {
        console.warn("_________demuxCore");
        let _this = this;
        this._releaseOffset();

        // refresh
        this._refreshDemuxer();

        // console.log(streamUint8Buf);
        // console.log(streamUint8Buf.length);

        if (streamUint8Buf.length <= 0) {
            return;
        }
        
        this.offsetDemux = Module._malloc(streamUint8Buf.length);
        Module.HEAP8.set(streamUint8Buf, this.offsetDemux);

        let decRet = Module.cwrap('demuxBox', 'number', 
            ['number', 'number', 'number'])
        (this.offsetDemux, streamUint8Buf.length, this.isLive);
        console.warn('-----------Run demux box result : ' + decRet);

        Module._free(this.offsetDemux);
        this.offsetDemux = null;

        if (decRet >= 0) {
            _this._setMediaInfo();
            _this._setExtensionInfo();

            if (_this.onDemuxed != null) {
                _this.onDemuxed();
            }
        }
    }

	// inside
	_setMediaInfo() {
        /*
         * Part 1 media
         */
		let ptr = Module.cwrap('getMediaInfo', 'number', [])();
		let a_sample_rate = Module.HEAPU32[ptr / 4];
        let a_channel = Module.HEAPU32[ptr / 4 + 1];

        let fps = Module.HEAPF64[ptr / 8 + 1];

		let vDuration = Module.HEAPF64[ptr / 8 + 1 + 1];
		let aDuration = Module.HEAPF64[ptr / 8 + 1 + 1 + 1];
        let duration  = Module.HEAPF64[ptr / 8 + 1 + 1 + 1 + 1];
		console.log("a_channel:", a_channel);

        let gop = Module.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2];

        // let width = Module.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2 + 1];
        // let height = Module.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2 + 1 + 1];

		// this.mediaAttr.sampleRate = a_sample_rate > 0 ?
		// 	a_sample_rate : def.DEFAULT_SAMPLERATE;
  //       this.mediaAttr.sampleChannel = a_channel > 0 ?
  //       	a_channel : def.DEFAULT_CHANNEL;

        this.mediaAttr.vFps = fps;
        this.mediaAttr.vGop = gop;
        // this.mediaAttr.vWidth = width;
        // this.mediaAttr.vHeight = height;

        this.mediaAttr.vDuration = vDuration;
        this.mediaAttr.aDuration = aDuration;
        this.mediaAttr.duration = duration;

        // console.log(this.mediaAttr);
        /*
         * Part 2 Codec
         */
        let audioCodecID = Module.cwrap('getAudioCodecID', 'number', [])();
        if (audioCodecID >= 0) {
            this.mediaAttr.aCodec = def.CODEC_OFFSET_TABLE[audioCodecID];
            this.mediaAttr.sampleRate = a_sample_rate > 0 ?
                a_sample_rate : def.DEFAULT_SAMPLERATE;
            // this.mediaAttr.sampleChannel = a_channel > 0 ?
                // a_channel : def.DEFAULT_CHANNEL;
            this.mediaAttr.sampleChannel = a_channel >= 0 ?
                a_channel : def.DEFAULT_CHANNEL;
        } else {
            this.mediaAttr.sampleRate = 0;
            this.mediaAttr.sampleChannel = 0;
            this.mediaAttr.audioNone = true;
        }
        let videoCodecID = Module.cwrap('getVideoCodecID', 'number', [])();
        if (videoCodecID >= 0) {
            this.mediaAttr.vCodec = def.CODEC_OFFSET_TABLE[videoCodecID];
        }

        if (this.aacDec == null) {
            this.aacDec = new AACDecoder.AACDecoder(this.mediaAttr);
        } else {
            this.aacDec.updateConfig(this.mediaAttr);
        }
        
        // console.log(this.mediaAttr);
	}

    _setExtensionInfo() {
        let ptr = Module.cwrap('getExtensionInfo', 'number', [])();
        let width = Module.HEAPU32[ptr / 4];
        let height = Module.HEAPU32[ptr / 4 + 1];
        this.extensionInfo.vWidth = width;
        this.extensionInfo.vHeight = height;
    }

	// outside
	readMediaInfo() {
		return this.mediaAttr;
	}

    // outside
    readExtensionInfo() {
        return this.extensionInfo;
    }

    readAudioNone() {
        return this.mediaAttr.audioNone;
    }

    /**
     * @brief Desc of Packet
     *        Include : Nalu Layer/VLC Layer
     */
    _readLayer() {
        let naluLayer = {
            vps : null,
            sps : null,
            pps : null,
            sei : null
        };
        let vlcLayer = {
            vlc : null
        };

        // nalu layer
        let spsLen      = Module.cwrap('getSPSLen', 'number', [])();
        let spsPtr      = Module.cwrap('getSPS', 'number', [])();
        if (spsLen < 0) {
            return;
        }
        naluLayer.sps   = new Uint8Array(spsLen);
        naluLayer.sps.set(Module.HEAPU8.subarray(spsPtr, spsPtr + spsLen), 0);
        // console.log(naluLayer.sps);

        let ppsLen      = Module.cwrap('getPPSLen', 'number', [])();
        let ppsPtr      = Module.cwrap('getPPS', 'number', [])();
        naluLayer.pps   = new Uint8Array(ppsLen);
        naluLayer.pps.set(Module.HEAPU8.subarray(ppsPtr, ppsPtr + ppsLen), 0);
        // console.log(naluLayer.pps);

        let seiLen      = Module.cwrap('getSEILen', 'number', [])();
        let seiPtr      = Module.cwrap('getSEI', 'number', [])();
        naluLayer.sei   = new Uint8Array(seiLen);
        naluLayer.sei.set(Module.HEAPU8.subarray(seiPtr, seiPtr + seiLen), 0);
        // console.log(naluLayer.sei);

        // vlc layer
        let vlcLen      = Module.cwrap('getVLCLen', 'number', [])();
        let vlcPtr      = Module.cwrap('getVLC', 'number', [])();
        vlcLayer.vlc    = new Uint8Array(vlcLen);
        vlcLayer.vlc.set(Module.HEAPU8.subarray(vlcPtr, vlcPtr + vlcLen), 0);
        // console.log(vlcLayer.vlc);

        if (this.mediaAttr.vCodec == def.DEF_HEVC || this.mediaAttr.vCodec == def.DEF_H265) {
            let vpsLen      = Module.cwrap('getVPSLen', 'number', [])();
            let vpsPtr      = Module.cwrap('getVPS', 'number', [])();
            naluLayer.vps   = new Uint8Array(vpsLen);
            naluLayer.vps.set(Module.HEAPU8.subarray(vpsPtr, vpsPtr + vpsLen), 0);

            // console.log(vpsLen, vps);
        } else if (this.mediaAttr.vCodec == def.DEF_AVC || this.mediaAttr.vCodec == def.DEF_H264) {
            // undo
        } else { // audio
            // undo
        }

        return {
            nalu : naluLayer,
            vlc : vlcLayer
        }
    }

    isHEVC() {
        if (this.mediaAttr.vCodec == def.DEF_HEVC || this.mediaAttr.vCodec == def.DEF_H265) 
        {
            return true;
        }
        return false;
    } // isHEVC

	// outside
	readPacket() {
		let ptr = Module.cwrap('getPacket', 'number', [])(); // 1bytes

		let type = Module.HEAPU32[ptr / 4]; // 0 video 1 audio
        let size = Module.HEAPU32[ptr / 4 + 1]; // 4 bytes 32 bits
        let ptime = Module.HEAPF64[ptr / 8 + 1]; // 8 bytes
        let dtime = Module.HEAPF64[ptr / 8 + 1 + 1];
        let keyframe = Module.HEAPU32[ptr / 4 + 1 + 1 + 2 + 2]; // 4 bytes 32 bits

        let dataPtr = Module.HEAPU32[ptr / 4 + 1 + 1 + 2 + 2 + 1]; // 4bytes ptr
        let dataPacket = Module.HEAPU8.subarray(dataPtr, dataPtr + size);

        let layer = this._readLayer();
        // console.log(layer);
        // console.log("=================================");

        // console.log(this.mediaAttr);
        let dataInfo = null
        if (type == 1 && this.mediaAttr.aCodec == def.DEF_AAC) {
            dataInfo = this.aacDec.sliceAACFrames(ptime, dataPacket);
        } else {
            dataInfo = dataPacket;
        }

        let returnValue = {
        	type : type,
        	size : size,
        	ptime : ptime,
        	dtime : dtime,
            keyframe : keyframe,
            src : dataPacket,
        	data : dataInfo,
            layer : layer
        }
        // console.log(returnValue);

        // console.log("readPacket"
        // 	+ ", type:" + type
        // 	+ ", size:" + size
        // 	+ ", ptime:" + ptime
        // 	+ ", dtime:" + dtime);
        // console.log(dataPacket);
        return returnValue;
	}

    _refreshDemuxer() {
        this.releaseTsDemuxer();
        this._initDemuxer();
    }

    _initDemuxer() {
        Module.cwrap('initTsMissile', 'number', [])();
        console.log('Initialized initTsMissile');

        // Module.cwrap('initializeDemuxer', 'number', ['number'])(0); // (0); 0 hevc
        Module.cwrap('initializeDemuxer', 'number', [])();
        console.log('Initialized initializeDemuxer');

        // this.initState = true;
    }

	// outside
	releaseTsDemuxer() {
		Module.cwrap('exitTsMissile', 'number', [])();
        // this.initState = false;
        // this.controller.abort();
	}
}

exports.MPEG_JS = MPEG_JS_Module;





