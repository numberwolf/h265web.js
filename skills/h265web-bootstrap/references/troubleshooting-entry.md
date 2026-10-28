# 接入遇错时先做什么

识别当前实际SDK地址与版本、媒体/浏览器、失败阶段。先用已有源码/Console/Network证据，问缺少的关键信息，不要求用户先懂core。每次提供一至三项相关步骤；操作位置→命令/操作→预期/异常→下一步。

| 现象 | 第一检查 |
| --- | --- |
| 工厂未定义/build false/SSR报window | 脚本内容和执行顺序、DOMid/可见尺寸、客户端挂载加载；不是调整编码。 |
| WASM初始化失败 | 同版本三件、真实wasm bytes/MIME、页面隔离、CSP/安全上下文。 |
| MP4慢 | 拆SDK冷下载、probe/ready、play/实际帧；moov与Range和实际route同时看。 |
| ready后黑/无声 | 点击play、黑色首帧、容器；真实音轨、ignore_audio、volume和用户手势。 |
| 直播连接却没画面 | 确认真实推流、媒体格式、HTTP/WS/HLS子请求/RTC协商；连接成功不是出帧。 |
| 帧数增长但媒体时间几乎不动 | 比较源FLV与服务端TS相邻DTS步长（秒/ms/time_base），再查重复AVC配置tag时间戳与实际服务构建；不先改播放器时钟。 |
| 换源/卸载后仍拉流 | 会话代次、release完成、旧format/protocol、失效授权和不同实例归属。 |
| VR报错 | 非fatal显示降级，核对真ERP/CORS/纹理，不重载解码器。 |

MP4定位（终端，本地有权限文件）：

```bash
ffprobe -v trace -i 'input.mp4' 2> 'mp4-trace.log'
ffmpeg -n -i 'input.mp4' -map 0 -c copy -movflags +faststart 'output-faststart.mp4'
```

日志只看顶层`parent:'root'`的moov/mdat顺序；缺moov/截断不能faststart修复。尾moov不是必失败；当前软件Worker顺序fetch与完整moov gate可能等到尾部，服务端Range支持不表示这条route主动尾读。新文件重查顺序/媒体/浏览器起播，不覆盖原片。

未解决时生成现象、浏览器/SDK来源、配置/绑定回调、复现步骤、首个错误、脱敏Network与媒体摘要、已尝试/未知项。到[Issues](https://github.com/numberwolf/h265web.js/issues)搜索同版本问题，再登录看创建权限；受限时保留草稿走当前README反馈渠道。不要自动提交/发信或公开token。若已安装h265web-troubleshoot，使用它的对应runbook与诊断工具；本skill也能完成上述最小反馈。

RTMP→TS中重复AVC配置若被服务器转换成零DTS参数集，可在特定mode2时间线处理中压缩媒体时间。先比源/输出包与配置tag，再核对源码补丁、构建hash和实际进程；源码/隔离构建验证不等于用户服务已部署修复。保留旧负控和失败，不盲改modify_stamp=1、不自动重启服务、不改SDK PTS。该raw remux结论不替代既有RTMP→WebRTC特定mode1建议，也不证明所有WebRTC mode2均解决。已安装排障skill时可读其上游时间戳runbook；未安装仍可按上述证据分层反馈。
