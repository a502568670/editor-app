<template>
  <!--面包屑导航-->
  <el-breadcrumb :separator-icon="icon">
    <el-breadcrumb-item>管理中心</el-breadcrumb-item>
    <el-breadcrumb-item>公众号管理</el-breadcrumb-item>
  </el-breadcrumb>
  <!-- 搜索表单 -->
  <div style="background-color: #FFF; margin-top: 20px;">
    <div style="padding: 0 16px; display: flex; align-items: center; justify-content: space-between;">
      <el-form label-width="100px">
        <el-row :gutter="10">
          <el-col :span="12" style="flex-grow: 1;">
            <el-form-item label="关键词">
              <el-input
                v-model="listQuery.keyword"
                clearable
                style="width: 40%; min-width: 200px;"
                placeholder="请输入公众号关键词"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" style="text-align: end; padding-top: 10px; display: flex; justify-content: flex-end;">
            <div style="display: flex; gap: 10px;">
              <el-button type="primary" @click="handleFilter" style="min-width: 80px;">查找</el-button>
              <el-button type="success" @click="handleCreate" style="min-width: 80px;">添加公众号</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>

  <!-- 公众号列表查询结果 -->
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
      <el-table-column
        type="selection"
        width="55">
      </el-table-column>
      <el-table-column align="center" label="公众号名称" prop="account_name" :show-overflow-tooltip="true" />
      <el-table-column align="center" label="类型" prop="account_type">
        <template #default="scope">
          {{ scope.row.account_type === 1 ? '订阅号' : '服务号' }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="AppID" prop="app_id" :show-overflow-tooltip="true" />
      <el-table-column align="center" label="AppSecret" prop="app_secret" :show-overflow-tooltip="true" />
      <el-table-column align="center" label="公众号图标" prop="avatar_url">
        <template #default="scope">
          <img style="width: 40px; height: 40px" :src="scope.row.avatar_url" />
        </template>
      </el-table-column>


      <el-table-column align="center" label="用户操作" width="180">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px;">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleUpdate(scope.row)"
            >编辑</el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>


    </el-table>
    <div>
      <el-row>
        <el-col :span="20">
          <!--分页组件-->
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
            <img style="width: 40px; height: 40px;border-radius: 50%" :src="dataForm.avatar_url" />
            <div style="margin-left: 10px">
              <div>{{dataForm.account_name}}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公众号名称" prop="account_name">
            <el-input v-model="dataForm.account_name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类型" prop="account_type">
            <el-select v-model="dataForm.account_type" placeholder="请选择公众号类型">
              <el-option label="订阅号" value="1" />
              <el-option label="服务号" value="2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="AppID" prop="app_id">
            <el-input v-model="dataForm.app_id" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="AppSecret" prop="app_secret">
            <el-input v-model="dataForm.app_secret" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="公众号URL" prop="account_url">
            <el-input v-model="dataForm.account_url" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="公众号图标URL" prop="avatar_url">
            <el-input v-model="dataForm.avatar_url" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="二维码URL" prop="qr_code_url">
            <el-input v-model="dataForm.qr_code_url" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="微信号" prop="wechat_id">
            <el-input v-model="dataForm.wechat_id" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="dataForm.description" type="textarea" :rows="4" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="是否认证" prop="verified">
            <el-select v-model="dataForm.verified" placeholder="请选择认证状态">
              <el-option label="未认证" value="0" />
              <el-option label="已认证" value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="状态" prop="status">
            <el-select v-model="dataForm.status" placeholder="请选择状态">
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="updateData">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ArrowRight } from '@element-plus/icons-vue'
import { shallowRef } from "vue";
import Pagination from '@/components/Pagination'
import {
  createOfficialAccount,
  deleteOfficialAccount,
  listOfficialAccount,
  updateOfficialAccount
} from "../api/official_account"; // Secondary package based on el-pagination

