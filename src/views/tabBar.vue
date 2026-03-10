<template>
  <div style="display: flex;height: 100%;width: 100%;">
    <AccountList
      ref="AccountListRef"
      :selectId="selected_account_id"
      :invalidWarn="false"
      :isManagementMode="showAccountManagement"
      :isSupportUniversal="true"
      @clickAccountTrigger="addNewTab"
      @addAccountTrigger="handleAddMPAccount"
      @userManagementTrigger="handleUserManagement"
      @overlayDialogVisible="handleOverlayDialogVisible"
    />
    <div class="flex flex-col flex-1 w-0">
      <div v-show="tabs.length > 0 && !showAccountManagement" class="tab-pages">
        <div
          class="tab-pages_tab"
          :class="{ 'bg-[var(--jzl-hover-bg-color)]': item.tabId === currentTabId }"
          v-for="item in tabs"
          :key="item.tabId"
          @click="changeTab(item.tabId)"
        >
          <p
            class="tab-pages_title"
            :class="{ '!text-[var(--jzl-primary-color)]': item.tabId === currentTabId }"
          >
            {{ item.title }}
          </p>
          <Icon class="tab-pages_clear" icon="ic:round-clear" @click="removeTab(item.tabId)" />
        </div>
      </div>
      <!-- <el-tabs
        v-model="currentTabId"
        v-show="tabs.length > 0 && !showAccountManagement"
        ref="elTabsRef"
        type="border-card"
        closable
        :stretch="false"
        @tab-remove="removeTab"
        @tab-change="changeTab"
      >
        <el-tab-pane v-for="item in tabs" :key="item.tabId" :label="item.title" :name="item.tabId"
          style="padding: 0px">
          <template #label>
            <span class="custom-tabs-label">
              <span v-if="item.title.length > 9" :title="item.title" class="tab-title">{{ item.title.slice(0, 9) }}</span>
              <span v-else class="tab-title">{{ item.title }}</span>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs> -->
      <div v-show="tabs.length > 0 && !showAccountManagement" class="action-bar">
        <div class="action-bar_navigation">
          <div><Icon icon="stash:arrow-left" @click="goBack" /></div>
          <div><Icon icon="stash:arrow-right" @click="goForward" /></div>
          <div><Icon icon="stash:arrow-retry" @click="refresh" /></div>
          <!-- 私信 -->
          <div class="action-bar_btn" @click="goToMessage">
            <Icon icon="lets-icons:message" />
            <span>私信</span>
          </div>  
          <!-- 评论 -->
          <div class="action-bar_btn" @click="goToComment">
            <Icon icon="ant-design:comment-outlined" />
            <span>评论</span>
          </div>
        </div>
        <div class="action-bar_url">
          <p>{{ currentTab.url }}</p>
          <div><Icon icon="stash:copy" @click="copy(currentTab.url)" /></div>
        </div>
      </div>
      <div ref="webRef" v-show="!showAccountManagement" style="flex: 1;"></div>

      <!-- 账号管理区域 -->
      <AccountManagement v-if="showAccountManagement" style="flex: 1;" />
    </div>

    <!-- Python代码显示弹框 -->
    <el-dialog
      v-model="showPythonDialog"
      title="微信公众号登录代码"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="python-code-container">
        <pre><code>{{ pythonCode }}</code></pre>
      </div>
      <template #footer>
        <el-button @click="showPythonDialog = false">关闭</el-button>
        <el-button type="primary" @click="copyPythonCode">复制代码</el-button>
      </template>
    </el-dialog>

    <!-- 二维码登录弹框 -->
    <el-dialog
      v-model="showQRCodeDialogVisible"
      title="微信公众号登录（可连续添加多个账号）"
      width="500px"
      :close-on-click-modal="false"
      @close="handleQRCodeDialogClose"
    >
      <div class="qrcode-container">
        <div v-if="qrcodeImageUrl" class="qrcode-image-wrapper">
          <img :src="qrcodeImageUrl" alt="二维码" class="qrcode-image" />
          <div v-if="scanScanned" class="qrcode-scanned-mask">
            <div class="qrcode-scanned-icon">✓</div>
            <p class="qrcode-scanned-text">扫码成功</p>
            <p class="qrcode-scanned-hint">请在手机上确认登录</p>
          </div>
        </div>
        <div v-else class="qrcode-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
        <div class="scan-status" :style="{ color: scanStatusColor }">
          {{ scanStatus }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onActivated, ref, onDeactivated, onBeforeUnmount, watch, computed, provide, toRefs, h } from 'vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getToken } from "@/utils/auth";
