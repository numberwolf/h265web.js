# 用 AI Skill 接入和排查 h265web.js

[English](README.md) · [SDK 能力展示](../README_CN.MD#能力展示) · [试用播放器](https://h265web.com/player-cn.php)

Skill 是交给 AI 编程助手的一整套操作说明、参考资料和模板，帮助它生成或接入播放器、排查播放问题。浏览器仍需加载配套 JS/WASM SDK；skill 用于开发阶段。

## 1. 选哪个 skill

| 你想做什么 | 选择 | 准备什么 |
| --- | --- | --- |
| 新建 demo，或给现有项目接入播放器 | [h265web-bootstrap](h265web-bootstrap/SKILL.md) | 框架/版本、SDK 位置、媒体地址或本地样片、所需控件 |
| 黑屏、无声、加载失败、超分旁路或释放异常 | [h265web-troubleshoot](h265web-troubleshoot/SKILL.md) | 浏览器/版本、复现动作、实际 SDK URL、相关控制台与网络记录 |

接入 skill 提供原生 JS、React、Vue、Svelte、Angular、Next、Nuxt 七种模板；两套 skill 都了解音量均衡、实验性 SDR 超分、运行时操作及生效条件，会结合现有项目处理生命周期。

## 2. 安装完整目录

**Codex：把以下文字发到对话里，不是终端里执行。**

```text
使用 $skill-installer，从以下 GitHub 目录安装两套 skill：
https://github.com/numberwolf/h265web.js/tree/master/skills/h265web-bootstrap
https://github.com/numberwolf/h265web.js/tree/master/skills/h265web-troubleshoot
```

**手动 / 项目内安装：**在 GitHub 点击 **Code → Download ZIP** 下载仓库，或自行 clone。把完整的 `h265web-bootstrap` 和 `h265web-troubleshoot` 文件夹复制到项目的 `.agents/skills/`，供 Codex 发现。保留其中全部 `references/`、`scripts/`、`assets/`、`agents/` 文件，不要只复制 `SKILL.md`。目标已有同名目录时先对比版本。

```text
你的项目/
  .agents/skills/
    h265web-bootstrap/
      SKILL.md
      references/  scripts/  assets/  agents/
    h265web-troubleshoot/
      SKILL.md
      references/  scripts/  agents/
```

其他 AI 工具请按其本地 Agent Skills 目录或导入方式安装同样的完整目录。安装后确认 skill 列表中出现这两个名字；Codex 未发现时重启再试。安装位置与调用方式参见 [Codex 官方说明](https://developers.openai.com/codex/skills/)。

## 3. 直接发需求

Codex CLI/IDE 中可输入 `$` 或 `/skills` 选择；有 skill 选择器的客户端也可直接选中，或明确要求使用已安装的 skill 名称。

**生成 / 接入播放器：**

```text
使用 $h265web-bootstrap，给我的 React 项目接入 h265web.js。
先读取现有项目，使用项目配置的 SDK 位置与媒体地址。
需要播放/暂停、音量均衡和实验性 SDR 超分开关，
超分首次开启默认升一档，允许改自动。
保留用户音量与静音，处理组件卸载和重建，并验证实际播放。
```

**排查播放或增强问题：**

```text
使用 $h265web-troubleshoot，排查这个播放器为什么无声，
或者为什么超分一直显示旁路。先检查实际资源、音轨、
用户激活状态以及 SDK 的 status/reason，最小修复后复验原动作。
```

把 React 换成你的框架，补充实际项目位置、片源和 SDK 信息。不要把密钥或未脱敏的授权请求头贴进公开报告。

## 4. 应该拿到什么结果

修改文件、启动命令/URL、SDK/媒体配置及实际播放检查，包括相关暂停、seek、释放和重建。增强功能应展示实际处理状态、输出尺寸或旁路原因。两项效果默认关闭；超分需要兼容 SDR、模型、显示放大需求与 GPU 条件，需要重建渲染器时应有明确操作。

[运行时操作与条件](https://h265web.com/markdown-docs/zh/playback-enhancements.php) · [API 文档](https://h265web.com/markdown-docs/zh/api-docs.php)
