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
//TODO: separate out the canvas logic and the hevc decoder logic
// const YUVBuffer     = require('yuv-buffer');
// const YUVCanvas     = require('yuv-canvas');
const AVModule      = require('./missile.js');
// const Module        = require('./missile-all.js');
const AudioModule   = require('./audio-core');
const CacheYUV      = require('./cache');
const CacheYUVStruct = require('./cacheYuv');
// const ScreenModule = require('./screen');
const RenderEngine420P = require('../render-engine/webgl-420p');
const def = require('../consts');
const VersionModule = require('../version');

const DIFF_TIMES = 1.0;
const PLAYER_PLAY_INTERVAL = 10;
const NO_CACHE_FRAME_LIMIT = 10;

// Fixed bugs: [hevc @ 0x902840] Could not find ref with POC 24 
// block pic error
const FIXED_POC_ERROR_WAIT_FRAMES = 10;
const CACHE_LENGTH = 30; // cache frame yuv length

const getMsTime = () => {
    return new Date().getTime();
};

const copyUint8Array = (old) => {
    let newBuf = new Uint8Array(old.length);
    newBuf.set(old, 0);
    return newBuf;
};

module.exports = config => {
    let player = {
        config: {
            width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            fixed: config.fixed || def.DEFAULT_FIXED,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            appendHevcType: config.appendHevcType || def.APPEND_TYPE_STREAM,
            frameDurMs: config.frameDur || def.DEFAULT_FRAME_DUR, // got ms
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            audioNone: config.audioNone || false,
            token: config.token || null,
            videoCodec: config.videoCodec || def.CODEC_H265
        },
        vcodecerPtr: null,
        /*
         * frame.data
         * frame.pts
         */
        frameList: [],
        cacheYuvBuf: CacheYUV(CACHE_LENGTH),
        nowPacket: null, // 当前处理的Packet
        stream: new Uint8Array(),
        audio: null,
        // screenView: new ScreenModule.Screen(),
        liveStartMs: -1, // @Todo
        durationMs: -1.0,
        videoPTS: 0,
        loop: null, // Play Loop thread
        debugYUVSwitch: false,
        debugID: null,
        cacheLoop: null, // cache Loop thread
        playParams: {
            seekPos : -1, 
            mode : def.PLAYER_MODE_VOD, 
            accurateSeek : true, 
            seekEvent : false,
            realPlay : true
        }, // Play Use
        calcuteStartTime: -1, // Play Use
        fix_poc_err_skip: 0, // Play Use
        frameTime: 0, // Play Use MS
        frameTimeSec: 0, // Play Use sec
        preCostTime: 0, // Play Use MS
        realVolume: 1, // Play Use 0~1
        isPlaying: false,
        isCaching: def.CACHE_NO_LOADCACHE,
        isNewSeek: false,
        isCheckDisplay: false,
        isPlayLoadingFinish: 0, // 0:undo, 1 loading 2 loading finish
        vCachePTS: 0, // 视频缓冲
        aCachePTS: 0,
        // setting
        showScreen: false,
        noCacheFrame: 0,
        // event
        onPlayingTime : null,
        onPlayingFinish : null,
        onSeekFinish : null,
        onLoadCache : null,
        onLoadCacheFinshed : null,
        onRender : null,
        // onCacheProcess : null // 这里不需要event  是外部主动获取
    };
    player.setScreen = (setVal = false) => {
        if (null !== player && undefined !== player) {
            player.showScreen = setVal;
            if (player.canvas) {
                if (setVal) {
                    player.canvas.setAttribute('hidden', true);
                } else {
                    player.canvas.removeAttribute('hidden');
                }
            }
        }
    };
    player.setSize = (width, height) => {
        player.config.width = width || def.DEFAULT_WIDTH
        player.config.height = height || def.DEFAULT_HEIGHT
    };
    player.setFrameRate = (fps = 25) => {
        player.config.fps = fps;
        player.config.frameDurMs = 1000 / fps; // got ms
    };
    player.setDurationMs = (durationMs = -1) => {
        player.durationMs = durationMs
        player.config.audioNone == false && player.audio.setDurationMs(durationMs);
    };
    player.setPlayingCall = callback => {
        player.onPlayingTime = callback;
    };
    player.setVoice = voice => {
        player.realVolume = voice;
        player.config.audioNone == false && player.audio.setVoice(player.realVolume);
    };
    player.isPlayingState = () => {
        return player.isPlaying || player.isCaching === def.CACHE_WITH_PLAY_SIGN;
    };
    // {pts: 3.04, isKey: false, data: Uint8Array(682), video: true}
    player.appendAACFrame = streamBytes => {
        player.audio.addSample(streamBytes);
        player.aCachePTS = Math.max(streamBytes.pts, player.aCachePTS);
    };
    // {pts: 3.01859410430839, isKey: true, data: Uint8Array(371), video: false}
    player.appendHevcFrame = streamBytes => { //TODO: assert if streamBytes is not null
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            player.stream = new Uint8Array([...player.stream].concat(...streamBytes));
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            player.frameList.push(streamBytes);
            player.vCachePTS = Math.max(streamBytes.pts, player.vCachePTS);
        }
    };
    player.getCachePTS = () => {
        // console.log("media cache pts:", player.vCachePTS, player.aCachePTS);
        return Math.max(player.vCachePTS, player.aCachePTS);
    };
    player.endAudio = () => {
        player.config.audioNone == false && player.audio.stop();
    };
    player.cleanSample = () => {
        player.config.audioNone == false && player.audio.cleanQueue();
    };
    player.cleanVideoQueue = () => {
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            player.stream = new Uint8Array();
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            player.frameList = [];
        }
    };
    player.cleanCacheYUV = () => {
        player.cacheYuvBuf.cleanPipeline();
    };
    player.pause = () => {
        player.loop && window.clearInterval(player.loop);
        player.loop = null;
        player.config.audioNone == false && player.audio.pause();
        player.isPlaying = false;

        if (player.isCaching === def.CACHE_WITH_PLAY_SIGN) {
            player.isCaching = def.CACHE_WITH_NOPLAY_SIGN
        }
    };
    player.checkFinished = (mode = def.PLAYER_MODE_VOD) => {
        // //console.log((mode == def.PLAYER_MODE_VOD) 
        //     + ",pause:" + player.videoPTS.toFixed(1) + "," 
        //     + (player.durationMs - player.config.frameDurMs) / 1000 
        //     + ",nocache:" + player.noCacheFrame);
        if (mode == def.PLAYER_MODE_VOD 
            && player.cacheYuvBuf.yuvCache.length <= 0
            && (
                player.videoPTS.toFixed(1) >= (player.durationMs - player.config.frameDurMs) / 1000 
                || player.noCacheFrame >= NO_CACHE_FRAME_LIMIT
            )
        ) {
            // player.pause(); player.cacheYuvBuf.yuvCache.length
            if (player.onPlayingFinish != null) {
                console.log("player.checkFinished ===> "
                    + (mode == def.PLAYER_MODE_VOD) 
                    + ",\n[player.frameList.length=" + player.frameList.length
                    + "],\n[player.cacheYuvBuf.yuvCache.length=" 
                    + player.cacheYuvBuf.yuvCache.length 
                    + "],\n[player.videoPTS=" + player.videoPTS.toFixed(1) 
                    + "],\n[player.durationMs - player.config.frameDurMs=" 
                    + (player.durationMs - player.config.frameDurMs) / 1000 
                    + "],\n[nocache:" + player.noCacheFrame);
                player.onPlayingFinish();
            }
            return true;
        }
        return false;
    };
    /**
     * options:
     *      seekTime        : seekTime,
     *      mode            : _this.playMode,
     *      accurateSeek    : _this.configFormat.accurateSeek
     */
    player.seek = (execCall, options = {}) => {
        let statusNow = player.isPlaying;
        player.nowPacket = null;
        player.vCachePTS = 0; // 视频缓冲
        player.aCachePTS = 0;
        player.pause();
        player.cleanSample();
        player.cleanVideoQueue();
        player.cleanCacheYUV();
        if (execCall) {
            execCall();
        }
        player.isNewSeek = true;
        // temp set videoPTS to int() idx , must lt to target time
        player.videoPTS = parseInt(options.seekTime);
        let playParams = {
            seekPos : options.seekTime || -1, 
            mode : options.mode || def.PLAYER_MODE_VOD, 
            accurateSeek : options.accurateSeek || true, 
            seekEvent : options.seekEvent || true,
            realPlay : statusNow
        };
        player.play(playParams);
    };
    player.getNalu1Packet = (alginPTS=true) => {
        let nalBuf  = null;
        let pts     = -1;
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            nalBuf = player.nextNalu(); // nal
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            let frame = player.frameList.shift(); // nal

            if(!frame) {
                //console.log('cache got empty frame');
                
                return null;
            }

            nalBuf = frame.data;
            pts = frame.pts;
            if (alginPTS) player.videoPTS = pts;
        } else {
            // undo anything
            return null;
        }
        return {
            nalBuf: nalBuf,
            pts: pts
        }
    };
    player.decodeNalu1Frame = (nalBuf, pts, hardcopy=false) => {
        // decode Frame
        let offset = AVModule._malloc(nalBuf.length);
        AVModule.HEAP8.set(nalBuf, offset);
        console.log("decodeNalu1Frame===>", pts);

        let ptsMS = parseInt(pts * 1000);
        let decRet = AVModule.cwrap('decodeCodecContext', 'number', 
            ['number', 'number', 'number', 'number'])(
                player.vcodecerPtr, offset, nalBuf.length, ptsMS);
        console.log("decRet:", decRet, pts);
        
        // let maxRetry = 3;
        // while (decRet == 0 && maxRetry > 0) {
        //     decRet = AVModule.cwrap('decodeCodecContext', 'number', ['number', 'number', 'number'])(player.vcodecerPtr, offset, nalBuf.length);
        //     maxRetry -= 1;
        // }
        // if (decRet < 0) {
        //     AVModule._free(offset);
        //     return false;
        // }
        // if (decRet > 0) {
        //     let cacheYuvStructObj = player.getDecodeFrameData(pts, hardcopy);
        //     AVModule._free(offset);
        //     return cacheYuvStructObj;
        // }
        AVModule._free(offset);
        return false;
    };
    /**
     * ~@param CacheYuvStruct &cacheYuvStructObj~
     * @return cacheYuvStructObj
     */
    // player.getDecodeFrameData = (pts, hardcopy=false) => {
    //     let ptr = AVModule.cwrap('getFrame', 'number', ['number'])(player.vcodecerPtr);
    //     if(!ptr) {
    //         throw new Error('ERROR ptr is not a Number!');
    //     }
    //     let width = AVModule.HEAPU32[ptr / 4];
    //     let height = AVModule.HEAPU32[ptr / 4 + 1];
    //     // //console.log(width, height);

    //     let imgBufferPtr = AVModule.HEAPU32[ptr / 4 + 1 + 1];
    //     let sizeWH = width * height;
    //     let imageBufferY = AVModule.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH);
    //     let imageBufferB = AVModule.HEAPU8.subarray(
    //         imgBufferPtr + sizeWH + 8,
    //         imgBufferPtr + sizeWH + 8 + sizeWH / 4
    //     );
    //     let imageBufferR = AVModule.HEAPU8.subarray(
    //         imgBufferPtr + sizeWH + 8 + sizeWH / 4 + 8,
    //         imgBufferPtr + sizeWH + 8 + sizeWH / 2 + 8
    //     );

    //     if (hardcopy) {
    //         imageBufferY = copyUint8Array(imageBufferY);
    //         imageBufferB = copyUint8Array(imageBufferB);
    //         imageBufferR = copyUint8Array(imageBufferR);
    //     }

    //     let cacheYuvStructObj = new CacheYUVStruct.CacheYuvStruct(
    //         pts, 
    //         width, height, 
    //         imageBufferY, imageBufferB, imageBufferR);

    //     return cacheYuvStructObj;
    // };
    /**
     * @TODO
     */
    player.cacheThread = () => {
        player.cacheLoop = window.setInterval(() => {
            if (player.cacheYuvBuf.getState() == CACHE_APPEND_STATUS_CODE.FULL) {
                // console.log("is full");
                return;
            }
            // console.log("not full");

            let getPktObj = player.getNalu1Packet(false);
            if (getPktObj == null) return;

            let nalBuf = getPktObj.nalBuf;
            let pts = getPktObj.pts;

            // decode Frame
            player.decodeNalu1Frame(nalBuf, pts, true);
        }, 10);
    };
    /**
     * 缓存中
     */
    player.loadCache = () => {
        // 就剩下最后3帧就别管了
        if (player.frameList.length <= 3) {
            return;
        }

        let isPlay = player.isPlaying;
        if (player.cacheYuvBuf.yuvCache.length <= 3) {
            player.pause();
            player.onLoadCache != null && player.onLoadCache();

            if (isPlay) {
                player.isCaching = def.CACHE_WITH_PLAY_SIGN;
            } else {
                player.isCaching = def.CACHE_WITH_NOPLAY_SIGN;
            }
        } else {
            return;
        }

        /*
         * 开始load CACHE_LENGTH 帧
         */
        let minCacheCount = player.frameList.length > CACHE_LENGTH ? CACHE_LENGTH : player.frameList.length;

        let cacheInterval = window.setInterval(() => {
            if (player.cacheYuvBuf.yuvCache.length >= minCacheCount) {
                player.onLoadCacheFinshed != null && player.onLoadCacheFinshed();
                window.clearInterval(cacheInterval);
                cacheInterval = null;

                if (player.isCaching === def.CACHE_WITH_PLAY_SIGN) {
                    player.play(player.playParams);
                }

                player.isCaching = def.CACHE_NO_LOADCACHE;
            }
        }, 40);
    };
    player.playFunc = () => {
        let ret = false;
        /*
         * If in the frame time can use it
         */
        if (
            player.playParams.seekEvent 
            || (getMsTime() - player.calcuteStartTime >= player.frameTime - player.preCostTime)
        ) {
            ret = true;
            let show = true;
            player.calcuteStartTime = getMsTime();
            // player.playFrameYUV(true, true);

            if (!player.config.audioNone) {
                /******************************************************
                 * 1. If have audio, need algin pts!
                 ******************************************************/
                if (player.fix_poc_err_skip > 0) {
                    player.fix_poc_err_skip--;
                    show = false;
                }

                // diff time of videoPTS and audioPTS
                let diff = player.videoPTS - player.audio.getAlignVPTS();
                if (diff > 0) {
                    /******************************************************
                     * 1.1 Video > Audio PTS
                     ******************************************************/
                    /*
                     * is Seeking
                     */
                    if (player.playParams.seekEvent && !player.config.audioNone) {
                        player.audio.setVoice(0);
                    }
                    return;

                } else {
                    /******************************************************
                     * 1.2 Video <= Audio PTS
                     ******************************************************/
                    // second check time
                    if (show) {
                        show = diff * (-1) <= player.frameTimeSec * DIFF_TIMES;
                        if (!show) {
                            /*
                             * Check how many frames after audio pts
                             */
                            let diffTimes = parseInt(diff / player.frameTimeSec);
                            for (let i = 0; i < diffTimes; i++) {
                                player.playFrameYUV(false, player.playParams.accurateSeek);
                            }

                            player.playFrameYUV(true, player.playParams.accurateSeek);
                        }
                        player.playFrameYUV(show, player.playParams.accurateSeek);
                    }

                }

            } else {
                /******************************************************
                 * 2. If no audio, dont care algin pts, only play video 
                 ******************************************************/
                player.playFrameYUV(show, player.playParams.accurateSeek);
            }
        }

        // handle seekEvent info
        if (player.playParams.seekEvent) {
            player.playParams.seekEvent = false;

            player.onSeekFinish();
            // if not playing , stop, only seek
            if (!player.isPlaying) {
                //console.log("playFunc ===========>seekEvent finised playFrame");
                player.playFrameYUV(true, player.playParams.accurateSeek);
                player.pause();
                // @TODO 有个小问题，如果在播放中 seek之后 则不会pause 那么就会音频有一帧小尾巴
            }

            if (!player.config.audioNone) {
                player.audio.setVoice(player.realVolume);
            }
        }

        player.onPlayingTime && player.onPlayingTime(player.videoPTS);
        player.checkFinished(player.playParams.mode);

        return ret;
    };
    /**
     * seekPos=-1, 
                mode=def.PLAYER_MODE_VOD, 
                accurateSeek=true, 
                seekEvent=false,
                realPlay=true
     */
    player.play = (playParams) => {

        /*
         * 播放参数
         */
        player.playParams = playParams;

        player.calcuteStartTime = getMsTime();
        player.noCacheFrame = 0;

        // for understand
        player.isPlaying = player.playParams.realPlay;
        //console.log("================> DEBUG 1", 
            // player.isPlaying, player.playParams.realPlay, player.playParams.seekEvent);

        // @TODO false && 
        if (player.config.audioNone === true && player.playParams.mode == def.PLAYER_MODE_NOTIME_LIVE) {
            player.liveStartMs = getMsTime();
            player.frameTime = Math.floor(1000 / player.config.fps);
            player.frameTimeSec = player.frameTime / 1000;

            // loop
            let frameIdx = 0;
            player.loop = window.setInterval(() => {
                // let test1time = getMsTime();
                let spendMs = getMsTime() - player.liveStartMs;
                let frameCount = spendMs / player.frameTime;
                // console.log("player.loop====>", spendMs, frameCount, frameIdx);

                if (frameCount >= frameIdx) {
                    player.playFrameYUV(true, player.playParams.accurateSeek);
                    frameIdx += 1;
                }
                // player.preCostTime = getMsTime() - test1time;
                // console.log("raw playFunc loop usage :", player.preCostTime);
                // player.onPlayingTime && player.onPlayingTime(player.videoPTS);
            }, 1); // player.frameTime

            // loop
            // let test1time = getMsTime();
            // player.loop = window.setInterval(() => {
            //     // let test1time = getMsTime();
            //     let ret = player.playFunc();
            //     if (ret === true) {
            //         player.preCostTime = getMsTime() - test1time;
            //         test1time = getMsTime();
            //     }
            //     console.log("playFunc loop usage :", player.preCostTime);
            // }, 1); // 5ms


        } else {

            if ((player.videoPTS >= player.playParams.seekPos && !player.isNewSeek)
                || (player.playParams.seekPos === 0.0 || player.playParams.seekPos === 0)) {

                player.frameTime = (1000 / player.config.fps);
                player.frameTimeSec = player.frameTime / 1000;
                // play start
                player.config.audioNone == false && player.audio.play();
                player.realVolume = player.config.audioNone ? 0 : player.audio.voice;
                // 临时把视频seek过快的bug藏起来
                if (player.playParams.seekEvent) {
                    player.fix_poc_err_skip = FIXED_POC_ERROR_WAIT_FRAMES;
                }

                // loop
                player.loop = window.setInterval(() => {
                    let test1time = getMsTime();
                    player.playFunc();
                    player.preCostTime = getMsTime() - test1time;
                    // console.log("playFunc loop usage :", player.preCostTime);
                }, 1); // 5ms

            } else { // SEEK if (player.videoPTS < seekPos && player.isNewSeek)
                //console.log("Seeking ...");
                player.loop = window.setInterval(() => {
                    player.playFrameYUV(false, player.playParams.accurateSeek);
                    if (!player.checkFinished(player.playParams.mode)) {
                        if (player.videoPTS >= player.playParams.seekPos) {
                            window.clearInterval(player.loop);
                            player.loop = null;
                            player.play(player.playParams);
                        }
                    } else {
                        window.clearInterval(player.loop);
                        player.loop = null;
                    }
                }, 1);
                player.isNewSeek = false;
            }

        }
        //console.log('Playing ...');
    };
    player.stop = () => {
        //console.log("============ STOP ===============");
        // player.endAudio();
        // player.loop && window.clearInterval(player.loop);
        // player.loop = null;
        // player.pause();
        // AVModule.cwrap('release', 'number', ['number'])(player.vcodecerPtr);
        // AVModule.cwrap('initializeDecoder', 'number', ['number'])(player.vcodecerPtr);
        // player.stream = new Uint8Array();
        // player.frameList.length = 0;
        // player.durationMs = -1.0;
        // player.videoPTS = 0;
        // player.isPlaying = false;
        player.release();
        AVModule.cwrap('initializeDecoder', 'number', ['number'])(player.vcodecerPtr);
        player.stream = new Uint8Array();
    };
    player.release = () => { // 释放
        player.endAudio();
        player.loop && window.clearInterval(player.loop);
        player.loop = null;
        player.pause();
        AVModule.cwrap('release', 'number', ['number'])(player.vcodecerPtr);
        player.stream = null;
        player.frameList.length = 0;
        player.durationMs = -1.0;
        player.videoPTS = 0;
        player.isPlaying = false;
        return true;
    };
    player.nextNalu = (onceGetNalCount=1) => {
        if (player.stream.length <= 4) return false;
        let startTag = -1; //start nal pos
        for (let i = 0; i < player.stream.length; i++) {
            if (i + 5 >= player.stream.length) {
                if (startTag == -1) return false;
                else {
                    let ret = player.stream.subarray(startTag);
                    player.stream = new Uint8Array();
                    return ret;
                }
            }
            // find nal
            let is3BitHeader = player.stream.slice(0, 3).join(' ') == '0 0 1';
            let is4BitHeader = player.stream.slice(0, 4).join(' ') == '0 0 0 1';
            if (is3BitHeader || is4BitHeader) {
                if (startTag == -1) startTag = i;
                else {
                    if (onceGetNalCount <= 1) {
                        let ret = player.stream.subarray(startTag, i);
                        player.stream = player.stream.subarray(i);
                        return ret;
                    }
                    else onceGetNalCount -= 1;
                }
                i += 3; //after got nal move by 3
            }
        }
        return false;
    };
    // @TODO
    player.decodeSendPacket = (nalBuf) => {
        // decode Frame
        let offset = AVModule._malloc(nalBuf.length);
        AVModule.HEAP8.set(nalBuf, offset);
        //console.log(nalBuf);

        let decRet = AVModule.cwrap('decodeSendPacket', 'number', ['number', 'number', 'number'])(player.vcodecerPtr, offset, nalBuf.length);

        //console.log("SendPacket decRet:", decRet);
        AVModule._free(offset);
        return decRet;
    };
    // @TODO
    player.decodeRecvFrame = () => {
        let decRet = AVModule.cwrap('decodeRecv', 'number', ['number'])(player.vcodecerPtr);
        //console.log("RecvFrame decRet:", decRet);
        return decRet;
    };
    // player.playFrame = (show=false, accurateSeek=false, decodeBefore=false) => {
    //     if (player.playFrameYUV(show, accurateSeek)) {
    //         return true;
    //     }

    //     let getPktObj = null;
    //     if (decodeBefore && null != player.nowPacket) { // 重复解码当前包，不继续下一个
    //         getPktObj = player.nowPacket;
    //     } else {
    //         getPktObj = player.getNalu1Packet();
    //         player.nowPacket = getPktObj;
    //     }

    //     if (getPktObj == null) return;
    //     let nalBuf = getPktObj.nalBuf;
    //     let pts = getPktObj.pts;

    //     // * conditions: "or"
    //     // * pre) nalBuf is not empty
    //     // * 1) seek to target and accurateSeek
    //     // * 2) show it
    //     if (nalBuf != false
    //     && (!show && accurateSeek) || show
    //     ) {
    //         let cacheYuvStructObj = player.decodeNalu1Frame(nalBuf, pts);

    //         //console.log(cacheYuvStructObj);
    //         if (!cacheYuvStructObj) return false;

    //         if (cacheYuvStructObj != false && show) {
    //             player.drawImage(
    //                 cacheYuvStructObj.width, 
    //                 cacheYuvStructObj.height, 
    //                 cacheYuvStructObj.imageBufferY, 
    //                 cacheYuvStructObj.imageBufferB, 
    //                 cacheYuvStructObj.imageBufferR);
    //         }
    //     }
    //     return true;
    // };
    /**
     * @brief play yuv cache
     */
    player.playFrameYUV = (show = false, accurateSeek = false) => {
        let yuvItemObj = player.cacheYuvBuf.vYuv();
        if (yuvItemObj == null) {
            //console.log("cacheThread ----> noCacheFrame");
            player.noCacheFrame += 1;

            // 只有在播放时候才会触发cache事件
            if (show && !player.playParams.seekEvent) {
                player.loadCache();
            }
            return false;
        }
        player.noCacheFrame = 0;
        //console.log("cacheThread ----> playFrameYUV", show);
        // console.log("cacheThread ----> pop pts " + yuvItemObj.pts);

        let pts = yuvItemObj.pts;
        player.videoPTS = pts;
        // player.config.audioNone == false && player.audio.setAlignVPTS(pts);
        // //console.log(yuvItemObj);

        /**
         * conditions: "or"
         * pre) nalBuf is not empty
         * 1) seek to target and accurateSeek
         * 2) show it
         */
        if ((!show && accurateSeek) || show) {
            if (show) {
                //console.log("cacheThread ----> render pts ", yuvItemObj);
                player.drawImage(
                    yuvItemObj.width,
                    yuvItemObj.height,
                    yuvItemObj.imageBufferY,
                    yuvItemObj.imageBufferB,
                    yuvItemObj.imageBufferR);
            }
        }
        // 只有在播放时候才会触发cache事件
        if (show && !player.playParams.seekEvent && player.isPlaying) {
            player.loadCache();
        }
        return true;
    };
    //canvas related functions
    player.drawImage = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        // check canvas width/height
        if (player.canvas.width !== width || player.canvas.height != height) {
            player.canvas.width = width;
            player.canvas.height = height;
        }

        // if (player.debugYUVSwitch) {
        //     let yuvbuffer = new Uint8Array(width * height * 3);
        //     yuvbuffer.set(imageBufferY, 0);
        //     yuvbuffer.set(imageBufferB, width * height);
        //     yuvbuffer.set(imageBufferR, width * height + ((width/2) * (height/2)));
        //     let bufferDebug = yuvbuffer.buffer;
        //     let blobDebug = new Blob([bufferDebug]);       // 注意必须包裹[]
        //     let blobUrl = window.URL.createObjectURL(blobDebug);
        //     alert(blobUrl);
        //     player.debugYUVSwitch = false;

        //     // window.navigator.msSaveBlob(blobUrl, "test.yuv");

        //     // player.debugID
        //     let debugA = document.createElement('a'); // 创建a标签
        //     debugA.href = blobUrl; // 指定下载链接a.download = fileName指定下载文件名
        //     debugA.download = "test.yuv";
        //     // 将a标签插入body中
        //     document.body.appendChild(debugA);
        //     debugA.click(); // 触发下载
        //     debugA.remove(); // 除a标签
        //     window.URL.revokeObjectURL(blobUrl); // 释放
        // }

        if (player.showScreen && player.onRender != null) {
            player.onRender(width, height, imageBufferY, imageBufferB, imageBufferR);
            // when full screen mode open,
            // do not render the main window,
            // only use fullscreen window
            return;
        }

        if (!player.isCheckDisplay) {
            let displayWH = player.checkDisplaySize(width, height); // TODO: only need to do this for one frame or not at all
        }
        // let yuvConfig = {
        //     width:          width,
        //     height:         height,
        //     chromaWidth:    width / 2,
        //     chromaHeight:   height / 2,
        //     displayWidth:   player.canvas.offsetWidth,
        //     displayHeight:  player.canvas.offsetHeight
        // };
        // let format = YUVBuffer.format(yuvConfig);
        // let frame = YUVBuffer.frame(format);
        // frame.y.bytes = imageBufferY;
        // frame.y.stride = width;
        // frame.u.bytes = imageBufferB;
        // frame.u.stride = width / 2;
        // frame.v.bytes = imageBufferR;
        // frame.v.stride = width / 2;
        // player.yuv.clear();
        // player.yuv.drawFrame(frame);

        let ylen = width * height;
        let uvlen = (width / 2) * (height / 2);
        let buffer = new Uint8Array(ylen + uvlen * 2);
        buffer.set(imageBufferY, 0);
        buffer.set(imageBufferB, ylen);
        buffer.set(imageBufferR, ylen + uvlen);
        RenderEngine420P.renderFrame(
            player.yuv,
            imageBufferY, imageBufferB, imageBufferR,
            width, height);
    };
    player.debugYUV = (debugID) => {
        player.debugYUVSwitch = true;
        player.debugID = debugID;
    };
    player.checkDisplaySize = (widthIn, heightIn) => {
        //console.log("checkDisplaySize==========>", widthIn, heightIn);
        let biggerWidth = widthIn / player.config.width > heightIn / player.config.height;
        let fixedWidth = (player.config.width / widthIn).toFixed(2);
        let fixedHeight = (player.config.height / heightIn).toFixed(2);
        let scaleRatio = biggerWidth ? fixedWidth : fixedHeight;
        let isFixed = player.config.fixed;
        let width = isFixed ? player.config.width : parseInt(widthIn  * scaleRatio);
        let height = isFixed ? player.config.height : parseInt(heightIn * scaleRatio);
        if (player.canvas.offsetWidth != width || player.canvas.offsetHeight != height) {
            let topMargin = parseInt((player.canvasBox.offsetHeight - height) / 2);
            let leftMargin = parseInt((player.canvasBox.offsetWidth - width) / 2);
            //console.log(topMargin, leftMargin);
            player.canvas.style.marginTop = topMargin + 'px';
            player.canvas.style.marginLeft = leftMargin + 'px';
            player.canvas.style.width = width + 'px';
            player.canvas.style.height = height + 'px';
        }
        player.isCheckDisplay = true;
        return [width, height];
    };
    player.makeWasm = () => {
        if (player.config.token == null) {
            alert("请输入TOKEN！Please set token param!");
            return;
        }
        player.vcodecerPtr = AVModule.cwrap('registerPlayer', 
            'number', 
            ['string', 'string'])(player.config.token, VersionModule.PLAYER_VERSION);

        let videoCallback = AVModule.addFunction(function(addr_y, addr_u, addr_v, stride_y, stride_u, stride_v, width, height, pts) {
            console.log("In video callback, size = %d * %d, pts = %f", width, height, pts);

            let out_y = AVModule.HEAPU8.subarray(addr_y, addr_y + stride_y * height);
            let out_u = AVModule.HEAPU8.subarray(addr_u, addr_u + (stride_u * height) / 2);
            let out_v = AVModule.HEAPU8.subarray(addr_v, addr_v + (stride_v * height) / 2);
            let buf_y = new Uint8Array(out_y);
            let buf_u = new Uint8Array(out_u);
            let buf_v = new Uint8Array(out_v);
            // player.drawImage(stride_y, height, buf_y, buf_u, buf_v);
            // let data = new Uint8Array(buf_y.length + buf_u.length + buf_v.length)

            let ptsSec = pts * 1.0 / 1000;
            let cacheYuvStructObj = new CacheYUVStruct.CacheYuvStruct(
                ptsSec, 
                stride_y, height, 
                buf_y, buf_u, buf_v);

            player.cacheYuvBuf.appendCacheByCacheYuv(cacheYuvStructObj);
        });

        AVModule.cwrap('setCodecType', 'number', ['number', 'number', 'number'])(
            player.vcodecerPtr, player.config.videoCodec, videoCallback);
        // WASM
        let ret1 = AVModule.cwrap('initMissile', 'number', ['number'])(player.vcodecerPtr);
        //console.log('initMissile ret:' + ret1);
        ret1 = AVModule.cwrap('initializeDecoder', 'number', ['number'])(player.vcodecerPtr);
        //console.log("initializeDecoder ret:" + ret1);
    };
    player.makeIt = () => {
        let canvasBox = document.querySelector('div#' + player.config.playerId);
        // canvasBox.style.position = 'relative';
        // canvasBox.style.backgroundColor = 'black';
        // canvasBox.style.width = player.config.width + 'px';
        // canvasBox.style.height = player.config.height + 'px';
        let canvas = document.createElement('canvas');
        canvas.style.width = canvasBox.clientWidth + 'px';
        canvas.style.height = canvasBox.clientHeight + 'px';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvasBox.appendChild(canvas);
        player.canvasBox = canvasBox;
        player.canvas = canvas;

        // yuv-canvas
        // player.yuv = YUVCanvas.attach(canvas); // player.yuv.clear() //clearing the canvas?

        // webgl
        // //console.log(RenderEngine420P);
        player.yuv = RenderEngine420P.setupCanvas(canvas, {
            preserveDrawingBuffer: false
        });

        // Audio
        if (player.config.audioNone == false) {
            player.audio = AudioModule({
                sampleRate: player.config.sampleRate,
                appendType: player.config.appendHevcType
            });
        }
        player.isPlayLoadingFinish = 1;
    };
    player.makeWasm();
    player.makeIt();
    player.cacheThread(); // @DEBUG-haokan
    return player;
}
