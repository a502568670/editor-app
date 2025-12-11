<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisibleRef"
    width="800px"
    :close-on-click-modal="false"
    @close="resetState"
  >
    <!-- 上传区域 -->
    <div v-if="!previewHtml" class="flex flex-col items-center py-8">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        accept=".docx"
        drag
      >
        <el-icon class="el-upload__icon"><Upload /></el-icon>
        <div class="el-upload__text">
          将 Word 文档拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      <div class="text-gray-500 text-sm mt-2">仅支持 .docx 格式</div>

      <el-button
        class="mt-4"
        type="success"
        :loading="parsing"
        :disabled="!selectedFile"
        @click="parseDocx"
      >
        解析文档
      </el-button>
    </div>

    <!-- 预览区域 -->
    <div v-else class="py-4 max-h-[400px] overflow-auto border rounded p-4 bg-white">
      <div v-html="previewHtml" class="docx-preview"></div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="flex justify-end space-x-3">
        <el-button @click="dialogVisibleRef = false">取消</el-button>
        <el-button
          v-if="previewHtml"
          type="success"
          @click="handleInsert"
          :loading="inserting"
        >
          插入内容
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import mammoth from 'mammoth'

const emit = defineEmits(['insert-docx-content'])

const dialogVisibleRef = ref(false)
const selectedFile = ref(null)
const previewHtml = ref('')
const parsing = ref(false)
const inserting = ref(false)
const uploadRef = ref(null)

const dialogTitle = computed(() =>
  previewHtml.value ? '预览 Word 文档内容' : '上传并解析 Word 文档'
)

function handleFileChange(file) {
  if (file.raw.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    ElMessage.error('仅支持 .docx 格式的 Word 文档')
    return
  }
  selectedFile.value = file.raw
}

async function parseDocx() {
  if (!selectedFile.value) return

  parsing.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const arrayBuffer = e.target.result
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
      // 可选：清理多余样式或空段落
      let html = result.value
      // 移除空段落（可选）
      html = html.replace(/<p><\/p>/g, '')
      previewHtml.value = html
      ElMessage.success('文档解析成功')
    } catch (err) {
      console.error('解析失败:', err)
      ElMessage.error('文档解析失败，请检查文件是否损坏')
      previewHtml.value = ''
    } finally {
      parsing.value = false
    }
  }
  reader.readAsArrayBuffer(selectedFile.value)
}

function handleInsert() {
  if (!previewHtml.value) return
  inserting.value = true
  // 模拟插入延迟（实际可立即 emit）
  setTimeout(() => {
    emit('insert-docx-content', previewHtml.value)
    inserting.value = false
    dialogVisibleRef.value = false
  }, 200)
}

function resetState() {
  selectedFile.value = null
  previewHtml.value = ''
  parsing.value = false
  inserting.value = false
  uploadRef.value?.clearFiles?.()
}

// 对外暴露方法
defineExpose({
  openDialog() {
    dialogVisibleRef.value = true
    resetState()
  },
  closeDialog() {
    dialogVisibleRef.value = false
  }
})
</script>

<style scoped>
.docx-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  font-size: 14px;
}
.docx-preview img {
  max-width: 100%;
  height: auto;
}
.docx-preview p {
  margin: 8px 0;
}
.docx-preview h1,
.docx-preview h2,
.docx-preview h3 {
  margin-top: 16px;
  margin-bottom: 8px;
}
</style>