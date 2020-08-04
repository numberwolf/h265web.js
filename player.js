//TODO: check if browser has web assembly and the audio decoder, and a decent screen, otherwise don't even load the page
// const $ = id => document.getElementById(id)
const Player = require('./src/decoder/player')
const InitMp4Parser = require('./src/demuxer/mp4')
const def = require('./src/consts')
const durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`
const videoURL = '/res/video.mp4'

window.onload = () => fetch(videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
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
    const mp4Obj = new InitMp4Parser()
    mp4Obj.demux(streamBuffer)
    mp4Obj.seek(-1);
    const durationMs  = mp4Obj.getDurationMs()
    const fps         = mp4Obj.getFPS()
    const sampleRate  = mp4Obj.getSampleRate()
    const size        = mp4Obj.getSize()
    ptsLabel.textContent = '0:0:0/' + durationText(progress.max = durationMs / 1000)

    const durationSec = parseInt(durationMs / 1000);

    const player = Player({
        width: 600,
        height: 600,
        sampleRate: sampleRate, 
        fps: fps,
        appendHevcType: def.APPEND_TYPE_FRAME,
        fixed: false // is strict to resolution?
    })
    player.setPlayingCall(videoPTS => {
        progress.value = videoPTS
        const now = durationText(videoPTS)
        const total = durationText(durationMs / 1000)
        ptsLabel.textContent = `${now}/${total}`
    })
    //TODO: get all the data at once syncronously or feed data through a callback if streamed
    const feedMp4Data = (sec) => {
        let feedLoop = window.setInterval(() => {
            const videoFrame = mp4Obj.popBuffer(1, sec);
            const audioFrame = mp4Obj.popBuffer(2, sec);
            // console.log("feed=========================>" + sec);
            // console.log(sec + " <======> " + durationSec);
            // console.log(videoFrame);
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
                sec++;
            }
            
            if (sec >= durationSec) {
                window.clearInterval(feedLoop);
                feedLoop = null;
            }
        }, 100);
    }

    /**
     * SEEK Progress
     */
    progress.addEventListener('click', function (e) {
        var x = e.pageX - this.offsetLeft; // or e.offsetX (less support, though)
        var y = e.pageY - this.offsetTop;  // or e.offsetY
        var clickedValue = x * this.max / this.offsetWidth;
        console.log('Current position: ' + clickedValue);
        console.log('Current value: ' + this.value);
        // player.seek(() => {
        //     mp4Obj.seek(clickedValue);
        //     feedMp4Data();
        // }, clickedValue);
    });

    player.setDurationMs(durationMs)
    // player.setSize(size.width, size.height)
    player.setFrameRate(fps)
    feedMp4Data(0)
    
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

            // feedMp4Data()
            player.play(mp4Obj.seekPos)
        } else player.pause()
    } // player.stop()
})

