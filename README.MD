--------------------------------------------------
# h265web.js

<img src="logo@300x300.png" width="300px" />

----------------------------------------

* 在线预览地址 http://hevc.realrace.cn/

* 示例图 
> <img src="./demo.png" width="600px" />

### 核心JS
`./src`

### 编译

##### 编译步骤

```shell
bash compile
```

##### 编译产出

`./dist`

##### 引入

```javascript
<script src="dist/missile.js"></script>
```

### 示例Demo

* ./index265.html 单独播放hevc文件

* ./index265aac.html 播放Hevc+AAC

* ./index265aacWS.html 播放hevc+AAC 直播Stream (websocket)

* ./indexMp4.html 播放hevc编码的mp4文件

### 使用说明

##### 针对 hevc aac 文件

1）新建播放器

```javascript
function callback() {
    // TODO
}

player = InitPlayerImp({
    width   : "600px",
    height  : "600px",
    fps     : 25,
    fixed   : false
});
player.initPlayer(callback);
```

2) 开始播放

```javascript
function stopPlay() {
    player.stop();
}

function continuePlay() {
    player.continueStart();
}

player.reStartPlay(play_video_url, fps);
player.reStartPlayAudio(play_audio_url);
```

##### 针对hevc aac 帧/流

1）初始化播放器

```javascript
player = Init(function() {
    player.createPlayer({
        width   : "600px",
        height  : "600px",
        fps     : 25,
        fixed   : false
    }, callback); // init player
});
````

2）通过WS或者其他协议获取到hevc或者aac流数据

```javascript
var streamBytes = formatRet["streamData"];

if (tag_type == SLICE_TAG_VIDEO) {
    player.appendHevcFrame(streamBytes); // Uint8Array
} else if (tag_type == SLICE_TAG_AUDIO) {
    player.appendAACFrame(streamBytes);
}
````

3）播放控制

```javascript
player.play(); // 播放
player.pause(); // 暂停 
player.continues(); // 继续
player.stop(); // 结束播放
```

##### 播放H.265编码的 mp4

1）初始化Mp4 解析器

```javascript
var mp4Obj = InitMp4Parser();

var streamBuf = new Uint8Array(fileReader.result).buffer; // new FileReader().result
console.log(streamBuf);

mp4Obj.demux(streamBuf);

// 属性
var durationMs  = mp4Obj.getDurationMs();
var fps         = mp4Obj.getFPS();
var sampleRate  = mp4Obj.getSampleRate();
var size        = mp4Obj.getSize();
```

2）播放器设置

```javascript

player = Init(function() {
    playerStatus = player.createPlayer({
        width           : "600px",
        height          : "600px",
        appendHevcType  : APPEND_TYPE_FRAME
    }, null);
});

// 设置播放器属性 帧率 采样率
player.settingPlayer({
    fps             : fps,
    sampleRate      : sampleRate
});
// 设置时长
player.setDurationMs(durationMs);
```

3）逐帧播放

```javascript
var popData     = mp4Obj.popBuffer(1); // 视频
var popDataAudio= mp4Obj.popBuffer(2); // 音频

if (popData != null) {
    player.appendHevcFrame(popData);
}
if (popDataAudio && popDataAudio != null) {
    player.appendAACFrame(popDataAudio);
}
```

4）播放控制

```javascript
// 暂停
player.stop();

// 播放
player.play(function() {
    /*
     * 回调函数，控制进度条
     */
    // play progress
    var tmp_video_pts_val = VIDEO_PTS_VAL < 0 ? 0 : VIDEO_PTS_VAL;
    console.log("tmp_video_pts_val: " + tmp_video_pts_val);

    document.getElementById("play_progress").value = tmp_video_pts_val;
    var pts_txt_hour = Math.floor(tmp_video_pts_val / 3600);
    var pts_txt_minu = Math.floor((tmp_video_pts_val % 3600) / 60);
    var pts_txt_seco = Math.floor((tmp_video_pts_val % 60));
    var pts_txt = pts_txt_hour + ":" + pts_txt_minu + ":" + pts_txt_seco;

    console.log("pts_txt:" + pts_txt);
    document.getElementById("pts_label").innerHTML = pts_txt + "/" + g_dur_txt;
});
```


### 目录结构

```struct
|-- dist
|-- lib
|-- src
	|-- core
|-- videosdemo
|-- demo.html
|-- compile
|-- gulpfile.js
|-- package.json
|-- package-lock.json
|-- LICENSE
|-- README.MD
```



### 有问题反馈
在使用中有任何问题，欢迎反馈给我，可以用以下联系方式跟我交流

* 邮件(porschegt23#foxmail.com, 把#换成@)
* QQ: 531365872

- 现阶段目前播放器 浏览应用接入层做开源。

----------------------------

# License
````
https://unpkg.com/tsmon@0.4.2/LICENSE
````
Anti 996 License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity obtaining a copy
of this licensed work (including the source code, documentation and/or related
items, hereinafter collectively referred to as the "licensed work"), free of
charge, to deal with the licensed work for any purpose, including without
limitation, the rights to use, reproduce, modify, prepare derivative works of,
publish, distribute and sublicense the licensed work, subject to the following
conditions:

1.  The individual or the legal entity must conspicuously display, without
    modification, this License on each redistributed or derivative copy of the
    Licensed Work.

2.  The individual or the legal entity must strictly comply with all applicable
    laws, regulations, rules and standards of the jurisdiction relating to
    labor and employment where the individual is physically located or where
    the individual was born or naturalized; or where the legal entity is
    registered or is operating (whichever is stricter). In case that the
    jurisdiction has no such laws, regulations, rules and standards or its
    laws, regulations, rules and standards are unenforceable, the individual
    or the legal entity are required to comply with Core International Labor
    Standards.

3.  The individual or the legal entity shall not induce or force its
    employee(s), whether full-time or part-time, or its independent
    contractor(s), in any methods, to agree in oral or written form,
    to directly or indirectly restrict, weaken or relinquish his or
    her rights or remedies under such laws, regulations, rules and
    standards relating to labor and employment as mentioned above,
    no matter whether such written or oral agreement are enforceable
    under the laws of the said jurisdiction, nor shall such individual
    or the legal entity limit, in any methods, the rights of its employee(s)
    or independent contractor(s) from reporting or complaining to the copyright
    holder or relevant authorities monitoring the compliance of the license
    about its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT
HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION
WITH THE LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.

