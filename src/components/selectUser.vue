<template>
  <el-select :value="value" clearable filterable :placeholder="placeholder" @input="emitInput" @change="emitChange">
    <el-option
      v-for="(item,index) in user_list"
      :key="index"
      :label="item.mobile"
      :value="item[itemKey]"
    />
  </el-select>
</template>

<script type="text/babel">
import { listUser } from '@/api/user'

export default {
  name: 'SelectUser',
  componentName: 'SelectUser',
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
        return '选择员工'
      }
    }
  },
  data() {
    return {
      user_list: []
    }
  },
  created() {
    listUser({ type:2 }).then(response => {
      this.user_list = response.data.data
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
