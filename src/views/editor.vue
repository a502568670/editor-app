<template>
  <div class="main bg-slate-300" style="border: 1px solid #ccc; background-color:#e9f9f1">
    <div class="left basis-1/4 p-2">
      <div class="flex h-10 space-x-2">
        <el-select v-model="selected_mp_msg_groupRef" :style="{ 'max-width': '150px' }" value-key="appmsgid" filterable
          placeholder="文章列表" @change="emitChangeForAppMsgGroup">
          <el-option v-for="(item) in mp_msg_groupsRef" :key="item.appmsgid" :label="item.name" :value="item" />
        </el-select>
        <el-button @click="newArticleGroup" type="primary">新列表</el-button>
      </div>
      <div class="bg-white  shadow-xl">
        <div v-if="mp_msgsRef">
          <div @click="loadArticle(item)" v-for="(item, index) in mp_msgsRef" :key="item.msg_id"
            class="flex items-center p-2 border-b w-full">
            <img :src="item.cdn_url" style="width:0px;height:0px;" referrerpolicy="no-referrer" />
            <div v-if="index === 0" :style="{ '--image-url': 'url(' + item.cdn_url + ')' }"
              class='w-full flex h-40 justify-between items-end bg-no-repeat bg-center bg-cover bg-[image:var(--image-url)]'
              :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }">
              <div class="flex text-white p-1">{{ item.title }}</div>
              <div class="flex justify-between px-1 space-x-2 py-1 text-white bg-gray-600 opacity-50"
                v-if="item.msg_id === msg_idRef">
                <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                  <component :is="ArrowDown"></component>
                </el-icon>
                <el-icon class="cursor-pointer" @click="deleteArticle(item.msg_id)">
                  <component :is="Delete"></component>
                </el-icon>
              </div>
            </div>
            <div class="w-full flex h-20 items-center p-1"
              :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }" v-else>
              <div class="flex flex-col flex-1 h-full">
                <div class="flex-1 h-2/3">{{ item.title }}</div>
                <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
              </div>
              <img class="w-10 h-10 rounded-sm" :src="item.cdn_url" />
              <div class="flex flex-col justify-around px-1 h-full" v-if="item.msg_id === msg_idRef">
                <el-icon class="cursor-pointer" @click="swapUp(item.msg_id)">
                  <component :is="ArrowUp"></component>
                </el-icon>
                <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                  <component :is="ArrowDown" v-if="index < mp_msgsRef.length - 1"></component>
                </el-icon>
                <el-icon class="cursor-pointer" @click="deleteArticle(item.msg_id)">
                  <component :is="Delete"></component>
                </el-icon>
              </div>
            </div>
          </div>
          <div class="w-full flex h-20 items-center p-1 justify-center">
            <!-- <div @click="newArticle()"  class="cursor-pointer">+新建文章</div> -->
            <el-button @click="newArticle" type="primary">新建文章</el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="right flex-1">
      <div class="wrapper-container">
        <div class="wrapper">
          <div class="block-area flex space-x-2">
            <!-- <button @click="insertText" style="padding:4px;margin-bottom:2px;">导入url</button> -->
            <el-input v-model="extractUrlRef" clearable style="width: 400px;" placeholder="请输入文章提取地址" />
            <!-- <button @click="extractLinkToArticle" style="padding:4px;margin-bottom:2px;">立即提取</button> -->
            <el-button @click="extractLinkToArticle" type="primary">提取链接内容</el-button>
          </div>
          <div class="block-area">
            <label>标题</label>
            <el-input v-model="currentArticleRef.title" clearable style="width: 200px;" placeholder="请输入文章标题" />
            <label>作者</label>
            <el-input v-model="currentArticleRef.author" clearable style="width: 200px;" placeholder="请输入文章作者" />
          </div>
          <div class="block-area">
            <el-checkbox label="声明原创" v-model="copyrightRef" />
            <el-input v-model="currentArticleRef.sourceurl" clearable style="width: 200px;" placeholder="原文链接" />
          </div>
          <div class="block-area">
            <el-checkbox label="打开留言" v-model="needOpenCommentRef" />
            <el-radio-group :disabled="!needOpenCommentRef" v-model="commentTypeRef">
              <!-- works when >=2.6.0, recommended ✔️ not work when <2.6.0 ❌ -->
              <el-radio value="0">所有人可留言</el-radio>
              <!-- works when <2.6.0, deprecated act as value when >=3.0.0 -->
              <el-radio label="1">仅关注后可留言</el-radio>
            </el-radio-group>
          </div>
          <div class="block-area flex justify-between">
            <label>封面图</label>
            <img class="h-8" v-if="currentArticleRef.cdn_url" :src="currentArticleRef.cdn_url"
              referrerpolicy="no-referrer">
            <!-- <div v-if="currentArticleRef.cdn_url" :style="{ '--image-url': 'url(' + currentArticleRef.cdn_url + ')' }"
            class='w-[100px] flex h-8 bg-no-repeat bg-center bg-cover bg-[image:var(--image-url)]'
            ></div> -->
            <input ref="cdnFileInputRef" @change="handleImage" type="file" accept="image/*">
            <label v-if="selectedCdnImageRef">封面预览</label>
            <img class="h-8" v-if="selectedCdnImageRef" :src="selectedCdnImageRef">
          </div>
          <Toolbar :key="currentArticleRef.msg_id" style="border-bottom: 1px solid #ccc; min-width: 768px;"
            :editor="editorRef" :defaultConfig="toolbarConfigRef" :mode="mode" />
        </div>
      </div>
      <!-- <hr style="margin-top: 100px;" /> -->
      <Editor :key="currentArticleRef.msg_id" :class="{ inImportScope: isInImportScopeRef }"
        class="min-w-[768px] min-h-[490px]"
        style="height: calc(100vh - 312px); border:solid 1px #ccc; overflow-y: hidden;"
        v-model="currentArticleRef.content_noencode" :defaultConfig="editorConfig" :mode="mode"
        @onCreated="handleCreated" />
      <div class="block-area save-area">
        <el-select v-model="selectedAccount" :style="{ 'max-width': '200px' }" value-key="id" filterable
          placeholder="选择发布公众账号" @change="emitChangeForAccount">
          <el-option v-for="(item) in accountsRef" :key="item.id" :label="item.name" :value="item" />
        </el-select>
        <div>&nbsp;</div>
        <el-button @click="saveArticle" type="primary">保存文章</el-button>
        <el-button @click="insertAd" type="primary">插入广告</el-button>
        <!-- <button @click="saveArticle" style="padding:4px;margin-bottom:2px;">保存文章</button> -->
      </div>
    </div>
  </div>
