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
    let localStorage = await viewData.webview.webContents.executeJavaScript(`window.getLocalStorage()`);
    viewData.webview.webContents.session.cookies.get({domain: 'baidu.com'}).then(async (cookies) => {
      postToken(viewData, cookies, localStorage,sessionStorage,data.name,data.avatar)
    });
  })
    // 需要拦截的URL地址
    const taibao_filter = {
        urls: ["https://baijiahao.baidu.com/*"]
    }
    viewData.webview.webContents.session.webRequest.onBeforeSendHeaders(taibao_filter, (details, callback) => {
      if(details.url.indexOf('baijiahao.baidu.com/builder/theme/bjh/login')==-1) {
        if (viewData.user && viewData.user.session_id) {
          let cookies=details.requestHeaders['Cookie'];
          let session_id = viewData.user.session_id
          if (session_id && session_id.cookie) {
            let cookie_str = ''
            for (let a of session_id.cookie) {
              cookie_str += a.name + '=' + a.value + ';'
            }
            var reg = /;$/gi;
            cookie_str = cookie_str.replace(reg, "");
            details.requestHeaders['Cookie'] = cookie_str
          }
        }
      }
        callback({requestHeaders: details.requestHeaders});
    })
    viewData.webview.webContents.session.setDevicePermissionHandler((webContents, permission, requestingOrigin, details) => {
        return true
    })
    // viewData.webview.webContents.setWindowOpenHandler(data => {
    //     let url = data.url;
    //     if(url=='about:blank'){
    //         return {action: 'deny'};
    //     }
    //     viewData.webview.webContents.loadURL(url,{
    //         httpReferrer:data.referrer
    //     });
    //     return {action: 'deny'};
    // });
    // 导航完成时触发，即选项卡的旋转器将停止旋转，并指派onload事件后。
    viewData.webview.webContents.on("did-finish-load", async function (e) {
        let currentURL = viewData.webview.webContents.getURL()
    });
  viewData.webview.webContents.loadURL('https://baijiahao.baidu.com/builder/theme/bjh/login')
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
      if (session_id.localStorage && JSON.stringify(session_id.localStorage) != "{}") {
          setTimeout(()=>{
            if(session_id.localStorage){
              for(let key in session_id.localStorage){
                viewData.webview.webContents.executeJavaScript(`window.localStorage.setItem('${key}','${session_id.localStorage[key]}');`);
              }
            }
            if(session_id.sessionStorage){
              for(let key in session_id.sessionStorage){
                viewData.webview.webContents.executeJavaScript(`window.sessionStorage.setItem('${key}','${session_id.sessionStorage[key]}');`);
              }
            }
            if (session_id.cookie) {
              setCookies(session_id.cookie, viewData.webview.webContents)
            }
            viewData.webview.webContents.loadURL('https://baijiahao.baidu.com/')
          },2000)
      }
    }
}
