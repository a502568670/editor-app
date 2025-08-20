<template>
<el-dialog v-model="aotPicker.visible" title="选择公众号" width="50vw" @close="aotPicker.hide()" append-to-body>
  <div class="account-picker-comp w-full">
    <div class="flex mb-2">
      <el-checkbox v-model="checkAll" label="全部" @change="onCheckAll" :indeterminate="indemi"></el-checkbox>
      <el-input v-model="search" placeholder="搜索公众号名称" clearable="" class="ml-4"></el-input>
    </div>
    <el-checkbox-group v-model="aotPicker.list" class="flex flex-wrap">
      <el-checkbox v-for="(item) in filterList" :key="item.id" :value="item.id" :label="item.name" border="true" class="mb-2 checkbox" :disabled="item.expired">
        <img :src="item.avatar" class="size-[24px] rounded-full mr-1 inline-block" alt="">
        {{ item.name }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
  <template #footer>
    <el-button @click="aotPicker.hide()">取消</el-button>
    <el-button type="primary" @click="onConfirm">确认</el-button>
  </template>
</el-dialog>
</template>
<script setup>
import { useAotPickerStore } from '@/store/piniaStore';
import { dog } from '@/utils';
import { ref, onMounted, computed, shallowRef, toRaw, watchEffect } from 'vue'
var aotPicker=useAotPickerStore()
var search=ref('')
var filterList=computed(() => {
  if(!search.value) return aotPicker.account.list;
  return aotPicker.account.list.filter(item => item.name.includes(search.value));
});
var checkAll=ref(false)
var indemi=computed(() => {
  return aotPicker.list.length > 0 && aotPicker.list.length < aotPicker.account.list.filter(item => !item.expired).length;
});
watchEffect(() => {
  if(!aotPicker.visible){
    search.value = ''
    aotPicker.update([]);
    checkAll.value = false;
  }
});
function onConfirm() {
  aotPicker.hide(true);
  // 这里可以添加确认逻辑
  dog('选择的公众号:', toRaw(aotPicker.list));
}
function onCheckAll(val) {
  // dog(val)
  if(val){
    aotPicker.update(aotPicker.account.list.filter(item => !item.expired).map(item => item.id));
  }else{
    aotPicker.update([]);
  }
}
</script>
<style>
.account-picker-comp {
  .checkbox{
    --el-checkbox-height: 40px;
    @apply mr-2;
  }
}
</style>
