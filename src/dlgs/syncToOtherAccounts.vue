<template>
  <el-dialog :close-on-click-modal="false" @open="handleDialogOpen" @closed="handleDialogClosed" title="发送到其他账号"
    v-model="dialogVisibleRef" width="600px">
    <el-row :gutter="40" class="w-full">
      <el-col :span="18">
        <el-checkbox label="全部" :indeterminate="otherAccountsChoosedRef.length>0&&otherAccountsChoosedRef.length<props.accounts.length" @change="clickAllOtherAccounts"></el-checkbox>
        <el-input v-model="input" placeholder="搜索公众号" size="small" style="margin-left: 10px;width: 200px;vertical-align: text-bottom;" clearable/>
        <el-checkbox-group v-model="otherAccountsChoosedRef">
          <el-checkbox v-for="(item) in filterAccounts" :key="item.id" :label="item.name" :value="item.id">
            {{ item.name }}
          </el-checkbox>
          <!-- <el-checkbox label="Option 2 & Value 2" /> -->
        </el-checkbox-group>
        <div v-if="filterAccounts.length===0">无搜索结果</div>
      </el-col>
      <el-col :span="6">
        <el-button @click="handleSend" type="primary">立即发送</el-button>
      </el-col>
    </el-row>
  </el-dialog>
</template>
<script setup>
// import { useStore } from 'vuex'
import { computed, onActivated, onMounted, ref, toRefs, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { toDeepRaw } from "@/utils/convert"

// const store = useStore()
// const { all_accounts } = toRefs(store.getters)
const props = defineProps(['dialogVisible', 'accounts']);

const emitEvents = defineEmits(['dialogClosed', 'instantSend'])

const dialogVisibleRef = ref(false)
// const otherAccountsRef = ref([])
const otherAccountsChoosedRef = ref([])
var input=ref('')
var filterAccounts=computed(()=>{
  if(input.value){
    return props.accounts.filter(v=>v.name.indexOf(input.value)>-1)
  }
  return props.accounts;
})
// watch(otherAccountsChoosedRef,()=>console.log(otherAccountsChoosedRef.value))


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