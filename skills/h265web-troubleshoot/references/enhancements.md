# 稳定音量与实验性超分（当前构建 / 旧版兼容）

以实际浏览器加载的三件hash和公开API为准。封版`732e173`无这两项API，应禁用对应控件并保持原播放。SDK API沿用2026-10-17兼容基线及后续实播修复，默认None/off。当前面板更新计划随SDK/官网统一发布；本地验证或待推送内容不代表已经上线。正常部署三件须同构建；受控旧WASM兼容测试只证明旁路和普通播放，不推荐混版。

## 稳定音量

```js
const levels = window.H265webjsPlayer.AudioLeveling;
const supported = levels?.None === 'None' && levels?.StableVolume === 'StableVolume' &&
  typeof player.set_audio_leveling === 'function' && typeof player.get_audio_leveling_state === 'function';
if (supported) {
  const accepted = player.set_audio_leveling(levels.StableVolume);
  const actual = player.get_audio_leveling_state(); // copy / observation
}
```

build配置`audio_leveling:levels.None|levels.StableVolume`，默认None。状态`disabled/pending/active/unavailable`以及reason；只有actual.active和status说明当前路径是否真实处理，请求true不算active。无音轨、ignore_audio、Context未running、AudioWorklet/CORS/输出路径限制分别诊断。失败保留原声音，不强制切视频core，不创建替代音轨。RMS AGC不是LUFS/true-peak认证，latencyMs:0不表示浏览器/设备端到端延迟为零。用户set_voice(0..1)/mute在其后独立，切均衡不得改音量；volume0仍可保留轨道/处理证据，浏览器测试始终--mute-audio。

无公共音量状态回调；应用可在请求开启且存活时低频读get_audio_leveling_state，并在换源/卸载停止。None不得为了显示“支持”主动创建AudioContext或开启处理。默认音量零是demo首次策略，用户改过后不能被增强切换/换源复位。

## 生成面板的运行时交互

七框架共用面板用可键盘操作的 `role="switch"` 滑块，音量均衡与SR默认关闭。暂停时开关均衡或调整音量应维持暂停；某些RTC软件路线的手势通知会直接播放，不能将它当作无副作用的setter激活。需要用户解锁时使用明确的“播放并激活音频”动作。未ready可预设，播放中可开关；请求、实际状态和旁路原因分别展示，首帧前或暂停时提示需要新画面评估。音频公开状态在视频暂停时仍可只读观察，换源/释放停止轮询；不会写入媒体时钟或队列。

首次开启SR默认 `level:'light', targetKey:null`，由SDK取实际最低可用档；“自动”为 `standard/null`，手动尺寸取SDK实际报告的options；关闭时只保留同媒体、窗口和源尺寸的已确认档位。换源、几何或投影变化及明确无可用档位后清缓存，等待新修订报告，不用getter旧快照重新绑定。选档保留enabled，不把关闭隐式变为开启。旧SDK缺API仍保留普通播放并禁用相应控件。

片源色彩仍是build-only。任意新URL默认unknown；用户确认SDR后仅暂存，显示“待应用”，显式点击“应用并重新加载”才进入新build。点播从头、直播重连，不热改input_color；`renderer-recreate-required`也由该显式按钮处理，保留音量/静音和首选项。声明只绑定同一媒体身份，不能沿用至任意新地址。

## SR 默认、安全声明与资源

```js
// Build-only complete configuration; sdr is a per-source declaration, not detection.
const config = {super_resolution:{enabled:false,backend:'auto',level:'standard',
  input_color:'unknown',model_manifest_uri:'https://your-origin/sdk/models/sr/model.json'}};
// When supported, runtime patch accepts ONLY enabled / level / targetKey, or boolean.
const accepted = player.set_super_resolution({enabled:true});
const actual = player.get_super_resolution_state();
// Bind before build only when needed; it is a state notification, not a low-level frame callback.
player.on_super_resolution_state = state => { /* render state safely */ };
```

仅已验证兼容SDR8bit输入才能在build声明`input_color:'sdr'`；分辨率/后缀不能证明色域。默认unknown旁路，可见HDR/宽色域不会被sdr覆盖；现有RGB转换不兼容的I420、非方形/方向元数据不明确、旧WASM无只读descriptor都旁路。换任意URL时旧声明不得盲目沿用，新源要重新确认。

固定小AN四层CNN与同一WebGL2 context；无ORT/WebGPU生产后端承诺，候选不代表主观画质/功耗准入。输入短边≤720，倍率1.25/1.5/2；按源显示比例/有效viewport给至多两档，输出长边≤1920、短边≤1080、像素≤2073600。码率不解锁2K/4K增强；原画本身不受增强上限限制。

展示actual `status/reason/source/output/options/targetKey`：`off/loading/warming/active/bypass/released`。warming/复选框/请求true/有options均不是active；targetKey只能取当前options的稳定标识，不硬编码分辨率或失效后暗中换档。`lastEnhancedTime`为Unix epoch毫秒；公共媒体进度/seek仍为秒，指标不是媒体时钟。

既有C++ renderer中途开启可报告`renderer-recreate-required`。只解释原因/显示明确重建按钮；用户点击后才release完成→按完整配置新build/load。不得自动重载、切core、改PTS/队列或重试至active。预算/能力不合格维持原画；seek不应借机恢复预算资格；模型/hash失败不得循环重试。关闭/换源/release取消旧请求和状态，旁路不触发媒体fatal。

## 新demo与既有项目

```sh
python3 scripts/scaffold.py --framework react --output NEW_DIR --sdk-dir MATCHING_STATIC --with-sr
# Only if this input has independently been verified as compatible SDR:
python3 scripts/scaffold.py --framework vue --output OTHER_NEW_DIR --sdk-dir MATCHING_STATIC --with-sr --sr-input-color sdr
```

`--with-sr`只提供控件与完整`models/sr`（model.json、匹配an.json、完整许可/来源），默认仍off；关闭普通播放零模型下载。默认不带SR模板也不复制/请求模型。远程SDK可显式`--sr-models-dir`指向匹配完整本地模型目录；浏览器manifest路径和媒体/SDK地址分开解析。不要只复制主三件或遗漏许可。旧SDK无API时保留正常播放并禁用控件，即使页面保留可选模型也不请求。

`h265web-host.js`是应用封装：`setAudioLeveling`、`setSuperResolution`、`subscribeEnhancements`和snapshot.enhancements不是SDK新API。每个宿主独立请求与实际快照，回调带会话失效保护；音量轮询释放时停。公共SR回调白名单已包含on_super_resolution_state，不开启NAL/YUV/A-V等低层回调。SSR顶层不碰window。

React源码prop变更和Vue KeepAlive重建通过局部sessionState保留用户voice/rate/策略/开关，独立组件不共享它；不保留旧输入SDR资格或失效target。新物理组件实例的持久业务状态由应用显式传sessionState。七框架共用同一host/demo；旧SDK与当前SDK分别实际验证。

## 反馈与证据

排障只读公开状态、用户已绑定的SR回调；不抓私有媒体队列，不为观察而启用增强。记录策略请求、actual状态、reason、当前source/output/options、模型hash、SDK/WASM版本与复现动作。含token的manifest/媒体URL、错误和路径分享前脱敏；不能只凭状态宣称画质提升、全设备支持或长期A/V通过。
