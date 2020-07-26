const InitMp4Parser = require('./demuxer/mp4')
const Module = require('./missile.js')
const Audio = require('./decoder/audio')
const decodeVideoFrame = require('./decoder/video')
const canvas = require('./canvas')
module.exports = ({container, url}) => {
    const videoFrames = []
    const audioFrames = []
    const player = {
        loop: null,
        whenReady: () => {},
        onUpdate: () => {},
        onStop: () => {}
    }
    fetch(url).then(res => res.arrayBuffer()).then(streamBuffer => {
        const mp4Obj = new InitMp4Parser()
        mp4Obj.demux(streamBuffer)
        player.sampleRate = mp4Obj.getSampleRate()
        player.duration = mp4Obj.getDurationMs()
        player.size = mp4Obj.getSize()
        player.fps = mp4Obj.getFPS()
        const drawImage = canvas(container, player.size.width, player.size.height)
        const audio = Audio(player.sampleRate)
        const loadFrames = () => {
            const videoFrame = mp4Obj.popBuffer(1)
            const audioFrame = mp4Obj.popBuffer(2)
            videoFrame && videoFrames.push(videoFrame)
            audioFrame && audioFrames.push(audioFrame)
            if(!videoFrame && !audioFrame) return
            loadFrames()
        }
        loadFrames()
        console.log('Audio Frames: ', audioFrames.length, 'Video Frames: ',videoFrames.length)
        player.pause = () => audio.pause() && window.clearInterval(player.loop)
        player.play = () => {
            //TODO: get video in sync with audio based on audio's processed frame (ratio 1.6)
            // So basically feed frames into decoder by index, that will give replay too
            player.loop = window.setInterval(() => {
                if(!videoFrames.length) return player.stop()
                const frame = videoFrames.shift()
                decodeVideoFrame(frame, drawImage, Module)
                player.onUpdate(frame.pts, audio.ctx.currentTime)
            }, 1000 / player.fps)
            audio.play()
            console.log('Playing ...')
        }
        player.stop = () => {
            player.pause()
            player.onStop()
            Module.cwrap('release', 'number', [])()
        }
        console.log('WASM initialized with code: ' + Module.cwrap('initMissile', 'number', [])())
        console.log('Initialized Decoder with code: ' + Module.cwrap('initializeDecoder', 'number', [])())
        console.log('SampleRate:',player.sampleRate, 'Duration:', player.duration,'Size:', player.size,'fps:', player.fps)
        audio.decode(audioFrames).then(player.whenReady)
    })
    player.onReady = whenReady => player.whenReady = whenReady
    return player
}
