<template>
  <div class="account-list">
    <el-input v-model="listQuery.keyword" clearable placeholder="输入关键词" @input="handleInput" />
    <div class="account-list_list">
      <draggable
        v-model="accounts"
        ghost-class="ghost"
        :disabled="dragDisabled"
        handle=".handle"
        @end="handleDragEnd"
        item-key="id"
      >
        <template #item="{ element }">
          <div
            @click="clickAccount(element)"
            class="account-list_item hover:bg-zinc-100 group transition duration-500"
            :class="{
              '!bg-zinc-200': $props.selectId === element.id,
              grayscale: element.expired
            }"
          >
            <img
              style="width: 25px; height: 25px; border-radius: 50%"
              :src="element.avatar"
              :class="{ 'handle cursor-move': !dragDisabled }"
            />
            <div class="cursor-pointer pl-2 flex-1 flex items-center justify-around">
              <div
                class="truncate flex-1 w-0"
                :class="{ 'text-[var(--jzl-primary-color)]': $props.selectId === element.id }"
              >
                {{ element.name }}
              </div>
              <img src="@/assets/image/gzh.png" style="width: 15px; height: 15px" />
            </div>
            <div v-if="$props.showDel" class="items-center justify-center ml-1 hidden group-hover:flex">
              <el-popconfirm title="你是否要删除该公众号" @confirm="delAccount(element.wechat_id)" placement="top-end">
                <template #reference>
                  <el-icon style="color: brown" @click.prevent.stop class="cursor-pointer">
                    <Close />
                  </el-icon>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    <el-button v-if="$props.showAdd" style="width: 100%" type="primary" @click="addAccount"> 登录微信公众号 </el-button>
  </div>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import store from '@/store';
import { toDeepRaw } from '@/utils/convert';
import { sortByOrder, debounceFn } from '@/utils/index';
import draggable from 'vuedraggable';
import { Close } from '@element-plus/icons-vue';

defineProps({
  selectId: {},
  showAdd: {
    type: Boolean,
    default: true
  },
  showDel: {
    type: Boolean,
    default: true
  }
});
const emit = defineEmits(['clickAccountTrigger', 'delAccountTrigger', 'addAccountTrigger']);

const { all_accounts, account_orders } = toRefs(store.getters);

// 账号列表数据
const accounts = ref([]);

// 如果是筛选状态下，不可拖拽
const dragDisabled = computed(() => listQuery.value.keyword.length > 0);
/** 拖拽后更新排序 */
const handleDragEnd = async e => {
  const { oldIndex, newIndex } = e;
  if (oldIndex !== newIndex) {
    const new_account_orders = accounts.value.map(v => v.id);
    store.commit('SET_ACCOUNT_ORDERS', new_account_orders);
    localStorage.setItem('account_orders', new_account_orders);
  }
};

const listQuery = ref({
  page: 1,
  num: 20,
  type: 1,
  keyword: ''
});

/** 搜索事件 */
const handleInput = debounceFn(
  () => {
    listQuery.value.page = 1;
    getList();
  },
  200,
  false
);

/** 获取列表数据 */
const getList = () => {
  const query = listQuery.value.keyword;
  // 过滤账号
  const filteredAccounts = toDeepRaw(all_accounts.value.list.filter(a => a.name.includes(query)));
  // 排序
  const { result } = sortByOrder(filteredAccounts, toDeepRaw(account_orders.value));
  accounts.value = result;
};

/** 点击删除按钮触发 */
const delAccount = id => {
  emit('delAccountTrigger', id);
};

/** 点击登录账号按钮触发 */
const addAccount = () => {
  emit('addAccountTrigger');
};

/** 点击账号触发 */
const clickAccount = account => {
  emit('clickAccountTrigger', account);
};

const proxyAccounts = new Proxy(accounts,{
  get(target, key) {
    return target.value[key]
  },
})

defineExpose({
  getList,
  proxyAccounts
});
</script>

<style scoped>
.account-list {
  width: 250px;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  background-color: #fff;
}

.account-list_list {
  flex: 1;
  overflow-y: auto;
}

.account-list_item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-radius: var(--jzl-border-radius-large);
  margin-top: 10px;
}
</style>
