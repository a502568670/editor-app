<template>
  <el-menu :default-active="$props.defaultActive" @select="i=>index=i">
    <el-menu-item-group title="类别">
      <slot></slot>
      <el-menu-item v-for="v in categories" :index="v[0]+''" :key="v[0]">{{ v[1] }}</el-menu-item>
    </el-menu-item-group>
  </el-menu>
</template>
<script setup>
import { ref } from 'vue';
var categories=[
  // [-1,'总榜'],
  [26,'综合'],
  [1,'国际'],
  [2,'体育'],
  [3,'娱乐'],
  [4,'社会'],
  [5,'财经'],
  [6,'时事'],
  [7,'科技'],
  [8,'情感'],
  [9,'汽车'],
  [10,'教育'],
  [11,'时尚'],
  [12,'游戏'],
  [13,'军事'],
  [14,'旅游'],
  [15,'美食'],
  [16,'文化'],
  [17,'健康养生'],
  [18,'搞笑'],
  [19,'家居'],
  [20,'动漫'],
  [21,'宠物'],
  [22,'母婴育儿'],
  [23,'星座运势'],
  [24,'历史'],
  [25,'音乐'],
  [28,'职场'],
  [29,'三农'],
  [30,'养老'],
];
var index=defineModel()
</script>
<style>
</style>
