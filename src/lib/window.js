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
import {
  publishAppmsg, deleteAppmsg, listAppmsgsInDraftBox, getAppmsgInDraftBox,
  searchAppmsgsInPublishForQuerys, listAppmsgsInPublishForQuerys, getShopCommodity, getWindowProduct, getLinkInfo,
  checkAppmsgCopyrightStat
} from "./mp_appmsg-tasks.js"
import { deleteFile, deleteVideo, listFiles, listVideos } from "./mp_file-tasks.js"
import { searchMiniApp } from "./mpa-tasks.js"
import { searchBiz } from "./mp-tasks.js"
import { searchMpvAccount, searchMpvVideo,searchMpvLive } from "./mpv_tasks.js"
import { postJsonToJZLApi, postJsonToEditorApi } from "./request.js"
const path = require('path')
const fs = require('fs')
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import global from "./global.js";
import log from "electron-log";
import { platform } from "process";
import iconv from 'iconv-lite';

const shell = require('electron').shell;
import * as zhCN from '../locales/zh-CN.json'
import { serializeCookie } from "@/utils/cookie.js";
const verbose_log = global.utils.verbose_log;
const verbose_error = global.utils.verbose_error;
const get_backend_url_old = global.utils.get_backend_url_old;
var { batchWechatData, getWxGroupList, batchWxUploadImg, batchWxAggregate, batchWxAggregateSafe } = require('./mp_stat-tasks.js');
var { getRegions } = require('./mp_appmsg-tasks.js');
var dog=require('debug')('editor')


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
// let userToken = '';

// HTTP POST 请求封装函数
const post = function (url, postData, newheaders) {
  // verbose_log("数据接收完成", url);
  // verbose_log("要发送的数据", postData);
  // verbose_log("userToken", userToken);
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      // 'Authorization': `Bearer ${userToken}`
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

// const postToken = async function (platform, cookie, localStorage, sessionStorage, originalUsername, name, avatar, token) {
const postToken = async function (payload,) {
  const { platform, cookies, localStorage, sessionStorage, originalUsername, name, avatar, token, userToken } = payload
  let url = '/platform/addAccount'; // 保留这个部分
  
  // 保持 cookie 为数组格式，前端的 checkWxSession 需要数组格式
  let cookieArray = [];
  if (Array.isArray(cookies)) {
    // Electron cookies 需要转换格式
    cookieArray = cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: cookie.expirationDate
    }));
  } else if (typeof cookies === 'object') {
    // 如果是对象格式，转换为数组
    cookieArray = Object.keys(cookies).map(name => ({
      name: name,
      value: cookies[name]
    }));
  }
  
  let data = { cookie: cookieArray, localStorage: localStorage || {}, sessionStorage: sessionStorage || {} };
  if (!platform || !platform.id) {
    return null;
  }
  try {
    
    let resultData = await post(url, {
      session_id: encodeURIComponent(JSON.stringify(data)),
      token: token,
      platform_id: platform.id,
      originalUsername: originalUsername,
      avatar: avatar || '',
      name: encodeURIComponent(name)
    }, { 'Authorization': `Bearer ${userToken}`, 'X-Sjq-Token': '' });
    resultData = JSON.parse(resultData);
    
    if (resultData.code == 1) {
      if (!tabbedWin.win.isDestroyed()) {
        companyMap.login_success = true
      }

      if (Notification.isSupported()) {
        new Notification({
          title: '消息提示',
          subtitle: '登录信息上传成功',
          body: '登录信息上传成功'
        }).show();
      }
    } else {
      showMsg(resultData.msg);
    }
    
    // 返回结果，让调用方知道是否成功
    return resultData;
  } catch (e) {
    verbose_error(e); // 添加错误处理输出
    return { code: 0, msg: e.message };
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
  
  // 添加快捷键强制打开开发者工具
  tabbedWin.win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      tabbedWin.win.webContents.toggleDevTools();
    }
  });


  // 监听tab控制事件
  initialiseCustomisedWinListener(tabbedWin)
  // 监听主窗口的事件
  initialiseIpcMainListener(stockList, tabbedWin);
  initRpc();

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
  verbose_log("window.js::reactToIpcIdData=>", data)
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
      verbose_log("window.js::getStartTabId")
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
// 存储登录视图
let wechatLoginView = null;

// 存储当前的倒计时定时器ID，确保只有一个倒计时在运行
let currentQRCodeCountdownInterval = null;

