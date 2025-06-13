import request from '@/utils/request'

export function listAccount(data) {
  return request({
    url: '/platform/accountList',
    method: 'post',
    data
  })
}
export function removeAccount(data) {
  return request({
    url: '/platform/removeAccount',
    method: 'post',
    data
  })
}


export function createAccount(data) {
  return request({
    url: '/platform/addAccount',
    method: 'post',
    data
  })
}

export function removeAccountSession(data) {
  return request({
    url: '/platform/removeAccountSession',
    method: 'post',
    data
  })
}

export function refreshAccountSession(data) {
  return request({
    url: '/platform/refreshAccountSession',
    method: 'post',
    data
  })
}

export function readAccount(data) {
  return request({
    url: '/platform/infoAccount',
    method: 'get',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/platform/editAccount',
    method: 'post',
    data
  })
}

export function deleteAccount(data) {
  return request({
    url: '/platform/delAccount',
    method: 'post',
    data
  })
}

export function setCate(data) {
  return request({
    url: '/platform/setCate',
    method: 'post',
    data
  })
}

export function setOperator(data) {
  return request({
    url: '/platform/setOperator',
    method: 'post',
    data
  })
}
