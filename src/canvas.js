const YUVBuffer = require('yuv-buffer')
const YUVCanvas = require('yuv-canvas')

module.exports = (container, canvasWidth, canvasHeight) => {
    const canvasBox = document.createElement('div')
    canvasBox.style.backgroundColor = 'black'
    canvasBox.style.width = canvasWidth + 'px'
    canvasBox.style.height = canvasHeight + 'px'
    const canvas = document.createElement('canvas')
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvasBox.appendChild(canvas)
    container.appendChild(canvasBox)
    const yuv = YUVCanvas.attach(canvas) // yuv.clear() //clearing the canvas?

    const drawImage = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        const format = YUVBuffer.format({
            width:          width,
            height:         height,
            chromaWidth:    width/2,
            chromaHeight:   height/2,
            displayWidth:   canvas.offsetWidth,
            displayHeight:  canvas.offsetHeight
        })
        const frame = YUVBuffer.frame(format)
        frame.y.bytes = imageBufferY
        frame.y.stride = width
        frame.u.bytes = imageBufferB
        frame.u.stride = width/2
        frame.v.bytes = imageBufferR
        frame.v.stride = width/2
        yuv.drawFrame(frame)
    }
    return drawImage
}