<template>
  <div class="w-full flex h-full bg-[#e9f9f1]">
    <div class="w-[200px] border-r shadow-md">
      <account-nav :default-selected-index="selectedIndexRef" @account-select="handleAccountSelect" />
    </div>
    <div class="flex-1 flex flex-col h-full">
      <div v-if="selectedAccountRef !== null" class="h-12 flex space-x-2 items-center pl-2 border-b mb-1 shadow-md">
        <div>草稿箱</div>
        <el-button @click="handleAppMsgRefresh" type="primary">
          <el-icon>
            <RefreshRight />
          </el-icon>
          <span class="ml-1">刷新</span>
        </el-button>
        <!-- <el-button @click="() => { elRef.updateOrder() }" type="primary">
          <el-icon>
            <RefreshRight />
          </el-icon>
          <span class="ml-1">重排</span>
        </el-button> -->
        <div class="flex-1"></div>
        <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white"
            v-model="queryRef" style="width: 100%;" placeholder="请输入账号关键词" />
          <el-icon style="cursor: pointer;" @click="handleAppMsgFilter">
            <Search />
          </el-icon>
        </div>
        <div></div>
      </div>
      <div v-scroll="onScroll" class="flex-1 overflow-auto pt-5" v-loading="dataLoadingRef">
        <VueFlexWaterfall ref="el" align-content="center" col="3" col-spacing="20" :breakByContainer="true">
          <div v-for="item in list" :key="item.app_id"
            class="w-[280px] bg-white border flex flex-col mb-5 rounded shadow relative"
            :style="{ minHeight: item.height + 'px' }">
            <div style="height:50px" class="flex items-center p-4 text-sm text-gray-400">
              <el-icon :size="16" class="flex justify-center">
                <Clock />
              </el-icon>
              <span class="ml-2">
                最新修改: {{
                  formatDate(item.update_time * 1000, 'yyyy-MM-dd HH:mm') }}
              </span>
            </div>
            <div v-for="(subitem, index) in item.multi_item" :key="subitem.msg_index_id"
              class="flex items-center px-4 py-2 w-full">
              <img v-if="subitem.cdn_url" :src="fmtImageUrl(subitem.cdn_url)" style="width:0px;height:0px;"
                referrerpolicy="no-referrer" />
              <div v-if="index === 0" :style="{ '--image-url': 'url(' + fmtImageUrl(subitem.cdn_url) + ')' }"
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
                <el-icon :size="24" class="cursor-pointer flex justify-center" @click="handleAppmsgEdit(item)">
                  <PencilLine />
                </el-icon>
              </el-tooltip>
              <el-dropdown placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center focus:outline-none hover:outline-none">
                  <SendHorizonal />
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>群发</el-dropdown-item>
                    <el-dropdown-item>定时群发</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tooltip class="box-item" effect="dark" content="发送到其他账号" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center"
                  @click="handleSyncAppmsgToOtherAccounts(item)">
                  <Forward />
                </el-icon>
              </el-tooltip>
              <el-tooltip class="box-item" effect="dark" content="删除" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center" title="删除"
                  @click="handleRemoveAppmsg(item)">
                  <Trash2 />
                </el-icon>
              </el-tooltip>
            </div>
            <div v-if="checkIsLocal(item.app_id)" class="absolute right-1 top-1 text-xs text-blue-400">
              <el-tooltip class="box-item" effect="dark" content="本地" placement="top">
                <el-icon :size="16" class="flex justify-center">
                  <MonitorDown />
                </el-icon>
              </el-tooltip>
            </div>
          </div>
        </VueFlexWaterfall>
      </div>
    </div>
  </div>
  <SyncToOtherAccountsDialog :dialogVisible="dialogSyncToOtherAccountsVisibleRef" :accounts="otherAccountsRef"
    @instant-send="handleInstantSend" @dialog-closed="dialogSyncToOtherAccountsVisibleRef = false" />
  <OperateProgressDialog :dialogVisible="dialogOperateProgressVisbleRef" :percent="percentRef"
    :progressDesc="progressDescRef" :progressResult="progressResultRef" @dialog-closed="dialogOperateProgressVisbleRef = false"  />
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
import { ref, toRefs, useTemplateRef, computed, nextTick, onMounted, onActivated, onDeactivated } from 'vue';
import { vScroll } from '@vueuse/components'
import SyncToOtherAccountsDialog from "@/dlgs/syncToOtherAccounts"
import OperateProgressDialog from "@/dlgs/operateProgress"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { RefreshRight, Search, Select } from '@element-plus/icons-vue'
import AccountNav from "@/components/AccountNav"
import { VueFlexWaterfall } from 'vue-flex-waterfall';
import { listAppMsgs, saveAppMsg, deleteAppMsg, send_to_other_accounts_events } from "@/api/appmsg"
import { getToken } from "@/utils/auth";
import { serializeCookie } from "@/utils/cookie"
import { fmtImageUrl } from "@/utils/format"
import { formatDate } from "@/utils/date"
import { getVideoFrameHtml } from "@/utils/video"
import { debounceFn } from "@/utils/index"
import { toDeepRaw } from "@/utils/convert"
import { Clock, PencilLine, SendHorizonal, Forward, Trash2, MonitorDown } from 'lucide-vue-next';
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import JSON5 from "json5"