export default {
  name: 'Account',
  components: { Pagination },
  data() {
    return {
      icon: shallowRef(ArrowRight),//面包屑导航的图标。
      height: 'calc(100vh - 270px)', // 表格高度
      list: [],//公众号列表数据。
      total: 0,//总记录数。
      listLoading: true,//列表加载状态。
      listQuery: {//查询参数。
        page: 1,
        num: 20,
        keyword: '',
        sort: 'id',
        order: 'desc'
      },
      dataForm: {//表单数据。
        account_id: '',
        account_name: '',
        account_type: '',
        app_id: '',
        app_secret: '',
        account_url: '',
        avatar_url: '',
        qr_code_url: '',
        wechat_id: '',
        description: '',
        verified: '0',
        status: '1'
      },
      dialogFormVisible: false,//对话框显示状态。
      dialogStatus: '',// 对话框状态（添加或编辑）。
      textMap: {//对话框标题映射。
        update: '编辑公众号',
        create: '添加公众号'
      },
      multipleSelection: []//多选的公众号列表。
    }
  },
  // 生命周期钩子:created: 组件创建时调用 getList 方法获取公众号列表。
  created() {
    this.getList()
  },
  methods: {
    handleSelectionChange(val) {// 处理表格多选变化。
      this.multipleSelection = val;
    },
    // 该方法负责向后端发送请求以获取公众号列表数据。获取列表数据
    getList() {
      this.listLoading = true;
      listOfficialAccount({//将 listQuery 对象作为参数传递给 listOfficialAccount API
        ...this.listQuery,
        sort: 'account_id', // 按照公众号ID排序，这两个参数用来覆盖listQuery中的对应属性
        order: 'asc' // 升序排序
      }).then(response => {
        if (response.data.code === 1) {
          // 映射返回的数据字段到前端组件使用的字段
          this.list = response.data.data.list.map((item, index) => ({
            id: item.account_id,
            account_name: item.account_name,
            account_type: item.account_type,
            app_id: item.app_id,
            app_secret: item.app_secret,
            account_url: item.account_url,
            avatar_url: item.avatar_url,
            qr_code_url: item.qr_code_url,
            wechat_id: item.wechat_id,
            description: item.description,
            verified: item.verified,
            status: item.status,
            sort: index + 1 // 自增排序字段
          }));
          this.total = response.data.data.total;
        } else {
          this.list = [];
          this.total = 0;
        }
        this.listLoading = false;
      }).catch(() => {
        this.list = [];
        this.total = 0;
        this.listLoading = false;
      });
    },
    // 处理搜索操作
    handleFilter() {
      this.listQuery.page = 1 // 重置页码为1
      this.getList() // 重新获取列表数据
    },
    // 显示添加公众号对话框。点击“添加公众号”按钮时，调用此方法。初始化表单数据 dataForm，将所有字段清空。
    handleCreate() {
      this.dataForm = {
        account_name: '',
        account_type: '',
        app_id: '',
        app_secret: '',
        account_url: '',
        avatar_url: '',
        qr_code_url: '',
        wechat_id: '',
        description: '',
        verified: '0',
        status: '1'
      }
      this.dialogStatus = 'create'//当前对话框状态是“创建”。
      this.dialogFormVisible = true//显示对话框。
      //使用 $nextTick 确保 DOM 更新后，清除表单验证信息。
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    // 显示编辑公众号对话框。
    handleUpdate(row) {
      this.dataForm = {
        account_id: row.id, // 确保获取当前公众号的ID
        account_name: row.account_name,
        account_type: row.account_type,
        app_id: row.app_id,
        app_secret: row.app_secret,
        account_url: row.account_url,
        avatar_url: row.avatar_url,
        qr_code_url: row.qr_code_url,
        wechat_id: row.wechat_id,
        description: row.description,
        verified: row.verified,
        status: row.status
      }
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    // 处理添加或编辑公众号的操作。
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const requestData = { ...this.dataForm } // 复制表单数据
          // 检查 requestData 中除了 account_id 之外的字段是否都为空
          const hasNonEmptyFields = Object.keys(requestData).some(key => key !== 'account_id' && requestData[key]);

          if (!hasNonEmptyFields) {
            this.$notify.error({
              title: '失败',
              message: '请输入公众号相关信息'
            });
            return; // 如果没有非空字段，则不发送请求
          }
          if (this.dialogStatus === 'create') {
            // 创建操作不需要account_id
            delete requestData.account_id//确保不包含account_id。
            createOfficialAccount(requestData).then(() => {
              this.getList()
              this.dialogFormVisible = false
              this.$notify.success({
                title: '成功',
                message: '添加成功'
              })
            }).catch(response => {
              this.$notify.error({
                title: '失败',
                message: response.data.msg || '添加失败'
              })
            })
          } else {
            // 编辑操作必须包含account_id
            updateOfficialAccount(requestData).then(() => {
              this.getList()
              this.dialogFormVisible = false
              this.$notify.success({
                title: '成功',
                message: '更新成功'
              })
            }).catch(response => {
              this.$notify.error({
                title: '失败',
                message: response.data.msg || '更新失败'
              })
            })
          }
        }
      })
    },

    // 删除公众号
    handleDelete(row) {
      this.$confirm('此操作将删除该公众号, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        deleteOfficialAccount({ account_id: row.id }).then(() => {
          this.getList()
          this.dialogFormVisible = false
          this.$notify.success({
            title: '成功',
            message: '删除成功'
          })

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

<style scoped>
/*表单项的上下边距都为10px*/
.el-form-item {
  margin-top: 10px;
  margin-bottom: 10px;
}
/*分页容器的上边距都为10px*!*/
.pagination-container {
  margin-top: 10px;
}
/* 搜索框和按钮的父容器 */
.el-form {
  overflow-x: auto; /* 允许水平滚动 */
}

/* 搜索框的最小宽度 */
.el-input {
  min-width: 100px;
}

/* 媒体查询：在小屏幕设备上调整布局 */
@media (max-width: 768px) {
  .el-col:nth-child(2) {
    flex-basis: 100%; /* 当屏幕较小时，按钮部分占满一行 */
  }
}
.el-button {
  display: inline-block;
}
</style>
