<template>
  <el-dialog :close-on-click-modal="false" :title="dialogTitle" v-model="dialogVisibleRef" width="800px">
    <div v-if="sel_idx < 0" class="w-full h-[500px] flex flex-col items-center justify-center">
      <div class="w-1/2 h-12">
        <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white searchbox"
            v-model="queryRef" style="width: 100%;" clearable placeholder="输入视频号搜索，可添加该账号动态、直播和活动"
            @keypress.enter="handleSetQuery" />
          <el-icon style="cursor: pointer;" @click="handleSetQuery">
            <Search />
          </el-icon>
        </div>
      </div>
      <div class="flex-1 w-full p-5 overflow-auto">
        <ul v-if="mpvs.length > 0" class="w-full grid grid-cols-2 gap-4">
          <li class=" cursor-pointer" v-for="(mpv, idx) in mpvs" :key="mpv.fakeid" @click="chooseMPV(idx)">
            <div class="w-full h-full bg-slate-100 border rounded hover:border hover:border-green-400"
              :class="{ 'border-green-400': idx === sel_idx, 'border-transparent': idx !== sel_idx }">
              <div class="relative p-5 min-h-[50px] flex items-center justify-start space-x-2">
                <img :src="mpv.head_url" class="w-[50px] h-[50px] rounded-full">
                <div class="flex flex-col items-start justify-start">
                  <div class="flex items-center justify-start">
                    <strong :title="mpv.nickname">{{ mpv.nickname }}</strong>
                  </div>
                  <div class="text-[12px] text-[#999] w-[260px] text-ellipsis whitespace-nowrap overflow-hidden">{{
                    mpv.signature
                  }}</div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="w-full h-[500px] flex flex-col items-center justify-center">
      <div class="h-12 w-full px-4 flex items-center justify-between">
        <div>
          <el-radio-group v-model="displayTypeRef" @change="changeDisplayType" >
            <el-radio value="video">视频</el-radio>
            <el-radio value="live">直播</el-radio>
            <el-radio v-if="false" value="event">活动</el-radio>
          </el-radio-group>
        </div>
        <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white searchbox"
            v-model="queryContentRef" style="width: 100%;" clearable placeholder="输入视频号内容"
            @keypress.enter="handleSetQueryContent" />
          <el-icon style="cursor: pointer;" @click="handleSetQueryContent">
            <Search />
          </el-icon>
        </div>
      </div>
      <div class="flex-1 w-full p-5 overflow-auto">
        <el-checkbox-group v-if="displayTypeRef == 'video' && mpv_videos.length > 0" v-model="sel_video_keys"
          style="height: 100%; line-height: normal; font-size: 20px">
          <ul class="w-full grid grid-cols-4 gap-4">
            <li v-for="video in mpv_videos" :key="video.nonce_id" @click="chooseMPVContent(video.nonce_id)">
              <el-card class="mini-tip-card rounded-[4px]">
                <div class="flex flex-col space-y-2">
                  <div v-if="video.media_num > 0" class="relative">
                    <img class="rounded-[4px] block w-full" :src="video.media[0].cover_url">
                    <i class="play-btn_primary"></i>
                    <el-checkbox v-if="sel_video_keys.includes(video.nonce_id)" label="" class="top-1 left-3 absolute w-8 h-8"
                      :value="video.nonce_id" />
                  </div>
                  <div class="pt-1 pb-2 px-1 text-[12px] w-full text-ellipsis whitespace-nowrap overflow-hidden">
                    {{ video.desc }}</div>
                </div>
              </el-card>
            </li>
          </ul>
        </el-checkbox-group>
        <el-checkbox-group v-if="displayTypeRef == 'live' && mpv_lives.length > 0" v-model="sel_live_keys"
          style="height: 100%; line-height: normal; font-size: 20px">
          <ul class="w-full grid grid-cols-2 gap-4">
            <!-- <li v-for="live in mpv_lives" :key="live.nonce_id" @click="chooseMPVContent(live.nonce_id)">
              <el-card class="mini-tip-card rounded-[4px]">
                <div class="flex flex-col space-y-2">
                  <div v-if="live.media_num > 0" class="relative">
                    <img class="rounded-[4px] block w-full" :src="live.media[0].cover_url">
                    <i class="play-btn_primary"></i>
                    <el-checkbox v-if="sel_live_keys.includes(live.nonce_id)" label="" class="top-1 left-3 absolute w-8 h-8"
                      :value="live.nonce_id" />
                  </div>
                  <div class="pt-1 pb-2 px-1 text-[12px] w-full text-ellipsis whitespace-nowrap overflow-hidden">
                    {{ live.desc }}</div>
                </div>
              </el-card>
            </li> -->
            <li v-for="live in mpv_lives" :key="live.notice_id" @click="chooseMPVContent(live.notice_id)">
              <div class="w-full h-full bg-slate-100 border rounded hover:border hover:border-green-400"
              :class="{ 'border-green-400': idx === sel_idx, 'border-transparent': idx !== sel_idx }">
              <div class="relative p-5 min-h-[50px] flex items-center justify-start space-x-2">
                <img :src="live.head_url" class="w-[50px] h-[50px] rounded-full">
                <div class="flex flex-col items-start justify-start">
                  <div class="flex items-center justify-start">
                    <strong :title="live.nickname">{{ live.nickname }}</strong>
                  </div>
                  <div class="text-[12px] text-[#999] w-[260px] text-ellipsis whitespace-nowrap overflow-hidden">{{
                    unixToymdhm(live.start_time)
                  }}</div>
                </div>
              </div>
              <div class="px-5 text-[12px] text-[#999] h-12 w-full">{{
                    live.introduction
                  }}</div>
            </div>
            </li>
          </ul>
        </el-checkbox-group>
        <el-checkbox-group v-if="displayTypeRef == 'selected' && sel_content_map_size > 0" v-model="sel_content_keys"
          style="height: 100%; line-height: normal; font-size: 20px">
          <ul class="w-full grid grid-cols-4 gap-4">
            <li v-for="[k, v] in sel_content_map.entries()" :key="k" @click="unChooseMPVContent(k)">
              <el-card class="mini-tip-card rounded-[4px]">
                <div class="flex flex-col space-y-2">
                  <div v-if="v.media_num > 0" class="relative">
                    <img class="rounded-[4px] block w-full" :src="v.media[0].cover_url">
                    <i class="play-btn_primary"></i>
                    <el-checkbox label="" class="top-1 left-3 absolute w-8 h-8"
                      :value="k" />
                  </div>
                  <div class="pt-1 pb-2 px-1 text-[12px] w-full text-ellipsis whitespace-nowrap overflow-hidden">
                    {{ v.desc }}</div>
                </div>
              </el-card>
            </li>
          </ul>
        </el-checkbox-group>
      </div>
    </div>
    <template #footer>
      <div v-if="displayTypeRef != 'account'" class="w-full flex items-center justify-center">
        <div class="w-2/5 text-left flex space-x-2  text-sm">
          <div @click="displayTypeRef = 'selected' " class="cursor-pointer">已选择 <span class="text-gray-400">{{ sel_content_map_size }}/10</span>条视频号内容</div>
          <div v-if="displayTypeRef == 'selected'" class="text-blue-500 cursor-pointer" @click="displayTypeRef = displayTypeContentRef">返回全部</div>
        </div>
        <div class="flex-1 flex items-center justify-start">
          <el-button @click="displayTypeRef = 'account'; sel_idx = -1">上一步</el-button>
          <el-button @click="insertMPVContent" type="success">插入</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<style scoped>
