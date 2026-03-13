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
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-button type="primary" @click="handleRefresh" :loading="listLoading" plain>
                <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
                刷新
              </el-button>
              <!-- <el-button type="warning" @click="handleCheckLoginStatus" :loading="checkingLogin" plain>
                <el-icon style="margin-right: 4px;"><Monitor /></el-icon>
                一键检测登录状态
              </el-button> -->
              <!-- 圆形进度条 -->
              <div v-if="checkingLogin" class="check-progress-wrap">
                <svg class="check-progress-svg" viewBox="0 0 36 36">
                  <circle class="check-progress-bg" cx="18" cy="18" r="15" />
                  <circle
                    class="check-progress-bar"
                    cx="18" cy="18" r="15"
                    :stroke-dasharray="checkProgressDash"
                    stroke-dashoffset="0"
                  />
                </svg>
                <span class="check-progress-text">{{ checkProgressPct }}%</span>
              </div>
            </div>
            <div>
              <el-button type="primary" @click="openAddGroup" plain>新增分组</el-button>
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
                <span>{{ getCurrentPlatform(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="平台地址" min-width="200">
            <template #default="{row}">
              <span style="font-size: 12px; color: #666; word-break: break-all;">
                {{ (row.platform_id === 4 || row.platform_id === 1) && !row.platform_url ? 'https://mp.weixin.qq.com/' : (row.platform_url || '-') }}
              </span>
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

      <!-- 新增分组 -->
      <el-dialog :close-on-click-modal="false" title="新增分组" v-model="dialogAddGroupVisible" width="400px">
        <el-form :model="addGroupForm" :rules="addGroupRules" ref="addGroupFormRef" label-position="left" label-width="80px">
          <el-form-item label="分组名称" prop="name">
            <el-input v-model="addGroupForm.name" placeholder="请输入分组名称" clearable />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogAddGroupVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAddGroup" :loading="addGroupLoading">确定</el-button>
          </div>
        </template>
      </el-dialog>

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


      <!-- 登录状态检测结果弹框 -->
      <el-dialog
        :close-on-click-modal="false"
        title="登录状态检测"
        v-model="dialogLoginCheckVisible"
        width="1200px"
        class="login-check-dialog"
        @open="handleLoginCheckDialogOpen"
        @close="handleLoginCheckDialogClose"
      >
        <div class="login-check-body">
          <!-- 左侧：失效账号列表 -->
          <div class="login-check-left">
            <div class="login-check-panel-title">
              <span>失效账号</span>
              <el-tag type="danger" size="small" effect="dark">{{ expiredAccounts.length }} 个</el-tag>
            </div>
            <div class="login-check-list">
              <div
                v-for="acc in expiredAccounts"
                :key="acc.id"
                class="login-check-item"
                :class="{ active: currentLoginAccount && currentLoginAccount.id === acc.id, done: loginDoneIds.includes(acc.id) }"
                @click="selectLoginAccount(acc)"
              >
                <img :src="acc.avatar" class="login-check-avatar" />
                <div class="login-check-info">
                  <div class="login-check-name">{{ acc.name }}</div>
                  <div class="login-check-platform">{{ getCurrentPlatform(acc) }}</div>
                </div>
                <div class="login-check-status">
                  <span v-if="loginDoneIds.includes(acc.id)" class="status-ok">已登录</span>
                  <span v-else class="status-expired">未登录</span>
                </div>
              </div>
              <div v-if="expiredAccounts.length === 0" class="login-check-empty">
                所有账号均已登录
              </div>
            </div>
          </div>
          <!-- 右侧：登录操作 -->
          <div class="login-check-right">
            <div class="login-check-panel-title">
              <span>登录操作</span>
              <span v-if="currentLoginAccount" class="login-check-hint">「{{ currentLoginAccount.name }}」</span>
            </div>
            <div class="login-check-webview-wrap" ref="loginCheckPanelRef">
              <div v-if="!currentLoginAccount" class="login-check-placeholder">
                <el-icon style="font-size: 48px; color: #c0c4cc;"><Monitor /></el-icon>
                <p>请从左侧选择一个失效账号</p>
                <p style="font-size: 12px; color: #aaa;">点击账号后将在此处显示登录页面</p>
              </div>
              <div v-else class="login-check-loading">
                <div class="login-check-loading-spinner"></div>
                <p>正在加载「{{ currentLoginAccount.name }}」登录页面...</p>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogLoginCheckVisible = false">关闭</el-button>
            <el-button type="primary" @click="handleCheckLoginStatus" :loading="checkingLogin">
              <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
              重新检测
            </el-button>
          </div>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch, inject, nextTick } from 'vue'
import { Refresh, Monitor } from '@element-plus/icons-vue'
import { checkWxSession } from '@/utils/cookie'
import Pagination from '@/components/Pagination'
import SelectPlatform from '@/components/selectPlatform'
import SelectUser from '@/components/selectUser'
import { listAccount, moveAccountsToGroup, setOperator, updateAccount } from '@/api/account'
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
// 获取父组件提供的触发微信登录方法
const triggerWechatLogin = inject('triggerWechatLogin', null)
// 获取父组件提供的打开账号 tab 方法
const openAccountTab = inject('openAccountTab', null)

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
const dialogLoginCheckVisible = ref(false)

// 登录状态检测
const checkingLogin = ref(false)
const checkProgressPct = ref(0)
const expiredAccounts = ref([])
const currentLoginAccount = ref(null)
const loginDoneIds = ref([])
const loginCheckPanelRef = ref(null)

// 监听主进程登录成功事件，标记当前账号已登录
let ipcCleanup = null
onMounted(() => {
  if (window.ipcRenderer) {
    ipcCleanup = window.ipcRenderer.receive('fromMain', async (data) => {
      if (data === 'wechat-login-success' || (data && data.tag === 'wechat:loginSuccess')) {
        if (currentLoginAccount.value && !loginDoneIds.value.includes(currentLoginAccount.value.id)) {
          loginDoneIds.value.push(currentLoginAccount.value.id)
          ElMessage.success(`账号「${currentLoginAccount.value.name}」登录成功`)
        }
      }
      if (data && data.tag === 'loginCheck:loginSuccess') {
        const accountId = data.data?.accountId
        if (accountId && !loginDoneIds.value.includes(accountId)) {
          loginDoneIds.value.push(accountId)
          ElMessage.success('登录成功，请点击「重新检测」刷新状态')
        }
      }
      if (data && data.tag === 'loginCheck:accountMismatch') {
        const { loggedUid, expectedUid, accountId } = data.data || {}
        // 账号不匹配：关闭 BrowserView，重置状态，提示用户重新点击账号登录
        if (window.ipcRenderer) {
          window.ipcRenderer.send('toMain', { tag: 'loginCheck:closeView' })
        }
        currentLoginAccount.value = null
        // 尝试将 gh_xxx 转换为公众号名称
        const allAccounts = store.state.accounts?.list || []
        const loggedAccount = allAccounts.find(a => String(a.original_id) === String(loggedUid))
        const expectedAccount = allAccounts.find(a => String(a.original_id) === String(expectedUid))
        const loggedName = loggedAccount ? loggedAccount.name : loggedUid
        const expectedName = expectedAccount ? expectedAccount.name : expectedUid
        ElMessage.warning(`账号不匹配（当前「${loggedName}」，期望「${expectedName}」），请重新点击左侧账号登录`)
      }
    })
  }
})

onUnmounted(() => {
  if (ipcCleanup) {
    ipcCleanup()
    ipcCleanup = null
  }
})

const checkProgressDash = computed(() => {
  const circumference = 2 * Math.PI * 15 // r=15
  const filled = (checkProgressPct.value / 100) * circumference
  return `${filled} ${circumference}`
})

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

// 新增分组
const dialogAddGroupVisible = ref(false)
const addGroupFormRef = ref(null)
const addGroupForm = reactive({ name: '' })
const addGroupRules = { name: [{ required: true, message: '分组名称不能为空', trigger: 'blur' }] }
const addGroupLoading = ref(false)

function openAddGroup() {
  addGroupForm.name = ''
  dialogAddGroupVisible.value = true
  nextTick(() => { if (addGroupFormRef.value) addGroupFormRef.value.clearValidate() })
}

async function submitAddGroup() {
  addGroupFormRef.value.validate(async (valid) => {
    if (!valid) return
    addGroupLoading.value = true
    try {
      const res = await addAccountGroup({ name: addGroupForm.name, parent_id: 0, sort_order: 0 })
      if (res && res.data && res.data.code === 1) {
        ElMessage.success(`分组"${addGroupForm.name}"创建成功`)
        dialogAddGroupVisible.value = false
        await loadAllGroups()
        await refreshGlobalAccountData()
      } else {
        throw new Error(res?.data?.msg || '创建分组失败')
      }
    } catch (error) {
      ElMessage.error(error?.data?.msg || error?.message || '创建分组失败')
    } finally {
      addGroupLoading.value = false
    }
  })
}

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

// 一键检测登录状态
async function handleCheckLoginStatus() {
  checkingLogin.value = true
  checkProgressPct.value = 0
  expiredAccounts.value = []
  loginDoneIds.value = []
  currentLoginAccount.value = null

  try {
    // 获取所有账号（不分页，num设大）
    const response = await listAccount({ page: 1, num: 9999, type: 1, sort: 'id', order: 'desc' })
    const allAccounts = (response?.data?.data?.list) || []
    const total = allAccounts.length
    if (total === 0) {
      ElMessage.info('暂无账号')
      return
    }

    const expired = []
    for (let i = 0; i < allAccounts.length; i++) {
      const acc = allAccounts[i]
      // 没有 session_id 的账号直接视为未登录
      const isExpired = !acc.session_id ? true : checkWxSession(acc)
      if (isExpired) expired.push(acc)
      checkProgressPct.value = Math.round(((i + 1) / total) * 100)
      // 让UI有机会更新
      if (i % 5 === 0) await nextTick()
    }

    expiredAccounts.value = expired

    if (expired.length === 0) {
      ElMessage.success('所有账号登录状态正常！')
    } else {
      ElMessage.warning(`检测完成，发现 ${expired.length} 个账号登录已失效`)
      dialogLoginCheckVisible.value = true
    }
  } catch (e) {
    console.error('检测登录状态失败:', e)
    ElMessage.error('检测失败：' + (e.message || '未知错误'))
  } finally {
    checkingLogin.value = false
  }
}

async function selectLoginAccount(acc) {
  // 先关闭旧的 BrowserView
  if (currentLoginAccount.value && window.ipcRenderer) {
    window.ipcRenderer.send('toMain', { tag: 'loginCheck:closeView' })
  }
  currentLoginAccount.value = acc
  // 等待 DOM 更新后获取面板坐标
  await nextTick()
  const plainAcc = JSON.parse(JSON.stringify(acc))
  if (loginCheckPanelRef.value && window.ipcRenderer) {
    const rect = loginCheckPanelRef.value.getBoundingClientRect()
    window.ipcRenderer.send('toMain', {
      tag: 'loginCheck:openView',
      account: plainAcc,
      bounds: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    })
  }
}

function doLoginAccount() {
  // 已废弃，由 selectLoginAccount 自动触发
}

function handleLoginCheckDialogOpen() {
  // 弹框打开时，禁用窗口控制按钮
  if (window.ipcRenderer) {
    window.ipcRenderer.send('toMain', { tag: 'loginCheck:setWindowControls', enabled: false })
  }
}

function handleLoginCheckDialogClose() {
  currentLoginAccount.value = null
  // 关闭弹框时销毁主进程中的 BrowserView
  if (window.ipcRenderer) {
    window.ipcRenderer.send('toMain', { tag: 'loginCheck:closeView' })
  }
  // 弹框关闭时，恢复窗口控制按钮
  if (window.ipcRenderer) {
    window.ipcRenderer.send('toMain', { tag: 'loginCheck:setWindowControls', enabled: true })
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

/* 圆形进度条 */
.check-progress-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
}
.check-progress-svg {
  width: 30px;
  height: 30px;
  transform: rotate(-90deg);
}
.check-progress-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}
.check-progress-bar {
  fill: none;
  stroke: #e6a23c;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.2s ease;
}
.check-progress-text {
  font-size: 12px;
  color: #e6a23c;
  font-weight: 600;
  min-width: 32px;
}

/* 登录检测弹框 */
.login-check-body {
  display: flex;
  gap: 0;
  height: 520px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.login-check-left {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.login-check-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.login-check-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}
.login-check-hint {
  font-size: 12px;
  color: #409eff;
  font-weight: 400;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.login-check-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.login-check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.login-check-item:hover {
  background: #f0f7ff;
}
.login-check-item.active {
  background: #e8f4ff;
  border-left: 3px solid #409eff;
}
.login-check-item.done {
  opacity: 0.6;
}
.login-check-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.login-check-info {
  flex: 1;
  min-width: 0;
}
.login-check-name {
  font-size: 13px;
  color: #222;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.login-check-platform {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.login-check-status {
  flex-shrink: 0;
}
.status-expired {
  font-size: 11px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 4px;
  padding: 2px 6px;
}
.status-ok {
  font-size: 11px;
  color: #67c23a;
  background: #f0f9eb;
  border-radius: 4px;
  padding: 2px 6px;
}
.login-check-empty {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 40px 0;
}
.login-check-webview-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.login-check-action-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  padding: 24px;
}
.login-check-acc-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 24px;
  width: 100%;
  max-width: 340px;
}
.login-check-acc-big-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #e5e7eb;
}
.login-check-acc-detail {
  display: flex;
  flex-direction: column;
}
.login-check-acc-big-name {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  margin-bottom: 4px;
}
.login-check-acc-big-plat {
  font-size: 12px;
  color: #909399;
}
.login-check-action-hint {
  text-align: center;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}
.login-check-action-hint p {
  margin: 0;
}
.login-check-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}
.login-check-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: login-check-spin 0.8s linear infinite;
}
@keyframes login-check-spin {
  to { transform: rotate(360deg); }
}
.login-check-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  gap: 12px;
}
.login-check-placeholder p {
  margin: 0;
  font-size: 14px;
}


</style>

