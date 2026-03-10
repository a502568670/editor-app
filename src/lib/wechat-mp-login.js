/**
 * Python 风格的公众号扫码登录 - 纯 API 调用，不加载页面
 * 与 tabBar.vue 中 pythonCode 逻辑一致，使用 session 管理 cookie
 */
import axios from 'axios';

const FINGERPRINT = '64f379b133f5d29df7b2d4d72faf8812';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';
const BASE = 'https://mp.weixin.qq.com';

function parseSetCookie(header) {
  if (!header) return [];
  const cookies = Array.isArray(header) ? header : [header];
  return cookies.map(c => {
    const [nameVal] = c.split(';').map(s => s.trim());
    const eqIdx = nameVal.indexOf('=');
    const name = (eqIdx >= 0 ? nameVal.slice(0, eqIdx) : nameVal).trim();
    const value = (eqIdx >= 0 ? nameVal.slice(eqIdx + 1) : '').trim();
    return { name, value, domain: 'mp.weixin.qq.com', path: '/' };
  });
}

function mergeCookies(existing, newOnes) {
  const map = new Map(existing.map(c => [c.name, c]));
  newOnes.forEach(c => map.set(c.name, c));
  return Array.from(map.values());
}

function cookieHeader(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

export function createWechatMPSession() {
  let cookies = [];

  const commonHeaders = {
    'User-Agent': UA,
    'Referer': BASE + '/',
    'accept': '*/*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'x-requested-with': 'XMLHttpRequest'
  };

  const request = async (method, url, data = null, options = {}) => {
    const config = {
      method,
      url: url.startsWith('http') ? url : BASE + url,
      headers: { ...commonHeaders, ...options.headers },
      maxRedirects: 5,
      validateStatus: () => true,
      withCredentials: false,
      timeout: 15000
    };
    if (options.responseType) config.responseType = options.responseType;
    if (cookies.length) config.headers['Cookie'] = cookieHeader(cookies);
    if (data && method === 'POST') {
      config.data = typeof data === 'string' ? data : new URLSearchParams(data).toString();
      if (typeof data === 'object' && !(data instanceof URLSearchParams)) {
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }
    const res = await axios(config);
    const setCookie = res.headers['set-cookie'];
    if (setCookie) cookies = mergeCookies(cookies, parseSetCookie(setCookie));
    return res;
  };

  return {
    cookies: () => [...cookies],
    prelogin: () => request('POST', '/cgi-bin/bizlogin', {
      action: 'prelogin',
      fingerprint: FINGERPRINT,
      token: '',
      lang: 'zh_CN',
      f: 'json',
      ajax: 1
    }),
    startlogin: (sessionid) => request('POST', '/cgi-bin/bizlogin?action=startlogin', {
      userlang: 'zh_CN',
      redirect_url: '',
      login_type: 3,
      sessionid: String(sessionid),
      fingerprint: FINGERPRINT,
      token: '',
      lang: 'zh_CN',
      f: 'json',
      ajax: 1
    }),
    getQrcode: () => request('GET', `/cgi-bin/scanloginqrcode?action=getqrcode&random=${Date.now()}&login_appid=`, null, { responseType: 'arraybuffer' }),
    ask: () => request('GET', `/cgi-bin/scanloginqrcode?action=ask&fingerprint=${FINGERPRINT}&token=&lang=zh_CN&f=json&ajax=1`),
    login: () => request('POST', '/cgi-bin/bizlogin?action=login', 'userlang=zh_CN&redirect_url=&cookie_forbidden=0&cookie_cleaned=1&plugin_used=0&login_type=3&fingerprint=' + FINGERPRINT + '&token=&lang=zh_CN&f=json&ajax=1'),
    getHome: (path) => request('GET', path.startsWith('/') ? path : BASE.replace(/\/$/, '') + path),
    getSafeCenter: (token) => request('GET', `/cgi-bin/safecenterstatus?action=view&t=setting/safe-index&token=${token}&lang=zh_CN&f=json`)
  };
}
