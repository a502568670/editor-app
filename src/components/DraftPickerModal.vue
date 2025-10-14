<template>
  <el-dialog 
    v-model="visible" 
    title="选择草稿" 
    width="900px" 
    :before-close="handleClose"
    append-to-body
    class="draft-picker-modal"
  >
    <div class="draft-picker-content">
      <!-- 搜索区域 -->
      <div class="search-section mb-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 mr-4">
            <el-input
              v-model="searchKeyword"
              placeholder="输入标题/关键字"
              clearable
              class="search-input"
              @input="handleSearchInput"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="flex items-center">
            <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
          </div>
        </div>
      </div>

      <!-- 草稿列表 -->
      <div 
        class="draft-list"
        v-loading="loading"
        element-loading-text="正在加载草稿..."
        element-loading-background="rgba(255, 255, 255, 0.9)"
      >
        <!-- 草稿内容 -->
        <div v-if="!loading" class="loading-container">
          <!-- 有数据时显示草稿列表 -->
          <div v-if="filteredDrafts.length > 0" class="grid grid-cols-3 gap-4">
            <div 
              v-for="item in filteredDrafts" 
              :key="item.app_id"
              class="draft-card"
              :class="{ 'selected': selectedDraftIds.includes(item.app_id) }"
              @click="toggleDraftSelection(item.app_id)"
            >
              <!-- 草稿内容预览 -->
              <div class="draft-preview">
                <div v-for="(subitem, subIndex) in item.multi_item" :key="subitem.msg_index_id" 
                     class="draft-item"
                     :class="{ 'is-first': subIndex === 0 }">
                  <!-- 第一项显示大图 -->
                  <div v-if="subIndex === 0" class="draft-main-item">
                    <img 
                      v-if="subitem.cdn_url" 
                      :src="subitem.cdn_url" 
                      :alt="subitem.title"
                      class="draft-main-image"
                      referrerpolicy="no-referrer"
                    />
                    <div class="draft-title-overlay">
                      {{ subitem.title }}
                    </div>
                  </div>
                  <!-- 其他项显示小图 -->
                  <div v-else class="draft-sub-item">
                    <div class="draft-sub-content">
                      <div class="draft-sub-title">{{ subitem.title }}</div>
                    </div>
                    <img 
                      v-if="subitem.cdn_url" 
                      :src="subitem.cdn_url" 
                      :alt="subitem.title"
                      class="draft-sub-image"
                      referrerpolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              
              <!-- 更新时间 -->
              <div class="draft-meta">
                <el-icon class="mr-1"><Clock /></el-icon>
                <span class="text-xs text-gray-500">
                  更新于: {{ formatDate(item.update_time * 1000, 'yyyy-MM-dd HH:mm') }}
                </span>
              </div>
              
              <!-- 选中状态指示器 -->
              <div v-if="selectedDraftIds.includes(item.app_id)" class="selected-indicator">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
          
          <!-- 无数据时显示空状态 -->
          <div v-else class="empty-state">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p class="empty-text">暂无草稿数据</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="flex-1 text-left">
          <span class="text-sm text-gray-500">
            已选择 {{ selectedDraftIds.length }} 篇草稿
          </span>
        </div>
        <div class="flex gap-2">
          <el-button @click="handleCancel">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirm"
            :disabled="selectedDraftIds.length === 0"
          >
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Search, Check, Clock, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { groupAppMsgs } from "@/api/appmsg"
import { getToken } from "@/utils/auth"
import { serializeCookie } from "@/utils/cookie"
import { formatDate } from "@/utils/date"
import { debounceFn } from "@/utils/index"

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedAccount: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const selectAll = ref(false)
const selectedDraftIds = ref([])
const drafts = ref([])
const localAppmsgsRef = ref([])

// 计算属性
const filteredDrafts = computed(() => {
  let filtered = drafts.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(draft => {
      return draft.multi_item.some(item => 
        item.title?.includes(searchKeyword.value)
      )
    })
  }
  
  return filtered
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.selectedAccount) {
    // 弹窗打开时重置状态
    searchKeyword.value = ''
    selectAll.value = false
    selectedDraftIds.value = []
    drafts.value = [] // 清空草稿列表
    // 加载草稿数据
    loadDrafts()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  // 对话框关闭时清空数据
  if (!newVal) {
    searchKeyword.value = ''
    selectAll.value = false
    selectedDraftIds.value = []
    drafts.value = []
  }
})

// 方法
const loadDrafts = async () => {
  if (!props.selectedAccount) {
    ElMessage.error('请先选择公众号')
    return
  }
  
  console.log('开始加载草稿，设置loading为true')
  loading.value = true
  try {
    // 获取草稿ID列表
    const res = await groupAppMsgs({ 
      wechat_id: props.selectedAccount.id, 
      only_show_group_key: 1, 
      only_show_local: 0 
    })
    localAppmsgsRef.value = res.data
    
    // 加载草稿详情 - 不等待，让IPC回调处理loading状态
    loadDraftDetails()
  } catch (error) {
    console.error('加载草稿失败:', error)
    ElMessage.error('加载草稿失败')
    loading.value = false
  }
  // 移除finally块，让IPC回调控制loading状态
}

