const { net, session } = require('electron');
const global = require('./global');

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const get_backend_url_old = global.default.utils.get_backend_url_old;

function init(platformData) {
  const win = platformData.webview;
  const url = platformData.user.platform_url;

  verbose_log('初始化平台数据:', {
    url: url,
    session_id: platformData.user.session_id,
    hasTabWin: !!platformData.tabWin,
    hasWebview: !!platformData.webview
  });

  // 设置窗口打开行为
  win.webContents.setWindowOpenHandler(data => {
    let url = data.url;
    if (url == 'about:blank') {
      return { action: 'deny' };
    }
    verbose_log('setWindowOpenHandler url:', url);
    win.webContents.loadURL(url, {
      httpReferrer: data.referrer
    });
    return { action: 'deny' };
  });

  // 先注入cookie，再加载页面（确保请求时携带cookie）
  injectCookie(platformData).then(() => {
    // cookie注入完成后再加载初始页面
    win.webContents.loadURL(url).catch(e => verbose_error('标签页初始加载失败:', e));

    // 监听cookie变化
    win.webContents.session.cookies.on('changed', (event, cookie, cause, removed) => {
      if (cookie.name === 'sessionid') {
        verbose_log('cookie changed:', { event, cookie, cause, removed });
        setCookie(platformData);
      }
    });
  });
}

/** 保存登录信息 */
async function setCookie(platformData) {
  const session = platformData.webview.webContents.session;
  const cookies = await session.cookies.get({ url: platformData.user.platform_url });

  const payload = {
    platform: { id: 6 }, // 通用平台ID
    cookies: cookies,
    localStorage: '',
    sessionStorage: '',
    originalUsername: platformData.user.original_id,
    name: platformData.user.name,
    avatar: '',
    userToken: platformData.user.userToken,
    platform_url: platformData.user.platform_url
  };

  postToken(payload, platformData.tabWin);
}

/** 注入cookie */
async function injectCookie(platformData) {
  const url = platformData.user.platform_url;
  const partition = platformData.partition;
  const cookie = platformData.user && platformData.user.session_id && platformData.user.session_id.cookie;

  const customSession = session.fromPartition(partition, { cache: true });

  verbose_log('准备注入cookie:', { url, partition, cookie });

  if (cookie && Array.isArray(cookie)) {
    for (const c of cookie) {
      const setCookie = {
        url: url,
        name: c.name,
        value: c.value,
        domain: c.domain.replace(/^\./, ''),
        path: c.path || '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        expirationDate: c.expirationDate
      };
      try {
        await customSession.cookies.set(setCookie);
      } catch (err) {
        // 保存报错log
        verbose_error('set cookie failed', { cookie: setCookie, error: err });
      }
    }
  }
}

/** 提交token到后端 */
/** HTTP POST 请求封装函数 */
const post = function (url, postData, newheaders) {
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }

    const [backend_protocol, backend_host, backend_port] = get_backend_url_old();

    const request = net.request({
      method: 'post',
      protocol: backend_protocol,
      hostname: backend_host,
      port: backend_port,
      path: url,
      headers: headers
    });

    request.on('response', response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk.toString();
      });
      response.on('end', () => {
        verbose_log('数据接收完成');
        if (response.statusCode == 200) {
          verbose_log('数据接收完成', data);
          resolve(data);
        } else {
          reject();
        }
      });
    });

    let param = '';
    for (let key in postData) {
      param += key + '=' + postData[key] + '&';
    }
    request.write(param);
    request.end();
  });
};
async function postToken(payload, tabWin) {
  const {
    platform,
    cookies,
    localStorage,
    sessionStorage,
    originalUsername,
    name,
    avatar,
    userToken,
    platform_url
  } = payload;
  let url = '/platform/addAccount';
  let data = { cookie: cookies, localStorage: localStorage || {}, sessionStorage: sessionStorage || {} };

  try {
    let resultData = await post(
      url,
      {
        session_id: encodeURIComponent(JSON.stringify(data)),
        platform_id: platform.id,
        originalUsername: originalUsername,
        avatar: avatar,
        name: encodeURIComponent(name),
        platform_url: platform_url || ''
      },
      { Authorization: `Bearer ${userToken}`, 'X-Sjq-Token': '' }
    );
    resultData = JSON.parse(resultData);
    verbose_log('postToken 响应结果:', resultData);
    if (resultData.code === 1) {
      if (tabWin && tabWin.win && !tabWin.win.isDestroyed()) {
        tabWin.win.webContents.send('fromMain', 'login-success');
        verbose_log('login-success 消息已发送');
      } else {
        verbose_error('无法发送消息: tabWin.win 不存在或已销毁');
      }
    } else {
      verbose_log('后端返回失败:', resultData.msg);
    }
  } catch (e) {
    verbose_error('postToken 错误:', e);
  }
}

module.exports = {
  init
};
