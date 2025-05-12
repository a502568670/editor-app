<template>
  <el-row :gutter="4" class="h-full bg-[#e9f9f1]">
    <el-col :span="6" class="h-full overflow-scroll">
      <div class="grid-content flex space-x-1 pl-1">
        <el-select v-model="selected_mp_msg_groupRef" value-key="appmsgid" filterable placeholder="文章列表"
          @change="emitChangeForAppMsgGroup">
          <el-option v-for="(item) in mp_msg_groupsRef" :key="item.appmsgid" :label="item.name" :value="item" />
        </el-select>
        <el-button @click="newArticleGroup" class="max-w-[80px]" type="primary">新列表</el-button>
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
                  <component :is="ArrowUpRef"></component>
                </el-icon>
                <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                  <component :is="ArrowDownRef" v-if="index < mp_msgsRef.length - 1"></component>
                </el-icon>
                <el-icon class="cursor-pointer" @click="deleteArticle(item.msg_id)">
                  <component :is="DeleteRef"></component>
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
    </el-col>
    <el-col :span="12" class="h-full flex flex-col">
      <div class="grid-content flex space-x-2 p-2 bg-slate-100 text-blue-500">
        <el-icon :size="20" class="cursor-pointer" @click="openExtractMpArticleUrlDialog" title="提取链接内容">
          <Link />
        </el-icon>
        <el-icon :size="20" class="cursor-pointer" @click="openAdDialog" title="设置广告">
          <RadioTower />
        </el-icon>
      </div>
      <div class="flex-1">
        <vue-ueditor-wrap v-model="currentArticleRef.content_noencode" editor-id="editor" @ready="ready"
          :config="editorConfig" :editorDependencies="['ueditor.config.js', 'ueditor.all.js']" />
      </div>
    </el-col>
    <el-col :span="6" class="h-full pr-1 pt-1">
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-input v-model="currentArticleRef.title" clearable class="grid-content-control" placeholder="请输入文章标题" />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-input v-model="currentArticleRef.author" clearable class="grid-content-control" placeholder="请输入文章作者" />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1 w-full">
        <el-col :span="24" class="h-20 py-2 w-full flex justify-center items-center">
          <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-if="selectedCdnImageRef"
            :src="selectedCdnImageRef" alt="封面预览">
          <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-else-if="currentArticleRef.cdn_url"
            :src="currentArticleRef.cdn_url" referrerpolicy="no-referrer" alt="封面图" />
          <div v-else @click="triggerFileInput"
            class="cursor-pointer border h-16 w-[180px] flex justify-center items-center bg-[#8c8c8c]">设置封面图</div>
          <input class="invisible" ref="cdnFileInputRef" @change="handleImage" type="file" accept="image/*">
        </el-col>
      </el-row>
      <!-- <el-row :gutter="4" class="mb-1 invisible">
        <el-col :span="24">
          
        </el-col>
      </el-row> -->
      <el-row :gutter="4" class="my-2">
        <el-col :span="24">
          <hr />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-checkbox label="声明原创" v-model="copyrightRef" />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="h-8 mb-1">
        <el-col :span="24">
          <el-input v-model="currentArticleRef.sourceurl" clearable class="grid-content-control" placeholder="原文链接" />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-checkbox label="打开留言" v-model="needOpenCommentRef" />
          <el-radio-group :disabled="!needOpenCommentRef" v-model="commentTypeRef">
            <!-- works when >=2.6.0, recommended ✔️ not work when <2.6.0 ❌ -->
            <el-radio value="0">所有人可留言</el-radio>
            <!-- works when <2.6.0, deprecated act as value when >=3.0.0 -->
            <el-radio label="1">仅关注后可留言</el-radio>
          </el-radio-group>
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-button @click="openAdDialog" type="primary">插入广告</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="4" class="my-2">
        <el-col :span="24">
          <hr />
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-select v-model="selectedAccount" class="grid-content-control" value-key="id" filterable
            placeholder="选择发布公众账号" @change="emitChangeForAccount">
            <el-option v-for="(item) in accountsRef" :key="item.id" :label="item.name" :value="item" />
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="4" class="mb-1">
        <el-col :span="24">
          <el-button @click="saveArticle" type="danger">暂存文章</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="4" class="h-8 mb-1">
        <el-col :span="24"></el-col>
      </el-row>
      <el-row :gutter="4" class="h-8 mb-1">
        <el-col :span="24"></el-col>
      </el-row>
    </el-col>
  </el-row>
  <el-dialog :close-on-click-modal="false" title="设置广告" v-model="dialogExtractMpAritcleUrlRef" width="600px">
    <el-row :gutter="40">
      <el-col :span="18">
        <el-input v-model="extractArticleUrlRef" clearable placeholder="请输入文章提取地址" />
      </el-col>
      <el-col :span="6">
        <el-button @click="handleExtractMpArticleUrl" type="primary">提取链接内容</el-button>
      </el-col>
    </el-row>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="设置广告" v-model="dialogAdVisibleRef" width="600px">
    <el-form ref="dataForm" :rules="rules" :model="dataForm" status-icon label-position="top" label-width="100px">
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="插入方式">
            <el-radio-group v-model="insertAdTypeRef">
              <!-- works when >=2.6.0, recommended ✔️ not work when <2.6.0 ❌ -->
              <el-radio value="2">智能插入</el-radio>
              <!-- works when <2.6.0, deprecated act as value when >=3.0.0 -->
              <el-radio label="1">手动插入</el-radio>
              <el-radio label="0">不插入</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="商品类目">
            <el-checkbox label="全部类目" @change="clickAllCategory"></el-checkbox>
            <el-checkbox-group :disabled="insertAdTypeRef != '1'" v-model="adCategoryChoosedRef">
              <el-checkbox v-for="(item) in adCategoryRef" :key="item.id" :label="item.id">
                {{ item.name }}
              </el-checkbox>
              <!-- <el-checkbox label="Option 2 & Value 2" /> -->
            </el-checkbox-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogAdVisibleRef = false">取消</el-button>
        <el-button @click="insertAd" type="primary">确定</el-button>
      </div>
    </template>
  </el-dialog>

