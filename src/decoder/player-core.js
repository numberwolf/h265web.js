//TODO: separate out the canvas logic and the hevc decoder logic
const YUVBuffer = require('yuv-buffer');
const YUVCanvas = require('yuv-canvas');
const Module = require('./missile.js');
const AudioModule = require('./audio-core');
// const ScreenModule = require('./screen');
const def = require('../consts');

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
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID
        },
        /*
         * frame.data
         * frame.pts
         */
        frameList: [],
        stream: new Uint8Array(),
        audio: AudioModule({
            sampleRate: config.sampleRate,
            appendType: config.appendHevcType
        }),
        // screenView: new ScreenModule.Screen(),
        durationMs: -1.0,
        videoPTS: 0,
        loop: null,
        isPlaying: false,
        isNewSeek: false,
        // setting
        showScreen: false,
        // event
        onPlayingTime : null,
        onPlayingFinish : null,
        onSeekFinish : null,
        onRender : null
    }
    player.setScreen = (setVal = false) => {
        player.showScreen = setVal;
    };
    player.setSize = (width, height) => {
        player.config.width = width || def.DEFAULT_WIDTH
        player.config.height = height || def.DEFAULT_HEIGHT
    }
    player.setFrameRate = (fps = 25) => {
        player.config.fps = fps;
        player.config.frameDurMs = 1000 / fps; // got ms
    }
    player.setDurationMs = (durationMs = -1) => {
        player.durationMs = durationMs
        player.audio.setDurationMs(durationMs)
    }
    player.setPlayingCall = callback => {
        player.onPlayingTime = callback;
    }
    player.setVoice = voice => {
        player.audio.setVoice(voice);
    }
    player.appendAACFrame = streamBytes => player.audio.addSample(streamBytes)
    player.endAudio = () => {
        player.audio.stop();
    }
    player.cleanSample = () => {
        player.audio.cleanQueue()
    }
    player.cleanVideoQueue = () => {
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            player.stream = new Uint8Array();
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            player.frameList = [];
        }
    }
    player.pause = () => {
        player.loop && window.clearInterval(player.loop);
        player.audio.pause();
        player.isPlaying = false;
    }
    player.checkFinished = (mode = def.PLAYER_MODE_VOD) => {
        // console.log((mode == def.PLAYER_MODE_VOD) + ",pause:" + player.videoPTS.toFixed(1) + "," + (player.durationMs - player.config.frameDurMs) / 1000);
        if (mode == def.PLAYER_MODE_VOD &&
            player.videoPTS.toFixed(1) >= (player.durationMs - player.config.frameDurMs) / 1000) {
            // player.pause();
            if (player.onPlayingFinish != null) {
                player.onPlayingFinish();
            }
            return true;
        }
        return false;
    }
    /**
     * options:
     *      seekTime        : seekTime,
     *      mode            : _this.playMode,
    *       accurateSeek    : _this.configFormat.accurateSeek
     */
    player.seek = (execCall, options = {}) => {
        let statusNow = player.isPlaying;
        player.pause();
        player.cleanSample();
        player.cleanVideoQueue();
        if (execCall) {
            execCall();
        }
        player.isNewSeek = true;
        // temp set videoPTS to int() idx
        player.videoPTS = parseInt(options.seekTime);
        if (statusNow) {
            // setTimeout(() => {
            player.play(options.seekTime, options.mode, options.accurateSeek);
            // }, 1000);
        }
    }
    player.play = (seekPos = -1, mode = def.PLAYER_MODE_VOD, accurateSeek = false) => {
        player.isPlaying = true;
        // console.log("mode:" + mode);
        if (mode == def.PLAYER_MODE_NOTIME_LIVE ||
            (player.videoPTS >= seekPos && !player.isNewSeek)) {
            player.loop = window.setInterval(() => {
                player.playFrame(true, accurateSeek);
                player.onPlayingTime && player.onPlayingTime(player.videoPTS);
                player.checkFinished(mode);
                // console.log("videoPTS:" + player.videoPTS + ",mode:" + mode);
            }, 1000 / player.config.fps);

            player.audio.play();
        } else { // SEEK if (player.videoPTS < seekPos && player.isNewSeek)
            player.loop = window.setInterval(() => {
                // console.log(seekPos + " ~ " +(player.videoPTS * 1000) + " ~2 " + player.durationMs);

                player.playFrame(false, accurateSeek);
                if (!player.checkFinished(mode)) {
                    // player.onPlayingTime && player.onPlayingTime(player.videoPTS)

                    if (player.videoPTS >= seekPos) {
                        window.clearInterval(player.loop);
                        player.loop = null;
                        player.play(seekPos, mode, accurateSeek);
                        if (player.onSeekFinish != null) player.onSeekFinish();
                    }
                }
            }, 0);
            player.isNewSeek = false;
        }
        console.log('Playing ...')
    }
    player.stop = () => {
        console.log("============ STOP ===============");
        player.loop && window.clearInterval(player.loop);
        player.loop = null;
        player.pause();
        player.endAudio();
        Module.cwrap('release', 'number', [])();
        Module.cwrap('initializeDecoder', 'number', [])();
        player.stream = new Uint8Array();
        player.frameList.length = 0;
        player.durationMs = -1.0;
        player.videoPTS = 0;
        player.isPlaying = false;
    }
    player.nextNalu = (onceGetNalCount=1) => {
        if (player.stream.length <= 4) return false
        let startTag = -1 //start nal pos
        for (let i = 0; i < player.stream.length; i++) {
            if (i + 5 >= player.stream.length) {
                if (startTag == -1) return false;
                else {
                    let ret = player.stream.subarray(startTag)
                    player.stream = new Uint8Array()
                    return ret
                }
            }
            // find nal
            let is3BitHeader = player.stream.slice(0, 3).join(' ') == '0 0 1'
            let is4BitHeader = player.stream.slice(0, 4).join(' ') == '0 0 0 1'
            if (is3BitHeader || is4BitHeader) {
                if (startTag == -1) startTag = i
                else {
                    if (onceGetNalCount <= 1) {
                        let ret = player.stream.subarray(startTag, i)
                        player.stream = player.stream.subarray(i)
                        return ret
                    }
                    else onceGetNalCount -= 1
                }
                i += 3 //after got nal move by 3
            }
        }
        return false
    }
    player.appendHevcFrame = streamBytes => { //TODO: assert if streamBytes is not null
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM)
            player.stream = new Uint8Array([...player.stream].concat(...streamBytes))
        else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            player.frameList.push(streamBytes)
        }
    }
    player.playFrame = (show = false, accurateSeek = false) => {
        // console.log(show);
        let nalBuf  = null
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            nalBuf = player.nextNalu() // nal
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            let frame = player.frameList.shift(); // nal
            !frame && console.log('got empty frame');
            if(!frame) {
                return false;
            }
            // console.log(frame);
            nalBuf = frame.data;
            player.videoPTS = frame.pts;
            player.audio.setAlignVPTS(frame.pts);
        } else {
            return false;
        }

        /**
         * conditions: "or"
         * pre) nalBuf is not empty
         * 1) seek to target and accurateSeek
         * 2) show it
         */
        if (nalBuf != false
        && (!show && accurateSeek) || show
        ) {
            // console.log(nalBuf);
            let offset = Module._malloc(nalBuf.length);
            Module.HEAP8.set(nalBuf, offset);

            let decRet = Module.cwrap('decodeCodecContext', 'number', ['number', 'number'])(offset, nalBuf.length);
            // console.log(decRet);

            if (decRet < 0) {
                Module._free(offset);
                return false;
            }

            // while (decRet == 0) {
            //     decRet = Module.cwrap('decodeCodecContext', 'number', ['number', 'number'])(offset, nalBuf.length);
            //     console.log(decRet);
            // }

            // If show, draw YUV webGL
            if (decRet > 0 && show) {
                // let ptr = Module.cwrap('getFrame', 'number', [])();
                // if(!ptr) {
                //     throw new Error('ERROR ptr is not a Number!');
                // }
                // sub block [m,n] //TODO: put all of this into a nextFrame() function
                let ptr = Module.cwrap('getFrame', 'number', [])();
                if(!ptr) {
                    throw new Error('ERROR ptr is not a Number!');
                }
                let width = Module.HEAPU32[ptr / 4];
                let height = Module.HEAPU32[ptr / 4 + 1];
                // console.log(width, height);

                let imgBufferPtr = Module.HEAPU32[ptr / 4 + 1 + 1];
                let sizeWH = width * height;
                let imageBufferY = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH);
                let imageBufferB = Module.HEAPU8.subarray(
                    imgBufferPtr + sizeWH + 8,
                    imgBufferPtr + sizeWH + 8 + sizeWH / 4
                );
                let imageBufferR = Module.HEAPU8.subarray(
                    imgBufferPtr + sizeWH + 8 + sizeWH / 4 + 8,
                    imgBufferPtr + sizeWH + 8 + sizeWH / 2 + 8
                );
                if (!width || !height) throw new Error('Get PicFrame failed! PicWidth/height is equal to 0, maybe timeout!');
                else player.drawImage(width, height, imageBufferY, imageBufferB, imageBufferR);
            } //  end if decRet
            Module._free(offset);
        }
        return true;
    }
    //canvas related functions
    player.drawImage = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        if (player.showScreen && player.onRender != null) {
            player.onRender(width, height, imageBufferY, imageBufferB, imageBufferR);
            // when full screen mode open,
            // do not render the main window,
            // only use fullscreen window
            return;
        }

        let displayWH = player.checkDisplaySize(width, height); // TODO: only need to do this for one frame or not at all
        let format = YUVBuffer.format({
            width:          width,
            height:         height,
            chromaWidth:    width / 2,
            chromaHeight:   height / 2,
            displayWidth:   player.canvas.offsetWidth,
            displayHeight:  player.canvas.offsetHeight
        })
        let frame = YUVBuffer.frame(format);
        frame.y.bytes = imageBufferY;
        frame.y.stride = width;
        frame.u.bytes = imageBufferB;
        frame.u.stride = width / 2;
        frame.v.bytes = imageBufferR;
        frame.v.stride = width / 2;
        player.yuv.drawFrame(frame);

        // if (player.showScreen) {
        //     player.screenView.open();
        //     player.screenView.render(width, height, imageBufferY, imageBufferB, imageBufferR);
        // } else {
        //     player.screenView.close();
        // }
    }
    player.checkDisplaySize = (widthIn, heightIn) => {
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
            player.canvas.style.marginTop = topMargin + 'px';
            player.canvas.style.marginLeft = leftMargin + 'px';
            player.canvas.style.width = width + 'px';
            player.canvas.style.height = height + 'px';
        }
        return [width, height];
    }
    player.makeGL = () => {
        let canvasBox = document.querySelector('div#' + player.config.playerId);
        canvasBox.style.position = 'relative';
        canvasBox.style.backgroundColor = 'black';
        canvasBox.style.width = player.config.width + 'px';
        canvasBox.style.height = player.config.height + 'px';
        let canvas = document.createElement('canvas');
        canvas.style.width = canvasBox.clientWidth + 'px';
        canvas.style.height = canvasBox.clientHeight + 'px';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvasBox.appendChild(canvas);
        player.canvasBox = canvasBox;
        player.canvas = canvas;
        player.yuv = YUVCanvas.attach(canvas); // player.yuv.clear() //clearing the canvas?
        // toast
        // let toast = document.createElement('div');
        // console.log('player config', player.config)
    };
    player.makeGL();
    return player;
}
