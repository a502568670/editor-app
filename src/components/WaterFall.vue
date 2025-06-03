<template>
  <div class="list">
    <div class="item" v-for="(item) in waterList" :key="item.id"
      :style="{ width: width + 'px', height: item.height + 'px', left: item.left + 'px', top: item.top + 'px', background: item.background }">
      <img :src="item.image" :alt="item.text" />
      <p class="text-box">{{ item.text }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({
  list: {
    type: Array,
    default: () => {
      return [];
    },
  },
});

// 图片宽度
const width = 120;
// 图片上下间距
const gap = 20;
// 瀑布流数组
const waterList = ref([]);
// 列高度数组
const heightList = reactive([]);

// 屏幕宽度需要在 mounted 之后拿到
onMounted(() => {
  // 计算列数
  const column = Math.floor(document.body.clientWidth / width);
  const innerList = [...props.list]
  // 核心内容就是维护每个图片的 left、top
  for (let i = 0; i < innerList.length; i++) {
    // 先铺上第一行（i < column 则表示是第一行）
    if (i < column) {
      innerList[i].top = 0;
      innerList[i].left = width * i;
      // 塞进瀑布流
      waterList.value?.push(innerList[i]);
      // 高度数据更新
      heightList[i] = innerList[i].height;
    }

    // 后面的就要一张张塞进去，每次找出最低的列往里塞
    else {
      // 最低的高度，先默认为第一列高度
      let current = heightList[0];
      // 最低的列，先默认为第一个
      let col = 0;

      // 循环每一列进行比较
      heightList.forEach((h, i) => {
        if (h < current) {
          current = h;
          col = i;
        }
      });
      console.log('最低的列', col, '高度为', current);

      // 由此计算出该图片的 left、top
      innerList[i].left = col * width;
      innerList[i].top = current + gap;
      // 塞进瀑布流
      waterList.value.push(innerList[i]);

      // 更新列高度数组
      heightList[col] = current + gap + innerList[i].height;
    }
  }
  console.log('waterList', waterList.value);
  console.log('heightList', heightList);
});
</script>
<style scoped>
.list {
  position: relative;
  height: 100%;
  overflow-y: auto;
  width: 100%;
}

.list .item {
  position: absolute;
}

.list .item .text-box {
  font-weight: 500px;
  font-size: 18px;
  color: #000000;
}
</style>