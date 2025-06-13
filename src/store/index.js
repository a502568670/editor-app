import { createStore } from 'vuex';
import { loginByUsername, loginByUsernameSimple, logout, getUserInfo } from '@/api/login'
import { listAccount, removeAccount } from "@/api/account"
import { removeToken, setToken, getToken } from '@/utils/auth'
import { newGetconfig } from '@/api/config'
import { setAccesstoken } from '@/api/posts';
export default createStore({
  state() {
    return {
      config: {},
      user: {},
      token: '',
      accounts: {
        list: [],
        total: 0,
      }
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
    async ListAccounts({ commit, state }, {page = 1, num = 100} = {page: 1, num: 100}) {
      const response = await listAccount({ page, num })
      console.info("SET_ACCOUNTS", response.data.data)
      commit('SET_ACCOUNTS', response.data.data)
    },
    async DelAccount({commit,state},wechat_id=0){
      await removeAccount({wechat_id})
      var {list,total}=state.accounts
      total--
      list=list.filter(v=>v.wechat_id!==wechat_id)
      commit('SET_ACCOUNTS',{list,total})
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
        commit('setUser', {})
        resolve()
      })
    }
  },
  getters: {
    all_accounts: (state) => state.accounts,
  },
});
