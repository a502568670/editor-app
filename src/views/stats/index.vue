<template>
  <div class="bg-[#e9f9f1] w-full min-h-full flex flex-col">
    <el-container class="flex-1 flex flex-col">
      <el-tabs v-model="activeName" class="stat-tabs w-full min-h-full flex-1  px-4" @tab-click="handleClick">
        <el-tab-pane label="微信公众号" name="mp_account" class="flex h-full">
          <MPAccount class="aaa w-full flex-1"></MPAccount>
        </el-tab-pane>
      </el-tabs>
    </el-container>
  </div>
</template>
<style>
/* .stat-tabs > .el-tabs__content {
  @apply flex flex-col bg-slate-400;
} */
</style>
<script setup>
import { ref } from 'vue'
import MPAccount from './MPAccount.vue';


const activeName = ref('mp_account')

const handleClick = (tab, event) => {
  console.log(tab, event)
}

</script>
