<template>
    <div class="flex h-full sub-keywords">
        <div class="w-auto bg-white flex flex-col">
            <el-button class="m-2" :icon="Plus" @click="openDialog">添加关键词</el-button>
            <el-menu class="w-auto flex-1" @select="index => params.user_keyword = index" :default-active="words[0]">
                <el-menu-item class="word justify-between" v-for="(v, idx) in words" :key="idx" :index="v">
                    <el-tooltip :content="v" placement="top">
                        <span class="flex-1 text-ellipsis overflow-hidden max-w-[80px]">{{ v }}</span>
                    </el-tooltip>
                    <el-popconfirm title="你是否要删除该关键词？" width="200" @confirm="onWordDel(v)">
                        <template #reference>
                            <el-icon class="icon">
                                <Delete />
                            </el-icon>
                        </template>
                    </el-popconfirm>
                </el-menu-item>
            </el-menu>
        </div>
        <div class="flex-1 m-2 bg-white w-[0] flex flex-col">
            <div class="filters flex p-2">
                <el-select v-model="params.start_time" style="width: 150px;">
                    <el-option v-for="v in optDates" :key="v.text" :label="v.text" :value="v.value"></el-option>
                </el-select>
                <el-input v-model="keyword" style="width: 200px;margin-left: auto;" placeholder="输入关键字搜索文章标题"
                    :suffix-icon="Search" clearable></el-input>
                <Hydrate/>
            </div>
            <el-table :data="tableData" @sort-change="onSort" class="w-full" v-loading="loading" row-key="aid">
                <el-table-column prop="" label="标题" width="450">
                    <template #header>
                        <span class="mr-1">文章</span>
                        <el-divider direction="vertical"></el-divider>
                        <el-checkbox style="margin-right: 10px;" label="头条" size="small"
                            @change="v => params.is_top = +v"></el-checkbox>
                        <el-checkbox style="margin-right: 10px;" label="视频" size="small"
                            @change="v => params.is_video = +v"></el-checkbox>
                        <!-- <el-checkbox style="margin-right: 10px;" label="原创" size="small"></el-checkbox> -->
                    </template>
                    <template #default="v">
                        <div class="text-ellipsis text-nowrap overflow-hidden text-sm">
                            <el-tag v-if="v.row.original" class="mr-1" type="success" effect="dark"
                                size="small">原创</el-tag>
                            <el-tag v-if="v.row.position === 1" class="mr-1" type="danger" effect="dark"
                                size="small">头条</el-tag>
                            <el-tag v-if="v.row.isvideo" class="mr-1" type="success" effect="dark"
                                size="small">视频</el-tag>
                            <el-tooltip effect="dark" :content="v.row.title" placement="top">
                                <span class="text-base text-black font-bold align-middle" @click="openUrl(v.row.url)">{{
                                    v.row.title }}</span>
                            </el-tooltip>
                        </div>
                        <div class="text-sm mt-1">
                            <time datetime="">{{ v.row.pub_time }}</time>
                            <span class="ml-1">{{ v.row.wx_name }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="" label="封面">
                    <template #default="v">
                        <img :src="v.row.avatar" alt="" class="size-[48px] rounded-[4px]">
                    </template>
                </el-table-column>
                <el-table-column prop="relative_quality" label="相对质量值" sortable="custom" width="120" />
                <el-table-column prop="read" label="阅读数" width="100" sortable="custom" />
                <el-table-column prop="zan" label="点赞数" width="100" sortable="custom" />
                <el-table-column prop="looking" label="在看数" width="100" sortable="custom" />
                <el-table-column prop="" label="操作" width="120">
                    <template #default="v">
                        <el-tooltip effect="dark" content="添加到素材合成器" placement="top">
                            <el-button :icon="FolderAdd" size="large" link @click="hydrateStore.add(v.row)"></el-button>
                        </el-tooltip>
                        <el-tooltip effect="dark" content="相似文章" placement="top">
                            <el-button :icon="Memo" size="large" link @click="showSim(v.row)"></el-button>
                        </el-tooltip>
                        <el-tooltip effect="dark" content="复制链接" placement="top">
                            <el-button :icon="CopyDocument" @click="copyLink(v.row.url)" size="large" link></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <pagination class="flex-1 p-2" :total="total" @pagination="onPagination" :page="params.page"
                :limit="params.num" layout="total, prev, pager, next, jumper" />
        </div>
        <el-dialog v-model="open" title="添加关键词">
            <el-input v-model="inputWord" placeholder="请输入关键词"></el-input>
            <template #footer>
                <el-button @click="open = false">取消</el-button>
                <el-button type="primary" @click="onConfirm">确认</el-button>
            </template>
        </el-dialog>
        <DialogSimilarPosts v-model="openSim" :sim="sim"></DialogSimilarPosts>
    </div>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue'
import { Plus, Delete, Search, Memo, FolderAdd, CopyDocument } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination'
import { addUserKeyword, delUserKeyword, getUserKeyPosts, getUserKeywords, openUrl } from '@/api/posts'
import { ElMessage } from 'element-plus'
import debounce from 'lodash-es/debounce'
import DialogSimilarPosts from './components/DialogSimilarPosts.vue'
import Hydrate from '@/components/Hydrate.vue'
import { useHydrateStore } from '@/store/piniaStore'
import {copyLink} from '@/utils'

var hydrateStore = useHydrateStore()

var words = ref([])
onMounted(async () => {
    words.value = await getUserKeywords()
    if (words.value.length) {
        params.value.user_keyword = words.value[0]
    }
})
var open = ref(false)
var inputWord = ref('')
var optDates = [
    { text: '最近24小时', value: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
    { text: '最近3天', value: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
    { text: '最近7天', value: dayjs().subtract(7, 'day').format('YYYY-MM-DD') },
    { text: '最近15天', value: dayjs().subtract(15, 'day').format('YYYY-MM-DD') },
    { text: '最近30天', value: dayjs().subtract(30, 'day').format('YYYY-MM-DD') },
]
var initParams = {
    start_time: optDates[1].value, end_time: dayjs().format('YYYY-MM-DD'),
    page: 1, num: 10, keyword: '', sort_option: 0,
    is_top: -1, is_video: -1, user_keyword: '',
}
var params = ref({ ...initParams })
var loading = ref(false)
watch(params, async () => {
    // console.log(params.value);
    getListBy()
}, { deep: true })
async function getListBy() {
    loading.value = true
    var res = await getUserKeyPosts(params.value)
    tableData.value = res.items
    total.value = res.count
    loading.value = false
}

var total = ref(0)
var keyword = ref('')
watch(keyword, debounce(() => params.value.keyword = keyword.value, 300))
var tableData = ref([])
function openDialog() {
    open.value = true
    inputWord.value = ''
}
async function onConfirm() {
    open.value = false
    var val = inputWord.value.trim()
    if (val) {
        await addUserKeyword(val)
        ElMessage({ type: 'success', message: '添加成功' })
        words.value.push(val)
    }
}
async function onWordDel(v) {
    await delUserKeyword(v);
    ElMessage({ type: 'success', message: '删除成功' })
    words.value = words.value.filter(i => i !== v)
}
function onPagination(query) {
    params.value.page = query.page
}
var sortProps = {
    defa: 0, read: 1, zan: 2, looking: 3, relative_quality: 4,
}
function onSort(col) {
    params.value.sort_option = sortProps[col.prop]
}
var openSim = ref(false)
var sim = ref({})
function showSim(data) {
    openSim.value = true
    sim.value = data
}
</script>
<style>
.sub-keywords .word:not(:hover) .icon {
    visibility: hidden;
}

.sub-keywords .word .icon {
    position: relative;
    left: 20px;
}
</style>