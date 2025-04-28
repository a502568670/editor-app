import request from '@/utils/request'

export function listGroup(query) {
  return request({
    url: '/platform/cate',
    method: 'post',
    data: query
  })
}

export function createGroup(data) {
  return request({
    url: '/platform/addCate',
    method: 'post',
    data
  })
}


export function deleteGroup(data) {
  return request({
    url: '/platform/delCate',
    method: 'post',
    data
  })
}
