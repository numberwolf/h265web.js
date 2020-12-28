# h265web.js

| Update | Content |
| ---- | ---- |
| Time | 2020/12/28 |
| 1 | 1.New way to use it: `import H265webjsModule from './dist/index';` |
| 2 | 2.Fixed some bugs: Seek and restart |

| h265web.js | mpeg.js `(ts demuxer)` |
| ---- | ---- |
| [![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js) | [![npm version](https://badge.fury.io/js/mpeg.js.svg)](https://www.npmjs.com/package/mpeg.js) |

<a href="https://www.gnu.org/licenses/gpl-3.0.md">License GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.md</a>

README.md：<a href="README.MD">中文</a> | <a href="README_EN.MD">English</a>

<img src="./resource/logo@300x300.png" width="300px" />

————————— __`A hevc/h.265 web player, easy to play 1080P.`__

__`~^_^~ For love` if <a href="https://github.com/numberwolf/h265web.js">h265web.js</a> help you, please `star` it~__

## Index

- [0、README](#0readme)

	- [Support what?](#supported)

	- [Free token](#freetoken)

	- [Contact me](#contact)

	- [Demo](#demo)

	- [Preview image](#previewimage)

- [1、How to use it? See demo code](#1useitbydemo)

- [2、SDK/API Document](#2sdkandapidocument)

	- [How to install it](#install)

	- [Player Config](#playerconfig)

	- [Init Player](#initplayer)

	- [Player bind events](#playerbindevents)

	- [Player API Document](#playerapidocument)

- [3、Others help](#3others)
	
	- [Transcode and get hevc media file by ffmpeg](#transcodeandget265codecfilebyffmpeg)

<hr>

### 0、README ###

#### Supported ####

* Protocol box

|  protocol | model | support | desc |
| ---- | ---- |  ----  | ---- |
| mp4 | Video on demand |  Y  | ---- |
| mpeg-ts | Video on demand |  Y  | ---- |
| m3u8 | Video on demand |  Y  | ---- |
| hls | Live |  Y  | ---- |
| http-flv | Live |  N  | TODO |
| flv | Video on demand |  N  | TODO |

* Features

|  Feature | support | desc |
| ---- | ---- |  ----  |
| Video on demand | Y |  ----  | ---- |
| Live | Y |  ----  | ---- |
| Seek | Y |  ----  | ---- |
| AccurateSeek | Y |  ----  | ---- |
| Cover Image | Y |  ----  | ---- |
| Playing with download | Y |  ----  | ---- |
| Volume | Y |  ----  | ---- |
| Play | Y |  ----  | ---- |
| Pause | Y |  ----  | ---- |
| ReStart | Y |  ----  | ---- |
| PauseWithCoverImage | Y |  ----  | ---- |
| 1080P | Y |  ----  | ---- |
| 720P | Y |  ----  | ---- |
| Create multi players | Y |  ----  | ---- |

<br>

#### freeToken ####

```javascript
token = "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1";
```

<br>

#### Contact ####

* Github: https://github.com/numberwolf/h265web.js
* Email(porschegt23@foxmail.com)
* QQ: 531365872
* Discord:numberwolf#8694
* Wechat:numberwolf11

<br>

#### Demo ####

<a href="http://hevc.xvideo.video/">http://hevc.xvideo.video</a>

<br>

#### PreviewImage ####

|  Type |  Vod | Live |
| ---- |  ----  | ---- |
|  Click | <a href='./resource/demo3.png' target="_blank"><img src="./resource/demo3.png" height="300px" /></a>  | <a href='./resource/demo2.png' target="_blank"><img src="./resource/demo2.png" height="300px" /></a> |

<br>

## 1、UseItByDemo ##

* You can use it by `play.js`和`index.html`

* You need to put project in your `web server` path, and open it with `index.html`

<br>

## 2、SdkAndApiDocument ##

———————— __API/Events__

### Install ###

#### 1）Install SDK Package

* By github 1.1 <a href="https://github.com/numberwolf/h265web.js">h265web.js</a>

```javascript
// import from local file
require('./dist/h265webjs');
```

* By github 1.2 by `import xxx from xxx` （recommend）

```javascript
import H265webjsModule from './dist/index';
```

* By npm

[![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js) | <a href="https://www.npmjs.com/package/h265web.js">npm:h265web.js</a>

<br>

#### 2）Install Wasm

* If you install it by github, you could skip this step.

* If you install it by `npm`，you need to copy `./node_modules/h265web.js/dist/*.wasm` to `h265webjs.js`'s path.

	* Cmd
	```bash
	npm i h265web.js
	cp ./node_modules/h265web.js/dist/*.wasm ./dist/
	```

<br>

#### 3）Include h265web.js to project

* Local include

	* 1）require
	```javascript
	require('./dist/h265webjs');
	```

	* 2）`import xxx from xxx` （recommend）
	```javascript
	import H265webjsModule from './dist/index';
	```


* Npm include

[![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js)

```javascript
const H265webjs = require('h265web.js');
```

<br>

### PlayerConfig ###

* Make player config

```javascript
let config = {
    type: "mp4",
    player: "glplayer",
    width: 960,
    height: 540,
    accurateSeek : true,
    playIcon : "dist/assets/icon-play@300.png",
    loadIcon : "dist/assets/icon-loading.gif",
    token : token,
    extInfo : {
        moovStartFlag : true,
        readyShow : true
    }
};
```

* Config desc

|  Config | Type | Value | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| type  | String | mp4/hls/ts | Y | Media file type |
| player  | String | - | Y | Player dom id |
| width  | Int | - | Y | Player width |
| height  | Int | - | Y | Player height |
| accurateSeek  | Bool | true/false | Y | Accurate seek |
| playIcon  | String | - | Y | Icon for play button on play view |
| loadIcon  | String | - | Y | Icon for loading status on play view |
| token  | String | - | Y | player's token |
| extInfo  | Object | - | N | player extra info |
| \+ moovStartFlag  | Bool | true/false | N:default is sfalse | mp4 with moov before mdat |
| \+ extInfo  | Bool | true/false | N:default is false | need cover image |


<br>

### InitPlayer ###

* Create your player(Global function) 

> new265webjs(`mediaAddress`, `playerConfig`)

|  Param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| mediaAddress  | String | - | Y | media file address/path |
| playerConfig  | Object | - | Y | player's config |

* Example

	* 1）URI and Config
	```javascript
	let videoURL = "h265_test.mp4";
	let config = {
	    type: "mp4",
	    player: "glplayer",
	    width: 960,
	    height: 540,
	    accurateSeek : true,
	    playIcon : "dist/assets/icon-play@300.png",
	    loadIcon : "dist/assets/icon-loading.gif",
	    token : token,
	    extInfo : {
	        moovStartFlag : true,
	        readyShow : true
	    }
	};
	````

	* 2）Player
		* 1. If `require('./src/h265webjs');`

		Example:
		```javascript
		let h265webjs = new265webjs(videoURL, config); // Global Function
		```

		* 2. If `import H265webjsModule from './dist/index';`（recommend）

		Example:
		```javascript
		let h265webjs = H265webjsModule.createPlayer(videoURL, config);
		```

<br>

### PlayerBindEvents ###

#### 1）Seed finished

* Example

```javascript
player.onSeekFinish = () => {
    // todo
};
```

<br>

#### 2）Get yuv data

|  Callback param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| width  | int | - | - | YUV width |
| height  | int | - | - | YUV height |
| imageBufferY  | Uint8Array | - | - | Y |
| imageBufferB  | Uint8Array | - | - | ChromaB |
| imageBufferR  | Uint8Array | - | - | ChromaR |

> You can use this event's data to render a new window(full screen play)

> must use `setRenderScreen` to open this feature.

* Example

```javascript
player.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
	// todo
};
```

<br>

#### 3）Click player's render view event

> Always use it for play/pause 

* Example

```javascript
player.onMaskClick = () => {
	if (player.isPlaying()) {
	    // now is playing
	} else {
	    // now is pause
	}
};
```

<br>

#### 4）Media load success

> If this event happened, you can start play

* Example

```javascript
player.onLoadFinish = () => {
	// todo
};
```

<br>

#### 5）Player's play timestamp update

|  Callback param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| videoPTS  | float64 | - | - | pts now |

* Example

```javascript
player.onPlayTime = (videoPTS) => {
	// todo
	console.log(videoPTS)
};
```

<br>

### PlayerAPIDocument ###

#### 1）Start load player

> After【set player config】和【bind events】

* Example

```javascript
player.do();
```

<br>

#### 2）Get player's play status

|  Function | Return | Desc |
|  ---- | ----  | ---- |
| isPlaying() | bool | play status |

* Example

```javascript
if (player.isPlaying()) {
	// now is playing
} else {
}
```

<br>

#### 3）Start play

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| play()  | - | Start play |

* Example

```javascript
player.play();
```

<br>

#### 4）Pause

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| pause()  | - | Pause |

* Example

```javascript
player.pause();
```

<br>

#### 5）Open/Close : Render callback YUV Frame data

> After open，you can use `onRender` Event

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| setRenderScreen(`{param1}`)  | - | Open/Close : Render callback YUV Frame data |

* Param

|  Param | Type | Default | Desc |
|  ----  | ---- | ----  | ---- |
| param1 | bool | false | Open/Close : Render callback YUV Frame data |

* Example

```javascript
// Open
player.setRenderScreen(true);
// Close
player.setRenderScreen(false);
```

<br>

#### 6）Seek

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| seek(`{pts}`)  | - | Seek to any timestamp |

* Params

|  Param | Type | Default | Desc |
|  ----  | ---- | ----  | ---- |
| pts | float64 | - | Seek to any timestamp |

* Example

```javascript
// Seek to 10.01s
player.seek(10.01);
```

<br>

#### 7）Volume option

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| setVoice(`{volume}`)  | - | volume value |

* Params

|  Param | Type | Default | Desc |
|  ----  | ---- | ----  | ---- |
| volume | float64 | - | Set value in `[0, 1.0]`, 0 is mute，1.0 is full |

* Example

```javascript
// half
player.setVoice(0.5);
```

<br>

#### 8）Get media info

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| mediaInfo()  | Object | Media file info |

* Return Example

```json
meta:
	audioNone: false // include audio stream
	durationMs: 600000 // media duration(ms)
	fps: 25 // frame rate
	sampleRate: 44100 // audio sampleRate
	size:
		height: 720
		width: 1280
	videoCodec: 0
videoType: "vod" // vod or live
```

* Example

```javascript
let mediaInfo = player.mediaInfo();
```

<br>

## 3、Others ##

### TranscodeAndGet265CodecFileByFFmpeg ###

* mp4

```bash
ffmpeg -i input.mp4 \
-vcodec libx265 -pix_fmt \
-acodec aac -ac 2 -ar 44100 \
-preset medium -maxrate 1000k -bufsize 1000k \
-vtag hev1 \
-movflags faststart \
-y video.mp4
```

* hls/m3u8 capture

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

* mpeg-ts

```bash
ffmpeg -ss 20 -t 10 -i ./res/xinxiaomen.mp4 \
-vcodec libx265 -x265-params "bframes=0:keyint=10" -r 24 -filter_complex "scale=720:1280" -preset fast -maxrate 800k -bufsize 800k \
-acodec aac -ar 22050 -ac 1 \
-pix_fmt yuv420p \
-f mpegts -y ./res/veilside2.ts
```









