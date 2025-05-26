/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 17:05:04
 * @LastEditors:
 * @LastEditTime: 2023-05-22 16:59:48
 */
import { TabbedWindow } from "./tabbed-window.js";
import { nativeTheme, screen, dialog, Notification, app, ipcMain, webContents, net, BrowserWindow } from 'electron'
import { localExtractMpArticleUrlUseRequest } from "./mp_account-tasks.js"
import { postJsonToJZLApi } from "./request.js"
const path = require('path')
const fs =require('fs')
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import global from "./global.js";
import log from "electron-log";
import { platform } from "process";
import iconv from 'iconv-lite';

const shell = require('electron').shell;
import * as zhCN from '../locales/zh-CN.json'
const verbose_log = global.utils.verbose_log;
const verbose_error = global.utils.verbose_error;
const get_backend_url_old = global.utils.get_backend_url_old;
var {batchWechatData} = require('../api/stat.js');

let tabbedWin;
function showMsg(msg) {
  dialog.showMessageBox({
    type: 'info',
    title: '消息提示',
    message: msg,
    buttons: ['关闭']
  }, (index) => {
    if (index == 0) {
      verbose_log('You click ok.');
    } else {
      verbose_log('You click cancel');
    }
  })
}
let companyMap = {

}
let userToken = '';

// HTTP POST 请求封装函数
const post = function (url, postData, newheaders) {
  // verbose_log("数据接收完成", url);
  verbose_log("要发送的数据", postData);
  verbose_log("userToken", userToken);
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Authorization': `Bearer ${userToken}`
      // 'Content-Type': 'application/x-www-form-urlencoded'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }

    const [backend_protocol, backend_host, backend_port] = get_backend_url_old()
    // const backend_url = process.env.BACKEND_URL
    // verbose_log("post in wechat backend_url:", process.env.BACKEND_URL)
    // let [backend_protocol, backend_host, backend_port] = backend_url.split(":")
    // backend_protocol = backend_protocol + ":"
    // backend_host = backend_host.substring(2)
    // backend_port = parseInt(backend_port)
    verbose_log("backend_protocol=>", backend_protocol)
    verbose_log("backend_host=>", backend_host)
    verbose_log("backend_port=>", backend_port)

    // 使用 net.request 创建一个 POST 请求，配置包括协议、主机地址、端口、路径和请求头。
    const request = net.request({
      method: 'post',
      protocol: backend_protocol, // 使用 http 协议
      hostname: backend_host, // 设为本地地址
      port: backend_port, // 设为端口 8000
      path: url, // 直接使用传入的 url
      headers: headers
    });
    // 处理响应
    request.on('response', (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        verbose_log("数据接收完成");
        if (response.statusCode == 200) {
          verbose_log("数据接收完成", data);
          resolve(data);
        } else {
          reject();
        }
      });
    });
    // 构造请求体： 遍历 postData 对象，将其键值对拼接成 key=value& 格式的字符串，并通过 request.write 发送。
    let param = "";
    for (let key in postData) {
      param += (key + '=' + postData[key] + '&');
    }
    // let encodeParams =  encodeURI(param) // 解决服务端中文乱码
    // request.write(encodeParams);
    request.write(param);
    request.end();
  });
}
const postToken = async function (platform, cookie, localStorage, sessionStorage, originalUsername, name, avatar, token) {
  let url = '/platform/addAccount'; // 保留这个部分
  let data = { cookie: cookie, localStorage: localStorage || {}, sessionStorage: sessionStorage || {} };
  if (!platform || !platform.id) {
    return null;
  }
  try {

    verbose_log("in postToken name===", name)
    let resultData = await post(url, {
      // session_id：通过 encodeURIComponent(JSON.stringify(data)) 序列化后的会话信息。
      // token: userToken,
      session_id: encodeURIComponent(JSON.stringify(data)),
      token: token,
      platform_id: platform.id,
      originalUsername: originalUsername,
      avatar: avatar,
      name: encodeURIComponent(name)
    }, { 'X-Sjq-Token': '' });//{ 'X-Sjq-Token': userToken || '' });
    resultData = JSON.parse(resultData);
    if (resultData.code == 1) {
      tabbedWin.win.webContents.send('fromMain', "login-success");
      companyMap.webview.close();
      if (Notification.isSupported()) {
        verbose_log('notification is supported');
        new Notification({
          title: '消息提示',
          subtitle: '登录信息上传成功',
          body: '登录信息上传成功'
        }).show();
      }
    } else {
      showMsg(resultData.msg);
    }
  } catch (e) {
    verbose_error(e); // 添加错误处理输出
  }
}

