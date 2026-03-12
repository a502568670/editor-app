export const serializeCookie = arr => {
  const items = [];
  arr.forEach(v => {
    // items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
    items.push(`${encodeURIComponent(v['name'])}=${v['value']}`);
  });
  // console.log("items=>", items)
  return items.join(';');
};
export function setCookie(cookies, maxage = 10) {
  cookies.forEach(v => {
    document.cookie = `${v.name}=${encodeURIComponent(v.value)};max-age=${maxage};domain=${
      v.domain
    };secure;samesite=lax`;
  });
  console.log(cookies, document.cookie);
}

export function checkWxSession(v) {
  if (!v.session_id) return true;

  // 检查是否被手动设为失效
  try {
    const forceInvalid = JSON.parse(localStorage.getItem('force_invalid_accounts') || '[]')
    if (forceInvalid.includes(v.id)) return true;
  } catch (e) { /* ignore */ }

  let cookieArray = [];
  try {
    const parsed = JSON.parse(v.session_id);
    const cookie = parsed.cookie || [];
    if (Array.isArray(cookie)) {
      cookieArray = cookie;
    } else if (typeof cookie === 'object' && cookie !== null) {
      cookieArray = Object.keys(cookie).map(name => ({
        name,
        value: cookie[name],
        expirationDate: Date.now() / 1000 + 86400 * 30
      }));
    } else {
      return true;
    }
  } catch (e) {
    console.error('checkWxSession 解析失败:', e);
    return true;
  }

  if (cookieArray.length === 0) return true;

  const t = Date.now() / 1000;

  // 微信公众号（platform_id === 4）：检测关键 cookie 是否存在、未过期且 value 不是 "EXPIRED"
  if (v.platform_id === 4) {
    const required = ['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin'];
    const expired = required.some(k => {
      const ck = cookieArray.find(c => c.name === k);
      if (!ck) return true;
      if (ck.value === 'EXPIRED' || ck.value === '') return true;
      if (ck.expirationDate && ck.expirationDate < t) return true;
      return false;
    });
    return expired;
  }

  // 知乎（platform_id === 6）：检测关键登录 cookie q_c1 或 z_c0
  if (v.platform_id === 6) {
    const loginKeys = ['q_c1', 'z_c0'];
    const hasLoginCookie = loginKeys.some(k => {
      const ck = cookieArray.find(c => c.name === k);
      if (!ck) return false;
      if (ck.value === 'EXPIRED' || ck.value === '') return false;
      if (ck.expirationDate && ck.expirationDate < t) return false;
      return true;
    });
    return !hasLoginCookie;
  }

  // 其他平台：只要有 session_id 且有任意未过期的持久 cookie（非 session cookie），视为已登录
  const hasPersistentValid = cookieArray.some(ck => {
    if (!ck.expirationDate) return false; // session cookie 不算
    if (ck.value === 'EXPIRED' || ck.value === '') return false;
    return ck.expirationDate > t;
  });
  return !hasPersistentValid;
}
