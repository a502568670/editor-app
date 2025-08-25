/*
 *  公众号相关任务
 ***/

const global = require("./global")
const { netFetch, getDefaultHeader } = require('./request')

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT
const baseUrl = global.default.common.MP_WECHAT_BASE_URL

const api = {
  search_biz: () => `${baseUrl}/cgi-bin/searchbiz?t=ajax-response`,
}

const searchBiz = async ({ cookies, token, pattern }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.search_biz()
  verbose_log('api url:', url)
  const params = {
    "action": "search_biz",
    "scene": '1',
    "begin": 0,
    "count": 10,
    "query": pattern,
    "fingerprint": "2ce81ea6e54aadf1c8288589941bfb30",
    "token": token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1"
  }

  verbose_log('api params:', params)
  let search_params = new URLSearchParams(params)
  url = `${url}&${search_params}`
  verbose_log('api url:', url)
  verbose_log('api opts:', opts)
  verbose_log('api params:', params)
  let res = (await netFetch(url, { ...opts }))
  res = JSON.parse(res)
  verbose_log('api res:', res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      err_msg: base_resp.err_msg
    }
  }
  return {
    success: true,
    mps: res.list || [],
  }
}
exports.searchBiz = searchBiz