import store from '@/store'
import {
  removeAccountSession, refreshAccountSession
} from '@/api/account'
import { listPlatform } from '@/api/platform'
import { useAccountStore } from '@/store/piniaStore';
import AccountList from '@/components/accountList.vue'
import AccountManagement from './account-management.vue'

const { all_accounts } = toRefs(store.getters);

const AccountListRef = ref()
const route = useRoute()

// 提供刷新 AccountList 的方法给子组件
provide('refreshAccountList',async () => {
  if (AccountListRef.value) {
    // 同时刷新分组列表
    await AccountListRef.value.loadAccountGroups()
    AccountListRef.value.getList()
  }
})

const tabs = ref([])
const currentTabId = ref(0)
const currentTab = ref({})
const elTabsRef = ref({})
const webRef = ref({})
const isDebugRef = ref(window.envVars.is_debug)
const selected_account_id = ref(0)
const accounts_mapping_tabs = ref([])
const showAccountManagement = ref(true)
const showPythonDialog = ref(false)
const showQRCodeDialogVisible = ref(false)
const qrcodeImageUrl = ref('')
const scanStatus = ref('等待扫码...')
const scanStatusColor = ref('#666')
const scanScanned = ref(false)
const pythonCode = ref(`# -*- coding: utf-8 -*-
"""
-------------------------------------------------
   File Name：     公众号登录
   Description :   
   Author :        Xiaoxing
   date：          2026/2/6  14:00:50
-------------------------------------------------
"""
import requests
import time

def login_mp():
    # 创建一个 session 对象，用于保持 cookies 和其他上下文
    session = requests.Session()

    api_url = "https://mp.weixin.qq.com/cgi-bin/bizlogin"

    # action=prelogin&fingerprint=64f379b133f5d29df7b2d4d72faf8812&token=&lang=zh_CN&f=json&ajax=1
    post_data = {
        "action": "prelogin",
        "fingerprint": "64f379b133f5d29df7b2d4d72faf8812",
        "token": "",
        "lang": "zh_CN",
        "f": "json",
        "ajax": 1
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        "Referer": "https://mp.weixin.qq.com"
    }
    # 发送 POST 请求，session 会自动处理 cookies
    response = session.post(api_url, data=post_data, headers=headers)
    result = response.json()
    print(result)

    api_url2 = "https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin"

    #userlang=zh_CN&redirect_url=&login_type=3&sessionid=177035784965959&fingerprint=64f379b133f5d29df7b2d4d72faf8812&token=&lang=zh_CN&f=json&ajax=1
    post_data2 = {
        "userlang": "zh_CN",
        "redirect_url": "",
        "login_type": 3,
        "sessionid": int(time.time() * 1000),
        "fingerprint": "64f379b133f5d29df7b2d4d72faf8812",
        "token": "",
        "lang": "zh_CN",
        "f": "json",
        "ajax": 1
    }
    response2 = session.post(api_url2, data=post_data2, headers=headers)

    result2 = response2.json()
    print(result2)

    qrcoe_url = "https://mp.weixin.qq.com/cgi-bin/scanloginqrcode"
    #?action=getqrcode&random=1770358465250&login_appid=
    params = {
        "action": "getqrcode",
        "random": int(time.time() * 1000),
        "login_appid": ""
    }
    qrcoe_content = session.get(qrcoe_url, params=params, headers=headers).content
    with open("qrcode.png", "wb") as f:
        f.write(qrcoe_content)
        print("二维码已保存到 qrcode.png")


    #从此处开始检测 无限循环请求
    for i in range(300):
        api_url3 = "https://mp.weixin.qq.com/cgi-bin/scanloginqrcode"
        # ?action=ask&fingerprint=64f379b133f5d29df7b2d4d72faf8812&token=&lang=zh_CN&f=json&ajax=1
        params = {
            "action": "ask",
            "fingerprint": "64f379b133f5d29df7b2d4d72faf8812",
            "token": "",
            "lang": "zh_CN",
            "f": "json",
            "ajax": 1
        }
        response3 = session.get(api_url3, params=params, headers=headers)

        result3 = response3.json()
        print(result3)

        # 判断是否扫码成功
        if result3["status"] == 1 and result3["user_category"] >= 2:
            print("扫码成功")
            break
        time.sleep(1)

    #{'acct_size': 0, 'base_resp': {'err_msg': 'ok', 'ret': 0}, 'binduin': 0, 'status': 0, 'user_category': 0}
    # 检测是否扫码成功
    #status=0   表示未扫码或未授权   status=4 表示已扫码 等待确认   status=6 表示 正在输入密码 status=1 表示扫码成功
    #user_category=3  表示  运营者登录  user_category=2 表示管理员登录 user_category=4 表示临时运营者扫码登录  user_category=1表示发送给管理员授权登录
    #acct_size  表示 当前微信有几个公众号可以登录

if __name__ == '__main__':
    login_mp()
`)

