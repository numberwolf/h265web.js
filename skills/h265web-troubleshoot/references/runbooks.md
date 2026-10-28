# 按症状排障

所有条目是候选原因的优先级，不是已确认根因。适用范围：SDK合同记录的构建；实际版本/hash不同先核实路由与API。每项按“证据→分支动作→同条件复测”完成；工具缺失走DevTools/最小反馈。原生/software/HLS/RTC规则不能混用。

共同停止/Issue条件：一项修复无法复现确认、有限对照仍失败、需求超出实际能力或需要SDK/服务端维护者时，保留首错、unknown、最小复现交issue-workflow。已确定授权/路径/codec失败不做循环重建。每项结果记录原媒体、请求core与actual core、版本/浏览器；不把替代路线成功算原路线成功。

检索：D01–D06初始化/部署；D07–D14媒体网络；D15–D20播放音频；D21–D30协议；D31–D35时间/性能/生命周期；D36–D42界面/元数据/VR/版本。

## D01 H265webjsPlayer 未定义

优先证据/候选：script 网络/执行错误、真实内容、加载顺序、版本冲突；加载工厂后创建。

分支与修复：响应404/HTML→修正实际script URL；200但工厂缺→看第一个执行/CSP错误；工厂来源冲突→统一版本。

复测/转交边界：等script.onload及工厂后build；同一源只下载一份；无无定义错误。 超出此证据适用范围时按共同停止条件转交。

## D02 build false / box null

优先证据/候选：DOM id 是否唯一且存在、mount 时机、WASM 参数；解释布尔返回。

分支与修复：id缺失/重复→改局部唯一宿主并在mounted后调用；配置资源缺失→按实际三件修正。

复测/转交边界：build必须true且容器可见；load受接受再观察帧；false不得继续伪报ready。 超出此证据适用范围时按共同停止条件转交。

## D03 window/document 未定义

优先证据/候选：SSR 求值堆栈；SDK 移到客户端挂载加载。

分支与修复：顶层浏览器求值→移到client mounted；只加use client仍须保证SSR import不执行window。

复测/转交边界：生产SSR build/服务端响应+hydration+离开返回，不只dev。 超出此证据适用范围时按共同停止条件转交。

## D04 WASM CompileError/LinkError

优先证据/候选：三件版本、MIME、magic、被截断/缓存；不改解码参数掩盖资产问题。

分支与修复：HTML/截断→修请求；不同hash→替换同一构建三件；仅MIME错→限定资源服务修正。

复测/转交边界：实际WASM200、magic、完整hash，重新初始化；旧cache/SW对照。 超出此证据适用范围时按共同停止条件转交。

## D05 SharedArrayBuffer/Atomics/Worker 失败

优先证据/候选：安全上下文、页面隔离、CSP、iframe 和实际 pthread 路线。

分支与修复：非安全/未隔离→先确认实际软件路线需要；页面头/iframe/CSP按失败来源改必要范围。

复测/转交边界：页面crossOriginIsolated+SAB、Blob Worker和glue实际请求，无Atomics异常。 超出此证据适用范围时按共同停止条件转交。

## D06 本地正常，CDN/生产失败

优先证据/候选：实际 URL、子路径、hash/cache、Service Worker、构建工具 public 路径。

分支与修复：public前缀重复/子路由相对路径错→绝对浏览器基准；旧cache→核对hash后有限刷新。

复测/转交边界：真实部署深层URL的JS/glue/wasm/media，保留其他第三方依赖。 超出此证据适用范围时按共同停止条件转交。

## D07 一直 loading / MP4 起播慢

优先证据/候选：第 8 节：阶段测量、moov、Range、实际路线、WASM 冷下载。

分支与修复：分别定位冷SDK/WASM、索引等待、用户点击、关键帧；确认尾moov才faststart到新文件。

复测/转交边界：同服务器/同core、原片与新片首个真实帧对照，不把ready算出画。 超出此证据适用范围时按共同停止条件转交。

## D08 moov atom not found

优先证据/候选：HTTP 是否返回 HTML、文件是否截断/录像未正常结束；faststart 不重建缺失索引。

分支与修复：200HTML→授权/路径；缺盒/未封口→取得完整媒体或交源端；faststart报错保留。

复测/转交边界：新完整文件box+ffprobe通过后重试；原片不覆盖。 超出此证据适用范围时按共同停止条件转交。

## D09 200 却无法播

