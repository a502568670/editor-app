<template>
  <el-dialog
    v-model="visible"
    title="选择公众号"
    width="900px"
    :before-close="handleClose"
    append-to-body
    class="account-picker-modal"
  >
    <div class="account-picker-content">
      <p v-if="$props.multiple" class="text-right text-base">
        共选择 <span class="text-[var(--jzl-primary-color)] font-bold">{{ selectedAccountIds.length }}</span> 个账号
      </p>
      <!-- 搜索和筛选区域 -->
      <div class="search-section">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索关键词"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <el-checkbox v-if="$props.multiple" :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll">
            全选
          </el-checkbox>
          <div style="width: 200px;">
            <el-select
              v-model="selectedGroupId"
              placeholder="选择分组"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option label="未分组" :value="0" />
              <el-option
                v-for="group in flatGroupList"
                :key="group.id"
                :label="group.displayName"
                :value="group.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 公众号列表 -->
      <div class="account-list" v-loading="loading">
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="account in filteredAccounts"
            :key="account.id"
            class="account-card"
            :class="{
              'selected': props.multiple ? selectedAccountIds.includes(account.id) : selectedAccountId === account.id,
              'disabled': account.expired
            }"
            @click="selectAccount(account)"
          >
            <div class="account-avatar">
              <img
                :src="account.avatar || '/favicon.ico'"
                :alt="account.name"
                class="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div class="account-info">
              <div class="account-id">{{ account.name }}</div>
              <div class="account-status" :class="{ 'logged': !account.expired, 'expired': account.expired }">
                {{ account.expired ? '未登录' : '已登录' }}
              </div>
            </div>
            <div v-if="(props.multiple ? selectedAccountIds.includes(account.id) : selectedAccountId === account.id)" class="selected-indicator">
              <el-icon><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAccounts.length === 0" class="empty-state">
        <el-icon class="empty-icon"><User /></el-icon>
        <p class="empty-text">暂无公众号数据</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          :disabled="props.multiple ? selectedAccountIds.length === 0 : !selectedAccountId"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, toRefs } from 'vue'
import { Search, Check, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAccountGroupList } from '@/api/account-group'
import store from '@/store';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  selectedAccounts: {
    type: Array,
    default: () => []
  },
  hideAccount:{
    type:Array,
    default: () => []
  }
})

const { all_accounts } = toRefs(store.getters);

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'before-close'])

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const selectedAccountId = ref('')
const selectedAccountIds = ref([])
const selectedGroupId = ref(null) // null 表示全部，0 表示未分组
const groupList = ref([])
const flatGroupList = ref([])

