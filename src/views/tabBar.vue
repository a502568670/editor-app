<template>
  <div style="display: flex;height: 100%;width: 100%;">
    <AccountList
      ref="AccountListRef"
      :selectId="selected_account_id"
      :invalidWarn="false"
      :isManagementMode="showAccountManagement"
      @clickAccountTrigger="addNewTab"
      @addAccountTrigger="handleAddMPAccount"
      @userManagementTrigger="handleUserManagement"
    />
    <div class="flex flex-col flex-1 w-0">
      <el-tabs
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
      </el-tabs>
      <div v-show="isDebugRef && tabs.length > 0 && !showAccountManagement"
        style="height: auto;display: flex;align-items: center;justify-content: space-between;padding: 10px;background-color: #FFF;z-index: 1000">
        <div v-if="isDebugRef">
          <el-button @click="goBack">后退</el-button>
          <el-button @click="goForward">前进</el-button>
        </div>
        <div v-if="isDebugRef" style="flex: 1;padding: 0 15px;width: 0;overflow: scroll;white-space: nowrap;">{{
          currentTab.url }}</div>
        <div v-if="isDebugRef">
          <el-button @click="refresh()">刷新</el-button>
          <el-button @click="copy(currentTab.url)">复制链接</el-button>
        </div>
        <div v-if="!isDebugRef">&nbsp;</div>
      </div>
      <div ref="webRef" v-show="!showAccountManagement" style="flex: 1;"></div>
      
      <!-- 账号管理区域 -->
      <AccountManagement v-if="showAccountManagement" style="flex: 1;" />
    </div>
    <el-dialog :close-on-click-modal="false" title="选择添加账号的平台" v-model="dialogAddAccountVisible" width="800px">
      <el-row :gutter="10">
        <el-col :span="3" v-for="(item, index) in platform_list" :key="index" style="margin-bottom: 10px;">
          <div @click="handleAddAccount(item, index)"
            style="cursor:pointer;display: flex;flex-direction: column;align-items: center;justify-content: center;width: 100%;">
            <img style="height: 60px; margin-bottom: 5px;" :src="item.image" />
            <span>{{ item.name }}</span>
          </div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onActivated, ref, onDeactivated, onBeforeUnmount, watch, provide } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
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

const AccountListRef = ref()
const route = useRoute()

// 提供刷新 AccountList 的方法给子组件
provide('refreshAccountList', () => {
  if (AccountListRef.value) {
    AccountListRef.value.getList()
    // 同时刷新分组列表
    if (AccountListRef.value.loadAccountGroups) {
      AccountListRef.value.loadAccountGroups()
    }
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

const handleFilter = () => {
  return AccountListRef.value.getList()
}

const dialogAddAccountVisible = ref(false)
const platform_list = ref([])
const mp_platform = ref(null)
listPlatform({}).then(response => {
  if (response.data && response.data.data && Array.isArray(response.data.data.list)) {
    const platforms = response.data.data.list
    platform_list.value = platforms.filter(p => p.platform_name === "公众号").map(item => ({
      id: item.platform_id,
      name: item.platform_name,
      image: item.platform_icon
    }))
    mp_platform.value = platform_list.value[0]
  } else {
    console.error('Unexpected response structure:', response)
  }
}).catch(error => {
  console.error('Failed to fetch platform list:', error)
})

/** 弹出新窗口登录公众号 */
const handleAddMPAccount = (platform) => {
  if(platform.id === 4){
    window.ipcRenderer.send('toMain', {
      tag: 'addAccount',
      token: getToken(),
      ...mp_platform.value,
      session_id: null // 确保每次创建新的 webview 时 session_id 为 null
    })
  }
}

const handleAddAccount = (item, index) => {
  dialogAddAccountVisible.value = false
  if (index < 4) {
    window.ipcRenderer.send('toMain', {
      tag: 'addAccount',
      token: getToken(),
      ...item,
      session_id: null // 确保每次创建新的 webview 时 session_id 为 null
    })
  } else {
    ElNotification({
      type: 'error',
      title: '失败',
      message: '还未开通'
    })
  }
}
var account=useAccountStore()
async function onDelMPAccount(id) {
  await store.dispatch('DelAccount', id)
  account.update(account.list.filter(item => item.id !== id))
  AccountListRef.value.getList()
  ElMessage({ type: 'success', message: '删除成功' })
}
const refresh = () => {
  window.ipcRenderer.send('refresh-tab', currentTabId.value)
}
const goBack = () => {
  window.ipcRenderer.send('back-tab', currentTabId.value)
}
const goForward = () => {
  window.ipcRenderer.send('forward-tab', currentTabId.value)
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
var cleanups=[]
onMounted(() => {
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
    console.log("== refresh-account-session ==")
    console.log("param => ", wechat_id, session_id)
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
          selected_account_id.value = a.accountId
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

onActivated(() => {
  handleFilter();
})

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
</style>