优先证据/候选：Content-Type 与真实内容、重定向登录页/JSON错误、无效媒体数据。

分支与修复：真实HTML/JSON/空body→登录/代理/API错误；下载不完整→修传输，不重复转码。

复测/转交边界：最终URL正确内容+媒体probe；200只是状态。 超出此证据适用范围时按共同停止条件转交。

## D10 401/403/404/408/429/5xx

优先证据/候选：权限/到期/路径/暂时失败；新授权与错误链路；不能无限自动重试。

分支与修复：401/403换授权；404修路径；408/429/5xx依据服务状态做一次有限对照；不消耗旧token。

复测/转交边界：新授权单次播放，记录status/error与重试次数；失败不无限循环。 超出此证据适用范围时按共同停止条件转交。

## D11 CORS/status 0

优先证据/候选：Console 精确错误、页面与最终资源 origin、OPTIONS/子请求；0 也可能是网络错误。

分支与修复：curl正常而浏览器blocked→核对浏览器origin与最终资源允许头；网络断开/证书独立修。

复测/转交边界：浏览器实际GET/OPTIONS/子请求成功；不能仅curl当CORS通过。 超出此证据适用范围时按共同停止条件转交。

## D12 HTTPS 页拉 HTTP/WS 失败

优先证据/候选：mixed content、最终跳转、WSS证书；用正确安全地址。

分支与修复：改正确HTTPS/WSS播放入口与有效证书，连同最终redirect；禁止disable-web-security。

复测/转交边界：实际安全页面Network无mixed content/证书拦截，WS可升级。 超出此证据适用范围时按共同停止条件转交。

## D13 VLC 能播网页不行

优先证据/候选：ffprobe容器/视频/音频/profile/pix_fmt、真实浏览器候选，不直接断言播放器 bug。

分支与修复：按真实codec/profile/轨道和候选判断；分别同源样本/原片；可选转码须标成本与支持变化。

复测/转交边界：原编码原样片复测，换编码可播单独说明，VLC能力不外推浏览器。 超出此证据适用范围时按共同停止条件转交。

## D14 HEVC/AV1/10bit/4:2:2/4:4:4 黑屏

优先证据/候选：编码配置与浏览器/renderer/编译能力；标签重封装不等于转码。

分支与修复：确认10bit/422/444/AV1条件；hvc1只适用兼容HEVC重封装，不能改tag假转码。

复测/转交边界：实际profile/pix_fmt和requested/actual core配对；能力外样本标不支持。 超出此证据适用范围时按共同停止条件转交。

## D15 ready 后黑屏/画面不动

优先证据/候选：auto_play、用户 play、首帧本来黑、帧和时间、容器尺寸/覆盖；audio-only ready 没画面可正常。

分支与修复：没点击play→点击；源首帧黑→看后续；容器0/遮盖→修布局；audio-only保持无视频正确性。有进度/帧计数但画面冻结时对照实际呈现及预期变化的像素，HLS继续D21，不凭时间走动排除故障。

复测/转交边界：真实frame/pixel+时间推进，区分有帧内容黑与没有解码。 超出此证据适用范围时按共同停止条件转交。

## D16 自动播放被拒绝

优先证据/候选：用户手势、有声/静音、iframe政策；给播放按钮，不关闭浏览器安全。

分支与修复：提供同步用户点击，保留音轨静音先播；iframe权限限定修；不移除浏览器策略。

复测/转交边界：真实点击→帧推进；如需声音用手势解锁、静音自动播与有声分别验证。 超出此证据适用范围时按共同停止条件转交。

## D17 有画面无声

优先证据/候选：本身无音轨、ignore_audio、静音、音量、AudioContext、audioState/编码支持。

分支与修复：先本地轨道，再ignore_audio/voice/muted、gesture、audioState；不把unknown当无音轨。低输入RMS、抽样静音和增益是否正确按[音频证据边界](routes.md)分开判断，不因进程静音断言SDK无音频。

复测/转交边界：静音下解码/输出时钟证据；主观听感未测写明，不开扬声器自动测试。 超出此证据适用范围时按共同停止条件转交。

## D18 set_voice 后仍无声

优先证据/候选：没有初始化音轨需重建；用户手势/手势丢失单独检查；不能擅自补静音音轨。

分支与修复：ignore_audio需要完整release/rebuild保留配置；网络await丢gesture改同步按钮路径。

复测/转交边界：重建后音轨仍在、用户音量恢复，另一个实例不中断。 超出此证据适用范围时按共同停止条件转交。

