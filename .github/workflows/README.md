# GitHub Actions 自动构建发布工作流

## 📦 功能说明

这个工作流会自动构建 Windows 和 macOS 双平台的应用程序，并发布到 GitHub Releases。

## 🚀 使用方法

### 方法一：通过 Git Tag 自动触发（推荐）

1. 确保你的代码已经提交到 GitHub
2. 在本地创建并推送一个版本标签：

```bash
# 创建版本标签（例如 v1.0.0）
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0
```

3. 工作流会自动触发，开始构建 Windows 和 macOS 应用
4. 构建完成后会自动创建一个 GitHub Release，并上传安装包

### 方法二：手动触发

1. 进入你的 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `Build and Release` 工作流
4. 点击 `Run workflow` 按钮

**注意**：
- **仅构建测试**：不勾选 "是否创建 GitHub Release"，只会构建应用并上传 Artifacts
- **构建并发布**：勾选 "是否创建 GitHub Release"，需要先推送标签（如 `v1.0.0`）

手动触发的典型使用场景：
```bash
# 1. 先推送标签
git tag v1.0.0
git push origin v1.0.0

# 2. 然后在 GitHub Actions 页面手动触发工作流并勾选"创建 Release"
```

## 📋 工作流程

1. **Windows 构建任务** (`build-windows`)
   - 在 Windows 环境中运行
   - 安装依赖并构建应用
   - 生成 `.exe` 安装包
   - 上传构建产物

2. **macOS 构建任务** (`build-macos`)
   - 在 macOS 环境中运行
   - 安装依赖并构建应用
   - 生成 `.dmg` 镜像文件
   - 上传构建产物

3. **创建发布** (`release`)
   - 等待两个构建任务完成
   - 下载所有构建产物
   - 创建 GitHub Release
   - 上传所有安装包

## 📦 产物说明

构建完成后，在 GitHub Releases 页面会有以下文件：

- `nanoban-{version}-setup.exe` - Windows 安装包
- `nanoban-{version}-setup.exe.blockmap` - Windows 更新块映射文件
- `nanoban-{version}.dmg` - macOS 磁盘镜像
- `nanoban-{version}.dmg.blockmap` - macOS 更新块映射文件

## ⚙️ 配置说明

### 版本号格式

- 正式版本：`v1.0.0`, `v2.1.3`
- 预发布版本：`v1.0.0-alpha`, `v1.0.0-beta`

### 需要的权限

工作流需要以下权限：
- `contents: write` - 用于创建 Release 和上传文件
- `GITHUB_TOKEN` - GitHub 自动提供，无需手动配置

### 自定义配置

如果需要修改构建行为，可以编辑以下文件：
- `.github/workflows/build-release.yml` - 工作流配置
- `electron-builder.yml` - Electron Builder 配置
- `package.json` - 构建脚本和依赖

## 🔍 故障排查

### 构建失败

1. 查看 Actions 页面的构建日志
2. 检查是否所有依赖都正确安装
3. 确保 `package.json` 中的构建脚本正确

### 发布失败

1. 检查是否有 `contents: write` 权限
2. 确保标签格式正确（以 `v` 开头）
3. 检查是否已存在同名的 Release

## 💡 最佳实践

1. **版本号管理**：遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范
2. **发布前测试**：在本地先运行 `pnpm run build:win` 和 `pnpm run build:mac` 测试
3. **更新日志**：每次发布前更新 CHANGELOG.md
4. **测试版本**：使用 alpha/beta 标签发布测试版本

## 📝 示例工作流

```bash
# 1. 开发完成后提交代码
git add .
git commit -m "feat: 添加新功能"
git push

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送标签触发构建
git push origin v1.0.0

# 4. 等待 GitHub Actions 完成构建
# 5. 在 Releases 页面查看并下载安装包
```

## 🔗 相关链接

- [Electron Builder 文档](https://www.electron.build/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
