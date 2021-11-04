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
// const def = require('./consts');
// const RenderEngine420P = require('./webgl420');

// const Module      = require('./missile.js');
const BUFF_FRAME    = require('../demuxer/bufferFrame');
const BUFFMOD       = require('../demuxer/buffer');
const CacheYUV      = require('./cache');
const CacheYUVStruct= require('./cacheYuv');

const RenderEngine420P  = require('../render-engine/webgl-420p');
const AVCommon          = require('./av-common');
const AudioEnginePCM    = require('./audio-native-core');
const AudioModule       = require('./audio-core');
const def           = require('../consts');
const VersionModule = require('../version');

// mem
const AU_FMT_READ                       = 10;
const MISSILE_PKT_GET_TYPE_AAC          = 100;
const MISSILE_PKT_GET_TYPE_HAVE_VIDEO   = 200;
const MISSILE_PKT_GET_TYPE_YUV          = 300;
const MISSILE_PKT_GET_NOTHING           = 404;
const MISSILE_PKT_GET_SPLIT_FINISHED    = 405;

const READY_PUSH_COUNT_LIMIT            = 0;

const HTTP_FLV_CACHE_V_OK_COUNT           = 25;
const HTTP_FLV_CACHE_A_OK_COUNT           = 50;

const PLAY_LOOP_COST_ONCE_TOTAL         = 100; // 100 loop compute once

const PLAY_LOOP_RESET_CORRECT_DUR_MS    = 1; // 1ms

function getScriptPath(foo) {
    let fooStr = foo.toString();
    let fooMatchFunc = fooStr.match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/);

    console.log(fooStr);
    console.log(fooMatchFunc);

    let funcStream = [fooMatchFunc[1]];
    return window.URL.createObjectURL(
        new Blob(
            funcStream, 
            {
                type: 'text/javascript'
            }
        )
    ); 
}

