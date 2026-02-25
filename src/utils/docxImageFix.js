/**
 * Word 文档图片插入修复工具
 * 
 * 使用方法：
 * 1. 在父组件中导入此工具
 * 2. 在处理 insert-docx-content 事件时使用
 */

/**
 * 检查并修复 HTML 中的图片标签
 * @param {string} html - 原始 HTML
 * @returns {string} - 修复后的 HTML
 */
export function fixDocxImages(html) {
  if (!html) return ''
  
  let fixedHtml = html
  
  // 1. 确保所有 img 标签都有必要的属性
  fixedHtml = fixedHtml.replace(/<img([^>]*)>/gi, (match, attrs) => {
    let newAttrs = attrs
    
    // 添加默认样式
    if (!attrs.includes('style=')) {
      newAttrs += ' style="max-width: 100%; height: auto;"'
    }
    
    // 确保有 alt 属性
    if (!attrs.includes('alt=')) {
      newAttrs += ' alt=""'
    }
    
    return `<img${newAttrs}>`
  })
  
  return fixedHtml
}

/**
 * 插入 HTML 到 UEditor
 * @param {Object} editor - UEditor 实例
 * @param {string} html - 要插入的 HTML
 */
export function insertToUEditor(editor, html) {
  if (!editor) {
    console.error('UEditor 实例不存在')
    return false
  }
  
  try {
    // 使用 inserthtml 命令插入内容
    editor.execCommand('inserthtml', html)
    console.log('✅ 内容已插入到 UEditor')
    return true
  } catch (error) {
    console.error('❌ 插入到 UEditor 失败:', error)
    return false
  }
}

/**
 * 插入 HTML 到 CKEditor
 * @param {Object} editor - CKEditor 实例
 * @param {string} html - 要插入的 HTML
 */
export function insertToCKEditor(editor, html) {
  if (!editor) {
    console.error('CKEditor 实例不存在')
    return false
  }
  
  try {
    editor.insertHtml(html)
    console.log('✅ 内容已插入到 CKEditor')
    return true
  } catch (error) {
    console.error('❌ 插入到 CKEditor 失败:', error)
    return false
  }
}

/**
 * 插入 HTML 到 wangEditor
 * @param {Object} editor - wangEditor 实例
 * @param {string} html - 要插入的 HTML
 */
export function insertToWangEditor(editor, html) {
  if (!editor) {
    console.error('wangEditor 实例不存在')
    return false
  }
  
  try {
    editor.dangerouslyInsertHtml(html)
    console.log('✅ 内容已插入到 wangEditor')
    return true
  } catch (error) {
    console.error('❌ 插入到 wangEditor 失败:', error)
    return false
  }
}

/**
 * 通用插入方法 - 自动检测编辑器类型
 * @param {Object} editor - 编辑器实例
 * @param {string} html - 要插入的 HTML
 */
export function insertHtmlToEditor(editor, html) {
  if (!editor || !html) {
    console.error('编辑器实例或 HTML 内容为空')
    return false
  }
  
  // 修复 HTML
  const fixedHtml = fixDocxImages(html)
  
  console.log('=== 开始插入 Word 内容 ===')
  console.log('HTML 长度:', fixedHtml.length)
  console.log('图片数量:', (fixedHtml.match(/<img/gi) || []).length)
  
  // 尝试不同的插入方法
  if (typeof editor.execCommand === 'function') {
    // UEditor
    return insertToUEditor(editor, fixedHtml)
  } else if (typeof editor.insertHtml === 'function') {
    // CKEditor
    return insertToCKEditor(editor, fixedHtml)
  } else if (typeof editor.dangerouslyInsertHtml === 'function') {
    // wangEditor
    return insertToWangEditor(editor, fixedHtml)
  } else {
    console.error('❌ 无法识别的编辑器类型')
    console.log('编辑器对象:', editor)
    return false
  }
}

/**
 * 调试工具 - 检查插入后的内容
 * @param {Object} editor - 编辑器实例
 */
export function debugEditorContent(editor) {
  setTimeout(() => {
    let content = ''
    
    // 尝试不同的获取内容方法
    if (typeof editor.getContent === 'function') {
      content = editor.getContent()
    } else if (typeof editor.getHtml === 'function') {
      content = editor.getHtml()
    } else if (editor.txt && typeof editor.txt.html === 'function') {
      content = editor.txt.html()
    }
    
    console.log('=== 插入后的内容检查 ===')
    console.log('内容长度:', content.length)
    console.log('图片数量:', (content.match(/<img/gi) || []).length)
    
    if (content.includes('<img')) {
      console.log('✅ 图片标签存在')
      
      // 检查图片的 src
      const imgMatches = content.match(/<img[^>]*src="([^"]*)"[^>]*>/gi)
      if (imgMatches) {
        imgMatches.forEach((img, index) => {
          const srcMatch = img.match(/src="([^"]*)"/)
          if (srcMatch) {
            const src = srcMatch[1]
            if (src.startsWith('data:')) {
              console.log(`✅ 图片 ${index + 1}: base64 格式 (${src.substring(0, 50)}...)`)
            } else {
              console.log(`⚠️ 图片 ${index + 1}: ${src}`)
            }
          }
        })
      }
    } else {
      console.log('❌ 图片标签不存在 - 可能被编辑器过滤了')
    }
  }, 100)
}

// 默认导出
export default {
  fixDocxImages,
  insertToUEditor,
  insertToCKEditor,
  insertToWangEditor,
  insertHtmlToEditor,
  debugEditorContent
}


