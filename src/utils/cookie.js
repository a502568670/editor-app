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

export function checkWxSession(session_id = '') {
  const required = ['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin'];
  if (session_id) {
    const { cookie } = JSON.parse(session_id);
    const t = Date.now() / 1000;
    const expired = required.some(k => {
      const ck = cookie.find(v => v.name == k);
      if (!ck) return true;
      return ck.expirationDate < t;
    });
    return expired;
  }
  return true;
}
