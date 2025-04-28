<template>
  <el-breadcrumb :separator-icon="icon">
    <el-breadcrumb-item>管理中心</el-breadcrumb-item>
    <el-breadcrumb-item>账号管理</el-breadcrumb-item>
  </el-breadcrumb>
  <div style="background-color: #FFF;margin-top: 20px;">
    <div style="padding: 0 16px;">
      <el-form label-width="70px">
        <el-row :gutter="10">
          <el-col :span="4">
            <el-form-item label="选择平台">
              <select-platform v-model="listQuery.platform_id"></select-platform>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="选择运营者">
             <select-user v-model="listQuery.user_id"></select-user>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="选择分组">
              <select-group v-model="listQuery.cate_id"></select-group>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="关键词">
              <el-input v-model="listQuery.keyword" clearable style="width: 100%;" placeholder="请输入账号关键词" />
            </el-form-item>
          </el-col>
          <el-col :span="8" style="text-align: end;padding-top: 10px;">
            <el-button  type="primary"  @click="handleFilter">查找</el-button>
            <el-button  type="success" @click="handleCreateGroup">设置分组</el-button>
            <el-button  type="success" @click="handleCreateUser">设置运营人</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

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
        @selection-change="handleSelectionChange">
      >
        <el-table-column
          type="selection"
          width="55">
        </el-table-column>
        <el-table-column align="center" label="排序" prop="sort" />
        <el-table-column align="center" label="账号" prop="name" :show-overflow-tooltip="true" >
          <template #default="scope">
            <div style="display: flex;align-items: center">
              <img style="width: 40px; height: 40px" :src="scope.row.avatar" />
              <span style="margin-left: 5px">{{scope.row.name}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="平台" prop="platform_name" >
          <template #default="scope">
            <div style="display: flex;align-items: center">
              <img style="width: 40px; height: 40px" :src="scope.row.image" />
              <span style="margin-left: 5px">{{scope.row.platform_name}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="运营人" prop="operator_name" />
        <el-table-column align="center" label="分组" prop="cate_name" :show-overflow-tooltip="true" />
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
    <el-dialog :close-on-click-modal="false" :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
      <el-form ref="dataForm" :model="dataForm" status-icon label-position="top" label-width="100px" style="width: 560px;">
        <el-row :gutter="40">
          <el-col :span="24">
            <div style="display: flex;align-items: center;padding: 5px;">
              <img style="width: 40px; height: 40px;border-radius: 50%" :src="dataForm.avatar" />
              <div style="margin-left: 10px">
                <div>{{dataForm.name}}</div>
                <div style="color: #51ce94">{{dataForm.platform_name}}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号别名" prop="alias">
              <el-input v-model="dataForm.alias" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input v-model="dataForm.sort"  />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="运营人" prop="operator_name">
              <el-input disabled v-model="dataForm.operator_name"  />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分组" prop="cate_name">
              <el-input disabled v-model="dataForm.cate_name"  />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button  type="primary" @click="updateData">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :close-on-click-modal="false" title="请选择账号分组" v-model="dialogSetGroupVisible" width="400px">
      <el-form :model="dataForm" status-icon label-position="top" label-width="100px" style="width: 360px;">
        <el-row :gutter="40">
          <el-col :span="24">
            <select-group v-model="dataForm.cate_id"></select-group>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogSetGroupVisible = false">取消</el-button>
          <el-button type="primary" @click="setAccountGroup">提交</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog :close-on-click-modal="false" title="请选择账号运营人" v-model="dialogSetUserVisible" width="400px">
      <el-form :model="dataForm" status-icon label-position="top" label-width="100px" style="width: 360px;">
        <el-row :gutter="40">
          <el-col :span="24">
            <select-user v-model="dataForm.user_id"></select-user>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogSetUserVisible = false">取消</el-button>
          <el-button type="primary" @click="setAccountUser">提交</el-button>
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
import { shallowRef } from "vue";
import { listAccount, updateAccount, deleteAccount,setCate,setOperator } from '@/api/account'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import selectPlatform from "../components/selectPlatform";
import selectUser from "../components/selectUser";
import selectGroup from "../components/selectGroup";
export default {
  name: 'Account',
  components: { Pagination,selectPlatform,selectUser,selectGroup },
  data() {
    return {
      icon:shallowRef(ArrowRight),
      height: 'calc(100vh - 270px)', // 表格高度
      labelStyle: { width: '130px', 'font-size': '14px', 'background-color': '#F6F8FF' },
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        num: 20,
        type:1,
        keyword: '',
        sort: 'id',
        order: 'desc'
      },
      dataForm: {
        name: '',
        avatar: '',
        session_id: '',
        platform_id: ''
      },
      dialogViewVisible: false,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑账号',
        create: '添加账号'
      },
      multipleSelection: [],
      dialogSetGroupVisible:false,
      dialogSetUserVisible:false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    // 获取列表
    getList() {
      this.listLoading = true
      listAccount(this.listQuery).then(response => {
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
    handleCreateGroup() {
      if(this.multipleSelection.length<=0){
        return
      }
      this.dialogSetGroupVisible = true
    },
    setAccountGroup() {
      if(this.multipleSelection.length<=0){
        return
      }
      let ids=this.multipleSelection.map(x=>x.id)
      setCate({cate_id:this.dataForm.cate_id,account_id:ids.join(',')}).then(() => {
        this.getList()
        this.dialogSetGroupVisible = false
        this.$notify.success({
          title: '成功',
          message: '设置成功'
        })
      }).catch(response => {
        this.$notify.error({
          title: '失败',
          message: response.data.msg
        })
      })
    },
    handleCreateUser() {
      if(this.multipleSelection.length<=0){
        return
      }
      this.dialogSetUserVisible = true
    },
    setAccountUser() {
      if(this.multipleSelection.length<=0){
        return
      }
      let ids=this.multipleSelection.map(x=>x.id)
      setOperator({user_id:this.dataForm.user_id,account_id:ids.join(',')}).then(() => {
        this.getList()
        this.dialogSetUserVisible = false
        this.$notify.success({
          title: '成功',
          message: '设置成功'
        })
      }).catch(response => {
        this.$notify.error({
          title: '失败',
          message: response.data.msg
        })
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
          updateAccount({account_id:this.dataForm.id,alias:this.dataForm.alias,sort:this.dataForm.sort}).then(() => {
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
      this.$confirm('此操作将删除该工号, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        deleteAccount({account_id:row.id}).then(response => {
          this.$notify.success({
            title: '成功',
            message: '删除成功'
          })
         this.getList()
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
