<template>
  <div class="advanced-forward-page h-full flex flex-col bg-gray-50">
    <!-- 顶部操作栏 -->
    <div class="header-section bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- 左侧操作按钮 -->
        <div class="flex items-center space-x-4">
          <el-button type="primary" size="default" class="px-4 py-2" @click="showAccountPicker">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增草稿
          </el-button>
          <el-button size="default" class="px-4 py-2 bg-white border border-gray-300" @click="autoSelectFirst">
            自动选择首篇草稿
          </el-button>
        </div>
        
        <!-- 右侧操作按钮 -->
        <div class="flex items-center space-x-3">
          <el-button type="primary" size="default" class="px-6 py-2 bg-blue-500 hover:bg-blue-600" @click="startGroupSend">
            <el-icon class="mr-1"><VideoPlay /></el-icon>
            开始群发
          </el-button>
          <el-button size="default" class="px-4 py-2 border border-red-300 text-red-500 hover:bg-red-50" @click="clearAll">
            清空
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- 左侧文章列表 -->
      <div class="w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
        <div class="p-4">
          <!-- 文章卡片列表 -->
          <div v-if="articles.length > 0">
            <div v-for="article in articles" :key="article.id" class="article-card bg-white border border-gray-200 rounded mb-2 shadow-sm">
              <div 
                class="article-header flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors" 
                :class="{ 
                  'border-b border-gray-100 rounded-t': article.expanded,
                  'rounded': !article.expanded
                }"
                @click="toggleArticle(article.id)"
              >
                <div class="flex items-center space-x-2">
                  <el-icon class="text-gray-400 text-sm">
                    <ArrowRight :class="{ 'rotate-90': article.expanded }" />
                  </el-icon>
                  <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    <img 
                      :src="article.avatarUrl || '/favicon.ico'" 
                      :alt="article.source"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span class="text-gray-900 text-sm">{{ article.title }}</span>
                </div>
                <el-icon 
                  class="text-red-500 cursor-pointer hover:text-red-600 text-sm"
                  @click.stop="deleteArticle(article.id)"
                >
                  <Close />
                </el-icon>
              </div>
              
              <!-- 展开的内容 -->
              <div v-if="article.expanded" class="article-content p-3">
                <div class="text-xs text-gray-600 mb-2">
                  <span class="font-medium">文章来源:</span> {{ article.source }}
                </div>
                
                <div class="relative mb-2">
                  <img 
                    :src="article.image" 
                    alt="文章缩略图"
                    class="w-full h-32 object-cover rounded"
                  />
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 rounded-b">
                    <div class="text-xs font-medium">{{ article.title }}</div>
                  </div>
                </div>
                
                <div class="text-xs text-gray-500">
                  更新于: {{ article.updateTime }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态显示 -->
          <div v-else class="empty-state flex flex-col items-center justify-center py-16">
            <div class="empty-icon mb-4">
              <el-icon size="80" class="text-gray-300">
                <Document />
              </el-icon>
            </div>
            <div class="empty-text text-center">
              <h3 class="text-lg font-medium text-gray-500 mb-2">暂无文章</h3>
              <p class="text-sm text-gray-400 mb-6">点击"新增草稿"按钮添加文章到群发列表</p>
              <el-button 
                type="primary" 
                size="default" 
                class="px-6 py-2"
                @click="showAccountPicker"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                新增草稿
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧设置面板 -->
      <div class="w-1/2 bg-white overflow-y-auto">
        <div class="p-6">
          
          <!-- 设置项列表 -->
          <div class="space-y-6">
            <!-- 自选账号 -->
            <div class="setting-item">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-700 font-medium">自选账号</span>
                  <el-tooltip 
                    content="开启后，可以自选发布账号，如果未开启，则发布到草稿所在账号" 
                    placement="top"
                  >
                    <el-icon class="text-gray-400 cursor-pointer">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
                <el-switch v-model="settings.customAccountEnabled" />
              </div>
              
              <!-- 自选账号内容区域 -->
              <div v-if="settings.customAccountEnabled" class="custom-account-content">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm text-gray-600">当前已选择 {{ customAccounts.length }} 个账号</span>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="showCustomAccountPicker"
                    class="flex items-center"
                  >
                    <el-icon class="mr-1"><Plus /></el-icon>
                    增加账号
                  </el-button>
                </div>
                
                <!-- 已选择的账号列表 -->
                <div v-if="customAccounts.length > 0" class="selected-accounts-list">
                  <div class="flex flex-wrap gap-2">
                    <div 
                      v-for="account in customAccounts" 
                      :key="account.id"
                      class="account-chip flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2 min-w-0 max-w-full"
                    >
                      <div class="flex items-center space-x-1 flex-1 min-w-0">
                        <div class="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-white flex-shrink-0">
                          <img 
                            :src="account.avatar || '/favicon.ico'" 
                            :alt="account.name"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <span class="text-xs text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{{ account.name }}</span>
                      </div>
                      <el-icon 
                        class="text-red-500 cursor-pointer hover:text-red-600 flex-shrink-0 ml-1 text-xs"
                        @click="removeCustomAccount(account.id)"
                      >
                        <Close />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 群发间隔 -->
            <div class="setting-item flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-gray-700 font-medium">群发间隔</span>
                <el-tooltip 
                  content="设置每次群发请求之间的等待时间（秒）。若未为每个账号单独配置代理，建议设为3秒以上，间隔过短可能导致请求过频而失败。" 
                  placement="top"
                  :show-after="200"
                >
                  <el-icon class="text-gray-400 cursor-pointer">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </div>
              <div class="flex items-center space-x-2">
                <el-input v-model="settings.sendInterval" class="w-16" />
                <span class="text-gray-500">秒</span>
              </div>
            </div>
            
            <!-- 群发通知 -->
            <div class="setting-item">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-700 font-medium">群发通知</span>
                  <el-tooltip 
                    content="启用后，发布的内容会出现在粉丝的公众号消息列表和账号主页中，有机会获得微信官方流量推荐。" 
                    placement="top"
                    :show-after="200"
                  >
                    <el-icon class="text-gray-400 cursor-pointer">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
                <el-switch v-model="settings.sendNotification" />
              </div>
              
              <!-- 群发通知内容区域 -->
              <div v-if="settings.sendNotification" class="group-notify-content">
                <GroupNotifySelect v-model="groupNotifyParams" :show-tag-select="false" />
              </div>
            </div>
            
            <!-- 定时发表 -->
            <div class="setting-item">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-700 font-medium">定时发表</span>
                  <el-tooltip 
                    content="支持设定5分钟后至7天内的任意发布时间，设置成功后无法修改，但可在发布前取消且不消耗群发次数。" 
                    placement="top"
                    :show-after="200"
                  >
                    <el-icon class="text-gray-400 cursor-pointer">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
                <el-switch v-model="settings.scheduledPublish" />
              </div>
              
              <!-- 定时发表内容区域 -->
              <div v-if="settings.scheduledPublish" class="scheduled-publish-content">
                <div class="flex space-x-2">
                  <el-select 
                    v-model="selectedPublishDate" 
                    class="grid-content-control" 
                    value-key="id" 
                    filterable
                    placeholder="选择定时发布日期" 
                    @change="handleChangeForPublishDate" 
                    style="width:140px"
                  >
                    <el-option 
                      v-for="(item) in publishDates" 
                      :key="item.id" 
                      :label="item.name" 
                      :value="item" 
                    />
                  </el-select>
                  <el-time-picker 
                    v-model="publishTime" 
                    format="HH:mm" 
                    :disabled-hours="disableHours"
                    :disabled-minutes="disableMinutes" 
                    class="rounded-xl border-none" 
                    style="width:130px" 
                  />
                </div>
                <div class="text-xs text-gray-500 mt-2">
                  可选择5分钟后的7天内任意时刻发布
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>

    <!-- 公众号选择弹窗 -->
    <AccountPickerModal 
      v-model="showAccountModal" 
      @confirm="handleAccountSelected"
    />

    <!-- 草稿选择弹窗 -->
    <DraftPickerModal
      v-model="showDraftModal"
      :selected-account="currentAccount"
      @confirm="handleDraftSelected"
    />
    
    <!-- 自选账号多选弹窗 -->
    <AccountPickerModal 
      v-model="showCustomAccountModal" 
      :multiple="true"
      :selected-accounts="[]"
      @confirm="handleCustomAccountsSelected"
    />
    
    <!-- 自动首篇草稿：公众号多选弹窗 -->
    <AccountPickerModal 
      v-model="showAutoFirstAccountModal" 
      :multiple="true"
      :selected-accounts="[]"
      @confirm="handleAutoFirstAccountsSelected"
    />
    
    <!-- 预览任务列表弹窗 -->
    <PreviewTaskList
      v-model:visible="showPreviewModal"
      :tasks="previewTasks"
      @confirm="handlePreviewConfirm"
      @cancel="handlePreviewCancel"
    />

    <!-- 任务进度浮层（右下角） -->
    <ProgressToast 
      v-model:visible="showProgressToast"
      :target-name="progressTargetName"
      :status-text="progressStatusText"
      :article-title="progressArticleTitle"
      :percentage="progressPercent"
      :current="progressCurrent"
      :total="progressTotal"
      :messages="progressMessages"
      :completed="progressCompleted"
      :success-count="progressSuccessCount"
      :failed-count="progressFailedCount"
      @cancel="handleCancelRemainingTasks"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, provide } from 'vue'
