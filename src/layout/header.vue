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
      </div>
    </el-col>
    <el-col :span="6" style="text-align: right">
      <div class="right">
        <!-- <el-button @click="toBuyVip" type="primary" >购买会员</el-button> -->
        <el-button @click="gotoExternal(jzl_assistant_url)" type="primary" >极致了助手</el-button>
        <el-button @click="toKf" type="success" >联系客服</el-button>
        <el-button @click="exit" type="danger" :icon="SwitchButton" circle></el-button>
      </div>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, reactive, toRefs, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  SwitchButton
} from '@element-plus/icons-vue'
import { gotoExternal } from "@/utils/openWindow"

const store = useStore()
const router = useRouter();
const current = computed(() => {
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
  name:'编辑器',
  url:'/editor4',
  icon:require('@/assets/image/hot.png'),
  icon_active:require('@/assets/image/hot_active.png')
},
// {
//   name:'统计',
//   url:'/stats',
//   icon:require('@/assets/image/hot.png'),
//   icon_active:require('@/assets/image/hot_active.png')
// },
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

const exit = function () {
  store.dispatch('FedLogOut').then(() => {
    router.push('/login')
  })
}
const toUrl = function (url,index) {
  router.push(url)
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
  width: 60px;
  height:60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  margin-right: 10px;
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
