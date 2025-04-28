/**
 * Created by jiachenpan on 16/11/18.
 */

export function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (('' + time).indexOf('-') > -1 && ('' + time).length === 10) {
      return time
    }
    if (('' + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value ] }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}

export function formatTime(time, option) {
  time = +time * 1000
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time, option)
  } else {
    return (
      d.getMonth() +
      1 +
      '月' +
      d.getDate() +
      '日' +
      d.getHours() +
      '时' +
      d.getMinutes() +
      '分'
    )
  }
}

// 格式化时间
export function getQueryObject(url) {
  url = url == null ? window.location.href : url
  const search = url.substring(url.lastIndexOf('?') + 1)
  const obj = {}
  const reg = /([^?&=]+)=([^?&=]*)/g
  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1)
    let val = decodeURIComponent($2)
    val = String(val)
    obj[name] = val
    return rs
  })
  return obj
}

/**
 *get getByteLen
 * @param {Sting} val input value
 * @returns {number} output value
 */
export function getByteLen(val) {
  let len = 0
  for (let i = 0; i < val.length; i++) {
    if (val[i].match(/[^\x00-\xff]/gi) != null) {
      len += 1
    } else {
      len += 0.5
    }
  }
  return Math.floor(len)
}

export function cleanArray(actual) {
  const newArray = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}

export function param(json) {
  if (!json) return ''
  return cleanArray(
    Object.keys(json).map(key => {
      if (json[key] === undefined) return ''
      return encodeURIComponent(key) + '=' + encodeURIComponent(json[key])
    })
  ).join('&')
}

export function param2Obj(url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"') +
      '"}'
  )
}

export function html2Text(val) {
  const div = document.createElement('div')
  div.innerHTML = val
  return div.textContent || div.innerText
}

export function objectMerge(target, source) {
  /* Merges two  objects,
     giving the last one precedence */

  if (typeof target !== 'object') {
    target = {}
  }
  if (Array.isArray(source)) {
    return source.slice()
  }
  Object.keys(source).forEach(property => {
    const sourceProperty = source[property]
    if (typeof sourceProperty === 'object') {
      target[property] = objectMerge(target[property], sourceProperty)
    } else {
      target[property] = sourceProperty
    }
  })
  return target
}

export function toggleClass(element, className) {
  if (!element || !className) {
    return
  }
  let classString = element.className
  const nameIndex = classString.indexOf(className)
  if (nameIndex === -1) {
    classString += '' + className
  } else {
    classString =
      classString.substr(0, nameIndex) +
      classString.substr(nameIndex + className.length)
  }
  element.className = classString
}

export const pickerOptions = [
  {
    text: '今天',
    onClick(picker) {
      const end = new Date()
      const start = new Date(new Date().toDateString())
      end.setTime(start.getTime())
      picker.$emit('pick', [start, end])
    }
  },
  {
    text: '最近一周',
    onClick(picker) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(end.getTime() - 3600 * 1000 * 24 * 7)
      picker.$emit('pick', [start, end])
    }
  },
  {
    text: '最近一个月',
    onClick(picker) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      picker.$emit('pick', [start, end])
    }
  },
  {
    text: '最近三个月',
    onClick(picker) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      picker.$emit('pick', [start, end])
    }
  }
]

export function getTime(type) {
  if (type === 'start') {
    return new Date().getTime() - 3600 * 1000 * 24 * 90
  } else {
    return new Date(new Date().toDateString())
  }
}

export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result

  const later = function() {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp

    // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function(...args) {
    context = this
    timestamp = +new Date()
    const callNow = immediate && !timeout
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}

/**
 * This is just a simple version of deep copy
 * Has a lot of edge cases bug
 * If you want to use a perfect deep copy, use lodash's _.cloneDeep
 */
export function deepClone(source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'shallowClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

export function uniqueArr(arr) {
  return Array.from(new Set(arr))
}

export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}


