# h265web.js - Support Hard-Decode

> If you need more powerful performance  
> ***Please visit [h265web.com](https://h265web.com/)***    
> ***h265web.js-pro branch:https://github.com/numberwolf/h265web.js/tree/h265web.js-pro***

### Here is the open source version introduction

<a href="README.MD">中文</a> | <a href="README_EN.MD">English</a>

<hr>
<img src="./resource/logo@300x300.png" height="250px" />
<a href="./resource/demo.png">
<img src="./resource/demo.png" height="220px" />
</a>
<hr>

<strong>
<font color="red">H265web.js is the best HEVC/H.265 web player you can find.</font>
<br>
<font color="blue">Video Stream Server recommand use <a href="https://github.com/ZLMediaKit/ZLMediaKit">ZLMediaKit(https://github.com/ZLMediaKit/ZLMediaKit) - Pretty good video live stream server/framework</a></font>
</strong>

A hevc/h.265 web player, easy to play 1080P. `~^_^~ For love` if <a href="https://github.com/numberwolf/h265web.js">h265web</a> helped you, please `star` it~

<hr>

<h3>All Features</h3>

<strong>
<font color="black">

| <font color="gray">Feature</font> | <font color="gray">Feature</font> | <font color="gray">Feature</font> | <font color="gray">Feature</font> |
| ---- | ---- | ---- | ---- |
| <img src="resource/icon-hls.png" width="100"> | <img src="resource/icon-m3u8.png" width="100"> | <img src="resource/icon-mp4.png" width="100"> | <img src="resource/icon-flv.png" width="100"> | 
| HLS(LIVE)| M3u8(VOD) | MP4(VOD) | FLV(VOD) | 
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-httpflv.png" width="100"> | <img src="resource/icon-httpts.png" width="100"> | <img src="resource/icon-websocketflv.png" width="100"> | <img src="resource/icon-websocketts.png" width="100"> |
| HTTP-FLV(LIVE) | HTTP-TS(LIVE) | WS-FLV(LIVE) | WS-TS(LIVE) |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-ts.png" width="100"> | <img src="resource/icon-mpegps.png" width="100"> | <img src="resource/icon-av1.png" width="100"> | <img src="resource/icon-mov-h265.png" width="100">|
| MPEG-TS(VOD) | MPEG-PS(VOD) | AV1(Chrome) | MOV(H.265) |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-hevc.png" width="100"> | <img src="resource/icon-websockethevc.png" width="100"> | <img src="resource/icon-mkv.png" width="100"><br> | <img src="resource/icon-aac.png" width="100"> |
| HTTP-HEVC | WS-HEVC | MKV(HEVC) | AAC(MAIN/LC) |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-thread.png" width="100"> | <img src="resource/icon-single-thread.png" width="100"> | <img src="resource/icon-pcm.png" width="100"> | <img src="resource/icon-pcm.png" width="100"> | <img src="resource/icon-mediainfo.png" width="100">  |
| Multi-Thread<br><font color="red">(only:<br>https+nginx conf)</font> | Single-Thread | G711A(HTTP-FLV) | G711U(HTTP-FLV) |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-mediainfo.png" width="100"> | <img src="resource/icon-hevc-s.png" width="100"> | <img src="resource/icon-avc-s.png" width="100"> | <img src="resource/icon-hdecode.png" width="100"> |
| MediaInfo | HEVC/H.265 | AVC/H.264 | Hardware decoder<br>(FLV/HTTP-FLV/MP4) |


</font>
</strong>

#### Contact ####

* Github: https://github.com/numberwolf/h265web.js
* Email: porschegt23@foxmail.com
* <strong><font color="red">QQ Group Number: 925466059(recommand)</font></strong>
* <strong>QQ: 531365872</strong>
* Discord:numberwolf#8694
* Wechat:numberwolf11

#### Online DEMO <a href="https://www.zzsin.com/h265webjs.html"> h265webjs.html (Demo is not newest version, you need to download from github and get newest version)
</a>

#### First Demo - for first use <a href="index-debug.html">index-debug.html</a>

| h265web.js | mpeg.js `(ts demuxer)` | h265web.js's H.265 decoder | LICENSE |
| ---- | ---- | ---- | ---- |
| [h265web.js](https://github.com/numberwolf/h265web.js)  | [MPEG-Demuxer.js](https://github.com/numberwolf/MPEG-Demuxer.js) | [h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder) | <a href="LICENSE-Free_CN.MD">CYL_Free-1.0 LICENSE-Free_CN.MD</a> |

<hr>

# Remind!

H265web.js use the soft-decode mode(Can not use hard-decode and assembly-optimization on browers), so your device performance has a large impact on player.

Notice：

* Recommended FPS <= 30fps
	* Better: 24fps

* Recommended Bitrate <= 1500kbps
	* Better: 300~600kbps



## Index

- [Update Log](#updatelog)

- [0、README](#0readme)

	- [Support what?](#supported)

	- [Free token](#freetoken)

	- [Demo](#demo)

	- [Preview image](#previewimage)

- [1、How to use it? See demo code](#1useitbydemo)

- [2、SDK/API Document](#2sdkandapidocument)

	- [How to install it](#install)

	- [Player Config](#playerconfig)

	- [Init Player](#initplayer)

	- [Player bind events](#playerbindevents)

		- [Seed Finished](#seedfinished)

		- [Callback Yuv Data](#callbackyuvdata)

		- [Media Load Successed](#medialoadsuccessed)

		- [Player Pts Update](#playerptsupdate)

		- [Play Finished](#playfinished)

		- [Cache Download](#cachedownload)

		- [Cover Image Load Finished](#coverimageloadfinished)

		- [Caching Decode Frames](#cachingdecodeframes)

		- [Caching Decode Finished](#cachingdecodefinished)

		- [Open FullScreen Event](#openfullscreenevent)

		- [Exit FullScreen Event](#closefullscreenevent)
		
		- [Callback Play State](#callbackplaystate)

	- [Player API Document](#playerapidocument)

		- [Build Player](#buildplayer)

		- [Get Player Play Status](#getplayerplaystatus)

		- [Start Play](#startplay)

		- [Pause](#pause)

		- [Set Render Callback YuvFrame](#setrendercallbackyuvframe)

		- [Seek](#seek)

		- [Volume Option](#volumeoption)

		- [Get MediaInfo - and check is h265 video](#getmediainfo)

		- [Open Fullscreen](#openfullscreen)

		- [Exit Fullscreen](#exitfullscreen)

		- [Play frame by frame(next frame)](#nextframe)

		- [Resize](#resize)

		- [Snapshot](#snapshot)

		- [SetPlayRate](#setplayrate)

		- [GetPlayRate](#getplayrate)

		- [Release Player](#release)

- [3、Others](#3others)

	- [Donate](#donate)

	- [FFmpeg Support H265 Live Encode](#ffmpegsupporth265liveencode)
	
	- [Transcode and get HEVC/H.265 media file by ffmpeg](#transcodeandget265codecfilebyffmpeg)

<hr>

### 0、README ###

| TODO | Content |
| ---- | ---- |
| 1 | Support HDR10 BT.2020 |


#### Supported ####

* Protocol box

|  protocol | model | support | desc |
| ---- | ---- |  ----  | ---- |
| mp4 | Video on demand |  Y  | ---- |
| mov | Video on demand |  Y  | HEVC/H.265 |
| mkv | Video on demand |  Y  | HEVC/H.265 |
| av1 | Video on demand |  Y  | Chrome |
| mpeg-ts | Video on demand |  Y  | ---- |
| mpeg-ps | Video on demand |  Y  | ---- |
| m3u8 | Video on demand |  Y  | ---- |
| hls | Live |  Y  | ---- |
| flv | Video on demand |  Y  | ---- |
| http-flv | Live |  Y  | CodecID=12 |
| http-ts | Live |  Y  | ---- |
| http-hevc | Live |  Y  | ---- |
| http-hevc | Video on demand |  Y  | ---- |
| websocket-hevc | Live |  Y  | ---- |
| websocket-flv | Live |  Y  | ---- |
| websocket-ts | Live |  Y  | ---- |
| HEVC/H.265 | Video on demand |  Y  | ---- |
| HEVC/H.265 | Live |  Y  | ---- |
| AVC/H.264 | Video on demand |  Y  | ---- |
| AVC/H.264 | Live |  Y  | ---- |

* Codec

| Codec | Support | Desc |
| ---- |  ----  | ---- |
| AVC/H.264 |  Y  | ---- |
| HEVC/H.265 |  Y  | ---- |
| AAC |  Y  | ---- |
| G711A |  Y  | HTTP-FLV |
| G711U |  Y  | HTTP-FLV |
| AV1 |  Y  | Chrome |


* Features

|  Feature | Support | Desc |
| ---- | ---- |  ----  |
| Hardware-Decode | Y | For Chrome/Safari etc... |
| Video on demand | Y |  ----  |
| Live | Y |  ----  |
| Seek | Y | ----  |
| AccurateSeek | Y |  ----  |
| Cover Image | Y |  ----  |
| Playing with download | Y |  ----  |
| Volume | Y |  ----  |
| Play | Y |  ----  |
| Pause | Y |  ----  |
| ReStart | Y |  ----  |
| PauseWithCoverImage | Y |  ----  |
| 1080P | Y |  ----  |
| 720P | Y |  ----  |
| Create multi players | Y |  ----  |
| Play without Audio | Y |  ----  |
| Cache process | Y |  ----  |
| Open Fullscreen | Y |  ----  |
| Exit Fullscreen | Y |  ----  |
| Play frame by frame | Y |  ----  |
| Snapshot | Y |  ----  |
| Autoplay | Y |  HTTP-FLV 265+264<br>HTTP-TS 265+264<br>HLS 264  |
| Cache Length | Y | MP4 265 |
| Multi-thread decoder | Y | (HTTPS+ Conf NGINX) |
| Single-thread decoder | Y | compatible |
| Get MediaInfo | Y | ---- |
| Get Codec Param | Y | Video&Audio |
| Get Media Duration | Y | Video&Audio |
| Get Video Size | Y | ---- |
| Get Video FPS | Y | ---- |
| Get Audio SampleRate | Y | ---- |
| Chase Frame | Y | HTTP-FLV(no audio) |
| PlayBackRate | Y | H.264/AV1 |
| Resize | Y | ---- |

<br>

#### freeToken ####

```javascript
token = "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1";
```

<br>

#### Demo ####

<a href="https://www.zzsin.com/h265webjs.html">https://www.zzsin.com/h265webjs.html</a>

Simple Demo - First <a href="index-debug.html">index-debug.html</a>

<br>

#### PreviewImage ####

|  Type | Example |
| ---- |  ----  |
|  VOD | <a href='./resource/demo.png' target="_blank"><img src="./resource/demo.png" height="300px" /></a>  |
| LIVE | <a href='./resource/demo2.png' target="_blank"><img src="./resource/demo2.png" height="300px" /></a> |

<br>

## 1、UseItByDemo ##

* Simple Demo - First <a href="index-debug.html">index-debug.html</a>

* You need to put project in your `web server` path, and open it with `index.html`

<br>

## 2、SdkAndApiDocument ##

———————— __API/Events__

#### New SDK Project for H.265/HEVC decoder - [https://github.com/numberwolf/h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder)

### Install ###

> * <h4> Warning: Do not install from npm store! Please download from Github！ Because npm store is not friendly with Webassembly!</h4>

> * <h4> Warning: Put the .wasm file into `webpack`/`browerify`'s dist Directory! If wasm's path is not same with `webpack`/`browerify`'s dist file's path, you can not running with it！！！Or you can include with this github's dist/\*.js and dist/missile\*.wasm</h4>

```bash
bash init.sh
```

#### 1）Install SDK Package

* By github 1.1 <a href="https://github.com/numberwolf/h265web.js">h265web.js</a>

* Simple Demo - First <a href="index-debug.html">index-debug.html</a>

* demo: <a href="./example_normal">example_normal</a> （recommend）
	```javascript
	<script src="dist/missile.js"></script>
	<script src="dist/h265webjs-v20211016.js"></script>
	```

* demo: <a href="./example">example</a>
	```javascript
	// import wasm in html file
	<script src="dist/missile.js"></script>
	// import from local file in your es js file
	require('./dist/h265webjs');
	```

* demo: <a href="./example">example</a>
	* `import xxx from xxx`

	```javascript
	// import wasm in html file
	<script src="dist/missile.js"></script>
	// import from local file in your es js file
	import H265webjsModule from './dist/index';
	```

<br>

#### 2）Install Wasm

* If you install it by github, you could skip this step.

<br>

#### 3）Include h265web.js to project

* Github <a href="https://github.com/numberwolf/h265web.js">h265web.js</a>


<br>

### PlayerConfig ###

* Make player config

```javascript
const PLAYER_CORE_TYPE_DEFAULT = 0; // Default player core
const PLAYER_CORE_TYPE_CNATIVE = 1; // BAK player Core

let config = {
    player: "glplayer",
    width: 960,
    height: 540,
    token : token,
    extInfo : {
        moovStartFlag : true
    }
};
```

* Config desc

|  Config | Type | Value | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| type  | String | mp4/hls/ts/raw265/flv | N | Media file type, or auto detect |
| player  | String | - | Y | Player dom id |
| width  | Int | - | Y | Player width |
| height  | Int | - | Y | Player height |
| token  | String | - | Y | player's token |
| extInfo  | Object | - | N | player extra info |
| \+ moovStartFlag  | Bool | true/false | N:default is sfalse | mp4 with moov before mdat |
| \+ rawFps  | Float32 | Example:30 | N:default 24 | Fps for play HEVC/AVC stream |
| \+ coreProbePart  | Float32 | - | N:Default is 1.0 | Probe Mp4 media info，interval: `0.0~1.0`, traditional mp4 file which moov box front of mdat box, use 0.1(10%) （only with Bak player core mode(beta)) |
| \+ core  | Int | - | N:Default 0 | 0:Default Core <br>1:Bak Core |
| \+ ignoreAudio | Int | - | N:Default is 0 | 0:Play with audio <br>1:Without audio |
| \+ probeSize | Int | - | N:4096 | HTTP-FLV(LIVE) Mode's probe size, default is 4096 |
| \+ autoPlay | Bool | true/false | N:false | Open autoplay <br>HTTP-FLV 265+264<br>HTTP-TS 265+264<br>HLS 264 |
| \+ cacheLength | Int | [5, ∞+] | N:Default is 50 frames | Set cache frame count by manual <br>MP4 265 |


<br>

### InitPlayer ###

* Warning！！！

<strong>After compile ,Please put your `JS file` with `wasm file` in the same directory </strong>

* Example

```c
	./dist/your dist play file
	./dist/sdk files
	./index.html
```

* Create your player(Global function) 

> new265webjs(`mediaAddress`, `playerConfig`)

|  Param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| mediaAddress  | String | - | Y | media file address/path |
| playerConfig  | Object | - | Y | player's config |

* Example

	* 1）URI and Config

		* Example 1 Create `mp4/hls/ts` Player

		```javascript
		let videoURL = "h265_test.mp4";
		let config = {
		    player: "glplayer",
		    width: 960,
		    height: 540,
		    accurateSeek : true,
		    token : token,
		    extInfo : {
		        moovStartFlag : true,
		        readyShow : true
		    }
		};
		````

		* Example 2 Create `raw265` Player (play hevc raw stream)

		```javascript
		let videoURL = "demo/res/raw.h265";
		let config = {
		    player: "glplayer",
		    width: 960,
		    height: 540,
		    accurateSeek : true,
		    token : token,
		    extInfo : {
		        readyShow : true,
		        rawFps : 30 // frame rate
		    }
		};
		````

		* Example 3 Create `FLV`(Video on demand) Player

		```javascript
		const PLAYER_CORE_TYPE_DEFAULT = 0; // Default player core
        const PLAYER_CORE_TYPE_CNATIVE = 1; // Bak player core mode
		let config = {
            player: "glplayer",
            width: 960,
            height: 540,
            accurateSeek : true,
            token : token,
            extInfo : {
                moovStartFlag : true,
                readyShow : true,
                autoCrop : false,
                coreProbePart : 0.1,
                ignoreAudio : 0
            }
        };
		````

	* 2）Player
		* 0. Example 0 Create by normal js without compile
		Example:
		```javascript
		let player = window.new265webjs(url, config);
		```

		* 1. If `require('./src/h265webjs');`

		Example:
		```javascript
		let player = new265webjs(videoURL, config); // Global Function
		```

		* 2. If `import H265webjsModule from './dist/index';`（recommend）

		Example:
		```javascript
		let player = H265webjsModule.createPlayer(videoURL, config);
		```

		* 3. NOTICE! If you want to create `raw265` stream player
			(Do not need execute with this step when you play 265 vod stream)

			* Add `raw265` type, and set `rawFps` for player's fps

			```javascript
			config = {
                type: 'raw265',
                player: "glplayer",
                width: 960,
                height: 540,
                // accurateSeek : true,
                token : token,
                extInfo : {
                    rawFps: 24,
                    moovStartFlag : true,
                    coreProbePart : 0.1,
                    ignoreAudio : 0,
                    probeSize : 8192,
                    autoPlay : true,
                }
            };
			```
	

<br>

### PlayerBindEvents ###

#### SeedFinished ####

* Example

```javascript
player.onSeekFinish = () => {
    // todo
};
```

<br>

#### CallbackYuvData ####

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

#### MediaLoadSuccessed ####

> If this event happened, you can start play

* Example

```javascript
player.onLoadFinish = () => {
	// todo
};
```

<br>

#### PlayerPtsUpdate ####

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

#### PlayFinished ####

* Example

```javascript
player.onPlayFinish = () => {
    // finished
};
```

#### CacheDownload ####

|  Callback param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| cPts  | float64 | - | - | Cache process timestamp |

* Example

```javascript
player.onCacheProcess = (cPts) => {
    // console.log("onCacheProcess => ", cPts);
};
````

#### CoverImageLoadFinished ####

* Example

```javascript
player.onReadyShowDone = () => {
    // console.log("onReadyShowDone");
    // to play
};
```

#### CachingDecodeFrames ####

* Example

```javascript
player.onLoadCache = () => {
	// caching frames
};
```


#### CachingDecodeFinished ####

* Example

```javascript
player.onLoadCacheFinshed = () => {
    // cache finished
};
```

#### OpenFullScreenEvent ####

* Example

```javascript
player.onOpenFullScreen = () => {
    // todo
};
```

#### CloseFullScreenEvent ####

* Example

```javascript
player.onCloseFullScreen = () => {
    // todo
};
```

#### CallbackPlayState ####

* Example

```javascript
player.onPlayState = (state) => {
    // state
    // true: playing / false: paused
};
```

<br>

### PlayerAPIDocument ###

#### BuildPlayer ####

> After【set player config】和【bind events】

* Example

```javascript
player.do();
```

<br>

#### GetPlayerPlayStatus ####

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

#### StartPlay ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| play()  | - | Start play |

* Example

```javascript
player.play();
```

<br>

#### Pause ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| pause()  | - | Pause |

* Example

```javascript
player.pause();
```

<br>

#### SetRenderCallbackYuvFrame ####

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

#### Seek ####

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

#### VolumeOption ####

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

#### GetMediaInfo ####

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
	videoCodec: 0 // 0:HEVC/H.265 1:Others Codec
	isHEVC: true // video is HEVC Codec
videoType: "vod" // vod or live
```

* Example

```javascript
let mediaInfo = player.mediaInfo();
```

<br>

#### OpenFullscreen ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| fullScreen()  | - | open fullscreen |

* Example

```javascript
player.fullScreen();
```

<br>

#### ExitFullscreen ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| closeFullScreen()  | - | exit fullscreen |

* Example

```javascript
player.closeFullScreen();
```

<br>


#### nextframe ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| playNextFrame()  | true/false | play next frame |

<br>

#### setplayrate ####

| Function | Return | Desc |
|  ----  | ----  | ---- |
| setPlaybackRate(rate)  | true/false | 设置倍速 默认1.0 |

* 示例

```javascript
h265Object.setPlaybackRate(0.5);
```

<br>

#### getplayrate ####

| Function | Return | Desc |
|  ----  | ----  | ---- |
| getPlaybackRate()  | Double | 截取当前帧图像 |

* 示例

```javascript
let rate = h265Object.getPlaybackRate();
```

<br>

#### resize ####

| Function | Return | Desc |
| ---- | ---- | ----|
| resize(width, height) | true/false | resize |

<br>

#### snapshot ####

|  Function | Return | Desc |
|  ----  | ----  | ---- |
| snapshot()  | - | Snapshot frame |

* Example

```javascript
const snapCanvas = document.getElementById("snapshot-player"); // create canvas
h265Object.snapshot(snapCanvas); // snapshot to canvas
```

<br>

#### release ####

| Function | Return | Desc |
| ----  | ----  | ---- |
| release()  | - | Release Player |

* Example

```javascript
player.release();
```

<br>

## 3、Others ##

### Donate ###

|  Wechat | Alipay | PayPal |
|  ---- | ----  | ---- |
| <img src="resource/donate/wechat.JPG" height="500"> | <img src="resource/donate/alipay.JPG" height="500"> | TODO |
<br>

### FFmpegSupportH265LiveEncode ###

* Github: https://github.com/numberwolf/FFmpeg-QuQi-H265-FLV-RTMP

<br>

### TranscodeAndGet265CodecFileByFFmpeg ###

* mp4

```bash
ffmpeg -i input.mp4 \
-vcodec libx265 -pix_fmt \
-acodec aac -ac 2 -ar 44100 \
-preset medium -maxrate 1000k -bufsize 1000k \
-vtag hvc1 \
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

<br>

# UpdateLog #

| Update | Content |
| ---- | ---- |
| Time | 2022/11/06 |
| - | 0.Update |
| Time | 2022/11/02 |
| - | 0.Update WASM |
| Time | 2022/10/22 |
| - | 0.Support: Hard-Decode for FLV/HTTP-FLV/MP4 |
| - | 1.Support: AVC with Mpeg-TS |
| Time | 2022/09/13 |
| - | 0.Fixed: AVC stream loop buffer error without autoplay |
| Time | 2022/09/12 |
| - | 0.Fixed: hevc url cannot play without text of "http" |
| Time | 2022/08/24 |
| - | 0.Feature: Safari with native player(version>13) |
| Time | 2022/08/23 |
| - | 0.Fixed: Buffer Progress with AVC |
| Time | 2022/08/13 |
| - | 0.Support: Resize |
| Time | 2022/07/27 |
| - | 0.Support: PlayBackRate |
| Time | 2022/07/12 |
| - | 0.Fixed some problem |
| Time | 2022/07/06-10 |
| - | 0.Support g711u (http-flv) |
| - | 1.Fixed: HTTP-FLV(AVC) without Audio |
| Time | 2022/07/01 |
| - | 0.Feature: HTTP-FLV(Without audio) Stream Performance optimizing |
| Time | 2022/06/27 |
| - | 0.Fixed: problem with hls parser |
| Time | 2022/06/26 |
| - | 0.Support g711a (http-flv) |
| - | 1.Fixed 264(avc) flv error with mediainfo |
| - | 2.Support Multi/Single Thread |
| Time | 2022/05/18 |
| - | 0.Support multi-thread decode |
| - | 1.Support mp4's cache length config |
| - | 2.Performance optimizing |
| - | 3.This version is for Beta |
| Time | 2022/05/09 |
| - | 0.Suport play with Websocket 265 raw stream |
| Time | 2022/05/07 |
| - | 0.Fixed:MP4(VOD) retry error |
| - | 1.Support:HEVC raw stream(VOD), create with url |
| - | 2.Support:MKV format |
| Time | 2022/04/21 |
| - | 0.Performance optimizing |
| Time | 2022/04/17 |
| - | New Opensource Free Protocol <a href="LICENSE-Free_CN.MD">CYL_Free-1.0 LICENSE-Free_CN.MD</a> |
| Time | 2022/04/14 |
| - | 0.Support Mov File |
| - | 1.Support HTTP-FLV/HTTP-TS/HLS Autoplay |
| - | 2.Performance optimizing of 1080P MP4(VOD) |
| - | 3.Retry of mp4 sniff action |
| - | 4.Support AV1 |
| - | 5.Support Play frame by frame |
| - | 6.Support Video Frame Snapshot |
| Time | 2022/03/28 |
| - | 0.Support MPEG-PS(MPEG1) stream |
| Time | 2022/03/02 |
| - | 0.Fixed h264 FLV(LIVE) can not get resolution info with retry |
| Time | 2022/01/17 |
| - | 0.Fixed ISSUE of HLS 265 OOM Case https://github.com/numberwolf/h265web.js/issues/108  <img src="resource/mem-hls.jpg" width="300px"> |
| - | 1.Fixed ISSUE of HLS Split Rules https://github.com/numberwolf/h265web.js/issues/105 |
| - | 2.Add New Demo <a href="index-debug.html">index-debug.html</a> |
| - | 3.Fixed 10+playes of 264 play failed, stack overflow |
| Time | 2021/12/31 |
| - | 0.Add H.264 HTTP-FLV Retry after error |
| Time | 2021/12/24 |
| - | 0.Fixed H.264 HTTP-FLV Some Badcase with callback |
| Time | 2021/12/19 |
| - | 0.Fixed H.264 HLS Callback's problem |
| Time | 2021/12/08 |
| - | 0.Fixed Problem of H.264 MP4 onReadyShowDone Event |
| Time | 2021/12/04 - In the small hours |
| - | 0.Fixed http-flv 265 Render With crash |
| - | 1.Fixed hls problem of fullscreen |
| - | 2.Fixed some bugs |
| Time | 2021/11/29 - Night |
| - | 0.Fixed http-flv retry case and some bugs |
| Time | 2021/11/25 - Night |
| - | 0.Fixed httpflv/ws LIVE ignoreAudio problem |
| Time | 2021/11/23 - Night |
| - | 0.Fixed https://github.com/numberwolf/h265web.js/issues/90 |
| Time | 2021/11/21 - In the small hours |
| - | 0.Support Websocket-FLV (HEVC/H.265) |
| - | 1.Support Websocket-TS (HEVC/H.265) |
| - | 2.Support HTTP-TS (HEVC/H.265) |
| Time | 2021/11/16 - Evening |
| - | 0.First request, if no response and timeout, then retry 5 times |
| Time | 2021/11/15 - Evening |
| - | 0.HTTP-FLV auto retry when timeout with out packet.(7s) |
| Time | 2021/11/14 - Evening |
| - | 0.Add wasm file of 265mb version(can memory auto grow) |
| - | 1.Add wasm file of 512mb version(can memory auto grow) |
| Time | 2021/11/04 - Evening |
| - | 0.Fixed: release many times with crash |
| Time | 2021/10/26 - Evening |
| - | 0.Fixed some bugs |
| Time | 2021/10/24 - Evening |
| - | 0.Support Codec of AVC/H.264's MP4/HLS/M3u8/FLV/HTTP-FLV play |
| Time | 2021/10/18 - Evening |
| - | 0.Add new example |
| Time | 2021/10/16 - Evening |
| - | 0.Fixed: HTTP-FLV: Mediainfo's codec fault value |
| - | 1.Update example |
| Time | 2021/10/14 - Evening |
| - | 0.Fixed: Mediainfo's codec fault value |
| Time | 2021/10/13 - Evening |
| - | 0.The player compatible with WebIDE develop, split wasm(js) and h265web.js, need include wasm(js) as single |
| Time | 2021/10/12 - Evening |
| - | 0.Fixed: Support HTTP-FLV(HEVC) without fps param |
| Time | 2021/10/09 - In the small hours |
| - | 0.Support HTTP-FLV(HEVC) LIVE, CodecID=12 |
| - | 0.MP4/FLV(VOD) performance optimizing of Seek operation(out of cache area) |
| Time | 2021/09/27 - Evening |
| - | 0.M3u8/MpegTS performance optimizing of Seek operation(out of cache area) |
| Time | 2021/09/25 - In the small hours |
| - | 0.HLS Live Fixed: Crash by OOM |
| - | 1.HLS Live Fixed: MPEG-TS full path |
| - | 2.HLS Live Fixed: Stop by lost stream a moment |
| - | 3.HLS Live Fixed: Stop by unstable network |
| Time | 2021/09/08 - Evening |
| - | 0.Fixed: M3U8 Seek with Decode Failed |
| - | 1.Fixed: Some MP4 Case |
| - | 2.Config update, remove some options, make it auto set |
| Time | 2021/09/07 - Evening |
| - | 0.M3U8 Fixed: some error with parse mpegts file |
| Time | 2021/09/07 - In the small hours |
| - | 0.Bak Player Core - Fixed:MP4/FLV(VOD) Seek BUG can not seek to 0; And performance optimizing for play |
| Time | 2021/08/15 |
| - | 0.H265/HEVC Upgrade Raw Data Player for VOD/LIVE |
| Time | 2021/07/18 |
| - | 0.Upgrade: Player UI Style |
| - | 1.Support: fullscreen & close fullscreen |
| - | 2.Add Event: open/close fullscreen |
| Time | 2021/07/11 |
| - | 0.Fixed: The player compatible with ZLMediaKit + HUAWEI HoloSens Camera LIVE Stream |
| Time | 2021/07/04 |
| - | 0.Fixed: <a href="https://github.com/numberwolf/h265web.js/issues/58">`ISSUE#58`</a> (When default player-core's status is caching-frames, can not pause video) |
| Time | 2021/07/01 |
| - | 0.Add example and package.json file |
| Time | 2021/06/27 |
| - | 0.Open Source! |
| - | 1.Support Seek in FLV |
| - | 2.Fixed: Seek problems with bak player core mode |
| - | 3.Add FLV type ,and do not need set player-core |
| Time | 2021/05/30 |
| - | 1.Fixed: Some problem with seek and play(Important) |
| - | 2.Feature: Event/Callback of Video's cover image load finished |
| Time | 2021/05/24 |
| - | 1.FLV VOD Play(In the bak player core mode) |
| Time | 2021/05/21 |
| - | 1.HLS(LIVE:No audio)performance optimizing |
| Time | 2021/05/18 |
| - | 1.HLS(LIVE) performance optimizing and add Audio |
| Time | 2021/05/16 |
| - | 1.MP4(VOD) Fixed:BD265 Mp4 box badcase |
| Time | 2021/05/15 |
| - | 1.Fixed: HLS Play(LIVE) |
| Time | 2021/04/27 |
| - | 1.Fixed: Some video playing with gray block(mosic) |
| - | 2.Fixed: Some video when playing first gop with gray block(mosic) |
| Time | 2021/04/22 |
| - | 1.Bak player core mode(test) support: seek |
| - | 2.Bak player core mode(test) support: yuvj420p |
| - | 3.Others |
| Time | 2021/04/12 |
| - | 1.Fixed bug: Some video(encode hev) play failed |
| - | 2.Fixed bug: Some video(nalu unstandard) play failed |
| - | 3.Fixed bug: Some video play error with mosic |
| Time | 2021/04/07 |
| - | 1.Fixed duration error |
| Time | 2021/03/28 |
| - | 1.Add cache process event |
| - | 2.Fixed some bugs |
| - | 3.Remove HLS Log |
| - | 4.Play without audio optio(New Core) |
| Time | 2021/03/14 |
| - | 1.Bak player core mode: Fixed: render of bytes align |
| Time | 2021/03/12 |
| - | 1.Sorry my friends, I was too tired to make a mistake with hls feature... Now I have fixed it. ~_~! |
| Time | 2021/03/06 |
| - | 1.Bak player core mode, Fixed: multi-stream play badcase |
| Time | 2021/02/28 |
| - | 1.Add function to feed 265 nalu-frame `append265NaluFrame(nalBuf);` |
| - | 2.Add new library to parse 265 stream [raw-parser.js](./dist/raw-parser.js) |
| Time | 2021/02/21 |
| - | 1.New SDK Project for H.265/HEVC decoder - [https://github.com/numberwolf/h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder) |
| Time | 2021/02/18 |
| - | 1.Bak player core mode support play with audio |
| Time | 2021/02/08 |
| - | 1.Bak player core mode (beta version , do not support play audio and seek. Make your mp4's moov box front of the mdat) |
| Time | 2021/01/04 |
| - | 1.Player Support Hevc file|
| - | 2.Player Support Hevc stream|
| - | 3.Remove Play/Pause Mask |
| - | 4.Add Event:`onPlayFinish`, called when play video finished |


<hr>









