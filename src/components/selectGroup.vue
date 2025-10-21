<template>
  <el-select 
    :value="value" 
    clearable 
    filterable 
    :placeholder="placeholder" 
    @input="emitInput" 
    @change="emitChange"
  >
    <!-- 未分组选项 -->
    <el-option
      v-if="showUngrouped"
      :label="ungroupedLabel"
      :value="0"
    />
    <!-- 分组选项 -->
    <el-option
      v-for="item in flatGroupList"
      :key="item.id"
      :label="item.displayName"
      :value="item[itemKey]"
    />
  </el-select>
</template>

<script type="text/babel">
import { getAccountGroupList } from '@/api/account-group'

export default {
  name: 'SelectGroup',
  componentName: 'SelectGroup',
  props: {
    value: {
      required: false
    },
    itemKey: {
      type: String,
      default() {
        return 'id'
      }
    },
    placeholder: {
      type: String,
      default() {
        return '选择分组'
      }
    },
    // 是否显示"未分组"选项
    showUngrouped: {
      type: Boolean,
      default: false
    },
    // "未分组"选项的显示文本
    ungroupedLabel: {
      type: String,
      default: '未分组'
    }
  },
  data() {
    return {
      group_list: [],
      flatGroupList: []
    }
  },
  created() {
    this.loadGroupList()
  },

  methods: {
    // 加载分组列表
    loadGroupList() {
      getAccountGroupList().then(response => {
        if (response.data.code === 1) {
          this.group_list = response.data.data.list || []
          // 将树形结构展平
          this.flatGroupList = this.flattenTree(this.group_list)
          console.warn("分组列表", this.flatGroupList)
        }
      }).catch((error) => {
        console.error('加载分组失败:', error)
      })
    },

    // 将树形结构展平为列表，保留层级信息
    flattenTree(tree, level = 0, result = []) {
      tree.forEach(node => {
        // 根据层级添加缩进前缀
        const prefix = level > 0 ? '　'.repeat(level) + '├─ ' : ''
        result.push({
          id: node.id,
          name: node.name,
          label: node.label,
          displayName: prefix + node.name,
          parent_id: node.parent_id,
          level: level,
          account_count: node.account_count
        })
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          this.flattenTree(node.children, level + 1, result)
        }
      })
      return result
    },

    // 刷新分组列表（供外部调用）
    refresh() {
      this.loadGroupList()
    },

    emitInput(val) {
      this.$emit('input', val)
    },
    emitChange(val) {
      this.$emit('change', val)
    }
  }
}
</script>
