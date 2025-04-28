import request from '@/utils/request'


// 获取配置信息
export function newGetconfig(data) {
  return request({
    url: 'login/config',
    method: 'post',
    data
  })
}


