const { dialog, BrowserWindow, app, shell, ipcMain } = require('electron')
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";

import global from "./lib/global.js";
const verbose_log = global.utils.verbose_log;
const verbose_error = global.utils.verbose_error;

const log = require("electron-log")
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const url = require('url')

const isDevelopment = process.env.NODE_ENV === 'development'

// 更新配置
const UPDATE_CONFIG = {
  updateUrl: 'http://47.96.22.8:8091/get_last_v1',
  downloadBaseUrl: 'https://download.dajiala.com/test/'
}

// 获取用户数据目录
const userDataPath = app.getPath('userData')
const versionInfoPath = path.join(userDataPath, 'version-info.json')

// 保存版本信息
function saveVersionInfo(version, latestVersion) {
  const versionInfo = {
    currentVersion: version,
    latestVersion: latestVersion,
    lastCheckTime: new Date().toISOString()
  }
  try {
    fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2))
    log.info("版本信息已保存:", versionInfo)
  } catch (err) {
    log.error("保存版本信息失败:", err)
  }
}

// 读取版本信息
function loadVersionInfo() {
  try {
    if (fs.existsSync(versionInfoPath)) {
      const data = fs.readFileSync(versionInfoPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    log.error("读取版本信息失败:", err)
  }
  return null
}

// 比较版本号
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}

// 检查更新
async function checkForUpdates() {
  return new Promise((resolve, reject) => {
    log.info("开始检查更新:", UPDATE_CONFIG.updateUrl)
    
    const protocol = UPDATE_CONFIG.updateUrl.startsWith('https') ? https : http
    
    protocol.get(UPDATE_CONFIG.updateUrl, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        log.info("获取到更新信息:", data)
        
        try {
          const response = JSON.parse(data)
          
          if (response && response.code === 0 && response.data) {
            // 优先使用 latest_version，如果没有则使用 last_v1
            const latestVersion = response.data.latest_version || response.data.last_v1
            
            if (latestVersion) {
              // 转换为统一格式
              const updateInfo = {
                version: latestVersion,
                fileName: `稿轻松_${latestVersion}_win_x64.exe`,
                downloadUrl: `https://download.dajiala.com/download/稿轻松_${latestVersion}_win_x64.exe`
              }
              resolve(updateInfo)
            } else {
              reject(new Error("无法解析更新信息"))
            }
          } else {
            reject(new Error("无法解析更新信息"))
          }
        } catch (err) {
          log.error("解析 JSON 失败:", err)
          reject(err)
        }
      })
    }).on('error', (err) => {
      log.error("检查更新失败:", err)
      reject(err)
    })
  })
}

