# MP4 / 媒体起播定位

适用冻结合同及实际顺序下载软件路线；新版先看实际Network。以下命令检查本地有权媒体，工具不可用时直接DevTools替代。

## 先定义“慢”的阶段

询问“从打开页面到画面，还是拖动进度后等待；点击播放前是否已经 ready”。检查 Network 的 JS/WASM冷下载、媒体首字节、probe/ready、play与真实呈现时间。至少分开：SDK下载、WASM启动、媒体索引/探测、关键帧/解码、等待用户播放。

`moov` 是 MP4 索引与轨道描述，`mdat` 保存媒体数据。`moov` 在文件尾是启动慢的重要原因，但**不是必然失败**；服务器Range、读取方式和当前路线决定实际影响。faststart也不能修复网络慢、解码不支持或自动播放阻止。

当前软件链 E21 顺序下载且等待完整顶层 moov。尾部 moov 可能要求先接收前面的 mdat，不能因为服务端支持Range就声称SDK会主动跳到尾部。native video的读取策略另外观察。长文件软件起播还可能出现内存压力，勿靠增加固定内存档位代替定位。

## 初学者可执行的步骤

下面命令在**终端**运行，不是在浏览器 Console。先保存有权限的本地媒体，使用实际文件路径；URL含token的输出先留本地，提交前脱敏。Windows PowerShell 使用 `curl.exe`，避免 `curl` 别名；无法安装工具时走DevTools/反馈分支。

**A. 确认工具及媒体。**

```bash
ffmpeg -version
ffprobe -version
ffprobe -v error -show_entries 'format=format_name,duration,size,bit_rate:stream=index,codec_type,codec_name,codec_tag_string,profile,pix_fmt,width,height,sample_aspect_ratio,r_frame_rate,avg_frame_rate,sample_rate,channels' -of json 'input.mp4'
```

正常应有容器、视频编码/尺寸和实际音轨；没有audio stream不等于音频故障。解释 `hevc`/`h264`、`hvc1`/`hev1`、pixel format、sample rate。缺 `moov`、invalid data 或空结果先走文件完整性/请求内容分支，不能继续声称该文件只是索引在尾。

**B. 定位顶层索引与数据的顺序。**

```bash
ffprobe -v trace -i 'input.mp4' 2> 'mp4-trace.log'
```

用编辑器打开日志，搜索 `type:'moov'`、`type:'mdat'`，只比较 `parent:'root'` 的顶层条目。可选有 rg 的环境：

```bash
rg "type:'(moov|mdat)'.*parent:'root'" mp4-trace.log
```

`mdat` 先、`moov` 后说明尾索引；`moov` 先说明索引已前置。不要用字符串搜索文件中的“moov”判索引位置，也不要把 FFprobe trace 中某个数字未经定义当box起始偏移。若有多个mdat/moof、加密/碎片媒体、日志格式不同，转顶层box检查器与相应格式分支，不能简单套普通MP4结论。

**C. 检查服务器实际头/尾 Range。** 下面URL是示意，替换为有权限的真实媒体URL；一次性token每次单独获取。`--max-filesize` 防止忽略Range时误下载整个大文件。

```bash
curl -sS -L --max-time 10 --max-filesize 65536 -D range-head.headers -o /dev/null -H 'Range: bytes=0-1023' 'https://example.com/video.mp4'
curl -sS -L --max-time 10 --max-filesize 65536 -D range-tail.headers -o /dev/null -H 'Range: bytes=-1024' 'https://example.com/video.mp4'
```

Windows把 `/dev/null` 替换为 `NUL`。查看**最后一跳**响应：

| 结果 | 判断和下一步 |
| --- | --- |
| 206 +正确Content-Range，body为请求范围 | 该请求的Range工作；继续核对浏览器的实际请求与route，不据此证明软件SDK使用Range |
| 200 +完整文件 | 服务端可能忽略Range；并非文件必定不能播放，但尾索引启动会受读取策略影响 |
| curl exit 63 +200/大Content-Length | 本次达到下载大小限制；检查headers即可，不把curl中断误判为SDK错误 |
| 200 text/html / JSON登录信息 | 路径/鉴权/代理兜底错误；不能按正常媒体继续处理 |
| 416 +Content-Range: bytes */总长 | 请求范围无效，或对象/缓存变化；核对文件长度、URL与签名，不当成解码错误 |
| 401/403/404 | 单独解决鉴权/路径；不要反复重新编码 |
| Console CORS，但curl正常 | curl不受浏览器同样的CORS限制；按实际Origin与浏览器Network查 |

DevTools替代：打开开发者工具→Network→保留日志→重新播放→点媒体请求→Headers，检查 Request URL、Range、状态、Content-Range、Content-Type、重定向及Timing。不要仅查HEAD或Accept-Ranges。

**D. 已确认普通完整MP4尾索引时，重封装到新文件。**

```bash
ffmpeg -n -i 'input.mp4' -map 0 -c copy -movflags +faststart 'output-faststart.mp4'
```

`-n` 防止覆盖已有输出；`-c copy` 不重新编码，执行第二遍移动索引。保留原文件，命令报错就保留错误，不强行丢弃轨道；若某轨道无法写入MP4，先说明原因再显式选择需要的轨道。该命令不恢复缺失moov，不用于让未完成录像、DRM媒体或正在写入的fMP4获得通用兼容性。[FFmpeg官方格式说明](https://ffmpeg.org/ffmpeg-formats.html#mov_002c-mp4_002c-ismv)

**E. 用同条件复测。**

再运行B确认moov顺序，A确认编码/音轨/时长，再上传新文件到相同服务路径体系；替换播放URL并确认没有旧CDN/ServiceWorker缓存。对比原片与新片的实际路线、首次真实画面、seek和音频，不仅看命令exit0。若仍慢，返回A阶段拆分网络/WASM/解码，而非反复faststart。

## 常用媒体补充检查

| 目的 | 命令（本地文件） | 解释与下一步 |
| --- | --- | --- |
| 第0帧是否本来黑 | `ffmpeg -n -i 'input.mp4' -frames:v 1 'first.png'` | 看图；再观察播放/后续帧，不把黑色首帧当加载失败 |
| 短段本地是否可解码 | `ffmpeg -v error -i 'input.mp4' -t 10 -map 0:v:0 -map '0:a?' -f null -` | 不输出声音；仅说明本机FFmpeg对所测短段的结果，不代表浏览器可播 |
| 前10秒关键帧/时间戳 | `ffprobe -v error -read_intervals '%+10' -select_streams v:0 -show_entries packet=pts_time,dts_time,duration_time,flags -of csv=p=0 'input.mp4'` | K标记/PTS/DTS用于比较输入；只测区间，不能据此证明整文件无问题 |
| 确认HEVC sample entry | A中的codec_tag_string | 只有兼容HEVC编码时才考虑hvc1重封装，Main10/444问题不能靠改标签解决 |
| 裸流参数信息 | `ffprobe -v error -f hevc -show_streams -of json 'input.h265'` | 无容器音轨和MP4索引；帧率可能来自推定，实际帧率需源端确认 |

可选HEVC重封装：`ffmpeg -n -i 'input.mp4' -map 0 -c copy -tag:v hvc1 -movflags +faststart 'output-hvc1.mp4'`，仅在视频确认为HEVC且目标链需要时提供，不对H.264套用。转码为H.264/AAC是另一项有画质、时间和业务成本的操作；不能把“换了编码能播”算作原HEVC支持通过。


本skill还提供 `inspect-media.py` 顶层box工具，不扫描mdat文本；JSON中 offsets 是真实字节偏移。见 tools.md。