## D19 只有音频/视频或音频解码报错

优先证据/候选：实际轨道、错误 trackType、AAC/G711/Opus/PCM所属核心；音频降级不假称完整AV成功。

分支与修复：按trackType和route具体audio编码分支；允许视频-only降级时明确记录，不能宣称AV。

复测/转交边界：实际音频输出/轨道和视频分别验收；不可用audioState带原因。 超出此证据适用范围时按共同停止条件转交。

## D20 无音轨 FLV 卡住起播

优先证据/候选：FLV头/元数据/版本；核对 E14，不用补音轨掩盖元数据 gate问题。

分支与修复：确认真实无音轨和头/元数据矛盾、实际版本；最小FLV复现交维护者，不凭空补音轨。

复测/转交边界：无音轨原片能起播的版本记录；升级须具体修复证据。 超出此证据适用范围时按共同停止条件转交。

## D21 HLS 清单能取但无帧

优先证据/候选：master/media/首片、有效内容、CODECS、相对URL/重定向、签名和CORS；读取 unsupportedFeatures。

分支与修复：playlist200后跟实际variant/首segment/持续刷新；修最终基准/签名子请求/CORS。区分加载策略阻断、分片尚未积累与真正冻帧；实际`mse_hls`等路线的H.264随机访问标记按[协议专项](routes.md)核对，不能由配置名认定native或先改播放器PTS。

复测/转交边界：首片有效+真实帧+路由snapshot；清单能取不能算HLS通过。 超出此证据适用范围时按共同停止条件转交。

## D22 HLS-fMP4/加密/LL-HLS 不行

优先证据/候选：EXT-X-MAP/KEY/PART/BYTERANGE/替代rendition；native和JS路线边界；不推荐已移除legacy。

分支与修复：读取unsupportedFeatures；native可用另验，JS拒绝边界如实；不能删标签/恢复ext。

复测/转交边界：具体native/JS actual route与样本；支持要求超出则转能力需求。 超出此证据适用范围时按共同停止条件转交。

## D23 HLS 延迟/直播seek失败

优先证据/候选：target duration、窗口、GOP、原生seekable或已缓存范围；HLS切片延迟不是固定SDK bug。

分支与修复：源端target duration/GOP与播放窗口定位；seek只走实际seekable/已缓存范围。

复测/转交边界：直播延迟定义源端与呈现时间，记录单位；不固定认定SDK延迟。 超出此证据适用范围时按共同停止条件转交。

## D24 WS 连上但没画面

优先证据/候选：101/Upgrade、Origin、二进制 payload、媒体头、codec/关键帧；关闭原因及代理缓冲。

分支与修复：101后校验二进制头、参数集/关键帧；代理Upgrade/Origin/缓冲分开处理。

复测/转交边界：真实payload+首帧+断开原因；连接状态不当播放证据。 超出此证据适用范围时按共同停止条件转交。

## D25 RTSP/RTMP 摄像头地址无法播

优先证据/候选：浏览器不能直接把这些地址当普通 video；现有服务器转发成可接收拉流协议。

分支与修复：使用现有授权服务器转为HTTP/WS FLV/TS/HLS/WHEP等当前入口，不在video.src填RTSP。

复测/转交边界：确认真实流注册和接收协议；不擅自改变用户生产流。 超出此证据适用范围时按共同停止条件转交。

## D26 localhost 别人电脑打不开

优先证据/候选：浏览器/推流工具各自的127.0.0.1含义、监听、防火墙、实际服务器地址。

分支与修复：将浏览器中的127.0.0.1换正确服务器地址；核对监听/防火墙/证书/CORS。

复测/转交边界：第二设备实际访问，不从开发机器curl推导远端可达。 超出此证据适用范围时按共同停止条件转交。

## D27 直播一直等数据/黑屏

优先证据/候选：流是否存在、推流断开、关键帧与参数集；连接/HTTP200不是已推流证明。

分支与修复：先流存在/推流状态；等待或修关键帧/参数集、断流及时间线；测试推流只在授权隔离流。

复测/转交边界：真header/keyframe/出帧持续推进；无流等待是正常状态。 超出此证据适用范围时按共同停止条件转交。

## D28 WebRTC 信令成功但无帧

优先证据/候选：WHEP/WHIP、SDP方向与编码、ICE/DTLS/TURN、防火墙；连接成功不等于解码成功。

