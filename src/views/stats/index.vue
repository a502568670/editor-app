<template>
  <el-row class="bg-[#e9f9f1] h-full stats">
    <el-menu :default-active="activeName" class="min-h-full w-auto" @select="(index)=>activeName=index">
      <el-menu-item-group title="数据服务" v-if="$route.fullPath=='/stats'">
        <el-menu-item index="mp_account">
          <el-icon><TrendCharts/></el-icon>
          <span>微信公众号</span>
        </el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="文章" v-if="$route.query.pagetype=='2'">
        <el-menu-item index="posts">
          <el-icon><ICFire/></el-icon>
          <span>最新爆文</span>
        </el-menu-item>
        <el-menu-item index="sub_keywords">
          <el-icon><Management/></el-icon>
          <span>关键词订阅</span>
        </el-menu-item>
        <el-menu-item index="sub_mplist">
          <el-icon><Avatar/></el-icon>
          <span>关注的公众号</span>
        </el-menu-item>
      </el-menu-item-group>
    </el-menu>
    <div class="h-full overflow-y-scroll flex-1">
      <MPAccount v-if="activeName==='mp_account'" class="aaa w-full flex-1 p-2"></MPAccount>
      <Posts v-else-if="activeName==='posts'"/>
      <SubKeywords v-else-if="activeName==='sub_keywords'"/>
      <SubMPList v-else-if="activeName==='sub_mplist'"/>
    </div>
  </el-row>
</template>
<style>
/* .stat-tabs > .el-tabs__content {
  @apply flex flex-col bg-slate-400;
} */
 .stats {
  border-top: 1px solid var(--el-border-color);
 }
 .stats .el-menu--vertical {
  --el-menu-item-height: 36px;
  --el-menu-sub-item-height: 30px;
  --el-menu-level-padding: .1px;
}
.stats .el-menu-item.is-active,
.stats .el-sub-menu.is-active{
  background-color: var(--el-menu-hover-bg-color);
}
.stats .el-input+.el-badge{
  margin-left: 4px;
}
.stats .el-table .el-button+.el-button {
  margin-left: 4px;
}
</style>
<script setup>
import { ref, toRaw, watchEffect } from 'vue'
import MPAccount from './MPAccount.vue';
import Posts from './Posts.vue'
import ICFire from './ICFire.vue';
import {TrendCharts,Avatar,Management} from '@element-plus/icons-vue'
import SubKeywords from './SubKeywords.vue';
import SubMPList from './SubMPList.vue';
import Hydrate from '@/components/Hydrate.vue';
import { dog } from '@/utils';
import { useRoute } from 'vue-router';

var route = useRoute();
const activeName = ref('mp_account');
watchEffect(()=>{
  if(route.query.pagetype=='2'){
    activeName.value='posts';
  }else{
    activeName.value='mp_account';
  }
})
// dog(toRaw(useRoute()))

</script>