// 订阅
const channelCleans = {}
const channelName = 'fromMain'

const store = useStore()
const { all_accounts } = toRefs(store.getters)
const router = useRouter();

const elRef = useTemplateRef('el')

const list = ref([]);
const localAppmsgsRef = ref([])
const queryRef = ref("")

const selectedAccountRef = ref(null)
const selectedIndexRef = ref(0)
const otherAccountsRef = ref([])
const dataLoadingRef = ref(false)
const dialogSyncToOtherAccountsVisibleRef = ref(false)
const timeoutSendToOneAccount = 30 * 1000;
const currentOperateAppMsgRef = ref(null)


const dialogOperateProgressVisbleRef = ref(false)
const percentRef = ref(0)
const progressDescRef = ref("")
const progressResultRef = ref(null)


const listMode = ref(0) // 0-refresh 1-append
const _listCount = 10
// const waterfallContainerRef = useTemplateRef('waterfall-container')
// const { x, y, isScrolling, arrivedState, directions } = useScroll(waterfallContainerRef)

const onScroll = debounceFn((state) => {
  console.log(state) // {x, y, isScrolling, arrivedState, directions}
  if (state.arrivedState.bottom) {
    console.log('到底了!')
    const begin = list.value.length;
    if (begin < _listCount) {
      console.log("未满一页")
      return
    }
    listMode.value = 1
    // await listAppMsgIds(account.id)
    _listAppmsgsInDraftBox(begin)
  }
}, 200, false)

const handleAccountSelect = async ({ account, index }) => {
  console.log('all_accounts.value=>', all_accounts.value)
  console.log("---->", account, index)
  selectedAccountRef.value = account
  selectedIndexRef.value = index
  otherAccountsRef.value = toDeepRaw(all_accounts.value.list.filter(v => v.id !== account.id))
  listMode.value = 0
  await listAppMsgIds(account.id)
  await _listAppmsgsInDraftBox()

}

const handleAppMsgRefresh = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  listMode.value = 0
  await listAppMsgIds(selectedAccountRef.value.id)
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
  listMode.value = 0
  // await listAppMsgIds(account.id)
  await _listAppmsgsInDraftBox()
}

const handleAppmsgEdit = async (appmsg) => {
  console.log("handleAppmsgEdit=>", appmsg, checkIsLocal(appmsg.app_id))
  currentOperateAppMsgRef.value = appmsg
  if (!checkIsLocal(appmsg.app_id)) {
    console.warn("appmsg not exist local, sync..")
    await _getAppmsgInDraftBox(appmsg.app_id)
  }
  router.push({ path: '/editor3', query: { account_id: selectedAccountRef.value.id, appmsgid: appmsg.app_id, title: appmsg.title } })
}

