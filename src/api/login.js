import request from '@/utils/request'

export function loginByUsername(username, password) {
  const data = {
    mobile:username,
    password
  }
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function loginByUsernameSimple(username, password) {
  const data = {
    username,
    password
  }
  return request({
    url: '/login/login',
    method: 'post',
    data
  })
} 


export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'post',
    data:{}
  })
}

export function send_sms(data) {
  return request({
    url: '/login/send_sms',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/login/register',
    method: 'post',
    data
  })
}

export function registerSimple(data) {
  return request({
    url: '/login/register',
    method: 'post',
    data
  })
}

export function modifypassword(data) {
  return request({
    url: '/login/modifypassword',
    method: 'post',
    data
  })
}
