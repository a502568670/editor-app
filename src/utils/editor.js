const AppMsgIdKey = 'appmsgid'

export function getAppMsgId() {
  return localStorage.getItem(AppMsgIdKey)
}

export function setAppMsgId(val) {
  return localStorage.setItem(AppMsgIdKey, val)
}

export function removeAppMsgId() {
  return localStorage.removeItem(AppMsgIdKey)
}