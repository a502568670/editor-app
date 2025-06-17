<template>
  <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openAdDialog" title="批量提取文章链接内容">
    <Link2 />
  </el-icon>
  <el-dialog :close-on-click-modal="false" title="批量提取文章链接内容" v-model="open" width="600px" append-to-body>
    <div class="w-full">
      <el-input class="my-1" v-for="(v,idx) in inputs" :key="idx" v-model.trim="inputs[idx].url" clearable placeholder="请输入文章提取地址">
        <template #prepend>#{{ idx+posts.length+1 }}</template>
        <template #append>
          <el-select v-model="inputs[idx].type" style="width: 80px">
            <el-option label="图文" :value="0" />
            <el-option label="视频" :value="5" />
          </el-select>
        </template>
      </el-input>
    </div>
    <template #footer>
      <el-button @click="open = false">取消</el-button>
      <el-button type="primary" @click="onConfirm">批量提取</el-button>
    </template>
  </el-dialog>

</template>
<script setup>
import {ref} from 'vue'
import {Link2} from 'lucide-vue-next'
import {Loading} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

var posts=defineModel()
var $emit=defineEmits(['confirm'])
var MAX=8
var open=ref(false)
var inputs=ref([])
function openAdDialog(){
  if(posts.value.length<MAX){
    open.value=true
    inputs.value=Array.from({length:MAX-posts.value.length}, ()=>({type:0,url:''}))
    return;
  }
  ElMessage({type:'error',message:`超出单消息最大文章数 ${MAX} 篇`})
}
function onConfirm(){
  var data=inputs.value.filter(v=>v.url)
  if(!data.length){
    ElMessage({type:'warning',message:'请输入有效的提取链接'})
    return;
  }
  open.value=false
  $emit('confirm',data)
}
</script>
