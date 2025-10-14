<template>
<div class="filepage h-full flex">
  <AccountList
    ref="AccountListRef"
    :selectId="selectIdx"
    :showAdd="false"
    :showDel="false"
    @clickAccountTrigger="handleAccountSelect"
  />
  <div class="flex-1 w-0 bg-white flex flex-col">
    <el-menu v-model="actMenu" default-active="img" mode="horizontal" @select="getList">
      <el-menu-item index="img">图片</el-menu-item>
      <el-menu-item index="vid">视频</el-menu-item>
    </el-menu>
    <template v-if="actMenu==='img'">
      <div class="m-4 flex items-center">
        <span class="text-xl">图片 (共{{ total }}条)</span>
        <el-upload class="ml-auto" accept="image/bmp, image/png, image/jpeg, image/jpg, image/gif, image/webp" multiple :http-request="onUpload" :show-file-list="false">
          <el-button :disabled="loading" type="primary" style="width: 100px;margin-left: 20px;">上传</el-button>
          <template #tip>
            <span class="el-upload__tip float-left">大小不超过10M</span>
          </template>
        </el-upload>
      </div>
      <div class="m-4 flex items-center">
        <span class="mr-2">分组：</span>
        <el-radio-group v-model="query.group_id">
          <el-radio-button v-for="v in groups" :key="v.id" :label="v.name+` (${v.count})`" :value="v.id"></el-radio-button>
        </el-radio-group>
      </div>
      <div class="alert flex items-center m-2 p-2 text-sm" v-if="checked.length">
        <el-checkbox label="全选" @change="b=>imgs.forEach(v=>v.checked=b)"></el-checkbox>
        <span class="mx-2">已有 {{ checked.length }} 张图片被选中</span>
        <el-button class="mr-auto" @click="imgs.forEach(v=>v.checked=false)" type="primary" link>取消全选</el-button>
        <el-tooltip content="前往发布">
          <el-button :icon="SetUp" @click="onPublish(-1)" text plain></el-button>
        </el-tooltip>
        <el-tooltip content="删除">
          <el-button :icon="Delete" :disabled="loading" @click="onDelete(-1)" text plain></el-button>
        </el-tooltip>
      </div>
      <div class="flex-1 overflow-y-auto m-2" v-loading="loading">
        <div class="grid grid-cols-6 px-2 gap-4 img-list" v-if="imgs.length">
          <div class="text-center relative group" style="margin: 0 calc(50% - 5vw);" v-for="(v,idx) in imgs" :key="v.file_id">
            <div class="absolute left-0 w-full top-0 z-[1] flex items-center invisible  group-hover:visible" :style="{visibility:imgs[idx].checked?'visible':undefined}">
              <el-checkbox v-model="imgs[idx].checked" class="origin-left scale-[1.75]"></el-checkbox>
              <div class="ml-auto invisible  group-hover:visible">
                <el-button @click="previewIdx=idx,imgPreviewer=true" title="预览" :icon="Fullscreen" circle></el-button>
                <el-dropdown :teleported="false">
                  <el-button :icon="Ellipsis" circle></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="false" @click="actEditnameIdx=idx">重命名</el-dropdown-item>
                      <el-dropdown-item @click="onPublish(idx)">前往发布</el-dropdown-item>
                      <el-dropdown-item @click="onDelete(idx)">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <el-image :src="v.cdn_url" @click="imgs[idx].checked=!imgs[idx].checked" class="item size-[10vw]" :class="{active:imgs[idx].checked}" fit="contain"></el-image>
            <el-input v-model="imgs[idx].name" ref="refEdit" v-if="false&&actEditnameIdx===idx" size="small" @change="onImgName"></el-input>
            <div class="px-4 truncate name" @click="actEditnameIdx=idx" v-else>{{ v.name }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无图片素材"></el-empty>
        <pagination class="m-4" :limit="query.limit" :total="total" :page="query.page" layout="total, prev, pager, next, jumper" @pagination="onPagination"/>
      </div>
    </template>
    <template v-else-if="actMenu==='vid'">
      <div class="m-4 flex items-center">
        <div class="text-xl mr-auto">{{ word||'视频' }} (共{{ totalVid }}条)</div>
        <el-popconfirm @confirm="onVidDel()" title="删除该视频后将无法恢复，所有使用该视频的网页中对应的视频都会被删除。" width="300">
          <template #reference>
            <el-button v-show="selectRows.length" class="mr-2" type="danger" :loading="leftVidDel>0">
              <span class="mr-1" v-if="leftVidDel>0&&selectRows.length>1">{{ selectRows.length-leftVidDel }}/{{selectRows.length}}</span>
              批量删除
            </el-button>
          </template>
        </el-popconfirm>
        <el-input v-model="word" style="width:180px" placeholder="搜索视频" @change="query.page=1,getList()" :suffix-icon="Search" clearable></el-input>
      </div>
      <el-table ref="refTable" class="flex-1" v-loading="loading" :data="videos" row-key="app_id" @selection-change="onTableSelect">
        <el-table-column type="selection" align="right" :selectable="selectable" width="50"></el-table-column>
        <el-table-column label="名称" min-width="450">
          <template #default="v">
            <div class="flex items-center relative">
              <el-image :src="v.row.img_url" class="w-[160px] h-[90px] mr-4" fit="cover" @click="onVidPreview(v.row)"></el-image>
              <div class="line-clamp-3 title" v-html="v.row.title"></div>
              <span class="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 rounded-full px-1 text-xs flex items-center">
                <el-icon><CaretRight /></el-icon>
                {{ v.row.multi_item[0].duration }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="v">{{ v.row.is_illegal?'审核未通过':'已通过' }}</template>
        </el-table-column>
        <el-table-column prop="update_time" label="更新时间" min-width="150" :formatter="formatDate"></el-table-column>
        <el-table-column label="操作">
          <template #default="v">
            <el-popconfirm @confirm="onVidDel(v.row)" title="删除该视频后将无法恢复，所有使用该视频的网页中对应的视频都会被删除。" width="300">
              <template #reference>
                <div>
                  <el-tooltip effect="dark" content="删除视频" placement="top">
                    <el-icon><Delete/></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <pagination class="p-2" :limit="query.limit" :total="totalVid" :page="query.page" layout="total, prev, pager, next, jumper" @pagination="onPagination"/>
    </template>
  </div>
  <el-image-viewer v-if="imgPreviewer" :initial-index="previewIdx" :url-list="previewImgs" show-progress @close="imgPreviewer=false" teleported></el-image-viewer>
  <dialog class="backdrop:bg-black backdrop:bg-opacity-50 overflow-visible" ref="refDialog" @click="refDialog.close()" >
    <div class="w-[1200px] h-[675px]" @click.stop>
      <video :src="previewVid?.multi_item[0].content_url" :poster="previewVid?.multi_item[0].cover" class="w-full h-full" controls></video>
    </div>
    <el-icon class="absolute right-[20px] top-[20px] bg-black bg-opacity-50 cursor-pointer z-10" size="30" color="#fff"><Close/></el-icon>
  </dialog>
</div>
</template>
<script setup>
import {computed, nextTick, onActivated, ref, shallowRef, toRaw, useTemplateRef, watch, watchEffect} from 'vue'
import AccountNav from "@/components/AccountNav"
import { dog, fileToBase64 } from '@/utils'
import pagination from '@/components/Pagination'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import { apperrmsg } from '@/utils/constants'
import debounce from 'lodash-es/debounce'
import {Fullscreen,Ellipsis} from 'lucide-vue-next'
import { CaretRight, Close, Delete, Search, SetUp } from '@element-plus/icons-vue'
import { uploadImage } from '@/api/img'
import { useAotPickerStore } from '@/store/piniaStore'
import { useRouter } from 'vue-router'
import { serializeCookie } from '@/utils/cookie'
import AccountList from '@/components/accountList.vue'

const AccountListRef = ref()

var refTable=useTemplateRef('refTable')
var refDialog=useTemplateRef('refDialog')
var selectRows=shallowRef([])
function onTableSelect(rows) {
  selectRows.value=rows
  dog('table select',rows)
}
function selectable(row, index) {
  return true;
}
var actMenu=ref('img')
var selectIdx=ref()
var account=shallowRef({})
function handleAccountSelect(data){
  account.value = data
  selectIdx.value = data.id
  getList()
}
var query=ref({group_id:0,page:1,limit:12})
watch(query,()=>getList(),{deep:true})
var imgs=ref([])
var checked=computed(()=>imgs.value.filter(v=>v.checked))
var imgPreviewer=ref(false)
var previewIdx=ref(0)
var previewImgs=computed(()=>{
  return imgs.value.map(v=>v.cdn_url)
})
var total=computed(()=>groups.value.find(v=>v.id===query.value.group_id)?.count||0)
var totalVid=ref(0)
var videos=shallowRef([])
var word=ref('')
var previewVid=shallowRef(null)
onActivated(()=>{
  AccountListRef.value.getList()
})
var loading=ref(false)
var groups=shallowRef([])
async function getList(index){
  actEditnameIdx.value=-1
  loading.value=true
  if(index){
    actMenu.value=index
    query.value.page=1
  }
  try {
    if(actMenu.value==='img'){
      word.value=''
      var res=await window.webBridge.callRpc('wxListImages',{account:toRaw(account.value),...query.value})
      if(!res?.success){
        ElMessage.error(apperrmsg.invalid_session)
        throw new Error(res.err_msg)
      }
      var {file_cnt:{img_cnt},file_group_list:{file_group},file_item}=res.page_info
      imgs.value=file_item
      groups.value=file_group
      dog('list images',res)
    }else if(actMenu.value==='vid'){
      var cookies=serializeCookie(JSON.parse(account.value.session_id)["cookie"])
      var token= +account.value.token;
      var begin=(query.value.page-1)*query.value.limit
      var count=query.value.limit
      var res=await window.webBridge.callRpc('wxListVideos',{cookies,token,begin,count,query:word.value})
      var {file_cnt:{video_msg_cnt},item,search_cnt}=res.page_info
      selectRows.value=[]
      refTable.value.clearSelection()
      totalVid.value=word.value?search_cnt:video_msg_cnt
      videos.value=item
      dog('list videos',res)
    }
  } catch (error) {
    console.error(error)
  }
  loading.value=false
}
function onPagination({page,limit}){
  query.value.page=page
}
var actEditnameIdx=ref(-1)
var refEdit=useTemplateRef('refEdit')
watch(actEditnameIdx,async(v)=>{
  if(v<0||!refEdit.value) return
  await nextTick()
  refEdit.value[0].focus()
  refEdit.value[0].select()
})
async function onImgName(){
  if(actEditnameIdx.value<0) return
  var v=imgs.value[actEditnameIdx.value]
  if(!v.name.trim()){
    ElMessage.error('图片名称不能为空')
    return
  }
  dog('edit img name',v.name)
  actEditnameIdx.value=-1
}
async function onUpload({file,onSuccess,onError}){
  if(!account.value?.id){
    ElMessage.error('请先选择公众号')
    return
  } else if(file.size>10*1024*1024){
    ElMessage.error('图片大小不能超过10M')
    return
  }
  try {
    var cookies=serializeCookie(JSON.parse(account.value.session_id)["cookie"])
    var token= +account.value.token;
    var base64_image=await fileToBase64(file)
    var res = await uploadImage({cookies,token,content_type:file.type,filename:file.name,base64_image})
    if(res.data?.cdn_url){
      imgs.value.unshift({file_id:Date.now(),cdn_url:res.data.cdn_url,name:file.name,checked:false})
      imgs.value.pop()
    } else {
      ElMessage.error('图片上传失败，请稍后再试')
    }
    // dog('upload file',file,res)
    onSuccess(res.data)
  } catch (error) {
    onError(error)
  }
}
var router=useRouter();
var aotPickerStore=useAotPickerStore();
async function onPublish(idx=-1){
  var pubAccounts=await aotPickerStore.select();
  if(!pubAccounts.length){
    ElMessage.warning('请选择公众号');
    return
  }
  var pubImgs=idx<0?imgs.value.filter(v=>v.checked):[imgs.value[idx]];
  var cdnUrls=pubImgs.map(v=>v.cdn_url)
  dog('publish imgs',idx,cdnUrls,toRaw(pubAccounts))
  await router.replace({path:'/editor3',state:{dataFrom:'publishImg',data:{cdnUrls,accounts:toRaw(pubAccounts)}}});
}
async function onDelete(idx=-1){
  var fileid=idx<0?imgs.value.filter(v=>v.checked).map(v=>v.file_id):[imgs.value[idx].file_id]
  var cookies=serializeCookie(JSON.parse(account.value.session_id)["cookie"])
  var token= +account.value.token;
  var group_id=query.value.group_id
  loading.value=true
  var res=await window.webBridge.callRpc('wxDelImgs',{cookies,token,fileid,group_id})
  // dog('delete imgs',idx,res)
  if(res?.base_resp?.ret===0){
    ElMessage.success('删除成功')
    await getList()
  } else {
    ElMessage.error(res?.base_resp?.err_msg||'删除失败，请稍后再试')
  }
}
function formatDate(row, column, cellValue, index) {
  return dayjs(cellValue*1000).format('YYYY年MM月DD日')
}
var mockVidDel=()=>new Promise((r,j)=>setTimeout(()=>r({success:true}),Math.random()*2000))
var leftVidDel=ref(0)
async function onVidPreview(row){
  throw new Error('预览视频功暂不支持')
  previewVid.value=row
  refDialog.value.showModal()
}
async function onVidDel(row=null){
  var appid=row? [row.app_id]:selectRows.value.map(v=>v.app_id)
  var cookies=serializeCookie(JSON.parse(account.value.session_id)["cookie"])
  var token= +account.value.token;
  dog('delete vids',toRaw(row),appid)
  leftVidDel.value=appid.length
  appid.forEach(async AppMsgId=>{
    try {
      var res=await window.webBridge.callRpc('wxDelVideos',{cookies,token,AppMsgId})
      dog('delete video',AppMsgId,res?.base_resp)
    } catch (error) {
      console.error(error)
    }
    leftVidDel.value--
    if(leftVidDel.value===0){
      ElMessage.success(`删除成功`)
      query.value.page=1
      getList()
    }
  })
}
</script>
<style>
.filepage{
  border-top: 1px solid var(--el-border-color);
  .img-list .item{
    border: 2px solid transparent;
    &.active, &:hover, &+.name:focus-visible{
      border-color: var(--el-color-primary);
      outline-color: var(--el-color-primary);
      background-color: rgba(0, 0, 0,.05);
    }
  }
  .alert{
    background-color: var(--el-color-info-light-9);
    color: var(--el-color-info);
    .el-button{
      @apply px-1;
    }
  }
  .title em{
    font-style: normal;
    color: var(--el-color-primary);
    font-weight: bold;
  }
}
</style>
