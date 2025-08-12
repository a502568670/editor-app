import {ref, shallowRef, toRaw} from 'vue';
import { acceptHMRUpdate, defineStore } from "pinia";
import { ElMessage } from 'element-plus';
import { dog } from '@/utils';
import { listOrderedAccount } from '@/api/account';
import { checkWxSession } from '@/utils/cookie';

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
export const useAccountStore = defineStore('account', () => {
  var list = shallowRef([]);
  var actIndex = ref(0);
  function update(accounts) {
    list.value = accounts;
  }
  function select(idx){
    actIndex.value = idx;
  }
  async function fetch(params={page:1,num:500}) {
    const res = await listOrderedAccount(params)
    if(res.data.data?.list.length){
      list.value = res.data.data.list;
    }
    update(list.value);
    return res.data.data;
  }
  return {
    list, update,select, actIndex,fetch,
  };
});
export const useAotPickerStore = defineStore('AccountPicker', () => {
  var account=useAccountStore();
  var visible = ref(false);
  var list=ref([]);
  function show() {
    visible.value = true;
  }
  function hide(confirm=false) {
    visible.value = false;
    cb(confirm?list.value:[]);
  }
  function update(data){
    list.value = data;
  }
  var cb;
  function select(){
    return new Promise((resolve)=>{
      cb=resolve;
      show();
    })
  }
  return {
    visible, show, hide,account,list,update,select};
});
// webpack HMR
if (import.meta.webpackHot) {
  // dog('piniaStore HMR', import.meta.webpackHot, acceptHMRUpdate(useHydrateStore, import.meta.webpackHot));
  import.meta.webpackHot.accept(acceptHMRUpdate(useHydrateStore, import.meta.webpackHot));
  import.meta.webpackHot.accept(acceptHMRUpdate(useAccountStore, import.meta.webpackHot));
  import.meta.webpackHot.accept(acceptHMRUpdate(useAotPickerStore, import.meta.webpackHot));
}
