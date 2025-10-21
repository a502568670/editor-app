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
              <img :src="getPlatformsImg(element.platform_id)" style="width: 18px; height: 18px" />
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
    <el-popover v-if="$props.showAdd" placement="top" :width="220" trigger="click">
      <template #reference>
        <el-button style="width: 100%" type="primary"> 添加账号 </el-button>
      </template>
      <div>
        <Transition mode="out-in">
          <div v-if="!isUniversalForm" class="grid grid-cols-2 gap-2">
            <div v-for="item of platforms" :key="item.id" class="account-list_platforms" @click="addAccount(item)">
              <img :src="item.img" style="width: 30px; height: 30px" />
              <span>{{ item.name }}</span>
            </div>
          </div>
          <div v-else>
            <el-form :model="universalForm" label-position="top" style="max-width: 100%">
              <el-form-item label="昵称">
                <el-input v-model="universalForm.name" />
              </el-form-item>
              <el-form-item label="平台首页">
                <el-input v-model="universalForm.url" />
              </el-form-item>
              <el-form-item>
                <div class="text-right w-full">
                  <el-button @click="isUniversalForm = false">取消</el-button>
                  <el-button type="primary" @click="addUniversal">添加</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </Transition>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import store from '@/store';
import { toDeepRaw } from '@/utils/convert';
import { sortByOrder, debounceFn } from '@/utils/index';
import draggable from 'vuedraggable';
import { Close } from '@element-plus/icons-vue';
import { apperrmsg } from '@/utils/constants';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAccountStore } from '@/store/piniaStore';
import { createAccount } from '@/api/account';
import { getToken } from '@/utils/auth';

const props = defineProps({
  selectId: {},
  showAdd: {
    type: Boolean,
    default: true
  },
  showDel: {
    type: Boolean,
    default: true
  },
  invalidWarn: {
    type: Boolean,
    default: true
  }
});
const emit = defineEmits(['clickAccountTrigger', 'delAccountTrigger', 'addAccountTrigger']);

const { all_accounts, account_orders } = toRefs(store.getters);

const platforms = [
  {
    name: '哔哩哔哩',
    img: new URL('@/assets/image/account/bilibili.png', import.meta.url).href,
    id: 1
  },
  {
    name: '头条',
    img: new URL('@/assets/image/account/tt.png', import.meta.url).href,
    id: 2
  },
  {
    name: '百家',
    img: new URL('@/assets/image/account/bj.png', import.meta.url).href,
    id: 3
  },
  {
    name: '微信公众号',
    img: new URL('@/assets/image/account/wxgzh.png', import.meta.url).href,
    id: 4
  },
  {
    name: '小红书',
    img: new URL('@/assets/image/account/xhs.png', import.meta.url).href,
    id: 5
  },
  {
    name: '通用平台',
    img: new URL('@/assets/image/account/typt.png', import.meta.url).href,
    id: 6
  }
];
/** 获取账号对应的logo */
const getPlatformsImg = id => {
  const platform = platforms.find(item => item.id === id);
  return platform?.img;
};
// 是否显示通用平台表单
const isUniversalForm = ref(false);
// 通用平台表单
const universalForm = ref({
  name: '',
  url: ''
});

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

const account = useAccountStore();
/** 点击删除按钮触发 */
const delAccount = async id => {
  await store.dispatch('DelAccount', id);
  account.update(account.list.filter(item => item.id !== id));
  getList();
  ElMessage({ type: 'success', message: '删除成功' });
  emit('delAccountTrigger', id);
};

/** 点击平台触发 */
const addAccount = platform => {
  // 如果是通用平台则打开表单
  if (platform.id === 6) {
    isUniversalForm.value = true;
    return;
  }
  emit('addAccountTrigger', platform);
};
/** 点击通用平台的添加时触发 */
const addUniversal = async () => {
  const platform = {
    platform_id: 6,
    originalUsername: Math.floor(Date.now() / 1000),
    session_id: '',
    name: universalForm.value.name,
    avatar: '',
    platform_url: universalForm.value.url
  };
  const { data } = await createAccount(platform);
  if (data.code === 1) {
    store.dispatch('ListAccounts').then(() => {
      getList();
    });
    ElMessage({ type: 'success', message: data.msg || '添加成功' });
  } else {
    ElMessage({ type: 'error', message: data.msg || '添加失败' });
  }
};

/** 点击账号触发 */
const clickAccount = account => {
  const { token, session_id } = account;
  if (props.invalidWarn && (!token || !session_id)) {
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    })
      .then(() => {
        console.log('then');
      })
      .catch(() => {
        console.log('catch');
      });
    return;
  }
  emit('clickAccountTrigger', account);
};

const proxyAccounts = new Proxy(accounts, {
  get(target, key) {
    return target.value[key];
  }
});

defineExpose({
  getList,
  proxyAccounts
});
</script>

<style scoped>
.v-leave-active,
.v-enter-active {
  transition: all 0.3s;
}

.v-enter-from,
.v-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

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

.account-list_platforms {
  @apply hover:bg-zinc-100 cursor-pointer p-2 rounded-md flex flex-col justify-center items-center;
}
</style>