import { 
  Plus, 
  QuestionFilled, 
  VideoPlay, 
  Close, 
  ArrowRight,
  Document
} from '@element-plus/icons-vue'
import AccountPickerModal from '@/components/AccountPickerModal.vue'
import DraftPickerModal from '@/components/DraftPickerModal.vue'
import PreviewTaskList from '@/dlgs/previewTaskList.vue'
import ProgressToast from '@/dlgs/progressToast.vue'
import GroupNotifySelect from '@/components/editor/GroupNotifySelect.vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { createDateByDays, formatDate } from '@/utils/date'
import { HOUSRS, MINUTES } from '@/utils/constants'
import { send_to_other_accounts_events } from '@/api/appmsg'
import { stat_appmsg_copyright_stat_events, getMasssendInfo, getQrcodeMobileValidate, query_appmsg_publish_qrcode_validate_events } from '@/api/mp_wechat'
import { serializeCookie } from '@/utils/cookie'
import { getToken } from '@/utils/auth'
import JSON5 from 'json5'
import { useDraftSync } from '@/composables/useDraftSync'

// 路由
const router = useRouter()

// 使用草稿同步 composable
const draftSync = useDraftSync('advanced_forward')

// 弹窗控制
const showAccountModal = ref(false)
const showDraftModal = ref(false)
const currentAccount = ref(null)
const showCustomAccountModal = ref(false)
const showAutoFirstAccountModal = ref(false)
const showPreviewModal = ref(false)
const showProgressToast = ref(false)

// 任务进度浮层状态
const progressTargetName = ref('')
const progressStatusText = ref('')
const progressArticleTitle = ref('')
const progressPercent = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressMessages = ref([])
const progressCancelFlag = ref(false)
// 完成态与统计
const progressCompleted = ref(false)
const progressSuccessCount = ref(0)
const progressFailedCount = ref(0)

// 等待单次发布结果（基于 source 关联键）
const waitForPublishResult = (expectSource) => {
  return new Promise((resolve) => {
    const clean = window.ipcRenderer.receive('fromMain', (msg) => {
      if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
        const tag = msg.tag
        if (tag === 'appmsg-ret:publishToWechat') {
          const { source, ret } = msg.data || {}
          if (source === expectSource) {
            clean()
            resolve(ret)
          }
        }
      }
    })
    // 超时保护 10s
    setTimeout(() => {
      try { clean && clean() } catch {}
      resolve({ success: false, msg: '发布超时' })
    }, 10000)
  })
}

// 设置数据
const settings = reactive({
  sendInterval: '3',
  sendNotification: false,
  notificationRegion: 'all',
  notificationGender: 'all',
  scheduledPublish: false,
  customAccountEnabled: false
})

// 自选账号数据
const customAccounts = ref([])

// 文章列表数据
const articles = ref([])

// 定时发布相关数据
const publishDates = ref([])
const selectedPublishDate = ref(null)
const publishTime = ref(null)

// 群发通知相关数据
const groupNotifyParams = ref('')

// 为 GroupNotifySelect 组件提供一个默认账号（可选）
const defaultSelectedAccount = computed(() => {
  // 优先使用自选账号的第一个
  if (customAccounts.value.length > 0) {
    return customAccounts.value[0]
  }
  // 否则使用文章中的第一个账号
  if (articles.value.length > 0 && articles.value[0].accountData) {
    return articles.value[0].accountData
  }
  // getRegions 接口不需要账号，所以返回 null 也可以
  return null
})

// 提供给子组件
provide('selectedAccount', defaultSelectedAccount)

