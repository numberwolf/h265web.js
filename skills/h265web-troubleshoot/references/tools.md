# 工具使用

命令在终端运行；浏览器采集器在DevTools Console运行。路径含空格时用引号。Python3标准库足够；ffprobe缺失仍能检查MP4顶层box。JS采集器不要求Node。Windows终端使用python或py -3，curl例子使用curl.exe与NUL。

```sh
python3 scripts/inspect-media.py 'input.mp4'
python3 scripts/inspect-http.py --url 'https://example.com/media.mp4' --range 'bytes=0-1023'
python3 scripts/inspect-http.py --url-file 'private-url.txt' --range 'bytes=-1024'
python3 scripts/format-report.py --input 'diagnosis.json' --output 'issue-draft.md'
```

inspect-media仅接受本地文件。JSON包含basename/size/有限ffprobe stream-summary/MP4结构与错误。box解析seek跳过大mdat，最多4096盒，32/64bit/size0/截断/moof分别报告。检测到HTML/JSON/异常结构不做faststart；尾moov、missing moov、fragmented结果不同。`--ffprobe`可指定真实可执行文件、`--timeout`限制运行；缺工具/失败不是媒体已兼容。没有输出扬声器声音。

inspect-http默认只GET一次，最多读取65536byte（`--max-bytes`上限1MiB）、单请求timeout 10秒与有限重定向；不自动HEAD/尾Range/WASM请求。HEAD可显式 `--method HEAD`。含一次性授权用 `--one-time`，工具拒绝消费并转DevTools（只看实际播放请求）。URL/header凭证从本地文件输入，文件权限建议0600，header JSON通过`--headers-file`；stdout不返回原body/header凭证。TLS验证保持开启；跨origin跳转不转发敏感请求头；带URL用户密码拒绝。HTTP可达不证明浏览器CORS成功。

Range结果：206仍检查Content-Range和实收长度；200说明可能忽略，达到上限记truncated；416区间错误；401/403/404明确不重试；HTML/JSON200不是媒体。body只给分类/magic/字节数，不输出文本。WASM prefix正确不证明文件完整或三件匹配。

浏览器：将collect-browser.js全文粘到Console，获得 `window.h265webDiagnostics`（诊断工具自己的对象，非SDKAPI），然后：

```js
const d = window.h265webDiagnostics;
d.mark('mediaLoad'); // 在实际load调用旁标记，不能事后虚构起点
const detach = d.observe(existingPlayer); // 已有公开实例；不访问SDK私有字段
// 执行原来的build/load/play流程；已有回调继续调用
console.log(d.snapshot());
// 完成后恢复包装回调与全局监听
 detach(); d.stop();
```

没有可见业务实例就直接snapshot获取环境/DOM媒体；probe/core保持unknown。采集前绑observe能捕获后续事件；后绑不会重放已发生probe。observe只包装现有probe/ready/error/progress，不额外开低层回调，不改play/load/时钟。framesPresented只有native requestVideoFrameCallback发生才记录；canvas只报尺寸，不能当实际出帧。视频progress/native.audioDecodedBytes也不等于主观音质/A-V同步通过。

报告默认中文；英文用户用`--language en`，与用户语言一致。report输入允许字段：`symptom,expected,sdkSource,assetHashes,framework,browserOS,mediaSummary,wantedCore,selectedCore,boundCallbacks,stageTimings,observations,confirmedCauses,hypotheses,errors,checks,changes,retest,unknowns,reproduction`。缺项unknown，其他字段丢弃，原始cookie/SDP不放报告。输出前人工预览。

collector对每个observe实例分别只读get_audio_leveling_state/get_super_resolution_state；SR通知只包装用户已绑定的on_super_resolution_state，不额外启用SR。snapshot的audioLeveling/superResolution按observerId输出，老版available=false/state=unknown；仅过滤允许的状态/几何/性能字段。formatter保留这两组状态并继续脱敏；raw队列/凭证不采集。
