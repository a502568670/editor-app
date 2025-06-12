<template>
    <div class="flex h-full sub-mplist">
        <div class="w-[170px] bg-white flex flex-col">
            <div v-show="!(nameFilter||groupEdit)" class="m-2 flex">
                <el-button  :icon="Plus" @click="openDialog">添加关注</el-button>
                <el-tooltip content="搜索公众号">
                    <el-button size="small" @click="nameFilter=true,nameInput=''" :icon="Search" style="margin-left: 4px;" link></el-button>
                </el-tooltip>
                <el-tooltip content="分组管理">
                    <el-button size="small" @click="groupEdit=true,nameInput=''" :icon="Edit" style="margin-left: 4px;" link></el-button>
                </el-tooltip>
            </div>
            <div v-show="nameFilter" class="flex m-2 flex-wrap">
                <el-input class="flex-1 mr-2" v-model="nameInput"   placeholder="搜索公众号"/>
                <el-button size="small" @click="nameFilter=false" link>取消</el-button>
                <div style="flex-basis: 100%;"></div>
                <span class="m-2 text-xs" v-if="nameFilter&&filteredMplist.length===0">没有搜索结果</span>
            </div>
            <div v-show="groupEdit" class="flex m-2 flex-wrap">
                <el-button  :icon="Plus" @click="openGroup=true,editGroup=null,groupInput=''">添加分组</el-button>
                <el-button size="small" @click="groupEdit=false" link>取消</el-button>
            </div>
            <el-menu class="w-auto flex-1 hidden" @select="(index)=>params.mid=index" :default-active="initParams.mid">
                <el-menu-item v-if="!nameFilter" :index="initParams.mid">全部</el-menu-item>
                <el-menu-item class="word justify-between" v-for="v in filteredMplist" :index="v.mid" :key="v.mid">
                    <span class="flex-1 text-ellipsis overflow-hidden max-w-[120px]">{{ v.wx_name }}</span>
                    <!-- <el-tooltip :content="v.wx_name" placement="top">
                    </el-tooltip> -->
                    <el-popconfirm title="你是否要取消关注该公众号？" width="250" @confirm="onMPDel(v.mid)" teleported>
                        <template #reference>
                            <el-icon class="icon"><Delete/></el-icon>
                        </template>
                    </el-popconfirm>
                </el-menu-item>
            </el-menu>
            <el-collapse v-show="!(nameFilter||groupEdit)" class="w-auto flex-1 group overflow-y-scroll" v-model="params.group_id" @change="params.mid=-1" expand-icon-position="left" accordion >
                <el-collapse-item v-for="group in mpGroups" :title="`${group.name} (${group.count})`" :class="params.group_id==group.id&&'active'" :icon="CaretRight" :name="group.id" :key="group.id">
                    <template #title>
                        <span class="pl-[var(--el-menu-base-level-padding)] pr-2 text-ellipsis text-nowrap text-left overflow-hidden">{{ group.name }}</span>
                        <el-tag type="primary" effect="dark" size="small" round>{{ group.count }}</el-tag>
                    </template>
                    <el-menu class="w-auto flex-1" @select="(index)=>params.mid=index">
                        <el-menu-item class="word justify-between" v-for="v in group.account_list" :index="v.mid" :key="v.mid">
                            <img :src="v.avatar" class="size-[24px] rounded-[4px] mr-1">
                            <span class="flex-1 text-ellipsis overflow-hidden max-w-[120px]">{{ v.wx_name }}</span>
                            <!-- <el-tooltip :content="v.wx_name" placement="top">
                            </el-tooltip> -->
                            <el-popconfirm title="你是否要取消关注该公众号？" width="250" @confirm="onMPDel(v.mid)" teleported>
                                <template #reference>
                                    <el-icon class="icon"><Delete/></el-icon>
                                </template>
                            </el-popconfirm>
                        </el-menu-item>
                    </el-menu>
                </el-collapse-item>
            </el-collapse>
            <el-menu v-if="nameFilter" class="w-auto flex-1 overflow-y-scroll" @select="(index)=>params.mid=index">
                <el-menu-item class="word justify-between" v-for="v in filteredMplist" :index="v.mid" :key="v.mid">
                    <img :src="v.avatar" class="size-[24px] rounded-[4px] mr-1">
                    <span class="flex-1 text-ellipsis overflow-hidden max-w-[120px]">{{ v.wx_name }}</span>
                    <!-- <el-tooltip :content="v.wx_name" placement="top">
                    </el-tooltip> -->
                    <el-popconfirm title="你是否要取消关注该公众号？" width="250" @confirm="onMPDel(v.mid)" teleported>
                        <template #reference>
                            <el-icon class="icon"><Delete/></el-icon>
                        </template>
                    </el-popconfirm>
                </el-menu-item>
            </el-menu>
            <div v-if="groupEdit" class="w-auto flex-1 overflow-y-scroll">
                <div class="flex items-center px-2 my-2 text-sm" v-for="v in groups" :key="v.id">
                    <span class="flex-1 text-ellipsis text-nowrap overflow-hidden max-w-[120px]">{{ v.name }}</span>
                    <!-- <el-tooltip :content="v.name" placement="top">
                    </el-tooltip> -->
                    <template v-if="v.type===1">
                        <el-icon class="icon" @click="openGroup=true,editGroup=v,groupInput=v.name"><Edit/></el-icon>
                        <el-popconfirm title="你是否要删除该分组？" width="250" @confirm="onGroupDel(v.id)" teleported>
                            <template #reference>
                                <el-icon class="icon"><Delete/></el-icon>
                            </template>
                        </el-popconfirm>
                    </template>
                </div>
            </div>
        </div>
        <div class="flex-1 m-2 bg-white overflow-y-scroll">
            <div class="filters flex p-2 items-center">
                <el-select v-model="params.start_time" style="width: 150px;">
                    <el-option v-for="v in optDates" :key="v.value" :label="v.text" :value="v.value"></el-option>
                </el-select>
                <el-date-picker v-model="dateRange" style="width:250px;flex-grow: 0;margin-left: 4px;" type="daterange" range-separator="~" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD"></el-date-picker>
                <el-tooltip content="每6小时更新一次文章数据，相对质量值、阅读数、点赞数和在看数文章更新后3小时更新一次、8小时更新一次">
                    <el-button size="small" :icon="RefreshRight" :loading="loading" @click="getListBy(params)" style="margin: 0 4px 0 auto;" round>刷新</el-button>
                </el-tooltip>
                <el-input v-model="keyword" style="width: 200px;" placeholder="输入关键字搜索文章标题" :suffix-icon="Search" clearable></el-input>
            </div>
            <el-table :data="tableData" @sort-change="onSort" v-loading="loading" row-key="aid">
                <el-table-column prop="" label="标题" width="450">
                    <template #header>
                        <span class="mr-1">文章</span>
                        <el-divider direction="vertical"></el-divider>
                        <el-checkbox style="margin-right: 10px;" label="头条" size="small" @change="v=>params.is_top=+v"></el-checkbox>
                        <el-checkbox style="margin-right: 10px;" label="视频" size="small" @change="v=>params.is_video=+v"></el-checkbox>
                        <!-- <el-checkbox style="margin-right: 10px;" label="原创" size="small"></el-checkbox> -->
                    </template>
                    <template #default="v">
                        <div class="text-ellipsis text-nowrap overflow-hidden text-sm">
                            <el-tag v-if="v.row.original" class="mr-1" type="success" effect="dark" size="small">原创</el-tag>
                            <el-tag v-if="v.row.position===1" class="mr-1" type="danger" effect="dark" size="small">头条</el-tag>
                            <el-tag v-if="v.row.isvideo" class="mr-1" type="success" effect="dark" size="small">视频</el-tag>
                            <el-tooltip effect="dark" :content="v.row.title" placement="top">
                                <span class="text-base text-black font-bold align-middle" @click="openUrl(v.row.url)">{{ v.row.title }}</span>
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
                <el-table-column prop="" label="操作">
                    <template #default="v">
                        <el-tooltip effect="dark" content="相似文章" placement="top">
                            <el-button :icon="Memo" size="large"  link @click="showSim(v.row)"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <pagination class="flex-1 p-2" :total="total" @pagination="onPagination" :page="params.page" :limit="params.num" layout="total, prev, pager, next, jumper" />
        </div>
        <el-dialog v-model="open" title="添加关注的公众号" width="70vw">
            <div class="min-h-[50vh]">
                <el-input v-model="inputWord" placeholder="请输入公众号或文章链接" :suffix-icon="Search" clearable></el-input>
                <el-alert style="margin-top: 10px;" type="error" title="如未查到您想要的准确结果，公众号可能未收录，可通过输入文章链接自动收录后关注"></el-alert>
                <p v-if="loadingMp" class="my-2">正在加载数据...</p>
                <p v-else-if="inputWord&&mpAccounts.length===0" class="my-2">暂无数据</p>
                <el-row :gutter="20" v-loading="loadingMp">
                    <el-col :span="8" v-for="(v,idx) in mpAccounts" :key="v.mid">
                        <div class="mp-card">
                            <div class="head flex p-2">
                                <img :src="v.avatar" alt="" class="size-[40px] rounded-full mr-2">
                                <div class="flex-1 w-0"><span class="block text-ellipsis text-nowrap overflow-hidden text-black">{{ v.mp_name||v.wx_name }}</span><span class="text-xs">{{ v.wxid||'-' }}</span></div>
                            </div>
                            <p class="body px-2">{{ v.desc||'-' }}</p>
                            <div class="info flex text-center p-2">
                                <div class="flex-1"><span class="text-xs">预估粉丝</span><br>{{ v.fans }}</div>
                                <el-divider direction="vertical"></el-divider>
                                <div class="flex-1"><span class="text-xs">头条平均阅读</span><br>{{ 'avg_top_read' in v ?v.avg_top_read:v.top_avg_read }}</div>
                            </div>
                            <div v-if="!v.is_favorite" class="foot" @click="e=>onWillAddFav(e,v.mid,idx)" v-click-outside="onHide">+关注</div>
                            <div v-else class="foot added">已关注</div>
                        </div>
                    </el-col>
                </el-row>
                <pagination v-show="mpAccounts.length" class="flex-1 p-2 justify-center" :total="mpTotal" @pagination="onMpPagin" :page="mpParams.page" :limit="mpParams.num" layout="prev, pager, next" />
            </div>
        </el-dialog>
        <DialogSimilarPosts v-model="openSim" :sim="sim"></DialogSimilarPosts>
        <el-dialog v-model="openGroup" :title="`${editGroup?'编辑':'添加'}分组`">
            <el-input v-model.trim="groupInput" placeholder="请输入分组名称"></el-input>
            <template #footer>
                <el-button @click="openGroup=false">取消</el-button>
                <el-button type="primary" @click="onGroupConfirm">确认</el-button>
            </template>
        </el-dialog>
        <el-popover :virtual-ref="refGroupAdd" :visible="visible" virtual-triggering>
            <div class="p-2 -mx-[var(--el-popover-padding)] hover:bg-[var(--el-menu-hover-bg-color)]" v-for="v in groups" :key="v.id" @click="onAddFav(v.id)">
                {{ v.name }}
            </div>
        </el-popover>
    </div>
