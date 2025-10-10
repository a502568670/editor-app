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
          <div v-for="article in articles" :key="article.id" class="article-card bg-white border border-gray-200 rounded-lg mb-3 shadow-sm">
            <div class="article-header flex items-center justify-between p-4" :class="{ 'border-b border-gray-100': article.expanded }">
              <div class="flex items-center space-x-3">
                <el-icon 
                  class="text-gray-400 cursor-pointer" 
                  @click="toggleArticle(article.id)"
                >
                  <ArrowRight :class="{ 'rotate-90': article.expanded }" />
                </el-icon>
                <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-bold">{{ article.avatar }}</span>
                </div>
                <span class="text-gray-900 font-medium">{{ article.title }}</span>
              </div>
              <el-icon 
                class="text-red-500 cursor-pointer hover:text-red-600"
                @click="deleteArticle(article.id)"
              >
                <Close />
              </el-icon>
            </div>
            
            <!-- 展开的内容 -->
            <div v-if="article.expanded" class="article-content p-4">
              <div class="text-sm text-gray-600 mb-2">
                <span class="font-medium">文章来源:</span> {{ article.source }}
              </div>
              
              <div class="relative mb-3">
                <img 
                  :src="article.image" 
                  alt="文章缩略图"
                  class="w-full h-48 object-cover rounded-lg"
                />
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 rounded-b-lg">
                  <div class="text-sm font-medium">{{ article.title }}</div>
                </div>
              </div>
              
              <div class="text-xs text-gray-500">
                更新于: {{ article.updateTime }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧设置面板 -->
      <div class="w-1/2 bg-white overflow-y-auto">
        <div class="p-6">
          
          <!-- 设置项列表 -->
          <div class="space-y-6">
            <!-- 群发间隔 -->
            <div class="setting-item flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-gray-700 font-medium">群发间隔</span>
                <el-icon class="text-gray-400 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </div>
              <div class="flex items-center space-x-2">
                <el-input v-model="settings.sendInterval" class="w-16" />
                <span class="text-gray-500">秒</span>
              </div>
            </div>
            
            <!-- 群发通知 -->
            <div class="setting-item flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-gray-700 font-medium">群发通知</span>
                <el-icon class="text-gray-400 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </div>
              <div class="flex items-center space-x-4">
                <el-switch v-model="settings.sendNotification" />
              </div>
            </div>
            
            <!-- 定时发表 -->
            <div class="setting-item flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-gray-700 font-medium">定时发表</span>
                <el-icon class="text-gray-400 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </div>
              <el-switch v-model="settings.scheduledPublish" />
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { 
  Plus, 
  QuestionFilled, 
  VideoPlay, 
  Close, 
  ArrowRight 
} from '@element-plus/icons-vue'
import AccountPickerModal from '@/components/AccountPickerModal.vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

// 路由
const router = useRouter()

// 弹窗控制
const showAccountModal = ref(false)

// 设置数据
const settings = reactive({
  sendInterval: '3',
  sendNotification: false,
  notificationRegion: 'all',
  notificationGender: 'all',
  scheduledPublish: false
})

// 文章列表数据
const articles = ref([
  {
    id: 1,
    title: '金正恩突然发声:朝鲜真正敌...',
    source: 'gh_6249acdd092a',
    avatar: '金',
    image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Kim+Jong+Un',
    updateTime: '2025-09-26 14:36:44',
    expanded: true
  },
  {
    id: 2,
    title: '金正恩突然发声:朝鲜真正敌...',
    source: 'gh_6249acdd092a',
    avatar: '金',
    image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Kim+Jong+Un',
    updateTime: '2025-09-26 14:36:44',
    expanded: false
  }
])

// 弹窗相关方法
const showAccountPicker = () => {
  showAccountModal.value = true
}

const handleAccountSelected = (selectedAccount) => {
  console.log('选择的公众号:', selectedAccount)
  ElMessage.success(`已选择公众号: ${selectedAccount.name || selectedAccount.account_id}`)
  
  // 跳转到编辑器页面，并传递选中的公众号信息
  router.push({
    path: '/editor3',
    query: {
      accountId: selectedAccount.id,
      accountName: selectedAccount.name || selectedAccount.account_id
    }
  })
}

const autoSelectFirst = () => {
  console.log('自动选择首篇草稿')
}

const startGroupSend = () => {
  console.log('开始群发')
}

const clearAll = () => {
  console.log('清空')
}

const deleteArticle = (id) => {
  console.log('删除文章', id)
}

const toggleArticle = (id) => {
  const article = articles.value.find(a => a.id === id)
  if (article) {
    article.expanded = !article.expanded
  }
}
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
</style>
