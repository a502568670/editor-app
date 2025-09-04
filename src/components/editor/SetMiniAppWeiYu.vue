<template>
  <el-dialog :close-on-click-modal="false" :title="dialogTitle" v-model="dialogVisibleRef" width="800px">
    <!-- <ChooseMiniApp ref="chooseMiniAppRef" v-if="dialogMode === 'choose'" @setQuery="handleSetQuery"
      v-model="choosed_weapp_info.weapp" /> -->
    <div v-if="showStep" class="w-full h-[520px] flex flex-col items-center justify-center">
      <el-steps  class="w-full h-[80px]" :space="300" :active="curStep" finish-status="success" align-center>
        <el-step title="1、选择小程序" />
        <el-step title="2、填写详细信息" />
      </el-steps>
      <div v-if="(dialogMode === 'choose' && curStep === 0)" class="w-full h-[400px] flex flex-col items-center justify-center">
        <div class="basis-1/5"></div>
        <div class="w-3/4 basis-1/5">
          <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white searchbox"
              v-model="queryRef" style="width: 100%;" placeholder="请输入要搜索的小程序名称/AppID/账号原始ID或者右上角复制链接后粘贴到此处"
                @keypress.enter="handleSetQuery" />
            <el-icon style="cursor: pointer;" @click="handleSetQuery">
              <Search />
            </el-icon>
          </div>
        </div>
        <div class="basis-3/5">
          <ul class="w-[400px]">
            <li class="selected" v-if="choosed_weapp_info.weapp">
              <div class="border border-green-400 rounded">
                <div class="relative p-5 min-h-[50px] flex items-center justify-start space-x-2">
                  <img :src="choosed_weapp_info.weapp.headimg_url" class="w-[50px] h-[50px] rounded"> 
                  <strong :title="choosed_weapp_info.weapp.nickname">{{ choosed_weapp_info.weapp.nickname }}</strong></div>
                </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <el-form v-if="dialogMode === 'set' || (dialogMode === 'choose' && curStep === 1)" class="w-full h-[520px]" :model="dataForm" status-icon label-position="top"
      label-width="120px">
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="小程序链接" label-position="right">
            <template #label>
              <div class="flex justify-center items-center">
                {{dialogMode === 'set'?"小程序链接":"小程序名称"}}
                <el-popover v-if="dialogMode === 'set'" :width="360"
                  popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;">
                  <template #reference>
                    <el-icon :size="16" class="cursor-pointer flex justify-center items-center ml-1" title="小程序">
                      <QuestionFilled />
                    </el-icon></template>
                  <template #default>
                    <el-card class="mini-tip-card">
                      <div class="flex flex-col space-y-2">
                        <div class="text-lg font-bold">请前往微信小程序右上角，复制链接后粘贴到此处。</div>
                        <div>
                          <img
                            src="https://res.wx.qq.com/op_res/EIMHMmv5mxvQFAzwfZjNyKkyTGCbxyBDAz9XvAmsaqboMpQqf1ZC4f_NAPvEvl2mUhrAvVAqrnwgcK794rUKtw"
                            style="display: block; margin-top: 12px; width: 100%;">
                        </div>
                      </div>
                    </el-card>
                  </template>
                </el-popover>
              </div>
            </template>
            <div v-if="dialogMode === 'set'">
              <el-input v-model="dataForm.miniAppLink" clearable placeholder="请输入小程序链接" />
              <p class=" text-wrap text-gray-400">无法复制链接时，可搜索小程序，通过给指定微信用户开启复制路径入口的方式来修改小程序路径。</p>
              <a class="text-blue-500" @click="handleChooseMiniApp" href="javascript:;">去搜索</a>
            </div>
            <div v-else>
              {{ choosed_weapp_info.weapp.nickname }}
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="40" v-if="dialogMode === 'choose'">
        <el-col :span="24">
          <el-form-item label="小程序路径" label-position="right">
            <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white searchbox"
              v-model="choosed_weapp_info.weapp_path" style="width: 100%;" clearable />
             <span class="text-gray-400">{{choosed_weapp_info.weapp_path?.length??0}}/1024</span>
          </div>
          支持输入小程序路径和链接。默认显示小程序首页路径，可更改。
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label-position="right">
            <template #label>
              <div class="flex justify-center items-center">
                展示方式
                <el-popover :width="360"
                  popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;">
                  <template #reference>
                    <el-icon :size="16" class="cursor-pointer flex justify-center items-center ml-1" title="小程序">
                      <QuestionFilled />
                    </el-icon></template>
                  <template #default>
                    <p style="width: 300px;">为进一步提升小程序的安全性和用户体验，平台不再支持公众号创作者在后台生成任意小程序码。若需要在文章中插入小程序码，可联系小程序开发者获取。<a
                        class="text-blue-500" target="blank"
                        href="https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/qr-code.html">查看获取方式</a>
                    </p>
                  </template>
                </el-popover>
              </div>
            </template>
            <el-radio-group v-model="displayTypeRef">
              <el-radio value="0">文字</el-radio>
              <el-radio value="1">图片</el-radio>
              <el-radio value="2">小程序卡片</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label-position="right">
            <template #label>
              {{ displayTypeLabel }}
            </template>
            <el-input v-if="displayTypeRef == '0'" v-model="dataForm.miniAppText" placeholder="点击文字会打开小程序指定路径的页面" />
            <div v-else-if="displayTypeRef == '1'">
              <div class="flex flex-col space-y-2">
                <div>点击图片会打开小程序指定路径的页面。图片规格不限，图片大小限制10M</div>
                <div v-if="!dataForm.miniAppImg"><el-button @click="handleChooseAppMiniImg">选择图片</el-button></div>
                <div v-show="dataForm.miniAppImg" class="flex-1 w-[200px]">
                  <ImgPicker ref="refMiniAppImgPicker" h="198" placeholder="设置小程序图片" :imgSrc="dataForm.miniAppImg"
                    v-model="pickerQuery" :pageInfo="pickerPageInfo" @confirm="onImgPick" />
                </div>
              </div>
            </div>
            <el-input v-else v-model="dataForm.miniAppCardTitle" placeholder="点击小程序卡片会打开小程序指定路径的页面" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-show="isDisplayCardCss" :gutter="40">
        <el-col :span="24">
          <el-form-item label="卡片样式" label-position="right">
            <el-card class="mini-app-card">
              <div class="flex flex-col space-y-2">
                <div></div>
                <div class="flex-1">
                  <ImgPicker ref="refMiniAppCardImgPicker" h="198" placeholder="设置小程序卡片图片"
                    :imgSrc="dataForm.miniAppCardImg" v-model="pickerQuery" :pageInfo="pickerPageInfo"
                    @confirm="onImgPick" @change="onImageUpload" forbidCrop upload />
                  <ImgCrop ref="refImgCrop" @change="onImageCrop" nul />
                </div>
                <div class="flex items-center justify-start text-sm">
                  <el-icon :size="16" class="cursor-pointer flex justify-center" @click="openMiniAppDialog" title="小程序">
                    <WechatMiniAppIcon />
                  </el-icon>小程序
                </div>
              </div>
            </el-card>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div v-if="dialogMode === 'choose'" class="dialog-footer">
        <el-button v-if="curStep === 0"
          @click="dialogVisibleRef = false">取消</el-button>
        <el-button v-if="curStep === 1"
          @click="curStep=0;showStep=true">上一步</el-button>
        <el-button v-if="curStep === 0" :disabled="choosed_weapp_info.weapp == null"
          @click="curStep=1;showStep=false" type="primary">下一步</el-button>
        <el-button v-if="curStep === 1" @click="insertMiniApp" type="success">确定</el-button>
      </div>
      <div v-if="dialogMode === 'set'" class="dialog-footer">
        <el-button @click="dialogVisibleRef = false">取消</el-button>
        <el-button @click="insertMiniApp" type="success">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<style scoped>