</template>
<style>
/* .inImportScope .w-e-text-container [data-slate-editor] p:has(:not(span)){
  padding:0;
  margin:2px;
  line-height:0;
} */
</style>
<style scoped>
.main {
  display: flex;
  border: 1px solid #ccc;
  background-color: white;
}

.left {
  width: 200px;
}

.right {
  padding-right: 10px;
}

.wrapper-container {
  height: 300px;
}

.wrapper {
  width: 768px;
  min-width: 768px;
  display: flex;
  align-items: start;
  flex-direction: column;
  /* margin-top:30px; */
  position: fixed;
  /* top: 30px; */
  z-index: 1000;
  background-color: white;
  opacity: 1;
  padding-top: 1px;
  border-top: solid 1px #ccc
}

.block-area {
  display: flex;
  align-items: center;
  justify-content: start;
  flex-direction: row;
  padding: 5px;
  width: 100%;
}

.block-area>label {
  margin: 0 5px;
}

.block-area>img {
  margin: 0 5px;
}

.save-area {
  position: fixed;
  bottom: 0;
  z-index: 1000;
  background-color: white;
  opacity: 1;
}

span[data-slate-zero-width="n"] {
  padding: 0 1px !important;
}
</style>
<script>
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { listAccount } from '@/api/account'
import { saveArticleDraft, listArticlesByAppMsg, listArticleGroups, swapArticles, deleteArticleDraft } from "@/api/article"
import { getArticleContent, getArticleContent2 } from '@/api/jzl'
import { format_to_wangEditor_html, restore_from_wangEditor_html, format_ad_content, restore_ad_content } from "@/utils/dom";
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { DomEditor } from '@wangeditor/editor';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue'
import { removeAppMsgId, setAppMsgId, getAppMsgId, getSelectedAccountId, setSelectedAccountId } from '@/utils/editor'
// import { useStore } from 'vuex'
// import { IButtonMenu, IDomEditor, Boot } from '@wangeditor/editor'
// import { Boot } from '@wangeditor/editor';
// import SelectAccount from "../components/selectAccount";

