@echo off
echo 正在清理旧的构建文件...
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

rd /s /q "dist_electron\win-unpacked" 2>nul
timeout /t 1 /nobreak >nul

echo 开始打包...
call npm run electron:build:win

pause



