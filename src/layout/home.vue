<template>
<!--  使用Element Plus 的 el-container 组件来布局页面，包含侧边栏 (el-aside) 和主要内容区域 (el-main)。-->
  <el-container class="container-wrapper">
    <el-container>
      <!-- 侧边栏菜单 -->
      <el-aside width="200px">
        <el-menu
          unique-opened
          :default-active="activeTabName"
          active-text-color="#222"
          background-color="#FFF"
          class="el-menu-vertical-demo"
          text-color="#555"
          @select="changeTab"
        >
          <el-menu-item   v-for="(item, index) in menusList"
                          :key="index"
                          :index="item.name">
            <template #title>
              <el-icon>
                <component :is="item.icon"></component>
              </el-icon>
              <span>{{ item.label }}</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <!-- 主内容区域 -->
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { House,User,Files,Handbag,Folder,Postcard   } from "@element-plus/icons-vue";
import { shallowRef } from "vue";
export default {
  name: "home",
  data() {
    return {
      activeTabName: "", // 当前显示的选项卡 激活的 name

      menusList: [// 存储菜单项列表
        {
          icon: shallowRef(House),
          label: "首页",
          name:'home',
        },
        {
          icon: shallowRef(Files),
          label: "账号管理",
          name:'account'
        },
        {
          icon: shallowRef(Handbag),
          label: "分组管理",
          name:'group'
        },
        {
          icon: shallowRef(User),
          label: "员工管理",
          name:'user'
        },
        {
          icon: shallowRef(Folder), // 使用 Folder 图标
          label: "平台管理",
          name: 'platform'
        },
        {
          icon: shallowRef(Postcard  ),
          label: "公众号管理",
          name: 'official_account'
        }
      ]
    };
  },
  // 在组件挂载后，将 activeTabName 设置为当前路由的名称，确保侧边栏菜单中高亮显示当前激活的菜单项。
  mounted() {
    this.activeTabName = this.$route.name;
  },

  methods: {
    // select	菜单激活回调	index: 选中菜单项的 index
    changeTab(name) {
      console.info(name)
      this.activeTabName = name;
      this.$router.push({
        name: name,
      });
    },
  },
};
</script>

<style  scoped>
.container-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
.el-main {
  height: 100%;
  width: 100%;
  padding: 20px;
  margin: 0;
  background-color: #e9f9f1;
}
.el-aside {
  height: 100%;
  background-color: #FFF;
}
.el-menu{
  border: none;
}
.el-menu-item.is-active {
  background-color: #e9f9f1;
}


</style>

