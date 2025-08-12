<template>
<div class="user-templ-comp flex flex-col h-full" :class="{ 'disabled': !visible }">
  <el-alert v-if="!visible" type="error" title="非图文消息不支持自定义模板" show-icon></el-alert>
  <div class="py-2 text-center">
    <el-button :icon="Save" @click="add">保存当前编辑内容</el-button>
    <!-- <button @click="list=[]">清空</button> -->
  </div>
  <section class="flex-1 overflow-y-auto px-[1px]" v-if="list.length">
    <div class="templ mt-2 relative" v-for="(item, index) in list" :key="index">
      <!-- FIXME: XSS -->
      <div class="templ-html p-1" v-html="item.tpl_html"></div>
      <div class="text-center my-1">{{ item.name }}</div>
      <div class="templ-actions absolute top-0 left-0">
        <el-button-group>
          <el-tooltip content="将当前编辑器内容全部替换" placement="top">
            <el-button @click="html='<br/>'+item.tpl_html">整套使用</el-button>
          </el-tooltip>
          <el-popconfirm title="确定删除该模板？" @confirm="del(index)" width="200">
            <template #reference>
              <el-button :icon="Delete">删除</el-button>
            </template>
          </el-popconfirm>
        </el-button-group>
      </div>
    </div>
  </section>
  <el-empty v-else description="暂无自定义模板，点击上方按钮保存当前编辑内容到自定义模板"></el-empty>
</div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';
import {Delete} from '@element-plus/icons-vue'
import {Save} from 'lucide-vue-next'
import { delUserTempl, getUserTempl, saveUserTempl } from '@/api/mp_msg';

var list=ref([]);
var html=defineModel();
var {visible }=defineProps(['visible']);
onMounted(async () => {
  var res = await getUserTempl()
  res.data.data.forEach(v=>v.tpl_html=v.content);
  list.value=res.data.data
});
async function add(){
  if(!html.value.trim()){
    ElMessageBox.alert('当前编辑内容不能为空', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
    });
    return;
  }
  var name = await ElMessageBox.prompt('请输入模板名称', '保存到自定义模板', {}).catch(()=>{})
  if(!name?.value) return;
  var res=await saveUserTempl({template_name:name.value,content:html.value.trim()});
  res.data.data.forEach(v=>v.tpl_html=v.content);
  list.value=res.data.data
  
}
async function del(index){
  await delUserTempl({style_ids:[list.value[index].id]});
  list.value.splice(index, 1);
  ElMessage.success('删除成功');
}
</script>
<style>
.user-templ-comp{
  .templ-html{
    width: 100%;
    /* max-height: 120px; */
    overflow: hidden;
    box-shadow: var(--el-box-shadow-lighter);
    h1,h2,h3,h4,h5,h6{
      font-weight: bold;
    }
    img{
      max-width: 100%;
      height: auto;
    }
  }
  .templ-actions{
    display: flex;
    align-items: center;
    justify-content: center;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.35);
    /* backdrop-filter: blur(2px); */
    z-index: 9;
  }
  .templ:not(:hover) .templ-actions{
    display: none;
  }
}
.user-templ-comp.disabled{
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
