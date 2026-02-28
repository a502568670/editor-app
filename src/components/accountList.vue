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
      <el-button
        type="primary"
        link
        @click="showWebhookDialog = true"
        class="user-mgmt-btn"
        style="margin-top: 8px;margin-left: 0;"
      >
        <el-icon>
          <Bell />
        </el-icon>
        <span class="ml-1">WebHook通知</span>
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

    <!-- WebHook通知配置弹框 -->
    <el-dialog
      v-model="showWebhookDialog"
      title="WebHook通知配置"
      width="700px"
      :close-on-click-modal="false"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>WebHook通知配置</span>
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" link @click="showManualDialog = true">
              <el-icon style="margin-right: 4px;"><Document /></el-icon>
              使用手册
            </el-button>
            <el-button type="primary" link @click="openMonitorConfig">
              <el-icon style="margin-right: 4px;"><Setting /></el-icon>
              监控配置
            </el-button>
          </div>
        </div>
      </template>
      <el-form :model="webhookForm" label-width="180px" label-position="left">
        <el-form-item label="企微群机器人webhook">
          <el-input
            v-model="webhookForm.wecom"
            placeholder="请输入企业微信群机器人webhook地址"
            clearable
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            留空将不发送通知到此
          </div>
        </el-form-item>
        <el-form-item label="飞书群机器人webhook">
          <el-input
            v-model="webhookForm.feishu"
            placeholder="请输入飞书群机器人webhook地址"
            clearable
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            留空将不发送通知到此
          </div>
        </el-form-item>
        <el-form-item label="钉钉群机器人webhook">
          <el-input
            v-model="webhookForm.dingtalk"
            placeholder="请输入钉钉群机器人webhook地址"
            clearable
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            留空将不发送通知到此
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWebhookDialog = false">取消</el-button>
        <el-button type="primary" @click="saveWebhookConfig">保存</el-button>
      </template>
    </el-dialog>

    <!-- 监控配置弹框 -->
    <el-dialog
      v-model="showMonitorConfigDialog"
      title="监控配置"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form :model="monitorConfigForm" label-width="140px" label-position="left">
        <el-form-item label="监控账号">
          <el-select
            v-model="monitorConfigForm.monitorAccounts"
            multiple
            filterable
            placeholder="请选择要监控的账号"
            style="width: 100%;"
          >
            <el-option
              v-for="account in all_accounts.list"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            >
              <div style="display: flex; align-items: center;">
                <img :src="account.avatar" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 8px;" />
                <span>{{ account.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="监控日期">
          <el-date-picker
            v-model="monitorConfigForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-divider content-position="left">监控数据阈值设置</el-divider>
        <el-form-item label="阅读量大于">
          <el-input-number
            v-model="monitorConfigForm.readCountThreshold"
            :min="0"
            :step="100"
            placeholder="设置阅读量阈值"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="昨日收入大于">
          <el-input-number
            v-model="monitorConfigForm.yesterdayIncomeThreshold"
            :min="0"
            :step="10"
            :precision="2"
            placeholder="设置昨日收入阈值"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="前天收入大于">
          <el-input-number
            v-model="monitorConfigForm.beforeYesterdayIncomeThreshold"
            :min="0"
            :step="10"
            :precision="2"
            placeholder="设置前天收入阈值"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="本月收入大于">
          <el-input-number
            v-model="monitorConfigForm.monthIncomeThreshold"
            :min="0"
            :step="100"
            :precision="2"
            placeholder="设置本月收入阈值"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="累计收入大于">
          <el-input-number
            v-model="monitorConfigForm.totalIncomeThreshold"
            :min="0"
            :step="100"
            :precision="2"
            placeholder="设置累计收入阈值"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="其他监控项">
          <el-checkbox-group v-model="monitorConfigForm.otherMonitorItems">
            <el-checkbox label="7日内违规信息">7日内违规信息</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-divider content-position="left">触发设置</el-divider>
        <el-form-item label="触发间隔（分钟）">
          <el-input-number
            v-model="monitorConfigForm.triggerInterval"
            :min="1"
            :max="1440"
            :step="5"
            placeholder="设置触发间隔"
            style="width: 100%;"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            每隔多少分钟检查一次并触发通知（1-1440分钟）
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMonitorConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMonitorConfig">保存</el-button>
      </template>
    </el-dialog>

    <!-- 使用手册弹框 -->
    <el-dialog
      v-model="showManualDialog"
      title="WebHook监控使用手册"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="manual-content">
        <h3>一、功能概述</h3>
        <p>WebHook监控系统可以自动监控公众号的数据指标，当达到设定的阈值时，自动发送通知到企业微信、飞书或钉钉群。</p>
        
        <h3>二、配置步骤</h3>
        
        <h4>1. 配置 WebHook 地址</h4>
        <ul>
          <li><strong>企业微信：</strong>在企业微信群中添加群机器人，复制 Webhook 地址</li>
          <li><strong>飞书：</strong>在飞书群中添加自定义机器人，复制 Webhook 地址</li>
          <li><strong>钉钉：</strong>在钉钉群中添加自定义机器人，复制 Webhook 地址</li>
          <li>提示：留空的平台将不会发送通知</li>
        </ul>
        
        <h4>2. 配置监控规则</h4>
        <ul>
          <li><strong>监控账号：</strong>选择需要监控的公众号账号（可多选）</li>
          <li><strong>监控日期：</strong>设置监控的日期范围</li>
          <li><strong>阈值设置：</strong>设置各项数据的触发阈值
            <ul>
              <li>阅读量：文章总阅读量超过设定值时触发</li>
              <li>昨日收入：昨日收入超过设定值时触发</li>
              <li>前天收入：前天收入超过设定值时触发</li>
              <li>本月收入：本月累计收入超过设定值时触发</li>
              <li>累计收入：总收入超过设定值时触发</li>
            </ul>
          </li>
          <li><strong>其他监控项：</strong>可选择监控7日内违规信息</li>
          <li><strong>触发间隔：</strong>设置检查频率（1-1440分钟）</li>
        </ul>
        
        <h3>三、工作原理</h3>
        <p>系统会按照设定的触发间隔，定期检查所有监控账号的数据。当任一账号的数据超过设定阈值时，会自动向配置的 WebHook 地址发送通知消息。</p>
        
        <h3>四、注意事项</h3>
        <ul>
          <li>确保账号已正确登录且 token 有效</li>
          <li>WebHook 地址需要正确配置，否则无法发送通知</li>
          <li>触发间隔不宜设置过短，建议至少5分钟</li>
          <li>监控会在组件激活时自动启动，离开页面时自动停止</li>
          <li>阈值设置为0表示不监控该项指标</li>
        </ul>
        
        <h3>五、获取 WebHook 地址</h3>
        <h4>企业微信群机器人：</h4>
        <ol>
          <li>在企业微信群中，点击右上角"..."</li>
          <li>选择"消息推送" → "添加机器人"</li>
          <li>设置机器人名称，复制 Webhook 地址</li>
        </ol>
        
        <h4>飞书群机器人：</h4>
        <ol>
          <li>在飞书群中，点击右上角"设置"</li>
          <li>选择"群机器人" → "添加机器人" → "自定义机器人"</li>
          <li>设置机器人名称和描述，复制 Webhook 地址</li>
        </ol>
        
        <h4>钉钉群机器人：</h4>
        <ol>
          <li>在钉钉群中，点击右上角"群设置"</li>
          <li>选择"智能群助手" → "添加机器人" → "自定义"</li>
          <li>设置机器人名称，选择安全设置，复制 Webhook 地址</li>
        </ol>
      </div>
      <template #footer>
        <el-button type="primary" @click="showManualDialog = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, toRefs, computed, onActivated, onBeforeUnmount, nextTick } from 'vue';
import store from '@/store';
import { toDeepRaw } from '@/utils/convert';
import { sortByOrder, debounceFn } from '@/utils/index';
import { Close, UserFilled, FolderOpened, Bell, Setting, Document, InfoFilled } from '@element-plus/icons-vue';
import { apperrmsg } from '@/utils/constants';
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus';
import { useAccountStore } from '@/store/piniaStore';
import { createAccount } from '@/api/account';
import { VueDraggable } from 'vue-draggable-plus';
import { getAccountGroupList } from '@/api/account-group';
import { cachedStat } from '@/api/stat-client';

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

// WebHook 配置
const showWebhookDialog = ref(false)
const webhookForm = ref({
  wecom: '',
  feishu: '',
  dingtalk: ''
})

// 使用手册弹框
const showManualDialog = ref(false)

// 监控配置
const showMonitorConfigDialog = ref(false)
const monitorConfigForm = ref({
  monitorAccounts: [],
  dateRange: [],
  readCountThreshold: 0,
  yesterdayIncomeThreshold: 0,
  beforeYesterdayIncomeThreshold: 0,
  monthIncomeThreshold: 0,
  totalIncomeThreshold: 0,
  otherMonitorItems: ['7日内违规信息'],
  triggerInterval: 30
})

// 记录已触发的通知，避免重复发送
// 格式: { accountId: { triggerType: timestamp } }
const triggeredNotifications = ref({})

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

// WebHook 配置相关方法
const loadWebhookConfig = () => {
  const savedConfig = localStorage.getItem('webhook_config')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      webhookForm.value = {
        wecom: config.wecom || '',
        feishu: config.feishu || '',
        dingtalk: config.dingtalk || ''
      }
    } catch (e) {
      console.error('加载 WebHook 配置失败:', e)
    }
  }
}

