<template>
  <el-select :value="value" clearable filterable :placeholder="placeholder" @input="emitInput" @change="emitChange">
    <el-option
      v-for="(item,index) in platformList"
      :key="index"
      :label="item.platform_name"
      :value="item[itemKey]"
    />
  </el-select>
</template>

<script type="text/babel">
export default {
  name: 'SelectPlatform',
  componentName: 'SelectPlatform',
  props: {
    value: {
      required: false
    },
    platformList:{
      type: Array,
      default() {
        return []
      }
    },
    itemKey: {
      type: String,
      default() {
        return 'platform_id'
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
    return {}
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
