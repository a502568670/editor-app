<template>
    <el-row class="h-full posts">
        <el-col :span="3" class="h-full overflow-y-scroll">
            <el-menu :default-active="categories[0][0]+''">
                <el-menu-item-group title="类别">
                    <el-menu-item v-for="v in categories" :index="v[0]+''" :key="v[0]+''" @click="params.category=v[0]">{{ v[1] }}</el-menu-item>
                </el-menu-item-group>
            </el-menu>
        </el-col>
        <el-col :span="21" class="h-full overflow-y-scroll p-2" style="display: flex;flex-direction: column;">
            <div class="filters bg-white flex p-2 items-center">
                <!-- <el-date-picker type="daterange" start-placeholder="开始时间" end-placeholder="结束时间" v-model="dateRange"></el-date-picker> -->
                <el-date-picker v-model="params.end_time" :shortcuts="shortcuts" placeholder="请选择日期"></el-date-picker>
                <el-divider direction="vertical"></el-divider>
                <el-radio-group v-model="params.is_original">
                    <el-radio :value="1" size="small">原创</el-radio>
                    <el-radio :value="0" size="small">非原创</el-radio>
                    <el-radio :value="-1" size="small">全部</el-radio>
                </el-radio-group>
                <el-input style="width: 180px;margin-left: auto;" v-model="key_words" :suffix-icon="Search" placeholder="输入关键字搜索文章标题" clearable></el-input>
                <Hydrate/>
            </div>
            <el-table v-loading="loading" :data="tableData" class="posts w-full overflow-scroll">
                <el-table-column prop="title" label="文章" width="450">
                    <template #header>
                        <span class="mr-1">文章</span>
                        <el-divider direction="vertical"></el-divider>
                        <el-radio-group v-model="params.pub_type">
                            <el-radio style="margin-right: 4px;" v-for="v in pubTypes" :key="v[0]+''" :value="v[0]" size="small">{{ v[1] }}</el-radio>
                        </el-radio-group>
                    </template>
                    <template #default="v">
                        <div class="text-ellipsis text-nowrap overflow-hidden text-sm">
                            <el-tag v-if="v.row.is_original=='原创'" class="mr-1" type="danger" effect="dark" size="small">原创</el-tag>
                            <el-tag class="mr-1" type="success" effect="dark" size="small">{{ v.row.publish_type }}</el-tag>
                            <el-tooltip effect="dark" :content="v.row.title" placement="top">
                                <span class="text-base text-black font-bold align-middle" @click="openUrl(v.row.url)">{{ v.row.title }}</span>
                            </el-tooltip>
                        </div>
                        <div class="text-sm mt-1">
                            <time datetime="">{{ v.row.pub_time }}</time>
                            <span class="ml-1">{{ v.row.mp_nickname }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="cover" label="封面" width="72">
                    <template #default="v">
                        <img :src="v.row.cover" alt="" class="size-[48px] rounded-[4px]">
                    </template>
                </el-table-column>
                <el-table-column prop="hot" label="爆值" :formatter="hotFormatter" min-width="120">
                    <template #header>
                        <el-tooltip content="爆文值（10倍及以上）=爆文阅读量/前7天头条阅读量平均值">
                            <el-icon style="position: relative;top: 2px;right: 2px;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                        <span class="thead" :class="params.mode===1&&'active'" @click="params.mode=1">爆值</span>
                    </template>
                    <template #default="v">
                        <el-tag type="danger" effect="light" round><ICFire class="icon" /> {{ hotFormatter(0,0,v.row.hot) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="read_num" label="阅读数" width="90">
                    <template #header>
                        <span class="thead" :class="params.mode===2&&'active'" @click="params.mode=2">阅读数</span>
                    </template>
                </el-table-column>
                <el-table-column prop="zan_num" label="点赞数" />
                <el-table-column prop="fans" label="预估粉丝数" width="100" />
                <el-table-column label="操作">
                    <template #default="v">
                        <el-tooltip effect="dark" content="添加到素材合成器" placement="top">
                            <el-button :icon="FolderAdd" @click="hydrateStore.add(v.row)" size="large" link></el-button>
                        </el-tooltip>
                        <el-tooltip effect="dark" content="复制链接" placement="top">
                            <el-button :icon="CopyDocument" @click="copyLink(v.row.url)" size="large" link></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <pagination class="flex-1 p-2" :total="total" @pagination="onPagination" :page="params.page" :limit="params.limit" layout="total, prev, pager, next, jumper" />
        </el-col>
    </el-row>
</template>
<style>
.icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    vertical-align: text-bottom;
}
.posts .thead::after{
    content: '';
    display: inline-block;
    border: 6px solid transparent;
    border-top-color: #333;
    vertical-align: middle;
    position: relative;
    top: 2px;
    margin-left: 4px;
}
.posts .thead.active::after {
    border-top-color: var(--el-color-primary);
}
.posts .el-radio {
    margin-right: 6px;
}
</style>
<script setup>
import {ref,onMounted,watch, onActivated, nextTick} from 'vue'
import {StarFilled,Search,QuestionFilled,FolderAdd, CopyDocument} from '@element-plus/icons-vue'
import dayjs from 'dayjs';
import debounce from 'lodash/debounce'
import { getDetailPosts } from '@/api/posts';
import Pagination from '@/components/Pagination'
import ICFire from './ICFire.vue';
import Hydrate from '@/components/Hydrate.vue';
import { useHydrateStore } from '@/store/piniaStore';
import { ElMessage } from 'element-plus';
import { copyLink } from '@/utils';

var hydrateStore = useHydrateStore();
var categories=[
    [-1,'总榜'],
    [1,'国际'],
    [2,'体育'],
    [3,'娱乐'],
    [4,'社会'],
    [5,'财经'],
    [6,'时事'],
    [7,'科技'],
    [8,'情感'],
    [9,'汽车'],
    [10,'教育'],
    [11,'时尚'],
    [12,'游戏'],
    [13,'军事'],
    [14,'旅游'],
    [15,'美食'],
    [16,'文化'],
    [17,'健康养生'],
    [18,'搞笑'],
    [19,'家居'],
    [20,'动漫'],
    [21,'宠物'],
    [22,'母婴育儿'],
    [23,'星座运势'],
    [24,'历史'],
    [25,'音乐'],
    [28,'职场'],
    [29,'三农'],
    [30,'养老'],
    [27,'综合'],
];
var pubTypes=[
    [0,'图文'],
    [5,'纯视频'],
    [7,'纯音乐'],
    [8,'纯图片'],
    [10,'纯文字'],
    [11,'转载文章'],
];
var initParams={
    mode:1,is_original:-1,pub_type:0,category:categories[0][0],
    page:1,limit:50,key_words:'',
    end_time:undefined,
}
var params=ref(initParams);
var key_words=ref('');
var shortcuts=[
    {text:dayjs().subtract(1,'day').format('MM-DD'),value:dayjs().subtract(1,'day')},
    {text:dayjs().subtract(2,'day').format('MM-DD'),value:dayjs().subtract(2,'day')},
    {text:dayjs().subtract(3,'day').format('MM-DD'),value:dayjs().subtract(3,'day')},
];
var dateRange=ref([params.value.start_time,params.value.end_time])
var total=ref(0);
var tableData=ref([]);
var loading=ref(true);
onMounted(async () => {
    await getListBy()

})
watch(params,async () => {
    await getListBy()
    
},{deep:true})
watch(key_words,debounce(()=>{
    // console.log(key_words.value);
    params.value.key_words=key_words.value;
},250))
async function getListBy() {
    loading.value=true
    var res = await getDetailPosts({...params.value});
    total.value=res.total
    tableData.value=res.mp_articles_list;
    loading.value=false;
}
function onPagination(query){
    params.value.page=query.page;
}
function openUrl(url){
    window.ipcRenderer.send('toMain',{tag:'gotoExternal',content:{url}})
}
function hotFormatter(row,col,v,i){
    return `${Math.round(v*100)}%`;
}
function resetFilters(){
    params.value=initParams
}
</script>
