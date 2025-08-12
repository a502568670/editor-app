<template>
  <div class="flex w-ful h-full bg-[#e9f9f1] pt-1">
    <el-tabs v-show="editableTabs.length > 0" v-model="editableTabsValue" type="card" class="editor-tabs w-full h-full"
      closable @tab-remove="handleCloseTab">
      <el-tab-pane v-for="(item, idx) in editableTabs" :key="idx" :name="item.name" class="h-full">
        <template #label><i><img class="w-6 h-6 rounded-full mr-2" :src="item.icon" /></i> {{ item.title }}</template>
        <!-- <EditorTab :key="appmsgRef.appmsgid+''" :account="selectedAccountRef" :appmsg="appmsgRef" /> -->
        <component :key="item.tabKey" :is="EditorTab" :account="item.account" :appmsg="item.appmsg" :mode="item.mode"
          :mainMsg="item.mainMsg" @title-change="handleTitleChange" @create-appmsg="handleCreateAppMsg"
          @msgid-change="id => onMsgidChange(id, idx)"></component>
      </el-tab-pane>
    </el-tabs>
    <div v-show="editableTabs.length === 0" class="flex w-full h-full">
      <div class="w-[200px] border-r shadow-md">
        <account-nav :default-selected-index="selectedIndexRef" @account-select="handleAccountSelect" />
      </div>
      <div class="flex flex-1 justify-center items-center">
        <el-card style="width: 480px">
          <div class="flex flex-col w-full space-y-10">
            <div class="flex flex-col justify-center space-y-1">
              <div class="text-2xl font-bold text-center">强大的图文编辑功能</div>
              <div class="text-gray-400 text-center">给你的素材创造更多可能性</div>
            </div>
            <img src="@/assets/image/create_material.png" style="width: 100%" />
            <div class="flex justify-center items-center">
              <!-- <el-button @click="handleCreateAppMsg({ type: 0, account_id: selectedAccountRef?.id })" size="large"
                type="primary">
                <div class="w-[180px] py-5 ">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span class="ml-5 text-lg">创建素材</span>
                </div>
              </el-button> -->
              <div class="w-[180px] py-5 ">
                <el-dropdown>
                  <el-button type="primary" size="large" class="text-lg">
                    <el-icon>
                      <Plus />
                    </el-icon><span class="ml-5 text-lg">创建素材</span>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleCreateAppMsg({ type: 0, account_id: selectedAccountRef?.id })">创建图文素材</el-dropdown-item>
                      <el-dropdown-item @click="handleCreateAppMsg({ type: 0, account_id: selectedAccountRef?.id, item_show_type: 8 })">创建小绿书</el-dropdown-item>
                      <el-dropdown-item @click="handleCreateAppMsg({ type: 0, account_id: selectedAccountRef?.id, item_show_type: 5 })">创建视频素材</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
  <ChooseAccountDialog :dialogVisible="dialogChooseAccountVisibleRef"
    @dialog-closed="dialogChooseAccountVisibleRef = false" @account-choose="handleAccountChoose" />
</template>
<style>
.editor-tabs>.el-tabs__content {
  padding-top: 0px;
}

.editor-tabs>.el-tabs__header {
  margin-bottom: 1px;
}

.el-tabs__item {
  color: #ABABAB;
}
</style>
<script setup>
import { onActivated, onDeactivated, onMounted, ref, toRefs,provide, toRaw } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import EditorTab from "@/components/EditorTab"
import ChooseAccountDialog from "@/dlgs/chooseAccount"
import { Plus } from '@element-plus/icons-vue'
import { toDeepRaw } from "@/utils/convert"
import { v4 as uuidv4 } from 'uuid';
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import ImgPicker from '@/components/editor/ImgPicker.vue'
import GroupNotifySelect from '@/components/editor/GroupNotifySelect.vue'
import { useHydrateStore } from '@/store/piniaStore'
import { dog } from '@/utils'

const store = useStore()
const route = useRoute()

// 订阅
const channelCleans = {}
const channelName = 'fromMain'
const channelSource = 'editor3'

const { all_accounts } = toRefs(store.getters)

const selectedAccountRef = ref(null)
provide('selectedAccount', selectedAccountRef)
const selectedIndexRef = ref(0)

const dialogChooseAccountVisibleRef = ref(false)

let tabIndex = 0
const editableTabsValue = ref('')
const editableTabs = ref([])

onMounted(async () => {
  console.log("onMounted query params:", route.query)
})

onActivated(async () => {
  console.log("----onActivated editor3-----")
  registerChannels()
  const appmsgid = route.query.appmsgid
  const title = route.query.title
  const account_id = route.query.account_id
  console.log("query appmsgid:", appmsgid, typeof appmsgid)
  console.log("query account_id:", account_id, typeof account_id)
  console.log("all_accounts:", all_accounts.value)
  if (appmsgid && title && account_id) {
    const tab = editableTabs.value.find(v => v.account.id == account_id && v.name == `${appmsgid}`)
    if (!tab) {
      const appMsg = {
        appmsgid: parseInt(appmsgid),
        title: title,
        multi_item: []
      }
      const account = all_accounts.value.list.find(a => a.id === parseInt(account_id))
      console.log("account=>", account)
      if (account) {
        addTab(account, appMsg, { icon: account.avatar, mode: 'edit' })
      } else {
        console.log("not found account in account store=>")
      }
    } else {
      editableTabsValue.value = appmsgid
    }
  } else if (account_id) {
    handleCreateAppMsg({ type: 0, account_id: parseInt(account_id) })
  }
  if(history.state.dataFrom === 'hydrate') {
    dog("hydrate data:", history.state.data)
    var deepStr = JSON.stringify(history.state.data.list)
    for(var id of history.state.data.accounts) {
      tabIndex++
      var appmsg={
        appmsgid: -tabIndex-Date.now(),
        title: '合成素材'+tabIndex,
        multi_item: JSON.parse(deepStr),
      }
      var i = all_accounts.value.list.findIndex(a => a.id === id)
      if (i>-1) {
        selectedAccountRef.value = all_accounts.value.list[i]
        selectedIndexRef.value = i
    addTab(selectedAccountRef.value, appmsg, { icon: selectedAccountRef.value.avatar, mode: 'hydrate' })
      }
    }
    history.replaceState({}, '')
  } 
// console.log('route:',history.state);

})

