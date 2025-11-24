<template>
  <div class="account-management">
    <div class="main-content">
      <div class="filters">
        <el-form label-width="70px">
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="账号昵称">
                <el-input v-model="listQuery.keyword" clearable placeholder="请输入账号昵称/关键词" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="账号ID">
                <el-input v-model="listQuery.account_id" clearable placeholder="请输入账号ID" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="平台">
                <SelectPlatform v-model="listQuery.platform_id" :platformList="platform_list" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="分组">
                <el-select
                  v-model="listQuery.group_id"
                  clearable
                  filterable
                  placeholder="全部分组"
                  style="width: 100%"
                >
                  <el-option label="未分组" :value="0" />
                  <el-option
                    v-for="item in flatGroupList"
                    :key="item.id"
                    :label="item.displayName"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="filters-actions">
            <div>
              <el-button type="primary" @click="handleRefresh" :loading="listLoading" plain>
                <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
            <div>
              <el-button type="success" @click="openBatchGroup" plain>批量修改分组</el-button>
            </div>
          </div>
        </el-form>
      </div>
      <div class="table-wrap">
        <el-table
          ref="multipleTableRef"
          v-loading="listLoading"
          :data="list"
          :height="tableHeight"
          :header-cell-style="{ 'background': '#f7f7f7', 'color': '#333', 'height': '45px', 'line-height': '45px', 'padding': '0' }"
          :cell-style="{ 'height': '45px', 'line-height': '45px', 'padding': '0' }"
          element-loading-text="正在查询中..."
          border
          fit
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="账号" prop="name" min-width="220">
            <template #default="scope">
              <div class="acc-cell">
                <img class="acc-avatar" :src="scope.row.avatar" />
                <div class="acc-name">{{ scope.row.name }}</div>
                <div class="acc-id">{{ scope.row.original_id }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="平台" prop="platform_name" width="160">
            <template #default="{row}">
              <div class="plat-cell">
                <!-- <img class="plat-icon" :src="scope.row.image" /> -->
                <span>{{ getCurrentPlatform(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分组" prop="cate_name" min-width="160" />
          <el-table-column label="操作" width="160" align="center">
            <template #default="scope">
              <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-popconfirm title="确定删除该账号？" @confirm="handleDelete(scope.row)">
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <Pagination
            :total="total"
            :page="listQuery.page"
            :limit="listQuery.num"
            @pagination="getList"
          />
        </div>
      </div>

      <!-- 批量分组 -->
      <el-dialog :close-on-click-modal="false" title="批量移动到分组" v-model="dialogSetGroupVisible" width="450px">
        <el-form :model="batchForm" label-position="left" label-width="100px">
          <el-form-item label="目标分组">
            <el-select
              v-model="batchForm.group_name"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="未分组"
              style="width: 100%"
              @change="handleBatchGroupSelectChange"
              @clear="handleBatchGroupClear"
            >
              <el-option
                v-for="item in flatGroupList"
                :key="item.id"
                :label="item.displayName"
                :value="item.name"
              />
            </el-select>
            <div class="tip-text">
              提示：输入后选中即可创建新的分组
            </div>
          </el-form-item>
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 10px"
          >
            已选择 {{ multipleSelection.length }} 个账号
          </el-alert>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogSetGroupVisible = false">取消</el-button>
            <el-button type="primary" @click="setAccountGroup" :loading="batchLoading">提交</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 批量代理/运营人 -->
      <el-dialog :close-on-click-modal="false" title="请选择账号运营人" v-model="dialogSetUserVisible" width="400px">
        <el-form :model="dataForm" label-position="top" label-width="100px" style="width: 360px;">
          <el-row :gutter="40">
            <el-col :span="24">
              <SelectUser v-model="dataForm.user_id" />
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogSetUserVisible = false">取消</el-button>
            <el-button type="primary" @click="setAccountUser">提交</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 编辑账号分组 -->
      <el-dialog
        :close-on-click-modal="false"
        title="编辑账号分组"
        v-model="dialogEditGroupVisible"
        width="450px"
      >
        <el-form style="width: 100%;padding: 0 20px;" :model="editForm" label-position="left" label-width="100px">
          <el-form-item label="账号名称">
            <el-input v-model="editForm.accountName" disabled />
          </el-form-item>
          <el-form-item label="选择分组">
            <el-select
              v-model="editForm.group_name"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="未分组"
              style="width: 100%"
              @change="handleGroupSelectChange"
              @clear="handleGroupClear"
            >
              <el-option
                v-for="item in flatGroupList"
                :key="item.id"
                :label="item.displayName"
                :value="item.name"
              />
            </el-select>
            <div class="tip-text">
              提示：输入后选中即可创建新的分组
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogEditGroupVisible = false">取消</el-button>
            <el-button type="primary" @click="submitEditGroup" :loading="editLoading">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, inject } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination'
import SelectPlatform from '@/components/selectPlatform'
import SelectUser from '@/components/selectUser'
import { listAccount, moveAccountsToGroup, setOperator } from '@/api/account'
import { getAccountGroupList, addAccountGroup } from '@/api/account-group'
import { ElMessage, ElMessageBox } from 'element-plus'
import store from '@/store'
import { useAccountStore } from '@/store/piniaStore'
import { listPlatform } from '@/api/platform'

const accountStore = useAccountStore()

// 平台列表
const platform_list = ref([])
const getPlatformList = async () => {
  const data = await listPlatform()
  platform_list.value = data.data.data.list || []
}
// 获取当前账号的平台
const getCurrentPlatform = (account) => {
  const currentPlatform = platform_list.value.find(item => item.platform_id === account.platform_id)
  return currentPlatform ? currentPlatform.platform_name : '通用平台'
}

// 获取父组件提供的刷新方法（如果有）
const refreshAccountList = inject('refreshAccountList', null)

const tableHeight = computed(() => '100%')

const listLoading = ref(false)
const list = ref([])
const total = ref(0)
const multipleSelection = ref([])

const listQuery = reactive({
  page: 1,
  num: 20,
  type: 1,
  keyword: '',
  account_id: '',
  platform_id: undefined,
  group_id: undefined,
  sort: 'id',
  order: 'desc'
})

const dataForm = reactive({
  id: undefined,
  alias: '',
  sort: '',
  group_id: undefined,
  user_id: undefined
})

const dialogSetGroupVisible = ref(false)
const dialogSetUserVisible = ref(false)
const dialogEditGroupVisible = ref(false)

// 批量修改分组表单
const batchForm = reactive({
  group_name: '',
  group_id: null
})

const batchLoading = ref(false)

// 编辑表单
const editForm = reactive({
  accountId: null,
  accountName: '',
  group_name: '',
  group_id: null
})

const editLoading = ref(false)

// 扁平化的分组列表
const flatGroupList = ref([])

// 分组名称到ID的映射
const groupNameToId = ref({})
const groupIdToName = ref({})

onMounted(() => {
  getList()
  loadAllGroups()
  getPlatformList()
})

// 监听筛选条件变化，自动触发搜索
watch(
  () => [listQuery.keyword, listQuery.account_id, listQuery.platform_id, listQuery.group_id],
  () => {
    listQuery.page = 1 // 重置到第一页
    getList()
  }
)

function getList(pagination) {
  // 更新分页参数
  if (pagination) {
    if (pagination.page) listQuery.page = pagination.page
    if (pagination.limit) listQuery.num = pagination.limit
  }

  listLoading.value = true
  const payload = { ...listQuery }
  listAccount(payload)
    .then((response) => {
      // 检查响应数据结构
      if (response && response.data && response.data.data) {
        list.value = response.data.data.list || []
        total.value = response.data.data.total || 0
      } else {
        console.error('API响应数据结构异常:', response)
        list.value = []
        total.value = 0
      }
    })
    .catch((error) => {
      // error可能是response对象（业务错误）或Error对象（网络错误）
      console.error('获取账号列表失败:', error)
      list.value = []
      total.value = 0

      // 检查是否是业务错误（响应拦截器返回的response对象）
      if (error && error.data) {
        const { msg } = error.data
        ElMessage.error(msg || '获取账号列表失败')
      } else if (error && error.message) {
        // 网络错误或其他错误
        ElMessage.error('获取账号列表失败：' + error.message)
      } else {
        ElMessage.error('获取账号列表失败：未知错误')
      }
    })
    .finally(() => (listLoading.value = false))
}

// 刷新按钮处理函数
function handleRefresh() {
  listQuery.page = 1 // 重置到第一页
  getList()
  ElMessage.success('刷新成功')
}

// 刷新全局账号数据
async function refreshGlobalAccountData() {
  try {
    // 刷新 Vuex store 中的账号列表
    const data = await store.dispatch('ListAccounts')
    // 刷新 Pinia store 中的账号列表
    accountStore.update(data.list || [])
    // 通知父组件（tabBar.vue）刷新 AccountList
    if (refreshAccountList) {
      refreshAccountList()
    }
  } catch (error) {
    console.error('刷新全局账号数据失败:', error)
  }
}

function handleSelectionChange(val) {
  multipleSelection.value = val
}

function openBatchGroup() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要修改分组的账号')
    return
  }
  // 重置批量分组表单
  batchForm.group_name = null
  batchForm.group_id = 0
  dialogSetGroupVisible.value = true
}

async function setAccountGroup() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要修改分组的账号')
    return
  }

  // 允许未分组（group_name 为 null 且 group_id 为 0）
  if (batchForm.group_name === null && batchForm.group_id === 0) {
    // 清除选择，设为未分组，直接执行移动操作
  } else if (!batchForm.group_name) {
    ElMessage.warning('请选择或输入分组名称')
    return
  }

  batchLoading.value = true

  try {
    let targetGroupId = batchForm.group_id

    // 如果清除选择，设为未分组
    if (batchForm.group_name === null) {
      targetGroupId = 0
    }
    // 如果是新分组名称（不在映射中），先创建分组
    else if (batchForm.group_name && !groupNameToId.value[batchForm.group_name]) {
      const createRes = await addAccountGroup({
        name: batchForm.group_name,
        parent_id: 0,
        sort_order: 0
      })

      if (createRes && createRes.data && createRes.data.code === 1) {
        targetGroupId = createRes.data.data.id
        ElMessage.success(`已创建新分组"${batchForm.group_name}"`)
        // 注意：这里不调用 loadAllGroups()，后面会统一刷新
      } else {
        throw new Error(createRes?.data?.msg || '创建分组失败')
      }
    }

    const ids = multipleSelection.value.map((x) => x.id)

    // 移动账号到分组
    const moveRes = await moveAccountsToGroup({
      wechat_ids: ids.join(','),
      group_id: targetGroupId
    })

    if (moveRes && moveRes.data && moveRes.data.code === 1) {
      ElMessage.success(moveRes.data.msg || '移动到分组成功')
      dialogSetGroupVisible.value = false

      // 检查当前筛选的分组是否被删除了
      const deletedGroups = moveRes.data.data?.deleted_groups || []
      if (deletedGroups.length > 0 && listQuery.group_id && deletedGroups.includes(listQuery.group_id)) {
        // 如果当前筛选的分组被删除了，重置筛选条件
        listQuery.group_id = undefined
      }

      // 刷新数据
      await Promise.all([
        getList(),
        loadAllGroups(),
        refreshGlobalAccountData() // 同步全局账号数据（会触发 AccountList 刷新分组）
      ])

      // 注意：不需要再调用 filterGroupRef.value.refresh()，因为 loadAllGroups() 已经更新了 flatGroupList
    } else {
      throw new Error(moveRes?.data?.msg || '移动到分组失败')
    }
  } catch (error) {
    console.error('批量修改分组失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '批量修改分组失败'
    ElMessage.error(errorMsg)
  } finally {
    batchLoading.value = false
  }
}

