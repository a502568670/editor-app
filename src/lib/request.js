const { net } = require('electron');
const global = require("./global")

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const get_backend_url = global.default.utils.get_backend_url;
const get_jzl_url = global.default.utils.get_jzl_url;

const defaultTimeout = global.default.common.DEFAULT_TIMEOUT

// HTTP POST FORM 请求封装函数
export const postFormToEditorApi = function (pathname, postData, newheaders) {
  // console.log("数据接收完成", pathname);
  // console.log("要发送的数据", postData);
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }
    // 使用 net.request 创建一个 POST 请求，配置包括协议、主机地址、端口、路径和请求头。
    const { protocol, hostname, port } = get_backend_url()
    // const backend_url = process.env.BACKEND_URL
    // verbose_log("post in wechat backend_url:", process.env.BACKEND_URL)
    // let [backend_protocol, backend_host, backend_port] = backend_url.split(":")
    // backend_protocol = backend_protocol + ":"
    // backend_host = backend_host.substring(2)
    // backend_port = parseInt(backend_port)

    const request = net.request({
      method: 'post',
      protocol, // 使用 http 协议
      hostname, // 设为本地地址
      port, // 设为端口 8000
      path: pathname, // 直接使用传入的 url
      headers: headers
    });
    // 处理响应
    request.on('response', (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        verbose_log("数据接收完成");
        if (response.statusCode == 200) {
          verbose_log("数据接收完成", data);

          resolve(data);
        } else {
          reject();
        }
      });
    });
    // 构造请求体： 遍历 postData 对象，将其键值对拼接成 key=value& 格式的字符串，并通过 request.write 发送。
    let param = "";
    for (let key in postData) {
      param += (key + '=' + postData[key] + '&');
    }
    request.write(param);
    request.end();
  });
}

export const postJsonToEditorApi = function (pathname, postData, newheaders, timeout = defaultTimeout) {
  const { protocol, hostname, port } = get_backend_url()
  return _postJson(protocol, hostname, port, pathname, postData, newheaders, timeout);
}

export const postJsonToJZLApi = function (pathname, postData, newheaders, timeout = defaultTimeout) {
  const { protocol, hostname, port } = get_jzl_url()
  return _postJson(protocol, hostname, port, pathname, postData, newheaders, timeout);
}

export const postJson = function (url, postData, newheaders, timeout) {
  const { protocol, hostname, port, pathname, } = new URL(url)
  return _postJson(protocol, hostname, port, pathname, postData, newheaders, timeout)
}
const _postJson = function (protocol, hostname, port, pathname, postData, newheaders, timeout) {
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/json'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }
    console.log("pathname=>", pathname)
    // 使用 net.request 创建一个 POST 请求，配置包括协议、主机地址、端口、路径和请求头。
    const request = net.request({
      method: 'post',
      protocol, // 使用 http 协议
      hostname, // 设为本地地址
      port, // 设为端口 8000
      path: pathname, // 直接使用传入的 url
      headers: headers
    });
    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        request.abort();
        reject(new Error(`_postJson::Timeout after ${timeout}ms`));
      }
    }, timeout);

    request.on('response', (response) => {
      // 处理响应
      let buffers = [];
      response.on('data', (chunk) => {
        // console.log(`Buffer: ${chunk}`);
        buffers.push(chunk);
      })

      response.on('end', () => {
        let responseBodyBuffer = Buffer.concat(buffers);
        let ret = JSON.parse(responseBodyBuffer.toString());
        // console.log(`BODY: ${ret}`);
        verbose_log("JSON数据接收完成", responseBodyBuffer.toString());

        clearTimeout(timeoutId);
        isFinished = true;
        // verbose_log("JSON数据接收完成", ret);
        resolve(ret);
      })

      request.on('error', (error) => {
        clearTimeout(timeoutId);
        isFinished = true;
        reject(error);
      });

    });
    console.log("postData:", postData)
    request.write(JSON.stringify(postData));
    request.end();
  });
}


export function toReqOpts(url, opts = {}) {
  var {protocol,hostname,port,pathname,search} = new URL(url);
  port = port || protocol === 'https:' ? 443 : 80;
  return {protocol,hostname,port,path:pathname+search,...opts};
}

export function netFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
      var req = net.request(toReqOpts(url, opts));
      req.on('response', (res) => {
          var chunk = [];
          res.on('data', c => chunk.push(c));
          res.on('end', () => {
              resolve(Buffer.concat(chunk).toString());
          });
      });
      req.on('error', reject);
      if (opts.body) req.write(opts.body);
      req.end();
  });
}
