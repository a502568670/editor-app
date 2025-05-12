<template>
  <vue-ueditor-wrap class="h-[550px]" v-model="msg" :config="editorConfig" editor-id="editor-demo-01"></vue-ueditor-wrap>
</template>

<script setup>
import { ref } from 'vue';
const msg = ref('<h2>Hello World!</h2>');
const editorConfig = ref({
      // 访问 UEditor 静态资源的根路径，可参考 https://hc199421.gitee.io/vue-ueditor-wrap/#/faq
  UEDITOR_HOME_URL: '/UEditor/',
  // 服务端接口（这个地址是我为了方便各位体验文件上传功能搭建的临时接口，请勿在生产环境使用！！！）
  serverUrl: '//ueditor.zhenghaochuan.com/cos',
  autoHeightEnabled: false,
  // 初始容器高度
	initialFrameHeight: 'calc(100vh-60px)',
	// 初始容器宽度
	initialFrameWidth: '100%',
});

</script>