<template>
    <el-dialog v-model="open" :title="`相似文章(公众号：${sim.wx_name})`" width="70vw">
        <div class="min-h-[50vh]">
            <div class="flex mb-2">
                <img :src="sim.avatar" class="w-[100px] h-[72px] object-cover rounded-[4px]" alt="">
                <div class="flex-1 ml-4">
                    <p class="text-black text-base font-bold ">{{ sim.title }}</p>
                    <div class="flex text-sm mt-2">
                        <div class="mr-4">阅读数：<br>{{ sim.read??sim.read_num }}</div>
                        <div class="mr-4">在看数：<br>{{ sim.looking??sim.look_num }}</div>
                        <div class="mr-4">发布时间：<br>{{ sim.pub_time||sim.publish_time }}</div>
                        <div class="mr-4" v-if="sim.update_time">更新时间：<br>{{ sim.update_time }}</div>
                    </div>
                </div>
            </div>
            <el-table :data="simPosts" v-loading="loadingSim" class="w-full">
                <el-table-column prop="" label="文章" width="250">
                    <template #default="v">
                        <div class="text-ellipsis text-nowrap overflow-hidden text-sm">
                            <el-tag v-if="v.row.original" class="mr-1" type="success" effect="dark" size="small">原创</el-tag>
                            <el-tag v-if="v.row.isvideo" class="mr-1" type="success" effect="dark" size="small">视频</el-tag>
                            <el-tag v-if="v.row.position===1" class="mr-1" type="danger" effect="dark" size="small">头条</el-tag>
                            <el-tooltip effect="dark" :content="v.row.title" placement="top">
                                <span class="text-base text-black font-bold align-middle" @click="openUrl(v.row.url)">{{ v.row.title }}</span>
                            </el-tooltip>
                        </div>
                        <div class="text-sm mt-1">
                            <time datetime="">{{ v.row.pub_time }}</time>
                            <span class="ml-1">{{ v.row.mp_name }}</span>
                        </div>
                    </template>
                </el-table-column>
                <!-- <el-table-column prop="" label="封面">
                    <template #default="v">
                        <img :src="v.row.avatar" alt="" class="size-[48px] rounded-[4px]">
                    </template>
                </el-table-column> -->
                <el-table-column prop="relative_quality" label="相对质量值" min-width="120" />
                <el-table-column prop="read" label="阅读数" min-width="100" />
                <el-table-column prop="zan" label="点赞数" min-width="100" />
                <el-table-column prop="looking" label="在看数" min-width="100" />
            </el-table>
        </div>
    </el-dialog>
</template>
<script setup>
import {ref,watchEffect} from 'vue'
import { getMpSimilarPosts } from '@/api/posts'

var {sim}=defineProps(['sim'])
var open = defineModel()
var loadingSim=ref(false)
var simPosts=ref([])

watchEffect(async ()=>{
    if(!sim.aid)return
    loadingSim.value=true
    var res=await getMpSimilarPosts({aid:sim.aid,mid:sim.mid})
    simPosts.value=res.similar_article
    loadingSim.value=false
})

</script>
