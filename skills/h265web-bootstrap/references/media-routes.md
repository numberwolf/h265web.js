# 点播、直播和媒体类型

用户说“一个视频地址”时先确定实际容器、编码、点播/直播、协议和权限，不先要求他选core。Auto省略core。请求核心和实际核心分开报告。

MP4 H264/HEVC：默认兼容native video先行，软件后备是否可用依浏览器/配置/回调；moov、Range、关键帧、浏览器编码能力分别影响起播。视频小样片可先验证资源/生命周期，但不能替代用户实际媒体。

WebM：浏览器原生路线。无后缀录像接口由元数据确定后传`format_type:'webm'`。不能强制WebCodec/WASM软件后备或绑定需要原始软件数据的回调，再把`WEBM_NATIVE_UNSUPPORTED`当网络故障。

MOV/MKV/PS/TS、AV1、AAC MAIN/LC、MP3/G711/PCM：README列举/格式识别不等于任何文件均支持。核对ffprobe/profile/pixel format/音轨、实际浏览器和route；当前FFmpeg软件构建不是通用AVC/AV1/VP9解码器。非HLS H264 TS主要MSE，HEVC TS有WASM强制条件。错误降级音轨而保留视频，不能称完整AV通过。

直播必须先有源。RTMP/RTSP摄像头通常由ZLM等已有媒体服务转成浏览器拉流协议，不直接把rtmp://当SDK普通媒体URL。下面是本机**示意**，必须在流存在时才可用，浏览器不在服务器上则换实际地址：

```text
HTTP-FLV http://127.0.0.1/live/test.live.flv
HTTP-TS  http://127.0.0.1/live/test.live.ts
WS-FLV   ws://127.0.0.1/live/test.live.flv
WS-TS    ws://127.0.0.1/live/test.live.ts
HLS      http://127.0.0.1/live/test/hls.m3u8
```

HTTP跨域检查CORS，HTTPS页不能混用HTTP/WS。WS检查Upgrade/Origin/二进制媒体数据；101不等于正确解封装。`127.0.0.1`分别是浏览器或推流命令所在机器。

TS-HLS有master/media、分片、刷新与窗口，直播延迟包含切片/GOP。native/MSE/WebCodec/WASM筛选候选，不能承诺永远按固定顺序实际命中。JS session拒绝fMP4/加密/byterange/LL-HLS/替代音频字幕等；native能力另看。不得删标签、改ENDLIST或调用已移除legacy伪装支持。master选择也不等于完整ABR功能。

普通直播无任意seek；HLS在可回看且已下载窗口内才考虑seek。RTC直播无seek/固定1x。点播控件按已确认duration范围；unknown/仅音频等结果在UI解释，不猜一条隐藏轨道。

HEVC ES裸流：验证真实Annex-B、VPS/SPS/PPS、帧边界和帧率来源。没有MP4 moov或自带音轨。旧专用raw Worker及自造时间戳需要定向实际验证，不承诺相同点播seek/rate。File/Blob/MediaStream/自喂NAL请求另确认公开合同与资源生命周期，不能把任意对象传入load_media。

需要测试推流时先用隔离测试流：

```bash
ffmpeg -re -stream_loop -1 -i 'flat-h264-aac.mp4' -map 0:v:0 -map 0:a:0 -c copy -f flv 'rtmp://127.0.0.1/live/test'
```

输入是本skill或公开repo的自生成样片；Ctrl+C停止。不要改用户生产流。HEVC-in-FLV还需FFmpeg和服务端共同支持，不能以HEVC MP4能播推断RTMP/WebRTC能协商。
