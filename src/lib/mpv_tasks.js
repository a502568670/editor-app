/*
 *  视频号相关任务
 ***/


const global = require("./global")
const { netFetch, getDefaultHeader } = require('./request')

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT
const baseUrl = global.default.common.MP_WECHAT_BASE_URL

const api = {
  search_videosnap: () => `${baseUrl}/cgi-bin/videosnap`,
}

const searchMpvAccount = async ({ cookies, token, pattern, count }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.search_videosnap()
  verbose_log('api url:', url)
  const params = {
    "action": "search",
    "scene": '1',
    'buffer': '',
    "count": count,
    "query": pattern,
    "fingerprint": "2ce81ea6e54aadf1c8288589941bfb30",
    "token": token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1"
  }

  verbose_log('api params:', params)
  let search_params = new URLSearchParams(params)
  url = `${url}?${search_params}`
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
  const mpvs = res.acct_list || []
  return {
    success: true,
    mpvs,
  }
}

const searchMpvVideo = async ({ cookies, token, username, pattern, count }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.search_videosnap()
  verbose_log('api url:', url)
  const params = {
    "action": "get_feed_list",
    "username": username,
    'buffer': '',
    "count": count,
    "scene": "0",
    "fingerprint": "2ce81ea6e54aadf1c8288589941bfb30",
    "token": token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1"
  }
  if (pattern) {
    params.action = "search_feeds"
    params.query = pattern
  }

  verbose_log('api params:', params)
  let search_params = new URLSearchParams(params)
  url = `${url}?${search_params}`
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
  const mpv_videos = res.list || []
  
  return {
    success: true,
    mpv_videos,
  }
}

const searchMpvLive = async ({ cookies, token, username, pattern, count }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.search_videosnap()
  verbose_log('api url:', url)
  const params = {
    "action": "get_live_list",
    "username": username,
    'buffer': '',
    "count": count,
    "scene": "0",
    "fingerprint": "2ce81ea6e54aadf1c8288589941bfb30",
    "token": token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1"
  }
  if (pattern) {
    params.action = "search_lives"
    params.query = pattern
  }

  verbose_log('api params:', params)
  let search_params = new URLSearchParams(params)
  url = `${url}?${search_params}`
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
  const mpv_lives = res.list || []
  // console.log("mpv_lives=>", mpv_lives)
  return {
    success: true,
    mpv_lives,
  }
}

exports.searchMpvAccount = searchMpvAccount
exports.searchMpvVideo = searchMpvVideo
exports.searchMpvLive = searchMpvLive