</template>
<style>
.grid-content {
  border-radius: 4px;
  /* min-height: 36px;   */
}

.grid-content-control {
  max-width: 180px;
}
</style>
<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { listAccount } from '@/api/account'
import { saveArticleDraft, listArticlesByAppMsg, listArticleGroups, swapArticles, deleteArticleDraft } from "@/api/article"
import { getArticleContent, getArticleContent2 } from '@/api/jzl'
import { format_to_UEditor_html, restore_from_UEditor_html } from "@/utils/dom";
import { ad_categorys, adMarkerContentInUEditor, format_ad_content_in_UEditor, restore_ad_content_from_UEditor, has_ad_in_wangEditor, has_ad_in_raw } from "@/utils/ad"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue'
import { removeAppMsgId, setAppMsgId, getAppMsgId, getSelectedAccountId, setSelectedAccountId } from '@/utils/editor'
import { Link, RadioTower } from 'lucide-vue-next';

// editor 
const editorRef = shallowRef()
const editorConfig = {
  // 后端服务地址，后端处理参考
  // https://open-doc.modstart.com/ueditor-plus/backend.html
  serverUrl: '/api/path/to/server',
  UEDITOR_HOME_URL: '/UEditorPlus/',
  UEDITOR_CORS_URL: '/UEditorPlus/',
  initialFrameWidth: '100%',
  initialFrameHeight: 500,
  loadConfigFromServer: false,
}

// component
const ArrowUpRef = shallowRef(ArrowUp);
const ArrowDownRef = shallowRef(ArrowDown);
const DeleteRef = shallowRef(Delete);

/// data
// mp_msgs
const msg_idRef = ref(0)
const mp_msgsRef = ref([])
const mp_msg_groupsRef = ref([])
const selected_mp_msg_groupRef = ref(null)
// 封面
const cdnRef = ref(null)
const selectedCdnImageRef = ref(null)
const cdnFileInputRef = ref(null)

//声明原创
const copyrightRef = ref(false)

// 留言
const needOpenCommentRef = ref(false)
const commentTypeRef = ref("0") // 0-全部 1-只有粉丝 

// 广告
const ad_idRef = ref(0)
const dialogAdVisibleRef = ref(false)
const adCategoryRef = ref(ad_categorys)
const adCategoryChoosedRef = ref([])
const insertAdTypeRef = ref("1") // 0-不插入 1-手动 2-智能 

// 账号
let selectedAccount = ref(null)
let accountsRef = ref([])

// 提取链接
const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/G2TYEsgZsTJ1VWj4R2F2hQ?from=kdocs_link")
const dialogExtractMpAritcleUrlRef = ref(false)


// 文章正文
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


