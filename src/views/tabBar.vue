<template>
  <div style="display: flex;height: 100%">
    <div class="bg-white" style="width: 300px;display: flex;flex-direction: column;height: 100%;padding: 10px;">
      <el-row :gutter="10">
        <!-- <el-col :span="12">
          <select-platform v-model="listQuery.platform_id"></select-platform>
        </el-col>
        <el-col :span="12">
          <select-user v-model="listQuery.user_id"></select-user>
        </el-col> 
        <el-col :span="12" style="margin-top: 10px">
          <select-group v-model="listQuery.cate_id"></select-group>
        </el-col> -->
        <el-col :span="24" style="margin-top: 10px">
          <el-input v-model="listQuery.keyword" clearable style="width: 100%;" placeholder="请输入账号关键词" />
        </el-col>
        <el-col :span="24" style="padding-top: 10px;">
          <el-button style="width: 100%;background-color: #51ce94;border: none" type="primary"
            @click="handleFilter">搜索</el-button>
        </el-col>
      </el-row>

      <!--      左侧账号展示 账号列表数据 (accounts) 的获取-->
      <div style="flex: 1;overflow-y: auto;">
        <div @click="item.expired ? handleAddMPAccount(mp_platform):addNewTab(item)" v-for="item in accounts" :key="item.id"
          style="display: flex;align-items: center;padding: 5px; border-bottom: solid 1px #ccc;">
          <img style="width: 40px; height: 40px;border-radius: 50%" :src="item.avatar" />
          <div style="margin-left: 10px;flex: 1;">
            <div>{{ item.name }}</div>
            <div style="color: #51ce94">{{ item.platform_name + "(" + item.name + ")" }}</div>
          </div>
          <el-tooltip v-if="item.expired" content="登录过期">
            <el-icon class="mr-1" style="color:red"><WarnTriangleFilled/></el-icon>
          </el-tooltip>
          <el-popconfirm title="你是否要删除该公众号" @confirm="onDelMPAccount(item.wechat_id)" width="250">
            <template #reference>
              <el-icon @click.prevent.stop class=" cursor-pointer"><Delete/></el-icon>
            </template>
          </el-popconfirm>
        </div>
      </div>
      <el-row :gutter="10">
        <!-- <el-col :span="8" style="text-align: center">
          <el-button :disabled="listQuery.page <= 1" @click="prvePage">上一页</el-button>
        </el-col>
        <el-col :span="8" style="text-align: center;vertical-align: middle;">
          {{ listQuery.page }}/{{ accountTotalPage }}
        </el-col>
        <el-col :span="8" style="text-align: center">
          <el-button :disabled="accountTotalPage <= listQuery.page" @click="nextPage">下一页</el-button>
        </el-col> -->
        <el-col :span="24" style="padding-top: 10px;">
          <el-button style="width: 100%;background-color: #51ce94;border: none" type="primary"
            @click="handleAddMPAccount(mp_platform)">登录微信公众号</el-button>
        </el-col>
      </el-row>
    </div>
    <div style="flex: 1;display: flex;flex-direction: column;background-color: #e9f9f1;">


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
        <div v-if="isDebugRef" style="flex: 1;padding: 0 15px;width: 0;overflow: scroll;white-space: nowrap;">{{ currentTab.url }}</div>
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
import { nextTick, onMounted, onActivated, onUnmounted, ref, toRefs, onDeactivated } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {Delete,WarnTriangleFilled} from '@element-plus/icons-vue'
import { getToken } from "@/utils/auth";
import store from '@/store'
import {
  listAccount, createAccount, updateAccount, deleteAccount,
  removeAccountSession, refreshAccountSession
} from '@/api/account'
import { listPlatform } from '@/api/platform'
import { toDeepRaw } from "@/utils/convert"
import selectPlatform from "../components/selectPlatform";
import selectUser from "../components/selectUser";
// import selectGroup from "../components/selectGroup";
const { all_accounts } = toRefs(store.getters)

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
// const selectedAccount = ref(null)
// const selectedAccountLoginStatus = ref({})

