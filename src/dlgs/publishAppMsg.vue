<template>
  <el-dialog :close-on-click-modal="false" @open="handleDialogOpen" @closed="handleDialogClosed"
    v-model="dialogVisibleRef" title="发表" width="800px">
    <div class="w-full flex flex-col">
      <div v-if="publishStepsRef.length > 2" class="w-full flex justify-center items-center">
        <el-steps class="w-full" :active="publishStepRef" finish-status="success">
          <el-step v-for="item in publishStepsRef" :key="item" :title="item" />
        </el-steps>
      </div>
      <div v-if="publishStepRef == 0" class="w-full flex flex-col space-y-2" v-loading="publishLoadingRef">
        <div class="w-full flex flex-col p-4 bg-[#F7F7F7] rounded">
          <div class="w-full flex">
            <div class="basis-1/2 flex justify-start items-center text-lg">群发通知</div>
            <div class="basis-1/2 flex justify-end items-center">
              <el-switch v-model="bulkSendingNotificationFlag" class="ml-2"
                :disabled="bulkSendingNotificationRemain == 0 ? true : false" style="--el-switch-on-color: #13ce66;" />
            </div>
          </div>
          <div class="text-[#cccccc]">今天还有{{ bulkSendingNotificationRemain }}次通知次数</div>
        </div>
        <div class="w-full flex flex-col p-4 bg-[#F7F7F7] rounded">
          <div class="w-full flex">
            <div class="basis-1/2 flex justify-start items-center text-lg">定时发表</div>
            <div class="basis-1/2 flex justify-end items-center">
              <el-switch v-model="publishTimingFlagRef" class="ml-2" style="--el-switch-on-color: #13ce66;" />
            </div>
          </div>
          <div v-if="publishTimingFlagRef" class="w-full flex space-x-2">
            <el-select v-model="selectedPublishTimingDateRef" class="grid-content-control" value-key="id" filterable
              placeholder="选择定时发布日期" @change="handleChangeForPublishTimingDate" style="width:100px">
              <el-option v-for="(item) in publishTimingDatesRef" :key="item.id" :label="item.name" :value="item" />
            </el-select>
            <el-time-picker v-model="publishTimeRef" format="HH:mm" :disabled-hours="disableHours"
              :disabled-minutes="disableMinutes" class="rounded-xl border-none" style="width:100px" />
          </div>
        </div>
      </div>
      <div v-if="publishStepsRef.length > 0 && publishStepRef == 1" class="flex flex-col space-y-2 pt-4">
        <div class="flex font-bold">
          共 {{ publishCopyright1ListRef.length }} 篇内容未通过原创校验逻辑，将按照下列方式进行发表，如有异议可申诉
        </div>
        <table class="w-full border shadow-lg">
          <thead class="text-lg bg-gray-200 text-gray-400">
            <tr>
              <th class="text-left p-4" style="width:80%">未通过原因</th>
              <th class="text-left p-4" style="width:20%">发表方式</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b h-[80px]" v-for="item in publishCopyright1ListRef" :key="item.source_idx">
              <td class="p-4">你的内容《{{ item.article_title }}》与原创内容《{{ item.source_title }}》相似度过高，将已分享方式发表</td>
              <td class="p-4">分享</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="publishStepsRef.length > 0 && publishStepRef == 2">
        <div class="flex font-bold">
          共 {{ publishCopyright1ListRef.length }} 篇内容未通过原创校验逻辑，将按照下列方式进行发表，如有异议可申诉
        </div>
        <table class="w-full border shadow-lg">
          <thead class="text-lg bg-gray-200 text-gray-400">
            <tr>
              <th class="text-left p-4" style="width:34%">待发表内容</th>
              <th class="text-left p-4" style="width:33%">发表方式</th>
              <th class="text-left p-4" style="width:33%">编辑寄语</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b h-[80px]" v-for="(item, idx) in publishCopyright1ListRef" :key="idx">
              <td class="p-4">你的内容《{{ item.article_title }}》与原创内容《{{ item.source_title }}》相似度过高，将已分享方式发表</td>
              <td class="p-4">分享</td>
              <td class="p-4">
                <div class="flex flex-col">
                  <textarea class="border bg-gray-300" rows="3" v-model="publishGuideWordsRef[idx]" maxlength="140" />
                  <span>{{ publishGuideWordsRef[idx]?.length ?? 0 }}/140</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisibleRef = false">取消</el-button>
        <el-button v-if="!instantPublishRef" @click="handleNext">继续</el-button>
        <el-button v-if="instantPublishRef" @click="handlePublish" type="primary" :disabled="publishLoadingRef">{{
          publishLoadingRef ? '发表中...' : '发表' }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { onActivated, onMounted, ref, toRefs, watch } from 'vue'
import { toDeepRaw } from "@/utils/convert"
import { getMpUserInfo, getLastPreviewAccounts, sendPreview, listVideos, getMasssendInfo, stat_appmsg_copyright_stat_events } from "@/api/mp_wechat"
import { createDateByDays, parseDate, formatDate } from "@/utils/date"
import { HOUSRS, MINUTES } from "@/utils/constants"
import { serializeCookie } from "@/utils/cookie"
import JSON5 from "json5"

const props = defineProps(['dialogVisible', 'processing', 'selectedAccount', 'appmsgid']);

const emitEvents = defineEmits(['dialogClosed', 'publish'])

const dialogVisibleRef = ref(false)


const publishStepRef = ref(0)
const publishStepsRef = ref([])
const publishTimeRef = ref(null)
const bulkSendingNotificationFlag = ref(false)
const bulkSendingNotificationRemain = ref(0)
const publishTimingDatesRef = ref([])
const selectedPublishTimingDateRef = ref(null)
const publishTimingFlagRef = ref(false)
const publishLoadingRef = ref(false)
const publishQuotaItemListRef = ref([])
const publishCopyright1ListJsonStrRef = ref("")
const publishCopyright1ListRef = ref([])
const publishGuideWordsRef = ref([])
const instantPublishRef = ref(false)

watch(() => [props.dialogVisible, props.processing], (newVal) => {
  console.log("publishAppMsg props.changed=>", newVal)
  dialogVisibleRef.value = newVal[0]
  publishLoadingRef.value = newVal[1]
})

const handleDialogOpen = async () => {
  const today = new Date()
  publishTimingDatesRef.value = Array.from({ length: 7 }, (_, i) => {
    if (i === 0) {
      return { name: "今天", id: today.toISOString().split('T')[0] }
    } else if (i === 1) {
      return { name: "明天", id: createDateByDays(today, 1).toISOString().split('T')[0] }
    } else {
      let theDate = createDateByDays(today, i)
      return { name: `${theDate.getMonth() + 1}月${theDate.getDate()}日`, id: theDate.toISOString().split('T')[0] }
    }
  });
  selectedPublishTimingDateRef.value = publishTimingDatesRef.value[0]
  publishTimeRef.value = +new Date() + 5 * 60 * 1000;
  const { token, session_id, name } = props.selectedAccount
  publishLoadingRef.value = true
  publishStepsRef.value = []
  publishCopyright1ListRef.value = []
  publishCopyright1ListJsonStrRef.value = ""
  publishGuideWordsRef.value = []
  publishStepRef.value = 0
  instantPublishRef.value = false
  const ret = await getMasssendInfo({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
  }).catch((e) => {
    console.log("getMasssendInfo catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
    publishLoadingRef.value = false
  })
  const item_kQuotaTypeMassSendNormal = ret.data.find(v => v.quota_type === 'kQuotaTypeMassSendNormal')
  if (!item_kQuotaTypeMassSendNormal) {
    return
  }
  publishQuotaItemListRef.value = item_kQuotaTypeMassSendNormal.quota_item_list

  // 检测发文限额
  checkQuota(today)

  //检测原创
}

const checkQuota = (date) => {
  const quota_item = publishQuotaItemListRef.value.find(v => v.str_date === formatDate(date, 'yyyyMMdd'))
  console.log("quota_item:", quota_item)
  if (!quota_item) {
    return
  }
  bulkSendingNotificationFlag.value = quota_item.quota > 0
  bulkSendingNotificationRemain.value = quota_item.quota
}

const disableHours = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishTimingDateRef.value.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const hour = date.getHours()
  // const minute = date.getMinutes()

  const idx = HOUSRS.findIndex(v => v === hour)
  return HOUSRS.slice(0, idx)
}

const disableMinutes = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishTimingDateRef.value.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const minute = date.getMinutes()
  // const minute = date.getMinutes()

  const idx = MINUTES.findIndex(v => v === minute)
  return MINUTES.slice(0, idx)
}

