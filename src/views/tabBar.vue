<template>
  <div style="display: flex;height: 100%">
    <div class="bg-white" style="width: 250px;display: flex;flex-direction: column;height: 100%;padding: 10px;">
      <el-input v-model="listQuery.keyword" clearable placeholder="输入关键词" @input="handleInput" />

      <!-- 左侧账号展示 账号列表数据 (accounts) 的获取 -->
      <div style="flex: 1;overflow-y: auto;">
        <draggable v-model="accounts" class="list-group" ghost-class="ghost" :disabled="dragDisabled" handle=".handle"
          @start="handleDragStart" @end="handleDragEnd" item-key="id">
          <template #item="{ element }">
            <div @click="addNewTab(element)"
              class="hover:bg-zinc-100 group transition duration-500"
              style="display: flex;align-items: center;padding: 10px 5px;border-radius: var(--jzl-border-radius-large);margin-top: 10px;"
              :class="{
                '!bg-zinc-200': selected_account_id === element.id,
                'grayscale': element.expired
              }">
              <img style="width: 25px; height: 25px;border-radius: 50%" :src="element.avatar"
                :class="{ 'handle cursor-move': !dragDisabled }" />
              <div class="cursor-pointer pl-2 flex-1 flex items-center justify-around">
                <div class="truncate flex-1 w-0" :class="{ 'text-[var(--jzl-primary-color)]': selected_account_id === element.id }">{{ element.name }}</div>
                <img src="@/assets/image/gzh.png" style="width: 15px;height: 15px;">
              </div>
              <div class="items-center justify-center ml-1 hidden group-hover:flex">
                <el-popconfirm title="你是否要删除该公众号" @confirm="onDelMPAccount(element.wechat_id)"
                  placement="bottom-end">
                  <template #reference>
                    <el-icon style="color: brown;" @click.prevent.stop class=" cursor-pointer">
                      <Close />
                    </el-icon>
                  </template>
                </el-popconfirm>
              </div>

              <!-- <el-tooltip v-if="element.expired" content="登录过期">
                <el-icon class="mr-1" style="color:red">
                  <WarnTriangleFilled />
                </el-icon>
              </el-tooltip> -->
            </div>
          </template>
        </draggable>
      </div>
      <el-button style="width: 100%;" type="primary" @click="handleAddMPAccount(mp_platform)">
        登录微信公众号
      </el-button>
    </div>
    <div style="flex: 1;display: flex;flex-direction: column">
      <!--      右侧账号展示 当前打开的标签页列表  标签页数据 (tabs) 的获取-->
      <!--      通过 window.ipcRenderer.receive('tabs-update', ...) 监听来自主进程的消息更新。-->
      <div class="tab-control-wrap" v-show="tabs.length > 0">
        <div class="control-left" style="line-height: 0;">
          <el-tabs v-model="currentTabId" ref="elTabsRef" type="border-card" closable
            style="display: inline-block; max-width: calc(100vw - 300px)" :stretch="false" @tab-remove="removeTab"
            @tab-change="changeTab">
            <el-tab-pane v-for="item in tabs" :key="item.time" :label="item.title" :name="item.tabId"
              style="padding: 0px">
              <template #label>
                <span class="custom-tabs-label">
                  <span v-if="item.title.length > 9" :title="item.title" class="tab-title">{{ item.title.slice(0, 9)
                  }}</span>
                  <span v-else class="tab-title">{{ item.title }}</span>
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div v-show="isDebugRef && tabs.length > 0"
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
      <div ref="webRef" style="flex: 1;margin-top:2px;"></div>
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
import { nextTick, onMounted, onActivated, onUnmounted, ref, toRefs, onDeactivated, computed, toRaw, onBeforeUnmount } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Delete, WarnTriangleFilled,Close } from '@element-plus/icons-vue'
import { getToken } from "@/utils/auth";
import { debounceFn, dog, sortByOrder } from "@/utils/index"
import store from '@/store'
import {
  listAccount, createAccount, updateAccount, deleteAccount,
  removeAccountSession, refreshAccountSession
} from '@/api/account'
import draggable from "vuedraggable";
import { listPlatform } from '@/api/platform'
import { toDeepRaw } from "@/utils/convert"
import selectPlatform from "../components/selectPlatform";
import selectUser from "../components/selectUser";
import { useAccountStore } from '@/store/piniaStore';
// import selectGroup from "../components/selectGroup";
const { all_accounts, account_orders } = toRefs(store.getters)

const tabs = ref([])
const currentTabId = ref(0)
const currentTab = ref({})
const elTabsRef = ref({})
const webRef = ref({})
const isDebugRef = ref(window.envVars.is_debug)

