// 主进程


const { ipcMain, dialog} =require('electron')
const path = require('path')


let viewData;
function init(d,postToken) {
    viewData=d

  // 清除所有与 bilibili.com 相关的 Cookie
  viewData.webview.webContents.session.cookies.get({ domain: 'bilibili.com' }).then((cookies) => {
    console.log('清除所有与 bilibili.com 相关的 Cookie', cookies)
    cookies.forEach((cookie) => {
      viewData.webview.webContents.session.cookies.remove(cookie.url, cookie.name).then(() => {
        console.log(`Cookie ${cookie.name} 已清除`);
      }).catch((error) => {
        console.error(`清除 Cookie ${cookie.name} 时出错:`, error);
      });
    });
  }).catch((error) => {
    console.error('获取 Cookie 时出错:', error);
  });

  // 监听 'getWorkType' 消息，判断用户是否已登录
  ipcMain.on('getWorkType', (event, data) => {
    console.log('获取 WorkType,检测用户登录状态');
    if(viewData.user){ // 如果 viewData.user 存在，返回 true，表示用户已登录；否则返回 false。

      event.returnValue=true
    }else {
      event.returnValue=false
    }
  })
  // 移除所有 'logined' 监听器，避免重复监听
  ipcMain.removeAllListeners(['logined'])
  // 监听 'logined' 消息，处理用户登录后的操
  ipcMain.on('logined', async (event, data) => {
    // 获取 WebView 的 SessionStorage
    let sessionStorage = await viewData.webview.webContents.executeJavaScript(`window.getSessionStorage()`);
    console.log('用户获取',sessionStorage)
    // 获取 Bilibili 的 Cookie
    viewData.webview.webContents.session.cookies.get({domain: 'bilibili.com'}).then(async (cookies) => {
      console.info('用户获取的cookie',cookies)
      // 主进程调用 postToken 方法，将用户信息存储到对应标签页
      postToken(viewData, cookies, {},sessionStorage,data.name,data.avatar)
    });
  })
    // 需要拦截的URL地址
    const taibao_filter = {
        urls: ["https://www.bilibili.com/*"]
    }
  // 拦截请求头，在请求 Bilibili 时添加 Cookie
    viewData.webview.webContents.session.webRequest.onBeforeSendHeaders(taibao_filter, (details, callback) => {
        if (viewData.user&&viewData.user.session_id) {
            let session_id = viewData.user.session_id
            if (session_id&&session_id.cookie) {
                let cookie_str = ''
                for (let a of session_id.cookie) {
                    cookie_str += a.name + '=' + a.value + ';'
                }
                var reg = /;$/gi;
                cookie_str = cookie_str.replace(reg, "");
                details.requestHeaders['Cookie'] = cookie_str
            }
        }
        callback({requestHeaders: details.requestHeaders});
    })
  // 设置设备权限处理程序，允许所有权限
    viewData.webview.webContents.session.setDevicePermissionHandler((webContents, permission, requestingOrigin, details) => {
        return true
    })
  // 设置 WebView 的窗口打开行为
    viewData.webview.webContents.setWindowOpenHandler(data => {
        let url = data.url;
        if(url=='about:blank'){
            return {action: 'deny'};
        }
        viewData.webview.webContents.loadURL(url,{
            httpReferrer:data.referrer
        });
        return {action: 'deny'};
        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                width: 1176,
                height: 644,
                resizable: true,
                center: true,
                maximizable: true,
                closable: true,
                movable: true,
                webPreferences: {
                    // nodeIntegration: true,
                    // nodeIntegrationInWorker: true,// 是否在Web工作器中启用了Node集成
                    nodeIntegrationInSubFrames:true,
                    // nableRemoteModule: true,  // 打开remote模块
                    allowRunningInsecureContent: true,
                    partition:viewData.partition,
                    webSecurity: false,
                    javascript: true,
                    contextIsolation: false,
                    plugins: true,
                    preload: path.join(__dirname, 'pingan_preload.js')
                }
            }
        };
    });
    // 导航完成时触发，即选项卡的旋转器将停止旋转，并指派onload事件后。加载特定 URL



    viewData.webview.webContents.on("did-finish-load", async function (e) {
        let currentURL = viewData.webview.webContents.getURL()
      if (!viewData.user&&currentURL.indexOf('www.bilibili.com') > -1) {
        viewData.webview.webContents.loadURL('https://space.bilibili.com')
      }
    });

    // 初始化时加载 Bilibili 登录页面
  viewData.webview.webContents.loadURL('https://passport.bilibili.com/pc/passport/login')
}
module.exports.init = init;
module.exports.update=function(d) {
    viewData=d;  //将传入的视图数据存储在 viewData 中，包含 WebView 和用户信息等。
}
module.exports.selectUser=function(d,setCookies) {
    viewData=d;
    let user=viewData.user;
    if (user&&user.session_id) {
        let session_id = user.session_id
        if (session_id.cookie) {
            setCookies(session_id.cookie, viewData.webview.webContents)
        }
        viewData.webview.webContents.loadURL('https://www.bilibili.com/')
    }
}
