module.exports = (frame, drawImage, Module) => {
    const offset = Module._malloc(frame.data.length)
    Module.HEAP8.set(frame.data, offset)
    const decRet = Module.cwrap('decodeCodecContext', 'number', ['number', 'number'])(offset, frame.data.length)
    if (decRet >= 0) {
        const ptr = Module.cwrap('getFrame', 'number', [])()
        if(!ptr) throw new Error('ERROR ptr is not a Number!')
        // sub block [m,n] - next frame
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
        else drawImage(width, height, imageBufferY, imageBufferB, imageBufferR)
    } //  end if decRet
    Module._free(offset)
}