.mini-tip-card {
  width: 320px;
  max-width: 320px;
}
.mini-app-card {
  width: 240px;
  max-width: 240px;
}
.el-card {
  --el-card-footer-padding: 0px 0px;
}
.searchbox :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}
.searchbox :deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}
</style>
<script setup>
import { ref, computed, defineExpose, toRaw } from 'vue'
import ImgPicker from '@/components/editor/ImgPicker.vue';
import ImgCrop from '@/components/ImgCrop.vue'
import WechatMiniAppIcon from "@/components/icons/WechatMiniAppIcon"
import ChooseMiniApp from "@/components/editor/ChooseMiniApp.vue"
import { ElMessage } from 'element-plus'
import { QuestionFilled, Search } from '@element-plus/icons-vue'

const dialogTitle = ref("插入小程序")
const dialogMode = ref("choose") // set choose
const pickerQuery = defineModel()
const { pickerPageInfo } = defineProps(['pickerPageInfo'])

const $emits = defineEmits(['searchMiniApp'])
const chooseMiniAppRef = ref(null)
const choosed_weapp_info = ref({ weapp: null, weapp_path: '' })
const refMiniAppImgPicker = ref(null)
const refMiniAppCardImgPicker = ref(null)
const refImgCrop = ref(null)

const showStep = ref(true)
const curStep = ref(0)
const queryRef = ref("")
const dialogVisibleRef = ref(false)
const displayTypeRef = ref('0')
const displayTypeLabel = computed(() => {
  if (displayTypeRef.value == '0') {
    return '文字内容'
  } else if (displayTypeRef.value == '1') {
    return '图片'
  } else if (displayTypeRef.value == '2') {
    return '卡片标题'
  }
  return ""
})
const dataForm = ref({
  miniAppLink: '',
  miniAppText: '',
  miniAppImg: '',
  miniAppCardTitle: '',
  miniAppCardImg: '',
  miniAppCardImgCrop: null,
})
const isDisplayCardCss = computed(() => displayTypeRef.value == '2')

