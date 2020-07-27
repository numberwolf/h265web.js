const durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`
const convert8BitYuv420 = (y, u, v, w, h, dest) => {
    xpos = 0
    ypos = 0
    w2 = w >> 1
    maxi = w2 * h
    yoffset = 0
    uoffset = 0
    voffset = 0
    for (let i = 0; i < maxi; i++) {
        i2 = i << 1
        x2 = (xpos << 1)
        yval = 1.164 * (y[yoffset + x2] - 16)
        uval = u[uoffset + xpos] - 128
        vval = v[voffset + xpos] - 128
        dest[(i2<<2)+0] = yval + 1.5701 * vval
        dest[(i2<<2)+1] = yval - 0.1870 * vval - 0.4664 * uval
        dest[(i2<<2)+2] = yval + 1.8556 * uval

        yval = 1.164 * (y[yoffset + x2 + 1] - 16)
        dest[((i2+1)<<2)+0] = yval + 1.5701 * vval
        dest[((i2+1)<<2)+1] = yval - 0.1870 * vval - 0.4664 * uval
        dest[((i2+1)<<2)+2] = yval + 1.8556 * uval
        dest[(i2<<2)+3] = dest[((i2+1)<<2)+3] = 0xff
    
        xpos++
        if (xpos === w2) {
            xpos = 0
            ypos++
            yoffset += w //stridey
            uoffset = ((ypos >> 1) * w/2) //strideu
            voffset = ((ypos >> 1) * w/2) //stridev
        }
    }
}
const convert10BitYuv420 = (y, u, v, w, h, dest) => {
    for(cy = 0; cy < h; cy++) {
		for(cx = 0; cx < w; cx+=2) {
			g           = (cy*w + cx)<<1
            g2          = g*2
            g3 = g/2
			rb          = (cy*w + cx)>>1
			blue        = (u[rb] | u[rb + 1] << 8) - 512
			red         = (v[rb] | v[rb + 1] << 8) - 512
			redish      = 409 * red + 512
			greenish    = 100 * blue + 208 * red + 512
			bluesh      = 516 * blue + 512
			
			contrast    = ((y[g3]  | y[g3  + 1] << 8) - 64)*298
			dest[g2   ] = (contrast + redish) >> 10
			dest[g2+1 ] = (contrast - greenish) >> 10
			dest[g2+2 ] = (contrast + bluesh) >> 10
					
			contrast    = ((y[g3 + 2]  | y[g3  + 3] << 8) - 64)*298
			dest[g2+4 ] = (contrast + redish) >> 10
			dest[g2+5 ] = (contrast - greenish) >> 10
			dest[g2+6 ] = (contrast + bluesh) >> 10
			
			dest[g2+3] = dest[g2+7] = 0xff
		}
	}
}
const drawPause = ctx => {
    ctx.strokeRect(10, ctx.canvas.height - 50, 42, 42)
    ctx.moveTo(24, ctx.canvas.height - 42)
    ctx.lineTo(24, ctx.canvas.height - 14)        
    ctx.moveTo(38, ctx.canvas.height - 42)
    ctx.lineTo(38, ctx.canvas.height - 14)
    ctx.stroke()
}
const drawPlay = ctx => {
    ctx.strokeRect(10, ctx.canvas.height - 50, 42, 42)
    ctx.moveTo(24, ctx.canvas.height - 42)
    ctx.lineTo(24, ctx.canvas.height - 14)
    ctx.lineTo(38, ctx.canvas.height - 28)
    ctx.lineTo(24, ctx.canvas.height - 42)
    ctx.stroke()
}
module.exports = (container, player) => {
    const canvasBox = document.createElement('div')
    canvasBox.style.display = 'block'
    canvasBox.style.backgroundColor = 'black'
    canvasBox.style.width = player.width + 'px'
    canvasBox.style.height = player.height + 'px'
    const canvas = document.createElement('canvas')
    canvas.style.width = player.width + 'px'
    canvas.style.height = player.height + 'px'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvas.width = player.width
    canvas.height = player.height

    canvasBox.appendChild(canvas)
    container.appendChild(canvasBox)
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px verdana, sans-serif'

    const total = durationText(player.duration / 1000)
    const playerDraw = () => {
        const now = durationText(player.now)
        ctx.beginPath()
        ctx.fillText(`${now}/${total}`, canvas.width - 130, canvas.height - 25)
        ctx.strokeRect(canvas.width - 140, canvas.height - 50, 130, 40)
        ctx.strokeRect(64, canvas.height - 50, canvas.width - 220, 40)
        ctx.fillRect(64, canvas.height - 50, (canvas.width - 220) * (player.now / (player.duration / 1000)), 40)
        // console.log('now: ', player.now, 'total:', player.duration / 1000)
        player.isPlaying ? drawPause(ctx) : drawPlay(ctx)
        ctx.closePath()
        ctx.stroke()
    }
    player.now = '0:0:0'
    player.total = durationText(player.duration / 1000)
    playerDraw()

    const imageData = ctx.getImageData(0, 0, player.width, player.height)
    const drawImage = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        player.bits == 10 && convert10BitYuv420(imageBufferY, imageBufferB, imageBufferR, width, height, imageData.data)
        player.bits == 8 && convert8BitYuv420(imageBufferY, imageBufferB, imageBufferR, width, height, imageData.data)
        ctx.putImageData(imageData, 0, 0)  
    }
    canvas.onclick = e => {
        player.isPlaying = !player.isPlaying
        playerDraw()
        player.isPlaying ? player.play() : player.stop()
    }

    //hide loading gif
    let movedMouseTime = new Date()
    canvas.onmousemove = e => movedMouseTime = new Date()
    player.onUpdate = (videoPTS, audioPTS) => {
        player.now = videoPTS
        //hide controls after 10 seconds
        new Date() - movedMouseTime < player.autoHideControls * 1000 && playerDraw()
    }
    player.onStop = () => {
        console.log('Video stopped ...')
        player.isPlaying && canvas.onclick()
    }

    return drawImage
}