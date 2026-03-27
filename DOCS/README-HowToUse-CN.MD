# `h265web.js PRO` 使用说明

> 这是面向实际接入的离线说明文档。它把官网 Docs 的核心内容做了汇总，避免官网不可用时用户完全没有使用参考。

## 这份文档讲什么

这份文档只聚焦最实用的公开浏览器 SDK 使用流程：

1. 准备运行时文件
2. 创建播放器容器
3. 构建播放器
4. 绑定最小必需回调
5. 加载媒体
6. 播放、暂停、Seek、截图、全屏、切换媒体

如果你只想最快把播放器跑起来，先看这一份就够了。

## 1. 需要哪些运行时文件

浏览器侧正常播放通常需要以下文件：

- `h265web.js`
- `h265web_wasm.js`
- `h265web_wasm.wasm`
- `extjs.js`
- `extwasm.js`

一个常见的本地目录结构如下：

```text
root/
├── index.html
├── index.js
├── resource/
│   └── demo.mp4
└── output/
    ├── h265web.js
    ├── h265web_wasm.js
    ├── h265web_wasm.wasm
    ├── extjs.js
    └── extwasm.js
```

## 2. 路径规则

SDK 资源路径和媒体路径都支持三种写法：

- 完整 URL：`https://example.com/output/h265web_wasm.js`
- 站点绝对路径：`/output/h265web_wasm.js`
- 相对路径：`./output/h265web_wasm.js`

如果四个 SDK 运行时文件都放在同一个目录，推荐使用 `base_url`，然后各文件只保留短文件名。

## 3. 最小 HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>h265web.js PRO Demo</title>
    <script src="./output/h265web.js"></script>
  </head>
  <body>
    <div id="canvas111"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

## 4. 最小可运行流程

推荐的公开接入流程是：

1. 创建播放器对象
2. 绑定回调
3. 调用 `build(config)`
4. 调用 `load_media(mediaUrl)`
5. 让 `auto_play` 自动播放，或者在首帧就绪后再手动 `play()`

## 5. 最小可运行示例

```js
const ylplayer = H265webjsPlayer();

ylplayer.on_ready_show_done_callback = function () {
  console.log('first frame ready');
};

ylplayer.video_probe_callback = function (mediaInfo) {
  console.log('media info', mediaInfo);
};

ylplayer.build({
  player_id: 'canvas111',
  base_url: './output/',
  wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm',
  ext_src_js_uri: 'extjs.js',
  ext_wasm_js_uri: 'extwasm.js',
  width: '100%',
  height: 480,
  color: '#101318',
  auto_play: true,
  readframe_multi_times: -1,
  ignore_audio: false
});

ylplayer.load_media('./resource/demo.mp4');
```

## 6. 两个最先要接的回调

这两个是最小必需回调，建议最先接上。

### `on_ready_show_done_callback`

首帧已经准备好并且显示出来时触发。

```js
ylplayer.on_ready_show_done_callback = function () {
  console.log('on_ready_show_done_callback');
};
```

### `video_probe_callback(mediaInfo)`

媒体探测完成后触发，可以拿到基础流信息。

```js
ylplayer.video_probe_callback = function (mediaInfo) {
  console.log('video_probe_callback', mediaInfo);
};
```

## 7. 其他常用回调

如果你需要播放进度、缓存状态、Seek 状态、播放完成状态，可以继续接这些：

```js
ylplayer.on_cache_process_callback = function (timestamp) {
  console.log('on_cache_process_callback', timestamp);
};

ylplayer.on_load_caching_callback = function () {
  console.log('on_load_caching_callback');
};

ylplayer.on_finish_cache_callback = function (data) {
  console.log('on_finish_cache_callback', data);
};

ylplayer.on_play_time = function (pts) {
  console.log('on_play_time', pts);
};

ylplayer.on_play_finished = function () {
  console.log('on_play_finished');
};

ylplayer.on_seek_start_callback = function (seekTarget) {
  console.log('on_seek_start_callback', seekTarget);
};

ylplayer.on_seek_done_callback = function (seekTarget) {
  console.log('on_seek_done_callback', seekTarget);
};
```

## 8. `build(config)` 常用字段

### 常用配置项

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `player_id` | `string` | 是 | 播放器容器元素 id |
| `wasm_js_uri` | `string` | 是 | `h265web_wasm.js` 路径 |
| `wasm_wasm_uri` | `string` | 是 | `h265web_wasm.wasm` 路径 |
| `ext_src_js_uri` | `string` | 否 | `extjs.js` 路径 |
| `ext_wasm_js_uri` | `string` | 否 | `extwasm.js` 路径 |
| `base_url` | `string` | 否 | 四个 SDK 运行时文件的统一基准路径 |
| `width` | `number \| string` | 否 | 播放器宽度 |
| `height` | `number \| string` | 否 | 播放器高度 |
| `color` | `string` | 否 | 播放器背景色 |
| `auto_play` | `boolean` | 否 | 媒体就绪后自动播放 |
| `readframe_multi_times` | `number` | 否 | demux 读取倍率 |
| `ignore_audio` | `boolean` | 否 | 是否忽略音频 |
| `core` | `string` | 否 | 显式指定内核：`mse_hevc`、`wasm_hevc`、`webcodec_hevc` |
| `media_uri` | `string` | 否 | 可选媒体地址，但公开接入仍推荐 `build()` 后再 `load_media()` |

### 推荐公开接入方式

即使 `media_uri` 可用，最稳的公开用法依然是：

