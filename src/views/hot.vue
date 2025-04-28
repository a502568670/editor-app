
<template>
  <div style="height:40px;background-color: #e9f9f1;width: 100%;display: flex;align-items: center;padding-left: 20px;">
    <el-button @click="goBack" size="small" type="info">后退</el-button>
    <el-button @click="goForward" size="small" type="info">前进</el-button>
  </div>
  <iframe ref="iframe" height="100%" width="100%" src="http://baowen.yunspeed.com/"></iframe>
</template>
<script setup>
import { ref } from 'vue';

const iframe = ref(null);

const goBack = () => {
  iframe.value.contentWindow.history.back();
};

const goForward = () => {
  iframe.value.contentWindow.history.forward();
};

</script>
