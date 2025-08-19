<template>
  <div class="sys-templ-comp h-full flex flex-col" v-if="list.length">
    <el-alert v-if="!editorInst?.isReady" type="error" title="非图文消息不支持样式" show-icon></el-alert>
    <el-tabs v-model="actId" @tab-change="name=>subId=list.find(v=>v.id==name)?.children?.[0]?.id || -1">
      <el-tab-pane v-for="item in list" :key="item.id" :name="item.id" :label="item.name">
        <el-tabs v-model="subId" v-if="item.children?.length">
          <el-tab-pane v-for="v in item.children" :key="v.id" :name="v.id" :label="v.name">
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>
    <section class="flex-1 overflow-y-auto overflow-x-hidden" v-if="templ.length">
      <div class="templ p-2 my-2 cursor-pointer" v-for="item in templ" :key="item.id" v-html="item.content" :title="item.name" @click="insert(item)"></div>
    </section>
    <el-empty v-else description="暂无样式"></el-empty>
  </div>
  <el-empty v-else description="暂无样式分类"></el-empty>
</template>
<script setup>
import {computed, onMounted, ref, shallowRef, toRaw, watch, watchEffect} from 'vue'
import {getNiceSysTempl, getSysTempl, getSysTemplByCat} from '@/api/mp_msg'
import { dog } from '@/utils'
import { ElMessage } from 'element-plus'
var list=shallowRef([])
var actId=ref(2)
var subId=ref(-1)
var {editorInst}=defineProps(['editorInst'])
onMounted(async()=>{
  // let res=await getSysTempl()
  var res=await getNiceSysTempl()
  var {data}=res.data;
  dog('sys templ', data)
  if(data.length){
    list.value=data
    actId.value=data[0].id
    subId.value=data[0].children?.[0]?.id || -1
  }
})
var templ=shallowRef([])
watchEffect(async ()=>{
  var id=subId.value;
  if(id==-1){
    id=actId.value
  }
  let res=await getSysTemplByCat(id)
  var {data}=res.data;
  dog('sys templ by categoryId', data)
  templ.value=data
})
function insert(item){
  // dog(editorInst,item)
  if(editorInst.isReady){
    editorInst.focus()
    try {
      editorInst.execCommand('insertHtml', item.content)
    } catch (err) {
      console.error(err)
    }
  }else{
    ElMessage.warning('非图文消息不支持样式')
  }
}
</script>
<style>
.sys-templ-comp{
  .templ{
    border: 1px solid var(--el-border-color);
  }
  .templ:hover{
    background-color: var(--el-color-primary-light-9);
  }
}
.sys-templ-comp .el-tabs{
  .el-tabs__content{
    padding: 0;
  }
  .el-tabs__header{
    @apply -mx-1 mb-0;
  }
}
</style>