</template>
<script setup>
import {ref,watch,computed, onMounted, toRef} from 'vue'
import {Plus,Delete,Search,RefreshRight,Memo,Edit,CaretRight} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination'
import { addMpFavAccounts, delMpFavAccounts, getMpFavAccounts, getMpFavPosts, searchMpAccounts,openUrl, getMpSimilarPosts, getMpGroups, delMpGroup, editMpGroup, addMpGroup } from '@/api/posts'
import debounce from 'lodash-es/debounce'
import {ElMessage,ClickOutside as vClickOutside} from 'element-plus'
import DialogSimilarPosts from './components/DialogSimilarPosts.vue'

var optDates=[
    {text:'最近24小时',value:dayjs().subtract(1,'day').format('YYYY-MM-DD')},
    {text:'最近3天',value:dayjs().subtract(3,'day').format('YYYY-MM-DD')},
    {text:'最近7天',value:dayjs().subtract(7,'day').format('YYYY-MM-DD')},
    {text:'最近15天',value:dayjs().subtract(15,'day').format('YYYY-MM-DD')},
    {text:'最近30天',value:dayjs().subtract(30,'day').format('YYYY-MM-DD')},
]
var initParams={
    start_time:optDates[1].value,end_time:dayjs().format('YYYY-MM-DD'),
    page:1,num:10,group_id:0,mid:-1,keyword:'',sort_option:0,
    is_top:-1,is_video:-1,
}