const handleFilter = () => {
  return AccountListRef.value.getList()
}

const platform_list = ref([])

/** 根据传递过来的平台参数，打开对应的窗口 */
const handleAddMPAccount = (platform) => {
  // 如果是微信公众号，使用 wechat.js 的登录逻辑，但在弹框中显示
  if (platform.id === 4) {
    loginWechatMPWithDialog()
  } else {
    // 其他平台保持原有逻辑
    window.ipcRenderer.send('toMain', {
      tag: 'addAccount',
      token: getToken(),
      ...platform,
      session_id: null
    })
  }
}

/** 微信公众号登录 - 使用 wechat.js 的登录逻辑，在弹框中显示 */
const loginWechatMPWithDialog = async () => {
  // 重置状态
  qrcodeImageUrl.value = ''
  scanStatus.value = '正在初始化...'
  scanStatusColor.value = '#666'
  
  // 显示弹框
  showQRCodeDialogVisible.value = true
  
  // 等待弹框渲染完成
  await nextTick()
  
  // 通知主进程创建登录视图（使用 wechat.js 的逻辑）
  window.ipcRenderer.send('toMain', {
    tag: 'wechat:createLoginViewInDialog',
    token: getToken()
  })
}

/** 旧的登录方法（使用 RPC）- 保留作为备用 */
const loginWechatMP = async () => {
  // 重置状态
  qrcodeImageUrl.value = ''
  scanStatus.value = '正在生成二维码...'
  scanStatusColor.value = '#666'
  
  // 显示弹框
  showQRCodeDialogVisible.value = true
  
  // 等待弹框渲染完成
  await nextTick()
  
  // 调用 RPC 获取二维码
  const fingerprint = '64f379b133f5d29df7b2d4d72faf8812'
  
  try {
    const result = await window.webBridge.callRpc('wechat:getQRCode', { fingerprint })
    
    if (result.success) {
      qrcodeImageUrl.value = result.qrcodeBase64
      scanStatus.value = '请使用微信扫描二维码登录'
      scanStatusColor.value = '#07c160'
      
      // 开始轮询检查扫码状态
      startCheckScanStatus(fingerprint)
    } else {
      scanStatus.value = '获取二维码失败: ' + result.error
      scanStatusColor.value = 'red'
    }
  } catch (error) {
    scanStatus.value = '获取二维码失败'
    scanStatusColor.value = 'red'
  }
}

let checkScanInterval = null

/** 开始轮询检查扫码状态 */
const startCheckScanStatus = (fingerprint) => {
  let checkCount = 0
  const maxChecks = 300 // 最多检查300次（5分钟）
  
  checkScanInterval = setInterval(async () => {
    checkCount++
    
    if (checkCount > maxChecks) {
      clearInterval(checkScanInterval)
      scanStatus.value = '二维码已过期，请重新登录'
      scanStatusColor.value = 'red'
      return
    }
    
    try {
      const result = await window.webBridge.callRpc('wechat:checkScan', { 
        fingerprint, 
        token: getToken() 
      })
      
      if (result.status === 4) {
        scanStatus.value = '已扫码，请在手机上确认登录'
        scanStatusColor.value = '#07c160'
      } else if (result.status === 6) {
        scanStatus.value = '正在输入密码...'
        scanStatusColor.value = '#07c160'
      } else if (result.status === 1 && result.user_category >= 2) {
        clearInterval(checkScanInterval)
        
        if (result.accountAdded) {
          scanStatus.value = '✅ 登录成功！'
          scanStatusColor.value = '#07c160'
          
          // 关闭弹框
          setTimeout(() => {
            showQRCodeDialogVisible.value = false
            
            ElNotification({
              type: 'success',
              title: '成功',
              message: '登录成功！'
            })
            
            // 刷新账号列表
            store.dispatch('ListAccounts').then(() => {
              handleFilter()
            })
          }, 1000)
        } else {
          scanStatus.value = '❌ 账号添加失败'
          scanStatusColor.value = 'red'
        }
      }
    } catch (error) {
      // 忽略错误，继续检查
    }
  }, 1000)
}

