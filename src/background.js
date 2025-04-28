/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 16:28:26
 * @LastEditors:
 * @LastEditTime: 2022-12-30 09:46:46
 */
'use strict'

import { app, protocol, BrowserWindow,Menu } from 'electron'
Menu.setApplicationMenu(null) //取消菜单栏
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import { createTabbedWin } from './lib/window'
import global from './lib/global'
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-web-security');
// 忽略证书相关错误
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('ignore-ssl-errors')
app.commandLine.appendSwitch("disable-site-isolation-trials");

/**
 * 兼容https非可信域
 */
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  console.log('certificate-error', error);
  //允许私有证书
  event.preventDefault()
  callback(true)
});

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
  {
    scheme: 'http',
    privileges: {
      bypassCSP: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  },
  {
    scheme: 'https',
    privileges: {
      bypassCSP: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);
let tabbedWin = null



// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createTabbedWin()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      // await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  tabbedWin = await createTabbedWin()
})

app.on("second-instance", () => {
  if (tabbedWin != null) {
    if (tabbedWin.win.isMinimized()) {
      tabbedWin.win.restore();
    } // end if

    tabbedWin.win.focus();
  } // end if
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
