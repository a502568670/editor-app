# 微信扫码登录 "invalid session" 错误修复方案

## 问题描述
扫码成功后出现错误：`❌ 访问首页失败: invalid session，1秒后自动刷新...`

## 原因分析
1. 扫码成功后立即调用 `action=login`，微信服务器的 session 还未完全建立
2. Cookie 在不同请求之间传递不完整
3. 请求之间的时间间隔太短，导致 session 状态不一致

## 解决方案

### 方案 1：增加延迟（推荐）

在 `src/lib/window.js` 中，找到扫码成功后的代码（大约在第1140行附近），在调用 `action=login` 之前增加延迟：

```javascript
} else if (checkResult.status === 1 && checkResult.user_category >= 2) {
  clearInterval(currentCheckInterval);
  currentCheckInterval = null;
  
  // 清理倒计时定时器
  if (currentQRCodeCountdownInterval) {
    clearInterval(currentQRCodeCountdownInterval);
    currentQRCodeCountdownInterval = null;
  }
  
  tabbedWin.win.webContents.send('fromMain', {
    tag: 'wechat:statusUpdate',
    data: { status: '✅ 扫码成功！正在登录...' }
  });
  
  // ⭐ 增加延迟，等待微信服务器准备好 session
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 步骤5: 调用 action=login 获取 redirect_url
  const loginResult = await hiddenWin.webContents.executeJavaScript(`
    // ... 后续代码
```

### 方案 2：跳过首页验证

如果方案1不起作用，可以跳过访问首页的验证步骤，直接使用 Cookie：

在 `src/lib/window.js` 中，找到访问首页的代码（大约在第1240行附近），注释掉首页验证：

```javascript
// 步骤6: 访问公众号首页，获取完整的 cookie 和验证状态
// 注释掉这部分，直接使用已有的 Cookie
/*
const homeUrl = `https://mp.weixin.qq.com${redirectUrl}&f=json`;
const homeResult = await hiddenWin.webContents.executeJavaScript(`
  // ...
`);

// 检查首页访问结果
if (homeResult.base_resp.ret !== 0) {
  // ... 错误处理
}
*/

// 直接继续后续流程
```

### 方案 3：使用更可靠的 Cookie 管理

确保在整个登录流程中使用同一个 session：

```javascript
// 在创建 hiddenWin 时，使用固定的 partition
const hiddenWin = new BrowserWindow({
  show: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    // 使用固定的 partition，确保 Cookie 持久化
    partition: 'persist:wechat-login-session'
  }
});
```

### 方案 4：重试机制

如果遇到 "invalid session" 错误，自动重试：

```javascript
// 检查首页访问结果
if (homeResult.base_resp.ret !== 0) {
  let errorMsg = '登录到首页失败';
  
  // 如果是 invalid session，尝试重新获取
  if (homeResult.base_resp.err_msg === 'invalid session') {
    verbose_log('检测到 invalid session，等待1秒后重试...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 重试访问首页
    const retryHomeResult = await hiddenWin.webContents.executeJavaScript(`
      // ... 相同的首页访问代码
    `);
    
    if (retryHomeResult.base_resp.ret === 0) {
      // 重试成功，继续流程
      verbose_log('重试成功！');
      // 继续后续代码...
    } else {
      // 重试仍然失败
      errorMsg = `访问首页失败: ${retryHomeResult.base_resp.err_msg || '未知错误'}`;
      // ... 错误处理
    }
  } else {
    // 其他错误
    errorMsg = `访问首页失败: ${homeResult.base_resp.err_msg || '未知错误'}`;
    // ... 错误处理
  }
}
```

## 推荐实施顺序

1. **先尝试方案1**：增加延迟最简单，成功率高
2. **如果方案1不行，尝试方案4**：增加重试机制
3. **如果还不行，尝试方案2**：跳过首页验证
4. **最后尝试方案3**：改进 Cookie 管理

## 临时解决方法

如果暂时无法修改代码，可以：
1. 多尝试几次扫码登录
2. 确保网络连接稳定
3. 使用管理员账号扫码（权限更高，成功率更高）
4. 等待几秒后再扫码（让之前的 session 完全过期）

## 验证修复

修改代码后，测试以下场景：
- [ ] 管理员账号扫码登录
- [ ] 运营者账号扫码登录
- [ ] 连续添加多个账号
- [ ] 网络较慢时的登录
- [ ] 二维码过期后重新登录
