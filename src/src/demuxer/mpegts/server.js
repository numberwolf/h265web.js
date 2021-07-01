/********************************************************* 
 * LICENSE: GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.txt
 * 
 * Author: Numberwolf - ChangYanlong
 * QQ: 531365872
 * QQ Group:925466059
 * Wechat: numberwolf11
 * Discord: numberwolf#8694
 * E-Mail: porschegt23@foxmail.com
 * Github: https://github.com/numberwolf/h265web.js
 * 
 * 作者: 小老虎(Numberwolf)(常炎隆)
 * QQ: 531365872
 * QQ群: 531365872
 * 微信: numberwolf11
 * Discord: numberwolf#8694
 * 邮箱: porschegt23@foxmail.com
 * 博客: https://www.jianshu.com/u/9c09c1e00fd1
 * Github: https://github.com/numberwolf/h265web.js
 * 
 **********************************************************/
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
        {url: '/dist/missilets.wasm', get: ctx => {
            ctx.res.writeHead(200, { accept: '*', 'content-type': 'application/wasm'})
            ctx.res.end(fs.readFileSync('./dist/missilets.wasm'))
        }},
        {url: '/*', get: server.staticFileServer('.')}
    ]
})
