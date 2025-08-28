<template>
  <div class="gossip h-full px-6 py-2 grid grid-cols-3 gap-2 overflow-y-auto">
    <el-empty v-if="list.length===0"></el-empty>
    <div class="item bg-white hover:shadow-lg duration-200" v-for="v in list" :key="v.name">
      <div class="head p-2 flex items-center">
        <img :src="`http://jzl.com/main/pic/djl/${v.icon||icons[v.name]}`" width="24" height="24" class="mr-3 rounded-[6px]">
        <span class="text-lg flex-1">{{ v.name }}</span>
        <span class="text-gray-500 text-sm">{{ v.update_at }}</span>
      </div>
      <ul class="list h-[400px] overflow-y-auto p-2">
        <li class="item flex mb-4" v-for="(item,index) in v.items" :key="index">
          <span class="marker mr-3">{{ index+1 }}</span>
          <a class="name flex-1 line-clamp-3 -mt-[1px] cursor-pointer hover:text-blue-500" @click="openUrl(item.url)">{{ item.name }}</a>
          <span v-if="item.value" class="value text-gray-500 line-clamp-2 text-sm ml-2 w-[60px] text-right self-start">{{ item.value }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getGossips,openUrl } from '@/api/posts'
import { dog } from '@/utils'

var icons={"知乎热榜":"10_9.png","豆瓣热话":"10_30.png","微博热搜":"10_2.png","今日头条":"10_5.png","虎扑步行街":"10_31.png","B站":"10_7.png","IT之家":"10_33.png","中关村在线":"10_34.png","爱范儿":"10_35.png","开源中国":"10_37.png","CSDN":"10_39.png","虎嗅":"10_32.png","值得买3小时热门":"10_36.png","掘金":"10_38.png","抖音":"10_1.png","小红书":"10_4.png"}
var list = ref([])
onMounted(async () => {
  var res = await getGossips({ page: 1, limit: 20 })
  dog('gossip list', res.data)
  list.value = res.data
})
</script>
<style>
.gossip{
  &>.item{
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
  }
  .head{
    border-bottom: 1px solid var(--el-border-color);
  }
  .list{
    .marker{
      @apply text-gray-500;
      width: 24px;
      font-size: 18px;
      font-weight: bold;
      line-height: 24px;
      text-align: center;
    }
    .item:nth-child(1) .marker{
      color: #f00;
    }
    .item:nth-child(2) .marker{
      color: #f50;
    }
    .item:nth-child(3) .marker{
      color: #f90;
    }
  }
}
</style>
