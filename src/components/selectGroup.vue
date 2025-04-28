<template>
  <el-select :value="value" clearable filterable :placeholder="placeholder" @input="emitInput" @change="emitChange">
    <el-option
      v-for="(item,index) in group_list"
      :key="index"
      :label="item.name"
      :value="item[itemKey]"
    />
  </el-select>
</template>

<script type="text/babel">
import { listGroup } from '@/api/group'

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
    }
  },
  data() {
    return {
      group_list: []
    }
  },
  created() {
    listGroup({ type:2 }).then(response => {
      this.group_list = response.data.data
    }).catch(() => {
    })
  },

  methods: {
    emitInput(val) {
      this.$emit('input', val)
    },
    emitChange(val) {
      this.$emit('change', val)
    }
  }
}
</script>
