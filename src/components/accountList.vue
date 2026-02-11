<template>
  <div class="account-list">
    <div class="menu-bar" v-if="$props.showAdd">
      <el-button
        type="primary"
        link
        @click="handleUserManagement"
        class="user-mgmt-btn"
        :class="{ active: isAccountManagementPage }"
      >
        <el-icon>
          <user-filled />
        </el-icon>
        <span class="ml-1">账号管理</span>
      </el-button>
    </div>

    <!-- 搜索框 -->
    <el-input v-model="listQuery.keyword" clearable placeholder="输入关键词" @input="handleInput" />

    <div class="account-list_list">
      <!-- 分组模式 -->
      <div class="grouped-view">
        <el-collapse v-model="activeGroups">
          <el-collapse-item v-for="group in groupedAccounts" :key="group.id" :name="`group-${group.id}`">
            <template #title>
              <div class="group-header">
                <el-icon><FolderOpened /></el-icon>
                <span class="group-name">{{ group.name }}</span>
                <span class="group-count">({{ group.accounts.length }})</span>
              </div>
            </template>
            <VueDraggable
              v-model="group.accounts"
              :disabled="dragDisabled"
              :animation="150"
              ghostClass="ghost"
              @end="handleDragEnd"
            >
              <div
                v-for="account of group.accounts"
                :key="account.id"
                @click="clickAccount(account)"
                class="account-list_item hover:bg-zinc-100 group transition duration-500"
                :class="{
                  '!bg-zinc-200': getCurrentAccount?.id === account.id && !isAccountManagementPage,
                  grayscale: account.expired
                }"
              >
                <img style="width: 25px; height: 25px; border-radius: 50%" :src="account.avatar" />
                <div class="cursor-pointer pl-2 flex-1 flex items-center justify-around">
                  <div
                    class="truncate flex-1 w-0"
                    :class="{
                      'text-[var(--jzl-primary-color)]':
                        getCurrentAccount?.id === account.id && !isAccountManagementPage
                    }"
                  >
                    {{ account.name }}
                  </div>
                  <img :src="getPlatformsImg(account.platform_id)" style="width: 18px; height: 18px" />
                </div>
                <div v-if="$props.showDel" class="items-center justify-center ml-1 hidden group-hover:flex">
                  <el-popconfirm
                    title="你是否要删除该公众号"
                    @confirm="delAccount(account.wechat_id)"
                    placement="top-end"
                  >
                    <template #reference>
                      <el-icon style="color: brown" @click.prevent.stop class="cursor-pointer">
                        <Close />
                      </el-icon>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </VueDraggable>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    <el-popover ref="popoverRef" v-if="$props.showAdd" placement="top" :width="220" trigger="click">
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
            <el-form
              ref="ruleFormRef"
              :model="universalForm"
              :rules="universalFormRules"
              label-position="top"
              style="max-width: 100%"
            >
              <el-form-item label="昵称" prop="name">
                <el-input v-model="universalForm.name" />
              </el-form-item>
              <el-form-item label="平台首页网址(url)" prop="url">
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
import { ref, toRefs, computed, onActivated, nextTick } from 'vue';
import store from '@/store';
import { toDeepRaw } from '@/utils/convert';
import { sortByOrder, debounceFn } from '@/utils/index';
import { Close, UserFilled, FolderOpened } from '@element-plus/icons-vue';
import { apperrmsg } from '@/utils/constants';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAccountStore } from '@/store/piniaStore';
import { createAccount } from '@/api/account';
import { VueDraggable } from 'vue-draggable-plus';
import { getAccountGroupList } from '@/api/account-group';

const props = defineProps({
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
  },
  isManagementMode: {
    type: Boolean,
    default: false
  },
  isSupportUniversal: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['clickAccountTrigger', 'delAccountTrigger', 'addAccountTrigger', 'userManagementTrigger']);

const { all_accounts, account_orders, getCurrentAccount, getPreviousWxAccount } = toRefs(store.getters);

const platforms = [
  {
    name: '微信公众号',
    img: new URL('@/assets/image/account/wxgzh.png', import.meta.url).href,
    id: 4
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
const ruleFormRef = ref();
const universalForm = ref({
  name: '',
  url: ''
});
const universalFormRules = {
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入平台首页', trigger: 'blur' }]
};

// 分组数据
const accountGroups = ref([]);

// 活跃的折叠面板（默认展开未分组）
const activeGroups = ref(['group-0']);

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
    setGroupedAccounts();
  },
  200,
  false
);

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

/** 按分组组织账号 */
const groupedAccounts = ref({
  0: {
    id: 0,
    name: '未分组',
    accounts: []
  }
});
/** 设置分组账号 */
const setGroupedAccounts = () => {
  const query = listQuery.value.keyword;
  // 过滤账号
  const filteredAccounts = toDeepRaw(all_accounts.value.list.filter(a => a.name.includes(query)));

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
  groupedAccounts.value = newGroup;
};