const saveWebhookConfig = () => {
  try {
    localStorage.setItem('webhook_config', JSON.stringify(webhookForm.value))
    ElNotification({
      title: '成功',
      message: 'WebHook 配置已保存',
      type: 'success',
      duration: 2000
    })
    showWebhookDialog.value = false
  } catch (e) {
    console.error('保存 WebHook 配置失败:', e)
    ElNotification({
      title: '错误',
      message: '保存 WebHook 配置失败',
      type: 'error',
      duration: 2000
    })
  }
}

// 监控配置相关方法
const openMonitorConfig = () => {
  showMonitorConfigDialog.value = true
}

const loadMonitorConfig = () => {
  const savedConfig = localStorage.getItem('monitor_config')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      monitorConfigForm.value = {
        monitorAccounts: config.monitorAccounts || [],
        dateRange: config.dateRange || [],
        readCountThreshold: config.readCountThreshold || 0,
        yesterdayIncomeThreshold: config.yesterdayIncomeThreshold || 0,
        beforeYesterdayIncomeThreshold: config.beforeYesterdayIncomeThreshold || 0,
        monthIncomeThreshold: config.monthIncomeThreshold || 0,
        totalIncomeThreshold: config.totalIncomeThreshold || 0,
        otherMonitorItems: config.otherMonitorItems || ['7日内违规信息'],
        triggerInterval: config.triggerInterval || 30
      }
    } catch (e) {
      console.error('加载监控配置失败:', e)
    }
  }
}

