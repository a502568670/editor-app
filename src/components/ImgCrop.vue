<template>
    <div class="container-img-crop">
        <img v-if="imgSrc" :src="previewSrc||imgSrc" class="max-h-full" alt="">
        <template v-else>
            <el-icon :size="24"><UploadFilled/></el-icon>
            <span class="mt-1">{{ $attrs.placeholder }}</span>
        </template>
        <input class="opacity-0 size-[100%] absolute cursor-pointer" ref="input" @change="onFileChange" type="file" accept="image/*">
        <el-dialog v-model="open" title="裁剪图片">
            <div class="w-full h-[50vh]">
                <VueCropper ref="cropper" :img="cropperSrc" v-bind="opt"></VueCropper>
            </div>
            <template #footer>
                <el-button @click="open=false">取消</el-button>
                <el-button type="primary" @click="onConfirm">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import {ref,watch,onMounted,useTemplateRef,toRef} from 'vue'
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css'
import {UploadFilled} from '@element-plus/icons-vue'
import store from '@/store';
import {ElMessage} from 'element-plus'

var opt={
    centerBox:true,mode:'contain',outputType:'png',outputSize:1,
    autoCrop:true,autoCropWidth:900,autoCropHeight:383,
    // fixed:true,fixedNumber:[1,0.425],
    full:true,
}
var open=ref(false)
var {imgSrc}=defineProps(['imgSrc'])
// var imgSrc=defineModel()
var $emit=defineEmits(['change'])
var previewSrc=ref(imgSrc)
var cropperSrc=ref(null)
function onFileChange(e){
    var file = e.target.files[0];
    if(file){
        var {type,name}=file;
        if(type.startsWith('image/')){
            var reader = new FileReader()
            reader.onload=()=>{
                open.value=true
                cropperSrc.value=reader.result
                opt.extraData={name:`${name}.png`,type:'image/png'}
            }
            reader.readAsDataURL(file)
        }else{
            ElMessage({type:'error',message:'无效的图片'})
        }
    }else previewSrc.value=imgSrc
    e.target.value=''
}
var refCropper=useTemplateRef('cropper');
function onConfirm(){
    open.value=false;
    refCropper.value.getCropData((data)=>{
        previewSrc.value=data;
        opt.extraData.data=data.substring(22)
        $emit('change',opt.extraData)
    })
    
}
// onMounted(()=>{
//     store.dispatch('ListAccounts')
// })
watch(() => imgSrc,()=>{
    previewSrc.value=imgSrc;
})
</script>
<style>
.container-img-crop {
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
</style>
