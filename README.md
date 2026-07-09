# 📹 局域网视频中心 (LVC)
LAN Video Center

> 在你电脑上搭建一个轻量级的局域网视频服务，让手机、平板、电视等设备通过浏览器观看 MP4 视频，支持字幕自动加载。

基于 **Node.js** 和 **DPlayer**，支持视频列表浏览、点击播放、进度拖拽、字幕加载，界面纯白简洁。

---

## ✨ 特点

- 🚀 **高性能**：基于 Node.js + Express，支持流式传输和并发访问
- 📱 **多设备支持**：手机、平板、电脑均可通过浏览器访问
- 🎨 **简洁美观**：纯白界面，卡片式视频列表
- 🎯 **开箱即用**：只需把视频放到 `video/` 文件夹，一键启动
- 🖱️ **拖拽进度**：支持视频进度条拖拽（Range 请求）
- 🖼️ **智能封面**：自动生成视频缩略图，也可手动放置自定义封面
- 💬 **字幕支持**：自动加载同名字幕文件（`.vtt`）
- 🔍 **搜索功能**：快速筛选视频
- 📦 **轻量依赖**：仅需 Node.js 和 Express

---

## 📁 目录结构

```
lan-video-center/
├── video/              # 视频文件 (.mp4)
├── subtitles/          # 字幕文件 (.vtt)
├── thumbnails/         # 自动生成的封面
├── server.js           # 服务端代码
├── package.json        # 依赖配置
├── index.html          # 前端页面
└── README.md           # 本说明文档
```

---

## 📦 快速开始

### 1. 环境要求

