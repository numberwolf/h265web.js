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
  <a href="https://h265web.com/markdown-docs/zh/get-started.php"><img alt="文档" src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3-Get%20Started-1f2937?style=for-the-badge&logo=readthedocs&logoColor=white"></a>
  <a href="https://h265web.com/"><img alt="官网" src="https://img.shields.io/badge/%E5%AE%98%E7%BD%91-h265web.com-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://h265web.com/player.php"><img alt="官网演示" src="https://img.shields.io/badge/Demo-player.php-a53c34?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://github.com/numberwolf/h265web.js"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-numberwolf%2Fh265web.js-111827?style=for-the-badge&logo=github&logoColor=white"></a>
</p>

> **自 2017 年持续打磨至今，h265web.js PRO 已沉淀出成熟稳定的浏览器播放能力，兼具丰富特性与强劲性能表现。**
>
> 覆盖 HEVC/H.265、AVC/H.264、AV1，以及直播、点播、WebCodec、WASM、MediaInfo、截图、全屏、Seek、多实例等核心能力。
>
> **推荐流媒体服务：** [ZLMediaKit](https://github.com/ZLMediaKit/ZLMediaKit)，适合和 h265web.js 搭配做直播与点播分发。

一个支持 HEVC/H.265、AVC/H.264、AV1、多协议直播点播、WebCodec / WASM / 多线程等能力的浏览器播放器 SDK。  
适合做网页播放器、视频监控、直播观看、点播播放、协议兼容验证和播放器二次封装。 

## 快速入口

- GitHub: https://github.com/numberwolf/h265web.js
- 文档: https://h265web.com/markdown-docs/zh/get-started.php
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
- 中文文档: https://h265web.com/markdown-docs/zh/get-started.php


### 适合什么场景

- 浏览器播放 HEVC / H.265、AVC / H.264、AV1
- 点播与直播统一接入
- MP4 / MOV / MKV / FLV / MPEG-TS / M3U8 / HLS / HTTP-FLV / WS-FLV / HTTP-TS / WS-TS / HEVC ES 等协议验证
- 需要截图、MediaInfo、倍速、Seek、全屏、多实例、多线程等能力的网页播放器项目

### O、接入案例（部分）

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
| MediaInfo | HEVC/H.265 | AVC/H.264 | Hardware decoder<br>硬解码<br>(FLV/HTTP-FLV/MP4) |

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

<br>


# 文档入口

- 中文 Docs 首页: https://h265web.com/markdown-docs/zh/get-started.php
- 入门指南: https://h265web.com/markdown-docs/zh/get-started.php
- 简单演示: https://h265web.com/markdown-docs/zh/simple-demo.php
- API 文档: https://h265web.com/markdown-docs/zh/api-docs.php
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
