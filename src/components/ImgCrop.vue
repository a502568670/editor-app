<template>
    <div class="container-img-crop" :class="{plain:button||nul}">
        <img v-if="imgSrc" :src="previewSrc || imgSrc" class="max-h-full" alt="">
        <el-button v-else-if="button" type="primary" :icon="UploadFilled" @click="refInput.click()">本地上传</el-button>
        <i v-else-if="nul"></i>
        <template v-else>
            <el-icon :size="24">
                <UploadFilled />
            </el-icon>
            <span class="mt-1">{{ $attrs.placeholder }}</span>
        </template>
        <input class="opacity-0 size-[100%] absolute cursor-pointer" ref="input" @change="onFileChange" type="file"
            accept="image/*">
        <div v-if="imgSrc" class="actions">
            <el-tooltip content="裁剪">
                <el-icon :size="24" class="mr-6" @click="onImageCrop">
                    <Crop></Crop>
                </el-icon>
            </el-tooltip>
            <el-tooltip content="修改">
                <el-icon :size="24" @click="refInput.click()">
                    <UploadFilled></UploadFilled>
                </el-icon>
            </el-tooltip>
        </div>
        <el-dialog v-model="open" title="裁剪图片">
            <div class="w-full">
                <el-radio-group class="mb-2" v-model="fixVal">
                    <el-radio value="1">横图(16:7)</el-radio>
                    <el-radio value="2">竖图(3:4)</el-radio>
                    <el-radio value="3">正方形(1:1)</el-radio>
                    <el-radio value="4">自由比例</el-radio>
                </el-radio-group>
                <div class="w-full h-[50vh]">
                    <VueCropper ref="cropper" :img="cropperSrc" :fixed="fixed" :fixed-number="fixedNumber" v-bind="opt"></VueCropper>
                </div>
            </div>
            <template #footer>
                <el-button @click="open = false">取消</el-button>
                <el-button type="primary" @click="onConfirm">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ref, watch, onMounted, useTemplateRef, toRef, inject, computed, nextTick } from 'vue'
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css'
import { UploadFilled, Crop } from '@element-plus/icons-vue'
import store from '@/store';
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/img';
import { serializeCookie } from '@/utils/cookie';

var { imgSrc, button,upload,nul } = defineProps({
    imgSrc: String,
    button: Boolean,
    upload: Boolean,
    nul: Boolean,
})
var opt = {
    centerBox: true, mode: 'contain', outputType: 'png', outputSize: 1,
    autoCrop: true, autoCropWidth: 9999, autoCropHeight: 9999,
    // fixed:true,fixedNumber:[1,0.425],
    full: true,
}
var refCropper = useTemplateRef('cropper');
var fixVal=ref('1');
var fixed=computed(() => fixVal.value!=='4')
var fixedRatio={
    1:[1,0.425],
    2:[3,4],
    3:[1,1],
}
var fixedNumber=computed(()=>fixedRatio[fixVal.value])
watch(fixedNumber,()=>nextTick(()=>refCropper.value.goAutoCrop()))
var open = ref(false)
defineExpose({
    click(){
        refInput.click()
    },
    cropWith(url){
        open.value=true
        cropperSrc.value=url
        opt.extraData={name:'图片-'+Date.now()+'.png',type:'image/png'}
    },
})
// var imgSrc=defineModel()
var $emit = defineEmits(['change'])
var previewSrc = ref(imgSrc)
var cropperSrc = ref(null)
function onFileChange(e) {
    var file = e.target.files[0];
    if (file) {
        var { type, name } = file;
        if (type.startsWith('image/')) {
            var reader = new FileReader()
            reader.onload = () => {
                open.value = true
                cropperSrc.value = reader.result
                opt.extraData = { name: `${name}.png`, type: 'image/png' }
            }
            reader.readAsDataURL(file)
        } else {
            ElMessage({ type: 'error', message: '无效的图片' })
        }
    } else previewSrc.value = imgSrc
    e.target.value = ''
}
function onImageCrop() {
    open.value = true
    cropperSrc.value = imgSrc
}
var refInput = useTemplateRef('input')
var selectedAccount=inject('selectedAccount')
function onConfirm() {
    open.value = false;
    refCropper.value.getCropData((data) => {
        previewSrc.value = data;
        opt.extraData.data = data.substring(22)
        if(upload){
            try {
                const { session_id, token } = selectedAccount.value
                uploadImage({
                    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
                    token: parseInt(token),
                    base64_image:opt.extraData.data,
                    filename:opt.extraData.name,
                    content_type:opt.extraData.type,
                }).then(res=>$emit('change',res.data.cdn_url))
            } catch (err) {
                console.error(err)
            }
        } else $emit('change', opt.extraData)
    })

}
// onMounted(()=>{
//     store.dispatch('ListAccounts')
// })
watch(() => imgSrc, () => {
    previewSrc.value = imgSrc;
})
</script>
<style>
.container-img-crop:not(.plain) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 80px;
    border: 1px dashed var(--el-border-color);
    cursor: pointer;
}

.container-img-crop:hover .actions {
    visibility: visible;
    background-color: rgba(0, 0, 0, 0.5);
}

.container-img-crop .actions {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background-color: rgba(0, 0, 0, 0);
    visibility: hidden;
    transition: .3s;
}
.container-img-crop .el-radio {
    /* margin-right: 10px; */
}
</style>