/// ueditor methods

function ready(editorInstance) {
  console.log(`编辑器实例${editorInstance.key}: `, editorInstance);
  editorRef.value = editorInstance;
}


// 组件生命周期
onMounted(async () => {
  console.log("==onMounted==")
  await loadArticleGroups()
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
        // setImageUploadConfig()
      }
    } else {
      if (accountsRef.value.length > 0) {
        selectedAccount.value = accountsRef.value[0];
        // setImageUploadConfig()
        setSelectedAccountId(selectedAccount.value.id)
      }
    }
  })
})

// 组件销毁时，也及时销毁编辑器
// onBeforeUnmount(() => {
//   const editor = editorRef.value
//   if (editor == null) return
//   try {
//     editor.destroy()
//   } catch (e) {
//     console.error("destroy error", e)
//   }
// })


// 帮助方法
const _getAppMsgId = () => {
  return selected_mp_msg_groupRef.value?.appmsgid
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
  if (!currentArticleRef.value.cdn_url && !cdnRef.value) {
    ElMessageBox.alert('封面图片不能为空', '错误', {
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
const needRefreshGroup = (msg_id) => {
  if (msg_id > 0) {
    const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
    return idx === 0
  }
  return true
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


// data methods
const loadArticleGroups = async () => {
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

const loadArticle = (mp_msg) => {
  msg_idRef.value = mp_msg.msg_id
  const { formated, category_id_list, ad_id } = format_ad_content_in_UEditor(mp_msg.content_noencode)
  console.log("category_id_list=>", category_id_list)
  console.log("ad_id=>", ad_id)
  ad_idRef.value = ad_id
  // mp_msg.content_noencode = format_to_wangEditor_html(formated)
  mp_msg.content_noencode = formated
  // appmsgidRef.value = mp_msg.appmsgid
  currentArticleRef.value = {
    ...mp_msg,
  }

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

  // 广告
  adCategoryChoosedRef.value = category_id_list.split("|").map(v => parseInt(v))
  if (currentArticleRef.value.can_insert_ad == 0) {
    insertAdTypeRef.value = "0"
  } else {
    insertAdTypeRef.value = "" + currentArticleRef.value.insert_ad_mode
  }

  // const toolbar = DomEditor.getToolbar(editorRef.value);
  // console.log("toolbar keys:", toolbar.getConfig().toolbarKeys)
  // console.log("menu keys:", editorRef.value.getAllMenuKeys())

  // console.log("format_ad_content=>", format_ad_content(`abcde<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2" data-id="1746772291564" src="/cgi-bin/readtemplate?t=tmpl/cpc_tmpl#1746772291564">&nbsp;</mpcpc></section>12345`))

  // console.log("currentArticleRef.value=>", currentArticleRef.value)
}
const loadArticleByMsgId = (msg_id) => {
  const mp_msg = mp_msgsRef.value.find(v => v.msg_id === msg_id)
  if (mp_msg) {
    console.log("find mp_msg=>", mp_msg)
    loadArticle(mp_msg)
  }
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
    await loadArticleGroups()
  }
  await listArticles()
}

const newArticle = () => {
  msg_idRef.value = 0
  currentArticleRef.value = {
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
    content_noencode: "",
  }
  selectedCdnImageRef.value = null
  cdnFileInputRef.value.value = ""

  copyrightRef.value = false
  needOpenCommentRef.value = false
  commentTypeRef.value = "0"

  // 广告
  adCategoryChoosedRef.value = []
  insertAdTypeRef.value = "1"
  ad_idRef.value = 0

}

const saveArticle = async () => {

  if (!validateAccount() || !validateArticleData()) {
    return
  }
  console.log("==continue saveArticle===")

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


  console.log("adCategoryChoosedRef=>", adCategoryChoosedRef.value)

  console.log(currentArticleRef.value)
  
  const { token, name, session_id, wechat_id } = selectedAccount.value
  console.log("session_id=>", session_id)
  // const saveContent = currentArticleRef.value.content_noencode
  // console.log("token:", token)
  console.log("save name:", name)


  // console.log("wechat_id:", wechat_id)
  // console.log("raw content_noencode:", debug_content_noencode_ref.value)

  // console.log("restore content_noencode:", currentArticleRef.value.content_noencode)
  // const parser = new DOMParser();
  // const doc1 = parser.parseFromString(debug_content_noencode_ref.value, "text/html");
  // const doc2 = parser.parseFromString(currentArticleRef.value.content_noencode, "text/html");
  // console.log("compare", doc1, doc2)
  // const to_save_content_noencode = restore_from_UEditor_html(currentArticleRef.value.content_noencode);
  const to_save_content_noencode = currentArticleRef.value.content_noencode;
  // console.log("to_save_content_noencode:", to_save_content_noencode)

  const category_id_list = adCategoryChoosedRef.value.join("|")
  console.log("category_id_list:", category_id_list)

  const vhtml = restore_ad_content_from_UEditor(to_save_content_noencode, category_id_list, ad_idRef.value)
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
      message: `文章暂存成功`,
      type: 'success',
      duration: 2 * 1000
    })
    console.log("saveArticleDraft res=>", res)
    if (msg_id === 0 && (!appmsgid && res.data.data.appmsgid)) {
      // 新列表 需要设置新的appmsgid到localstorage
      setAppMsgId(res.data.data.appmsgid)
    }
    if (needRefreshGroup(msg_id)) {
      await loadArticleGroups()
    }


    await listArticles()
    const new_msg_id = res.data.data.msg_id
    loadArticleByMsgId(new_msg_id)

  }).catch((err) => { }).finally(() => {
    loader.close()
  })

  // 暂时从前端提交
  //   window.ipcRenderer.send('toMain', {
  //   tag: 'saveArticleDraft',
  //   content: postData
  // })
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
  selectedCdnImageRef.value = null
  cdnFileInputRef.value.value = ""
}


// event handler
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
  // setImageUploadConfig()
  setSelectedAccountId(selectedAccount.value.id)
  // console.log("editorConfigRef=>", editorConfigRef.value)
  // console.log("selectedAccount=>", selectedAccount)
  // this.$emit('change', val)
}

