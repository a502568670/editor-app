<template>
  <div class="img-picker" @click="openDialog()">
    <img v-if="imgSrc" :src="imgSrc" class="max-h-full" alt="">
    <template v-else>
        <el-icon :size="24">
            <UploadFilled />
        </el-icon>
        <span class="mt-1">{{ $attrs.placeholder }}</span>
    </template>
    <el-dialog class="img-picker dialog " v-model="open" title="选择图片" width="850px"  append-to-body>
      <div class="w-full flex min-h-[480px]">
        <div class="w-[130px] h-full overflow-y-scroll">
          <el-menu class="min-h-full h-full" :default-active="0" :default-openeds="['material']" @select="onSelect">
            <el-menu-item index="local">从正文选择</el-menu-item>
            <el-sub-menu index="material">
              <template #title>公众号图片</template>
              <el-menu-item v-for="v in groups" :key="v.id" :index="v.id">
                 {{ v.name }}
                <el-tag class="ml-1" size="small" round>{{ v.count }}</el-tag>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item index="search">图片搜索</el-menu-item>
          </el-menu>
        </div>
        <div class="w-[700px] min-h-[480px] flex flex-col">
          <div class="ml-2 mb-1">
            <el-alert v-if="activeMenu==='search'" class="mx-2" title="图片来源于网络，请自行甄别版权问题" type="error">
            </el-alert>
          </div>
          <div class="flex justify-end">
            <div class="flex-1 mx-2" v-if="activeMenu==='search'">
              <el-input v-model.trim="searchQuery.word" :prefix-icon="Search" placeholder="输入关键字搜索图片" clearable></el-input>
              <el-tag v-for="(v) in wordHistory" :key="v" class="cursor-pointer mr-1 mt-1" @click="searchQuery.word=v" closable @close="delWordHistory(v)" size="small">{{ v }}</el-tag>
            </div>
            <ImgCrop ref="refImgCrop" @change="onImageCrop" button :forbidCrop="forbidCrop" :upload="upload"/>
          </div>
          <el-checkbox-group v-if="imgs.length" class="flex-1 flex flex-wrap p-2 mt-2" :model-value="selectedIdxOnPage" @update:model-value="() => {}">
            <div class="item ml-3 mb-3" v-for="(v,idx) in imgs" :key="idx" @mouseenter="activeMenu==='search' && (previewUrl=v.cdn_url)" @mouseleave="previewUrl=null">
              <el-image class="img size-[100px] object-contain" fit="contain" :src="v.cdn_url" alt=""  @click="handleImageClick(v.cdn_url)"/>
              <p class="w-[100px] truncate text-sm text-center mt-2">{{ v.name }}</p>
              <div v-if="selectedUrls.has(v.cdn_url)" class="overlay" @click.prevent="toggleUrl(v.cdn_url)"></div>
              <el-checkbox class="checkbox" :value="idx" :model-value="selectedUrls.has(v.cdn_url)"></el-checkbox>
              <div v-if="activeMenu==='search' && previewUrl===v.cdn_url" class="img-zoom-preview"><img :src="v.cdn_url" referrerpolicy="no-referrer" /></div>
            </div>
          </el-checkbox-group>
          <div class="p-4 text-center" v-else>暂无图片</div>
          <pagination class="p-4" v-if="activeMenu==='material'" :total="total" :page="pickerQuery.page" :limit="pickerQuery.limit" @pagination="onPagination" layout="total, prev, pager, next,jumper"></pagination>
          <pagination class="p-4" v-else-if="activeMenu==='search'" :total="searchQuery.word?1500:0" :page="searchQuery.pn+1" :limit="searchQuery.rn" @pagination="onSearchPagination" layout="prev, pager, next,jumper"></pagination>
          <div v-if="multiple_effective && selectedUrls.size > 0" class="px-4 pb-2 text-sm text-gray-500">
            已选 {{ selectedUrls.size }}/20
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="open=false">取消</el-button>
        <el-button type="primary" :disabled="selectedUrls.size===0" @click="onConfirm" :loading="uploading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import {computed, ref, shallowRef, watchEffect,watch,inject, toRaw, nextTick} from 'vue'
