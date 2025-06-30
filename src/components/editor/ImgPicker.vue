<template>
  <div class="img-picker" @click="openDialog">
    <img v-if="imgSrc" :src="imgSrc" class="max-h-full" alt="">
    <template v-else>
        <el-icon :size="24">
            <UploadFilled />
        </el-icon>
        <span class="mt-1">{{ $attrs.placeholder }}</span>
    </template>
    <el-dialog class="img-picker dialog" v-model="open" title="选择图片" width="850px" append-to-body>
      <div class="w-full flex">
        <div class="w-[130px] h-full overflow-y-scroll">
          <el-menu class="min-h-full" default-active="local" @select="onSelect">
            <el-menu-item index="local">从正文选择</el-menu-item>
            <el-sub-menu index="material">
              <template #title>公众号图片</template>
              <el-menu-item v-for="v in groups" :key="v.id" :index="v.id">
                {{ v.name }}
                <el-tag class="ml-1" size="small" round>{{ v.count }}</el-tag>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="w-[700px]">
          <div class="flex justify-end">
            <ImgCrop ref="refImgCrop" @change="onImageCrop" button/>
          </div>
          <el-checkbox-group v-if="imgs.length" class="flex flex-wrap p-2 mt-2" v-model="selected">
            <div class="item ml-3 mb-3" v-for="(v,idx) in imgs" :key="idx">
              <!-- <img class="img size-[100px] object-contain" :src="v.cdn_url" alt=""  @click="selected.indexOf(idx)<0&&selected.push(idx)"/> -->
              <el-image class="img size-[100px] object-contain" fit="contain" :src="v.cdn_url" alt=""  @click="selected.indexOf(idx)<0&&selected.push(idx)"/>
              <p class="w-[100px] truncate text-sm text-center mt-2">{{ v.name }}</p>
              <div v-if="selected.indexOf(idx)>-1" class="overlay" @click.prevent="selected=selected.filter(i=>i!==idx)"></div>
              <el-checkbox class="checkbox" :value="idx"></el-checkbox>
            </div>
          </el-checkbox-group>
          <div class="p-4 text-center" v-else>暂无图片</div>
          <pagination class="p-4" v-if="activeMenu==='material'" :total="total" :page="pickerQuery.page" :limit="pickerQuery.limit" @pagination="onPagination" layout="total, prev, pager, next,jumper"></pagination>
        </div>
      </div>
      <template #footer>
        <el-button @click="open=false">取消</el-button>
        <el-button type="primary" :disabled="selected.length===0" @click="onConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import {computed, ref, shallowRef, watchEffect} from 'vue'
import { UploadFilled, Crop } from '@element-plus/icons-vue'
import ImgCrop from '../ImgCrop.vue'
import pagination from '../Pagination/index.vue'
import { ElMessageBox } from 'element-plus'

var {imgSrc,editorInst,pageInfo}=defineProps(['imgSrc','editorInst','pageInfo'])
var $emit=defineEmits(['change','confirm'])
var pickerQuery=defineModel()
var total=computed(()=>groups.value.find(v=>v.id==pickerQuery.value.group_id).count)
var groups=shallowRef([])
var open=ref(false)
var activeMenu=ref('local')
var imgs=ref([])
var refInput=ref(null)
var selected=ref([])
var refImgCrop=ref(null)
defineExpose({
  uploadSucc(url){
    if(activeMenu.value==='material'){
      imgs.value.shift();
      imgs.value.unshift({cdn_url:url});
    }else{
      open.value=false
    }
  }
});
watchEffect(()=>{
  if(pageInfo?.file_cnt){
    var {file_cnt,file_group_list:{file_group},file_item}=pageInfo;
    groups.value=file_group;
    if(activeMenu.value!=='local'){
      imgs.value=file_item.map(({name,cdn_url})=>({name,cdn_url}));
    }
  }
  // console.log(pickerQuery,pageInfo);
  
})

function onConfirm(){
  var urls=imgs.value.filter((v,idx)=>selected.value.indexOf(idx)>-1).map(v=>v.cdn_url)
  // console.log(selected.value,refImgCrop.value,urls);
  if(activeMenu.value==='local'){
    ElMessageBox.confirm('是否要对图片进行裁剪','裁剪',{
      confirmButtonText:'确定',
      cancelButtonText:'不裁剪直接使用',
      type:'info',
    }).then(()=>{
      refImgCrop.value.cropWith(urls[0])
    }).catch(()=>{
      $emit('confirm',urls)
      open.value=false
    })
  }else{
    $emit('confirm',urls)
    open.value=false
  }
}
function onImageCrop(data){
  $emit('change', data)
}
var initParams={page:1,limit:12,group_id:0};
function openDialog(){
  open.value=true
  selected.value=[]
  getEditorImgs()
  pickerQuery.value={...initParams}
}
function getEditorImgs(){
  var $imgs = editorInst.document ? Array.from(editorInst.document.images) :[];
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
  selected.value=[]
  if (index==='local'){
    getEditorImgs()
  }
}
function onPagination(query){
  pickerQuery.value={...pickerQuery.value,...query}
  selected.value=[]
}
</script>
<style>
.img-picker:not(.dialog) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 80px;
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