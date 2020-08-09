var Player = require('./decoder/player')
var InitMp4Parser = require('./demuxer/mp4')
var def = require('./consts')
var Module = require('./decoder/missile.js')
var durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`

class H265webjsClazz {
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
        this.progress = null;
        this.timerFeed = null;
        this.player = null;

        this.videoURL = videoURL;
        this.config = config;
    }

    do() {
        let type = this.config.type || def.PLAYER_IN_TYPE_MP4;
        let configFormat = {
            playerId : this.config.player || def.DEFAILT_WEBGL_PLAY_ID,
            playerW : this.config.width || def.DEFAULT_WIDTH,
            playerH : this.config.height || def.DEFAULT_HEIGHT
        };
        if (!window.WebAssembly) {
            let tip = 'unsupport WASM!';
            if (/iPhone|iPad/.test(window.navigator.userAgent)) {
                tip += ' ios:min-version 11'
            }
            alert(tip);
            alert("Please check your browers, it not support wasm! See:https://www.caniuse.com/#search=wasm");
        } else {
            console.log("to onRuntimeInitialized");
            Module.onRuntimeInitialized = () => {
                console.log('WASM initialized');
                Module.cwrap('initMissile', 'number', [])();
                console.log('Initialized Decoder');
                Module.cwrap('initializeDecoder', 'number', [])();

                if (type == def.PLAYER_IN_TYPE_MP4) {
                    this.makeMP4Player(configFormat);
                }
            };
        } // end if c
    }

    makeMP4Player(configFormat) {
        let _this = this;
        fetch(this.videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
            const status = document.createElement('div')
            status.textContent = 'Loading...'
            const play = document.createElement('button')
            play.textContent = '[>]'
            play.disabled = true
            const ptsLabel = document.createElement('span')
            this.progress = document.createElement('progress')
            this.progress.value = 0
            document.body.appendChild(status)
            document.body.appendChild(play)
            document.body.appendChild(ptsLabel)
            document.body.appendChild(this.progress)
            // demux mp4
            this.timerFeed = null;
            this.mp4Obj = new InitMp4Parser()
            this.mp4Obj.demux(streamBuffer)
            this.mp4Obj.seek(-1);
            const durationMs  = this.mp4Obj.getDurationMs()
            const fps         = this.mp4Obj.getFPS()
            const sampleRate  = this.mp4Obj.getSampleRate()
            const size        = this.mp4Obj.getSize()
            ptsLabel.textContent = '0:0:0/' + durationText(this.progress.max = durationMs / 1000)
            // dur seconds
            const durationSec = parseInt(durationMs / 1000);

            this.player = Player({
                width: configFormat.playerW,
                height: configFormat.playerH,
                sampleRate: sampleRate,
                fps: fps,
                appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
                fixed: false, // is strict to resolution?
                playerId: configFormat.playerId
            })
            this.player.setPlayingCall(videoPTS => {
                this.progress.value = videoPTS
                const now = durationText(videoPTS)
                const total = durationText(durationMs / 1000)
                ptsLabel.textContent = `${now}/${total}`
            })
            //TODO: get all the data at once syncronously or feed data through a callback if streamed
            const feedMP4Data = (secIdx=0, idrIdx=0) => {
                this.timerFeed = window.setInterval(() => {
                    const videoFrame = this.mp4Obj.popBuffer(1, secIdx);
                    const audioFrame = this.mp4Obj.popBuffer(2, secIdx);
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
                        console.log("loading finished");
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

            this.player.setDurationMs(durationMs)
            // player.setSize(size.width, size.height)
            this.player.setFrameRate(fps)
            feedMP4Data(0)
            
            status.textContent = ''
            play.disabled = false
            play.onclick = () => {
                this.player.isPlaying = !this.player.isPlaying
                play.textContent = this.player.isPlaying ? '[||]' : '[>]'
                if (this.player.isPlaying) {
                    // // demux mp4
                    // mp4Obj.demux(streamBuffer)
                    // const durationMs  = mp4Obj.getDurationMs()
                    // const fps         = mp4Obj.getFPS()
                    // const sampleRate  = mp4Obj.getSampleRate()
                    // const size        = mp4Obj.getSize()
                    // ptsLabel.textContent = '0:0:0/' + durationText(progress.max = durationMs / 1000)
                    // player.setDurationMs(durationMs)

                    // // player.setSize(size.width, size.height)
                    // player.setFrameRate(fps)

                    // feedMP4Data()
                    this.player.play(this.mp4Obj.seekPos)
                } else this.player.pause()
            } // this.player.stop()
        }); // end fetch
    }
}

exports.H265webjs = H265webjsClazz;