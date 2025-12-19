<template>
    <div class="guide-words-editor">
      <div 
        ref="editorRef"
        class="editor-area"
        contenteditable="true"
        :data-placeholder="placeholder"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      ></div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, nextTick } from 'vue'
  
  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '填写描述信息，让大家了解更多内容'
    },
    height: {
      type: String,
      default: '80px'
    }
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  const editorRef = ref(null)
  const isComposing = ref(false)
  const isFocused = ref(false)
  
  // 生成唯一的 topic-id
  const generateTopicId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    result += '-'
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  // 获取当前话题数量作为 data-topic 值
  const getNextDataTopic = () => {
    if (!editorRef.value) return '1'
    const existingTopics = editorRef.value.querySelectorAll('.topic-tag')
    return String(existingTopics.length + 1)
  }
  
  // 将原始内容转换为可显示的 HTML
  const convertToDisplayHtml = (content) => {
    if (!content) return ''
    
    // 匹配话题标签
    const topicRegex = /<a[^>]*class="wx_topic_link"[^>]*topic-id="([^"]*)"[^>]*data-topic="([^"]*)"[^>]*>#([^<]+)<\/a>/gi
    
    let result = content
    const matches = []
    let match
    
    // 收集所有匹配
    while ((match = topicRegex.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        topicId: match[1],
        dataTopic: match[2],
        topicName: match[3],
        index: match.index
      })
    }
    
    // 从后往前替换，避免索引偏移
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]
      const topicHtml = createTopicTagHtml(m.topicName, m.topicId, m.dataTopic)
      result = result.substring(0, m.index) + topicHtml + result.substring(m.index + m.fullMatch.length)
    }
    
    // 处理换行
    result = result.replace(/\n/g, '<br>')
    
    return result
  }
  
  // 创建话题标签 HTML
  const createTopicTagHtml = (topicName, topicId, dataTopic) => {
    return `<span class="topic-tag" contenteditable="false" data-topic-id="${topicId}" data-topic="${dataTopic}" data-topic-name="${topicName}"><span class="topic-text">#${topicName}</span><span class="remove-btn" data-action="remove">×</span></span>`
  }
  
  // 将编辑器内容转换回原始格式
  const convertToRawContent = () => {
    if (!editorRef.value) return ''
    
    // 克隆节点以避免修改原始内容
    const clone = editorRef.value.cloneNode(true)
    
    // 将话题标签转换回原始格式
    const topicTags = clone.querySelectorAll('.topic-tag')
    topicTags.forEach(tag => {
      const topicId = tag.getAttribute('data-topic-id') || ''
      const dataTopic = tag.getAttribute('data-topic') || ''
      const topicName = tag.getAttribute('data-topic-name') || ''
      
      const rawHtml = `<a class="wx_topic_link" topic-id="${topicId}" style="color: #576B95 !important;" data-topic="${dataTopic}">#${topicName}</a>`
      tag.outerHTML = rawHtml
    })
    
    // 处理换行
    let html = clone.innerHTML
    html = html.replace(/<br\s*\/?>/gi, '\n')
    html = html.replace(/<div>/gi, '\n')
    html = html.replace(/<\/div>/gi, '')
    html = html.replace(/&nbsp;/gi, ' ')
    
    // 解码 HTML 实体
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    let result = textarea.value
    
    // 清理多余的换行
    result = result.replace(/^\n+/, '')
    
    return result
  }
  
  // 渲染内容到编辑器
  const renderContent = () => {
    if (!editorRef.value) return
    
    const html = convertToDisplayHtml(props.modelValue)
    editorRef.value.innerHTML = html
    
    // 绑定删除按钮事件
    bindRemoveButtons()
  }
  
  // 绑定删除按钮事件（取消话题：将话题标签还原为普通文本）
  const bindRemoveButtons = () => {
    if (!editorRef.value) return
    
    const removeButtons = editorRef.value.querySelectorAll('.remove-btn')
    removeButtons.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const topicTag = btn.closest('.topic-tag')
        if (topicTag) {
          // 获取话题名称
          const topicName = topicTag.getAttribute('data-topic-name') || ''
          // 创建普通文本节点替换话题标签
          const textNode = document.createTextNode('#' + topicName)
          topicTag.parentNode.replaceChild(textNode, topicTag)
          handleInput()
        }
      }
    })
  }
  
  // 检测并转换 #话题名 为话题标签（只检测后面有空格的，输入时使用）
  const detectTopicsWithSpace = () => {
    if (!editorRef.value) return false
    
    // 遍历所有文本节点，查找 #话题名 模式
    const walker = document.createTreeWalker(
      editorRef.value,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    
    let converted = false
    const nodesToProcess = []
    
    while (walker.nextNode()) {
      const textNode = walker.currentNode
      // 跳过已经在话题标签内的文本
      if (textNode.parentElement && textNode.parentElement.closest('.topic-tag')) continue
      
      const text = textNode.textContent
      // 只匹配 #话题名 后面明确跟着空格或换行的（不匹配末尾）
      const topicPattern = /#([^\s#<>]+)([ \t\n\r])/g
      let match
      
      while ((match = topicPattern.exec(text)) !== null) {
        nodesToProcess.push({
          node: textNode,
          topicName: match[1],
          fullMatch: match[0],
          index: match.index,
          trailingChar: match[2]
        })
      }
    }
    
    // 从后往前处理，避免索引偏移
    converted = processTopicNodes(nodesToProcess)
    
    return converted
  }
  
  // 检测所有未转换的话题（包括末尾的，失焦时使用）
  const detectAllTopics = () => {
    if (!editorRef.value) return false
    
    // 遍历所有文本节点，查找 #话题名 模式
    const walker = document.createTreeWalker(
      editorRef.value,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    
    const nodesToProcess = []
    
    while (walker.nextNode()) {
      const textNode = walker.currentNode
      // 跳过已经在话题标签内的文本
      if (textNode.parentElement && textNode.parentElement.closest('.topic-tag')) continue
      
      const text = textNode.textContent
      // 匹配 #话题名 后跟空格、换行或在末尾
      const topicPattern = /#([^\s#<>]+)([ \t\n\r]|$)/g
      let match
      
      while ((match = topicPattern.exec(text)) !== null) {
        nodesToProcess.push({
          node: textNode,
          topicName: match[1],
          fullMatch: match[0],
          index: match.index,
          trailingChar: match[2] || ''
        })
      }
    }
    
    return processTopicNodes(nodesToProcess)
  }
  
// 处理话题节点转换
const processTopicNodes = (nodesToProcess) => {
  if (nodesToProcess.length === 0) return false
  
  let converted = false
  let lastTrailingNode = null // 记录最后一个话题标签后的文本节点
  
  // 从后往前处理，避免索引偏移
  for (let i = nodesToProcess.length - 1; i >= 0; i--) {
    const item = nodesToProcess[i]
    const { node, topicName, fullMatch, index, trailingChar } = item
    
    // 检查节点是否还有效
    if (!node.parentNode) continue
    
    const text = node.textContent
    const beforeText = text.substring(0, index)
    const afterText = text.substring(index + fullMatch.length)
    
    // 创建话题标签元素
    const topicId = generateTopicId()
    const dataTopic = getNextDataTopic()
    const topicSpan = document.createElement('span')
    topicSpan.className = 'topic-tag'
    topicSpan.contentEditable = 'false'
    topicSpan.setAttribute('data-topic-id', topicId)
    topicSpan.setAttribute('data-topic', dataTopic)
    topicSpan.setAttribute('data-topic-name', topicName)
    topicSpan.innerHTML = `<span class="topic-text">#${topicName}</span><span class="remove-btn" data-action="remove">×</span>`
    
    // 创建文档片段
    const fragment = document.createDocumentFragment()
    
    if (beforeText) {
      fragment.appendChild(document.createTextNode(beforeText))
    }
    fragment.appendChild(topicSpan)
    // 保留空格/换行和后续文本
    const trailing = trailingChar + afterText
    let trailingNode = null
    if (trailing) {
      trailingNode = document.createTextNode(trailing)
      fragment.appendChild(trailingNode)
    }
    
    // 替换原节点
    node.parentNode.replaceChild(fragment, node)
    converted = true
    
    // 记录第一个处理的（即列表中最后一个）话题标签后的文本节点
    if (i === nodesToProcess.length - 1) {
      lastTrailingNode = trailingNode
    }
  }
  
  if (converted) {
    // 绑定新添加的删除按钮
    bindRemoveButtons()
    
    // 将光标放在最后一个话题标签后的文本节点开头，避免滚动到底部
    if (lastTrailingNode) {
      placeCaretAtNode(lastTrailingNode, 1) // 放在空格后面
    }
  }
  
  return converted
}
  
// 将光标放到编辑器末尾
const placeCaretAtEnd = () => {
  if (!editorRef.value) return
  
  const range = document.createRange()
  const selection = window.getSelection()
  
  range.selectNodeContents(editorRef.value)
  range.collapse(false)
  
  selection.removeAllRanges()
  selection.addRange(range)
}

// 将光标放到指定节点的指定位置
const placeCaretAtNode = (node, offset = 0) => {
  if (!node) return
  
  const range = document.createRange()
  const selection = window.getSelection()
  
  try {
    // 确保 offset 不超过节点内容长度
    const maxOffset = node.textContent ? node.textContent.length : 0
    const safeOffset = Math.min(offset, maxOffset)
    
    range.setStart(node, safeOffset)
    range.collapse(true)
    
    selection.removeAllRanges()
    selection.addRange(range)
  } catch (e) {
    // 如果设置失败，回退到末尾
    placeCaretAtEnd()
  }
}
  
  // 处理输入
  const handleInput = () => {
    if (isComposing.value) return
    
    // 输入时只检测后面有空格的话题（让用户可以继续输入话题名）
    detectTopicsWithSpace()
    
    const rawContent = convertToRawContent()
    emit('update:modelValue', rawContent)
  }
  
  // 处理失焦
  const handleBlur = () => {
    isFocused.value = false
    
    // 失焦时检查所有未转换的话题（包括末尾的）
    if (!isComposing.value) {
      const converted = detectAllTopics()
      if (converted) {
        const rawContent = convertToRawContent()
        emit('update:modelValue', rawContent)
      }
    }
  }
  
  // 处理聚焦
  const handleFocus = () => {
    isFocused.value = true
  }
  
  // 处理按键
  const handleKeydown = (e) => {
    // 处理中文输入法
    if (e.key === 'Process' || e.keyCode === 229) {
      isComposing.value = true
    }
    
    // 按回车时检测所有话题（包括末尾的）
    if (e.key === 'Enter') {
      nextTick(() => {
        detectAllTopics()
        const rawContent = convertToRawContent()
        emit('update:modelValue', rawContent)
      })
    }
  }
  
  // 监听外部值变化
  watch(() => props.modelValue, (newVal, oldVal) => {
    if (!editorRef.value) return
    
    // 只有当外部值与当前内容不同时才更新
    const currentContent = convertToRawContent()
    if (newVal !== currentContent) {
      renderContent()
    }
  }, { immediate: false })
  
  // 监听组合输入结束
  onMounted(() => {
    if (editorRef.value) {
      editorRef.value.addEventListener('compositionstart', () => {
        isComposing.value = true
      })
      editorRef.value.addEventListener('compositionend', () => {
        isComposing.value = false
        nextTick(() => {
          handleInput()
        })
      })
      
      // 初始渲染
      nextTick(() => {
        renderContent()
      })
    }
  })
  </script>
  
  <style scoped>
  .guide-words-editor {
    width: 100%;
    position: relative;
  }
  
  .editor-area {
    min-height: v-bind(height);
    height: 150px !important;
    padding: 8px 11px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #fff;
    transition: border-color 0.2s;
    line-height: 1.6;
    font-size: 14px;
    word-break: break-all;
    white-space: pre-wrap;
    outline: none;
    color: #606266;
    overflow-y: auto;
  }
  
  .editor-area:hover {
    border-color: #c0c4cc;
  }
  
  .editor-area:focus {
    border-color: #409eff;
  }
  
  .editor-area:empty::before {
    content: attr(data-placeholder);
    color: #a8abb2;
    pointer-events: none;
  }
  
  .editor-area :deep(.topic-tag) {
    display: inline-flex;
    align-items: center;
    position: relative;
    padding: 0 2px;
    border-radius: 2px;
    transition: background-color 0.2s;
    user-select: none;
    vertical-align: baseline;
  }
  
  .editor-area :deep(.topic-tag:hover) {
    background-color: #f0f7ff;
  }
  
  .editor-area :deep(.topic-text) {
    color: #576B95;
    font-weight: 400;
  }
  
  .editor-area :deep(.remove-btn) {
    display: none;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 2px;
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    background-color: #f56c6c;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
    line-height: 1;
  }
  
  .editor-area :deep(.topic-tag:hover .remove-btn) {
    display: inline-flex;
  }
  
  .editor-area :deep(.remove-btn:hover) {
    background-color: #f23c3c;
  }
  </style>
  