function openDialog(formData) {
  dialogVisibleRef.value = true
  if (formData) {
    dataForm.value = {
      ...formData
    }
  } else {
    dialogTitle.value = "插入小程序"
    dialogMode.value = "choose"
    displayTypeRef.value = "0"
    showStep.value = true
    curStep.value = 0
    queryRef.value = ""
    choosed_weapp_info.value = { weapp: null, weapp_path: '' }
    dataForm.value = {
      miniAppLink: '',
      miniAppText: '',
      miniAppImg: '',
      miniAppCardTitle: '',
      miniAppCardImg: '',
      miniAppCardImgCrop: null,
    }
  }
}
function closeDialog() {
  dialogVisibleRef.value = false
}

function handleChooseMiniApp() {
  dialogTitle.value = "选择小程序"
  dialogMode.value = "choose"
  showStep.value = true
}

function handleChooseAppMiniImg() {
  refMiniAppImgPicker.value.openDialog()
}
function onImageUpload(url) {
  refMiniAppCardImgPicker.value.uploadSucc(url)
}
function onImageCrop(data) {
  console.log("data=>", data)
  dataForm.value.miniAppCardImg = data.raw_img
  dataForm.value.miniAppCardImgCrop = data.crop
}

function onImgPick(urls) {
  console.log("urls=>", urls)
  if (displayTypeRef.value == '1') {
    dataForm.value.miniAppImg = urls[0]
  } else if (displayTypeRef.value == '2') {
    // refMiniAppCardImgPicker.cropRef.value.cropWith(urls[0], {radio:'4'})
    console.log("refImgCrop=>", refImgCrop)
    refImgCrop.value.cropWith(urls[0], { radio: '4' })
  }
}

function handleSetQuery(query) {
  $emits("searchMiniApp", { type: "byAppName", "formData": { query: queryRef.value } })
}

function setMiniApp(weapp, weapp_path) {
  choosed_weapp_info.value = { weapp, weapp_path }
}

function insertMiniApp() {
  const type = dialogMode.value == 'set' ? 'byAppLink' : 'byAppInfo'
  if (dialogMode.value == 'set') {
    if (!dataForm.value.miniAppLink) {
      ElMessage.error('请输入小程序链接')
      return
    }
  }
  const miniAppLink = dialogMode.value == 'set' ? dataForm.value.miniAppLink : toRaw(choosed_weapp_info.value)
  if (displayTypeRef.value == '0') {
    if (!dataForm.value.miniAppText) {
      ElMessage.error('请输入文字内容')
      return
    }
    
    $emits("searchMiniApp", { type: type, "formData": { miniAppLink: miniAppLink, miniAppText: dataForm.value.miniAppText } })
  } else if (displayTypeRef.value == '1') {
    if (!dataForm.value.miniAppImg) {
      ElMessage.error('请选择/上传图片')
      return
    }
    $emits("searchMiniApp", { type: type, "formData": { miniAppLink: miniAppLink, miniAppImg: dataForm.value.miniAppImg } })
  } else if (displayTypeRef.value == '2') {
    if (!dataForm.value.miniAppCardTitle) {
      ElMessage.error('请输入卡片标题')
      return
    }
    if (!dataForm.value.miniAppCardImg) {
      ElMessage.error('请选择/上传卡片图片')
      return
    }
    $emits("searchMiniApp", { type: type, "formData": { miniAppLink: miniAppLink, miniAppCardTitle: dataForm.value.miniAppCardTitle, miniAppCardImg: dataForm.value.miniAppCardImg, miniAppCardImgCrop: toRaw(dataForm.value.miniAppCardImgCrop) } })
  }
}

defineExpose({
  openDialog,
  closeDialog,
  setMiniApp,
});

</script>