<template>
  <div class="common-layout" style="height: 100vh;">
    <el-container  style="height: 100vh;">
        <el-header class="header">
          <Header></Header>
        </el-header>
        <el-main>
          <router-view  v-slot="{ Component }">
            <keep-alive>
              <component :is="Component"></component>
            </keep-alive>
          </router-view>
        </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Header from './header.vue'

</script>

<style scoped>
.header{
  background-color: #fff;
}
.el-main{
  padding: 0px;
}
</style>
