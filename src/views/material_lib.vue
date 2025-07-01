<template>
  <div class="w-full flex h-full bg-[#e9f9f1]">
    <div class="w-[200px] border-r shadow-md">
      <account-nav :default-selected-index="selectedIndexRef" @account-select="handleAccountSelect" />
    </div>
    <div class="flex-1 flex flex-col h-full" v-loading="dataLoadingRef">
      <div class="h-12 flex space-x-2 items-center pl-2 border-b mb-1 shadow-md">
        <el-button @click="handleCreateNewMaterial" type="success">
          <el-icon>
            <Plus />
          </el-icon>
          <span class="ml-1">创建新素材</span>
        </el-button>
        <el-button v-if="materialTypeRef === 0" @click="handleSwitchToLocal">
          <el-icon>
            <Files />
          </el-icon>
          <span class="ml-1">本地素材</span>
        </el-button>
        <el-button v-if="materialTypeRef === 1" @click="handleSwitchToDraftBox">
          <el-icon>
            <Files />
          </el-icon>
          <span class="ml-1">返回草稿箱</span>
        </el-button>
      </div>
      <div v-if="selectedAccountRef !== null" class="h-10  flex space-x-2 items-center pl-2">
        <div class="text-gray-500">{{ materialTypeRef === 0 ? '草稿箱' : '本地素材' }}</div>
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
            v-model="queryRef" style="width: 100%;" placeholder="请输入账号关键词" @input="handleAppMsgFilterInput" />
          <el-icon style="cursor: pointer;" @click="handleAppMsgFilter">
            <Search />
          </el-icon>
        </div>
        <div></div>
      </div>
      <div v-scroll="onScroll" class="flex-1 overflow-auto pt-5">
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
                  formatDate(materialTypeRef === 0 ? item.update_time * 1000 : item.update_time, 'yyyy-MM-dd HH:mm') }}
              </span>
            </div>
            <div v-for="(subitem, index) in item.multi_item" :key="subitem.msg_index_id"
              class="flex items-center px-4 py-2 w-full">
              <div v-if="index === 0"
                class='w-full flex h-32 relative justify-between items-end bg-[#e6e6e6]'>
                <img v-if="subitem.cdn_url" class="w-full h-full  object-cover rounded-sm" :src="subitem.cdn_url" referrerpolicy="no-referrer"  />
                <div class="w-full h-[30px] absolute flex text-white p-1 bg-gray-800 opacity-70 pl-2 truncate">{{ subitem.title }}</div>
              </div>
              <div class="w-full flex h-[75px] items-center"
                :class="{ 'border-b': index > 0 && index !== item.multi_item.length - 1 }" v-else>
                <div class="flex flex-col flex-1 h-full">
                  <div class="flex-1 h-2/3 w-full max-w-full max-h-2/3 overflow-y-hidden ">
                    <!-- <el-icon v-if="subitem.item_show_type === 5" :size="20"
                      class="cursor-pointer flex justify-center items-end" title="视频文章">
                      <Video />
                    </el-icon> -->
                    {{ subitem.title }}
                  </div>
                  <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
                </div>
                <img v-if="subitem.cdn_url" class="w-16 h-16 rounded-sm" :src="subitem.cdn_url" referrerpolicy="no-referrer"  />
              </div>
            </div>
            <div class=" bg-gray-200 h-10 flex justify-around items-center text-gray-500">
              <el-tooltip class="box-item" effect="dark" content="编辑" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center" @click="handleAppmsgEdit(item)">
                  <PencilLine />
                </el-icon>
              </el-tooltip>
              <el-tooltip v-if="materialTypeRef === 0" class="box-item" effect="dark" content="发表" placement="bottom">
                <el-icon :size="24" class="cursor-pointer flex justify-center" @click="handleOpenPublish(item)">
                  <SendHorizonal />
                </el-icon>
              </el-tooltip>
              <el-tooltip v-if="materialTypeRef === 0" class="box-item" effect="dark" content="发送到其他账号"
                placement="bottom">
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
    :progressDesc="progressDescRef" :progressResult="progressResultRef"
    @dialog-closed="dialogOperateProgressVisbleRef = false" />
  <PublishAppMsgDialog :dialogVisible="dialogPublishVisbleRef" :processing="isPublishingRef"
    :selectedAccount="selectedAccountRef" :appmsgid="currentOperateAppMsgRef?.app_id" @publish="handlePublishToWechat"
    @dialog-closed="dialogPublishVisbleRef = false" />
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
import PublishAppMsgDialog from "@/dlgs/publishAppMsg"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { RefreshRight, Search, Select, Plus, Files } from '@element-plus/icons-vue'
import AccountNav from "@/components/AccountNav"
import { VueFlexWaterfall } from 'vue-flex-waterfall';
import { groupAppMsgs, listAppMsgs, saveAppMsg, deleteAppMsg, send_to_other_accounts_events } from "@/api/appmsg"
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
import { apperrmsg, wxretmsg } from '@/utils/constants';