const handleSyncAppmsgToOtherAccounts = async (appmsg) => {
  console.log("--handleSyncAppmsgToOtherAccounts--", appmsg)
  currentOperateAppMsgRef.value = appmsg
  if (!checkIsLocal(appmsg.app_id)) {
    console.warn("appmsg not exist local, sync..")
    await _getAppmsgInDraftBox(appmsg.app_id)
  }
  dialogSyncToOtherAccountsVisibleRef.value = true
}

const handleInstantSend = async ({ otherAccountsChoosed }) => {
  console.log("--handleInstantSend--", otherAccountsChoosed)
  const appmsgid = currentOperateAppMsgRef.value.app_id
  await sendToOtherAccount(appmsgid, otherAccountsChoosed)
  // dialogSyncToOtherAccountsVisibleRef.value = false
}

const handleRemoveAppmsg = async (appmsg) => {
  const { id } = selectedAccountRef.value
  ElMessageBox.confirm(
    '此操作将从删除该素材, 是否继续?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    dataLoadingRef.value = true
    await removeAppMsg(appmsg.app_id)
    await listAppMsgIds(id)
    await _listAppmsgsInDraftBox()
    dataLoadingRef.value = false
  }).catch(() => {
    console.log('取消removeAppMsg')
  })
}

// const handleDialogClosed = () => {
//   console.log("--handleDialogClosed--")
//   dialogSyncToOtherAccountsVisibleRef.value = false
// }

const checkIsLocal = (remote_appmsgid) => {
  const idx = localAppmsgsRef.value.findIndex(v => v.appmsgid == remote_appmsgid)
  return idx !== -1
}

const validateAccount = () => {
  const { token, session_id } = selectedAccountRef.value
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
    return false
  }
  return true
}

const listAppMsgIds = async (account_id) => {
  const res = await listAppMsgs({ wechat_id: account_id, only_show_group_key: 0 })
  localAppmsgsRef.value = res.data;
}

// listMode 0-refresh 1-append
const _listAppmsgsInDraftBox = async (begin = 0, count = _listCount) => {
  if (!validateAccount()) {
    return
  }
  const { token, id, session_id } = selectedAccountRef.value
  dataLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:listAppmsgsInDraftBox',
    token: getToken(),
    wechat_id: id,
    listData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      query: queryRef.value,
      begin,
      count
    }
  })
  currentOperateAppMsgRef.value = null
}

const _getAppmsgInDraftBox = async (appmsgid) => {
  if (!validateAccount()) {
    return
  }
  const { token, id, session_id } = selectedAccountRef.value
  dataLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:getAppmsgInDraftBox',
    token: getToken(),
    wechat_id: id,
    getData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      appmsgid,
    }
  })
}

const syncRemoteToLocal = async (appmsg_info) => {
  const { token, id, session_id } = selectedAccountRef.value

  console.log("syncRemoteToLocal appmsg_info to local:", appmsg_info.item[0])
  const appmsgid = appmsg_info.item[0].app_id
  const material_list = appmsg_info.item[0].multi_item.map(mi => {
    const material_item = {
      msg_id: 0,
      item_show_type: mi.share_page_type,
      cdn_url: mi.cdn_url,
      title: mi.title,
      author: mi.author,
      copyright_type: mi.copyright_type,
      need_open_comment: mi.need_open_comment,
      only_fans_can_comment: mi.only_fans_can_comment,
      only_fans_days_can_comment: mi.only_fans_days_can_comment,
      sourceurl: mi.source_url,
      insert_ad_mode: mi.insert_ad_mode,
      can_insert_ad: mi.can_insert_ad,
      claim_source_type: mi.claim_source_type,
    }
    if (material_item.item_show_type === 0) {
      material_item.content_noencode = mi.content
    } else if (material_item.item_show_type === 5) {
      material_item.guide_words = mi.content
      material_item.vid = mi.mp_video_info[0].vid
      material_item.content_noencode = getVideoFrameHtml(material_item.vid, material_item.cdn_url)

    }
    return material_item
  })
  console.log("material_list:", material_list)

  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    material_list,
    wechat_id: id,
    remote_to_local: 1,
  }

  console.log("save appmsg postData=>", postData)
  await saveAppMsg(postData).then(async (res) => {
    await listAppMsgIds(id)
    const new_appmsgid = res.data.data.appmsgid
    const title = material_list[0].title
    router.push({ path: '/editor3', query: { account_id: id, appmsgid: new_appmsgid, title } })
  }).catch((e) => {
    console.log('saveAppMsg catched e:', e)

    console.log("=========")
  })
}

