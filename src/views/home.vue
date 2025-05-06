
<template>
  <div class="home">
    <el-breadcrumb :separator-icon="ArrowRight">
      <el-breadcrumb-item>首页</el-breadcrumb-item>
      <el-breadcrumb-item>极致了编辑器</el-breadcrumb-item>
      <el-breadcrumb-item><span style="color: #51ce94">v1.0.0</span></el-breadcrumb-item>
    </el-breadcrumb>
    <el-row :gutter="20" style="margin-top:20px;background-color: #FFF">
      <el-col :span="6">
        <div class="card">
          <div class="number">{{$store.state.user?.staff_number||0}}</div>
          <div class="text">可添加员工数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card">
          <div class="number">{{$store.state.user?.account_number||0}}</div>
          <div class="text">可添加账号数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card">
          <div class="number">{{$store.state.user?.add_staff_number||0}}</div>
          <div class="text">已添加员工数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card">
          <div class="number">{{$store.state.user?.add_account_number||0}}</div>
          <div class="text">已添加账号数</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { ArrowRight } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
const store = useStore()

</script>
<style>
.home{

}
.card{
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}
.card .number{
  font-size: 20px;
  color: #51ce94;
  font-weight: bold;
}
.card .text{
  margin-top: 30px;
  font-weight: bold;
}
</style>
