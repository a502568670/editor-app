import request from '@/utils/requestJson'
import { getToken } from "@/utils/auth";
// {
//   wechat_id: 123
//   msg_id: 0 | 123
//   cookies: "",
//   token: 2033,
//   material_list: [{
//     content_noencode: "",
//     // cdn_url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/4WT2I2qqeFAibhrnd1BP6uhtX6Y395tHhMxfXaJrWW5w8JpQibmicJCqfdGL1uWQErUlUVyScV2bs59oj9rhicnTaQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=13&tp=wxpic",
//     cdn_url: "",
//     desc: "",
//     title: "",
//     author: "",
//     copyright_type: 0
//   }]
// }

export function saveArticleDraft(data) {
  return request({
    url: '/mp_msg/save',
    method: 'post',
    data
  })
}

export function send_to_other_accounts(data) {
  return request({
    url: '/mp_msg/send_to_other_accounts',
    method: 'post',
    data
  })
}

export async function send_to_other_accounts_events(data, cb) {
  const url = window.envVars.backend_url + '/mp_msg/send_to_other_accounts/events'
  const token = getToken()
  // 'application/json'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data)
  })
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    cb(value)
  }
}

export function listArticlesByAppMsg(appmsgid) {
  return request({
    url: `/mp_msg/${appmsgid}/list`
  })
}

export function listArticleGroups(wechat_id) {
  return request({
    url: `/mp_msg/${wechat_id}/groups`
  })
}

export function swapArticles(msg_id1, msg_id2) {
  return request({
    url: `/mp_msg/swap`,
    method: 'post',
    data: {
      msg_id1,
      msg_id2
    }
  })
}

export function deleteArticleDraft(data) {
  return request({
    url: `/mp_msg/delete`,
    method: 'post',
    data
  })
}

export function genArticleDraftPreviewUrl(data) {
  return request({
    url: `/mp_msg/gen_preview_url`,
    method: 'post',
    data
  })
}

// http://mp.weixin.qq.com/s?__biz=Mzk0NzI2NTI3Ng==&tempkey=MTMyMl9oRC92Vit1NmRQdUZsRDFPREVDSldoYkF3RXJGeUh3M2lwQk9EWlFRYkFnMGxwVGFMVkIxRGY3YnRBODdBczYxY19GV1VJRXFhLWlxTGtPbHBBNGRZMC1mRWdsLVBLYk5JWXd6WWl1QnJsQXFRbVptQ2hyZjVzSXBOTGVHeUR6T3YxOERvNUFtdWtwTFoxNEEzbEduVGg0ejlUTkhGcTNmWC12Q053fn4%3D&chksm=4378ca1a740f430ce42b4b1675a3644c192ce468ec7b61c5ddfb4332f15329121231a91ac238#rd

export function previewArticleDraft(url) {
  return request({
    url: `/mp_msg/proxy_preview_url?url=${url}`,
  })
}

export function previewQRCode(url) {
  return request({
    url: `/mp_msg/preview_qr_code?url=${url}`,
  })
}


// 获取最近一次的图文消息预览账号
export function getLastPreviewAccounts(data) {
  return request({
    url: `/mp_msg/get_last_preview_accounts`,
    method: 'post',
    data
  })
}

// 发送图文消息预览请求
export function sendPreview(data) {
  return request({
    url: `/mp_msg/send_preview`,
    method: 'post',
    data
  })
}