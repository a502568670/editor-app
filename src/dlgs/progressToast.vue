<template>
  <teleport to="body">
    <transition name="progress-toast-fade">
      <div v-if="visible" class="progress-toast-container">
        <!-- 最小化状态：圆形按钮 -->
        <div 
          v-if="minimized" 
          class="progress-toast-minimized"
          :class="{ 'is-completed': completed, 'is-stopped': stopped }"
          @click="toggleMinimize"
          :title="completed ? '任务完成，点击查看详情' : stopped ? '任务已停止，点击查看详情' : `进度 ${current}/${total}`"
        >
          <el-icon class="minimized-icon">
            <Check v-if="completed" />
            <VideoPause v-else-if="stopped" />
            <Loading v-else />
          </el-icon>
          <div class="minimized-badge" v-if="!completed && !stopped">{{ current }}/{{ total }}</div>
        </div>

        <!-- 正常状态：完整卡片 -->
        <div v-else class="progress-toast-card">
          <el-icon class="close-btn" @click="handleClose" :title="completed ? '关闭' : '关闭并结束任务'"><Close /></el-icon>
          <el-icon class="minimize-btn" @click="toggleMinimize" title="最小化"><Minus /></el-icon>
          
          <div class="progress-toast-body">
            <div class="title-row" v-if="completed">
              <el-icon class="info"><InfoFilled /></el-icon>
              <span class="title">任务完成</span>
            </div>
            <div class="title-row" v-else-if="articleTitle || targetName">
              <el-icon class="info"><InfoFilled /></el-icon>
              <span class="title">《{{ articleTitle }}》发布到「{{ targetName }}」</span>
            </div>
            <div class="sub-title" v-if="completed">成功 {{ successCount }} 个，失败 {{ failedCount }} 个</div>
            <div class="sub-title" v-else-if="statusText">{{ statusText }}</div>
            <div class="progress-line">
              <el-progress :percentage="percentage" :show-text="false" :stroke-width="6" />
              <span class="counter">{{ current }}/{{ total }}</span>
            </div>

            <div class="message-list" v-if="messagesWithKeys && messagesWithKeys.length">
              <transition-group name="message-slide" tag="div">
                <div 
                  v-for="msg in messagesWithKeys" 
                  :key="msg._key" 
                  class="msg-item"
                  :class="{
                    'is-error': msg.type === 'error',
                    'is-success': msg.type === 'success',
                    'is-info': msg.type === 'info',
                    'is-warning': msg.type === 'warning'
                  }"
                >
                  <div class="msg-title">{{ msg.text }}</div>
                  <div class="msg-sub" v-if="msg.subtext">{{ msg.subtext }}</div>
                </div>
              </transition-group>
            </div>
          </div>
          <div class="progress-toast-footer">
            <el-button type="danger" text @click="handleCancel">取消剩余任务</el-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { InfoFilled, Close, Minus, Check, Loading, VideoPause } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: { type: Boolean, default: false },
  targetName: { type: String, default: '' },
  statusText: { type: String, default: '' },
  articleTitle: { type: String, default: '' },
  percentage: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  messages: { type: Array, default: () => [] },
  // 新增：任务完成状态与统计
  completed: { type: Boolean, default: false },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'cancel'])

// 最小化状态
const minimized = ref(false)

// 任务是否已停止（用户点击取消后）
const stopped = ref(false)

// 切换最小化状态
const toggleMinimize = () => {
  minimized.value = !minimized.value
}

// 处理取消按钮点击
const handleCancel = () => {
  stopped.value = true
  ElMessage.warning('任务已停止')
  emit('cancel')
}

// 处理关闭按钮点击
const handleClose = () => {
  // 如果任务未完成，先取消任务
  if (!props.completed) {
    ElMessage.warning('任务已停止')
    emit('cancel')
  }
  // 隐藏弹窗
  emit('update:visible', false)
}

// 为消息生成唯一且稳定的 key
let keyCounter = 0
const messageKeys = new WeakMap()

const messagesWithKeys = computed(() => {
  return props.messages.map((msg) => {
    if (!messageKeys.has(msg)) {
      messageKeys.set(msg, `msg-${keyCounter++}`)
    }
    return {
      ...msg,
      _key: messageKeys.get(msg)
    }
  })
})
</script>

<style scoped>
.progress-toast-container {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  pointer-events: auto;
}

/* 最小化状态：圆形按钮 */
.progress-toast-minimized {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.progress-toast-minimized:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
  background: #2563eb;
}

.minimized-icon {
  color: white;
  animation: rotate 2s linear infinite;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimized-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* 完成状态的图标不旋转，改变背景色 */
.progress-toast-minimized.is-completed {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.progress-toast-minimized.is-completed:hover {
  background: #059669;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
}

.progress-toast-minimized.is-completed .minimized-icon {
  animation: none;
}

/* 停止状态的图标不旋转，改变背景色为深灰色 */
.progress-toast-minimized.is-stopped {
  background: #6b7280;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

.progress-toast-minimized.is-stopped:hover {
  background: #4b5563;
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.5);
}

.progress-toast-minimized.is-stopped .minimized-icon {
  animation: none;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.minimized-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 正常状态：完整卡片 */
.progress-toast-card {
  width: 350px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  overflow: hidden;
  position: relative;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.title-row .info {
  color: #3b82f6;
  font-size: 32px;
}

.title {
  font-size: 16px;
  color: #111827;
}

.sub-title {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
  padding-left: 26px;
}

.article-name {
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
  padding-left: 26px;
}

.article-name .label {
  color: #9ca3af;
  margin-right: 4px;
}

.article-name .value {
  color: #374151;
  font-weight: 500;
}

.progress-toast-body {
  padding: 16px;
  min-height: 80px;
}

.progress-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.progress-line :deep(.el-progress) {
  flex: 1;
}

.progress-line .counter {
  font-size: 13px;
  color: #6b7280;
  text-align: right;
}

.message-list {
  margin-top: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.msg-item {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #f3f4f6;
  background: #fafafa;
}

.msg-item + .msg-item {
  margin-top: 8px;
}

.msg-item.is-error {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

.msg-item.is-success {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.msg-item.is-warning {
  background: #fef3c7; /* amber-100 */
  border-color: #fde68a; /* amber-200 */
  color: #b45309; /* amber-700 */
}

.msg-item.is-info {
  background: #f3f4f6; /* gray-100 */
  border-color: #e5e7eb; /* gray-200 */
  color: #4b5563; /* gray-600 */
}

.msg-title {
  font-size: 13px;
}

.msg-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.progress-toast-body .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  height: 48px;
}

.progress-toast-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 12px;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #9ca3af;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #ef4444;
}

.minimize-btn {
  position: absolute;
  top: 8px;
  right: 34px;
  color: #9ca3af;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.minimize-btn:hover {
  color: #3b82f6;
}

.progress-toast-fade-enter-active,
.progress-toast-fade-leave-active {
  transition: all .2s ease;
}

.progress-toast-fade-enter-from,
.progress-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 消息列表插入动画 */
.message-slide-enter-active {
  transition: all 0.4s ease;
}

.message-slide-leave-active {
  transition: all 0.3s ease;
}

.message-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.message-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.message-slide-move {
  transition: transform 0.4s ease;
}
</style>


