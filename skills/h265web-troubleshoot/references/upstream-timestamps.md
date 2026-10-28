# 帧数在增长，媒体时间却几乎不动

适用：流已接收/解码、实际帧数持续增长，但`media.currentTime`或公开媒体进度相对墙钟明显停滞。先排除暂停、倍速、不同实例/源、采样区间和单位错误；该现象本身不能确定是解码器、音频或播放器时钟故障。低帧率、无数据、音频输出停滞是其他分支。

## 先比较边界上的时间戳

保留原配置，使用有权限且已取得的本地源FLV和服务端输出TS短片。不要为取证消费一次性播放URL、改推流器或自动重启服务器。下面命令在终端执行，只读本地文件，输出JSON；若保存，选择新的日志文件名。

```sh
ffprobe -v error -select_streams v:0 -read_intervals '%+#40' -show_entries 'stream=codec_name,time_base,avg_frame_rate:packet=pts,dts,pts_time,dts_time,duration_time' -of json 'source.flv'
ffprobe -v error -select_streams v:0 -read_intervals '%+#40' -show_entries 'stream=codec_name,time_base,avg_frame_rate:packet=pts,dts,pts_time,dts_time,duration_time' -of json 'server-output.ts'
```

比较相同视频轨、同一连续区间的**相邻DTS差值**与覆盖时长，而不是绝对起点：`dts_time`/`pts_time`是秒，乘1000才是毫秒；原始`dts` tick必须结合各自time_base。允许负起点和合法B帧PTS重排，不能靠PTS非单调就认定错误。缺失DTS、截取不对应或跨循环/重连时，先记unknown并补证据。

- 源FLV视频包步长正常（例如约39/40ms），服务端TS却约1ms/帧、同样帧数覆盖时间缩短：优先定位发布/重封装/服务器时间线边界。帧数增长不证明媒体时钟正常，不先调音频/播放器PTS。
- 源与输出都压缩：继续向源端/推流转换追踪，不能套用下面特定服务器根因。
- 源与输出步长都正常：返回浏览器实际收到的对象、实例/时间单位、实际核心、播放倍率、音频输出和呈现证据；不能仅凭症状宣称上游缺陷。

FFprobe普通视频packet列表可能省略AVC配置包；`New Extradata`只提示元数据变化，不能代替原始FLV配置时戳。需要FLV tag解析或服务端受控诊断，分别统计视频CodecID=7的AVCPacketType=0（AVC配置）和=1（媒体），保留每个tag的32位毫秒时间戳、顺序及重复频率。只读有界样本，不改写tag。TS包无AVC配置tag同形结构，不把ES参数集位置当作原RTMP时间戳。

## 已确认的一类 RTMP → TS 故障

一种已验证的组合中，FFmpeg输出FLV在每个视频媒体包之前重复AVC配置，源媒体DTS正常。受影响的ZLMediaKit RTMP接入调用两参数`H264Track::setExtraData`，将配置生成的SPS/PPS帧置为DTS0；这些重复零DTS进入同一`modify_stamp=2` Stamp后，TS媒体时间线被压缩。根因不能仅归为“源媒体DTS坏了”或“所有mode2有错”。

对应源码修复给RTMP路径增加携带原配置包毫秒DTS的三参数重载，原两参数元数据接口保留既有0DTS行为。没有改Stamp算法、SDK、PTS偏移、音频时钟或推流器。只有输入模式/输出包证据与运行构建吻合，才能归入这类问题；不要把此补丁作为无条件前端修复。

## 验证修复存在于实际运行服务

记录服务端源码提交/差异、构建参数与二进制hash、实际进程加载的二进制、监听端口/流路径及生效配置。版本banner或工作区里有补丁不证明运行进程用了新构建。保持正常单配置输入与重复配置输入两组，覆盖非零起点；旧库负控应保留实际FAIL，修复构建再比DTS跨度和真实媒体时间推进。

该类修复已在隔离的正常构建中验证：旧库单配置跨度960ms正常、重复配置负控失败；新库单/重复/非零起点均保持960ms跨度。当前与封版播放器SDK配合新服务，`modify_stamp` 0/1/2的raw HTTP/WS-FLV/TS样本均通过；这些是指定输入与隔离构建的证据，不是所有服务器/媒体的通用兼容保证。此前失败日志继续保留，不能因复验成功删除。

源码修复、隔离验证、实际部署是三个不同结论：未替换/重启的用户服务仍可能运行旧二进制。若只有源码与隔离验证，报告“修复已验证，目标服务是否应用未知/未部署”；不要说用户环境已经恢复。部署/重启需要用户针对实际环境的授权。

原有RTMP→WebRTC场景的`modify_stamp=1`/`paced_sender_ms=0`建议仍按其特定验证合同使用。这里的必修复证据属于raw remux模式2，不等于所有WebRTC mode2时序问题解决。不要盲目强改为mode1、修正播放器PTS/音频时钟、降低推进断言或自动重启用户服务器。

## 复测与反馈

在同源、同配置、同样播放动作下，分别记录墙钟区间、实际帧数、公开media.currentTime/进度秒值、源与输出DTS步长/跨度、实际核心和release。无音轨样本不把音频active作为门槛；有音轨另验输出，不能拿进度回调冒充A/V误差。缺FFprobe时保留浏览器时序与服务器构建身份，请维护者提供包级摘要，根因仍记待验证。

Issue草稿附上观察/已确认原因/待验证假设、重复配置频率、脱敏包级摘要、构建身份、修复前后和负控结果、源码/隔离/部署边界。不要附token、cookie、private SDP或私有流完整地址；本地保留原始失败。没有授权不提交Issue、不改服务器。
