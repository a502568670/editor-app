# 🚀 GitHub Actions 部署指南

## 📦 已创建的文件

我已经为你创建了以下 GitHub Actions 配置文件：

1. `.github/workflows/build.yml` - 日常构建（推送代码时自动触发）
2. `.github/workflows/release.yml` - 发布版本（推送标签时自动触发）

## 🎯 使用步骤

### 第一步：推送到 GitHub

如果还没有 GitHub 仓库，先创建一个：

```bash
# 在 GitHub 网站创建仓库后，添加远程地址
git remote add github https://github.com/你的用户名/editor-app.git

# 推送代码
git add .
git commit -m "添加 GitHub Actions 配置"
git push github master
```

### 第二步：启用 Actions 权限

1. 访问你的 GitHub 仓库
2. 进入 **Settings** → **Actions** → **General**
3. 在 **Workflow permissions** 部分选择 **"Read and write permissions"**
4. 点击 **Save**

### 第三步：触发构建

#### 方式 1：自动构建（推送代码）

每次推送代码到 master 或 main 分支，会自动触发构建：

```bash
git push github master
```

#### 方式 2：发布版本（推送标签）

创建版本标签会触发正式发布：

```bash
# 更新版本号并推送标签
npm run version:patch

# 或手动创建标签
git tag v0.6.5
git push github v0.6.5
```

#### 方式 3：手动触发

在 GitHub 仓库页面：
1. 点击 **Actions** 标签
2. 选择 **Build** 或 **Release** workflow
3. 点击 **Run workflow** 按钮

## 📥 下载构建产物

### 日常构建（build.yml）

1. 进入 **Actions** 页面
2. 点击最新的构建任务
3. 滚动到底部的 **Artifacts** 部分
4. 下载：
   - `windows-installer` - Windows 安装包
   - `macos-installer` - macOS 安装包
   - `linux-installer` - Linux 安装包

### 正式发布（release.yml）

1. 进入 **Releases** 页面
2. 找到对应版本的 Release
3. 在 **Assets** 部分下载安装包

## 🔧 构建产物说明

- **Windows**: `gaoqingsong_版本号_win_x64.exe`
- **macOS**: `gaoqingsong-版本号.dmg`
- **Linux**: `gaoqingsong_版本号_amd64.deb` 和 `.AppImage`

## ⚙️ 配置说明

### 后端地址

默认使用：`http://47.96.22.8:8005`

如需修改，编辑 workflow 文件中的 `BACKEND_URL` 环境变量。

### 代码签名（可选）

#### macOS 签名

在 GitHub 仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加：

- `APPLE_ID` - Apple ID 邮箱
- `APPLE_ID_PASSWORD` - 应用专用密码
- `CSC_LINK` - 证书文件的 base64 编码
- `CSC_KEY_PASSWORD` - 证书密码

#### Windows 签名

添加 Secrets：

- `CSC_LINK` - 证书文件的 base64 编码
- `CSC_KEY_PASSWORD` - 证书密码

## 📝 版本管理命令

```bash
# 补丁版本 (0.6.4 -> 0.6.5)
npm run version:patch

# 次版本 (0.6.4 -> 0.7.0)
npm run version:minor

# 主版本 (0.6.4 -> 1.0.0)
npm run version:major
```

这些命令会自动：
1. 更新 `package.json` 中的版本号
2. 创建 git 标签
3. 推送到远程仓库
4. 触发 GitHub Actions 自动构建

## 🐛 常见问题

### Q: Actions 构建失败？

**A:** 检查以下几点：
1. 确保 Actions 权限已启用（Read and write permissions）
2. 查看构建日志中的具体错误信息
3. 确认 `package.json` 中的依赖完整

### Q: 找不到构建产物？

**A:** 
- 日常构建：在 Actions 页面底部的 Artifacts 中下载
- 正式发布：在 Releases 页面下载

### Q: macOS 构建时间很长？

**A:** macOS 构建通常需要 10-20 分钟，这是正常的。

### Q: 可以只构建某个平台吗？

**A:** 可以修改 workflow 文件中的 `matrix.os`，删除不需要的平台。

## 🎉 完成！

现在你可以：
- ✅ 推送代码自动构建所有平台
- ✅ 推送标签自动发布版本
- ✅ 在 GitHub 上下载所有平台的安装包
- ✅ 特别是 macOS 版本，无需 Mac 电脑！

## 📞 需要帮助？

如果遇到问题，请检查：
1. GitHub Actions 页面的构建日志
2. 确认所有配置文件已正确推送
3. 验证 Actions 权限设置

祝你使用愉快！🎊

