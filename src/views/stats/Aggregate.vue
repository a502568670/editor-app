<template>
  <div class="aggregate bg-white h-full flex flex-col">
    <div class="my-2 px-4 flex items-center">
      <el-date-picker style="width:300px;flex-grow: 0;" v-model="date" type="daterange" :disabled="loading" placement="bottom-start" :shortcuts="shortcuts" :disabled-date="disabledDate" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      <div class="flex-1"></div>
      <span class="text-gray-500 text-sm mr-2">更新于{{ aggrData.update_at }}</span>
      <el-button type="primary" @click="getListOrig" :icon="RefreshRight" :loading="loading">刷新数据</el-button>
    </div>
    <el-divider style="margin: 0;"></el-divider>
    <div class="my-2 px-4 flex-1 overflow-y-auto" v-loading="loading" element-loading-text="您可以离开当前页面，数据分析将在后台继续进行">
      <div class="grid grid-cols-4 gap-4">
        <el-statistic class="p-6 rounded-[10px] border border-gray-200 hover:shadow-lg duration-250" v-for="v in data" :key="v.key" :title="v.name" :value="v.suffix==='元'?aggrData[v.key]/100:aggrData[v.key]" :precision="v.precision">
          <template #suffix>{{ v.suffix }}</template>
        </el-statistic>
      </div>
      <el-segmented class="my-4" v-model="seg" :options="segOpts"></el-segmented>
      <div class="h-[250px]">
        <v-chart :option="chartOpt" :init-options="{useDirtyRect:true,height:250}" :update-options="{notMerge:true}" autoresize></v-chart>
      </div>
      <div class="flex items-center my-2">
        <div class="text-xl">数据报表</div>
        <el-segmented class="mx-2" v-model="report" :options="reportOpts"></el-segmented>
        <div class="flex-1"></div>
        <!-- <el-button :icon="DocumentChecked">导出</el-button> -->
      </div>
      <el-table :data="aggrData.stat_daily" v-if="report===1" :default-sort="{ prop: 'date', order: 'descending' }">
        <el-table-column label="日期" prop="date" width="120" sortable fixed></el-table-column>
        <el-table-column label="累计关注" prop="fans" width="120" sortable></el-table-column>
        <el-table-column label="净增关注" prop="fans_follow" width="120" sortable></el-table-column>
        <el-table-column label="新增关注" prop="fans_increase" width="120" sortable></el-table-column>
        <el-table-column label="取消关注" prop="fans_unfollow" width="120" sortable></el-table-column>
        <el-table-column label="收入（元）" prop="income" width="120" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="阅读人数" prop="uv" width="120" sortable></el-table-column>
        <el-table-column label="阅读次数" prop="pv" width="120" sortable></el-table-column>
        <el-table-column label="分享人数" prop="share" width="120" sortable></el-table-column>
        <el-table-column label="分享次数" prop="share_count" width="120" sortable></el-table-column>
        <el-table-column label="收藏人数" prop="fav" width="120" sortable></el-table-column>
        <el-table-column label="收藏次数" prop="fav_count" width="120" sortable></el-table-column>
        <el-table-column label="阅读原文人数" prop="uv_original" width="150" sortable></el-table-column>
        <el-table-column label="阅读原文次数" prop="pv_original" width="150" sortable></el-table-column>
        <el-table-column label="群发篇数" prop="notigroup_msgs" width="120" sortable></el-table-column>
        <el-table-column label="底部广告（元）" prop="ad_foot" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="互选广告（元）" prop="ad_attract" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="文中广告（元）" prop="ad_insert" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="关键词广告（元）" prop="ad_keyword" width="180" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="视频后贴（元）" prop="ad_postvideo" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="留言区广告（元）" prop="ad_comment" width="180" :formatter="moneyFormatter" sortable></el-table-column>
      </el-table>
      <el-table v-else-if="report===2" :data="aggrData.stat_account">
        <el-table-column label="账号" prop="" width="200" fixed>
          <template #default="v">
            <div class="flex items-center">
              <img :src="v.row.avatar" alt="" class="w-[24px] h-[24px] rounded-full object-cover mr-2">
              <span class="text-sm text-gray-700">{{ v.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总粉丝" prop="fans" width="120" sortable></el-table-column>
        <el-table-column label="今日净增" prop="fans_increase_today" width="120" sortable></el-table-column>
        <el-table-column label="昨日净增" prop="fans_increase_yesterday" width="120" sortable></el-table-column>
        <el-table-column label="昨日关注" prop="fans_follow_yesterday" width="120" sortable></el-table-column>
        <el-table-column label="昨日取关" prop="fans_unfollow_yesterday" width="120" sortable></el-table-column>
        <el-table-column label="总收入（元）" prop="income" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日收入（元）" prop="income_yesterday" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="上周收入（元）" prop="income_last_week" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="上月收入（元）" prop="income_last_month" width="150" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日阅读人数" prop="uv_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日阅读次数" prop="pv_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日分享人数" prop="share_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日分享次数" prop="share_count_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日收藏人数" prop="fav_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日收藏次数" prop="fav_count_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日阅读原文人数" prop="uv_original_yesterday" width="180" sortable></el-table-column>
        <el-table-column label="昨日阅读原文次数" prop="pv_original_yesterday" width="180" sortable></el-table-column>
        <el-table-column label="昨日群发篇数" prop="notigroup_msgs_yesterday" width="150" sortable></el-table-column>
        <el-table-column label="昨日底部广告（元）" prop="ad_foot_yesterday" width="180" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日互选广告（元）" prop="ad_attract_yesterday" width="180" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日文中广告（元）" prop="ad_insert_yesterday" width="180" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日关键词广告（元）" prop="ad_keyword_yesterday" width="200" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日视频后贴（元）" prop="ad_postvideo_yesterday" width="180" :formatter="moneyFormatter" sortable></el-table-column>
        <el-table-column label="昨日留言区广告（元）" prop="ad_comment_yesterday" width="200" :formatter="moneyFormatter" sortable></el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { dayjs } from 'element-plus';
import { onMounted, ref, shallowRef, toRaw, watch } from 'vue';
import { QuestionFilled, RefreshRight,DocumentChecked } from '@element-plus/icons-vue';
import {use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {TooltipComponent,TitleComponent,VisualMapComponent,LegendComponent,GridComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import VChart from 'vue-echarts'
import { dog } from '@/utils';
import store from '@/store';
import { getToken } from '@/utils/auth';
import { getExMpstat } from '@/api/stat-client';

use([CanvasRenderer,LineChart,TooltipComponent,TitleComponent,VisualMapComponent,LegendComponent,GridComponent])
var chartOpt=ref({
  tooltip: {
    trigger: 'axis'
  },
  grid:{left:30,right:0,bottom:30},
  xAxis:{
    type:'category',
    data:[],
  },
  yAxis:{},
  legend:{align:'left',left:20,top:20},
  series:[
    {
      name:'粉丝数',
      data: [],
      type: 'line',
    },
  ],
})
var aggrData=shallowRef({})

var shortcuts=[
  {text:'最近一周',value:()=>[dayjs().subtract(7,'day'),dayjs().subtract(1,'day')]},
  {text:'最近一个月',value:()=>[dayjs().subtract(1,'month'),dayjs().subtract(1,'day')]},
  // {text:'最近两个月',value:()=>[dayjs().subtract(2,'month'),dayjs()]},
  // {text:'最近3个月',value:()=>[dayjs().subtract(3,'month'),dayjs()]},
];
var date=ref([dayjs().subtract(1,'month'),dayjs().subtract(1,'day')])
watch(date,()=>{
  getList()
})

function disabledDate(time){
  return time.getTime() >=dayjs().subtract(1,'day') ||dayjs(time).isBefore(dayjs().subtract(1,'month'))
}
var loading=ref(false)
var data = [
  { key:'fans',name: '总粉丝', value: 200, suffix: '人' },
  { key:'fans_follow_today',name: '今日净增', value: 50, suffix: '人' },
  { key:'uv_yesterday',name: '昨日阅读人数', value: 1200, suffix: '人' },
  { key:'pv_yesterday',name: '昨日阅读次数', value: 30, suffix: '次' },
  { key:'income_yesterday',name: '昨日收入', value: 200, suffix: '元',precision:2 },
  { key:'revenue_last_week',name: '上周收入', value: 50.54, suffix: '元',precision:2 },
  { key:'income_last_month',name: '上月收入', value: 1200.5, suffix: '元',precision:2 },
  { key:'income_all',name: '总收入', value: 30.1, suffix: '元',precision:2 },
];
var seg=ref('粉丝增长')
var segOpts=['粉丝增长','粉丝总数','文章阅读','文章互动','群发篇数','广告收入']
watch(seg,()=>{
  chartOpt.value.series=getSegData(seg.value)
})
function getSegData(key){
  var {stat_daily}=aggrData.value;
  switch (key) {
    case '粉丝增长':
      return [
        {type:'line',name:'净增关注',data:stat_daily.map(v=>v.fans_follow)},
        {type:'line',name:'新增关注',data:stat_daily.map(v=>v.fans_increase)},
        {type:'line',name:'取消关注',data:stat_daily.map(v=>v.fans_unfollow)},
      ];
    case '粉丝总数':
      return [
        {type:'line',name:'累计关注',data:stat_daily.map(v=>v.fans)},
      ];
    case '文章阅读':
      return [
        {type:'line',name:'阅读人数',data:stat_daily.map(v=>v.uv)},
        {type:'line',name:'阅读次数',data:stat_daily.map(v=>v.pv)},
        {type:'line',name:'原文阅读人数',data:stat_daily.map(v=>v.uv_original)},
        {type:'line',name:'原文阅读次数',data:stat_daily.map(v=>v.pv_original)},
      ];
    case '文章互动':
      return [
        {type:'line',name:'分享人数',data:stat_daily.map(v=>v.share)},
        {type:'line',name:'分享次数',data:stat_daily.map(v=>v.share_count)},
        {type:'line',name:'收藏人数',data:stat_daily.map(v=>v.fav)},
        {type:'line',name:'收藏次数',data:stat_daily.map(v=>v.fav_count)},
      ];
    case '群发篇数':
      return [
        {type:'line',name:'群发篇数',data:stat_daily.map(v=>v.notigroup_msgs)},
      ];
    case '广告收入':
      return [
        {type:'line',name:'收入（元）',data:stat_daily.map(v=>v.income)},
        {type:'line',name:'底部广告',data:stat_daily.map(v=>v.ad_foot)},
        {type:'line',name:'互选广告',data:stat_daily.map(v=>v.ad_attract)},
        {type:'line',name:'文中广告',data:stat_daily.map(v=>v.ad_insert)},
        {type:'line',name:'关键词广告',data:stat_daily.map(v=>v.pad_keywordv)},
        {type:'line',name:'视频后贴',data:stat_daily.map(v=>v.ad_postvideo)},
        {type:'line',name:'留言区广告',data:stat_daily.map(v=>v.ad_comment)},
      ];
    default:
      return []
  }
}
async function getList(){
  var res=await getExMpstat({begin_date:dayjs(date.value[0]).format('YYYY-MM-DD'),end_date:dayjs(date.value[1]).format('YYYY-MM-DD')})
  res.data.data.stat_account.forEach(v=>{
    var {name,avatar}=store.state.accounts.list.find(a=>a.id===v.id);
    v.avatar=avatar;
    v.name=name;
  })
  aggrData.value=res.data.data
  seg.value=segOpts[0];
  chartOpt.value.xAxis.data=res.data.data.stat_daily.map(v=>v.date.substring(5))
  chartOpt.value.series=getSegData(seg.value)
  loading.value=false
  dog('wxAggregate getList',res.data)
}
async function getListOrig(){
  loading.value=true
  var accounts=toRaw(store.getters.all_accounts.list);
  var {user_id} = store.state.user;
  var token=getToken();
  var res=await window.webBridge.callRpc('batchWxAggregate',{accounts,user_id,token})
  // dog('wxAggregate getListOrig',res)
  await getList();
  loading.value=false
}
function randomChart(){
  return Array.from({length:chartOpt.value.xAxis.data.length},()=>Math.floor(Math.random()*1000)-500)
}

onMounted(()=>getList())
var report=ref(1)
var reportOpts=[
  {label:'分日',value:1},
  {label:'分账号',value:2},
]
function moneyFormatter(row,col,v,i){
  return isNaN(v)?'--': v/100;
}
</script>
<style>
.aggregate {
}
</style>
