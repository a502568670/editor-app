# GitHub Actions 自动打包配置说明

本项目已配置 GitHub Actions 自动打包功能，可以自动构建 Windows、macOS 和 Linux 版本的应用程序。

## 配置文件

已创建两个 workflow 文件：

1. `.github/workflows/build.yml` - 用于日常构建和测试
2. `.github/workflows/release.yml` - 用于发布版本

## 使用方法

### 方式一：推送标签触发自动发布

```bash
# 创建并推送标签
git tag v0.6.5
git push origin v0.6.5
```

### 方式二：手动触发构建

在 GitHub 仓库页面：
1. 点击 "Actions" 标签
2. 选择 "Build/release" workflow
3. 点击 "Run workflow" 按钮

## 构建产物

构建完成后，可以在以下位置找到：

- **Actions 页面**：每次构建的 Artifacts 中可以下载
- **Releases 页面**：标签触发的构建会自动创建 Release

### 各平台产物

- **Windows**: `gaoqingsong_版本号_win_x64.exe`
- **macOS**: `gaoqingsong-版本号.dmg`
- **Linux**: `gaoqingsong_版本号_amd64.deb` 和 `.AppImage`

## 环境变量

默认使用的后端地址：`http://47.96.22.8:8005`

如需修改，请编辑 workflow 文件中的 `BACKEND_URL` 环境变量。

## 注意事项

1. **macOS 签名**：如需签名，需要在 GitHub Secrets 中配置：
   - `APPLE_ID`
   - `APPLE_ID_PASSWORD`
   - `CSC_LINK` (证书 base64)
   - `CSC_KEY_PASSWORD` (证书密码)

2. **Windows 签名**：如需签名，需要配置：
   - `CSC_LINK` (证书 base64)
   - `CSC_KEY_PASSWORD` (证书密码)

3. **首次使用**：确保仓库的 Actions 权限已启用
   - Settings → Actions → General → Workflow permissions
   - 选择 "Read and write permissions"

## 本地测试

在推送到 GitHub 之前，可以本地测试构建：

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build
```

## 版本管理

项目已配置版本管理脚本：

```bash
# 补丁版本 (0.6.4 -> 0.6.5)
npm run version:patch

# 次版本 (0.6.4 -> 0.7.0)
npm run version:minor

# 主版本 (0.6.4 -> 1.0.0)
npm run version:major
```

这些命令会自动更新版本号并推送标签，触发自动构建。