const handleChangeForPublishTimingDate = async (val) => {

console.log("emitChangeForPublishTimingDate val=>", val)

selectedPublishTimingDateRef.value = val
const todayStr = new Date().toISOString().split('T')[0]
if (todayStr === val.id) {
  // check 5 minutes
  publishTimeRef.value = +new Date() + 5 * 60 * 1000;
} else {
  publishTimeRef.value = +new Date(val.id + "T00:00");
}
// let currentDate = new Date(val.id)
checkQuota(new Date(val.id))
// publishTimingDatesRef.value = Array.from({ length: 7 }, (_, i) => {
//   if (i === 0) {
//     return { name: "今天", id: today.toISOString().split('T')[0] }
//   } else if (i === 1) {
//     return { name: "明天", id: createDateByDays(today, 1).toISOString().split('T')[0] }
//   } else {
//     let theDate = createDateByDays(today, i)
//     return { name: `${theDate.getMonth() + 1}月${theDate.getDate()}日`, id: theDate.toISOString().split('T')[0] }
//   }
// });
}

const handleNext = async () => {
  const appmsgid = props.appmsgid

  if (publishStepRef.value === 0) {
    const { token, session_id, name } = props.selectedAccount
    publishLoadingRef.value = true
    let stepRet
    await stat_appmsg_copyright_stat_events({
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      appmsgid,
    }, (data) => {
      console.log("step raw=>", data)
      try {
        const v = data.replaceAll(/data: /gi, "")
        stepRet = JSON5.parse(v)
      } catch {
        console.error("检测失败")
        publishStepRef.value = 0
      }
    })
    publishLoadingRef.value = false
    // console.log("step data=>", o)
    if (stepRet.copyright === 1) {
      // <el-step title="设置发表参数" />
      //   <el-step title="确认发表方式" />
      //   <el-step title="填写编辑推荐语" />
      //   <el-step title="最终发表" />
      publishCopyright1ListJsonStrRef.value = stepRet.list_json_str
      const copyright1_list = JSON.parse(stepRet.list_json_str)
      console.log("copyright1_list=>", copyright1_list)
      publishCopyright1ListRef.value = copyright1_list.list
      publishStepsRef.value = ["设置发表参数", "确认发表方式", "填写编辑推荐语"]
      publishStepRef.value = 1
    } else if (stepRet.copyright === 0) {
      // 不是原创 不经历 确认发表方式和填写编辑推荐语
      // instantPublishRef.value = true
      // 不是原创改成直接提交
      instantPublishRef.value = true

      await handlePublish()
    } else {
      ElMessageBox.alert('检测原创', '错误', {
        confirmButtonText: '确定',
        type: 'error'
      }).catch(() => { })
    }
  } else if (publishStepRef.value === 1) {
    publishStepRef.value = 2
    instantPublishRef.value = true
  }

}

const handlePublish = async () => {

  console.log("publishTimeRef.value", publishTimeRef.value, typeof publishTimeRef.value)
  const publishTime = new Date(publishTimeRef.value)
  const join_date_str = `${selectedPublishTimingDateRef.value.id} ${publishTime.getHours()}:${publishTime.getMinutes()}`
  console.log('join_date_str=>', join_date_str)
  const send_time = publishTimingFlagRef.value ? (+new Date(join_date_str)) / 1000 : 0
  const is_release_publish_page = bulkSendingNotificationFlag.value ? 0 : 1
  const isFreePublish = !bulkSendingNotificationFlag.value
  const hasNotify = bulkSendingNotificationFlag.value
  const reprint_info = publishCopyright1ListRef.value.length > 0 ? {
    item_list: publishCopyright1ListRef.value.map((_, i) => ({
      idx: i + 1,
      reprint_type: 'EN_REPRINT_TYPE_SHARE',
      guide_words: publishGuideWordsRef.value[i] ?? "",
    }))
  } : null
  const list = publishCopyright1ListJsonStrRef.value

  emitEvents("publish", { send_time, isFreePublish, hasNotify, reprint_info, list })
}


const handleDialogClosed = () => {
  emitEvents("dialogClosed")
}



</script>
