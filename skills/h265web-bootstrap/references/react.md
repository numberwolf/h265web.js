# React

新工程：scaffold `--framework react`，输出后 `npm install`、`npm run dev`。先用本地样片，不依赖不稳定远程CDN。已有工程沿用其React和构建工具版本，复制/适配 `assets/react/Player.jsx` 与common宿主，不覆盖package.json。

SDK实例/host放ref，React只持有业务UI状态。Effect挂载容器后创建host，异步setSource完成也要确认会话仍有效。cleanup同步使会话失效并启动dispose，不能写 `useEffect(async () => ...)` 或以返回Promise代替清理函数。

StrictMode开发会setup→cleanup→setup。宿主在同一DOM上按释放完成串行；不能只把ref置空就立即build新实例，旧release可能清新DOM。SDK loader共享而实例不共享，一个组件卸载不删其他组件脚本。

源/结构配置变化与音量/播放等控制分开。防止每次render产生新config对象导致播放器重建；callback读最新业务值，不捕获旧URL。快速A→B→C最终只建立当前会话。不同格式/协议使用全量配置新建，避免change_media保留旧提示。

模板UI外层管理控件，SDK独占host子DOM；不能让React重渲染video/canvas。进度节流，双实例各有id和截图目标。验证StrictMode、源变化、在脚本/授权等待中卸载、路由离开和另一实例不被释放。

SSR/Next还读ssr。官方机制：[useEffect](https://react.dev/reference/react/useEffect)。
