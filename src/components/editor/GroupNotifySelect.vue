<template>
<div class="group-notify-select mt-2 pt-2">
  <p class="text-lg mb-1">分组通知</p>
  <el-cascader class="mr-2" v-model="area" :options="areaOpts" :props="areaProps" placeholder="请选择地区" clearable filterable></el-cascader>
  <el-select class="mr-2" v-model="sex" placeholder="请选择性别" clearable>
    <el-option label="全部" value="-1"></el-option>
    <el-option label="男" value="1"></el-option>
    <el-option label="女" value="2"></el-option>
  </el-select>
  <el-cascader v-model="groupid" :options="groupOpts" :props="groupProps" placeholder="请选择标签" :show-all-levels="false" clearable filterable></el-cascader>
</div>
</template>
<script setup>
import { ref, onMounted, inject, unref, toRaw, watchEffect, shallowRef, watch } from 'vue';

import city from '@/assets/city.json';
import { serializeCookie, setCookie } from '@/utils/cookie';
// console.log(city2options(city));
function city2options(city) {
  var res=[];
  for (var k in city) {
    var opt={
      label: city[k][0].province,
      value: city[k][0].province,
      children: []
    }
    for (var item of city[k]) {
      if(item.name === '市辖区') {
        break; // Skip '市辖区' as it is not a valid city
      }
      opt.children.push({
        label: item.name,
        value: item.name
      });
    }
    res.push(opt);
  }
  return res;
}

/**
 * @import { CascaderProps } from 'element-plus';
 */
/** @type {CascaderProps} */
var areaProps = {
  expandTrigger: 'hover',
};
var areaOpts = [
  {label:'全部',value:-1},
  {label:'中国',value:'中国',children: city2options(city)},
];
var area = ref([areaOpts[0].value]);
var sex=ref('-1');
var selectedAccount=inject('selectedAccount');
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
  area.value = [areaOpts[0].value];
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
  if(area.value&&area.value[0]!=-1){
    s+=`&country=${area.value[0]}&province=${area.value[1]}`;
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
