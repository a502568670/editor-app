<template>
  <div class="login-container" :style="{'background-image':`url('${bg}')`}">
    <div v-if="type=='login'" class="login-form">
      <el-form ref="loginForm" :model="loginForm" :rules="loginRules" auto-complete="on" label-position="left">
        <div class="title-container">
          <div style="font-size: 36px; font-weight: bold; color:#0B0B0B; line-height: 72px;text-align: center;">登录</div>
        </div>
          <el-form-item prop="username" style="margin-top: 30px;">
            <el-input v-model="loginForm.username" name="username" tabindex="1" autocomplete="on" placeholder="登录手机号">
            </el-input>
          </el-form-item>

          <el-form-item prop="password" style="margin-top: 10px;">
            <el-input v-model="loginForm.password" type="password" name="password" autocomplete="on" tabindex="2" show-password placeholder="登录密码" @keyup.enter="handleLogin">
            </el-input>
          </el-form-item>
        <el-form-item>
          <div>
            <el-checkbox label="记住密码" v-model="jzmm" />
          </div>
          <div style="width: 100%">
            <el-button  :loading="loading" type="success" style="width: 100%; height:46px; display: flex; align-items: center; justify-content: center; background-color: #2cc47d; border-color: #2cc47d;" @click.prevent="handleLogin">登录</el-button>
          </div>
          <!-- <div style="display:flex;align-items: center;justify-content: space-between;width: 100%;margin-top: 10px;">
            <span @click="type='password'">忘记密码</span>
            <span @click="type='register'">注册</span>
          </div> -->
        </el-form-item>
      </el-form>
    </div>
    <div v-if="type=='register'" class="login-form" style="padding-bottom:20px;">
      <el-form ref="registerForm" :model="loginForm" :rules="registerRules" auto-complete="on" label-position="left">
        <div class="title-container">
          <div style="font-size: 36px; font-weight: bold; color:#0B0B0B; line-height: 72px;text-align: center;">注册</div>
        </div>
        <el-form-item prop="username" style="margin-top: 30px;">
          <el-input v-model="loginForm.username" name="username" tabindex="1" autocomplete="on" placeholder="请输入登录手机号">
          </el-input>
        </el-form-item>
        <el-form-item prop="code" style="margin-top: 10px;">
          <div style="display: flex;align-items: center">
            <el-input v-model="loginForm.code" name="code" tabindex="1" autocomplete="on" placeholder="验证码">
            </el-input>
            <el-button :disabled="djs>0" @click="send_sms(1)" style="margin-left: 5px;background-color: #2cc47d; border-color: #2cc47d;color: #FFF">{{djs==0? '获取验证码':djs+'秒后获取'}}</el-button>
          </div>
        </el-form-item>
        <el-form-item prop="password" style="margin-top: 10px;">
          <el-input v-model="loginForm.password" type="password" name="password" autocomplete="on" tabindex="2" show-password placeholder="登录密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="r_password" style="margin-top: 10px;">
          <el-input v-model="loginForm.r_password" type="password" name="password" autocomplete="on" tabindex="3" show-password placeholder="确认密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="checked">
          <el-checkbox v-model="loginForm.checked">我已阅读并同意</el-checkbox><span style="color: #5473E8; cursor: pointer;" @click="dialogVisible = true"> 《用户协议》</span>
        </el-form-item>
        <el-form-item>
          <div style="width: 100%">
            <el-button  :loading="loading" type="success" style="width: 100%; height:46px; display: flex; align-items: center; justify-content: center; background-color: #2cc47d; border-color: #2cc47d;" @click.prevent="register">注册</el-button>
          </div>
        </el-form-item>
        <div style="text-align: right">
          <span @click="type='login'">已有账号，去登录</span>
        </div>
      </el-form>
    </div>
    <div v-if="type=='password'" class="login-form" style="padding-bottom:20px;">
      <el-form ref="modifypasswordForm" :model="loginForm" :rules="modifypasswordRules" auto-complete="on" label-position="left">
        <div class="title-container">
          <div style="font-size: 36px; font-weight: bold; color:#0B0B0B; line-height: 72px;text-align: center;">忘记密码</div>
        </div>
        <el-form-item prop="username" style="margin-top: 30px;">
          <el-input v-model="loginForm.username" name="username" tabindex="1" autocomplete="on" placeholder="请输入登录手机号">
          </el-input>
        </el-form-item>
        <el-form-item prop="code" style="margin-top: 10px;">
          <div style="display: flex;align-items: center">
            <el-input v-model="loginForm.code" name="code" tabindex="1" autocomplete="on" placeholder="验证码">
            </el-input>
            <el-button :disabled="djs>0" @click="send_sms(2)" style="margin-left: 5px;background-color: #2cc47d; border-color: #2cc47d;color: #FFF">{{djs==0? '获取验证码':djs+'秒后获取'}}</el-button>
          </div>
        </el-form-item>
        <el-form-item prop="password" style="margin-top: 10px;">
          <el-input v-model="loginForm.password" type="password" name="password" autocomplete="on" tabindex="2" show-password placeholder="登录密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="r_password" style="margin-top: 10px;">
          <el-input v-model="loginForm.r_password" type="password" name="password" autocomplete="on" tabindex="3" show-password placeholder="确认密码">
          </el-input>
        </el-form-item>
        <el-form-item>
          <div style="width: 100%">
            <el-button  :loading="loading" type="success" style="width: 100%; height:46px; display: flex; align-items: center; justify-content: center; background-color: #2cc47d; border-color: #2cc47d;" @click.prevent="modifypassword">确定</el-button>
          </div>
        </el-form-item>
        <div style="text-align: right">
          <span @click="type='login'">返回</span>
        </div>
      </el-form>
    </div>
    <el-dialog
      title="用户授权协议"
      v-model="dialogVisible"
      width="50%"
      :show-close="false"
      :close-on-click-modal="false"
    >
