<template>
  <div>
    <el-dialog :close-on-click-modal="false" title="插入公众号链接" v-model="dialogVisibleRef" width="800px">
      <div class="w-full h-[600px] flex flex-col">
        <!-- 显示方式 -->
        <div class="mb-4">
          <label class="text-red-500 mr-2">*</label>
          <span class="mr-4">显示方式:</span>
          <el-radio-group v-model="displayTypeRef">
            <el-radio value="text">文字</el-radio>
            <el-radio value="image">图片</el-radio>
            <el-radio value="template">模板</el-radio>
          </el-radio-group>
        </div>

        <!-- 模板选择（仅模板模式显示） -->
        <div v-if="displayTypeRef === 'template'" class="mb-4">
          <div class="mb-2">
            <label class="text-red-500 mr-2">*</label>
            <label class="mr-2">模板:</label>
          </div>
          <div class="flex items-center mb-1">
            <el-select v-model="templateTypeRef" placeholder="请选择模板" style="width: 200px;">
              <el-option label="更多推荐1" value="modern" />
              <el-option label="往期推荐1" value="past-recommend" />
              <el-option label="往期推荐2" value="past-recommend2" />
            </el-select>
            <el-popover
              placement="right"
              :width="500"
              trigger="hover"
            >
              <template #reference>
                <el-button size="small" type="primary" link class="ml-3">预览样式</el-button>
              </template>
              <div class="preview-container" v-html="getPreviewHtml()"></div>
            </el-popover>
          </div>
          <span class="text-gray-500 text-xs ml-1">如果您有更好的样式可以向我们的客服反馈</span>

        </div>

        <!-- 图片上传（仅图片模式显示） -->
        <div v-if="displayTypeRef === 'image'" class="mb-4">
          <label class="mr-2">图片:</label>
          <div v-if="customImageRef" class="flex items-center space-x-2 p-3 border rounded bg-gray-50">
            <img :src="customImageRef" class="w-20 h-20 object-cover rounded" referrerpolicy="no-referrer" />
            <el-button size="small" @click="openImagePicker">更换图片</el-button>
            <el-button size="small" @click="customImageRef = ''">清除图片</el-button>
          </div>
          <div 
            v-else 
            class="upload-area"
            @click="openImagePicker"
          >
            <el-icon class="upload-icon">
              <UploadFilled />
            </el-icon>
            <div class="upload-text">点击选择图片</div>
            <div class="upload-hint">为空则使用文章封面</div>
          </div>
        </div>

        <!-- 链接标题（仅文字模式显示） -->
        <div v-if="displayTypeRef === 'text'" class="mb-4">
          <label class="mr-2">链接标题:</label>
          <el-input 
            v-model="linkTitleRef" 
            placeholder="请输入链接标题，如不填写则使用文章标题"
            style="width: 100%;" 
          />
        </div>

        <!-- 公众号选择 -->
        <div class="mb-4">
          <label class="mr-2">公众号:</label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 bg-white px-2 py-0.5 flex items-center border rounded-sm">
              <el-input 
                class="bg-white searchbox"
                v-model="mpQueryRef" 
                placeholder="搜索公众号，留空则用本公众号"
                @input="handleSearchMP" 
              />
              <el-icon style="cursor: pointer;" @click="handleSearchMP">
                <Search />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 公众号搜索加载状态 -->
        <div v-if="mpSearchingRef" class="mb-4 flex-1 flex items-center justify-center border rounded p-2">
          <el-icon class="is-loading mr-2" :size="24">
            <component :is="Search"></component>
          </el-icon>
          <span class="text-gray-500">正在搜索公众号...</span>
        </div>

        <!-- 公众号搜索结果 -->
        <div v-else-if="mpsRef.length > 0" class="mb-4 flex-1 overflow-auto border rounded p-2">
          <div 
            v-for="(mp, index) in mpsRef" 
            :key="mp.fakeid"
            @click="selectMP(mp, index)"
            class="flex items-center p-2 mb-2 cursor-pointer border rounded hover:border-blue-400"
            :class="{ 'border-blue-400 bg-blue-50': index === selectedMPIndexRef, 'border-gray-200': index !== selectedMPIndexRef }"
          >
            <img :src="mp.round_head_img" class="w-12 h-12 rounded mr-3">
            <div class="flex-1 flex flex-col">
              <div class="flex items-center">
                <strong class="text-sm">{{ mp.nickname }}</strong>
                <span class="wx_follow_verify" :class="{'show-verify-personal': mp.verify_status === 1, 'show-verify-company': mp.verify_status === 2, 'show-verify-media': mp.verify_status === 3}" ></span>
              </div>
              <div class="text-xs text-gray-500">{{ mp.signature }}</div>
            </div>
          </div>
        </div>
        <div v-if="selectedMPRef" class="mb-4 p-2 bg-blue-50 border border-blue-300 rounded">
          <div class="flex items-center">
            <img :src="selectedMPRef.round_head_img" class="w-10 h-10 rounded mr-2">
            <div class="flex-1">
              <div class="text-sm font-semibold">已选择: {{ selectedMPRef.nickname }}</div>
            </div>
            <el-button size="small" @click="clearSelectedMP">清除</el-button>
          </div>
        </div>

        <!-- 文章搜索 -->
        <div class="mb-4">
          <label class="text-red-500 mr-2">*</label>
          <label class="mr-2">文章:</label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 bg-white px-2 py-0.5 flex items-center border rounded-sm">
              <el-input 
                class="bg-white searchbox"
                v-model="articleQueryRef" 
                placeholder="输入标题搜索，留空获取最新文章"
                clearable
                @keypress.enter="handleSearchArticle"
                @clear="handleClearArticleQuery"
              />
              <el-icon style="cursor: pointer;" @click="handleSearchArticle">
                <Search />
              </el-icon>
            </div>
            <el-button 
              v-if="articlesRef.length > 0 && selectedArticleIndicesRef.length < articlesRef.length"
              @click="selectCurrentArticles"
            >
              全选当前
            </el-button>
            <el-button 
              v-if="selectedArticleIndicesRef.length > 0"
              @click="deselectAllArticles"
            >
              取消全选
            </el-button>
          </div>
        </div>

        <!-- 文章列表 -->
        <div class="flex-1 overflow-auto border rounded p-2">
          <div 
            v-for="(article, index) in articlesRef" 
            :key="article.msg_id"
            @click="toggleArticleSelection(index)"
            class="flex items-center p-2 mb-2 cursor-pointer border rounded hover:border-green-400"
            :class="{ 'border-green-400 bg-green-50': selectedArticleIndicesRef.includes(index), 'border-gray-200': !selectedArticleIndicesRef.includes(index) }"
          >
            <el-checkbox 
              :model-value="selectedArticleIndicesRef.includes(index)"
              @click.stop
              @change="toggleArticleSelection(index)"
              class="mr-4"
            />
            <img 
              v-if="article.cdn_url" 
              :src="article.cdn_url" 
              class="w-20 h-20 rounded object-cover mr-3 ml-1"
              referrerpolicy="no-referrer"
            />
            <div class="flex-1 flex flex-col">
              <div class="font-semibold text-sm mb-1">{{ article.title }}</div>
              <div class="text-xs text-gray-500">{{ article.update_time }}</div>
            </div>
          </div>
          <div v-if="articlesRef.length === 0" class="text-center text-gray-400 py-10">
            <div v-if="articleLoadingRef" class="flex flex-col items-center">
              <el-icon class="is-loading mb-2" :size="24">
                <component :is="Search"></component>
              </el-icon>
              <span>正在加载文章...</span>
            </div>
            <div v-else>
              {{ articleQueryRef ? '没有找到匹配的文章' : '暂无文章' }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :disabled="selectedArticleIndicesRef.length === 0">确定插入 {{ selectedArticleIndicesRef.length > 0 ? `(${selectedArticleIndicesRef.length})` : '' }}</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 图片选择器 -->
    <!-- <ImgPicker 
      ref="imgPickerRef" 
      :modelValue="props.pickerQuery"
      @update:modelValue="$emits('update:pickerQuery', $event)"
      :pageInfo="props.pickerPageInfo" 
      :editorInst="props.editorInst"
      :multiple="false"
      :upload="true"
      placeholder="选择图片"
      @confirm="handleImagePick"
    /> -->
  </div>
</template>

<style scoped>
.searchbox :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}

