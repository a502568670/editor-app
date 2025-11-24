<template>
<div class="group-notify-select mt-2 pt-2">
  <p class="text-sm text-gray-600 mb-2">分组通知</p>
  <el-cascader class="mr-2" v-model="area" :options="areaOpts" :props="areaProps" placeholder="请选择地区" clearable filterable></el-cascader>
  <el-select class="mr-2" v-model="sex" placeholder="请选择性别" clearable>
    <el-option label="全部" value="-1"></el-option>
    <el-option label="男" value="1"></el-option>
    <el-option label="女" value="2"></el-option>
  </el-select>
  <el-cascader v-if="showTagSelect" v-model="groupid" :options="groupOpts" :props="groupProps" placeholder="请选择标签" :show-all-levels="false" clearable filterable></el-cascader>
</div>
</template>
<script setup>
import { ref, onMounted, inject, unref, toRaw, watchEffect, shallowRef, watch } from 'vue';

const props = defineProps({
  showTagSelect: {
    type: Boolean,
    default: true
  }
});

var selectedAccount=inject('selectedAccount');
var area = ref([-1]);
var sex=ref('-1');

// 获取地区数据的函数
async function fetchRegionData(id = 0) {
  try {
    var res = await window.webBridge.callRpc('getRegions', {
      account: selectedAccount?.value ? toRaw(selectedAccount.value) : null,
      id: id
    });
    if (res?.success) {
      return res.data || [];
    }
  } catch (error) {
    console.error('获取地区数据失败:', error);
  }
  return [];
}

/**
 * @import { CascaderProps } from 'element-plus';
 */
/** @type {CascaderProps} */
var areaProps = {
  expandTrigger: 'click',
  checkStrictly: true, // 允许选择任意级别的节点，不仅限于叶子节点
  lazy: true,
  lazyLoad: async (node, resolve, reject) => {
    if (node.level === 0) {
      // 第一级：全部 + 从API获取的国家列表
      const regions = await fetchRegionData(0);
      const options = [
        { label: '全部', value: -1, leaf: true }
      ];
      // 添加API返回的地区数据，value使用名称，同时保存ID用于加载子级
      regions.forEach(region => {
        options.push({
          label: region.name,
          value: region.name, // 使用名称作为值
          regionId: region.id // 保存ID用于加载子级
        });
      });
      resolve(options);
    } else {
      // 加载子级地区，使用保存的 regionId
      const parentId = node.data.regionId || node.value;
      const regions = await fetchRegionData(parentId);
      if (regions.length > 0) {
        // 有子节点数据，返回数据
        const options = regions.map(region => ({
          label: region.name,
          value: region.name, // 使用名称作为值
          regionId: region.id // 保存ID用于加载子级
        }));
        resolve(options);
      } else {
        resolve([]);
      }
    }
  }
};
var areaOpts = [];
async function fetchGroupData() {
  if (!selectedAccount?.value) {
    return [];
  }
  var res=await window.webBridge.callRpc('getWxGroupList', {account:toRaw(selectedAccount.value)});
  if(res.base_resp?.ret===0){
    var {group_info_list}=JSON.parse(res.contact_group_list);
    return group_info_list.map(group => ({
      label: group.group_name,
      value: group.group_id,
      leaf: true,
    }));
  }
  return [];
}
var groupOpts=shallowRef([])
watch(selectedAccount,()=>{
  groupOpts.value=[]
  area.value = [-1];
  sex.value='-1';
  groupid.value=['-1'];
})
/** @type {CascaderProps} */
var groupProps={
  expandTrigger: 'hover',
  lazy: true,
  lazyLoad: async (node, resolve) => {
    if(node.level===0){
      return resolve([
        { label: '全部', value: '-1',leaf:true},
        { label: '按标签选择', value: '按标签选择', leaf:false },
      ]);
    }
    var list = await fetchGroupData();
    resolve(list.filter(v=>v.value>1));
  }
}
var groupid=ref(['-1']);
var group=defineModel();
watchEffect(() => {
  var s='';
  if(groupid.value?.[1]){
    s+=`&groupid=${groupid.value[1]}`;
  }
  if(sex.value&&sex.value!=-1){
    s+=`&sex=${sex.value}`;
  }
  if(area.value&&area.value.length>0&&area.value[0]!=-1){
    // 使用地区名称构建参数
    // 第一级是国家名称
    s+=`&country=${area.value[0]}`;
    if(area.value.length>1){
      s+=`&province=${area.value[1]}`;
    }
    if(area.value.length>2){
      s+=`&city=${area.value[2]}`;
    }
  }
  group.value = s;
  // console.log(area.value,sex.value,groupid.value,s);
});
</script>
<style>
.group-notify-select {
  border-top: 1px solid var(--el-border-color);
  .el-select{
    width: 100px;
  }
}
</style>
