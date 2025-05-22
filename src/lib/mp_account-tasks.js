const { net } = require('electron');
const global = require("./global")

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

export const localExtractMpArticleUrlUseRequest = function (url, timeout = defaultTimeout) {
  verbose_log(`localExtractMpArticleUrlUseRequest to fetch:${url}`)
  const { protocol, hostname, port, pathname, search, searchParams } = new URL(url)

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