// 订阅
const channelCleans = {}
const channelName = 'fromMain'
const channelSource = 'material_lib'

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
const currentOperateName = ref("")
const currentOperateAppMsgRef = ref(null)
const materialTypeRef = ref(0) // 0-草稿箱 1-本地素材

// appmsg同步到其他账号设置对话框
const dialogSyncToOtherAccountsVisibleRef = ref(false)
const timeoutSendToOneAccount = 30 * 1000;

// appmsg同步到其他账号进度对话框
const dialogOperateProgressVisbleRef = ref(false)
const percentRef = ref(0)
const progressDescRef = ref("")
const progressResultRef = ref(null)

// appmsg发表对话框
const dialogPublishVisbleRef = ref(false)
const isPublishingRef = ref(false)

const listMode = ref(0) // 0-refresh 1-append
const _listCount = 10
// const waterfallContainerRef = useTemplateRef('waterfall-container')
// const { x, y, isScrolling, arrivedState, directions } = useScroll(waterfallContainerRef)

const onScroll = debounceFn((state) => {
  console.log(state) // {x, y, isScrolling, arrivedState, directions}
  if (state.arrivedState.bottom) {
    const begin = list.value.length;
    console.log('到底了!',begin,file_cnt)
    var end=materialTypeRef.value === 0
      ? begin>=file_cnt.draft_count
      : begin < _listCount
    if (end) {
      console.log("未满一页")
      return
    }
    listMode.value = 1
    // await listAppMsgIds(account.id)
    materialTypeRef.value === 0 ?
      _listAppmsgsInDraftBox(begin) :
      _listAppmsgsInLocal(begin)
  }
}, 200, false)

const handleAccountSelect = async ({ account, index }) => {
  // console.log('all_accounts.value=>', all_accounts.value)
  console.log("---->", account, index)
  selectedAccountRef.value = account
  selectedIndexRef.value = index
  otherAccountsRef.value = toDeepRaw(all_accounts.value.list.filter(v => v.id !== account.id))
  listMode.value = 0
  if (materialTypeRef.value === 0) {
    await listAppMsgIds(account.id)
    await _listAppmsgsInDraftBox()
  } else {
    await _listAppmsgsInLocal()
  }
}

const handleAppMsgRefresh = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  listMode.value = 0
  console.log('materialTypeRef.value=>', materialTypeRef.value)
  if (materialTypeRef.value === 0) {
    await listAppMsgIds(selectedAccountRef.value.id)
    await _listAppmsgsInDraftBox()
  } else {
    await _listAppmsgsInLocal()
  }
}

const clearQuery = () => {
  queryRef.value = ""
}

const handleAppMsgFilter = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  // if (!queryRef.value) {
  //   ElMessage({
  //     message: `请输入搜索关键字`,
  //     type: 'warning',
  //     duration: 2 * 1000
  //   })
  //   return
  // }
  listMode.value = 0
  // await listAppMsgIds(account.id)
  // await _listAppmsgsInDraftBox()
  if (materialTypeRef.value === 0) {
    // await listAppMsgIds(account.id)
    await _listAppmsgsInDraftBox()
  } else {
    await _listAppmsgsInLocal()
  }
}

