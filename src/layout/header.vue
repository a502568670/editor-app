<template>
  <el-row :gutter="20">
    <el-col :span="4" style="display: flex;flex-direction: column;justify-content: center">
      <div style="font-size: 12px;margin-bottom: 5px;">{{$store.state.user?.mobile}}</div>
      <div v-if="$store.state.user?.vip_name" style="color:#999;font-size: 12px;">{{$store.state.user?.vip_name}}[{{$store.state.user?.vip_endtime}}]到期</div>
      <div style="color:#999;font-size: 12px;" v-else>{{username}}</div>
    </el-col>
    <el-col :span="14">
      <div style="display:flex;align-items: center;">
        <div @click="toUrl(item.url,index)"  v-for="(item,index) in menuList" :key="index" class="menu" :class="{'active':item.url==current}">
          <img  v-if="item.url==current" :src="item.icon_active" />
          <img v-else :src="item.icon" />
          <span>{{item.name}}</span>
        </div>
        <router-link to="/stats?pagetype=2" class="menu" replace :class="{'active':$route.path=='/stats'&&$route.query.pagetype=='2'}">
          <el-icon :size="20"><Newspaper/></el-icon>
          <span class="mt-1">监控和爆文</span>
        </router-link>
        <router-link class="menu" to="/file" active-class="active" replace>
          <el-icon :size="20"><ImagePlay/></el-icon>
          <span class="mt-1">素材库</span>
        </router-link>
      </div>
    </el-col>
    <el-col :span="6" style="text-align: right">
      <div class="right">
        <!-- <Hydrate/> -->
        <!-- <el-button @click="toBuyVip" type="primary" >购买会员</el-button> -->
        <el-button @click="gotoExternal(jzl_assistant_url)" type="primary" >极致了助手</el-button>
        <el-button @click="toKf" type="success" >联系客服</el-button>
        <el-button @click="exit" type="danger" :icon="SwitchButton" circle></el-button>
      </div>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, reactive, toRefs, computed, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {ImagePlay, Newspaper} from 'lucide-vue-next'
import {
  SwitchButton
} from '@element-plus/icons-vue'
import { gotoExternal } from "@/utils/openWindow"
import Hydrate from '@/components/Hydrate.vue';
import { useAccountStore } from '@/store/piniaStore'
// console.log(toRaw(useRoute()));


const store = useStore()
const router = useRouter();
const current = computed(() => {
  if(router.currentRoute.value.path.startsWith('/stats'))
    return router.currentRoute.value.fullPath
  return router.currentRoute.value.path
})
const menuList = ref([
//   {
//   name:'管理中心',
//   url:'/home',
//   icon:require('@/assets/image/menu.png'),
//   icon_active:require('@/assets/image/menu_active.png')
// },
{
  name:'账号中心',
  url:'/tabbar',
  icon:require('@/assets/image/account.png'),
  icon_active:require('@/assets/image/account_active.png')
},
// {
//   name:'爆热集',
//   url:'/hot',
//   icon:require('@/assets/image/hot.png'),
//   icon_active:require('@/assets/image/hot_active.png')
// },
{
  name:'草稿箱',
  url:'/material_lib',
  icon:require('@/assets/image/box.png'),
  icon_active:require('@/assets/image/box_active.png')
},
// {
//   name:'编辑器old',
//   url:'/editor4',
//   icon:require('@/assets/image/editor.png'),
//   icon_active:require('@/assets/image/editor_active.png')
// },
{
  name:'编辑器',
  url:'/editor3',
  icon:require('@/assets/image/editor.png'),
  icon_active:require('@/assets/image/editor_active.png')
},
{
  name:'统计',
  url:'/stats',
  icon:require('@/assets/image/stat.png'),
  icon_active:require('@/assets/image/stat_active.png')
},
// {
//   name:'编辑器旧',
//   url:'/editor',
//   icon:require('@/assets/image/hot.png'),
//   icon_active:require('@/assets/image/hot_active.png')
// },{
//   name:'CKEditor',
//   url:'/editor2',
//   icon:require('@/assets/image/hot.png'),
//   icon_active:require('@/assets/image/hot_active.png')
// },{
//   name:'UEditor',
//   url:'/editor3',
//   icon:require('@/assets/image/hot.png'),
//   icon_active:require('@/assets/image/hot_active.png')
// }
])
var account=useAccountStore()
const exit = function () {
  store.dispatch('FedLogOut').then(() => {
    account.update([])
    router.push('/login')
  })
}
const toUrl = function (url,index) {
  router.replace({path:url})
}
const toBuyVip = function () {
  router.push('/buyVip')
}
const toKf = function () {
  router.push('/kf')
}
const username = ref(localStorage.getItem("username"))
const jzl_assistant_url = store.state.config?.jzl_assistant_url
</script>

<style  scoped>

.right {
  display: flex;
  padding-right: 10px;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.menu{
  /* width: 60px; */
  padding: 0 20px;
  height:60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  /* margin-right: 10px; */
}
.menu img{
  width: 25px;
  height: 25px;
}
.menu.active{
  background-color: #e9f9f1;
  color:#51ce94;
}
</style>
