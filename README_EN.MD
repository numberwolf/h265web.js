# h265web.js

<a href="README.MD">中文</a> | <a href="README_EN.MD">English</a>

<img src="./resource/logo@300x300.png" width="300px" />

__`A hevc/h.265 web player, easy to play 1080P.`__

__`~^_^~ For love` if <a href="https://github.com/numberwolf/h265web.js">h265web.js</a> help you, please `star` it~__

| h265web.js | mpeg.js `(ts demuxer)` | h265web.js's H.265 decoder |
| ---- | ---- | ---- |
| [h265web.js](https://github.com/numberwolf/h265web.js)  | [MPEG-Demuxer.js](https://github.com/numberwolf/MPEG-Demuxer.js) | [h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder) |

<a href="https://www.gnu.org/licenses/gpl-3.0.md">License GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.md</a>


## Index

- [0、README](#0readme)
	
	- [Update Log](upldatelog)

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

- [3、Others](#3others)

	- [Donate - Give me power Give me love - I will make list of donaters](#donate)
	
	- [Transcode and get hevc media file by ffmpeg](#transcodeandget265codecfilebyffmpeg)

<hr>

### 0、README ###

#### UpldateLog ####

| Update | Content |
| ---- | ---- |
| Time | 2021/05/16 |
| - | 1.MP4(VOD) Fixed:BD265 Mp4 box badcase |
| Time | 2021/05/15 |
| - | 1.Fixed: HLS Play(LIVE) |
| Time | 2021/04/27 |
| - | 1.Fixed: Some video playing with gray block(mosic) |
| - | 2.Fixed: Some video when playing first gop with gray block(mosic) |
| Time | 2021/04/22 |
| - | 1.New play core(test) support: seek |
| - | 2.New play core(test) support: yuvj420p |
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
| - | 1.New Core: Fixed: render of bytes align |
| Time | 2021/03/12 |
| - | 1.Sorry my friends, I was too tired to make a mistake with hls feature... Now I have fixed it. ~_~! |
| Time | 2021/03/06 |
| - | 1.New Core Type, Fixed: multi-stream play badcase |
| Time | 2021/02/28 |
| - | 1.Add function to feed 265 nalu-frame `append265NaluFrame(nalBuf);` |
| - | 2.Add new library to parse 265 stream [raw-parser.js](./dist/raw-parser.js) |
| Time | 2021/02/21 |
| - | 1.New SDK Project for H.265/HEVC decoder - [https://github.com/numberwolf/h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder) |
| Time | 2021/02/18 |
| - | 1.New player core support play with audio |
| Time | 2021/02/08 |
| - | 1.New player core (beta version , do not support play audio and seek. Make your mp4's moov box front of the mdat) |
| Time | 2021/01/04 |
| - | 1.Player Support Hevc file|
| - | 2.Player Support Hevc stream|
| - | 3.Remove Play/Pause Mask |
| - | 4.Add Event:`onPlayFinish`, called when play video finished |

| TODO | Content |
| ---- | ---- |
| 1 | Support Http-flv |


#### Supported ####

* Protocol box

|  protocol | model | support | desc |
| ---- | ---- |  ----  | ---- |
| mp4 | Video on demand |  Y  | ---- |
| mpeg-ts | Video on demand |  Y  | ---- |
| m3u8 | Video on demand |  Y  | ---- |
| hls | Live |  Y  | ---- |
| H.265 | Video on demand |  Y  | ---- |
| H.265 | Live |  Y  | ---- |
| http-flv | Live |  N  | TODO |
| flv | Video on demand |  N  | TODO |

* Features

|  Feature | support | desc |
| ---- | ---- |  ----  |
| Video on demand | Y |  ----  | ---- |
| Live | Y |  ----  | ---- |
| Seek | Y | when core equal to 1, do not support  | ---- |
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
| Play without Audio | Y |  ----  | ---- |
| Cache process | Y |  ----  | ---- |

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

#### New SDK Project for H.265/HEVC decoder - [https://github.com/numberwolf/h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder)

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

<br>

#### 2）Install Wasm

* If you install it by github, you could skip this step.

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


<br>

### PlayerConfig ###

* Make player config

```javascript
const PLAYER_CORE_TYPE_DEFAULT = 0; // 默认播放器内核
const PLAYER_CORE_TYPE_CNATIVE = 1; // 实验播放器内核

let config = {
    type: "mp4",
    player: "glplayer",
    width: 960,
    height: 540,
    accurateSeek : true,
    token : token,
    extInfo : {
        moovStartFlag : true,
        readyShow : true,
        rawFps : 30,
        core : PLAYER_CORE_TYPE_DEFAULT
    }
};
```

* Config desc

|  Config | Type | Value | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| type  | String | mp4/hls/ts/raw265 | Y | Media file type |
| player  | String | - | Y | Player dom id |
| width  | Int | - | Y | Player width |
| height  | Int | - | Y | Player height |
| accurateSeek  | Bool | true/false | Y | Accurate seek |
| token  | String | - | Y | player's token |
| extInfo  | Object | - | N | player extra info |
| \+ moovStartFlag  | Bool | true/false | N:default is sfalse | mp4 with moov before mdat |
| \+ readyShow  | Bool | true/false | N:default is false | need cover image |
| \+ rawFps  | Float32 | Example:30 | N:default 24 | Fps for play HEVC/AVC stream |
| \+ core  | Int | - | N:default 0 | 0:Default player core <br>1: New player core(beta) |
| \+ coreProbePart  | Float32 | - | N:Default is 1.0 | Probe Mp4 media info，interval: `0.0~1.0`, traditional mp4 file which moov box front of mdat box, use 0.1(10%) （only with New player core(beta)) |
| \+ ignoreAudio | Int | - | N:Default is 0 | 0:Play with audio <br>1:Without audio |


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
		* Example 1 Create `mp4/hls/ts` Player

		```javascript
		let videoURL = "h265_test.mp4";
		let config = {
		    type: "mp4",
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
		    type: "raw265",
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

	* 2）Player
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

			* `raw265` type，feed byte data

			Function

			|  Function | Return | Desc | 
			|  ----  | ----  | ---- |
			| append265NaluFrame  | NULL | Feed H.265 nalu-frame (bytes) |

			Params

			| Param | Type | Default | Require | Desc | 
			|  ----  | ----  | ---- | ---- | ---- |
			| frame  | Uint8Array | - | Y | Bytes |

			Example - I get a hevc file by network, and get bytes data to player.

			```javascript
			//
		    // fetch 265
		    // you can use your code to fetch vod stream
		    // only need `h265webjs.append265NaluFrame(nalBuf);` to append 265 frame
		    //
		    let rawParser = new RawParserModule();

		    let fetchFinished = false;
		    let startFetch = false;
		    let networkInterval = window.setInterval(() => {
		        if (!startFetch) {
		            startFetch = true;
		            fetch(url265).then(function(response) {
		                let pump = function(reader) {
		                    return reader.read().then(function(result) {
		                        if (result.done) {
		                            // console.log("========== RESULT DONE ===========");
		                            fetchFinished = true;
		                            window.clearInterval(networkInterval);
		                            networkInterval = null;
		                            return;
		                        }
		                        let chunk = result.value;
		                        rawParser.appendStreamRet(chunk);
		                        return pump(reader);
		                    });
		                }
		                return pump(response.body.getReader());
		            })
		            .catch(function(error) {
		                console.log(error);
		            });
		        }
		    }, 1);

		    // fps>=30 play else cache
		    let naluParseInterval = window.setInterval(() => {
		        if (nalBuf != false) {
		            // require
		            h265webjs.append265NaluFrame(nalBuf);
		        } else if (fetchFinished) {
		            window.clearInterval(naluParseInterval);
		            naluParseInterval = null;
		        }
		    }, 1);
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

#### 3）Media load success

> If this event happened, you can start play

* Example

```javascript
player.onLoadFinish = () => {
	// todo
};
```

<br>

#### 4）Player's play timestamp update

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

#### 5）Player play finished

* Example

```javascript
player.onPlayFinish = () => {
    // finished
};
```

#### 6）Player cache process

|  Callback param | Type | Default | Need | Desc | 
|  ----  | ----  | ---- | ---- | ---- |
| cPts  | float64 | - | - | Cache process timestamp |

* Example

```javascript
player.onCacheProcess = (cPts) => {
    // console.log("onCacheProcess => ", cPts);
};
````

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

### Donate ###

|  Wechat | Alipay | PayPal |
|  ---- | ----  | ---- |
| <img src="dist/assets/donate/wechat.JPG" height="500"> | <img src="dist/assets/donate/alipay.JPG" height="500"> | TODO |

<br>

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


<hr>

## Stargazers over time

[![Stargazers over time](https://starcharts.herokuapp.com/numberwolf/h265web.js.svg)](https://starcharts.herokuapp.com/numberwolf/h265web.js)