.searchbox :deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}

:deep(.el-dialog__footer) {
  text-align: center !important;
}

/* 图片上传区域样式 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.upload-icon {
  font-size: 28px;
  color: #000000;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 13px;
  color: #000000;
  margin-bottom: 2px;
}

.upload-hint {
  font-size: 11px;
  color: #8b8b8b;
}

.wx_follow_verify {
    -webkit-flex-shrink: 0;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    width: 1em;
    height: 1em;
    margin-left: 2px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat
}
.wx_follow_verify.show-verify-personal {
    display: block;
    background-image: url(https://res.wx.qq.com/op_res/nLnAiLrrETuU96Aym1ZDNuddJ2beY0iOs-D3h-7MPQeIIoXE5kLrgfPY_Vr_hrKamxAjISc12pBthrd7Ja4S4w)
}

.wx_follow_verify.show-verify-company {
    display: block;
    background-image: url(https://res.wx.qq.com/op_res/nLnAiLrrETuU96Aym1ZDNjhMga6Fe1hiYp332DlZsT_u4THJyu8XegVlG723G5FblhAwxLO31iFVMkzq62jS3w)
}

.wx_follow_verify.show-verify-media {
    display: block;
    background-image: url(https://res.wx.qq.com/op_res/n1-Xym4hWn0AbVImOFGmT9sRdHV1rjoe3lnMHwxRdfbguJjDQH16CE7AIfDZy1KVMHWCPJIoAC4jrMEFqmqR4A)
}

/* 预览容器样式 */
.preview-container {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}
</style>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Picture, UploadFilled } from '@element-plus/icons-vue'
import ImgPicker from './ImgPicker.vue'

