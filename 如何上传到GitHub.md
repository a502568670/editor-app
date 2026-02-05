# 如何上传到 GitHub 并自动构建

## 🎯 目标

将项目上传到 GitHub，并自动构建 **Windows** 和 **macOS** 版本。

## 📋 准备工作

1. 确保已安装 Git
2. 确保 GitHub 仓库已创建：https://github.com/a502568670/editor-app

## 🚀 三步上传

### 方法一：使用自动化脚本（最简单）

#### 第一步：检查配置

双击运行：**`check-git.bat`**

这会自动检查并配置：
- ✅ Git 是否安装
- ✅ 用户名和邮箱
- ✅ 仓库初始化
- ✅ 远程仓库

#### 第二步：推送代码

双击运行：**`push-to-github.bat`**

输入提交信息（或直接回车使用默认信息），脚本会自动：
- ✅ 添加所有文件
- ✅ 提交更改
- ✅ 推送到 GitHub

#### 第三步：查看构建

打开浏览器访问：
```
https://github.com/a502568670/editor-app/actions
```

你会看到 GitHub Actions 正在自动构建：
- 🔨 Windows 版本（.exe 安装包）
- 🔨 macOS 版本（.dmg 安装包）

⏱️ **构建时间**：大约 15-25 分钟

### 方法二：手动命令

如果你熟悉 Git，也可以手动执行：

```bash
# 1. 初始化（如果还没有）
git init

# 2. 添加远程仓库
git remote add origin https://github.com/a502568670/editor-app.git

# 3. 添加文件
git add .

# 4. 提交
git commit -m "Initial commit with GitHub Actions"

# 5. 推送
git branch -M main
git push -u origin main
```

## 🎉 发布新版本

当你想发布新版本时：

### 方法一：使用脚本（推荐）

双击运行：**`release.bat`**

选择版本类型：
- **1** - Patch (0.6.3 → 0.6.4) 修复 bug
- **2** - Minor (0.6.3 → 0.7.0) 新功能
- **3** - Major (0.6.3 → 1.0.0) 重大更新
- **4** - 自定义版本号

脚本会自动：
1. ✅ 更新 package.json 版本号
2. ✅ 创建 Git 标签（如 v0.6.4）
3. ✅ 推送到 GitHub
4. ✅ 触发自动构建和发布

### 方法二：手动命令

```bash
# 更新版本号
npm version patch  # 或 minor、major

# 推送标签
git push --tags

# 推送代码
git push
```

## 📦 下载构建产物

### 开发构建（每次推送）

1. 访问：https://github.com/a502568670/editor-app/actions
2. 点击最新的工作流运行
3. 滚动到底部的 **Artifacts** 部分
4. 下载 `windows-build` 或 `macos-build`

### 正式发布（推送标签后）

1. 访问：https://github.com/a502568670/editor-app/releases
2. 找到对应版本
3. 下载安装包：
   - Windows: `gaoqingsong_x.x.x_win_x64.exe`
   - macOS: `gaoqingsong-x.x.x.dmg`

## 🔍 查看构建状态

### Actions 页面

访问：https://github.com/a502568670/editor-app/actions

可以看到：
- ✅ 成功的构建（绿色勾）
- ❌ 失败的构建（红色叉）
- 🔄 正在运行的构建（黄色圆圈）

点击任意构建可以查看详细日志。

### 构建内容

每次推送代码或标签，GitHub Actions 会：

1. **安装依赖** - 安装 npm 包
2. **构建 Web 应用** - 编译 Vue 项目
3. **构建 Windows 版本** - 打包 .exe 安装包
4. **构建 macOS 版本** - 打包 .dmg 安装包
5. **上传产物** - 保存构建结果
6. **创建 Release**（仅标签推送）- 发布新版本

## ⚙️ 配置说明

### 自动构建触发条件

- ✅ 推送到 `main` 或 `master` 分支 → 构建但不发布
- ✅ 推送以 `v` 开头的标签 → 构建并创建 Release
- ✅ 手动触发 → 在 Actions 页面点击 "Run workflow"

### 环境变量

构建时使用的后端地址：
```
BACKEND_URL=http://47.96.22.8:8005
```

如需修改，编辑 `.github/workflows/build.yml` 文件。

## 🛠️ 常见问题

### Q1: 推送失败，提示 "Permission denied"

**原因**：没有 GitHub 访问权限

**解决方案**：
1. 使用 Personal Access Token（推荐）
   - 访问：https://github.com/settings/tokens
   - 生成新 token，勾选 `repo` 权限
   - 推送时使用 token 作为密码

2. 或配置 SSH 密钥
   - 参考：https://docs.github.com/zh/authentication/connecting-to-github-with-ssh

### Q2: 构建失败

**解决方案**：
1. 访问 Actions 页面查看详细日志
2. 检查是否有依赖安装失败
3. 确认 `package.json` 配置正确

### Q3: Release 没有创建

**原因**：标签格式不正确

**解决方案**：确保标签以 `v` 开头，例如：
- ✅ `v0.6.4`
- ✅ `v1.0.0`
- ❌ `0.6.4`
- ❌ `version-0.6.4`

### Q4: macOS 应用无法打开

**原因**：应用未签名

**解决方案**：
1. 右键点击应用
2. 选择"打开"
3. 在弹出的对话框中点击"打开"

或在"系统偏好设置" → "安全性与隐私"中允许运行。

### Q5: 需要修改构建配置

**位置**：`.github/workflows/build.yml`

常见修改：
- 修改 Node.js 版本
- 修改后端 URL
- 添加环境变量
- 修改构建命令

## 📚 更多文档

- **快速开始**：`QUICK_START.md`
- **详细指南**：`GITHUB_ACTIONS_GUIDE.md`
- **部署总结**：`DEPLOYMENT_SUMMARY.md`
- **项目说明**：`README.md`

## 📞 需要帮助？

如果遇到问题：
1. 查看 Actions 页面的构建日志
2. 阅读相关文档
3. 检查 GitHub 仓库设置

---

**仓库地址**：https://github.com/a502568670/editor-app
**Actions 页面**：https://github.com/a502568670/editor-app/actions
**Releases 页面**：https://github.com/a502568670/editor-app/releases

**当前版本**：v0.6.3
**构建平台**：Windows + macOS
**构建时间**：15-25 分钟

