<template>
  <el-row class="bg-[#e9f9f1] h-full stats">
    <el-col :span="3">
      <el-menu default-active="mp_account" class="min-h-full">
        <el-menu-item-group title="数据服务">
          <el-menu-item index="mp_account" @click="activeName='mp_account'">
            <el-icon><TrendCharts/></el-icon>
            <span>微信公众号</span>
          </el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="文章">
          <el-menu-item index="posts" @click="activeName='posts'">
            <el-icon><ICFire/></el-icon>
            <span>最新爆文</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-col>
    <el-col :span="21" class="h-full overflow-y-scroll">
      <MPAccount v-if="activeName==='mp_account'" class="aaa w-full flex-1 p-2"></MPAccount>
      <Posts v-else-if="activeName==='posts'"/>
    </el-col>
  </el-row>
</template>
<style>
/* .stat-tabs > .el-tabs__content {
  @apply flex flex-col bg-slate-400;
} */
 .stats {
  border-top: 1px solid var(--el-border-color);
 }
 .el-menu--vertical {
  --el-menu-item-height: 36px;
}
</style>
<script setup>
import { ref } from 'vue'
import MPAccount from './MPAccount.vue';
import Posts from './Posts.vue'
import ICFire from './ICFire.vue';
import {TrendCharts} from '@element-plus/icons-vue'

const activeName = ref('mp_account')


</script>
