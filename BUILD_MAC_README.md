# macOS 构建说明

## 问题描述

在 macOS 上构建 DMG 安装包时，可能会遇到以下错误：

```
NameError: name 'reload' is not defined
```

这是因为 `dmg-builder` 包中的 Python 脚本使用了 Python 2 的语法，而系统使用的是 Python 3。

## 解决方案

### 自动修复（推荐）

项目已经配置了自动修复脚本。只需运行：

```bash
npm run fix-dmg-builder
```

或者重新安装依赖（会自动运行修复）：

```bash
npm install
```

### 手动修复

如果自动修复失败，可以手动编辑文件：

1. 打开文件：`node_modules/dmg-builder/vendor/dmgbuild/core.py`
2. 找到第 7 行：`reload(sys)  # Reload is a hack`
3. 将其注释掉或删除：`# reload(sys)  # Reload is a hack`
4. 保存文件

### 构建 macOS 应用

修复后，运行以下命令构建 macOS 应用：

```bash
npm run electron:build:mac
```

这将生成：
- `dist_electron/gaoqingsong_0.5.9_mac_x64.dmg` (Intel 芯片)
- `dist_electron/gaoqingsong_0.5.9_mac_arm64.dmg` (Apple Silicon)

## 注意事项

1. **代码签名**：构建过程会跳过代码签名（因为没有配置 Apple Developer ID）。如果需要分发应用，建议配置代码签名。

2. **Python 版本**：确保系统安装了 Python 3。可以通过以下命令检查：
   ```bash
   python3 --version
   ```

3. **依赖更新**：每次运行 `npm install` 后，修复脚本会自动运行。

## 其他构建选项

- 仅构建 Windows 版本：`npm run electron:build:win`
- 构建所有平台：`npm run electron:build:all`

## 常见问题

### Q: 为什么需要修复这个问题？
A: `dmg-builder` 是一个较老的包，它的 Python 脚本还在使用 Python 2 的语法。Python 3 移除了 `reload()` 函数，导致构建失败。

### Q: 这个修复是否安全？
A: 是的。`reload(sys)` 这行代码在 Python 3 中是不必要的，移除它不会影响 DMG 的构建功能。

### Q: 每次安装依赖都需要修复吗？
A: 是的，因为 `npm install` 会重新安装 `node_modules`。但项目已配置自动修复，无需手动操作。

