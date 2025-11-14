import request from '@/utils/requestJson'

const PREFIX = '/api/v1'

export function listSensitiveWordGroups(params) {
  return request({
    url: `${PREFIX}/sensitive_words/groups`,
    method: 'get',
    params
  })
}

export function createSensitiveWordGroup(data) {
  return request({
    url: `${PREFIX}/sensitive_words/groups`,
    method: 'post',
    data
  })
}

export function updateSensitiveWordGroup(groupId, data) {
  return request({
    url: `${PREFIX}/sensitive_words/groups/${groupId}`,
    method: 'put',
    data
  })
}

export function deleteSensitiveWordGroup(groupId) {
  return request({
    url: `${PREFIX}/sensitive_words/groups/${groupId}`,
    method: 'delete'
  })
}

export function checkSensitiveWords(data) {
  return request({
    url: `${PREFIX}/check_sensitive_words`,
    method: 'post',
    data
  })
}