const handleAppMsgFilterInput = debounceFn(handleAppMsgFilter, 700, false)

const handleCreateNewMaterial = async () => {
  router.push({ path: '/editor3', query: { account_id: selectedAccountRef.value.id } })
}

const handleSwitchToLocal = async () => {
  materialTypeRef.value = 1
  clearQuery()
  await handleAppMsgRefresh()
}

const handleSwitchToDraftBox = async () => {
  materialTypeRef.value = 0
  clearQuery()
  await handleAppMsgRefresh()
}

const handleAppmsgEdit = async (appmsg) => {
  console.log("handleAppmsgEdit=>", appmsg, checkIsLocal(appmsg.app_id))
  currentOperateAppMsgRef.value = appmsg
  currentOperateName.value = "edit"
  if (!checkIsLocal(appmsg.app_id)) {
    console.warn("appmsg not exist local, sync..")
    await _getAppmsgInDraftBox(appmsg.app_id)
  } else {
    router.push({ path: '/editor3', query: { account_id: selectedAccountRef.value.id, appmsgid: appmsg.app_id, title: appmsg.title } })
  }
}

const handleOpenPublish = async (appmsg) => {
  console.log("handleOpenPublish=>", appmsg, checkIsLocal(appmsg.app_id), selectedAccountRef.value)
  currentOperateAppMsgRef.value = appmsg
  currentOperateName.value = "publish"
  if (!checkIsLocal(appmsg.app_id)) {
    console.warn("appmsg not exist local, sync..")
    await _getAppmsgInDraftBox(appmsg.app_id)
  } else {
    dialogPublishVisbleRef.value = true
  }
}

const handleSyncAppmsgToOtherAccounts = async (appmsg) => {
  console.log("--handleSyncAppmsgToOtherAccounts--", appmsg)
  currentOperateAppMsgRef.value = appmsg
  currentOperateName.value = "syncToOther"
  if (!checkIsLocal(appmsg.app_id)) {
    console.warn("appmsg not exist local, sync..")
    await _getAppmsgInDraftBox(appmsg.app_id)
  } else {
    dialogSyncToOtherAccountsVisibleRef.value = true
  }
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
    if (materialTypeRef.value === 0) {
      await listAppMsgIds(id)
      await _listAppmsgsInDraftBox()
    } else {
      await _listAppmsgsInLocal()
    }
    // await _listAppmsgsInDraftBox()
    dataLoadingRef.value = false
  }).catch(() => {
    console.log('取消removeAppMsg')
  })
}

const handlePublishToWechat = async ({ send_time, isFreePublish, hasNotify, reprint_info, list }) => {
  isPublishingRef.value = true
  console.log("current appmsg=>", currentOperateAppMsgRef.value)
  const appmsgid = currentOperateAppMsgRef.value.app_id
  const appmsg_item_count = currentOperateAppMsgRef.value.multi_item.length
  console.log("appmsg_item_count=>", appmsg_item_count)

  console.log("hasNotify=>", hasNotify)
  console.log("isFreePublish=>", isFreePublish)
  // console.log('is_release_publish_page=>', is_release_publish_page)
  console.log('send_time=>', send_time)
  console.log("reprint_info=>", reprint_info)
  console.log("list=>", list)
  console.log('appmsgid=>', appmsgid)

  // reuturn

  const { token, session_id, wechat_id } = selectedAccountRef.value
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:publishToWechat',
    source: channelSource,
    token: getToken(),
    wechat_id,
    publishData: {
      // mp_msgs: toDeepRaw(mp_msgsRef.value),
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      send_time,
      isFreePublish,
      hasNotify,
      // is_release_publish_page,
      list,
      reprint_info,
      appmsgid,
      appmsg_item_count
    }
  })

  // setTimeout(() => {
  //   isPublishingRef.value = false
  //   dialogPublishVisbleRef.value = false
  // }, 5 * 1000)
}

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
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
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
  const res = await groupAppMsgs({ wechat_id: account_id, only_show_group_key: 1, only_show_local: 0 })
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
    source: channelSource,
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

