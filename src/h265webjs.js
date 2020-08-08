const Player = require('./decoder/player')
const InitMp4Parser = require('./demuxer/mp4')
const def = require('./consts')
const durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`

class H265webjsClazz {
    /**
     * @param videoURL String
     * @param config Dict: {player : string}
     */
    constructor(videoURL, config) {
        this.videoURL = videoURL;
        this.config = config;
    }

    do() {
        let type = this.config.type || def.PLAYER_IN_TYPE_MP4;
        let playerId = this.config.player || def.DEFAILT_WEBGL_PLAY_ID;

        let configFormat = {
            playerId : playerId
        };
        if (type == def.PLAYER_IN_TYPE_MP4) {
            this.makeMP4Player(configFormat);
        }
    }

    makeMP4Player(configFormat) {
        fetch(this.videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
            const status = document.createElement('div')
            status.textContent = 'Loading...'
            const play = document.createElement('button')
            play.textContent = '[>]'
            play.disabled = true
            const ptsLabel = document.createElement('span')
            const progress = document.createElement('progress')
            progress.value = 0
            document.body.appendChild(status)
            document.body.appendChild(play)
            document.body.appendChild(ptsLabel)
            document.body.appendChild(progress)
            // demux mp4
            let timerFeed = null;
            const mp4Obj = new InitMp4Parser()
            mp4Obj.demux(streamBuffer)
            mp4Obj.seek(-1);
            const durationMs  = mp4Obj.getDurationMs()
            const fps         = mp4Obj.getFPS()
            const sampleRate  = mp4Obj.getSampleRate()
            const size        = mp4Obj.getSize()
            ptsLabel.textContent = '0:0:0/' + durationText(progress.max = durationMs / 1000)
            // dur seconds
            const durationSec = parseInt(durationMs / 1000);

            const player = Player({
                width: 600,
                height: 600,
                sampleRate: sampleRate, 
                fps: fps,
                appendHevcType: def.APPEND_TYPE_FRAME, // APPEND_TYPE_SEQUENCE
                fixed: false, // is strict to resolution?
                playerId: configFormat.playerId
            })
            player.setPlayingCall(videoPTS => {
                progress.value = videoPTS
                const now = durationText(videoPTS)
                const total = durationText(durationMs / 1000)
                ptsLabel.textContent = `${now}/${total}`
            })
            //TODO: get all the data at once syncronously or feed data through a callback if streamed
            const feedMP4Data = (secIdx=0, idrIdx=0) => {
                timerFeed = window.setInterval(() => {
                    const videoFrame = mp4Obj.popBuffer(1, secIdx);
                    const audioFrame = mp4Obj.popBuffer(2, secIdx);
                    if (videoFrame != null) {
                        for (var i = 0; i < videoFrame.length; i++) {
                            player.appendHevcFrame(videoFrame[i]);
                        }
                    }
                    if (audioFrame != null) {
                        for (var i = 0; i < audioFrame.length; i++) {
                            player.appendAACFrame(audioFrame[i]);
                        }
                    }
                    if (videoFrame != null || audioFrame != null) {
                        secIdx++;
                    }
                    
                    // console.log(secIdx + "," + durationSec);
                    if (secIdx >= durationSec) {
                        window.clearInterval(timerFeed);
                        timerFeed = null;
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
            progress.addEventListener('click', function (e) {
                var x = e.pageX - this.offsetLeft; // or e.offsetX (less support, though)
                var y = e.pageY - this.offsetTop;  // or e.offsetY
                var clickedValue = x * this.max / this.offsetWidth;
                // console.log('Current value: ' + this.value + ', Target position: ' + clickedValue);
                if (timerFeed) {
                    window.clearInterval(timerFeed);
                    timerFeed = null;
                }
                player.seek(() => {
                    mp4Obj.seek(clickedValue);
                    // temp : give idx to feed and seek
                    feedMP4Data(parseInt(mp4Obj.seekPos), clickedValue);
                }, clickedValue);
            });

            player.setDurationMs(durationMs)
            // player.setSize(size.width, size.height)
            player.setFrameRate(fps)
            feedMP4Data(0)
            
            status.textContent = ''
            play.disabled = false
            play.onclick = () => {
                player.isPlaying = !player.isPlaying
                play.textContent = player.isPlaying ? '[||]' : '[>]'
                if(player.isPlaying) {
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
                    player.play(mp4Obj.seekPos)
                } else player.pause()
            } // player.stop()
        });
    }
}

exports.H265webjs = H265webjsClazz;