.searchbox :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}

.searchbox :deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}

:deep(.el-dialog__footer) {
  text-align: center !important;
  width: 100px;
}

.el-card {
  --el-card-footer-padding: 0px 0px;
  --el-card-padding: 0px !important;
}

.play-btn_primary {
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='64px' height='64px' viewBox='0 0 64 64' version='1.1'%3e%3ctitle%3ePlayBtn备份 6%3c/title%3e%3cg id='MP' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3e%3cg id='编辑器_添加视频号卡片备份' transform='translate(-904.000000, -723.000000)'%3e%3cg id=' PlayBtn_ExtraLarge' transform=' translate(904.000000, 723.000000)'%3e%3ccircle id=' 椭圆形' fill-opacity=' 0.15' fill=' %23000000' cx=' 32' cy=' 32' r=' 32'/%3e%3cpath d=' M32, 0 C49.673112, 0 64, 14.326888 64, 32 C64, 49.673112 49.673112, 64 32, 64 C14.326888, 64 0, 49.673112 0, 32 C0, 14.326888 14.326888, 0 32, 0 Z M32, 1.12 C14.9454469, 1.12 1.12, 14.9454469 1.12, 32 C1.12, 49.0545531 14.9454469, 62.88 32, 62.88 C49.0545531, 62.88 62.88, 49.0545531 62.88, 32 C62.88, 14.9454469 49.0545531, 1.12 32, 1.12 Z M25.6, 20.3570875 C25.8784431, 20.3570875 26.152066, 20.429752 26.3938223, 20.5678985 L43.9689192, 30.610811 C44.7361471, 31.0492269 45.0027019, 32.0265944 44.5642859, 32.7938223 C44.422543, 33.0418723 44.2169692, 33.2474461 43.9689192, 33.389189 L26.3938223, 43.4321015 C25.6265944, 43.8705175 24.6492269, 43.6039627 24.210811, 42.8367348 C24.0726645, 42.5949785 24, 42.3213556 24, 42.0429125 L24, 21.9570875 C24, 21.0734319 24.7163444, 20.3570875 25.6, 20.3570875 Z' id=' 形状结合' fill=' %23FFFFFF' fill-rule=' nonzero'/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/svg%3e");
  background-size: cover;
  width: 48px;
  height: 48px;
  vertical-align: middle;
  display: inline-block;
  position: absolute;
  cursor: default;
  margin: 0;
}
</style>
<script setup>
import { ref, computed, defineExpose, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled, Search } from '@element-plus/icons-vue'
import {unixToymdhm} from '@/utils/format'
const $emits = defineEmits(['search-mpv', 'insert-mpv-video', 'insert-mpv-live'])
const dialogVisibleRef = ref(false)
const dialogTitle = ref("插入视频号内容")
const displayTypeRef = ref('account') // account, video, live, event, selected
const displayTypeContentRef = ref('')

