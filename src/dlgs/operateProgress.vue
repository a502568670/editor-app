<template>
  <el-dialog :close-on-click-modal="false" title="同步进度" @closed="handleDialogClosed" v-model="dialogVisibleRef"
    width="480px">
    <div class="flex flex-col w-full gap-4">
      <!-- 总进度条 -->
      <div class="total-progress">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm text-gray-600">总进度</span>
          <span class="text-sm font-medium">{{ percentRef }}%</span>
        </div>
        <el-progress :percentage="percentRef" :stroke-width="12" :show-text="false" 
          :color="percentRef === 100 ? '#67c23a' : '#409eff'" />
        <div class="text-xs text-gray-500 mt-1">{{ progressDescRef }}</div>
      </div>

      <!-- 账号进度列表 -->
      <div v-if="accountProgressRef && accountProgressRef.length > 0" class="account-list">
        <div class="text-sm text-gray-600 mb-2">账号同步状态</div>
        <div class="account-items">
          <div v-for="(account, index) in accountProgressRef" :key="index" 
            class="account-item flex items-center gap-3 py-2 px-3 rounded-lg mb-2"
            :class="getAccountBgClass(account.status)">
            <!-- 状态图标 -->
            <div class="status-icon flex-shrink-0">
              <el-icon v-if="account.status === 'success'" class="text-green-500" :size="18">
                <CircleCheckFilled />
              </el-icon>
              <el-icon v-else-if="account.status === 'failed'" class="text-red-500" :size="18">
                <CircleCloseFilled />
              </el-icon>
              <el-icon v-else-if="account.status === 'processing'" class="text-blue-500 animate-spin" :size="18">
                <Loading />
              </el-icon>
              <el-icon v-else class="text-gray-400" :size="18">
                <Clock />
              </el-icon>
            </div>
            
            <!-- 账号名称 -->
            <div class="account-name flex-shrink-0 w-24 truncate text-sm font-medium">
              {{ account.name }}
            </div>
            
            <!-- 进度条 -->
            <div class="flex-1">
              <el-progress :percentage="account.percent" :stroke-width="8" :show-text="false"
                :color="getProgressColor(account.status)" />
            </div>
            
            <!-- 状态文字 -->
            <div class="status-text flex-shrink-0 text-xs text-right flex items-center gap-1"
              :class="getStatusTextClass(account.status)">
              <span>{{ getStatusText(account) }}</span>
              <el-tooltip v-if="account.status === 'failed' && account.reason" 
                :content="account.reason" 
                placement="top"
                :show-after="200">
                <el-icon class="cursor-help text-red-400" :size="14">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

    </div>
  </el-dialog>
</template>

<style scoped>
.account-items {
  max-height: 240px;
  overflow-y: auto;
}

.account-item {
  transition: all 0.3s ease;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bg-processing {
  background-color: #ecf5ff;
}

.bg-success {
  background-color: #f0f9eb;
}

.bg-failed {
  background-color: #fef0f0;
}

.bg-pending {
  background-color: #f5f7fa;
}
</style>

<script setup>
import { ref, watch, computed } from 'vue'
import { CircleCheckFilled, CircleCloseFilled, Loading, Clock, QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps(['dialogVisible', 'percent', 'progressDesc', 'progressResult', 'accountProgress']);

const emitEvents = defineEmits(['dialogClosed'])

const dialogVisibleRef = ref(false)
const percentRef = ref(0)
const progressDescRef = ref("")
const progressResultRef = ref(null)
const accountProgressRef = ref([])

watch(() => [props.dialogVisible, props.percent, props.progressDesc, props.progressResult, props.accountProgress], (newVal) => {
  dialogVisibleRef.value = newVal[0]
  percentRef.value = newVal[1]
  progressDescRef.value = newVal[2]
  progressResultRef.value = newVal[3]
  if (newVal[4]) {
    accountProgressRef.value = newVal[4]
  }
})

const getAccountBgClass = (status) => {
  switch (status) {
    case 'success': return 'bg-success'
    case 'failed': return 'bg-failed'
    case 'processing': return 'bg-processing'
    default: return 'bg-pending'
  }
}

const getProgressColor = (status) => {
  switch (status) {
    case 'success': return '#67c23a'
    case 'failed': return '#f56c6c'
    case 'processing': return '#409eff'
    default: return '#dcdfe6'
  }
}

const getStatusTextClass = (status) => {
  switch (status) {
    case 'success': return 'text-green-600'
    case 'failed': return 'text-red-500'
    case 'processing': return 'text-blue-500'
    default: return 'text-gray-400'
  }
}

const getStatusText = (account) => {
  switch (account.status) {
    case 'success': return '已完成'
    case 'failed': return '失败'
    case 'processing': return '同步中'
    case 'saving': return '保存中'
    default: return '等待中'
  }
}

const handleDialogClosed = () => {
  // 重置状态
  accountProgressRef.value = []
  emitEvents("dialogClosed")
}
</script>