var mplist=ref([])
var mpAccounts=ref([])
var mpParams=ref({
    kw:'',page:1,num:10,
})
var mpTotal=ref(0)
var loadingMp=ref(false)
watch(mpParams,async ()=>{
    if(!mpParams.value.kw){
        mpAccounts.value=[]
        return
    }
    loadingMp.value=true
    var res=await searchMpAccounts(mpParams.value)
    mpTotal.value=res.total
    mpAccounts.value=res.accounts
    loadingMp.value=false
},{deep:true})
var inputWord=ref('')
watch(inputWord,debounce(()=>mpParams.value.kw=inputWord.value,300))
var mpGroups=ref([])
onMounted(async ()=>{
    // var data=await getMpFavAccounts()
    // mplist.value=data.account
    var data=await getMpGroups()
    mpGroups.value=data
    await getListBy(initParams)
    
})
var nameFilter=ref(false)
var nameInput=ref('')
var filteredMplist=computed(() => {
    if(!mpGroups.value.length)return []
    if(nameFilter.value){
        return mpGroups.value[0].account_list.filter(v=>v.wx_name.indexOf(nameInput.value)>-1)
    }
    return mpGroups.value[0].account_list
})
var groupEdit=ref(false)
var groups=computed(()=>mpGroups.value.filter(v=>v.id!==0).map(({id,name,type})=>({id,name,type})))
async function onGroupDel(group_id) {
    await delMpGroup({group_id})
    mpGroups.value=mpGroups.value.filter(v=>v.id!==group_id)
}
var open=ref(false)
var params=ref({...initParams})
var loading=ref(false)
watch(params,async ()=>{
    // fix 手风琴关闭为空
    if(typeof params.value.group_id === 'string') return
    getListBy(params.value)
    
},{deep:true})
async function getListBy(query) {
    loading.value=true
    var res=await getMpFavPosts(query)
    tableData.value=res.items
    total.value=res.article_count
    loading.value=false
}
var total=ref(0)
var keyword=ref('')
watch(keyword,debounce(()=>params.value.keyword=keyword.value,300))
var tableData=ref([])
var dateRange=ref([])
watch(dateRange,()=>{
    if(dateRange.value){
        // getListBy({...params.value,start_time:dateRange.value[0],end_time:dateRange.value[1]})
        params.value.start_time=dateRange.value[0]
        params.value.end_time=dateRange.value[1]
    }    
})
function openDialog(){
    open.value=true
    inputWord.value=''
}
async function onMPDel(mid){
    await delMpFavAccounts({mid});
    // mplist.value=mplist.value.filter(i=>i.mid!==mid)
    mpGroups.value.forEach(v=>{
        var idx=v.account_list.findIndex(i=>i.mid==mid)
        if(idx>-1){
            v.account_list.splice(idx,1)
            v.count--
        }
    })
}
function onPagination(query){
    params.value.page=query.page
}
function onMpPagin(query){
    mpParams.value.page=query.page
}
var sortProps={
    defa:0,read:1,zan:2,looking:3,relative_quality:4,
}
function onSort(col){
    params.value.sort_option=sortProps[col.prop]    
}
var visible=ref(false)
var willAddArgs=[];
var refGroupAdd=ref()
async function onWillAddFav(e,...args){
    willAddArgs=args
    refGroupAdd.value=e.currentTarget;
    visible.value=true
}
function onHide(){
    visible.value=false
}
async function onAddFav(group_id) {
    var [mids,idx]=willAddArgs
    await addMpFavAccounts({mids,group_id})
    ElMessage({type:'success',message:'添加成功'})
    var {mp_name:wx_name,...obj}=mpAccounts.value[idx];
    var newAccount={wx_name,...obj}
    mpAccounts.value[idx].is_favorite=1
    // mplist.value.push({...obj,wx_name:mp_name})
    mpGroups.value[0].count++
    mpGroups.value[0].account_list.unshift(newAccount)
    var g=mpGroups.value.find(v=>v.id===group_id)
    g.count++
    g.account_list.unshift(newAccount)
    onHide()
}
var openSim=ref(false)
var sim=ref({})
async function showSim(data) {
    sim.value=data;
    openSim.value=true
}
var openGroup=ref(false)
var editGroup=ref(null)
var groupInput=ref('');
async function onGroupConfirm() {
    // 编辑分组
    if(editGroup.value&&groupInput.value){
        await editMpGroup({group_id:editGroup.value.id,name:groupInput.value})
        openGroup.value=false
        mpGroups.value.find(v=>v.id===editGroup.value.id).name=groupInput.value
        return
    }
    // 新建
    var res=await addMpGroup({name:groupInput.value})
    if(res.length===0){
        ElMessage({type:'error',message:'分组名已存在'})
        return;
    }
    openGroup.value=false
    var newGroup=res.find(v=>v.name===groupInput.value)
    mpGroups.value.splice(1,0,{...newGroup,count:0,account_list:[]})
}
</script>
<style>
.sub-mplist{
    .word:not(:hover) .icon {
        visibility: hidden;
    }
    .word .icon {
        position: relative;
        left: 10px;
    }
    .mp-card{
        margin-top: 20px;
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        .body{
            display: block;
            line-height: 1.5em;
            height: 3em;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .info{
            background-color: #eee;
        }
        .foot{
            padding: 4px;
            background-color: var(--el-color-primary);
            color: #fff;
            text-align: center;
            &.added{
                color: inherit;
                background-color: #ddd;
            }
        }
    }
    .group .el-collapse-item{
        --el-collapse-header-height: 36px;
        &.active, &.is-active{
            --el-collapse-header-bg-color: var(--el-menu-hover-bg-color);
        }
    }
}
</style>