class CHttpLiveCoreModule { // export default 
	constructor(config) {
		this.config = {
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            token: config.token || null,
            probeSize: config.probeSize || 4096,
        }; // end this.config

        alert("this.config.probeSize" + this.config.probeSize);

        this.mediaInfo = {
            noFPS : false,
            fps : def.DEFAULT_FPS,
            width : this.config.width,
            height : this.config.height,
            sampleRate : this.config.sampleRate,
            size : {
                width : -1,
                height : -1,
            },
            audioNone : false,
        }; // end mediaInfo
        this.duration = -1;
        this.vCodecID = def.V_CODEC_NAME_HEVC;

        this.AVSniffPtr = null;
        this.AVGetInterval = null;
        // this.AVDecodeInterval = null;

        this.readyShowDone = false;
        this.readyKeyFrame = false;
        // this.ready_now = 0; // undo
        this.cache_status = false; // is have cache
        this.download_length = 0;

        this.AVGLObj = null;
        this.canvasBox = document.querySelector('#' + this.config.playerId);
        this.canvasBox.style.overflow = "hidden"; // 多于的像素不显示
        // this.CanvasObj = document.querySelector("#canvas");
        this.CanvasObj = null;
        this.CanvasObj = document.createElement('canvas');
        this.CanvasObj.style.width = this.canvasBox.clientWidth + 'px';
        this.CanvasObj.style.height = this.canvasBox.clientHeight + 'px';
        this.CanvasObj.style.top = '0px';
        this.CanvasObj.style.left = '0px';
        this.canvasBox.appendChild(this.CanvasObj);

        this.audioWAudio= null; // web audio aac decoder player
        this.audioVoice = 1.0;

        this.frameTime = 1000 * 1.0 / this.config.fps;

        this.NaluBuf = [];
        this.YuvBuf = [];
        // this.AACBuf = [];

        this.workerFetch = null;
        this.playInterval = null;

        /*
         * ptr func
         */
        this._ptr_probeCallback = null;
        this._ptr_frameCallback = null;
        this._ptr_naluCallback = null;
        this._ptr_sampleCallback = null;
        this._ptr_aacCallback = null;

        // fetch worker
        let _this = this;
        // console.warn("_this before AVSniffPtr:", _this);
        // this.workerFetch = new Worker('./worker-fetch-flv.js');
        // this.workerFetch = new Worker(getScriptPath(function () {
        //     let _self = self;
        //     let fetchData = (url265) => {
        //         let fetchFinished = false;
        //         let startFetch = false;

        //         if (!startFetch) {
        //             startFetch = true;
        //             fetch(url265).then(function(response) {
        //                 let pump = function(reader) {
        //                     return reader.read().then(function(result) {
        //                         if (result.done) {
        //                             console.log("========== RESULT DONE ===========");
        //                             fetchFinished = true;
        //                             self.postMessage({
        //                                 cmd: 'fetch-fin',
        //                                 data: null, 
        //                                 msg: 'fetch-fin'
        //                             });
        //                             // window.clearInterval(networkInterval);
        //                             // networkInterval = null;
        //                             return;
        //                         }

        //                         let chunk = result.value;
        //                         self.postMessage({
        //                             cmd: 'fetch-chunk',
        //                             data: chunk, 
        //                             msg: 'fetch-chunk'
        //                         });
        //                         console.log("call chunk", chunk.length);
        //                         // rawParser.appendStreamRet(chunk);
        //                         return pump(reader);
        //                     });
        //                 }
        //                 return pump(response.body.getReader());
        //             })
        //             .catch(function(error) {
        //                 console.log(error);
        //             });
        //         }
        //     };

        //     self.onmessage = (event) => {
        //         // console.log("worker.onmessage", event);
        //         let body = event.data;
        //         let cmd = null;
        //         if (body.cmd === undefined || body.cmd === null) {
        //             cmd = '';
        //         } else {
        //             cmd = body.cmd;
        //         }

        //         // console.log("worker recv cmd:", cmd);

        //         switch (cmd) {
        //             case 'start':
        //                 // console.log("worker start");
        //                 let url = body.data;
        //                 fetchData(url);
        //                 self.postMessage({
        //                     cmd: 'default',
        //                     data: 'WORKER STARTED', 
        //                     msg: 'default'
        //                 });
        //                 break;
        //             case 'stop':
        //                 // console.log("worker stop");
        //                 // postMessage('WORKER STOPPED: ' + body);
        //                 close(); // Terminates the worker.
        //                 break;
        //             default:
        //                 // console.log("worker default");
        //                 // console.log("worker.body -> default: ", body);
        //                 // worker.postMessage('Unknown command: ' + data.msg);
        //                 break;
        //         };
        //     };
        // })); // end this.workerFetch

        // this.workerFetch.onmessage = function(event) {
        //     _this._workerFetch_onmessage(event, _this);
        // };

        this.totalLen = 0;
        this.pushPkg = 0;

        // events
        this.onProbeFinish      = null;
        // this.onPlayingTime      = null;
        // this.onPlayingFinish    = null;
        // this.loadCacheStatus    = false;
        this.onLoadCache        = null;
        this.onLoadCacheFinshed = null;
        // this.onRender           = null;
        // this.onCacheProcess     = null;
        this.onReadyShowDone    = null;
        this.onNetworkError     = null;

    } // end func constructor

    // _eventLoadCache() {
    //     this.onLoadCache && this.onLoadCache();
    // }

    // _eventLoadCacheFinished() {
    //     this.onLoadCacheFinshed && this.onLoadCacheFinshed();
    // }

