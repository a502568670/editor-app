// 格式化时间
export const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

export const SocketHtmlDataFormat = s => {
  if (s) {
    return s.replace(/\s/g, '<br/>')
  } else {
    return ''
  }
}

export const unixToTimeToMonth = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  return [year, month].map(formatNumber).join('/')
}

export const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

export const unixToTime = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()

  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()
  const second = unixTimestamp.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

export const unixToymdhm = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()

  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

// 将UNIX时间戳转换为当年年份时间戳 返回时间戳
export const unixToNowYearTime = data => {
  // 取出当前时间时间戳
  const nowUnixTime = Math.round(new Date().getTime() / 1000)
  const nowTime = new Date(nowUnixTime * 1000)
  const nowYear = nowTime.getFullYear() // 取出当前时间的年份
  var unixTimestamp = new Date(data * 1000)
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()
  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()
  const second = unixTimestamp.getSeconds()
  const newDate = [nowYear, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  var time = new Date(newDate)
  // let t = time.getTime(time) / 1000
  return time
}

export const unixToTimeToOther = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()
  return [year, month, day].map(formatNumber).join('-')
}

export const unixToTimeDay = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()

  return [year, month, day].map(formatNumber).join('-')
}

export const unixTomonthday = data => {
  var unixTimestamp = new Date(data * 1000)
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()

  return [month, day].map(formatNumber).join('-')
}

export const unixTomdtext = data => {
  var unixTimestamp = new Date(data * 1000)
  let month = unixTimestamp.getMonth() + 1
  let day = unixTimestamp.getDate()
  if (month < 10) {
    month = 0 + String(month)
  }
  if (day < 10) {
    day = 0 + String(day)
  }
  return month + '月' + day + '日'
}

export const unixToTimeHourMin = data => {
  var unixTimestamp = new Date(data * 1000)
  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()
  return [hour, minute].map(formatNumber).join(':')
}
export const unixToTimeHourMinto = data => {
  var unixTimestamp = new Date(data * 1000)
  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()
  return [hour, minute].map(formatNumber).join('H')
}

// 标准时间转换为时间戳
export const timeToUnix = data => {
  var time = new Date(data)
  const t = time.getTime(time) / 1000
  return t
}
// 时间戳转标准时间
export const unixTopiptime = data => {
  var time = data * 1000
  const t = new Date(time)
  return t
}

// 标准时间转时间戳
export const standardtime = data => {
  var time = new Date(data)
  return time.getTime() / 1000
}

// 标准时间取年月日
export const Biaozhuntoymd = data => {
  var date = new Date(data)
  var year = date.getFullYear()
  var month = ('0' + (date.getMonth() + 1)).slice(-2)
  var day = ('0' + date.getDate()).slice(-2)
  var today = year + '-' + month + '-' + day
  return today
}

// 时间戳取出时分秒
export const unixhms = data => {
  var unixTimestamp = new Date(data * 1000)
  const hour = unixTimestamp.getHours()
  const minute = unixTimestamp.getMinutes()
  const second = unixTimestamp.getSeconds()
  return [hour, minute, second].map(formatNumber).join(':')
}

// 判断某个时间是否在某段时间内
export const timeRange = (day,start,end) => {
  let curDate = new Date(day).getTime();
  let startDate = new Date(start).getTime();
  let endDate = new Date(end).getTime();
  console.log(curDate,startDate,endDate)
  let a = curDate - startDate;
  let b = curDate - endDate;
  if(a < 0 || b > 0){
    return false;
  }else{
    return true;
  }
}

// 标准时间取年月日时分秒 2022-11-15 22:22:22
export const toYmdhms = data => {
  var date = new Date(data)
  var year = new Date(data).getFullYear()
  var month = ('0' + (date.getMonth() + 1)).slice(-2)
  var day = ('0' + date.getDate()).slice(-2)
  let hour = new Date(data).getHours()
  let minute = new Date(data).getMinutes()
  let second = new Date(data).getSeconds()
  let newDate = [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  return newDate
}

// 标准时间取年月日
export const toYmd = data => {
  var date = new Date(data)
  var year = new Date(data).getFullYear()
  var month = ('0' + (date.getMonth() + 1)).slice(-2)
  var day = ('0' + date.getDate()).slice(-2)
  let newDate = [year, month, day].map(formatNumber).join('-')
  return newDate
}

// 标准时间取时分秒
export const toHms = data => {
  var date = new Date(data)
  let hour = new Date(data).getHours()
  let minute = new Date(data).getMinutes()
  let second = new Date(data).getSeconds()
  let newDate = [hour, minute, second].map(formatNumber).join(':')
  return newDate
}

// 时间戳转年月日
export const unixToymd = data => {
  var unixTimestamp = new Date(data * 1000)
  const year = unixTimestamp.getFullYear()
  const month = unixTimestamp.getMonth() + 1
  const day = unixTimestamp.getDate()

  return [year, month, day].map(formatNumber).join('-')
}