onDeactivated(() => {
  console.log("---onDeactivated editor3----")
  if (channelCleans[channelName]) {
    console.log(`cleanup channel ${channelName} for editor3`)
    channelCleans[channelName]()
  }
})

const handleAccountSelect = async ({ account, index }) => {
  selectedAccountRef.value = account
  selectedIndexRef.value = index
}

// const formatTitleSuffix = (account_name) => {
//   return account_name ? `-<${account_name}>` : ""
// }
const handleCreateAppMsg = ({ type, account_id, item_show_type = 0 }) => {

  if (type === 0) {
    const new_appmsgid = 0 - (+new Date())
    const new_mp_msg = {
      msg_id: 0 - (+new Date()),
      item_show_type,
      title: `新标题${++tabIndex}`,
      author: "",
      copyright_type: 0,
      cdn_url: "",
      desc: "",
      need_open_comment: 1,
      only_fans_can_comment: 0,
      only_fans_days_can_comment: 0,
      sourceurl: "",
      insert_ad_mode: 2,
      can_insert_ad: 1,
      content_noencode: "",
    }
    const newAppMsg = {
      appmsgid: new_appmsgid,
      title: new_mp_msg.title,
      multi_item: [new_mp_msg]
    }

    let account
    if (account_id === selectedAccountRef.value.id) {
      console.log("account_id match selectedAccountRef")
      account = toDeepRaw(selectedAccountRef.value)
    } else {
      console.log("account_id need find from all_accounts")
      account = all_accounts.value.list.find(a => a.id === parseInt(account_id))
    }
    if (account) {
      addTab(account, newAppMsg, { icon: account.avatar, mode: 'create' })
    }
  } else {
    dialogChooseAccountVisibleRef.value = true
  }
}

const handleAccountChoose = ({ choosed }) => {
  choosed.forEach((acc) => {
    handleCreateAppMsg({ type: 0, account_id: acc.id })
  })
  dialogChooseAccountVisibleRef.value = false
}

const handleTitleChange = ({ appmsgid, title }) => {
  console.log("appmsgid=>", appmsgid)
  console.log("title=>", title)
  const idx = editableTabs.value.findIndex(v => v.name == appmsgid)
  if (idx !== -1) {
    // console.log("idx=>", idx, msg)
    // const split_str = '-<'
    // const arr =  editableTabs.value[idx].title.split(split_str)
    // console.log('arr=>', arr)
    // arr[0] = title 
    // editableTabs.value[idx].title = arr.join(split_str)
    editableTabs.value[idx].title = title
  }
}

const handleCloseTab = (targetName) => {
  if (parseInt(targetName) < 0) {
    ElMessageBox.confirm(
      '此操作将关闭未保存的素材, 是否关闭?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      removeTab(targetName)
    }).catch(() => {
      console.log('取消removeTab')
    })
  } else {
    removeTab(targetName)
  }
}

const addTab = (account, appmsg, { title, icon, mode }) => {
  const newTabName = `${appmsg.appmsgid}`
  const tabKey = uuidv4()
  editableTabs.value.push({
    title: title ? title : appmsg.title,
    icon: icon,
    name: newTabName,
    account,
    appmsg,
    mode,
    mainMsg: null,
    tabKey,
  })
  editableTabsValue.value = newTabName

}


const removeTab = (targetName) => {
  const tabs = editableTabs.value
  let activeName = editableTabsValue.value
  if (activeName === targetName) {
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1]
        if (nextTab) {
          activeName = nextTab.name
        }
      }
    })
  }

  editableTabsValue.value = activeName
  editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
}

const registerChannels = () => {
  channelCleans[channelName] = window.ipcRenderer.receive(channelName, (msg) => {
    console.log("editor3 ipcRenderer receive fromMain:", msg)
    const { source } = msg.data
    console.log("source=>", source, typeof source)
    if (source === channelSource) {
      // 本地的消息处理
      // if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
      //   const tag = msg.tag;
      //   if (tag === "xxx") {

      //   }
      // }
    } else {
      // tab内的消息处理
      const idx = editableTabs.value.findIndex(v => v.name == source)
      if (idx !== -1) {
        // console.log("idx=>", idx, msg)
        editableTabs.value[idx].mainMsg = msg
      }
    }
  })
}
function onMsgidChange(id, index) {
  editableTabsValue.value = id + ''
  editableTabs.value[index].name = id + '';
  editableTabs.value[index].mode = 'edit';
  editableTabs.value[index].appmsg.appmsgid = id;
  editableTabs.value[index].appmsg.multi_item[0].msg_id = id
}

</script>