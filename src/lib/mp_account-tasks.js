const { net } = require('electron');
const global = require("./global")
const { postJsonToEditorApi } = require("./request")

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const defaultTimeout = global.default.common.DEFAULT_TIMEOUT


const getDefaultHeader = () => {
  return {
    "Referer": "https://mp.weixin.qq.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Cookie": "ua_id=zyVtjg5Yonw0bwwbAAAAAO1rBhwYo3LUz7Q-XQzmf4Q=; mm_lang=zh_CN; wxuin=35999810306917; _qimei_uuid42=191160f05391004e4b95b934484d8b16a968473e89; _qimei_fingerprint=8a94aa2efcf708a32ef8f21a091066d3; _qimei_q36=; _qimei_h38=527f30e34b95b934484d8b1602000003719116; _clck=3072077862|1|fvc|0; xid=6a888df8adddc437b03ce33adb7daf94; poc_sid=HDEaHGij5AlfqVV24z8jTgyVDkWWi05u9PdVfz6W; rewardsn=; wxtokenkey=777"
  }
}

/**
 * 判断公众号文章链接类型
 * @param {string} url - 微信公众号文章链接
 * @returns {string} - 'short' | 'long' | 'temp'
 */
const detectWechatUrlType = (url) => {
  try {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    
    // 临时链接：包含 tempkey 参数
    if (searchParams.has('tempkey')) {
      return 'temp';
    }
    
    // 长链接：包含 __biz, mid, idx, sn 等参数
    if (searchParams.has('__biz')) {
      return 'long';
    }
    
    // 短链接：路径格式为 /s/xxx
    if (urlObj.pathname.startsWith('/s/') && urlObj.pathname.length > 3) {
      return 'short';
    }
    
    return 'unknown';
  } catch (error) {
    verbose_error('detectWechatUrlType error:', error);
    return 'unknown';
  }
}

/**
 * 将长链接转换为短链接
 * @param {string} longUrl - 长链接
 * @param {string} token - 用户认证token
 * @returns {Promise<string>} - 短链接
 */
const convertLongUrlToShort = async (longUrl, token) => {
  try {
    // Base64 编码长链接
    const encodedUrl = Buffer.from(longUrl).toString('base64');
    
    verbose_log(`[长链接转短链接] 开始转换: ${longUrl}`);
    
    // 调用后端接口
    const result = await postJsonToEditorApi(
      '/mapi/wechat_link_shorten',
      { iurl: encodedUrl },
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (result.code === 200 && result.data && result.data.ourl) {
      // Base64 解码得到短链接
      const shortUrl = Buffer.from(result.data.ourl, 'base64').toString('utf-8');
      verbose_log(`[长链接转短链接] 转换成功: ${shortUrl}`);
      return shortUrl;
    } else {
      throw new Error(result.message || '转换失败');
    }
  } catch (error) {
    verbose_error('[长链接转短链接] 转换失败:', error);
    throw new Error(`长链接转短链接失败: ${error.message}`);
  }
}

export const localExtractMpArticleUrlUseRequest = async function (url, timeout = defaultTimeout, token = null) {
  // 判断链接类型
  // 短链接格式：https://mp.weixin.qq.com/s/xxx
  // 长链接格式：https://mp.weixin.qq.com/s?__biz=MzA4OTA1MTEzMg==&mid=2651638849&idx=1&sn=9dccf025106640ea5621faa4f6a8c3a8
  // 临时链接格式：https://mp.weixin.qq.com/s?__biz=MzA3MjA3Nzg2Mg==&tempkey=MTM0Nl9SU2o3Ukw3RkxudFVudHVzd09WNTJUa1dnQV9uTFBaOUNZeUoxMm9RUFVGam0yYnA5dTBUMi03NUZiY1k4eDM2MnNZZnBhSHRfdkxnaFRUaVFrV0hEU2ZCX3RLbVcxOTYyWFJrQi1rcENkSThsZG1pR0JQdm1lejVwTEFBRGgzNEtha3k1Snl0NThhZlBGS0ZYWm9fOFFNc2xpN0pQQXhZa3VFV1dBfn4=&chksm=...
  
  const urlType = detectWechatUrlType(url);
  verbose_log(`[URL类型检测] ${url} => ${urlType}`);
  
  // 如果是临时链接，不支持
  if (urlType === 'temp') {
    throw new Error('不支持临时链接，临时链接会过期，请使用长链接或短链接');
  }
  
  // 如果是长链接，需要先转换为短链接
  let finalUrl = url;
  if (urlType === 'long') {
    if (!token) {
      throw new Error('长链接转换需要提供用户token');
    }
    finalUrl = await convertLongUrlToShort(url, token);
  }

  verbose_log(`localExtractMpArticleUrlUseRequest to fetch:${finalUrl}`)
  const { protocol, hostname, port, pathname, search, searchParams } = new URL(finalUrl)

  verbose_log(`parsed protocol:${protocol} hostname:${hostname} port:${port} path:${pathname}, search:${search}`)


  let path = pathname + search
  if (searchParams.get("chksm")) {
    searchParams.delete("chksm")
    path = pathname + "?" + searchParams.toString()
  }
  verbose_log("path:", path)
  const headers = getDefaultHeader()
  return new Promise((resolve, reject) => {
    const request = net.request({
      protocol, // 使用 http 协议
      hostname, // 设为本地地址
      port, // 设为端口 8000
      path: path, // 直接使用传入的 url
      headers: headers

    });

    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        request.abort();
        reject(new Error(`localExtractMpArticleUrlUseRequest::Timeout after ${timeout}ms`));
      }
    }, timeout);

    request.on('response', (response) => {
      // 处理响应数据（示例：读取JSON）
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        clearTimeout(timeoutId);
        isFinished = true;
        resolve(data);
      });
    });
    request.on('error', (error) => {
      clearTimeout(timeoutId);
      isFinished = true;
      reject(error);
    });
    request.end();
  });

}

// timeout - ms
export const localExtractMpArticleUrlUseFetch = async (url, timeout) => {
  verbose_log(`localExtractMpArticleUrlUseFetch to fetch:${url}`)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const headers = getDefaultHeader()
  let ret = ""
  try {
    verbose_log(net.fetch)
    const response = await net.fetch(url, { headers, signal: controller.signal })
    if (response.ok) {
      ret = await response.text()
      // ... use the result.
    }
  } catch (err) {
    if (err.name === "TimeoutError") {
      // This exception is from the abort signal
      verbose_error(`localExtractMpArticleUrlUseFetch::Timeout: It took more than ${timeout} ms to get the result!`);
      timeoutId = -1
    } else if (err.name === "AbortError") {
      // This exception is from the fetch itself
      console.error(
        "localExtractMpArticleUrlUseFetch::Fetch aborted by user action (browser stop button, closing tab, etc.",
      );
    } else {
      // A network error, or some other problem.
      console.error(`localExtractMpArticleUrlUseFetch::Error: type: ${err.name}, message: ${err.message}`);
    }
  } finally {
    if (timeoutId !== -1) {
      clearTimeout(timeoutId)
    }
    return ret
  }
}