<!--      <iframe :src="htmlSrc" width="100%" height="500px"></iframe>-->
      <div v-html="htmlSrc">

      </div>
      <template #footer>
      <span  class="dialog-footer">
        <el-button @click="dialogVisible = false; loginForm.checked = false;">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false; loginForm.checked = true;">确 定</el-button>
      </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {send_sms,register, registerSimple,modifypassword} from '@/api/login'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from "axios";
let store;
let router;
export default {
  name: 'Login',
  setup() {
     store = useStore()
     router = useRouter();
  },
  data() {
    const validateChecked = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请先阅读并同意《用户协议》。'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('管理员密码长度应大于6'))
      } else {
        callback()
      }
    }
    const init_username = localStorage.getItem("username")
    const init_password  = localStorage.getItem("password")
    return {
      dialogVisible: false,
      htmlSrc:'',
      bg:'',
      type:'login',
      jzmm:true,
      loginForm: {
        username: init_username,
        password: init_password,
        r_password:'',
        checked:false,
        code: ''
      },
      loginRules: {
        username: [{ required: true, message: '手机号不允许为空', trigger: 'blur' }],
        password: [
          { required: true, message: '密码不允许为空', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ]
      },
      registerRules: {
        checked:[{ validator: validateChecked, trigger: 'blur' }],
        username: [{ required: true, message: '手机号不允许为空', trigger: 'blur' }],
        code: [{ required: true, message: '验证码不允许为空', trigger: 'blur' }],
        password: [
          { required: true, message: '密码不允许为空', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ],
        r_password: [
          { required: true, message: '密码不允许为空', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ]
      },
      modifypasswordRules: {
        username: [{ required: true, message: '手机号不允许为空', trigger: 'blur' }],
        code: [{ required: true, message: '验证码不允许为空', trigger: 'blur' }],
        password: [
          { required: true, message: '密码不允许为空', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ],
        r_password: [
          { required: true, message: '密码不允许为空', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ]
      },
      djs:0,
      loading: false
    }
  },
  created() {
    store.dispatch('GetConfig').then(() => {
      this.bg=store.state.config?.home_bg
      this.htmlSrc=store.state.config?.register_agree
    })
  },

  methods: {
    async handleLogin() {
      await this.$refs.loginForm.validate(valid => {
        if (valid && !this.loading) {
          this.loading = true
          // console.log('this.loginForm=>', this.loginForm)
          store.dispatch('LoginByUsernameSimple', this.loginForm).then(response => {
            // console.log('LoginByUsernameSimple response=>', response)
            if(this.jzmm){
              localStorage.setItem("username",this.loginForm.username)
              localStorage.setItem("password",this.loginForm.password)
            }
            this.loading = false
            // router.push({ path: '/home' })
            router.push({ path: '/home', replace: true });
          }).catch(response => {
            console.info(response)
            if(response.data?.msg) {
              this.$notify.error({
                title: '失败',
                message: response.data.msg
              })
            }
            this.loading = false
          })
        } else {
          return false
        }
      })
    },
    async handleLogin2() {
      try {
        // 显示加载状态
        this.isLoading = true;

        // 构建请求参数
        const params = new URLSearchParams();
        params.append('username', this.loginForm.username.trim());
        params.append('password', this.loginForm.password.trim());

        // 发送登录请求
        const { data } = await axios.post(
          'http://127.0.0.1:8000/login/login',
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 10000,
            validateStatus: (status) => status < 500 // 处理500以下状态码
          }
        );

        // 处理业务逻辑
        if (data.code == 1) {
          console.log('✅ 登录成功:', data.message);

          // 存储token（如果需要）
          if (data.data?.token) {
            localStorage.setItem("auth_token", data.data.token);
            
          }

          // 跳转首页
          await router.push({ path: '/home', replace: true });
        } else {
          console.warn('⚠️ 登录失败:', data.message);
          this.$message.error(data.message || '登录失败'); // 使用UI框架提示
          await router.push('/login');
        }
      } catch (error) {
        // 异常处理
        console.error('🛑 请求异常:', error);

        const errorMessage = error.response?.data?.message
          || error.message
          || '请求异常，请检查网络';

        this.$message.error(errorMessage);
        await router.push('/login');
      } finally {
        // 关闭加载状态
        this.isLoading = false;
      }
    },


    // async handleLogin() {
    //   const params = new URLSearchParams();
    //   params.append('username', this.loginForm.username);
    //   params.append('password', this.loginForm.password);
    //
    //   const { data } = await axios.post('http://127.0.0.1:8002/user/login', params, {
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded'
    //     },
    //     timeout: 10000 // 10秒超时
    //   });
    //
    //   // localStorage.setItem("token", data.token)//
    //   await router.push('/home'); // 等待路由跳转完成
    // },



    send_sms(type){
      send_sms({
        mobile:this.loginForm.username,
        type:type
      }).then(response => {
        this.djs=120
       let s= setInterval(()=>{
          this.djs--
         if(this.djs<=0){
           clearInterval(s)
           this.djs=0
         }
        },1000)
        this.$notify.success({
          title: '成功',
          message: '发送成功'
        })
      }).catch(response => {
        this.$notify.error({
          title: '失败',
          message: response.data.msg
        })
      })
    },
    register(){
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          registerSimple({
            mobile:this.loginForm.username,
            password:this.loginForm.password,
            r_password:this.loginForm.r_password,
            // code:this.loginForm.code
          }).then(response => {
            this.type='login';
            this.$notify.success({
              title: '成功',
              message: '注册成功'
            })
          }).catch(response => {
            this.$notify.error({
              title: '失败',
              message: response.data.msg
            })
          })
        } else {
          return false
        }
      })
    },
    modifypassword(){
      this.$refs.modifypasswordForm.validate(valid => {
        if (valid) {
          modifypassword({
            mobile:this.loginForm.username,
            password:this.loginForm.password,
            r_password:this.loginForm.r_password,
            code:this.loginForm.code
          }).then(response => {
            this.type='login';
            this.$notify.success({
              title: '成功',
              message: '密码修改成功'
            })
          }).catch(response => {
            this.$notify.error({
              title: '失败',
              message: response.data.msg
            })
          })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style  scoped>

.login-container {
  background-repeat: no-repeat;
  position: relative;
  height: 100vh;
  width: 100%;
  background-color: #EAEAEA;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 300px;
}

.login-form {
  display: flex;
  height: auto;
  width: 400px;
  background: #FFFFFF;
  box-shadow: 0px 0px 9px rgba(198, 198, 198, 0.75);
  border-radius: 0px;
  justify-content: center;
}

.svg-container {
  color: #D3D3D3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  width: 46px;
}

.title-container {
  position: relative;
  text-align: center;
  height: 60px;
}
.title {
  font-size: 2rem;
  color: #262626;
  letter-spacing: 10px;
  margin: 0px auto 40px auto;
  text-align: center;
  font-weight: bold;
}
</style>

