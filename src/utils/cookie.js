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
  if (v.platform_id === 6) return false;
  
  // 检查是否被手动设为失效
  try {
    const forceInvalid = JSON.parse(localStorage.getItem('force_invalid_accounts') || '[]')
    if (forceInvalid.includes(v.id)) return true;
  } catch (e) { /* ignore */ }

  const session_id = v.session_id;
  const required = ['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin'];
  if (session_id) {
    try {
      const { cookie } = JSON.parse(session_id);
      
      // 兼容处理：如果 cookie 不是数组，转换为数组
      let cookieArray = [];
      if (Array.isArray(cookie)) {
        cookieArray = cookie;
      } else if (typeof cookie === 'object' && cookie !== null) {
        // 如果是对象格式，转换为数组
        cookieArray = Object.keys(cookie).map(name => ({
          name: name,
          value: cookie[name],
          expirationDate: Date.now() / 1000 + 86400 * 30 // 默认30天后过期
        }));
      } else {
        // 格式不正确，认为已过期
        return true;
      }
      
      const t = Date.now() / 1000;
      const expired = required.some(k => {
        const ck = cookieArray.find(v => v.name == k);
        if (!ck) return true;
        return ck.expirationDate < t;
      });
      return expired;
    } catch (e) {
      console.error('checkWxSession 解析失败:', e);
      return true; // 解析失败，认为已过期
    }
  }
  return true;
}