// 预览任务列表计算属性
const previewTasks = computed(() => {
  return generatePreviewTasks()
})

// 弹窗相关方法
const showAccountPicker = () => {
  showAccountModal.value = true
}

const handleAccountSelected = (selectedAccount) => {
  console.log('选择的公众号:', selectedAccount)
  // 选择公众号后，直接打开草稿选择对话框
  currentAccount.value = selectedAccount
  showDraftModal.value = true
}

// 处理选择的草稿
const handleDraftSelected = async (result) => {
  console.log('选择的草稿:', result)
  
  if (result.drafts.length === 0) {
    ElMessage.warning('请至少选择一篇草稿')
    return
  }
  
  showDraftModal.value = false
  
  try {
    // 使用封装好的同步方法
    const syncResult = await draftSync.syncDraftsToLocal(
      result.drafts,
      result.account,
      {
        showLoading: true,
        onProgress: (progress) => {
          console.log('同步进度:', progress)
        }
      }
    )
    
    const { synced, ready, failed } = syncResult
    
    // 添加所有成功的草稿到列表
    const allSuccessDrafts = [...ready, ...synced]
    let addedCount = 0
    const duplicates = [] // 记录重复的草稿
    
    // 获取已存在的草稿 app_id 集合
    const existingAppIds = new Set(
      articles.value
        .filter(article => article.draftData?.app_id)
        .map(article => article.draftData.app_id)
    )
    
    for (const draft of allSuccessDrafts) {
      const draftAppId = draft.app_id
      
      // 检查是否重复
      if (draftAppId && existingAppIds.has(draftAppId)) {
        duplicates.push({
          title: draft.multi_item[0]?.title || '无标题',
          appId: draftAppId
        })
        continue // 跳过重复的草稿
      }
      
      const article = {
        id: Date.now() + Math.random(),
        title: draft.multi_item[0]?.title || '无标题',
        source: result.account.name || result.account.account_id,
        avatar: (result.account.name || result.account.account_id).charAt(0),
        avatarUrl: result.account.avatar || null,
        image: draft.multi_item[0]?.cdn_url || 'https://via.placeholder.com/300x200',
        updateTime: new Date(draft.update_time * 1000).toLocaleString(),
        expanded: false,
        draftData: draft,
        accountData: result.account,
        isLocal: true
      }
      articles.value.push(article)
      
      // 将新添加的 app_id 加入集合
      if (draftAppId) {
        existingAppIds.add(draftAppId)
      }
      
      addedCount++
    }
    
    // 显示重复草稿提示
    if (duplicates.length > 0) {
      const duplicateTitles = duplicates.map(d => d.title).join('、')
      ElMessage.warning({
        message: `${duplicates.length} 篇草稿已存在，已自动过滤: ${duplicateTitles}`,
        duration: 5000
      })
    }
    
    // 显示结果消息
    if (addedCount > 0) {
      const successMsg = synced.length > 0 
        ? `已添加 ${addedCount} 篇草稿（其中 ${synced.length} 篇已自动同步到本地）`
        : `已添加 ${addedCount} 篇草稿`
      ElMessage.success(successMsg)
    } else if (duplicates.length > 0) {
      // 如果所有草稿都是重复的
      ElMessage.info('所选草稿均已存在，未添加新草稿')
    }
    
    // 显示失败的草稿
    if (failed.length > 0) {
      const failedTitles = failed.map(f => f.draft.multi_item[0]?.title).join('、')
      ElMessage.warning({
        message: `${failed.length} 篇草稿同步失败: ${failedTitles}`,
        duration: 5000
      })
    }
    
  } catch (error) {
    console.error('处理草稿失败:', error)
    ElMessage.error(`处理草稿失败: ${error.message}`)
  }
}

const autoSelectFirst = () => {
  // 弹出公众号多选弹窗
  showAutoFirstAccountModal.value = true
}

