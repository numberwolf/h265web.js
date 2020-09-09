const Player = require('./decoder/player-core');
const MPEG_JS = require('mpeg.js');
const Mp4Parser = require('./demuxer/mp4');
const MpegTSParser = require('./demuxer/ts');
const M3U8Parser = require('./demuxer/m3u8');
const def = require('./consts');
const staticMem = require('./utils/static-mem');
const UI = require('./utils/ui/ui');
const Module = require('./decoder/missile.js');

class H265webjsModule {
    // static myStaticProp = 42;

    /**
     * @param videoURL String
     * @param config Dict: {
     *              player : string
     *              width : int32
     *              height : int32
     * }
     */
    constructor(videoURL, config) {
        // Module
        this.mp4Obj = null;
        this.mpegTsObj = null;
        this.hlsObj = null;
        this.hlsConf = {
            hlsType : def.PLAYER_IN_TYPE_M3U8_VOD
        }

        this.uiObj = new UI.UI();

        // val
        this.videoURL = videoURL;
        this.configFormat = {
            playerId : config.player || def.DEFAILT_WEBGL_PLAY_ID,
            playerW : config.width || def.DEFAULT_WIDTH,
            playerH : config.height || def.DEFAULT_HEIGHT,
            type : config.type || def.PLAYER_IN_TYPE_MP4,
            accurateSeek : config.accurateSeek || false,
            playIcon : config.playIcon || "assets/icon-play@300.png"
        };

        this.playMode = def.PLAYER_MODE_VOD;
        this.seekTarget = 0;
        this.playParam = null; // {durationMs ... }

        // util
        this.progress = null;
        this.timerFeed = null;
        this.player = null;
        this.playBar = null;
        this.status = null;
        this.ptsLabel = null;
        this.controlBar = null;

        // func
        this.feedMP4Data = null;

        // Event
        // param pts
        this.onPlayTime = null;
        this.onLoadFinish = null;
    }

    /**********
     Public
     **********/
    do() {
        let _this = this;
        // durationMs, fps, sampleRate, size
        this.playParam = {
            durationMs : 0,
            fps : 0,
            sampleRate : 0,
            size : {
                width : 0,
                height : 0
            }
        };
        if (!window.WebAssembly) {
            let tip = 'unsupport WASM!';
            if (/iPhone|iPad/.test(window.navigator.userAgent)) {
                tip += ' ios:min-version 11'
            }
            alert(tip);
            alert("Please check your browers, it not support wasm! See:https://www.caniuse.com/#search=wasm");
        } else {
            console.log("to onRuntimeInitialized "
                + global.STATIC_MEM_wasmDecoderState);
            if (global.STATIC_MEM_wasmDecoderState == 1) {
                console.log("wasm already inited!");
                if (_this.configFormat.type == def.PLAYER_IN_TYPE_MP4) {
                    _this._makeMP4Player(_this.configFormat);
                    _this._playerUtilBuildMask();
                    _this._playUtilShowMask();
                }
            } else {
                Module.onRuntimeInitialized = () => {
                    global.STATIC_MEM_wasmDecoderState = 1;

                    console.log('WASM initialized ' + global.STATIC_MEM_wasmDecoderState);
                    Module.cwrap('initMissile', 'number', [])();
                    console.log('Initialized Decoder');
                    Module.cwrap('initializeDecoder', 'number', [])();

                    _this._makeMP4Player(_this.configFormat);
                    _this._playerUtilBuildMask();
                    _this._playUtilShowMask();
                };
            }
        } // end if c
    }

    play() {
        this._playUtilHiddenMask();
        this.playBar.textContent = '||';
        this.player.play(this._getSeekTarget(), this.playMode, this.configFormat.accurateSeek);
        return true;
    }

    pause() {
        this._playUtilShowMask();
        this.playBar.textContent = '>';
        this.player.pause();
        return true;
    }

    isPlaying() {
        return this.player.isPlaying;
    }

    setVoice(voice) {
        if (voice < 0) {
            console.log("voice must larger than 0.0!");
            return false;
        }
        this.player.setVoice(voice);
    }

    mediaInfo() {
        return this.playParam;
    }

