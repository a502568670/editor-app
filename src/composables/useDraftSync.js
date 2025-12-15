/**
 * 草稿同步 Composable
 * 用于将微信草稿箱中的草稿同步到本地数据库
 */

import { ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { saveAppMsg, groupAppMsgs } from '@/api/appmsg'
import { getToken } from '@/utils/auth'
import { serializeCookie } from '@/utils/cookie'
import { format_to_UEditor_html } from '@/utils/dom'
import { getVideoFrameHtml } from '@/utils/video'
import { mapShareInfoFromAppmsg } from '@/lib/share-info'

export function useDraftSync(channelSource = 'draft_sync') {
  // 同步状态
  const syncingDrafts = ref(new Set()) // 正在同步的草稿ID集合
  const pendingDraftsToSync = ref([]) // 等待同步的草稿队列
  
  // IPC 通道
  const channelName = 'fromMain'
  let ipcCleanup = null

  /**
   * 检查草稿是否在本地数据库
   * @param {number} appmsgid - 草稿ID
   * @param {number} wechatId - 微信账号ID
   * @returns {Promise<boolean>}
   */
  const checkIsLocal = async (appmsgid, wechatId) => {
    try {
      const res = await groupAppMsgs({ 
        wechat_id: wechatId, 
        only_show_group_key: 1, 
        only_show_local: 0 
      })
      return res.data.some(v => v.appmsgid == appmsgid)
    } catch (error) {
      console.error('检查草稿是否在本地失败:', error)
      return false
    }
  }

  /**
   * 发送IPC请求获取草稿详情
   * @param {number} appmsgid - 草稿ID
   * @param {Object} account - 账号对象
   */
  const requestDraftFromWechat = (appmsgid, account) => {
    const { token, id, session_id } = account
    
    window.ipcRenderer.send('toMain', {
      tag: 'appmsg:getAppmsgInDraftBox',
      source: channelSource,
      token: getToken(),
      wechat_id: id,
      getData: {
        cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
        token: parseInt(token),
        appmsgid,
      }
    })
  }

  /**
   * 同步远程草稿到本地数据库
   * @param {Object} appmsg_info - 草稿信息
   * @param {Object} account - 账号对象
   * @returns {Promise<Object>}
   */
  const syncRemoteToLocal = async (appmsg_info, account) => {
    const { token, id, session_id } = account
    
    const firstItem = appmsg_info.item[0]
    console.log("syncRemoteToLocal appmsg_info:", firstItem)
    const appmsgid = firstItem.app_id
    
    // 转换数据格式
    const material_list = firstItem.multi_item.map(mi => {
      const material_item = {
        msg_id: 0,
        item_show_type: mi.share_page_type,
        cdn_url: mi.cdn_url,
        title: mi.title,
        author: mi.author,
        copyright_type: mi.copyright_type,
        need_open_comment: mi.need_open_comment,
        only_fans_can_comment: mi.only_fans_can_comment,
        only_fans_days_can_comment: mi.only_fans_days_can_comment,
        sourceurl: mi.source_url,
        insert_ad_mode: mi.insert_ad_mode,
        can_insert_ad: mi.can_insert_ad,
        claim_source_type: mi.claim_source_type,
      }
      const shareInfo = mapShareInfoFromAppmsg(mi)
      if (shareInfo) {
        material_item.share_info = shareInfo
      }
      console.log("material_item=>", material_item)
      // 根据不同类型处理内容
      if (material_item.item_show_type === 0) {
        // 图文消息
        material_item.content_noencode = format_to_UEditor_html(mi.content)
      } else if (material_item.item_show_type === 5) {
        // 视频消息
        material_item.guide_words = mi.content
        material_item.vid = mi.mp_video_info[0].vid
        material_item.content_noencode = getVideoFrameHtml(material_item.vid, material_item.cdn_url)
      } else if (material_item.item_show_type === 8 && mi.picture_page_info_list) {
        // 图片消息（小绿书）
        material_item.guide_words = mi.content
        const reg = /^rgb\((\d+),(\d+),(\d+)\)$/
        mi.picture_page_info_list.forEach(o => {
          const parts = reg.exec(o.theme_color)
          o.theme_color = {
            r: parseInt(parts[1]),
            g: parseInt(parts[2]),
            b: parseInt(parts[3]),
          }
        })
        material_item.picture_page_info_list = mi.picture_page_info_list
      } else if (material_item.item_show_type === 10) {
        // 音频消息
        material_item.guide_words = mi.content
      }
      
      return material_item
    })
    
    const postData = {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      appmsgid,
      material_list,
      wechat_id: id,
      remote_to_local: 1, // 标记为远程同步
    }
    
    console.log("保存草稿到本地:", postData)
    
    try {
      const res = await saveAppMsg(postData)
      console.log("保存成功:", res)
      return { success: true, appmsgid, data: firstItem }
    } catch (error) {
      console.error("保存失败:", error)
      return { success: false, appmsgid, error }
    }
  }

  /**
   * 注册IPC监听器
   */
  const registerIpcListener = () => {
    ipcCleanup = window.ipcRenderer.receive(channelName, (msg) => {
      if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
        const { source, ret } = msg.data
        
        // 只处理本组件的消息
        if (source !== channelSource) {
          return
        }
        
        const tag = msg.tag
        
        if (tag === 'appmsg-ret:getAppmsgInDraftBox') {
          const { success, appmsg_info, err_msg } = ret
          
          if (!success) {
            console.error('获取草稿失败:', err_msg)
            
            // 查找对应的pending项
            const appmsgid = msg.data.getData?.appmsgid
            if (appmsgid) {
              const idx = pendingDraftsToSync.value.findIndex(p => p.appmsgid === appmsgid)
              if (idx > -1) {
                const pending = pendingDraftsToSync.value[idx]
                pending.reject(new Error(err_msg || '获取草稿失败'))
                pendingDraftsToSync.value.splice(idx, 1)
                syncingDrafts.value.delete(appmsgid)
              }
            }
            return
          }
          
          // 获取成功，同步到本地
          const firstItem = appmsg_info.item[0]
          const appmsgid = firstItem.app_id
          const idx = pendingDraftsToSync.value.findIndex(p => p.appmsgid === appmsgid)
          
          if (idx > -1) {
            const pending = pendingDraftsToSync.value[idx]
            
            // 执行同步
            syncRemoteToLocal(appmsg_info, pending.account).then(result => {
              if (result.success) {
                console.log(`草稿 ${appmsgid} 同步成功`)
                pending.resolve(result)
              } else {
                console.error(`草稿 ${appmsgid} 同步失败:`, result.error)
                pending.reject(result.error)
              }
            }).catch(error => {
              console.error(`草稿 ${appmsgid} 同步异常:`, error)
              pending.reject(error)
            }).finally(() => {
              // 清理
              syncingDrafts.value.delete(appmsgid)
              const currentIdx = pendingDraftsToSync.value.findIndex(p => p.appmsgid === appmsgid)
              if (currentIdx > -1) {
                pendingDraftsToSync.value.splice(currentIdx, 1)
              }
            })
          }
        }
      }
    })
  }

  /**
   * 清理IPC监听器
   */
  const cleanupIpcListener = () => {
    if (ipcCleanup) {
      console.log(`cleanup IPC listener for ${channelSource}`)
      ipcCleanup()
      ipcCleanup = null
    }
  }

  /**
   * 批量同步草稿到本地
   * @param {Array} drafts - 草稿列表
   * @param {Object} account - 账号对象
   * @param {Object} options - 选项
   * @param {boolean} options.showLoading - 是否显示loading
   * @param {Function} options.onProgress - 进度回调
   * @returns {Promise<Object>} { synced: [], ready: [], failed: [] }
   */
  const syncDraftsToLocal = async (drafts, account, options = {}) => {
    const { 
      showLoading = true,
      onProgress = null 
    } = options
    
    if (!drafts || drafts.length === 0) {
      return { synced: [], ready: [], failed: [] }
    }
    
    let loader = null
    if (showLoading) {
      loader = ElLoading.service({
        lock: true,
        text: '正在检查草稿并同步到本地...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }
    
    try {
      // 检查哪些草稿需要同步
      const draftsToSync = []
      const draftsReady = []
      
      for (const draft of drafts) {
        const appmsgid = draft.app_id
        const isLocal = await checkIsLocal(appmsgid, account.id)
        
        if (isLocal) {
          draftsReady.push(draft)
        } else {
          draftsToSync.push(draft)
        }
      }
      
      console.log(`需要同步: ${draftsToSync.length} 篇，已在本地: ${draftsReady.length} 篇`)
      
      const syncedDrafts = []
      const failedDrafts = []
      
      // 同步未保存的草稿
      if (draftsToSync.length > 0) {
        if (loader) {
          loader.setText(`正在同步 ${draftsToSync.length} 篇草稿到本地...`)
        }
        
        for (let i = 0; i < draftsToSync.length; i++) {
          const draft = draftsToSync[i]
          const title = draft.multi_item[0]?.title || '无标题'
          
          if (loader) {
            loader.setText(`正在同步草稿 ${i + 1}/${draftsToSync.length}: ${title}`)
          }
          
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: draftsToSync.length,
              draft,
              status: 'syncing'
            })
          }
          
          try {
            // 使用Promise等待IPC返回
            await new Promise((resolve, reject) => {
              const appmsgid = draft.app_id
              syncingDrafts.value.add(appmsgid)
              
              // 保存resolve函数供IPC回调使用
              pendingDraftsToSync.value.push({
                appmsgid,
                draft,
                account,
                resolve,
                reject
              })
              
              // 发送IPC请求
              requestDraftFromWechat(appmsgid, account)
              
              // 设置超时（30秒）
              setTimeout(() => {
                if (syncingDrafts.value.has(appmsgid)) {
                  syncingDrafts.value.delete(appmsgid)
                  const idx = pendingDraftsToSync.value.findIndex(p => p.appmsgid === appmsgid)
                  if (idx > -1) {
                    pendingDraftsToSync.value.splice(idx, 1)
                  }
                  reject(new Error('同步超时'))
                }
              }, 30000)
            })
            
            syncedDrafts.push(draft)
            
            if (onProgress) {
              onProgress({
                current: i + 1,
                total: draftsToSync.length,
                draft,
                status: 'success'
              })
            }
          } catch (error) {
            console.error(`同步草稿 ${draft.app_id} 失败:`, error)
            failedDrafts.push({ draft, error: error.message })
            
            if (onProgress) {
              onProgress({
                current: i + 1,
                total: draftsToSync.length,
                draft,
                status: 'failed',
                error: error.message
              })
            }
          }
        }
      }
      
      if (loader) {
        loader.close()
      }
      
      // 返回结果
      return {
        synced: syncedDrafts,      // 新同步的草稿
        ready: draftsReady,         // 原本就在本地的草稿
        failed: failedDrafts        // 同步失败的草稿
      }
      
    } catch (error) {
      if (loader) {
        loader.close()
      }
      console.error('批量同步草稿失败:', error)
      throw error
    }
  }

  return {
    // 状态
    syncingDrafts,
    pendingDraftsToSync,
    
    // 方法
    checkIsLocal,
    syncDraftsToLocal,
    registerIpcListener,
    cleanupIpcListener,
  }
}

