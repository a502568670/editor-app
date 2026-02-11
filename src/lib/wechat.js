const { ipcMain, dialog, net, BrowserWindow, BrowserView, Notification } = require('electron');
const path = require('path');
const global = require("./global")

const verbose_log = global.default.utils.verbose_log;
const verbose_error = global.default.utils.verbose_error;
const get_backend_url_old = global.default.utils.get_backend_url_old;

/** 获取Cookie的函数 */
async function getCookies(domain, webContents) {
  try {
    if (webContents) {
      const cookies = await webContents.session.cookies.get({ domain });
      // verbose_log('获取到的 Cookie:', cookies);
      return cookies;
    } else {
      verbose_error('webContents 未正确初始化');
      return [];
    }
  } catch (error) {
    verbose_error('获取 Cookie 时出错:', error);
    return [];
  }
}
/** 判断Cookie是否过期 */
function checkCookiesExpired(cookies, checkkeys) {
  const now = Date.now()
  const isExpired = checkkeys.some(cookieName => {
    const cookie = cookies.find(ck => ck.name === cookieName)
    if (!cookie) {
      return true
    }
    const expirationDate = cookie.expirationDate * 1000
    verbose_log(`now:${now}, expirationDate:${expirationDate}`)
    return now >= expirationDate
  });
  return isExpired
}

