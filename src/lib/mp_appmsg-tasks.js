const { net } = require('electron');
const global = require("./global")
const { netFetch, getDefaultHeader } = require('./request')
// import JSON5 from "json5"


const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT
const baseUrl = global.default.common.MP_WECHAT_BASE_URL

function getid(e) {
  for (var t = "", i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = 0; e > n; n++)t += i.charAt(Math.floor(Math.random() * i.length));
  return t;
}

// const getDefaultHeader = () => {
//   return {
//     "Referer": "https://mp.weixin.qq.com",
//     'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
//   }
// }

const api = {
  // 发布
  operation_seq: tk => `${baseUrl}/misc/safeassistant?1=1&token=${tk}&lang=zh_CN`,

  // 删除
  delete_appmsg: () => `${baseUrl}/cgi-bin/operate_appmsg?sub=del&t=ajax-response`,

  // 有通知又是定时，必须加&action=time_send， 其他可以不加
  timing_publish: (tk, hasNotify) => `${baseUrl}/cgi-bin/masssend?t=ajax-response&token=${tk}&lang=zh_CN` + (hasNotify ? "&action=time_send" : "&is_release_publish_page=1"),
  instant_push: (tk, hasNotify) => `${baseUrl}/cgi-bin/masssend?t=ajax-response&token=${tk}&lang=zh_CN` + (hasNotify ? '&is_release_publish_page=0' : '&is_release_publish_page=1'),

  //数据
  list_in_draftbox: (tk, query, begin, count) => `${baseUrl}/cgi-bin/appmsg?begin=${begin}&count=${count}&type=77&action=list_card&token=${tk}&lang=zh_CN&f=json&query=${query}`,
  get_in_draftbox: (tk, appmsgid) => `${baseUrl}/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid=${appmsgid}&isMul=1&replaceScene=0&isSend=0&isFreePublish=0&token=${tk}&lang=zh_CN&timestamp=${+new Date()}&f=json`,
  list_in_publish: (tk, query, begin, count, fakeid) => `${baseUrl}/cgi-bin/appmsgpublish?sub=list&begin=${begin}&count=${count}&query=${query}&token=${tk}&lang=zh_CN&f=json${fakeid ? `&fakeid=${fakeid}` : ''}`,
  search_in_publish: (tk, query, begin, count, fakeid) => `${baseUrl}/cgi-bin/appmsgpublish?sub=search&begin=${begin}&count=${count}&query=${query}&token=${tk}&lang=zh_CN&f=json${fakeid ? `&fakeid=${fakeid}` : ''}`,

  // 获取分组通知地区列表
  get_regions: (id = 0) => `${baseUrl}/cgi-bin/getregions?t=setting/ajax-getregions&id=${id}&lang=zh_CN&f=json&ajax=1`,

  // 获取小店返佣商品
  get_shop_commodity: (tk) => `${baseUrl}/shop-faas/mmeckolnode/mp/listTalentSelectionSpuItems?token=${tk}&lang=zh_CN`
  ,
  // 获取 windowproduct (product_encrypt_key)
  get_windowproduct: () => `${baseUrl}/cgi-bin/windowproduct?action=get_windowproduct`
};
// &is_release_publish_page=1

