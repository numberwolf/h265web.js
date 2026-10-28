# h265web.js - 浏览器 HEVC/H.265 播放 SDK

<p align="center">
  <a href="README_CN.MD">中文</a> · <a href="README.MD">English</a>
</p>

<p align="center">
  <img src="./resource/logo@300x300.png" width="180" alt="h265web.js logo" />
  &nbsp;&nbsp;&nbsp;
  <img src="./resource/demo.png" width="300" alt="h265web.js demo preview" />
</p>

<p align="center">
  <a href="https://h265web.com/"><img alt="官网" src="https://img.shields.io/badge/%E5%AE%98%E7%BD%91-h265web.com-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://h265web.com/player.php"><img alt="官网演示" src="https://img.shields.io/badge/Demo-player.php-a53c34?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://github.com/numberwolf/h265web.js"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-numberwolf%2Fh265web.js-111827?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://h265web.com/markdown-docs/zh/get-started.php"><img alt="文档" src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3-Get%20Started-1f2937?style=for-the-badge&logo=readthedocs&logoColor=white"></a>
  <a href="./DOCS/README-HowToUse-CN.MD"><img alt="本地文档" src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E6%9C%AC%E5%9C%B0%20How%20to%20use-374151?style=for-the-badge&logo=gitbook&logoColor=white"></a>
</p>

