import request from '@/utils/requestJson'

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