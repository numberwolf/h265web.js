# 一般问题汇总

> Q:为什么我按照 demo 集成到项目里面无法正常运行呢?

- A: 首先打开浏览器的控制台查看`network`选项卡是否加载了对应的`wasm`文件。如果加载了还是没有请确认浏览器
  由于`wasm`只支持现代浏览器对移动端的兼容可能不是那么友好,国内浏览器例如`360`,`搜狗`可能无法运行。请使用`Edge`或者
  `Chrome`

> Q:如何改变播放器的窗口大小呢?比如我想自定义播放器的`viewPort`?

- A: `PlayerConfig` 的`number`和`height`可能无法满足您的需求。这时候您需要手动获取播放器的实例也就是`PlayerConfig`里面的`player`的`DOM`元素。
  原生用户可以使用`document.querySelector(player容器的ID)`。使用现代框架的用户例如`vue`或者`react`可以通过`Ref`的方式进行获取。
  `Vue`用户请在`mounted`阶段获取元素对`dom`进行设置,`React`用户请在`useEffect`里面进行操作。

> Q: 我该如何在 Webpack 或者 vite 环境下使用该 SDK？

- A:基于`webpack`的工程例如`vuecli`,`create-react-app`可以把`dist`拷贝进你项目里面的静态目录下。一般是`public`目录。然后按照`exmaple`示例文件进行引入。
  请注意`index.html`文件。
  基于`Vite`的工程。就只能采用`window`的方式进行引入。因为`vite`无法识别非`esm`的模块。具体参照`vite_vue_ts`.

> Q: 我如果是使用 typescript 开发，我该如何获取类型提示?

- A: 本`SDK`提供了`d.ts`声明文件.您如果是`webpack`用户在引入`SDK`的时候会自动获取类型提示。`Vite`用户则需要把本项目 sdk 内置的`d.ts`导入到你自己的全局`d.ts`里面以获取类型支持。

> Q: 为什么我播放 h264 或者 h265 卡顿?

- A: 本`SDK`采用软解码,受限于用户设备,如果设备良好,请优先检查视频码率以及格式。

> Q: 我如果无法在该指南获取帮助,我该怎么获得帮助？

- A: 您可以通过`ISSUE`的方式,按照格式模板进行提问,或者加群`925466059`得到帮助。提问前请遵守提问的智慧。
