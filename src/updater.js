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
    dialog.showMessageBox({
      type: 'info',
      title: '软件更新',
      message: '发现新版本, 确定更新?',
      buttons: ['确定', '取消']
    }).then(resp => {
      if (resp.response == 0) {
        createWindow()
        autoUpdater.downloadUpdate()
      }
    })
  })

  async function createWindow() {
    verbose_log("preload-updater path:", path.join(__dirname, "updater_preload.js"))
    win = new BrowserWindow({
      width: 300,
      height: 300,
      title: "极致了编辑器自动更新",
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
      title: '下载完成',
      message: '最新版本已下载完成, 退出程序进行安装'
    }).then(() => {
      autoUpdater.quitAndInstall()
    })
  })
}