const props = defineProps({
  pickerPageInfo: {
    type: Object,
    default: null
  },
  pickerQuery: {
    type: Object,
    default: () => ({ page: 1, limit: 12, group_id: 0 })
  },
  editorInst: {
    type: Object,
    default: null
  }
})

const $emits = defineEmits(['search-article', 'insert-link', 'select-current', 'search-mp', 'update:pickerQuery'])

const dialogVisibleRef = ref(false)
const displayTypeRef = ref('text')
const templateTypeRef = ref('modern') // 模板类型：modern/classic/simple
const linkTitleRef = ref('')
const customImageRef = ref('') // 自定义图片URL（仅图片模式使用）
const mpQueryRef = ref('')
const mpsRef = ref([])
const mpSearchingRef = ref(false) // 公众号搜索状态
const selectedMPRef = ref(null)
const selectedMPIndexRef = ref(-1)
const articleQueryRef = ref('')
const articlesRef = ref([])
const articleLoadingRef = ref(false) // 文章加载状态
const selectedArticleIndicesRef = ref([]) // 改为数组，支持多选
let searchMPTimer = null // 公众号搜索防抖定时器
let searchArticleTimer = null // 文章搜索防抖定时器

// 图片选择器相关
const imgPickerRef = ref(null)

// 监听公众号选择，自动搜索对应公众号的文章
watch(selectedMPRef, (newMP, oldMP) => {
  // 只有在对话框打开且公众号确实改变时才触发搜索
  if (dialogVisibleRef.value && newMP !== oldMP) {
    // 清空当前文章列表
    articlesRef.value = []
    selectedArticleIndicesRef.value = []
    // 如果选择了公众号，触发搜索该公众号的文章
    if (newMP) {
      articleLoadingRef.value = true
      $emits('search-article', { 
        query: articleQueryRef.value.trim(),
        mp: newMP
      })
    }
  }
})

