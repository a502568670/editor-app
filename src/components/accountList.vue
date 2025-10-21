<template>
  <div class="account-list">
    <div class="menu-bar"  v-if="$props.showAdd">
      <el-button 
        type="primary" 
        link 
        @click="handleUserManagement" 
        class="user-mgmt-btn"
        :class="{ 'active': isAccountManagementPage }"
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
        <el-collapse v-model="activeGroups" accordion>
          <!-- 未分组 -->
          <el-collapse-item v-if="groupedAccounts.ungrouped.length > 0" name="ungrouped">
            <template #title>
              <div class="group-header">
                <el-icon><Folder /></el-icon>
                <span class="group-name">未分组</span>
                <span class="group-count">({{ groupedAccounts.ungrouped.length }})</span>
              </div>
            </template>
            <div
              v-for="account in groupedAccounts.ungrouped"
              :key="account.id"
              @click="clickAccount(account)"
              class="account-list_item hover:bg-zinc-100 group transition duration-500"
              :class="{
                '!bg-zinc-200': $props.selectId === account.id && !isAccountManagementPage,
                grayscale: account.expired
              }"
            >
              <img
                style="width: 25px; height: 25px; border-radius: 50%"
                :src="account.avatar"
              />
              <div class="cursor-pointer pl-2 flex-1 flex items-center justify-around">
                <div
                  class="truncate flex-1 w-0"
                  :class="{ 'text-[var(--jzl-primary-color)]': $props.selectId === account.id && !isAccountManagementPage }"
                >
                  {{ account.name }}
                </div>
                <img src="@/assets/image/account/wxgzh.png" style="width: 18px; height: 18px" />
              </div>
              <div v-if="$props.showDel" class="items-center justify-center ml-1 hidden group-hover:flex">
                <el-popconfirm title="你是否要删除该公众号" @confirm="delAccount(account.wechat_id)" placement="top-end">
                  <template #reference>
                    <el-icon style="color: brown" @click.prevent.stop class="cursor-pointer">
                      <Close />
                    </el-icon>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </el-collapse-item>
          
          <!-- 各个分组 -->
          <el-collapse-item
            v-for="group in groupedAccounts.groups"
            :key="group.id"
            :name="`group-${group.id}`"
          >
            <template #title>
              <div class="group-header">
                <el-icon><FolderOpened /></el-icon>
                <span class="group-name">{{ group.name }}</span>
                <span class="group-count">({{ group.accounts.length }})</span>
              </div>
            </template>
            <div
              v-for="account in group.accounts"
              :key="account.id"
              @click="clickAccount(account)"
              class="account-list_item hover:bg-zinc-100 group transition duration-500"
              :class="{
                '!bg-zinc-200': $props.selectId === account.id && !isAccountManagementPage,
                grayscale: account.expired
              }"
            >
              <img
                style="width: 25px; height: 25px; border-radius: 50%"
                :src="account.avatar"
              />
              <div class="cursor-pointer pl-2 flex-1 flex items-center justify-around">
                <div
                  class="truncate flex-1 w-0"
                  :class="{ 'text-[var(--jzl-primary-color)]': $props.selectId === account.id && !isAccountManagementPage }"
                >
                  {{ account.name }}
                </div>
                <img src="@/assets/image/account/wxgzh.png" style="width: 15px; height: 15px" />
              </div>
              <div v-if="$props.showDel" class="items-center justify-center ml-1 hidden group-hover:flex">
                <el-popconfirm title="你是否要删除该公众号" @confirm="delAccount(account.wechat_id)" placement="top-end">
                  <template #reference>
                    <el-icon style="color: brown" @click.prevent.stop class="cursor-pointer">
                      <Close />
                    </el-icon>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    <!-- <el-button v-if="$props.showAdd" style="width: 100%" type="primary" @click="addAccount"> 添加账号 </el-button> -->
    <el-popover v-if="$props.showAdd" placement="top" :width="220">
      <template #reference>
        <el-button style="width: 100%" type="primary"> 添加账号 </el-button>
      </template>
      <div class="grid grid-cols-2 gap-2">
        <div v-for="item of platforms" :key="item.id" class="account-list_platforms" @click="addAccount(item)">
          <img :src="item.img" style="width: 30px; height: 30px" />
          <span>{{ item.name }}</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, toRefs, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/store';
import { toDeepRaw } from '@/utils/convert';
import { sortByOrder, debounceFn } from '@/utils/index';
import { Close, UserFilled, Folder, FolderOpened } from '@element-plus/icons-vue';
import { apperrmsg } from '@/utils/constants';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAccountStore } from '@/store/piniaStore';
import { getAccountGroupList } from '@/api/account-group'

const router = useRouter();
const route = useRoute();

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
  },
  isManagementMode: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['clickAccountTrigger', 'delAccountTrigger', 'addAccountTrigger', 'userManagementTrigger']);

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

// 账号列表数据
const accounts = ref([]);

// 分组数据
const accountGroups = ref([]);

// 活跃的折叠面板
const activeGroups = ref(['ungrouped']);

// 监听 store 中的账号列表变化，自动刷新
watch(
  () => all_accounts.value,
  (newAccounts) => {
    // 当 store 中的账号列表发生变化时，自动刷新本地列表
    if (newAccounts && newAccounts.list) {
      getList();
      // 注意：不在这里刷新分组数据，避免重复请求
      // 分组数据会通过 refreshAccountList() 主动调用 loadAccountGroups() 来刷新
    }
  },
  { deep: true }
);

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
const groupedAccounts = computed(() => {
  const result = {
    ungrouped: [],
    groups: []
  };
  
  // 构建分组映射
  const groupMap = {};
  const flattenGroups = (groups) => {
    groups.forEach(group => {
      groupMap[group.id] = {
        id: group.id,
        name: group.name || group.label,
        accounts: []
      };
      if (group.children && group.children.length > 0) {
        flattenGroups(group.children);
      }
    });
  };
  flattenGroups(accountGroups.value);
  
  // 将账号分配到对应的分组
  accounts.value.forEach(account => {
    if (!account.group_id || account.group_id === 0) {
      // 未分组
      result.ungrouped.push(account);
    } else if (groupMap[account.group_id]) {
      // 已分组
      groupMap[account.group_id].accounts.push(account);
    } else {
      // 分组不存在，放到未分组
      result.ungrouped.push(account);
    }
  });
  
  // 只返回有账号的分组
  result.groups = Object.values(groupMap).filter(group => group.accounts.length > 0);
  
  return result;
});

const account = useAccountStore();
/** 点击删除按钮触发 */
const delAccount = async id => {
  await store.dispatch('DelAccount', id);
  account.update(account.list.filter(item => item.id !== id));
  getList();
  ElMessage({ type: 'success', message: '删除成功' });
  emit('delAccountTrigger', id);
};

/** 点击登录账号按钮触发 */
const addAccount = platform => {
  emit('addAccountTrigger', platform);
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

/** 点击用户管理按钮触发 */
const handleUserManagement = () => {
  emit('userManagementTrigger');
};

/** 判断当前是否在账号管理页面 */
const isAccountManagementPage = computed(() => {
  return props.isManagementMode;
});

const proxyAccounts = new Proxy(accounts, {
  get(target, key) {
    return target.value[key];
  }
});

// 组件挂载时加载分组列表
onMounted(() => {
  loadAccountGroups();
});

defineExpose({
  getList,
  proxyAccounts,
  loadAccountGroups
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
  margin-top: 10px;
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
