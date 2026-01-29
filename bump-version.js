#!/usr/bin/env node

/**
 * 自动版本升级脚本
 * 用法：
 *   node bump-version.js patch  # 0.5.9 -> 0.5.10
 *   node bump-version.js minor  # 0.5.9 -> 0.6.0
 *   node bump-version.js major  # 0.5.9 -> 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

const versionType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major'];

if (!validTypes.includes(versionType)) {
  console.error(`❌ 无效的版本类型: ${versionType}`);
  console.error(`   有效类型: ${validTypes.join(', ')}`);
  process.exit(1);
}

// 解析当前版本
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 计算新版本
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`📦 当前版本: ${currentVersion}`);
console.log(`🚀 新版本: ${newVersion}`);

// 更新 package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ 已更新 package.json`);

// Git 操作
try {
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  
  console.log(`✅ 已创建 Git commit 和 tag: v${newVersion}`);
  console.log(`\n📌 下一步操作：`);
  console.log(`   git push origin master`);
  console.log(`   git push origin v${newVersion}`);
} catch (error) {
  console.error(`❌ Git 操作失败:`, error.message);
  process.exit(1);
}