// 监听文章搜索框输入，自动搜索
watch(articleQueryRef, () => {
  // 只有在对话框打开时才触发自动搜索
  if (!dialogVisibleRef.value) return
  
  // 清除之前的定时器
  if (searchArticleTimer) {
    clearTimeout(searchArticleTimer)
  }
  
  // 设置防抖，500ms 后执行搜索
  searchArticleTimer = setTimeout(() => {
    handleSearchArticle()
  }, 500)
})

function openDialog() {
  dialogVisibleRef.value = true
  displayTypeRef.value = 'text'
  templateTypeRef.value = 'modern'
  linkTitleRef.value = ''
  customImageRef.value = ''
  mpQueryRef.value = ''
  mpsRef.value = []
  mpSearchingRef.value = false
  selectedMPRef.value = null
  selectedMPIndexRef.value = -1
  articleQueryRef.value = ''
  articlesRef.value = []
  articleLoadingRef.value = false
  selectedArticleIndicesRef.value = []
}

function closeDialog() {
  // 清除定时器
  if (searchMPTimer) {
    clearTimeout(searchMPTimer)
    searchMPTimer = null
  }
  if (searchArticleTimer) {
    clearTimeout(searchArticleTimer)
    searchArticleTimer = null
  }
  mpSearchingRef.value = false
  articleLoadingRef.value = false
  dialogVisibleRef.value = false
}

function handleSearchMP() {
  // 清除之前的定时器
  if (searchMPTimer) {
    clearTimeout(searchMPTimer)
  }
  
  const query = mpQueryRef.value.trim()
  if (!query) {
    // 如果输入为空，清空搜索结果和状态
    mpsRef.value = []
    mpSearchingRef.value = false
    return
  }
  
  // 设置防抖，500ms 后执行搜索
  searchMPTimer = setTimeout(() => {
    mpSearchingRef.value = true
    $emits('search-mp', { query })
  }, 500)
}

function setMPs(mps) {
  mpsRef.value = mps
  selectedMPIndexRef.value = -1
  mpSearchingRef.value = false
}

function selectMP(mp, index) {
  selectedMPRef.value = mp
  selectedMPIndexRef.value = index
  // 清空公众号搜索结果列表
  mpsRef.value = []
}

function clearSelectedMP() {
  selectedMPRef.value = null
  selectedMPIndexRef.value = -1
  mpQueryRef.value = ''
  articleQueryRef.value = ''
  // 清空文章列表和选中的文章
  articlesRef.value = []
  selectedArticleIndicesRef.value = []
  // 重新搜索当前账号的文章（获取最新文章）
  handleSearchArticle()
}

function handleSearchArticle() {
  // 支持空查询，用于获取最新文章
  articleLoadingRef.value = true
  $emits('search-article', { 
    query: articleQueryRef.value.trim(),
    mp: selectedMPRef.value
  })
}

function handleClearArticleQuery() {
  // 清空文章搜索框后，重新搜索（获取最新文章）
  articleQueryRef.value = ''
  handleSearchArticle()
}

function setArticles(articles) {
  articlesRef.value = articles
  selectedArticleIndicesRef.value = []
  articleLoadingRef.value = false
}

function toggleArticleSelection(index) {
  const currentIndex = selectedArticleIndicesRef.value.indexOf(index)
  if (currentIndex > -1) {
    // 已选中，取消选中
    selectedArticleIndicesRef.value.splice(currentIndex, 1)
  } else {
    // 未选中，添加选中
    selectedArticleIndicesRef.value.push(index)
  }
}

function selectCurrentArticles() {
  // 全选当前文章列表中的所有文章
  if (articlesRef.value.length === 0) {
    ElMessage.warning('当前没有文章可选')
    return
  }
  // 创建所有文章的索引数组
  selectedArticleIndicesRef.value = articlesRef.value.map((_, index) => index)
  ElMessage.success(`已全选 ${articlesRef.value.length} 篇文章`)
}

function deselectAllArticles() {
  // 取消全选，清空所有选中的文章
  if (selectedArticleIndicesRef.value.length === 0) {
    ElMessage.warning('当前没有已选中的文章')
    return
  }
  const count = selectedArticleIndicesRef.value.length
  selectedArticleIndicesRef.value = []
  ElMessage.success(`已取消选中 ${count} 篇文章`)
}

