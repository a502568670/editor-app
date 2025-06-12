<template>
  <nav class="flex flex-col">
    <div class="p-2 bg-white">
      <div class="px-2 py-0.5 flex items-center border rounded-sm">
        <el-icon>
          <Search />
        </el-icon>
        <el-input class="bg-white" v-model="queryRef" placeholder="搜索公众号" @input="handleInput" />
      </div>
    </div>
    <ul class="w-full flex flex-col bg-white" style="height:calc(100vh - 158px)">
      <li @click="handleSelect(item)" v-for="item in accountsRef" :key="item.id"
        :class="{ 'bg-gray-100': selected_account_id === item.id }"
        class="flex p-1 h-[75px] items-center border-b hover:bg-gray-100 cursor-pointer">
        <img class="w-10 h-10 rounded-full" :src="item.avatar" />
        <div class="flex-1 self-start pl-2 flex flex-col">
          <div class="flex-1">{{ item.name }}</div>
          <div class=" text-gray-300">--</div>
        </div>
      </li>
    </ul>
  </nav>
</template>
<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}

:deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}
</style>
<script setup>
import { ref, toRefs, onMounted, defineEmits, toRaw, onActivated } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { debounceFn } from "@/utils/index"
import { toDeepRaw } from "@/utils/convert"
import store from '@/store'

const { all_accounts } = toRefs(store.getters)

const accountsRef = ref([])
const selected_account_id = ref(0)
const queryRef = ref("")

const props = defineProps({
  defaultSelectedIndex: {
    type: Number,
    default: 0,
  },
  // list: {
  //   type: Array,
  //   default: () => {
  //     return [];
  //   },
  // },
});

const listAccounts = (query) => {
  const filteredAccounts = all_accounts.value.list.filter(a => a.name.includes(query))
  accountsRef.value = toDeepRaw(filteredAccounts)
  console.log("accountsRef.value=>", accountsRef.value)
}

onMounted(async () => {
  console.log("==onMounted AccountNav==")
  // listAccounts("")
})

onActivated(async () => {
  console.log("==onActivated AccountNav==")
  listAccounts("")
  if (props.defaultSelectedIndex < accountsRef.value.length) {
    selected_account_id.value = accountsRef.value[props.defaultSelectedIndex].id
    emitAccountEvents("accountSelect", { account: toDeepRaw(accountsRef.value[props.defaultSelectedIndex]), index: props.defaultSelectedIndex })
  }
})

const emitAccountEvents = defineEmits(['accountFilter', 'accountSelect'])

const handleInput = debounceFn((query) => {
  listAccounts(query)
  // emitAccountEvents("accountFilter", { query })
}, 200, false)

const handleSelect = (account) => {
  const { token, name, id, session_id } = account
  // console.log("token=>", token)
  // console.log("id=>", id)
  // console.log("session_id=>", session_id)
  if (!token || !session_id) {
    ElMessageBox.alert(`当前账号session过期,请切换到*账号中心*重新登录`, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    return
  }
  selected_account_id.value = account.id
  const idx = accountsRef.value.findIndex(v => v.id === selected_account_id.value)
  console.log("selected account.id=>", account.id)
  console.log("selected idx=>", idx)
  emitAccountEvents("accountSelect", { account: toRaw(account), index: idx })
}

</script>