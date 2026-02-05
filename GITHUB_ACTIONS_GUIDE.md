# GitHub Actions 使用指南

本项目已配置 GitHub Actions 自动化构建和发布流程。

## 工作流说明

### 1. Build and Release (`build.yml`)

**触发条件：**
- 推送到 `main` 或 `master` 分支
- 创建以 `v` 开头的标签（如 `v0.6.4`）
- 手动触发（workflow_dispatch）

**功能：**
- 在 Windows 和 macOS 平台上构建 Electron 应用
- 自动上传构建产物
- 当推送标签时，自动创建 GitHub Release 并上传安装包

### 2. Test Build (`test.yml`)

**触发条件：**
- 推送到 `develop` 分支或 `feature/*` 分支
- Pull Request

**功能：**
- 代码检查（lint）
- 构建 Web 应用
- 上传构建产物（保留 7 天）

## 使用步骤

### 第一步：初始化 Git 仓库并推送到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit with GitHub Actions"

# 添加远程仓库
git remote add origin https://github.com/a502568670/editor-app.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 第二步：发布新版本

当你想发布新版本时：

```bash
# 方式 1：使用 npm version 命令（推荐）
npm version patch  # 0.6.3 -> 0.6.4
# 或
npm version minor  # 0.6.3 -> 0.7.0
# 或
npm version major  # 0.6.3 -> 1.0.0

# 推送标签
git push --tags

# 推送代码
git push
```

```bash
# 方式 2：手动创建标签
git tag v0.6.4
git push origin v0.6.4
```

### 第三步：查看构建状态

访问：https://github.com/a502568670/editor-app/actions

你可以看到：
- 正在运行的工作流
- 构建日志
- 构建产物下载

### 第四步：下载发布版本

当标签推送后，GitHub Actions 会自动：
1. 构建 Windows 和 macOS 版本
2. 创建 GitHub Release
3. 上传安装包到 Release

访问：https://github.com/a502568670/editor-app/releases

## 环境变量配置

如果需要配置私有环境变量：

1. 进入仓库设置：`Settings` -> `Secrets and variables` -> `Actions`
2. 点击 `New repository secret`
3. 添加需要的密钥

当前使用的环境变量：
- `BACKEND_URL`: 后端 API 地址（已在工作流中配置）
- `GITHUB_TOKEN`: GitHub 自动提供，用于创建 Release

## 手动触发构建

1. 访问：https://github.com/a502568670/editor-app/actions
2. 选择 `Build and Release` 工作流
3. 点击 `Run workflow` 按钮
4. 选择分支并运行

## 构建产物

构建完成后，可以在以下位置找到：

- **开发构建**：Actions 页面 -> 选择工作流运行 -> Artifacts 部分
- **正式发布**：Releases 页面

## 注意事项

1. **首次推送**：确保仓库已创建并且有推送权限
2. **标签格式**：发布版本的标签必须以 `v` 开头（如 `v0.6.4`）
3. **构建时间**：完整构建两个平台大约需要 15-25 分钟
4. **macOS 签名**：如果需要签名 macOS 应用，需要配置 Apple 开发者证书
5. **Windows 签名**：如果需要签名 Windows 应用，需要配置代码签名证书

## 故障排查

### 构建失败

1. 查看 Actions 页面的构建日志
2. 检查依赖是否正确安装
3. 确认 Node.js 版本兼容性

### 无法创建 Release

1. 确认标签格式正确（以 `v` 开头）
2. 检查 `GITHUB_TOKEN` 权限
3. 确认仓库设置允许创建 Release

### 依赖安装失败

1. 检查 `package.json` 和 `package-lock.json` 是否同步
2. 尝试删除 `node_modules` 和 `package-lock.json` 后重新安装
3. 检查是否有平台特定的依赖问题

## 更多信息

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Electron Builder 文档](https://www.electron.build/)
- [项目仓库](https://github.com/a502568670/editor-app)

