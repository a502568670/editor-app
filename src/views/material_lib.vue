<template>
  <div class="w-full flex h-full bg-[#e9f9f1]">
    <div class="w-[200px] border-r shadow-md">
      <account-nav class="bg-red" :list="accountsRef" @account-filter="handleAccountFilter"
        @account-select="handleAccountSelect" />
    </div>
    <div class="flex-1 flex flex-col h-full">
      <div class="h-12 flex space-x-2 items-center pl-2 border-b mb-1 shadow-md">
        <div>草稿箱</div>
        <el-button @click="handleAppMsgRefresh" type="primary">
          <el-icon>
            <RefreshRight />
          </el-icon>
          <span class="ml-1">刷新</span>
        </el-button>
        <div class="flex-1"></div>
        <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white"
            v-model="queryRef" style="width: 100%;" placeholder="请输入账号关键词" />
          <el-icon style="cursor: pointer;" @click="handleAppMsgFilter">
            <Search />
          </el-icon>
        </div>
        <div></div>
      </div>
      <div class="flex-1 overflow-auto pt-5">
        <VueFlexWaterfall align-content="center" col="3" col-spacing="20" :breakByContainer="true">
          <div v-for="item in list" :key="item.appmsgid"
            class="w-[280px] bg-white border flex flex-col mb-5 rounded shadow"
            :style="{ minHeight: item.height + 'px' }">
            <div style="height:50px" class="flex items-center p-4 text-sm text-gray-400">
              <el-icon :size="16" class="flex justify-center">
                <Clock />
              </el-icon>
              <span class="ml-2">
                修改时间: {{
                  formatDate(item.update_time * 1000, 'yyyy-MM-dd HH:mm') }}
              </span>
            </div>
            <div v-for="(subitem, index) in item.multi_item" :key="subitem.msg_index_id"
              class="flex items-center px-4 py-2 w-full">
              <img v-if="subitem.cdn_url" :src="subitem.cdn_url" style="width:0px;height:0px;"
                referrerpolicy="no-referrer" />
              <div v-if="index === 0" :style="{ '--image-url': 'url(' + subitem.cdn_url + ')' }"
                class='w-full flex h-32 justify-between items-end bg-no-repeat bg-center bg-cover bg-[#e6e6e6] bg-[image:var(--image-url)]'>
                <div class="w-full h-[30px] flex text-white p-1 bg-gray-800 opacity-70 pl-2">{{ subitem.title }}</div>
              </div>
              <div class="w-full flex h-[75px] items-center"
                :class="{ 'border-b': index > 0 && index !== item.multi_item.length - 1 }" v-else>
                <div class="flex flex-col flex-1 h-full">
                  <div class="flex-1 h-2/3 w-full max-w-full max-h-2/3 overflow-y-hidden">
                    <!-- <el-icon v-if="subitem.item_show_type === 5" :size="20"
                      class="cursor-pointer flex justify-center items-end" title="视频文章">
                      <Video />
                    </el-icon> -->
                    {{ subitem.title }}
                  </div>
                  <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
                </div>
                <img v-if="subitem.cdn_url" class="w-16 h-16 rounded-sm" :src="subitem.cdn_url" />
              </div>
            </div>
            <div class=" bg-gray-200 h-10 flex justify-around items-center text-gray-500">
              <el-tooltip class="box-item" effect="dark" content="编辑" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center">
                  <PencilLine />
                </el-icon>
              </el-tooltip>
              <el-dropdown placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center focus:outline-none hover:outline-none" >
                  <SendHorizonal/>
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>群发</el-dropdown-item>
                    <el-dropdown-item>定时群发</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tooltip class="box-item" effect="dark" content="发送到其他账号" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center">
                  <Forward />
                </el-icon>
              </el-tooltip>
              <el-tooltip class="box-item" effect="dark" content="删除" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center" title="删除">
                  <Trash2 />
                </el-icon>
              </el-tooltip>
            </div>
          </div>
          <!-- <div class="w-[280px] border h-[300px]">ccc</div> -->
        </VueFlexWaterfall>
      </div>
    </div>
  </div>
