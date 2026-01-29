; 自定义 NSIS 安装脚本
; 允许多个版本并存安装

!macro customInstall
  ; 在安装目录中添加版本号，使不同版本可以并存
  ; 默认安装路径会变成: C:\Users\用户名\AppData\Local\gaoqingsong-pro-0.5.9
!macroend

!macro customUnInstall
  ; 卸载时的自定义操作
  ; 不删除其他版本的安装
!macroend

