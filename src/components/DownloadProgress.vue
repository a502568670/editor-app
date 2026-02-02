<template>
  <div class="download-progress-overlay">
    <div class="download-progress-container">
      <div class="progress-title">
        <span class="icon">📥</span>
        <span>正在下载更新...</span>
      </div>
      
      <el-progress 
        :percentage="percentage" 
        :stroke-width="20"
        :color="progressColor"
      />
      
      <div class="progress-info">
        已下载: {{ downloadedMB }} MB / {{ totalMB }} MB
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ipcRenderer } from 'electron'

const percentage = ref(0)
const transferred = ref(0)
const total = ref(0)

const downloadedMB = computed(() => (transferred.value / 1024 / 1024).toFixed(2))
const totalMB = computed(() => (total.value / 1024 / 1024).toFixed(2))

const progressColor = computed(() => {
  if (percentage.value < 30) return '#f56c6c'
  if (percentage.value < 70) return '#e6a23c'
  return '#67c23a'
})

const updateProgress = (progress) => {
  percentage.value = parseFloat(progress.percent.toFixed(1))
  transferred.value = progress.transferred
  total.value = progress.total
}

// 监听来自主进程的进度更新
onMounted(() => {
  ipcRenderer.on('download-progress', (event, progress) => {
    updateProgress(progress)
  })
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('download-progress')
})

defineExpose({
  updateProgress
})
</script>

<style scoped>
.download-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.download-progress-container {
  background: white;
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 400px;
}

.progress-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 24px;
}

.progress-info {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  text-align: center;
}
</style>

