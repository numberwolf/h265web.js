# Angular / Svelte / 其他浏览器框架

新工程生成器包含Angular和Svelte最小demo；它们是独立应用示例，不把新版本写法硬套旧工程。已有工程先读package/version/SSR与生命周期。

Angular：DOM/视图可用后创建（版本适用的ngAfterViewInit或afterNextRender）；SSR显式guard。ngOnDestroy/DestroyRef清理SDK、监听和旧异步任务。频繁frame/progress不驱动整个应用检查。示例采用standalone组件与公开生命周期，不替换Angular CLI生产体系；已有AOT工程使用其正常编译器/注入方式。

Svelte：onMount同步返回cleanup，在回调内启动异步工作；async onMount返回Promise会丢失正常cleanup合同。DOM用bind:this；源变化使旧会话失效；适配项目当前响应式模式。SvelteKit另按SSR隔离，禁止server load求值SDK。

Preact/Solid/Lit等：读取相应版本官方生命周期，保留宿主所有权、共享脚本、独立实例、失效代次、release完成原则。不能机械套React effect依赖数组或deep reactive。没有对应实跑模板的框架标为需项目验证，仍可以按现有项目实现，不虚构官方SDK组件包。

React Native、小程序、Flutter不是普通浏览器环境；WebView/Electron也需确认浏览器codec/隔离/Worker/CSP。明确运行环境后再给接入路径，不声称浏览器模板直接兼容这些平台。

官方：[Angular生命周期](https://angular.dev/guide/components/lifecycle)、[Svelte生命周期](https://svelte.dev/docs/svelte/lifecycle-hooks)。
