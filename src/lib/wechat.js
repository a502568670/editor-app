const { ipcMain, dialog, net } = require('electron');
const path = require('path');
const global = require("./global")

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const get_backend_url = global.default.utils.get_backend_url;

// const { postToken } = require('./window');
// const { removeAccountSession } = require("../api/account")

let viewData;

// 获取Cookie的函数
async function getCookies(domain, webContents) {
  try {
    if (webContents) {
      const cookies = await webContents.session.cookies.get({ domain });
      // verbose_log('获取到的 Cookie:', cookies);
      return cookies;
    } else {
      verbose_error('webContents 未正确初始化');
      return [];
    }
  } catch (error) {
    verbose_error('获取 Cookie 时出错:', error);
    return [];
  }
}

function checkCookiesExpired(cookies, checkkeys) {
  const now = Date.now()
  const isExpired = checkkeys.some(cookieName => {
    const cookie = cookies.find(ck => ck.name === cookieName)
    if (!cookie) {
      return true
    }
    const expirationDate = cookie.expirationDate * 1000
    verbose_log(`now:${now}, expirationDate:${expirationDate}`)
    return now >= expirationDate
  });
  return isExpired
}

// 初始化init
async function init(d, postTokenInWin) {
  viewData = d;

  platform = {
    id: 4,
    name: '微信公众号'
  };

  // 重置 isLoginedEventTriggered 标志
  let isLoginedEventTriggered = false;

  // 登录状态检测函数
  async function checkLoginStatus(event) {
    verbose_log('checkLoginStatus 开始检查登录状态');

    // 如果 viewData.user 已存在，直接返回已登录
    verbose_log("in checkLoginStatus viewData.user=>", viewData.user);
    const original_id = (viewData.user || {}).original_id
    const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
    const requiredCookies = ['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin'];

    if (viewData.user && viewData.user.session_id) {
      if (event) event.returnValue = true;
      // 还需判断cookies是否过期
      const isExpired = checkCookiesExpired(cookies, requiredCookies)
      return !isExpired;
    }

    try {
      const currentURL = viewData.webview.webContents.getURL();
      verbose_log('打印当前URL判断是否是首页', currentURL);
      if (currentURL.indexOf('mp.weixin.qq.com/cgi-bin/home') > -1) {

        // const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
        verbose_log("original_id=>", original_id)

        if (original_id) {
          const slave_user_cookies = cookies.filter(ck => ck.name === "slave_user")
          if (slave_user_cookies.length === 0) {
            return false;
          }
          if (slave_user_cookies.some(ck => ck.value !== original_id)) {
            verbose_log("original_id not matched", slave_user_cookies.map(ck => ck.value))
            return false
          }
        }

        const hasAllCookies = requiredCookies.every(cookieName =>
          cookies.some(cookie => cookie.name === cookieName)
        );

        if (hasAllCookies) {
          // intervalId && clearInterval(intervalId);
          const finalURL = viewData.webview.webContents.getURL();
          // verbose_log("checkLoginStatus finalURL=>", viewData.webview.webContents.getURL())
          // verbose_log("checkLoginStatus finalURL2=>", d.webview.webContents.getURL())
          const urlParams = new URLSearchParams(new URL(finalURL).search);
          const token = urlParams.get('token');
          const settingPageURL = `https://mp.weixin.qq.com/cgi-bin/settingpage?t=setting/index&action=index&token=${token}&lang=zh_CN&f=json`;
          verbose_log('拼接后的settingPageURL', settingPageURL);
          // const session = viewData.webview.webContents.session;

          // session.clearStorageData({
          //   storages: ['cookies', 'localstorage', 'caches']
          // }, function (data) {
          //   console.log('cleard', data);
          // })
          verbose_log("cleard2")

          const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
          try {
            const response = await fetch(settingPageURL, {
              method: 'GET',
              headers: {
                'Cookie': cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
              }
            });

            if (response.ok) {
              const data = await response.json();
              // verbose_log('data=>', data)
              let nickname = data.setting_info && data.setting_info.nickname && data.setting_info.nickname.nickname;
              const originalUsername = data.setting_info && data.setting_info.original_username;
              verbose_log('获取到的原始iD:', originalUsername);
              const original_id = viewData.user && viewData.user.original_id;
              if (original_id && original_id !== originalUsername) {
                verbose_error(`不匹配的原始id: original_id(${original_id}) loggedIn(${originalUsername})`);
                if (event) event.returnValue = false;
                // resolve(false);
                return false
              }
              if (!nickname) {
                nickname = "未命名账号"
              }
              if (originalUsername) {
                const avatarUrl = `https://open.weixin.qq.com/qr/code?username=${originalUsername}`;
                

                const decodedNickname = escape(nickname)
                verbose_log("nickname=>", nickname)
                verbose_log("decodedNickname=>", decodedNickname)
                viewData.user = {
                  ...viewData.user,
                  userName: nickname,
                  avatar: avatarUrl,
                  originalUsername: originalUsername,
                  cookies: cookies,
                  token: parseInt(token),
                };
                // console.log("set viewData.user", viewData.user)
                triggerLoginedEvent(viewData); // 触发登录事件
                verbose_log("isLoginedEventTriggered:", isLoginedEventTriggered)
                isLoginedEventTriggered = true;

                if (event) event.returnValue = true;
                // resolve(true);
                return true
              } else {
                verbose_error('账号状态异常:', originalUsername);
              }
            }
          } catch (error) {
            verbose_error('获取用户信息失败:', error);
            if (event) event.returnValue = false;
            // resolve(false);
            return false
          }
        }
        // return new Promise((resolve) => {
        //   const intervalId = setInterval(async () => {
        //     try {

        //     } catch (error) {
        //       verbose_error('检查cookie时出错:', error);
        //       clearInterval(intervalId);
        //     }
        //   }, 1000);
        // });
      } 
      else if (currentURL.indexOf('mp.weixin.qq.com/cgi-bin/wticketcontractorverify?action=bind_admin_page') > -1) {
        verbose_error('==管理员被解绑==');
        return false;
      }
      else if (currentURL.indexOf('/acct/contractorpage?action=showsubmit') > -1) {
        verbose_error('==未注册完成==');
        return false;
      }
      else if (currentURL.indexOf('/acct/ban?ticket_id=gh') > -1) {
        verbose_error('==封号==');
        return false;
      }
      else if (currentURL.indexOf('cgi-bin/acctclose') > -1) {
        verbose_error('==账号已冻结==');
        return false;
      }
      else {
        if (event) event.returnValue = false;
        return false;
      }
    } catch (error) {
      verbose_error('获取用户信息出错:', error);
    }
    if (event) event.returnValue = false;
    // resolve(false);
    return false
  }

  // 移除所有旧的监听器
  ipcMain.removeAllListeners('logined');

  // 定义处理Logined事件的函数
  async function handleLoginedEvent(data, viewData) {
    try {
      // const cookies = viewData.user.cookies;
      // console.log('handleLoginedEvent viewData:', viewData);
     
      const payload = {
        // platform_id: 4,
        // platform_name: '微信公众号',
        platform: { id: 4 },
        cookies: viewData.user.cookies,
        localStorage: {},
        sessionStorage: {},
        token: viewData.user.token, // mp 自动生成的
        originalUsername: viewData.user.originalUsername,// gh_id
        name: viewData.user.userName, // nick_name
        avatar: viewData.user.avatar,
        userToken: viewData.user.userToken
      };
      // console.log('发送的数据:', payload.originalUsername);
      // console.log('发送的数据-nickName:', payload.name);
      if (postTokenInWin) {
        verbose_log("---postTokenInWin---")
        postTokenInWin(viewData, payload.cookies, payload.localStorage, payload.sessionStorage, payload.originalUsername, payload.name, payload.avatar, payload.token)
      } else {
        verbose_log("postToken is exisst:")
        // const platform = { id: 4 }
        // (platform, cookies, {}, sessionStorage, payload.originalUsername, payload.name, payload.avatar, payload.token)
        postToken && postToken(payload);

      }
      // postToken && postToken(viewData, cookies, {}, sessionStorage, payload.originalUsername, payload.name, payload.avatar);

      // 调用 selectUser 方法加载用户页面
      module.exports.selectUser(viewData, setCookies);
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);
    }
  }

  // 需要拦截的URL地址
  const weixin_filter = {
    urls: ["https://mp.weixin.qq.com/*"]
  };

  // 拦截请求头，在请求微信公众号时添加 Cookie
  viewData.webview.webContents.session.webRequest.onBeforeSendHeaders(weixin_filter, (details, callback) => {
    if (viewData.user && viewData.user.session_id) {
      let session_id = viewData.user.session_id;
      if (session_id && session_id.cookie) {
        let cookie_str = '';
        for (let a of session_id.cookie) {
          cookie_str += a.name + '=' + a.value + ';';
        }
        var reg = /;$/gi;
        cookie_str = cookie_str.replace(reg, "");
        details.requestHeaders['Cookie'] = cookie_str;
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // 设置设备权限处理程序，允许所有权限
  viewData.webview.webContents.session.setDevicePermissionHandler((webContents, permission, requestingOrigin, details) => {
    return true;
  });

  // 设置 WebView 的窗口打开行为
  viewData.webview.webContents.setWindowOpenHandler(data => {
    let url = data.url;
    if (url == 'about:blank') {
      return { action: 'deny' };
    }
    verbose_log("setWindowOpenHandler url:", url)
    viewData.webview.webContents.loadURL(url, {
      httpReferrer: data.referrer
    });
    return { action: 'deny' };
  });


  // 导航事件，监听退出
  // viewData.webview.webContents.on('will-navigate', function (event, url) {
  //   console.log("==will-navigate==")
  //   console.log("url=>", url);
  //   console.log("event=>", event)
  //   console.log("=================")
  // });

  viewData.webview.webContents.on('did-navigate', async function (event, url) {
    verbose_log("==did-navigate==")
    verbose_log("event=>", event);
    verbose_log("url=>", url);
    // console.log("event=>", event)
    if (url === "https://mp.weixin.qq.com/") {
      // 退出登陆
      verbose_log('退出登陆 viewData.user:', viewData.user);
      const accounlt_session_id = viewData.user.account_session_id
      verbose_log("accounlt_session_id:", accounlt_session_id)
      if (accounlt_session_id) {
        viewData.tabWin.raiseRenderAct('remove-account-session', accounlt_session_id)
        verbose_log("send remove-account-session event to ipcRenderer")
      }
    } else {

    }

    verbose_log("=================")
  });


  // 导航完成时触发，检查是否已登录
  viewData.webview.webContents.on("did-finish-load", async function () {
    verbose_log('页面加载完成，事件被触发');
    const currentURL = viewData.webview.webContents.getURL();
    verbose_log('当前URL', currentURL);

    // const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
    // console.log('当前 get Cookie:', cookies);

    // 调用登录检查函数
    verbose_log('调用checkLoginStatus检查登录状态');
    const isLoggedIn = await checkLoginStatus();
    verbose_log('登录状态:', isLoggedIn);

    // 如果已登录但尚未发送 logined 事件（可能在页面刷新后）
    // if (isLoggedIn && viewData.user) {
    //   triggerLoginedEvent(viewData);
    // }
  });

  // 触发登录事件的函数
  function triggerLoginedEvent(viewData) {
    if (!viewData || !viewData.webview || !viewData.webview.webContents) {
      verbose_error('无法触发logined事件: viewData结构不完整');
      return;
    }
    if (viewData.webview.webContents.isDestroyed()) {
      verbose_error('无法触发logined事件: webContents已销毁');
      return;
    }

    try {

      if (isLoginedEventTriggered) {
        verbose_log('logined事件已触发过，跳过重复触发');
        return;
      }
      const payload = {
        name: viewData.user.userName,
        avatar: viewData.user.avatar,
        originalUsername: viewData.user.originalUsername,
        cookies: viewData.user.cookies
      };

      verbose_log('准备发送logined事件:');
      handleLoginedEvent(payload, viewData);
      verbose_log('logined事件已处理');
      isLoginedEventTriggered = true;
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);

      // 添加重试机制
      if (typeof triggerLoginedEvent.retryCount === 'undefined') {
        triggerLoginedEvent.retryCount = 0;
      }
      if (triggerLoginedEvent.retryCount < 3) {
        triggerLoginedEvent.retryCount++;
        verbose_log(`尝试第${triggerLoginedEvent.retryCount}次重发...`);
        setTimeout(() => triggerLoginedEvent(viewData), 1000);
      } else {
        verbose_error('已达到最大重试次数，放弃发送logined事件');
      }
    }
  }

  // 初始化时加载微信公众号登录页面
  viewData.webview.webContents.loadURL('https://mp.weixin.qq.com/');
}

module.exports.init = init;

module.exports.update = function (d) {
  viewData = d;  // 将传入的视图数据存储在 viewData 中
};

module.exports.selectUser = function (d, setCookies) {
  viewData = d;
  verbose_log('selectUser 方法接收到的数据:', viewData);
  let user = viewData.user;
  if (user && user.session_id) {
    let session_id = user.session_id;
    if (session_id.cookie) {
      // console.log('set cookie for ', viewData.webview.webContents)
      setCookies(session_id.cookie, viewData.webview.webContents);
    }
    viewData.webview.webContents.loadURL('https://mp.weixin.qq.com/')
      .then(() => {
        let currentURL = viewData.webview.webContents.getURL();
        verbose_log('加载的公众号网址:', currentURL);
      })
      .catch((error) => {
        verbose_error('加载网址时出错:', error);
      });
  } else {
    // getCookies('mp.weixin.qq.com', viewData.webview.webContents).then(cookies => {
    //   console.log('webContents get Cookie:', cookies);
    // });

  }
};

const setCookies = async function (cookies, webContents) {
  for (let cookiesItem of cookies) {
    try {
      let {
        secure = false,
        domain = '',
        path = '',
        name
      } = cookiesItem;
      await webContents.session.cookies.set(Object.assign(cookiesItem, {
        url: (secure ? 'https://' : 'http://') + domain.replace(/^\./, '') + path
      }));
    } catch (e) {
      console.info(e);
    }
  }
};


// HTTP POST 请求封装函数
const post = function (url, postData, newheaders) {
  // console.log("数据接收完成", url);
  // console.log("要发送的数据", postData);
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }
    // 使用 net.request 创建一个 POST 请求，配置包括协议、主机地址、端口、路径和请求头。
    const [backend_protocol, backend_host, backend_port] = get_backend_url()
    // const backend_url = process.env.BACKEND_URL
    // verbose_log("post in wechat backend_url:", process.env.BACKEND_URL)
    // let [backend_protocol, backend_host, backend_port] = backend_url.split(":")
    // backend_protocol = backend_protocol + ":"
    // backend_host = backend_host.substring(2)
    // backend_port = parseInt(backend_port)
    verbose_log("backend_protocol=>", backend_protocol)
    verbose_log("backend_host=>", backend_host)
    verbose_log("backend_port=>", backend_port)
    
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
    request.write(param);
    request.end();
  });
}