</template>
<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}

:deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}
</style>
<script setup>
import { ref, toRefs, computed, reactive, onMounted, onActivated, onDeactivated } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import AccountNav from "@/components/AccountNav"
import { VueFlexWaterfall } from 'vue-flex-waterfall';
import WaterFall from "@/components/WaterFallItem"
import { getToken } from "@/utils/auth";
import { serializeCookie } from "@/utils/cookie"
import { formatDate } from "@/utils/date"
import { Clock, PencilLine, SendHorizonal, Forward, Trash2 } from 'lucide-vue-next';
import store from '@/store'

// 订阅
const channelCleans = {}
const channelName = 'fromMain'

const { all_accounts } = toRefs(store.getters)

const accountsRef = ref([])

const list = ref([]);
const queryRef = ref("")
const beginRef = ref(0)

const selectedAccountRef = ref(null)


const handleAccountFilter = (v) => {
  const filteredAccounts = all_accounts.value.list.filter(a => a.name.includes(v.query))
  // console.log("filteredAccounts=>", filteredAccounts)
  // accountsRef.value = await _listAccount({ page: accountPage, num: accountNum, keyword: v })
  accountsRef.value = filteredAccounts
}

const handleAccountSelect = async (account) => {
  selectedAccountRef.value = account
  await _listAppmsgsInDraftBox()
}

const handleAppMsgRefresh = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  await _listAppmsgsInDraftBox()
}

const handleAppMsgFilter = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  if (!queryRef.value) {
    ElMessage({
      message: `请输入搜索关键字`,
      type: 'warning',
      duration: 2 * 1000
    })
    return
  }
  await _listAppmsgsInDraftBox()
}


const _listAppmsgsInDraftBox = async () => {
  const { token, name, id, session_id } = selectedAccountRef.value
  // console.log("token=>", token)
  // console.log("id=>", id)
  // console.log("session_id=>", session_id)
  if (!token || !session_id) {
    ElMessageBox.alert(`当前账号session过期,请切换到*账号中心*重新登录`, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    return
  }
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:listAppmsgsInDraftBox',
    token: getToken(),
    wechat_id: id,
    listData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      query: queryRef.value,
      begin: beginRef.value,
      count: 10
    }
  })
}

onMounted(async () => {
  // handleAccountFilter({ query: "" })
})
onActivated(async () => {
  console.log("---onActivated material_lib----")

  channelCleans[channelName] = window.ipcRenderer.receive(channelName, (msg) => {
    console.log("material_lib ipcRenderer receive fromMain:", msg)
    if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
      const tag = msg.tag;
      if (tag === "appmsg-ret:listAppmsgsInDraftBox") {
        const { success, items, err_msg } = msg.data
        if (!success) {
          let message = err_msg === "invalid session" ? `当前账号session过期,请切换到*账号中心*重新登录` : err_msg
          ElMessageBox.alert(message, '错误', {
            confirmButtonText: '确定',
            type: 'error'
          }).then(() => {
            console.log("then")
          }).catch(() => {
            console.log("catch")
          })
          return
        }


        const transformed_items = items.map(it => ({
          ...it,
          height: (50 + (it.multi_item.length === 1 ? 115 : (115 + (it.multi_item.length - 1) * 75)) + 40),
        }))
        console.log("get items =>", items)
        console.log("get transformed_items =>", transformed_items)
        list.value = transformed_items

        //       {
        //   height: 300,
        //   background: 'red',
        //   image: '/images/works-publicity/tradition.png',
        //   text: '平面作品+李宇轩',
        // },
      }
    }
  })

  handleAccountFilter({ query: "" })
})

onDeactivated(async () => {
  console.log("---onDeactivated material_lib----")
  if (channelCleans[channelName]) {
    console.log(`cleanup channel ${channelName} for editor4`)
    channelCleans[channelName]()
  }

})



</script>
