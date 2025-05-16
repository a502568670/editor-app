/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 17:23:19
 * @LastEditors:
 * @LastEditTime: 2023-01-11 15:24:47
 */
const log = require("electron-log")
global.common = {
  DEV: 'development',
  startPage: "https://go.itab.link/",
  blankPage: 'https://www.baidu.com/',
  APP_HOME_URL: process.env.WEBPACK_DEV_SERVER_URL + "/index.html",
  TAB_BAR_VIEW: "tabBar",
  DARK_WIN_COLOUR: "#000",
  LIGHT_WIN_COLOUR: "#FFF",
  MIN_WIN_HEIGHT: 768,
  MIN_WIN_WIDTH: 1024,
  MACOS: "darwin",
  TITLE_BAR_OVERLAY_COLOUR: "#0f172a",
  TAB_BAR_HEIGHT: 100,  // tab栏的高度
  TAB_BAR_WIDTH: 40,  // tab栏的宽度
  MIN_LOG_LEVEL: "info",
  APP_SCHEME: 'app',
  WAIT_FOR_BEFORE_UNLOAD: false,  // 关闭标签页面之前是否触发页面的beforeunload事件,目前只支持false,设置为true会造成有beforeunload事件的标签页面在关闭时不能正常销毁页面而导致内存不能释放
  BACKEND_URL: process.env.BACKEND_URL || "http://47.96.22.8:8006",
  DEV_CHECK_UPDATE: process.env.DEV_CHECK_UPDATE || 'false'
}

const yesVals = ['y', 'yes', 'true', true, '1', 1, 'on']
const noVals = ['n', 'no', 'false', false, '0', 0, 'off', null, ""]
const yn = (v) => {
  return yesVals.includes(v)
}
const verbose = yn(process.env.VERBOSE)

const verbose_log2 = (...args) => {
  // console.log("--enter verbose_log--", verbose, args)
  verbose && log.info.call(log, ...args)
}

const verbose_log = (...args) => {
  // console.log("--enter verbose_log--", verbose, args)
  verbose && console.log.call(console, ...args)
}

const verbose_error = (...args) => {
  // console.log("--enter verbose_log--", verbose, args)
  verbose && console.error.call(console, ...args)
}

const get_backend_url = () => {
  const backend_url = global.common.BACKEND_URL
  verbose_log("post in wechat backend_url:", backend_url)
  let [backend_protocol, backend_host, backend_port] = backend_url.split(":")
  backend_protocol = backend_protocol + ":"
  backend_host = backend_host.substring(2)
  backend_port = parseInt(backend_port)
  verbose_log("backend_protocol=>", backend_protocol)
  verbose_log("backend_host=>", backend_host)
  verbose_log("backend_port=>", backend_port)
  return [backend_protocol, backend_host, backend_port]
}

const is_dev_check_update = () => {
  return yn(global.common.DEV_CHECK_UPDATE)
}


global.utils = {
  yn,
  verbose_log,
  verbose_error,
  get_backend_url,
  is_dev_check_update
}

export default global
