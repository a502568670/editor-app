import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from "./auth";
import { wxretmsg } from "./constants";
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
    // 检查响应数据中的 ret / err_msg，并统一返回给调用方，让页面统一处理提示，避免出现两个提示
    const res = response.data
    console.log("response data:", res)

    let ret = null
    let err_msg = null

    // 情况1：嵌套结构（例如 appmsg/save 返回的 base_resp）
    if (res && res.data && res.data.data && res.data.data.base_resp) {
      ret = res.data.data.base_resp.ret
      err_msg = res.data.data.base_resp.err_msg
    // 情况2：直接在顶层返回 ret / err_msg
    } else if (res && (res.ret || res.err_msg)) {
      ret = res.ret
      err_msg = res.err_msg
    }

    if (ret != null || err_msg) {
      const retCode = ret != null ? String(ret) : undefined
      const localMsg = retCode && wxretmsg[retCode]
      const message = localMsg || err_msg || res?.message || '操作失败'

      console.log('wx error handled by requestJson:', {
        ret,
        err_msg,
        usedMessage: message,
        fromLocal: !!localMsg,
      })

      // 不在这里弹框 / 顶部提示，交由上层统一处理（例如 EditorTab.handleActionErr），否则会出现两个提示
      return Promise.reject({
        ret,
        err_msg,
        message,
        localMessage: !!localMsg,
        raw: res,
      })
    }

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
