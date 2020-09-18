--------------------------------------------------
# h265web.js

* Github: https://github.com/numberwolf/h265web.js

<img src="./resource/logo@300x300.png" width="300px" />

* [![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js)

* Logo designer & Copyright : porschegt23@foxmail.com (QQ:531365872 ,Discord:numberwolf#8694)

* Customized sales: Discord:numberwolf#8694

* 合作 QQ:531365872

* 技术支持QQ群：925466059

* LICENSE : GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.md

#### If `h265webjs` help you, please click the `star button`, thx~

> `~^_^~`    


online demo: http://hevc.xvideo.video/

----------------------------------------

#### Capture VOD

##### VOD

Play
> <img src="./resource/demo.png" width="500px" />


Full Screen
> <img src="./resource/demo1.png" width="500px" />

##### LIVE

> <img src="./resource/demo2.png" width="500px" />

### Features

* Interface of Full Screen play!

* Define Player UI by yourself

* Support make your player's ui style

* Open API for Developers! (See Examples in `play.js`)

* Support Volume Setting!

* Support accurate seek action

* Support HLS Play! (Live Mode!)

* Support M3u8-Vod Play!

* Support M3u8-Vod Seek!

* Support all yuv pixel formats

* Support mp4 box

* Support mpegTS box (depend on: [![npm version](https://badge.fury.io/js/mpeg.js.svg)](https://www.npmjs.com/package/mpeg.js) , (Git: https://github.com/numberwolf/MPEG-Demuxer.js)

* Play/pause/stop

* Seek with nearly IDR frame

* Support Play/Pause control by click player

* Toast of remind

* Protect your website video playing keep away from malicious adver

* Fixed Bug : M3u8 Seek

### TodoList

* New mode, make yuv buffer

* Support AVC Codec play

### Setup

> Check wasm support: https://www.caniuse.com/#search=wasm

> `npm i` # normally

### Example

> 1. You can running demo on Running Step.

> 2. How to use it? Watch <a href="play.js">play.js</a>


### Running 

>`npm start` # just want to test and see, open 127.0.0.1:8999

### Transcoding Your Media With HEVC Codec

##### MP4

```bash
ffmpeg -i input.mp4 \
-vcodec libx265 -pix_fmt \
-acodec aac -ac 2 -ar 44100 \
-preset medium -maxrate 1000k -bufsize 1000k \
-vtag hev1 \
-y video.mp4
```

##### MPEG-TS

```bash
ffmpeg -ss 20 -t 10 -i ./res/xinxiaomen.mp4 \
-vcodec libx265 -x265-params "bframes=0:keyint=10" -r 24 -filter_complex "scale=720:1280" -preset fast -maxrate 800k -bufsize 800k \
-acodec aac -ar 22050 -ac 1 \
-pix_fmt yuv420p \
-f mpegts -y ./res/veilside2.ts
```

##### HLS/M3U8

> Capture your screen

```bash
ffmpeg -f avfoundation -i 1:0 \
-q 4 -r 10 \
-filter_complex "scale=1280:720" \
-pix_fmt yuv420p \
-vcodec libx265 \
-ar 22050 -ab 64k -ac 1 -acodec aac \
-threads 4 \
-preset veryfast \
-f segment \
-segment_list test.m3u8 \
-segment_time 5 \
-y /Users/numberwolf/Documents/webroot/VideoMissile/VideoMissilePlayer/res/hls1/v-%03d.ts
```

### Project Dir Struct

```struct
|-- dist `h265webjs Framework`
|-- index.html
|-- play.js
|-- screen.js
|-- server.js
|-- package.json
|-- LICENSE-GPL3.0
|-- README.MD
```


### Q&A
If you have any problems, you can send mail to me, or use QQ to talk with me. ~^_^~

* Email(porschegt23@foxmail.com)
* QQ: 531365872
* Discord:numberwolf#8694

- Wasm made by myself.

----------------------------

