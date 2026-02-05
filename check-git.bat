@echo off
chcp 65001 >nul
echo ========================================
echo   Git 配置检查工具
echo ========================================
echo.

REM 检查 Git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Git 未安装或未添加到 PATH
    echo.
    echo 请访问 https://git-scm.com/download/win 下载安装 Git
    pause
    exit /b 1
)

echo [✓] Git 已安装
git --version
echo.

REM 检查用户名配置
for /f "tokens=*" %%a in ('git config --global user.name 2^>nul') do set git_name=%%a
if "%git_name%"=="" (
    echo [!] Git 用户名未配置
    set /p new_name="请输入你的名字: "
    git config --global user.name "!new_name!"
    echo [✓] 用户名已设置为: !new_name!
) else (
    echo [✓] Git 用户名: %git_name%
)
echo.

REM 检查邮箱配置
for /f "tokens=*" %%a in ('git config --global user.email 2^>nul') do set git_email=%%a
if "%git_email%"=="" (
    echo [!] Git 邮箱未配置
    set /p new_email="请输入你的邮箱: "
    git config --global user.email "!new_email!"
    echo [✓] 邮箱已设置为: !new_email!
) else (
    echo [✓] Git 邮箱: %git_email%
)
echo.

REM 检查是否初始化了仓库
if not exist .git (
    echo [!] Git 仓库未初始化
    echo.
    set /p init_repo="是否现在初始化? (Y/N): "
    if /i "!init_repo!"=="Y" (
        git init
        echo [✓] Git 仓库已初始化
    )
) else (
    echo [✓] Git 仓库已初始化
)
echo.

REM 检查远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [!] 远程仓库未配置
    echo.
    set /p add_remote="是否添加远程仓库 https://github.com/a502568670/editor-app.git? (Y/N): "
    if /i "!add_remote!"=="Y" (
        git remote add origin https://github.com/a502568670/editor-app.git
        echo [✓] 远程仓库已添加
    )
) else (
    echo [✓] 远程仓库已配置
    git remote -v
)
echo.

REM 检查当前分支
for /f "tokens=*" %%a in ('git branch --show-current 2^>nul') do set current_branch=%%a
if "%current_branch%"=="" (
    echo [!] 当前不在任何分支上
) else (
    echo [✓] 当前分支: %current_branch%
)
echo.

REM 检查是否有未提交的更改
git diff --quiet 2>nul
if errorlevel 1 (
    echo [!] 有未提交的更改
    git status -s
) else (
    git diff --cached --quiet 2>nul
    if errorlevel 1 (
        echo [!] 有已暂存但未提交的更改
        git status -s
    ) else (
        echo [✓] 工作区干净，没有未提交的更改
    )
)
echo.

echo ========================================
echo   配置检查完成
echo ========================================
echo.
echo 下一步：
echo 1. 运行 push-to-github.bat 推送代码
echo 2. 运行 release.bat 发布新版本
echo.
pause

