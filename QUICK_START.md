# 快速开始 - 上传到 GitHub

## 方式一：使用自动化脚本（推荐）

### 1. 首次推送到 GitHub

双击运行 `push-to-github.bat`，脚本会自动：
- 初始化 Git 仓库
- 添加远程仓库
- 提交所有文件
- 推送到 GitHub

### 2. 发布新版本

双击运行 `release.bat`，选择版本类型：
- **Patch** (0.6.3 → 0.6.4) - 修复 bug
- **Minor** (0.6.3 → 0.7.0) - 新功能
- **Major** (0.6.3 → 1.0.0) - 重大更新

脚本会自动：
- 更新版本号
- 创建 Git 标签
- 推送到 GitHub
- 触发自动构建和发布

## 方式二：手动命令

### 首次推送

```bash
# 1. 初始化 Git（如果还没有）
git init

# 2. 配置 Git 用户信息（首次使用需要）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 3. 添加远程仓库
git remote add origin https://github.com/a502568670/editor-app.git

# 4. 添加文件
git add .

# 5. 提交
git commit -m "Initial commit with GitHub Actions"

# 6. 推送
git branch -M main
git push -u origin main
```

### 发布新版本

```bash
# 方式 1：自动更新版本号
npm version patch  # 或 minor、major
git push --tags
git push

# 方式 2：手动创建标签
git tag v0.6.4
git push origin v0.6.4
```

## 查看构建状态

推送后，访问以下链接查看：

- **Actions 页面**: https://github.com/a502568670/editor-app/actions
- **Releases 页面**: https://github.com/a502568670/editor-app/releases

## 构建说明

### 自动触发条件

1. **推送到 main/master 分支** → 构建 Windows 和 macOS 版本
2. **推送标签（v开头）** → 构建并创建 Release
3. **手动触发** → 在 Actions 页面点击 "Run workflow"

### 构建产物

- **Windows**: `.exe` 安装包
- **macOS**: `.dmg` 安装包

### 构建时间

完整构建两个平台大约需要 **15-25 分钟**

## 常见问题

### 1. 推送失败：Permission denied

**原因**: 没有配置 GitHub 访问权限

**解决方案**:
```bash
# 使用 HTTPS（需要输入用户名和密码/token）
git remote set-url origin https://github.com/a502568670/editor-app.git

# 或使用 SSH（需要配置 SSH 密钥）
git remote set-url origin git@github.com:a502568670/editor-app.git
```

### 2. 构建失败

**解决方案**:
1. 查看 Actions 页面的详细日志
2. 检查 `package.json` 依赖是否正确
3. 确认 Node.js 版本兼容（使用 18.x）

### 3. Release 没有创建

**原因**: 标签格式不正确

**解决方案**: 确保标签以 `v` 开头，例如 `v0.6.4`

### 4. macOS 构建警告

**说明**: macOS 应用未签名是正常的，用户下载后需要在"系统偏好设置"中允许运行

**如需签名**: 需要配置 Apple 开发者证书（需要付费账号）

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 查看 Actions 构建状态
3. ✅ 发布第一个版本
4. ✅ 下载并测试安装包

## 更多信息

详细文档请查看：
- `GITHUB_ACTIONS_GUIDE.md` - GitHub Actions 完整指南
- `README.md` - 项目说明文档