分支与修复：区分WHIP推流/WHEP播放；SDP recv方向、ICE/DTLS/codec；按部署实际TURN诊断。

复测/转交边界：实际接收/解码帧与selected candidate；SDP/内网信息仅本地，不伪造TURN。 超出此证据适用范围时按共同停止条件转交。

## D29 WebRTC 无音轨/1x/seek拒绝

优先证据/候选：协商部分AV和固定直播合同，控件禁用并解释；不强开encoded逃避协商问题。

分支与修复：按真实协商轨道显示AV/video/audio-only；禁直播seek/rate；encoded非普通信令兜底。

复测/转交边界：1x/no seek合同与实际轨道复测；未协商音频不是set_voice能修复。 超出此证据适用范围时按共同停止条件转交。

## D30 裸流播放失败

优先证据/候选：实际ES/Annex-B、参数集、帧边界/帧率、媒体后缀；不套moov和MP4音轨规则。

分支与修复：确认HEVC Annex-B与VPS/SPS/PPS/关键帧；fps来自源端；明确raw格式提示。

复测/转交边界：raw实际解码/呈现，不能用MP4 moov或推定fps证明有效。 超出此证据适用范围时按共同停止条件转交。

## D31 播放卡顿/内存增长/多路黑屏

优先证据/候选：输入码率/分辨率/fps、actual core、网络下载、队列、GPU context、单实例对照、释放。

分支与修复：同源单实例对照CPU/网络/GPU/context/队列/释放；源降码率等单独实验。

复测/转交边界：相同分辨率/fps/core/并发采样；缩canvas不假称降低解码成本。 超出此证据适用范围时按共同停止条件转交。

## D32 A/V不同步或短循环跳动

优先证据/候选：输入PTS/DTS、GOP/循环边界、实际音频输出/视频呈现；区分时间单位和服务端时间线。

分支与修复：检查输入PTS/DTS/GOP/循环边界与实际输出；标明秒/ms，不能用on_play_time伪作AV误差。 若帧数增长而media.currentTime几乎不动，按[上游时间线压缩](upstream-timestamps.md)对照源FLV/配置tag与服务端TS的DTS跨度及运行二进制身份，区分已验证修复与未部署服务，不盲目换mode或改播放器时钟。

复测/转交边界：区分起播短测/长播漂移，有限采样实音频clock与视频呈现，未测不承诺。 超出此证据适用范围时按共同停止条件转交。

## D33 seek后旧画面/重复回调

优先证据/候选：秒与毫秒、目标范围、关键帧/索引、媒体代次、实际帧及完成回调；不加setTimeout假修复。

分支与修复：公开seek参数秒、有效范围、索引/GOP、代次；旧回调隔离，核对真实目标帧，有声播放还要核对其后的新音频输出。暂停恢复旧位置、即时seek、自然片尾重播与片尾显式seek分别判断；回调不能代替呈现证据，宿主不复制SDK私有音频对齐或队列补丁。

复测/转交边界：seek完成+目标帧及适用的新音频，保留暂停/播放意图并核对独立instance；不能setTimeout掩盖旧队列。 超出此证据适用范围时按共同停止条件转交。

## D34 React/Vue重复播放、关闭仍拉流

优先证据/候选：生命周期、StrictMode/KeepAlive、SDK loader、旧授权请求、release完成与资源计数。

分支与修复：同步cleanup失效，release(callback)完成后复用DOM；KeepAlive按业务暂停/释放；取消授权。若业务回调内同步release/change_media，后续旧会话工作也应失效；SDK内部回调重入修复不转为宿主私有Worker操作。

复测/转交边界：快速挂卸/源切换、StrictMode、释放中重建、双实例彼此独立；请求/worker清理。 超出此证据适用范围时按共同停止条件转交。

## D35 换MP4/WebM/FLV后失败

优先证据/候选：旧format/protocol提示、全量业务配置、换源串行、旧回调；不反复重用过期token。

分支与修复：旧format_type等不得沿用；保存完整业务config/voice/rate，串行release→新build。

复测/转交边界：MP4↔WebM↔FLV真实源分别检查；A→B→C最终仅C，token新授权。 超出此证据适用范围时按共同停止条件转交。

## D36 resize/弹窗有声无画

优先证据/候选：DOM可见尺寸、父容器高度、observer、零尺寸、布局覆盖。

分支与修复：DOM隐藏0宽/父高不足/遮盖→等实际visible尺寸与observer；不强建到空容器。

