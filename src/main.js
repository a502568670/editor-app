/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 16:14:15
 * @LastEditors:
 * @LastEditTime: 2023-05-22 17:02:20
 */
import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import Layout from '@/layout/index.vue'
import Home from '@/layout/home.vue'
import { getToken, removeToken } from "./utils/auth";
import CKEditor from '@mayasabha/ckeditor4-vue3';
import VueUeditorWrap from 'vue-ueditor-wrap';
import { createPinia } from 'pinia'
import { Icon } from '@iconify/vue';
// 引入全局css
import '@/style/index.css'

let app = createApp(App)
app.component('Icon', Icon);
app.use(CKEditor);
app.use(VueUeditorWrap);
app.use(createPinia())

// 创建router实例
const router = createRouter({
  history: createWebHashHistory(),
  store,
  routes: [
    {
      path: '/login',
      component: () => import('@/views/login/index'),
      hidden: true
    },
    {
      path: '/update',
      name: "update",
      component: () => import('@/views/update'),
      // hidden: true
    },
    {
      path: '/auth-redirect',
      component: () => import('@/views/login/authredirect'),
      hidden: true
    },
    {
      component: Layout,
      path: "/",
      children: [
        {
          path: '/home2',
          name: '首页',
          component: Home,
          children: [
            {
              path: "/home",
              name: "home",
              component: () => import("./views/home")
            },
            {
              path: "/account",
              name: "account",
              component: () => import("./views/account")
            },
            {
              path: "/user",
              name: "user",
              component: () => import("./views/user")
            },
            {
              path: "/group",
              name: "group",
              component: () => import("./views/group")
            },
            {
              path: "/platform",
              name: "platform",
              component: () => import("./views/platform") // 添加平台管理路由
            },
            {
              path: "official_account",
              name: "official_account",
              component: () => import("./views/official_account")//添加公众号管理路由
            }
          ],
        },
        {
          path: '/buyVip',
          name: 'buyVip',
          component: () => import('./views/buyVip')
        },
        {
          path: '/kf',
          name: 'kf',
          component: () => import('./views/kf')
        },
        {
          path: '/hot',
          name: 'hot',
          component: () => import('./views/hot')
        },
        {
          path: '/material_lib',
          name: 'material_lib',
          component: () => import('./views/material_lib')
        },
        {
          path: '/editor',
          name: 'editor',
          component: () => import('./views/editor')
        },
        {
          path: '/editor2',
          name: 'editor2',
          component: () => import('./views/editor2')
        },
        {
          path: '/editor3',
          name: 'editor3',
          component: () => import('./views/editor3')
        },
        {
          path: '/editor4',
          name: 'editor4',
          component: () => import('./views/editor4')
        },
        {
          path: '/stats',
          name: 'stats',
          component: () => import('@/views/stats/index.vue')
        },
        // {
        //   path: '/posts',
        //   name: 'posts',
        //   component: () => import('@/views/posts/index.vue')
        // },
        {
          path: '/tabbar',
          name: 'tabBar',
          component: () => import('./views/tabBar')
        },
        {
          path: '/file',
          name: 'file',
          component: () => import('./views/file')
        },
        {
          path: '/advanced-forward',
          name: 'advanced-forward',
          component: () => import('./views/advanced-forward')
        }
      ]
    }
  ]
});
const whiteList = ['/login', '/auth-redirect']// no redirect whitelist
store.dispatch('GetConfig')
router.beforeEach((to, from, next) => {
  if (getToken()) { // determine if there has token
    /* has token*/
    if (to.path === '/login') {
      // next({ path: '/home' })
      // next({ path: '/editor4' })
      if (localStorage.getItem("password")) {
        store.dispatch('ListAccounts').then(() => {
          // next({ path: '/editor4' })
          // next({ path: '/material_lib' })
          next({ path: '/tabbar' })
          // next({ path: '/editor3' })
        })
      } else {
        console.log("not remember password")
        removeToken()
        next()
      }
    } else {
      store.dispatch('GetUserInfo').then(res => { // 拉取user_info
        // console.log("GetUserInfo=>", res)
        next()
        //next({ ...to, replace: true })
      }).catch((err) => {
        store.dispatch('FedLogOut').then(() => {
          next({ path: '/login' })
        })
      })
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) { // 在免登录白名单，直接进入
      next()
    } else {
      next()
      // next('/login') // 否则全部重定向到登录页
    }
  }
})
app.use(router)
app.use(ElementPlus, { locale })
app.use(store)
app.mount('#app')

// import { Boot } from '@wangeditor/editor'

// class FormulaMenu {
//   constructor() {
//     this.title = '添加公式' // 自定义菜单标题
//     this.iconSvg = `你要显示按钮的svg代码` // 可选
//     this.tag = 'button'
//   }
//   // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
//   getValue(editor) {
//     return ''
//   }
//   // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
//   isActive(editor) {
//     return false
//   }
//   // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
//   isDisabled(editor) {
//     return false
//   }
//   // 点击菜单时触发的函数
//   exec(editor, value) {
//     if (this.isDisabled(editor)) return
//     //如果此时需要载入固定格式的文字，则在此处使用编辑器插入html方法
//     // editor.insertText(value) // value
//     //如果以上方法无法满足你的需求的话，则采用触发事件的形式。
//     editor.emit("formulaClick")
//   }

// }

// const latex = {
//   key: 'latex', // 定义 menu key ：要保证唯一、不重复（重要）
//   factory() {
//     return new FormulaMenu()
//   },
// }
// class MyButtonMenu {
//   // TS 语法
//   // class MyButtonMenu {                       // JS 语法
//   constructor() {
//     this.title = 'My menu title'; // 自定义菜单标题
//     // this.iconSvg = '<svg>...</svg>' // 可选
//     this.tag = 'button';
//   }
//   // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
//   getValue(editor) {
//     // TS 语法
//     // getValue(editor) {                              // JS 语法
//     return ' hello ';
//   }
//   // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
//   isActive(editor) {
//     // TS 语法
//     // isActive(editor) {                    // JS 语法
//     return false;
//   }
//   // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
//   isDisabled(editor) {
//     // TS 语法
//     // isDisabled(editor) {                     // JS 语法
//     return false;
//   }
//   // 点击菜单时触发的函数
//   exec(editor, value) {
//     // TS 语法
//     // exec(editor, value) {                              // JS 语法
//     if (this.isDisabled(editor))
//       return;
//     editor.insertText(value); // value 即 this.value(editor) 的返回值
//   }
// }
// const menu1Conf = {
//   key: 'mykey', // 定义 menu key ：要保证唯一、不重复（重要）
//   factory() {
//     return new MyButtonMenu() // 把 `YourMenuClass` 替换为你菜单的 class
//   },
// }

// const module = {
//   menus: [menu1Conf, latex],
// }
// console.log(module)
// Boot.registerModule(module)