const account = useAccountStore();
/** 点击删除按钮触发 */
const delAccount = async id => {
  await store.dispatch('DelAccount', id);
  account.update(account.list.filter(item => item.id !== id));
  setGroupedAccounts();
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
const popoverRef = ref();
const addUniversal = async () => {
  if (!ruleFormRef.value) return;
  await ruleFormRef.value.validate(async valid => {
    if (valid) {
      const platform = {
        platform_id: 6,
        platform_name: '通用平台',
        originalUsername: Math.floor(Date.now() / 1000),
        session_id: '',
        name: universalForm.value.name,
        avatar: new URL('@/assets/image/defimg.png', import.meta.url).href,
        platform_url: universalForm.value.url
      };
      const { data } = await createAccount(platform);
      if (data.code === 1) {
        store.dispatch('ListAccounts').then(() => {
          setGroupedAccounts();
        });
        ElMessage({ type: 'success', message: data.msg || '添加成功' });
        isUniversalForm.value = false;
        ruleFormRef.value.resetFields();
        popoverRef.value.hide();
      } else {
        ElMessage({ type: 'error', message: data.msg || '添加失败' });
      }
    }
  });
};

/** 点击账号触发 */
const clickAccount = account => {
  console.log('clickAccount', account);
  const { token, session_id, platform_id } = account;
  if (platform_id === 6 && !props.isSupportUniversal) {
    ElMessageBox.alert('该平台不支持此操作，已重新选择为公众号', '提示', {
      confirmButtonText: '确定',
      type: 'warning'
    }).then(()=>{
      if (getCurrentAccount.value.platform_id === 4) return
      clickAccount(getPreviousWxAccount.value)
    });
    return;
  }
  if (props.invalidWarn && (!token || !session_id)) {
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    });
    return;
  }
  store.commit('SET_CURRENT_ACCOUNT', account);
  emit('clickAccountTrigger', account);
};

/** 点击用户管理按钮触发 */
const handleUserManagement = () => {
  emit('userManagementTrigger');
};

/** 判断当前是否在账号管理页面 */
const isAccountManagementPage = computed(() => {
  return props.isManagementMode;
});

const proxyAccounts = new Proxy(groupedAccounts, {
  get(target, key) {
    return target.value[key];
  }
});

const dragDisabled = computed(() => listQuery.value.keyword !== '');
/** 拖拽结束事件 */
const handleDragEnd = e => {
  const { oldIndex, newIndex, clonedData } = e;
  const group = clonedData.group_id || 0;
  if (oldIndex !== newIndex) {
    const new_account_orders = groupedAccounts.value[group].accounts.map(v => v.id);
    store.commit('SET_ACCOUNT_ORDERS', { account_orders: new_account_orders, group });
    const orders = JSON.parse(localStorage.getItem('account_group_orders')) || {};
    orders[group] = new_account_orders;
    localStorage.setItem('account_group_orders', JSON.stringify(orders));
  }
};

// 组件挂载时加载分组列表
onActivated(async () => {
  await loadAccountGroups();
  await setGroupedAccounts();

  if(getCurrentAccount.value){
    clickAccount(getCurrentAccount.value)
  }
});

defineExpose({
  getList: setGroupedAccounts,
  proxyAccounts,
  loadAccountGroups
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

.menu-bar {
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 10px;
}

.user-mgmt-btn {
  width: 100%;
  transition: background-color 0.3s ease;
  padding: 12px 16px !important;
  justify-content: flex-start;
  font-size: 16px;
}

.user-mgmt-btn :deep(span) {
  color: #333;
}

.user-mgmt-btn :deep(.el-icon) {
  color: #333;
}

.user-mgmt-btn:hover {
  background-color: #f3f4f6 !important;
  border-radius: 6px;
  padding: 12px 16px !important;
}

.user-mgmt-btn.active {
  background-color: #e6f7ff !important;
  border-radius: 6px;
}

.user-mgmt-btn.active :deep(span),
.user-mgmt-btn.active :deep(.el-icon) {
  color: var(--jzl-primary-color, #409eff);
}

.account-list_list {
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
}

.account-list_item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-radius: var(--jzl-border-radius-large);
  margin-top: 10px;
}

/* 分组视图样式 */
.grouped-view {
  width: 100%;
}

.grouped-view :deep(.el-collapse) {
  border: none;
}

.grouped-view :deep(.el-collapse-item__header) {
  height: 40px;
  line-height: 40px;
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 0 10px;
  margin-bottom: 5px;
  border: none;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 10;
}

.grouped-view :deep(.el-collapse-item__wrap) {
  border: none;
  background-color: transparent;
}

.grouped-view :deep(.el-collapse-item__content) {
  padding-bottom: 10px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  width: 100%;
}

.group-name {
  flex: 1;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-count {
  color: #909399;
  font-size: 12px;
  font-weight: normal;
}

.grouped-view .account-list_item {
  margin-left: 10px;
  margin-right: 10px;
}

.account-list_platforms {
  @apply hover:bg-zinc-100 cursor-pointer p-2 rounded-md flex flex-col justify-center items-center;
}
</style>
