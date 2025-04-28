<template>
  <el-breadcrumb :separator-icon="ArrowRight">
    <el-breadcrumb-item>管理中心</el-breadcrumb-item>
    <el-breadcrumb-item>员工管理</el-breadcrumb-item>
  </el-breadcrumb>
  <div style="background-color: #FFF;margin-top: 20px;">
    <div style="padding: 0 16px;">
      <el-form label-width="70px">
        <el-row :gutter="10">
          <el-col :span="4" style="padding-top: 10px;">
            <el-button  type="success" @click="handleCreate">添加员工</el-button>
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
       <el-table-column align="center" label="ID" prop="id" />
       <el-table-column align="center" label="员工名称" prop="nickname" :show-overflow-tooltip="true" />
       <el-table-column align="center" label="权限"  />
       <el-table-column align="center" label="登录账号" prop="mobile" />
       <el-table-column align="center" label="登录密码" prop="password" :show-overflow-tooltip="true" />
       <el-table-column align="center" label="启用状态" prop="status" width="100">
         <template #default="scope">
           <el-tag :type="scope.row.status == 1 ? 'success' : 'danger'">{{ statusMap[scope.row.status] }}</el-tag>
         </template>
       </el-table-column>
       <el-table-column align="center" label="用户操作" width="160">
         <template #default="scope">
           <div style="text-align: left;">
             <!--              <span  style="color: #E6A23C;cursor: pointer;" @click="handleView(scope.row)">查看</span>-->
             <!--              <el-divider direction="vertical" />-->
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
            <el-form-item label="员工名称" prop="nickname">
              <el-input v-model="dataForm.nickname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户密码" prop="password">
              <el-input v-model="dataForm.password" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="登录账号" prop="mobile">
              <el-input v-model="dataForm.mobile" />
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
import { listUser, createUser, updateUser, deleteUser, uploadUser } from '@/api/user'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
export default {
  name: 'User',
  components: { Pagination },
  data() {
    return {
      height: 'calc(100vh - 270px)', // 表格高度
      labelStyle: { width: '130px', 'font-size': '14px', 'background-color': '#F6F8FF' },
      statusMap: {
        '0': '未启用',
        '1': '已启用'
      },
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
        nickname: '',
        password: '',
        mobile: ''
      },
      dialogViewVisible: false,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑员工',
        create: '添加员工'
      },
      rules: {
        nickname: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        mobile: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
        password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
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
      listUser(this.listQuery).then(response => {
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
        nickname: '',
        password: '',
        mobile: ''
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
          createUser(this.dataForm).then(response => {
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
          createUser(this.dataForm).then(() => {
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
      this.$confirm('此操作将删除该员工, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        deleteUser(row).then(response => {
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
