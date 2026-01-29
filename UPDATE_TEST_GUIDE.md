# 自动更新功能测试指南

## 方案 A：开发模式快速测试（推荐）

### 1. 准备更新服务器

在更新服务器 `http://47.96.22.8:8006/autoupdate/` 上放置以下文件：

#### latest.yml
```yaml
version: 0.6.0
files:
  - url: gaoqingsong-pro_0.6.0_win_x64.exe
    sha512: [构建时自动生成]
    size: [文件大小]
path: gaoqingsong-pro_0.6.0_win_x64.exe
sha512: [构建时自动生成]
releaseDate: '2026-01-28T06:00:00.000Z'
```

#### 更新文件
- `gaoqingsong-pro_0.6.0_win_x64.exe`
- `gaoqingsong-pro_0.6.0_win_x64.exe.blockmap`

### 2. 运行开发模式测试

```bash
# 启用更新检查的开发模式
npm run electron:dev:update
```

### 3. 观察日志

应用启动后会自动检查更新，查看控制台输出：
- `获取版本信息:` - 开始检查
- `发现新版本:` - 检测到更新
- `没有可更新版本:` - 已是最新版本

### 4. 测试更新流程

如果检测到新版本，会弹出对话框：
```
检测到新版本可用！

当前版本: 0.5.9
最新版本: 0.6.0

是否立即下载更新？

[立即更新] [稍后提醒] [忽略此版本]
```

点击"立即更新"后：
1. 打开下载进度窗口
2. 显示下载进度
3. 下载完成后提示安装

---

## 方案 B：生产环境完整测试

### 步骤 1：构建旧版本（0.5.9）

```bash
npm run electron:build:win
```

安装生成的 `dist_electron/gaoqingsong-pro_0.5.9_win_x64.exe`

### 步骤 2：构建新版本（0.6.0）

1. 修改 `package.json` 中的版本号：
```json
"version": "0.6.0",
```

2. 构建新版本：
```bash
npm run electron:build:win
```

### 步骤 3：上传更新文件

将 `dist_electron` 目录下的以下文件上传到更新服务器：
- `latest.yml`
- `gaoqingsong-pro_0.6.0_win_x64.exe`
- `gaoqingsong-pro_0.6.0_win_x64.exe.blockmap`

上传到：`http://47.96.22.8:8006/autoupdate/`

### 步骤 4：测试更新

1. 运行已安装的 0.5.9 版本
2. 应用启动时自动检查更新
3. 看到更新提示
4. 点击"立即更新"下载
5. 下载完成后点击"立即安装"
6. 应用退出并安装新版本
7. 重新打开应用，验证版本号为 0.6.0

---

## 方案 C：模拟更新服务器（本地测试）

### 1. 安装本地 HTTP 服务器

```bash
npm install -g http-server
```

### 2. 创建本地更新目录

```bash
mkdir autoupdate
cd autoupdate
```

### 3. 放置更新文件

将构建的文件复制到 `autoupdate` 目录：
- `latest.yml`
- `gaoqingsong-pro_0.6.0_win_x64.exe`
- `gaoqingsong-pro_0.6.0_win_x64.exe.blockmap`

### 4. 启动本地服务器

```bash
http-server -p 8006 --cors
```

### 5. 修改更新 URL（临时测试）

修改 `vue.config.js`：
```javascript
publish: [
  {
    provider: 'generic',
    url: 'http://localhost:8006/autoupdate'
  }
]
```

### 6. 重新构建并测试

```bash
npm run electron:build:win
```

---

## 检查更新服务器配置

### 当前配置

- **生产环境**: `http://47.96.22.8:8006/autoupdate`
- **开发环境**: `http://47.96.22.8:8006/autoupdate` (dev-app-update.yml)

### 验证服务器

访问以下 URL 确认文件可访问：
- `http://47.96.22.8:8006/autoupdate/latest.yml`
- `http://47.96.22.8:8006/autoupdate/gaoqingsong-pro_0.6.0_win_x64.exe`

---

## 常见问题

### 1. 开发模式不检查更新

确保设置了 `DEV_CHECK_UPDATE=true` 环境变量：
```bash
npm run electron:dev:update
```

### 2. 找不到更新

检查：
- 更新服务器是否可访问
- `latest.yml` 文件格式是否正确
- 版本号是否大于当前版本

### 3. 下载失败

检查：
- 网络连接
- 文件权限
- 防火墙设置

### 4. 查看详细日志

日志文件位置：
- Windows: `%USERPROFILE%\AppData\Roaming\gaoqingsong-pro\logs\`
- macOS: `~/Library/Logs/gaoqingsong-pro/`

---

## 测试清单

- [ ] 开发模式能检测到更新
- [ ] 更新提示显示正确的版本号
- [ ] 可以选择"立即更新"、"稍后提醒"、"忽略此版本"
- [ ] 下载进度正常显示
- [ ] 下载完成后能正常安装
- [ ] 安装后版本号正确更新
- [ ] 多版本可以并存安装
- [ ] 旧版本打开时提示更新

---

## 快速测试命令

```bash
# 1. 开发模式测试更新
npm run electron:dev:update

# 2. 构建 Windows 版本
npm run electron:build:win

# 3. 构建 macOS 版本
npm run electron:build:mac

# 4. 构建所有平台
npm run electron:build:all
```

