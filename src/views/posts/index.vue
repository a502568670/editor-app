<template>
    <div class="bg-[#e9f9f1] min-h-full">
        <el-tabs type="border-card" @tab-click="handleTabClick" class="min-h-full">
            <el-tab-pane v-for="(category, i) in tabPaneList" :name="category === '综合' ? 1:i+2" :key="category" :label="category" class="flex flex-wrap">
                <el-col class="item" v-for="(v,idx) in textdata" :key="v.title" :span="8">
                    <div class="item-border">
                        <el-tooltip effect="dark" :content="v.title" placement="top">
                            <div class="content" @click="openUrl(v.url)">
                                <p class="text-ellipsis text-nowrap overflow-hidden mr-8">{{ v.title }}</p>
                                <p class="text-xs mt-3">发布时间：{{ v.pub_time }}</p>
                            </div>
                        </el-tooltip>
                        <div class="flex mt-3 text-[#909399] text-xs place-items-center">
                            <div class="flex-1 flex w-0 place-items-center mr-2" @click="openUrl(`https://dajiala.com/main/detail?mid=${v.mid}&active=0`)">
                                <img :src="v.avatar" alt="" class="size-[25px] rounded-full mr-1">
                                <span class="flex-1 w-0 text-ellipsis text-nowrap overflow-hidden">{{ v.wx_name }}</span>
                            </div>
                            <span class="mr-2">阅读数：{{ v.read_num }}</span>
                            <span class="mr-2">爆值：{{ v.hot_num }}</span>
                            <span>{{ v.industry2 }}</span>
                        </div>
                    </div>
                </el-col>
            </el-tab-pane>
        </el-tabs>

    </div>
</template>
<style scoped>
.item {
    padding: 16px 10px;
    border-bottom: 1px solid var(--el-border-color);
}
.item:not(:nth-of-type(3n+1)) .item-border {
    padding-left: 15px;
    border-left: 1px solid var(--el-border-color);
}
</style>
<script setup>
import {ref,onMounted,watch} from 'vue';
import { getPosts } from '@/api/posts';
var tabPaneList = [
    "国际",
    "体育",
    "娱乐",
    "社会",
    "财经",
    "时事",
    "科技",
    "情感",
    "汽车",
    "教育",
    "时尚",
    "游戏",
    "军事",
    "旅游",
    "美食",
    "文化",
    "健康养生",
    "搞笑",
    "家居",
    "动漫",
    "宠物",
    "母婴育儿",
    "星座运势",
    "历史",
    "音乐",
    "职场",
    // "三农",
    // "养老",
    "综合",
];
var loading=ref(true);
var textdata=ref([]);
var params=ref({
    industry:26,home:1,page:1,
    num:6,topType:2,
});
onMounted(async ()=>{
    var res = await getPosts(params.value);
    textdata.value=res.data.slice(0,15);

    // await getList();
})
async function handleTabClick(tab) {
    // console.log(tab.props.name);
    params.value.topType=tab.props.name;
    await getList()
}
async function getList() {
    loading.value=true;
    var res = await getPosts(params.value);
    textdata.value=res.data.slice(0,15);
    loading.value=false;
    console.log(111,textdata.value);
    
}
</script>