const triggerFileInput = () => {
  cdnFileInputRef.value.click()
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

const openExtractMpArticleUrlDialog = () => {
  dialogExtractMpAritcleUrlRef.value = true
}

const handleExtractMpArticleUrl = async () => {
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;

  if (!extractArticleUrlRef.value) {
    ElMessageBox.alert('请输入有效的提取链接', '警告', {
      confirmButtonText: '确定',
      type: 'warning'
    }).catch(() => { })
    return
  }

  const loader = ElLoading.service({
    target: '.main'
  })
  const v = await getArticleContent(extractArticleUrlRef.value)
  // console.log("v=>", v)
  const { content_noencode, title, nick_name, copyright_stat, cdn_url } = v.data
  // console.log("content_noencode=>", content_noencode)

  currentArticleRef.value = {
    ...currentArticleRef.value,
    // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
    // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
    content_noencode: format_to_UEditor_html(content_noencode),
    title,
    author: nick_name,
    copyright_type: copyright_stat,
    cdn_url,
  }

  dialogExtractMpAritcleUrlRef.value = false
  loader.close()
}

const openAdDialog = () => {
  dialogAdVisibleRef.value = true
}

const insertAd = () => {
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;

  if (insertAdTypeRef.value == "1") {
    const found = has_ad_in_wangEditor(currentArticleRef.value.content_noencode)
    console.log("found=>", found)
    if (!found) {
      console.log("adMarkerContentInUEditor=>", adMarkerContentInUEditor)
      editor.execCommand('inserthtml', adMarkerContentInUEditor);
      // editor.setContent(adMarkerContentInUEditor, true); // 执行 editor API
    }
    currentArticleRef.value.can_insert_ad = 1
    currentArticleRef.value.insert_ad_mode = 1
  } else if (insertAdTypeRef.value == "2") {
    currentArticleRef.value.can_insert_ad = 1
    currentArticleRef.value.insert_ad_mode = 2
  } else {
    currentArticleRef.value.can_insert_ad = 0
    currentArticleRef.value.insert_ad_mode = 0
  }

  dialogAdVisibleRef.value = false;
  // const toolbar = DomEditor.getToolbar(editor);
  // console.log('toolbar=>', toolbar, toolbarConfig);
  // const curToolbarConfig = toolbar.getConfig();
  // console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组
  // console.log('menuconfig=>', editor.getMenuConfig('uploadImage'));
};

const clickAllCategory = (checkedAll) => {
  console.log("clickAllCategory=>", checkedAll)
  if (checkedAll) {
    adCategoryChoosedRef.value = adCategoryRef.value.map(v => v.id)
  } else {
    adCategoryChoosedRef.value = []
  }
}

</script>