<template>
<el-dialog 
  v-model="aotPicker.visible" 
  title="选择公众号" 
  width="900px" 
  @close="aotPicker.hide()" 
  append-to-body
  class="account-picker-modal"
>
  <div class="account-picker-content">
    <!-- 搜索和筛选区域 -->
    <div class="search-section mb-4">
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <el-input
            v-model="search"
            placeholder="搜索关键词"
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
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
    <div class="account-list">
      <div class="grid grid-cols-3 gap-4">
        <div 
          v-for="account in filterList" 
          :key="account.id"
          class="account-card"
          :class="{ 
            'selected': aotPicker.list.includes(account.id), 
            'disabled': account.expired 
          }"
          @click="toggleAccount(account)"
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
          <div v-if="aotPicker.list.includes(account.id)" class="selected-indicator">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filterList.length === 0" class="empty-state">
      <el-icon class="empty-icon"><User /></el-icon>
      <p class="empty-text">暂无公众号数据</p>
    </div>
  </div>
  
  <template #footer>
    <div class="dialog-footer">
      <el-button @click="aotPicker.hide()">取消</el-button>
      <el-button type="primary" @click="onConfirm">确认</el-button>
    </div>
  </template>
</el-dialog>
</template>
<script setup>
import { useAotPickerStore } from '@/store/piniaStore';
import { dog } from '@/utils';
import { ref, onMounted, computed, shallowRef, toRaw, watchEffect } from 'vue'
import { getAccountGroupList } from '@/api/account-group'
import { Search, Check, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

var aotPicker=useAotPickerStore()
var search=ref('')
var selectedGroupId=ref(null) // null 表示全部，0 表示未分组
var groupList=ref([])
var flatGroupList=ref([])

var filterList=computed(() => {
  let accounts = aotPicker.account.list;
  
  // 分组过滤（使用 != null 同时检查 null 和 undefined）
  if (selectedGroupId.value != null) {
    accounts = accounts.filter(item => {
      const accountGroupId = item.group_id || 0;
      return accountGroupId === selectedGroupId.value;
    });
  }
  
  // 搜索过滤
  if(search.value) {
    accounts = accounts.filter(item => 
      item.name?.includes(search.value) ||
      item.account_id?.includes(search.value)
    );
  }
  
  // 排序：已登录的账号优先显示
  accounts.sort((a, b) => {
    if (!a.expired && b.expired) return -1
    if (a.expired && !b.expired) return 1
    return 0
  })
  
  return accounts;
});

watchEffect(() => {
  if(!aotPicker.visible){
    search.value = ''
    selectedGroupId.value = null
    aotPicker.update([]);
  } else {
    // 弹窗打开时加载分组列表
    loadGroups()
  }
});

// 加载分组列表
async function loadGroups() {
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
function flattenGroupTree(tree, level = 0, result = []) {
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
function onConfirm() {
  aotPicker.hide(true);
  // 这里可以添加确认逻辑
  dog('选择的公众号:', toRaw(aotPicker.list));
}

function toggleAccount(account) {
  if (account.expired) {
    ElMessage.warning('该账号未登录，无法选择')
    return
  }
  
  const index = aotPicker.list.findIndex(id => id === account.id)
  if (index > -1) {
    // 已选中，取消选择
    const newList = [...aotPicker.list]
    newList.splice(index, 1)
    aotPicker.update(newList)
  } else {
    // 未选中，添加选择
    aotPicker.update([...aotPicker.list, account.id])
  }
}
</script>
<style scoped>
.account-picker-modal {
  .account-picker-content {
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

  .account-list {
    padding: 16px 0;
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
