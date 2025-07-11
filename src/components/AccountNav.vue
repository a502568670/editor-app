<template>
  <nav class="flex flex-col h-full overflow-y-scroll bg-white">
    <div class="p-2 bg-white">
      <div class="px-2 py-0.5 flex items-center border rounded-sm">
        <el-icon>
          <Search class="text-gray-400" />
        </el-icon>
        <el-input class="bg-white" v-model="queryRef" placeholder="搜索公众号" @input="handleInput" />
      </div>
    </div>
    <div class="w-full flex flex-col bg-white" style="height:calc(100vh - 158px)">
      <draggable v-model="accountsRef" class="list-group" ref="refList" ghost-class="ghost" :disabled="dragDisabled" handle=".handle"
        @start="handleDragStart" @end="handleDragEnd" item-key="id">
        <template #item="{ element }">
          <div @click="handleSelect(element)"
            class="flex p-1 h-[75px] items-center border-b hover:bg-gray-100 cursor-pointer list-group-item"
            :class="{ 'bg-gray-100': selected_account_id === element.id }">
            <img class="w-10 h-10 rounded-full" :class="{ 'handle cursor-move': !dragDisabled }"
              :src="element.avatar" />
            <div class="flex-1 self-start pl-2 flex flex-col">
              <div class="flex-1 break-all">{{ element.name }}</div>
              <div class=" text-gray-300">--</div>
            </div>
            <el-tooltip v-if="element.expired" content="登录过期">
              <el-icon style="color:red">
                <WarnTriangleFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </draggable>
    </div>

    <!-- <ul class="w-full flex flex-col bg-white" style="height:calc(100vh - 158px)">
      <li @click="handleSelect(item)" v-for="item in accountsRef" :key="item.id"
        :class="{ 'bg-gray-100': selected_account_id === item.id }"
        class="flex p-1 h-[75px] items-center border-b hover:bg-gray-100 cursor-pointer">
        <img class="w-10 h-10 rounded-full" :src="item.avatar" />
        <div class="flex-1 self-start pl-2 flex flex-col">
          <div class="flex-1 break-all">{{ item.name }}</div>
          <div class=" text-gray-300">--</div>
        </div>
        <el-tooltip v-if="item.expired" content="登录过期">
          <el-icon style="color:red">
            <WarnTriangleFilled />
          </el-icon>
        </el-tooltip>
      </li>
    </ul> -->
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


.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}
.list-group-item{
  scroll-margin-top: 100px;
}
</style>
<script setup>
import { ref, toRefs, onMounted, defineEmits, toRaw, onActivated, computed, useTemplateRef,nextTick } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, WarnTriangleFilled } from '@element-plus/icons-vue'
import { debounceFn, sortByOrder } from "@/utils/index"
import { toDeepRaw } from "@/utils/convert"
import store from '@/store'
import { apperrmsg } from '@/utils/constants';
import draggable from "vuedraggable";


const { all_accounts, account_orders } = toRefs(store.getters)

const accountsRef = ref([])
const selected_account_id = ref(0)
const queryRef = ref("")


// drag
const dragging = ref(false)
const dragDisabled = computed(() => queryRef.value.length > 0);


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
  const not_sort = toDeepRaw(filteredAccounts)
  console.log("all_accounts=>", all_accounts)
  console.log("account_orders=>", account_orders.value)
  const { result: sorted } = sortByOrder(not_sort, toDeepRaw(account_orders.value))
  accountsRef.value = sorted
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
  nextTick(scrollIndexIntoView);
  
})
var refList=useTemplateRef('refList')
function scrollIndexIntoView(){
  var $body=refList.value.$el;
  var $idx=$body.childNodes[props.defaultSelectedIndex]
  $idx?.scrollIntoView();
}

const emitAccountEvents = defineEmits(['accountFilter', 'accountSelect', 'accountReorder'])

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
    //TODO:封装成微信错误码invalid_session
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
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

const handleDragStart = (e) => {
  // console.log('handleDragStart:',e)
  dragging.value = true
}

const handleDragEnd = async (e) => {
  // console.log('handleDragEnd:',e)
  dragging.value = false
  const { oldIndex, newIndex } = e
  if (oldIndex != newIndex) {
    console.log('oldIndex:', oldIndex)
    console.log('newIndex:', newIndex)
    const oldId = accountsRef.value[newIndex].id
    const newId = accountsRef.value[oldIndex].id
    console.log(`oldId:${oldId}, newId:${newId}`)
    console.log('all_accounts.list:', all_accounts.value.list.map(v => v.id))
    console.log('==================')
    // store.dispatch('SWAPAccounts', { oldId, newId })
    const new_account_orders = accountsRef.value.map(v => v.id)
    console.log('new_account_orders', new_account_orders)
    store.commit('SET_ACCOUNT_ORDERS', new_account_orders)
    localStorage.setItem("account_orders", new_account_orders)
    emitAccountEvents("accountReorder")
  }
}

</script>