import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from "./auth";
import Qs from 'qs'

// create an axios instance
const service = axios.create({
  baseURL: window.envVars.backend_url, //'http://127.0.0.1:8000', // api 的 base_url
  timeout: 500000, // request timeout
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // 允许携带cookie
})

//  请求拦截器
service.interceptors.request.use(
  config => {
    const token = getToken()
    config.headers.Authorization =  `Bearer ${token}`;
    // if (config.method === 'post') {
      
    // }
    // else if (config.method === 'get') {
    //   config.params = {
    //     token: getToken(),
    //     ...config.params
    //   }
    // }
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
    return response
  }, error => {
    console.log('err:' + error)// for debug
    console.log(error.code, error.response)
    const http_code = error.response.status
    const message = error.response.data.detail
    console.warn("http_code=>", http_code)
    console.warn("message=>", message)
    if (http_code >= 400 && http_code < 499) {
      ElMessageBox.alert(message, '参数错误', {
        confirmButtonText: '确定',
        type: 'error'
      })

    } else if (http_code >= 500 && http_code < 599) {
      ElMessageBox.alert(message, '服务器内部错误', {
        confirmButtonText: '确定',
        type: 'error'
      })
    } else {
      ElMessage({
        message: '系统错误，请检查网络是否正常',
        type: 'error',
        duration: 3 * 1000
      })
    }

    return Promise.reject(error)
  })

export default service
