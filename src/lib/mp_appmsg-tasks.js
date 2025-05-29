const { net } = require('electron');
const global = require("./global")
const { netFetch } = require('./request')


const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT

function getid(e) {
  for (var t = "", i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = 0; e > n; n++)t += i.charAt(Math.floor(Math.random() * i.length));
  return t;
}

const getDefaultHeader = () => {
  return {
    "Referer": "https://mp.weixin.qq.com",
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  }
}

const api = {
  operation_seq: token => `https://mp.weixin.qq.com/misc/safeassistant?1=1&token=${token}&lang=zh_CN`,
  timing_publish: (token, hasNotify) => `https://mp.weixin.qq.com/cgi-bin/masssend?t=ajax-response&token=${token}&lang=zh_CN` + (hasNotify ? "&is_release_publish_page=0" : "&is_release_publish_page=1"),
  instant_push: (token, hasNotify) => `https://mp.weixin.qq.com/cgi-bin/masssend?t=ajax-response&token=${token}&lang=zh_CN` + (hasNotify ? '&is_release_publish_page=0' : '&is_release_publish_page=1'),
};
// &is_release_publish_page=1

/// is_release_publish_page 1-没通知 0-有通知
/// isFreePublish=true 不通知 isFreePublish=false 通知
const publishAppmsg = async ({ cookies, token, send_time, hasNotify, isFreePublish, list, reprint_info, appmsgid, appmsg_item_count }) => {
  const opts = {
    method: "POST",
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&random=${Math.random()}&action=get_ticket`
  let res = (await netFetch(api.operation_seq(token), { ...opts, body: formdata }))
  console.log("operation_seq res:", typeof res, res)
  res = JSON.parse(res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      msg: base_resp.err_msg
    }
  }
  const operation_seq = res["operation_seq"]
  console.log("operation_seq=>", operation_seq)
  const req_id = getid(32)
  console.log("req_id=>", req_id)
  const req_time = +new Date()

  let reprint_confirm = 0
  let reprint_info_json_str = ""
  if (reprint_info) {
    reprint_confirm = 1
    reprint_info_json_str = encodeURIComponent(JSON.stringify(reprint_info))
  } else {
    reprint_confirm = 1
    reprint_info_json_str = encodeURIComponent(JSON.stringify({ "item_list": [] }))
  }
  let isMulti = appmsg_item_count > 1 ? 1 : 0
  if (list) {
    list = encodeURIComponent(list)
  }
  // formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&fingerprint=aa8c8d5bea554e6e4c9ea1ed0dbb354e&random=${Math.random()}&ack=&code=&reprint_info=${reprint_info_json_str}&reprint_confirm=${reprint_confirm}&list=${list}&groupid=&sex=0&country=&province=&city=&send_time=${send_time}&type=10&share_page=1&synctxweibo=0&operation_seq=${operation_seq}&req_id=${req_id}&req_time=${req_time}&sync_version=1&isFreePublish=${isFreePublish}&appmsgid=${appmsgid}&isMulti=${isMulti}&direct_send=1&title=123update`
  formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&random=${Math.random()}&ack=&code=&reprint_info=${reprint_info_json_str}&reprint_confirm=${reprint_confirm}&list=${list}&groupid=&sex=0&country=&province=&city=&send_time=${send_time}&type=10&share_page=1&synctxweibo=0&operation_seq=${operation_seq}&req_id=${req_id}&req_time=${req_time}&sync_version=1&isFreePublish=${isFreePublish}&appmsgid=${appmsgid}&isMulti=${isMulti}&direct_send=1`
  verbose_log('api opts:', opts)
  verbose_log('api formdata:', formdata)
  if (send_time > 0) {
    const url = api.timing_publish(token, hasNotify)
    verbose_log('定时api url:', url)
    // return {
    //   success: false,
    //   msg: "人工终止"
    // }
    res = (await netFetch(url, { ...opts, body: formdata }))
  } else {
    verbose_log('api url:', api.instant_push(token, hasNotify))
    // return {
    //   success: false,
    //   msg: "人工终止"
    // }
    // res = (await netFetch(api.instant_push(token, hasNotify), { ...opts, body: formdata }))
  }
  verbose_log('api res:', res)
  res = JSON.parse(res)

  base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      msg: base_resp.err_msg
    }
  }

  return {
    success: true
  }
}

exports.publishAppmsg = publishAppmsg;