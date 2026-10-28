# 资源与部署

先看用户工程的资源目录与base路径，SDK三件来自同一构建。媒体独立解析成完整URL；`base_url`也影响媒体，不能把业务媒体误放到SDK CDN下。

新建模板：原生生成的 `serve.py` 支持有限Range、正确MIME、COOP/COEP；Vite模板有dev响应头，Next/Nuxt有各自配置。生产构建目录不自动继承开发服务器响应头。`python3 -m http.server`不能作为pthread/Range部署已通过的证明。

页面使用HTTP(S)，不是file://。localhost与远程普通HTTP的安全上下文不同。运行示例后访问命令输出的本机URL；远程机器上的浏览器应使用实际服务器地址与适用HTTPS。

典型隔离头在**页面响应**设置：

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

只有相应软件路线需要时才调整，检查其完整资源集合、iframe/Permissions-Policy与第三方依赖。不要默认改整站OAuth popup/跨域策略。浏览器Console检查 `({secure:isSecureContext, isolated:crossOriginIsolated, sab:typeof SharedArrayBuffer})`；CORS本身不等于隔离。

具体排查：

1. Network中JS/glue必须是真脚本，WASM需 `application/wasm`、真实 `00 61 73 6d` 字节和完整长度，200登录页/SPA HTML是失败。
2. Vite等通常把public文件作为根URL公开，不添加`/public/`。深层SPA路由、部署子路径、CDN版本与Service Worker分别核对。
3. SSR不执行SDK顶层导入；Blob Worker内部加载glue。别猜一个不存在的独立worker.js。
4. CSP按Console核对脚本、worker blob、WASM编译与connect/media来源，修改对应策略，不关闭全部保护。
5. HTTPS页面的最终媒体/WS用HTTPS/WSS；检查证书、mixed content和302最终跳转。
6. flat可以显示跨域video，不代表截图/ERP可读取纹理。视频起初未按CORS加载时，运行中不能无损变成可读来源。
7. Range看实际GET的206与Content-Range，不只看HEAD或Accept-Ranges。CDN/代理/重定向后也需核对。
8. 一次性token的测试会消费授权：不要先探测同一URL再用于播放；每次单独授权，子playlist/segment的签名按服务端合同。

独立演示目录的Nginx示意（需合并用户现有配置，不能擅自改生产服务器）：

```nginx
location /demo/ {
    add_header Cross-Origin-Opener-Policy same-origin always;
    add_header Cross-Origin-Embedder-Policy require-corp always;
    try_files $uri $uri/ =404;
}
```

MIME map另确保JS和WASM正确；外部资源CORS/CORP是另一项配置。WS代理需要Upgrade与连接超时设置，不只是CORS。curl成功不能证明浏览器策略成功；Auto/native成功也不能证明WASM后备已验证。

官方依据：[COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy)、[Worker/CSP](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)、[Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Range)、[Vite headers](https://vite.dev/config/server-options.html#server-headers)。
