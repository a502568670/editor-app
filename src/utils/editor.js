const AppMsgIdKey = 'appmsgid'
const SelectedAccountIdKey = "selected_account_id"

export function getAppMsgId() {
  return localStorage.getItem(AppMsgIdKey)
}

export function setAppMsgId(val) {
  return localStorage.setItem(AppMsgIdKey, val)
}

export function removeAppMsgId() {
  return localStorage.removeItem(AppMsgIdKey)
}

export function getSelectedAccountId() {
  return localStorage.getItem(SelectedAccountIdKey)
}

export function setSelectedAccountId(val) {
  return localStorage.setItem(SelectedAccountIdKey, val)
}