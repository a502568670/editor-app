<template>
  <div class="w-full h-[480px] flex flex-col items-center justify-center">
    <el-steps class="w-full h-[80px]" :space="300" :active="curStep" finish-status="success" align-center>
      <el-step title="1、选择小程序" />
      <el-step title="2、填写详细信息" />
    </el-steps>
    <div class="flex-1 w-full">
      <div v-if="curStep === 0" class="w-full h-full flex flex-col items-center justify-center">
        <div class="basis-1/5"></div>
        <div class="w-1/2 basis-1/5">
          <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white"
              v-model="queryRef" style="width: 100%;" placeholder="请输入要搜索的小程序名称/AppID/账号原始ID"
               @keypress.enter="handleSetQuery" />
            <el-icon style="cursor: pointer;" @click="handleAppMsgFilter">
              <Search />
            </el-icon>
          </div>
        </div>
        <div class="basis-3/5">
          <ul class="w-[400px]">
            <li class="selected" v-if="weapp">
              <div class="border border-green-400 rounded">
                <div class="relative p-5 min-h-[50px] flex items-center justify-start space-x-2">
                  <img :src="weapp.headimg_url" class="w-[50px] h-[50px] rounded"> 
                  <strong :title="weapp.nickname">{{ weapp.nickname }}</strong></div>
                </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
const $emits = defineEmits(['changeStep', 'setQuery'])
const weapp = defineModel()
const curStep = ref(0)
const queryRef = ref("")
const changeStep = (step) => {
  curStep.value = step
  $emits('changeStep', step)
}
function getCurStep() {
  return curStep.value
} 
function handleSetQuery() {
  $emits('setQuery', queryRef.value)
}
defineExpose({
  changeStep,
  getCurStep
})
</script>
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