const parseMp4 = require('./demuxer/mp4')
const Module = require('./missile.js')
const Audio = require('./decoder/audio')
const decodeVideoFrame = require('./decoder/video')
const canvas = require('./canvas')
module.exports = ({container, url, bits, autoHideControls}) => fetch(url).then(res => res.arrayBuffer()).then(streamBuffer => {
    const mp4 = parseMp4(streamBuffer)
    const player = {
        ...mp4,
        bits: bits || 8,
        autoHideControls: autoHideControls || 3,
        loop: null,
        onUpdate: () => {},
        onStop: () => {}
    }
    const drawImage = canvas(container, player)
    const audio = Audio(player.sampleRate)
    console.log('Audio Frames: ', player.audioFrames.length, 'Video Frames: ', player.videoFrames.length)
    player.pause = () => audio.pause() && window.clearInterval(player.loop)
    player.play = () => {
        //TODO: get video in sync with audio based on audio's processed frame (ratio 1.6)
        // So basically feed frames into decoder by index, that will give replay too
        player.loop = window.setInterval(() => {
            if(!player.videoFrames.length) return player.stop()
            const frame = player.videoFrames.shift()
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
    // console.log(mp4)
    audio.decode(player.audioFrames).then(player.whenReady)
    return player
})