const saveMonitorConfig = async () => {
  try {
    // 先获取统计数据并打印
    if (monitorConfigForm.value.monitorAccounts.length > 0) {
      console.log('=== 获取监控账号统计数据 ===')
      const statDataList = await fetchAccountsStatData(monitorConfigForm.value.monitorAccounts)
      console.log('统计数据:', statDataList)
      
      // 打印每个账号的详细数据
      statDataList.forEach(statData => {
        const account = all_accounts.value.list.find(acc => acc.account_id === statData.account_id)
        console.log(`账号: ${account?.name || statData.account_id}`)
        console.log('  昨日收入:', statData.income_yesterday)
        console.log('  前天收入:', statData.income_yesterday_before2)
        console.log('  本月收入:', statData.income_cur_month)
        console.log('  累计收入:', statData.income_all)
        console.log('  违规信息:', statData.illegal_recent)
      })
    }
    
    localStorage.setItem('monitor_config', JSON.stringify(monitorConfigForm.value))
    ElNotification({
      title: '成功',
      message: '监控配置已保存',
      type: 'success',
      duration: 2000
    })
    showMonitorConfigDialog.value = false
    
    // 重启监控以应用新配置
    startMonitoring()
  } catch (e) {
    console.error('保存监控配置失败:', e)
    ElNotification({
      title: '错误',
      message: '保存监控配置失败',
      type: 'error',
      duration: 2000
    })
  }
}

