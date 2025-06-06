<template>
  <el-dialog :close-on-click-modal="false" @closed="handleDialogClosed" title="选择公众号创建素材" v-model="dialogVisibleRef"
    width="750px">
    <div class="w-full flex flex-wrap gap-2 ">
      <div class="w-[230px] cursor-pointer flex border rounded shadow justify-center items-center px-2 py-1 h-[75px]"
        :class="{ 'border-green-500': accountsChoosedRef.findIndex(v => v.id === item.id) !== -1 }"
        v-for="item in all_accounts.list" :key="item.id" @click="handleSelect(item)">
        <img class="w-10 h-10 rounded-full" :src="item.avatar" />
        <div class="flex-1 pl-2 flex flex-col">
          <div class="flex-1 text-lg font-bold">{{ item.name }}</div>
          <div class=" text-gray-300">{{ item.original_id }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisibleRef = false">取消</el-button>
        <el-button @click="handleChoosed">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { onActivated, onMounted, ref, toRefs, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { toDeepRaw } from "@/utils/convert"

const store = useStore()
const { all_accounts } = toRefs(store.getters)
const props = defineProps(['dialogVisible']);

const emitEvents = defineEmits(['dialogClosed', 'accountChoose'])

const dialogVisibleRef = ref(false)
const accountsChoosedRef = ref([])

watch(() => [props.dialogVisible], (newVal) => {
  // console.log("choose account props.changed=>", newVal)
  dialogVisibleRef.value = newVal[0]
})

const handleDialogClosed = () => {
  emitEvents("dialogClosed")
}

const handleSelect = (account) => {
  console.log("----handleSelect---")
  accountsChoosedRef.value = [account]
}

const handleChoosed = () => {
  console.log("----handleChoosed---")
  emitEvents("accountChoose", { choosed: toDeepRaw(accountsChoosedRef.value) })
  console.log("----accountsChoosedRef.value---", accountsChoosedRef.value)
}

</script>