// 获取指定账号的首篇草稿（最新一篇）
const fetchFirstDraftForAccount = (account) => {
  return new Promise((resolve, reject) => {
    try {
      if (!account?.id || !account?.session_id || !account?.token) {
        return resolve(null)
      }
      const sourceKey = `auto_first_${account.id}_${Date.now()}`
      const clean = window.ipcRenderer.receive('fromMain', (msg) => {
        if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
          const tag = msg.tag
          if (tag === 'appmsg-ret:listAppmsgsInDraftBox') {
            const { source, ret } = msg.data || {}
            if (source !== sourceKey) return
            try { clean && clean() } catch {}
            if (!ret?.success) {
              const err = ret?.err_msg || '获取草稿失败'
              return reject(new Error(err))
            }
            const items = (ret?.items || []).map((it) => ({
              ...it,
              multi_item: (it.multi_item || []).map(sub => ({
                ...sub,
                title: sub.title ? sub.title.replace(/<\/?em>/g, '') : sub.title
              }))
            }))
            resolve(items[0] || null)
          }
        }
      })
      window.ipcRenderer.send('toMain', {
        tag: 'appmsg:listAppmsgsInDraftBox',
        source: sourceKey,
        token: getToken(),
        wechat_id: account.id,
        listData: {
          cookies: serializeCookie(JSON.parse(account.session_id)["cookie"]),
          token: parseInt(account.token),
          query: '',
          begin: 0,
          count: 1
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

// 处理“自动选择首篇草稿”账号确认
const handleAutoFirstAccountsSelected = async (selectedAccounts) => {
  try {
    showAutoFirstAccountModal.value = false
    if (!selectedAccounts || selectedAccounts.length === 0) {
      ElMessage.warning('请至少选择一个公众号')
      return
    }

    // 先并发获取每个账号的首篇草稿
    const fetchPromises = selectedAccounts.map(acc => (
      fetchFirstDraftForAccount(acc)
        .then(draft => ({ account: acc, draft }))
        .catch(err => ({ account: acc, error: err }))
    ))
    const fetchResults = await Promise.all(fetchPromises)

    const toProcess = fetchResults.filter(r => r.draft && !r.error)
    const noData = fetchResults.filter(r => !r.draft && !r.error)
    const failedFetch = fetchResults.filter(r => r.error)

    // 记录已存在的草稿 app_id，避免重复
    const existingAppIds = new Set(
      articles.value
        .filter(article => article.draftData?.app_id)
        .map(article => article.draftData.app_id)
    )

    let addedCount = 0
    const duplicates = []

    // 逐个账号同步并加入列表（保持进度提示可见性）
    for (const item of toProcess) {
      const { account, draft } = item
      try {
        const syncResult = await draftSync.syncDraftsToLocal([
          draft
        ], account, {
          showLoading: true,
          onProgress: () => {}
        })

        const { synced, ready } = syncResult
        const allSuccessDrafts = [...ready, ...synced]
        for (const d of allSuccessDrafts) {
          const draftAppId = d.app_id
          if (draftAppId && existingAppIds.has(draftAppId)) {
            duplicates.push({
              title: d.multi_item?.[0]?.title || '无标题',
              appId: draftAppId
            })
            continue
          }
          const article = {
            id: Date.now() + Math.random(),
            title: d.multi_item?.[0]?.title || '无标题',
            source: account.name || account.account_id,
            avatar: (account.name || account.account_id)?.charAt(0),
            avatarUrl: account.avatar || null,
            image: d.multi_item?.[0]?.cdn_url || 'https://via.placeholder.com/300x200',
            updateTime: new Date(d.update_time * 1000).toLocaleString(),
            expanded: false,
            draftData: d,
            accountData: account,
            isLocal: true
          }
          articles.value.push(article)
          if (draftAppId) existingAppIds.add(draftAppId)
          addedCount++
        }
      } catch (e) {
        console.error('同步首篇草稿失败:', e)
      }
    }

    if (duplicates.length > 0) {
      const duplicateTitles = duplicates.map(d => d.title).join('、')
      ElMessage.warning({
        message: `${duplicates.length} 篇草稿已存在，已自动过滤: ${duplicateTitles}`,
        duration: 5000
      })
    }

    if (addedCount > 0) {
      ElMessage.success(`已添加 ${addedCount} 篇草稿`)
    } else if (duplicates.length > 0) {
      ElMessage.info('所选草稿均已存在，未添加新草稿')
    }

    if (noData.length > 0) {
      ElMessage.info(`${noData.length} 个账号暂无草稿`)
    }
    if (failedFetch.length > 0) {
      ElMessage.warning(`${failedFetch.length} 个账号获取草稿失败`)
    }
  } catch (error) {
    console.error('自动选择首篇草稿失败:', error)
    ElMessage.error(`自动选择首篇草稿失败: ${error.message}`)
  }
}

const startGroupSend = () => {
  console.log('开始群发')
  
  // 检查是否有文章
  if (articles.value.length === 0) {
    ElMessage.warning('请先添加要群发的文章')
    return
  }
  
  // 检查是否有目标账号
  const targetAccounts = settings.customAccountEnabled ? customAccounts.value : []
  if (settings.customAccountEnabled && targetAccounts.length === 0) {
    ElMessage.warning('请先选择要群发的账号')
    return
  }
  
  // 生成预览任务列表
  const previewTasks = generatePreviewTasks()
  
  // 显示预览弹窗
  showPreviewModal.value = true
}

const clearAll = () => {
  console.log('清空')
  if (articles.value.length > 0) {
    articles.value = []
    ElMessage.success('已清空所有文章')
  } else {
    ElMessage.info('列表已为空')
  }
}

const deleteArticle = (id) => {
  console.log('删除文章', id)
  // 从文章列表中移除指定ID的文章
  const index = articles.value.findIndex(article => article.id === id)
  if (index > -1) {
    articles.value.splice(index, 1)
    ElMessage.success('文章已删除')
  }
}

const toggleArticle = (id) => {
  const article = articles.value.find(a => a.id === id)
  if (article) {
    article.expanded = !article.expanded
  }
}

// 自选账号相关方法
const showCustomAccountPicker = () => {
  showCustomAccountModal.value = true
}

const handleCustomAccountsSelected = (selectedAccounts) => {
  console.log('选择的自选账号:', selectedAccounts)
  
  // 过滤掉已经存在的账号，只添加新的账号
  const existingIds = customAccounts.value.map(account => account.id)
  const newAccounts = selectedAccounts.filter(account => !existingIds.includes(account.id))
  
  if (newAccounts.length > 0) {
    // 添加新账号到现有列表中
    customAccounts.value.push(...newAccounts)
    ElMessage.success(`已添加 ${newAccounts.length} 个新账号`)
  } else {
    ElMessage.info('所选账号已存在，未添加重复账号')
  }
}

const removeCustomAccount = (accountId) => {
  const index = customAccounts.value.findIndex(account => account.id === accountId)
  if (index > -1) {
    customAccounts.value.splice(index, 1)
  }
}

// 生成预览任务列表
const generatePreviewTasks = () => {
  const tasks = []
  
  // 获取目标账号列表
  let targetAccounts = []
  
  if (settings.customAccountEnabled) {
    // 使用自选账号
    targetAccounts = [...customAccounts.value]
  } else {
    // 使用文章中的账号
    const accountMap = new Map()
    articles.value.forEach(article => {
      if (article.accountData) {
        const account = article.accountData
        if (!accountMap.has(account.id)) {
          accountMap.set(account.id, account)
        }
      }
    })
    targetAccounts = Array.from(accountMap.values())
  }
  
  // 为每个文章和每个账号组合生成任务
  articles.value.forEach(article => {
    targetAccounts.forEach(account => {
      const task = {
        id: `${article.id}_${account.id}`,
        title: article.title,
        accountName: account.name || account.account_id,
        accountId: account.account_id,
        accountAvatar: account.avatar,
        isImmediate: !settings.scheduledPublish,
        publishTime: settings.scheduledPublish ? 
          formatScheduledTime(selectedPublishDate.value, publishTime.value) : 
          '立即发布',
        publishDateTime: settings.scheduledPublish ? 
          new Date(`${selectedPublishDate.value.id} ${formatTime(publishTime.value)}`) : 
          new Date(),
        articleData: article,
        accountData: account
      }
      tasks.push(task)
    })
  })
  
  return tasks
}

// 格式化定时发布时间
const formatScheduledTime = (dateObj, timeObj) => {
  if (!dateObj || !timeObj) return '立即发布'
  
  const date = new Date(timeObj)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${dateObj.id} ${hours}:${minutes}`
}

// 格式化时间
const formatTime = (timeObj) => {
  if (!timeObj) return '00:00'
  
  const date = new Date(timeObj)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
}

// 预览任务列表相关方法
const handlePreviewConfirm = (tasks) => {
  console.log('确认群发任务:', tasks)
  ElMessage.success(`开始群发 ${tasks.length} 个任务`)
  
  showPreviewModal.value = false
  // 显示右下角任务进度浮层
  showProgressToast.value = true
  // 初始化并开始处理任务（顺序模拟处理，支持取消）
  startProcessingTasks(tasks)
}

// 取消剩余任务
const handleCancelRemainingTasks = () => {
  progressCancelFlag.value = true
  progressStatusText.value = '已取消剩余任务'
}

// 简单的sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 顺序处理任务 - 同步草稿到目标账号
const startProcessingTasks = async (tasks) => {
  progressMessages.value = []
  progressCancelFlag.value = false
  progressTargetName.value = ''
  progressArticleTitle.value = ''
  progressStatusText.value = ''
  progressTotal.value = tasks.length
  progressCurrent.value = 0
  progressPercent.value = 0
  progressCompleted.value = false
  progressSuccessCount.value = 0
  progressFailedCount.value = 0

  // 记录失败的账号ID，避免重复处理
  const failedAccounts = new Set()
  // 记录有原创问题的草稿ID，避免其他账号继续处理
  const failedDrafts = new Set()

  for (let i = 0; i < tasks.length; i++) {
    if (progressCancelFlag.value) {
      progressMessages.value.unshift({
        type: 'warning',
        text: '任务已取消',
        subtext: `剩余 ${tasks.length - i} 个任务未执行`
      })
      break
    }
    
    const task = tasks[i]

    // 检查该账号是否已经失败，如果失败则跳过
    const accountId = task.accountData?.id || task.accountData?.wechat_id || task.accountName
    if (failedAccounts.has(accountId)) {
      // 更新进度和显示信息
      progressCurrent.value = i + 1
      progressTargetName.value = task.accountName || ''
      progressArticleTitle.value = task.title || ''
      progressStatusText.value = '账号已跳过'
      progressPercent.value = Math.floor(((i + 1) / tasks.length) * 100)
      
      progressMessages.value.unshift({
        type: 'warning',
        text: '已跳过: 该账号存在问题。',
        subtext: `《${task.title}》- 「${task.accountName}」`
      })
      
      progressFailedCount.value++
      continue
    }

    // 检查该草稿是否有原创问题，如果有则跳过
    const draftId = task.articleData?.draftData?.app_id
    if (draftId && failedDrafts.has(draftId)) {
      // 更新进度和显示信息
      progressCurrent.value = i + 1
      progressTargetName.value = task.accountName || ''
      progressArticleTitle.value = task.title || ''
      progressStatusText.value = '草稿已跳过'
      progressPercent.value = Math.floor(((i + 1) / tasks.length) * 100)
      
      progressMessages.value.unshift({
        type: 'warning',
        text: '已跳过: 该草稿存在原创问题',
        subtext: `《${task.title}》- 「${task.accountName}」`
      })
      
      progressFailedCount.value++
      continue
    }

    // 在任务开始时就更新进度
    progressCurrent.value = i + 1
    progressTargetName.value = task.accountName || ''
    progressArticleTitle.value = task.title || ''
    progressStatusText.value = '正在同步草稿…'
    progressPercent.value = Math.floor(((i + 1) / tasks.length) * 100)

    try {
      // =============================================
      // 第一步：同步草稿到目标账号
      // =============================================
      const sourceArticle = task.articleData
      const sourceAccount = sourceArticle.accountData
      const targetAccount = task.accountData
      
      let appmsgidRaw = sourceArticle?.draftData?.app_id
      
      // 检查必需的字段并转换为整数
      const sourceWechatId = parseInt(sourceAccount?.id || sourceAccount?.wechat_id)
      const targetWechatId = parseInt(targetAccount?.id || targetAccount?.wechat_id)
      const appmsgid = parseInt(appmsgidRaw)
      
      if (!sourceWechatId || isNaN(sourceWechatId)) {
        throw new Error(`源账号ID不存在或无效: ${sourceAccount?.id}`)
      }
      if (!targetWechatId || isNaN(targetWechatId)) {
        throw new Error(`目标账号ID不存在或无效: ${targetAccount?.id}`)
      }
      if (!appmsgid || isNaN(appmsgid)) {
        throw new Error(`草稿ID(appmsgid)不存在或无效: ${sourceArticle?.draftData?.appmsgid}`)
      }
      
      // 目标账号会话与token，仅声明一次复用
      const targetSessionId = targetAccount?.session_id
      const targetToken = targetAccount?.token
      
      // 前置检查：账号信息不完整，直接跳过
      if (!targetSessionId || !targetToken) {
        console.warn('目标账号缺少 session_id 或 token，跳过该任务')
        progressMessages.value.unshift({
          type: 'error',
          text: '跳过: 账号信息不完整',
          subtext: `《${task.title}》- 「${task.accountName}」`
        })
        progressFailedCount.value++
        failedAccounts.add(accountId)
        continue
      }

      // 检查是否是同一个账号，如果是则跳过同步
      let syncSuccess = false
      let newMsgIds = null
      let syncResult = null
      
      if (sourceWechatId === targetWechatId) {
        // 同一账号，无需同步
    // progressMessages.value.unshift({
    //       type: 'info',
    //       text: `「${task.accountName}」同一账号无需同步草稿`,
    //       subtext: task.title
    //     })
        syncSuccess = true
        // 不需要同步时，使用原始草稿的msg_ids
        newMsgIds = sourceArticle.draftData.multi_item?.map(item => item.msg_id)
      } else {
        // 不同账号，需要同步

        await send_to_other_accounts_events({
          source_wechat_id: sourceWechatId,
          soruce_appmsgid: appmsgid,
          target_wechat_ids: [targetWechatId]
        }, (data) => {
          try {
            // 解析SSE数据
            const lines = data.split('\n').filter(line => line.trim())
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6)
                const stepData = JSON5.parse(jsonStr)
                
                // 更新进度描述（但不更新百分比，因为我们按任务数计算）
                if (stepData.desc) {
                  progressStatusText.value = stepData.desc
                }
                
                // 保存最终结果
                if (stepData.result) {
                  syncResult = stepData.result
                }
              }
            }
          } catch (err) {
            console.error('解析SSE数据失败:', err)
          }
        })

        // 检查同步结果
        if (syncResult) {
          // 后端返回的账号列表，使用 original_id 或 name 进行匹配
          const successAccount = syncResult.success_accounts?.find(
            acc => acc.original_id === targetAccount.account_id || 
                   acc.original_id === targetAccount.original_id ||
                   acc.name === targetAccount.name
          )
          const failAccount = syncResult.fail_accounts?.find(
            acc => acc.original_id === targetAccount.account_id ||
                   acc.original_id === targetAccount.original_id ||
                   acc.name === targetAccount.name
          )

          if (successAccount) {
            console.log('同步成功:', successAccount)
            // progressMessages.value.unshift({
            //   type: 'info',
            //   text: '同步成功',
            //   subtext: `《${task.title}》- 「${task.accountName}」`
            // })
            console.log('同步成功，新的 msg_ids:', successAccount.new_msg_ids)
            syncSuccess = true
            newMsgIds = successAccount.new_msg_ids
          } else if (failAccount) {
            progressMessages.value.unshift({
              type: 'error',
              text: `同步失败: ${failAccount.reason || '未知错误'}`,
              subtext: `《${task.title}》- 「${task.accountName}」`
            })
            console.warn('同步失败原因:', failAccount.reason)
            
            // 如果是同步接口返回 session 失效，标记该账号
            const reason = failAccount.reason || ''
            if (reason.includes('session失效')) {
              failedAccounts.add(accountId)
            }
          progressFailedCount.value++
            continue // 同步失败，跳过后续步骤
            
          } else {
            // 如果只有一个目标账号，且有成功或失败列表，则使用第一个结果
            if (syncResult.success_accounts?.length > 0) {
              // progressMessages.value.unshift({
              //   type: 'info',
              //   text: '同步成功',
              //   subtext: `《${task.title}》- 「${task.accountName}」`
              // })
              syncSuccess = true
              newMsgIds = syncResult.success_accounts[0].new_msg_ids
            } else if (syncResult.fail_accounts?.length > 0) {
              progressMessages.value.unshift({
                type: 'error',
                text: `同步失败: ${syncResult.fail_accounts[0].reason || '未知错误'}`,
                subtext: `《${task.title}》- 「${task.accountName}」`
              })
              progressFailedCount.value++
              continue // 同步失败，跳过后续步骤
            } else {
              progressMessages.value.unshift({
                type: 'warning',
                text: '同步状态未知',
                subtext: `《${task.title}》- 「${task.accountName}」`
              })
            }
          }
        } else {
          progressMessages.value.unshift({
            type: 'error',
            text: '同步失败: 未知错误',
            subtext: `《${task.title}》- 「${task.accountName}」`
          })
          progressFailedCount.value++
          continue // 同步失败，跳过后续步骤
        }
      }

      // 在步骤之间检查取消标志
      if (progressCancelFlag.value) {
        progressMessages.value.unshift({
          type: 'warning',
          text: '任务已取消',
          subtext: `《${task.title}》- 「${task.accountName}」`
        })
        break
      }

      // =============================================
      // 第二步：原创性检测
      // =============================================
      if (syncSuccess && newMsgIds) {
        progressStatusText.value = '正在原创性检测…'
        
        try {
          // 获取新的 appmsgid
          // 注意：这里需要使用同步后的 appmsgid
          // 1. 如果是同一账号，使用原始的 appmsgid
          // 2. 如果是不同账号，使用后端返回的新 appmsgid
          let checkAppmsgid = appmsgid
          
          // 如果同步了草稿（不同账号），使用新的 appmsgid
          if (syncResult && syncResult.success_accounts) {
            const successAccount = syncResult.success_accounts.find(
              acc => acc.original_id === targetAccount.account_id || 
                     acc.original_id === targetAccount.original_id ||
                     acc.name === targetAccount.name
            )
            if (successAccount?.new_appmsgid) {
              checkAppmsgid = successAccount.new_appmsgid
              console.log('使用新的 appmsgid 进行原创性检测:', checkAppmsgid)
            }
          }
          
          const cookies = serializeCookie(JSON.parse(targetSessionId)["cookie"])
          
          let copyrightResult = null
          
          await stat_appmsg_copyright_stat_events({
            appmsgid: checkAppmsgid,
            cookies: cookies,
            token: parseInt(targetToken),
          }, (data) => {
            try {
              const v = data.replaceAll(/data: /gi, "")
              copyrightResult = JSON5.parse(v)
            } catch (err) {
              console.error("解析原创性检测结果失败:", err)
            }
          })
          
          if (copyrightResult) {
            if (copyrightResult.copyright === 1) {
              // 检测到原创问题
              const copyrightList = JSON.parse(copyrightResult.list_json_str || '{"list":[]}')
              const issueCount = copyrightList.list?.length || 0
              
              progressMessages.value.unshift({
                type: 'error',
                text: `检测到原创问题: ${issueCount} 篇内容相似度过高，建议人工审核`,
                subtext: `《${task.title}》- 「${task.accountName}」`
              })
              
              console.warn('原创性检测发现问题:', copyrightList)
              
              // 将草稿标记为失败，其他账号跳过此草稿
              failedDrafts.add(appmsgid)
              console.warn(`《${task.title}》(ID: ${appmsgid}) 存在原创问题，已标记为失败`)
              progressFailedCount.value++
              continue // 原创问题，跳过后续步骤
            } else if (copyrightResult.copyright === 0) {
              // 通过原创检测
              // progressMessages.value.unshift({
              //   type: 'info',
              //   text: `通过原创性检测`,
              //   subtext: `《${task.title}》- 「${task.accountName}」`
              // })
            } else {
              // 未知状态
              progressMessages.value.unshift({
                type: 'warning',
                text: `原创性检测状态未知`,
                subtext: `《${task.title}》- 「${task.accountName}」`
              })
            }
          } else {
            progressMessages.value.unshift({
              type: 'warning',
              text: '原创性检测无响应',
              subtext: `《${task.title}》- 「${task.accountName}」`
            })
          }
        } catch (error) {
          console.error('原创性检测失败:', error)
          progressMessages.value.unshift({
            type: 'error',
            text: `原创性检测失败: ${error.message || '未知错误'}`,
            subtext: `《${task.title}》- 「${task.accountName}」`
          })
        }
      }

      // 在步骤之间检查取消标志
      if (progressCancelFlag.value) {
        progressMessages.value.unshift({
          type: 'warning',
          text: '任务已取消',
          subtext: `《${task.title}》- 「${task.accountName}」`
        })
        break
      }

      // =============================================
      // 第三步：发布时间检测（群发次数检测）
      // 注意：只有开启"群发通知"时才需要检测
      // =============================================
      if (syncSuccess && newMsgIds && settings.sendNotification) {
        progressStatusText.value = '正在检测群发次数…'
        
        try {
          // 获取 appmsgid（同步后的或原始的）
          let checkAppmsgid = appmsgid
          
          if (syncResult && syncResult.success_accounts) {
            const successAccount = syncResult.success_accounts.find(
              acc => acc.original_id === targetAccount.account_id || 
                     acc.original_id === targetAccount.original_id ||
                     acc.name === targetAccount.name
            )
            if (successAccount?.new_appmsgid) {
              checkAppmsgid = successAccount.new_appmsgid
              console.log('使用新的 appmsgid 进行发布时间检测:', checkAppmsgid)
            }
          }
          
          const cookies = serializeCookie(JSON.parse(targetSessionId)["cookie"])
          
          const masssendResult = await getMasssendInfo({
            appmsgid: checkAppmsgid,
            cookies: cookies,
            token: parseInt(targetToken),
          })
          
          if (masssendResult && masssendResult.data) {
            // 检查群发次数
            const quotaDetail = masssendResult.data.quota_detail_list?.find(
              v => v.quota_type === 'kQuotaTypeMassSendNormal'
            )
            
            if (quotaDetail) {
              // 获取发布日期（如果是定时发布，使用选定的日期；否则使用今天）
              const publishDate = settings.scheduledPublish && selectedPublishDate.value
                ? new Date(selectedPublishDate.value.id)
                : new Date()
              
              const dateStr = formatDate(publishDate, 'yyyyMMdd')
              
              // 查找该日期的群发限额
              const quotaItem = quotaDetail.quota_item_list?.find(v => v.str_date === dateStr)
              
              if (quotaItem) {
                const remainingQuota = quotaItem.quota || 0
                
                if (remainingQuota > 0) {
                  // progressMessages.value.unshift({
                  //   type: 'info',
                  //   text: `发布时间检测通过: 该日期还有 ${remainingQuota} 次群发机会`,
                  //   subtext: `《${task.title}》- 「${task.accountName}」`
                  // })
                } else {
                  progressMessages.value.unshift({
                    type: 'error',
                    text: '发布时间检测失败: 该日期已无群发次数，请选择其他日期',
                    subtext: `《${task.title}》- 「${task.accountName}」`
                  })
                  console.warn('发布时间检测失败: 群发次数已用完')
                  // D. 群发次数用完，标记该账号
                  failedAccounts.add(accountId)
                  progressFailedCount.value++
                  continue // 群发次数用完，跳过后续步骤
                }
              } else {
                progressMessages.value.unshift({
                  type: 'warning',
                  text: '无法获取该日期的群发限额: 可能超出可查询的日期范围',
                  subtext: `《${task.title}》- 「${task.accountName}」`
                })
              }
            } else {
              progressMessages.value.unshift({
                type: 'warning',
                text: '无法获取群发限额信息: 响应数据格式不符',
                subtext: `《${task.title}》- 「${task.accountName}」`
              })
            }

          } else {
            progressMessages.value.unshift({
              type: 'warning',
              text: '发布时间检测无响应',
              subtext: `《${task.title}》- 「${task.accountName}」`
            })
          }
        } catch (error) {
          console.error('发布时间检测失败:', error)
          progressMessages.value.unshift({
            type: 'error',
            text: `发布时间检测失败: ${error.message || '未知错误'}`,
            subtext: `《${task.title}》- 「${task.accountName}」`
          })
        }
      }

      // 在步骤之间检查取消标志
      if (progressCancelFlag.value) {
        progressMessages.value.unshift({
          type: 'warning',
          text: '任务已取消',
          subtext: `《${task.title}》- 「${task.accountName}」`
        })
        break
      }

      // =============================================
      // 第四步：二维码校验（群发保护检测）
      // =============================================
      if (syncSuccess && newMsgIds) {
        progressStatusText.value = '正在进行群发保护检测…'
        
        try {
          // 获取 appmsgid（同步后的或原始的）
          let checkAppmsgid = appmsgid
          
          if (syncResult && syncResult.success_accounts) {
            const successAccount = syncResult.success_accounts.find(
              acc => acc.original_id === targetAccount.account_id || 
                     acc.original_id === targetAccount.original_id ||
                     acc.name === targetAccount.name
            )
            if (successAccount?.new_appmsgid) {
              checkAppmsgid = successAccount.new_appmsgid
              console.log('使用新的 appmsgid 进行二维码校验:', checkAppmsgid)
            }
          }
          
          const cookies = serializeCookie(JSON.parse(targetSessionId)["cookie"])
          
          const masssendResult = await getMasssendInfo({
            appmsgid: checkAppmsgid,
            cookies: cookies,
            token: parseInt(targetToken),
          })
          
          if (masssendResult && masssendResult.data) {
            const needScanQrcode = masssendResult.data.need_scan_qrcode
            
            if (needScanQrcode) {
              progressMessages.value.unshift({
                type: 'error',
                text: `账号「${task.accountName}」需要扫码验证`,
                subtext: '账号已开启群发保护，请到 微信后台 -> 安全中心 -> 风险操作保护 取消群发消息保护'
              })
              
              console.warn(`账号「${task.accountName}」需要扫码验证，已开启群发保护`)
              // E. 需要扫码，标记该账号
              failedAccounts.add(accountId)
              progressFailedCount.value++
              continue // 需要扫码，跳过后续步骤
            } else {
              // 账号未开启群发保护，无需扫码
              // progressMessages.value.unshift({
              //   type: 'info',
              //   text: '二维码校验通过: 账号未开启群发保护',
              //   subtext: `《${task.title}》- 「${task.accountName}」`
              // })
            }
          } else {
            progressMessages.value.unshift({
              type: 'warning',
              text: '二维码校验无响应',
              subtext: `《${task.title}》- 「${task.accountName}」`
            })
          }
        } catch (error) {
          console.error('二维码校验失败:', error)
          progressMessages.value.unshift({
            type: 'error',
            text: `二维码校验失败: ${error.message || '未知错误'}`,
            subtext: `《${task.title}》- 「${task.accountName}」`
          })
        }
      }

      // 在步骤之间检查取消标志
      if (progressCancelFlag.value) {
        progressMessages.value.unshift({
          type: 'warning',
          text: '任务已取消',
          subtext: `《${task.title}》- 「${task.accountName}」`
        })
        break
      }

      // =============================================
      // 第五步：最终发布
      // =============================================
      try {
        progressStatusText.value = '正在提交发布…'

        // 组合发布参数
        const cookies2 = serializeCookie(JSON.parse(targetSessionId)["cookie"])

        // 发送时间：如果设置了定时，则用选定的日期+时间；否则0表示立即
        let send_time = 0
        if (settings.scheduledPublish && selectedPublishDate.value && publishTime.value) {
          const pubDate = new Date(selectedPublishDate.value.id)
          const pubTime = new Date(publishTime.value)
          const joinDateStr = `${selectedPublishDate.value.id} ${pubTime.getHours()}:${pubTime.getMinutes()}`
          send_time = Math.floor(new Date(joinDateStr).getTime() / 1000)
        }

        const isFreePublish = !settings.sendNotification
        const hasNotify = !!settings.sendNotification

        // reprint_info：若有原创问题列表，这里一般为空；批量场景可后续扩展
        const reprint_info = null

        // list：若后端需要，可从原创检测返回值带入，这里传空字符串
        const list = ''

        // operation_seq_val、code：批量场景默认不处理扫码，通过前置检测已拦截
        const operation_seq_val = ''
        const code = ''

        // 发布草稿 IPC 事件
        const sourceKey = `${task.articleData?.draftData?.app_id}`
        window.ipcRenderer.send('toMain', {
          tag: 'appmsg:publishToWechat',
          source: sourceKey,
          token: getToken(),
          wechat_id: targetAccount.id || targetAccount.wechat_id,
          publishData: {
            cookies: cookies2,
            token: parseInt(targetToken),
            send_time,
            isFreePublish,
            hasNotify,
            list,
            groupstr: groupNotifyParams.value || '',
            reprint_info,
            appmsgid: (syncResult?.success_accounts?.find(v => (v.original_id === targetAccount.account_id || v.original_id === targetAccount.original_id || v.name === targetAccount.name))?.new_appmsgid) || appmsgid,
            appmsg_item_count: task.articleData?.draftData?.multi_item?.length || 1,
            operation_seq_val,
            code,
          }
        })

        // 同步等待发布结果
        const ret = await waitForPublishResult(sourceKey)
        if (ret && ret.success) {
          progressMessages.value.unshift({
            type: 'success',
            text: '发布成功',
            subtext: `《${task.title}》-「${task.accountName}」`
          })
          progressSuccessCount.value++
        } else {
          console.log("发布失败,原因：",ret)
          const reason = (ret && (ret.msg || ret.code)) ? `${ret.msg || ''}${ret.code ? ` (code:${ret.code})` : ''}` : '未知错误'
          progressMessages.value.unshift({
            type: 'error',
            text: `发布失败: ${reason}`,
            subtext: `《${task.title}》-「${task.accountName}」`
          })
          progressFailedCount.value++
        }
      } catch (error) {
        console.error('提交发布失败:', error)
        progressMessages.value.unshift({
          type: 'error',
          text: `发布失败: ${error.message || '未知错误'}`,
          subtext: `《${task.title}》-「${task.accountName}」`
        })
        progressFailedCount.value++
      }

    } catch (error) {
      console.error('同步任务失败:', error)
      progressMessages.value.unshift({
        type: 'error',
        text: `同步失败: ${error.message || '网络错误'}`,
        subtext: `《${task.title}》- 「${task.accountName}」`
      })
      progressFailedCount.value++
    }

    // 若还有后续任务并未取消，等待群发间隔
    if (i < tasks.length - 1 && !progressCancelFlag.value) {
      const intervalSeconds = Math.max(0, Number(settings.sendInterval || 0))
      if (intervalSeconds > 0) {
        // 动态倒计时显示
        for (let countdown = intervalSeconds; countdown > 0; countdown--) {
          if (progressCancelFlag.value) break
          progressStatusText.value = `等待 ${countdown} 秒间隔后继续…`
          await sleep(1000)
        }
      }
    }
  }

  if (!progressCancelFlag.value) {
    progressStatusText.value = '所有任务已完成'
    ElMessage.success('所有任务已完成')
    progressCompleted.value = true
    // 发布完成后清空草稿列表
    articles.value = []
  }
}

const handlePreviewCancel = () => {
  console.log('取消群发')
  showPreviewModal.value = false
}

// 定时发布相关方法
const initPublishDates = () => {
  const today = new Date()
  publishDates.value = Array.from({ length: 7 }, (_, i) => {
    if (i === 0) {
      return { name: "今天", id: today.toISOString().split('T')[0] }
    } else if (i === 1) {
      return { name: "明天", id: createDateByDays(today, 1).toISOString().split('T')[0] }
    } else {
      let theDate = createDateByDays(today, i)
      return { name: `${theDate.getMonth() + 1}月${theDate.getDate()}日`, id: theDate.toISOString().split('T')[0] }
    }
  })
  selectedPublishDate.value = publishDates.value[0]
  publishTime.value = +new Date() + 5 * 60 * 1000 // 5分钟后
}

const handleChangeForPublishDate = (val) => {
  console.log("选择的发布日期:", val)
  selectedPublishDate.value = val
  const todayStr = new Date().toISOString().split('T')[0]
  if (todayStr === val.id) {
    // 选择今天，设置5分钟后
    publishTime.value = +new Date() + 5 * 60 * 1000
  } else {
    // 选择其他日期，设置为00:00
    publishTime.value = +new Date(val.id + "T00:00")
  }
}

const disableHours = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishDate.value?.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const hour = date.getHours()
  
  const idx = HOUSRS.findIndex(v => v === hour)
  return HOUSRS.slice(0, idx)
}

const disableMinutes = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishDate.value?.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const minute = date.getMinutes()
  
  const idx = MINUTES.findIndex(v => v === minute)
  return MINUTES.slice(0, idx)
}

// 组件挂载时初始化
onMounted(() => {
  initPublishDates()
  draftSync.registerIpcListener()
})

// 组件卸载时清理
onBeforeUnmount(() => {
  draftSync.cleanupIpcListener()
})
</script>

<style scoped>
.advanced-forward-page {
  overflow: hidden;
}

.article-card {
  transition: all 0.2s ease;
}

.article-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.setting-item {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.rotate-90 {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.header-section {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 空状态样式 */
.empty-state {
  min-height: 300px;
}

.empty-icon {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.empty-state:hover .empty-icon {
  opacity: 0.8;
}

.empty-text h3 {
  color: #6b7280;
  font-weight: 500;
}

.empty-text p {
  color: #9ca3af;
  line-height: 1.5;
}

/* 自选账号样式 */
.custom-account-content {
  padding: 12px 0;
}

.account-chip {
  transition: all 0.2s ease;
}

.account-chip:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

.selected-accounts-list {
  /* 使用 flex 布局，自动换行 */
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 定时发布样式 */
.scheduled-publish-content {
  padding: 12px 0;
}

.scheduled-publish-content .el-select {
  width: 120px;
}

.scheduled-publish-content .el-time-picker {
  width: 100px;
}

/* 群发通知样式 */
.group-notify-content {
  padding: 0;
  border-top: none;
}
</style>