/// is_release_publish_page 1-没通知 0-有通知
/// isFreePublish=true 不通知 isFreePublish=false 通知
const publishAppmsg = async ({ cookies, token, send_time, hasNotify, isFreePublish, list, groupstr = '', reprint_info, appmsgid, appmsg_item_count, operation_seq_val, code }) => {
  const opts = {
    method: "POST",
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let formdata, res, operation_seq

  if (!operation_seq_val) {
    formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&random=${Math.random()}&action=get_ticket` + groupstr
    verbose_log("operation_seq formdata:", formdata)
    res = (await netFetch(api.operation_seq(token), { ...opts, body: formdata }))
    verbose_log("operation_seq res:", typeof res, res)
    res = JSON.parse(res)
    let base_resp = res.base_resp
    if (base_resp.ret !== 0) {
      return {
        success: false,
        msg: base_resp.err_msg
      }
    }
    operation_seq = res["operation_seq"]
  } else {
    operation_seq = operation_seq_val
  }
  verbose_log("operation_seq=>", operation_seq)
  const req_id = getid(32)
  verbose_log("req_id=>", req_id)
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
  formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&random=${Math.random()}&ack=&reprint_info=${reprint_info_json_str}&reprint_confirm=${reprint_confirm}&list=${list}${groupstr}&send_time=${send_time}&type=10&share_page=1&synctxweibo=0&operation_seq=${operation_seq}&req_id=${req_id}&req_time=${req_time}&sync_version=1&isFreePublish=${isFreePublish}&appmsgid=${appmsgid}&isMulti=${isMulti}&direct_send=1`
  if (code) {
    formdata += `&isNeedCode=true&code=${code}`
  }
  // formdata = `token=${token}&lang=zh_CN&f=json&ajax=1&random=${Math.random()}&ack=&reprint_info=${reprint_info_json_str}&reprint_confirm=${reprint_confirm}&list=${list}${groupstr}&send_time=${send_time}&type=10&share_page=1&synctxweibo=0&req_id=${req_id}&req_time=${req_time}&sync_version=1&isFreePublish=${isFreePublish}&appmsgid=${appmsgid}&isMulti=${isMulti}&direct_send=1`
  verbose_log('api opts:', opts)
  verbose_log('api formdata:', formdata)
  let url;
  if (send_time > 0) {
    url = api.timing_publish(token, hasNotify)
    verbose_log('定时发表 api url:', url)
    // return {
    //   success: false,
    //   msg: "人工终止"
    // }
    // res = (await netFetch(url, { ...opts, body: formdata }))
  } else {
    url = api.instant_push(token, hasNotify)
    verbose_log('立即发表 api url:', url)
    // return {
    //   success: false,
    //   msg: "人工终止"
    // }
  }
  // return {
  //     success: false,
  //     msg: "debug",
  //     code: 11,
  //   }
  res = (await netFetch(url, { ...opts, body: formdata }))
  verbose_log('api res:', typeof res, res)
  if (typeof res === 'string') {
    res = JSON.parse(res)
  }

  base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      msg: base_resp.err_msg,
      code: base_resp.ret,
    }
  }

  return {
    success: true
  }
}

const deleteAppmsg = async ({ cookies, token, appmsgids }) => {
  const opts = {
    method: "POST",
    headers: { ...getDefaultHeader(), cookie: cookies }
  };

  const fingerprint = "190e3b4bc1fc444f11c88f37a73536e6"
  const urls = appmsgids.map(_ => api.delete_appmsg())
  const formdatas = appmsgids.map(appmsgid => `token=${token}&lang=zh_CN&f=json&ajax=1&fingerprint=${fingerprint}&AppMsgId=${appmsgid}`)
  verbose_log("urls=>", urls)
  verbose_log("formdatas=>", formdatas)
  const netFetchs = urls.map((url, idx) => netFetch(url, { ...opts, body: formdatas[idx] }))
  console.log('123123123',netFetchs);
  const data = await Promise.allSettled(netFetchs);
  const items = data.map((ret, idx) => {
    // verbose_log("ret:", ret)
    if (ret.status === "fulfilled") {
      const { base_resp, appMsgId } = JSON.parse(ret.value)
      if (base_resp.ret === 0) {
        return { success: true, appmsgid: appMsgId }
      } else {
        return { success: false, reason: ret.err_msg }
      }
    } else {
      return { success: false, reason: ret.reason }
    }
  })
  verbose_log("items=>", items)

  return {
    success: true,
    items: items,
  }
}

const listAppmsgsInDraftBox = async ({ cookies, token, query, begin, count = 10 }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.list_in_draftbox(token, query, begin, count)
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
    items: res.app_msg_info.item,
    file_cnt: res.app_msg_info.file_cnt,
  }
}

const getAppmsgInDraftBox = async ({ cookies, token, appmsgid }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.get_in_draftbox(token, appmsgid)
  verbose_log('api url:', url)
  verbose_log('api opts:', opts)
  let res = (await netFetch(url, { ...opts }))
  verbose_log("get_in_draftbox res:", typeof res, res)
  res = JSON.parse(res)
  let base_resp = res.base_resp
  if (base_resp.ret !== 0) {
    return {
      success: false,
      err_msg: base_resp.err_msg
    }
  }

  const appmsg_info = JSON.parse(res.app_msg_info)
  // verbose_log("------------appmsg_info begin---------------")
  // verbose_log(appmsg_info)
  // verbose_log("------------appmsg_info end---------------")

  return {
    success: true,
    appmsg_info
  }
}

