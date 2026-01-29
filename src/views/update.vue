<template>
  <div class="progress">
    <el-progress type="circle" :percentage="percentage" />
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
// import { ipcRenderer } from 'electron'
const percentage = ref(0)

onMounted(() => {
  // ipcRenderer.on('downloadProgress', (e, arg) => {
  //     percentage.value = parseInt(arg.percent)
  // })

  console.log(window.envVars.is_debug) 
  window.ipcRenderer.receive('downloadProgress', async (arg) => {
    console.log("downloadProgress==>", arg)
    percentage.value = parseInt(arg.percent)
  })
})

</script>
<style scoped>
.progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
