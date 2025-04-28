import request from '@/utils/request'

export function listOfficialAccount(query) {
  return request({
    url: '/official_account/lists',
    method: 'post',
    data: query
  })
}

export function createOfficialAccount(data) {
  return request({
    url: '/official_account/create',
    method: 'post',
    data: data
  })
}

export function updateOfficialAccount(data) {
  return request({
    url: '/official_account/update',
    method: 'post',
    data: data
  })
}

export function deleteOfficialAccount(data) {
  return request({
    url: '/official_account/delete',
    method: 'post',
    data: data
  })
}
