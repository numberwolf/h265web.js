# Next / Nuxt / SSR

SDK浏览器全局与DOM操作只在客户端挂载后执行。应用宿主模块可在SSR导入，因为顶层不访问window；它的create/load方法仍只能在浏览器调用。server render可输出尺寸稳定的占位，不输出服务端创建的player。

## Next

新工程可scaffold `--framework next`；client Player组件使用React生命周期。`'use client'`是边界，不是任意顶层SDK求值许可证。effect里动态加载浏览器脚本；不在server page/static import SDK。公开文件通常从public映射到站点URL，部署basePath时按真实地址调整。响应头配置见生成的next.config.mjs，生产同样需实际Network核对。

## Nuxt

scaffold `--framework nuxt`；ClientOnly/client组件与onMounted内加载。ClientOnly默认slot从server build排除；初始CSS与fallback需保持布局。不要把 `.client` 文件名误认为生成后资源一定存在，确认引用和实际mounted DOM。Nuxt版本不同，沿用用户插件/组件约定。

## 验证

SSR生产构建、首次hydration、浏览器导航、源变化、离页、再次进入。没有window服务端求值；SDK请求只有客户端发；旧实例释放后再使用相同host。Next/Nuxt可共享宿主代码，不共享实例或路由私有状态。

官方：[Next客户端边界](https://nextjs.org/docs/app/api-reference/directives/use-client)、[Nuxt ClientOnly](https://nuxt.com/docs/4.x/api/components/client-only)。

Nuxt新demo为本地样片生成`server/middleware/media-range.js`，浏览器URL为`/demo-media/sample.*`，磁盘仍在`public/media/`。这个独立路径避开Nitro静态200响应，提供有界单Range流；已有项目的媒体/CDN沿用其服务，不自动加入此中间件。生产部署需要保持`.output/server`与`.output/public`的相对位置；示例不支持edge runtime。
