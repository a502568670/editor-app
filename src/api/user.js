import request from '@/utils/request'

export function listUser(query) {
  return request({
    url: '/user/accountList',
    method: 'post',
    data: query
  })
}

export function createUser(data) {
  return request({
    url: '/user/addAccount',
    method: 'post',
    data
  })
}


export function deleteUser(data) {
  return request({
    url: '/user/delAccount',
    method: 'post',
    data
  })
}
