/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 16:28:26
 * @LastEditors:
 * @LastEditTime: 2022-12-30 09:46:46
 */
'use strict'

import { app, protocol, BrowserWindow, Menu,session, dialog } from 'electron'
import updater from "./updater"
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
app.commandLine.appendSwitch("disable-http2");

const is_dev_check_update = global.utils.is_dev_check_update;

// dev check update
if (is_dev_check_update()) {
  Object.defineProperty(app, 'isPackaged', {
    get() {
      return true;
    }
  });
}


function createMenu() {
  // darwin表示macOS，针对macOS的设置  process.platform === 'darwin'
  if (process.platform === 'darwin') {
    const template = [{
      label: '我的应用',
      submenu: [
        { label: '关于', accelerator: 'CmdOrCtrl+I', role: 'about' },
        { type: 'separator' },
        { label: '隐藏', role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { label: '退出', accelerator: 'Command+Q', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    }]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    // windows及linux系统
    Menu.setApplicationMenu(null)
  }
}
// Menu.setApplicationMenu(null) //取消菜单栏
createMenu()
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

app.setAsDefaultProtocolClient('app');

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
  updater()
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      // await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  tabbedWin = await createTabbedWin()
  var confirmed=false;
  tabbedWin.win.on('close',async (evt)=>{
    if(process.platform==='win32'&&!globalThis.__UPDATING__&&!confirmed){
      evt.preventDefault();
      var res = await dialog.showMessageBox(tabbedWin.win,{
        type:'info',message:'确认退出稿轻松吗？',
        buttons:['取消','确认退出'],noLink:true,
      })
      if(res.response===1){
        confirmed=true;
        app.quit(0);
      }
    }
  })
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
