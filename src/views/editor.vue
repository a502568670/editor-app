<template>
  <div class="main bg-slate-300" style="border: 1px solid #ccc; background-color:#e9f9f1">
    <div class="left basis-1/4 p-2" >
        <div class="bg-white  shadow-xl">
          <div @click="loadArticle(item)" v-for="(item, index) in mp_msgsRef" :key="item.msg_id"
            class="flex items-center p-2 border-b w-full">
            <div v-if="index === 0"
              :style="{ '--image-url': 'url(' + item.cdn_url + ')' }"
              class='w-full flex h-40 items-end bg-no-repeat bg-center bg-cover bg-[image:var(--image-url)]'
              :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }"
              >
              <div class="flex text-white p-1">{{ item.title }}</div>
            </div>
            <div class="w-full flex h-20 items-center p-1"
            :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }"
            v-else>
              <div class="flex flex-col flex-1 h-full">
                <div class="flex-1 h-2/3">{{ item.title }}</div>
                <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div>
              </div>
              <img class="w-10 h-10 rounded-sm" :src="item.cdn_url" />
            </div>
          </div>
          <div  class="w-full flex h-20 items-center p-1 justify-center " >
              <div @click="newArticle()"  class="cursor-pointer">+新建文章</div>
          </div>
        </div>
    </div>
    <div class="right flex-1">
        <div class="wrapper">
          <div class="block-area" >
            <!-- <button @click="insertText" style="padding:4px;margin-bottom:2px;">导入url</button> -->
            <el-input v-model="extractUrlRef" clearable style="width: 400px;" placeholder="请输入文章提取地址" />
            <button @click="extractLinkToArticle" style="padding:4px;margin-bottom:2px;">立即提取</button>
          </div>
          
          <div class="block-area" >
            <label>标题</label>
            <el-input v-model="currentArticleRef.title" clearable style="width: 200px;" placeholder="请输入文章标题" />
            <label>作者</label>
            <el-input v-model="currentArticleRef.author" clearable style="width: 200px;" placeholder="请输入文章作者" />
          </div>
          <div class="block-area">
            <label>封面图</label>
            <div v-if="currentArticleRef.cdn_url" :style="{ '--image-url': 'url(' + currentArticleRef.cdn_url + ')' }"
            class='w-[100px] flex h-16 bg-no-repeat bg-center bg-cover bg-[image:var(--image-url)]'
            ></div>
            <!-- <img v-if="currentArticleRef.cdn_url" :src="currentArticleRef.cdn_url" referrerpolicy="no-referrer"> -->
            <input @change="handleImage" class="custom-input" type="file" accept="image/*">
          </div>
          <Toolbar style="border-bottom: 1px solid #ccc;" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
      </div>

      <!-- <hr style="margin-top: 100px;" /> -->
      <Editor style="margin-top: 200px; height: 500px; border:solid 1px #ccc; overflow-y: hidden;" v-model="currentArticleRef.content_noencode" :defaultConfig="editorConfig" :mode="mode"
        @onCreated="handleCreated" />
      <div class="block-area save-area" >
        <el-select  v-model="selectedAccount" :style="{'max-width': '200px'}" value-key="id"
        clearable filterable placeholder="选择发布公众账号" @input="emitInput" @change="emitChange">
          <el-option
            v-for="(item) in accountsRef"
            :key="item.id"
            :label="item.name"
            :value="item"
            
          />
        </el-select>
        <div>&nbsp;</div>
        <el-button @click="saveArticle" type="primary" >保存文章</el-button>
        <!-- <button @click="saveArticle" style="padding:4px;margin-bottom:2px;">保存文章</button> -->
      </div>
    </div>
  </div>
