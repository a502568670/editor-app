<template>
  <el-breadcrumb :separator-icon="ArrowRight">
    <el-breadcrumb-item>管理中心</el-breadcrumb-item>
    <el-breadcrumb-item>分组管理</el-breadcrumb-item>
  </el-breadcrumb>
  <div style="background-color: #FFF;margin-top: 20px;">
    <div style="padding: 0 16px;">
      <el-form label-width="70px">
        <el-row :gutter="10">
          <el-col :span="4" style="padding-top: 10px;">
            <el-button  type="success" @click="handleCreate">添加分组</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div style="height: 10px" />

    <!-- 查询结果 -->
   <div>
     <el-table
       ref="multipleTable"
       v-loading="listLoading"
       :data="list"
       :height="height"
       :header-cell-style="{ 'background': '#e9f9f1', 'color': '#51ce94', 'height': '45px', 'line-height': '45px', 'padding': '0' }"
       :cell-style="{ 'height': '45px', 'line-height': '45px', 'padding': '0' }"
       element-loading-text="正在查询中。。。"
       border
       fit
       stripe
       highlight-current-row
     >
       <el-table-column align="center" label="分组ID" prop="id" />
       <el-table-column align="center" label="分组名称" prop="name" :show-overflow-tooltip="true" />
       <el-table-column align="center" label="用户操作" width="160">
         <template #default="scope">
           <div style="text-align: left;">
             <span  style="color: #5473E8;cursor: pointer;" @click="handleUpdate(scope.row)">编辑</span>
             <el-divider direction="vertical" />
             <span  style="color: #F56C6C;cursor: pointer;" size="mini" @click="handleDelete(scope.row)">删除</span>
           </div>
         </template>
       </el-table-column>
     </el-table>
     <div>
       <el-row>
         <el-col :span="20">
           <pagination
             style="margin: 0px; padding: 12px"
             :total="total"
             :page="listQuery.page"
             :limit="listQuery.num"
             @pagination="getList"
           />
         </el-col>
       </el-row>
     </div>
   </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :close-on-click-modal="false" :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="1000px">
      <el-form ref="dataForm" :rules="rules" :model="dataForm" status-icon label-position="top" label-width="100px" style="width: 950px;">
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="分组名称" prop="name">
              <el-input v-model="dataForm.name" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确定</el-button>
          <el-button v-else type="primary" @click="updateData">确定</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>
<style scoped>
.el-form-item{
  margin-top: 10px;
  margin-bottom: 10px;
}
 .pagination-container {
     margin-top: 10px;
  }
</style>
<script>
import { ArrowRight } from '@element-plus/icons-vue'
import { listGroup, createGroup, updateGroup, deleteGroup } from '@/api/group'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
export default {
  name: 'Group',
  components: { Pagination },
  data() {
    return {
      height: 'calc(100vh - 270px)', // 表格高度
      labelStyle: { width: '130px', 'font-size': '14px', 'background-color': '#F6F8FF' },
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        num: 20,
        type:1,
        sort: 'id',
        order: 'desc'
      },
      dataForm: {
        name: ''
      },
      dialogViewVisible: false,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑分组',
        create: '添加分组'
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    // 获取列表
    getList() {
      this.listLoading = true
      listGroup(this.listQuery).then(response => {
        this.list = response.data.data.list
        this.total = response.data.data.total
        this.listLoading = false
      }).catch(() => {
        this.list = []
        this.total = 0
        this.listLoading = false
      })
    },
    // 找查
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    // 重置表单
    resetForm() {
      this.dataForm = {
        name: ''
      }
    },
    // 创建工号
    handleCreate() {
      this.resetForm()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createGroup(this.dataForm).then(response => {
            this.getList()
            this.dialogFormVisible = false
            this.$notify.success({
              title: '成功',
              message: '创建成功'
            })
          }).catch(response => {
            this.$notify.error({
              title: '失败',
              message: response.data.msg
            })
          })
        }
      })
    },
    // 编辑工号
    handleUpdate(row) {
      this.dataForm = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createGroup({cate_id:this.dataForm.id,name:this.dataForm.name}).then(() => {
            this.getList()
            this.dialogFormVisible = false
            this.$notify.success({
              title: '成功',
              message: '更新成功'
            })
          }).catch(response => {
            this.$notify.error({
              title: '失败',
              message: response.data.msg
            })
          })
        }
      })
    },
    // 删除工号
    handleDelete(row) {
      this.$confirm('此操作将删除该分组, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        deleteGroup(row).then(response => {
          this.$notify.success({
            title: '成功',
            message: '删除成功'
          })
          const index = this.list.indexOf(row)
          this.list.splice(index, 1)
        }).catch(response => {
          this.$notify.error({
            title: '失败',
            message: response.data.msg
          })
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    }
  }
}
</script>
