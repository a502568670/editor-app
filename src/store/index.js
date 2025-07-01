import { createStore } from 'vuex';
import { loginByUsername, loginByUsernameSimple, logout, getUserInfo } from '@/api/login'
import { listAccount, removeAccount } from "@/api/account"
import { removeToken, setToken, getToken } from '@/utils/auth'
import { newGetconfig } from '@/api/config'
import { removeAccesstoken, setAccesstoken } from '@/api/posts';
import { checkWxSession } from '@/utils/cookie';
export default createStore({
  state() {
    return {
      config: {},
      user: {},
      token: '',
      accounts: {
        list: [],
        total: 0,
      },
      account_orders: [],
    };
  },
  mutations: {
    SET_CONFIG: (state, config) => {
      state.config = config
    },
    SET_TOKEN: (state, token) => {
      setToken(token)
      state.token = token
    },
    setUser(state, u) {
      state.user = u;
    },
    SET_ACCOUNTS: (state, accounts) => {
      state.accounts = accounts
    },
    SET_ACCOUNT_ORDERS: (state, account_orders) => {
      state.account_orders = account_orders
    }
  },
  actions: {
    // 获取配置
    GetConfig({ commit, state }) {
      return new Promise((resolve, reject) => {
        if (state.config && Object.keys(state.config).length > 0) {
          resolve(state.config)
          return
        }
        newGetconfig().then(response => {
          const data = response.data.data
          commit('SET_CONFIG', data)
          resolve(data)
        }).catch(err => {
          reject(err)
        })
      })
    },
    // 用户名登录
    LoginByUsername({ commit }, userInfo) {
      const username = (userInfo.username || '').trim()
      return new Promise((resolve, reject) => {
        loginByUsername(username, userInfo.password, userInfo.captcha, userInfo.code).then(response => {
          console.info(response.data.data.token)
          commit('SET_TOKEN', response.data.data.token)
          resolve(response.data.data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    // 用户名登录
    LoginByUsernameSimple({ commit, state }, userInfo) {
      const username = (userInfo.username || '').trim()
      return new Promise((resolve, reject) => {
        loginByUsernameSimple(username, userInfo.password).then(response => {
          // console.info(response.data.data.token)
          commit('SET_TOKEN', response.data.data.token)
          // console.log("commit SET_TOKEN =>response.data.data.token", state)
          resolve(response.data.data)
        }).catch(error => {
          console.log("error=>", error)
          reject(error)
        })
      })
    },

    // 分页获取账号数据(目前按照100条先不分页)
    async ListAccounts({ commit, state, dispatch }, { page = 1, num = 500 } = { page: 1, num: 500 }) {
      const response = await listAccount({ page, num })
      console.info("SET_ACCOUNTS", response.data.data)
      response.data.data.list?.forEach(v => v.expired = checkWxSession(v.session_id))
      commit('SET_ACCOUNTS', response.data.data)
      const account_orders = localStorage.getItem("account_orders")
      if (!account_orders) {
        console.log("==SaveAccountOrders== in ListAccounts")
        dispatch('SaveAccountOrders', response.data.data)
      } else {
        if (state.account_orders.length === 0) {
          console.log("account_orders:", typeof account_orders, account_orders)
          commit('SET_ACCOUNT_ORDERS', account_orders.split(",").map(id => parseInt(id)))
        }
      }
    },
    async DelAccount({ commit, state }, wechat_id = 0) {
      await removeAccount({ wechat_id })
      var { list, total } = state.accounts
      total--
      list = list.filter(v => v.wechat_id !== wechat_id)
      commit('SET_ACCOUNTS', { list, total })
    },
    async SaveAccountOrders({ commit, state }, { list }) {
      if (list.length > 0) {
        const account_orders = list.map(v => v.id)
        console.log("new account_orders=>", account_orders)
        commit('SET_ACCOUNT_ORDERS', account_orders)
        localStorage.setItem("account_orders", account_orders)
      }
    },
    // 获取用户信息
    GetUserInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getUserInfo().then(response => {
          const data = response.data.data
          commit('setUser', data)
          setAccesstoken()
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    },
    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        removeToken()
        removeAccesstoken()
        commit('setUser', {})
        resolve()
      })
    }
  },
  getters: {
    all_accounts: (state) => state.accounts,
    account_orders: (state) => state.account_orders,
  },
});
