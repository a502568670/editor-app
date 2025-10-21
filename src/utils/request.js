import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from "./auth";
import Qs from 'qs'

const sseControllers = new Map()

export async function createSSEConnection(url, data, cb) {
  const token = getToken()

  // 创建 AbortController
  const controller = new AbortController()
  const signal = controller.signal

  // 存储控制器以便后续取消
  const requestId = Date.now() + Math.random().toString(36).substring(2, 11)
  sseControllers.set(requestId, controller)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      signal: signal // 添加信号控制
    })

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()

    while (true) {
      // 检查是否已取消
      if (signal.aborted) {
        console.log("SSE connection aborted by user")
        break
      }

      const { value, done } = await reader.read();
      console.log("SSE recv value:", value)
      console.log("SSE recv done:", done)

      if (done) {
        break;
      }

      // 传递数据给回调函数，同时传递requestId用于后续控制
      cb(value, requestId)
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('SSE request was aborted')
    } else {
      console.error('SSE request failed:', error)
    }
  } finally {
    // 清理控制器
    sseControllers.delete(requestId)
  }

  return requestId // 返回请求ID用于后续控制
}

// 主动断开连接的函数
export function abortSSEConnection(requestId) {
  const controller = sseControllers.get(requestId)
  if (controller) {
    controller.abort()
    sseControllers.delete(requestId)
    console.log(`SSE connection ${requestId} aborted successfully`)
    return true
  }
  console.warn(`No SSE connection found with ID: ${requestId}`)
  return false
}

// 断开所有SSE连接
export function abortAllSSEConnections() {
  sseControllers.forEach((controller, requestId) => {
    controller.abort()
    console.log(`SSE connection ${requestId} aborted`)
  })
  sseControllers.clear()
}


export async function fetchStream(url, method, data) {
  try {
    const response = await axios.request(url, {
      method,
      data,
      responseType: 'blob' // Important: request the response as a Blob
    });
    // return a URL from the Blob
    const meta = JSON.parse(response.headers.get("X-Image-Metadata"))
    const objectUrl = URL.createObjectURL(response.data)
    console.log("meta:", meta)
    console.log("objectUrl:", objectUrl)
    return {
      url: objectUrl,
      meta
    }
  } catch (error) {
    console.error("Error fetching or displaying image:", error);
  }
}

// console.log("window.envVars", window.envVars.backend_url, envVars)
// create an axios instance
const service = axios.create({
  baseURL: window.envVars?.backend_url, //'http://127.0.0.1:8000', // api 的 base_url
  timeout: 500000, // request timeout
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  withCredentials: true // 允许携带cookie
})

//  请求拦截器
service.interceptors.request.use(
  config => {
    const token = getToken()
    config.headers.Authorization = `Bearer ${token}`;
    // 下面的是之前的token用法，找时间去除
    if (config.url.indexOf('storage/add') > -1 || config.url.indexOf('storage/update') > -1) {
      config.headers['Content-Type'] = 'multipart/form-data'
    } else {
      console.log(config)
      if (config.method === 'post' && config.url !== '/platform/addAccount') {
        if (!config.data) {
          config.data = {};
        }
        config.data['token'] = token;
        config.data = Qs.stringify(config.data, { arrayFormat: 'repeat' });
      } else if (config.method === 'get') {
        config.params = {
          token,
          ...config.params
        };
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
    // console.log("res=>", res)
    if (res.code === 501) {
      ElMessageBox.alert(res.errmsg, '错误', {
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
      console.log("=======非5xx的错误属于业务错误，留给具体页面处理")
      return Promise.reject(response)
    } else {
      return response
    }
  }, error => {
    console.log('err', error.response)// for debug
    const code = error.response.status

    if (code === 500) {
      const err = error.response.data.detail
      ElMessageBox.alert(err, '服务器错误', {
        confirmButtonText: '确定',
        type: 'error'
      })
      return Promise.reject('error')
    }
    ElMessage({
      message: '系统错误，请检查网络是否正常',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  })

export default service
