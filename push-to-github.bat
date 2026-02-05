@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub 推送和部署脚本
echo ========================================
echo.

REM 检查是否已经初始化 Git
if not exist .git (
    echo [1/6] 初始化 Git 仓库...
    git init
    echo Git 仓库初始化完成
    echo.
) else (
    echo [1/6] Git 仓库已存在，跳过初始化
    echo.
)

REM 检查是否已添加远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [2/6] 添加远程仓库...
    git remote add origin https://github.com/a502568670/editor-app.git
    echo 远程仓库添加完成
    echo.
) else (
    echo [2/6] 远程仓库已存在
    git remote -v
    echo.
)

REM 添加所有文件
echo [3/6] 添加文件到 Git...
git add .
echo 文件添加完成
echo.

REM 提交
echo [4/6] 提交更改...
set /p commit_msg="请输入提交信息 (默认: Update with GitHub Actions): "
if "%commit_msg%"=="" set commit_msg=Update with GitHub Actions
git commit -m "%commit_msg%"
echo 提交完成
echo.

REM 设置主分支
echo [5/6] 设置主分支为 main...
git branch -M main
echo.

REM 推送到 GitHub
echo [6/6] 推送到 GitHub...
git push -u origin main
echo.

if errorlevel 1 (
    echo ========================================
    echo   推送失败！
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 需要配置 Git 用户信息
    echo 2. 需要 GitHub 访问权限
    echo 3. 远程仓库不存在
    echo.
    echo 请尝试以下命令：
    echo   git config --global user.name "你的名字"
    echo   git config --global user.email "你的邮箱"
    echo.
    pause
    exit /b 1
)

echo ========================================
echo   推送成功！
echo ========================================
echo.
echo 下一步：
echo 1. 访问 GitHub Actions: https://github.com/a502568670/editor-app/actions
echo 2. 查看构建状态
echo.
echo 如需发布新版本，请运行：
echo   npm version patch
echo   git push --tags
echo.
pause