> **自 2017 年持续打磨至今，h265web.js PRO 已沉淀出成熟稳定的浏览器播放能力，兼具丰富特性与强劲性能表现。**
>
> 覆盖 HEVC/H.265、AVC/H.264、AV1、WebRTC，以及直播、点播、WebCodec、WASM、MediaInfo、截图、全屏、Seek、多实例等核心能力。
>
> **推荐流媒体服务：** [ZLMediaKit](https://github.com/ZLMediaKit/ZLMediaKit)，适合和 h265web.js 搭配做直播与点播分发。

一个支持 HEVC/H.265、AVC/H.264、AV1、多协议直播点播、WebCodec / WASM / 多线程等能力的浏览器播放器 SDK。  
适合做网页播放器、视频监控、直播观看、点播播放、协议兼容验证和播放器二次封装。 

## 新增能力：画质、音量与 AI 接入

| 新增能力 | 你可以做什么 | 从哪里开始 |
| --- | --- | --- |
| **音量均衡 / 稳定音量** | 平衡过轻和过响的片段；播放中开关，保留用户音量与静音。默认关闭，实际处理状态可查询 | [打开播放器](https://h265web.com/player-cn.php) · [增强指南](https://h265web.com/markdown-docs/zh/playback-enhancements.php) |
| **实验性 SDR 超分** | 在满足片源、显示尺寸和 GPU 条件时增强画面；Demo 首次开启默认升一档，可选自动，显示实际输出和旁路原因。默认关闭 | [试用超分](https://h265web.com/player-cn.php) · [模型与许可](./static/models/sr/README.md) |
| **AI 接入与排障 Skills** | 用自然语言生成或接入播放器，覆盖原生 JS、React、Vue、Svelte、Angular、Next、Nuxt，并处理生命周期、音频、超分与播放问题 | [安装与使用 skill](./skills/README_CN.md) |

### 新手：直接用 skill 开始

1. 打开 [skill 安装与使用指南](./skills/README_CN.md)，将两套完整 skill 目录安装到你的 AI 编程工具；Codex 也可用指南中的 `$skill-installer` 安装提示。
2. 新建或接入播放器选 **h265web-bootstrap**；已有播放器报错、黑屏、无声或超分未生效选 **h265web-troubleshoot**。
3. 在 AI 对话中发送下面的需求，补充你的框架、媒体地址和 SDK 所在位置：

```text
使用 $h265web-bootstrap，给我的 React 项目接入 h265web.js。
需要播放/暂停、音量均衡和实验性 SDR 超分开关，超分首次开启默认升一档。
请处理组件卸载与重建，并验证实际播放。媒体地址和 SDK 位置请先读取项目配置。
```

[查看完整 Features](#能力展示) · [查看本次更新日志](#更新日志)

## 快速入口

- GitHub: https://github.com/numberwolf/h265web.js
- 文档（官网 How to use）: https://h265web.com/markdown-docs/zh/get-started.php
- 文档（本地 How to use）: [README-HowToUse-CN.MD](./DOCS/README-HowToUse-CN.MD)
- QA WIKI（常见问题）: [中文](https://h265web.com/markdown-docs/zh/qa-wiki.php) · [English](https://h265web.com/markdown-docs/qa-wiki.php)
- 官网: https://h265web.com/
- 官网 Demo: https://h265web.com/player.php

## 联系方式

- GitHub: https://github.com/numberwolf/h265web.js
- Email: porschegt23@foxmail.com
- QQ 群: 925466059（推荐）
- QQ: 531365872
- Discord: numberwolf#8694
- Wechat: numberwolf11

## 演示入口

- 官网 Demo: https://h265web.com/player.php
- WebRTC WHIP 推流演示: [webrtc-publish.html](./webrtc-publish.html)
- WebRTC WHEP 拉流演示: [webrtc-play.html](./webrtc-play.html)
- 文档（官网 How to use）: https://h265web.com/markdown-docs/zh/get-started.php
- 文档（本地 How to use）: [README-HowToUse-CN.MD](./DOCS/README-HowToUse-CN.MD)

加载 `static/h265web.js` 时会通过 `console.info` 打印 `[h265web.js] SDK script loaded: https://github.com/numberwolf/h265web.js`。这条信息不依赖 WASM；WASM 启动输出只在播放实际初始化 WASM 时出现。


### 适合什么场景

- 浏览器播放 HEVC / H.265、AVC / H.264、AV1
- 点播与直播统一接入
- MP4 / MOV / MKV / FLV / MPEG-TS / M3U8 / HLS / HTTP-FLV / WS-FLV / HTTP-TS / WS-TS / WebRTC / HEVC ES 等协议验证
- 需要截图、MediaInfo、倍速、Seek、全屏、多实例、多线程等能力的网页播放器项目

### 接入案例（部分）

<font color="blue">
<strong>

| <img width="100" alt="拼多多" src="https://user-images.githubusercontent.com/101395606/175973989-83175780-8b8f-43e3-bef9-6898a16a36fb.png"> | <img width="100" alt="快手" src="https://user-images.githubusercontent.com/101395606/175974004-3313eaea-cdb2-45eb-a9af-625028196892.png"> | <img width="100" alt="爱奇艺" src="https://user-images.githubusercontent.com/101395606/175973913-e1bce7a4-4348-409f-aa7a-51987d91e7cb.png"> | <img width="100" alt="百度" src="https://user-images.githubusercontent.com/101395606/175973953-de4a6e9f-6bb1-4fec-8140-dfd088d6ba45.png"> | <img width="100" alt="百度智能云" src="https://user-images.githubusercontent.com/101395606/175973965-70aa3f6b-8557-4300-a591-1e4d69c1231c.png"> | <img width="100" alt="北京数通魔方钙瓷" src="https://user-images.githubusercontent.com/101395606/175974028-9ca49903-7bec-4ee8-9de8-2c2b56bf35c6.png"> | <img width="100" alt="杭州诚智天扬科技" src="https://user-images.githubusercontent.com/101395606/175974037-65fd1b54-22e0-4bc3-a971-50b7d425dc8d.png"> | <img width="100" alt="南京一乙" src="https://user-images.githubusercontent.com/101395606/175974049-a9df9ef9-6bb0-44bb-a900-a08cdae91116.png"> |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 拼多多 | 快手 | 爱奇艺 | 百度集团 | 百度智能云 | 北京数通魔方 | 杭州诚智天扬 | 南京一乙 |
| <br> | <br> | <br> | <br> | <br> | <br> | <br> | <br> |
| <img width="100" alt="山东呢沃尔德workd-group cn" src="https://user-images.githubusercontent.com/101395606/175974059-c9a7cff5-ca8a-4540-8b3f-f559e5b867fb.png"> | <img width="100" alt="上海联通" src="https://user-images.githubusercontent.com/101395606/175974083-cdb98f54-d2a6-42e1-9129-d2934608f887.png"> | <img width="100" alt="西安思华www sihua tech" src="https://user-images.githubusercontent.com/101395606/175974092-90bc48c4-2874-417e-a7b5-2ded8e06c29c.png"> | <br> | <br> | <br> | <br> | <br> |
| 山东呢尔德 | 上海联通 | 西安思华 | <br> | <br> | <br> | <br> | <br> |

</strong>
</font>

<h3>能力矩阵</h3>

<strong>
<font color="black">

### 能力展示

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
| <img src="resource/icon-thread.png" width="100"> | <img src="resource/icon-single-thread.png" width="100"> | <img src="resource/icon-pcm.png" width="100"> | <img src="resource/icon-pcm.png" width="100"> |
| Multi-Thread<br><font color="red">(only:<br>https+nginx conf)</font> | Single-Thread | G711A(HTTP-FLV) | G711U(HTTP-FLV) |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-mediainfo.png" width="100"> | <img src="resource/icon-hevc-s.png" width="100"> | <img src="resource/icon-avc-s.png" width="100"> | <img src="resource/icon-hdecode.png" width="100"> |
| MediaInfo | HEVC/H.265 | AVC/H.264 | Hardware decoder<br>硬解码<br>(FLV/HTTP-FLV/MP4) |
| <br> | <br> | <br> | <br> |
| <img src="resource/webrtc.png" width="100"> | <img src="resource/icon-vr360.svg" width="100" alt="VR360 video playback"> | <img src="resource/icon-stable-volume.svg" width="100" alt="Stable volume"> | <img src="resource/icon-super-resolution.svg" width="100" alt="SDR super resolution"> |
| WebRTC(LIVE) | VR360(VOD/LIVE) | 音量均衡 / 稳定音量<br>播放中开关 · 默认关闭 | 实验性 SDR 超分<br>默认升一档 · 条件支持 |
| <br> | <br> | <br> | <br> |
| <img src="resource/icon-player-skills.svg" width="100" alt="Player integration skill"> | <img src="resource/icon-player-skills.svg" width="100" alt="Playback troubleshooting skill"> | <br> | <br> |
| [AI 播放器接入 Skill](./skills/README_CN.md)<br>七种前端模板 | [AI 播放排障 Skill](./skills/README_CN.md)<br>媒体 / 网络 / 音视频 / 超分 | <br> | <br> |

</font>
</strong>

<hr>

#### 能力支持 ####

* 协议

| 协议  | 模式 | 是否支持 | 说明 |
| ---- | ---- |  ----  | ---- |
| mp4 | 点播 |  是  | ---- |
| mov | 点播 |  是  | HEVC/H.265 |
| mkv | 点播 |  是  | HEVC/H.265 |
| av1 | 点播 |  是  | Chrome |
| mpeg-ts | 点播 |  是  | ---- |
| mpeg-ps | 点播 |  是  | ---- |
| m3u8 | 点播 |  是  | ---- |
| hls | 直播 |  是  | ---- |
| flv | 点播 |  是  | --- |
| http-flv | 直播 |  是  | CodecID=12 |
| http-ts | 直播 |  是  | ---- |
| http-hevc | 直播 |  是  | ---- |
| http-hevc | 点播 |  是  | ---- |
| websocket-hevc | 直播 |  是  | ---- |
| websocket-flv | 直播 |  是  | ---- |
| websocket-ts | 直播 |  是  | ---- |
| WebRTC / WHEP | 直播 | 是 | 标准 HTTP 信令入口，推荐用于拉流播放 |
| webrtc:// | 直播 | 是 | SDK 兼容地址，内部转换为 WHEP 信令 |
| ZLM WebRTC API | 直播 | 是 | ZLMediaKit 私有信令接口 |
| HEVC/H.265 | 点播 |  是  | ---- |
| HEVC/H.265 | 直播 |  是  | ---- |
| AVC/H.264 | 点播 |  是  | ---- |
| AVC/H.264 | 直播 |  是  | ---- |

* 编码

| 编码 | 是否支持 | 说明 |
| ---- |  ----  | ---- |
| AVC/H.264 |  是  | ---- |
| HEVC/H.265 |  是  | ---- |
| AAC |  是  | ---- |
| G711A |  是  | HTTP-FLV |
| G711U |  是  | HTTP-FLV |
| AV1 |  是  | Chrome |

* 能力

| 能力 | 是否支持 | 其他 |
| ---- | ---- |  ----  |
| 硬解码 | 是 |  适配Chrome/Safari等 |
| WebCodec | 是 | 浏览器硬解码优先路径 |
| SIMD | 是 | WASM + SIMD 加速路径 |
| MSE | 是 | 浏览器 MSE 播放路径 |
| 原生 WebRTC | 是 | 支持 WHEP、`webrtc://` 兼容地址和 ZLM 私有信令 |
| WebRTC 自动选链 | 是 | SDK 内识别 URL，也可通过 `core: 'webrtc'` 强制选择 |
| WebRTC 单轨播放 | 是 | 支持音视频、仅视频和仅音频协商结果 |
| VR360 视频播放（ERP 片源） | 是 | 拖动观看 360° 点播和直播；使用包含 VR API 的 SDK 构建 |
| AI 接入与排障 Skills | 是 | [安装与使用](./skills/README_CN.md)；七框架模板、资源与生命周期接入、按证据诊断 |
| 音量均衡（稳定音量） | 可选 | 播放中开关；默认关闭，保留用户音量/静音，显示实际处理状态 |
| 实验性 SDR 超分 | 可选 | 播放中请求开关；Demo 首次开启高一档，可切自动；显示实际尺寸与适用条件 |
| 直播 | 是 |  ----  |
| 点播 | 是 |  ----  |
| Seek跳转 | 是 | ---- |
| 精准Seek | 是 |  ----  |
| 封面图 | 是 |  ----  |
| 边下边播 | 是 |  ----  |
| 音量调节 | 是 |  ----  |
| 播放 | 是 |  ----  |
| 暂停 | 是 |  ----  |
| 重新播放 | 是 |  ----  |
| 暂停截图 | 是 |  ----  |
| 1080p播放 | 是 |  ----  |
| 720p播放 | 是 |  ----  |
| 多路播放 | 是 |  ----  |
| 去音频播放 | 是 |  ----  |
| 缓冲进度 | 是 |  ----  |
| 开启全屏播放 | 是 |  ----  |
| 退出全屏播放 | 是 |  ----  |
| 逐帧播放 | 是 |  ----  |
| 截图 | 是 | ----  |
| 自动播放 | 是 | HTTP-FLV 265+264<br>HTTP-TS 265+264<br>HLS 264  |
| 设置缓存长度 | 是 | MP4 265 |
| 多线程解码 | 是 | (需要HTTPS+配置NGINX支持) |
| 单线程解码 | 是 | 兼容性强 |
| 获取 MediaInfo | 是 | ---- |
| 获取 Codec编码 | 是 | 视频&音频 |
| 获取 Media Duration 时长 | 是 | 视频&音频|
| 获取 视频尺寸 | 是 | ---- |
| 获取 视频帧率 | 是 | ---- |
| 获取 音频采样率 | 是 | ---- |
| 追帧策略算法 | 是 |  HTTP-FLV(no audio) |
| 倍速调整 | 是 |  H.264/H.265/AV1 |
| Resize缩放 | 是 | ---- |
| 获取SEI | 是 | ---- |

<br>

## WebRTC 推流与拉流

WHIP 是标准 WebRTC HTTP 推流协议，WHEP 是标准 WebRTC HTTP 拉流协议。h265web.js 是播放器，因此推荐使用 WHEP 播放地址。HTTP(S) 地址负责 SDP 信令，协商后的媒体仍通过 WebRTC ICE/DTLS/SRTP 传输。

- 浏览器 WHIP 推流演示：[webrtc-publish.html](./webrtc-publish.html)
- h265web.js WHEP 拉流演示：[webrtc-play.html](./webrtc-play.html)

ZLMediaKit 将 RTMP 转为 WebRTC 前，需要设置：

```ini
[protocol]
modify_stamp=1
paced_sender_ms=0
```

`modify_stamp=1` 使用 ZLMediaKit 接收数据时的系统时钟并做平滑处理。部分 H.264 + AAC RTMP 输入在 `modify_stamp=2` 下虽然仍以正常帧率解码，但 Chrome 原生 WebRTC 播放阶段会把时间轴异常的帧判定为过期帧并丢弃。

下面是已经真实验证的 H.264 + AAC 推流命令。FFmpeg 将流推给 ZLMediaKit，再由 ZLMediaKit 提供 WHEP 拉流：

```bash
ffmpeg -hide_banner -stream_loop -1 -re \
  -i /path/to/input.flv \
  -vf scale=640:360,format=yuv420p \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -profile:v baseline -level 3.1 -bf 0 \
  -g 25 -keyint_min 25 -sc_threshold 0 \
  -c:a aac -profile:a aac_low -ar 44100 -ac 2 -b:a 128k \
  -f flv rtmp://127.0.0.1/live/test
```

播放器支持以下三种输入地址：

```text
http://127.0.0.1/index/api/whep?app=live&stream=test
webrtc://127.0.0.1/live/test
http://127.0.0.1/index/api/webrtc?app=live&stream=test&type=play
```

第一种是标准 WHEP 地址，推荐使用。`webrtc://` 是 SDK 兼容地址，内部转换为 WHEP。第三种是 ZLMediaKit 私有信令接口。

```js
const player = H265webjsPlayer();

player.on_ready_show_done_callback = function () {
  console.log('WebRTC 首帧就绪');
};

player.on_play_time = function (seconds) {
  console.log('WebRTC 播放时间', seconds);
};

player.on_error_callback = function (error) {
  console.error('WebRTC 播放错误', error);
};

player.build({
  player_id: 'canvas111',
  base_url: './static/',
  wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm',
  width: 640,
  height: 360,
  auto_play: false,
  ignore_audio: false,
  core: 'webrtc'
});

player.load_media('http://127.0.0.1/index/api/whep?app=live&stream=test');
```

不设置 `core` 时，SDK 会自动识别三种 WebRTC 地址。WebRTC 继续使用播放器原有生命周期和 callback 名称，不需要第二套公开 API。原生 WebRTC 直播固定 1x，不支持 Seek。标准 WebRTC 只能接收浏览器成功协商的编码；未协商编码的 WebCodecs/WASM 降级需要服务器实现可选的 `h265web-rtc-encoded/v1` 编码媒体传输协议。

## ZLMediaKit / PyMKUI 播放接入

[PyMKUI 接入分支](https://github.com/numberwolf/pymkui/tree/dev-cyl/h265web.js-pro)将 RTMP、TS 流行原 Jessibuca 播放路径替换为 h265web.js。浏览器不能直接播放 `rtmp://`：PyMKUI 将 RTMP 行映射到 ZLMediaKit HTTP-FLV（`/{app}/{stream}.live.flv`），TS 行映射到 HTTP-TS（`/{app}/{stream}.live.ts`）。每次播放按当前流获取 `on_play` URL 参数，重试时重新获取；一次性授权 token 不得复用。播放器用 `set_voice(0)` 默认静音，但保留音频链路。

PyMKUI 默认以平面方式播放。确认直播源是真实 ERP 全景后，点击「360°模式」调用 SDK 的 `set_projection('erp360')` 并开启鼠标/触摸视角控制；「重置视角」调用 `reset_vr_view()`。这只是显示方式选择，不会自动识别 ERP，也不增加编解码能力。录像管理的单文件 MP4/WebM 播放也已接入 SDK，支持手动切换 ERP 视角、暂停、seek、倍速、截图和全屏。WebM 使用浏览器原生解码，不回退到 VP8/VP9 软件解码。

H.265 MPEG-TS HLS 行使用 SDK。H.264 HLS 在原生播放正常时保留原路径；原生解码或资源错误（3/4）发生后，重新获取授权并尝试一次 SDK MSE 播放。H.265 HLS-fMP4 仍不支持。HTTP-fMP4 和 WHEP 保留原生路径。

只有视频的 FLV 按文件头判断音轨，不再等待不存在的音频元数据。HTTP-FLV/WebCodec 搭配 AAC 时，起播等待实际视频首帧和可运行的 AudioContext，再对齐音频队列；不改变 WS-FLV、TS/HLS、点播或 WASM 的起播方式。

普通 HTTP 媒体经解封装 Worker 请求时，`on_error_callback` 现在能收到 `http-transport` 错误及可见响应的数字 `status`。HTTP 401/403/404 直接上报，暂时性失败有限次重试；浏览器 CORS 错误可能只能给出 `status: 0`。关闭或替换播放器会取消旧 HTTP 请求，迟到的响应不能复活旧会话。参见[中文 API 合同](https://h265web.com/markdown-docs/zh/api-docs.php)和[英文 API 合同](https://h265web.com/markdown-docs/api-docs.php)。

## 稳定音量、实验性超分与 AI 集成 skills

SDK 提供音量均衡、实验性 SDR 超分及两套集成/排障 skills。两项播放增强默认关闭；可在播放中通过独立开关操作，面板显示实际效果和下一步操作。集成旧版 SDK 时先检测 API。

Demo 的音量均衡开关只改变均衡请求，不调用播放或用户手势通知。音频仍因激活条件处于 pending 时，**播放并激活音频**是独立的明确操作：通过该入口的播放处理函数开始或恢复播放，保留用户音量/静音并同步播放按钮状态。

| 能力 | 接入与范围 |
| --- | --- |
| 稳定音量 | `audio_leveling: 'None' / 'StableVolume'`；运行中 `set_audio_leveling()`；`get_audio_leveling_state()` 区分请求和实际处理 |
| 实验性 SDR 超分 | 固定 AN 微型 CNN、WebGL2 同上下文；`super_resolution`、`set_super_resolution()`、`get_super_resolution_state()`；需要配套 `static/models/sr/` 全目录及许可 |
| 集成 skill | [h265web-bootstrap](./skills/h265web-bootstrap/SKILL.md)：原生 JS、React、Vue、Svelte、Angular、Next、Nuxt 模板与生命周期处理 |
| 排障 skill | [h265web-troubleshoot](./skills/h265web-troubleshoot/SKILL.md)：媒体/HTTP/浏览器证据、实际选核、特性旁路及脱敏报告 |

| 设置 | 运行时支持 | 何时实际生效 |
| --- | --- | --- |
| `set_audio_leveling('StableVolume' / 'None')` | 支持，无需等待视频 ready 或重载 | 可用音轨与音频图开始工作后，读取 `status`/`active` |
| `set_super_resolution({enabled, level, targetKey})` | 支持请求开关/档位 | 可用帧、SDR、显示需求与 GPU 条件满足后；已有 C++ 渲染器可能提示重建 |
| `super_resolution.input_color` | build 参数 | 修改后通过显式重建应用 |

Demo 首次开启用 `{enabled:true, level:'light', targetKey:null}` 选择当前最小可用增强档；用户选择“自动”时用 `{enabled:true, level:'standard', targetKey:null}`。SDK 本身的缺省 `level` 仍为 `standard`。

稳定音量在用户 `set_voice(0～1)` 之前测量和处理，开关不改变滑块，静音仍有效。原生来源安全、AudioWorklet、用户激活和音轨可用性决定是否生效；不支持时保留播放并返回原因。

超分默认 `input_color: 'unknown'`，仅确认兼容 SDR 后声明 `sdr`。至多两档保比例 1.25/1.5/2 倍候选；输入短边≤720，输出长边≤1920、短边≤1080、总像素≤2073600，并受实际显示和 GPU 预算限制。720p 可出现 900p/1080p 实验候选，提高码率也不会解锁 1440p/4K 超分档位。原画高分辨率播放不受增强范围限制。HDR/广色域、ERP、旧 WASM 无可信帧描述或设备不满足时旁路；已有 C++ renderer 运行中开启返回 `renderer-recreate-required`，由用户明确重建，不自动重载。当前工程模型不等于生产画质、移动端或长时功耗已验收；SDK 不包含实验用 ORT/WebGPU 超分后端。

页面先提供 `<div id="player"></div>`；加载后在用户点击事件中调用 `notify_user_gesture()` 和 `play()`。

```js
const player = H265webjsPlayer();
// Bind business callbacks before build; keep both features opt-in.
const config = { player_id: 'player', width: 960, height: 540,
  base_url: './static/', wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm', ignore_audio: false, auto_play: false };
if (typeof player.set_audio_leveling === 'function' &&
    typeof player.get_audio_leveling_state === 'function') config.audio_leveling = 'None';
if (typeof player.set_super_resolution === 'function' &&
    typeof player.get_super_resolution_state === 'function')
  config.super_resolution = { enabled: false, input_color: 'unknown' };
if (!player.build(config)) throw new Error('build failed');
player.set_voice(0);
player.load_media('./hevc_test_moov_set_head_16s_hvc1.mp4');
```

`true` 只表示请求接受；均衡检查 `status/reason`，超分检查 `status/reason/output/options`，不能把“开启”当作“实际生效”。只复制同次构建的 JS/WASM 三件资源；超分额外复制完整模型目录。详见[播放增强与 Skills 指南](https://h265web.com/markdown-docs/zh/playback-enhancements.php)和[API 文档](https://h265web.com/markdown-docs/zh/api-docs.php)。组件卸载须等待 `release(callback)` 完成，禁止迟到任务复活旧实例。

## 播放环境与托管

官网首页和播放器默认从本站同源地址加载当前 SDK 与 WASM。`?sdk=cdn` 仅用于固定 CDN 发布版的诊断；移除该参数即回到本站构建。首页使用同源 SDR 样片并启用隔离页面，两项效果仍默认关闭。

完整播放器和 SDK 演示接受任意 URL，默认处于**兼容模式**。播放路径需要 WASM/共享内存时，点击**启用软件解码**，页面会带 `?isolation=1` 重新加载；**切回兼容模式**会移除该参数。本标签页恢复媒体地址、内核、音量/静音、增强开关与请求的超分档位。临时记录只存于 `sessionStorage`，10 分钟过期，尝试恢复后清除。播放会重新建立，不保留正在运行的解码器或点播进度。

`?isolation=1` 是 demo 的托管约定，不是 SDK API，也不会凭空生成响应头。隔离文档需处于安全上下文，由服务器返回 `Cross-Origin-Opener-Policy: same-origin` 与 `Cross-Origin-Embedder-Policy: require-corp`；直接创建的 pthread Worker 脚本还需 COEP。面板读取真实浏览器环境，条件不足时明确提示，不会循环重载。同次构建的 SDK/glue/WASM 要配套，WASM 使用 `application/wasm`，跨域资源按实际请求方式满足 CORS/CORP。隔离模式的跨域 no-CORS 原生视频需要 CORP，仅有 `Access-Control-Allow-Origin` 不会改变其请求方式；兼容模式保留原生播放原有的请求行为。

**兼容原生视频的超分不要求先开启软件解码。** 它仍需满足帧读取、SDR 声明、模型、输出尺寸和 GPU 条件。这些页面控件不改变 SDK 的选核或增强算法。详见[播放与托管指南](https://h265web.com/markdown-docs/zh/playback-enhancements.php)。

## VR360 视频播放

使用真正的单目 360° 视频（通常是 2:1 的等距柱状/ERP 片源）；打开 VR 开关不会把普通视频变成全景。设置 `projection: 'erp360'` 可观看 VR360，`flat` 则是普通平面播放。VR360 不改原有解码和时钟；视角控制 API 包括 `set_projection()`、`set_vr_view()`、`rotate_vr_view()`、`reset_vr_view()` 和 `set_vr_controls()`。当前公开 SDK 已包含这些 API；使用旧缓存文件时请先确认其存在。片源、CORS 和首帧排查见 [API 文档](https://h265web.com/markdown-docs/zh/api-docs.php)与 [QA WIKI（常见问题）](https://h265web.com/markdown-docs/zh/qa-wiki.php)。

本地[中文演示页](./index-cn.html)和[英文演示页](./index.html)的“媒体地址”可以手动输入，也可以点输入框右侧箭头，查看本地 MP4 素材。列表包含 H.264、HEVC 的 VR360 素材；选中后会自动切到 VR360 观看方式。播放中也可用“观看方式”在普通平面和 VR360 之间切换，不用更换视频。


# 文档入口

- 中文 Docs 首页: https://h265web.com/markdown-docs/zh/get-started.php
- 入门指南: https://h265web.com/markdown-docs/zh/get-started.php
- 简单演示: https://h265web.com/markdown-docs/zh/simple-demo.php
- API 文档: https://h265web.com/markdown-docs/zh/api-docs.php
- QA WIKI（常见问题）: https://h265web.com/markdown-docs/zh/qa-wiki.php
- Donate: https://h265web.com/markdown-docs/zh/donate.php

### 合作项目

* [好用的流媒体服务 ZLMediaKit](https://github.com/ZLMediaKit/ZLMediaKit)

* [FFmpeg支持265的HTTP-FLV直播](https://github.com/numberwolf/FFmpeg-QuQi-H265-FLV-RTMP)

* [Web端265解码器](https://github.com/numberwolf/h265web.js-wasm-decoder)

* [YuvEye 国内第一款图像质量、YUV分析工具](https://www.zzsin.com/YUVEye.html)

### 关于

* [【技术社区】提问 交流 — 联系我 技术支持群](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E6%8A%80%E6%9C%AF%E7%A4%BE%E5%8C%BA%E3%80%91%E6%8F%90%E9%97%AE-%E4%BA%A4%E6%B5%81-%E2%80%94-%E8%81%94%E7%B3%BB%E6%88%91-%E6%8A%80%E6%9C%AF%E6%94%AF%E6%8C%81%E7%BE%A4)

* [【日志】播放器更新记录](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E6%97%A5%E5%BF%97%E3%80%91%E6%92%AD%E6%94%BE%E5%99%A8%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95)

* [【作者说】为什么不建议私聊](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E4%BD%9C%E8%80%85%E8%AF%B4%E3%80%91%E4%B8%BA%E4%BB%80%E4%B9%88%E4%B8%8D%E5%BB%BA%E8%AE%AE%E7%A7%81%E8%81%8A)

* [【作者说】关于创始人](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E4%BD%9C%E8%80%85%E8%AF%B4%E3%80%91%E5%85%B3%E4%BA%8E%E5%88%9B%E5%A7%8B%E4%BA%BA)

<hr>

### 捐赠 ###

|  微信 | 支付宝 | PayPal |
|  ---- | ----  | ---- |
| <img src="resource/donate/wechat.JPG" height="500"> | <img src="resource/donate/alipay.JPG" height="500"> | - |

<br>

# 更新日志 #

| 更新 | 内容 |
| ---- | ---- |
| 时间 | **2026/10/28** |
| - | **新增音量均衡（StableVolume）**：运行时开关与状态查询，保留用户音量、静音及暂停状态 |
| - | **新增实验性 SDR 超分**：配套模型与许可，Demo 开启默认升一档，可切自动；显示实际输出尺寸及旁路原因，需重建时提供显式操作 |
| - | **新增两套 AI Skills**：播放器接入与播放排障；七框架模板、完整安装步骤及可直接使用的提问示例 |
| - | **统一 Demo 交互**：中英文单/多实例、WHEP、官网首页及播放器使用一致的增强开关与状态提示 |
| - | **完善 PyMKUI 集成**：直播与录像增强控件、授权重试及生命周期处理，详见 [PR #25](https://github.com/ZLMediaKit/pymkui/pull/25) |
| - | **同步交付说明**：README Features 图表、功能列表、双语指南与官网 skill 快速入口；Next 模板固定为 16.4.1 |
| 时间 | 2026/10/14 |
| - | 移除 legacy HLS 路由及扩展运行文件；初始化只需主线 JS/WASM 资源 |
| 时间 | 2026/10/13 |
| - | 0.修复 MSE FLV 无音轨直播起播，并按实际首帧和运行中的音频时钟对齐 HTTP-FLV/WebCodec AAC 起播 |
| - | 1.增加 WebM 原生点播路由与明确的能力错误，不为 WebM 启用软件回退 |
| - | 2.PyMKUI 录像播放加入 ERP 360°控件；H.264 原生 HLS 终止错误后有限回退并重新获取授权 |
| 时间 | 2026/10/11 |
| - | 0.修复 HTTP 解封装 Worker 的请求取消，并通过原播放器错误回调上报可见的 HTTP 状态；暂时性错误仍有限次重试 |
| - | 1.PyMKUI 的 ZLMediaKit RTMP/TS 流行接入 HTTP-FLV/HTTP-TS、每次新取 `on_play` 授权、默认静音及手动 ERP 360°视角控件 |
| 时间 | 2026/08/25 |
| - | 0.新增原生 WebRTC 直播播放，支持标准 WHEP 信令、`webrtc://` 兼容地址和 ZLMediaKit 私有 WebRTC 接口 |
| - | 1.新增 WebRTC URL 自动选链和显式 `core: 'webrtc'`，保持原有 `build()`、`load_media()` 调用方式不变 |
| - | 2.支持音视频、仅视频和仅音频协商结果，并复用已有生命周期、错误 callback、Release/Rebuild 和多实例隔离 |
| - | 3.新增 WHIP 推流与 WHEP 拉流演示，并完成 WHEP、MP4、HTTP-FLV、HTTP-TS 的真实 Chrome 回归 |
| - | 4.补充 ZLMediaKit `modify_stamp=1` 前置要求，避免 RTMP 转 WebRTC 时音视频时间轴导致浏览器呈现丢帧 |
| 时间 | 2026/08/10 |
| - | 0.新增回调感知的 HLS 主线路由，覆盖 Native HLS、MSE、WebCodec 和 WASM；`auto`/`mainline` 不会进入 `past-core/ext*`，只有显式设置 `legacy` 才使用历史内核 |
| - | 1.对齐 HLS、MP4、FLV、MPEG-TS 的回调契约，覆盖 SEI、NAL/帧/渲染、缓存、Seek、生命周期、GPU 和 A/V 同步回调 |
| - | 2.完善 HLS 主/媒体播放列表、重定向、直播滑动窗口、Discontinuity、编码探测、HEVC Sample、关键帧和时间戳处理 |
| - | 3.增强 Seek 完成语义、Release/Rebuild、Worker 清理、有界释放超时和多实例隔离 |
| - | 4.明确音频控制语义：`ignore_audio` 表示跳过音频链路而不是静音；`set_voice(0)` 后可通过设置正音量恢复声音 |
| - | 5.更新中英文接入文档，并扩充自动化测试与浏览器回归覆盖 |
| 时间 | 2026/08/03 |
| - | 0.优化 Auto 选核顺序：原生/MSE > WebCodec > WASM/SIMD，并提供受控回退 |
| - | 1.完善 H.264/H.265 搭配 AAC、PCM、G.711A、G.711U 的播放兼容；音频不支持时不再降低可播放的视频核心 |
| - | 2.修复 HEVC B 帧 HTTP-TS、WebSocket-TS 直播反复小范围回退和跳帧：只对检测到异常 DTS 节奏的直播 TS 重建 DTS，并保留 CTS 重排信息 |
| - | 3.改进播放器生命周期清理、错误回退和多实例稳定性 |
| 时间 | 2026/03/28 |
| - | 0.更新更强大的版本 |
| 时间 | 2022/11/06 |
| - | 0.更新 |
| 时间 | 2022/11/02 |
| - | 0.更新 WASM |
| 时间 | 2022/10/22 |
| - | 0.支持 FLV/HTTP-FLV/MP4 硬解码 |
| - | 1.支持 MPEG-TS 中的 AVC |
| 时间 | 2022/09/13 |
| - | 0.修复 AVC 流关闭自动播放时的循环缓冲错误 |
| 时间 | 2022/09/12 |
| - | 0.修复不含 `http` 文本的 HEVC 地址无法播放 |
| 时间 | 2022/08/24 |
| - | 0.支持 Safari 原生播放器（版本 > 13） |
| 时间 | 2022/08/23 |
| - | 0.修复 AVC 缓冲进度 |
| 时间 | 2022/08/13 |
| - | 0.支持 Resize |
| 时间 | 2022/07/27 |
| - | 0.支持播放倍速调整 |
| 时间 | 2022/07/12 |
| - | 0.修复若干问题 |
| 时间 | 2022/07/06-10 |
| - | 0.支持 G.711U（HTTP-FLV） |
| - | 1.修复无音频 HTTP-FLV（AVC）播放 |
| 时间 | 2022/07/01 |
| - | 0.优化无音频 HTTP-FLV 直播性能 |
| 时间 | 2022/06/27 |
| - | 0.修复 HLS 解析问题 |
| 时间 | 2022/06/26 |
| - | 0.支持 G.711A（HTTP-FLV） |
| - | 1.修复 AVC FLV 的 MediaInfo 错误 |
| - | 2.支持多线程/单线程 |
| 时间 | 2022/05/18 |
| - | 0.支持多线程解码 |
| - | 1.支持 MP4 缓存长度配置 |
| - | 2.性能优化 |
| - | 3.该版本为 Beta 版本 |
| 时间 | 2022/05/09 |
| - | 0.支持 WebSocket 265 裸流播放 |
| 时间 | 2022/05/07 |
| - | 0.修复 MP4 点播重试错误 |
| - | 1.支持通过 URL 创建 HEVC 裸流点播 |
| - | 2.支持 MKV 格式 |
| 时间 | 2022/04/21 |
| - | 0.性能优化 |
| 时间 | 2022/04/17 |
| - | 发布新的开源免费协议 <a href="LICENSE-Free_CN.MD">CYL_Free-1.0 LICENSE-Free_CN.MD</a> |
| 时间 | 2022/04/14 |
| - | 0.支持 MOV 文件 |
| - | 1.支持 HTTP-FLV/HTTP-TS/HLS 自动播放 |
| - | 2.优化 1080P MP4 点播性能 |
| - | 3.增加 MP4 探测重试 |
| - | 4.支持 AV1 |
| - | 5.支持逐帧播放 |
| - | 6.支持视频帧截图 |
| 时间 | 2022/03/28 |
| - | 0.支持 MPEG-PS（MPEG1）流 |
| 时间 | 2022/03/02 |
| - | 0.修复 H.264 FLV 直播重试后无法获取分辨率 |
| 时间 | 2022/01/17 |
| - | 0.修复 HLS 265 OOM 问题 https://github.com/numberwolf/h265web.js/issues/108 <img src="resource/mem-hls.jpg" width="300px"> |
| - | 1.修复 HLS 分片规则问题 https://github.com/numberwolf/h265web.js/issues/105 |
| - | 2.新增演示 <a href="index-debug.html">index-debug.html</a> |
| - | 3.修复同时播放 10 路以上 H.264 时栈溢出导致播放失败 |
| 时间 | 2021/12/31 |
| - | 0.增加 H.264 HTTP-FLV 错误重试 |
| 时间 | 2021/12/24 |
| - | 0.修复部分 H.264 HTTP-FLV 回调异常情况 |
| 时间 | 2021/12/19 |
| - | 0.修复 H.264 HLS 回调问题 |
| 时间 | 2021/12/08 |
| - | 0.修复 H.264 MP4 的 onReadyShowDone 事件问题 |
| 时间 | 2021/12/04 凌晨 |
| - | 0.修复 HTTP-FLV 265 渲染崩溃 |
| - | 1.修复 HLS 全屏问题 |
| - | 2.修复若干问题 |
| 时间 | 2021/11/29 晚上 |
| - | 0.修复 HTTP-FLV 重试场景及若干问题 |
| 时间 | 2021/11/25 晚上 |
| - | 0.修复 HTTP-FLV/WS 直播 ignoreAudio 问题 |
| 时间 | 2021/11/23 晚上 |
| - | 0.修复 https://github.com/numberwolf/h265web.js/issues/90 |
| 时间 | 2021/11/21 凌晨 |
| - | 0.支持 WebSocket-FLV（HEVC/H.265） |
| - | 1.支持 WebSocket-TS（HEVC/H.265） |
| - | 2.支持 HTTP-TS（HEVC/H.265） |
| 时间 | 2021/11/16 晚上 |
| - | 0.首次请求无响应并超时后重试 5 次 |
| 时间 | 2021/11/15 晚上 |
| - | 0.HTTP-FLV 无数据包超时后自动重试（7 秒） |
| 时间 | 2021/11/14 晚上 |
| - | 0.增加可自动扩容的 265 MB WASM 文件版本 |
| - | 1.增加可自动扩容的 512 MB WASM 文件版本 |
| 时间 | 2021/11/04 晚上 |
| - | 0.修复多次 release 导致崩溃 |
| 时间 | 2021/10/26 晚上 |
| - | 0.修复若干问题 |
| 时间 | 2021/10/24 晚上 |
| - | 0.支持 AVC/H.264 的 MP4/HLS/M3U8/FLV/HTTP-FLV 播放 |
| 时间 | 2021/10/18 晚上 |
| - | 0.新增示例 |
| 时间 | 2021/10/16 晚上 |
| - | 0.修复 HTTP-FLV MediaInfo 的 codec 错误值 |
| - | 1.更新示例 |
| 时间 | 2021/10/14 晚上 |
| - | 0.修复 MediaInfo 的 codec 错误值 |
| 时间 | 2021/10/13 晚上 |
| - | 0.兼容 WebIDE 开发；拆分 WASM JS 与 h265web.js，需要单独引入 WASM JS |
| 时间 | 2021/10/12 晚上 |
| - | 0.支持无 FPS 参数的 HTTP-FLV（HEVC）直播 |
| 时间 | 2021/10/09 凌晨 |
| - | 0.支持 HTTP-FLV（HEVC）直播，CodecID=12 |
| - | 1.优化 MP4/FLV 点播跳出缓存区域时的 Seek 性能 |
| 时间 | 2021/09/27 晚上 |
| - | 0.优化 M3U8/MPEG-TS 跳出缓存区域时的 Seek 性能 |
| 时间 | 2021/09/25 凌晨 |
| - | 0.修复 HLS 直播 OOM 崩溃 |
| - | 1.修复 HLS 直播 MPEG-TS 完整路径 |
| - | 2.修复 HLS 直播短暂丢流后停止 |
| - | 3.修复 HLS 直播网络不稳定时停止 |
| 时间 | 2021/09/08 晚上 |
| - | 0.修复 M3U8 Seek 解码失败 |
| - | 1.修复部分 MP4 场景 |
| - | 2.更新配置，移除部分选项并自动设置 |
| 时间 | 2021/09/07 晚上 |
| - | 0.修复部分 M3U8 解析 MPEG-TS 文件错误 |
| 时间 | 2021/09/07 凌晨 |
| - | 0.备用播放器核心修复 MP4/FLV 点播无法 Seek 到 0，并优化播放性能 |
| 时间 | 2021/08/15 |
| - | 0.升级 H.265/HEVC 裸数据点播/直播播放器 |
| 时间 | 2021/07/18 |
| - | 0.升级播放器 UI 样式 |
| - | 1.支持进入和退出全屏 |
| - | 2.增加进入/退出全屏事件 |
| 时间 | 2021/07/11 |
| - | 0.兼容 ZLMediaKit + 华为 HoloSens 摄像机直播流 |
| 时间 | 2021/07/04 |
| - | 0.修复 <a href="https://github.com/numberwolf/h265web.js/issues/58">`ISSUE#58`</a>：默认播放器核心处于缓存帧状态时无法暂停视频 |
| 时间 | 2021/07/01 |
| - | 0.新增示例和 package.json |
| 时间 | 2021/06/27 |
| - | 0.开源 |
| - | 1.支持 FLV Seek |
| - | 2.修复备用播放器核心 Seek 问题 |
| - | 3.新增 FLV 类型，无需设置 player-core |
| 时间 | 2021/05/30 |
| - | 1.修复重要的 Seek 和播放问题 |
| - | 2.增加视频封面加载完成事件/回调 |
| 时间 | 2021/05/24 |
| - | 1.备用播放器核心支持 FLV 点播 |
| 时间 | 2021/05/21 |
| - | 1.优化无音频 HLS 直播性能 |
| 时间 | 2021/05/18 |
| - | 1.优化 HLS 直播性能并增加音频 |
| 时间 | 2021/05/16 |
| - | 1.修复 MP4 点播中 BD265 MP4 box 异常情况 |
| 时间 | 2021/05/15 |
| - | 1.修复 HLS 直播播放 |
| 时间 | 2021/04/27 |
| - | 1.修复部分视频播放时出现灰块（马赛克） |
| - | 2.修复部分视频播放首个 GOP 时出现灰块（马赛克） |
| 时间 | 2021/04/22 |
| - | 1.备用播放器核心测试模式支持 Seek |
| - | 2.备用播放器核心测试模式支持 yuvj420p |
| - | 3.其他 |
| 时间 | 2021/04/12 |
| - | 1.修复部分 HEV 编码视频播放失败 |
| - | 2.修复部分非标准 NALU 视频播放失败 |
| - | 3.修复部分视频播放出现马赛克 |
| 时间 | 2021/04/07 |
| - | 1.修复时长错误 |
| 时间 | 2021/03/28 |
| - | 1.增加缓冲进度事件 |
| - | 2.修复若干问题 |
| - | 3.移除 HLS 日志 |
| - | 4.增加无音频播放选项（新核心） |
| 时间 | 2021/03/14 |
| - | 1.修复备用播放器核心字节对齐渲染 |
| 时间 | 2021/03/12 |
| - | 1.修复 HLS 功能问题 |
| 时间 | 2021/03/06 |
| - | 1.修复备用播放器核心多流播放异常 |
| 时间 | 2021/02/28 |
| - | 1.增加输入 265 NALU 帧接口 `append265NaluFrame(nalBuf);` |
| - | 2.新增 265 裸流解析库 [raw-parser.js](./dist/raw-parser.js) |
| 时间 | 2021/02/21 |
| - | 1.新增 H.265/HEVC 解码器 SDK 项目：[h265web.js-wasm-decoder](https://github.com/numberwolf/h265web.js-wasm-decoder) |
| 时间 | 2021/02/18 |
| - | 1.备用播放器核心支持音频播放 |
| 时间 | 2021/02/08 |
| - | 1.备用播放器核心 Beta 版本：暂不支持音频和 Seek，MP4 需要将 moov box 放在 mdat 前面 |
| 时间 | 2021/01/04 |
| - | 1.播放器支持 HEVC 文件 |
| - | 2.播放器支持 HEVC 流 |
| - | 3.移除播放/暂停遮罩 |
| - | 4.新增 `onPlayFinish` 事件，在视频播放结束时触发 |

<hr>


### Demo 控件

[中文 Demo](./index-cn.html)和[English demo](./index.html)提供相同的播放增强面板。开发仓库的动态多实例 `index.html`、固定双实例 `index-multi.html`、官网首页和完整播放器采用一致的开关、档位和状态说明；每个实例独立设置。

| 控件 | 使用方式 |
| --- | --- |
| 音量均衡 | 创建前预设或播放中直接开关，无需重建。状态显示等待音频、实际处理或不可用原因；音量滑块和静音不变 |
| 超分开关 | 首次开启默认“高一档”，无需再选择一次档位；可以播放中操作，首帧/模型就绪后显示实际输出 |
| 超分档位 | “高一档”取当前最小可用增强档；“自动”使用 SDK 标准策略；也可选择当前可用尺寸 |
| SDR 确认与重新加载 | 仅确认兼容 SDR 后选择；修改声明或渲染器需要重建时，显式应用并重新加载。点播从头开始，直播重新接入 |

两项默认关闭。开关表示请求，实际输出和状态表示效果；没有可用升档时显示原因并保持原画。`input_color` 是创建参数，不能由运行时 setter 热修改。未就绪时可以请求开启；暂停状态首次加载模型可能需要恢复播放后才生效。

[官网首页](https://h265web.com/index-cn.php) · [完整播放器](https://h265web.com/player-cn.php) · [运行时说明与接入示例](https://h265web.com/markdown-docs/zh/playback-enhancements.php)