// 计算属性
const filteredAccounts = computed(() => {
  let accounts = all_accounts.value.list

  if(props.hideAccount.length){
    accounts = accounts.filter(account => {
      return !props.hideAccount.includes(account.id)
    })
  }

  // 分组过滤（使用 != null 同时检查 null 和 undefined）
  if (selectedGroupId.value != null) {
    accounts = accounts.filter(account => {
      const accountGroupId = account.group_id || 0
      return accountGroupId === selectedGroupId.value
    })
  }

  // 搜索过滤
  if (searchKeyword.value) {
    accounts = accounts.filter(account =>
      account.name?.includes(searchKeyword.value) ||
      account.account_id?.includes(searchKeyword.value)
    )
  }

  // 排序：已登录的账号优先显示
  accounts.sort((a, b) => {
    // 已登录的账号排在前面
    if (!a.expired && b.expired) return -1
    if (a.expired && !b.expired) return 1
    return 0
  })

  return accounts
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 弹窗打开时重置状态
    searchKeyword.value = ''
    selectedGroupId.value = null
    if (props.multiple) {
      selectedAccountIds.value = [...props.selectedAccounts]
    } else {
      selectedAccountId.value = ''
    }
    // 加载分组列表
    loadGroups()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const selectAccount = (account) => {
  if (account.expired) {
    ElMessage.warning('该账号未登录，无法选择')
    return
  }
  if (account.platform_id !== 4) {
    ElMessage.warning('该平台不支持此操作');
    return;
  }

  if (props.multiple) {
    // 多选模式
    const index = selectedAccountIds.value.findIndex(id => id === account.id)
    if (index > -1) {
      selectedAccountIds.value.splice(index, 1)
    } else {
      selectedAccountIds.value.push(account.id)
    }
  } else {
    // 单选模式
    selectedAccountId.value = account.id
  }
}

const handleConfirm = () => {
  if (props.multiple) {
    // 多选模式
    if (selectedAccountIds.value.length === 0) {
      ElMessage.warning('请至少选择一个公众号')
      return
    }

    const selectedAccounts = all_accounts.value.list.filter(account =>
      selectedAccountIds.value.includes(account.id)
    )
    emit('confirm', selectedAccounts)
  } else {
    // 单选模式
    if (!selectedAccountId.value) {
      ElMessage.warning('请选择一个公众号')
      return
    }

    const selectedAccount = all_accounts.value.list.find(account => account.id === selectedAccountId.value)
    emit('confirm', selectedAccount)
  }

  handleClose()
}

const handleCancel = () => {
  handleClose()
}

const handleClose = () => {
  visible.value = false
  emit('before-close')
}

// 加载分组列表
const loadGroups = async () => {
  try {
    const response = await getAccountGroupList()
    if (response && response.data && response.data.code === 1) {
      groupList.value = response.data.data.list || []
      flatGroupList.value = flattenGroupTree(groupList.value)
    }
  } catch (error) {
    console.error('加载分组列表失败:', error)
  }
}

// 将树形结构展平为列表
const flattenGroupTree = (tree, level = 0, result = []) => {
  tree.forEach(node => {
    const prefix = level > 0 ? '　'.repeat(level) + '├─ ' : ''
    result.push({
      id: node.id,
      name: node.name,
      displayName: prefix + node.name,
      level: level
    })

    if (node.children && node.children.length > 0) {
      flattenGroupTree(node.children, level + 1, result)
    }
  })
  return result
}

// 获取当前可选择的账号（筛选后的、未过期的、微信平台的）
const selectableAccounts = computed(() => {
  return filteredAccounts.value.filter(account => 
    !account.expired && account.platform_id === 4
  )
})

// 判断是否已全选（当前筛选后的账号）
const isAllSelected = computed(() => {
  if (selectableAccounts.value.length === 0) return false
  return selectableAccounts.value.every(account => 
    selectedAccountIds.value.includes(account.id)
  )
})

// 判断是否部分选中（用于显示 indeterminate 状态）
const isIndeterminate = computed(() => {
  if (selectableAccounts.value.length === 0) return false
  const selectedCount = selectableAccounts.value.filter(account => 
    selectedAccountIds.value.includes(account.id)
  ).length
  return selectedCount > 0 && selectedCount < selectableAccounts.value.length
})

// 切换全选/取消全选
const toggleSelectAll = () => {
  if (!props.multiple) return
  
  if (isAllSelected.value) {
    // 取消全选：移除当前筛选后的账号
    const selectableIds = selectableAccounts.value.map(a => a.id)
    selectedAccountIds.value = selectedAccountIds.value.filter(id => 
      !selectableIds.includes(id)
    )
  } else {
    // 全选：添加当前筛选后的账号
    const selectableIds = selectableAccounts.value.map(a => a.id)
    const newIds = [...new Set([...selectedAccountIds.value, ...selectableIds])]
    selectedAccountIds.value = newIds
  }
}

const selectAll = () => {
  if (props.multiple) {
    const filtered = all_accounts.value.list.filter(item => !props.hideAccount.includes(item.id) && item.platform_id === 4 && !item.expired)
    selectedAccountIds.value = filtered.map((item) => item.id)
  }
}

// 生命周期
onMounted(() => {
  // 加载分组列表
  loadGroups()
})
</script>

<style scoped>
.account-picker-modal {
  .account-picker-content {
    width: 100%;
  }

  .search-section {
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .search-input {
    width: 100%;
  }

  .account-list {
    padding: 5px 0;
    max-height: 500px;
    overflow-y: auto;
  }

  .account-card {
    position: relative;
    display: flex;
    align-items: center;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
  }

  .account-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  .account-card.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .account-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .account-avatar {
    margin-right: 12px;
  }

  .account-info {
    flex: 1;
  }

  .account-id {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .account-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    display: inline-block;
  }

  .account-status.logged {
    background: #dcfce7;
    color: #166534;
  }

  .account-status.expired {
    background: #fef3c7;
    color: #92400e;
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
    justify-content: flex-end;
    gap: 12px;
  }
}

/* 自定义滚动条 */
.account-picker-content::-webkit-scrollbar {
  width: 6px;
}

.account-picker-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.account-picker-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.account-picker-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
