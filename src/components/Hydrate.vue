<template>
<el-popover trigger="click" :visible="visible" placement="bottom" width="300" popper-class="hydrate-comp" persistent>
  <template #reference>
    <el-badge :value="hydrateStore.list.length" ref="refButton" :style="$attrs.style">
      <el-button :icon="FolderAdd" @click="visible=!visible" v-click-outside="hide">素材合成器</el-button>
    </el-badge>
  </template>
  <div class="hydrate-comp-body max-h-[60vh] overflow-y-auto" @pointerenter="inside=true" @pointerleave="inside=false">
    <div class="appmsg-list" v-if="hydrateStore.list.length">
      <div class="item flex items-center mb-2 relative" v-for="(v,idx) in hydrateStore.list" :key="idx+v.title" draggable="true" @dragstart="e=>onDragStart(e,idx)" @dragover.prevent="e=>e.dataTransfer.dropEffect='move'" @drop="e=>onDrop(e,idx)" title="拖拽可排序">
        <div class="title flex-1 w-full h-[40px] line-clamp-2">{{ v.title }}</div>
        <el-image :src="v.cover||v.avatar||v.cdn_url" class="size-[56px]" fit="cover"></el-image>
        <div class="item-actions h-[32px] flex items-center w-full mr-2 justify-end">
          <el-icon class="bg-white rounded-full p-1 mr-1 cursor-pointer" size="24" @click="hydrateStore.remove(idx)"><Delete/></el-icon>
        </div>
      </div>
      <div class="mt-6 text-center">
        <el-button-group>
          <el-tooltip content="拖拽可排序">
            <el-button :icon="Edit" @click="hydrate" :loading="loading">合成</el-button>
          </el-tooltip>
          <el-button :icon="Delete" @click="hydrateStore.clear()">清空</el-button>
        </el-button-group>
      </div>
    </div>
    <el-empty v-else description="在“素材库”或“统计>文章”中找到文章添加到合成器中"></el-empty>
    <AccountPickerModal
      v-model="dialogAccountPickerModal"
      :multiple="true"
      @confirm="handleInstantSend"
      @before-close="loading = false"
    />
  </div>
</el-popover>
</template>
<script setup>
import { getCurrentInstance, onDeactivated, onUnmounted, ref, toRaw } from 'vue';
import { useAotPickerStore, useHydrateStore } from '@/store/piniaStore';
import {Delete, Edit, FolderAdd} from '@element-plus/icons-vue';
import { ElMessage, ClickOutside as vClickOutside } from 'element-plus'
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { dog } from '@/utils';
import AccountPickerModal from '@/components/AccountPickerModal.vue';

var refButton = ref(null);
const hydrateStore = useHydrateStore();
var aotPickerStore = useAotPickerStore();
var visible = ref(false);
var inst=getCurrentInstance();
function checkDeactivated(node) {
  if(node){
    if(node.isDeactivated) {
      return true;
    }
    return checkDeactivated(node.parent);
  }
  return false;
}
watch(()=> hydrateStore.list.length, (newVal, val, oncleanup) => {
  if(newVal>val&&!checkDeactivated(inst)){
    visible.value = true;
  }
  oncleanup(() => {
    // visible.value = false;
  });
});
onUnmounted(() => {
  // hydrateStore.clear();
});
var inside;
function hide(){
  if(inside) return;
  visible.value = false;
}

function onDragStart(evt, idx) {
  evt.dataTransfer.setData('text/plain', idx);
  evt.dataTransfer.effectAllowed = 'move';
}
function onDrop(evt, idx) {
  evt.preventDefault();
  const draggedIdx = evt.dataTransfer.getData('text/plain');
  if (draggedIdx != idx) {
    hydrateStore.insert(draggedIdx, idx);
  }
}
var loading=ref(false);
var router = useRouter();
const dialogAccountPickerModal = ref(false)
async function hydrate() {
  loading.value = true;
  dialogAccountPickerModal.value = true
}
const handleInstantSend = async (accounts) => {
  accounts = accounts.map((item) => item.id)
  if(!accounts.length){
    ElMessage.warning('请选择公众号');
    loading.value = false;
    visible.value = true
    return
  }
  dog('hydrate selected accounts:', toRaw(accounts));
  try {
    var urls={};
    hydrateStore.list.forEach((v, i) => {
      if(!v.msg_id&&v.url){
        urls[i]=v.url;
      }
    });
    var res=await window.webBridge.callRpc('batchExtractMpUrls',{urls:Object.values(urls)});
    var i=0;
    for(var kIdx in urls){
      var item=res[i++];
      var hydrateItem=hydrateStore.list[kIdx];
      if(!hydrateItem.msg_id){
        hydrateItem.cdn_url=hydrateItem.cover||hydrateItem.avatar;
        hydrateItem.sourceurl=hydrateItem.url;
        hydrateItem.fromExtract=true;
      }
      if(item.status==='fulfilled' && item.value.base_resp?.ret===0){
        hydrateStore.list[kIdx]={...hydrateItem,...item.value};
      }else{
        hydrateItem.content_noencode=`<p>原链接<a href="${urls[kIdx]}" target="_blank">${urls[kIdx]}</a>提取失败:<pre><code>${JSON.stringify(item)}</code></pre></p>`
      }
    }
    dog('hydrate batchExtractMpUrls:',toRaw(hydrateStore.list),urls,res);
  } catch (err) {
    console.error(err);
  }
  loading.value = false;
  visible.value = false;
  await router.replace({path:'/editor3',state:{dataFrom:'hydrate',data:{list:toRaw(hydrateStore.list),accounts:toRaw(accounts)}}});
}
</script>
<style>
.hydrate-comp {
  .appmsg-list .item:first-child {
    position: relative;
    .el-image{
      width: 100%;
      height: 100px;
    }
    .title {
      position: absolute;
      left: 0;
      bottom: 0;
      padding: 0 8px;
      background-color: rgba(0,0,0, 0.35);
      color: #fff;
      -webkit-line-clamp: 1;
      line-height: 32px;
      height: auto;
      z-index: 1;
    }
  }
  .appmsg-list {
    .item .item-actions{
      position: absolute;
      bottom: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 9;
    }
    .item:not(:hover) .item-actions {
      visibility: hidden;
    }
  }
}
.hydrate-comp-body {
  .el-empty{
    --el-empty-padding: 0;
  }
}
</style>