    seek(clickedValue) {
        let _this = this;
        this.seekTarget = clickedValue;

        // accurateSeek or not ,check it and give time's pos
        let seekTime = this._getSeekTarget();
        this.player.seek(
            () => { // call
                if (_this.configFormat.type == def.PLAYER_IN_TYPE_MP4) {
                    // _this.mp4Obj.seek(_this.seekTarget);
                    _this.mp4Obj.seek(clickedValue);
                } else if (
                    _this.configFormat.type == def.PLAYER_IN_TYPE_TS ||
                    _this.configFormat.type == def.PLAYER_IN_TYPE_MPEGTS)
                {
                    // _this.mpegTsObj.seek(_this.seekTarget);
                    _this.mpegTsObj.seek(clickedValue);
                } else if (_this.configFormat.type == def.PLAYER_IN_TYPE_M3U8) {
                    // _this.hlsObj.seek(_this.seekTarget);
                    _this.hlsObj.seek(clickedValue);
                }

                _this.feedMP4Data(
                    parseInt(_this._getBoxBufSeekIDR()), // buf IDX
                );
            },
            { // seek options
                seekTime : seekTime,
                mode : _this.playMode,
                accurateSeek : _this.configFormat.accurateSeek
            }
        );
        return true;
    }

    /**********
     Private
     **********/
    _getMaskId() {
        let maskTag = {
            "maskBgId" : 'mask-bg-' + this.configFormat.playerId,
            "maskFgId" : 'mask-fg-' + this.configFormat.playerId,
            "maskImg" : 'mask-img-' + this.configFormat.playerId,
        };
        return maskTag
    }

    _getMaskDom() {
        let maskBgTag = this._getMaskId();
        return {
            "maskBg" : document.querySelector('div#' + maskBgTag.maskBgId),
            "maskFg" : document.querySelector('div#' + maskBgTag.maskFgId),
            "maskImg" : document.querySelector('img#' + maskBgTag.maskImg),
        }
    }

    _durationText(duration) {
        if (duration < 0) {
            return "Play";
        }
        let durationSecInt = Math.round(duration);
        return Math.floor(durationSecInt / 3600)
        + ":" + Math.floor((durationSecInt % 3600) / 60)
        + ":" + Math.floor(durationSecInt % 60);
    }

    _playerUtilBuildMask() {
        let _this = this;
        let maskBgTag = this._getMaskId();
        let canvasBox = document.querySelector('div#' + this.configFormat.playerId);
        let maskBg = document.createElement('div');
        // let maskFg = document.createElement('div');
        let maskImg = document.createElement('img');

        maskBg.setAttribute("id", maskBgTag.maskBgId);
        maskImg.setAttribute("id", maskBgTag.maskImg);

        maskBg.style.width = this.configFormat.playerW + 'px'
        maskBg.style.height = this.configFormat.playerH + 'px'
        maskBg.style.top = '0px'
        maskBg.style.left = '0px'
        maskBg.style.position = 'absolute';
        // maskBg.style.display = 'none';
        maskBg.style.display = 'block';
        maskBg.style.backgroundColor = 'black';
        maskBg.style.zIndex = '1002';
        maskBg.style.opacity = '0.00';
        maskBg.style.filter = 'alpha(opacity=0)';

        maskImg.style.width = '20%'
        maskImg.style.height = '20%'
        maskImg.style.top = '40%'
        maskImg.style.left = '40%'
        maskImg.style.display = 'block';
        maskImg.style.position = 'absolute';
        maskImg.style.zIndex = '1001';
        // maskImg.style.backgroundColor = 'yellow';
        maskImg.style.overflow = 'auto';
        maskImg.style.opacity = '0.00';
        maskImg.style.filter = 'alpha(opacity=0)';

        maskImg.src = this.configFormat.playIcon;
        // maskImg.style.width = maskFg.style.width
        // maskImg.style.height = maskFg.style.width

        // event
        maskBg.onclick = () => {
            _this._playControl();
        };

        canvasBox.appendChild(maskBg);
        canvasBox.appendChild(maskImg);
        canvasBox.appendChild(this.controlBar);
    }

    _playUtilShowMask() {
        let maskDom = this._getMaskDom();
        // maskDom.maskBg.style.display = 'block';
        maskDom.maskBg.style.opacity = '0.10';
        maskDom.maskBg.style.filter = 'alpha(opacity=10)';

        maskDom.maskImg.style.opacity = '1.0';
        maskDom.maskImg.style.filter = 'alpha(opacity=100)';
    }

