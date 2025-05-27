import request from '@/utils/requestJson'

export function uploadImage(data) {
  return request({
    url: '/upload-image',
    method: 'post',
    data
  })
}