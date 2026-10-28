# WebRTC接入

播放用WHEP，WHIP是推流。SDK仍是同一工厂/回调/build/load生命周期；常见播放地址：

```text
http://127.0.0.1/index/api/whep?app=live&stream=test
webrtc://127.0.0.1/live/test
http://127.0.0.1/index/api/webrtc?app=live&stream=test&type=play
```

默认URL识别native RTC；明确强制时`core:'webrtc'`。HTTP(S)交换SDP，协商后媒体走ICE/DTLS/SRTP。信令HTTP200/201或连接成功不能证明实际视频帧。ICE防火墙/NAT/TURN、CORS、证书及源编码都要核对。

native默认性能/兼容路线，只接受浏览器协商编码。支持实际AV、video-only、audio-only；音轨未知不造hasAudio。直播1x、不支持点播seek/逐帧，UI禁用对应控件并说明。

encoded不是“把core改WASM就能解任意WHEP”。需要服务端明确提供`h265web-rtc-encoded/v1`兼容DataChannel帧协议和能力描述，native route仍为默认。WASM encoded有HEVC Main8bit/I420/Annex-B/VPS-SPS-PPS等条件；WebCodec按具体config探测；fixture或实验结果不代表普通ZLM生产服务支持该协议。

ZLM文档中的`modify_stamp=1`/`paced_sender_ms=0`来自特定RTMP→RTC时间轴验证。先核对实际版本、路由和输入时间戳，不擅自用它改全部HLS/服务器。截图/全屏走公开接口；结束时等待真实release，包含PeerConnection/请求/服务器会话清理。

scaffold `--scenario webrtc --media 真实WHEPURL`生成常规native接入。没有源就明确需要先推流，不用占位URL验收。
