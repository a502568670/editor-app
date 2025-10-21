<template>
  <div class="account-group-tree">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" @click="handleAddRootGroup">
        <el-icon><Plus /></el-icon>
        添加根分组
      </el-button>
      <el-button size="small" @click="refreshGroupTree">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 分组树 -->
    <el-tree
      ref="treeRef"
      :data="treeData"
      node-key="id"
      :props="treeProps"
      :expand-on-click-node="false"
      default-expand-all
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span class="node-label">
            <el-icon><Folder /></el-icon>
            <span class="label-text">{{ node.label }}</span>
            <span class="account-count">({{ data.account_count }})</span>
          </span>
          <span class="node-actions">
            <el-button
              type="primary"
              size="small"
              link
              @click.stop="handleAddChild(data)"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button
              type="warning"
              size="small"
              link
              @click.stop="handleEdit(data)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click.stop="handleDelete(data)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </span>
        </span>
      </template>
    </el-tree>

    <!-- 添加/编辑分组对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分组名称">
          <el-input v-model="formData.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Folder, Edit, Delete } from '@element-plus/icons-vue'
import {
  getAccountGroupList,
  addAccountGroup,
  updateAccountGroup,
  deleteAccountGroup
} from '@/api/account-group'

// 组件事件
const emit = defineEmits(['node-click', 'update'])

// 树形数据
const treeRef = ref()
const treeData = ref([])
const treeProps = {
  label: 'label',
  children: 'children'
}

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMode = ref('add') // 'add' | 'edit'
const formData = ref({
  id: null,
  name: '',
  parent_id: 0,
  sort_order: 0
})

// 加载分组树
async function loadGroupTree() {
  try {
    const response = await getAccountGroupList()
    if (response.code === 1) {
      treeData.value = response.data.list || []
    } else {
      ElMessage.error(response.msg || '加载分组失败')
    }
  } catch (error) {
    console.error('加载分组树失败:', error)
    ElMessage.error('加载分组失败')
  }
}

// 刷新分组树
function refreshGroupTree() {
  loadGroupTree()
  emit('update')
}

// 处理节点点击
function handleNodeClick(data) {
  emit('node-click', data)
}

// 添加根分组
function handleAddRootGroup() {
  dialogTitle.value = '添加根分组'
  dialogMode.value = 'add'
  formData.value = {
    id: null,
    name: '',
    parent_id: 0,
    sort_order: 0
  }
  dialogVisible.value = true
}

// 添加子分组
function handleAddChild(data) {
  dialogTitle.value = '添加子分组'
  dialogMode.value = 'add'
  formData.value = {
    id: null,
    name: '',
    parent_id: data.id,
    sort_order: 0
  }
  dialogVisible.value = true
}

// 编辑分组
function handleEdit(data) {
  dialogTitle.value = '编辑分组'
  dialogMode.value = 'edit'
  formData.value = {
    id: data.id,
    name: data.name,
    parent_id: data.parent_id,
    sort_order: data.sort_order
  }
  dialogVisible.value = true
}

// 删除分组
async function handleDelete(data) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组"${data.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await deleteAccountGroup(data.id)
    if (response.code === 1) {
      ElMessage.success('删除成功')
      refreshGroupTree()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
async function handleSubmit() {
  if (!formData.value.name || !formData.value.name.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }

  try {
    let response
    if (dialogMode.value === 'add') {
      response = await addAccountGroup(formData.value)
    } else {
      response = await updateAccountGroup(formData.value)
    }

    if (response.code === 1) {
      ElMessage.success(dialogMode.value === 'add' ? '添加成功' : '更新成功')
      dialogVisible.value = false
      refreshGroupTree()
    } else {
      ElMessage.error(response.msg || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadGroupTree()
})

// 暴露方法给父组件
defineExpose({
  refresh: refreshGroupTree
})
</script>

<style scoped>
.account-group-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 10px;
}

.el-tree {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-text {
  font-weight: 500;
}

.account-count {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.node-actions {
  display: none;
}

.custom-tree-node:hover .node-actions {
  display: flex;
  gap: 4px;
}
</style>

