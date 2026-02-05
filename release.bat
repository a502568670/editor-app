@echo off
chcp 65001 >nul
echo ========================================
echo   版本发布脚本
echo ========================================
echo.

REM 显示当前版本
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do (
    set current_version=%%a
)
set current_version=%current_version:"=%
echo 当前版本: %current_version%
echo.

REM 选择版本类型
echo 请选择版本更新类型：
echo 1. Patch (修复bug) - 例如: 0.6.3 -^> 0.6.4
echo 2. Minor (新功能) - 例如: 0.6.3 -^> 0.7.0
echo 3. Major (重大更新) - 例如: 0.6.3 -^> 1.0.0
echo 4. 自定义版本号
echo 5. 取消
echo.

set /p choice="请输入选项 (1-5): "

if "%choice%"=="1" (
    set version_type=patch
    goto :update_version
)
if "%choice%"=="2" (
    set version_type=minor
    goto :update_version
)
if "%choice%"=="3" (
    set version_type=major
    goto :update_version
)
if "%choice%"=="4" (
    goto :custom_version
)
if "%choice%"=="5" (
    echo 已取消
    pause
    exit /b 0
)

echo 无效的选项
pause
exit /b 1

:custom_version
set /p new_version="请输入新版本号 (例如: 0.6.4): "
if "%new_version%"=="" (
    echo 版本号不能为空
    pause
    exit /b 1
)
echo.
echo [1/5] 更新版本号到 %new_version%...
npm version %new_version% --no-git-tag-version
goto :after_version_update

:update_version
echo.
echo [1/5] 更新版本号 (%version_type%)...
npm version %version_type% --no-git-tag-version

:after_version_update
if errorlevel 1 (
    echo 版本更新失败
    pause
    exit /b 1
)

REM 获取新版本号
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do (
    set new_version=%%a
)
set new_version=%new_version:"=%
echo 新版本: %new_version%
echo.

REM 提交更改
echo [2/5] 提交版本更改...
git add package.json package-lock.json
git commit -m "chore: bump version to %new_version%"
echo.

REM 创建标签
echo [3/5] 创建 Git 标签 v%new_version%...
git tag v%new_version%
echo.

REM 推送代码
echo [4/5] 推送代码到 GitHub...
git push
echo.

REM 推送标签
echo [5/5] 推送标签到 GitHub...
git push --tags
echo.

if errorlevel 1 (
    echo ========================================
    echo   发布失败！
    echo ========================================
    echo.
    echo 请检查网络连接和 GitHub 权限
    pause
    exit /b 1
)

echo ========================================
echo   发布成功！
echo ========================================
echo.
echo 版本: v%new_version%
echo.
echo GitHub Actions 将自动：
echo 1. 构建 Windows、macOS、Linux 版本
echo 2. 创建 GitHub Release
echo 3. 上传安装包
echo.
echo 查看构建状态：
echo https://github.com/a502568670/editor-app/actions
echo.
echo 查看发布版本：
echo https://github.com/a502568670/editor-app/releases
echo.
pause