const _listAppmsgsInLocal = async (begin = 0, count = _listCount) => {
  if (!validateAccount()) {
    return
  }
  dataLoadingRef.value = true
  const { id } = selectedAccountRef.value
  const res = await listAppMsgs({ wechat_id: id, only_show_group_key: 0, only_show_local: 1, k: queryRef.value, begin, count })
  console.log("_listAppmsgsInLocal res=>", res)
  const items = res.data
  const transformed_items = items.map(it => ({
    ...it,
    app_id: it.appmsgid,
    height: (50 + (it.multi_item.length === 1 ? 115 : (115 + (it.multi_item.length - 1) * 75)) + 40),
  }))
  if (listMode.value === 0) {
    list.value = transformed_items
  } else {
    list.value.push(...transformed_items)
  }
  // elRef.value.updateOrder()
  dataLoadingRef.value = false
}

const _getAppmsgInDraftBox = async (appmsgid) => {
  if (!validateAccount()) {
    return
  }
  const { token, id, session_id } = selectedAccountRef.value
  dataLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:getAppmsgInDraftBox',
    source: channelSource,
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
    if (currentOperateName.value === "edit") {
      router.push({ path: '/editor3', query: { account_id: id, appmsgid: new_appmsgid, title } })
    } else if (currentOperateName.value === "publish") {
      dialogPublishVisbleRef.value = true
    } else if (currentOperateName.value === "syncToOther") {
      dialogSyncToOtherAccountsVisibleRef.value = true
    }
  }).catch((e) => {
    console.log('saveAppMsg catched e:', e)

    console.log("=========")
  })
  console.log("--save appmsg postData dataLoadingRef=>", dataLoadingRef.value)
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
  const { wechat_id } = selectedAccountRef.value
  let stepRet
  await send_to_other_accounts_events({
    source_wechat_id: wechat_id,
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
    } catch (e) {
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

var file_cnt;
const registerChannels = () => {
  channelCleans[channelName] = window.ipcRenderer.receive(channelName, (msg) => {
    console.log("material_lib ipcRenderer receive fromMain:", msg)
    if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
      const { source, ret } = msg.data
      if (source !== channelSource) {
        return
      }
      const tag = msg.tag;
      if (tag === "appmsg-ret:listAppmsgsInDraftBox") {
        const { success, items, err_msg } = ret
        if (!success) {
          let message = err_msg === "invalid session" ? apperrmsg.invalid_session : err_msg
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

        file_cnt=ret.file_cnt
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
        const { success, appmsg_info, err_msg } = ret
        if (!success) {
          let message = err_msg === "invalid session" ? apperrmsg.invalid_session : err_msg
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
        console.log("--appmsg-ret:getAppmsgInDraftBox dataLoadingRef=>", dataLoadingRef.value)
        syncRemoteToLocal(appmsg_info).finally(() => {
          dataLoadingRef.value = false
        })
      } else if (tag === "appmsg-ret:publishToWechat") {
        console.log("material_lib publishToWechatResult msg.data=>", msg.data)
        dialogPublishVisbleRef.value = false
        isPublishingRef.value = false
        const { source, ret } = msg.data
        if (source !== channelSource) {
          return
        }
        const { success, msg: retmsg,code } = ret
        if (success) {
          ElMessage({
            message: `发表成功`,
            type: 'success',
            duration: 2 * 1000
          })
        } else {
          if(wxretmsg[code]){
            ElMessage({type:'error',message:wxretmsg[code]})
            return
          }
          ElMessageBox.alert(`发表到微信出现错误:${retmsg}`, '错误', {
            confirmButtonText: '确定',
            type: 'error'
          }).catch(() => {
            console.log("publish receive catch")
          })
        }
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
