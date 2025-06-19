export const serializeCookie = (arr) => {
  const items = []
  arr.forEach((v) => {
    // items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
    items.push(`${encodeURIComponent(v["name"])}=${v["value"]}`)
  });
  // console.log("items=>", items)
  return items.join(";")
}

export function checkWxSession(session_id=''){
  var required=['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin']
  try {
    var {cookie}=JSON.parse(session_id)
    var t=Date.now()/1000
    var expired=required.some(k=>{
      var ck=cookie.find(v=>v.name==k)
      if(!ck)return true;
      return ck.expirationDate<t;
    })
    return expired;
  } catch (error) {
    console.error(error);
  }
  return true;
}
