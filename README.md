# 稿轻松 (GaoQingSong)

一个基于 Electron + Vue 3 的桌面应用程序。

## 📦 快速开始

### 方式一：使用自动化脚本（推荐）

1. **检查 Git 配置**
   ```bash
   check-git.bat
   ```

2. **首次推送到 GitHub**
   ```bash
   push-to-github.bat
   ```

3. **发布新版本**
   ```bash
   release.bat
   ```

### 方式二：手动操作

详细步骤请查看 [QUICK_START.md](QUICK_START.md)

## 🚀 GitHub Actions

本项目已配置自动化构建和发布流程：

- **推送代码** → 自动构建所有平台
- **推送标签** → 自动创建 Release 并上传安装包
- **查看状态**: https://github.com/a502568670/editor-app/actions
- **下载版本**: https://github.com/a502568670/editor-app/releases

详细文档：[GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md)

## 🛠️ 开发说明

### 分支管理

- **master/main**: 用于打包，线上版本，每个新版本需要打 tag
- **dev**: 开发分支
- **feature/***: 功能分支

### 环境配置

- **测试环境**: http://47.96.22.8:8005
- **生产环境**: http://47.96.22.8:8006

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（测试环境）
npm run electron:dev

# 开发模式（生产环境）
npm run electron:prod

# 构建 Web 应用
npm run build

# 构建 Electron 应用
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build        # 当前平台
```

### 版本管理

```bash
# 自动更新版本号并推送
npm run version:patch  # 0.6.3 -> 0.6.4
npm run version:minor  # 0.6.3 -> 0.7.0
npm run version:major  # 0.6.3 -> 1.0.0

# 或使用发布脚本
release.bat
```

## 📝 项目结构

```
editor-app/
├── .github/
│   └── workflows/          # GitHub Actions 工作流
├── build/                  # 构建资源
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口
│   ├── assets/            # 资源文件
│   ├── components/        # Vue 组件
│   ├── views/             # 页面视图
│   ├── store/             # 状态管理
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   ├── background.js      # Electron 主进程
│   └── preload.js         # 预加载脚本
├── dist/                  # Web 构建输出
├── dist_electron/         # Electron 构建输出
├── package.json           # 项目配置
└── vue.config.js          # Vue 配置
```

## 🔧 技术栈

- **框架**: Vue 3 + Electron
- **UI 库**: Element Plus
- **状态管理**: Pinia + Vuex
- **构建工具**: Vue CLI + Electron Builder
- **CI/CD**: GitHub Actions

## 📚 文档

- [快速开始指南](QUICK_START.md)
- [GitHub Actions 使用指南](GITHUB_ACTIONS_GUIDE.md)
- [版本管理说明](VERSION_MANAGEMENT.md)
- [构建说明](BUILD_INSTRUCTIONS.md)
- [更新测试指南](UPDATE_TEST_GUIDE.md)

## 🔄 自动更新

打包后的更新包会自动上传到 GitHub Releases。

### 传统方式（可选）

如需手动上传到公司服务器：

**远程桌面**:
- 地址: 192.168.1.188
- 用户: Administrator
- 密码: Aa198932

**上传路径**:
```
C:\Users\Administrator\Desktop\my_fast_api\dajiala\static\gaoqingsong\autoupdate
```

## 📄 许可证

私有项目

## 👥 贡献者

- 开发团队

---

**当前版本**: v0.6.3

**最后更新**: 2026-02-05