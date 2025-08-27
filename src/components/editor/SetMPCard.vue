<template>
  <div>
    <el-dialog :close-on-click-modal="false" title="插入账号名片" v-model="dialogVisibleRef" width="800px">
      <div class="w-full h-[500px] flex flex-col items-center justify-center">
        <div class="w-1/2 h-12">
          <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white searchbox"
              v-model="queryRef" style="width: 100%;" placeholder="请输入要搜索的小程序名称/AppID/账号原始ID"
              @keypress.enter="handleSetQuery" />
            <el-icon style="cursor: pointer;" @click="handleSetQuery">
              <Search />
            </el-icon>
          </div>
        </div>
        <div class="flex-1 w-full p-5 overflow-auto">
          <ul v-if="mps.length > 0" class="w-full grid grid-cols-2 gap-4">
            <li class="" v-for="(mp, idx) in mps" :key="mp.fake_id" @click="sel_idx = idx">
              <div class="w-full h-full bg-slate-100 border rounded hover:border hover:border-green-400" :class="{'border-green-400': idx === sel_idx, 'border-transparent': idx !== sel_idx}">
                <div class="relative p-5 min-h-[50px] flex items-center justify-start space-x-2">
                  <img :src="mp.round_head_img" class="w-[50px] h-[50px] rounded">
                  <div class="flex flex-col items-start justify-start">
                    <strong :title="mp.nickname">{{ mp.nickname }}</strong>
                    <div class="text-[12px] text-[#999] w-[260px] text-ellipsis whitespace-nowrap overflow-hidden">{{ mp.signature
                      }}</div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="insertMiniApp" type="success">插入</el-button>
      </template>
    </el-dialog>
  </div>
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
}
</style>
<script setup>
import { ref } from 'vue'
import { QuestionFilled, Search } from '@element-plus/icons-vue'
const $emits = defineEmits(['search-mp'])
const dialogVisibleRef = ref(false)
const queryRef = ref('')
const mps = ref([])
const sel_idx = ref(-1)

function openDialog() {
  dialogVisibleRef.value = true
  queryRef.value = ""
  mps.value = []
  sel_idx.value = -1
}
function closeDialog() {
  dialogVisibleRef.value = false
}
function handleSetQuery() {
  $emits('search-mp', { query: queryRef.value })
}
function setMPs(val) {
  mps.value = val
}
defineExpose({
  openDialog,
  closeDialog,
  setMPs,
});

</script>
