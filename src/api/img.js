import request from '@/utils/requestJson'
import axios from 'axios'
import Qs from 'qs'

export function uploadImage(data={cookies:'',token:0,base64_image:'',filename:'',content_type:''}) {
  return request({
    url: '/upload-image',
    method: 'post',
    data
  })
}

// 直接调用微信的裁剪接口
export function cropImage(data={cookies:'',token:0,imgurl:'',size_count:2,crop_info:[]}) {
  const { cookies, token, imgurl, size_count, crop_info } = data
  
  // 构建表单数据
  const formData = {
    imgurl: imgurl,
    size_count: size_count,
    token: token,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1
  }
  console.log('formData',formData)
  // 添加裁剪信息
  crop_info.forEach((crop, index) => {
    formData[`size${index}_x1`] = crop.size_x1
    formData[`size${index}_y1`] = crop.size_y1
    formData[`size${index}_x2`] = crop.size_x2
    formData[`size${index}_y2`] = crop.size_y2
    formData[`format${index}`] = crop.format
  })
  
  console.log('裁剪请求参数:', formData)
  console.log('裁剪请求表单数据:', Qs.stringify(formData))
  
  // 定义请求头
  const requestHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Custom-Cookie': cookies,  // 使用自定义头传递 Cookie，主进程会将其改为 Cookie
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'referer': 'https://mp.weixin.qq.com',
    'token': formData.token
  }
  
  console.log('准备发送的请求头:', requestHeaders)
  
  // 直接调用微信接口
  return axios({
    url: 'https://mp.weixin.qq.com/cgi-bin/cropimage?action=crop_multi',
    method: 'post',
    headers: requestHeaders,
    data: Qs.stringify(formData),
    withCredentials: true
  }).then(response => {

    return response
  }).catch(error => {
    console.error('裁剪接口错误:', error)
    console.error('错误响应:', error.response)
    throw error
  })
}