const listAppmsgsInPublishForQuerys = async ({ cookies, token, querys, begin, count = 10, fakeid }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  const urls = querys.map(query => api.list_in_publish(token, encodeURIComponent(query), begin, count, fakeid))
  verbose_log("urls=>", urls)
  const netFetchs = urls.map(url => netFetch(url, opts))

  const data = await Promise.allSettled(netFetchs);
  const items = data.map((ret, idx) => {
    // verbose_log("ret:", ret)
    if (ret.status === "fulfilled") {
      const { base_resp, publish_page } = JSON.parse(ret.value)
      if (base_resp.ret === 0) {
        const publish_page_o = JSON.parse(publish_page)
        return { success: true, value: publish_page_o }
      } else {
        return { success: false, reason: ret.err_msg }
      }

    } else {
      return { success: false, reason: ret.reason }
    }
  })

  return {
    success: true,
    items: items,
  }
}

const searchAppmsgsInPublishForQuerys = async ({ cookies, token, querys, begin, count = 10, fakeid }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  const urls = querys.map(query => api.search_in_publish(token, encodeURIComponent(query), begin, count, fakeid))
  verbose_log("urls=>", urls)
  const netFetchs = urls.map(url => netFetch(url, opts))

  const data = await Promise.allSettled(netFetchs);
  const items = data.map((ret, idx) => {
    verbose_log("ret:", ret)
    const query = querys[idx]

    if (ret.status === "fulfilled") {
      const { base_resp, publish_page } = JSON.parse(ret.value)
      if (base_resp.ret === 0) {
        const publish_page_o = JSON.parse(publish_page)
        return { success: true, query, value: publish_page_o }
      } else {
        return { success: false, query, reason: ret.err_msg }
      }

    } else {
      return { success: false, query, reason: ret.reason }
    }
  })

  return {
    success: true,
    items: items,
  }
}

const getRegions = async ({ cookies, id = 0 }) => {
  const opts = {
    headers: { ...getDefaultHeader(), cookie: cookies }
  };
  let url = api.get_regions(id)
  verbose_log('get_regions api url:', url)
  verbose_log('get_regions api opts:', opts)
  let res = (await netFetch(url, { ...opts }))
  verbose_log("get_regions res:", typeof res, res)
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
    num: res.num,
    data: res.data,
    claim_source_extra_country: res.claim_source_extra_country || []
  }
}

const getShopCommodity = async (data) => {
  const listCondition = JSON.parse(data.listCondition);
  const opts = {
    method: 'POST',
    headers: {
      ...getDefaultHeader(),
      cookie: data.cookie,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ listCondition })
  };
  let url = api.get_shop_commodity(data.token);
  verbose_log('api url:', url);
  verbose_log('api opts:', opts);
  let res = await netFetch(url, { ...opts });
  console.log('res',res)
  res = JSON.parse(res);
  if (res.respStatusCode) {
    return {
      success: false,
      err_msg: res.msg
    };
  }
  if (res.code === 0) {
    return {
      success: true,
      talentSpuItems: res.talentSpuItems ? res.talentSpuItems : [],
      pageContextResp: res.pageContextResp ? res.pageContextResp : {}
    };
  } else {
    return {
      success: false,
      err_msg: '请求商品失败，未知错误'
    };
  }
}

const getWindowProduct = async ({ cookies, token, product_id, fingerprint = '' }) => {
  const opts = {
    method: 'POST',
    headers: {
      ...getDefaultHeader(),
      cookie: cookies,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  // 构造 data 字段，保持与 Python 示例一致
  const dataField = `{"base_req":{"action":"GetCpsProductEncryptKey"},"ext_info":"{\\"product_id\\":[${product_id}],\\"cps_id\\":[]}"}`;
  const formdata = `data=${encodeURIComponent(dataField)}&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;

  let url = api.get_windowproduct();
  verbose_log('getWindowProduct api url:', url);
  verbose_log('getWindowProduct opts:', opts);
  verbose_log('getWindowProduct formdata:', formdata);

  let res = await netFetch(url, { ...opts, body: formdata });
  try {
    return JSON.parse(res);
  } catch (e) {
    verbose_error('getWindowProduct parse error', e, res);
    return res;
  }
}

exports.publishAppmsg = publishAppmsg;
exports.deleteAppmsg = deleteAppmsg;
exports.listAppmsgsInDraftBox = listAppmsgsInDraftBox;
exports.getAppmsgInDraftBox = getAppmsgInDraftBox;
exports.listAppmsgsInPublishForQuerys = listAppmsgsInPublishForQuerys
exports.searchAppmsgsInPublishForQuerys = searchAppmsgsInPublishForQuerys
exports.getRegions = getRegions
exports.getShopCommodity = getShopCommodity
exports.getWindowProduct = getWindowProduct
