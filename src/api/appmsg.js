
import request from '@/utils/requestJson'
import { getToken } from "@/utils/auth";

export function groupAppMsgs(data) {
  return request({
    url: '/appmsg/group',
    method: 'post',
    data
  })
}

export function listAppMsgs(data) {
  return request({
    url: '/appmsg/list',
    method: 'post',
    data
  })
}

export function saveAppMsg(data) {
  return request({
    url: '/appmsg/save',
    method: 'post',
    data
  })
}

export function deleteAppMsg(data) {
  return request({
    url: '/appmsg/delete',
    method: 'post',
    data
  })
}

export async function send_to_other_accounts_events(data, cb) {
  const url = window.envVars.backend_url + '/appmsg/send_to_other_accounts/events'
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
