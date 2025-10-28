<template>
  <div class="default-templ">
    <div class="default-templ_item">
      <p>关注引导</p>
      <div class="default-templ_html">
        <div class="default-templ_content" v-html="templateData.attentionGuidance"></div>
        <div class="default-templ_overlay">
          <el-button type="primary" size="small" @click="importHtml('attentionGuidance')"> 从编辑器内导入 </el-button>
          <el-button size="small" @click="deleteHtml('attentionGuidance')">删 除</el-button>
        </div>
      </div>
    </div>
    <div class="default-templ_item">
      <p>阅读原文引导</p>
      <div class="default-templ_html">
        <div class="default-templ_content" v-html="templateData.readOriginalGuidance"></div>
        <div class="default-templ_overlay">
          <el-button type="primary" size="small" @click="importHtml('readOriginalGuidance')">
            从编辑器内导入
          </el-button>
          <el-button size="small" @click="deleteHtml('readOriginalGuidance')">删 除</el-button>
        </div>
      </div>
    </div>
    <div class="default-templ_item">
      <p>阅读原文引导</p>
      <el-input v-model="templateData.originalLink" placeholder="请输入原文链接" @blur="setTemplateData()"></el-input>
    </div>
    <div class="default-templ_item">
      <p>作者</p>
      <el-input v-model="templateData.author" placeholder="请输入作者" @blur="setTemplateData()"></el-input>
    </div>
    <div class="w-full text-center">
      <el-button type="primary" @click="useTemplate">使用模板</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDefaultTempl, setDefaultTempl } from '@/api/mp_msg';

// 拿到父组件传递的v-model值
const html = defineModel();

const emit = defineEmits(['useTemplate']);

const templateData = ref({
  attentionGuidance: '', // 关注引导
  readOriginalGuidance: '', // 阅读原文引导
  originalLink: '', // 原文链接
  author: '' // 作者
});

// 点击导入按钮
const importHtml = key => {
  templateData.value[key] = html.value;
  setTemplateData();
};
// 点击删除按钮
const deleteHtml = key => {
  templateData.value[key] = '';
  setTemplateData();
};

// 点击使用模板按钮
const useTemplate = () => {
  html.value = `
    ${templateData.value.attentionGuidance}
    <br/>
    ${html.value}
    <br/>
    ${templateData.value.readOriginalGuidance}
  `;

  emit('useTemplate', templateData.value);
};

const getTemplateData = async () => {
  const data = await getDefaultTempl();
  if (data.status === 200) {
    templateData.value.attentionGuidance = data.data.guide_attention;
    templateData.value.readOriginalGuidance = data.data.guide_read_original;
    templateData.value.originalLink = data.data.original_link;
    templateData.value.author = data.data.author;
  } else {
    templateData.value.attentionGuidance = '';
    templateData.value.readOriginalGuidance = '';
    templateData.value.originalLink = '';
    templateData.value.author = '';
  }
};

const setTemplateData = async () => {
  const formData = {
    guide_attention: templateData.value.attentionGuidance,
    guide_read_original: templateData.value.readOriginalGuidance,
    original_link: templateData.value.originalLink,
    author: templateData.value.author
  };
  await setDefaultTempl(formData);
};

onMounted(() => {
  getTemplateData();
});
</script>

<style scoped>
.default-templ {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.default-templ_item {
  margin-bottom: 15px;
}

p {
  font-size: 14px;
  margin-bottom: 3px;
  color: var(--jzl-input-title-color);
}

.default-templ_html {
  border: 1px dashed var(--jzl-border-color);
  border-radius: var(--jzl-border-radius-base);
  padding: 10px;
  min-height: 50px;
  position: relative;
}
.default-templ_html:hover {
  border-color: var(--jzl-border-color-hover);
}
.default-templ_html:hover .default-templ_overlay {
  opacity: 1;
}

.default-templ_overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--jzl-overlay-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}
</style>
