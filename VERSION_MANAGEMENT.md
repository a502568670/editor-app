# 版本管理指南

## 📦 版本号说明

版本号格式：`主版本.次版本.补丁版本` (例如：`0.5.9`)

- **主版本 (Major)**：重大更新，可能包含不兼容的 API 变更
- **次版本 (Minor)**：新功能添加，向后兼容
- **补丁版本 (Patch)**：Bug 修复，向后兼容

---

## 🔄 自动升级版本号

### 方法 1：使用 npm version 命令（推荐）

```bash
# 升级补丁版本 (0.5.9 → 0.5.10)
npm version patch

# 升级次版本 (0.5.9 → 0.6.0)
npm version minor

# 升级主版本 (0.5.9 → 1.0.0)
npm version major

# 指定具体版本
npm version 0.6.0
```

**自动完成的操作**：
- ✅ 修改 `package.json` 中的版本号
- ✅ 创建 Git commit
- ✅ 创建 Git tag (如 `v0.6.0`)

**推送到远程**：
```bash
git push origin master
git push origin --tags
```

---

### 方法 2：使用项目提供的快捷命令

```bash
# 升级补丁版本并推送
npm run version:patch

# 升级次版本并推送
npm run version:minor

# 升级主版本并推送
npm run version:major
```

**自动完成的操作**：
- ✅ 升级版本号
- ✅ 创建 Git commit 和 tag
- ✅ 推送到 Gitee 和 GitHub

---

### 方法 3：使用自定义脚本

```bash
# 升级补丁版本
node bump-version.js patch

# 升级次版本
node bump-version.js minor

# 升级主版本
node bump-version.js major
```

**手动推送**：
```bash
git push origin master
git push origin v0.6.0
```

---

### 方法 4：发布新版本（升级版本 + 构建）

```bash
# 升级补丁版本并构建所有平台
npm run release:patch

# 升级次版本并构建所有平台
npm run release:minor
```

**自动完成的操作**：
- ✅ 升级版本号
- ✅ 创建 Git commit 和 tag
- ✅ 推送到远程仓库
- ✅ 构建 Windows、macOS、Linux 版本

---

## 🚀 完整发布流程

### 步骤 1：升级版本号

```bash
# 根据更新类型选择
npm run version:patch   # Bug 修复
npm run version:minor   # 新功能
npm run version:major   # 重大更新
```

### 步骤 2：构建应用

```bash
# 本地构建（可选）
npm run electron:build:win   # Windows
npm run electron:build:mac   # macOS
npm run electron:build:all   # 所有平台
```

或者等待 GitHub Actions 自动构建。

### 步骤 3：上传到更新服务器

将以下文件上传到 `http://47.96.22.8:8006/autoupdate/`：

- `latest.yml`
- `gaoqingsong-pro_0.6.0_win_x64.exe`
- `gaoqingsong-pro_0.6.0_win_x64.exe.blockmap`
- `gaoqingsong-pro_0.6.0_mac_x64.dmg` (macOS)
- `gaoqingsong-pro_0.6.0_mac_arm64.dmg` (macOS ARM)

### 步骤 4：测试自动更新

1. 安装旧版本应用
2. 启动应用
3. 应用会自动检测到新版本
4. 提示用户更新

---

## 📋 版本发布检查清单

发布新版本前请确认：

- [ ] 代码已提交并推送
- [ ] 版本号已正确升级
- [ ] 更新日志已编写（可选）
- [ ] 本地测试通过
- [ ] 构建文件已生成
- [ ] 更新服务器文件已上传
- [ ] 自动更新功能已测试

---

## 🔍 查看当前版本

### 在代码中查看
```bash
# 查看 package.json
cat package.json | grep version
```

### 在应用中查看
应用启动时会在日志中显示：
```
当前应用版本: 0.5.9
```

### 查看 Git 标签
```bash
# 查看所有版本标签
git tag

# 查看最新标签
git describe --tags --abbrev=0
```

---

## 🛠️ 版本回退

如果需要回退版本：

```bash
# 1. 回退 package.json
git checkout HEAD~1 package.json

# 2. 删除错误的 tag
git tag -d v0.6.0
git push origin :refs/tags/v0.6.0

# 3. 重新提交
git add package.json
git commit -m "revert: rollback version"
git push origin master
```

---

## 📊 版本历史

查看版本历史：

```bash
# 查看所有版本标签
git tag -l

# 查看版本提交历史
git log --oneline --decorate --tags

# 查看特定版本的变更
git show v0.6.0
```

---

## 🔗 相关命令速查

| 命令 | 说明 |
|------|------|
| `npm version patch` | 升级补丁版本 |
| `npm version minor` | 升级次版本 |
| `npm version major` | 升级主版本 |
| `npm run version:patch` | 升级补丁版本并推送 |
| `npm run version:minor` | 升级次版本并推送 |
| `npm run release:patch` | 升级补丁版本并构建 |
| `npm run release:minor` | 升级次版本并构建 |
| `node bump-version.js patch` | 使用自定义脚本升级 |
| `git tag` | 查看所有版本标签 |
| `git push --tags` | 推送所有标签 |

---

## ⚠️ 注意事项

1. **版本号只能增加，不能减少**
2. **发布前务必测试**
3. **确保更新服务器文件正确上传**
4. **主版本升级需要特别注意兼容性**
5. **每次发布都应该创建 Git tag**
6. **保持版本号与 Git tag 一致**

---

## 🎯 最佳实践

1. **小步快跑**：频繁发布小版本，而不是积累大量更改
2. **语义化版本**：严格遵循语义化版本规范
3. **自动化**：使用脚本自动化版本升级和发布流程
4. **测试充分**：每个版本发布前都要充分测试
5. **文档更新**：更新 CHANGELOG 记录版本变更
6. **备份旧版本**：保留旧版本的安装包以便回退

