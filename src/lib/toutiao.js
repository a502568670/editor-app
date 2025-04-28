const { ipcMain, dialog} =require('electron')
const path = require('path')
let viewData;
function init(d,postToken) {
    viewData=d
  ipcMain.on('getWorkType', (event, data) => {
    if(viewData.user){
      event.returnValue=true
    }else {
      event.returnValue=false
    }
  })
  ipcMain.removeAllListeners(['logined'])
  ipcMain.on('logined', async (event, data) => {
    let sessionStorage = await viewData.webview.webContents.executeJavaScript(`window.getSessionStorage()`);
    viewData.webview.webContents.session.cookies.get({domain: 'toutiao.com'}).then(async (cookies) => {
      postToken(viewData, cookies, {},sessionStorage,data.name,data.avatar)
    });
  })
    // viewData.webview.webContents.session.webRequest.onCompleted({urls: ['*://www.bilibili.com/*']}, async (detail) => {
    //     if (detail.statusCode != 200) {
    //         return
    //     }
    //     let url = detail.url
    //   if (url.indexOf('www.bilibili.com') > -1) {
    //     viewData.webview.webContents.loadURL('https://space.bilibili.com')
    //   }
    //     //console.info(url)
    //     // if (url.indexOf('api.bilibili.com/x/space/v2/myinfo') > -1) {
    //     //     if (!viewData.superlogin) {
    //     //         //let localStorage = await viewData.webview.webContents.executeJavaScript(`window.getLocalStorage()`);
    //     //         let sessionStorage = await viewData.webview.webContents.executeJavaScript(`window.getSessionStorage()`);
    //     //         viewData.webview.webContents.session.cookies.get({domain: 'bilibili.com'}).then(async (cookies) => {
    //     //             console.info(cookies)
    //     //             postToken(viewData.user, cookies, {},sessionStorage)
    //     //         });
    //     //     }
    //     // }
    // })
    // 需要拦截的URL地址
    // const taibao_filter = {
    //     urls: ["https://mp.toutiao.com/*"]
    // }
    // viewData.webview.webContents.session.webRequest.onBeforeSendHeaders(taibao_filter, (details, callback) => {
    //     if (viewData.user&&viewData.user.session_id) {
    //         let session_id = viewData.user.session_id
    //         if (session_id&&session_id.cookie) {
    //             let cookie_str = ''
    //             for (let a of session_id.cookie) {
    //                 cookie_str += a.name + '=' + a.value + ';'
    //             }
    //             var reg = /;$/gi;
    //             cookie_str = cookie_str.replace(reg, "");
    //             details.requestHeaders['Cookie'] = cookie_str
    //         }
    //     }
    //     callback({requestHeaders: details.requestHeaders});
    // })
    viewData.webview.webContents.session.setDevicePermissionHandler((webContents, permission, requestingOrigin, details) => {
        return true
    })
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
    // 导航完成时触发，即选项卡的旋转器将停止旋转，并指派onload事件后。
    viewData.webview.webContents.on("did-finish-load", async function (e) {
        let currentURL = viewData.webview.webContents.getURL()
      // if (!viewData.user&&currentURL.indexOf('www.bilibili.com') > -1) {
      //   viewData.webview.webContents.loadURL('https://mp.toutiao.com/profile_v4/index')
      // }
    });
  viewData.webview.webContents.loadURL('https://mp.toutiao.com/auth/page/login')
}
module.exports.init = init;
module.exports.update=function(d) {
    viewData=d;
}
module.exports.selectUser=function(d,setCookies) {
    viewData=d;
    let user=viewData.user;
    if (user&&user.session_id) {
        let session_id = user.session_id
        if (session_id.cookie) {
            setCookies(session_id.cookie, viewData.webview.webContents)
        }
        viewData.webview.webContents.loadURL('https://mp.toutiao.com')
    }
}
