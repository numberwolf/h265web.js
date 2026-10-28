# 鉴权、录像与多实例

先复用现有业务授权、录像元数据和下载链。前端SDK不应拿服务器secret或负责创建摄像头流。opaque录像URL由真实元数据选择format hint，不靠无后缀猜MP4；302后的最终媒体同样需权限/Range/CORS。

一次性播放token可能被任何预取请求消费。不要先curl/HEAD同一token再给SDK，不用已消费token自动retry。每次明确重试重新调用业务授权工厂；关闭/改源时AbortController取消，generation使旧授权响应失效，不能复活旧弹窗。HLSplaylist、segment、key等权限按服务端合同，不能假定所有query自动继承。

最小结构：

```text
显示独立modal容器 → 新会话generation → 取本次授权
  → 仍有效才host.setSource(授权URL,完整配置)
关闭/离页/重试 → 失效generation → abort授权 → host.dispose完成
  → 下一次重新授权/建立
```

多个modal/player都有唯一host和截图id，释放只针对所属会话。共享SDK加载可以，实例、回调和连接不共享。不能按document中重复id或全局“关闭所有播放器”处理单个失败。

PyMKUI场景：RTMP行映射HTTP-FLV，TS行映射HTTP-TS；H265 TS-HLS与H264原生HLS终止3/4后的单次SDK回退有各自业务边界；不要将它改成所有源错误无限切核。单文件录像ERP与全天双video跨片时间线不是同一功能；保留后者原业务，不用单文件验证宣称连续全天VR完成。

普通URL变换可以host完整重建；需要授权工厂的已有应用在外层管理，不把token写死到模板或随诊断公开。不要在等待授权后才第一次执行用户手势解锁。