```js
ylplayer.build(config);
ylplayer.load_media(mediaUrl);
```

这样播放器创建和媒体加载是分离的，也更符合当前 docs 和公开 demo 的写法。

## 9. 最常用的方法

### 加载和释放

```js
ylplayer.load_media('./resource/demo.mp4');
ylplayer.change_media('./resource/another-demo.mp4');
ylplayer.release();
```

### 播放控制

```js
ylplayer.play();
ylplayer.pause();
ylplayer.seek(10);
ylplayer.set_playback_rate(2.0);
ylplayer.set_voice(0.5);
ylplayer.set_mute();
```

### 工具方法

```js
ylplayer.next_frame();
ylplayer.resize(640, 480);
ylplayer.fullScreen();
ylplayer.closeFullScreen();
ylplayer.screenshot('screenshot');
```

截图示例：

```html
<img id="screenshot" style="width:400px;height:340px;background:#e9e9e9;" />
```

## 10. 内核选择

如果你想强制指定播放路径，可以设置 `core`。

```js
ylplayer.build({
  player_id: 'canvas111',
  base_url: './output/',
  wasm_js_uri: 'h265web_wasm.js',
  wasm_wasm_uri: 'h265web_wasm.wasm',
  ext_src_js_uri: 'extjs.js',
  ext_wasm_js_uri: 'extwasm.js',
  core: 'webcodec_hevc'
});
```

当前公开使用的核心取值：

- `mse_hevc`
- `wasm_hevc`
- `webcodec_hevc`

如果不显式设置 `core`，SDK 会自动选择。

## 11. 本地示例

### `index.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>h265web.js PRO Demo</title>
    <script src="./output/h265web.js"></script>
  </head>
  <body>
    <div id="canvas111"></div>
    <button id="play_btn" onclick="play()" disabled>PLAY</button>
    <button id="pause_btn" onclick="pause()" disabled>PAUSE</button>
    <button id="voice_btn" onclick="setVoice()" disabled>VOLUME</button>
    <script src="./index.js"></script>
  </body>
</html>
```

### `index.js`

```js
let ylplayer = null;
const mediaUrl = './resource/hevc_test_moov_set_head_16s.mp4';

function createPlayer(core = null) {
  if (ylplayer) {
    ylplayer.release();
    ylplayer = null;
  }

  ylplayer = H265webjsPlayer();

  ylplayer.on_ready_show_done_callback = function () {
    document.getElementById('play_btn').disabled = false;
    document.getElementById('pause_btn').disabled = false;
    document.getElementById('voice_btn').disabled = false;
  };

  ylplayer.video_probe_callback = function (mediaInfo) {
    console.log('mediaInfo', mediaInfo);
  };

  ylplayer.on_play_time = function (pts) {
    console.log('play pts', pts);
  };

  const playerConfig = {
    player_id: 'canvas111',
    base_url: './output/',
    wasm_js_uri: 'h265web_wasm.js',
    wasm_wasm_uri: 'h265web_wasm.wasm',
    ext_src_js_uri: 'extjs.js',
    ext_wasm_js_uri: 'extwasm.js',
    width: '100%',
    height: 480,
    color: '#101318',
    auto_play: true,
    readframe_multi_times: -1,
    ignore_audio: false
  };

  if (core) {
    playerConfig.core = core;
  }

  ylplayer.build(playerConfig);
}

function buildPlayer(core = null) {
  createPlayer(core);
  ylplayer.load_media(mediaUrl);
}

function play() {
  ylplayer && ylplayer.play();
}

function pause() {
  ylplayer && ylplayer.pause();
}

function setVoice() {
  ylplayer && ylplayer.set_voice(1.0);
}

window.onload = function () {
  buildPlayer();
};
```

## 12. 常见接入注意事项

### 不要直接用 `file://`

请通过正常静态 Web 服务打开页面：

```bash
python3 -m http.server 8080
```

### 资源路径尽量保持统一

最省事的写法通常是：

- `base_url: './output/'`
- `wasm_js_uri: 'h265web_wasm.js'`
- `wasm_wasm_uri: 'h265web_wasm.wasm'`
- `ext_src_js_uri: 'extjs.js'`
- `ext_wasm_js_uri: 'extwasm.js'`

### 自动播放仍可能受浏览器策略影响

即使设置了 `auto_play: true`，某些浏览器场景下仍可能要求用户先交互。

### 先 `build`，再 `load_media`

公开接入和排障时，建议始终保持这个顺序：

```js
ylplayer.build(config);
ylplayer.load_media(mediaUrl);
```

### 先确认最小回调，再扩展逻辑

如果你在调一个新页面，建议先确认：

- `video_probe_callback`
- `on_ready_show_done_callback`

这两个回调正常后，再继续往 Seek、缓存、UI 状态逻辑上加。

## 13. 快速检查清单

- `./output/` 下 SDK 文件是否齐全
- 页面是否通过静态 Web 服务访问
- `player_id` 是否对应真实 DOM 元素
- `build(config)` 是否早于 `load_media(mediaUrl)`
- 是否接了 `video_probe_callback`
- 是否接了 `on_ready_show_done_callback`
- 媒体地址是否可访问
- 是否考虑了浏览器自动播放限制

## 14. 官方入口

如果官网可用，当前主要公开入口仍然是：

- 公开 Demo：`https://h265web.com/player.php`
- Docs：`https://h265web.com/markdown-docs/get-started.php`

保留这份文件，就是为了在这些页面不可访问时，依然有一份能独立使用的离线接入说明。
