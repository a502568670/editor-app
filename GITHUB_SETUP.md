# 🚀 GitHub Actions 自动打包 Mac 版本 - 完整指南

## 📋 前提条件

你当前使用的是 **Gitee（码云）**，要使用 GitHub Actions 自动打包 Mac 版本，需要：

1. ✅ 已有 Gitee 仓库：`https://gitee.com/asscode/editor-app.git`
2. ⏳ 需要 GitHub 账号（免费）
3. ⏳ 在 GitHub 创建仓库

---

## 🎯 两种方案对比

### 方案 1：同时使用 Gitee + GitHub（推荐）⭐

**优势：**
- ✅ 保留 Gitee 仓库（国内访问快）
- ✅ 使用 GitHub Actions 自动打包
- ✅ 两边代码同步

**适合：** 想要自动打包 Mac 版本，同时保留 Gitee

---

### 方案 2：使用 Gitee Go（付费）

**说明：**
- Gitee 的 CI/CD 功能叫 "Gitee Go"
- ❌ 需要付费才能使用 macOS 构建环境
- 💰 价格较高

**适合：** 只想用 Gitee，愿意付费

---

## 🔧 方案 1 详细步骤：同时使用 Gitee + GitHub

### 步骤 1：创建 GitHub 账号（如果没有）

1. 访问 https://github.com/signup
2. 注册免费账号
3. 验证邮箱

### 步骤 2：在 GitHub 创建仓库

1. 登录 GitHub
2. 访问 https://github.com/new
3. 填写信息：
   - **Repository name**: `editor-app`
   - **Description**: `稿轻松编辑器`
   - **Public** 或 **Private**（都可以，Actions 都免费）
   - ❌ **不要**勾选 "Add a README file"
4. 点击 "Create repository"

### 步骤 3：添加 GitHub 远程仓库

在命令行执行（替换 `你的用户名` 为你的 GitHub 用户名）：

```bash
cd "C:\Users\Administrator\Desktop\editor-app"

# 添加 GitHub 远程仓库
git remote add github https://github.com/你的用户名/editor-app.git

# 查看所有远程仓库
git remote -v
```

你会看到：
```
github  https://github.com/你的用户名/editor-app.git (fetch)
github  https://github.com/你的用户名/editor-app.git (push)
origin  https://gitee.com/asscode/editor-app.git (fetch)
origin  https://gitee.com/asscode/editor-app.git (push)
```

### 步骤 4：推送代码到 GitHub

```bash
# 推送到 GitHub
git push github master

# 或者推送到 main 分支（GitHub 默认）
git push github master:main
```

### 步骤 5：查看自动构建

1. 访问你的 GitHub 仓库页面
2. 点击顶部的 **"Actions"** 标签
3. 你会看到构建任务正在运行
4. 等待 10-15 分钟完成

### 步骤 6：下载 Mac 安装包

构建完成后：
1. 在 Actions 页面点击最新的构建任务
2. 滚动到页面底部，找到 **"Artifacts"**
3. 下载：
   - `windows-installer` - Windows 安装包
   - `macos-installer` - **Mac DMG 安装包** ✅

---

## 🔄 日常使用：同步到两个平台

以后每次提交代码，可以同时推送到 Gitee 和 GitHub：

```bash
# 提交代码
git add .
git commit -m "更新说明"

# 推送到 Gitee（国内访问）
git push origin master

# 推送到 GitHub（触发自动构建）
git push github master
```

或者一次性推送到两个平台：

```bash
git push --all
```

---

## 📝 快速命令参考

### 查看远程仓库
```bash
git remote -v
```

### 添加 GitHub 远程仓库
```bash
git remote add github https://github.com/你的用户名/editor-app.git
```

### 推送到 GitHub
```bash
git push github master
```

### 推送到 Gitee
```bash
git push origin master
```

### 同时推送到所有远程仓库
```bash
git push --all
```

---

## ❓ 常见问题

### Q1: 我没有 GitHub 账号怎么办？
**A:** 访问 https://github.com/signup 免费注册

### Q2: GitHub Actions 收费吗？
**A:** 
- Public 仓库：完全免费，无限制
- Private 仓库：每月 2000 分钟免费（足够用）

### Q3: 可以只用 Gitee 吗？
**A:** 可以，但 Gitee 的 macOS 构建环境需要付费

### Q4: 推送到 GitHub 会影响 Gitee 吗？
**A:** 不会，两个仓库独立，互不影响

### Q5: 构建失败怎么办？
**A:** 
1. 查看 Actions 页面的错误日志
2. 检查 `package.json` 依赖是否完整
3. 确保 `.github/workflows/build.yml` 配置正确

---

## 🎉 完成后你将拥有

✅ **Gitee 仓库** - 国内访问快，代码托管
✅ **GitHub 仓库** - 自动构建，生成安装包
✅ **Windows 安装包** - 本地已生成
✅ **Mac 安装包** - GitHub Actions 自动生成

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
1. 你的 GitHub 用户名
2. 遇到的具体错误信息
3. 在哪一步卡住了

我会帮你解决！

