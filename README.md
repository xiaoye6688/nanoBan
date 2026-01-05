# nanoBan - Gemini 图像生成器

基于 Electron + Vue 3 + TypeScript + Tailwind CSS 构建的 Google Gemini-3-pro-image-preview 图像生成桌面应用。

## ✨ 功能特性

- 🎨 **AI 图像生成**: 使用 Gemini-3-pro-image-preview 模型生成高质量图像
- 📐 **多种分辨率**: 支持 1K、2K、4K 三种分辨率选择
- 🖼️ **灵活宽高比**: 支持 10 种常见宽高比（1:1、16:9、9:16、4:3 等）
- 🔄 **图生图功能**: 支持上传参考图片进行图像生成
- 🔐 **双重认证**: 支持 API Key 和 OAuth 2.0 两种认证方式
- 💾 **历史记录**: 自动保存对话历史和生成的图片
- ⚙️ **预设配置**: 内置多种常用配置预设，快速切换
- 📥 **导出功能**: 支持导出对话历史

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建应用

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

## 🔑 认证配置

### 方式一：API Key（推荐）

1. 访问 [Google AI Studio](https://ai.google.dev/)
2. 创建或登录您的账号
3. 生成 API Key
4. 在应用中点击"设置认证"，选择"API Key"标签
5. 输入您的 API Key 并保存

### 方式二：Antigravity OAuth（一键登录）

Antigravity OAuth 使用预配置的 Google OAuth 客户端，无需手动配置：

1. 在应用中点击"设置认证"，选择"Antigravity OAuth"标签
2. 点击"使用 Google 账号登录"按钮
3. 在打开的浏览器窗口中使用您的 Google 账号登录
4. 授权应用访问所需权限
5. 授权完成后自动返回应用

**Antigravity OAuth 的优势**：

- 无需手动配置 Client ID 和 Secret
- 自动获取 Google Cloud 项目 ID
- 支持 Token 自动刷新
- 安全性更高

## 📖 使用说明

### 基本使用

1. **设置认证**: 首次使用需要先点击右上角设置图标完成认证
2. **配置参数**: 在输入框下方点击比例/分辨率按钮调整参数
3. **输入提示词**: 在底部输入框中描述您想要生成的图像
4. **生成图片**: 点击"生成"按钮或按 Enter

### 图生图功能

1. 点击输入框左侧的参考图区域
2. 选择一张或多张参考图片上传
3. 输入提示词描述您想要的效果
4. 点击生成

### 参数配置

在输入框下方提供了快捷参数配置：

- **比例按钮**: 点击可选择不同的宽高比（1:1、16:9、9:16 等）
- **分辨率按钮**: 点击可在 1K/2K/4K 之间切换

## 📁 项目结构

```
nanoBan/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── oauth.ts       # OAuth 2.0 实现
│   │   ├── storage.ts     # 数据持久化
│   │   ├── network.ts     # 网络请求
│   │   ├── tokenManager.ts # Token 管理
│   │   ├── windows/       # 窗口管理
│   │   └── ipc/           # IPC 处理模块
│   ├── preload/           # 预加载脚本
│   │   ├── index.ts       # IPC 桥接
│   │   └── index.d.ts     # 类型定义
│   └── renderer/          # 渲染进程（Vue 应用）
│       └── src/
│           ├── api/       # API 调用模块
│           │   └── gemini.ts
│           ├── stores/    # Pinia 状态管理
│           │   ├── auth.ts
│           │   ├── chat.ts
│           │   └── config.ts
│           ├── types/     # TypeScript 类型
│           │   └── gemini.ts
│           ├── components/ # Vue 组件
│           │   ├── ui/    # 基础 UI 组件 (Button, Dialog, Input, Tabs 等)
│           │   ├── AuthDialog.vue   # 认证设置弹窗
│           │   └── SessionPanel.vue # 会话历史面板
│           ├── views/     # 视图组件
│           │   └── ChatView.vue     # 主聊天视图
│           ├── assets/    # 静态资源
│           └── App.vue    # 根组件
├── docs/                  # 文档
├── tailwind.config.js     # Tailwind CSS 配置
├── postcss.config.js      # PostCSS 配置
├── electron.vite.config.ts # Vite 配置
└── package.json
```

## 🛠️ 技术栈

- **框架**: Electron 39.x + Vue 3.5.x
- **语言**: TypeScript 5.9.x
- **构建工具**: electron-vite 5.x
- **UI 框架**: Tailwind CSS + 自定义组件
- **状态管理**: Pinia 3.x
- **HTTP 客户端**: Axios
- **数据存储**: electron-store
- **图标**: Iconify

## 📝 API 参数说明

### 图像尺寸

| 尺寸 | 1:1 分辨率 | 16:9 分辨率 | 9:16 分辨率 |
| ---- | ---------- | ----------- | ----------- |
| 1K   | 1024x1024  | 1376x768    | 768x1376    |
| 2K   | 2048x2048  | 2752x1536   | 1536x2752   |
| 4K   | 4096x4096  | 5504x3072   | 3072x5504   |

### 支持的宽高比

- 1:1 - 正方形
- 16:9 - 横屏宽幅
- 9:16 - 竖屏
- 4:3 - 经典横屏
- 3:4 - 经典竖屏
- 21:9 - 超宽屏幕
- 2:3, 3:2, 4:5, 5:4 - 其他常用比例

## ⚠️ 注意事项

1. **API Key 安全**: 请妥善保管您的 API Key，不要分享给他人
2. **网络要求**: 需要稳定的网络连接才能访问 Gemini API
3. **配额限制**: Google AI API 有使用配额限制，请注意您的使用量
4. **图片格式**: 参考图片建议使用 JPEG 或 PNG 格式
5. **提示词语言**: Gemini API 目前仅支持英文提示词

## 🐛 常见问题

### 无法连接到 API

- 检查网络连接是否正常
- 确认 API Key 是否正确
- 检查是否超出 API 配额限制

### OAuth 授权失败

- 确认 OAuth 配置信息是否正确
- 检查回调 URL 是否正确设置
- 确保 Google Cloud 项目中已启用相应的 API

### 图片生成失败

- 检查提示词是否符合 Google 内容政策
- 尝试降低图片分辨率
- 查看控制台错误信息

## 📄 License

MIT

## 👏 致谢

- [Google Gemini](https://ai.google.dev/) - 提供强大的 AI 图像生成能力
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [electron-vite](https://electron-vite.org/) - 快速的 Electron 构建工具
