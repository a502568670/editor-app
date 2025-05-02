import request from '@/utils/requestJson'

export function uploadImage(data) {
  return request({
    url: '/upload_image',
    method: 'post',
    data
  })
}