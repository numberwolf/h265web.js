--------------------------------------------------
# h265web.js

<img src="./res/logo@300x300.png" width="300px" />

* Logo designer & Copyright : porschegt23@foxmail.com (QQ:531365872 ,Discord:numberwolf#8694)

* LICENSE : GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.md

> If h265webjs help you, you can click star button, it offered me more impetus to develop h265webjs!  

> `~^_^~`    



----------------------------------------

* Capture
> <img src="./res/demo.png" width="600px" />

### Features

* Support all yuv pixel formats

* Support mp4 box

* Support mpegTS box (depend on: [![npm version](https://badge.fury.io/js/tsdemuxerjs.svg)](https://www.npmjs.com/package/tsdemuxerjs)) (Git: https://github.com/numberwolf/TSDemuxer.js)

* Play/pause/stop

* Seek with nearly IDR frame

* Support Play/Pause control by click player

* Toast of remind

* Protect your website video playing keep away from malicious adver

### TodoList

* Seek with P/B Frame

* Support HLS/M3u8-Vod

### Setup

> Check wasm support: https://www.caniuse.com/#search=wasm

> `npm i` # normally

### Example

> 1. You can running demo on Running Step.

> 2. How to use it? See play.js + index.html

### Running 

>`npm start` # just want to test and see, open 127.0.0.1:8999

>`npm run dev` # as dev

### Transcoding Your Media File To Hevc Codec

```bash
ffmpeg -i input.mp4 \
-vcodec libx265 -pix_fmt \
-acodec aac -ac 2 -ar 44100 \
-preset medium -maxrate 1000k -bufsize 1000k \
-vtag hev1 \
-y video.mp4
```

### Project Dir Struct

```struct
|-- dist
|-- lib
|-- src
    |-- h265webjs.js
    |-- decoder
        |-- audio.js
        |-- missile.js
        |-- player.js
        |-- hevc-header.js
        |-- hevc-imp.js
    |-- demuxer
        |-- mp4.js
        |-- buffer.js
|-- package.json
|-- play.js
|-- res
|-- LICENSE
|-- README_CHINESE.md
|-- README.MD
```



### Q&A
If you have any problems, you can send mail to me, or use QQ to talk with me. ~^_^~

* Email(porschegt23@foxmail.com)
* QQ: 531365872
* Discord:numberwolf#8694

- Wasm made by myself.

----------------------------

