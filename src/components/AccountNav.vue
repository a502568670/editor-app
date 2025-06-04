<template>
  <nav :class="props.class" class="flex flex-col">
    <div class="p-2 bg-white">
      <div class="px-2 py-0.5 flex items-center border rounded-sm">
        <el-icon>
          <Search />
        </el-icon>
        <el-input class="bg-white" v-model="queryRef" placeholder="搜索公众号" @input="handleInput" />
      </div>
    </div>
    <ul class="w-full flex flex-col bg-white" style="height:calc(100vh - 158px)">
      <li @click="handleSelect(item)" v-for="item in list" :key="item.id" :class="{'bg-gray-100': selected_account_id === item.id}"
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
import { ref, onMounted, defineEmits, toRaw } from 'vue';
import { Search } from '@element-plus/icons-vue'
import { debounceFn } from "@/utils/index"
const selected_account_id = ref(0)
const queryRef = ref("")
const props = defineProps({
  class: {
    type: String,
  },
  list: {
    type: Array,
    default: () => {
      return [];
    },
  },
});

const emitAccountFilter = defineEmits(['accountFilter', 'accountSelect'])

const handleInput = debounceFn((v) => {
  emitAccountFilter("accountFilter", { query: v })
}, 200, false)

const handleSelect = (account) => {
  console.log("selected account.id=>", account.id)
  selected_account_id.value = account.id
  emitAccountFilter("accountSelect", toRaw(account))
}

</script>