// (platform, cookies, {}, sessionStorage, payload.originalUsername, payload.name, payload.avatar, payload.token)
const postToken = async function (payload) {
  const {platform, cookies, localStorage, sessionStorage, originalUsername, name, avatar, token, userToken} = payload
  // verbose_log("platform=>", platform)
  // verbose_log("cookies=>", cookies)
  // verbose_log("userToken=>", userToken)
  let url = '/platform/addAccount'; // 保留这个部分
  let data = { cookie: cookies, localStorage: localStorage || {}, sessionStorage: sessionStorage || {} };
  if (!platform || !platform.id) {
    return null;
  }
  try {
    let resultData = await post(url, {
      // session_id：通过 encodeURIComponent(JSON.stringify(data)) 序列化后的会话信息。
      // token: userToken,
      session_id: encodeURIComponent(JSON.stringify(data)),
      token: token,
      platform_id: platform.id,
      originalUsername: originalUsername,
      avatar: avatar,
      name: encodeURIComponent(name),
    }, { 'Authorization': `Bearer ${userToken}`, 'X-Sjq-Token': '' });//{ 'X-Sjq-Token': userToken || '' });
    resultData = JSON.parse(resultData);
    if (resultData.code == 1) {
      // tabbedWin.win.webContents.send('fromMain', "");
      // companyMap.webview.close();
      // if (Notification.isSupported()) {
      //   console.log('notification is supported');
      //   new Notification({
      //     title: '消息提示',
      //     subtitle: '登录信息上传成功',
      //     body: '登录信息上传成功'
      //   }).show();
      // }
    } else {
      verbose_log(resultData.msg);
    }
  } catch (e) {
    verbose_error(e); // 添加错误处理输出
  }
}