// 下载文件
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    log.info("开始下载:", url)
    log.info("保存到:", destPath)
    
    // 尝试对 URL 进行编码
    const encodedUrl = url.replace(/[\u4e00-\u9fa5]/g, (match) => encodeURIComponent(match))
    log.info("编码后的 URL:", encodedUrl)
    
    const protocol = encodedUrl.startsWith('https') ? https : http
    
    log.info("发起 HTTP 请求...")
    const request = protocol.get(encodedUrl, (res) => {
      log.info("响应状态码:", res.statusCode)
      log.info("响应头:", res.headers)
      
      if (res.statusCode === 302 || res.statusCode === 301) {
        // 处理重定向
        log.info("重定向到:", res.headers.location)
        downloadFile(res.headers.location, destPath, onProgress)
          .then(resolve)
          .catch(reject)
        return
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${res.statusCode}`))
        return
      }
      
      const totalSize = parseInt(res.headers['content-length'], 10)
      let downloadedSize = 0
      
      log.info("文件总大小:", (totalSize / 1024 / 1024).toFixed(2), "MB")
      
      const file = fs.createWriteStream(destPath)
      
      res.on('data', (chunk) => {
        downloadedSize += chunk.length
        file.write(chunk)
        
        if (onProgress && totalSize) {
          const percent = (downloadedSize / totalSize * 100)
          onProgress({
            percent: percent,
            transferred: downloadedSize,
            total: totalSize
          })
        }
      })
      
      res.on('end', () => {
        file.end()
        log.info("下载完成:", destPath)
        resolve(destPath)
      })
      
      res.on('error', (err) => {
        log.error("响应错误:", err)
        file.close()
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath)
        }
        reject(err)
      })
    })
    
    request.on('error', (err) => {
      log.error("请求错误:", err)
      reject(err)
    })
    
    request.setTimeout(30000, () => {
      log.error("请求超时")
      request.abort()
      reject(new Error("下载超时"))
    })
  })
}

export default async () => {
  const currentVersion = app.getVersion()
  
  log.info("当前应用版本:", currentVersion)
  
  // 立即检查更新，不延迟
  try {
    log.info("开始检查更新...")
    const updateInfo = await checkForUpdates()
    
    log.info("服务器最新版本:", updateInfo.version)
    log.info("当前应用版本:", currentVersion)
    
    // 比较版本：如果服务器版本 > 当前版本，说明有新版本
    if (compareVersions(updateInfo.version, currentVersion) > 0) {
      log.info("发现新版本，提示更新")
      
      // 保存版本信息
      saveVersionInfo(currentVersion, updateInfo.version)
      
      // 提示用户下载
      const result = await dialog.showMessageBox({
        type: 'info',
        title: '🎉 发现新版本',
        message: `稿轻松有新版本啦！`,
        detail: `当前版本：v${currentVersion}\n最新版本：v${updateInfo.version}\n\n新版本已准备就绪，建议您立即更新以获得更好的体验。`,
        buttons: ['立即更新', '稍后提醒', '忽略此版本'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      })
      
      if (result.response === 0) {
        // 立即下载最新版本
        await downloadAndInstall(updateInfo)
      } else if (result.response === 1) {
        log.info("用户选择稍后更新")
      } else if (result.response === 2) {
        log.info("用户选择忽略版本:", updateInfo.version)
      }
    } else {
      log.info("已是最新版本，无需更新")
      saveVersionInfo(currentVersion, currentVersion)
    }
  } catch (err) {
    log.error("检查更新失败:", err)
  }
}

// 下载并安装
async function downloadAndInstall(updateInfo) {
  try {
    // 获取文件名和下载地址
    const fileName = updateInfo.fileName || updateInfo.path || `稿轻松_${updateInfo.version}_win_x64.exe`
    
    // 内测模式：先尝试使用本地文件
    const localFilePath = path.join(__dirname, '..', '..', 'dist_electron', `gaoqingsong_${updateInfo.version}_win_x64.exe`)
    
    let destPath = localFilePath
    
    // 检查本地文件是否存在
    if (fs.existsSync(localFilePath)) {
      log.info("内测模式：使用本地文件:", localFilePath)
    } else {
      log.info("本地文件不存在，从服务器下载")
      
      // 从服务器下载
      const downloadUrl = `https://download.dajiala.com/download/稿轻松_${updateInfo.version}_win_x64.exe`
      const tempDir = app.getPath('temp')
      destPath = path.join(tempDir, fileName)
      
      log.info("准备下载:", downloadUrl)
      
      // 创建进度窗口
      let progressWindow = new BrowserWindow({
        width: 500,
        height: 250,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true
        }
      })
      
      // 监听窗口控制事件
      const minimizeHandler = () => {
        if (progressWindow && !progressWindow.isDestroyed()) {
          progressWindow.minimize()
        }
      }
      
      const closeHandler = () => {
        if (progressWindow && !progressWindow.isDestroyed()) {
          progressWindow.close()
        }
      }
      
      ipcMain.on('minimize-progress-window', minimizeHandler)
      ipcMain.on('close-progress-window', closeHandler)
      
      // 加载进度页面 - 使用独立的 HTML 文件
      const progressHtmlPath = isDevelopment
        ? path.join(__dirname, '..', 'public', 'download-progress.html')
        : path.join(__dirname, 'download-progress.html')
      
      log.info("加载进度页面:", progressHtmlPath)
      
      try {
        await progressWindow.loadFile(progressHtmlPath)
        log.info("进度窗口加载完成")
      } catch (err) {
        log.error("加载进度窗口失败:", err)
        throw err
      }
      
      // 打开开发者工具（调试用）
      if (isDevelopment) {
        progressWindow.webContents.openDevTools({ mode: 'detach' })
      }
      
      // 等待一下确保页面渲染完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 显示下载进度
      const showProgress = (progress) => {
        log.info("下载进度:", progress.percent.toFixed(1) + "%", 
                 (progress.transferred / 1024 / 1024).toFixed(2) + "MB", 
                 "/", 
                 (progress.total / 1024 / 1024).toFixed(2) + "MB")
        
        if (progressWindow && !progressWindow.isDestroyed()) {
          progressWindow.webContents.send('download-progress', progress)
        }
      }
      
      // 开始下载
      try {
        await downloadFile(downloadUrl, destPath, showProgress)
        
        // 下载完成，移除 IPC 监听器
        ipcMain.removeListener('minimize-progress-window', minimizeHandler)
        ipcMain.removeListener('close-progress-window', closeHandler)
        
        // 关闭进度窗口
        if (progressWindow && !progressWindow.isDestroyed()) {
          progressWindow.close()
          progressWindow = null
        }
        // 等待一下确保窗口完全关闭
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        // 下载失败，移除 IPC 监听器
        ipcMain.removeListener('minimize-progress-window', minimizeHandler)
        ipcMain.removeListener('close-progress-window', closeHandler)
        
        // 关闭进度窗口
        if (progressWindow && !progressWindow.isDestroyed()) {
          progressWindow.close()
          progressWindow = null
        }
        throw err
      }
    }
    
    // 下载完成，显示确认对话框
    log.info("下载完成，显示安装确认对话框")
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '✅ 下载完成',
      message: '新版本安装包已准备就绪！',
      detail: '点击"立即安装"开始更新\n安装过程中应用将自动关闭\n安装完成后请重新启动应用',
      buttons: ['立即安装', '稍后安装'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    })
    
    if (result.response === 0) {
      // 打开安装程序
      log.info("打开安装程序:", destPath)
      shell.openPath(destPath)
      
      // 退出当前应用
      setTimeout(() => {
        app.quit()
      }, 1000)
    } else {
      log.info("用户选择稍后安装，安装包位置:", destPath)
      
      // 提示用户安装包位置
      dialog.showMessageBox({
        type: 'info',
        title: '📦 安装包已保存',
        message: '您可以稍后手动安装',
        detail: `安装包位置：\n${destPath}\n\n点击"打开文件夹"可查看安装包`,
        buttons: ['打开文件夹', '我知道了'],
        defaultId: 0,
        noLink: true
      }).then(resp => {
        if (resp.response === 0) {
          shell.showItemInFolder(destPath)
        }
      })
    }
  } catch (err) {
    log.error("下载安装失败:", err)
    dialog.showMessageBox({
      type: 'error',
      title: '❌ 下载失败',
      message: '更新下载失败',
      detail: `错误信息：${err.message}\n\n请检查网络连接后重试，或访问官网手动下载更新。`,
      buttons: ['我知道了'],
      noLink: true
    })
  }
}
