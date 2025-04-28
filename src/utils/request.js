import axios from 'axios'
import { ElMessage,ElMessageBox } from 'element-plus'
import {getToken} from "./auth";
import Qs from 'qs'

// create an axios instance
const service = axios.create({
  baseURL: 'http://127.0.0.1:8000', // api 的 base_url
  timeout: 500000, // request timeout
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  withCredentials: true // 允许携带cookie
})

//  请求拦截器
service.interceptors.request.use(
  config => {
    if (config.url.indexOf('storage/add') > -1 || config.url.indexOf('storage/update') > -1) {
      config.headers['Content-Type'] = 'multipart/form-data'
    } else {
      if (config.method === 'post') {
        if (!config.data) {
          config.data = {}
        }
        config.data['token'] = getToken()
        config.data = Qs.stringify(config.data, { arrayFormat: 'repeat' })

      } else if (config.method === 'get') {
        config.params = {
          token:getToken(),
          ...config.params
        }
      }
    }
    return config
  },
  error => {
    // Do something with request error 处理请求错误
    console.log(error) // for debug
    Promise.reject(error)
  }
)

//  响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 501) {
      MessageBox.alert(res.errmsg, '错误', {
        confirmButtonText: '确定',
        type: 'error'
      }).then(() => {
        store.dispatch('FedLogOut').then(() => {
          location.reload()
        })
      })
      return Promise.reject('error')
    } else if (res.code === 502) {
      ElMessageBox.alert('系统内部错误，请联系管理员维护', '错误', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    } else if (res.code === 503) {
      ElMessageBox.alert('请求业务目前未支持', '警告', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    } else if (res.code === 504) {
      ElMessageBox.alert('更新数据已经失效，请刷新页面重新操作', '警告', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    } else if (res.code === 505) {
      ElMessageBox.alert('更新失败，请再尝试一次', '警告', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    } else if (res.code === 506) {
      ElMessageBox.alert('没有操作权限，请联系管理员授权', '错误', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    } else if (res.code !== 1) {
      // 非5xx的错误属于业务错误，留给具体页面处理
      return Promise.reject(response)
    } else {
      return response
    }
  }, error => {
    console.log('err' + error)// for debug
    ElMessage({
      message: '系统错误，请检查网络是否正常',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  })

export default service