    _workerFetch_onmessage(event, _this) {
        // console.log("play -> workerFetch recv:", event, playerObj);
        let body = event.data;
        let cmd = null;
        if (body.cmd === undefined || body.cmd === null) {
            cmd = '';
        } else {
            cmd = body.cmd;
        }
        // console.log("play -> workerFetch recv cmd:", cmd);
        switch (cmd) {
            case 'fetch-chunk':
                //console.log("play -> workerFetch append chunk");
                let chunk = body.data;
                _this.download_length += chunk.length;

                let push_ret = 0;
                setTimeout(function() {
                    let offset_video = Module._malloc(chunk.length);
                    Module.HEAP8.set(chunk, offset_video);

                    // console.warn("_this.AVSniffPtr:", _this);
                    push_ret = Module.cwrap("pushSniffHttpFlvData", "number", ["number", "number", "number", "number"])(
                        _this.AVSniffPtr, offset_video, chunk.length, _this.config.probeSize
                    );
                    // console.warn("pushRet:", push_ret);

                    Module._free(offset_video);
                    offset_video = null;
                }, 0); // end setTimeout

                _this.totalLen += chunk.length;
                //console.log("play -> workerFetch append chunk ret: ", push_ret, chunk.length, totalLen);
                _this.pushPkg++;

                // /*
                if (_this.AVGetInterval === undefined 
                    || _this.AVGetInterval === null) 
                {
                    _this.AVGetInterval = window.setInterval(function() {
                        let bufLen = Module.cwrap("getBufferLengthApi", "number", ["number"])(_this.AVSniffPtr);
                        // console.log("play -> workerFetch last buf len: ", bufLen);
                        if (bufLen > _this.config.probeSize) {
                        // if (pushPkg > READY_PUSH_COUNT_LIMIT) {
                            let get_ret = Module.cwrap("getSniffHttpFlvPkg", "number", ["number"])(_this.AVSniffPtr);
                            // console.log("play -> workerFetch get nalu ret: ", get_ret, _this.pushPkg);
                            _this.pushPkg -= 1;
                            // _this.ready_now = 1;
                        // }
                        } // end if buf len check
                    }, 5);
                } // end if AVGetInterval
                break;
            case 'close':
                _this.AVGetInterval && clearInterval(_this.AVGetInterval);
                _this.AVGetInterval = null;
            case 'fetch-fin':
                // fetchFinished = true;
                /*
                if (AVGetInterval !== undefined || AVGetInterval !== null) {
                    console.log(" OVER========================>", AVGetInterval);
                    window.clearInterval(AVGetInterval);
                    AVGetInterval = null;
                }
                */
                break;
            case 'fetch-error':
                _this.onNetworkError && _this.onNetworkError(body.data);
            default:
                break;
        } // end switch
    } // end function _workerFetch_onmessage

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

