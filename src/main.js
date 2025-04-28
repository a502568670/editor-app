/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-29 16:14:15
 * @LastEditors:
 * @LastEditTime: 2023-05-22 17:02:20
 */
import {createApp} from 'vue'
import App from './App.vue'
import store from './store'
import {createRouter, createWebHashHistory} from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import './assets/styles/global.css'
import Layout from '@/layout/index.vue'
import Home from '@/layout/home.vue'
import {getToken} from "./utils/auth";

let app=createApp(App)
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
          component:Home,
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
          path: '/tabbar',
          name: 'tabBar',
          component: () => import('./views/tabBar')
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
      next({ path: '/home' })
    } else {
      store.dispatch('GetUserInfo').then(res => { // 拉取user_info
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


