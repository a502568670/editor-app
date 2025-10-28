<template>
  <el-dialog :close-on-click-modal="false" @open="handleDialogOpen" @closed="handleDialogClosed" title="发送到其他账号"
    v-model="dialogVisibleRef" width="600px">
    <div class="w-full">
      <div class="flex items-center mb-2">
        <el-checkbox label="全部" :indeterminate="otherAccountsChoosedRef.length>0&&otherAccountsChoosedRef.length<props.accounts.length" @change="clickAllOtherAccounts"></el-checkbox>
        <el-input v-model="input" placeholder="搜索公众号" size="small" style="margin-left: 10px;width: 200px;" clearable/>
        <div class="flex-1 flex items-center justify-center">
          <span class="text-sm text-gray-600">
            已选择 <span class="font-semibold" style="color: var(--jzl-primary-color)">{{ selectedCount }}</span> 个账号
          </span>
        </div>
        <el-button @click="handleSend" type="primary">立即发送</el-button>
      </div>
      <el-checkbox-group v-model="otherAccountsChoosedRef" class="grid grid-cols-3 gap-0 mr-10">
        <el-checkbox class="bg-white" v-for="(item) in filterAccounts" :key="item.id" :label="item.name" :value="item.id">
          {{ item.name }}
        </el-checkbox>
        <!-- <el-checkbox label="Option 2 & Value 2" /> -->
      </el-checkbox-group>
      <div v-if="filterAccounts.length===0">无搜索结果</div>
    </div>
  </el-dialog>
</template>
<script setup>
import { computed, ref, watch, onActivated, toRefs } from 'vue'
import { ElMessageBox } from 'element-plus'
import { toDeepRaw } from "@/utils/convert"
import { getAccountGroupList } from '@/api/account-group';
import store from '@/store';
import { sortByOrder } from '@/utils/index';

const { account_orders } = toRefs(store.getters)
const props = defineProps(['dialogVisible', 'accounts']);

const emitEvents = defineEmits(['dialogClosed', 'instantSend'])

const dialogVisibleRef = ref(false)
// 分组数据
const accountGroups = ref([]);
/** 加载分组列表 */
const loadAccountGroups = async () => {
  try {
    const response = await getAccountGroupList();
    if (response && response.data && response.data.code === 1) {
      accountGroups.value = response.data.data.list || [];
    }
  } catch (error) {
    console.error('加载分组列表失败:', error);
  }
};
const otherAccountsChoosedRef = ref([])
var input=ref('')
var filterAccounts=computed(()=>{
  const filteredAccounts = props.accounts.filter(v=>v.name.indexOf(input.value)>-1)

  const newGroup = {
    0: {
      id: 0,
      name: '未分组',
      accounts: []
    }
  };
  accountGroups.value.forEach(group => {
    newGroup[group.id] = {
      id: group.id,
      name: group.name || group.label,
      accounts: []
    };
  });

  // 将账号分配到对应的分组
  filteredAccounts.forEach(account => {
    if (newGroup[account.group_id]) {
      newGroup[account.group_id].accounts.push(account);
    } else {
      // 未分组
      newGroup[0].accounts.push(account);
    }
  });
  for (const key in newGroup) {
    if (newGroup[key].accounts.length === 0) {
      delete newGroup[key];
    } else {
      // 排序
      const { result } = sortByOrder(newGroup[key].accounts, toDeepRaw(account_orders.value[key]));
      newGroup[key].accounts = result;
    }
  }
  return Object.values(newGroup).reduce((acc, group) => {
    return acc.concat(group.accounts);
  }, []);
})

// 计算选择的账号数量
const selectedCount = computed(() => {
  return otherAccountsChoosedRef.value.length
})


watch(() => [props.dialogVisible], (newVal) => {
  dialogVisibleRef.value = newVal[0]
})

const clickAllOtherAccounts = (checkedAll) => {
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

onActivated(() => {
  loadAccountGroups();
})
</script>
