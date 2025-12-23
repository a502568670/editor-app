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
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon v-if="searchKeyword" class="cursor-pointer mr-2" :size="16" @click="searchKeyword = ''">
                <CircleClose />
              </el-icon>
              <el-icon class="cursor-pointer" :size="16" @click="handleSearch">
                <Search />
              </el-icon>
            </template>
          </el-input>
          <div class="text-gray-400 text-sm mt-2">
            根据<a href="https://mp.weixin.qq.com/cgi-bin/announce?action=getannouncement&key=11526652746MV5HH&version=1&lang=zh_CN&platform=2&token=1703579382" target="_blank" class="text-blue-500">原创转载规则</a>，只能搜索并转载原创文章
          </div>
        </div>

        <!-- 搜索结果表格 -->
        <div 
          v-if="searchResults.length > 0 || loading" 
          ref="tableContainer"
          class="mt-4 search-result-table"
          @scroll="handleScroll"
        >
          <el-table
            v-loading="loading"
            :data="searchResults"
            border
            style="width: 100%"
            highlight-current-row
            @row-click="handleRowClick"
          >
            <el-table-column width="55" align="center">
              <template #default="{ row }">
                <el-radio v-model="selectedRow" :value="row">&nbsp;</el-radio>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="文章" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center">
                  <a 
                    :href="row.url" 
                    target="_blank" 
                    class="truncate text-blue-600 hover:text-blue-800 hover:underline" 
                    :title="row.title"
                    @click.stop
                  >
                    {{ row.title }}
                  </a>
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

          <!-- 加载更多提示 -->
          <div class="text-center py-3">
            <span v-if="loadingMore" class="text-gray-400 text-sm">正在加载更多...</span>
            <span v-else-if="!hasMore && searchResults.length > 0" class="text-gray-400 text-sm">
              已加载全部 {{ totalCount }} 条结果
            </span>
            <span v-else-if="hasMore && searchResults.length > 0" class="text-gray-400 text-sm">
              已加载 {{ searchResults.length }} / {{ totalCount }} 条，向下滚动加载更多
            </span>
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
        <el-button type="primary" :disabled="!selectedRow" @click="handleConfirm">确定</el-button>
        <el-button @click="handleClose">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, inject, toRaw } from 'vue'
import { Search, ArrowDown, CircleClose } from '@element-plus/icons-vue'
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
const selectedRow = ref(null)
const totalCount = ref(0)
const tableContainer = ref(null)
const currentBegin = ref(0)
const pageSize = ref(10)
const loadingMore = ref(false)
const hasMore = ref(true)

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

// 处理表格行点击（单选）
const handleRowClick = (row) => {
  selectedRow.value = row
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

  // 重置分页参数
  currentBegin.value = 0
  hasMore.value = true
  loading.value = true
  hasSearched.value = true
  searchResults.value = []
  selectedRow.value = null

  try {
    // 将响应式对象转换为普通对象，避免 IPC 序列化错误
    const account = toRaw(selectedAccount.value)
    const accountData = {
      session_id: account.session_id,
      token: account.token
    }
    
    const result = await window.webBridge.callRpc('checkAppmsgCopyrightStat', {
      account: accountData,
      url: searchKeyword.value.trim(),
      begin: currentBegin.value,
      count: pageSize.value
    })

    console.log('搜索结果:', result)

    if (result && result.success) {
      // 为每条结果添加默认的转载类型
      searchResults.value = (result.list || []).map(item => ({
        ...item,
        _reprintType: item.source_reprint_status === 'EN_SOURCE_REPRINT_STATUS_FAST_REPRINT' ? 'reprint' : 'share'
      }))
      totalCount.value = result.total || searchResults.value.length
      
      // 更新分页参数
      currentBegin.value += pageSize.value
      hasMore.value = searchResults.value.length < totalCount.value
    } else {
      ElMessage.error(result?.err_msg || '搜索失败')
      searchResults.value = []
      totalCount.value = 0
      hasMore.value = false
    }
  } catch (error) {
    console.error('搜索出错:', error)
    ElMessage.error('搜索出错，请稍后重试')
    searchResults.value = []
    totalCount.value = 0
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

// 加载更多数据
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || loading.value) {
    return
  }

  loadingMore.value = true

  try {
    const account = toRaw(selectedAccount.value)
    const accountData = {
      session_id: account.session_id,
      token: account.token
    }
    
    const result = await window.webBridge.callRpc('checkAppmsgCopyrightStat', {
      account: accountData,
      url: searchKeyword.value.trim(),
      begin: currentBegin.value,
      count: pageSize.value
    })

    console.log('加载更多结果:', result)

    if (result && result.success) {
      const newItems = (result.list || []).map(item => ({
        ...item,
        _reprintType: item.source_reprint_status === 'EN_SOURCE_REPRINT_STATUS_FAST_REPRINT' ? 'reprint' : 'share'
      }))
      
      // 追加新数据
      searchResults.value = [...searchResults.value, ...newItems]
      
      // 更新分页参数
      currentBegin.value += pageSize.value
      hasMore.value = searchResults.value.length < totalCount.value
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载更多出错:', error)
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
}

// 处理滚动事件
const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部附近100px时加载更多
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMore()
  }
}

// 确认选择
const handleConfirm = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请选择要转载的文章')
    return
  }

  const selected = selectedRow.value
  
  console.log("转载的文章",selected)

  // 构建 share_info 结构
  const shareInfo = {
    platform: selected.nickname,
    reprint_url: selected.url || "",
    source_username: selected.nickname || "",
    source_headimg: selected.head_img_url || "",
    guide_words: "分享一篇文章。",
    copyright_stat: "2",
    reprint_style: selected._reprintType === 'share' ? "2" : "1",
    reprint_type: selected._reprintType === 'share' ? "2" : "1",
    content_noencode: selected.content || "",
    // 非share_info参数
    title: selected.title || "",
    cover_url: selected.cover_url || ""
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
  selectedRow.value = null
  hasSearched.value = false
  totalCount.value = 0
  currentBegin.value = 0
  hasMore.value = true
  loadingMore.value = false
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: 10px;
  overflow: hidden;
}

.reprint-tabs {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.search-result-table {
  width: 100%;
  max-height: 350px;
  overflow-y: auto;
}

:deep(.el-table) {
  font-size: 13px;
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed;
}

:deep(.el-table__header),
:deep(.el-table__body) {
  width: 100% !important;
  table-layout: fixed;
}

:deep(.el-table .el-table__cell) {
  overflow: hidden;
  text-overflow: ellipsis;
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