/** 关闭弹框时清理 */
const handleQRCodeDialogClose = () => {
  // 清除轮询
  if (checkScanInterval) {
    clearInterval(checkScanInterval)
    checkScanInterval = null
  }
  
  // 通知主进程清理倒计时定时器
  window.ipcRenderer.send('toMain', {
    tag: 'wechat:cleanupCountdown'
  })
  
  // 重置状态
  qrcodeImageUrl.value = ''
  scanStatus.value = '等待扫码...'
  scanStatusColor.value = '#666'
}

// 监听登录相关事件
if (window.ipcRenderer) {
  window.ipcRenderer.receive('fromMain', (data) => {
    // 兼容旧的字符串格式
    if (data === 'wechat-login-success') {
      console.log('收到登录成功消息（旧格式）')
      showQRCodeDialogVisible.value = false
      
      ElNotification({
        type: 'success',
        title: '成功',
        message: '登录成功！'
      })
      
      // 刷新账号列表
      store.dispatch('ListAccounts').then(() => {
        handleFilter()
      })
      return
    }
    
    // 处理新的对象格式消息
    if (typeof data === 'object' && data.tag) {
      switch (data.tag) {
        case 'wechat:qrcodeReady':
          // 收到二维码数据
          console.log('收到二维码数据')
          qrcodeImageUrl.value = data.data.qrcode
          scanScanned.value = false
          scanStatus.value = '请使用微信扫描二维码登录'
          scanStatusColor.value = '#07c160'
          break
          
        case 'wechat:statusUpdate':
          scanStatus.value = data.data.status
          
          // 已扫码等待确认时显示蒙版
          if (data.data.status.includes('已扫码') || data.data.status.includes('确认登录') || data.data.status.includes('输入密码')) {
            scanScanned.value = true
          }
          
          // 根据状态文本设置颜色
          if (data.data.status.includes('成功') || data.data.status.includes('✅')) {
            scanStatusColor.value = '#07c160'
          } else if (data.data.status.includes('失败') || data.data.status.includes('❌') || data.data.status.includes('过期')) {
            scanStatusColor.value = 'red'
          } else if (data.data.status.includes('扫码') || data.data.status.includes('确认') || data.data.status.includes('密码')) {
            scanStatusColor.value = '#07c160'
          } else {
            scanStatusColor.value = '#666'
          }
          break
          
        case 'wechat:loginSuccess':
          // 登录成功
          console.log('登录成功:', data.data)
          scanStatus.value = '✅ 登录成功！正在刷新二维码...'
          scanStatusColor.value = '#07c160'
          
          // 显示成功通知
          ElNotification({
            type: 'success',
            title: '成功',
            message: `${data.data.name} 登录成功！`
          })
          
          // 刷新账号列表
          store.dispatch('ListAccounts').then(() => {
            handleFilter()
          })
          
          // 刷新右侧当前标签页
          if (currentTabId.value) {
            setTimeout(() => {
              window.ipcRenderer.send('refresh-tab', currentTabId.value)
            }, 500)
          }
          
          // 不关闭弹框，等待新二维码
          // 清空当前二维码，显示加载状态
          setTimeout(() => {
            qrcodeImageUrl.value = ''
            scanScanned.value = false
            scanStatus.value = '正在生成新的二维码...'
            scanStatusColor.value = '#666'
          }, 1500)
          break
          
        case 'wechat:loginFailed':
          // 登录失败
          console.error('登录失败:', data.data.error)
          scanStatus.value = '❌ 登录失败: ' + data.data.error
          scanStatusColor.value = 'red'
          break
      }
    }
  })
}



