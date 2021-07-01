const fs = require('fs')
const server = require("pinipig")
//ctx.req.getUrl(), ctx.parameters.name, ctx.data.files.map(f => ([f.tmpFilename, f.filename]), ctx.res.json({})
const socketMessage = ctx => {
    console.log(ctx.req.message)
}
const sendWSFile = ctx => {
    // const  data = fs.readFileSync('./video.h264').toString("binary")
    // const twoKB = (data, index) => {
    //     if(!data.length) return
    //     ctx.ws.send( data.slice(index, index + 2048), ctx.isBinary)
    //     setTimeout(() => twoKB(data.slice(index + 2048), index + 2048), 3000)
    // }
    // twoKB(data, 0)
}

server.createServer({
    port: 8999,
    routes: [
        {
            url: '/',
            ws: {
                options: {
                    compression: 0,
                    maxPayloadLength: 16 * 1024 * 1024,
                    idleTimeout: 10
                },
                open: sendWSFile,
                message: socketMessage,
                drain: () => {},
                close: () => {}
            }
        },
        {
            url: '/dist/missile.wasm', get: ctx => {
                ctx.res.writeHead(200, { accept: '*', 'content-type': 'application/wasm'})
                ctx.res.end(fs.readFileSync('./dist/missile.wasm'))
            }
        },
        {
            url: '/dist/missilets.wasm', get: ctx => {
                ctx.res.writeHead(200, { accept: '*', 'content-type': 'application/wasm'})
                ctx.res.end(fs.readFileSync('./dist/missilets.wasm'))
            }
        },
        {
            url: '/*', get: server.staticFileServer('.')
        }
    ]
})
