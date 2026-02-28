<template>
  <div class="article-stats">
    <el-breadcrumb :separator-icon="ArrowRight">
      <el-breadcrumb-item>数据中心</el-breadcrumb-item>
      <el-breadcrumb-item>文章阅读数</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-wrapper">
      <div class="filters">
        <el-form :inline="true" label-width="80px">
          <el-form-item label="选择账号">
            <el-select v-model="selectedAccount" placeholder="请选择公众号" style="width: 250px">
              <el-option
                v-for="account in accountList"
                :key="account.id"
                :label="account.name"
                :value="account"
              >
                <div style="display: flex; align-items: center;">
                  <img :src="account.avatar" style="width: 20px; height: 20px; margin-right: 8px; border-radius: 50%;" />
                  <span>{{ account.name }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchArticles" :loading="loading">
              <el-icon style="margin-right: 4px;"><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
              刷新
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="articleList"
          border
          stripe
          style="width: 100%"
          :height="tableHeight"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="文章标题" prop="title" min-width="300" show-overflow-tooltip />
          <el-table-column label="发布时间" prop="publish_time" width="180" align="center">
            <template #default="{ row }">
              {{ formatTime(row.publish_time) }}
            </template>
          </el-table-column>
          <el-table-column label="阅读数" prop="read_num" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="success" effect="plain">{{ formatNumber(row.read_num) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="在看数" prop="like_num" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="warning" effect="plain">{{ formatNumber(row.like_num) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分享数" prop="share_num" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="info" effect="plain">{{ formatNumber(row.share_num) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowRight, Search, Refresh } from '@element-plus/icons-vue'
import { getPublishedArticles } from '@/api/mp_wechat'
import { ElMessage } from 'element-plus'
import store from '@/store'

const loading = ref(false)
const selectedAccount = ref(null)
const accountList = ref([])
const articleList = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableHeight = computed(() => 'calc(100vh - 280px)')

onMounted(() => {
  loadAccounts()
})

// 加载账号列表
async function loadAccounts() {
  try {
    const data = await store.dispatch('ListAccounts')
    // 只显示微信公众号
    accountList.value = (data.list || []).filter(acc => acc.platform_id === 1)
    if (accountList.value.length > 0) {
      selectedAccount.value = accountList.value[0]
    }
  } catch (error) {
    console.error('加载账号列表失败:', error)
    ElMessage.error('加载账号列表失败')
  }
}

// 获取文章列表
async function fetchArticles() {
  if (!selectedAccount.value) {
    ElMessage.warning('请先选择公众号账号')
    return
  }

  loading.value = true
  try {
    const begin = (pagination.page - 1) * pagination.pageSize
    const response = await getPublishedArticles({
      account_id: selectedAccount.value.id,
      token: selectedAccount.value.token,
      cookies: selectedAccount.value.cookies,
      begin: begin,
      count: pagination.pageSize
    })

    if (response && response.data && response.data.code === 1) {
      const data = response.data.data
      articleList.value = data.publish_list || []
      pagination.total = data.total_count || 0
      ElMessage.success('获取文章数据成功')
    } else {
      throw new Error(response?.data?.msg || '获取文章数据失败')
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '获取文章列表失败'
    ElMessage.error(errorMsg)
    articleList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 刷新数据
function handleRefresh() {
  pagination.page = 1
  fetchArticles()
}

// 分页大小改变
function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.page = 1
  fetchArticles()
}

// 当前页改变
function handleCurrentChange(page) {
  pagination.page = page
  fetchArticles()
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化数字
function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('zh-CN')
}

// 查看详情
function viewDetail(row) {
  if (row.url) {
    window.open(row.url, '_blank')
  } else {
    ElMessage.info('暂无文章链接')
  }
}
</script>

<style scoped>
.article-stats {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f5f5;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  margin-top: 20px;
  padding: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.filters {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0 0;
}
</style>