// module.exports.postToken = postToken;


export async function createTabbedWin(stockList) {
  global.tabItemCount = 0;
  const { height, width } = screen.getPrimaryDisplay().workAreaSize;
  let baseUrl;

  if (process.env.WEBPACK_DEV_SERVER_URL == null) {
    createProtocol(global.common.APP_SCHEME);
    // baseUrl = `${global.common.APP_SCHEME}://./index.html/`; // Load "index.html" if the dev server URL does not exist.
    baseUrl = `${global.common.APP_SCHEME}://./index.html`; // Load "index.html" if the dev server URL does not exist.
  } else {
    baseUrl = process.env.WEBPACK_DEV_SERVER_URL; // Load the dev server URL if it exists.
  }
  verbose_log("baseUrl:", baseUrl)

  const winHeight = Math.round(height * 0.9);
  const winOptions = {
    icon: path.join(__dirname, "logo.png"),
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? global.common.DARK_WIN_COLOUR
      : global.common.LIGHT_WIN_COLOUR,
    center: true,
    minHeight: global.common.MIN_WIN_HEIGHT,
    minWidth: global.common.MIN_WIN_WIDTH,
    // titleBarStyle: platform === global.common.MACOS ? "hiddenInset" : "hidden",
  };

  // TODO: titleBarOverlay temp workaround.
  if (platform === global.common.MACOS) {
    winOptions.titleBarOverlay = {
      color: global.common.TITLE_BAR_OVERLAY_COLOUR,
      height: global.common.TAB_BAR_HEIGHT,
      symbolColor: global.common.LIGHT_WIN_COLOUR,
    };
  } // end if


  const winWidth = Math.round(width * 0.7);
  const ver = app.getVersion()
  tabbedWin = new TabbedWindow({
    ver,
    blankPage: global.common.blankPage,
    blankTitle: zhCN.newTabItem,
    controlHeight: global.common.TAB_BAR_HEIGHT,
    controlWidth: global.common.TAB_BAR_WIDTH,
    controlPanel: `${baseUrl}#/login`,
    debug: process.env.NODE_ENV === global.common.DEV,
    height:
      winHeight >= global.common.MIN_WIN_HEIGHT
        ? winHeight
        : global.common.MIN_WIN_HEIGHT,
    startPage: global.common.startPage,
    viewReferences: { scrollBounce: true },
    width:
      winWidth >= global.common.MIN_WIN_WIDTH
        ? winWidth
        : global.common.MIN_WIN_WIDTH,
    winOptions,
  });

  // 打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    tabbedWin.win.webContents.openDevTools();
  }


  // 监听tab控制事件
  initialiseCustomisedWinListener(tabbedWin)
  // 监听主窗口的事件
  initialiseIpcMainListener(stockList, tabbedWin);

  return tabbedWin;
}

function initialiseCustomisedWinListener(tabbedWin) {
  tabbedWin.on("closed", () => {
    tabbedWin = null;
  })
  tabbedWin.on('close-tab', (e, d) => {
    if (d) {
      global.tabItemCount--
    } else {
      global.tabItemCount = 0
    }
  })
  tabbedWin.on('control-ready', async () => {
    // auto update
    // verbose_log('check update start')
  })
  tabbedWin.on('new-tab', () => {
    verbose_log("----tabbedWin received `new-tab`")
    global.tabItemCount++
  })
  tabbedWin.win.on("close", (e) => {

  })
  tabbedWin.win.on("enter-full-screen", () => {

  })
  tabbedWin.win.on("leave-full-screen", () => {
    // setAppMenu(tabbedWin);
    // tabbedWin.win.webContents.send(
    //   global.common.IPC_RECEIVE,
    //   global.common.EXIT_FULL_SCREEN
    // );
  })
}