const sendToOtherAccount = async (appmsgid, otherAccountsChoosed) => {
  console.log("otherAccountsChoosed=>", otherAccountsChoosed)
  const timeoutSendToOtherAccounts = timeoutSendToOneAccount * otherAccountsChoosed.length
  dialogOperateProgressVisbleRef.value = true
  percentRef.value = 0
  progressDescRef.value = "开始处理"
  progressResultRef.value = null

  let timeoutId = setTimeout(() => {
    dialogOperateProgressVisbleRef.value = false
    timeoutId = -1
    ElMessageBox.alert('请求超时，请稍后再试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
  }, timeoutSendToOtherAccounts)

  let stepRet
  await send_to_other_accounts_events({
    soruce_appmsgid: appmsgid,
    target_wechat_ids: otherAccountsChoosed
  }, (data) => {
    // console.log("step raw=>", data)
    try {
      const v = data.replaceAll(/data: /gi, "")
      stepRet = JSON5.parse(v)
      // console.log("step data=>", v)
      percentRef.value = stepRet.percent
      progressDescRef.value = stepRet.desc
      // console.log("percentRef.value=>", percentRef.value)
      // console.log("progressDescRef.value=>", progressDescRef.value)
    } catch(e) {
      console.log("step data failed=>", e)
      percentRef.value = 0;
      progressDescRef.value = ""
    }
  })
  if (stepRet) {
    console.log("stepRet=>", stepRet)
    progressResultRef.value = stepRet.result
  }

  if (timeoutId !== -1) {
    clearTimeout(timeoutId)
  }
}

const removeAppMsg = async (appmsgid) => {
  const { token, name, id, session_id } = selectedAccountRef.value

  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
  }
  console.log("delete appmsg postData=>", postData)
  await deleteAppMsg(postData)

  ElMessage({
    message: `素材删除成功`,
    type: 'success',
    duration: 2 * 1000
  })
}

// onMounted(async () => {
//   // handleAccountFilter({ query: "" })
// })

const registerChannels = () => {
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
          dataLoadingRef.value = false
          return
        }

        const transformed_items = items.map(it => ({
          ...it,
          height: (50 + (it.multi_item.length === 1 ? 115 : (115 + (it.multi_item.length - 1) * 75)) + 40),
        }))
        // console.log("get items =>", items)
        // console.log("get transformed_items =>", transformed_items)
        if (listMode.value === 0) {
          list.value = transformed_items
        } else {
          list.value.push(...transformed_items)
        }
        // elRef.value.updateOrder()
        dataLoadingRef.value = false
        nextTick(() => {
          elRef.value && elRef.value.updateOrder()
        })
      } else if (tag === 'appmsg-ret:getAppmsgInDraftBox') {
        const { success, appmsg_info, err_msg } = msg.data
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
          dataLoadingRef.value = false
          return
        }
        syncRemoteToLocal(appmsg_info).finally(() => {
          dataLoadingRef.value = false
        })

      }
    }
  })
}

onActivated(async () => {
  console.log("---onActivated material_lib----")
  registerChannels()
})

onDeactivated(async () => {
  console.log("---onDeactivated material_lib----")
  if (channelCleans[channelName]) {
    console.log(`cleanup channel ${channelName} for editor4`)
    channelCleans[channelName]()
  }

})



</script>