// 发送 WebHook 通知
const sendWebhookNotification = async (message) => {
  const webhooks = webhookForm.value
  const results = []

  // 发送到企业微信
  if (webhooks.wecom) {
    try {
      const response = await fetch(webhooks.wecom, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          msgtype: 'text',
          text: {
            content: message
          }
        })
      })
      const result = await response.json()
      results.push({ platform: '企业微信', success: result.errcode === 0, result })
    } catch (error) {
      console.error('发送企业微信通知失败:', error)
      results.push({ platform: '企业微信', success: false, error: error.message })
    }
  }

  // 发送到飞书
  if (webhooks.feishu) {
    try {
      const response = await fetch(webhooks.feishu, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          msg_type: 'text',
          content: {
            text: message
          }
        })
      })
      const result = await response.json()
      results.push({ platform: '飞书', success: result.code === 0, result })
    } catch (error) {
      console.error('发送飞书通知失败:', error)
      results.push({ platform: '飞书', success: false, error: error.message })
    }
  }

  // 发送到钉钉
  if (webhooks.dingtalk) {
    try {
      const response = await fetch(webhooks.dingtalk, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          msgtype: 'text',
          text: {
            content: message
          }
        })
      })
      const result = await response.json()
      results.push({ platform: '钉钉', success: result.errcode === 0, result })
    } catch (error) {
      console.error('发送钉钉通知失败:', error)
      results.push({ platform: '钉钉', success: false, error: error.message })
    }
  }

  return results
}

// 检查某个触发项是否在冷却期内
const isInCooldown = (accountId, triggerType) => {
  const config = monitorConfigForm.value
  const cooldownMs = config.triggerInterval * 60 * 1000 // 转换为毫秒
  
  if (!triggeredNotifications.value[accountId]) {
    return false
  }
  
  const lastTriggerTime = triggeredNotifications.value[accountId][triggerType]
  if (!lastTriggerTime) {
    return false
  }
  
  const now = Date.now()
  return (now - lastTriggerTime) < cooldownMs
}

// 记录触发项
const recordTrigger = (accountId, triggerType) => {
  if (!triggeredNotifications.value[accountId]) {
    triggeredNotifications.value[accountId] = {}
  }
  triggeredNotifications.value[accountId][triggerType] = Date.now()
}

// 检查监控数据并发送通知
const checkMonitorDataAndNotify = async (accountData) => {
  const config = monitorConfigForm.value
  const triggers = []
  const accountId = accountData.accountId

  // 检查阅读量
  if (config.readCountThreshold > 0 && accountData.readCount > config.readCountThreshold) {
    if (!isInCooldown(accountId, 'readCount')) {
      triggers.push({ type: 'readCount', message: `阅读量: ${accountData.readCount}（阈值: ${config.readCountThreshold}）` })
    }
  }

  // 检查昨日收入
  if (config.yesterdayIncomeThreshold > 0 && accountData.yesterdayIncome > config.yesterdayIncomeThreshold) {
    if (!isInCooldown(accountId, 'yesterdayIncome')) {
      triggers.push({ type: 'yesterdayIncome', message: `昨日收入: ${accountData.yesterdayIncome}元（阈值: ${config.yesterdayIncomeThreshold}元）` })
    }
  }

  // 检查前天收入
  if (config.beforeYesterdayIncomeThreshold > 0 && accountData.beforeYesterdayIncome > config.beforeYesterdayIncomeThreshold) {
    if (!isInCooldown(accountId, 'beforeYesterdayIncome')) {
      triggers.push({ type: 'beforeYesterdayIncome', message: `前天收入: ${accountData.beforeYesterdayIncome}元（阈值: ${config.beforeYesterdayIncomeThreshold}元）` })
    }
  }

  // 检查本月收入
  if (config.monthIncomeThreshold > 0 && accountData.monthIncome > config.monthIncomeThreshold) {
    if (!isInCooldown(accountId, 'monthIncome')) {
      triggers.push({ type: 'monthIncome', message: `本月收入: ${accountData.monthIncome}元（阈值: ${config.monthIncomeThreshold}元）` })
    }
  }

  // 检查累计收入
  if (config.totalIncomeThreshold > 0 && accountData.totalIncome > config.totalIncomeThreshold) {
    if (!isInCooldown(accountId, 'totalIncome')) {
      triggers.push({ type: 'totalIncome', message: `累计收入: ${accountData.totalIncome}元（阈值: ${config.totalIncomeThreshold}元）` })
    }
  }

  // 检查违规信息
  if (config.otherMonitorItems.includes('7日内违规信息') && accountData.violations && accountData.violations.length > 0) {
    if (!isInCooldown(accountId, 'violations')) {
      triggers.push({ type: 'violations', message: `7日内违规信息: ${accountData.violations.join(', ')}` })
    }
  }

  // 如果有触发项，发送通知
  if (triggers.length > 0) {
    const now = new Date()
    const dateStr = now.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const message = `【账号监控通知】\n账号: ${accountData.accountName}\n时间: ${dateStr}\n\n触发项:\n${triggers.map((t, i) => `${i + 1}. ${t.message}`).join('\n')}`
    
    const results = await sendWebhookNotification(message)
    
    // 显示发送结果
    const successPlatforms = results.filter(r => r.success).map(r => r.platform)
    const failedPlatforms = results.filter(r => !r.success).map(r => r.platform)
    
    if (successPlatforms.length > 0) {
      // 记录所有触发项，避免重复通知
      triggers.forEach(trigger => {
        recordTrigger(accountId, trigger.type)
      })
      
      ElNotification({
        title: '通知发送成功',
        message: `已发送到: ${successPlatforms.join('、')}`,
        type: 'success',
        duration: 3000
      })
    }
    
    if (failedPlatforms.length > 0) {
      ElNotification({
        title: '通知发送失败',
        message: `发送失败: ${failedPlatforms.join('、')}`,
        type: 'error',
        duration: 3000
      })
    }
  }
}

