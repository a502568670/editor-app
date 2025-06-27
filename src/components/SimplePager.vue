<template>
  <div class="flex justify-center items-center w-[200px]">
    <div class="bg-gray-200 flex justify-center items-center rounded-sm w-6 h-6 cursor-pointer"
      :class="{ 'text-[#cfd0d3]': pre_disabled, 'cursor-not-allowed': pre_disabled, 'pointer-events-none': pre_disabled }"
      @click="handlePrev">
      <el-icon><arrow-left /></el-icon>
    </div>
    <div class="flex-1 flex justify-center items-center text-sm space-x-1"><span class="text-green-400 mr-1">{{ page_no
        }}</span>/<span>{{
          total_page }}</span>
    </div>
    <div class="bg-gray-200 flex justify-center items-center rounded-sm w-6 h-6 cursor-pointer"
      :class="{ 'text-[#cfd0d3]': next_disabled, 'cursor-not-allowed': next_disabled, 'pointer-events-none': next_disabled }"
      @click="handleNext">
      <el-icon class="el-icon"><arrow-right /></el-icon>
    </div>
    <div class="w-[48px] px-2 flex items-center rounded-sm border-none">
      <el-input class="bg-gray-200 text-sm rounded-sm" style="height:24px" v-model="new_page"
        oninput="value=value.replace(/[^0-9]/g,'')" />
    </div>
    <div class="flex text-sm cursor-pointer" @click="handleJumpTo">跳转</div>
  </div>
</template>
<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  cursor: default;
  @apply bg-gray-200;
}

:deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}
</style>
<script setup>
import { ref, computed } from "vue"
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps(['page_no', 'total_cnt', 'page_count', 'list_by']);

const total_page = computed(() => parseInt(props.total_cnt / props.page_count) + 1);
const pre_disabled = computed(() => props.page_no <= 1);
const next_disabled = computed(() => props.page_no >= total_page.value);

const new_page = ref(1)

const simplePagerEvents = defineEmits(['paginate'])

const handlePrev = async () => {
  if (!props.list_by || props.page_no <= 0) {
    return
  }
  const begin = props.page_count * (props.page_no - 1)
  return await props.list_by({ begin, count: props.page_count, new_page: (props.page_no - 1) })
}

const handleNext = async () => {
  if (!props.list_by || props.page_no >= total_page.value) {
    return
  }
  const begin = props.page_count * (props.page_no + 1)
  console.log("begin:", begin)
  return await props.list_by({ begin, count: props.page_count, new_page: (props.page_no + 1) })
}

const handleJumpTo = async () => {
  if (new_page.value > total_page.value) {
    new_page.value = total_page.value
  }
  if (!props.list_by || props.page_no === new_page.value) {
    return
  }

  const begin = props.page_count * (parseInt(new_page.value) - 1)
  return await props.list_by({ begin, count: props.page_count, new_page: parseInt(new_page.value) })

}

</script>