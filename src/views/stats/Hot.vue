<template>
<div class="hot-today flex h-full">
  <div class="h-full overflow-y-auto">
    <Categories v-model="params.industry" :default-active="params.industry">
      <el-menu-item index="0">全部</el-menu-item>
    </Categories>
  </div>
  <div class="flex-1 w-0 m-2 bg-white flex flex-col">
    <div class="filters flex items-center p-2">
      <el-date-picker v-model="params.data_time" :disabledDate="disabledDate" placeholder="请选择日期" value-format="YYYY-MM-DD"></el-date-picker>
      <el-divider direction="vertical"></el-divider>
      <el-checkbox v-model="params.pub_type" @change="params.industry=0" label="只看小绿书" true-value="1" false-value="0"/>
      <div class="ml-auto"></div>
      <Hydrate/>
    </div>
    <el-table v-loading="loading" :data="tableData" class="w-full overflow-y-auto" row-key="aid" @sort-change="onSort" :default-sort="{prop:'read_num',order:'descending'}">
      <el-table-column prop="title" label="文章" min-width="400">
        <template #default="v">
          <div class="text-ellipsis text-nowrap overflow-hidden text-sm">
            <el-tooltip effect="dark" :content="v.row.title" placement="top-start">
              <span class="text-base text-black font-bold align-middle" @click="openUrl(v.row.url)">{{ v.row.title }}</span>
            </el-tooltip>
          </div>
          <div class="text-sm mt-1">
            <time datetime="">{{ v.row.publish_time }}</time>
            <span class="ml-1">{{ v.row.wx_name }}</span>
          </div>
      </template>
      </el-table-column>
      <el-table-column prop="avatar" label="封面" width="72">
        <template #default="v">
          <el-image :src="v.row.avatar" alt="" class="size-[48px] rounded-[4px]"/>
        </template>
      </el-table-column>
      <el-table-column prop="read_num" label="阅读数" width="100" sortable="custom"/>
      <el-table-column prop="zan_num" label="点赞数" width="100" sortable="custom" />
      <el-table-column prop="look_num" label="在看数" width="100" sortable="custom" />
      <el-table-column prop="relative_quality" label="相对质量值" width="140" sortable="custom">
        <template #header>
          <el-tooltip content="相对质量值=阅读数/公众号平均阅读数">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
          <span>相对质量值</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="100">
        <template #default="v">
          <el-tooltip effect="dark" content="添加到素材合成器" placement="top">
            <el-button :icon="FolderAdd" @click="hydrateStore.add(v.row)" :disabled="+params.pub_type" size="large" link></el-button>
          </el-tooltip>
          <el-tooltip effect="dark" content="相似文章" placement="top">
            <el-button :icon="Memo" size="large" link @click="sim=v.row,openSim=true"></el-button>
          </el-tooltip>
          <el-tooltip effect="dark" content="复制链接" placement="top">
            <el-button :icon="CopyDocument" @click="copyLink(v.row.url)" size="large" link></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination class="flex-1 p-2" :total="total" @pagination="onPagination" :page="params.page" :limit="params.num" :pageSizes="[20,30,50,100]"/>
  </div>
  <DialogSimilarPosts v-model="openSim" :sim="sim"></DialogSimilarPosts>
</div>
</template>
<script setup>
import { onMounted, ref, shallowRef,watch } from 'vue'
import Categories from './components/Categories.vue';
import { getHotPosts, openUrl } from '@/api/posts';
import { copyLink, dog } from '@/utils';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination';
import Hydrate from '@/components/Hydrate.vue';
import { useHydrateStore } from '@/store/piniaStore';
import { FolderAdd, CopyDocument, QuestionFilled, Memo } from '@element-plus/icons-vue';
import DialogSimilarPosts from './components/DialogSimilarPosts.vue';

var openSim=ref(false)
var sim=shallowRef({})
var hydrateStore=useHydrateStore();
var params=ref({
  page:1,num:20,industry:'26',
  mode:1,pub_type:0,data_time:dayjs().subtract(1,'day').format('YYYY-MM-DD'),
})
var loading=ref(true)
var tableData=shallowRef([])
var total=ref(0)
onMounted(async()=>{
  var data=await getHotPosts(params.value)
  dog('hot today',data)
  loading.value=false
  tableData.value=data.data;
  total.value=data.count
})
watch(params,async()=>{
  loading.value=true
  var data=await getHotPosts(params.value)
  loading.value=false
  tableData.value=data.data;
  total.value=data.count
},{deep:true})
function onPagination(query){
  params.value.page=query.page;
  params.value.num=query.limit;
}
function disabledDate(time){
  return time.getTime() > Date.now()||time.getFullYear()<2019;
}
var sortOpt={read_num:1,zan_num:2,look_num:4,relative_quality:3};
function onSort({prop,order}){
  params.value.mode=sortOpt[prop]||1;
}
</script>
<style>
</style>
