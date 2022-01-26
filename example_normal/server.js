const http = require('http')
const path = require('path')
const fs = require('fs')

const exmaplePath = path.join(__dirname, 'index.html')

http
  .createServer((req, res) => {
    const url = req.url
    if (url !== '/') {
      let basePath = __dirname
      if (url === '/hevc_test_moov_set_head_16s.mp4') {
        basePath = path.join(__dirname, '..', 'example')
      }
      const staticFilePath = path.join(basePath, url)
      if (fs.existsSync(staticFilePath)) {
        fs.readFile(staticFilePath, (err, data) => {
          if (err) console.log(err)
          res.end(data)
        })
      }
    } else {
      fs.readFile(exmaplePath, (err, data) => {
        if (err) console.log(err)
        res.end(data)
      })
    }
  })
  .listen(3000, () => {
    console.log('server work at: http:localhost:3000')
  })