async function reactToIpcObjectData(data, tabbedWin, viewContents) {
  switch (data['tag']) {
    case 'wechat:createLoginView': {
      verbose_log("===== listen wechat:createLoginView in main ====", data)
      
      const { BrowserView } = require('electron');
      const path = require('path');
      
      // 如果已存在，先销毁
      if (wechatLoginView) {
        tabbedWin.win.removeBrowserView(wechatLoginView);
        wechatLoginView.webContents.destroy();
        wechatLoginView = null;
      }
      
      // 创建 BrowserView
      wechatLoginView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          partition: 'persist:wechat-login-' + Date.now(),
          preload: path.join(__dirname, './wechat_preload.js')
        }
      });
      
      // 添加到主窗口
      tabbedWin.win.addBrowserView(wechatLoginView);
      
      // 获取主窗口的内容区域大小
      const [winWidth, winHeight] = tabbedWin.win.getContentSize();
      
      // 设置 BrowserView 的位置和大小（居中显示，与弹框位置对齐）
      const viewWidth = 460;
      const viewHeight = 500;
      const x = Math.floor((winWidth - viewWidth) / 2);
      const y = Math.floor((winHeight - viewHeight) / 2);
      
      wechatLoginView.setBounds({
        x: x,
        y: y,
        width: viewWidth,
        height: viewHeight
      });
      
      // 设置背景色
      wechatLoginView.setBackgroundColor('#f5f5f5');
      
      // 阻止页面跳转（保持在二维码页面）
      wechatLoginView.webContents.on('will-navigate', (event, url) => {
        verbose_log('BrowserView 尝试跳转到:', url);
        // 阻止跳转到公众号首页
        if (url.indexOf('mp.weixin.qq.com/cgi-bin/home') > -1) {
          event.preventDefault();
          verbose_log('已阻止跳转到公众号首页');
        }
      });
      
      // 初始化微信登录流程
      const wechat = require('./wechat');
      const viewData = {
        webview: wechatLoginView,
        user: null,
        userToken: data.token,
        tabWin: tabbedWin
      };
      
      // 修改 postToken 函数，登录成功后通知前端并关闭视图
      const postTokenWrapper = async (payload, tabWin) => {
        const result = await postToken(payload, tabWin);
        if (result && result.code === 1) {
          // 通知前端登录成功
          tabbedWin.win.webContents.send('fromMain', 'wechat-login-success');
          
          // 500ms 后销毁视图
          setTimeout(() => {
            if (wechatLoginView) {
              tabbedWin.win.removeBrowserView(wechatLoginView);
              wechatLoginView.webContents.destroy();
              wechatLoginView = null;
            }
          }, 500);
        }
        return result;
      };
      
      // 使用 wechat.js 中的 init 函数
      // 这会显示"微信公众号登录123"的自定义页面和二维码
      wechat.init(viewData, postTokenWrapper);
      
      break;
    }
    case 'wechat:destroyLoginView': {
      verbose_log("===== listen wechat:destroyLoginView in main ====")
      
      if (wechatLoginView) {
        tabbedWin.win.removeBrowserView(wechatLoginView);
        wechatLoginView.webContents.destroy();
        wechatLoginView = null;
      }
      
      break;
    }
    case 'wechat:createLoginViewInDialog': {
      verbose_log("===== listen wechat:createLoginViewInDialog in main ====", data)
      
      // 清理旧的倒计时定时器
      if (currentQRCodeCountdownInterval) {
        clearInterval(currentQRCodeCountdownInterval);
        currentQRCodeCountdownInterval = null;
        verbose_log('已清理旧的倒计时定时器');
      }
      
      // 创建隐藏的 BrowserWindow 来执行登录逻辑
      const hiddenWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          partition: 'persist:wechat-login-' + Date.now()
        }
      });
      
      // 存储当前的轮询定时器，用于清理
      let currentCheckInterval = null;
      
      // 监听窗口关闭事件，确保清理所有定时器
      hiddenWin.on('closed', () => {
        verbose_log('hiddenWin 已关闭，清理所有定时器');
        if (currentQRCodeCountdownInterval) {
          clearInterval(currentQRCodeCountdownInterval);
          currentQRCodeCountdownInterval = null;
        }
        if (currentCheckInterval) {
          clearInterval(currentCheckInterval);
          currentCheckInterval = null;
        }
      });
      
      // 通知前端：正在初始化
      tabbedWin.win.webContents.send('fromMain', {
        tag: 'wechat:statusUpdate',
        data: { status: '正在初始化...' }
      });
      
      // 开始登录流程
      (async () => {
        try {
          const fingerprint = '64f379b133f5d29df7b2d4d72faf8812';
          
          // 加载微信页面
          await hiddenWin.loadURL('https://mp.weixin.qq.com/');
          
          // 步骤1: prelogin
          verbose_log('步骤1: prelogin');
          tabbedWin.win.webContents.send('fromMain', {
            tag: 'wechat:statusUpdate',
            data: { status: '正在连接服务器...' }
          });
          
          await hiddenWin.webContents.executeJavaScript(`
            (async function() {
              const response = await fetch('https://mp.weixin.qq.com/cgi-bin/bizlogin?action=prelogin&fingerprint=${fingerprint}&token=&lang=zh_CN&f=json&ajax=1', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://mp.weixin.qq.com'
                }
              });
              return await response.json();
            })();
          `);
          
          // 步骤2: startlogin
          verbose_log('步骤2: startlogin');
          const sessionid = Date.now();
          await hiddenWin.webContents.executeJavaScript(`
            (async function() {
              const body = 'userlang=zh_CN&redirect_url=&login_type=3&sessionid=${sessionid}&fingerprint=${fingerprint}&token=&lang=zh_CN&f=json&ajax=1';
              const response = await fetch('https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://mp.weixin.qq.com',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
              });
              return await response.json();
            })();
          `);
          
          // 步骤3: 获取二维码
          verbose_log('步骤3: 获取二维码');
          tabbedWin.win.webContents.send('fromMain', {
            tag: 'wechat:statusUpdate',
            data: { status: '正在生成二维码...' }
          });
          
          const qrcodeUrl = `https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random=${Date.now()}`;
          const qrcodeBase64 = await hiddenWin.webContents.executeJavaScript(`
            (async function() {
              const response = await fetch('${qrcodeUrl}', {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://mp.weixin.qq.com'
                }
              });
              const arrayBuffer = await response.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              return 'data:image/png;base64,' + btoa(binary);
            })();
          `);
          
          // 发送二维码给前端
          tabbedWin.win.webContents.send('fromMain', {
            tag: 'wechat:qrcodeReady',
            data: { qrcode: qrcodeBase64 }
          });
          
          // 开始300秒倒计时
          let qrcodeCountdown = 300;
          tabbedWin.win.webContents.send('fromMain', {
            tag: 'wechat:statusUpdate',
            data: { status: `请使用微信扫描二维码登录 (${qrcodeCountdown}秒)` }
          });
          
          // 倒计时更新 - 存储到全局变量，确保只有一个在运行
          currentQRCodeCountdownInterval = setInterval(() => {
            qrcodeCountdown--;
            if (qrcodeCountdown > 0) {
              tabbedWin.win.webContents.send('fromMain', {
                tag: 'wechat:statusUpdate',
                data: { status: `请使用微信扫描二维码登录 (${qrcodeCountdown}秒)` }
              });
            } else {
              // 倒计时结束，清理定时器
              if (currentQRCodeCountdownInterval) {
                clearInterval(currentQRCodeCountdownInterval);
                currentQRCodeCountdownInterval = null;
              }
            }
          }, 1000);
          
          // 步骤4: 轮询检查扫码状态
          verbose_log('步骤4: 开始轮询检查扫码状态');
          let checkCount = 0;
          const maxChecks = 300;
          
          currentCheckInterval = setInterval(async () => {
            checkCount++;
            if (checkCount > maxChecks) {
              clearInterval(currentCheckInterval);
              currentCheckInterval = null;
              
              // 清理倒计时定时器
              if (currentQRCodeCountdownInterval) {
                clearInterval(currentQRCodeCountdownInterval);
                currentQRCodeCountdownInterval = null;
              }
              
              hiddenWin.close();
              
              // 显示倒计时刷新提示
              tabbedWin.win.webContents.send('fromMain', {
                tag: 'wechat:statusUpdate',
                data: { status: '二维码已过期，正在刷新...' }
              });
              
              // 延迟1秒后自动刷新二维码
              setTimeout(() => {
                reactToIpcObjectData({
                  tag: 'wechat:createLoginViewInDialog',
                  token: data.token
                }, tabbedWin, tabbedWin.win.webContents);
              }, 1000);
              return;
            }
            
            try {
              const checkResult = await hiddenWin.webContents.executeJavaScript(`
                (async function() {
                  const response = await fetch('https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=ask&fingerprint=${fingerprint}&token=&lang=zh_CN&f=json&ajax=1', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                      'Referer': 'https://mp.weixin.qq.com'
                    }
                  });
                  return await response.json();
                })();
              `);
              
              if (checkResult.status === 4) {
                // 清理倒计时定时器
                if (currentQRCodeCountdownInterval) {
                  clearInterval(currentQRCodeCountdownInterval);
                  currentQRCodeCountdownInterval = null;
                }
                
                tabbedWin.win.webContents.send('fromMain', {
                  tag: 'wechat:statusUpdate',
                  data: { status: '已扫码，请在手机上确认登录' }
                });
              } else if (checkResult.status === 6) {
                // 清理倒计时定时器
                if (currentQRCodeCountdownInterval) {
                  clearInterval(currentQRCodeCountdownInterval);
                  currentQRCodeCountdownInterval = null;
                }
                
                tabbedWin.win.webContents.send('fromMain', {
                  tag: 'wechat:statusUpdate',
                  data: { status: '正在输入密码...' }
                });
              } else if (checkResult.status === 1 && checkResult.user_category >= 2) {
                clearInterval(currentCheckInterval);
                currentCheckInterval = null;
                
                // 清理倒计时定时器
                if (currentQRCodeCountdownInterval) {
                  clearInterval(currentQRCodeCountdownInterval);
                  currentQRCodeCountdownInterval = null;
                }
                
                tabbedWin.win.webContents.send('fromMain', {
                  tag: 'wechat:statusUpdate',
                  data: { status: '✅ 扫码成功！正在登录...' }
                });
                
                // 步骤5: 调用 action=login 获取 redirect_url
                const loginResult = await hiddenWin.webContents.executeJavaScript(`
                  (async function() {
                    const body = 'userlang=zh_CN&redirect_url=&cookie_forbidden=0&cookie_cleaned=1&plugin_used=0&login_type=3&fingerprint=${fingerprint}&token=&lang=zh_CN&f=json&ajax=1';
                    const response = await fetch('https://mp.weixin.qq.com/cgi-bin/bizlogin?action=login', {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://mp.weixin.qq.com',
                        'Content-Type': 'application/x-www-form-urlencoded'
                      },
                      body: body
                    });
                    return await response.json();
                  })();
                `);
                
                // 检查登录结果
                if (loginResult.base_resp.ret !== 0) {
                  let errorMsg = '登录失败';
                  if (loginResult.base_resp.ret === 200007) {
                    errorMsg = '账号冻结，您目前处于访问受限状态';
                  } else if (loginResult.base_resp.ret === 250003) {
                    errorMsg = '长期未登录已被冻结';
                  } else if (loginResult.base_resp.ret === 250002) {
                    errorMsg = '账号已被注销';
                  } else {
                    errorMsg = `登录失败: ${loginResult.base_resp.err_msg || '未知错误'}`;
                  }
                  
                  hiddenWin.close();
                  
                  // 发送带倒计时的错误消息
                  let countdown = 5;
                  tabbedWin.win.webContents.send('fromMain', {
                    tag: 'wechat:loginFailed',
                    data: { error: `${errorMsg}，${countdown}秒后自动刷新...` }
                  });
                  
                  const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                      tabbedWin.win.webContents.send('fromMain', {
                        tag: 'wechat:statusUpdate',
                        data: { status: `❌ ${errorMsg}，${countdown}秒后自动刷新...` }
                      });
                    } else {
                      clearInterval(countdownInterval);
                    }
                  }, 1000);
                  
                  setTimeout(() => {
                    reactToIpcObjectData({
                      tag: 'wechat:createLoginViewInDialog',
                      token: data.token
                    }, tabbedWin, tabbedWin.win.webContents);
                  }, 5000);
                  return;
                }
                
                const redirectUrl = loginResult.redirect_url;
                
                // 检查各种异常情况 - 统一处理函数
                const handleLoginError = (errorMsg) => {
                  hiddenWin.close();
                  
                  let countdown = 5;
                  tabbedWin.win.webContents.send('fromMain', {
                    tag: 'wechat:loginFailed',
                    data: { error: `${errorMsg}，${countdown}秒后自动刷新...` }
                  });
                  
                  const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                      tabbedWin.win.webContents.send('fromMain', {
                        tag: 'wechat:statusUpdate',
                        data: { status: `❌ ${errorMsg}，${countdown}秒后自动刷新...` }
                      });
                    } else {
                      clearInterval(countdownInterval);
                    }
                  }, 1000);
                  
                  setTimeout(() => {
                    reactToIpcObjectData({
                      tag: 'wechat:createLoginViewInDialog',
                      token: data.token
                    }, tabbedWin, tabbedWin.win.webContents);
                  }, 5000);
                };
                
                if (redirectUrl.includes('/acct/ban')) {
                  handleLoginError('账号已被封禁');
                  return;
                }
                
                if (redirectUrl.includes('acctclose')) {
                  handleLoginError('账号已被冻结');
                  return;
                }
                
                if (redirectUrl.includes('contractorpage')) {
                  handleLoginError('账号未注册完成');
                  return;
                }
                
                if (redirectUrl.includes('bind_admin_page')) {
                  handleLoginError('管理员已被解绑');
                  return;
                }
                
                if (!redirectUrl.includes('token=')) {
                  handleLoginError('未知错误，登录失败');
                  return;
                }
                
                // 提取 token
                const tokenMatch = redirectUrl.match(/token=(\d+)/);
                const accountToken = tokenMatch ? tokenMatch[1] : '';
                
                tabbedWin.win.webContents.send('fromMain', {
                  tag: 'wechat:statusUpdate',
                  data: { status: '✅ 正在获取账号信息...' }
                });
                
                // 步骤6: 访问公众号首页，获取完整的 cookie 和验证状态
                const homeUrl = `https://mp.weixin.qq.com${redirectUrl}&f=json`;
                const homeResult = await hiddenWin.webContents.executeJavaScript(`
                  (async function() {
                    const response = await fetch('${homeUrl}', {
                      method: 'GET',
                      credentials: 'include',
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://mp.weixin.qq.com'
                      }
                    });
                    return await response.json();
                  })();
                `);
                
                // 检查首页访问结果
                if (homeResult.base_resp.ret !== 0) {
                  let errorMsg = '登录到首页失败';
                  if (homeResult.base_resp.ret === 200007) {
                    errorMsg = '账号冻结，您目前处于访问受限状态';
                  } else if (homeResult.base_resp.ret === 250003) {
                    errorMsg = '长期未登录已被冻结';
                  } else if (homeResult.base_resp.ret === 250002) {
                    errorMsg = '账号已被注销';
                  } else {
                    errorMsg = `访问首页失败: ${homeResult.base_resp.err_msg || '未知错误'}`;
                  }
                  
                  hiddenWin.close();
                  
                  let countdown = 5;
                  tabbedWin.win.webContents.send('fromMain', {
                    tag: 'wechat:loginFailed',
                    data: { error: `${errorMsg}，${countdown}秒后自动刷新...` }
                  });
                  
                  const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                      tabbedWin.win.webContents.send('fromMain', {
                        tag: 'wechat:statusUpdate',
                        data: { status: `❌ ${errorMsg}，${countdown}秒后自动刷新...` }
                      });
                    } else {
                      clearInterval(countdownInterval);
                    }
                  }, 1000);
                  
                  setTimeout(() => {
                    reactToIpcObjectData({
                      tag: 'wechat:createLoginViewInDialog',
                      token: data.token
                    }, tabbedWin, tabbedWin.win.webContents);
                  }, 5000);
                  return;
                }
                
                // 获取 Cookie
                const cookies = await hiddenWin.webContents.session.cookies.get({ domain: 'mp.weixin.qq.com' });
                const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
                const ghid = slaveUserCookie ? slaveUserCookie.value : '';
                
                // 步骤7: 获取用户头像、wxid 和公众号名字
                let avatar = '';
                let wxid = '';
                let nickName = '';
                
                try {
                  const safeUrl = `https://mp.weixin.qq.com/cgi-bin/safecenterstatus?action=view&t=setting/safe-index&token=${accountToken}&lang=zh_CN&f=json`;
                  const safeResult = await hiddenWin.webContents.executeJavaScript(`
                    (async function() {
                      const response = await fetch('${safeUrl}', {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                          'Referer': 'https://mp.weixin.qq.com'
                        }
                      });
                      return await response.json();
                    })();
                  `);
                  
                  if (safeResult.user_info) {
                    avatar = safeResult.user_info.head_img || '';
                    wxid = safeResult.user_info.alias || '';
                    nickName = safeResult.user_info.nick_name || '';
                  }
                } catch (error) {
                  verbose_error('获取用户信息失败:', error);
                }
                
                // 准备账号数据
                const payload = {
                  platform: { id: 4 },
                  cookies: cookies,
                  localStorage: {},
                  sessionStorage: {},
                  token: parseInt(accountToken) || 0,
                  originalUsername: ghid || wxid || 'wechat_' + Date.now(),
                  name: nickName || wxid || '微信公众号',
                  avatar: avatar,
                  userToken: data.token
                };
                
                // 调用 postToken 添加账号
                const addResult = await postToken(payload, tabbedWin);
                
                hiddenWin.close();
                
                if (addResult && addResult.code === 1) {
                  tabbedWin.win.webContents.send('fromMain', {
                    tag: 'wechat:loginSuccess',
                    data: {
                      name: payload.name,
                      originalUsername: payload.originalUsername
                    }
                  });
                  
                  // 登录成功后，延迟2秒自动刷新二维码，继续添加下一个账号
                  setTimeout(() => {
                    reactToIpcObjectData({
                      tag: 'wechat:createLoginViewInDialog',
                      token: data.token
                    }, tabbedWin, tabbedWin.win.webContents);
                  }, 2000);
                } else {
                  tabbedWin.win.webContents.send('fromMain', {
                    tag: 'wechat:loginFailed',
                    data: {
                      error: addResult ? addResult.msg : '未知错误'
                    }
                  });
                }
              }
            } catch (error) {
              verbose_error('检查扫码状态失败:', error);
            }
          }, 1000);
          
        } catch (error) {
          verbose_error('登录流程出错:', error);
          tabbedWin.win.webContents.send('fromMain', {
            tag: 'wechat:loginFailed',
            data: {
              error: error.message
            }
          });
          hiddenWin.close();
        }
      })();
      
      break;
    }
    case 'wechat:cleanupCountdown': {
      verbose_log("===== listen wechat:cleanupCountdown in main ====")
      
      // 清理倒计时定时器
      if (currentQRCodeCountdownInterval) {
        clearInterval(currentQRCodeCountdownInterval);
        currentQRCodeCountdownInterval = null;
        verbose_log('已清理倒计时定时器');
      }
      
      break;
    }
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
        parent: tabbedWin.win,
        icon: path.join(__dirname, 'logo.png'),
        title: data.name,
        modal: true,
        width: 800,
        height: 600,
        resizable: false,
        movable: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        webPreferences: {
          minimumFontSize: 12,
          nodeIntegrationInSubFrames: true,
          allowDisplayingInsecureContent: true,
          allowRunningInsecureContent: true,
          webSecurity: false,
          sandbox: false,
          partition: partition,
          contextIsolation: false,
          plugins: true,
          preload: path.join(__dirname, preload)
        }
      });
      companyMap.login_success = false
      view.on('close', function (e) {
        const viewUrl = view.webContents.getURL()
        verbose_log("viewUrl:", viewUrl)
        if (viewUrl === 'https://mp.weixin.qq.com/') {
          return
        } else {
          if (companyMap.login_success) {
            return
          }
        }

        e.preventDefault();
        // 弹出确认对话框
        const choice = dialog.showMessageBoxSync(view, {
          type: 'question',
          buttons: ['是', '否'],
          title: '确认对话框',
          message: '当前登录窗口会自动关闭，人工关闭会导致功能退出?',
        });

        // 如果用户选择"Yes"，销毁窗口
        if (choice === 0) {
          view.destroy();
        }
      });

      // view.webContents.session.setProxy({
      //     mode: "pac_script",
      //     pacScript: ''
      // });
      companyMap.window_id = view.id;
      companyMap.id = data.id
      companyMap.partition = partition;
      companyMap.webview = view;
      companyMap.userToken = data.token
      if (companyMap.bxgs) {
        companyMap.bxgs.init(companyMap, postToken)
        verbose_log("===== companyMap.bxgs.init in add account ====")
      }
      break
    }
    case 'appmsg:previewMpArticle': {
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
    case 'appmsg:localExtractMpArticleUrl': {
      verbose_log("===== listen localExtractMpArticleUrl in main ====", data)
      const { source, extractArticleUrl, token } = data
      const html = await localExtractMpArticleUrlUseRequest(extractArticleUrl, undefined, token)
        .catch((err) => {
          verbose_error("reject localExtractMpArticleUrl for reason:", err)
        });
      verbose_log("html.length:", html.length)
      // fs.writeFileSync("a.html", html)
      // verbose_log("extract html:", html)
      const ret = await postJsonToJZLApi(`/prase_html_to_json?api_key=${encodeURIComponent("du&cgIYuosQcaSm6")}`, { html })
      verbose_log("extract result:", ret)
      // 返回链接抽取结果
      viewContents.send('fromMain', { tag: 'appmsg-ret:localExtractMpArticleUrlResult', data: { source, ret } })
      break;
    }
    case 'appmsg:batchExtractMpArticleUrls': {
      verbose_log("===== listen localExtractMpArticleUrl in main ====", data)
      const { source, extractArticleUrls, token } = data

      const ret = []
      // 同步顺序调用
      //
      // for await (const extractArticleUrl of extractArticleUrls) {
      //   const html = await localExtractMpArticleUrlUseRequest(extractArticleUrl, undefined, token)
      //     .catch((err) => {
      //       verbose_error("reject localExtractMpArticleUrl for reason:", err)
      //     });
      //   verbose_log("html.length:", html.length)
      //   // fs.writeFileSync("a.html", html)
      //   // verbose_log("extract html:", html)
      //   const ret_item = await postJsonToJZLApi(`/prase_html_to_json?api_key=${encodeURIComponent("du&cgIYuosQcaSm6")}`, { html })
      //   // verbose_log("extract result:", ret_item)
      //   ret.push(ret_item)
      // }

      // 异步并发调用
      const promises = []
      for (const extractArticleUrl of extractArticleUrls) {
        promises.push(new Promise((resolve, reject) => {
          localExtractMpArticleUrlUseRequest(extractArticleUrl, undefined, token)
            .then((html) => {
              postJsonToJZLApi(`/prase_html_to_json?api_key=${encodeURIComponent("du&cgIYuosQcaSm6")}`, { html })
                .then(resolve).catch(reject)
            })
            .catch(reject);
        }))
      }
      const all_ret = await Promise.allSettled(promises);
      const failed = []
      for (const idx in all_ret) {
        if (all_ret[idx].status === 'fulfilled') {
          ret.push(all_ret[idx].value)
        } else {
          failed.push({ url: extractArticleUrls[idx], reason: all_ret[idx].reason })
        }
      }

      // const ret = all_ret.filter(v => v.status === 'fulfilled').map(v => v.value)
      viewContents.send('fromMain', { tag: 'appmsg-ret:batchExtractMpArticleUrls', data: { source, ret, failed } })
      break;
    }
    case 'appmsg:listAppmsgsInDraftBox': {
      verbose_log("===== listen listAppmsgsInDraftBox in main ====", data)
      const { source, token, listData } = data
      // token => userToken
      console.log("listData=>", listData)
      const ret = await listAppmsgsInDraftBox(listData)
      if (!ret.success) {
        verbose_log("===== 获取草稿箱素材列表失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取草稿箱素材列表成功 ====", ret.items.length)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:listAppmsgsInDraftBox', data: { source, ret } })
      break
    }
    case 'appmsg:getAppmsgInDraftBox': {
      // 获取文章
      verbose_log("===== listen getAppmsgInDraftBox in main ====", data)
      const { source, token, getData } = data
      // token => userToken
      console.log("getData=>", getData)
      const ret = await getAppmsgInDraftBox(getData)
      if (!ret.success) {
        verbose_log("===== 获取草稿箱素材失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取草稿箱素材成功 ====", ret.appmsg_info)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:getAppmsgInDraftBox', data: { source, ret } })
      break
    }
    case 'appmsg:publishToWechat': {
      verbose_log("===== listen publishToWechat in main ====", data)
      const { token, source, wechat_id, publishData } = data
      const ret = await publishAppmsg(publishData)
      if (ret.success) {
        verbose_log("===== 发布微信成功 ====", data)
        const { appmsgid } = publishData
        const result = await postJsonToEditorApi(`/appmsg/mark_publish`, { appmsgid, wechat_id }, {
          'Authorization': `Bearer ${token}`,
        })
        verbose_log("mark_publish:", result)
      }

      viewContents.send('fromMain', { tag: 'appmsg-ret:publishToWechat', data: { source, ret } })
      break;
    }
    case 'appmsg:deleteDraft': {
      verbose_log("===== listen deleteDraft in main ====", data)
      const { token, source, deleteData } = data
      console.log("deleteData=>", deleteData)
      const ret = await deleteAppmsg(deleteData)
      if (ret.success) {
        verbose_log("===== 删除草稿箱素材成功 ====", data)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:deleteDraft', data: { source, ret } })
      break;
    }
    case 'appmsg:searchAppmsgsInPublishForQuerys': {
      verbose_log("===== listen searchAppmsgsInPublishForQuerys in main ====", data)
      const { source, token, type, getData } = data
      // token => userToken
      const ret = await searchAppmsgsInPublishForQuerys(getData)
      if (!ret.success) {
        verbose_log("===== 批量关键词查询发表记录失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 批量关键词查询发表记录成功 ====", ret)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:searchAppmsgsInPublishForQuerys', data: { source, ret, type } });
      break;
    }
    case 'appmsg:listAppmsgsInPublishForQuerys': {
      verbose_log("===== listen listAppmsgsInPublishForQuerys in main ====", data)
      const { source, token, listData } = data
      // token => userToken
      console.log("listData=>", listData)
      const ret = await listAppmsgsInPublishForQuerys(listData)
      if (!ret.success) {
        verbose_log("===== 获取已发布文章列表失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取已发布文章列表成功 ====", ret)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:listAppmsgsInPublishForQuerys', data: { source, ret } })
      break;
    }
    case 'image:listImages': {
      verbose_log("===== listen listImages in main ====", data)
      const { source, token, listData } = data
      // token => userToken
      console.log("listData=>", listData)
      const ret = await listFiles({ count: 12, ...listData, type: 2 })
      if (!ret.success) {
        verbose_error("===== 获取图片素材失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取图片素材成功 ====")
      }
      viewContents.send('fromMain', { tag: 'image-ret:listImages', data: { source, ret } })
      break
    }
    case 'video:listVideos': {
      verbose_log("===== listen listVideos in main ====", data)
      const { source, token, listData } = data
      // token => userToken
      console.log("listData=>", listData)
      const ret = await listVideos({ count: 10, ...listData })
      if (!ret.success) {
        verbose_error("===== 获取视频素材失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取视频素材成功 ====", ret.page_info.item.length)
      }
      viewContents.send('fromMain', { tag: 'video-ret:listVideos', data: { source, ret } })
      break
    }
    case 'mpa:searchMiniApp': {
      verbose_log("===== listen searchMiniApp in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchMiniApp(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索小程序失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索小程序成功 ====", ret.weapp)
      }
      verbose_log("===== others ====", others)
      viewContents.send('fromMain', { tag: 'mpa-ret:searchMiniApp', data: { source, ret, ...others } })
      break
    }
    case 'mp:searchBiz': {
      verbose_log("===== listen searchBiz in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchBiz(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索公众号失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索公众号成功 ====", ret.mps)
      }
      viewContents.send('fromMain', { tag: 'mp-ret:searchBiz', data: { source, ret, ...others } })
      break
    }
    case 'mp:searchBizForLink': {
      verbose_log("===== listen searchBizForLink in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchBiz(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索公众号失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索公众号成功 ====", ret.mps)
      }
      viewContents.send('fromMain', { tag: 'mp-ret:searchBizForLink', data: { source, ret, ...others } })
      break
    }
    case 'mpv:searchMpvAccount': {
      verbose_log("===== listen searchMpvAccount in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchMpvAccount(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索视频号失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索视频号成功 ====", ret.mpvs)
      }
      viewContents.send('fromMain', { tag: 'mpv-ret:searchMpvAccount', data: { source, ret, ...others } })
      break
    }
    case 'mpv:searchMpvVideo': {
      verbose_log("===== listen searchMpvVideo in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchMpvVideo(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索视频号视频失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索视频号视频成功 ====", ret.mpv_videos.length)
      }
      viewContents.send('fromMain', { tag: 'mpv-ret:searchMpvVideo', data: { source, ret, ...others } })
      break
    }
    case 'mpv:searchMpvLive': {
      verbose_log("===== listen searchMpvLive in main ====", data)
      const { source, token, searchData, ...others } = data
      // token => userToken
      console.log("searchData=>", searchData)
      const ret = await searchMpvLive(searchData)
      if (!ret.success) {
        verbose_log("===== 搜索视频号直播失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 搜索视频号直播成功 ====", ret.mpv_lives.length)
      }
      viewContents.send('fromMain', { tag: 'mpv-ret:searchMpvLive', data: { source, ret, ...others } })
      break
    }
    case 'stat:getPvData': {
      var { list, exports } = data.data;
      list = await batchWechatData(list);
      viewContents.send('fromMain', { tag: 'stat-ret:getPvData', data: { list, exports } });
      break;
    }
    case 'stat:exportPvData': {
      var res = await dialog.showSaveDialog(tabbedWin.win, {
        defaultPath: path.join(app.getPath('downloads'), 'stat.csv'),
      })
      var csv = data.data;
      if (platform === 'win32') {
        csv = iconv.encode(csv, 'gbk');
      }
      if (res.filePath) {
        fs.writeFile(res.filePath, csv, (err) => {
          if (err) console.error(err)
        });
      }
      break;
    }
    case 'appmsg:getShopCommodity': {
      verbose_log('===== getShopCommodity ====', data);
      const res = await getShopCommodity(data);
      viewContents.send('fromMain', { tag: 'appmsg-ret:getShopCommodity', data: res });
    }
    case 'appmsg:getWindowProduct': {
      verbose_log('===== getWindowProduct ====', data);
      try {
        const res = await getWindowProduct(data);
        viewContents.send('fromMain', { tag: 'appmsg-ret:getWindowProduct', data: res });
      } catch (e) {
        verbose_error('getWindowProduct error', e);
        viewContents.send('fromMain', { tag: 'appmsg-ret:getWindowProduct', data: { success: false, err: e && e.message ? e.message : e } });
      }
    }
    case 'appmsg:getLinkInfo': {
      verbose_log("===== listen getLinkInfo in main ====", data)
      const { source, token, linkData } = data
      const ret = await getLinkInfo(linkData)
      if (!ret.success) {
        verbose_log("===== 获取文章链接信息失败 ====", ret.err_msg)
      } else {
        verbose_log("===== 获取文章链接信息成功 ====", ret)
      }
      viewContents.send('fromMain', { tag: 'appmsg-ret:getLinkInfo', data: { source, ret } })
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

function initRpc() {
  ipcMain.handle('callRpc', async (evt, { name, data }) => {
    const viewContents = webContents.fromId(evt.sender.id)
    switch (name) {
      case 'wechat:getQRCode': {
        verbose_log('===== wechat:getQRCode ====', data);
        const { fingerprint } = data;
        
        try {
          // 创建一个隐藏的 BrowserWindow 来执行请求，这样可以自动管理 Cookie
          const win = new BrowserWindow({
            show: false,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              partition: 'persist:wechat-qrcode-' + Date.now()
            }
          });
          
          // 先加载微信页面，建立 Cookie 上下文
          await win.loadURL('https://mp.weixin.qq.com/');
          
          // 在页面中执行完整的登录流程（与 Python 代码一致）
          const result = await win.webContents.executeJavaScript(`
            (async function() {
              try {
                const fingerprint = '${fingerprint}';
                
                // 步骤1: prelogin
                console.log('开始 prelogin...');
                const preloginUrl = 'https://mp.weixin.qq.com/cgi-bin/bizlogin';
                const formData1 = new URLSearchParams({
                  action: 'prelogin',
                  fingerprint: fingerprint,
                  token: '',
                  lang: 'zh_CN',
                  f: 'json',
                  ajax: '1'
                });
                
                const response1 = await fetch(preloginUrl, {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                    'Referer': 'https://mp.weixin.qq.com',
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  body: formData1.toString()
                });
                const result1 = await response1.json();
                console.log('prelogin 结果:', result1);
                
                // 步骤2: startlogin
                console.log('开始 startlogin...');
                const startloginUrl = 'https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin';
                const sessionid = Date.now();
                const formData2 = new URLSearchParams({
                  userlang: 'zh_CN',
                  redirect_url: '',
                  login_type: '3',
                  sessionid: sessionid.toString(),
                  fingerprint: fingerprint,
                  token: '',
                  lang: 'zh_CN',
                  f: 'json',
                  ajax: '1'
                });
                
                const response2 = await fetch(startloginUrl, {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                    'Referer': 'https://mp.weixin.qq.com',
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  body: formData2.toString()
                });
                const result2 = await response2.json();
                console.log('startlogin 结果:', result2);
                
                // 步骤3: 获取二维码
                console.log('开始获取二维码...');
                const qrcodeUrl = 'https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random=' + Date.now() + '&login_appid=';
                const response3 = await fetch(qrcodeUrl, {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                    'Referer': 'https://mp.weixin.qq.com'
                  }
                });
                
                const arrayBuffer = await response3.arrayBuffer();
                console.log('二维码数据大小:', arrayBuffer.byteLength);
                
                // 转换为 Base64
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                const qrcodeBase64 = 'data:image/png;base64,' + base64;
                
                return {
                  success: true,
                  qrcodeBase64: qrcodeBase64,
                  fingerprint: fingerprint
                };
              } catch (e) {
                console.error('获取二维码失败:', e);
                return {
                  success: false,
                  error: e.message
                };
              }
            })();
          `);
          
          // 保存 window 引用，用于后续的扫码检查
          if (!global.wechatQRCodeWindows) {
            global.wechatQRCodeWindows = new Map();
          }
          global.wechatQRCodeWindows.set(fingerprint, win);
          
          verbose_log('获取二维码结果:', result);
          return result;
        } catch (error) {
          verbose_error('获取二维码失败:', error);
          return {
            success: false,
            error: error.message
          };
        }
      }
      case 'wechat:checkScan': {
        verbose_log('===== wechat:checkScan ====', data);
        const { fingerprint, token } = data;
        
        try {
          // 使用之前保存的 window 来检查扫码状态，保持 Cookie 连续性
          const win = global.wechatQRCodeWindows && global.wechatQRCodeWindows.get(fingerprint);
          
          if (!win || win.isDestroyed()) {
            return {
              status: 0,
              error: 'Session expired'
            };
          }
          
          // 在同一个 window 中检查扫码状态
          const result = await win.webContents.executeJavaScript(`
            (async function() {
              try {
                const fingerprint = '${fingerprint}';
                const checkUrl = 'https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=ask&fingerprint=' + fingerprint + '&token=&lang=zh_CN&f=json&ajax=1';
                
                const response = await fetch(checkUrl, {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                    'Referer': 'https://mp.weixin.qq.com'
                  }
                });
                
                const result = await response.json();
                console.log('扫码状态检查结果:', result);
                return result;
              } catch (e) {
                console.error('检查扫码状态失败:', e);
                return {
                  status: 0,
                  error: e.message
                };
              }
            })();
          `);
          
          verbose_log('checkScan result:', result);
          
          // 如果登录成功，获取 Cookie 并保存账号信息
          if (result.status === 1 && result.user_category >= 2) {
            verbose_log('扫码成功，开始获取账号信息');
            
            // 获取 Cookie
            const cookies = await win.webContents.session.cookies.get({ domain: 'mp.weixin.qq.com' });
            verbose_log('获取到的 cookies:', cookies.map(c => c.name));
            
            const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
            const tokenCookie = cookies.find(c => c.name === 'token');
            const bizuinCookie = cookies.find(c => c.name === 'data_bizuin');
            
            let originalUsername = slaveUserCookie ? slaveUserCookie.value : '';
            const accountToken = tokenCookie ? tokenCookie.value : (bizuinCookie ? bizuinCookie.value : '');
            
            // 如果 slave_user 为空，尝试从其他 cookie 获取
            if (!originalUsername) {
              const bizuserCookie = cookies.find(c => c.name === 'bizuin');
              originalUsername = bizuserCookie ? bizuserCookie.value : '';
            }
            
            // 如果还是为空，使用 token 作为 originalUsername
            if (!originalUsername && accountToken) {
              originalUsername = accountToken;
            }
            
            verbose_log('originalUsername:', originalUsername);
            verbose_log('accountToken:', accountToken);
            
            // 准备账号数据
            const payload = {
              platform: { id: 4 },
              cookies: cookies,
              localStorage: {},
              sessionStorage: {},
              token: parseInt(accountToken) || 0,
              originalUsername: originalUsername || 'wechat_' + Date.now(),
              name: '微信公众号',
              avatar: '',
              userToken: token
            };
            
            // 调用 postToken 添加账号
            const addResult = await postToken(payload, tabbedWin);
            
            verbose_log('账号添加结果:', addResult);
            
            // 清理 window
            if (global.wechatQRCodeWindows) {
              global.wechatQRCodeWindows.delete(fingerprint);
            }
            win.close();
            
            // 返回结果，包含账号添加状态
            return {
              ...result,
              accountAdded: addResult && addResult.code === 1
            };
          }
          
          return result;
        } catch (error) {
          verbose_error('检查扫码状态失败:', error);
          return {
            status: 0,
            error: error.message
          };
        }
      }
      case 'getWxGroupList': {
        return getWxGroupList(data.account);
      }
      case 'getRegions': {
        const cookies = data.account ? serializeCookie(JSON.parse(data.account.session_id).cookie) : '';
        return getRegions({ cookies, id: data.id || 0 });
      }
      case 'batchWxUploadImg': {
        return batchWxUploadImg(data.account, data.urls);
      };
      case 'batchExtractMpUrls': {
        const token = data.token;
        return Promise.allSettled(data.urls.map(v=>
          localExtractMpArticleUrlUseRequest(v, undefined, token)
            .then(html => postJsonToJZLApi(`/prase_html_to_json?api_key=${encodeURIComponent("du&cgIYuosQcaSm6")}`, { html }))
            .then(async (res)=>{
              if(res.code!==0){
                dog("/prase_html_to_json error:", res);
                if(res.code===101){ // 文章被删除
                  return {content_noencode: res.msg, base_resp:{ret:0}};
                }
                var win=new BrowserWindow({show:false});
                var _i=0;
                async function extractMpArticle(){
                  var html=await win.webContents.executeJavaScript(`document.querySelector('#js_content')?.innerHTML`);
                  if(!html&&_i++<9){
                    await new Promise(r => setTimeout(r, 1000));
                    return extractMpArticle();
                  }
                  return html||`加载超时<a href="${v}">${v}</a>`;
                }
                await win.loadURL(v);
                var content_noencode=await extractMpArticle();
                win.close();
                return {content_noencode,base_resp:{ret:0}};
              }
              return res;
            })
        ))
      };
      case 'extractMpUrlDirect': {
        // 直接使用 BrowserWindow 提取，不经过 API，避免长链接转换问题
        const url = data.url;
        verbose_log('extractMpUrlDirect: 开始提取', url);
        
        return new Promise(async (resolve, reject) => {
          try {
            const win = new BrowserWindow({
              show: false,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            
            let _i = 0;
            async function extractMpArticle() {
              try {
                const html = await win.webContents.executeJavaScript(`document.querySelector('#js_content')?.innerHTML`);
                if (!html && _i++ < 15) {
                  await new Promise(r => setTimeout(r, 1000));
                  return extractMpArticle();
                }
                return html || '';
              } catch (e) {
                verbose_error('extractMpArticle error:', e);
                return '';
              }
            }
            
            await win.loadURL(url);
            const content_noencode = await extractMpArticle();
            win.close();
            
            if (content_noencode) {
              resolve({
                success: true,
                content_noencode: content_noencode,
                base_resp: { ret: 0 }
              });
            } else {
              resolve({
                success: false,
                error: '无法提取文章内容'
              });
            }
          } catch (error) {
            verbose_error('extractMpUrlDirect error:', error);
            reject(error);
          }
        });
      };
      case 'wxListImages': {
        var {account,group_id,page,limit}=data;
        var cookies= serializeCookie(JSON.parse(account.session_id)["cookie"])
        var token= +account.token;
        var begin= (page-1)*limit;
        return listFiles({ count: 12, cookies,token,begin,group_id, type: 2 })
      };
      case 'wxDelImgs': {
        return deleteFile(data)
      };
      case 'wxListVideos': {
        return listVideos(data)
      };
      case 'wxDelVideos': {
        return deleteVideo(data)
      };
      case 'batchWxAggregate':{
        return batchWxAggregateSafe(data);
      }
      case 'checkAppmsgCopyrightStat': {
        let cookies = '';
        let token = 0;
        if (data.account) {
          try {
            const sessionData = typeof data.account.session_id === 'string' 
              ? JSON.parse(data.account.session_id) 
              : data.account.session_id;
            cookies = serializeCookie(sessionData.cookie);
            token = parseInt(data.account.token);
          } catch (e) {
            verbose_error('checkAppmsgCopyrightStat parse account error:', e);
          }
        }
        return checkAppmsgCopyrightStat({ 
          cookies, 
          token, 
          url: data.url, 
          begin: data.begin, 
          count: data.count 
        });
      }
      case 'getLinkInfo': {
        let cookies = '';
        let token = 0;
        if (data.account) {
          try {
            const sessionData = typeof data.account.session_id === 'string' 
              ? JSON.parse(data.account.session_id) 
              : data.account.session_id;
            cookies = serializeCookie(sessionData.cookie);
            token = parseInt(data.account.token);
          } catch (e) {
            verbose_error('getLinkInfo parse account error:', e);
          }
        }
        return getLinkInfo({ 
          cookies, 
          token, 
          link: data.link,
          scene: data.scene || 4
        });
      }
      default: {
        console.error(new Error(`Unknown RPC call: ${name}`));
        return null;
      }
    }
  })
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



