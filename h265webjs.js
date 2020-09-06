const Player = require('./decoder/player-core');
const MPEG_JS = require('mpeg.js');
const Mp4Parser = require('./demuxer/mp4');
const MpegTSParser = require('./demuxer/ts');
const M3U8Parser = require('./demuxer/m3u8');
const def = require('./consts');
const staticMem = require('./utils/static-mem');
const Module = require('./decoder/missile.js');
const durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`;

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
        this.mp4Obj = null;
        this.mpegTsObj = null;
        this.hlsObj = null; // @Todo
        this.hlsConf = {
            hlsType : def.PLAYER_IN_TYPE_M3U8_VOD
        }

        // util
        this.progress = null;
        this.timerFeed = null;
        this.player = null;
        this.playBar = null;
        this.status = null;
        this.ptsLabel = null;
        this.controlBar = null;

        this.videoURL = videoURL;
        this.configFormat = {
            playerId : config.player || def.DEFAILT_WEBGL_PLAY_ID,
            playerW : config.width || def.DEFAULT_WIDTH,
            playerH : config.height || def.DEFAULT_HEIGHT,
            type : config.type || def.PLAYER_IN_TYPE_MP4
        };
    }

    do() {
        let _this = this;
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
                    _this.makeMP4Player(_this.configFormat);
                    _this.playerUtilBuildMask();
                    // _this.playUtilHiddenMask();
                    this.playUtilShowMask();
                }
            } else {
                Module.onRuntimeInitialized = () => {
                    global.STATIC_MEM_wasmDecoderState = 1;

                    console.log('WASM initialized ' + global.STATIC_MEM_wasmDecoderState);
                    Module.cwrap('initMissile', 'number', [])();
                    console.log('Initialized Decoder');
                    Module.cwrap('initializeDecoder', 'number', [])();

                    _this.makeMP4Player(_this.configFormat);
                    _this.playerUtilBuildMask();
                    // _this.playUtilHiddenMask();
                    _this.playUtilShowMask();
                };
            }
        } // end if c
    }

    getMaskId() {
        let maskTag = {
            "maskBgId" : 'mask-bg-' + this.configFormat.playerId,
            "maskFgId" : 'mask-fg-' + this.configFormat.playerId,
            "maskImg" : 'mask-img-' + this.configFormat.playerId,
        };
        return maskTag
    }

    getMaskDom() {
        let maskBgTag = this.getMaskId();
        return {
            "maskBg" : document.querySelector('div#' + maskBgTag.maskBgId),
            "maskFg" : document.querySelector('div#' + maskBgTag.maskFgId),
            "maskImg" : document.querySelector('img#' + maskBgTag.maskImg),
        }
    }

    // @TODO
    playerUtilBuildMask() {
        let _this = this;
        let maskBgTag = this.getMaskId();
        let canvasBox = document.querySelector('div#' + this.configFormat.playerId);
        let maskBg = document.createElement('div');
        // let maskFg = document.createElement('div');
        let maskImg = document.createElement('img');

        maskBg.setAttribute("id", maskBgTag.maskBgId);
        // maskFg.setAttribute("id", maskBgTag.maskFgId);
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

        // maskFg.style.width = '20%'
        // maskFg.style.height = '20%'
        // maskFg.style.top = '40%'
        // maskFg.style.left = '40%'
        // maskFg.style.display = 'block';
        // maskFg.style.position = 'absolute';
        // maskFg.style.zIndex = '1002';
        // maskFg.style.backgroundColor = 'yellow';
        // maskFg.style.overflow = 'auto';
        // maskFg.style.opacity = '0.00';
        // maskFg.style.filter = 'alpha(opacity=0)';
        // maskFg.innerHTML = ">>>>>>>>>>>>>>..";

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

        maskImg.src = "/assets/icon-play@300.png";
        // maskImg.style.width = maskFg.style.width
        // maskImg.style.height = maskFg.style.width

        // event
        maskBg.onclick = () => {
            _this.playControl();
        };

        // maskFg.appendChild(maskImg);
        canvasBox.appendChild(maskBg);
        // canvasBox.appendChild(maskFg);
        canvasBox.appendChild(maskImg);
        canvasBox.appendChild(this.controlBar);

    }

    playUtilShowMask() {
        let maskDom = this.getMaskDom();
        // maskDom.maskBg.style.display = 'block';
        maskDom.maskBg.style.opacity = '0.10';
        maskDom.maskBg.style.filter = 'alpha(opacity=10)';

        maskDom.maskImg.style.opacity = '1.0';
        maskDom.maskImg.style.filter = 'alpha(opacity=100)';
    }

    playUtilHiddenMask() {
        let maskDom = this.getMaskDom();
        // maskDom.maskBg.style.display = 'block';
        maskDom.maskBg.style.opacity = '0.00';
        maskDom.maskBg.style.filter = 'alpha(opacity=0)';

        maskDom.maskImg.style.opacity = '0.00';
        maskDom.maskImg.style.filter = 'alpha(opacity=0)';
    }

    playControl() {
        let mode = def.PLAYER_MODE_VOD;
        // _this.hlsConf.hlsType
        if (this.player.isPlaying) { // to pause
            this.playUtilShowMask();
            this.playBar.textContent = '>';
            this.player.pause();
        } else { // to play
            this.playUtilHiddenMask();
            this.playBar.textContent = '||';
            if (this.mp4Obj != null) {
                this.player.play(this.mp4Obj.seekPos, mode);
            } else if (this.mpegTsObj != null) {
                this.player.play(this.mpegTsObj.seekPos, mode);
            } else if (this.hlsObj != null) {
                // console.log("this.hlsConf.hlsType:" + this.hlsConf.hlsType);
                if (this.hlsConf.hlsType == def.PLAYER_IN_TYPE_M3U8_LIVE) {
                    mode = def.PLAYER_MODE_NOTIME_LIVE;
                }
                this.player.play(this.hlsObj.seekPos, mode);
            } else {
                console.log("unknow play resource type");
            }
        }
    }

    playUtilProgress() {
        this.progress.style.borderRadius = '2px';
        this.progress.style.borderLeft = '1px #ccc solid';
        this.progress.style.borderRight = '1px #ccc solid';
        this.progress.style.borderTop = '1px #aaa solid';
        this.progress.style.backgroundColor = 'white';
        this.progress.style.width = '100%';
        this.progress.style.setProperty("-webkit-progress-bar",
            "background-color(#d7d7d7)");
        this.progress.style.setProperty("-webkit-progress-value",
            "background-color(#aadd6a)");
    }

    makeMP4Player() {
        let _this = this;

        this.controlBar = document.createElement('div');
        this.controlBar.style.width = this.configFormat.playerW + 'px';
        this.controlBar.style.right = '0%'
        this.controlBar.style.bottom = '0%'
        this.controlBar.style.display = 'block';
        this.controlBar.style.position = 'absolute';
        this.controlBar.style.zIndex = '1003';

        this.status = document.createElement('div')
        this.status.style.color = 'white';
        this.status.textContent = 'Loading...'

        _this.playBar = document.createElement('button')
        _this.playBar.textContent = '>'
        _this.playBar.disabled = true
        _this.playBar.style.width = '5%'
        _this.playBar.style.margin = '3px'

        this.ptsLabel = document.createElement('span')
        this.ptsLabel.style.color = 'white';
        this.ptsLabel.style.float = 'right';
        this.ptsLabel.style.margin = '3px'

        this.progress = document.createElement('progress')
        this.progress.value = 0
        this.playUtilProgress();
        this.controlBar.appendChild(this.progress)
        this.controlBar.appendChild(this.status)
        this.controlBar.appendChild(_this.playBar)
        this.controlBar.appendChild(this.ptsLabel)

        /*
         * Switch Media
         */
        // console.log("type: " + this.configFormat.type);
        if (this.configFormat.type == def.PLAYER_IN_TYPE_MP4) {
            this.mp4Entry();
        } else if (
            this.configFormat.type == def.PLAYER_IN_TYPE_TS ||
            this.configFormat.type == def.PLAYER_IN_TYPE_MPEGTS)
        {
            this.mpegTsEntry();
        } else if (this.configFormat.type == def.PLAYER_IN_TYPE_M3U8) {
            this.m3u8Entry();
        }

    } // end

    /********************************************************************
     ********************************************************************
     ********************                    ****************************
     ********************     media type     ****************************
     ********************                    ****************************
     ********************************************************************
     ********************************************************************/
    mp4Entry() {
        let _this = this;

        fetch(this.videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {

            // demux mp4
            this.timerFeed = null;
            this.mp4Obj = new Mp4Parser()
            this.mp4Obj.demux(streamBuffer)
            this.mp4Obj.seek(-1);
            let durationMs  = this.mp4Obj.getDurationMs()
            let fps         = this.mp4Obj.getFPS()
            let sampleRate  = this.mp4Obj.getSampleRate()
            let size        = this.mp4Obj.getSize()
            this.ptsLabel.textContent = '0:0:0/' + durationText(this.progress.max = durationMs / 1000)
            // dur seconds
            let durationSec = parseInt(durationMs / 1000);

            this.player = Player({
                width: this.configFormat.playerW,
                height: this.configFormat.playerH,
                sampleRate: sampleRate,
                fps: fps,
                appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
                fixed: false, // is strict to resolution?
                playerId: this.configFormat.playerId
            });
            this.player.setPlayingCall(videoPTS => {
                this.progress.value = videoPTS
                let now = durationText(videoPTS)
                let total = durationText(durationMs / 1000)
                _this.ptsLabel.textContent = `${now}/${total}`
            });
            //TODO: get all the data at once syncronously or feed data through a callback if streamed
            let feedMP4Data = (secIdx=0, idrIdx=0) => {
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
                        return;
                    }

                // setTimeout(() => {
                //     feedMP4Data(secIdx, idrIdx);
                // }, 100);
                }, 10);
            }

            /**
             * SEEK Progress
             */
            _this.progress.addEventListener('click', (e) => {
                let x = e.pageX - _this.progress.offsetLeft; // or e.offsetX (less support, though)
                let y = e.pageY - _this.progress.offsetTop;  // or e.offsetY
                let clickedValue = x * _this.progress.max / _this.progress.offsetWidth;
                // console.log('Current value: ' + this.value + ', Target position: ' + clickedValue);
                if (_this.timerFeed) {
                    window.clearInterval(_this.timerFeed);
                    _this.timerFeed = null;
                }
                _this.player.seek(() => {
                    _this.mp4Obj.seek(clickedValue);
                    // temp : give idx to feed and seek
                    feedMP4Data(parseInt(_this.mp4Obj.seekPos), clickedValue);
                }, clickedValue);
            });

            _this.player.setDurationMs(durationMs)
            // player.setSize(size.width, size.height)
            _this.player.setFrameRate(fps)
            feedMP4Data(0)

            _this.status.textContent = ''
            _this.playBar.disabled = false
            _this.playBar.onclick = () => {
                _this.playControl();
            } // this.player.stop()
        }); // end fetch
    }

    mpegTsEntry() {
        console.log("entry ts");
        let _this = this;
        this.timerFeed = null;
        this.mpegTsObj = new MpegTSParser.MpegTs();
        this.mpegTsObj.bindReady(_this);

        this.mpegTsObj.onDemuxed = this.mpegTsEntryReady;
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
    mpegTsEntryReady (onReadyOBJ) {
        let _this = onReadyOBJ;
        let durationMs  = _this.mpegTsObj.getDurationMs();
        let fps         = _this.mpegTsObj.getFPS();
        let sampleRate  = _this.mpegTsObj.getSampleRate();
        let size        = _this.mpegTsObj.getSize();
        // console.log(sampleRate);
        // dur seconds
        let durationSecFloat = durationMs / 1000;
        let durationSec = parseInt(durationSecFloat);

        _this.ptsLabel.textContent = '0:0:0/' + durationText(_this.progress.max = durationMs / 1000)

        _this.player = Player({
            width: _this.configFormat.playerW,
            height: _this.configFormat.playerH,
            sampleRate: sampleRate,
            fps: fps,
            appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
            fixed: false, // is strict to resolution?
            playerId: _this.configFormat.playerId
        });
        _this.player.setDurationMs(durationMs);
        // player.setSize(size.width, size.height);
        _this.player.setFrameRate(fps);

        _this.player.setPlayingCall(videoPTS => {
            _this.progress.value = videoPTS
            let now = durationText(videoPTS)
            let total = durationText(durationMs / 1000)
            _this.ptsLabel.textContent = `${now}/${total}`
        });

        //TODO: get all the data at once syncronously or feed data through a callback if streamed
        let feedMP4Data = (secIdx = 0, idrIdx = 0) => {
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
                    return;
                }

            // setTimeout(() => {
            //     feedMP4Data(secIdx, idrIdx);
            // }, 100);
            }, 10);
        };

        /**
         * SEEK Progress
         */
        _this.progress.addEventListener('click', (e) => {
            let x = e.pageX - _this.progress.offsetLeft; // or e.offsetX (less support, though)
            let y = e.pageY - _this.progress.offsetTop;  // or e.offsetY
            let clickedValue = x * _this.progress.max / _this.progress.offsetWidth;
            // console.log('Current value: ' + this.value + ', Target position: ' + clickedValue);
            if (_this.timerFeed) {
                window.clearInterval(_this.timerFeed);
                _this.timerFeed = null;
            }
            _this.player.seek(() => {
                _this.mpegTsObj.seek(clickedValue);
                // temp : give idx to feed and seek
                feedMP4Data(parseInt(_this.mpegTsObj.seekPos), clickedValue);
            }, clickedValue);
        });

        // feed
        feedMP4Data(0)
        _this.status.textContent = ''
        _this.playBar.disabled = false
        _this.playBar.onclick = () => {
            _this.playControl();
        } // _this.player.stop()
    }

    /**
     * @brief m3u8
     */
    m3u8Entry() {
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
                _this.ptsLabel.textContent = '0:0:0/' + durationText(_this.progress.max = durationMs / 1000)

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
                
                _this.player = Player({
                    width: _this.configFormat.playerW,
                    height: _this.configFormat.playerH,
                    sampleRate: sampleRate,
                    fps: fps,
                    appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
                    fixed: false, // is strict to resolution?
                    playerId: _this.configFormat.playerId
                });
                _this.player.setDurationMs(durationMs);
                // player.setSize(size.width, size.height);
                _this.player.setFrameRate(fps);

                _this.player.setPlayingCall(videoPTS => {
                    _this.progress.value = videoPTS;
                    let now = durationText(videoPTS);
                    let total = durationText(durationMs / 1000);
                    // def.DEFAULT_STRING_LIVE
                    if (_this.hlsConf.hlsType == def.PLAYER_IN_TYPE_M3U8_LIVE) {
                        _this.ptsLabel.textContent = `${now}/${def.DEFAULT_STRING_LIVE}`;
                    } else {
                        _this.ptsLabel.textContent = `${now}/${total}`;
                    }
                });

                let feedMP4Data = (secIdx = 0, idrIdx = 0) => {
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
                            return;
                        }

                    // setTimeout(() => {
                    //     feedMP4Data(secIdx, idrIdx);
                    // }, 100);
                    }, 10);
                };

                /**
                 * SEEK Progress
                 */
                _this.progress.addEventListener('click', (e) => {
                    let x = e.pageX - _this.progress.offsetLeft; // or e.offsetX (less support, though)
                    let y = e.pageY - _this.progress.offsetTop;  // or e.offsetY
                    let clickedValue = x * _this.progress.max / _this.progress.offsetWidth;
                    // console.log('Current value: ' + this.value + ', Target position: ' + clickedValue);
                    if (_this.timerFeed) {
                        window.clearInterval(_this.timerFeed);
                        _this.timerFeed = null;
                    }
                    _this.player.seek(() => {
                        _this.hlsObj.seek(clickedValue);
                        // temp : give idx to feed and seek
                        feedMP4Data(parseInt(_this.hlsObj.seekPos), clickedValue);
                    }, clickedValue);
                });

                _this.status.textContent = '';
                _this.playBar.disabled = false;
                _this.playBar.onclick = () => {
                    _this.playControl();
                } // _this.player.stop()

            };

            // push frame to player
            // let feedMP4Data = (secIdx = 0, idrIdx = 0) => {
            //     _this.timerFeed = window.setInterval(() => {
            //         let videoFrame = _this.hlsObj.popBuffer(1, secIdx);
            //         let audioFrame = _this.hlsObj.popBuffer(2, secIdx);
            //         if (videoFrame != null) {
            //             for (var i = 0; i < videoFrame.length; i++) {
            //                 _this.player.appendHevcFrame(videoFrame[i]);
            //             }
            //         }
            //         if (audioFrame != null) {
            //             for (var i = 0; i < audioFrame.length; i++) {
            //                 _this.player.appendAACFrame(audioFrame[i]);
            //             }
            //         }
            //         if (videoFrame != null || audioFrame != null) {
            //             secIdx++;
            //         }

            //         // console.log(secIdx + "," + durationSecFloat);
            //         if (secIdx >= durationSecFloat) {
            //             window.clearInterval(_this.timerFeed);
            //             _this.timerFeed = null;
            //             console.log("loading finished");
            //             return;
            //         }

            //     // setTimeout(() => {
            //     //     feedMP4Data(secIdx, idrIdx);
            //     // }, 100);
            //     }, 5);
            // };
            // // feed
            // feedMP4Data(0);
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