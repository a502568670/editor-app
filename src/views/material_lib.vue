<template>
  <div class="w-full flex h-full bg-[#e9f9f1]">
    <div class="w-[200px] border-r shadow-md">
      <account-nav class="bg-red" :list="accountsRef" @account-filter="handleAccountFilter"
        @account-select="handleAccountSelect" />
    </div>
    <div class="flex-1 flex flex-col h-full">
      <div class="h-12 flex space-x-2 items-center pl-2 border-b mb-1 shadow-md">
        <div>草稿箱</div>
        <el-button @click="handleAppMsgRefresh" type="primary">
          <el-icon>
            <RefreshRight />
          </el-icon>
          <span class="ml-1">刷新</span>
        </el-button>
        <div class="flex-1"></div>
        <div class="bg-white px-2 py-0.5 flex items-center border rounded-sm"><el-input class="bg-white"
            v-model="queryRef" style="width: 100%;" placeholder="请输入账号关键词" />
          <el-icon style="cursor: pointer;" @click="handleAppMsgFilter">
            <Search />
          </el-icon>
        </div>
        <div></div>
      </div>
      <div class="flex-1">
        <water-fall :list="list" class="water-fall" />
      </div>
    </div>
  </div>
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
import { ref, toRefs, computed, reactive, onMounted, onActivated } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import AccountNav from "@/components/AccountNav"
import WaterFall from "@/components/WaterFall"
import { getToken } from "@/utils/auth";
import { serializeCookie } from "@/utils/cookie"
import store from '@/store'
// import { listAccount } from '@/api/account'

// const { getters } = useStore();

const { all_accounts } = toRefs(store.getters)

const accountsRef = ref([])

const list = ref([
  {
    height: 300,
    background: 'red',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 400,
    background: 'pink',
    text: '美术作品+沈佳宜',
    image: '/images/works-publicity/tradition.png',
  },
  {
    height: 500,
    background: 'blue',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 200,
    background: 'green',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 300,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 400,
    background: '#CC00FF',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 200,
    background: 'pink',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 100,
    background: '#996666',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 300,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 400,
    background: '#CC00FF',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 200,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 100,
    background: '#996666',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 300,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 400,
    background: '#CC00FF',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 200,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 100,
    background: '#996666',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 300,
    background: 'gray',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  },
  {
    height: 400,
    background: '#CC00FF',
    image: '/images/works-publicity/tradition.png',
    text: '平面作品+李宇轩',
  }
]);
const queryRef = ref("")
const beginRef = ref(0)

const selectedAccountRef = ref(null)


const handleAccountFilter = (v) => {
  const filteredAccounts = all_accounts.value.list.filter(a => a.name.includes(v.query))
  // console.log("filteredAccounts=>", filteredAccounts)
  // accountsRef.value = await _listAccount({ page: accountPage, num: accountNum, keyword: v })
  accountsRef.value = filteredAccounts
}

const handleAccountSelect = async (account) => {
  selectedAccountRef.value = account
  await _listAppmsgsInDraftBox()
}

const handleAppMsgRefresh = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  await _listAppmsgsInDraftBox()
}

const handleAppMsgFilter = async () => {
  if (!selectedAccountRef.value) {
    return
  }
  if (!queryRef.value) {
    ElMessage({
      message: `请输入搜索关键字`,
      type: 'warning',
      duration: 2 * 1000
    })
    return
  }
  await _listAppmsgsInDraftBox()
}


const _listAppmsgsInDraftBox = async () => {
  const { token, name, id, session_id } = selectedAccountRef.value
  console.log("token=>", token)
  console.log("id=>", id)
  console.log("session_id=>", session_id)
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
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:listAppmsgsInDraftBox',
    token: getToken(),
    wechat_id: id,
    listData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      query: queryRef.value,
      begin: beginRef.value,
      count: 10
    }
  })
}

onMounted(async () => {
  // handleAccountFilter({ query: "" })
})
onActivated(async () => {
  console.log("---onActivated----")
  handleAccountFilter({ query: "" })
})

window.ipcRenderer.receive('fromMain', (msg) => {
  console.log("material_lib ipcRenderer receive fromMain:", msg)
  if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
    const tag = msg.tag;
    if (tag === "appmsg-ret:listAppmsgsInDraftBox") {
      const { success, items, err_msg } = msg.data
      if (!success) {
        let message = err_msg === "invalid session" ? `当前账号session过期,请切换到*账号中心*重新登录` : err_msg
        ElMessageBox.alert(message, '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).then(() => {
          console.log("then")
        }).catch(() => {
          console.log("catch")
        })
        return
      }

      console.log("get items =>", items)
    }
  }
})

</script>