// 根据银行卡号获取开户行
 // 输入银行卡号获取开户银行
 export function bankList(){
  let bank = {
    'SRCB': '深圳农村商业银行',
    'BGB': '广西北部湾银行',
    'SHRCB': '上海农村商业银行',
    'BJBANK': '北京银行',
    'WHCCB': '威海市商业银行',
    'BOZK': '周口银行',
    'KORLABANK': '库尔勒市商业银行',
    'SPABANK': '平安银行',
    'SDEB': '顺德农商银行',
    'HURCB': '湖北省农村信用社',
    'WRCB': '无锡农村商业银行',
    'BOCY': '朝阳银行',
    'CZBANK': '浙商银行',
    'HDBANK': '邯郸银行',
    'BOC': '中国银行',
    'BOD': '东莞银行',
    'CCB': '中国建设银行',
    'ZYCBANK': '遵义市商业银行',
    'SXCB': '绍兴银行',
    'GZRCU': '贵州省农村信用社',
    'ZJKCCB': '张家口市商业银行',
    'BOJZ': '锦州银行',
    'BOP': '平顶山银行',
    'HKB': '汉口银行',
    'SPDB': '上海浦东发展银行',
    'NXRCU': '宁夏黄河农村商业银行',
    'NYNB': '广东南粤银行',
    'GRCB': '广州农商银行',
    'BOSZ': '苏州银行',
    'HZCB': '杭州银行',
    'HSBK': '衡水银行',
    'HBC': '湖北银行',
    'JXBANK': '嘉兴银行',
    'HRXJB': '华融湘江银行',
    'BODD': '丹东银行',
    'AYCB': '安阳银行',
    'EGBANK': '恒丰银行',
    'CDB': '国家开发银行',
    'TCRCB': '江苏太仓农村商业银行',
    'NJCB': '南京银行',
    'ZZBANK': '郑州银行',
    'DYCB': '德阳商业银行',
    'YBCCB': '宜宾市商业银行',
    'SCRCU': '四川省农村信用',
    'KLB': '昆仑银行',
    'LSBANK': '莱商银行',
    'YDRCB': '尧都农商行',
    'CCQTGB': '重庆三峡银行',
    'FDB': '富滇银行',
    'JSRCU': '江苏省农村信用联合社',
    'JNBANK': '济宁银行',
    'CMB': '招商银行',
    'JINCHB': '晋城银行JCBANK',
    'FXCB': '阜新银行',
    'WHRCB': '武汉农村商业银行',
    'HBYCBANK': '湖北银行宜昌分行',
    'TZCB': '台州银行',
    'TACCB': '泰安市商业银行',
    'XCYH': '许昌银行',
    'CEB': '中国光大银行',
    'NXBANK': '宁夏银行',
    'HSBANK': '徽商银行',
    'JJBANK': '九江银行',
    'NHQS': '农信银清算中心',
    'MTBANK': '浙江民泰商业银行',
    'LANGFB': '廊坊银行',
    'ASCB': '鞍山银行',
    'KSRB': '昆山农村商业银行',
    'YXCCB': '玉溪市商业银行',
    'DLB': '大连银行',
    'DRCBCL': '东莞农村商业银行',
    'GCB': '广州银行',
    'NBBANK': '宁波银行',
    'BOYK': '营口银行',
    'SXRCCU': '陕西信合',
    'GLBANK': '桂林银行',
    'BOQH': '青海银行',
    'CDRCB': '成都农商银行',
    'QDCCB': '青岛银行',
    'HKBEA': '东亚银行',
    'HBHSBANK': '湖北银行黄石分行',
    'WZCB': '温州银行',
    'TRCB': '天津农商银行',
    'QLBANK': '齐鲁银行',
    'GDRCC': '广东省农村信用社联合社',
    'ZJTLCB': '浙江泰隆商业银行',
    'GZB': '赣州银行',
    'GYCB': '贵阳市商业银行',
    'CQBANK': '重庆银行',
    'DAQINGB': '龙江银行',
    'CGNB': '南充市商业银行',
    'SCCB': '三门峡银行',
    'CSRCB': '常熟农村商业银行',
    'SHBANK': '上海银行',
    'JLBANK': '吉林银行',
    'CZRCB': '常州农村信用联社',
    'BANKWF': '潍坊银行',
    'ZRCBANK': '张家港农村商业银行',
    'FJHXBC': '福建海峡银行',
    'ZJNX': '浙江省农村信用社联合社',
    'LZYH': '兰州银行',
    'JSB': '晋商银行',
    'BOHAIB': '渤海银行',
    'CZCB': '浙江稠州商业银行',
    'YQCCB': '阳泉银行',
    'SJBANK': '盛京银行',
    'XABANK': '西安银行',
    'BSB': '包商银行',
    'JSBANK': '江苏银行',
    'FSCB': '抚顺银行',
    'HNRCU': '河南省农村信用',
    'COMM': '交通银行',
    'XTB': '邢台银行',
    'CITIC': '中信银行',
    'HXBANK': '华夏银行',
    'HNRCC': '湖南省农村信用社',
    'DYCCB': '东营市商业银行',
    'ORBANK': '鄂尔多斯银行',
    'BJRCB': '北京农村商业银行',
    'XYBANK': '信阳银行',
    'ZGCCB': '自贡市商业银行',
    'CDCB': '成都银行',
    'HANABANK': '韩亚银行',
    'CMBC': '中国民生银行',
    'LYBANK': '洛阳银行',
    'GDB': '广东发展银行',
    'ZBCB': '齐商银行',
    'CBKF': '开封市商业银行',
    'H3CB': '内蒙古银行',
    'CIB': '兴业银行',
    'CRCBANK': '重庆农村商业银行',
    'SZSBK': '石嘴山银行',
    'DZBANK': '德州银行',
    'SRBANK': '上饶银行',
    'LSCCB': '乐山市商业银行',
    'JXRCU': '江西省农村信用',
    'ICBC': '中国工商银行',
    'JZBANK': '晋中市商业银行',
    'HZCCB': '湖州市商业银行',
    'NHB': '南海农村信用联社',
    'XXBANK': '新乡银行',
    'JRCB': '江苏江阴农村商业银行',
    'YNRCC': '云南省农村信用社',
    'ABC': '中国农业银行',
    'GXRCU': '广西省农村信用',
    'PSBC': '中国邮政储蓄银行',
    'BZMD': '驻马店银行',
    'ARCU': '安徽省农村信用社',
    'GSRCU': '甘肃省农村信用',
    'LYCB': '辽阳市商业银行',
    'JLRCU': '吉林农信',
    'URMQCCB': '乌鲁木齐市商业银行',
    'XLBANK': '中山小榄村镇银行',
    'CSCB': '长沙银行',
    'JHBANK': '金华银行',
    'BHB': '河北银行',
    'NBYZ': '鄞州银行',
    'LSBC': '临商银行',
    'BOCD': '承德银行',
    'SDRCU': '山东农信',
    'NCB': '南昌银行',
    'TCCB': '天津银行',
    'WJRCB': '吴江农商银行',
    'CBBQS': '城市商业银行资金清算中心',
    'HBRCU': '河北省农村信用社'
  }
  return bank
}

// 判断某个时间是否在当前时间之前
export function currentBefore(date) {
  let current = new Date().getTime();
  let data = new Date(date).getTime();
  if(data > current){
    return false
  }else{
    return true
  }
}


// 函数防抖
// immediate - 是否首次执行
export function debounceFn (func, dalay = 200, immediate = true) {
  let timer, callNow = immediate;
  return (...args) => {
    if (timer) clearTimeout(timer);
    if (callNow) {
      func(...args);
      callNow = false;
    }
    timer = setTimeout(() => {
      func(...args);
    }, dalay)
  }
}

// 分割数组-一维数组分成二维
export function partitionPages(arr, length) {
  const pages = []
  arr.forEach((item, index) => {
    const page = Math.floor(index / length)
    if (!pages[page]) {
      pages[page] = []
    }
    pages[page].push(item)
  })
  return pages
}