        if (this.CanvasObj.offsetWidth != width || this.CanvasObj.offsetHeight != height) {
            let topMargin = parseInt((this.canvasBox.offsetHeight - height) / 2);
            let leftMargin = parseInt((this.canvasBox.offsetWidth - width) / 2);
            topMargin = topMargin < 0 ? 0 : topMargin;
            leftMargin = leftMargin < 0 ? 0 : leftMargin;
            //console.log(topMargin, leftMargin);
            this.CanvasObj.style.marginTop = topMargin + 'px';
            this.CanvasObj.style.marginLeft = leftMargin + 'px';
            this.CanvasObj.style.width = width + 'px';
            this.CanvasObj.style.height = height + 'px';
        }
        this.isCheckDisplay = true;
        return [width, height];
    }

    _ptsFixed2(pts) {
        return Math.ceil(pts * 100.0) / 100.0;
    }

    // callback
    _callbackProbe(duration, width, height, fps,
        audioIdx,
        sample_rate, channels, vcodec_name_id, sample_fmt) 
    {
        const hex = Module.HEAPU8.subarray(sample_fmt, sample_fmt + AU_FMT_READ);
        let sample_fmt_str = "";
        for (let i = 0; i < hex.length; i++) {
            let char = String.fromCharCode(hex[i]);
            sample_fmt_str += char;
        }
        console.log("callbackProbe", duration, width, height, fps,
            audioIdx,
            sample_rate, channels, vcodec_name_id, sample_fmt_str);

        let retFPS = fps;
        if (fps > 100) {
            retFPS = def.DEFAULT_FPS;
            this.mediaInfo.noFPS = true;
        }

        this.vCodecID = vcodec_name_id;
        this.config.fps = retFPS;
        this.mediaInfo.fps = retFPS;
        this.mediaInfo.size.width = width;
        this.mediaInfo.size.height = height;

        this.frameTime = Math.floor(1000.0 / (this.mediaInfo.fps + 2));

        // check canvas width/height
        if (this.CanvasObj.width != width || this.CanvasObj.height != height) {
            this.CanvasObj.width = width;
            this.CanvasObj.height = height;

            if (!this.isCheckDisplay) { // resize by callback
                // let displayWH = this._checkDisplaySize(width, height);
                let displayWH = this._checkDisplaySize(width, width, height);
            }
        } // end set canvas size

        if (audioIdx >= 0 && this.mediaInfo.noFPS === false) {
            if (undefined !== this.audioWAudio && null !== this.audioWAudio) {
                this.audioWAudio.stop();
                this.audioWAudio = null;
            }

            this.config.sampleRate = sample_rate;
            this.mediaInfo.sampleRate = sample_rate;

            // console.log("create audio = ignoreAudio:", this.config.ignoreAudio < 1);
            this.audioWAudio = AudioModule({
                sampleRate: this.mediaInfo.sampleRate,
                appendType: def.APPEND_TYPE_FRAME
            }); // this.audioWAudio
            this.audioWAudio.isLIVE = true;
            // this.audioWAudio.setDurationMs(duration * 1000.0);
        } else {
            this.mediaInfo.audioNone = true;
        } // end audioIdx

        this.onProbeFinish && this.onProbeFinish();

        // this.play();
    } // end func _callbackProbe

    _callbackYUV(y, u, v, line_y, line_u, line_v, w, h, pts) 
    {
        // console.log("callbackYUV==============>", line_y, line_u, line_v, w, h, pts);

        let offsetY = Module.HEAPU8.subarray(y, y + line_y * h);
        let bufY = new Uint8Array(offsetY);

        let offsetU = Module.HEAPU8.subarray(u, u + line_u * h / 2);
        let bufU = new Uint8Array(offsetU);

        let offsetV = Module.HEAPU8.subarray(v, v + line_v * h / 2);
        let bufV = new Uint8Array(offsetV);

        let data = {
            //AVGLObj: AVGLObj,
            bufY: bufY,
            bufU: bufU,
            bufV: bufV,
            line_y: line_y,
            h: h,
            pts: pts,
        }; // data

        this.YuvBuf.push(data);

        this.checkCacheState();

        // if (this.checkCacheState() === false) {
        //     console.log("YUV cache finished");
        //     this.cache_status = 0;
        //     this.audioWAudio.play();
        // } // check cache

        //renderFrame(AVGLObj, bufY, bufU, bufV, line_y, h);
        /*
        workerGL.postMessage({
            cmd: "start", 
            data: {
                AVGLObj: AVGLObj,
                bufY: bufY,
                bufU: bufU,
                bufV: bufV,
                line_y: line_y,
                h: h
            },
            msg: "start"
        });*/

        Module._free(offsetY);
        offsetY = null;
        Module._free(offsetU);
        offsetU = null;
        Module._free(offsetV);
        offsetV = null;

        if (this.readyShowDone === false) {
            this.playYUV();
            this.readyShowDone = true;
            this.onReadyShowDone && this.onReadyShowDone();
            if (!this.audioWAudio) {
                this.play();
            }
        } // this.readyShowDone

        //bufY = null;
        //bufU = null;
        //bufV = null;
    } // end func _callbackYUV

    _callbackNALU(data, len, isKey, w, h, pts, dts) 
    {
        //return;
        // console.log("callbackNALU len", len);
        // console.log("callbackNALU is key", isKey);
        // console.log("callbackNALU w h", w, h);
        // console.log("callbackNALU time HEVC dts", dts);

        if (this.readyKeyFrame === false) {
            if (isKey <= 0) {
                return;
            } else {
                this.readyKeyFrame = true;
            }
        }

        let offsetFrame = Module.HEAPU8.subarray(data, data + len);
        let bufData = new Uint8Array(offsetFrame);
        //console.log("callbackNALU Data:", bufData);
        this.NaluBuf.push({
            bufData: bufData,
            len: len,
            isKey: isKey,
            w: w,
            h: h,
            pts: pts * 1000,
            dts: dts * 1000
        }); 

        /*
        let offset_video = Module._malloc(bufData.length);
        Module.HEAP8.set(bufData, offset_video);

        // decode start
        let decRet = Module.cwrap("decodeVideoFrame", "number", 
            ["number", "number", "number", "number", "number"])
            (AVSniffPtr, offset_video, bufData.length, pts, dts, 0);
        console.log("decodeVideoFrame ret:", decRet); 
        // decode end

        */
        //bufData = null;
        Module._free(offsetFrame);
        offsetFrame = null;
        //Module._free(offset_video);
        //offset_video = null;
    } // end func _callbackNALU

    _callbackPCM(pcm) {
    } // end func _callbackPCM

    _callbackAAC(adts, buffer, line1, channel, pts) {
        // console.log("callbackNALU time AAC dts", pts);

        let ptsFixed = this._ptsFixed2(pts);
        if (this.audioWAudio) 
        {
            let pcmFrame = new Uint8Array(7 + line1);

            let adts_buf = Module.HEAPU8.subarray(adts, adts + 7);
            pcmFrame.set(adts_buf, 0);
            // let adts_out = new Uint8Array(adts_buf);

            let aac_buf = Module.HEAPU8.subarray(buffer, buffer + line1);
            pcmFrame.set(aac_buf, 7);

            let aacData = {
                pts : ptsFixed,
                data : pcmFrame,
            }; // aacData

            // this.AACBuf.push(aacData);
            this.audioWAudio.addSample(aacData);
            // console.log("callbackNALU time AAC queue len", 
            //     this.audioWAudio.sampleQueue.length);
            // this.bufLastADTS = Math.max(ptsFixed, this.bufLastADTS);

            this.checkCacheState();

            // let aac_buf_out = new Uint8Array(aac_buf);

            // console.log("_aacFrameCallback============>", pcmFrame, pts);
            // let sampleObject = {
            //  data: pcmFrame, 
            //  pts: pts
            // };
            // this.aCachePTS = Math.max(ptsFixed, this.aCachePTS);
            // this.onCacheProcess && this.onCacheProcess(this.getCachePTS());
            // this.audioWAudio.addSample(sampleObject);
        }
    } // end func _callbackPCM

    _decode() {
        let _this = this;

        setTimeout(() => {
            if (_this.workerFetch === null) {
                return;
            }
            let item = _this.NaluBuf.shift();
            if (item !== undefined && item !== null) {

                let offset_video = Module._malloc(item.bufData.length);
                Module.HEAP8.set(item.bufData, offset_video);

                // decode start
                let decRet = Module.cwrap("decodeHttpFlvVideoFrame", "number",
                    ["number", "number", "number", "number", "number"])
                    (_this.AVSniffPtr, offset_video, item.bufData.length, item.pts, item.dts, 0);
                //console.log("decodeVideoFrame ret:", decRet); 
                // decode end

                //item.bufData = null;
                Module._free(offset_video);
                offset_video = null;
            }

            _this._decode();
        }, 1); // end timeout

        // if (this.AVDecodeInterval === undefined 
        //     || this.AVDecodeInterval === null) 
        // {
        //     this.AVDecodeInterval = setInterval(function() {
        //         let item = _this.NaluBuf.shift();
        //         if (item !== undefined && item !== null) {

        //             let offset_video = Module._malloc(item.bufData.length);
        //             Module.HEAP8.set(item.bufData, offset_video);

        //             // decode start
        //             let decRet = Module.cwrap("decodeHttpFlvVideoFrame", "number",
        //                 ["number", "number", "number", "number", "number"])
        //                 (_this.AVSniffPtr, offset_video, item.bufData.length, item.pts, item.dts, 0);
        //             //console.log("decodeVideoFrame ret:", decRet); 
        //             // decode end

        //             //item.bufData = null;
        //             Module._free(offset_video);
        //             offset_video = null;
        //         }
        //     }, 1); // end this.AVDecodeInterval
        // } // end this.AVDecodeInterval === undefined decode
    } // end func _decode

    checkCacheState() {
        let newState = (
            this.YuvBuf.length >= HTTP_FLV_CACHE_V_OK_COUNT 
            && (
                this.mediaInfo.audioNone === true || 
                (this.audioWAudio && this.audioWAudio.sampleQueue.length >= HTTP_FLV_CACHE_A_OK_COUNT)
            )
        );
        if (this.cache_status === false && newState) {
            console.log("let audioModule new play");
            if (this.playInterval && this.audioWAudio) this.audioWAudio.play();
            this.onLoadCacheFinshed && this.onLoadCacheFinshed();
            this.cache_status = true;
            // return true;
        }
        return newState; // keep
    }

    setVoice(voice) {
        this.audioVoice = voice;
        this.audioWAudio && this.audioWAudio.setVoice(voice);
    }

    _removeBindFuncPtr() {
        if (this._ptr_probeCallback !== null) 
            Module.removeFunction(this._ptr_probeCallback);
        if (this._ptr_frameCallback !== null) 
            Module.removeFunction(this._ptr_frameCallback);
        if (this._ptr_naluCallback !== null) 
            Module.removeFunction(this._ptr_naluCallback);
        if (this._ptr_sampleCallback !== null) 
            Module.removeFunction(this._ptr_sampleCallback);
        if (this._ptr_aacCallback !== null) 
            Module.removeFunction(this._ptr_aacCallback);

        this._ptr_probeCallback = null;
        this._ptr_frameCallback = null;
        this._ptr_naluCallback = null;
        this._ptr_sampleCallback = null;
        this._ptr_aacCallback = null;
    }

    release() {
        this.pause();
        // @todo
        this.NaluBuf.length = 0;
        this.YuvBuf.length = 0;

        if (this.workerFetch !== undefined && this.workerFetch !== null) {
            this.workerFetch.postMessage({
                cmd: 'stop',
                data: 'stop', 
                msg: 'stop'
            });
        }
        this.workerFetch = null;

        this.AVGetInterval && clearInterval(this.AVGetInterval);
        this.AVGetInterval = null;

        this._removeBindFuncPtr();
        let releaseRet = Module.cwrap(
            'releaseHttpFLV', 'number', ['number'])(this.AVSniffPtr);

        this.playInterval && clearInterval(this.playInterval);
        this.playInterval = null;

        this.audioWAudio && this.audioWAudio.stop();
        this.audioWAudio = null;

        this.CanvasObj && this.CanvasObj.remove();
        this.CanvasObj = null;

        return 0;
    }

    isPlayingState() {
        return this.playInterval !== null && this.playInterval !== undefined;
    }

    pause() {
        this.audioWAudio && this.audioWAudio.pause();
        this.playInterval && clearInterval(this.playInterval);
        this.playInterval = null;
    }

    playYUV() {
        if (this.YuvBuf.length > 0) {
            let item = this.YuvBuf.shift();
            RenderEngine420P.renderFrame(this.AVGLObj, 
                                item.bufY, item.bufU, item.bufV, 
                                item.line_y, item.h);
            return true;
        }

        return false;
    }

    play() {
        let _this = this;

        if (false === this.checkCacheState()) {
            this.onLoadCache && this.onLoadCache();
            setTimeout(() => {
                console.log("wait for 100ms");
                this.play();
            }, 100);
            return false;
        }

        // if (this.ready_now > 0) {
        

        // 得出几次平均耗时 然后重新做 patent
        if (this.playInterval === undefined || this.playInterval === null) 
        {
            let calcuteStartTime    = 0;
            let nowTimestamp        = 0;
            let playFrameCostTime   = 0;
            // let frameTime           = Math.floor(1000 / _this.mediaInfo.fps);

            // let avgPlayFrameCost    = 0;
            // let onceTotalPlayCost   = 0; // PLAY_LOOP_COST_ONCE_TOTAL
            // let onceComputeCount    = 0;

            if (this.mediaInfo.audioNone === false && this.audioWAudio && this.mediaInfo.noFPS === false) 
            {
                this.playInterval = setInterval(function() {
                    nowTimestamp = AVCommon.GetMsTime();

                    // console.log("YUV cachestatus", _this.cache_status);
                    if (_this.cache_status) {
                        if (nowTimestamp - calcuteStartTime >= _this.frameTime - playFrameCostTime) 
                        { // play
                            let item = _this.YuvBuf.shift(); 
                            // console.log("YUV pts", item.pts, _this.YuvBuf.length);

                            
                            if (item != undefined && item !== null) 
                            {
                                let diff = 0;
                                if (_this.audioWAudio !== null 
                                && _this.audioWAudio !== undefined) 
                                {
                                    // ...
                                    diff = (item.pts - _this.audioWAudio.getAlignVPTS()) * 1000;
                                } // this.audioWAudio
                                if (_this.audioWAudio) {
                                    // 正常播放
                                    // Video慢于Audio时候: 小于1帧
                                    // Video快于Audio:
                                    if (
                                        (diff < 0 && diff * (-1) <= _this.frameTime) 
                                        || diff >= 0
                                    ) {
                                        playFrameCostTime = AVCommon.GetMsTime() - nowTimestamp 
                                                + PLAY_LOOP_RESET_CORRECT_DUR_MS;
                                    } else {
                                        playFrameCostTime = _this.frameTime;
                                    } // check diff
                                } else {
                                    playFrameCostTime = AVCommon.GetMsTime() - nowTimestamp 
                                                + PLAY_LOOP_RESET_CORRECT_DUR_MS;
                                }

                                // render
                                RenderEngine420P.renderFrame(_this.AVGLObj, 
                                    item.bufY, item.bufU, item.bufV, 
                                    item.line_y, item.h);

                                
                            } // check videoFrame item is empty

                            if (
                                _this.YuvBuf.length <= 0 || 
                                (_this.audioWAudio && _this.audioWAudio.sampleQueue.length <= 0)
                            ) {
                                console.log("YUV cacheing");
                                _this.cache_status = false;
                                _this.onLoadCache && _this.onLoadCache();
                                _this.audioWAudio && _this.audioWAudio.pause();
                            }

                            /*
                             * Cost Time
                             */
                            calcuteStartTime = nowTimestamp;
                            // playFrameCostTime = AVCommon.GetMsTime() - nowTimestamp 
                            //                     + PLAY_LOOP_RESET_CORRECT_DUR_MS;

                            // onceComputeCount += 1;
                            // onceTotalPlayCost += playFrameCostTime;
                            // if (onceComputeCount >= PLAY_LOOP_COST_ONCE_TOTAL) {
                            //     avgPlayFrameCost = onceTotalPlayCost / onceComputeCount;
                            //     onceComputeCount = 0;
                            //     onceTotalPlayCost = 0;
                            // }
                        } // check cost with yuv frame to play

                    } else {
                        playFrameCostTime = _this.frameTime;

                        // reset
                        // onceTotalPlayCost   = 0; // PLAY_LOOP_COST_ONCE_TOTAL
                        // onceComputeCount    = 0;
                    }
                }, 1); // this.playInterval
                this.audioWAudio && this.audioWAudio.play();

            } else {
                this.playInterval = setInterval(function() {
                    let item = _this.YuvBuf.shift(); 
                    if (item != undefined && item !== null) 
                    {
                        // render
                        RenderEngine420P.renderFrame(_this.AVGLObj, 
                            item.bufY, item.bufU, item.bufV, 
                            item.line_y, item.h);
                    } // end item
                    if (_this.YuvBuf.length <= 0) {
                        console.log("YUV cacheing");
                        _this.cache_status = false;
                        // _this.onLoadCache && _this.onLoadCache();
                    } // end check len
                }, _this.frameTime); // end playInterval
            } // end if check audioNone to create play interval
            
        } // check this.playInterval is undefined or null

        // this.playInterval = setInterval(function() {
        //     // console.log("YUV cachestatus", _this.cache_status);
        //     if (_this.cache_status <= 0) {
        //         let item = _this.YuvBuf.shift(); 
        //         console.log("YUV pts", item.pts, _this.YuvBuf.length);
        //         if (item != undefined && item !== null) {
        //             RenderEngine420P.renderFrame(_this.AVGLObj, item.bufY, item.bufU, item.bufV, item.line_y, item.h);
        //         }
        //         if (_this.YuvBuf.length <= 0) {
        //             console.log("YUV cacheing");
        //             _this.cache_status = 1;
        //         }
        //     }
        // }, 1000 / _this.mediaInfo.fps - 5);
        // }
    } // end func play

    start(url265) {
        let _this = this;
        

        this.workerFetch = new Worker(getScriptPath(function() {
            let controller = new AbortController();
            let signal = controller.signal;

            // self.onmessage = (event) => {
            //     console.log(event);
            // };
            let _self = self;
            // console.log("self=", self);
            let fetchData = (url265) => {
                let fetchFinished = false;
                let startFetch = false;

                if (!startFetch) {
                    startFetch = true;
                    fetch(url265, {signal}).then(function(response) {
                        let pump = function(reader) {
                            return reader.read().then(function(result) {
                                if (result.done) {
                                    console.log("========== RESULT DONE ===========");
                                    fetchFinished = true;
                                    self.postMessage({
                                        cmd: 'fetch-fin',
                                        data: null, 
                                        msg: 'fetch-fin'
                                    });
                                    // window.clearInterval(networkInterval);
                                    // networkInterval = null;
                                    return;
                                }

                                let chunk = result.value;
                                self.postMessage({
                                    cmd: 'fetch-chunk',
                                    data: chunk, 
                                    msg: 'fetch-chunk'
                                });
                                // console.log("call chunk", chunk.length);
                                // rawParser.appendStreamRet(chunk);
                                return pump(reader);
                            });
                        }
                        return pump(response.body.getReader());
                    })
                    .catch(function(error) {
                        if (!error.toString().includes('user aborted')) {
                            console.error("httplive error", error);
                            self.postMessage({
                                cmd: 'fetch-error',
                                data: error, 
                                msg: 'fetch-error'
                            });
                        } // end check error
                        
                    });
                }
            }; // fetchData

            self.onmessage = (event) => {
                // console.log("worker.onmessage", event);
                let body = event.data;
                let cmd = null;
                if (body.cmd === undefined || body.cmd === null) {
                    cmd = '';
                } else {
                    cmd = body.cmd;
                }

                // console.log("worker recv cmd:", cmd);

                switch (cmd) {
                    case 'start':
                        // console.log("worker start");
                        let url = body.data;
                        fetchData(url);
                        self.postMessage({
                            cmd: 'default',
                            data: 'WORKER STARTED', 
                            msg: 'default'
                        });
                        break;
                    case 'stop':
                        console.log("workerInterval stop fetch");
                        // console.log("worker stop");
                        // postMessage('WORKER STOPPED: ' + body);
                        controller.abort();
                        self.close(); // Terminates the worker.
                        self.postMessage({
                            cmd: 'close',
                            data: 'close',
                            msg: 'close'
                        });
                        break;
                    default:
                        // console.log("worker default");
                        // console.log("worker.body -> default: ", body);
                        // worker.postMessage('Unknown command: ' + data.msg);
                        break;
                };
            }; // self.onmessage
        })); // end this.workerFetch

        this.workerFetch.onmessage = function(event) {
            _this._workerFetch_onmessage(event, _this);
        };

        console.log("this.workerFetch flv=>", this.workerFetch);

        const TOKEN_SECRET = "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1";

        this.AVSniffPtr = Module.cwrap("AVSniffHttpFlvInit", "number", ["string", "string"])(
            TOKEN_SECRET, '0.0.0'
        );
        console.log("wasmHttpFLVLoaded!!", this.AVSniffPtr);

        console.log("start add function probeCallback");
        this._ptr_probeCallback   = Module.addFunction(this._callbackProbe.bind(this));

        console.log("start add function yuvCallback");
        this._ptr_yuvCallback     = Module.addFunction(this._callbackYUV.bind(this));

        console.log("start add function naluCallback");
        this._ptr_naluCallback    = Module.addFunction(this._callbackNALU.bind(this));

        console.log("start add function sampleCallback");
        this._ptr_sampleCallback  = Module.addFunction(this._callbackPCM.bind(this));

        console.log("start add function aacCallback");
        this._ptr_aacCallback     = Module.addFunction(this._callbackAAC.bind(this)); 

        let callbackRet = Module.cwrap(
            "initializeSniffHttpFlvModule",
            "number",
            ["number", "number", "number", "number", "number", "number"])
            (this.AVSniffPtr, 
                this._ptr_probeCallback, 
                this._ptr_yuvCallback, this._ptr_naluCallback, 
                this._ptr_sampleCallback, this._ptr_aacCallback);
        console.log("create_media_processor callbackRet: ", callbackRet);

        this.AVGLObj = RenderEngine420P.setupCanvas(this.CanvasObj, {preserveDrawingBuffer: false})

        // var url265 = "https://ahekv0bx0fsc5jjda5z.down.evs.bcelive.com/evs/hsnFWkELtOSv.flv?timestamp=1632799645&token=412ca3ab22886dd6faac3a405ed69de265abdb86afae91cf1861d78d05cd61e7";
        this.workerFetch.postMessage({cmd: "start", data: url265, msg: "start"});
        this._decode();
        // this.play();
    } // end func startPost


} // end class CHttpLiveCoreModule

exports.CHttpLiveCore = CHttpLiveCoreModule;