    _playUtilHiddenMask() {
        let maskDom = this._getMaskDom();
        // maskDom.maskBg.style.display = 'block';
        maskDom.maskBg.style.opacity = '0.00';
        maskDom.maskBg.style.filter = 'alpha(opacity=0)';

        maskDom.maskImg.style.opacity = '0.00';
        maskDom.maskImg.style.filter = 'alpha(opacity=0)';
    }

    _getSeekTarget() {
        return this.configFormat.accurateSeek ? this.seekTarget : this._getBoxBufSeekIDR();
    }

    _getBoxBufSeekIDR() {
        if (this.configFormat.type == def.PLAYER_IN_TYPE_MP4) {
            return this.mp4Obj.seekPos;
        } else if (this.configFormat.type == def.PLAYER_IN_TYPE_TS
            || this.configFormat.type == def.PLAYER_IN_TYPE_MPEGTS) {
            return this.mpegTsObj.seekPos;
        } else if (this.configFormat.type == def.PLAYER_IN_TYPE_M3U8) {
            return this.hlsObj.seekPos;
        }
    }

    _playControl() {
        this.isPlaying() ? this.pause() : this.play();
    }

    _createConntrolBar() {
        let _this = this;
        this.controlBar = this.uiObj.createControlBar(this.configFormat.playerW, '1003');
        this.status = this.uiObj.createStatusBar();
        this.playBar = this.uiObj.createPlayBtn();
        this.ptsLabel = this.uiObj.createPTSLabel();
        this.progress = this.uiObj.createProgress();

        this.controlBar.appendChild(this.progress);
        this.controlBar.appendChild(this.status);
        this.controlBar.appendChild(this.playBar);
        this.controlBar.appendChild(this.ptsLabel);
    }

    _makeMP4Player() {
        let _this = this;
        this._createConntrolBar();

        /*
         * Switch Media
         */
        // console.log("type: " + this.configFormat.type);
        if (this.configFormat.type == def.PLAYER_IN_TYPE_MP4) {
            this._mp4Entry();
        } else if (
            this.configFormat.type == def.PLAYER_IN_TYPE_TS ||
            this.configFormat.type == def.PLAYER_IN_TYPE_MPEGTS)
        {
            this._mpegTsEntry();
        } else if (this.configFormat.type == def.PLAYER_IN_TYPE_M3U8) {
            this._m3u8Entry();
        }

        if (this.configFormat.type == def.PLAYER_IN_TYPE_M3U8 &&
            this.hlsConf.hlsType == def.PLAYER_IN_TYPE_M3U8_LIVE) {
            this.playMode = def.PLAYER_MODE_NOTIME_LIVE;
        }

    } // end

    _makeMP4PlayerViewEvent(durationMs, fps, sampleRate, size) {
        let _this = this;
        // set play params in this entry
        this.playParam.durationMs = durationMs;
        this.playParam.fps = fps;
        this.playParam.sampleRate = sampleRate;
        this.playParam.size = size;
        // ui
        this.ptsLabel.textContent = '0:0:0/' + _this._durationText(this.progress.max = durationMs / 1000);
        // dur seconds
        // let durationSec = parseInt(durationMs / 1000);

        this.player = Player({
            width: this.configFormat.playerW,
            height: this.configFormat.playerH,
            sampleRate: sampleRate,
            fps: fps,
            appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
            fixed: false, // is strict to resolution?
            playerId: this.configFormat.playerId
        });
        this.player.onPlayingTime = videoPTS => {
            _this.progress.value = videoPTS;
            let now = _this._durationText(videoPTS);
            let total = _this._durationText(durationMs / 1000);
            // event
            if (_this.onPlayTime != null) _this.onPlayTime(videoPTS);

            if (_this.hlsObj != null && _this.hlsConf.hlsType == def.PLAYER_IN_TYPE_M3U8_LIVE) {
                _this.ptsLabel.textContent = `${now}/${def.DEFAULT_STRING_LIVE}`;
            } else {
                _this.ptsLabel.textContent = `${now}/${total}`;
                // console.log(_this.playParam.durationMs / 1000, videoPTS.toFixed(1));
                // if (_this.playParam.durationMs / 1000 <= videoPTS.toFixed(1)) {
                //     _this.pause();
                //     return;
                // }
            }
        };
        this.player.onPlayingFinish = () => {
            _this.pause();
        };

        if (this.hlsConf.hlsType == def.PLAYER_IN_TYPE_M3U8_LIVE) {
            _this.progress.hidden = true;
        } else {
            _this.progress.hidden = false;
        }
        /**
         * SEEK Progress
         */
        _this.progress.addEventListener('click', (e) => {
            let x = e.pageX - _this.progress.offsetLeft; // or e.offsetX (less support, though)
            let y = e.pageY - _this.progress.offsetTop;  // or e.offsetY
            let clickedValue = x * _this.progress.max / _this.progress.offsetWidth;
            if (_this.timerFeed) {
                window.clearInterval(_this.timerFeed);
                _this.timerFeed = null;
            }
            _this.seek(clickedValue);
        });

        _this.player.setDurationMs(durationMs);
        // player.setSize(size.width, size.height);
        _this.player.setFrameRate(fps);

        _this.status.textContent = '';
        _this.playBar.disabled = false;
        _this.playBar.onclick = () => {
            _this._playControl();
        } // this.player.stop()

        if (_this.onLoadFinish != null) {
            _this.onLoadFinish();
        }
    }

