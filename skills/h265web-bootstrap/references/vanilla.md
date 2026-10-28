# 原生 JavaScript / TypeScript

新工程运行本skill的 `scripts/scaffold.py --framework vanilla --output 新目录 --sdk-dir 实际SDK目录`，然后进入输出目录执行 `python3 serve.py`。生成器复制SDK三件和自生成的小MP4，不联网、不覆盖现有目录。目录里 `demo-config.js` 是修改SDK/媒体/配置的入口。完整帮助见 `--help`。

默认脚本是浏览器module；宿主在DOM可见后创建。`createPlayerHost`、`setSource`、`dispose`等属于附带应用封装，不是新增SDK接口。需要更简单HTML时可按sdk-contract直接使用公开API；保留释放完成、代次与唯一容器不变量。

按钮初期禁用或显示加载状态；请求被接受后允许用户点击播放，首帧ready仍单独显示，避免需要play才能出首帧却把按钮永久锁住。点播进度显示秒，seek不得超出已确认范围。直播/RTC不用点播进度与任意倍速控件。所有错误转换为用户可理解状态，完整细节留给诊断。

页面维护独立会话。改源/关闭时调用host.dispose并使旧异步失效；返回页面重新创建。事件监听与observer一同清理，不依赖beforeunload来保证SPA释放。模板提供基本播放控件和VR视角操作，未知功能先看features。

TS工程：声明 `window.H265webjsPlayer` 和用到的公开接口，不凭空声明uniform Promise或不存在的getter。用项目TS规范适配JS宿主文件，不要求升级语言工具。类型通过之后仍验证实际播放/卸载。
