const global = require("./global")
const { netFetch, getDefaultHeader } = require('./request')

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const baseUrl = global.default.common.MP_WECHAT_BASE_URL

const api = {
  // type = 2-图片,3-音频
  list_files: (tk, type, group_id, begin, count) => `${baseUrl}/cgi-bin/filepage?type=${type}&begin=${begin}&count=${count}&token=${tk}&lang=zh_CN&f=json` + (group_id ? `&group_id=${group_id}&ajax=1` : ''),
  list_videos: (tk, query, begin, count) => `${baseUrl}/cgi-bin/appmsg?begin=${begin}&count=${count}&action=list_video&type=15&token=${tk}&lang=zh_CN&f=json` + (query ? `&query=${query}` : ''),
}

export const listFiles = async ({ cookies, token, type, group_id, begin, count }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.list_files(token, type, group_id, begin, count)
  verbose_log('api url:', url)
  verbose_log('api opts:', opts)
  let res = (await netFetch(url, { ...opts }))
  // verbose_log("list_in_draftbox res:", typeof res, res)
  res = JSON.parse(res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      err_msg: base_resp.err_msg
    }
  }

  return {
    success: true,
    page_info: res.page_info,
  }
}

export const listVideos = async ({ cookies, token, query, begin, count }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.list_videos(token, query, begin, count)
  verbose_log('api url:', url)
  verbose_log('api opts:', opts)
  let res = (await netFetch(url, { ...opts }))
  // verbose_log("list_in_draftbox res:", typeof res, res)
  res = JSON.parse(res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      err_msg: base_resp.err_msg
    }
  }

  return {
    success: true,
    page_info: res.app_msg_info,
  }
}