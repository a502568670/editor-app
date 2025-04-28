<template>
  <el-select :value="value" clearable filterable :placeholder="placeholder" @input="emitInput" @change="emitChange">
    <el-option
      v-for="(item,index) in platform_list"
      :key="index"
      :label="item.name"
      :value="item[itemKey]"
    />
  </el-select>
</template>

<script type="text/babel">
import { listPlatform } from '@/api/platform'

export default {
  name: 'SelectPlatform',
  componentName: 'SelectPlatform',
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
        return '选择平台'
      }
    }
  },
  data() {
    return {
      platform_list: []
    }
  },

  created() {
    listPlatform({  }).then(response => {
      this.platform_list = response.data.data
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
