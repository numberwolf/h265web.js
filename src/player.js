//TODO: separate out the canvas logic and the hevc decoder logic
const YUVBuffer = require('yuv-buffer')
const YUVCanvas = require('yuv-canvas')
const Module = require('./missile.js')
const AudioModule = require('./decoder/audio')
const def = require('./consts')
module.exports = config => {
    const player = {
        config: {
            width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            fixed: config.fixed || def.DEFAULT_FIXED,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            appendHevcType: config.appendHevcType || def.APPEND_TYPE_STREAM
        },
        frameList: [],
        stream: new Uint8Array(),
        audio: AudioModule({
            sampleRate: config.sampleRate,
            appendType: config.appendHevcType
        }),
        durationMs: -1.0,
        videoPTS: -1,
        loop: null,
        isPlaying: false
    }
    player.setSize = (width, height) => {
        player.config.width = width || def.DEFAULT_WIDTH
        player.config.height = height || def.DEFAULT_HEIGHT
    }
    player.setFrameRate = (fps) => {
        player.config.fps = fps || def.DEFAULT_FPS
    }
    player.setDurationMs = (durationMs = -1) => {
        player.durationMs = durationMs
        player.audio.setDurationMs(durationMs)
    }
    player.appendAACFrame = streamBytes => player.audio.addSample(streamBytes)
    player.endAudio = () => {
        player.audio.stop()
        // player.audio.init({
        //     sampleRate  : player.config.sampleRate,
        //     appendType  : player.config.appendHevcType
        // })
    }
    player.cleanSample = () => player.audio.cleanQueue()
    player.pause = () => {
        player.loop && window.clearInterval(player.loop)
        player.audio.pause()
    }
    player.play = (callback) => {
        player.loop = window.setInterval(() => {
            player.videoPTS * 1000 >= player.durationMs && player.stop()
            player.playFrame()
            callback && callback(player.videoPTS)
        }, 1000 / player.config.fps)
        player.audio.play()
        console.log('Playing ...')
    }
    player.stop = () => {
        console.log("============ STOP ===============")
        player.loop && window.clearInterval(player.loop)
        player.pause()
        player.endAudio()
        Module.cwrap('release', 'number', [])()
        Module.cwrap('initializeDecoder', 'number', [])()
        player.stream = new Uint8Array()
        player.frameList = []
        player.durationMs = -1.0
        player.videoPTS = -1
    }
    player.nextNalu = (onceGetNalCount=1) => {
        if (player.stream.length <= 4) return false
        let startTag = -1 //start nal pos
        for (let i = 0; i < player.stream.length; i++) {
            if (i + 5 >= player.stream.length) {
                if (startTag == -1) return false;
                else {
                    const ret = player.stream.subarray(startTag)
                    player.stream = new Uint8Array()
                    return ret
                }
            }
            // find nal
            const is3BitHeader = player.stream.slice(0, 3).join(' ') == '0 0 1'
            const is4BitHeader = player.stream.slice(0, 4).join(' ') == '0 0 0 1'
            if (is3BitHeader || is4BitHeader) {
                if (startTag == -1) startTag = i
                else {
                    if (onceGetNalCount <= 1) {
                        const ret = player.stream.subarray(startTag, i)
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
            return player.stream = new Uint8Array([...player.stream].concat(...streamBytes))
        else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME)
            return player.frameList.push(streamBytes)
    }
    player.playFrame = () => {
        let nalBuf  = null
        if (player.config.appendHevcType == def.APPEND_TYPE_STREAM) {
            nalBuf = player.nextNalu() // nal
        } else if (player.config.appendHevcType == def.APPEND_TYPE_FRAME) {
            const frame = player.frameList.shift() // nal
            !frame && console.log('got empty frame')
            if(!frame) return false //TODO: remove
            nalBuf = frame.data
            player.videoPTS = frame.pts
        } else return false
        if (nalBuf != false) {
            const offset = Module._malloc(nalBuf.length)
            Module.HEAP8.set(nalBuf, offset)
            const decRet = Module.cwrap('decodeCodecContext', 'number', ['number', 'number'])(offset, nalBuf.length)
            if (decRet >= 0) {
                const ptr = Module.cwrap('getFrame', 'number', [])()
                if(!ptr) throw new Error('ERROR ptr is not a Number!')
                // sub block [m,n] //TODO: put all of this into a nextFrame() function
                const width = Module.HEAPU32[ptr / 4]
                const height = Module.HEAPU32[ptr / 4 + 1]
                const imgBufferPtr = Module.HEAPU32[ptr / 4 + 1 + 1]
                const sizeWH = width * height
                const imageBufferY = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH)
                const imageBufferB = Module.HEAPU8.subarray(
                    imgBufferPtr + sizeWH + 8, 
                    imgBufferPtr + sizeWH + 8 + sizeWH / 4
                )
                const imageBufferR = Module.HEAPU8.subarray(
                    imgBufferPtr + sizeWH + 8 + sizeWH / 4 + 8,
                    imgBufferPtr + sizeWH + 8 + sizeWH / 2 + 8
                )
                if (!width || !height) throw new Error('Get PicFrame failed! PicWidth/height is equal to 0, maybe timeout!')
                else player.drawImage(width, height, imageBufferY, imageBufferB, imageBufferR)
            } //  end if decRet
            Module._free(offset)
        }
    }
    //canvas related functions
    player.drawImage = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        const displayWH = player.checkDisplaySize(width, height) // TODO: only need to do this for one frame or not at all
        const format = YUVBuffer.format({
            width:          width,
            height:         height,
            chromaWidth:    width/2,
            chromaHeight:   height/2,
            displayWidth:   player.canvas.offsetWidth,
            displayHeight:  player.canvas.offsetHeight
        })
        const frame = YUVBuffer.frame(format)
        frame.y.bytes = imageBufferY
        frame.y.stride = width
        frame.u.bytes = imageBufferB
        frame.u.stride = width/2
        frame.v.bytes = imageBufferR
        frame.v.stride = width/2
        player.yuv.drawFrame(frame)
    }
    player.checkDisplaySize = (widthIn, heightIn) => {
        const biggerWidth = widthIn / player.config.width > heightIn / player.config.height
        const fixedWidth = (player.config.width / widthIn).toFixed(2)
        const fixedHeight = (player.config.height / heightIn).toFixed(2)
        const scaleRatio = biggerWidth ? fixedWidth : fixedHeight
        const isFixed = player.config.fixed
        const width = isFixed ? player.config.width : parseInt(widthIn  * scaleRatio)
        const height = isFixed ? player.config.height : parseInt(heightIn * scaleRatio)
        if (player.canvas.offsetWidth != width || player.canvas.offsetHeight != height) {
            const topMargin = parseInt((player.canvasBox.offsetHeight - height) / 2)
            const leftMargin = parseInt((player.canvasBox.offsetWidth - width) / 2)
            player.canvas.style.marginTop = topMargin + 'px'
            player.canvas.style.marginLeft = leftMargin + 'px'
            player.canvas.style.width = width + 'px'
            player.canvas.style.height = height + 'px'
        }
        return [width, height]
    }
    const canvasBox = document.querySelector('div#glplayer')
    canvasBox.style.backgroundColor = 'black'
    canvasBox.style.width = player.config.width + 'px'
    canvasBox.style.height = player.config.height + 'px'
    const canvas = document.createElement('canvas')
    canvas.style.width = canvasBox.clientWidth + 'px'
    canvas.style.height = canvasBox.clientHeight + 'px'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvasBox.appendChild(canvas)
    player.canvasBox = canvasBox
    player.canvas = canvas
    player.yuv = YUVCanvas.attach(canvas) // player.yuv.clear() //clearing the canvas?
    // player.audio.init({
    //     sampleRate  : player.config.sampleRate,
    //     appendType  : player.config.appendHevcType
    // })
    console.log('WASM initialized with code: ' + Module.cwrap('initMissile', 'number', [])())
    console.log('Initialized Decoder with code: ' + Module.cwrap('initializeDecoder', 'number', [])())
    console.log('player config', player.config)

    return player
}