/** 复制Python代码 */
const copyPythonCode = () => {
  navigator.clipboard.writeText(pythonCode.value)
    .then(() => {
      ElNotification({
        type: 'success',
        title: '成功',
        message: '代码已复制到剪贴板'
      })
    })
    .catch((err) => {
      console.error('复制失败:', err)
      ElNotification({
        type: 'error',
        title: '错误',
        message: '复制失败'
      })
    })
}

var account = useAccountStore()

const refresh = () => {
  console.log('refresh 被调用')
  window.ipcRenderer.send('refresh-tab', currentTabId.value)
}

// 任何弹框打开都需要盖住右侧 BrowserView（BrowserView 不受 z-index 影响）
const accountListOverlayVisible = ref(false)
const handleOverlayDialogVisible = (visible) => {
  accountListOverlayVisible.value = !!visible
}

const anyOverlayVisible = computed(
  () =>
    accountListOverlayVisible.value ||
    showPythonDialog.value ||
    showQRCodeDialogVisible.value
)

let browserViewRemovedByOverlay = false
watch(anyOverlayVisible, (visible) => {
  if (!window.ipcRenderer) return
  // 账号管理模式下本来就不显示 BrowserView，避免在此状态下误恢复
  if (showAccountManagement.value) return

  if (visible) {
    if (!browserViewRemovedByOverlay) {
      window.ipcRenderer.send('remove-tab')
      browserViewRemovedByOverlay = true
    }
  } else {
    if (browserViewRemovedByOverlay && currentTabId.value) {
      window.ipcRenderer.send('switch-tab', currentTabId.value)
      browserViewRemovedByOverlay = false
      nextTick(() => {
        throttleFunc()
      })
    } else {
      browserViewRemovedByOverlay = false
    }
  }
}, { flush: 'post' })
const goBack = () => {
  console.log('goBack 被调用')
  window.ipcRenderer.send('back-tab', currentTabId.value)
}
const goForward = () => {
  console.log('goForward 被调用')
  window.ipcRenderer.send('forward-tab', currentTabId.value)
}

/** 根据当前标签页URL判断所在平台 */
const getPlatformType = () => {
  const url = currentTab.value.url || ''
  
  // 使用正则表达式精确匹配各平台域名
  if (/https?:\/\/(mp\.)?weixin\.qq\.com/i.test(url)) {
    return 'wechat'
  } else if (/https?:\/\/([a-z0-9-]+\.)?douyin\.com/i.test(url)) {
    return 'douyin'
  } else if (/https?:\/\/([a-z0-9-]+\.)?xiaohongshu\.com/i.test(url)) {
    return 'xiaohongshu'
  } else if (/https?:\/\/([a-z0-9-]+\.)?kuaishou\.com/i.test(url)) {
    return 'kuaishou'
  } else if (/https?:\/\/([a-z0-9-]+\.)?bilibili\.com/i.test(url)) {
    return 'bilibili'
  }
  return 'unknown'
}

/** 提取URL中的token参数 */
const getTokenFromUrl = () => {
  try {
    const url = currentTab.value.url || ''
    const urlObj = new URL(url)
    return urlObj.searchParams.get('token') || ''
  } catch (e) {
    return ''
  }
}

/** 跳转到私信页面 */
const goToMessage = () => {
  console.log('goToMessage 被调用')
  console.log('currentTab:', currentTab.value)
  console.log('currentTab.url:', currentTab.value?.url)
  
  const platform = getPlatformType()
  console.log("platform:", platform)
  let url = ''
  
  switch(platform) {
    case 'wechat':
      const token = getTokenFromUrl()
      url = `https://mp.weixin.qq.com/cgi-bin/message?t=message/list&count=20&day=7&token=${token}&lang=zh_CN`
      break
    case 'douyin':
      url = 'https://creator.douyin.com/creator-micro/data/following/chat'
      break
    case 'xiaohongshu':
      url = 'https://sxt.xiaohongshu.com/im/login'
      break
    case 'kuaishou':
      ElNotification({
        type: 'info',
        title: '提示',
        message: '快手网页版暂无私信功能'
      })
      return
    case 'bilibili':
      url = 'https://message.bilibili.com/#/whisper'
      break
    default:
      ElNotification({
        type: 'warning',
        title: '提示',
        message: '当前平台不支持跳转到私信页面'
      })
      return
  }
  
  // 发送消息到主进程，加载新URL
  window.ipcRenderer.send('load-url', { tabId: currentTabId.value, url })
}