const listQuery = ref({
  page: 1,
  num: 20,
  type: 1,
  keyword: ''
})
const accountTotal = ref(0)
const accountTotalPage = ref(0)
const accounts = ref([])
const selected_account_id = ref(0)
const accounts_mapping_tabs = ref([])
// const selectedAccount = ref(null)
// const selectedAccountLoginStatus = ref({})

// drag
const dragging = ref(false)
const dragDisabled = computed(() => listQuery.value.keyword.length > 0);

const getList = () => {
  const query = listQuery.value.keyword
  console.log("query=>", query)
  console.log("all_accounts.value=>", all_accounts.value)
  const filteredAccounts = toDeepRaw(all_accounts.value.list.filter(a => a.name.includes(query)))

  const not_sort = toDeepRaw(filteredAccounts)
  console.log("all_accounts=>", all_accounts)
  console.log("account_orders=>", account_orders.value)
  const { result: sorted } = sortByOrder(not_sort, toDeepRaw(account_orders.value))

  accounts.value = sorted
  accountTotal.value = all_accounts.value.total
  accountTotalPage.value = parseInt(accountTotal.value / listQuery.value.num) + (accountTotal.value % listQuery.value.num > 0 ? 1 : 0)

  // console.log("filteredAccounts=>", filteredAccounts)

  // return listAccount(listQuery.value).then(response => {
  //   accounts.value = response.data.data.list
  //   accountTotal.value = response.data.data.total
  //   accountTotalPage.value = parseInt(accountTotal.value / listQuery.value.num) + (accountTotal.value % listQuery.value.num > 0 ? 1 : 0)
  // }).catch(() => {
  // })
}

const nextPage = () => {
  listQuery.value.page = 1 + listQuery.value.page
  getList();
}
const prvePage = () => {
  listQuery.value.page = listQuery.value.page - 1
  getList();
}

const handleInput = debounceFn((query) => {
  listQuery.value.page = 1
  getList()
  // emitAccountEvents("accountFilter", { query })
}, 200, false)



const handleFilter = () => {
  listQuery.value.page = 1
  return getList();
}