const queryRef = ref('')
const queryContentRef = ref('')
const mpvs = ref([])
const mpv_videos = ref([])
const mpv_lives = ref([])
const sel_idx = ref(-1)
const sel_video_keys = ref([])
const sel_live_keys = ref([])
const sel_content_keys = ref([])
const sel_content_map = ref(new Map())

const sel_content_map_size = computed(() => {
  return sel_content_map.value.size
})



function openDialog() {
  dialogVisibleRef.value = true
  dialogTitle.value = '插入视频号内容'
  displayTypeRef.value = 'account'
  displayTypeContentRef.value = ''
  queryRef.value = ""
  queryContentRef.value = ""
  mpvs.value = []
  sel_idx.value = -1
  mpv_videos.value = []
  mpv_lives.value = []
  sel_video_keys.value = []
  sel_live_keys.value = []
  sel_content_keys.value = []
  sel_content_map.value = new Map()
}
function closeDialog() {
  dialogVisibleRef.value = false
}
function handleSetQuery() {
  $emits('search-mpv', { type: displayTypeRef.value, query: queryRef.value })
}
function changeDisplayType(val) {
  console.log("bc:",val)
  chooseMPV(sel_idx.value)
  // $emits('search-mpv', { type: displayTypeRef.value, query: queryContentRef.value })
}
function setMPVs(type, val) {
  if (type === 'account') {
    mpvs.value = val
  } else if (type === 'video') {
    mpv_videos.value = val
  } else if (type === 'live') {
    mpv_lives.value = val
  } else if (type === 'event') {

  }
}
function chooseMPV(idx) {
  sel_idx.value = idx
  if (displayTypeRef.value === 'account') {
    if (displayTypeContentRef.value === '') {
      displayTypeContentRef.value = 'video'
    }
    displayTypeRef.value = displayTypeContentRef.value
  }
  $emits('search-mpv', { type: displayTypeRef.value, query: mpvs.value[sel_idx.value].username })
}
function handleSetQueryContent() {
  $emits('search-mpv', { type: displayTypeRef.value, query: queryContentRef.value })
}
function chooseMPVContent(key) {
  const keys = displayTypeRef.value === 'video' ? sel_video_keys.value : sel_live_keys.value
  if (keys.includes(key)) {
    if (displayTypeRef.value === 'video') {
      sel_video_keys.value = sel_video_keys.value.filter(item => item !== key)
    } else {
      sel_live_keys.value = sel_live_keys.value.filter(item => item !== key)
    }
    // keys.value = keys.value.filter(item => item.nonce_id !== key)
    sel_content_keys.value = [...sel_content_keys.value.filter(k => k !== key)]
    sel_content_map.value.delete(key)
  } else {
    keys.push(key)
    sel_content_keys.value.push(key)
    if (displayTypeRef.value === 'video') {
      sel_content_map.value.set(key, mpv_videos.value.find(item => item.nonce_id === key))
    } else {
      sel_content_map.value.set(key, mpv_lives.value.find(item => item.nonce_id === key))
    }
  }
}
function unChooseMPVContent(key) {
  sel_content_keys.value = [...sel_content_keys.value.filter(item => item !== key)]
  sel_content_map.value.delete(key)
  sel_video_keys.value = sel_video_keys.value.filter(k => k !== key)
  sel_live_keys.value = sel_live_keys.value.filter(k => k !== key)
}
defineExpose({
  openDialog,
  closeDialog,
  setMPVs,
});
</script>