/** 跳转到评论页面 */
const goToComment = () => {
  console.log('goToComment 被调用')
  console.log('currentTab:', currentTab.value)
  console.log('currentTab.url:', currentTab.value?.url)
  
  const platform = getPlatformType()
  console.log("platform:", platform)
  let url = ''
  
  switch(platform) {
    case 'wechat':
      const token = getTokenFromUrl()
      url = `https://mp.weixin.qq.com/misc/appmsgcomment?action=list_latest_comment&begin=0&count=10&sendtype=MASSSEND&scene=1&token=${token}&lang=zh_CN`
      break
    case 'douyin':
      url = 'https://creator.douyin.com/creator-micro/interactive/comment'
      break
    case 'xiaohongshu':
      url = 'https://www.xiaohongshu.com/notification'
      break
    case 'kuaishou':
      url = 'https://cp.kuaishou.com/article/comment'
      break
    case 'bilibili':
      url = 'https://message.bilibili.com/#/reply'
      break
    default:
      ElNotification({
        type: 'warning',
        title: '提示',
        message: '当前平台不支持跳转到评论页面'
      })
      return
  }
  
  // 发送消息到主进程，加载新URL
  window.ipcRenderer.send('load-url', { tabId: currentTabId.value, url })
}
const copy = (text) => {
  navigator.clipboard.writeText(text)
    .then(function () {
      ElNotification({
        type: 'success',
        title: '成功',
        message: '复制成功'
      })
    })
    .catch(function (err) {
      console.error('Failed to copy text: ', err);
    });
}
// 关闭tab页
const removeTab = (tabId) => {
  window.ipcRenderer.send('close-tab', tabId)
}

// 切换tab页
const changeTab = (tabId) => {
  window.ipcRenderer.send('switch-tab', tabId)
}

/** 处理账号管理 */
const handleUserManagement = () => {
  // 隐藏所有 tabs 和 webview 区域，显示账号管理组件
  showAccountManagement.value = true
  // 移除当前的 BrowserView，防止遮盖账号管理页面
  window.ipcRenderer.send('remove-tab')
}

/** 添加新标签页 */
const addNewTab = (account) => {
  // 关闭账号管理视图，显示正常的 tab 视图
  const wasShowingManagement = showAccountManagement.value
  // 保存旧的选中账号ID用于判断
  const oldSelectedId = selected_account_id.value

  // 先更新选中的账号ID，再关闭账号管理模式，避免旧账号闪现
  selected_account_id.value = account.id
  showAccountManagement.value = false

  // 在所有标签页中获取到当前点击的标签的值
  const activeTab = tabs.value.find(item => item.account_id === account.id)
  if(activeTab){
    if(oldSelectedId === account.id && !wasShowingManagement) return
    window.ipcRenderer.send('switch-tab', activeTab.tabId)
    return
  }
  accounts_mapping_tabs.value.push({
    accountId: account.id,
    tabId: 0,
  })

  let a = Object.assign({ userToken: getToken() }, account)
  window.ipcRenderer.send('new-tab', a)
}
// 对函数进行 节流
function throttle(fn, delay = 1000) {
  let flag = true;
  return (...args) => {
    if (flag) {
      flag = false;
      fn(...args);
      setTimeout(() => {
        flag = true;
      }, delay);
    }
  };
}
// 被节流的函数 -- 节流限制： 每 1000 毫秒执行一次
const throttleFunc = throttle(() => {
  if (webRef.value) {
    const width = webRef.value.offsetWidth;
    const height = webRef.value.offsetHeight;
    var x = webRef.value.offsetLeft, y = webRef.value.offsetTop
    window.ipcRenderer.send('webBounds', {
      width,
      height, x, y
    })
  }
}, 200);

const getListPlatform = async () => {
  const { data } = await listPlatform({})
  if (data && data.data && Array.isArray(data.data.list)) {
    const platforms = data.data.list
    platform_list.value = platforms.map(item => ({
      id: item.platform_id,
      name: item.platform_name,
      image: item.platform_icon
    }))
  }
}

var cleanups=[]