// 监听主窗口的事件，最大化，最小化、关闭等
function initialiseIpcMainListener(stockList, tabbedWin) {
  verbose_log('initialiseIpcMainListener监听主窗口事件')
  ipcMain.removeAllListeners(['toMain'])
  ipcMain.on('toMain', async (event, data) => {
    const viewContents = webContents.fromId(event.sender.id)

    if (typeof data === "object") {
      verbose_log('接收到toMain事件的数据类型是对象：', data)
      await reactToIpcObjectData(data, tabbedWin, viewContents)
    } else {
      verbose_log('接收到toMain事件的数据类型不是对象：', data)
      await reactToIpcIdData(data, stockList, tabbedWin, viewContents)
    }
  })
}

async function reactToIpcIdData(data, stockList, tabbedWin, viewContents) {
  switch (data) {
    // 最小化窗口
    case 'minimiseWin': {
      // TODO: titleBarOverlay temp workaround.
      tabbedWin.win.minimize();
      break
    }
    // 最大化或恢复窗口大小
    case 'maximiseOrRestoreWin': {
      maximiseOrRestoreWin(tabbedWin, viewContents)
      break
    }
    // 关闭窗口
    case 'closeWin': {
      tabbedWin.win.close()
      break
    }
    // 设置夜间模式
    case 'correctWinColour': {
      Array.prototype.forEach.call(BrowserWindow.getAllWindows(), (element) =>
        element.setBackgroundColor(
          nativeTheme.shouldUseDarkColors
            ? global.common.DARK_WIN_COLOUR
            : global.common.LIGHT_WIN_COLOUR
        )
      )
      break
    }
    // 获取平台信息
    case 'getPlatform': {
      const os = {}
      os.getPlatform = platform
      viewContents.send('fromMain', os)
      break
    }
    // 首次打开页面，返回第一个tab id
    case 'getStartTabId': {
      const startTabId = {}
      startTabId.currentTabId = tabbedWin.tabs[0]
      viewContents.send('fromMain', startTabId)
      break
    }
    default: {
      log.warn(
        "Unknown IPC channel event in the data message:",
        JSON.stringify(data)
      )
    }
  }
}