const getList = () => {
  const query = listQuery.value.keyword
  console.log("query=>", query)
  console.log("all_accounts.value=>", all_accounts.value)
  const filteredAccounts = toDeepRaw(all_accounts.value.list.filter(a => a.name.includes(query)))

  accounts.value = filteredAccounts
  accountTotal.value = all_accounts.value.total
  accountTotalPage.value = parseInt(accountTotal.value / listQuery.value.num) + (accountTotal.value % listQuery.value.num > 0 ? 1 : 0)

  console.log("filteredAccounts=>", filteredAccounts)

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



const handleAddMPAccount = (item) => {
  console.log("handleAddMPAccount", item)
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
async function onDelMPAccount(id){
  await store.dispatch('DelAccount',id)
  getList()
  ElMessage({type:'success',message:'删除成功'})
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

// 1.添加新tab
const addNewTab = (account) => {
  console.log("currentTabId.value=>", currentTabId.value)
  let a = Object.assign({ userToken: getToken() }, account)
  console.log("a=>", a)
  // if (selectedAccount.value && selectedAccount.value.id === a.id) {
  //   console.log("已经选中>", a)
  // } else {
  //   selectedAccount.value = account
  // }
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
    var x=webRef.value.offsetLeft,y=webRef.value.offsetTop
    window.ipcRenderer.send('webBounds', {
      width,
      height,x,y
    })
  }
}, 200);
onMounted(() => {

  window.ipcRenderer.receive('account_check_login', async (isLoggedIn) => {
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

  window.ipcRenderer.receive('remove-account-session', async (account_session_id) => {
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

  window.ipcRenderer.receive('refresh-account-session', async (wechat_id, session_id) => {
    console.log("== refresh-account-session ==")
    console.log("param => ", wechat_id, session_id)
    if (wechat_id && session_id) {
      await refreshAccountSession({ wechat_id, session_id })
      handleFilter();
    }
  })
  // 1.标签页数据 (tabs) 的获取
  window.ipcRenderer.receive(// 获取右侧账号列表数据
    'tabs-update',// 监听的事件名称，监听来自主进程的 tabs-update 消息，更新标签页数据
    (tabOptions) => {// 回调函数，参数为接收到的消息内容 // 参数：tabOptions，包含标签页配置信息。
      console.log(tabOptions) //打印tabOptions 的内容，用于调试。
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
            var x=webRef.value.offsetLeft,y=webRef.value.offsetTop
            window.ipcRenderer.send('webBounds', {
              width,
              height,x,y
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
  window.ipcRenderer.receive('fromMain', (data) => {
    console.log("tabBar receive fromMain:", data)
    if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'currentTabId')) {
      currentTabId.value = parseInt(data.currentTabId)
      for (let a of tabs.value) {
        if (a.tabId == currentTabId.value) {
          currentTab.value = a
        }
      }
    } else {
      if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
        const tag = msg.tag;
        console.log("handleFilter in fromMain", tag)
      }
      if (data === "login-success") {
        console.log("==login-success==")
        store.dispatch('ListAccounts').then(() => {
          handleFilter();
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
  window.ipcRenderer.receive('getWebBounds', (data) => {
    nextTick(() => {
      if (webRef.value) {
        const width = webRef.value.offsetWidth;
        const height = webRef.value.offsetHeight;
        var x=webRef.value.offsetLeft,y=webRef.value.offsetTop
        window.ipcRenderer.send('webBounds', {
          width,
          height,x,y
        })
      }
    })
  })

  // 获取browserview内部

})

onActivated(() => {
  handleFilter();
})

onDeactivated(() => {
  console.log('组件卸载');
  window.ipcRenderer.send('close-tab')
  tabs.value = []
});
window.ipcRenderer.send('control-ready')
</script>

<style scoped>
.tab-control-wrap {
  width: 100%;
  /* height: 60px; */
  /* background-color: #e9f9f1; */
  background-color: #ccc;
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
</style>
