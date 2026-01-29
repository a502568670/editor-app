import { autoUpdater } from "electron-updater"
const { dialog, BrowserWindow } = require('electron')
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";

import global from "./lib/global.js";
const verbose_log = global.utils.verbose_log;
const verbose_error = global.utils.verbose_error;

const log = require("electron-log")
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"

const path = require('path')

const isDevelopment = process.env.NODE_ENV === 'development'

// 防止报错no such file or directory dev-app-update.yml
if (isDevelopment) {
  autoUpdater.updateConfigPath = path.join(__dirname, '../dev-app-update.yml')
}

export default () => {
  let win = null

  //设置自动下载
  autoUpdater.autoDownload = false

  // 检测是否有新版本
  autoUpdater.checkForUpdates()

  autoUpdater.on('checking-for-update', res => {
    log.info("获取版本信息:" + res)
  })

  autoUpdater.on('update-not-available', res => {
    log.info("没有可更新版本:" + res)
  })

  autoUpdater.on('update-available', res => {
    log.info("发现新版本:", res)
    const currentVersion = require('electron').app.getVersion()
    const newVersion = res.version || '未知版本'
    
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `检测到新版本可用！\n\n当前版本: ${currentVersion}\n最新版本: ${newVersion}\n\n是否立即下载更新？`,
      detail: '更新后将获得最新功能和修复',
      buttons: ['立即更新', '稍后提醒', '忽略此版本'],
      defaultId: 0,
      cancelId: 1
    }).then(resp => {
      if (resp.response === 0) {
        // 立即更新
        createWindow()
        autoUpdater.downloadUpdate()
      } else if (resp.response === 1) {
        // 稍后提醒 - 下次启动时再次检查
        log.info("用户选择稍后更新")
      } else if (resp.response === 2) {
        // 忽略此版本
        log.info("用户选择忽略版本:", newVersion)
        // 可以将忽略的版本号保存到本地，下次不再提示
      }
    })
  })

  async function createWindow() {
    verbose_log("preload-updater path:", path.join(__dirname, "updater_preload.js"))
    win = new BrowserWindow({
      width: 300,
      height: 300,
      title: "稿轻松自动更新",
      frame: false,
      transparent: true,
      // alwaysOnTop: true,
      maximizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        enableRemoteModule: true,
        devTools: true,
        preload: path.join(__dirname, "preload.js"),
      },
    })

    let baseUrl
    if (process.env.WEBPACK_DEV_SERVER_URL == null) {
      try {
        createProtocol(global.common.APP_SCHEME);
      } catch (e) {
        log.info("createProtocol err:", e)
      } finally {
        log.info("finally block")
      }

      // baseUrl = `${global.common.APP_SCHEME}://./index.html/`; // Load "index.html" if the dev server URL does not exist.
      baseUrl = `${global.common.APP_SCHEME}://./index.html`; // Load "index.html" if the dev server URL does not exist.
    } else {
      baseUrl = process.env.WEBPACK_DEV_SERVER_URL; // Load the dev server URL if it exists.
    }
    log.info("baseUrl:", baseUrl)
    const updateUrl = `${baseUrl}#/update`
    // log.info("updateUrl:", updateUrl)
    // if (process.env.WEBPACK_DEV_SERVER_URL) {
    //     log.info("loadurl:" , process.env.WEBPACK_DEV_SERVER_URL)
    //     await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/update')
    // } else {
    //     win.loadURL('app://./index.html#/update')
    // }
    await win.loadURL(updateUrl)

    // 打开开发者工具

    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools();
    }
  }

  autoUpdater.on('download-progress', res => {
    log.info("下载监听:" + res)
    win.webContents.send('downloadProgress', res)
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '更新下载完成',
      message: '新版本已下载完成！',
      detail: '点击"立即安装"将退出应用并安装新版本\n点击"稍后安装"将在下次启动时安装',
      buttons: ['立即安装', '稍后安装'],
      defaultId: 0,
      cancelId: 1
    }).then((resp) => {
      if (resp.response === 0) {
        globalThis.__UPDATING__ = 1
        autoUpdater.quitAndInstall()
      } else {
        log.info("用户选择稍后安装，下次启动时将自动安装")
      }
    })
  })
}
