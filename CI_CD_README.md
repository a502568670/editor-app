# CI/CD 构建说明

## 📌 重要提示

**macOS 应用只能在 macOS 系统上构建**，Windows 系统无法构建 macOS 的 DMG 安装包。

## 🚀 构建方式

### 方式 1：本地构建（推荐用于开发）

#### Windows 构建
在 Windows 系统上运行：
```bash
npm run electron:build:win
```

#### macOS 构建
在 macOS 系统上运行：
```bash
npm run fix-dmg-builder  # 修复 Python 3 兼容性
npm run electron:build:mac
```

### 方式 2：GitHub Actions 自动构建（推荐用于发布）

项目已配置 GitHub Actions 工作流（`.github/workflows/build.yml`），可以自动在云端构建所有平台的安装包。

#### 触发构建的方式

1. **推送代码到主分支**
   ```bash
   git push origin main
   ```
   - 自动构建 macOS 和 Windows 版本
   - 构建产物保存 7 天

2. **创建版本标签（推荐用于发布）**
   ```bash
   git tag v0.5.10
   git push origin v0.5.10
   ```
   - 自动构建所有平台
   - 自动创建 GitHub Release
   - 自动上传安装包到 Release

3. **手动触发**
   - 在 GitHub 仓库页面
   - 进入 Actions 标签
   - 选择 "Build Electron App" 工作流
   - 点击 "Run workflow"

#### 查看构建结果

1. 进入 GitHub 仓库的 **Actions** 标签
2. 查看最新的工作流运行
3. 构建完成后，点击工作流查看详情
4. 在 **Artifacts** 部分下载构建产物：
   - `macos-builds` - macOS 安装包（.dmg）
   - `windows-builds` - Windows 安装包（.exe）

## 📦 构建产物

### macOS
- `gaoqingsong_0.5.9_mac_x64.dmg` - Intel 芯片版本
- `gaoqingsong_0.5.9_mac_arm64.dmg` - Apple Silicon 版本

### Windows
- `gaoqingsong_0.5.9_win_x64.exe` - Windows 安装程序

## 🔧 GitHub Actions 工作流说明

工作流包含 3 个任务：

### 1. build-mac
- 运行环境：`macos-latest`
- 自动修复 dmg-builder 的 Python 3 兼容性问题
- 构建 macOS 版本（x64 和 arm64）
- 上传构建产物

### 2. build-windows
- 运行环境：`windows-latest`
- 构建 Windows 版本
- 上传构建产物

### 3. release（仅在创建标签时运行）
- 下载所有构建产物
- 创建 GitHub Release
- 上传安装包到 Release

## 🐛 常见问题

### Q: 为什么在 Windows 上不能构建 macOS 版本？
A: electron-builder 的限制，macOS 的 DMG 格式需要 macOS 系统的工具链支持。这是跨平台构建的常见限制。

### Q: 如何在本地构建所有平台？
A: 不可能在单一系统上构建所有平台。需要：
- 在 Windows 上构建 Windows 版本
- 在 macOS 上构建 macOS 版本
- 或使用 GitHub Actions 自动构建

### Q: GitHub Actions 构建失败怎么办？
A: 
1. 检查 Actions 标签中的错误日志
2. 确保 `fix-dmg-builder` 脚本正常运行
3. 检查 Node.js 和依赖版本是否兼容

### Q: 如何修改版本号？
A: 修改 `package.json` 中的 `version` 字段：
```json
{
  "version": "0.5.10"
}
```

## 📝 发布新版本的完整流程

1. **更新版本号**
   ```bash
   # 编辑 package.json，修改 version 字段
   npm version patch  # 或 minor, major
   ```

2. **提交更改**
   ```bash
   git add .
   git commit -m "chore: bump version to 0.5.10"
   ```

3. **创建标签并推送**
   ```bash
   git tag v0.5.10
   git push origin main
   git push origin v0.5.10
   ```

4. **等待 GitHub Actions 完成构建**
   - 访问 GitHub Actions 查看进度
   - 构建完成后会自动创建 Release

5. **编辑 Release 说明**
   - 在 GitHub Releases 页面
   - 编辑自动创建的 Release
   - 添加更新日志和说明

## 🔐 环境变量

GitHub Actions 会自动设置以下环境变量：
- `GH_TOKEN`: GitHub token，用于发布
- `ELECTRON_MIRROR`: 使用国内镜像加速下载

## 📚 相关文档

- [electron-builder 文档](https://www.electron.build/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [多平台构建说明](https://www.electron.build/multi-platform-build)

