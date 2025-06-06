<template>
  <el-dialog :close-on-click-modal="false" @open="handleDialogOpen" @closed="handleDialogClosed" title="发送到其他账号"
    v-model="dialogVisibleRef" width="600px">
    <el-row :gutter="40">
      <el-col :span="18">
        <el-checkbox label="全部" @change="clickAllOtherAccounts"></el-checkbox>
        <el-checkbox-group v-model="otherAccountsChoosedRef">
          <el-checkbox v-for="(item) in props.accounts" :key="item.id" :label="item.id">
            {{ item.name }}
          </el-checkbox>
          <!-- <el-checkbox label="Option 2 & Value 2" /> -->
        </el-checkbox-group>
      </el-col>
      <el-col :span="6">
        <el-button @click="handleSend" type="primary">立即发送</el-button>
      </el-col>
    </el-row>
  </el-dialog>
</template>
<script setup>
// import { useStore } from 'vuex'
import { onActivated, onMounted, ref, toRefs, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { toDeepRaw } from "@/utils/convert"

// const store = useStore()
// const { all_accounts } = toRefs(store.getters)
const props = defineProps(['dialogVisible', 'accounts']);

const emitEvents = defineEmits(['dialogClosed', 'instantSend'])

const dialogVisibleRef = ref(false)
// const otherAccountsRef = ref([])
const otherAccountsChoosedRef = ref([])


watch(() => [props.dialogVisible], (newVal) => {
  // console.log("syncToOtherAccounts props.changed=>", newVal)
  dialogVisibleRef.value = newVal[0]
})

const clickAllOtherAccounts = (checkedAll) => {
  console.log("props.accounts=>", props.accounts)
  if (checkedAll) {
    otherAccountsChoosedRef.value = props.accounts.map(v => v.id)
  } else {
    otherAccountsChoosedRef.value = []
  }
}
const handleDialogOpen = () => {
  otherAccountsChoosedRef.value = []
}

const handleDialogClosed = () => {
  emitEvents("dialogClosed")
}

const handleSend = () => {
  if (otherAccountsChoosedRef.value.length === 0) {
    ElMessageBox.alert('请至少选择一个需要发送的账号', '警告', {
      confirmButtonText: '确定',
      type: 'warning'
    }).catch(() => { })
    return
  }
  dialogVisibleRef.value = false
  emitEvents("instantSend", { otherAccountsChoosed: toDeepRaw(otherAccountsChoosedRef.value) })
}

</script>