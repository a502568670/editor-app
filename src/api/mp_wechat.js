import request from '@/utils/requestJson'
import { fetchStream } from '@/utils/request'
import { getToken } from "@/utils/auth";

// 获取公众号用户
export function getMpUserInfo(data) {
  return request({
    url: `/mp_wechat/get_mp_user_info`,
    method: 'post',
    data
  })
}

// 获取最近一次的图文消息预览账号
export function getLastPreviewAccounts(data) {
  return request({
    url: `/mp_wechat/get_last_preview_accounts`,
    method: 'post',
    data
  })
}

// 发送图文消息预览请求
export function sendPreview(data) {
  return request({
    url: `/mp_wechat/send_preview`,
    method: 'post',
    data
  })
}

// 获取素材库视频
export function listVideos(data) {
  return request({
    url: `/mp_wechat/video/list`,
    method: 'post',
    data
  })
}
// 改变url
// {
//   "cookies": "",
//   "token": 968734986,
//   "cdn_url": "https://img2.baidu.com/it/u=1212459758,3079048027&fm=253&fmt=auto&app=138&f=JPEG?w=300&h=300"
// }
export function changeImageUrl(data) {
  return request({
    url: `/mp_wechat/cdn_url/change`,
    method: 'post',
    data
  })
}

// 获取发表信息
export function getMasssendInfo(data) {
  return request({
    url: `/mp_wechat/masssend_info`,
    method: 'post',
    data
  })
}

// 微信文章发表检查原创碰撞
export async function stat_appmsg_copyright_stat_events(data, cb) {
  const url = window.envVars.backend_url + '/mp_wechat/appmsg_copyright/events'
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
    console.log("stat_appmsg_copyright_stat_events value:", value)
    console.log("stat_appmsg_copyright_stat_events done:", done)
    if (done) {
      break;
    }
    cb(value)
  }
}


// 获取手机验证QR
export async function getQrcodeMobileValidate(data) {
  return fetchStream(window.envVars.backend_url + '/mp_wechat/create_qr_code', 'post', data)
}

// 查询手机验证码扫码状态
export async function query_appmsg_publish_qrcode_validate_events(data, cb) {
  const url = window.envVars.backend_url + '/mp_wechat/appmsg_publish_qrcode_validate/events'
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
    console.log("query_appmsg_publish_qrcode_validate_events value:", value)
    console.log("query_appmsg_publish_qrcode_validate_events done:", done)
    if (done) {
      break;
    }
    cb(value)
  }
}