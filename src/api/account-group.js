/**
 * 账号分组 API
 */
import request from '@/utils/request'

/**
 * 获取账号分组列表（树形结构）
 * @returns {Promise}
 */
export function getAccountGroupList() {
  return request({
    url: '/account/group/list',
    method: 'post',
    data: {}
  })
}

/**
 * 添加账号分组
 * @param {Object} data
 * @param {string} data.name - 分组名称
 * @param {number} data.parent_id - 父分组ID，0表示顶级分组
 * @param {number} data.sort_order - 排序序号
 * @returns {Promise}
 */
export function addAccountGroup(data) {
  return request({
    url: '/account/group/add',
    method: 'post',
    data: {
      name: data.name,
      parent_id: data.parent_id || 0,
      sort_order: data.sort_order || 0
    }
  })
}

/**
 * 更新账号分组
 * @param {Object} data
 * @param {number} data.id - 分组ID
 * @param {string} data.name - 新分组名称（可选）
 * @param {number} data.parent_id - 新父分组ID（可选）
 * @param {number} data.sort_order - 新排序序号（可选）
 * @returns {Promise}
 */
export function updateAccountGroup(data) {
  const formData = {
    id: data.id
  }

  if (data.name !== undefined) {
    formData.name = data.name
  }

  if (data.parent_id !== undefined) {
    formData.parent_id = data.parent_id
  }

  if (data.sort_order !== undefined) {
    formData.sort_order = data.sort_order
  }

  return request({
    url: '/account/group/update',
    method: 'post',
    data: formData
  })
}

/**
 * 删除账号分组
 * @param {number} id - 分组ID
 * @returns {Promise}
 */
export function deleteAccountGroup(id) {
  return request({
    url: '/account/group/delete',
    method: 'post',
    data: {
      id
    }
  })
}

/**
 * 移动账号到指定分组
 * @param {Object} data
 * @param {Array<number>} data.wechat_ids - 账号ID数组
 * @param {number} data.group_id - 目标分组ID，0表示移除分组
 * @returns {Promise}
 */
export function moveAccountsToGroup(data) {
  return request({
    url: '/account/move-to-group',
    method: 'post',
    data: {
      wechat_ids: data.wechat_ids.join(','),
      group_id: data.group_id
    }
  })
}

/**
 * 获取账号列表（支持分组过滤）
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.num - 每页数量
 * @param {number} params.type - 类型
 * @param {string} params.keyword - 关键词
 * @param {number|null} params.group_id - 分组ID（null=全部，0=未分组，>0=指定分组）
 * @returns {Promise}
 */
export function getAccountListByGroup(params) {
  const formData = {
    page: params.page || 1,
    num: params.num || 100,
    type: params.type || 1,
    keyword: params.keyword || ''
  }

  // 如果指定了 group_id，则添加到请求参数中
  if (params.group_id !== undefined && params.group_id !== null) {
    formData.group_id = params.group_id
  }

  return request({
    url: '/platform/accountList',
    method: 'post',
    data: formData
  })
}