// need_open_comment: Optional[int] = 1
//     only_fans_can_comment:Optional[int] = 0
//     only_fans_days_can_comment:Optional[int] = 0
//     sourceurl: Optional[str] = None
//     insert_ad_mode: Optional[int] = 2
//     can_insert_ad:Optional[int] = 1

console.log("====enter editor====")

export default {
  components: { Editor, Toolbar, },

  setup() {
    // console.log("window", window.envVars)

    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // mp_msgs
    const msg_idRef = ref(0)
    const mp_msgsRef = ref([])
    const mp_msg_groupsRef = ref([])
    const selected_mp_msg_groupRef = ref(null)
    const isInImportScopeRef = ref(false)
    // const init_appmsgid = getAppMsgId()
    // console.log("appmsgid=>", init_appmsgid)
    // const appmsgidRef = ref(init_appmsgid)
    const debug_content_noencode_ref = ref("")

    // 文章内容
    const currentArticleRef = ref({
      title: "",
      author: "",
      copyright_type: 0,
      cdn_url: "",
      desc: "",
      need_open_comment: 1,
      only_fans_can_comment: 0,
      only_fans_days_can_comment: 0,
      sourceurl: "",
      insert_ad_mode: 2,
      can_insert_ad: 1,
      // content_noencode: "<section>hello</section>",
      content_noencode: "",
    })
    // const titleRef = ref("")
    // const authorRef = ref("parker")

    // 封面
    const cdnRef = ref(null)
    const selectedCdnImageRef = ref(null)
    const cdnFileInputRef = ref(null)

    //声明原创
    const copyrightRef = ref(false)

    // 留言
    const needOpenCommentRef = ref(false)
    const commentTypeRef = ref("0") // 0-全部 1-只有粉丝 

    // 账号
    let selectedAccount = ref(null)
    let accountsRef = ref([])

    // 内容 HTML
    // const valueHtml = ref('<section>hello</section>') //<section>hello</section>
    // const extractUrlRef = ref("https://mp.weixin.qq.com/s/ECdk1kmW2FYNY6EaXZTYGQ")
    const extractUrlRef = ref("")

    // 模拟 ajax 异步获取内容
    onMounted(async () => {
      console.log("==onMounted==")
      await _listArticleGroups()
      listArticles()
      listAccount().catch(() => { }).then(response => {
        // accountsRef.value = [...response.data.data.list]
        accountsRef.value = response.data.data.list
        console.log("load accounts:", accountsRef.value)

        const init_account_id = getSelectedAccountId()
        console.log("init_account_id=>", init_account_id)
        if (init_account_id) {
          const find_account = accountsRef.value.find(v => v.id === parseInt(init_account_id))
          console.log("find_account=>", find_account)
          if (find_account) {
            selectedAccount.value = find_account
            setImageUploadConfig()
          }
        } else {
          if (accountsRef.value.length > 0) {
            selectedAccount.value = accountsRef.value[0];
            setImageUploadConfig()
            setSelectedAccountId(selectedAccount.value.id)
          }
        }
      })
    })


    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value
      if (editor == null) return
      editor.destroy()
    })

    const toolbarConfigRef = ref(
      {
        // excludeKeys: [
        //   'bold', // 排除菜单组，写菜单组 key 的值即可
        // ],
        // insertKeys:{
        //   index: 1, // 插入的位置，基于当前的 toolbarKeys
        //   keys: ['header5'],
        // },
        excludeKeys: ['group-video', 'codeBlock', 'fullScreen']
      }
    )
    // const toolbarConfig = {
    //   // excludeKeys: [
    //   //   'bold', // 排除菜单组，写菜单组 key 的值即可
    //   // ],
    //   // insertKeys:{
    //   //   index: 1, // 插入的位置，基于当前的 toolbarKeys
    //   //   keys: ['header5'],
    //   // },
    //   excludeKeys: ['group-video', 'codeBlock', 'fullScreen']
    // };

    const editorConfig = { placeholder: '请输入内容...', MENU_CONF: {}, htmlSanitize: false };

    editorConfig.MENU_CONF['uploadImage'] = {
      server: envVars.backend_url + '/upload-editor-image',
      fieldName: 'editor_img',
      // meta: {
      //   token: 'xxx',
      //   cookies: 'yyy',
      // },
      onBeforeUpload(file) {
        console.log("file=>", file)
        // TS 语法
        // onBeforeUpload(file) {    // JS 语法
        // file 选中的文件，格式如 { key: file }
        return file

        // 可以 return
        // 1. return file 或者 new 一个 file ，接下来将上传
        // 2. return false ，不上传这个 file
      },
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
      if (!selectedAccount.value) {
        return
      }
      console.log("selectedAccount  in setImageUploadConfig=>", selectedAccount.value)
      const { token, name, session_id } = selectedAccount.value
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
      console.log("handleCreated=>", editor)
      editorRef.value = editor // 记录 editor 实例，重要！
      setImageUploadConfig()
      // const hasKey = editor.getAllMenuKeys()?.includes("menux1")
      // console.log("hasKey=>", hasKey)
      // if (hasKey) {
      //   //判断如果已经插入进去，不在二次插入
      //   class MyButtonMenu {
      //     // TS 语法
      //     // class MyButtonMenu {                       // JS 语法

      //     cconstructor() {
      //       this.title = 'My menu title' // 自定义菜单标题
      //       // this.iconSvg = '<svg>...</svg>' // 可选
      //       this.tag = 'button'
      //     }

      //     // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
      //     getValue(editor) {
      //       // TS 语法
      //       // getValue(editor) {                              // JS 语法
      //       return ' hello '
      //     }

      //     // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
      //     isActive(editor) {
      //       // TS 语法
      //       // isActive(editor) {                    // JS 语法
      //       return false
      //     }

      //     // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
      //     isDisabled(editor) {
      //       // TS 语法
      //       // isDisabled(editor) {                     // JS 语法
      //       return false
      //     }

      //     // 点击菜单时触发的函数
      //     exec(editor, value) {
      //       // TS 语法
      //       // exec(editor, value) {                              // JS 语法
      //       if (this.isDisabled(editor)) return
      //       editor.insertText(value) // value 即 this.value(editor) 的返回值
      //     }
      //   }

      //   const menu1Conf = {
      //     key: 'menux1', // 定义 menu key ：要保证唯一、不重复（重要）
      //     factory() {
      //       return new MyButtonMenu(); // 把 `YourMenuClass` 替换为你菜单的 class
      //     },
      //   };
      //   Boot.registerMenu(menu1Conf);
      // }
      // toolbarConfigRef.value.insertKeys = {
      //   index: 0,
      //   keys: ['menux'],
      // }
      // const toolbar = DomEditor.getToolbar(editor);
      // console.log('toolbar=>', toolbar)
      // const curToolbarConfig = toolbar.getConfig();
      // console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组

    }
    const _getAppMsgId = () => {
      return selected_mp_msg_groupRef.value?.appmsgid
    }
    const insertAd = () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      editor.dangerouslyInsertHtml(`<h1>===手工广告，请勿修改===</h1>`); // 执行 editor API
      // const toolbar = DomEditor.getToolbar(editor);
      // console.log('toolbar=>', toolbar, toolbarConfig);
      // const curToolbarConfig = toolbar.getConfig();
      // console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组
      // console.log('menuconfig=>', editor.getMenuConfig('uploadImage'));
    };


    const extractLinkToArticle = async () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      if (!extractUrlRef.value) {
        ElMessageBox.alert('请输入有效的提取链接', '警告', {
          confirmButtonText: '确定',
          type: 'warning'
        }).catch(() => { })
        return
      }

      // console.log("导入url=>", extractUrlRef)
      const v = await getArticleContent(extractUrlRef.value)
      isInImportScopeRef.value = true
      // console.log("v=>", v)
      const { content_noencode, title, nick_name, copyright_stat, cdn_url } = v.data
      // console.log("content_noencode=>", content_noencode)
      debug_content_noencode_ref.value = content_noencode
      currentArticleRef.value = {
        ...currentArticleRef.value,
        // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
        // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
        content_noencode: format_to_wangEditor_html(content_noencode),
        title,
        author: nick_name,
        copyright_type: copyright_stat,
        cdn_url,
      }


    }

    const listArticles = async () => {
      const appmsgid = _getAppMsgId()
      // appmsgidRef.value
      if (appmsgid) {
        mp_msgsRef.value = await listArticlesByAppMsg(appmsgid).catch((err) => { }).then(response => {
          return response.data;
        })
        console.log("mp_msgsRef.value=>", mp_msgsRef.value)
      }
    }

    const _listArticleGroups = async () => {
      mp_msg_groupsRef.value = await listArticleGroups().catch((err) => { }).then(response => {
        return response.data;
      })
      console.log("mp_msg_groupsRef.value=>", mp_msg_groupsRef.value)

      if (!selected_mp_msg_groupRef.value) {
        const init_appmsgid = getAppMsgId()
        console.log("init_appmsgid=>", init_appmsgid)
        if (init_appmsgid) {
          const find_group = mp_msg_groupsRef.value.find(v => v.appmsgid === parseInt(init_appmsgid))
          console.log("find_group=>", find_group)
          if (find_group) {
            selected_mp_msg_groupRef.value = find_group
            console.log("1 selected_mp_msg_groupRef.value=>", selected_mp_msg_groupRef.value)
            setAppMsgId(selected_mp_msg_groupRef.value.appmsgid)
            return
          }
        }
        if (mp_msg_groupsRef.value.length > 0) {
          selected_mp_msg_groupRef.value = mp_msg_groupsRef.value[0]
          console.log("2 selected_mp_msg_groupRef.value=>", selected_mp_msg_groupRef.value)
          setAppMsgId(selected_mp_msg_groupRef.value.appmsgid)
        } else {
          setAppMsgId("")
        }
      }
    }


    const loadArticle = (mp_msg) => {
      msg_idRef.value = mp_msg.msg_id
      debug_content_noencode_ref.value = mp_msg.content_noencode
      const { formated, category_id_list, ad_id } = format_ad_content(mp_msg.content_noencode)
      console.log("category_id_list=>", category_id_list)
      console.log("ad_id=>", ad_id)
      mp_msg.content_noencode = format_to_wangEditor_html(formated)
      
      // appmsgidRef.value = mp_msg.appmsgid
      currentArticleRef.value = {
        ...mp_msg,
      }
      
      isInImportScopeRef.value = false
      selectedCdnImageRef.value = null
      cdnFileInputRef.value.value = ""
      console.log("loadArticle:", currentArticleRef.value)
      copyrightRef.value = currentArticleRef.value.copyright_type == 1
      needOpenCommentRef.value = currentArticleRef.value.need_open_comment == 1
      // 0-all 1-only fans
      if (currentArticleRef.value.only_fans_can_comment == 0 && currentArticleRef.value.only_fans_can_comment == 0) {
        commentTypeRef.value = "0"
      } else {
        commentTypeRef.value = "1"
      }

      const toolbar = DomEditor.getToolbar(editorRef.value);
      console.log("toolbar keys:", toolbar.getConfig().toolbarKeys)
      console.log("menu keys:", editorRef.value.getAllMenuKeys())

      // console.log("format_ad_content=>", format_ad_content(`abcde<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2" data-id="1746772291564" src="/cgi-bin/readtemplate?t=tmpl/cpc_tmpl#1746772291564">&nbsp;</mpcpc></section>12345`))

      console.log("currentArticleRef.value=>", currentArticleRef.value)
    }
    const loadArticleByMsgId = (msg_id) => {
      const mp_msg = mp_msgsRef.value.find(v => v.msg_id === msg_id)
      if (mp_msg) {
        console.log("find mp_msg=>", mp_msg)
        loadArticle(mp_msg)
      }
    }
    const newArticle = () => {
      msg_idRef.value = 0
      currentArticleRef.value = {
        title: "",
        author: "parker",
        copyright_type: 0,
        cdn_url: "",
        desc: "",
        content_noencode: "",
      }
      isInImportScopeRef.value = false
      selectedCdnImageRef.value = null
      cdnFileInputRef.value.value = ""
    }

    const serializeCookie = (arr) => {
      const items = []
      arr.forEach((v) => {
        items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
      });
      // console.log("items=>", items)
      return items.join(";")
    }

    const validateAccount = () => {
      if (!selectedAccount.value) {
        ElMessageBox.alert('发布的公众账号不存在,请先到账号中心添加', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).catch(() => { })
        return false;
      }
      return true
    }

    const validateArticleData = () => {

      if (!currentArticleRef.value.title.trim()) {
        ElMessageBox.alert('标题不能为空', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).catch(() => { })
        return false;
      }
      if (!currentArticleRef.value.author.trim()) {
        ElMessageBox.alert('作者不能为空', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).catch(() => { })
        return false;
      }
      if (mp_msgsRef.value.length >= 8 && msg_idRef.value === 0) {
        ElMessageBox.alert('超出单消息最大文章数8篇', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).catch(() => { })
        return false;
      }

      return true
    }

    const testLoading = async () => {
      const loader = ElLoading.service({
        target: '.main'
      })
      setTimeout(() => {
        loader.close()
      }, 2000)
    }

    const needRefreshGroup = (msg_id) => {
      if (msg_id > 0) {
        const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
        return idx === 0
      }
      return true
    }

    const saveArticle = async () => {

      if (!validateAccount() || !validateArticleData()) {
        return
      }

      // 声明原创
      currentArticleRef.value.copyright_type = copyrightRef.value ? 1 : 0

      // 留言
      if (needOpenCommentRef.value) {
        currentArticleRef.value.need_open_comment = 1
        if (commentTypeRef.value === "0") {
          currentArticleRef.value.only_fans_can_comment = 0
          currentArticleRef.value.only_fans_days_can_comment = 0
        } else if (commentTypeRef.value === "1") {
          currentArticleRef.value.only_fans_can_comment = 1
          currentArticleRef.value.only_fans_days_can_comment = 0
        }
      } else {
        currentArticleRef.value.need_open_comment = 0
        currentArticleRef.value.only_fans_can_comment = 0
        currentArticleRef.value.only_fans_days_can_comment = 0
      }

      console.log(currentArticleRef.value)
      const { token, name, session_id, wechat_id } = selectedAccount.value
      // const saveContent = currentArticleRef.value.content_noencode
      // console.log("token:", token)
      console.log("save name:", name)

      // console.log("wechat_id:", wechat_id)
      // console.log("raw content_noencode:", debug_content_noencode_ref.value)

      // console.log("restore content_noencode:", currentArticleRef.value.content_noencode)
      // const to_save_content_noencode = restore_from_wangEditor_html(currentArticleRef.value.content_noencode);
      // console.log("to_save_content_noencode:", to_save_content_noencode)

      const vhtml = restore_ad_content(currentArticleRef.value.content_noencode, "50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2")
      console.log("ad vhtml=>", vhtml)
      currentArticleRef.value.content_noencode = vhtml

      const msg_id = msg_idRef.value
      // const appmsgid =  appmsgidRef.value 
      const appmsgid = _getAppMsgId()
      // console.log("msg_id", msg_id)
      // console.log("appmsgid", appmsgid)
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
      console.log("save postData=>", postData)
      const loader = ElLoading.service({
        target: '.main'
      })
      await saveArticleDraft(postData).then(async (res) => {
        ElMessage({
          message: `文章保存成功`,
          type: 'success',
          duration: 2 * 1000
        })
        console.log("saveArticleDraft res=>", res)
        if (msg_id === 0 && (!appmsgid && res.data.data.appmsgid)) {
          // 新列表 需要设置新的appmsgid到localstorage
          setAppMsgId(res.data.data.appmsgid)
        }
        if (needRefreshGroup(msg_id)) {
          await _listArticleGroups()
        }


        await listArticles()

      }).catch((err) => { }).finally(() => {
        loader.close()
      })

      // 暂时从前端提交
      //   window.ipcRenderer.send('toMain', {
      //   tag: 'saveArticleDraft',
      //   content: postData
      // })
    }

    const swapUp = async (msg_id) => {
      const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
      const prev = mp_msgsRef.value[idx - 1].msg_id
      console.log("prev index:", prev)
      await swapArticles(prev, msg_id).catch((err) => { })
      if (needRefreshGroup(prev)) {
        await _listArticleGroups()
      }
      await listArticles()
    }
    const swapDown = async (msg_id) => {
      const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
      const next = mp_msgsRef.value[idx + 1].msg_id
      console.log("next index:", next)
      await swapArticles(msg_id, next)
      if (idx === 0) {
        await _listArticleGroups()
      }
      await listArticles()
    }

    const deleteArticle = async (msg_id) => {
      ElMessageBox.confirm(
        '此操作将删除该文章, 是否继续?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(async () => {
        const { token, session_id, wechat_id } = selectedAccount.value
        const postData = {
          cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
          token: parseInt(token),
          wechat_id,
          msg_id,
        }
        console.log("delete postData=>", postData)
        const loader = ElLoading.service({
          target: '.main'
        })
        await deleteArticleDraft(postData).catch((err) => { }).finally(() => {
          loader.close()
        })
        ElMessage({
          message: `文章删除成功`,
          type: 'success',
          duration: 2 * 1000
        })

        await listArticles()
        console.log("mp_msgsRef.value=>", mp_msgsRef.value)
        if (mp_msgsRef.value.length === 0) {
          //该系列下没有文章，删除localStorage中保存的数据
          removeAppMsgId()
          selected_mp_msg_groupRef.value = null
        }
        if (needRefreshGroup(msg_id) || mp_msgsRef.value.length === 0) {
          await _listArticleGroups()
          listArticles().then(() => {
            loadArticle(mp_msgsRef.value[0])
          })
        }
      }).catch(() => {
        console.log('取消')
      })

    }

    const newArticleGroup = () => {
      msg_idRef.value = 0
      selected_mp_msg_groupRef.value = null
      currentArticleRef.value = {
        title: "",
        author: "",
        copyright_type: 0,
        cdn_url: "",
        desc: "",
        content_noencode: "",
      }
      isInImportScopeRef.value = false
      selectedCdnImageRef.value = null
      cdnFileInputRef.value.value = ""
    }

    const emitInput = (val) => {
      // this.$emit('input', val)
    }
    const emitChangeForAppMsgGroup = (val) => {
      console.log("emitChangeForAppMsgGroup val=>", val)
      if (val) {
        selected_mp_msg_groupRef.value = val
        listArticles().then(() => {
          loadArticle(mp_msgsRef.value[0])
        })
        setAppMsgId(val.appmsgid)

      }
    }
    const emitChangeForAccount = (val) => {
      console.log("emitChange=>", val)
      selectedAccount.value = val;
      setImageUploadConfig()
      setSelectedAccountId(selectedAccount.value.id)
      // console.log("editorConfigRef=>", editorConfigRef.value)
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

          // console.log("cdn_content_type:", cdn_content_type);
          // console.log("cdn_base64_image:", cdn_base64_image);
          cdnRef.value = { cdn_content_type, cdn_base64_image }

        } else {
          ElMessage({
            message: '无效的图片',
            type: 'error',
            duration: 2 * 1000
          })
        }
        // console.log('image_base64:',cover.value)
        // this.uploadImage();
        selectedCdnImageRef.value = reader.result
      };
      reader.readAsDataURL(fileObject);
    }

    const handleImage = (e) => {
      const selectedImage = e.target.files[0]; // get first file
      if (selectedImage) {
        createBase64Image(selectedImage);
      } else {
        selectedCdnImageRef.value = null
        cdnFileInputRef.value.value = ""
      }
    }


    return {
      testLoading,
      isInImportScopeRef,
      msg_idRef,
      mp_msg_groupsRef,
      selected_mp_msg_groupRef,
      selectedCdnImageRef,
      cdnFileInputRef,
      // titleRef,
      // authorRef,
      currentArticleRef,
      needOpenCommentRef,
      commentTypeRef,
      copyrightRef,
      mp_msgsRef,
      accountsRef,
      selectedAccount,
      editorRef,
      extractUrlRef,
      mode: 'default', // 或 'simple'
      // toolbarConfig,
      toolbarConfigRef,
      editorConfig,
      handleCreated,
      insertAd,
      extractLinkToArticle,
      loadArticle,
      newArticle,
      saveArticle,
      swapUp,
      swapDown,
      deleteArticle,
      newArticleGroup,
      emitInput,
      emitChangeForAppMsgGroup,
      emitChangeForAccount,
      handleImage,
      ArrowUp: shallowRef(ArrowUp),
      ArrowDown: shallowRef(ArrowDown),
      Delete: shallowRef(Delete),
    }
  },
}
</script>