- **Node.js** 16.0 或更高版本
  - 下载地址：[https://nodejs.org/](https://nodejs.org/)
  - 安装后在终端运行 `node -v` 检查是否成功

- **FFmpeg**（可选，用于自动生成封面）
  - 如果不安装，也可以手动放置封面图
  - Windows: 下载 https://ffmpeg.org/download.html
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

### 2. 下载项目

```bash
git clone https://github.com/WKAIYU/lan-video-center.git
cd lan-video-center
```

### 3. 安装依赖

```bash
npm install
```

### 4. 放入视频

在项目根目录下创建 `video/` 文件夹，将所有 `.mp4` 视频文件放进去：

```
lan-video-center/
├── video/             ← 创建这个文件夹，放入视频
│   ├── 电影A.mp4
│   ├── 电视剧B.mp4
│   └── 纪录片C.mp4
├── server.js
├── package.json
├── index.html
└── README.md
```

### 5. 启动服务

```bash
npm start
```

看到以下输出表示启动成功：

```
============================================================
📹 LVC - Lan Video Center 已启动
============================================================
  本地访问: http://127.0.0.1:8000
  局域网访问: http://[你的局域网IP地址]:8000
  视频目录: /path/to/lan-video-center/video
  字幕目录: /path/to/lan-video-center/subtitles
  缩略图目录: /path/to/lan-video-center/thumbnails
  按 Ctrl+C 停止服务
============================================================
```

### 6. 访问播放

- **本机访问**：浏览器打开 `http://127.0.0.1:8000`
- **局域网设备访问**：确保设备与电脑在同一 Wi-Fi 网络，浏览器打开 `http://你的电脑IP:8000`

点击任意视频卡片即可播放。

---

## 💬 字幕使用说明

### 使用方法

1. 在项目根目录创建 `subtitles/` 文件夹
2. 将字幕文件放入，**文件名需与视频文件同名**
   - 视频：`video/我的视频.mp4`
   - 字幕：`subtitles/我的视频.vtt`
3. 支持格式：`.vtt`

### 目录结构示例

```
lan-video-center/
├── video/
│   └── 我的视频.mp4
├── subtitles/         ← 创建这个文件夹，放入字幕
│   └── 我的视频.vtt
├── server.js
├── package.json
├── index.html
└── README.md
```

### 播放效果

- 视频卡片右上角会显示 **💬** 标签，表示该视频有字幕
- 播放时字幕自动加载
- DPlayer 播放器支持字幕开关和样式调整

---

## 🖼️ 封面（缩略图）配置

项目支持两种封面加载方式，**自动生成优先，手动放置作为备选**：

### 方式一：自动生成封面（推荐）

服务会自动从视频中提取某一帧作为封面图。

**前提条件**：需要安装 FFmpeg

- **Windows**：下载 [FFmpeg](https://ffmpeg.org/download.html)，解压后将 `bin` 目录添加到系统 PATH
- **macOS**：`brew install ffmpeg`
- **Linux**：`sudo apt install ffmpeg`

安装后，首次访问视频列表时，服务会自动生成缩略图并保存在 `thumbnails/` 目录中。

控制台会显示生成进度：
```
✅ 缩略图生成成功: 电影A.jpg
✅ 缩略图生成成功: 电视剧B.jpg
```

### 方式二：手动放置封面图

如果你想使用自定义封面，可以手动创建 `thumbnails/` 文件夹并放入图片。

**操作步骤**：

1. 在项目根目录创建 `thumbnails/` 文件夹
2. 为每个视频准备一张同名的 JPG 或 PNG 图片
   - 例如：`电影A.mp4` → `电影A.jpg`
   - 例如：`电视剧B.mp4` → `电视剧B.png`
3. 图片推荐尺寸：**320x180** 或 16:9 比例

```
lan-video-center/
├── video/
│   ├── 电影A.mp4
│   └── 电视剧B.mp4
├── thumbnails/        ← 手动创建，放入封面图
│   ├── 电影A.jpg
│   └── 电视剧B.jpg
├── server.js
├── package.json
├── index.html
└── README.md
```

### 封面加载优先级

系统按以下顺序查找封面：

1. **优先使用** `thumbnails/` 文件夹中已有的图片（手动放置的封面）
2. 如果 `thumbnails/` 中没有对应图片，**自动生成**（需要 FFmpeg）
3. 如果自动生成也失败，则显示默认的 🎬 图标

---

## 🔍 搜索功能

页面右上角提供搜索框，输入关键词即可实时筛选视频列表：

- 支持中文和英文搜索
- 匹配视频文件名（不含扩展名）
- 按 `ESC` 键快速清空搜索

---

## 🧩 如何找到电脑 IP 地址？

| 系统 | 方法 |
|------|------|
| **Windows** | 打开命令提示符（CMD），输入 `ipconfig`，找到 `IPv4 地址` |
| **macOS** | 打开终端，输入 `ifconfig` 或 `ip addr`，找到 `inet` 地址 |
| **Linux** | 打开终端，输入 `ip addr`，找到 `inet` 地址 |

> 启动服务时会自动显示局域网 IP，直接复制使用即可。

---

## ⚙️ 配置修改

### 修改端口号

编辑 `server.js` 文件中的 `PORT` 变量：

```javascript
const PORT = 8000;   // 改为你想要的端口号（如 8080、3000 等）
```

### 修改缩略图生成位置

编辑 `server.js` 文件中的 `THUMB_DIR` 变量：

```javascript
const THUMB_DIR = path.join(__dirname, 'thumbnails');   // 可改为其他路径
```

### 修改缩略图尺寸

编辑 `server.js` 中的生成参数：

```javascript
size: '320x180',  // 改为你想要的尺寸，如 '640x360'
```

---

## ❓ 常见问题

### Q: 手机访问不了怎么办？

1. 确保手机和电脑在 **同一个 Wi-Fi 网络** 下
2. 检查电脑防火墙是否允许 Node.js 入站连接（端口 8000）
3. Windows 防火墙设置：
   - 打开「Windows Defender 防火墙」
   - 点击「高级设置」→「入站规则」→「新建规则」
   - 选择「端口」→ 输入 `8000` → 允许连接
4. 尝试用电脑的局域网 IP 访问，不要用 `127.0.0.1`

### Q: 视频播放卡顿/不流畅？

- 尽量使用 **Wi-Fi 5G** 网络，或使用有线网络连接
- 大码率视频在无线传输时可能受限，可尝试压缩视频
- Node.js 版本已优化流式传输，比 Python 版本性能更好

### Q: 支持哪些视频格式？

- 目前仅支持 `.mp4` 格式
- **推荐编码**：H.264（视频）+ AAC（音频），这是浏览器兼容性最好的组合
- 其他格式（如 MKV、AVI）需先转换为 MP4

### Q: 如何转换视频格式？

使用免费工具 **HandBrake** 或 FFmpeg：

```bash
# FFmpeg 转换示例
ffmpeg -i input.mkv -c:v h264 -c:a aac output.mp4
```

### Q: 字幕不显示怎么办？

1. 检查字幕文件是否与视频**同名**
   - 视频：`video/我的视频.mp4`
   - 字幕：`subtitles/我的视频.srt`
2. 确认字幕文件格式是否为 `.srt`、`.ass` 或 `.vtt`
3. 检查字幕文件的编码是否为 UTF-8
4. 刷新页面后重新点击播放

### Q: 封面图不显示怎么办？

1. 检查 FFmpeg 是否正确安装（方式一需要）
   ```bash
   ffmpeg -version
   ```
2. 检查 `thumbnails/` 文件夹是否有写入权限
3. 手动放入一张图片测试（方式二）
4. 查看控制台是否有错误日志

### Q: 如何清除自动生成的封面？

直接删除 `thumbnails/` 文件夹即可，服务会在下次访问时重新生成。

### Q: 封面图太大影响加载速度怎么办？

- 修改 `server.js` 中的 `size` 参数为更小尺寸
- 或者使用方式二，手动压缩图片后再放入

---

## 📝 文件说明

| 文件 | 说明 |
|------|------|
| `server.js` | Node.js 服务端，提供视频列表 API、缩略图生成和视频文件服务 |
| `package.json` | 项目依赖配置文件 |
| `index.html` | 前端页面，包含视频列表和 DPlayer 播放器 |
| `video/` | 存放 MP4 视频文件的目录（需手动创建） |
| `subtitles/` | 存放字幕文件的目录（需手动创建） |
| `thumbnails/` | 存放封面图的目录（自动创建，也可手动放置） |
| `README.md` | 项目说明文档（本文件） |

---

## 🛠️ 技术栈

- **后端**：Node.js + Express（高性能 Web 服务）
- **前端**：原生 HTML + CSS + JavaScript
- **播放器**：DPlayer（开源 HTML5 播放器，支持字幕）
- **视频传输**：流式传输 + Range 请求支持（可拖拽进度）
- **缩略图生成**：fluent-ffmpeg（FFmpeg 的 Node.js 封装）

---

## 📄 许可证

MIT License · 自由使用，随意修改

---

## 🙋 遇到问题？

如果遇到任何问题，欢迎提 Issue 或自行查阅：

- [DPlayer 官方文档](https://dplayer.js.org/)
- [Express 官方文档](https://expressjs.com/)
- [Node.js 官方文档](https://nodejs.org/)
- [FFmpeg 官方文档](https://ffmpeg.org/)