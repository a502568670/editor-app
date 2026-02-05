@echo off
chcp 65001 >nul
echo ========================================
echo   修复 npm 镜像源问题
echo ========================================
echo.

echo [1/5] 设置 npm 源为官方源...
npm config set registry https://registry.npmjs.org/
echo.

echo [2/5] 删除旧的 package-lock.json...
del package-lock.json
echo.

echo [3/5] 删除 node_modules...
rmdir /s /q node_modules
echo.

echo [4/5] 清理 npm 缓存...
npm cache clean --force
echo.

echo [5/5] 重新安装依赖（使用官方源）...
npm install --legacy-peer-deps
echo.

echo ========================================
echo   修复完成！
echo ========================================
echo.
echo 现在可以推送到 GitHub 了
pause

