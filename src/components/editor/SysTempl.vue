<template>
  <div class="sys-templ-comp h-full flex flex-col" v-if="list.length">
    <el-alert v-if="!editorInst?.isReady" type="error" title="非图文消息不支持样式" show-icon></el-alert>
    <!-- 我的样式：保存按钮 -->
    <div v-if="actId === -1" class="py-2 text-center">
      <el-button :icon="Save" @click="saveTemplate">保存当前编辑内容</el-button>
    </div>
    <el-tabs v-model="actId" @tab-change="name=>subId=list.find(v=>v.id==name)?.children?.[0]?.id || -1">
      <el-tab-pane v-for="item in list" :key="item.id" :name="item.id" :label="item.name">
        <el-tabs v-model="subId" v-if="item.children?.length">
          <el-tab-pane v-for="v in item.children" :key="v.id" :name="v.id" :label="v.name">
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>
    <section class="flex-1 overflow-y-auto overflow-x-hidden -mr-1" ref="refList" v-if="templ.length" @scrollend="onScroll">
      <div class="templ my-2 cursor-pointer relative" v-for="item in templ" :key="item.id" :title="item.name">
        <!-- 我的样式：显示模板名称 -->
        <div v-if="actId === -1" class="templ-html p-1" v-html="item.content" @click="insert(item)"></div>
        <!-- 系统模板：直接显示内容 -->
        <div v-else class="p-2" v-html="item.content" @click="insert(item)"></div>
        
        <!-- 显示模板名称 -->
        <div class="text-center my-1">{{ item.name }}</div>
        
        <!-- 我的样式：悬浮显示操作按钮 -->
        <div v-if="actId === -1" class="templ-actions absolute top-0 left-0">
          <el-button-group>
            <el-button @click="insert(item)">使用模板</el-button>
            <el-popconfirm title="确定删除该模板？" @confirm="deleteUserTempl(item.id)" width="200">
              <template #reference>
                <el-button :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </el-button-group>
        </div>
        
        <!-- 系统模板：右下角收藏文字 -->
        <div v-if="actId !== -1" class="favorite-text" @click.stop="favoriteTemplate(item)">
          收藏到我的样式
        </div>
      </div>
      <div class="text-center my-2" v-if="more">
        <el-button @click="params.offset+=params.limit" :loading="loading">加载更多</el-button>
      </div>
    </section>
    <el-empty v-else description="暂无样式"></el-empty>
  </div>
  <el-empty v-else description="暂无样式分类"></el-empty>
</template>
<script setup>
import {computed, onMounted, ref, shallowRef, toRaw, watch, watchEffect} from 'vue'
import {getNiceSysTempl, getSysTempl, getSysTemplByCat, getUserTempl, delUserTempl, saveUserTempl} from '@/api/mp_msg'
import { dog } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import {Delete} from '@element-plus/icons-vue'
import {Save} from 'lucide-vue-next'
import throttle from 'lodash-es/throttle'
var list=shallowRef([])
var actId=ref(2)
var subId=ref(-1)
var {editorInst}=defineProps(['editorInst'])
var refList=ref(null)
function onScroll() {
  if(refList.value.scrollTop+refList.value.clientHeight>=refList.value.scrollHeight-100){
    if(more.value && !loading.value){
      params.value.offset+=params.value.limit
    }
  }
}
onMounted(async()=>{
  // let res=await getSysTempl()
  var res=await getNiceSysTempl()
  var {data}=res.data;
  dog('sys templ', data)
  if(data.length){
    // 在前面添加"我的样式"选项
    list.value=[
      {
        id: -1,
        name: "我的样式",
        children: []
      },
      ...data
    ]
    actId.value=data[0].id
    subId.value=data[0].children?.[0]?.id || -1
  }
})
var initParams={offset:0,limit:30}
var params=ref({...initParams})
var templ=shallowRef([])
var loading=ref(false)
var more=ref(true)
var id;

// 加载模板数据
async function loadTemplates() {
  // 如果是"我的样式"，加载自定义模板
  if(id === -1) {
    let res = await getUserTempl()
    // 直接使用后端返回的数据，保持与 UserTempl 一致
    var items = res.data.data.map(v => ({
      id: v.id,
      name: v.name || v.template_name || '未命名模板',
      content: v.content
    }))
    dog('user templ (我的样式)', items)
    templ.value = items
    more.value = false
    params.value = {...initParams}
    if(refList.value){
      refList.value.scrollTop=0
    }
    return
  }
  
  let res=await getSysTemplByCat(id, initParams)
  var {items,total}=res.data.data;
  dog('sys templ by categoryId', items, total)
  templ.value=items
  more.value=total>initParams.limit
  params.value={...initParams}
  if(refList.value){
    refList.value.scrollTop=0
  }
}

watchEffect(async ()=>{
  id=subId.value;
  if(id==-1){
    id=actId.value
  }
  await loadTemplates()
})

watchEffect(async ()=>{
  if(params.value.offset==0) return;
  loading.value=true
  let res=await getSysTemplByCat(id, params.value)
  var {items,total}=res.data.data;
  dog('sys templ by categoryId more', items, total)
  templ.value=[...templ.value,...items]
  loading.value=false
  more.value=total>params.value.limit+params.value.offset
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

// 删除自定义模板
async function deleteUserTempl(templId) {
  await delUserTempl({style_ids: [templId]})
  ElMessage.success('删除成功')
  // 重新加载模板列表
  await loadTemplates()
}

// 保存当前编辑内容到自定义模板
async function saveTemplate() {
  if(!editorInst.isReady){
    ElMessage.warning('非图文消息不支持样式')
    return
  }
  
  const html = editorInst.getContent()
  if(!html.trim()){
    ElMessageBox.alert('当前编辑内容不能为空', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
    })
    return
  }
  
  const result = await ElMessageBox.prompt('请输入模板名称', '保存到我的样式', {}).catch(()=>{})
  if(!result?.value) return
  
  await saveUserTempl({template_name: result.value, content: html.trim()})
  ElMessage.success('保存成功')
  // 重新加载模板列表
  await loadTemplates()
}

// 收藏系统模板到我的样式
async function favoriteTemplate(item) {
  const result = await ElMessageBox.prompt('请输入模板名称', '收藏到我的样式', {
    inputValue: item.name || '未命名模板'
  }).catch(()=>{})
  if(!result?.value) return
  
  await saveUserTempl({template_name: result.value, content: item.content})
  ElMessage.success('收藏成功')
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
  /* 我的样式：模板内容样式（参考 UserTempl） */
  .templ-html{
    width: 100%;
    overflow: hidden;
    box-shadow: var(--el-box-shadow-lighter);
  }
  .templ-html h1,
  .templ-html h2,
  .templ-html h3,
  .templ-html h4,
  .templ-html h5,
  .templ-html h6{
    font-weight: bold;
  }
  .templ-html img{
    max-width: 100%;
    height: auto;
  }
  /* 我的样式：操作按钮样式（参考 UserTempl） */
  .templ-actions {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.35);
    z-index: 9;
  }
  .templ:not(:hover) .templ-actions {
    display: none;
  }
  /* 系统模板：右下角收藏文字 */
  .favorite-text {
    position: absolute;
    right: 4px;
    bottom: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
    background-color: rgba(255, 255, 255, 0.9);
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1;
  }
  .templ:hover .favorite-text {
    opacity: 1;
  }
  .favorite-text:hover {
    background-color: var(--el-color-primary);
    color: white;
  }
}
.sys-templ-comp .el-tabs{
  .el-tabs__content{
    padding: 0;
  }
  .el-tabs__header{
    margin: 0;
  }
}
</style>
