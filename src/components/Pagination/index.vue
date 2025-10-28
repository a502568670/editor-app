<template>
  <div :class="{'hidden':hidden}" class="pagination-container">
    <el-pagination
      :background="background"
      :page-sizes="pageSizes"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :layout="layout"
      :total="total"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"/>
    <el-button
      type="primary" 
      @click="handleRefresh"
      title="跳转"
      style="margin-left: 10px;">
      跳转
    </el-button>
    <slot name='content'></slot>
  </div>
</template>

<script>
import { scrollTo } from '@/utils/scrollTo'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'Pagination',
  data() {
    return {
      RefreshIcon: Refresh
    }
  },
  props: {
    total: {
      required: true,
      type: Number
    },
    page: {
      type: Number,
      default: 1
    },
    limit: {
      type: Number,
      default: 15
    },
    pageSizes: {
      type: Array,
      default() {
        return [10, 15, 20, 30, 60, 100,]
      }
    },
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    background: {
      type: Boolean,
      default: true
    },
    autoScroll: {
      type: Boolean,
      default: true
    },
    hidden: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    currentPage: {
      get() {
        return this.page
      },
      set(val) {
        this.$emit('update:page', val)
      }
    },
    pageSize: {
      get() {
        return this.limit
      },
      set(val) {
        this.$emit('update:limit', val)
      }
    }
  },
  methods: {
    handleSizeChange(val) {
      this.$emit('pagination', { page: this.currentPage, limit: val })
      if (this.autoScroll) {
        scrollTo(0, 800)
      }
    },
    handleCurrentChange(val) {
      this.$emit('pagination', { page: val, limit: this.pageSize })
      if (this.autoScroll) {
        scrollTo(0, 800)
      }
    },
    handleRefresh() {
      this.$emit('refresh')
      this.$emit('pagination', { page: this.currentPage, limit: this.pageSize })
    }
  }
}
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 0;
  display: flex;
  align-items: center;
}
.pagination-container.hidden {
  display: none;
}
</style>