</template>
<style>
.main{
  display: flex;
  border: 1px solid #ccc; background-color:white;
}
.left {
  width:200px;
}
.wrapper {
  display: flex;
  align-items: start;
  flex-direction: column;
  width: 100%;
  margin-top:30px;
  position:fixed;
  top: 30px;
  z-index: 1000;
  background-color: white;
  opacity: 1;
  padding-top: 1px;
  border-top: solid 1px #ccc
}
.block-area{
  display: flex;
  align-items: center;
  justify-content: start;
  flex-direction: row;
  padding: 5px;
  width: 100%;
}
.block-area > label {
  margin: 0 5px;
}
.save-area {
  position:fixed;
  bottom: 0;
  z-index: 1000;
  background-color: white;
  opacity: 1;
}
.w-e-text-container [data-slate-editor] p:has(:not(span)){
  padding:0;
  margin:2px;
  line-height:0;
}
</style>
<script>
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { listAccount } from '@/api/account'
import {saveArticleDraft, listArticlesByAppMsg} from "@/api/article"
import { getArticleContent, getArticleContent2 } from '@/api/jzl'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { DomEditor } from '@wangeditor/editor';
import { ElMessage,ElMessageBox } from 'element-plus'
// import { IButtonMenu, IDomEditor, Boot } from '@wangeditor/editor'
// import SelectAccount from "../components/selectAccount";
console.log("====enter editor====")

