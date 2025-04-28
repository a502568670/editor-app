/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 17:23:19
 * @LastEditors:
 * @LastEditTime: 2023-01-11 15:24:47
 */

global.common = {
  DEV: 'development',
  startPage: "https://go.itab.link/",
  blankPage: 'https://www.baidu.com/',
  APP_HOME_URL: process.env.WEBPACK_DEV_SERVER_URL + "/index.html",
  TAB_BAR_VIEW: "tabBar",
  DARK_WIN_COLOUR: "#000",
  LIGHT_WIN_COLOUR: "#FFF",
  MIN_WIN_HEIGHT: 600,
  MIN_WIN_WIDTH: 800,
  MACOS: "darwin",
  TITLE_BAR_OVERLAY_COLOUR: "#0f172a",
  TAB_BAR_HEIGHT: 100,  // tab栏的高度
  TAB_BAR_WIDTH: 40,  // tab栏的宽度
  MIN_LOG_LEVEL: "info",
  APP_SCHEME: 'app',
  WAIT_FOR_BEFORE_UNLOAD: false,  // 关闭标签页面之前是否触发页面的beforeunload事件,目前只支持false,设置为true会造成有beforeunload事件的标签页面在关闭时不能正常销毁页面而导致内存不能释放
}

export default global
