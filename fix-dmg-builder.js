const fs = require('fs');
const path = require('path');

// 修复 dmg-builder 的 Python 3 兼容性问题
const corePyPath = path.join(__dirname, 'node_modules', 'dmg-builder', 'vendor', 'dmgbuild', 'core.py');

if (fs.existsSync(corePyPath)) {
  let content = fs.readFileSync(corePyPath, 'utf8');
  
  // 移除 reload(sys) 这一行
  content = content.replace(/reload\(sys\)\s*#\s*Reload is a hack\n/g, '# reload(sys) removed for Python 3 compatibility\n');
  
  fs.writeFileSync(corePyPath, content, 'utf8');
  console.log('✓ 已修复 dmg-builder Python 3 兼容性问题');
} else {
  console.log('✗ 未找到 core.py 文件，请先运行 npm install');
}