function handleConfirm() {
  if (selectedArticleIndicesRef.value.length === 0) {
    ElMessage.error('请选择至少一篇文章')
    return
  }
  
  // 获取所有选中的文章
  const selectedArticles = selectedArticleIndicesRef.value.map(index => articlesRef.value[index])
  
  const linkData = {
    displayType: displayTypeRef.value,
    templateType: templateTypeRef.value, // 模板类型
    linkTitle: linkTitleRef.value,
    customImage: customImageRef.value,
    mp: selectedMPRef.value,
    articles: selectedArticles // 传递多篇文章
  }
  
  $emits('insert-link', linkData)
  closeDialog()
}

// 打开图片选择器
function openImagePicker() {
  // 重置为第一页
  $emits('update:pickerQuery', { page: 1, limit: 12, group_id: 0 })
  // 延迟打开对话框，确保查询已触发
  setTimeout(() => {
    imgPickerRef.value?.openDialog()
  }, 100)
}

// 处理图片选择
function handleImagePick(urls) {
  if (urls && urls.length > 0) {
    customImageRef.value = urls[0]
    ElMessage.success('图片选择成功')
  }
}

// 获取预览HTML
function getPreviewHtml() {
  const templateType = templateTypeRef.value
  
  // 示例数据
  const sampleArticles = [
    { title: '示例文章标题1', content_url: '#', cdn_url: 'https://mmbiz.qpic.cn/sz_mmbiz_png/6pUYdEgor8lqx9KXojh8MoGgfAXgJYKpcm2hKBzfM4vWd4ribtXeurYsAGuvInJkMVGNpd5f9cTvmicp6lC1amdA/0?wx_fmt=png&from=appmsg' },
    { title: '示例文章标题2', content_url: '#', cdn_url: 'https://mmbiz.qpic.cn/sz_mmbiz_png/6pUYdEgor8lqx9KXojh8MoGgfAXgJYKpcm2hKBzfM4vWd4ribtXeurYsAGuvInJkMVGNpd5f9cTvmicp6lC1amdA/0?wx_fmt=png&from=appmsg' },
    { title: '示例文章标题3', content_url: '#', cdn_url: 'https://mmbiz.qpic.cn/sz_mmbiz_png/6pUYdEgor8lqx9KXojh8MoGgfAXgJYKpcm2hKBzfM4vWd4ribtXeurYsAGuvInJkMVGNpd5f9cTvmicp6lC1amdA/0?wx_fmt=png&from=appmsg' }
  ]
  
  let html = ''
  
  if (templateType === 'modern') {
    // 更多推荐样式
    let articlesHtml = ''
    sampleArticles.forEach((article) => {
      articlesHtml += `<a href="${article.content_url}" target="_blank"><section style="display: flex;border-top: 1px solid #e9e9e9;padding: 14px; margin-bottom: 8px;"><span style="align-self: flex-start;width: 48px; margin-right: 15px;"><section style="background: url(${article.cdn_url});background-size: cover;width: 48px;height: 48px;"></section></span><section style="font-size: 14px; vertical-align: top;height: 48px;line-height: 24px;overflow: hidden;">${article.title}</section></section></a>`
    })
    html = `<section style="padding: 20px;border: 1px solid #e9e9e9; margin-top: 20px;"><section style="font-size: 14px;padding-left: 10px;border-left: 4px solid #1677FF;margin-bottom: 20px;">更多推荐</section>${articlesHtml}</section>`
  } else if (templateType === 'past-recommend') {
    // 往期推荐1
    let articlesHtml = ''
    sampleArticles.forEach((article, index) => {
      const num = index + 1
      articlesHtml += `<section class="box-edit"><a href="${article.content_url}" target="_blank" style="text-decoration: none; color: inherit;"><section style="box-shadow:0px 0px 5px #e5e5e5 ;height:65px;${index > 0 ? 'margin: 10px auto;' : ''}"><section style="display: flex;justify-content: flex-start;align-items: center;"><section style="width:60px;height: 65px;box-sizing:border-box;"><section class="135brush" data-brushtype="text" style="background: #6f8691;border-top-left-radius:7px;border-bottom-left-radius: 7px;border-top-right-radius: 100%;border-bottom-right-radius: 100%;color:#fff; font-size:18px;letter-spacing:1.5px;width:60px;height: 65px;font-size: 20px; line-height:63px;text-align: center;box-sizing:border-box;"><strong>0<span class="autonum" data-original-title="" title="" data-num="${num}">${num}</span></strong></section></section><section class="135brush" data-brushtype="text" style="padding:0px 0.4em 0px 0.5em;font-size: 16px;letter-spacing: 1.5px;color: #71868f;box-sizing:border-box;"><p style="vertical-align:inherit;">${article.title}</p></section></section></section></a></section>`
    })
    html = `<section class="_135editor" itemscope="" itemtype="https://mp.weixin.qq.com/voc/Guide" data-id="93971" data-tools="135编辑器"><section style="padding:1em;box-sizing:border-box;"><section style="display: flex;justify-content:center;margin: 1em auto;align-items: center;"><section><section data-bgless="spin" data-bglessp="280" data-bgopacity="1%" style="width:1.2em;height:1.2em;border-radius:100% ;background:#b3c0c6;margin-bottom: -20px;box-sizing:border-box;"></section><section data-bgless="spin" data-bglessp="280" data-bgopacity="1%" style="width:6px;height:6px;border-radius:100% ;background:#b3c0c6;margin-left:1.4em;box-sizing:border-box;"></section><section data-bgless="spin" data-bglessp="280" data-bgopacity="50%" style="width:2.5em;height:2.5em;border-radius:100% ;background:rgba(179,192,198,0.6);margin-left: 10px;box-sizing:border-box;"></section></section><section class="135brush" data-brushtype="text" style="margin-left:-1em;text-align:center;font-size: 20px;letter-spacing:2px;color: #71868f;">往期推荐</section></section>${articlesHtml}</section></section>`
  } else if (templateType === 'past-recommend2') {
    // 往期推荐2
    let articlesHtml = ''
    sampleArticles.forEach((article, index) => {
      const marginTop = index === 0 ? '10px' : '5px'
      articlesHtml += `<p class="box-edit" style="vertical-align:inherit;margin-top: ${marginTop};margin-bottom: 5px;padding-right: 0em;padding-left: 0em;letter-spacing: 1.5px;line-height: normal;color: #888888;font-size: 13px;text-align:justify;" align="justify"><a href="${article.content_url}" target="_blank" style="color: #888888; text-decoration: none;">●${article.title}</a></p>`
    })
    html = `<section class="_135editor" data-tools="135编辑器" data-id="93709"><section style="border-style: solid; border-width: 2px; padding: 5px; box-sizing: border-box;" itemscope="" itemtype="https://mp.weixin.qq.com/voc/Guide"><section style="border-style: dashed;border-width: 1px;padding: 15px;box-sizing: border-box;"><section style="text-align: center;"><span data-role="width" style="display:inline-block;width:80%;box-sizing:border-box;max-width:80% !important;" data-width="80%"><img class="assistant" src="https://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9naWYvN1FSVHZrSzJxQzdJSEFCRm11TWxXUWtTU3pPTWljaWNmQkxmc2RJamtPbkR2c3N1NlpueDRUVFBzSDh5WlpOWjE3aFNiRDk1d3c0M2ZzNU9GRXBwUlRXZy8wP3d4X2ZtdD1naWY=" style="margin: 0px; width: 100%;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" data-width="80%" data-op="change" width="80%" height="" border="0" mapurl="" title="" alt="" draggable="false" data-ratio="0.08658008658008658" data-w="462"/></span></section><section>${articlesHtml}</section></section></section></section>`
  }
  
  return html
}

defineExpose({
  openDialog,
  closeDialog,
  setArticles,
  setMPs
})
</script>

