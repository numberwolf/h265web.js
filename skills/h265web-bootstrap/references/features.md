# VR、SEI与播放控件

## ERP360

真实单目等距柱状ERP源，不凭尺寸/文件名自动识别。`projection:'erp360'`启用，普通flat保持普通视频。VR不增加解码能力；不支持Cubemap/立体VR/WebXR/陀螺仪。输入controls默认关闭，按需求启用。

```js
// Existing public methods, not new wrapper API.
player.set_projection('erp360');
player.set_vr_controls({mouse:true, touch:true});
player.set_vr_view({yaw:90, pitch:10, fov:75});
player.rotate_vr_view({yaw:5});
player.reset_vr_view();
const requested = player.get_vr_view();
```

yaw/pitch/fov是角度，数值有限；pitch限[-85,85]、垂直fov[30,120]。setter返回接受请求，不保证ERP实际显示；getter是请求状态。`domain:'vr',fatal:false,fallback:'flat'`表示显示降级，保留解码/时钟；不要重载媒体或改core。

URL native在首次ERP加载前设置CORS，跨域服务必须允许读取；已用非CORS加载的视频不能无损获得纹理权限。源纹理太大、context loss、shader失败、CORS不同runbook处理；缩小canvas不减源解码成本。

scaffold `--scenario vr360 --media 已确认ERP文件或URL`。已有真实ERP源可在相同公开生命周期播放直播；不要把普通直播样片标成全景。截图捕获实际展示，暂停转视角不应推进媒体时间。

## SEI与低层回调

只在用户要求时绑定`video_sei_raw_callback(raw,pts,dts,codec)`或`video_sei_text_callback(text,pts,dts,codec)`；时间戳毫秒，codec为264/265。源本身须携带SEI。原生不可提供某低层数据时不能伪造；绑定回调会影响选核，尤其NAL/YUV/render/queue/GPU/A-V。基础模板不“全部打开调试”。

## 通用控件

play/pause、音量/可逆静音、进度、seek、rate、resize、截图/fullscreen按路线能力。`ignore_audio`不是静音；开声要在用户点击中解锁。截图需要独立已有imgId，Worker可以异步，不能假设同步返回dataURL。native逐帧是1/fps近似；RTC不支持。

SDK ordinary stop不是通用释放；用release完成语义。队列/GPU查询仅适用核心，纹理尺寸不是显存容量。当前稳定音量与实验性超分见[增强合同](enhancements.md)；旧版缺API禁用控件继续播放。DRM/DASH/音轨字幕切换不添臆造参数。