// 获取账号统计数据（使用统一接口）
const fetchAccountsStatData = async (accountIds) => {
  try {
    const response = await cachedStat({ account_ids: accountIds })
    
    if (response.data && response.data.items) {
      return response.data.items
    }
    
    return []
  } catch (error) {
    console.error('获取账号统计数据失败:', error)
    return []
  }
}

// 获取账号文章数据
const fetchAccountArticleData = async (account) => {
  try {
    // 解析 session_id 中的 cookie 数组
    const sessionData = JSON.parse(account.session_id)
    const cookies = sessionData.cookie || []
    
    // 构建微信接口URL
    const url = `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&begin=0&count=10&token=${account.token}&lang=zh_CN&f=json`
    
    // 使用 Electron IPC 发送请求
    const response = await window.electron.ipcRenderer.invoke('fetch-with-cookies', {
      url: url,
      method: 'GET',
      headers: {
        'Referer': 'https://mp.weixin.qq.com/',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      cookies: cookies
    })
    
    if (!response.success) {
      console.error(`获取账号 ${account.name} 数据失败:`, response.error)
      return null
    }
    
    const data = response.data
    
    if (data.base_resp?.ret !== 0) {
      console.error(`账号 ${account.name} 接口返回错误:`, data.base_resp)
      return null
    }
    
    // 解析文章数据
    let publishPage = data.publish_page
    if (typeof publishPage === 'string') {
      publishPage = JSON.parse(publishPage)
    }
    
    const publishList = publishPage?.publish_list || []
    let totalReadCount = 0
    
    // 遍历发布列表，统计阅读量
    publishList.forEach(publishItem => {
      let publishInfo = publishItem.publish_info
      if (typeof publishInfo === 'string') {
        publishInfo = JSON.parse(publishInfo)
      }
      
      const appmsgInfoList = publishInfo?.appmsg_info || []
      
      appmsgInfoList.forEach(article => {
        totalReadCount += article.read_num || 0
      })
    })
    
    return {
      accountId: account.id,
      accountName: account.name,
      readCount: totalReadCount
    }
  } catch (error) {
    console.error(`获取账号 ${account.name} 数据失败:`, error)
    return null
  }
}

// 执行监控检查
const performMonitorCheck = async () => {
  const config = monitorConfigForm.value
  
  // 检查是否有配置的监控账号
  if (!config.monitorAccounts || config.monitorAccounts.length === 0) {
    console.log('没有配置监控账号')
    return
  }
  
  // 检查是否配置了 WebHook
  const webhooks = webhookForm.value
  if (!webhooks.wecom && !webhooks.feishu && !webhooks.dingtalk) {
    console.log('没有配置 WebHook 地址')
    return
  }
  
  console.log('开始执行监控检查...')
  
  // 获取所有监控账号的统计数据
  const statDataList = await fetchAccountsStatData(config.monitorAccounts)
  
  // 遍历监控账号
  for (const accountId of config.monitorAccounts) {
    const account = all_accounts.value.list.find(acc => acc.id === accountId)
    
    if (!account) {
      console.warn(`找不到账号 ID: ${accountId}`)
      continue
    }
    
    // 只监控微信公众号
    if (account.platform_id !== 1 && account.platform_id !== 4 && account.platform_name !== '公众号') {
      console.log(`跳过账号 ${account.name}，不是微信公众号`)
      continue
    }
    
    // 检查必要的参数
    if (!account.token || !account.session_id) {
      console.warn(`账号 ${account.name} 缺少 token 或 session_id`)
      continue
    }
    
    // 获取账号阅读量数据
    const articleData = await fetchAccountArticleData(account)
    
    if (!articleData) {
      continue
    }
    
    // 从统计数据中找到对应账号的数据
    const statData = statDataList.find(item => item.account_id === accountId)
    
    if (!statData) {
      console.warn(`找不到账号 ${account.name} 的统计数据`)
      continue
    }
    
    // 组合完整的账号数据
    const accountData = {
      accountId: account.id,
      accountName: account.name,
      readCount: articleData.readCount,
      yesterdayIncome: (statData.income_yesterday || 0) / 100, // 分转元
      beforeYesterdayIncome: (statData.income_yesterday_before2 || 0) / 100, // 分转元
      monthIncome: (statData.income_cur_month || 0) / 100, // 分转元
      totalIncome: (statData.income_all || 0) / 100, // 分转元
      violations: statData.illegal_recent === '无违规' ? [] : [statData.illegal_recent]
    }
    
    // 检查并发送通知
    await checkMonitorDataAndNotify(accountData)
  }
  
  console.log('监控检查完成')
}

// 定时器ID
let monitorTimer = null

// 启动监控
const startMonitoring = () => {
  // 清除旧的定时器
  if (monitorTimer) {
    clearInterval(monitorTimer)
    monitorTimer = null
  }
  
  const config = monitorConfigForm.value
  
  if (!config.triggerInterval || config.triggerInterval < 1) {
    console.log('触发间隔未设置或无效')
    return
  }
  
  console.log(`启动监控，间隔: ${config.triggerInterval} 分钟`)
  
  // 立即执行一次
  performMonitorCheck()
  
  // 设置定时器
  const intervalMs = config.triggerInterval * 60 * 1000
  monitorTimer = setInterval(() => {
    performMonitorCheck()
  }, intervalMs)
}

// 停止监控
const stopMonitoring = () => {
  if (monitorTimer) {
    clearInterval(monitorTimer)
    monitorTimer = null
    console.log('监控已停止')
  }
}

// 组件挂载时加载分组列表
onActivated(async () => {
  await loadAccountGroups();
  await setGroupedAccounts();
  loadWebhookConfig(); // 加载 WebHook 配置
  loadMonitorConfig(); // 加载监控配置
  
  // 启动监控
  startMonitoring()

  if(getCurrentAccount.value){
    clickAccount(getCurrentAccount.value)
  }
});

// 组件卸载时停止监控
onBeforeUnmount(() => {
  stopMonitoring()
});

defineExpose({
  getList: setGroupedAccounts,
  proxyAccounts,
  loadAccountGroups,
  startMonitoring,
  stopMonitoring,
  performMonitorCheck
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

/* 使用手册样式 */
.manual-content {
  line-height: 1.8;
  color: #333;
}

.manual-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 12px;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.manual-content h3:first-child {
  margin-top: 0;
}

.manual-content h4 {
  font-size: 15px;
  font-weight: 600;
  margin-top: 16px;
  margin-bottom: 8px;
  color: #374151;
}

.manual-content p {
  margin: 10px 0;
  color: #4b5563;
}

.manual-content ul,
.manual-content ol {
  margin: 10px 0;
  padding-left: 24px;
}

.manual-content li {
  margin: 6px 0;
  color: #4b5563;
}

.manual-content ul ul {
  margin: 4px 0;
  padding-left: 20px;
}

.manual-content strong {
  color: #1f2937;
  font-weight: 600;
}
</style>
