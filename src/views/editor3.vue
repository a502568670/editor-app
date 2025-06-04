<template>
  <div class="flex w-ful h-full bg-[#e9f9f1] pt-1">
    <el-tabs v-show="editableTabs.length > 0" v-model="editableTabsValue" type="card" class="editor-tabs w-full h-full"
      closable @tab-remove="removeTab">
      <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
        <!-- <EditorTab :key="appmsgRef.appmsgid+''" :account="selectedAccountRef" :appmsg="appmsgRef" /> -->
        <component :is="EditorTab" :account="item.account" :appmsg="item.appmsg" :mode="item.mode"></component>
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
              <el-button @click="handleCreateAppMsg" size="large" type="primary">
                <div class="w-[180px] py-5 ">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span class="ml-5 text-lg">创建素材</span>
                </div>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
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
import { onActivated, onMounted, ref, toRefs } from 'vue'
import EditorTab from "@/components/EditorTab"
import { Plus } from '@element-plus/icons-vue'
import { toDeepRaw } from "@/utils/convert"
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()
const route = useRoute()

const { all_accounts } = toRefs(store.getters)

const selectedAccountRef = ref(null)
const selectedIndexRef = ref(0)

let tabIndex = 0
const editableTabsValue = ref('')
const editableTabs = ref([
  // {
  //   title: 'Tab 1',
  //   name: '1',
  //   content: 'Tab 1 content',
  // },
  // {
  //   title: 'Tab 2',
  //   name: '2',
  //   content: 'Tab 2 content',
  // },
])

onMounted(async () => {
  console.log("onMounted query params:", route.query)
})
onActivated(async () => {
  console.log("onActivated query params:", route.query)
  const appmsgid = route.query.appmsgid
  const title = route.query.title
  const account_id = route.query.account_id
  console.log("query appmsgid:", appmsgid, typeof appmsgid)
  console.log("query account_id:", account_id, typeof account_id)
  console.log("all_accounts:", all_accounts.value)
  if (appmsgid && title && account_id) {
    const tab = editableTabs.value.find(v => v.title === title && v.name === `${appmsgid}`)
    if (!tab) {
      const appMsg = {
        appmsgid: parseInt(appmsgid),
        title: title,
        multi_item: []
      }
      const account = all_accounts.value.list.find(a => a.id === parseInt(account_id))
      console.log("account=>", account)
      if (account) {
        addTab(account, appMsg, 'edit')
      } else {
        console.log("not found account in account store=>")
      }
    }

  }

})

const handleAccountSelect = async ({ account, index }) => {
  selectedAccountRef.value = account
  selectedIndexRef.value = index
}

const handleCreateAppMsg = () => {
  const new_appmsgid = 0 - (+new Date())
  const new_mp_msg = {
    msg_id: 0 - (+new Date()),
    item_show_type: 0,
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
  const account = toDeepRaw(selectedAccountRef.value)
  addTab(account, newAppMsg, 'create')
}


const addTab = (account, appmsg, mode) => {
  const newTabName = `${appmsg.appmsgid}`
  editableTabs.value.push({
    title: appmsg.title,
    name: newTabName,
    account,
    appmsg,
    mode,
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

</script>