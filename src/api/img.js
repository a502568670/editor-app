import request from '@/utils/requestJson'

export function uploadImage(data={cookies:'',token:0,base64_image:'',filename:'',content_type:''}) {
  return request({
    url: '/upload-image',
    method: 'post',
    data
  })
}