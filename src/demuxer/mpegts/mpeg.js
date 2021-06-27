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
const ModuleTS = require('../../decoder/missile.js');
const AACDecoder = require('./decoder/aac');
const def = require('./consts');

class MPEG_JS_Module {
	constructor(config) {
        this.configFormat = {
        };

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
            vCodec: ""
        };

        this.extensionInfo = {
            vWidth : 0,
            vHeight : 0,
        };

        this.wasmState = 0;

        this.onReady = null;
        this.onDemuxed = null;
        this.aacDec = null;
        // this.init();

	}

	// outside
	initDemuxer() {
		let _this = this;
        if (!window.WebAssembly) {
            let tip = 'unsupport WASM!';
            if (/iPhone|iPad/.test(window.navigator.userAgent)) {
                tip += ' ios:min-version 11'
            }
            alert(tip);
            alert("Please check your browers, it not support wasm! See:https://www.caniuse.com/#search=wasm");
        } else {
			console.log("TSDemuxer to onRuntimeInitialized");

            ModuleTS.run();
            console.log("run");
            // ModuleTS.postRun();

            if (global.STATIC_MEM_wasmDecoderState === 1) {
                _this.wasmState = 1;
                console.log("TSDemuxer postRun onready!");
                _this.onReady();
            } else {
                ModuleTS["onRuntimeInitialized"] = () => {
                    console.log('TSDemuxer WASM initialized');
                    if (_this.onReady != null && _this.wasmState == 0) {
                        _this.wasmState = 1;
                        console.log("TSDemuxer onready!");
                        _this.onReady();
                    }
                };

                ModuleTS["postRun"] = () => {
                    console.log('TSDemuxer postRun WASM initialized');

                    if (_this.onReady != null && _this.wasmState == 0) {
                        _this.wasmState = 1;
                        console.log("TSDemuxer postRun onready!");
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
		let _this = this;
		fetch(videoURL)
		.then(res => res.arrayBuffer())
		.then(streamBuffer => {
			streamBuffer.fileStart = 0;

			// array buffer to unit8array
			let streamUint8Buf = new Uint8Array(streamBuffer);
			_this._demuxCore(streamUint8Buf);
		});
	}

    _demuxCore(streamUint8Buf) {
        let _this = this;

        // refresh
        this._refreshDemuxer();

        // console.log(streamUint8Buf);
        // console.log(streamUint8Buf.length);
        let offset = ModuleTS._malloc(streamUint8Buf.length)
        ModuleTS.HEAP8.set(streamUint8Buf, offset)

        let decRet = ModuleTS.cwrap('demuxBox', 'number', ['number', 'number'])(offset, streamUint8Buf.length)
        console.log('Run demux box result : ' + decRet);

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
		let ptr = ModuleTS.cwrap('getMediaInfo', 'number', [])();
		let a_sample_rate = ModuleTS.HEAPU32[ptr / 4];
        let a_channel = ModuleTS.HEAPU32[ptr / 4 + 1];

        let fps = ModuleTS.HEAPF64[ptr / 8 + 1];

		let vDuration = ModuleTS.HEAPF64[ptr / 8 + 1 + 1];
		let aDuration = ModuleTS.HEAPF64[ptr / 8 + 1 + 1 + 1];
        let duration  = ModuleTS.HEAPF64[ptr / 8 + 1 + 1 + 1 + 1];
		console.log("a_channel:", a_channel);

        let gop = ModuleTS.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2];

        // let width = ModuleTS.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2 + 1];
        // let height = ModuleTS.HEAPU32[ptr / 4 + 2 + 2 + 2 + 2 + 2 + 1 + 1];

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
        let audioCodecID = ModuleTS.cwrap('getAudioCodecID', 'number', [])();
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
        }
        let videoCodecID = ModuleTS.cwrap('getVideoCodecID', 'number', [])();
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
        let ptr = ModuleTS.cwrap('getExtensionInfo', 'number', [])();
        let width = ModuleTS.HEAPU32[ptr / 4];
        let height = ModuleTS.HEAPU32[ptr / 4 + 1];
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
        let spsLen      = ModuleTS.cwrap('getSPSLen', 'number', [])();
        let spsPtr      = ModuleTS.cwrap('getSPS', 'number', [])();
        naluLayer.sps   = new Uint8Array(spsLen);
        naluLayer.sps.set(ModuleTS.HEAPU8.subarray(spsPtr, spsPtr + spsLen), 0);
        // console.log(naluLayer.sps);

        let ppsLen      = ModuleTS.cwrap('getPPSLen', 'number', [])();
        let ppsPtr      = ModuleTS.cwrap('getPPS', 'number', [])();
        naluLayer.pps   = new Uint8Array(ppsLen);
        naluLayer.pps.set(ModuleTS.HEAPU8.subarray(ppsPtr, ppsPtr + ppsLen), 0);
        // console.log(naluLayer.pps);

        let seiLen      = ModuleTS.cwrap('getSEILen', 'number', [])();
        let seiPtr      = ModuleTS.cwrap('getSEI', 'number', [])();
        naluLayer.sei   = new Uint8Array(seiLen);
        naluLayer.sei.set(ModuleTS.HEAPU8.subarray(seiPtr, seiPtr + seiLen), 0);
        // console.log(naluLayer.sei);

        // vlc layer
        let vlcLen      = ModuleTS.cwrap('getVLCLen', 'number', [])();
        let vlcPtr      = ModuleTS.cwrap('getVLC', 'number', [])();
        vlcLayer.vlc    = new Uint8Array(vlcLen);
        vlcLayer.vlc.set(ModuleTS.HEAPU8.subarray(vlcPtr, vlcPtr + vlcLen), 0);
        // console.log(vlcLayer.vlc);

        if (this.mediaAttr.vCodec == def.DEF_HEVC || this.mediaAttr.vCodec == def.DEF_H265) {
            let vpsLen      = ModuleTS.cwrap('getVPSLen', 'number', [])();
            let vpsPtr      = ModuleTS.cwrap('getVPS', 'number', [])();
            naluLayer.vps   = new Uint8Array(vpsLen);
            naluLayer.vps.set(ModuleTS.HEAPU8.subarray(vpsPtr, vpsPtr + vpsLen), 0);

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

	// outside
	readPacket() {
		let ptr = ModuleTS.cwrap('getPacket', 'number', [])(); // 1bytes

		let type = ModuleTS.HEAPU32[ptr / 4]; // 0 video 1 audio
        let size = ModuleTS.HEAPU32[ptr / 4 + 1]; // 4 bytes 32 bits
        let ptime = ModuleTS.HEAPF64[ptr / 8 + 1]; // 8 bytes
        let dtime = ModuleTS.HEAPF64[ptr / 8 + 1 + 1];
        let keyframe = ModuleTS.HEAPU32[ptr / 4 + 1 + 1 + 2 + 2]; // 4 bytes 32 bits

        let dataPtr = ModuleTS.HEAPU32[ptr / 4 + 1 + 1 + 2 + 2 + 1]; // 4bytes ptr
        let dataPacket = ModuleTS.HEAPU8.subarray(dataPtr, dataPtr + size);

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
        this._releaseDemuxer();
        this._initDemuxer();
    }

    _initDemuxer() {
        ModuleTS.cwrap('initTsMissile', 'number', [])();
        console.log('Initialized initTsMissile');

        // ModuleTS.cwrap('initializeDemuxer', 'number', ['number'])(0); // (0); 0 hevc
        ModuleTS.cwrap('initializeDemuxer', 'number', [])();
        console.log('Initialized initializeDemuxer');
    }

	// outside
	_releaseDemuxer() {
		ModuleTS.cwrap('exitTsMissile', 'number', [])();
	}
}

exports.MPEG_JS = MPEG_JS_Module;





