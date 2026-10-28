# Vue

新Vue3工程：scaffold `--framework vue`，然后npm install/dev。已有工程沿用Vue/构建版本；组件与composable不随意改变用户结构。

`onMounted`后使用DOM ref创建宿主；卸载前同步使会话失效并调用dispose。实例用局部变量、shallowRef或markRaw保存，避免把复杂SDK对象放进深reactive并deep watch。响应式变量用于ready/progress/error，进度节流。

watch URL/明确结构配置变化，每次按完整业务配置新建；不要同时onMounted和immediate watch重复load。v-if/弹窗等待实际可见尺寸。组件卸载后的旧SDK/授权回调不能更新状态。

模板在KeepAlive deactivated时释放、activated时重建；这是一种明确的示例策略。KeepAlive不是卸载：按业务决定deactivated暂停还是释放。若释放，activated重新加载当前源；若保持连接，暂停UI订阅/输入并保留实际媒体需求。两条路径都需要测，不能以onUnmounted一项代替。

Vue2适配mounted/beforeDestroy与非深代理实例，在现有Webpack/Vue CLI配置中提供资源；不为了复用Vue3模板升级用户工程。Nuxt另看SSR。

官方机制：[shallowRef/markRaw](https://vuejs.org/api/reactivity-advanced.html)、[KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html)。
