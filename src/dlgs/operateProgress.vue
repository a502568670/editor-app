<template>
  <el-dialog :close-on-click-modal="false" title="操作进度" @closed="handleDialogClosed" v-model="dialogVisibleRef"
    width="360px">
    <div class="flex flex-col w-full">
      <div class="flex justify-center">
        <el-progress type="dashboard" class="flex" :percentage="percentRef">
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">{{ progressDescRef }}</span>
          </template>
        </el-progress>
      </div>
      <div v-if="progressResultRef" class="flex flex-col w-full">
        <div class="flex items-center text-green-400">
          <el-icon class="cursor-pointer">
            <component :is="CircleCheckFilled"></component>
          </el-icon>成功
        </div>
        <div class="flex items-center h-16">
          {{progressResultRef.success_accounts?.map(v => v.name).join(";")}}
        </div>
        <hr />
        <div class="flex items-center text-red-400">
          <el-icon class="cursor-pointer">
            <component :is="CircleCloseFilled"></component>
          </el-icon>失败
        </div>
        <div class="flex items-center space-x-2 h-16">
          <div class="flex items-center" v-for="(item) in progressResultRef?.fail_accounts" :key="item.name">
            {{ item.name }}
            <el-tooltip :visible="failReasonVisibleRef">
              <template #content>
                <span>{{ item.reason }}</span>
              </template>
              <el-icon class="cursor-pointer" @mouseenter="failReasonVisibleRef = true"
                @mouseleave="failReasonVisibleRef = false">
                <component :is="InfoFilled"></component>
              </el-icon>
            </el-tooltip>
          </div>
          <!-- {{progressResultRef.fail_accounts?.map(v => v.name).join(";")}} -->
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
</style>

<script setup>
import { onActivated, onMounted, ref, toRefs, watch } from 'vue'
import { CircleCheckFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { toDeepRaw } from "@/utils/convert"

const props = defineProps(['dialogVisible', 'percent', 'progressDesc', 'progressResult']);

const emitEvents = defineEmits(['dialogClosed'])

const dialogVisibleRef = ref(false)

const percentRef = ref(0)
const progressDescRef = ref("")
const progressResultRef = ref(null)
const failReasonVisibleRef = ref(false)

watch(() => [props.dialogVisible, props.percent, props.progressDesc, props.progressResult], (newVal) => {
  // console.log("operateProgress props.changed=>", newVal)
  dialogVisibleRef.value = newVal[0]
  percentRef.value = newVal[1]
  progressDescRef.value = newVal[2]
  progressResultRef.value = newVal[3]
})

const handleDialogClosed = () => {
  emitEvents("dialogClosed")
}
</script>
