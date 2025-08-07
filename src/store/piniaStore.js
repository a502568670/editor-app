import {ref, shallowRef, toRaw} from 'vue';
import { acceptHMRUpdate, defineStore } from "pinia";
import { ElMessage } from 'element-plus';
import { dog } from '@/utils';

export const useHydrateStore = defineStore('hyration', () => {
  var list=ref([]);
  function add(item) {
    if (item.item_show_type === 8 || item.publish_type === '小绿书' || item.publish_type === '文字'){
      ElMessage({
        message: '不支持合成小绿书或文字素材',
        type: 'warning',
      });
      return;
    }else if(list.value.length<8){
      list.value.push(item);
      return;
    }
    ElMessage({
      message: '最多只能添加8个素材',
      type: 'warning',
    });
  }
  function remove(idx){
    list.value.splice(idx, 1);
  }
  function clear() {
    dog('hydrateStore clear:',toRaw(list.value));
    list.value = [];
  }
  function insert(i, j) {
    if (i < 0 || i >= list.value.length || j < 0 || j >= list.value.length) {
      return;
    }
    var tmp=list.value[i];
    list.value.splice(i, 1);
    list.value.splice(j, 0, tmp);
  }
  return {
    list,
    add,remove,clear,insert,
  };
});

// webpack HMR
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(acceptHMRUpdate(useHydrateStore, import.meta.webpackHot));
}
