<template>
<div class="img-list-picker">
  <div class="img-container flex justify-center items-center">
    <el-icon class="btn-nav prev bg-white p-1 rounded-full cursor-pointer" :size="32" :style="`visibility:${activeIdx>0?'visible':'hidden'}`" @click="activeIdx--"><CaretLeft/></el-icon>
    <el-image v-if="imgs[activeIdx]" class="img m-2 rounded-md" :style="`background:${imgs[activeIdx]?.bg}`" :src="imgs[activeIdx]?.url" fit="contain">
      <template #error></template>
    </el-image>
    <div v-else class="img bg-white"></div>
    <el-icon class="btn-nav next bg-white p-1 rounded-full cursor-pointer" :size="32" :style="`visibility:${activeIdx<imgs.length-1?'visible':'hidden'}`" @click="activeIdx++"><CaretRight/></el-icon>
  </div>
  <div class="text-center my-1">
    <el-button-group v-if="imgs.length">
      <el-tooltip content="填充底色" placement="top"><el-button :icon="imgs[activeIdx].bg=='#fff'?Picture:PictureFilled" @click="imgs[activeIdx].bg=imgs[activeIdx].bg=='#fff'?'#b9bab3':'#fff'"></el-button></el-tooltip>
      <el-tooltip content="删除" placement="top"><el-button :icon="Delete" @click="onDelete(activeIdx)"></el-button></el-tooltip>
      <el-tooltip content="裁剪" placement="top"><el-button :icon="Crop" @click="onCrop(activeIdx)"></el-button></el-tooltip>
    </el-button-group>
  </div>
  <div class="img-list">
    <el-popover popper-class="img-list-popover" v-for="(v,idx) in imgs" :key="idx+v.url" trigger="hover" placement="bottom" :width="100">
      <template #reference>
        <img class="item" :class="activeIdx==idx&&'active'" :src="v.url" alt="img" @click="activeIdx=idx"  draggable="true" @dragstart="(evt)=>onDragStart(evt,idx)" @dragover.prevent="(evt)=>evt.dataTransfer.dropEffect='move'" @drop="(evt)=>onDrop(evt,idx)"/>
      </template>
      <el-button :icon="Crop" @click="onCrop(idx)" text round></el-button>
      <el-button :icon="Delete" @click="onDelete(idx)" text round></el-button>
    </el-popover>
    <el-tooltip content="添加图片">
      <slot name="picker" @click="console.log('slot click')"></slot>
    </el-tooltip>
  </div>
  <ImgCrop ref="refImgCrop" @change="url=>imgs[activeIdx].url=url" upload nul/>
</div>
</template>
<script setup>
import {ref} from 'vue';
import {CaretLeft,CaretRight,Picture,PictureFilled,Delete,Crop} from '@element-plus/icons-vue'
import ImgCrop from '../ImgCrop.vue';

var $emit=defineEmits(['change'])
var imgs = defineModel({default:[]})
var activeIdx=ref(0)
function onDelete(idx) {
  if (idx==imgs.value.length-1&&activeIdx.value>0){
    activeIdx.value--;
  }
  imgs.value=imgs.value.filter((v,i) => i!==idx);
}
var refImgCrop=ref(null)
function onCrop(idx) {
  refImgCrop.value.cropWith(imgs.value[idx].url)
  activeIdx.value=idx
}
function onDragStart(evt, idx) {
  evt.dataTransfer.setData('text/uri-list', imgs.value[idx].url);
  evt.dataTransfer.setData('text/plain', idx);
  evt.dataTransfer.effectAllowed = 'move';
}
function onDrop(evt, idx) {
  evt.preventDefault();
  const draggedIdx = evt.dataTransfer.getData('text/plain');
  if (draggedIdx != idx) {
    const draggedImg = imgs.value[draggedIdx];
    imgs.value.splice(draggedIdx, 1);
    imgs.value.splice(idx, 0, draggedImg);
    activeIdx.value = idx;
  }
}
</script> 
<style>
.img-list-picker{}
.img-list-picker .img-container{
}
.img-list-picker .img-container .img{
  width: 300px;
  height: 400px;
  border: 1px solid var(--el-border-color);
}
/* .img-list-picker .img-container .img.colored{
  background-color: #95d475;
} */
.img-list-picker .img-list{
  text-align: center;
  margin: 10px;
  overflow-x: auto;
}
.img-list-picker .img-list .item{
  display: inline-block;
  vertical-align: bottom;
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  object-fit: cover;
  margin: 4px 4px 0 0;
  cursor: pointer;
}
.img-list-picker .img-list .item.el-icon{
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed var(--el-border-color);
}
.img-list-picker .img-list .item.active {
  width: 50px;
  height: 50px;
  border: 1px solid #67C23A;
}
.img-list-popover {
  text-align: center;
  min-width: 0 !important;
  --el-popover-border-radius: 99px;
  --el-popover-padding: 4px;
  .el-button+.el-button {
    margin-left: 0;
  }
}
</style>
