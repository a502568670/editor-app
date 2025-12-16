<template>
  <el-dialog
    v-model="dialogVisible"
    title="转载文章"
    width="820px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" class="reprint-tabs">
      <el-tab-pane label="查找原创文章" name="search">
        <div class="flex flex-col items-center py-4">
          <el-input
            v-model="searchKeyword"
            placeholder="输入原创文章链接/标题/关键字，按回车查找"
            class="w-[400px]"
            :disabled="loading"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon class="cursor-pointer" @click="handleSearch">
                <Search />
              </el-icon>
            </template>
          </el-input>
          <div class="text-gray-400 text-sm mt-2">
            根据<a href="javascript:;" class="text-green-500">原创转载规则</a>，只能搜索并转载原创文章
          </div>
        </div>

        <!-- 搜索结果表格 -->
        <div v-if="searchResults.length > 0 || loading" class="mt-4">
          <el-table
            v-loading="loading"
            :data="searchResults"
            border
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="title" label="文章" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center">
                  <span class="truncate" :title="row.title">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="nickname" label="原创公众号" width="150">
              <template #default="{ row }">
                <span class="truncate" :title="row.nickname">{{ row.nickname }}</span>
              </template>
            </el-table-column>
            <el-table-column label="转载类型" width="180">
              <template #default="{ row }">
                <div v-if="isFastReprint(row)" class="text-sm">
                  <div class="text-green-600">快捷转载</div>
                  <div class="text-gray-400 text-xs">不可修改，显示转载来源</div>
                </div>
                <div v-else class="text-sm">
                  <div>分享</div>
                  <div class="text-gray-400 text-xs">用户需要跳转至原文阅读</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="发送方式" width="130">
              <template #default="{ row }">
                <el-dropdown 
                  trigger="click" 
                  @command="(cmd) => handleReprintTypeChange(row, cmd)"
                >
                  <span class="el-dropdown-link cursor-pointer text-sm">
                    {{ getReprintTypeLabel(row) }}
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        v-if="isFastReprint(row)" 
                        command="reprint"
                        :class="{ 'is-active': row._reprintType === 'reprint' }"
                      >
                        转载
                      </el-dropdown-item>
                      <el-dropdown-item 
                        command="share"
                        :class="{ 'is-active': row._reprintType === 'share' }"
                      >
                        分享
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页信息 -->
          <div v-if="totalCount > 0" class="text-gray-400 text-sm mt-2 text-right">
            共 {{ totalCount }} 条结果
          </div>
        </div>

        <!-- 无搜索结果提示 -->
        <div v-else-if="hasSearched && !loading" class="flex flex-col items-center justify-center py-10">
          <span class="text-gray-400">未找到相关原创文章</span>
        </div>
      </el-tab-pane>
      <!-- <el-tab-pane label="查看白名单文章" name="whitelist">
        <div class="flex flex-col items-center justify-center py-20">
          <span class="text-gray-400">白名单文章列表</span>
        </div>
      </el-tab-pane> -->
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleConfirm">确定</el-button>
        <el-button @click="handleClose">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, inject, toRaw } from 'vue'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 注入选中的账号
const selectedAccount = inject('selectedAccount', ref(null))

const dialogVisible = ref(false)
const activeTab = ref('search')
const searchKeyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const searchResults = ref([])
const selectedRows = ref([])
const totalCount = ref(0)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 判断是否支持快捷转载
const isFastReprint = (row) => {
  return row.source_reprint_status === 'EN_SOURCE_REPRINT_STATUS_FAST_REPRINT'
}

// 获取转载类型标签
const getReprintTypeLabel = (row) => {
  if (!row._reprintType) {
    // 默认值：如果支持快捷转载则默认转载，否则默认分享
    row._reprintType = isFastReprint(row) ? 'reprint' : 'share'
  }
  return row._reprintType === 'reprint' ? '转载' : '分享'
}

// 处理转载类型变更
const handleReprintTypeChange = (row, type) => {
  row._reprintType = type
}

// 处理表格选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 搜索原创文章
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键字')
    return
  }

  if (!selectedAccount.value) {
    ElMessage.warning('请先选择公众号账号')
    return
  }

  loading.value = true
  hasSearched.value = true
  searchResults.value = []
  selectedRows.value = []

  try {
    // 将响应式对象转换为普通对象，避免 IPC 序列化错误
    const account = toRaw(selectedAccount.value)
    const accountData = {
      session_id: account.session_id,
      token: account.token
    }
    
    const result = await window.webBridge.callRpc('checkAppmsgCopyrightStat', {
      account: accountData,
      url: searchKeyword.value.trim()
    })

    console.log('搜索结果:', result)

    if (result && result.success) {
      // 为每条结果添加默认的转载类型
      searchResults.value = (result.list || []).map(item => ({
        ...item,
        _reprintType: item.source_reprint_status === 'EN_SOURCE_REPRINT_STATUS_FAST_REPRINT' ? 'reprint' : 'share'
      }))
      totalCount.value = result.total || searchResults.value.length
    } else {
      ElMessage.error(result?.err_msg || '搜索失败')
      searchResults.value = []
      totalCount.value = 0
    }
  } catch (error) {
    console.error('搜索出错:', error)
    ElMessage.error('搜索出错，请稍后重试')
    searchResults.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// 确认选择
const handleConfirm = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要转载的文章')
    return
  }

  // 取第一个选中的文章
  const selected = selectedRows.value[0]
  
  // 构建 share_info 结构
  const shareInfo = {
    platform: "",
    reprint_url: selected.url || "",
    source_username: selected.nickname || "",
    source_headimg: selected.head_img_url || "",
    guide_words: "",
    copyright_stat: selected.source_reprint_status || "",
    reprint_style: selected._reprintType === 'reprint' ? "1" : "0",
    reprint_type: selected._reprintType || "share",
    content_noencode: selected.content || "",
    // 附加信息
    title: selected.title || "",
    author: selected.author || "",
    cover_url: selected.cover_url || "",
    digest: selected.digest || ""
  }

  emit('confirm', shareInfo)
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  searchKeyword.value = ''
  activeTab.value = 'search'
  searchResults.value = []
  selectedRows.value = []
  hasSearched.value = false
  totalCount.value = 0
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: 10px;
}

.reprint-tabs {
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-dropdown-link) {
  display: flex;
  align-items: center;
  color: #409eff;
}

:deep(.el-dropdown-menu__item.is-active) {
  color: #409eff;
  background-color: #ecf5ff;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: inline-block;
}
</style>
