/*
 *  小程序相关任务
 ***/

const global = require("./global")
const { netFetch, getDefaultHeader } = require('./request')

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT
const baseUrl = global.default.common.MP_WECHAT_BASE_URL

const api = {
  search: (pattern) => `${baseUrl}/cgi-bin/operate_appmsg?sub=${pattern.includes('#小程序') ? "search_weapp_link" : "search_weapp"}&t=ajax-response`,
}

const searchMiniApp = async ({ cookies, token, pattern }) => {
  const opts = {
    method: "POST",
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.search(pattern)
  const body = {
    "fingerprint": "2ce81ea6e54aadf1c8288589941bfb30",
    "token": token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1",
    [pattern.includes('#小程序') ? "link" : "key"]: pattern
  }
  verbose_log("body=>", body)
  const formdata = new URLSearchParams(Object.entries(body)).toString();
  verbose_log('api url:', url)
  verbose_log('api opts:', opts)
  verbose_log('api formdata:', formdata)
  let res = (await netFetch(url, { ...opts, body: formdata }))
  res = JSON.parse(res)
  verbose_log('api res:', res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      err_msg: base_resp.err_msg
    }
  }
  const ret = pattern.includes('#小程序') ? res : res.items.find((_, idx) => idx === 0)
  const weapp = ret.weapp
  const weapp_path = ret.weapp_path || ret.weapp.main_page
  return {
    success: true,
    weapp,
    weapp_path,
  }
}

exports.searchMiniApp = searchMiniApp;