onMounted(() => {
  getListPlatform()

  var c1=window.ipcRenderer.receive('account_check_login', async (isLoggedIn) => {
    if (!isLoggedIn) {
      removeTab(currentTabId.value)
    }
  })

  var c2=window.ipcRenderer.receive('remove-account-session', async (account_session_id) => {
    if (account_session_id) {
      await removeAccountSession({ account_session_id })
      store.dispatch('ListAccounts').then(() => {
        handleFilter();
      })
    }
  })

  var c3=window.ipcRenderer.receive('refresh-account-session', async (wechat_id, session_id) => {
    if (wechat_id && session_id) {
      await refreshAccountSession({ wechat_id, session_id })
      handleFilter();
    }
  })

  // 1.标签页数据 (tabs) 的获取
  var c4=window.ipcRenderer.receive(// 获取右侧账号列表数据
    'tabs-update',// 监听的事件名称，监听来自主进程的 tabs-update 消息，更新标签页数据
    (tabOptions) => {// 回调函数，参数为接收到的消息内容 // 参数：tabOptions，包含标签页配置信息。
      // 处理逻辑
      const time = new Date().valueOf()// 获取当前时间戳，用于标识标签页的创建时间。
      let oldlength = tabs.value.length;// 记录更新前 tabs 数组的长度，用于后续判断数组长度是否发生变化。
      // 更新tabs数组的内容
      tabs.value = Object.keys(tabOptions.confs).filter(id => tabOptions.confs[id] && tabOptions.confs[id].title).map(tabId => {
        const obj = { ...tabOptions.confs[tabId], tabId: parseInt(tabId), time }
        if (!obj.title) obj.title = '新标签页'
        return obj
      })

      // 遍历更新后的 tabs 数组。
      for (let a of tabs.value) {
        if (a.tabId == currentTabId.value) {
          currentTab.value = a
        }
      }

      // 如果 tabs 数组长度发生变化，获取 webRef 的尺寸并发送 webBounds 消息；否则，执行节流函数 throttleFunc。
      if (oldlength != tabs.value.length) {
        nextTick(() => {
          if (webRef.value) {
            const width = webRef.value.offsetWidth;
            const height = webRef.value.offsetHeight;
            var x = webRef.value.offsetLeft, y = webRef.value.offsetTop
            window.ipcRenderer.send('webBounds', {
              width,
              height, x, y
            })
          }
        })
      } else {
        nextTick(() => {
          throttleFunc();
        })
      }
    }
  )

  // 用户切换标签页时，主进程会发送 fromMain 消息，通知当前选中的标签页 ID。
  var c5=window.ipcRenderer.receive('fromMain', (data) => {
    if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'currentTabId')) {
      currentTabId.value = parseInt(data.currentTabId)
      for (let a of tabs.value) {
        if (a.tabId == currentTabId.value) {
          currentTab.value = a
        }
      }
      const new_mapping = accounts_mapping_tabs.value.find(v => v.tabId === 0)
      if (new_mapping) {
        new_mapping.tabId = currentTabId.value
      }
      for (let a of accounts_mapping_tabs.value) {
        if (a.tabId == currentTabId.value) {
          const account = all_accounts.value.list.find((item)=> item.id === a.accountId)
          selected_account_id.value = a.accountId
          store.commit('SET_CURRENT_ACCOUNT', account);
          break
        }
      }
    } else {
      if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
        const tag = msg.tag;
      }
      if (data === "login-success") {
        store.dispatch('ListAccounts').then((data) => {
          handleFilter();
          account.update(data.list)
        })
      }
    }
  })

  // 获取web的尺寸位置
  var c6=window.ipcRenderer.receive('getWebBounds', (data) => {
    nextTick(() => {
      if (webRef.value) {
        const width = webRef.value.offsetWidth;
        const height = webRef.value.offsetHeight;
        var x = webRef.value.offsetLeft, y = webRef.value.offsetTop
        window.ipcRenderer.send('webBounds', {
          width,
          height, x, y
        })
      }
    })
  })
  cleanups.push(c1,c2,c3,c4,c5,c6)
})