const loadDraftDetails = async () => {
  if (!props.selectedAccount) return
  
  console.log('loadDraftDetails: 设置loading为true')
  loading.value = true
  const { token, id, session_id } = props.selectedAccount
  
  // 发送IPC消息获取草稿详情
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:listAppmsgsInDraftBox',
    source: 'draft_picker',
    token: getToken(),
    wechat_id: id,
    listData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      query: searchKeyword.value,
      begin: 0,
      count: 50
    }
  })
}

const handleSearchInput = debounceFn(() => {
  if (props.selectedAccount) {
    // 清空当前草稿列表，显示loading
    drafts.value = []
    loadDraftDetails()
  }
}, 700, false)

const toggleDraftSelection = (draftId) => {
  const index = selectedDraftIds.value.indexOf(draftId)
  if (index > -1) {
    selectedDraftIds.value.splice(index, 1)
  } else {
    selectedDraftIds.value.push(draftId)
  }
  updateSelectAllState()
}

const handleSelectAll = (checked) => {
  if (checked) {
    selectedDraftIds.value = filteredDrafts.value.map(draft => draft.app_id)
  } else {
    selectedDraftIds.value = []
  }
}

const updateSelectAllState = () => {
  selectAll.value = filteredDrafts.value.length > 0 && 
    selectedDraftIds.value.length === filteredDrafts.value.length
}

const handleConfirm = () => {
  if (selectedDraftIds.value.length === 0) {
    ElMessage.warning('请选择至少一篇草稿')
    return
  }
  
  const selectedDrafts = drafts.value.filter(draft => 
    selectedDraftIds.value.includes(draft.app_id)
  )
  
  emit('confirm', {
    account: props.selectedAccount,
    drafts: selectedDrafts
  })
  handleClose()
}

const handleCancel = () => {
  handleClose()
}

const handleClose = () => {
  visible.value = false
}

// 注册IPC监听器
const registerIpcListener = () => {
  window.ipcRenderer.receive('fromMain', (msg) => {
    if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
      const { source, ret } = msg.data
      if (source !== 'draft_picker') {
        return
      }
      
      const tag = msg.tag
      if (tag === "appmsg-ret:listAppmsgsInDraftBox") {
        const { success, items, err_msg } = ret
        if (!success) {
          let message = err_msg === "invalid session" ? "会话已过期，请重新登录" : err_msg
          ElMessage.error(message)
          loading.value = false
          return
        }
        
        // 转换数据格式
        const transformed_items = items.map(it => ({
          ...it,
          // 清除标题中的 <em> 高亮标签
          multi_item: it.multi_item.map(subItem => ({
            ...subItem,
            title: subItem.title ? subItem.title.replace(/<\/?em>/g, '') : subItem.title
          })),
          height: (50 + (it.multi_item.length === 1 ? 115 : (115 + (it.multi_item.length - 1) * 75)) + 40),
        }))
        
        drafts.value = transformed_items
        console.log('IPC回调: 设置loading为false')
        loading.value = false
      }
    }
  })
}

// 生命周期
onMounted(() => {
  registerIpcListener()
})
</script>

<style scoped>
.draft-picker-modal {
  .draft-picker-content {
    width: 100%;
    max-height: 600px;
    overflow-y: auto;
  }

  .search-section {
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .search-input {
    width: 100%;
  }

  .draft-list {
    padding: 16px 0;
    min-height: 400px;
  }

  .loading-container {
    min-height: 400px;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .draft-card {
    position: relative;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    overflow: hidden;
    /* 高度由内容决定 */
    display: flex;
    flex-direction: column;
  }

  .draft-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  .draft-card.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .draft-preview {
    /* 高度由内容决定，不设置固定高度 */
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .draft-main-item {
    position: relative;
    height: 120px;
    background: #e6e6e6;
  }

  .draft-main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .draft-title-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 12px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .draft-sub-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
  }

  .draft-sub-content {
    flex: 1;
    margin-right: 8px;
  }

  .draft-sub-title {
    font-size: 12px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .draft-sub-image {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
  }

  .draft-meta {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    font-size: 12px;
    color: #6b7280;
    flex-shrink: 0; /* 不压缩，固定在底部 */
  }

  .selected-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    color: white;
    font-size: 14px;
    background: #3b82f6;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    border: 2px solid white;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 14px;
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* 自定义滚动条 */
.draft-picker-content::-webkit-scrollbar {
  width: 6px;
}

.draft-picker-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.draft-picker-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.draft-picker-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