function setAccountUser() {
  if (multipleSelection.value.length === 0) return
  const ids = multipleSelection.value.map((x) => x.id).join(',')
  setOperator({ user_id: dataForm.user_id, account_id: ids })
    .then(() => {
      getList()
      dialogSetUserVisible.value = false
      ElMessage.success('设置成功')
    })
}

// 加载所有分组
async function loadAllGroups() {
  try {
    const response = await getAccountGroupList()
    if (response && response.data && response.data.code === 1) {
      const groupTree = response.data.data.list || []
      flatGroupList.value = flattenGroupTree(groupTree)

      // 构建分组名称和ID的映射
      groupNameToId.value = {}
      groupIdToName.value = {}
      flatGroupList.value.forEach(item => {
        groupNameToId.value[item.name] = item.id
        groupIdToName.value[item.id] = item.name
      })
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

// 处理编辑按钮点击
function handleEdit(row) {
  editForm.accountId = row.id
  editForm.accountName = row.name

  // 设置当前分组
  if (row.group_id && row.group_id > 0) {
    editForm.group_name = groupIdToName.value[row.group_id] || ''
    editForm.group_id = row.group_id
  } else {
    editForm.group_name = null  // 未分组，设为 null 以显示 placeholder
    editForm.group_id = 0
  }

  dialogEditGroupVisible.value = true
}

// 处理分组选择变化
function handleGroupSelectChange(value) {
  if (groupNameToId.value[value]) {
    // 选择了已存在的分组
    editForm.group_id = groupNameToId.value[value]
  } else {
    // 输入了新分组名称
    editForm.group_id = null
  }
}

// 处理清除选择（设为未分组）
function handleGroupClear() {
  editForm.group_name = null
  editForm.group_id = 0
}

// 处理批量分组选择变化
function handleBatchGroupSelectChange(value) {
  if (groupNameToId.value[value]) {
    // 选择了已存在的分组
    batchForm.group_id = groupNameToId.value[value]
  } else {
    // 输入了新分组名称
    batchForm.group_id = null
  }
}

// 处理批量分组清除选择（设为未分组）
function handleBatchGroupClear() {
  batchForm.group_name = null
  batchForm.group_id = 0
}

// 提交编辑分组
async function submitEditGroup() {
  // 允许未分组（group_name 为 null 且 group_id 为 0）
  if (editForm.group_name === null && editForm.group_id === 0) {
    // 清除选择，设为未分组，直接执行移动操作
  } else if (!editForm.group_name) {
    ElMessage.warning('请选择或输入分组名称')
    return
  }

  editLoading.value = true

  try {
    let targetGroupId = editForm.group_id

    // 如果清除选择，设为未分组
    if (editForm.group_name === null) {
      targetGroupId = 0
    }
    // 如果是新分组名称（不在映射中），先创建分组
    else if (editForm.group_name && !groupNameToId.value[editForm.group_name]) {
      const createRes = await addAccountGroup({
        name: editForm.group_name,
        parent_id: 0,
        sort_order: 0
      })

      // 注意：API 返回的数据结构是 response.data，所以要检查 createRes.data.code
      if (createRes && createRes.data && createRes.data.code === 1) {
        targetGroupId = createRes.data.data.id
        ElMessage.success(`已创建新分组"${editForm.group_name}"`)
        // 注意：这里不调用 loadAllGroups()，后面会统一刷新
      } else {
        throw new Error(createRes?.data?.msg || '创建分组失败')
      }
    }

    // 移动账号到分组
    const moveRes = await moveAccountsToGroup({
      wechat_ids: String(editForm.accountId),
      group_id: targetGroupId
    })

    if (moveRes && moveRes.data && moveRes.data.code === 1) {
      ElMessage.success(moveRes.data.msg || '修改分组成功')
      dialogEditGroupVisible.value = false

      // 检查当前筛选的分组是否被删除了
      const deletedGroups = moveRes.data.data?.deleted_groups || []
      if (deletedGroups.length > 0 && listQuery.group_id && deletedGroups.includes(listQuery.group_id)) {
        // 如果当前筛选的分组被删除了，重置筛选条件
        listQuery.group_id = undefined
      }

      // 刷新数据
      await Promise.all([
        getList(),
        loadAllGroups(),
        refreshGlobalAccountData() // 同步全局账号数据（会触发 AccountList 刷新分组）
      ])

      // 注意：不需要再调用 filterGroupRef.value.refresh()，因为 loadAllGroups() 已经更新了 flatGroupList
    } else {
      throw new Error(moveRes?.data?.msg || '修改分组失败')
    }
  } catch (error) {
    console.error('修改分组失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '修改分组失败'
    ElMessage.error(errorMsg)
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('此操作将删除该账号, 是否继续?', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    // 参照 tabBar.vue 的 onDelMPAccount 实现
    await store.dispatch('DelAccount', row.id)
    accountStore.update(accountStore.list.filter(item => item.id !== row.id))

    // 刷新数据
    await Promise.all([
      getList(),
      refreshGlobalAccountData() // 同步全局账号数据
    ])

    // 通知父组件刷新
    if (refreshAccountList) {
      refreshAccountList()
    }

    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消操作，不需要处理
    if (error !== 'cancel') {
      console.error('删除账号失败:', error)
    }
  }
}
</script>

<style scoped>
.account-management {
  height: 100%;
  display: flex;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
  margin: 10px;
}

.header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.filters {
  background: #fff;
  padding: 10px 0 0 0;
}

.filters-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 10px 0;
}

.table-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrap :deep(.el-table) {
  flex: 1;
}

.pager {
  display: flex;
  justify-content: flex-start;
  padding: 12px 0 0 0;
  flex-shrink: 0;
}

.acc-cell { display: flex; align-items: center; }
.acc-avatar { width: 25px; height: 25px; border-radius: 50%; }
.acc-name { margin-left: 6px; margin-right: 8px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acc-id { color: #999; font-size: 12px; }

.plat-cell { display: flex; align-items: center; }
.plat-icon { width: 16px; height: 16px; margin-right: 6px; }

.tip-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>