export default {
  components: { Editor, Toolbar,  },

  setup() {
    console.log("window", window.envVars)
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // mp_msgs
    const msg_idRef = ref(0)
    const mp_msgsRef = ref([])
    const appmsgidRef = ref(100000115)

    // 文章内容
    const currentArticleRef = ref({
      title: "",
      author: "parker",
      copyright_type: 0,
      cdn_url: "",
      desc: "",
      content_noencode: "<section>hello</section>",
    })
    // const titleRef = ref("")
    // const authorRef = ref("parker")

    // 封面
    const cdnRef = ref(null)

    // 账号
    let selectedAccount = ref(null)
    let accountsRef = ref([])

    // 内容 HTML
    // const valueHtml = ref('<section>hello</section>') //<section>hello</section>
    const extractUrlRef = ref("https://mp.weixin.qq.com/s/ECdk1kmW2FYNY6EaXZTYGQ")
    
    // 模拟 ajax 异步获取内容
    onMounted(async () => {
//       setTimeout(() => {
//         // valueHtml.value = '<p>模拟 Ajax 异步设置内容</p>'
//         valueHtml.value = `<section><img
//                   data-ratio="1.737037037037037"
//                   src="https://mmbiz.qpic.cn/sz_mmbiz_jpg/I5RHldhvmKmffAQ3F7YCb7Zib3fnrnXxnhncicZLQyILtsWfAV25rVia2OhXtJRWNQIM14I0iaCOQSayL5A6iciaJJhA/640?wx_fmt=jpeg"
//                   data-type="jpg" data-w="1080" /></section>
// `
//       }, 1500)
        listArticles()
        listAccount().then(response => {
          // accountsRef.value = [...response.data.data.list]
          accountsRef.value = response.data.data.list
          console.log("load accounts:", accountsRef.value)
          if (accountsRef.value.length >0) {
            selectedAccount.value = accountsRef.value[0];
            setImageUploadConfig()
          }
        })
    })


    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value
      if (editor == null) return
      editor.destroy()
    })

    
    const toolbarConfig = {
      excludeKeys: [
        'bold', // 排除菜单组，写菜单组 key 的值即可
      ],
    };

    const editorConfig = { placeholder: '请输入内容...', MENU_CONF: {}, htmlSanitize: false };

    editorConfig.MENU_CONF['uploadImage'] = {
      server: envVars.backend_url + '/upload-editor-image',
      fieldName: 'editor_img',
      // meta: {
      //   token: 'xxx',
      //   cookies: 'yyy',
      // },
      // 单个文件上传成功之后
      onSuccess(file, res) {
        // TS 语法
        // onSuccess(file, res) {          // JS 语法
        console.log(`${file.name} 上传成功`, res)

        ElMessage({
          message: `${file.name} 上传成功`,
          type: 'success',
          duration: 2 * 1000
        })
      },

      // 单个文件上传失败
      onFailed(file, res) {
        // TS 语法
        // onFailed(file, res) {           // JS 语法
        console.log(`${file.name} 上传失败`, res)
        ElMessage({
          message: `${file.name} 上传失败`,
          type: 'error',
          duration: 2 * 1000
        })
      },

      // 上传错误，或者触发 timeout 超时
      onError(file, err, res) {
        // TS 语法
        // onError(file, err, res) {               // JS 语法
        console.log(`${file.name} 上传出错`, err, res)
        ElMessage({
          message: `${file.name} 上传出错`,
          type: 'error',
          duration: 2 * 1000
        })
      },
    };

    const setImageUploadConfig = () => {
      const {token, name, session_id} = selectedAccount.value
      const cookies = serializeCookie(JSON.parse(session_id)["cookie"])

      const config = editorRef.value.getConfig()
      config.MENU_CONF.uploadImage.meta = { 
          cookies,
          token: parseInt(token),
      } 
      // editorConfigRef.value.MENU_CONF['uploadImage'] = {
      //   ...editorConfigRef.value.MENU_CONF['uploadImage'],
      //   meta: {
      //     cookies,
      //     token: parseInt(token),
      //   }
      // }
      console.log("config.MENU_CONF.uploadImage=>", config.MENU_CONF.uploadImage)
    }

    const handleCreated = (editor) => {
      editorRef.value = editor // 记录 editor 实例，重要！
    }

    const insertText = () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      editor.insertText('hello world'); // 执行 editor API
      const toolbar = DomEditor.getToolbar(editor);
      // console.log('toolbar=>', toolbar, toolbarConfig);
      const curToolbarConfig = toolbar.getConfig();
      console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组
      console.log('menuconfig=>', editor.getMenuConfig('uploadImage'));
    };

    const extractLinkToArticle = async () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      // console.log("导入url=>", extractUrlRef)
      const v = await getArticleContent2(extractUrlRef.value)
      // console.log("v=>", v)
      const {content_noencode, title, nick_name, copyright_stat, cdn_url} = v.data
      console.log("v.data=>", v.data)
      // console.log('rawExtractContent=>', rawExtractContent)
      // const reg1 = /<section/g, reg2 = /section>/g, reg3 = /data-src/g, reg4 = /&quot;/g
      // const replaceTag = "span"
      // const extractContent = content_noencode
        // .replaceAll(reg1, `<${replaceTag}`)
        // .replaceAll(reg2, `${replaceTag}>`)
        // .replaceAll(reg3, "src")
        // .replaceAll(reg4, "");
      // console.log("extractContent=>", extractContent);


      // titleRef.value = title
      // authorRef.value = nick_name
      // valueHtml.value = "<p>" + extractContent + "<p>"

      currentArticleRef.value = {
        ...currentArticleRef.value,
        content_noencode: "<p class='extractContent'>" + content_noencode + "<p>",
        title,
        author: nick_name, 
        copyright_type: copyright_stat,
        cdn_url,
      }
      
    }

    const listArticles = async () => {
      mp_msgsRef.value = await listArticlesByAppMsg(appmsgidRef.value).then(response => {
        return response.data;
      })
      console.log("mp_msgsRef.value=>", mp_msgsRef.value)
    }

    const loadArticle = (mp_msg) => {
      msg_idRef.value = mp_msg.msg_id
      appmsgidRef.value = mp_msg.appmsgid
      currentArticleRef.value = {
        ...mp_msg,
      }
    }
    const newArticle = () => {
      msg_idRef.value = 0
      currentArticleRef.value ={
        title: "",
        author: "parker",
        copyright_type: 0,
        cdn_url: "",
        desc: "",
        content_noencode: "",
      }
    }

    const serializeCookie = (arr) => {
      const items = []
      arr.forEach((v) => {
        items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
      });
      // console.log("items=>", items)
      return items.join(";")
    }

    const validateArticleData = () => {
      if (!currentArticleRef.value.title.trim()) {
        ElMessageBox.alert('标题不能为空', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
        return false;
      }
      if (!currentArticleRef.value.author.trim()) {
        ElMessageBox.alert('作者不能为空', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
        return false;
      }
      if (mp_msgsRef.value.length >= 8 && msg_idRef.value === 0) {
        ElMessageBox.alert('超出单消息最大文章数8篇', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
        return false;
      }

      return true
    }

    const saveArticle = async() => {
      if (!validateArticleData()) {
        return
      }

      const {token, name, session_id, wechat_id} = selectedAccount.value
      // const saveContent = currentArticleRef.value.content_noencode
      console.log("token:", token)
      console.log("name:", name)
      console.log("wechat_id:", wechat_id)
      const msg_id = msg_idRef.value
      const appmsgid = appmsgidRef.value 
      console.log("msg_id", msg_id)
      console.log("appmsgid", appmsgid)
      
      // console.log("content_noencode:", currentArticleRef.value.content_noencode)
      

      // console.log("cookie:", serializeCookie(JSON.parse(session_id)["cookie"]))
      const postData = {
        cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
        token: parseInt(token),
        wechat_id,
        appmsgid,
        msg_id,
        material_list: [{
          ...currentArticleRef.value
        }],
        // material_list: [{
        //     content_noencode: currentArticleRef.value.content_noencode,
        //     // cdn_url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/4WT2I2qqeFAibhrnd1BP6uhtX6Y395tHhMxfXaJrWW5w8JpQibmicJCqfdGL1uWQErUlUVyScV2bs59oj9rhicnTaQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=13&tp=wxpic",
        //     cdn_url: "",
        //     desc: "",
        //     title: titleRef.value,
        //     author: authorRef.value,
        //     copyright_type: 0
        //   }],
        ...cdnRef.value
      }
      console.log("postData=>", postData)
      const res = await saveArticleDraft(postData)
      console.log("res=>", res)
      await listArticles()
      // 暂时从前端提交
      //   window.ipcRenderer.send('toMain', {
      //   tag: 'saveArticleDraft',
      //   content: postData
      // })
    }

    const emitInput = (val) => {
      // this.$emit('input', val)
    }
    const emitChange = (val) => {
      // console.log("emitChange=>", val)
      selectedAccount.value = val;
      setImageUploadConfig()
      print("editorConfigRef=>", editorConfigRef.value)
      // console.log("selectedAccount=>", selectedAccount)
      // this.$emit('change', val)
    }

    const createBase64Image = (fileObject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const cover = e.target.result;
        console.log("e", e)
        console.log("e.target", e.target)
        // console.log("cover:", cover);
        const matches = cover.match(/data:(image\/.*);base64,(.*)/);
        if (matches && matches.length >= 3) {
          const cdn_content_type = matches[1];  // 图像MIME类型 (image/webp)
          const cdn_base64_image = matches[2]; // Base64编码数据
         
          console.log("cdn_content_type:", cdn_content_type);
          console.log("cdn_base64_image:", cdn_base64_image);
          cdnRef.value = {cdn_content_type, cdn_base64_image}

        } else {
          ElMessage({
            message: '无效的图片',
            type: 'error',
            duration: 2 * 1000
          })
        }
        // console.log('image_base64:',cover.value)
        // this.uploadImage();
      };
      reader.readAsDataURL(fileObject);
    }

    const handleImage = (e) => {
      const selectedImage = e.target.files[0]; // get first file
      createBase64Image(selectedImage);
    }
    

    return {
      msg_idRef,
      // titleRef,
      // authorRef,
      currentArticleRef,
      mp_msgsRef,
      accountsRef,
      selectedAccount,
      editorRef,
      extractUrlRef,
      mode: 'default', // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated,
      insertText,
      extractLinkToArticle,
      loadArticle,
      newArticle,
      saveArticle,
      emitInput,
      emitChange,
      handleImage,
    }
  },
}
</script>