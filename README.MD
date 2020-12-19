# h265web.js

| h265web.js | mpeg.js `(解析ts)` |
| ---- | ---- |
| [![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js) | [![npm version](https://badge.fury.io/js/mpeg.js.svg)](https://www.npmjs.com/package/mpeg.js) |

<a href="https://www.gnu.org/licenses/gpl-3.0.md">License GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.md</a>

README.md：<a href="README.MD">中文</a> | <a href="README_EN.MD">English</a>

<img src="./resource/logo@300x300.png" width="300px" />

————————— __`一个可支持HEVC/H.265编码播放720P、1080P的播放器。`__

__`~^_^~ 作者用爱发电` 如果 <a href="https://github.com/numberwolf/h265web.js">h265web.js</a> 帮助到了你，请点击右上角的star~__

## 目录

- [0、说明](#0、说明)

	- [当前能力](#当前能力)

	- [当前版本token](#当前版本的token)

	- [联系我](#联系我)

	- [线上demo](#线上demo)

	- [效果预览](#效果预览)

- [1、快捷方式使用](#1、快捷方式使用)

- [2、播放器SDK使用文档](#2、播放器sdk使用文档)

	- [安装](#安装)

	- [播放器配置](#播放器配置)

	- [初始化播放器](#初始化播放器)

	- [播放器相关事件绑定](#播放器相关事件绑定)

	- [播放器API能力](#播放器api能力)

- [3、其它帮助](#3、其它帮助)
	
	- [FFmpeg转码265编码的视频](#ffmpeg转码265编码的视频)

<hr>

### 0、说明 ###

#### 当前能力 ####

* 协议

|  协议 | 模式 | 是否支持 | 说明 |
| ---- | ---- |  ----  | ---- |
| mp4 | 点播 |  是  | ---- |
| mpeg-ts | 点播 |  是  | ---- |
| m3u8 | 点播 |  是  | ---- |
| hls | 直播 |  是  | ---- |
| http-flv | 直播 |  否  | 待支持 |
| flv | 点播 |  否  | 待支持 |

* 能力

|  能力 | 是否支持 | 其他 |
| ---- | ---- |  ----  |
| 直播 | 是 |  ----  | ---- |
| 点播 | 是 |  ----  | ---- |
| Seek跳转 | 是 |  ----  | ---- |
| 精准Seek | 是 |  ----  | ---- |
| 封面图 | 是 |  ----  | ---- |
| 边下边播 | 是 |  ----  | ---- |
| 音量调节 | 是 |  ----  | ---- |
| 播放 | 是 |  ----  | ---- |
| 暂停 | 是 |  ----  | ---- |
| 重新播放 | 是 |  ----  | ---- |
| 暂停截图 | 是 |  ----  | ---- |
| 1080p播放 | 是 |  ----  | ---- |
| 720p播放 | 是 |  ----  | ---- |
| 多路播放 | 是 |  ----  | ---- |

<br>

#### 当前版本的token ####

```javascript
token = "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1";
```

<br>

#### 联系我 ####

* Github: https://github.com/numberwolf/h265web.js
* Email(porschegt23@foxmail.com)
* QQ: 531365872
* Discord:numberwolf#8694
* 微信:numberwolf11

<br>

#### 线上demo ####

<a href="http://hevc.xvideo.video/">http://hevc.xvideo.video</a>

<br>

#### 效果预览 ####

|  类型 |  点播 | 直播 |
| ---- |  ----  | ---- |
|  点击<br>放大 | <a href='./resource/demo3.png' target="_blank"><img src="./resource/demo3.png" height="300px" /></a>  | <a href='./resource/demo2.png' target="_blank"><img src="./resource/demo2.png" height="300px" /></a> |

<br>

## 1、快捷方式使用 ##

* 使用流程也可以直接看 `play.js`和`index.html`的Demo使用

* 本项目可以直接放在你的`web服务器`目录下访问`index.html`

<br>

## 2、播放器SDK使用文档 ##

———————— __API以及事件能力__

### 安装 ###

#### 1）引入包

* 方式1：引入Github的本地文件

```javascript
// 引入Github的本地文件
const H265webjs = require('./dist/h265webjs');
```

* 方式2：从npm商店引入

[![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js) | <a href="https://www.npmjs.com/package/h265web.js">npm:h265web.js</a>

<br>

#### 2）安装Wasm

* 如果使用了直接从Github下载dist的话这一步可以跳过。

* 如果用`npm`方式进行安装，则需要将`./node_modules/h265web.js/dist/*.wasm`拷贝到你的`h265webjs.js`同级目录下才可以。

	* 示例Cmd

	```bash
	npm i h265web.js
	cp ./node_modules/h265web.js/dist/*.wasm ./dist/
	```

<br>

#### 3）引入h265web.js到你的项目

* 本地引入（从Github <a href="https://github.com/numberwolf/h265web.js">h265web.js</a>）

```javascript
const H265webjs = require('./dist/h265webjs');
```

* npm形式引入

[![npm version](https://badge.fury.io/js/h265web.js.svg)](https://www.npmjs.com/package/h265web.js)

```javascript
const H265webjs = require('h265web.js');
```

<br>

### 播放器配置 ###

* 创建代码如下

```javascript
var config = {
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

* 配置详解

|  配置项 | 类型 | 可选值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| type  | String | mp4/hls/ts | 是 | 播放文件的类型 |
| player  | String | - | 是 | 播放窗口的dom的id值 |
| width  | Int | - | 是 | 播放窗口的宽度 |
| height  | Int | - | 是 | 播放窗口的高度 |
| accurateSeek  | Bool | true/false | 是 | 精准Seek（暂时固定为true） |
| playIcon  | String | - | 是 | 播放器播放Icon图 |
| loadIcon  | String | - | 是 | 播放器加载Icon图 |
| token  | String | - | 是 | 播放器token值 |
| extInfo  | Object | - | 否 | 播放器额外配置 |
| \+ moovStartFlag  | Bool | true/false | 否:默认false | Mp4的moov box是否前置 关联到动态加载 |
| \+ extInfo  | Bool | true/false | 否:默认false | 是否需要封面图展示 |


<br>

### 初始化播放器 ###

* 创建方法(全局方法) 

> new265webjs(`播放地址`, `播放器配置`)

|  参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| 播放地址  | String | - | 是 | 播放视频地址 |
| 播放器配置  | Object | - | 是 | 播放器配置信息 |

* 创建示例Demo

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
let player = new265webjs(videoURL, config);
````

<br>

### 播放器相关事件绑定 ###

#### 1）Seek完成

> 主要用于SEEK完成做一些操作

* 示例

```javascript
player.onSeekFinish = () => {
    // todo
};
```

<br>

#### 2）YUV帧数据渲染

|  回调参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| width  | int | - | - | YUV宽度 |
| height  | int | - | - | YUV高度 |
| imageBufferY  | Uint8Array | - | - | Y分量 |
| imageBufferB  | Uint8Array | - | - | ChromaB分量 |
| imageBufferR  | Uint8Array | - | - | ChromaR分量 |

> 可以利用事件回调的YUV做全屏播放

> 需要调用 `setRenderScreen` 函数开启才可以收到事件回调数据, 下方`1.5 API`会说明

* 示例

```javascript
player.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
	// todo
};
```

<br>

#### 3）点击播放画面事件

> 主要用于点击播放花面的响应事件，一般用于播放、暂停

* 使用示例Demo

```javascript
player.onMaskClick = () => {
	if (player.isPlaying()) {
	    // 当前正在播放状态
	} else {
	    // 当前是暂停状态
	}
};
```

<br>

#### 4）媒体文件加载完成事件

> 媒体文件当前加载成功，可以进行播放

* 示例

```javascript
player.onLoadFinish = () => {
	// todo
};
```

<br>

#### 5）播放器当前播放PTS（时刻）更新

|  回调参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| videoPTS  | float64 | - | - | 当前播放时间 |

* 示例

```javascript
player.onPlayTime = (videoPTS) => {
	// todo
	console.log(videoPTS)
};
```

<br>

### 播放器API能力 ###

#### 1）加载播放器

> 一般在配置完成【播放器配置】和【事件】之后进行播放器加载

* 示例

```javascript
player.do();
```

<br>

#### 2）获取当前播放状态

|  调用函数 | 返回 | 说明 |
|  ---- | ----  | ---- |
| isPlaying() | bool | 是否正在播放中 |

* 示例

```javascript
if (player.isPlaying()) {
	// 正在播放中
} else {
	// 当前是暂停状态
}
```

<br>

#### 3）开始播放

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| play()  | - | 开始播放 |

* 示例

```javascript
player.play();
```

<br>

#### 4）暂停播放

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| pause()  | - | 暂停播放 |

* 示例

```javascript
player.pause();
```

<br>

#### 5）开启/关闭渲染过程中 回调YUV帧数据

> 开启之后，`onRender`事件才可以收到数据

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| setRenderScreen(`{param1}`)  | - | 开启/关闭渲染过程中 回调YUV帧数据 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| param1 | bool | false | 开启/关闭渲染过程中 回调YUV帧数据 |

* 示例

```javascript
// 开启
player.setRenderScreen(true);
// 关闭
player.setRenderScreen(false);
```

<br>

#### 6）Seek: 跳转到某个时刻

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| seek(`{pts}`)  | - | Seek到某一个时刻 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| pts | float64 | - | Seek到某一个时刻的时间点 |

* 示例

```javascript
// Seek到10.01秒
player.seek(10.01);
```

<br>

#### 7）调整音量

> 调整视频的播放音量

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| setVoice(`{volume}`)  | - | 调整音量 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| volume | float64 | - | 范围区间是`[0, 1.0]`, 0为mute，1.0为全开音量 |

* 示例

```javascript
// 音量开启一半
player.setVoice(0.5);
```

<br>

#### 8）获取媒资数据

> 获取当前播放的视频文件的信息数据

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| mediaInfo()  | Object | 媒资详情 |

* 返回值示例

```json
meta:
	audioNone: false // 是否不包含音频轨
	durationMs: 600000 // 时长 毫秒级
	fps: 25 // 帧率
	sampleRate: 44100 // 音频采样率
	size: // 视频分辨率
		height: 720
		width: 1280
	videoCodec: 0
videoType: "vod" // 点播vod 直播live
```

* 示例

```javascript
let mediaInfo = player.mediaInfo();
```

<br>

## 3、其它帮助 ##

### FFmpeg转码265编码的视频 ###

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

* hls/m3u8 录屏

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









