import request from '@/utils/request'
import qs from 'qs' // 引入 qs 库用于序列化 form 数据

export function listPlatform(query) {
  return request({
    url: '/platform/lists',
    method: 'post',
    data: query
  })
}

export function createPlatform(data) {
  return request({
    url: '/platform/create',
    method: 'post',
    data: data
  })
}

export function updatePlatform(data) {
  return request({
    url: '/platform/update',
    method: 'post',
    data: data
  })
}

export function deletePlatform(data) {
  return request({
    url: '/platform/delete',
    method: 'post',
    data: data
  })
}

// export function deletePlatform(data) {
//   return request({
//     url: '/platform/delete',
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded' // 设置请求头
//     },
//     transformRequest: [function (data) {
//       return qs.stringify(data) // 将数据序列化为 form 格式
//     }],
//     data: data
//   })
// }
