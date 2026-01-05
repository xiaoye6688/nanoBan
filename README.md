# nanoBan - Gemini 图像生成器

基于 Electron + Vue 3 + TypeScript + Tailwind CSS 构建的 Gemini 图像生成桌面应用。

## ✨ 功能特性

- 🎨 **AI 图像生成**: 使用 Gemini 图像生成模型生成高质量图像
- 📐 **多种分辨率**: 支持 1K、2K、4K 三种分辨率选择
- 🖼️ **灵活宽高比**: 支持 8 种常见宽高比（1:1、16:9、9:16、4:3、3:4、3:2、2:3、21:9）
- 🔄 **图生图功能**: 支持上传参考图片进行图像生成
- 🔐 **一键登录**: 使用 Antigravity OAuth 一键登录 Google 账号
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

### Antigravity OAuth（一键登录）

Antigravity OAuth 使用预配置的 Google OAuth 客户端，无需手动配置：

1. 在应用中点击右上角设置图标
2. 点击"使用 Google 账号登录"按钮
3. 在打开的浏览器窗口中使用您的 Google 账号登录
4. 授权应用访问所需权限
5. 授权完成后自动返回应用

**Antigravity OAuth 的优势**：

- 无需任何手动配置
- 支持 Token 自动刷新
- 安全便捷

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
│           │   ├── ui/    # 基础 UI 组件
│           │   │   ├── BaseAlert.vue      # 警告提示
│           │   │   ├── BaseButton.vue     # 按钮
│           │   │   ├── BaseCard.vue       # 卡片
│           │   │   ├── BaseDialog.vue     # 对话框
│           │   │   ├── BaseInput.vue      # 输入框
│           │   │   ├── BasePopconfirm.vue # 确认气泡
│           │   │   ├── BaseRadioGroup.vue # 单选组
│           │   │   ├── BaseSelect.vue     # 下拉选择
│           │   │   ├── BaseSwitch.vue     # 开关
│           │   │   ├── BaseTabs.vue       # 标签页
│           │   │   ├── BaseToast.vue      # 消息提示
│           │   │   └── BaseTooltip.vue    # 工具提示
│           │   ├── AuthDialog.vue   # 认证设置弹窗
│           │   └── SessionPanel.vue # 会话历史面板
│           ├── views/     # 视图组件
│           │   └── ChatView.vue     # 主聊天视图
│           ├── assets/    # 静态资源
│           └── App.vue    # 根组件
├── tailwind.config.js     # Tailwind CSS 配置
├── postcss.config.js      # PostCSS 配置
├── electron.vite.config.ts # Vite 配置
└── package.json
```

## 🛠️ 技术栈

- **框架**: Electron 39.x + Vue 3.5.x
- **语言**: TypeScript 5.9.x
- **构建工具**: electron-vite 5.x
- **UI 框架**: Tailwind CSS 4.x + 自定义组件
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
- 3:2 - 摄影常用
- 2:3 - 竖版摄影
- 21:9 - 超宽屏幕

## ⚠️ 注意事项

1. **配额限制**: 每个 Google 账号每 5 小时限制生成 20 张图片
2. **图片格式**: 参考图片建议使用 JPEG 或 PNG 格式

## 🐛 常见问题

### 图片生成失败

- 检查是否超出配额限制（5小时20张）
- 检查提示词是否符合 Google 内容政策
- 尝试降低图片分辨率
- 查看控制台错误信息

### OAuth 授权失败

- 检查网络连接是否正常
- 尝试重新点击登录按钮
- 清除浏览器缓存后重试

## 📄 License

MIT

## 👏 致谢

- [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) - Antigravity API 实现参考
- [香蕉皮AI](https://linux.do/t/topic/1401748) - UI 设计参考