// 处理从账号管理页面跳转过来打开账号的逻辑
const handleOpenAccountFromRoute = () => {
  const openAccountId = route.query.open_account_id
  if (openAccountId) {
    // 查找对应的账号
    const targetAccount = store.state.accounts.list.find(
      account => account.id === parseInt(openAccountId)
    )
    if (targetAccount) {
      // 延迟一下确保组件已经准备好
      nextTick(() => {
        addNewTab(targetAccount)
        // 清除路由参数，避免重复触发
        window.history.replaceState({}, '', '#/tabbar')
      })
    }
  }
}

// onActivated(() => {
//   handleFilter();
//   nextTick(()=>changeTab(currentTabId.value))
// })

// 监听路由参数变化（用于在 tabBar 页面内部通过路由打开账号）
watch(() => route.query.open_account_id, (newAccountId) => {
  if (newAccountId && route.path === '/tabbar') {
    handleOpenAccountFromRoute()
  }
})
onBeforeUnmount(()=>{
  window.ipcRenderer.send('close-tab')
  while(cleanups.length){
    cleanups.pop()?.()
  }
})
onDeactivated(() => {
  window.ipcRenderer.send('remove-tab')
  // tabs.value = []
});
window.ipcRenderer.send('control-ready')
</script>

<style scoped>
.tab-pages{
  height: 45px;
  width: 100%;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
.tab-pages_tab{
  flex: 0 1 150px;
  height: 30px;
  border-radius: var(--jzl-border-radius-large);
  padding: 0px 10px;
  margin: 0 1px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: 0.3s;
  overflow: hidden;
}
.tab-pages_tab:hover{
  background-color: var(--jzl-hover-bg-color);
  cursor: pointer;
}
.tab-pages_title{
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #606266;
}
.tab-pages_clear{
  padding: 1px;
  border-radius: 50%;
  transition: 0.2s;
}
.tab-pages_clear:hover{
  background-color: var(--jzl-hover-bg-color-1);
  transform: scale(1.2);
}

.action-bar,
.action-bar_navigation,
.action-bar_url{
  display: flex;
  align-items: center;
}
.action-bar{
  background-color: #fff;
  padding: 6px 5px;
  border-bottom: 1px solid #eee;
}
.action-bar_navigation>div{
  font-size: 22px;
  border-radius: var(--jzl-border-radius-large);
  padding: 2px;
  transition: 0.2s;
}
.action-bar_navigation>div:hover{
  background-color: var(--jzl-hover-bg-color);
  cursor: pointer;
}
.action-bar_btn{
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px !important;
}
.action-bar_btn span{
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.action-bar_url{
  flex: 0 1 800px;
  padding: 2px 10px;
  background-color: var(--jzl-hover-bg-color);
  border-radius: var(--jzl-border-radius-large);
  font-size: 14px;
  user-select: none;
  margin-left: 10px;
  white-space: nowrap;
  justify-content: space-between;
}
.action-bar_url>p{
  flex: 1;
  width: 0px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.action-bar_url>div{
  padding: 2px;
  font-size: 22px;
}
.action-bar_url>div:hover{
  cursor: pointer;
}

.tab-control-wrap {
  width: 100%;
  background-color: #ededed;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  -webkit-app-region: drag;
}

.el-tabs--border-card>.el-tabs__header .el-tabs__item.is-active {
  color: #51ce94
}

.custom-tabs-label {
  position: relative;
}

.tab-title::after {
  content: "";
  background: linear-gradient(90deg,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      transparent,
      rgba(255, 255, 255, 0.8));
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.control-left {
  -webkit-app-region: no-drag;
}

::v-deep .el-tabs--border-card>.el-tabs__content {
  padding: 0px !important;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}

.python-code-container {
  max-height: 600px;
  overflow-y: auto;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.python-code-container pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.python-code-container code {
  font-family: inherit;
}

.qrcode-container {
  text-align: center;
  padding: 20px;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
}

.qrcode-loading .el-icon {
  font-size: 32px;
  color: #409eff;
}

.qrcode-loading p {
  font-size: 14px;
  color: #666;
}

.qrcode-tip {
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}

.qrcode-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.qrcode-scanned-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qrcode-scanned-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #07c160;
  color: #fff;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.qrcode-scanned-text {
  font-size: 18px;
  font-weight: 600;
  color: #07c160;
  margin: 0;
}

.qrcode-scanned-hint {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.qrcode-image {
  width: 300px;
  height: 300px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.scan-status {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
}
</style>