import { UploadFilled, Crop, Search,Bell } from '@element-plus/icons-vue'
import ImgCrop from '../ImgCrop.vue'
import pagination from '../Pagination/index.vue'
import { ElMessageBox } from 'element-plus'
import debounce from 'lodash-es/debounce'
import { uploadImage } from '@/api/img'
import {serializeCookie} from '@/utils/cookie'

var {imgSrc,editorInst,pageInfo,h, forbidCrop, upload, multiple}=defineProps({
  imgSrc: String,
  editorInst: Object,
  pageInfo: Object,
  h: Number,
  forbidCrop: Boolean,
  upload: Boolean,
  multiple: {
    type: Boolean,
    default: true
  }
})
var $emit=defineEmits(['change','confirm'])
var pickerQuery=defineModel()
var total=computed(()=>groups.value.find(v=>v.id==pickerQuery.value.group_id)?.count)
var imgPickerHeight = computed(()=> h ?  h+'px' : '80px')
var groups=shallowRef([])
var open=ref(false)
var _multipleOverride=ref(null)
var multiple_effective=computed(()=>_multipleOverride.value!==null?_multipleOverride.value:multiple)
watch(open,()=>{
  if(!open.value){
    searchQuery.value.word=''
    searchQuery.value.pn=0
    _multipleOverride.value=null
  }
})
var activeMenu=ref('material')
var imgs=ref([])
var refInput=ref(null)
var selectedUrls=ref(new Set())
var previewUrl=ref(null)
var selectedIdxOnPage=computed(()=>{
  return imgs.value.map((v,idx)=>selectedUrls.value.has(v.cdn_url)?idx:-1).filter(i=>i>=0)
})
var refImgCrop=ref(null)
var searchQuery=ref({word:'',pn:0,rn:18})
var _w;
watch(searchQuery,debounce(async ()=>{
  if(searchQuery.value.word){
    if(searchQuery.value.word!==_w){
      _w=searchQuery.value.word;
      searchQuery.value.pn=0;
    }
    addWordHistory(searchQuery.value.word);
    selectedUrls.value=new Set()
    var search=`?${new URLSearchParams(searchQuery.value)}&tn=resultjson_com&ie=utf-8&fp=result&fr=&ala=0&applid=10806652856360252284&nojc=0&gsm=1e&newReq=1`
    var req=await fetch(`https://image.baidu.com/search/acjson${search}`);
    var res=await req.json();
    if(res.errno===0){
      imgs.value=res.data.images.map(v=>({cdn_url:v.thumburl}));
    }
  }
},300), {deep:true})
var wordHistory=ref((localStorage.getItem('img-picker-wordHistory')||'').split(',').filter(v=>v).map(v=>v.trim()));
function addWordHistory(word){
  if(!word) return;
  if(wordHistory.value.indexOf(word)<0){
    wordHistory.value.unshift(word);
    if(wordHistory.value.length>10){
      wordHistory.value.pop();
    }
    localStorage.setItem('img-picker-wordHistory',wordHistory.value);
  }
}
function delWordHistory(word){
  if(!word) return;
  var idx=wordHistory.value.indexOf(word);
  if(idx>-1){
    wordHistory.value.splice(idx,1);
    localStorage.setItem('img-picker-wordHistory',wordHistory.value);
  }
}
function toggleUrl(cdnUrl){
  var s=new Set(selectedUrls.value)
  if(s.has(cdnUrl)){
    s.delete(cdnUrl)
  } else {
    if(multiple_effective.value){
      if(s.size<20) s.add(cdnUrl)
    } else {
      s.clear()
      s.add(cdnUrl)
    }
  }
  selectedUrls.value=s
}
function openDialog(opts={}){
  _multipleOverride.value = opts.multiple !== undefined ? opts.multiple : null
  const preSelected = Array.isArray(opts.preSelected) ? opts.preSelected : []
  openDialog_internal(preSelected)
}
defineExpose({
  uploadSucc(url){
    if(activeMenu.value==='material'){
      imgs.value.pop();
      imgs.value.unshift({cdn_url:url});
    }else{
      open.value=false
    }
  },
  openDialog,
});
watchEffect(()=>{
  if(pageInfo?.file_cnt){
    var {file_cnt,file_group_list:{file_group},file_item}=pageInfo;
    groups.value=file_group;
    if(activeMenu.value==='material'){
      imgs.value=file_item.map(({name,cdn_url})=>({name,cdn_url}));
    }
  }
})
var selectedAccount=inject('selectedAccount')
var uploading=ref(false)
function onConfirm(){
  var urls = Array.from(selectedUrls.value)
  if(activeMenu.value==='search'){
    uploading.value=true;
    window.webBridge.callRpc('batchWxUploadImg', {
      account: toRaw(selectedAccount.value),
      urls: toRaw(urls),
    }).then(res => {
      var wxUrls = res.map(v => v.url).filter(v => v);
      $emit('confirm', wxUrls);
      open.value = false;
    }).catch(err => {
      console.error(err);
      ElMessageBox.alert('图片上传失败，请稍后再试', '错误', {type: 'error'});
    }).finally(() => {
      uploading.value = false;
    });
  }else if(!multiple_effective.value){
    if(urls.length === 1 && refImgCrop.value && !forbidCrop){
      refImgCrop.value.cropWith(urls[0], { radio: '2' })
    } else if(urls.length === 1){
      $emit('confirm', urls)
      open.value = false
    }
  }else{
    $emit('confirm', urls)
    open.value = false
  }
}
function onImageCrop(data){
  open.value = false
  $emit('change', data)
}
var initParams={page:1,limit:12,group_id:0};
function openDialog_internal(preSelected=[]){
  open.value=true
  selectedUrls.value=new Set(preSelected)
  getEditorImgs()
  pickerQuery.value={...initParams}
}
function getEditorImgs(){
  var $imgs = editorInst?.document ? Array.from(editorInst.document.images) :[];
  var urls = $imgs.map(v=>({cdn_url:v.src||v.dataset.src})).filter(v=>v.cdn_url)
  imgs.value=urls;
}
function onSelect(index, indexPath){
  if(indexPath.length>1){
    activeMenu.value=indexPath[0]
    pickerQuery.value={...initParams,group_id:indexPath[1]}
  } else {
    activeMenu.value=index;
  }
  selectedUrls.value=new Set()
  if(index==='local'){
    getEditorImgs()
  }else if(index==='search'){
    searchQuery.value.word=''
    searchQuery.value.pn=0
    imgs.value=[]
  }
}
function onPagination(query){
  pickerQuery.value={...pickerQuery.value,...query}
}
function onSearchPagination(query){
  searchQuery.value.pn=query.page-1
  selectedUrls.value=new Set()
}
function handleImageClick(cdnUrl){
  toggleUrl(cdnUrl)
}
</script>
<style>
.img-picker{
  position: relative;
}
.img-picker:not(.dialog) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: v-bind('imgPickerHeight');
  border: 1px dashed var(--el-border-color);
  cursor: pointer;
}
.img-picker .el-menu--vertical {
  --el-menu-item-height: 36px;
  --el-menu-sub-item-height: 30px;
  --el-menu-level-padding: .1px;
}
.img-picker .el-menu-item.is-active,
.img-picker .el-sub-menu1.is-active{
  background-color: var(--el-menu-hover-bg-color);
}
.img-picker .btn-input {
  visibility: hidden;
}
.img-picker .img-zoom-preview {
  position: absolute;
  z-index: 9999;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  padding: 4px;
  width: 240px;
  height: 240px;
}
.img-picker .img-zoom-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.img-picker .el-checkbox {
  height: auto;
}
.img-picker .item {
  position: relative;
}
.img-picker .item .overlay,
.img-picker .item .img:hover {
  outline: 2px solid blue;
}
.img-picker .item .overlay{
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  background: rgba(0,0,0,0.1);
}
.img-picker .item .checkbox {
  position: absolute;
  left: 4px;
  top: 4px;
  transform: scale(1.5);
  transform-origin: 0 0;
  --el-checkbox-bg-color: rgba(0,0,0,0.35);
  --el-checkbox-border-radius: 0;
  --el-checkbox-input-border: 1px solid transparent;
}
</style>
  