复测/转交边界：弹窗打开/关/再开与resize实际画面，cleanup disconnect observer。 超出此证据适用范围时按共同停止条件转交。

## D37 截图黑/空/异步迟到

优先证据/候选：首帧、对应实例imgId、纹理/跨域读取、异步Worker结果；不是返回一个同步URL的API。

分支与修复：首帧后请求、唯一imgId、CORS可读、Worker晚回调代次；不假定同步返回URL。

复测/转交边界：图像加载且可见像素；关闭/重建时旧截图不更新新UI。 超出此证据适用范围时按共同停止条件转交。

## D38 全屏无效/VR全屏平面

优先证据/候选：用户点击、容器归属、浏览器能力、iframe权限、video-only全屏限制。

分支与修复：点击同步fullScreen、SDK所属容器、iframe allowfullscreen；VR需显示容器，不只video。

复测/转交边界：实际fullscreenElement与ERP显示，权限拒绝保持播放。 超出此证据适用范围时按共同停止条件转交。

## D39 SEI/低层回调没输出

优先证据/候选：源是否真的有SEI、绑定时机、回调合同与actual core；不能伪造原生NAL/YUV事件。

分支与修复：源真SEI与合适callbacks/core，build前绑定；选核变化单独记录，不伪造native数据。

复测/转交边界：原带SEI源/compatible actual core与ms时间戳；无码数据给源端/能力说明。 超出此证据适用范围时按共同停止条件转交。

## D40 VR畸变/打不开/不能拖动

优先证据/候选：真单目ERP、projection、公开方法版本、mouse/touch、CORS/GPU/error fallback。

分支与修复：真单目ERP与projection/controls、实际API版本；CORS/GPU/nonfatal fallback区分。

复测/转交边界：暂停转视角/输入/reset/截图，媒体时钟不推进；VR降级不重建/选核。 超出此证据适用范围时按共同停止条件转交。

## D41 旧missile/ext资源404或512MB建议无效

优先证据/候选：当前/历史SDK分开，解释迁移，不混装旧资源及当前三件。

分支与修复：旧missile/ext与主线三件分开；当前不补旧资源，不照搬旧固定512MB规则。

复测/转交边界：实际版本/脚本图无混装；老项目迁移明确对应release。 超出此证据适用范围时按共同停止条件转交。

## D42 音量忽大忽小/希望超分

优先证据/候选：普通音量控制已有；稳定音量已在当前构建实现，封版732e173尚无该API，超分在当前构建为实验性WebGL2能力，旧版缺API；说明能力边界及需求反馈。

分支与修复：普通音量先set_voice；均衡先检查实际新版API/active state；旧版本和超分按当前实验性SR合同定位。

复测/转交边界：requested strategy与实际输出分开；没API不添加臆造参数，转版本/功能需求。 超出此证据适用范围时按共同停止条件转交。


## D43 超分勾选后未active/档位为空

先区分接口不存在、请求true、warming与实际active。取公开state的reason/source/output/options/targetKey及每源SDR证据；unknown/HDR/宽色域/ERP/显示需求/尺寸/预算/descriptor分支见[增强合同](enhancements.md)。不得为active换核心或改时钟。复测原媒体继续出帧、声音/音量不变，必要时交可复现状态草稿。

## D44 超分模型请求失败/旧WASM旁路

检查同构建三件及完整models/sr/manifest/weights/hash/license，浏览器最终状态、MIME、CORS/CSP；令牌不额外预取。旧WASM缺descriptor应保留原画而非强开sdr。修资源后由用户明确重试；关闭/旁路零无限请求，release后迟到模型不能恢复active。

## D45 renderer-recreate-required

已存在C++renderer中途请求SR的合同，不是媒体fatal。解释需要创建新renderer；只在用户明确点击后完整release→build/load保留voice/策略/媒体配置。未点击时核心、媒体请求和公开秒时钟不变。不能用自动rebuild循环获取active。

## D46 换源/KeepAlive后旧增强状态/音量复位

对照当前host会话与SR generation/attachment/revision；停止旧轮询/订阅、丢迟到模型和旧状态，先清actual快照再挂新源。保存用户voice与策略开关，未知新源撤销SDR声明/旧target，不跨实例共享sessionState。分别测试StrictMode、KeepAlive/路由、A→B→C和另一实例继续。无法确认时附最小复现与unknown，不访问私有队列。
