import axios from 'axios'
// import { ElMessage,ElMessageBox } from 'element-plus'
// import {getToken} from "./auth";
// import Qs from 'qs'

// create an axios instance
const service = axios.create({
  baseURL: 'http://47.96.22.8:8091', // api 的 base_url
  timeout: 500000, // request timeout
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // 允许携带cookie
})


export function getArticleContent(url) {
  return service({
    url: '/mp_article_get_by_socks5_wxb',
    method: 'post',
    data: {
      url
    }
  })
}

export function getArticleContent2(url) {
  return service({
    url: '/mp_article_get_by_socks5_wxb2',
    method: 'post',
    data: {
      url
    }
  })
}