    /********************************************************************
     ********************************************************************
     ********************                    ****************************
     ********************     media type     ****************************
     ********************                    ****************************
     ********************************************************************
     ********************************************************************/
    _mp4Entry() {
        let _this = this;

        fetch(this.videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
            // demux mp4
            this.timerFeed = null;
            this.mp4Obj = new Mp4Parser();
            this.mp4Obj.demux(streamBuffer);
            this.mp4Obj.seek(-1);
            let durationMs  = this.mp4Obj.getDurationMs();
            let fps         = this.mp4Obj.getFPS();
            let sampleRate  = this.mp4Obj.getSampleRate();
            let size        = this.mp4Obj.getSize();
            this._makeMP4PlayerViewEvent(durationMs, fps, sampleRate, size);
            // // dur seconds
            let durationSec = parseInt(durationMs / 1000);

            //TODO: get all the data at once syncronously or feed data through a callback if streamed
            this.feedMP4Data = (secIdx = 0, call = null) => {
                this.timerFeed = window.setInterval(() => {
                    let videoFrame = this.mp4Obj.popBuffer(1, secIdx);
                    let audioFrame = this.mp4Obj.popBuffer(2, secIdx);
                    if (videoFrame != null) {
                        for (var i = 0; i < videoFrame.length; i++) {
                            this.player.appendHevcFrame(videoFrame[i]);
                        }
                    }
                    if (audioFrame != null) {
                        for (var i = 0; i < audioFrame.length; i++) {
                            this.player.appendAACFrame(audioFrame[i]);
                        }
                    }
                    if (videoFrame != null || audioFrame != null) {
                        secIdx++;
                    }

                    // console.log(secIdx + "," + durationSec);
                    if (secIdx >= durationSec) {
                        window.clearInterval(this.timerFeed);
                        this.timerFeed = null;
                        // console.log("loading finished");

                        if (call != null) {
                            call();
                        }
                        return;
                    }
                }, 10);
            }
            this.feedMP4Data(0);
        }); // end fetch
    }

    _mpegTsEntry() {
        console.log("entry ts");
        let _this = this;
        this.timerFeed = null;
        this.mpegTsObj = new MpegTSParser.MpegTs();
        this.mpegTsObj.bindReady(_this);

        this.mpegTsObj.onDemuxed = this._mpegTsEntryReady;
        this.mpegTsObj.onReady = () => {
            console.log("onReady");
            /*
             * start
             */
            fetch(_this.videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
                streamBuffer.fileStart = 0;
                // array buffer to unit8array
                let streamUint8Buf = new Uint8Array(streamBuffer);
                // console.log(streamUint8Buf);
                _this.mpegTsObj.demux(streamUint8Buf);
            });
        };
        this.mpegTsObj.initMPEG();
    }

    /**
     * @brief onReadyOBJ is h265webclazz
     */
    _mpegTsEntryReady (onReadyOBJ) {
        let _this = onReadyOBJ;
        let durationMs  = _this.mpegTsObj.getDurationMs();
        let fps         = _this.mpegTsObj.getFPS();
        let sampleRate  = _this.mpegTsObj.getSampleRate();
        let size        = _this.mpegTsObj.getSize();
        // console.log(sampleRate);

        _this._makeMP4PlayerViewEvent(durationMs, fps, sampleRate, size);
        // dur seconds
        let durationSecFloat = durationMs / 1000;
        let durationSec = parseInt(durationSecFloat);

        //TODO: get all the data at once syncronously or feed data through a callback if streamed
        _this.feedMP4Data = (secIdx = 0, call = null) => {
            _this.timerFeed = window.setInterval(() => {
                let videoFrame = _this.mpegTsObj.popBuffer(1, secIdx);
                let audioFrame = _this.mpegTsObj.popBuffer(2, secIdx);
                if (videoFrame != null) {
                    for (var i = 0; i < videoFrame.length; i++) {
                        _this.player.appendHevcFrame(videoFrame[i]);
                    }
                }
                if (audioFrame != null) {
                    for (var i = 0; i < audioFrame.length; i++) {
                        // console.log(audioFrame[i]);
                        _this.player.appendAACFrame(audioFrame[i]);
                    }
                }
                if (videoFrame != null || audioFrame != null) {
                    secIdx++;
                }

                // console.log(secIdx + "," + durationSecFloat);
                if (secIdx >= durationSecFloat) {
                    window.clearInterval(_this.timerFeed);
                    _this.timerFeed = null;
                    // console.log("loading finished");
                    if (call != null) {
                        call();
                    }
                    return;
                }
            }, 10);
        };
        // feed
        _this.feedMP4Data(0);
    }

    /**
     * @brief m3u8
     */
    _m3u8Entry() {
        let _this = this;
        let readyFinState = false;
        let durationMs = 0;
        let durationSecFloat;

        this.hlsObj = new M3U8Parser.M3u8();
        this.hlsObj.bindReady(_this);

        // time onFinish -> onDemuxed
        this.hlsObj.onFinished = (readyObj, callFinData) => {
            if (readyFinState == false) {
                // get type duration
                // init player duration
                durationMs  = _this.hlsObj.getDurationMs();
                durationSecFloat = durationMs / 1000;
                _this.ptsLabel.textContent = '0:0:0/' + _this._durationText(_this.progress.max = durationMs / 1000)

                _this.hlsConf.hlsType = callFinData.type;
                readyFinState = true;
            } // end if
        };

        this.hlsObj.onDemuxed = (readyObj) => {
            if (_this.player == null) {
                let fps         = _this.hlsObj.getFPS();
                let sampleRate  = _this.hlsObj.getSampleRate();
                let size        = _this.hlsObj.getSize();
                // console.log("sampleRate: " + sampleRate);
                _this._makeMP4PlayerViewEvent(durationMs, fps, sampleRate, size);

                this.feedMP4Data = (secIdx = 0, call = null) => {
                    _this.timerFeed = window.setInterval(() => {
                        let videoFrame = _this.hlsObj.popBuffer(1, secIdx);
                        let audioFrame = _this.hlsObj.popBuffer(2, secIdx);
                        if (videoFrame != null) {
                            for (var i = 0; i < videoFrame.length; i++) {
                                _this.player.appendHevcFrame(videoFrame[i]);
                            }
                        }
                        if (audioFrame != null) {
                            for (var i = 0; i < audioFrame.length; i++) {
                                // console.log(audioFrame[i]);
                                _this.player.appendAACFrame(audioFrame[i]);
                            }
                        }
                        if (videoFrame != null || audioFrame != null) {
                            secIdx++;
                        }

                        // console.log(secIdx + "," + durationSecFloat);
                        if (secIdx >= durationSecFloat) {
                            window.clearInterval(_this.timerFeed);
                            _this.timerFeed = null;
                            // console.log("loading finished");
                            if (call != null) {
                                call();
                            }
                            return;
                        }
                    }, 10);
                };
            };
        }; // end onDemuxed

        this.hlsObj.onSamples = (readyObj, frame) => {
            let _this = this;
            if (frame.video == true) {
                // console.log("FRAME==========>" + frame.pts);
                _this.player.appendHevcFrame(frame);
            } else {
                _this.player.appendAACFrame(frame);
            }

        }; // end onSamples

        // start
        this.hlsObj.demux(this.videoURL);

    } // end m3u8

}

exports.H265webjs = H265webjsModule;