// 响应ipc的object类型数据的事件
async function reactToIpcObjectData(data, tabbedWin, viewContents) {
  switch (data['tag']) {
    case 'getNewTabItemId': {
      const newTabId = {}
      newTabId.getNewTabItemId = tabbedWin.tabs[tabbedWin.tabs.length - 1]
      newTabId.newTabItemIndex = data.newTabItemIndex
      viewContents.send('fromMain')
      break
    }
    case 'saveArticleDraft': {
      verbose_log("===== listen saveArticleDraft in main ====")
      const content = data.content
      verbose_log("content=>", content)
      break
    }
    case 'gotoExternal': {
      verbose_log("===== listen gotoExternal in main ====")
      const url = data.content.url
      verbose_log("open external url=>", url)
      shell.openExternal(url)
      // editorWin.webContents.loadURL('http://localhost:5555');
      break;
    }
    case 'addAccount': {
      verbose_log("===== listen addAccount in main ====", data)
      let viewKey = data.id;
      userToken = data.token
      let partition = "persist:" + viewKey + new Date().getTime();
      let preload = './preload.js';
      switch (parseInt(data.id)) {
        case 1:
          companyMap.bxgs = require('./blbl')
          break;
        case 2:
          companyMap.bxgs = require('./toutiao')
          break;
        case 3:
          companyMap.bxgs = require('./baijia')
          break;
        case 4:
          companyMap.bxgs = require('./wechat')
          break;
      }
      switch (parseInt(data.id)) {
        case 1:
          preload = './blbl_preload.js'
          break;
        case 2:
          preload = './toutiao_preload.js'
          break;
        case 3:
          preload = './baijia_preload.js'
          break;
        case 4:
          preload = './wechat_preload.js'
          break;
      }
      let view = new BrowserWindow({
        icon: path.join(__dirname, "logo.png"),
        frame: true,
        title: data.name,
        webPreferences: {
          // nodeIntegration: true,
          // nodeIntegrationInWorker: true,// 是否在Web工作器中启用了Node集成
          minimumFontSize: 12,
          nodeIntegrationInSubFrames: true,
          //  nableRemoteModule: true,  // 打开remote模块
          allowDisplayingInsecureContent: true,
          allowRunningInsecureContent: true,
          webSecurity: false,
          sandbox: false,
          partition: partition,
          contextIsolation: false,
          plugins: true,
          preload: path.join(__dirname, preload)
        }
      })
      view.focus();
      view.setAlwaysOnTop(true);

      // view.webContents.session.setProxy({
      //     mode: "pac_script",
      //     pacScript: ''
      // });
      companyMap.window_id = view.id;
      companyMap.id = data.id
      companyMap.partition = partition;
      companyMap.webview = view;
      if (companyMap.bxgs) {

        companyMap.bxgs.init(companyMap, postToken)
        verbose_log("===== companyMap.bxgs.init in add account ====")
      }
      break
    }
    case 'previewMpArticle': {
      verbose_log("===== listen previewMpArticle in main ====", data)

      let view = new BrowserWindow({
        width: 378, height: 668,
        icon: path.join(__dirname, "logo.png"),
        frame: true,
        title: "预览",
        webPreferences: {
          // nodeIntegration: true,
          // nodeIntegrationInWorker: true,// 是否在Web工作器中启用了Node集成
          minimumFontSize: 12,
          nodeIntegrationInSubFrames: true,
          //  nableRemoteModule: true,  // 打开remote模块
          allowDisplayingInsecureContent: true,
          allowRunningInsecureContent: true,
          webSecurity: false,
          sandbox: false,
          // partition: partition,
          contextIsolation: false,
          plugins: true,
          // preload: path.join(__dirname, preload)
        }
      })
      // view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
      view.webContents.loadURL(data.url)
      view.focus();
      view.setAlwaysOnTop(true);

      // view.webContents.session.setProxy({
      //     mode: "pac_script",
      //     pacScript: ''
      // });

      break
    }
    case 'localExtractMpArticleUrl': {
      verbose_log("===== listen localExtractMpArticleUrl in main ====", data)
      const { extractArticleUrl } = data
      const html = await localExtractMpArticleUrlUseRequest(extractArticleUrl)
        .catch((err) => {
          verbose_error("reject localExtractMpArticleUrl for reason:", err)
        });
      verbose_log("html.length:", html.length)
      // fs.writeFileSync("a.html", html)
      // verbose_log("extract html:", html)
      const result = await postJsonToJZLApi(`/prase_html_to_json?api_key=${encodeURIComponent("du&cgIYuosQcaSm6")}`, { html })
      verbose_log("extract result:", result)
      viewContents.send('fromMain', { tag: 'localExtractMpArticleUrlResult', data: result })
      break;
    }
    case 'stat:getPvData': {
      var {list,exports}=data.data;
      list = await batchWechatData(list);
      viewContents.send('fromMain', {tag: 'stat-ret:getPvData', data: {list,exports}});
      break;
    }
    case 'stat:exportPvData':{
      var res = await dialog.showSaveDialog(tabbedWin.win,{
        defaultPath:path.join(app.getPath('downloads'),'stat.csv'),
      })
      var csv = data.data;
      if(platform === 'win32'){
        csv = iconv.encode(csv,'gbk');
      }
      if(res.filePath){
        fs.writeFile(res.filePath, csv, (err)=>{
          if(err) console.error(err)
        });
      }
      break;
    }

    default: {
      log.warn(
        "Unknown IPC channel event in the data message:",
        JSON.stringify(data)
      )
    }
  }
}



// 最大化或恢复窗口大小
function maximiseOrRestoreWin(tabbedWin, viewContents) {
  // TODO: titleBarOverlay temp workaround.
  if (platform === 'win32') {
    if (tabbedWin.win.isMaximized()) {
      tabbedWin.win.unmaximize()
      viewContents.send('fromMain', 'restoreWin')
    } else {
      tabbedWin.win.maximize()
      viewContents.send('fromMain', 'maximiseWin')
    }

    return
  }

  // NOTE: react to this ID data on macOS only.
  // Reference: https://github.com/electron/electron/issues/16385#issuecomment-653952292
  // switch (
  //   systemPreferences.getUserDefault("AppleActionOnDoubleClick", "string")
  // ) {
  //   case "Minimize": {
  //     tabbedWin.win.minimize();
  //     break;
  //   }
  //   case "None": {
  //     break;
  //   }
  //   default: {
  //     tabbedWin.win.isMaximized()
  //       ? tabbedWin.win.unmaximize()
  //       : tabbedWin.win.maximize();
  //   }
  // }
}



