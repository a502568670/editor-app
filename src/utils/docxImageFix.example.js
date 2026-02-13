/**
 * Word 文档图片插入修复 - 使用示例
 * 
 * 在父组件（editor3.vue 或 editor4.vue）中使用此代码
 */

// ============================================
// 方法 1: 导入修复工具（推荐）
// ============================================

import { insertHtmlToEditor, debugEditorContent } from '@/utils/docxImageFix'
import UploadDocxDialog from '@/components/editor/UploadDocxDialog.vue'

// 在 setup 中
const uploadDocxDialogRef = ref(null)
const editorRef = ref(null) // 你的编辑器 ref

// 处理 Word 文档插入
const handleInsertDocx = (html) => {
  console.log('收到 Word 内容，准备插入')
  
  // 使用修复工具插入
  const success = insertHtmlToEditor(editorRef.value, html)
  
  if (success) {
    // 调试：检查插入后的内容
    debugEditorContent(editorRef.value)
  }
}

// 在 template 中
/*
<UploadDocxDialog 
  ref="uploadDocxDialogRef"
  @insert-docx-content="handleInsertDocx"
/>
*/

// ============================================
// 方法 2: 手动处理（如果方法1不工作）
// ============================================

const handleInsertDocxManual = (html) => {
  console.log('=== 开始插入 Word 内容 ===')
  console.log('原始 HTML 长度:', html.length)
  console.log('图片数量:', (html.match(/<img/gi) || []).length)
  
  if (!editorRef.value) {
    console.error('编辑器实例不存在')
    return
  }
  
  try {
    // UEditor 方式
    if (typeof editorRef.value.execCommand === 'function') {
      console.log('使用 UEditor 插入')
      editorRef.value.execCommand('inserthtml', html)
    }
    // CKEditor 方式
    else if (typeof editorRef.value.insertHtml === 'function') {
      console.log('使用 CKEditor 插入')
      editorRef.value.insertHtml(html)
    }
    // wangEditor 方式
    else if (typeof editorRef.value.dangerouslyInsertHtml === 'function') {
      console.log('使用 wangEditor 插入')
      editorRef.value.dangerouslyInsertHtml(html)
    }
    else {
      console.error('无法识别的编辑器类型')
      console.log('编辑器对象:', editorRef.value)
    }
    
    // 检查插入结果
    setTimeout(() => {
      let content = ''
      if (typeof editorRef.value.getContent === 'function') {
        content = editorRef.value.getContent()
      } else if (typeof editorRef.value.getHtml === 'function') {
        content = editorRef.value.getHtml()
      }
      
      console.log('=== 插入后检查 ===')
      console.log('内容长度:', content.length)
      console.log('图片数量:', (content.match(/<img/gi) || []).length)
      
      if (!content.includes('<img')) {
        console.error('❌ 图片被过滤了！需要修改编辑器配置')
      } else {
        console.log('✅ 图片插入成功')
      }
    }, 100)
    
  } catch (error) {
    console.error('插入失败:', error)
  }
}

// ============================================
// 方法 3: UEditor 配置修复（如果使用 UEditor）
// ============================================

// 在 UEditor 配置中添加以下选项
const ueditorConfig = {
  // 基础配置
  UEDITOR_HOME_URL: '/UEditorPlus/',
  serverUrl: '',
  
  // 关键配置：允许 data URL 图片
  allowDivTransToP: false,
  
  // 白名单配置
  whitList: {
    img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class', 'data-custom']
  },
  
  // 输入规则：不过滤任何内容
  inputRule: function(root) {
    return root
  },
  
  // 输出规则：不过滤任何内容
  outputRule: function(root) {
    return root
  },
  
  // 过滤规则
  filterRules: function() {
    return {
      // 保留所有 img 标签
      img: function(node) {
        return node
      },
      // 保留所有 p 标签
      p: function(node) {
        return node
      }
    }
  }
}

// ============================================
// 完整示例：在 editor4.vue 中使用
// ============================================

/*
<template>
  <div>
    <!-- 编辑器 -->
    <vue-ueditor-wrap 
      ref="editorRef"
      v-model="content"
      :config="ueditorConfig"
    />
    
    <!-- Word 上传对话框 -->
    <UploadDocxDialog 
      ref="uploadDocxDialogRef"
      @insert-docx-content="handleInsertDocx"
    />
    
    <!-- 触发按钮 -->
    <el-button @click="openDocxDialog">上传 Word 文档</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { insertHtmlToEditor, debugEditorContent } from '@/utils/docxImageFix'
import UploadDocxDialog from '@/components/editor/UploadDocxDialog.vue'

const editorRef = ref(null)
const uploadDocxDialogRef = ref(null)
const content = ref('')

const ueditorConfig = {
  UEDITOR_HOME_URL: '/UEditorPlus/',
  allowDivTransToP: false,
  whitList: {
    img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class']
  },
  inputRule: function(root) { return root },
  outputRule: function(root) { return root }
}

const openDocxDialog = () => {
  uploadDocxDialogRef.value?.openDialog()
}

const handleInsertDocx = (html) => {
  const success = insertHtmlToEditor(editorRef.value, html)
  if (success) {
    debugEditorContent(editorRef.value)
  }
}
</script>
*/

// ============================================
// 故障排查清单
// ============================================

/*
1. 检查 HTML 是否包含图片
   - 在 handleInsertDocx 中打印 html
   - 查看是否有 <img src="data:image/...

2. 检查编辑器实例是否存在
   - console.log(editorRef.value)
   - 确保不是 null 或 undefined

3. 检查插入方法是否正确
   - 不同编辑器使用不同的方法
   - UEditor: execCommand('inserthtml', html)
   - CKEditor: insertHtml(html)
   - wangEditor: dangerouslyInsertHtml(html)

4. 检查编辑器配置
   - 是否允许 img 标签
   - 是否允许 data: 协议的 src
   - 是否有过滤规则

5. 检查浏览器控制台
   - 是否有 CSP 错误
   - 是否有其他 JavaScript 错误

6. 检查插入后的内容
   - 使用 debugEditorContent 函数
   - 查看图片是否被过滤
*/

