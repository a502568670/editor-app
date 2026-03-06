<template>
    <div class="container-img-crop" :class="{ plain: button || nul }">
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
            <div class="w-full relative">
                <div class="w-full h-[50vh] relative">
                    <VueCropper ref="cropper" :img="cropperSrc" :fixed="fixed" :fixed-number="fixedNumber" v-bind="opt">
                    </VueCropper>
                    <!-- 裁剪比例选择浮动层 -->
                    <div class="crop-ratio-overlay">
                        <el-radio-group v-model="fixVal" class="crop-ratio-group">
                            <el-radio value="1">16:9</el-radio>
                            <el-radio value="2">2.35:1</el-radio>
                            <el-radio value="3">1:1</el-radio>
                        </el-radio-group>
                    </div>
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
import { cropImage, uploadImage } from '@/api/img';
import { serializeCookie } from '@/utils/cookie';

var { imgSrc, button, upload, nul, forbidCrop } = defineProps({
    imgSrc: String,
    button: Boolean,
    upload: Boolean,
    nul: Boolean,
    forbidCrop: Boolean,
})
var opt = {
    centerBox: true,     // 限制裁剪框在图片范围内，不能超出图片
    mode: 'contain', 
    outputType: 'png', 
    outputSize: 1,
    autoCrop: true, 
    autoCropWidth: 800,  // 默认裁剪框宽度
    autoCropHeight: 450, // 默认裁剪框高度（16:9 比例）
    full: false,         // 改为false，让裁剪框可以更灵活
    canMove: true,       // 允许移动图片
    canMoveBox: true,    // 允许移动裁剪框
    fixedBox: false,     // 裁剪框不固定大小
}
var refCropper = useTemplateRef('cropper');
var fixVal = ref('1');  // 默认选择第一个选项：16:9
var fixed = computed(() => true)
var fixedRatio = {
    1: [16, 9],   // 16:9
    2: [1, 0.425], // ≈ 2.35:1
    3: [1, 1]     // 1:1
}
var fixedNumber = computed(() => fixedRatio[fixVal.value])
watch(fixedNumber, () => nextTick(() => refCropper.value.goAutoCrop()))
var open = ref(false)
defineExpose({
    click() {
        refInput.click()
    },
    cropWith(url, { radio }) {
        open.value = true
        cropperSrc.value = url
        opt.extraData = { filename: '图片-' + Date.now() + '.png', content_type: 'image/png' }
        fixVal.value = radio
    }
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
                opt.extraData = { filename: name ? `${name}.png` : '图片-' + Date.now() + '.png', content_type: 'image/png' }
            }
            reader.readAsDataURL(file)
        } else {
            ElMessage({ type: 'error', message: '无效的图片' })
        }
    } else previewSrc.value = imgSrc
    e.target.value = ''
}
function onImageCrop() {
    if (!forbidCrop) {
        open.value = true
    }
    cropperSrc.value = imgSrc
}
var refInput = useTemplateRef('input')
var selectedAccount = inject('selectedAccount')
async function onConfirm() {
    open.value = false;
    refCropper.value.getCropData(async (data) => {
        previewSrc.value = data;
        opt.extraData.base64_image = data.substring(22)
        
        try {
            const { session_id, token } = selectedAccount.value
            const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
            
            // 判断 cropperSrc 是 URL 还是 base64
            const isUrl = cropperSrc.value && (cropperSrc.value.startsWith('http://') || cropperSrc.value.startsWith('https://'))
            
            let cdn_url = cropperSrc.value
            
            // 如果是本地图片（base64），先上传到公众号
            if (!isUrl) {
                try {
                    ElMessage({ type: 'info', message: '正在上传图片到公众号...' })
                    const uploadResult = await uploadImage({
                        cookies: cookies,
                        token: parseInt(token),
                        ...opt.extraData
                    })
                    
                    if (uploadResult.data && uploadResult.data.cdn_url) {
                        cdn_url = uploadResult.data.cdn_url
                        ElMessage({ type: 'success', message: '图片上传成功' })
                    } else {
                        ElMessage({ type: 'error', message: '图片上传失败' })
                        previewSrc.value = imgSrc
                        return
                    }
                } catch (err) {
                    console.error("ImgCrop: 上传失败:", err)
                    ElMessage({ type: 'error', message: '图片上传失败' })
                    previewSrc.value = imgSrc
                    return
                }
            }
            
            // 获取裁剪器中的坐标和图片信息
            const cropAxis = refCropper.value.getCropAxis()
            
            // 获取裁剪器中图片的实际显示尺寸（用于归一化坐标）
            const cropperImg = new Image()
            cropperImg.crossOrigin = 'anonymous'
            cropperImg.onload = async () => {
                const imgWidth = cropperImg.naturalWidth
                const imgHeight = cropperImg.naturalHeight
                
                // 将裁剪坐标归一化为 0-1 范围
                const normalizedCrop = {
                    size_x1: cropAxis.x1 / imgWidth,
                    size_y1: cropAxis.y1 / imgHeight,
                    size_x2: cropAxis.x2 / imgWidth,
                    size_y2: cropAxis.y2 / imgHeight
                }
                
                const cropWidth = normalizedCrop.size_x2 - normalizedCrop.size_x1
                const cropHeight = normalizedCrop.size_y2 - normalizedCrop.size_y1
                
                // 为不同的 format 计算不同的裁剪坐标
                // format0 (16:9) - 横图，保持全宽，调整高度
                const format0_height = cropWidth / (16/9)
                const format0_y_center = (normalizedCrop.size_y1 + normalizedCrop.size_y2) / 2
                const format0_crop = {
                    size_x1: normalizedCrop.size_x1,
                    size_y1: Math.max(0, format0_y_center - format0_height / 2),
                    size_x2: normalizedCrop.size_x2,
                    size_y2: Math.min(1, format0_y_center + format0_height / 2),
                    format: '16_9'
                }
                
                // format1 (2.35:1) - 超宽横图
                const format1_height = cropWidth / 2.35
                const format1_y_center = (normalizedCrop.size_y1 + normalizedCrop.size_y2) / 2
                const format1_crop = {
                    size_x1: normalizedCrop.size_x1,
                    size_y1: Math.max(0, format1_y_center - format1_height / 2),
                    size_x2: normalizedCrop.size_x2,
                    size_y2: Math.min(1, format1_y_center + format1_height / 2),
                    format: '2.35_1'
                }
                
                // format2 (1:1) - 正方形，保持较小的边，居中裁剪
                const squareSize = Math.min(cropWidth, cropHeight)
                const format2_x_center = (normalizedCrop.size_x1 + normalizedCrop.size_x2) / 2
                const format2_y_center = (normalizedCrop.size_y1 + normalizedCrop.size_y2) / 2
                const format2_crop = {
                    size_x1: Math.max(0, format2_x_center - squareSize / 2),
                    size_y1: Math.max(0, format2_y_center - squareSize / 2),
                    size_x2: Math.min(1, format2_x_center + squareSize / 2),
                    size_y2: Math.min(1, format2_y_center + squareSize / 2),
                    format: '1_1'
                }
                
                // 生成 fingerprint
                const fingerprint = generateFingerprint(cdn_url)
                
                // 调用微信裁剪接口
                const cropData = {
                    cookies: cookies,
                    token: parseInt(token),
                    imgurl: cdn_url,
                    size_count: 3,
                    crop_info: [format0_crop, format1_crop, format2_crop],
                    fingerprint: fingerprint
                }
                
                try {
                    const cropResult = await cropImage(cropData)
                    
                    // 使用微信裁剪后的 URL
                    if (cropResult.data && cropResult.data.base_resp && cropResult.data.base_resp.ret === 0) {
                        if (cropResult.data.result && cropResult.data.result.length > 0) {
                            cdn_url = cropResult.data.result[0].cdnurl
                            // 更新预览图为裁剪后的 URL
                            previewSrc.value = cdn_url
                        }
                    }
                    
                    $emit('change', cdn_url)
                } catch (err) {
                    console.error("ImgCrop: 裁剪失败:", err)
                    // 裁剪失败，使用上传后的原图 URL
                    previewSrc.value = cdn_url
                    $emit('change', cdn_url)
                }
            }
            // 如果是本地图片，需要等图片加载完成后再获取尺寸
            if (!isUrl) {
                cropperImg.src = cdn_url
            } else {
                cropperImg.src = cropperSrc.value
            }
        } catch (err) {
            console.error("ImgCrop: 处理失败:", err)
        }
    })
}

// 生成 fingerprint
function generateFingerprint(url) {
    // 简单的哈希函数，生成类似 9e083655cb3092eb7cba2d400454b06c 的字符串
    let hash = 0;
    const str = url + Date.now();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}
// onMounted(()=>{
//     store.dispatch('ListAccounts')
// })
watch(() => imgSrc, () => {
    previewSrc.value = imgSrc;
})
</script>
<style>
.container-img-crop {
    position: relative;
}

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

/* 裁剪比例浮动层样式 */
.crop-ratio-overlay {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.crop-ratio-group {
    display: flex;
    gap: 8px;
}

.crop-ratio-group .el-radio {
    color: #fff;
    margin-right: 0;
}

.crop-ratio-group .el-radio__label {
    color: #fff;
    font-size: 14px;
}

.crop-ratio-group .el-radio__input.is-checked .el-radio__inner {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
}

.crop-ratio-group .el-radio__input.is-checked + .el-radio__label {
    color: #fff;
    font-weight: 600;
}
</style>
