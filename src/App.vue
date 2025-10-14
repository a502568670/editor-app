<!--
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 16:14:15
 * @LastEditors:
 * @LastEditTime: 2023-05-22 16:13:14
-->
<template>
  <router-view v-slot="{ Component }">
    <!-- <component v-if="$route.name === 'tabBar'" :is="Component" /> -->
    <transition enter-active-class="motion-safe:transition-opacity-300 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="motion-safe:transition-opacity-300 ease-in"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <component :is="Component" />
    </transition>
  </router-view>
  <account-picker />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import AccountPicker from './components/AccountPicker.vue'
import { useAccountStore } from './store/piniaStore';
import { dog } from './utils'
import { getToken } from './utils/auth';
import { useStore } from 'vuex';


var account=useAccountStore()
var store=useStore()


onMounted(async ()=>{
  if(getToken()){
    var {list}=store.state.accounts
    if(list.length){
      account.update(list)
    }else{
      var res=await account.fetch()
      store.commit('SET_ACCOUNTS', res)
    }
    dog('App account', account.list)
  }
})
import { IButtonMenu, IDomEditor } from '@wangeditor/editor';
import { Boot } from '@wangeditor/editor';

class MyButtonMenu {
  // TS 语法
  // class MyButtonMenu {                       // JS 语法

  cconstructor() {
    this.title = 'My menu title' // 自定义菜单标题
    // this.iconSvg = '<svg>...</svg>' // 可选
    this.tag = 'button'
  }

  // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
  getValue(editor) {
    // TS 语法
    // getValue(editor) {                              // JS 语法
    return ' hello '
  }

  // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
  isActive(editor) {
    // TS 语法
    // isActive(editor) {                    // JS 语法
    return false
  }

  // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
  isDisabled(editor) {
    // TS 语法
    // isDisabled(editor) {                     // JS 语法
    return false
  }

  // 点击菜单时触发的函数
  exec(editor, value) {
    // TS 语法
    // exec(editor, value) {                              // JS 语法
    if (this.isDisabled(editor)) return
    editor.insertText(value) // value 即 this.value(editor) 的返回值
  }
}

const menu1Conf = {
  key: 'menux', // 定义 menu key ：要保证唯一、不重复（重要）
  factory() {
    return new MyButtonMenu(); // 把 `YourMenuClass` 替换为你菜单的 class
  },
};
// console.log("Boot.registerMenu", menu1Conf)
// Boot.registerMenu(menu1Conf);

</script>
<style>
body::-webkit-scrollbar {
  display: none;
}

div::-webkit-scrollbar {
  display: none;
}
</style>
