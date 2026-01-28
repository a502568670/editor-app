# 📦 打包说明

## 本地打包

### Windows 打包
```bash
npm run electron:build:win
```
输出：`dist_electron/gaoqingsong_0.5.9_win_x64.exe`

### Mac 打包（仅在 macOS 上）
```bash
npm run electron:build:mac
```
输出：`dist_electron/gaoqingsong_0.5.9_mac_x64.dmg`

---

## 🚀 使用 GitHub Actions 自动打包（推荐）

### 优势
- ✅ 同时打包 Windows 和 Mac 版本
- ✅ 在真实的 macOS 环境中构建
- ✅ 完全免费
- ✅ 自动化，无需手动操作

### 使用步骤

#### 1. 初始化 Git 仓库（如果还没有）
```bash
git init
git add .
git commit -m "Initial commit"
```

#### 2. 创建 GitHub 仓库
1. 访问 https://github.com/new
2. 创建一个新仓库（例如：`editor-app`）
3. **不要**勾选 "Initialize this repository with a README"

#### 3. 推送代码到 GitHub
```bash
git remote add origin https://github.com/你的用户名/editor-app.git
git branch -M main
git push -u origin main
```

#### 4. 自动构建
推送代码后，GitHub Actions 会自动开始构建：
- 访问你的仓库页面
- 点击 "Actions" 标签
- 查看构建进度

#### 5. 下载构建产物
构建完成后：
1. 进入 Actions 页面
2. 点击最新的构建任务
3. 在页面底部找到 "Artifacts"
4. 下载：
   - `windows-installer` - Windows 安装包
   - `macos-installer` - Mac 安装包

---

## 📋 发布版本（可选）

### 创建版本标签
```bash
git tag v0.5.9
git push origin v0.5.9
```

这会触发构建，并自动创建 GitHub Release，包含所有安装包。

---

## 🔧 配置文件说明

### `.github/workflows/build.yml`
GitHub Actions 自动构建配置文件

### `vue.config.js`
Electron Builder 打包配置：
- Windows: 生成 NSIS 安装程序
- Mac: 生成 DMG 磁盘镜像

---

## ⚠️ 注意事项

### Mac 打包限制
- ❌ 无法在 Windows 上打包 Mac 版本
- ✅ 必须在 macOS 系统或使用 GitHub Actions

### 代码签名
当前配置**未启用代码签名**：
- Windows: 用户可能看到 "未知发布者" 警告
- Mac: 用户需要右键打开应用

如需启用签名，需要：
- Windows: 购买代码签名证书
- Mac: 加入 Apple Developer Program ($99/年)

---

## 📞 问题排查

### GitHub Actions 构建失败
1. 检查 Actions 页面的错误日志
2. 确保 `package.json` 中的依赖完整
3. 确保 Node.js 版本兼容（推荐 16.x）

### 本地构建失败
1. 清理缓存：`npm run clean` 或手动删除 `dist_electron`
2. 重新安装依赖：`rm -rf node_modules && npm install`
3. 检查网络连接（需要下载 Electron 二进制文件）

---

## 🎉 完成！

现在你可以：
1. 本地打包 Windows 版本
2. 使用 GitHub Actions 自动打包 Mac 版本
3. 一次性获得两个平台的安装包