const dialogAddAccountVisible = ref(false)
const platform_list = ref([])
const mp_platform = ref(null)
listPlatform({}).then(response => {
  if (response.data && response.data.data && Array.isArray(response.data.data.list)) {
    const platforms = response.data.data.list
    console.log("platforms=>", platforms)
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

const handleDragStart = (e) => {
  // console.log('handleDragStart:',e)
  dragging.value = true
}

const handleDragEnd = async (e) => {
  // console.log('handleDragEnd:',e)
  dragging.value = false
  const { oldIndex, newIndex } = e
  if (oldIndex != newIndex) {
    const oldId = accounts.value[newIndex].id
    const newId = accounts.value[oldIndex].id
    // store.dispatch('SWAPAccounts', { oldId, newId })
    const new_account_orders = accounts.value.map(v => v.id)
    // console.log('new_account_orders', new_account_orders)
    store.commit('SET_ACCOUNT_ORDERS', new_account_orders)
    localStorage.setItem("account_orders", new_account_orders)

  }
}

/** 弹出新窗口登录公众号 */
const handleAddMPAccount = (item) => {
  window.ipcRenderer.send('toMain', {
    tag: 'addAccount',
    token: getToken(),
    ...item,
    session_id: null // 确保每次创建新的 webview 时 session_id 为 null
  })
}


const openAddAccountDialog = () => {
  window.ipcRenderer.send('close-tab')  // 关闭当前标签页（如果需要）
  dialogAddAccountVisible.value = true //设置显示对话框close-tab
}

const handleAddAccount = (item, index) => {
  console.log("handleAddAccount", item, index)
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
  getList()
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

/** 添加新标签页 */
const addNewTab = (account) => {
  // 在所有标签页中获取到当前点击的标签的值
  const activeTab = tabs.value.find(item => item.account_id === account.id)
  if(activeTab){
    if(selected_account_id.value === account.id) return
    window.ipcRenderer.send('switch-tab', activeTab.tabId)
    return
  }
  selected_account_id.value = account.id
  accounts_mapping_tabs.value.push({
    accountId: account.id,
    tabId: 0,
  })

  let a = Object.assign({ userToken: getToken() }, account)
  console.log('打印添加标签页时传递给主进程的值',a)
  window.ipcRenderer.send('new-tab', a)
}

// 最小化窗口
const minimize = () => {
  window.ipcRenderer.send('toMain', 'minimiseWin')
}

// 最大化窗口
const maximize = () => {
  window.ipcRenderer.send('toMain', 'maximiseOrRestoreWin')
}

// 关闭窗口
const closeWindow = () => {
  window.ipcRenderer.send('toMain', 'closeWin')
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
    console.log("account_check_login isLoggedIn => ", isLoggedIn)
    // selectedAccountLoginStatus.value = { ...selectedAccountLoginStatus.value, [selectedAccount.value.id]: isLoggedIn }
    // console.log("selectedAccountLoginStatus.value  => ", selectedAccountLoginStatus.value)
    // if (selectedAccount.value.id && selectedAccountLoginStatus.value[selectedAccount.value.id] === false) {
    //   handleAddMPAccount(mp_platform.value)
    // }
    if (!isLoggedIn) {
      removeTab(currentTabId.value)
    } else {

    }
  })

  var c2=window.ipcRenderer.receive('remove-account-session', async (account_session_id) => {
    // console.log("account_session_id => ", account_session_id)
    if (account_session_id) {
      console.log("== remove-account-session ==")
      await removeAccountSession({ account_session_id })
      store.dispatch('ListAccounts').then(() => {
        handleFilter();
      })
      // handleFilter();
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
      console.log('tabs-update',tabOptions) //打印tabOptions 的内容，用于调试。
      // 处理逻辑
      const time = new Date().valueOf()// 获取当前时间戳，用于标识标签页的创建时间。
      let oldlength = tabs.value.length;// 记录更新前 tabs 数组的长度，用于后续判断数组长度是否发生变化。
      // 更新tabs数组的内容
      tabs.value = Object.keys(tabOptions.confs).filter(id => tabOptions.confs[id] && tabOptions.confs[id].title).map(tabId => {
        const obj = { ...tabOptions.confs[tabId], tabId: parseInt(tabId), time }
        if (!obj.title) obj.title = '新标签页'
        return obj
      })
      //       tabs.value = ...：更新 tabs 数组的内容。
      // Object.keys(tabOptions.confs)：获取 tabOptions.confs 对象的所有键（即标签页 ID）。
      //     .filter(id => tabOptions.confs[id] && tabOptions.confs[id].title)：过滤出 tabOptions.confs 中有 title 属性的项。
      //     .map(tabId => { ... })：对过滤后的每个 tabId 进行映射处理：
      // const obj = { ...tabOptions.confs[tabId], tabId: parseInt(tabId), time }：创建一个新的对象，包含原始配置信息、解析后的 tabId（转为整数）和当前时间戳。
      // if (!obj.title) obj.title = '新标签页'：如果 obj 没有 title 属性，则设置默认标题为“新标签页”。
      // return obj：返回处理后的对象。

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
    console.log("tabBar receive fromMain:", data)
    if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'currentTabId')) {
      currentTabId.value = parseInt(data.currentTabId)
      for (let a of tabs.value) {
        if (a.tabId == currentTabId.value) {
          currentTab.value = a
        }
      }
      console.log("accounts_mapping_tabs=>", accounts_mapping_tabs.value)
      const new_mapping = accounts_mapping_tabs.value.find(v => v.tabId === 0)
      if (new_mapping) {
        new_mapping.tabId = currentTabId.value
      }
      for (let a of accounts_mapping_tabs.value) {
        console.log("a.tabId => ", a.tabId)
        console.log("currentTabId.value => ", currentTabId.value)
        console.log("a.accountId => ", a.accountId)
        if (a.tabId == currentTabId.value) {
          selected_account_id.value = a.accountId
          console.log("selected_account_id => ", selected_account_id.value)
          break
        }
      }
    } else {
      if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
        const tag = msg.tag;
        console.log("handleFilter in fromMain", tag)
      }
      if (data === "login-success") {
        console.log("==login-success==")
        store.dispatch('ListAccounts').then((data) => {
          handleFilter();
          account.update(data.list)
          // const selectAccountItem = accounts.value.find(v => v.id === selectedAccount.value?.id)
          // if (selectAccountItem) {
          //   console.log("selectAccountItem.token=>", selectAccountItem.token)
          //   console.log("selectedAccount.value.token=>", selectedAccount.value.token)
          //   addNewTab(selectAccountItem)
          // }
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
  // 获取browserview内部

})

onActivated(() => {
  handleFilter();
  nextTick(()=>changeTab(currentTabId.value))
})
onBeforeUnmount(()=>{
  window.ipcRenderer.send('close-tab')
  while(cleanups.length){
    cleanups.pop()?.()
  }
})
onDeactivated(() => {
  // console.log('组件卸载',toRaw(tabs.value));
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

/* .el-tabs--border-card {
  border: none;
} */

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
