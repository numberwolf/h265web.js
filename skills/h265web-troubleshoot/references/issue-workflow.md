# 未解决时的 Issue 闭环

先交付本地草稿。打开[SDK Issues](https://github.com/numberwolf/h265web.js/issues)，登录GitHub；有New issue入口时按页面真实模板创建。若提示创建受限、按钮缺失或无账号，保留草稿并交由有权限者提交，或使用仓库实际提供的联系入口。不要承诺人人有权限，不替用户发送。

标题：`[协议/框架] 具体触发动作后实际失败（SDK版本）`。
最低可用反馈：实际/预期、SDK来源及浏览器、可复制步骤、首个错误；其他填unknown，不阻塞反馈。

```markdown
## 现象
实际：
预期：
频率/从哪个版本开始：
## 环境
SDK来源/提交/三件hash（未知写unknown）：
浏览器/系统/设备，框架/构建工具，开发/生产及页面子路径：
安全上下文/crossOriginIsolated，媒体服务器（相关才写）：
## 最小复现
1. 启动命令/页面。
2. 有权限的测试媒体或自生成素材。
3. 点击/seek/换源/关闭动作与等待。
最小代码、完整build配置、已绑定回调：
## 媒体/实际路线
容器/视频音频编码/profile/pix_fmt/尺寸fps/音轨：
VOD/live/协议，请求core/actual core：
ffprobe摘要，相关时moov顺序/Range：
## 增强（相关才填）
稳定音量请求/实际status/active/reason、用户voice：
SR请求/实际status/reason/source/output/options/targetKey、模型hash及每源SDR证据：
## 证据与对照
首个错误/code/type/status/domain（保留形状）：
最终Network状态/MIME/Content-Range与redirect：
script/probe/ready/play/真实首帧时序（单位）：
尝试的一项变化与复测结果：
seek/换源/释放/其他实例：
仍unknown：
## 附件
可公开小样本、自生成方式、脱敏最小日志/截图：
```

`format-report.py`按允许字段生成草稿；缺项保留unknown，错误check保留exit，不声称根因已证实。输出仅本地，已有输出拒绝覆盖。

公开前人工检查URL path/query、token、cookie/header、账号、文件绝对路径、SDP/candidate/内网地址、私人媒体/截图。优先可公开小样本。原日志留本地；不要把密码签名藏在截图中。已提交后维护者有明确修复证据才更新知识，未经确认评论不是默认修复规则。
