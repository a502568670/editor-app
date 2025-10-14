<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="预览任务列表" 
    width="800px"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <div class="preview-task-list">
      <!-- 任务列表表格 -->
      <div class="task-table-container">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left p-4 font-medium text-gray-700">草稿标题</th>
              <th class="text-left p-4 font-medium text-gray-700">发布到</th>
              <th class="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100" @click="toggleSort">
                发布时间
                <!-- <el-icon class="ml-1">
                  <ArrowUp v-if="sortOrder === 'asc'" />
                  <ArrowDown v-if="sortOrder === 'desc'" />
                </el-icon> -->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="task in sortedTasks" 
              :key="task.id" 
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="p-4">
                <span class="text-sm text-gray-900 truncate max-w-[200px]" :title="task.title">
                  {{ task.title }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center">
                  <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 mr-2">
                    <img 
                      :src="task.accountAvatar || '/favicon.ico'" 
                      :alt="task.accountName"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span class="text-sm text-gray-700">{{ task.accountName }}</span>
                </div>
              </td>
              <td class="p-4">
                <span 
                  class="text-sm px-2 py-1 rounded"
                >
                  {{ task.publishTime }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 空状态 -->
        <div v-if="tasks.length === 0" class="empty-state text-center py-16">
          <el-icon size="60" class="text-gray-300 mb-4">
            <Document />
          </el-icon>
          <p class="text-gray-500">暂无任务</p>
        </div>
      </div>
      
      <!-- 任务统计信息 -->
      <div v-if="tasks.length > 0" class="task-summary mt-4 p-4 bg-gray-50 rounded">
        <div class="flex justify-between items-center text-sm text-gray-600">
          <span>共 {{ tasks.length }} 个任务</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="tasks.length === 0">
          开始群发
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowUp, ArrowDown, Document } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const dialogVisible = ref(false)
const sortOrder = ref('asc') // 'asc' | 'desc'

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 计算属性
const sortedTasks = computed(() => {
  if (!props.tasks || props.tasks.length === 0) return []
  
  return [...props.tasks].sort((a, b) => {
    // 按发布时间排序
    if (a.isImmediate && !b.isImmediate) {
      return sortOrder.value === 'asc' ? -1 : 1
    }
    if (!a.isImmediate && b.isImmediate) {
      return sortOrder.value === 'asc' ? 1 : -1
    }
    
    // 如果都是定时发布，按时间排序
    if (!a.isImmediate && !b.isImmediate) {
      const timeA = new Date(a.publishDateTime).getTime()
      const timeB = new Date(b.publishDateTime).getTime()
      return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA
    }
    
    return 0
  })
})

const immediateCount = computed(() => {
  return props.tasks.filter(task => task.isImmediate).length
})

const scheduledCount = computed(() => {
  return props.tasks.filter(task => !task.isImmediate).length
})

// 方法
const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm', props.tasks)
  dialogVisible.value = false
}

const handleDialogClosed = () => {
  emit('cancel')
}
</script>

<style scoped>
.preview-task-list {
  max-height: 500px;
  width: 100%;
  overflow-y: auto;
}

.task-table-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.task-table-container table {
  border-collapse: collapse;
}

.task-table-container th {
  background-color: #f9fafb;
  font-weight: 500;
  color: #374151;
}

.task-table-container td {
  vertical-align: middle;
}

.task-table-container tr:hover {
  background-color: #f9fafb;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 自定义滚动条 */
.preview-task-list::-webkit-scrollbar {
  width: 6px;
}

.preview-task-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.preview-task-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.preview-task-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