// 请求微信公众号首页判断cookie是否过期
async function checkLoginStatus_Old(viewData) {
  if(!viewData.user || !viewData.user.session_id) return;
  const { cookie } = viewData.user.session_id;
  const token = viewData.user.token;
  const res = await fetch(`https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=${token}`, {
    headers: {
      Cookie: cookie.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const logicRet = res.headers.get('LogicRet');
  const setCookie = res.headers.get('Set-Cookie') || '';
  const expired = logicRet === '200003' || /EXPIRED/i.test(setCookie);
  if (expired) {
    verbose_log('⚠️ 微信公众号登录态已失效，需要重新登录');
    viewData.user.expired = true;
    viewData.user.session_id = ''
  }
}

// 初始化init - 使用二维码扫码登录
async function init(viewData, postTokenInWin) {
  // 重置 isLoginedEventTriggered 标志
  let isLoginedEventTriggered = false;

  // 使用 net 模块发送请求的辅助函数
  function netRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      verbose_log('发送请求到:', url);
      const request = net.request({
        method: options.method || 'GET',
        url: url,
        headers: options.headers || {}
      });

      if (options.body) {
        request.write(options.body);
      }

      request.on('response', (response) => {
        verbose_log('收到响应，状态码:', response.statusCode);
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          verbose_log('响应数据长度:', buffer.length);
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            buffer: buffer,
            json: () => {
              try {
                return JSON.parse(buffer.toString());
              } catch (e) {
                verbose_error('JSON解析失败:', e);
                return {};
              }
            },
            arrayBuffer: () => buffer
          });
        });
      });

      request.on('error', (error) => {
        verbose_error('请求失败:', error);
        reject(error);
      });

      request.end();
    });
  }

  // 记录当前已登录的账号，用于判断是否是新的登录
  let currentLoggedInUser = null;
  
  // 存储主进程的轮询 interval ID
  let mainProcessCheckInterval = null;
  
  // 存储超时定时器 ID
  let qrCodeTimeoutId = null;
  
  // 标记是否正在处理登录
  let isProcessingLogin = false;
  
  // 开始二维码登录流程
  async function startQRCodeLogin() {
    const fingerprint = "64f379b133f5d29df7b2d4d72faf8812";
    
    verbose_log('========== 开始新的二维码登录流程 ==========');
    
    // 清理主进程的旧轮询
    if (mainProcessCheckInterval) {
      clearInterval(mainProcessCheckInterval);
      mainProcessCheckInterval = null;
      verbose_log('已清理主进程的旧轮询');
    }
    
    // 清理旧的超时定时器
    if (qrCodeTimeoutId) {
      clearTimeout(qrCodeTimeoutId);
      qrCodeTimeoutId = null;
      verbose_log('已清理旧的超时定时器');
    }
    
    // 清理页面中的旧轮询（如果存在）
    try {
      if (!viewData.webview.webContents.isDestroyed()) {
        await viewData.webview.webContents.executeJavaScript(`
          if (window.__qrCheckInterval) {
            clearInterval(window.__qrCheckInterval);
            window.__qrCheckInterval = null;
            console.log('已清理页面中的旧二维码轮询');
          }
        `).catch(e => verbose_error('清理页面轮询失败:', e));
      }
    } catch (error) {
      verbose_error('清理页面轮询时出错:', error);
    }
    
    // 标记正在二维码登录流程中
    isInQRCodeLoginFlow = true;
    
    // 清除旧的登录 Cookie，避免误判
    try {
      const cookiesToClear = ['slave_user', 'slave_sid', 'slave_bizuin', 'data_bizuin', 'bizuin', 'data_ticket', 'rand_info'];
      for (const cookieName of cookiesToClear) {
        await viewData.webview.webContents.session.cookies.remove('https://mp.weixin.qq.com', cookieName);
      }
      currentLoggedInUser = null; // 重置当前登录用户
      verbose_log('已清除旧的登录 Cookie');
    } catch (error) {
      verbose_error('清除 Cookie 失败:', error);
    }
    
    try {
      // 临时移除 did-finish-load 监听器，避免在加载登录页面时触发
      viewData.webview.webContents.removeListener('did-finish-load', didFinishLoadHandler);
      
      // 创建一个 Promise 来等待页面加载
      const pageLoadPromise = new Promise((resolve) => {
        const handler = () => {
          resolve();
        };
        viewData.webview.webContents.once('did-finish-load', handler);
      });
      
      // 加载真实的微信页面（这样 Cookie 才能正常工作）
      await viewData.webview.webContents.loadURL('https://mp.weixin.qq.com/');
      
      // 等待页面加载完成
      await pageLoadPromise;
      
      // 等待一小段时间确保页面完全渲染
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 注入自定义的登录界面
      await viewData.webview.webContents.executeJavaScript(`
        (function() {
          // 隐藏原有内容，显示自定义登录界面
          document.body.innerHTML = \`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; margin: 0; padding: 0; font-family: Arial, sans-serif;">
              <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">微信公众号登录123</h2>
                <img id="qrcode" alt="二维码" style="max-width: 300px; max-height: 300px; border: 1px solid #eee; display: none; margin: 0 auto;" />
                <p id="status" style="margin-top: 20px; color: #07c160;">正在初始化...</p>
              </div>
            </div>
          \`;
        })();
      `);
  
      // 步骤1: 直接在页面中执行请求，这样可以自动携带和保存 Cookie
      try {
        
        // 添加超时保护
        const preloginPromise = viewData.webview.webContents.executeJavaScript(`
          (async function() {
            try {
              const preloginUrl = 'https://mp.weixin.qq.com/cgi-bin/bizlogin?action=prelogin&fingerprint=64f379b133f5d29df7b2d4d72faf8812&token=&lang=zh_CN&f=json&ajax=1';
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
              
              const response = await fetch(preloginUrl, {
                method: 'POST',
                credentials: 'include', // 确保保存 Cookie
                signal: controller.signal,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                  'Referer': 'https://mp.weixin.qq.com'
                }
              });
              
              clearTimeout(timeoutId);
              
              const result = await response.json();
              return { success: true, result };
            } catch (e) {
              return { success: false, error: e.message };
            }
          })();
        `);
        
        const preloginResult = await Promise.race([
          preloginPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('executeJavaScript 超时')), 15000))
        ]);
        
        
        if (!preloginResult.success) {
          throw new Error('prelogin 失败: ' + preloginResult.error);
        }
      } catch (error) {
        verbose_error('prelogin 失败:', error);
        await viewData.webview.webContents.executeJavaScript(`
          document.getElementById('status').textContent = 'prelogin 请求失败: ${error.message.replace(/'/g, "\\'")}';
          document.getElementById('status').style.color = 'red';
        `).catch(e => verbose_error('无法更新状态:', e));
        return;
      }

      // 步骤2: 在页面中执行 startlogin
      verbose_log('步骤2: 在页面中执行 startlogin');
      try {
        const sessionid = Date.now();
        await viewData.webview.webContents.executeJavaScript(`
          (async function() {
            try {
              const startloginUrl = 'https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin';
              const sessionid = ${sessionid};
              const body = 'userlang=zh_CN&redirect_url=&login_type=3&sessionid=' + sessionid + '&fingerprint=64f379b133f5d29df7b2d4d72faf8812&token=&lang=zh_CN&f=json&ajax=1';
              const response = await fetch(startloginUrl, {
                method: 'POST',
                credentials: 'include', // 确保携带和保存 Cookie
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                  'Referer': 'https://mp.weixin.qq.com',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
              });
              const result = await response.json();
              return result;
            } catch (e) {
              throw e;
            }
          })();
        `);
      } catch (error) {
        verbose_error('startlogin 失败:', error);
        await viewData.webview.webContents.executeJavaScript(`
          document.getElementById('status').textContent = 'startlogin 请求失败';
          document.getElementById('status').style.color = 'red';
        `);
        return;
      }
      try {
        // 等待一下，确保 startlogin 完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 先检查 Cookie 是否已设置
        const cookieCheck = await viewData.webview.webContents.executeJavaScript(`
          (function() {
            const cookies = document.cookie;
            if (cookies) {
              const cookieArray = cookies.split(';').map(c => c.trim());
              cookieArray.forEach(c => console.log('  -', c));
            } else {
              console.warn('⚠️ 没有 Cookie！');
            }
            return cookies;
          })();
        `);
        
        
        // 修复：移除空的 login_appid 参数，或者使用正确的参数
        const qrcodeUrl = `https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random=${Date.now()}`;
        
        // 使用 fetch 下载二维码并转换为 Base64，这样可以携带 Cookie
        verbose_log('显示二维码到窗口');
        const qrcodeResult = await viewData.webview.webContents.executeJavaScript(`
          (function() {
            return new Promise(async (resolve) => {
              try {
                var img = document.getElementById('qrcode');
                var status = document.getElementById('status');

                if (img && status) {
                  
                  try {
                    // 使用 fetch 下载二维码，自动携带 Cookie
                    const response = await fetch('${qrcodeUrl}', {
                      method: 'GET',
                      credentials: 'include', // 携带 Cookie
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://mp.weixin.qq.com'
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('服务器返回错误: ' + response.status);
                    }
                    
                    // 读取响应内容
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // 如果内容为空
                    if (arrayBuffer.byteLength === 0) {
                      status.textContent = '服务器返回空内容（Cookie 可能未正确设置）';
                      status.style.color = 'red';;
                      return;
                    }
                    
                    // 尝试读取前几个字节判断文件类型
                    const bytes = new Uint8Array(arrayBuffer);
                    
                    // PNG 文件头: 89 50 4E 47 0D 0A 1A 0A
                    // JPEG 文件头: FF D8 FF
                    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
                    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

                    
                    // 如果不是图片格式
                    if (!isPNG && !isJPEG) {
                      // 尝试作为文本读取
                      const text = new TextDecoder().decode(arrayBuffer);
                      status.textContent = '服务器返回了非图片内容';
                      status.style.color = 'red';
                      resolve({ success: false, error: '不是图片格式' });
                      return;
                    }
                    
                    // 转换为 Blob（使用检测到的类型）
                    const mimeType = isPNG ? 'image/png' : 'image/jpeg';
                    const blob = new Blob([arrayBuffer], { type: mimeType });

                    
                    // 转换为 Base64
                    const reader = new FileReader();
                    reader.onload = function() {
                      const base64 = reader.result;
                      console.log('=== 二维码转换为 Base64 成功 ===');
                      console.log('Base64 前50个字符:', base64.substring(0, 50));
                      
                      img.onload = function() {
                        console.log('=== 图片加载成功 ===');
                        console.log('图片尺寸:', img.naturalWidth, 'x', img.naturalHeight);
                        status.textContent = '请使用微信扫描二维码登录';
                        status.className = '';
                        img.style.display = 'block';
                        resolve({ success: true });
                      };
                      img.onerror = function(e) {
                        console.error('=== Base64 图片加载失败 ===');
                        console.error('错误事件:', e);
                        console.error('Base64 数据长度:', base64.length);
                        status.textContent = '二维码显示失败';
                        status.style.color = 'red';
                        resolve({ success: false, error: 'Base64 加载失败' });
                      };
                      img.src = base64;
                    };
                    reader.onerror = function(e) {
                      console.error('FileReader 转换失败:', e);
                      status.textContent = '二维码转换失败';
                      status.style.color = 'red';
                      resolve({ success: false, error: 'FileReader 失败' });
                    };
                    reader.readAsDataURL(blob);
                    
                  } catch (fetchError) {
                    console.error('=== fetch 二维码失败 ===');
                    console.error('错误:', fetchError);
                    status.textContent = '获取二维码失败: ' + fetchError.message;
                    status.style.color = 'red';
                    resolve({ success: false, error: fetchError.message });
                  }
                } else {
                  console.error('找不到页面元素');
                  resolve({ success: false, error: '找不到页面元素' });
                }
              } catch(e) {
                console.error('显示二维码失败:', e);
                resolve({ success: false, error: e.message });
              }
            });
          })();
        `);
        
        console.log('二维码加载结果:', qrcodeResult);
        verbose_log('二维码加载结果:', qrcodeResult);
        
        if (!qrcodeResult.success) {
          verbose_error('二维码未能成功显示:', qrcodeResult.error);
          return;
        }
        
        verbose_log('二维码显示完成');
      } catch (error) {
        console.error('========== 获取二维码失败 ==========', error);
        verbose_error('获取二维码失败:', error);
        await viewData.webview.webContents.executeJavaScript(`
          document.getElementById('status').textContent = '获取二维码失败: ${error.message}';
          document.getElementById('status').style.color = 'red';
        `);
        return;
      }

      // 步骤4: 在页面中轮询检查扫码状态（这样可以自动携带 Cookie）
      verbose_log('步骤4: 开始轮询检查扫码状态');
      
      // 不阻止跳转，让微信自动跳转到公众号首页
      // 我们在 did-navigate 事件中检测到跳转后，获取用户信息，然后立即返回二维码页面
      
      // 在主进程中监听扫码成功（通过 Cookie 变化检测）
      mainProcessCheckInterval = setInterval(async () => {
        try {
          // 如果正在处理登录，跳过本次检查
          if (isProcessingLogin) {
            return;
          }
          
          // 检查是否有登录相关的 Cookie
          const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
          const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
          const slaveSidCookie = cookies.find(c => c.name === 'slave_sid');
          
          // 只有当检测到新的 slave_user（与之前不同）时，才认为是新的登录
          if (slaveUserCookie && slaveSidCookie) {
            const newSlaveUser = slaveUserCookie.value;
            
            // 如果是同一个用户，跳过
            if (currentLoggedInUser === newSlaveUser) {
              console.log('检测到相同的登录用户，跳过:', newSlaveUser);
              return;
            }
            
            // 标记正在处理登录
            isProcessingLogin = true;
            
            clearInterval(mainProcessCheckInterval);
            mainProcessCheckInterval = null;
            
            // 清理超时定时器
            if (qrCodeTimeoutId) {
              clearTimeout(qrCodeTimeoutId);
              qrCodeTimeoutId = null;
            }
            
            // 记录当前登录的用户
            currentLoggedInUser = newSlaveUser;
            
            console.log('========== 检测到新的登录 Cookie，开始处理账号 ==========');
            console.log('新登录用户:', newSlaveUser);
            verbose_log('检测到登录 Cookie，开始获取账号信息');
            
            // 更新页面状态
            try {
              await viewData.webview.webContents.executeJavaScript(`
                if (document.getElementById('status')) {
                  document.getElementById('status').textContent = '✅ 登录成功！正在添加账号...';
                  document.getElementById('status').style.color = '#07c160';
                }
                if (document.getElementById('qrcode')) {
                  document.getElementById('qrcode').style.display = 'none';
                }
              `).catch(e => verbose_error('更新页面状态失败:', e));
            } catch (error) {
              verbose_error('执行页面更新失败:', error);
            }
            
            // 在当前页面中获取账号信息（不跳转）
            try {
              // 获取 token（从 Cookie 中）
              const tokenCookie = cookies.find(c => c.name === 'token');
              let token = tokenCookie ? tokenCookie.value : '';
              
              // 如果没有 token，尝试从其他 Cookie 推断
              if (!token) {
                // 微信的 token 通常是一个数字
                const bizuinCookie = cookies.find(c => c.name === 'data_bizuin');
                if (bizuinCookie) {
                  token = bizuinCookie.value;
                }
              }
              
              console.log('获取到的 token:', token);
              console.log('========== 准备获取用户信息 ==========');
              
              // 从 Cookie 中获取 originalUsername（slave_user）
              const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
              const originalUsernameFromCookie = slaveUserCookie ? slaveUserCookie.value : undefined;
              console.log('从 Cookie 获取的 originalUsername:', originalUsernameFromCookie);
              
              console.log('========== 等待微信自动跳转到公众平台首页 ==========');
              // 微信会自动跳转，我们在 did-navigate 事件中处理
              
              // 创建 userInfo 对象
              const userInfo = {
                success: true,
                nickname: '未命名账号',
                avatar: '',
                originalUsername: originalUsernameFromCookie,
                token: token
              };
              
              console.log('========== 用户信息获取结果 ==========');
              console.log('userInfo:', userInfo);
              console.log('userInfo.nickname:', userInfo.nickname);
              console.log('userInfo.originalUsername:', userInfo.originalUsername);
              console.log('userInfo.avatar:', userInfo.avatar);
              console.log('userInfo.token:', userInfo.token);
              console.log('=====================================');
              
              // 设置 viewData.user
              viewData.user = {
                ...viewData.user,
                userName: userInfo.nickname,
                avatar: userInfo.avatar,
                originalUsername: userInfo.originalUsername,
                cookies: cookies,
                token: parseInt(userInfo.token) || 0
              };
              
              console.log('========== 准备触发登录事件 ==========');
              verbose_log('viewData.user 已设置:', viewData.user);
              
              // 触发登录事件并等待结果
              const addAccountResult = await triggerLoginedEventAndWait(viewData);
              
              console.log('========== 账号添加结果 ==========', addAccountResult);
              
              if (addAccountResult && addAccountResult.success) {
                // 账号添加成功，重新加载二维码页面
                const accountName = userInfo.nickname || '未命名账号';
                const accountId = userInfo.originalUsername || '';
                
                if (Notification.isSupported()) {
                  new Notification({
                    title: '登录成功',
                    body: `${accountName} (${accountId}) 已成功添加到系统`
                  }).show();
                }
                
                console.log('========== 账号添加成功，重新加载二维码页面 ==========');
                
                // 重置处理标志
                isProcessingLogin = false;
                
                // 重新启动二维码登录流程（这会清理旧的二维码并生成新的）
                setTimeout(() => {
                  startQRCodeLogin().catch(e => console.error('重新加载二维码页面失败:', e));
                }, 500);
              } else {
                // 添加失败，重新加载二维码页面并显示错误
                const accountName = userInfo.nickname || '未命名账号';
                console.error('账号添加失败:', addAccountResult);
                
                // 重置处理标志
                isProcessingLogin = false;
                
                // 重新启动二维码登录流程
                setTimeout(async () => {
                  try {
                    await startQRCodeLogin();
                    // 等待页面加载完成后显示错误
                    setTimeout(async () => {
                      try {
                        await viewData.webview.webContents.executeJavaScript(`
                          if (document.getElementById('status')) {
                            document.getElementById('status').innerHTML = '❌ <strong>${accountName.replace(/'/g, "\\'")}</strong> 添加失败';
                            document.getElementById('status').style.color = 'red';
                          }
                        `);
                      } catch (e) {
                        console.error('更新页面状态失败:', e);
                      }
                    }, 1000);
                  } catch (e) {
                    console.error('重新加载二维码页面失败:', e);
                  }
                }, 500);
              }
            } catch (error) {
              console.error('处理登录失败:', error);
              verbose_error('处理登录失败:', error);
              
              // 重置处理标志
              isProcessingLogin = false;
              
              // 重新启动二维码登录流程
              setTimeout(async () => {
                try {
                  await startQRCodeLogin();
                  // 等待页面加载完成后显示错误
                  setTimeout(async () => {
                    try {
                      await viewData.webview.webContents.executeJavaScript(`
                        if (document.getElementById('status')) {
                          document.getElementById('status').textContent = '❌ 账号添加失败: ${error.message.replace(/'/g, "\\'")}';
                          document.getElementById('status').style.color = 'red';
                        }
                      `);
                    } catch (e) {
                      console.error('更新页面状态失败:', e);
                    }
                  }, 1000);
                } catch (e) {
                  console.error('重新加载二维码页面失败:', e);
                }
              }, 500);
            }
          }
        } catch (error) {
          // 忽略错误，继续检查
        }
      }, 1000);
      
      // 5分钟后停止主进程的检查
      qrCodeTimeoutId = setTimeout(() => {
        if (mainProcessCheckInterval) {
          clearInterval(mainProcessCheckInterval);
          mainProcessCheckInterval = null;
          verbose_log('主进程轮询超时，已停止');
          // 在页面上显示超时提示
          try {
            viewData.webview.webContents.executeJavaScript(`
              if (document.getElementById('status')) {
                document.getElementById('status').textContent = '二维码已过期，请刷新页面重新登录';
                document.getElementById('status').style.color = 'red';
              }
            `).catch(e => verbose_error('更新超时状态失败:', e));
          } catch (error) {
            verbose_error('执行超时提示失败:', error);
          }
        }
        qrCodeTimeoutId = null;
      }, 300000);
      
      // 不再在页面中启动轮询，只使用主进程的轮询
      // 这样可以避免两个轮询同时运行导致的闪烁问题
      verbose_log('二维码登录流程启动完成，使用主进程轮询检测登录状态');

    } catch (error) {
      verbose_error('二维码登录流程出错:', error);
      verbose_error('错误堆栈:', error.stack);
      
      // 标记不再处于二维码登录流程
      isInQRCodeLoginFlow = false;
      
      // 在页面上显示错误
      try {
        await viewData.webview.webContents.executeJavaScript(`
          if (window.__qrCheckInterval) {
            clearInterval(window.__qrCheckInterval);
            window.__qrCheckInterval = null;
          }
          if (document.getElementById('status')) {
            document.getElementById('status').textContent = '登录流程出错: ${error.message.replace(/'/g, "\\'")}';
            document.getElementById('status').style.color = 'red';
          }
        `);
      } catch (e) {
        verbose_error('无法更新页面状态:', e);
      }
    }
  }

  // 登录状态检测函数
  async function checkLoginStatus(event) {
    console.log('检查是否登录', viewData);
    verbose_log('=====checkLoginStatus=====');
    verbose_log('checkLoginStatus 开始检查登录状态');

    // 如果 viewData.user 已存在，直接返回已登录
    // verbose_log("in checkLoginStatus viewData.user=>", viewData.user);
    const original_id = (viewData.user || {}).original_id;
    const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
    console.log('拿到的cookie', cookies);
    const requiredCookies = ['slave_user', 'slave_sid', 'data_ticket', 'data_bizuin'];

    if (viewData.user && viewData.user.session_id) {
      if (event) event.returnValue = true;
      // 还需判断cookies是否过期
      const isExpired = checkCookiesExpired(cookies, requiredCookies);
      return !isExpired;
    }

    try {
      const currentURL = viewData.webview.webContents.getURL();
      verbose_log('打印当前URL判断是否是首页', currentURL);
      if (currentURL.indexOf('mp.weixin.qq.com/cgi-bin/home') > -1) {
        // const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
        verbose_log('original_id=>', original_id);

        if (original_id) {
          const slave_user_cookies = cookies.filter(ck => ck.name === 'slave_user');
          if (slave_user_cookies.length === 0) {
            return false;
          }
          if (slave_user_cookies.some(ck => ck.value !== original_id)) {
            verbose_log(
              'original_id not matched',
              slave_user_cookies.map(ck => ck.value)
            );
            return false;
          }
        }

        const hasAllCookies = requiredCookies.every(cookieName => cookies.some(cookie => cookie.name === cookieName));

        if (hasAllCookies) {
          // intervalId && clearInterval(intervalId);
          const finalURL = viewData.webview.webContents.getURL();
          console.log('token的值', finalURL);
          // verbose_log("checkLoginStatus finalURL=>", viewData.webview.webContents.getURL())
          // verbose_log("checkLoginStatus finalURL2=>", d.webview.webContents.getURL())
          const urlParams = new URLSearchParams(new URL(finalURL).search);
          const token = urlParams.get('token');
          const settingPageURL_Old = `https://mp.weixin.qq.com/cgi-bin/settingpage?t=setting/index&action=index&token=${token}&lang=zh_CN&f=json`;
          const settingPageURL = `https://mp.weixin.qq.com/cgi-bin/safecenterstatus?action=protect&t=setting/safe-protect&token=${token}&lang=zh_CN&f=json`;
          verbose_log('拼接后的settingPageURL', settingPageURL);
          // const session = viewData.webview.webContents.session;

          // session.clearStorageData({
          //   storages: ['cookies', 'localstorage', 'caches']
          // }, function (data) {
          //   console.log('cleard', data);
          // })
          verbose_log('cleard2');

          const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
          
          // 从 Cookie 获取 originalUsername（最可靠的方法）
          const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
          const originalUsername = slaveUserCookie ? slaveUserCookie.value : undefined;
          
          // 在页面中获取用户信息
          try {
            const userInfoResult = await viewData.webview.webContents.executeJavaScript(`
              (async function() {
                try {
                  let nickname = null;
                  let avatarUrl = null;
                  
                  // 方法1: 从页面全局变量获取
                  if (window.wx && window.wx.data) {
                    nickname = window.wx.data.nick_name || window.wx.data.nickname;
                    avatarUrl = window.wx.data.head_img || window.wx.data.headimg;
                  }
                  
                  // 方法2: 从页面 DOM 获取
                  if (!nickname) {
                    const accountNameEl = document.querySelector('.account_name') || 
                                         document.querySelector('.weui-desktop-account__name') ||
                                         document.querySelector('[class*="account"]');
                    if (accountNameEl) {
                      nickname = accountNameEl.textContent.trim();
                    }
                  }
                  
                  if (!avatarUrl) {
                    const avatarEl = document.querySelector('.account_avatar img') ||
                                    document.querySelector('.weui-desktop-account__avatar img') ||
                                    document.querySelector('[class*="avatar"] img');
                    if (avatarEl) {
                      avatarUrl = avatarEl.src;
                    }
                  }
                  
                  return {
                    success: true,
                    nickname: nickname || '未命名账号',
                    avatar: avatarUrl
                  };
                } catch (e) {
                  return { 
                    success: true,
                    nickname: '未命名账号',
                    avatar: null
                  };
                }
              })();
            `);
            
            let nickname = userInfoResult.nickname || '未命名账号';
            const avatarUrl = userInfoResult.avatar;
            
            verbose_log('获取到的原始iD:', originalUsername);
            const original_id = viewData.user && viewData.user.original_id;
            if (original_id && original_id !== originalUsername) {
              verbose_error(`不匹配的原始id: original_id(${original_id}) loggedIn(${originalUsername})`);
              if (event) event.returnValue = false;
              return false;
            }
            
            if (originalUsername) {
              const decodedNickname = escape(nickname);
              verbose_log('nickname=>', nickname);
              verbose_log('decodedNickname=>', decodedNickname);
              viewData.user = {
                ...viewData.user,
                userName: nickname,
                avatar: avatarUrl,
                originalUsername: originalUsername,
                cookies: cookies,
                token: parseInt(token)
              };
              // console.log("set viewData.user", viewData.user)
              triggerLoginedEvent(viewData); // 触发登录事件
              verbose_log('isLoginedEventTriggered:', isLoginedEventTriggered);
              isLoginedEventTriggered = true;

              if (event) event.returnValue = true;
              // resolve(true);
              return true;
            } else {
              verbose_error('账号状态异常:', originalUsername);
            }
          } catch (error) {
            verbose_error('获取用户信息失败:', error);
            if (event) event.returnValue = false;
            // resolve(false);
            return false;
          }
        }
        // return new Promise((resolve) => {
        //   const intervalId = setInterval(async () => {
        //     try {

        //     } catch (error) {
        //       verbose_error('检查cookie时出错:', error);
        //       clearInterval(intervalId);
        //     }
        //   }, 1000);
        // });
      } else if (currentURL.indexOf('mp.weixin.qq.com/cgi-bin/wticketcontractorverify?action=bind_admin_page') > -1) {
        verbose_error('==管理员被解绑==');
        return false;
      } else if (currentURL.indexOf('/acct/contractorpage?action=showsubmit') > -1) {
        verbose_error('==未注册完成==');
        return false;
      } else if (currentURL.indexOf('/acct/ban?ticket_id=gh') > -1) {
        verbose_error('==封号==');
        return false;
      } else if (currentURL.indexOf('cgi-bin/acctclose') > -1) {
        verbose_error('==账号已冻结==');
        return false;
      } else {
        if (event) event.returnValue = false;
        return false;
      }
    } catch (error) {
      verbose_error('获取用户信息出错:', error);
    }
    if (event) event.returnValue = false;
    // resolve(false);
    return false;
  }

  /** 触发登录事件并等待结果 */
  async function triggerLoginedEventAndWait(viewData) {
    verbose_log('==triggerLoginedEventAndWait==');
    
    if (!viewData || !viewData.webview || !viewData.webview.webContents) {
      verbose_error('无法触发logined事件: viewData结构不完整');
      return { success: false, error: 'viewData结构不完整' };
    }
    
    if (viewData.webview.webContents.isDestroyed()) {
      verbose_error('无法触发logined事件: webContents已销毁');
      return { success: false, error: 'webContents已销毁' };
    }
    
    try {
      console.log('登录事件viewData值', viewData);
      
      const payload = {
        name: viewData.user.userName,
        avatar: viewData.user.avatar,
        originalUsername: viewData.user.originalUsername,
        cookies: viewData.user.cookies
      };

      verbose_log('准备发送logined事件并等待结果:');
      const result = await handleLoginedEventAndWait(payload, viewData);
      verbose_log('logined事件已处理，结果:', result);
      
      return result;
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);
      return { success: false, error: error.message };
    }
  }

  /** 触发登录事件的函数 */
  function triggerLoginedEvent(viewData) {
    verbose_log('==triggerLoginedEvent==');
    verbose_log('viewData.webview=>', viewData.webview);
    verbose_log('viewData.webview.webContents=>', viewData.webview.webContents);

    verbose_log('viewData.webview is instanceof BrowserWindow=>', viewData.webview instanceof BrowserWindow);
    verbose_log('viewData.webview is instanceof BrowserView=>', viewData.webview instanceof BrowserView);
    verbose_log('viewData.webview.isDestroyed()=>', viewData.webview.webContents.isDestroyed());
    verbose_log('viewData.webview.webContents.isDestroyed()=>', viewData.webview.webContents.isDestroyed());
    const isLoginInPopup = viewData.webview instanceof BrowserWindow;
    if (isLoginInPopup) {
    }
    if (viewData.webview.webContents.isDestroyed() || viewData.webview.webContents.isDestroyed()) {
      verbose_error('无法触发logined事件: webContents已销毁');
      return;
    }
    if (!viewData || !viewData.webview || !viewData.webview.webContents) {
      verbose_error('无法触发logined事件: viewData结构不完整');
      return;
    }
    try {
      console.log('登录事件viewData值', viewData);
      if (isLoginedEventTriggered) {
        verbose_log('logined事件已触发过，跳过重复触发');
        return;
      }
      const payload = {
        name: viewData.user.userName,
        avatar: viewData.user.avatar,
        originalUsername: viewData.user.originalUsername,
        cookies: viewData.user.cookies
      };

      verbose_log('准备发送logined事件:');
      handleLoginedEvent(payload, viewData);
      verbose_log('logined事件已处理');
      isLoginedEventTriggered = true;
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);

      // 添加重试机制
      if (typeof triggerLoginedEvent.retryCount === 'undefined') {
        triggerLoginedEvent.retryCount = 0;
      }
      if (triggerLoginedEvent.retryCount < 3) {
        triggerLoginedEvent.retryCount++;
        verbose_log(`尝试第${triggerLoginedEvent.retryCount}次重发...`);
        setTimeout(() => triggerLoginedEvent(viewData), 1000);
      } else {
        verbose_error('已达到最大重试次数，放弃发送logined事件');
      }
    }
  }

  /** 定义处理Logined事件并等待结果的函数 */
  async function handleLoginedEventAndWait(data, viewData) {
    verbose_log('---handleLoginedEventAndWait---');
    try {
      const payload = {
        platform: { id: 4 },
        cookies: viewData.user.cookies,
        localStorage: {},
        sessionStorage: {},
        token: viewData.user.token, // mp 自动生成的
        originalUsername: viewData.user.originalUsername, // gh_id
        name: viewData.user.userName, // nick_name
        avatar: viewData.user.avatar || '', // 如果是 undefined，使用空字符串
        userToken: viewData.user.userToken || viewData.userToken
      };
      
      console.log('========== 发送到后端的数据 ==========');
      console.log('token:', payload.token);
      console.log('originalUsername:', payload.originalUsername);
      console.log('name:', payload.name);
      console.log('avatar:', payload.avatar);
      console.log('viewData.tabWin:', viewData.tabWin);
      console.log('postTokenInWin:', postTokenInWin);
      console.log('=====================================');
      
      let result;
      if (postTokenInWin) {
        verbose_log('---postTokenInWin---');
        console.log('调用 postTokenInWin，传递 tabWin:', viewData.tabWin);
        result = await postTokenInWin(payload, viewData.tabWin);
      } else {
        verbose_log('postToken is exist:');
        console.log('调用 postToken，传递 tabWin:', viewData.tabWin);
        result = postToken && await postToken(payload, viewData.tabWin);
      }
      
      verbose_log('postToken 返回结果:', result);
      
      if (result && result.code === 1) {
        return { success: true };
      } else {
        return { success: false, error: result ? result.msg : '未知错误' };
      }
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);
      return { success: false, error: error.message };
    }
  }

  /** 定义处理Logined事件的函数 */
  async function handleLoginedEvent(data, viewData) {
    verbose_log('---handleLoginedEvent---');
    try {
      const payload = {
        platform: { id: 4 },
        cookies: viewData.user.cookies,
        localStorage: {},
        sessionStorage: {},
        token: viewData.user.token, // mp 自动生成的
        originalUsername: viewData.user.originalUsername, // gh_id
        name: viewData.user.userName, // nick_name
        avatar: viewData.user.avatar || '', // 如果是 undefined，使用空字符串
        userToken: viewData.user.userToken || viewData.userToken
      };
      if (postTokenInWin) {
        verbose_log('---postTokenInWin---');
        postTokenInWin(payload);
      } else {
        verbose_log('postToken is exisst:');
        postToken && postToken(payload, viewData.tabWin);
      }

      // 不要跳转到微信公众号页面，保持在当前二维码页面
      // 注释掉原来的跳转代码
      /*
      // 将cookie注入，自动登录
      const cookie = viewData.user && viewData.user.session_id && viewData.user.session_id.cookie;
      if (cookie) {
        setCookies(cookie, viewData.webview.webContents);
      }
      // 记录是否成功
      viewData.webview.webContents
        .loadURL('https://mp.weixin.qq.com/')
        .then(() => {
          let currentURL = viewData.webview.webContents.getURL();
          verbose_log('加载的公众号网址:', currentURL);
        })
        .catch(error => {
          verbose_error('加载网址时出错:', error);
        });
      */
      
      verbose_log('账号信息已发送到后端，保持在二维码页面');
    } catch (error) {
      verbose_error('处理logined事件时出错:', error);
    }
  }

  // 移除所有旧的监听器
  ipcMain.removeAllListeners('logined');

  // 需要拦截的URL地址
  const weixin_filter = {
    urls: ['https://mp.weixin.qq.com/*']
  };

  // 拦截请求头，在请求微信公众号时添加 Cookie
  viewData.webview.webContents.session.webRequest.onBeforeSendHeaders(weixin_filter, (details, callback) => {
    if (viewData.user && !viewData.user.expired && viewData.user.session_id) {
      let session_id = viewData.user.session_id;
      if (session_id && session_id.cookie) {
        let cookie_str = '';
        // verbose_log("onBeforeSendHeaders session_id.cookie:", session_id.cookie)
        for (let a of session_id.cookie) {
          cookie_str += a.name + '=' + a.value + ';';
        }
        var reg = /;$/gi;
        cookie_str = cookie_str.replace(reg, '');
        details.requestHeaders['Cookie'] = cookie_str;
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // 设置设备权限处理程序，允许所有权限
  viewData.webview.webContents.session.setDevicePermissionHandler(
    (webContents, permission, requestingOrigin, details) => {
      return true;
    }
  );

  // 设置 WebView 的窗口打开行为
  viewData.webview.webContents.setWindowOpenHandler(data => {
    let url = data.url;
    if (url == 'about:blank') {
      return { action: 'deny' };
    }
    verbose_log('setWindowOpenHandler url:', url);
    viewData.webview.webContents.loadURL(url, {
      httpReferrer: data.referrer
    });
    return { action: 'deny' };
  });

  // 标记是否正在二维码登录流程中
  let isInQRCodeLoginFlow = false;
  
  viewData.webview.webContents.on('did-navigate', async function (event, url) {
    verbose_log('==did-navigate==');
    verbose_log('url=>', url);
    
    // 如果正在二维码登录流程中，且页面跳转到了公众号首页，获取用户信息后立即返回
    if (isInQRCodeLoginFlow && url.indexOf('mp.weixin.qq.com/cgi-bin/home') > -1) {
      console.log('========== 检测到跳转到公众号首页，开始获取用户信息 ==========');
      
      // 临时移除 did-finish-load 监听器，避免干扰
      viewData.webview.webContents.removeListener('did-finish-load', didFinishLoadHandler);
      
      // 等待页面加载完成
      await new Promise((resolve) => {
        viewData.webview.webContents.once('did-finish-load', () => {
          console.log('========== 公众号首页加载完成 ==========');
          resolve();
        });
      });
      
      // 等待200毫秒让页面数据加载
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 获取用户信息
      console.log('========== 开始获取用户信息 ==========');
      try {
        const cookies = await getCookies('mp.weixin.qq.com', viewData.webview.webContents);
        const slaveUserCookie = cookies.find(c => c.name === 'slave_user');
        const originalUsernameFromCookie = slaveUserCookie ? slaveUserCookie.value : undefined;
        
        // 从 URL 获取 token
        const urlParams = new URLSearchParams(new URL(url).search);
        const token = urlParams.get('token');
        
        const userInfo = await viewData.webview.webContents.executeJavaScript(`
          (function() {
            let nickname = null;
            let avatarUrl = null;
            
            console.log('检查 window.wx:', window.wx);
            console.log('检查 window.wx.data:', window.wx ? window.wx.data : null);
            
            // 从页面全局变量获取
            if (window.wx && window.wx.data) {
              nickname = window.wx.data.nick_name || window.wx.data.nickname;
              avatarUrl = window.wx.data.head_img || window.wx.data.headimg;
              console.log('从 window.wx.data 获取:', nickname, avatarUrl);
            }
            
            // 从页面 DOM 获取（备用方案）
            if (!nickname) {
              const possibleSelectors = [
                '.account_name',
                '.weui-desktop-account__name',
                '.account_setting_item_title'
              ];
              
              for (const selector of possibleSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                  const text = el.textContent.trim();
                  if (text && text.length > 0) {
                    nickname = text;
                    console.log('从 DOM 获取 nickname:', nickname);
                    break;
                  }
                }
              }
            }
            
            if (!avatarUrl) {
              const avatarSelectors = [
                '.account_avatar img',
                '.weui-desktop-account__avatar img'
              ];
              
              for (const selector of avatarSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                  avatarUrl = el.src;
                  console.log('从 DOM 获取 avatar:', avatarUrl);
                  break;
                }
              }
            }
            
            return {
              success: true,
              nickname: nickname || '未命名账号',
              avatar: avatarUrl
            };
          })();
        `);
        
        userInfo.originalUsername = originalUsernameFromCookie;
        userInfo.token = token;
        
        console.log('========== 用户信息获取结果 ==========');
        console.log('userInfo:', userInfo);
        console.log('=====================================');
        
        // 立即返回二维码页面（重新生成新的二维码）
        console.log('========== 立即返回二维码页面并重新生成二维码 ==========');
        setTimeout(() => {
          startQRCodeLogin().catch(e => console.error('重新加载二维码页面失败:', e));
        }, 500);
        
        // 保存账号信息
        if (userInfo.success) {
          viewData.user = {
            ...viewData.user,
            userName: userInfo.nickname,
            avatar: userInfo.avatar,
            originalUsername: userInfo.originalUsername,
            cookies: cookies,
            token: parseInt(userInfo.token) || 0
          };
          
          console.log('========== 准备触发登录事件 ==========');
          const addAccountResult = await triggerLoginedEventAndWait(viewData);
          
          console.log('========== 账号添加结果 ==========', addAccountResult);
          
          if (addAccountResult && addAccountResult.success) {
            const accountName = userInfo.nickname || '未命名账号';
            const accountId = userInfo.originalUsername || '';
            
            if (Notification.isSupported()) {
              new Notification({
                title: '登录成功',
                body: `${accountName} (${accountId}) 已成功添加到系统`
              }).show();
            }
            
            console.log('========== 账号添加成功 ==========');
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
      
      return;
    }
    
    if (url === 'https://mp.weixin.qq.com/') {
      // 退出登陆
      verbose_log('退出登陆 viewData.user:', viewData.user);
      if (viewData.user) {
        const accounlt_session_id = viewData.user.account_session_id;
        verbose_log('accounlt_session_id:', accounlt_session_id);
        if (accounlt_session_id) {
          viewData.tabWin.raiseRenderAct('remove-account-session', accounlt_session_id);
          verbose_log('send remove-account-session event to ipcRenderer');
        }
      }
    }

    verbose_log('=================');
  });

  // 定义 did-finish-load 处理函数
  const didFinishLoadHandler = async function () {
    verbose_log('页面加载完成，事件被触发');
    const currentURL = viewData.webview.webContents.getURL();
    verbose_log('当前URL', currentURL);

    // 调用登录检查函数
    verbose_log('调用checkLoginStatus检查登录状态');
    const isLoggedIn = await checkLoginStatus();
    verbose_log('登录状态:', isLoggedIn);
    if ('https://mp.weixin.qq.com/' != currentURL && viewData.tabWin) {
      verbose_log('send to ipcRender: account_check_login =>', isLoggedIn);
      console.log('登录是否过期', isLoggedIn);
      viewData.tabWin.raiseRenderAct('account_check_login', isLoggedIn);
    }
  };
  
  // 注册 did-finish-load 监听器
  viewData.webview.webContents.on('did-finish-load', didFinishLoadHandler);

  // 清理函数
  viewData.webview.webContents.on('destroyed', () => {
    verbose_log('webContents 被销毁，清理资源');
    // 清理主进程的轮询
    if (mainProcessCheckInterval) {
      clearInterval(mainProcessCheckInterval);
      mainProcessCheckInterval = null;
    }
    // 清理超时定时器
    if (qrCodeTimeoutId) {
      clearTimeout(qrCodeTimeoutId);
      qrCodeTimeoutId = null;
    }
    // 页面内的 interval 会随着页面销毁自动清理
    // 重置标志位
    isInQRCodeLoginFlow = false;
    currentLoggedInUser = null;
  });

  // 监听页面卸载事件，清理二维码相关资源
  viewData.webview.webContents.on('will-navigate', (event, url) => {
    // 如果正在离开二维码登录页面，清理资源
    if (isInQRCodeLoginFlow && url !== 'https://mp.weixin.qq.com/') {
      verbose_log('离开二维码登录页面，清理资源');
      // 清理主进程的轮询
      if (mainProcessCheckInterval) {
        clearInterval(mainProcessCheckInterval);
        mainProcessCheckInterval = null;
        verbose_log('已清理主进程轮询');
      }
      // 清理超时定时器
      if (qrCodeTimeoutId) {
        clearTimeout(qrCodeTimeoutId);
        qrCodeTimeoutId = null;
        verbose_log('已清理超时定时器');
      }
    }
  });
  
  // 监听页面关闭/销毁事件
  viewData.webview.webContents.on('before-input-event', (event, input) => {
    // 可以在这里添加快捷键监听等
  });
  
  // 添加一个全局的清理函数
  viewData.webview.cleanupQRCode = async function() {
    verbose_log('执行二维码清理函数');
    try {
      // 清理主进程的轮询
      if (mainProcessCheckInterval) {
        clearInterval(mainProcessCheckInterval);
        mainProcessCheckInterval = null;
        verbose_log('已清理主进程轮询');
      }
      
      // 清理超时定时器
      if (qrCodeTimeoutId) {
        clearTimeout(qrCodeTimeoutId);
        qrCodeTimeoutId = null;
        verbose_log('已清理超时定时器');
      }
      
      isInQRCodeLoginFlow = false;
      currentLoggedInUser = null;
    } catch (error) {
      verbose_error('清理二维码资源失败:', error);
    }
  };

  // 初始化时启动二维码登录流程
  if (viewData.webview.webContents.isDestroyed()) {
    verbose_error('无法启动登录流程: webContents已销毁');
    return;
  }

  // 检查是否已有登录态
  checkLoginStatus_Old(viewData).then(() => {
    verbose_log('登录态检查完成', viewData.user);
    if (viewData.user && viewData.user.session_id && !viewData.user.expired) {
      // 已有有效登录态，直接跳转到公众号首页
      verbose_log('已有有效登录态，跳转到公众号首页');
      viewData.webview.webContents.loadURL('https://mp.weixin.qq.com/');
    } else {
      // 没有登录态，启动二维码登录流程
      verbose_log('没有登录态，启动二维码登录流程');
      startQRCodeLogin();
    }
  });
}

module.exports.init = init;

const setCookies = async function (cookies, webContents) {
  for (let cookiesItem of cookies) {
    try {
      let {
        secure = false,
        domain = '',
        path = '',
        name
      } = cookiesItem;
      await webContents.session.cookies.set(Object.assign(cookiesItem, {
        url: (secure ? 'https://' : 'http://') + domain.replace(/^\./, '') + path
      }));
    } catch (e) {
      console.info(e);
    }
  }
};


// HTTP POST 请求封装函数
const post = function (url, postData, newheaders) {
  // console.log("数据接收完成", url);
  // console.log("要发送的数据", postData);
  return new Promise(async (resolve, reject) => {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };
    if (newheaders) {
      headers = Object.assign(headers, newheaders);
    }
    // 使用 net.request 创建一个 POST 请求，配置包括协议、主机地址、端口、路径和请求头。
    const [backend_protocol, backend_host, backend_port] = get_backend_url_old()
    // const backend_url = process.env.BACKEND_URL
    // verbose_log("post in wechat backend_url:", process.env.BACKEND_URL)
    // let [backend_protocol, backend_host, backend_port] = backend_url.split(":")
    // backend_protocol = backend_protocol + ":"
    // backend_host = backend_host.substring(2)
    // backend_port = parseInt(backend_port)
    verbose_log("backend_protocol=>", backend_protocol)
    verbose_log("backend_host=>", backend_host)
    verbose_log("backend_port=>", backend_port)

    const request = net.request({
      method: 'post',
      protocol: backend_protocol, // 使用 http 协议
      hostname: backend_host, // 设为本地地址
      port: backend_port, // 设为端口 8000
      path: url, // 直接使用传入的 url
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

// (platform, cookies, {}, sessionStorage, payload.originalUsername, payload.name, payload.avatar, payload.token)
const postToken = async function (payload, tabWin) {
  const { platform, cookies, localStorage, sessionStorage, originalUsername, name, avatar, token, userToken } = payload
  let url = '/platform/addAccount'; // 保留这个部分
  
  // 确保 Cookie 格式正确（数组格式，包含所有必要字段）
  let cookieArray = [];
  if (Array.isArray(cookies)) {
    cookieArray = cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || 'mp.weixin.qq.com',
      path: cookie.path || '/',
      secure: cookie.secure !== undefined ? cookie.secure : false,
      httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
      expirationDate: cookie.expirationDate || (Date.now() / 1000 + 86400 * 30) // 默认30天
    }));
  }
  
  let data = { cookie: cookieArray, localStorage: localStorage || {}, sessionStorage: sessionStorage || {} };
  if (!platform || !platform.id) {
    return null;
  }
  try {
    console.log('========== postToken 发送的数据 ==========');
    console.log('token:', token, 'type:', typeof token);
    console.log('originalUsername:', originalUsername);
    console.log('name:', name);
    console.log('avatar:', avatar);
    console.log('cookie count:', cookieArray.length);
    console.log('=====================================');
    
    let resultData = await post(url, {
      // session_id：通过 encodeURIComponent(JSON.stringify(data)) 序列化后的会话信息。
      // token: userToken,
      session_id: encodeURIComponent(JSON.stringify(data)),
      token: token,
      platform_id: platform.id,
      originalUsername: originalUsername,
      avatar: avatar || '',  // 确保不发送 undefined
      name: encodeURIComponent(name),
    }, { 'Authorization': `Bearer ${userToken}`, 'X-Sjq-Token': '' });
    resultData = JSON.parse(resultData);
    
    console.log('========== postToken 返回的数据 ==========');
    console.log('resultData:', resultData);
    console.log('=====================================');
    
    if (resultData.code == 1) {
      verbose_log(`账号 ${name} (${originalUsername}) 添加成功，ID: ${resultData.data.id}`);
      
      console.log('========== 准备发送 account-added 消息 ==========');
      console.log('tabWin:', tabWin);
      console.log('tabWin.win:', tabWin ? tabWin.win : null);
      console.log('tabWin.win.isDestroyed():', tabWin && tabWin.win ? tabWin.win.isDestroyed() : null);
      
      // 通知前端刷新账号列表
      if (tabWin && tabWin.win && !tabWin.win.isDestroyed()) {
        console.log('发送 account-added 消息到前端...');
        tabWin.win.webContents.send('fromMain', {
          type: 'account-added',
          data: {
            id: resultData.data.id,
            name: name,
            originalUsername: originalUsername,
            avatar: avatar
          }
        });
        verbose_log('已发送 account-added 消息到前端');
        console.log('========== account-added 消息已发送 ==========');
      } else {
        console.error('========== 无法发送 account-added 消息：tabWin 不可用 ==========');
      }
    } else {
      verbose_log(resultData.msg);
    }
    return resultData;
  } catch (e) {
    verbose_error(e); // 添加错误处理输出
    return { code: 0, msg: e.message };
  }
}