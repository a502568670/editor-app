<template>
  <el-dialog :close-on-click-modal="false" title="插入小程序" v-model="dialogVisibleRef" width="800px">
    <el-form class="w-full h-[480px]" :model="dataForm" status-icon label-position="top" label-width="120px">
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="小程序链接" label-position="right">
            <template #label>
              <div class="flex justify-center items-center">
                小程序链接
                <el-popover :width="360"
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
            <div>
              <el-input v-model="dataForm.miniAppLink" clearable placeholder="请输入小程序链接" />
              <p class=" text-wrap text-gray-400">无法复制链接时，可搜索小程序，通过给指定微信用户开启复制路径入口的方式来修改小程序路径。</p>
              <a class="text-blue-500" @click="doSearchMiniApp" href="javascript:;">去搜索</a>
            </div>
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
                  <ImgCrop ref="refImgCrop"  @change="onImageCrop" nul />
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
      <div class="dialog-footer">
        <el-button @click="dialogVisibleRef = false">取消</el-button>
        <el-button @click="insertMiniApp" type="primary">确定</el-button>
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
</style>
<script setup>
import { ref, computed, defineExpose, toRaw } from 'vue'
import ImgPicker from '@/components/editor/ImgPicker.vue';
import ImgCrop from '@/components/ImgCrop.vue'
import WechatMiniAppIcon from "@/components/icons/WechatMiniAppIcon"
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'

const pickerQuery = defineModel()
const cropSize = ref({
  width: 0,
  height: 0,
})
const { pickerPageInfo } = defineProps(['pickerPageInfo'])

const $emits = defineEmits(['searchMiniApp'])
const refMiniAppImgPicker = ref(null)
const refMiniAppCardImgPicker = ref(null)
const refImgCrop = ref(null)
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
    displayTypeRef.value = "0"
    dataForm.value = {
      miniAppLink: '#小程序://问卷星/DAfnLzsZZn17Ibu',
      miniAppText: '疯狂星期五',
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

function insertMiniApp() {
  if (displayTypeRef.value == '0') {
    if (!dataForm.value.miniAppText) {
      ElMessage.error('请输入文字内容')
      return
    }
    $emits("searchMiniApp", { type: "byAppLink", "formData": { miniAppLink: dataForm.value.miniAppLink, miniAppText: dataForm.value.miniAppText } })
  } else if (displayTypeRef.value == '1') {
    if (!dataForm.value.miniAppImg) {
      ElMessage.error('请选择/上传图片')
      return
    }
    $emits("searchMiniApp", { type: "byAppLink", "formData": { miniAppLink: dataForm.value.miniAppLink, miniAppImg: dataForm.value.miniAppImg } })
  } else if (displayTypeRef.value == '2') {
    if (!dataForm.value.miniAppCardTitle) {
      ElMessage.error('请输入卡片标题')
      return
    }
    if (!dataForm.value.miniAppCardImg) {
      ElMessage.error('请选择/上传卡片图片')
      return
    }
    $emits("searchMiniApp", { type: "byAppLink", "formData": { miniAppLink: dataForm.value.miniAppLink, miniAppCardTitle: dataForm.value.miniAppCardTitle, miniAppCardImg: dataForm.value.miniAppCardImg, miniAppCardImgCrop: toRaw(dataForm.value.miniAppCardImgCrop) } })
  }
}

defineExpose({
  openDialog,
  closeDialog,
});

</script>
