
import request from '@/utils/requestJson'

export function saveAppMsg(data) {
  return request({
    url: '/appmsg/save',
    method: 'post',
    data
  })
}