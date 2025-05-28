import request from '@/utils/requestJson'
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