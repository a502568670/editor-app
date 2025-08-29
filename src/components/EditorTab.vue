<template>
  <div class="flex flex-col h-full bg-[#e9f9f1]">
    <div class="h-10 flex space-x-2 items-center border-b mb-1 shadow-md">
      <div class="flex items-center pl-1">
        <img class="w-9 h-9 rounded-full" :src="selectedAccount?.avatar" />
        <div class="flex-1 flex justify-start text-left items-center pl-1 min-w-[190px]">
          {{ selectedAccount?.name }}
        </div>
        <div>
          <el-dropdown>
            <el-button type="primary">
              创建素材<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  @click="emitEvents('createAppmsg', { type: 0, account_id: props.account.id })">创建当前公众号图文素材</el-dropdown-item>
                <el-dropdown-item
                  @click="emitEvents('createAppmsg', { type: 0, account_id: props.account.id, item_show_type: 8 })">创建当前公众号小绿书</el-dropdown-item>
                <el-dropdown-item
                  @click="emitEvents('createAppmsg', { type: 0, account_id: props.account.id, item_show_type: 5 })">创建当前公众号视频素材</el-dropdown-item>
                <el-dropdown-item divided
                  @click="emitEvents('createAppmsg', { type: 1 })">创建其他公众号图文素材</el-dropdown-item>
                <el-dropdown-item
                  @click="emitEvents('createAppmsg', { type: 1, item_show_type: 8 })">创建其他公众号小绿书</el-dropdown-item>
                <el-dropdown-item
                  @click="emitEvents('createAppmsg', { type: 1, item_show_type: 5 })">创建其他公众号视频素材</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <el-button @click="handleSaveAppMsg" type="success">暂存</el-button>
      <el-button @click="handleSyncToWechatDraftBox" type="success">保存到公众号草稿箱</el-button>
      <el-button @click="openSendArticleDialog" type="success">同步到其他账号</el-button>
      <el-button @click="confirmOpenPublishToWechatDialog" type="danger">发表</el-button>
      <!-- <el-dropdown split-button type="danger">
        其他
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleSyncToWechatDraftBox">同步到微信草稿箱</el-dropdown-item>
            <el-dropdown-item @click="confirmOpenPublishToWechatDialog">发布到微信</el-dropdown-item>
            <el-dropdown-item divided @click="openSendArticleDialog">同步到其他账号</el-dropdown-item>
          </el-dropdown-menu>
        </template>
</el-dropdown> -->
      <!-- <el-button @click="handleSyncToWechatDraftBox" type="danger">同步到微信草稿箱</el-button>
      <el-button @click="openSendArticleDialog" type="danger">同步到其他账号</el-button> -->
    </div>
    <el-row :gutter="0" class="flex-1 items-stretch h-0">
      <el-col :span="6" class="overflow-scroll bg-white">
        <div class="bg-white  shadow-xl">
          <div v-if="mp_msgsRef">
            <div class="flex w-full items-center pl-2 pt-2">
              <el-button type="primary" :disabled="mp_msgsRef.length === 0" @click="checkTitles">
                检测标题(30天内)
              </el-button>
            </div>
            <div ref="elListMsgsRef" class="overflow-auto" style="height:calc(100vh - 208px)">
              <div @click="loadArticle(item, true)" v-for="(item, index) in mp_msgsRef" :key="item.msg_id"
                class="flex items-center p-2 border-b w-full">
                <img v-if="item.cdn_url" :src="fmtImageUrl(item.cdn_url)" style="width:0px;height:0px;"
                  referrerpolicy="no-referrer" />
                <div v-if="index === 0" class='relative w-full flex h-40 justify-between items-end bg-[#e6e6e6] '
                  :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }">
                  <div v-if="isShowCheckTitleResults(item.title)"
                    class="flex absolute left-0 top-0 justify-between px-1 space-x-2 text-white text-sm opacity-70"
                    :class="checkTitleIsPublished(item.title) ? 'bg-red-600' : 'bg-green-600'">
                    {{ getTitleMessage(item.title) }}
                  </div>
                  <img v-if="item.cdn_url" class="w-full h-full  object-cover rounded-sm" :src="item.cdn_url"
                    referrerpolicy="no-referrer" />
                  <div class="flex absolute text-white p-1 bg-gray-600 opacity-70"><span
                      v-if="item.msg_id === 0">*</span>{{
                        item.title }}
                  </div>
                  <div
                    class="flex absolute right-0 justify-between px-1 space-x-2 py-1 text-white bg-gray-600 opacity-70"
                    v-if="item.msg_id === msg_idRef && !is_xiaolvshu">
                    <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                      <component :is="ArrowDown"></component>
                    </el-icon>
                    <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                      <component :is="Delete"></component>
                    </el-icon>
                  </div>
                </div>
                <div class="w-full flex h-20 items-center p-1 relative"
                  :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }" v-else>
                  <div class="flex flex-col flex-1 h-full justify-end">
                    <div class="h-[54px] w-full max-w-full max-h-[54px] overflow-y-hidden"><span
                        class="mx-1 text-red-500" v-if="item.msg_id === 0">*</span>
                      <el-icon v-if="item.item_show_type === 5" :size="20"
                        class="cursor-pointer flex justify-center items-end" title="视频文章">
                        <Video />
                      </el-icon>
                      {{ item.title }}
                    </div>
                    <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
                  </div>
                  <div v-if="isShowCheckTitleResults(item.title)"
                    class="flex absolute top-0 justify-between px-1 space-x-2 text-white text-sm opacity-70"
                    :class="checkTitleIsPublished(item.title) ? 'bg-red-600' : 'bg-green-600'">
                    {{ getTitleMessage(item.title) }}
                  </div>
                  <img v-if="item.cdn_url" class="w-10 h-10 rounded-sm" :src="fmtImageUrl(item.cdn_url)" />
                  <div class="flex flex-col justify-around px-1 h-full" v-if="item.msg_id === msg_idRef">
                    <el-icon class="cursor-pointer" @click="swapUp(item.msg_id)">
                      <component :is="ArrowUpRef"></component>
                    </el-icon>
                    <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                      <component :is="ArrowDownRef" v-if="index < mp_msgsRef.length - 1"></component>
                    </el-icon>
                    <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                      <component :is="DeleteRef"></component>
                    </el-icon>
                  </div>
                </div>
              </div>
              <div class="w-full flex h-20 items-center p-1 justify-center">
                <el-dropdown v-if="!is_xiaolvshu">
                  <el-button type="primary">
                    新建消息<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="() => newArticle(true, 0)">图文</el-dropdown-item>
                      <el-dropdown-item @click="() => newArticle(true, 5)">视频</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="w-full flex h-1 items-center p-1 justify-center">
              <!-- <div @click="newArticle()"  class="cursor-pointer">+新建文章</div> -->
              <!-- <el-button @click="newArticle" type="primary">新建文章</el-button> -->
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12" class="h-full overflow-auto" v-loading="globalLoadingRef">
        <div class="h-full flex flex-col">
          <el-input v-model="currentArticleRef.title" style="--el-input-text-color:#000;--el-input-height:52px;font-size:24px" clearable placeholder="请输入文章标题"
            @input="syncToList('title')" v-if="![5, 8].includes(currentArticleRef.item_show_type)" />
          <div ref="ueditor_wrapper" class="h-full flex-1">
            <vue-ueditor-wrap class="h-full flex items-stretch"
              v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 0"
              v-model="currentArticleRef.content_noencode" :editor-id="editorIdRef" @ready="ready"
              :config="editorConfigRef" :editorDependencies="['ueditor.config.js', 'ueditor.all.js']" />
            <!-- 这里是视频的编辑区 -->
            <div v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 5" class="w-full p-2">
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24">
                  <el-input v-model="currentArticleRef.title" clearable class="w-full" placeholder="请输入文章标题"
                    @input="syncToList('title')" />
                </el-col>
              </el-row>
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24" class="flex w-full">
                  <!-- <el-input v-model="currentArticleRef.author" clearable class="w-full" placeholder="请输入视频介绍,可以不填" /> -->
                  <el-mention v-model="currentArticleRef.guide_words" type="textarea" class="w-full h-40"
                    placeholder="请输入视频介绍,可以不填" />
                </el-col>
              </el-row>
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24" class="flex justify-center items-center">
                  <div v-if="!currentArticleRef.vid" class="flex-1 flex justify-center h-[60px]">
                    <el-button @click="openVideoMaterialDialog" class="max-w-[80px]  m-auto"
                      type="primary">视频素材</el-button>
                  </div>
                  <div v-else v-html="currentArticleRef.content_noencode">
                  </div>
                </el-col>
              </el-row>
            </div>
            <!-- 这里是小绿书的编辑区 -->
            <div v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 8"
              class="w-full p-2 pb-5 flex-col h-full overflow-auto">
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24">
                  <ImgListPicker v-model="currentArticleRef.picture_page_info_list">
                    <template #picker v-if="(currentArticleRef.picture_page_info_list || []).length < 20">
                      <el-icon class="item bg-white" @click="refImgPicker.openDialog(), imgListPicking = true">
                        <Plus />
                      </el-icon>
                    </template>
                  </ImgListPicker>
                </el-col>
              </el-row>
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24">
                  <el-input v-model="currentArticleRef.title" clearable class="w-full" placeholder="请在这里输入标题 (选填)"
                    @input="syncToList('title')" />
                </el-col>
              </el-row>
              <el-row :gutter="4" class="mb-1 w-full ">
                <el-col :span="24" class="flex w-full">
                  <!-- <el-input v-model="currentArticleRef.author" clearable class="w-full" placeholder="请输入视频介绍,可以不填" /> -->
                  <el-mention v-model="currentArticleRef.guide_words" type="textarea" class="w-full h-20"
                    placeholder="填写描述信息，让大家了解更多内容" />
                </el-col>
              </el-row>
            </div>
            <!-- 纯文字的编辑区，不排除其他类型 -->
            <div v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 10"
              class="w-full p-2 pb-5 flex-col h-full overflow-auto">
              <el-row :gutter="4" class="mb-1 w-full">
                <el-col :span="24">
                  <el-input v-model="currentArticleRef.title" clearable class="w-full" placeholder="请在这里输入标题 (选填)"
                    @input="syncToList('title')" />
                </el-col>
              </el-row>
              <el-row :gutter="4" class="mb-1 w-full ">
                <el-col :span="24" class="flex w-full">
                  <!-- <el-input v-model="currentArticleRef.author" clearable class="w-full" placeholder="请输入视频介绍,可以不填" /> -->
                  <el-mention v-model="currentArticleRef.guide_words" type="textarea" class="w-full h-96"
                    placeholder="填写描述信息，让大家了解更多内容" />
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="1" class="overflow-scroll bg-white">
        <div
          class="grid-content flex flex-col h-full justify-start items-center border  space-y-2 p-2 bg-slate-100 text-blue-500">
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openExtractMpArticleUrlDialog"
            title="提取链接内容">
            <Link />
          </el-icon>
          <BatchExtractMpArticle v-model="mp_msgsRef" @confirm="onBatchExtractMp" />
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openAdDialog" title="设置广告">
            <DollarSign />
          </el-icon>
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openMiniAppDialog" title="插入小程序">
            <WechatMiniAppIcon />
          </el-icon>
          <el-icon v-if="false" :size="20" class="cursor-pointer flex justify-center" @click="openMPDialog" title="插入公众号名片">
            <WechatMPIcon />
          </el-icon>
          <Minus class="text-gray-200" />
          <!-- <div class="flex-1"></div> -->
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="handlePreview" title="文章预览">
            <Eye />
          </el-icon>
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openMobilePreviewDialog"
            title="文章手机预览">
            <ScanEye />
          </el-icon>
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openAppMsgMobilePreviewDialog"
            title="消息手机预览">
            <Smartphone />
          </el-icon>

          <!-- <el-icon v-if="isDebugRef" :size="20" class="cursor-pointer flex justify-center"
            @click="handleLocalExtractMpArticleUrl" title="测试本地提取链接">
            <Link2 />
          </el-icon> -->
          <el-icon v-if="isDebugRef" :size="20" class="cursor-pointer flex justify-center" @click="openDebugDialog"
            title="调试信息">
            <SquareTerminal />
          </el-icon>
        </div>
      </el-col>
      <el-col :span="5" class="h-full">
        <el-tabs type="border-card" class="editor-inner-tabs">
          <el-tab-pane label="发布设置">
            <el-row :gutter="4" class="mb-1" v-if="false&&![5, 8].includes(currentArticleRef.item_show_type)">
              <el-col :span="24">
                <el-input v-model="currentArticleRef.title" clearable class="grid-content-control" placeholder="请输入文章标题"
                  @input="syncToList('title')" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1" v-if="![8].includes(currentArticleRef.item_show_type)">
              <el-col :span="24">
                <el-input v-model="currentArticleRef.author" clearable class="grid-content-control"
                  placeholder="请输入文章作者" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1 w-full">
              <el-col :span="24" class="h-20 py-2 w-full flex justify-center items-center" style="display: none;">
                <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-if="selectedCdnImageRef"
                  :src="selectedCdnImageRef" alt="封面预览">
                <img class="cursor-pointer max-h-16 block" @click="triggerFileInput"
                  v-else-if="currentArticleRef.cdn_url" :src="currentArticleRef.cdn_url" referrerpolicy="no-referrer"
                  alt="封面图" />
                <div v-else @click="triggerFileInput"
                  class="cursor-pointer border h-16 w-[180px] flex justify-center items-center bg-[#8c8c8c]">设置封面图</div>
                <input class="invisible" ref="cdnFileInputRef" @change="handleImage" type="file" accept="image/*">
              </el-col>
              <ImgPicker v-show="currentArticleRef.item_show_type !== 10" ref="refImgPicker" v-model="pickerQuery"
                :pageInfo="pickerPageInfo" :imgSrc="currentArticleRef.cdn_url" placeholder="设置封面图"
                @change="handleImageUpload" @confirm="onImgPick" :editorInst="editorRef" />
              <!-- <ImgCrop :imgSrc="currentArticleRef.cdn_url" placeholder="设置封面图" @change="handleImageUpload"></ImgCrop> -->
            </el-row>
            <!-- <el-row :gutter="4" class="mb-1 invisible">
        <el-col :span="24">
          
        </el-col>
      </el-row> -->
            <el-row :gutter="4" class="my-2">
              <el-col :span="24">
                <hr />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1">
              <el-col :span="24">
                <!-- 创作来源 -->
                <el-select v-model="selected_claim_source_typeRef" value-key="id" filterable placeholder="创作来源">
                  <el-option v-for="(item) in claim_source_typesRef" :key="item.id" :label="item.name" :value="item" />
                </el-select>
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1">
              <el-col :span="24">
                <el-checkbox label="声明原创" v-model="copyrightRef" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="h-8 mb-1">
              <el-col :span="24">
                <el-input v-model="currentArticleRef.sourceurl" clearable class="grid-content-control"
                  placeholder="原文链接" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1">
              <el-col :span="24">
                <el-checkbox label="打开留言" v-model="needOpenCommentRef" />
                <el-radio-group :disabled="!needOpenCommentRef" v-model="commentTypeRef">
                  <!-- works when >=2.6.0, recommended ✔️ not work when <2.6.0 ❌ -->
                  <el-radio value="0">所有人可留言</el-radio>
                  <!-- works when <2.6.0, deprecated act as value when >=3.0.0 -->
                  <el-radio label="1">仅关注后可留言</el-radio>
                </el-radio-group>
              </el-col>
            </el-row>

            <!-- <el-row :gutter="4" class="my-2">
          <el-col :span="24">
            <hr />
          </el-col>
        </el-row>
        <el-row :gutter="4" class="mb-1">
          <el-col :span="24">

          </el-col>
        </el-row>
        <el-row :gutter="4" class="h-8 mb-1">
          <el-col :span="24"></el-col>
        </el-row>
        <el-row :gutter="4" class="h-8 mb-1">
          <el-col :span="24"></el-col>
        </el-row> -->
          </el-tab-pane>
          <el-tab-pane label="样式中心" class="h-full">
            <SysTempl :editorInst="editorRef" />
          </el-tab-pane>
          <el-tab-pane label="自定义模板" class="h-full">
            <UserTempl v-model="currentArticleRef.content_noencode" :visible="currentArticleRef.item_show_type === 0" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
  <el-dialog :close-on-click-modal="false" title="提取文章链接内容" v-model="dialogExtractMpAritcleUrlRef" width="720px">
    <div class="w-full flex flex-col">
      <el-row :gutter="40" class="w-full">
        <el-col :span="18" class="w-full">
          <el-input v-model="extractArticleUrlRef" clearable placeholder="请输入文章提取地址" />
        </el-col>
        <el-col :span="6">
          <el-button @click="handleLocalExtractMpArticleUrl" type="primary">提取链接内容</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="40" class="w-full">
        <el-col :span="3" class="w-full">
          <el-checkbox label="仅视频" v-model="import_settings.only_video_flag" />
        </el-col>
      </el-row>
      <el-row :gutter="40" class="w-full">
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除链接" v-model="import_settings.clear_content_url" />
        </el-col>
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除摘要" v-model="import_settings.clear_abstract" />
        </el-col>
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除作者" v-model="import_settings.clear_author" />
        </el-col>
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除原文链接" v-model="import_settings.clear_source_url" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除小程序" v-model="import_settings.clear_weapp" />
        </el-col>
        <el-col :span="4" class="w-full">
          <el-checkbox label="清除广告" v-model="import_settings.clear_ad" />
        </el-col>
      </el-row>
    </div>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="视频素材" v-model="dialogVideoMaterialRef" width="600px">
    <el-row :gutter="40" class="w-full h-[400px]" v-loading="videoLoadingRef">
      <el-col :span="12">
      </el-col>
      <el-col :span="11">
        <div class="px-2 py-0.5 flex items-center border rounded-sm">
          <el-input class="bg-white query-input" v-model="video_queryRef" placeholder="搜索视频" />
          <el-icon class="cursor-pointer" @click="openVideoMaterialDialog(2)">
            <Search class="text-gray-400" />
          </el-icon>
        </div>
      </el-col>
      <el-col :span="1">
      </el-col>
      <el-col :span="24" class="w-full h-[350px] overflow-auto">
        <div class="w-full flex flex-wrap justify-start gap-4 ">
          <div v-for="(item, index) in videosRef" :key="index" class="w-[250px]"
            :class="{ 'border border-green-400': item.vid == selected_videoRef?.vid }">
            <el-card class="w-full" @click="handleChooseVideo(item)">
              <template #header>{{ item.title }}</template>
              <img :src="item.cdn_url" height="48" />
            </el-card>
          </div>
        </div>
      </el-col>
    </el-row>
    <template #footer>
      <div class="dialog-footer flex items-center justify-center">
        <div><simple-pager :page_no="video_current_pageRef" :total_cnt="video_total_cntRef"
            :page_count="video_count_per_page" :list_by="paginate_videos" /></div>
        <div class="flex-1"></div>
        <el-button @click="dialogVideoMaterialRef = false">取消</el-button>
        <el-button @click="handleImportVideo" type="primary">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="设置广告" v-model="dialogAdVisibleRef" width="600px">
    <el-form ref="dataForm" :rules="rules" :model="dataForm" status-icon label-position="top" label-width="100px">
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="插入方式">
            <el-radio-group v-model="insertAdTypeRef">
              <!-- works when >=2.6.0, recommended ✔️ not work when <2.6.0 ❌ -->
              <el-radio value="2">智能插入</el-radio>
              <!-- works when <2.6.0, deprecated act as value when >=3.0.0 -->
              <el-radio label="1">手动插入</el-radio>
              <el-radio label="0">不插入</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="40">
        <el-col :span="24">
          <el-form-item label="商品类目">
            <el-checkbox label="全部类目" @change="clickAllCategory"></el-checkbox>
            <el-checkbox-group :disabled="insertAdTypeRef != '1'" v-model="adCategoryChoosedRef">
              <el-checkbox v-for="(item) in adCategoryRef" :key="item.id" :label="item.id">
                {{ item.name }}
              </el-checkbox>
              <!-- <el-checkbox label="Option 2 & Value 2" /> -->
            </el-checkbox-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogAdVisibleRef = false">取消</el-button>
        <el-button @click="insertAd" type="primary">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <SetMiniApp ref="setMiniAppRef" :pickerPageInfo="pickerPageInfo" v-model="pickerQuery"
    @search-mini-app="searchMiniApp" />
  <SetMPCard ref="setMPCardRef" @search-mp="searchMP" @insert-mp-card="insertMPCard" />
  <el-dialog :close-on-click-modal="false" title="手机扫码预览" v-model="dialogMobilePreviewVisibleRef" width="330px">
    <el-row :gutter="40" class="h-[300px]">
      <el-col :span="24">
        <img v-if="qrcodeMobilePreviewRef" class="w-full h-full" :src="qrcodeMobilePreviewRef" />
      </el-col>
    </el-row>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="发送预览" v-model="dialogAppMsgMobilePreviewVisibleRef" width="600px">
    <el-row :gutter="40" class="w-full h-[300px]">
      <el-col :span="24" class="w-full">
        <div class="flex gap-2 flex-wrap justify-start w-full">
          <el-tag v-for="previewer in previewersRef" :key="previewer" closable :disable-transitions="false"
            @close="removePreviewer(previewer)">
            {{ previewer }}
          </el-tag>
          <el-input v-if="previewerInputVisible" ref="previewerInputRef" v-model="previewerInputValue" class="w-20"
            size="small" @keyup.enter="handleAddPreviewerConfirm" @blur="handleAddPreviewerConfirm" />
          <el-button v-else class="button-new-tag" size="small" @click="showAddPreviewerInput">
            + 微信号/QQ号/手机号
          </el-button>
        </div>
      </el-col>
    </el-row>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogAppMsgMobilePreviewVisibleRef = false">取消</el-button>
        <el-button @click="sendPreviewToMobile" type="primary">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <SyncToOtherAccountsDialog :dialogVisible="dialogSendArticleVisibleRef" :accounts="otherAccountsRef"
    @instant-send="handleInstantSend" @dialog-closed="dialogSendArticleVisibleRef = false" />

  <el-dialog :close-on-click-modal="false" title="操作进度" v-model="dialogPercentVisbleRef" width="360px">
    <div class="flex flex-col w-full">
      <div class="flex justify-center">
        <el-progress type="dashboard" class="flex" :percentage="percentRef">
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">{{ progressDescRef }}</span>
          </template>
        </el-progress>
      </div>
      <div v-if="progressResultRef" class="flex flex-col w-full">
        <div class="flex items-center text-green-400">
          <el-icon class="cursor-pointer">
            <component :is="CircleCheckFilled"></component>
          </el-icon>成功
        </div>
        <div class="flex items-center h-16">
          {{progressResultRef.success_accounts?.map(v => v.name).join(";")}}
        </div>
        <hr />
        <div class="flex items-center text-red-400">
          <el-icon class="cursor-pointer">
            <component :is="CircleCloseFilled"></component>
          </el-icon>失败
        </div>
        <div class="flex items-center space-x-2 h-16">
          <div class="flex items-center" v-for="(item) in progressResultRef?.fail_accounts" :key="item.name">
            {{ item.name }}
            <el-tooltip :visible="failReasonVisibleRef">
              <template #content>
                <span>{{ item.reason }}</span>
              </template>
              <el-icon class="cursor-pointer" @mouseenter="failReasonVisibleRef = true"
                @mouseleave="failReasonVisibleRef = false">
                <component :is="InfoFilled"></component>
              </el-icon>
            </el-tooltip>
          </div>
          <!-- {{progressResultRef.fail_accounts?.map(v => v.name).join(";")}} -->
        </div>
      </div>
    </div>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="发表" v-model="dialogPublishArticleVisibleRef" width="800px">
    <div class="w-full flex flex-col">
      <div v-if="publishStepsRef.length > 2" class="w-full flex justify-center items-center">
        <el-steps class="w-full" :active="publishStepRef" finish-status="success">
          <el-step v-for="item in publishStepsRef" :key="item" :title="item" />
        </el-steps>
      </div>
      <div v-if="publishStepRef == 0" class="w-full flex flex-col space-y-2" v-loading="publishLoadingRef">
        <div class="w-full flex flex-col p-4 bg-[#F7F7F7] rounded">
          <div class="w-full flex">
            <div class="basis-1/2 flex justify-start items-center text-lg">群发通知</div>
            <div class="basis-1/2 flex justify-end items-center">
              <el-switch v-model="bulkSendingNotificationFlag" class="ml-2"
                :disabled="bulkSendingNotificationRemain == 0 ? true : false" style="--el-switch-on-color: #13ce66;" />
            </div>
          </div>
          <div class="text-[#cccccc]">今天还有{{ bulkSendingNotificationRemain }}次通知次数</div>
          <GroupNotifySelect v-if="bulkSendingNotificationFlag" v-model="groupstr" class="w-full" />
        </div>
        <div class="w-full flex flex-col p-4 bg-[#F7F7F7] rounded">
          <div class="w-full flex">
            <div class="basis-1/2 flex justify-start items-center text-lg">定时发表</div>
            <div class="basis-1/2 flex justify-end items-center">
              <el-switch v-model="publishTimingFlagRef" class="ml-2" style="--el-switch-on-color: #13ce66;" />
            </div>
          </div>
          <div v-if="publishTimingFlagRef" class="w-full flex space-x-2">
            <el-select v-model="selectedPublishTimingDateRef" class="grid-content-control" value-key="id" filterable
              placeholder="选择定时发布日期" @change="emitChangeForPublishTimingDate" style="width:100px">
              <el-option v-for="(item) in publishTimingDatesRef" :key="item.id" :label="item.name" :value="item" />
            </el-select>
            <el-time-picker v-model="publishTimeRef" format="HH:mm" :disabled-hours="disableHours"
              :disabled-minutes="disableMinutes" class="rounded-xl border-none" style="width:100px" />
          </div>
        </div>
      </div>
      <div v-if="publishStepsRef.length > 0 && publishStepRef == 1" class="flex flex-col space-y-2 pt-4">
        <div class="flex font-bold">
          共 {{ publishCopyright1ListRef.length }} 篇内容未通过原创校验逻辑，将按照下列方式进行发表，如有异议可申诉
        </div>
        <table class="w-full border shadow-lg">
          <thead class="text-lg bg-gray-200 text-gray-400">
            <tr>
              <th class="text-left p-4" style="width:80%">未通过原因</th>
              <th class="text-left p-4" style="width:20%">发表方式</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b h-[80px]" v-for="item in publishCopyright1ListRef" :key="item.source_idx">
              <td class="p-4">你的内容《{{ item.article_title }}》与原创内容《{{ item.source_title }}》相似度过高，将已分享方式发表</td>
              <td class="p-4">分享</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="publishStepsRef.length > 0 && publishStepRef == 2">
        <div class="flex font-bold">
          共 {{ publishCopyright1ListRef.length }} 篇内容未通过原创校验逻辑，将按照下列方式进行发表，如有异议可申诉
        </div>
        <table class="w-full border shadow-lg">
          <thead class="text-lg bg-gray-200 text-gray-400">
            <tr>
              <th class="text-left p-4" style="width:34%">待发表内容</th>
              <th class="text-left p-4" style="width:33%">发表方式</th>
              <th class="text-left p-4" style="width:33%">编辑寄语</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b h-[80px]" v-for="(item, idx) in publishCopyright1ListRef" :key="idx">
              <td class="p-4">你的内容《{{ item.article_title }}》与原创内容《{{ item.source_title }}》相似度过高，将已分享方式发表</td>
              <td class="p-4">分享</td>
              <td class="p-4">
                <div class="flex flex-col">
                  <textarea class="border bg-gray-300" rows="3" v-model="publishGuideWordsRef[idx]" maxlength="140" />
                  <span>{{ publishGuideWordsRef[idx]?.length ?? 0 }}/140</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogPublishArticleVisibleRef = false">取消</el-button>
        <el-button v-if="!instantPublishRef" @click="handlePublishNext">继续发表</el-button>
        <el-button v-if="instantPublishRef" @click="handlePublishToWechat" type="primary"
          :disabled="globalLoadingRef || publishLoadingRef">发表</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" @closed="handleMobileValidateDialogClosed" title="手机扫码验证"
    v-model="dialogMobileValidateVisibleRef" width="330px">
    <el-row :gutter="40" class="h-[330px]">
      <el-col :span="24">
        <img v-if="qrcodeMobileValidateRef" class="w-full h-full" :src="qrcodeMobileValidateRef" />
      </el-col>
      <el-col :span="24">
        <div class="w-full flex justify-center items-center space-x-4">
          <div class="flex justify-center items-center">
            {{ qrcodeStatusRef }}
          </div>
          <el-button v-if="showRefreshButtonRef" @click="handlePublish">
            <el-icon>
              <RefreshRight />
            </el-icon>
          </el-button>
        </div>
      </el-col>
    </el-row>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="调试信息" v-model="dialogDebugVisibleRef" width="600px">
    <div class="w-full h-[300px] bg-gray-900 text-green-500 flex flex-col space-y-4">
      <el-row :gutter="40" class="p-1 flex-none">
        <el-col :span="4">
          <label>账号:</label>
        </el-col>
        <el-col :span="20">
          {{ selectedAccount?.name }}
        </el-col>
      </el-row>
      <el-row :gutter="40" class="p-1 flex-1 h-[200px]">
        <el-col :span="4">
          <label>cookies:</label>
        </el-col>
        <el-col :span="19" class="h-full overflow-y-auto">
          {{ showSerializeCookie(selectedAccount?.session_id) }}
        </el-col>
      </el-row>
      <el-row :gutter="40" class="p-1 flex-none">
        <el-col :span="4">
          <label>token:</label>
        </el-col>
        <el-col :span="20">
          {{ selectedAccount?.token }}
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogDebugVisibleRef = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<style>
.edui-editor {
  @apply flex flex-col h-full;

  .edui-editor-iframeholder {
    @apply flex-1;
  }
}

.editor-inner-tabs {
  height: calc(100vh - 60px - 3rem - var(--el-tabs-header-height));

  .el-tabs__content {
    @apply p-1 flex-1 overflow-y-auto;
  }

  .el-tabs__item {
    /* font-size: 12px; */
    padding: 0 10px !important;
    --el-tabs-header-height: 32px;
  }
}

.grid-content {
  border-radius: 4px;
  /* min-height: 36px;   */
}

.grid-content-control {
  max-width: 180px;
}

#edui1 {
  height: 100%;
}

.ueditor_wrapper {
  height: calc(100vh - 96px);
}

.el-dialog__body {
  @apply flex justify-center;
}
</style>
<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}

.demo-progress .el-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}

.query-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
  background: transparent;
  cursor: default;
}

.query-input :deep(.el-input__wrapper .el-input__inner) {
  cursor: default !important;
}

.el-textarea {
  height: 100%;
}

:deep(.el-textarea__inner) {
  height: 100%;
}
</style>
<script setup>
import { ref, toRefs, shallowRef, onMounted, onBeforeUnmount, nextTick, onActivated, onDeactivated, onUnmounted, watch, computed, provide, toRaw, unref } from 'vue';
// import { listAccount } from '@/api/account'
import store from '@/store'
import { getToken } from "@/utils/auth";
import {
  saveArticleDraft,
  newlistArticlesByAppMsg, listArticleGroups, swapArticles,
  deleteArticleDraft, removeMpMsg, genArticleDraftPreviewUrl, previewQRCode,
} from "@/api/mp_msg"
import { saveAppMsg, send_to_other_accounts_events } from "@/api/appmsg"
import {
  getMpUserInfo, getLastPreviewAccounts, sendPreview,
  listVideos, getMasssendInfo, stat_appmsg_copyright_stat_events,
  query_appmsg_publish_qrcode_validate_events, getQrcodeMobileValidate
} from "@/api/mp_wechat"
import { format_to_UEditor_html, clearContentUrl, clearWeApp, restore_from_UEditor_html } from "@/utils/dom";
import { uploadImage } from "@/api/img"
import {gen_unique_id} from "@/utils/msic"
import { toDeepRaw, toPicPageInfo, gen_picture_page_info_list } from "@/utils/convert"
import { fmtImageUrl } from "@/utils/format"
import { createDateByDays, parseDate, formatDate } from "@/utils/date"
import { ad_categorys, adMarkerContentInUEditor, format_ad_content_in_UEditor, restore_ad_content_from_UEditor, has_ad_in_wangEditor, removeAd, has_ad_in_raw } from "@/utils/ad"
import { getVideoFrameHtml, extractVideoFrame } from "@/utils/video"
import { apperrmsg, claim_source_types, HOUSRS, MINUTES, wxretmsg } from "@/utils/constants"
import { 
  tplWithAppLinkAndText, tplWithAppLinkAndImage, tplMiniAppCardInEditor,
  hasMiniAppCardInEditor, replaceMiniAppCardToWechat, replaceMiniAppCardFromWechat
 } from "@/utils/miniapp"
import {hasMPCardInEditor, replaceMPCardToWechat, tplMPCardInEditor, replaceMPCardFromWechat} from "@/utils/mpcard"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { ArrowUp, ArrowDown, Delete, CircleCheckFilled, CircleCloseFilled, InfoFilled, Search, Plus } from '@element-plus/icons-vue'
import { Link, Link2, RadioTower, DollarSign, SquareTerminal, Eye, ScanEye, Minus, Smartphone, Video } from 'lucide-vue-next';
import WechatMiniAppIcon from "@/components/icons/WechatMiniAppIcon"
import WechatMPIcon from "@/components/icons/WechatMPIcon"
import { RefreshRight } from '@element-plus/icons-vue'
import { serializeCookie } from "@/utils/cookie"
import axios from 'axios'
import JSON5 from "json5"
import ImgCrop from '@/components/ImgCrop.vue';
import BatchExtractMpArticle from '@/components/editor/BatchExtractMpArticle.vue';
import SyncToOtherAccountsDialog from "@/dlgs/syncToOtherAccounts"
import SimplePager from "@/components/SimplePager"
import ImgPicker from '@/components/editor/ImgPicker.vue';
import ImgListPicker from '@/components/editor/ImgListPicker.vue';
import GroupNotifySelect from '@/components/editor/GroupNotifySelect.vue'
import UserTempl from './editor/UserTempl.vue';
import debounce from 'lodash-es/debounce'
import { dog } from '@/utils';
import SysTempl from './editor/SysTempl.vue';
import SetMiniApp from "@/components/editor/SetMiniApp.vue"
import SetMPCard from "@/components/editor/SetMPCard.vue"

const props = defineProps(['account', 'appmsg', 'mode', 'mainMsg']);
const emitEvents = defineEmits(['titleChange', 'createAppmsg', 'msgidChange'])
const is_xiaolvshu = computed(() => (props.appmsg?.multi_item[0] || currentArticleRef.value)?.item_show_type === 8);

const { all_accounts } = toRefs(store.getters)
// console.log('envVars.backend_url=>', envVars.backend_url)
// editor 
const isDebugRef = ref(envVars.is_debug)
const ueditor_wrapper = ref(null)
const editorRef = shallowRef()
const editorIdRef = ref(null)
const editorConfigRef = ref({
  // 后端服务地址，后端处理参考
  // https://open-doc.modstart.com/ueditor-plus/backend.html
  serverUrl: envVars.backend_url + '/upload-ueditor-image',
  UEDITOR_HOME_URL: '/UEditorPlus/',
  UEDITOR_CORS_URL: '/UEditorPlus/',
  autoHeightEnabled: false,
  initialFrameWidth: '100%',
  // initialFrameHeight: '100%',
  // loadConfigFromServer: false,
  imageConfig: {
    disableOnline: true,
  },
  videoConfig: {
    disableUpload: true,
  },
  uploadServiceEnable: true,
  uploadServiceUpload: function (type, file, callback, option) {
    console.log('uploadServiceUpload', type, file, callback, option);
    const editor = editorRef.value
    var call = function () {
      const formData = new FormData();
      let blob = file instanceof Blob ? file : file.blob.source
      formData.append(editor.getOpt("imageFieldName"), blob, blob.name);
      const { token, name, session_id } = selectedAccount.value
      if (!session_id) {
        ElMessage({
          message: `当前账号(${name})未登录,请重新登录`,
          type: 'error',
          duration: 2 * 1000
        })
        return
      }
      const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
      formData.append("cookies", cookies)
      formData.append("token", token)
      axios.post(envVars.backend_url + '/upload-editor-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      ).then(function (data) {
        console.log(data.data.data);
        callback.success({
          "state": "SUCCESS",
          "url": data.data.data.url,
        })
      }).catch(function (e) {
        console.log('FAILURE!!', e);
        const err = e.response.data.detail
        if (err.includes("redis ticket invalid")) {
          // ElMessage({
          //   message: `当前账号(${name})session过期,请切换到账号中心重新登录`,
          //   type: 'error',
          //   duration: 2 * 1000
          // })
          ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
            confirmButtonText: '确定',
            type: 'error'
          }).then(() => {
            console.log("then")
          }).catch(() => {
            console.log("catch")
          })
          // callback.error(`当前账号(${name})session过期,请重新登录`)
        } else {
          callback.error(err)
        }
      });

      return;
    }
    call();
  }
})

// component
const ArrowUpRef = shallowRef(ArrowUp);
const ArrowDownRef = shallowRef(ArrowDown);
const DeleteRef = shallowRef(Delete);

/// data
// mp_msgs
const msg_idRef = ref(0)
const mp_msgsRef = ref([])
const mpExsRef = ref({
  mps_obj: {},
  miniappcard_obj: {},
})
const mp_msg_groupsRef = ref([])
const currentAppmsgRef = ref(null)
const elListMsgsRef = ref(null)
// 封面
const cdnRef = ref(null)
const selectedCdnImageRef = ref(null)
const cdnFileInputRef = ref(null)

//声明原创
const copyrightRef = ref(false)

// 留言
const needOpenCommentRef = ref(false)
const commentTypeRef = ref("0") // 0-全部 1-只有粉丝 

// 创作来源
const claim_source_typesRef = ref(claim_source_types)
const selected_claim_source_typeRef = ref(claim_source_types[0])

// 广告
const ad_idRef = ref(0)
const dialogAdVisibleRef = ref(false)
const adCategoryRef = ref(ad_categorys)
const adCategoryChoosedRef = ref([])
const insertAdTypeRef = ref("1") // 0-不插入 1-手动 2-智能 


// 进度
const dialogPercentVisbleRef = ref(false)
const percentRef = ref(0)
const progressDescRef = ref("")
const progressResultRef = ref(null)
const failReasonVisibleRef = ref(false)

// 调试信息
const dialogDebugVisibleRef = ref(false)

// 账号
let selectedAccount = ref(null)
let accountsRef = ref([])
const dialogSendArticleVisibleRef = ref(false)
let otherAccountsRef = ref([])
let otherAccountsChoosedRef = ref([])
const timeoutSendToOneAccount = 3 * 60 * 1000; // ms


// 标题检测
const checkTitleResults = ref([])
const timeoutCheckTitle = 60 * 1000; // ms

// 导入配置
const import_settings = ref({
  only_video_flag: false,
  clear_content_url: true,
  clear_abstract: true,
  clear_author: true,
  clear_source_url: true,
  clear_weapp: true,
  clear_ad: true,
})

// 提取链接
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/G2TYEsgZsTJ1VWj4R2F2hQ?from=kdocs_link")
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/riiYjv8HUqyUZz_-IQKe9g")
const extractArticleUrlRef = ref("")
const dialogExtractMpAritcleUrlRef = ref(false)
const timeoutExtract = 60 * 1000; // ms

const setMiniAppRef = ref(null)

// 账号名片
const setMPCardRef = ref(null)

// 视频素材
const dialogVideoMaterialRef = ref(false)
const videosRef = ref([])
const selected_videoRef = ref(null)
const videoLoadingRef = ref(false)
const video_count_per_page = 4
const video_current_pageRef = ref(1)
const video_total_cntRef = ref(0)
const video_queryRef = ref("")

// global loading
const globalLoadingRef = ref(false)

// 发布
const timeoutPublish = 60 * 1000; // ms
const dialogPublishArticleVisibleRef = ref(false)
const publishStepRef = ref(0)
const publishStepsRef = ref([])
const publishTimeRef = ref(null)
const bulkSendingNotificationFlag = ref(false)
const bulkSendingNotificationRemain = ref(0)
const publishTimingDatesRef = ref([])
const selectedPublishTimingDateRef = ref(null)
const publishTimingFlagRef = ref(false)
const publishLoadingRef = ref(false)
const publishQuotaItemListRef = ref([])
const publishCopyright1ListJsonStrRef = ref("")
const publishCopyright1ListRef = ref([])
const publishGuideWordsRef = ref([])
const instantPublishRef = ref(false)

const needScanQrcodeRef = ref(0)
const dialogMobileValidateVisibleRef = ref(false)
const operationSeqRef = ref("")
const qrcodeMobileValidateRef = ref(null)
const qrcodeStatusRef = ref("")
const showRefreshButtonRef = ref(false)

// 订阅
const channelCleans = {}
const channelName = 'fromMain'

// 文章正文
const currentArticleRef = ref({
  item_show_type: 0, // 0:图文 5:纯视频 7:纯音乐 8:纯图片 10:纯文字 11:转载文章
  title: "",
  author: "",
  copyright_type: 0,
  cdn_url: "",
  desc: "",
  need_open_comment: 1,
  only_fans_can_comment: 0,
  only_fans_days_can_comment: 0,
  sourceurl: "",
  insert_ad_mode: 2,
  can_insert_ad: 1,
  claim_source_type: 0,
  guide_words: "", // item_show_type=5
  vid: "",
  // content_noencode: "<section>hello</section>",
  content_noencode: "",
  picture_page_info_list: [],
})


/// ueditor methods

function ready(editorInstance) {
  console.log(`编辑器实例${editorInstance.key}: `, editorInstance);
  editorRef.value = editorInstance;

  const wrapprHeight = ueditor_wrapper.value.clientHeight
  console.log("wrapprHeight=>", wrapprHeight)
  // document.querySelector('#edui1_iframeholder').style.height = 'calc(100% - 100px)';
  const toolbarHeight = document.querySelector(".edui-editor-toolbarbox .edui-default").clientHeight
  // const conatinerHeight = document.querySelector("#edui1").clientHeight
  // console.log("toolbarHeight:", toolbarHeight)
  // console.log("conatinerHeight:", conatinerHeight)
  // editorInstance.setHeight(wrapprHeight - toolbarHeight - 40 + 1)
  // listHeightRef.value = `${wrapprHeight-120}px`
  // elListMsgsRef.value.style.height = `${wrapprHeight - 120}px`

}



// 帮助方法
const _getAppMsgId = () => {
  return currentAppmsgRef.value?.appmsgid
}

// const serializeCookie = (arr) => {
//   const items = []
//   arr.forEach((v) => {
//     items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
//   });
//   // console.log("items=>", items)
//   return items.join(";")
// }

const showSerializeCookie = (session_id) => {
  if (!session_id) {
    return ""
  }
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  return cookies
}

// const setImageUploadConfig = () => {
//   console.log("==setImageUploadConfig==")
//   if (!selectedAccount.value) {
//     return
//   }
//   const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
//   if (editor == null) return;

//   console.log("selectedAccount  in setImageUploadConfig=>", selectedAccount.value)
//   const { token, name, session_id } = selectedAccount.value
//   const cookies = serializeCookie(JSON.parse(session_id)["cookie"])

//   editorConfigRef.value.serverHeaders = {
//     cookies,
//     token: parseInt(token),
//   }
//   // console.log("config.MENU_CONF.uploadImage=>", config.MENU_CONF.uploadImage)
// }

const validateAccount = () => {
  if (!selectedAccount.value) {
    ElMessageBox.alert('发布的公众账号不存在,请先到*账号中心*添加', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return false;
  }
  return true
}

const createBase64Image = async (fileObject) => {
  const reader = new FileReader();
  const filename = fileObject.name;

  reader.onload = async (e) => {
    const cover = e.target.result;
    console.log("e", e)
    console.log("e.target", e.target)
    // console.log("cover:", cover);
    const matches = cover.match(/data:(image\/.*);base64,(.*)/);
    if (matches && matches.length >= 3) {
      const cdn_content_type = matches[1];  // 图像MIME类型 (image/webp)
      const cdn_base64_image = matches[2]; // Base64编码数据

      // console.log("cdn_content_type:", cdn_content_type);
      // console.log("cdn_base64_image:", cdn_base64_image);
      cdnRef.value = { cdn_content_type, cdn_base64_image, cdn_filename: filename }
      // 切换时上传图片获取cdn_url
      await uploadCover()
    } else {
      ElMessage({
        message: '无效的图片',
        type: 'error',
        duration: 2 * 1000
      })
    }
    // console.log('image_base64:',cover.value)
    // this.uploadImage();
    selectedCdnImageRef.value = reader.result
  };
  reader.readAsDataURL(fileObject);
}

function handleImageUpload(info) {
  cdnRef.value = { cdn_content_type: info.type, cdn_base64_image: info.data, cdn_filename: info.name }
  uploadCover()
}
var imgListPicking = false
function onImgPick(urls) {
  if (imgListPicking) {
    imgListPicking = false
    if (!currentArticleRef.value.picture_page_info_list) {
      currentArticleRef.value.picture_page_info_list = []
    }
    currentArticleRef.value.picture_page_info_list.push(...urls.map(v => ({ url: v, bg: '#fff' })))
    currentArticleRef.value.picture_page_info_list = currentArticleRef.value.picture_page_info_list.slice(0, 20)
    return
  }
  currentArticleRef.value.cdn_url = urls[0]
  syncToList("cdn_url")
}
var refImgPicker = ref(null)
const uploadCover = async () => {
  const { session_id, token } = selectedAccount.value
  console.log("uploadCover=>", cdnRef.value)
  if (cdnRef.value) {
    const imgData = {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      base64_image: cdnRef.value.cdn_base64_image,
      filename: cdnRef.value.cdn_filename,
      content_type: cdnRef.value.cdn_content_type
    }
    const { data } = await uploadImage(imgData)
    const { cdn_url } = data
    if (imgListPicking) {
      imgListPicking = false
      currentArticleRef.value.picture_page_info_list.push({ url: cdn_url, bg: '#fff' })
    } else {
      currentArticleRef.value.cdn_url = cdn_url
      syncToList("cdn_url")
    }
    refImgPicker.value.uploadSucc(cdn_url)
  }
}

// data methods

const listArticles = async () => {
  const appmsgid = _getAppMsgId()
  // appmsgidRef.value
  console.log("appmsgid=>", appmsgid)

  if (appmsgid > 0 || props.mode === 'edit') {
    const { wechat_id } = selectedAccount.value
    mp_msgsRef.value = await newlistArticlesByAppMsg(wechat_id, appmsgid).catch((err) => { }).then(response => {
      response.data.forEach(gen_picture_page_info_list)
      return response.data;
    })
    console.log("mp_msgsRef.value=>", mp_msgsRef.value)
  } else {
    console.log("is in create mode")
    mp_msgsRef.value = []
  }
}

const loadArticle = (mp_msg, before_save) => {
  if (before_save) {
    if (msg_idRef.value === mp_msg.msg_id) {
      return
    }
    const preIdx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_idRef.value)
    if (preIdx !== -1) {
      console.log("preIdx=>", preIdx, mp_msgsRef.value[preIdx])
      mp_msgsRef.value[preIdx] = { ...mp_msgsRef.value[preIdx], ...currentArticleRef.value }
    }
  }

  msg_idRef.value = mp_msg.msg_id
  const { formated, category_id_list, ad_id } = format_ad_content_in_UEditor(mp_msg.content_noencode)
  // console.log("category_id_list=>", category_id_list)
  // console.log("ad_id=>", ad_id)
  let vhtml = formated
  ad_idRef.value = ad_id
  // mp_msg.content_noencode = format_to_wangEditor_html(formated)
  // 公众号卡片
  const mps_obj = toDeepRaw(mpExsRef.value.mps_obj)
  vhtml = replaceMPCardFromWechat(vhtml, mps_obj)
  // 小程序卡片
  const miniappcard_obj = toDeepRaw(mpExsRef.value.miniappcard_obj)
  vhtml = replaceMiniAppCardFromWechat(vhtml, miniappcard_obj)
  mp_msg.content_noencode = vhtml
  // console.log("mp_msg1=>", mp_msg.picture_page_info_list) 
  // gen_picture_page_info_list(mp_msg)
  // console.log("mp_msg2=>", mp_msg.picture_page_info_list)
  // appmsgidRef.value = mp_msg.appmsgid
  currentArticleRef.value = {
    ...mp_msg,
  }
  mpExsRef.value = {
    mps_obj: mps_obj,
    miniappcard_obj: miniappcard_obj,
  }
  console.log("mpExsRef=>", mpExsRef.value)

  selectedCdnImageRef.value = null
  cdnFileInputRef.value.value = ""
  console.log("loadArticle:", currentArticleRef.value)
  copyrightRef.value = currentArticleRef.value.copyright_type == 1
  needOpenCommentRef.value = currentArticleRef.value.need_open_comment == 1
  // 0-all 1-only fans
  if (currentArticleRef.value.only_fans_can_comment == 0 && currentArticleRef.value.only_fans_can_comment == 0) {
    commentTypeRef.value = "0"
  } else {
    commentTypeRef.value = "1"
  }

  // 广告
  adCategoryChoosedRef.value = category_id_list.split("|").map(v => parseInt(v))
  if (currentArticleRef.value.can_insert_ad == 0) {
    insertAdTypeRef.value = "0"
  } else {
    insertAdTypeRef.value = "" + currentArticleRef.value.insert_ad_mode
  }

  // 创作来源
  const find_claim_source_type = claim_source_types.find(v => v.id === currentArticleRef.value.claim_source_type)
  if (find_claim_source_type) {
    selected_claim_source_typeRef.value = find_claim_source_type
  }

  // const toolbar = DomEditor.getToolbar(editorRef.value);
  // console.log("toolbar keys:", toolbar.getConfig().toolbarKeys)
  // console.log("menu keys:", editorRef.value.getAllMenuKeys())

  // console.log("format_ad_content=>", format_ad_content(`abcde<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2" data-id="1746772291564" src="/cgi-bin/readtemplate?t=tmpl/cpc_tmpl#1746772291564">&nbsp;</mpcpc></section>12345`))

  // console.log("currentArticleRef.value=>", currentArticleRef.value)
}
const loadArticleByMsgId = (msg_id) => {
  const mp_msg = mp_msgsRef.value.find(v => v.msg_id === msg_id)
  if (mp_msg) {
    console.log("find mp_msg=>", mp_msg)
    loadArticle(mp_msg)
  }
}

const swapUp = async (msg_id) => {
  if (checkHasNotSave(true)) {
    return
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  const prev = mp_msgsRef.value[idx - 1].msg_id
  console.log("prev index:", prev)
  if (props.mode === 'create' || props.mode == 'hydrate') {
    var tmp = mp_msgsRef.value[idx];
    mp_msgsRef.value[idx] = mp_msgsRef.value[idx - 1]
    mp_msgsRef.value[idx - 1] = tmp

    return;
  }
  await swapArticles(prev, msg_id).catch((err) => { })
  await listArticles()
}
const swapDown = async (msg_id) => {
  if (checkHasNotSave(true)) {
    return
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  const next = mp_msgsRef.value[idx + 1]?.msg_id
  console.log("next index:", next)
  if (!next) return
  if (props.mode === 'create' || props.mode == 'hydrate') {
    var tmp = mp_msgsRef.value[idx];
    mp_msgsRef.value[idx] = mp_msgsRef.value[idx + 1]
    mp_msgsRef.value[idx + 1] = tmp

    return;
  }
  await swapArticles(msg_id, next)
  await listArticles()
}

const checkHasNotSave = (showMessage) => {
  const not_save = mp_msgsRef.value.find(v => v.msg_id < 0) && props.mode === 'edit'
  if (not_save && showMessage) {
    ElMessageBox.alert(`将当前未保存的文章暂存后再操作`, '信息', {
      confirmButtonText: '确定',
      type: 'info'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
  }
  return !!not_save
}

const checkHasNotSaveToDB = (msg_id) => {
  return msg_id < 0
}

const newArticle = async (before_save = true, item_show_type = 0, hydrateMsgIdx = -1) => {
  // if (checkHasNotSave(true)) {
  //   return
  // }

  if (before_save) {
    const preIdx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_idRef.value)
    if (preIdx !== -1) {
      console.log("preIdx=>", preIdx, mp_msgsRef.value[preIdx])
      mp_msgsRef.value[preIdx] = { ...mp_msgsRef.value[preIdx], ...currentArticleRef.value }
    }
  }

  if (mp_msgsRef.value.length >= 8) {
    if (props.mode === 'hydrate') return;
    ElMessageBox.alert('超出单消息最大文章数8篇', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return;
  }

  const new_mp_msg = {
    item_show_type,
    title: "新标题1",
    author: "",
    copyright_type: 0,
    cdn_url: "",
    desc: "",
    need_open_comment: 1,
    only_fans_can_comment: 0,
    only_fans_days_can_comment: 0,
    sourceurl: "",
    insert_ad_mode: 2,
    can_insert_ad: 1,
    content_noencode: "",
  }
  const new_exs = {}
  const new_msg_id = 0 - (+new Date()) - hydrateMsgIdx;
  if (props.mode === 'hydrate' && hydrateMsgIdx > -1) {
    // hydrate模式下，插入到指定位置
    mp_msgsRef.value[hydrateMsgIdx] = {
      ...new_mp_msg,
      ...mp_msgsRef.value[hydrateMsgIdx],
      msg_id: new_msg_id
    };
  } else {
    mp_msgsRef.value.push({
      ...new_mp_msg,
      msg_id: new_msg_id
    })
  }

  loadArticleByMsgId(new_msg_id)

  // console.log('elListMsgsRef.value.scrollHeight=>', elListMsgsRef.value.scrollHeight)
  // elListMsgsRef.value.scrollTop = elListMsgsRef.value.scrollHeight
  await nextTick()
  var { clientHeight } = elListMsgsRef.value.children[elListMsgsRef.value.children.length - 2]
  var top = clientHeight + elListMsgsRef.value.scrollTop
  elListMsgsRef.value.scrollTo({ top, behavior: 'smooth' })
  // elListMsgsRef.value.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
  // nextTick(() => {
  //   elListMsgsRef.value.scrollTop = elListMsgsRef.value.scrollHeight
  //   // elListMsgsRef.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
  // })



  // msg_idRef.value = 0
  // currentArticleRef.value = new_mp_msg
  // selectedCdnImageRef.value = null
  // cdnFileInputRef.value.value = ""

  // copyrightRef.value = false
  // needOpenCommentRef.value = false
  // commentTypeRef.value = "0"

  // // 广告
  // adCategoryChoosedRef.value = []
  // insertAdTypeRef.value = "1"
  // ad_idRef.value = 0




}

const handleActionErr = (account_name, e) => {
  console.error('handleActionErr:', e);
  const err = e.response.data.detail
  if (err?.base_resp?.err_msg?.includes("session")) {
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    // callback.error(`当前账号(${name})session过期,请重新登录`)
  } else {
    ElMessage({
      message: `服务器错误:${err}`,
      type: 'error',
      duration: 2 * 1000
    })
  }
}

const saveCurrentToList = (msg_id) => {
  // 声明原创
  currentArticleRef.value.copyright_type = copyrightRef.value ? 1 : 0

  // 留言
  if (needOpenCommentRef.value) {
    currentArticleRef.value.need_open_comment = 1
    if (commentTypeRef.value === "0") {
      currentArticleRef.value.only_fans_can_comment = 0
      currentArticleRef.value.only_fans_days_can_comment = 0
    } else if (commentTypeRef.value === "1") {
      currentArticleRef.value.only_fans_can_comment = 1
      currentArticleRef.value.only_fans_days_can_comment = 0
    }
  } else {
    currentArticleRef.value.need_open_comment = 0
    currentArticleRef.value.only_fans_can_comment = 0
    currentArticleRef.value.only_fans_days_can_comment = 0
  }

  // 创作来源
  currentArticleRef.value.claim_source_type = selected_claim_source_typeRef.value.id


  // console.log("adCategoryChoosedRef=>", adCategoryChoosedRef.value)


  const to_save_content_noencode = currentArticleRef.value.content_noencode;
  // console.log("to_save_content_noencode:", to_save_content_noencode)

  const category_id_list = adCategoryChoosedRef.value.join("|")
  // console.log("category_id_list:", category_id_list)
  let vhtml = restore_ad_content_from_UEditor(to_save_content_noencode, category_id_list, ad_idRef.value)
  // console.log("ad vhtml=>", vhtml)

  // replace custom-tag
  vhtml = replaceMPCardToWechat(vhtml, mpExsRef.value.mps_obj)
  vhtml = replaceMiniAppCardToWechat(vhtml, mpExsRef.value.miniappcard_obj)

  currentArticleRef.value.content_noencode = vhtml

  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  if (idx !== -1) {
    mp_msgsRef.value[idx] = currentArticleRef.value
  }

  return idx
}

const saveOthersToListForCustomTag = (msg_id) => {
  const targetItems = mp_msgsRef.value.filter(v => v.msg_id !== msg_id)
  const mps_obj = toDeepRaw(mpExsRef.value.mps_obj)
  const miniappcard_obj = toDeepRaw(mpExsRef.value.miniappcard_obj)
  console.log('targetItems:', targetItems.length)
  console.log('targetItems mps_obj:', mps_obj)
  console.log('targetItems miniappcard_obj:', miniappcard_obj)
  targetItems.forEach(v => {
    if (hasMPCardInEditor(v.content_noencode)) {
      v.content_noencode = replaceMPCardToWechat(v.content_noencode, mps_obj)
    }
    if (hasMiniAppCardInEditor(v.content_noencode)) {
      v.content_noencode = replaceMiniAppCardToWechat(v.content_noencode, miniappcard_obj)
    }
  })
}

const _saveAppMsg = async (push_to_remote) => {
  if (!validateAccount()) {
    return
  }

  const { token, name, session_id, wechat_id } = selectedAccount.value
  if (!session_id) {
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    return
  }

  const msg_id = msg_idRef.value
  // console.log("mp_msgsRef before saveCurrentToList=>", mp_msgsRef.value[0].content_noencode)
  let selected_idx = saveCurrentToList(msg_id)
  // console.log("mp_msgsRef after saveCurrentToList=>", mp_msgsRef.value[0].content_noencode)
  saveOthersToListForCustomTag(msg_id)
  // console.log("mp_msgsRef after saveOthersToListForCustomTag=>", mp_msgsRef.value[0].content_noencode)
  // console.log("save all mp_msgsRef.value=>", mp_msgsRef.value)
  // const appmsgid =  appmsgidRef.value 
  let appmsgid = _getAppMsgId()

  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    material_list: toRaw(mp_msgsRef.value),
    wechat_id,
    push_to_remote,
  }

  // console.log("save appmsg postData=>", postData)
  // return
  const loader = ElLoading.service({
    target: '.main'
  })
  await saveAppMsg(postData).then(async (res) => {
    ElMessage({
      message: `消息${push_to_remote === 0 ? "暂存" : "同步"}成功`,
      type: 'success',
      duration: 2 * 1000
    })
    console.log("saveArticleDraft res=>", res)
    res.data.data.mp_msgs.forEach(gen_picture_page_info_list)
    mp_msgsRef.value = res.data.data.mp_msgs
    // ### todo: mp_msg_exs 

    const isCreateNewAppMsg = appmsgid <= 0 && res.data.data.appmsgid > 0
    appmsgid = res.data.data.appmsgid
    if (isCreateNewAppMsg) {
      // 新列表 需要更新currentAppmsgRef
      currentAppmsgRef.value.appmsgid = appmsgid
      currentAppmsgRef.value.title = mp_msgsRef.value[0].title
      emitEvents('msgidChange', appmsgid)
    }

    // await listArticles()
    // const msg_ids = res.data.data.msg_ids
    if (selected_idx === -1) {
      selected_idx = 0
    }
    if (isCreateNewAppMsg) {
      mp_msgsRef.value[selected_idx].appmsgid = appmsgid
    }
    loadArticle(mp_msgsRef.value[selected_idx])
  }).catch((e) => {
    console.log('saveAppMsg catched e:', e)
    handleActionErr(name, e)
    console.log("=========")
  }).finally(() => {
    loader.close()
  })
}

const handleSaveAppMsg = async () => {
  await _saveAppMsg(0)
}


const handleSyncToWechatDraftBox = async () => {
  const publish_flag = currentAppmsgRef.value.publish_flag;
  console.log("publish_flag=>", publish_flag)
  if (publish_flag === 1) {
    ElMessageBox.confirm(
      '当前消息列表已发布，除非在公众号后台撤销，否则操作会引发错误, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      await _saveAppMsg(1)
    }).catch(() => {
      console.log('取消openPublishToWechatDialog')
    })
  } else {
    await _saveAppMsg(1)
  }
}

const checkQuota = (date) => {
  const quota_item = publishQuotaItemListRef.value.find(v => v.str_date === formatDate(date, 'yyyyMMdd'))
  console.log("quota_item:", quota_item)
  if (!quota_item) {
    return
  }
  bulkSendingNotificationFlag.value = quota_item.quota > 0
  bulkSendingNotificationRemain.value = quota_item.quota
}

const confirmOpenPublishToWechatDialog = async () => {
  const publish_flag = currentAppmsgRef.value.publish_flag;
  console.log("publish_flag=>", publish_flag)
  if (publish_flag === 1) {
    ElMessageBox.confirm(
      '当前消息列表已发布，除非在公众号后台撤销，否则操作会引发错误, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      await openPublishToWechatDialog()
    }).catch(() => {
      console.log('取消openPublishToWechatDialog')
    })
  } else {
    await openPublishToWechatDialog()
  }
}

const openPublishToWechatDialog = async () => {

  // 发布调试完毕需要先将appmsg同步到草稿箱
  await _saveAppMsg(1)
  if (!currentArticleRef.value.cdn_url) return
  dialogPublishArticleVisibleRef.value = true
  const today = new Date()
  publishTimingDatesRef.value = Array.from({ length: 7 }, (_, i) => {
    if (i === 0) {
      return { name: "今天", id: today.toISOString().split('T')[0] }
    } else if (i === 1) {
      return { name: "明天", id: createDateByDays(today, 1).toISOString().split('T')[0] }
    } else {
      let theDate = createDateByDays(today, i)
      return { name: `${theDate.getMonth() + 1}月${theDate.getDate()}日`, id: theDate.toISOString().split('T')[0] }
    }
  });
  selectedPublishTimingDateRef.value = publishTimingDatesRef.value[0]
  publishTimeRef.value = +new Date() + 5 * 60 * 1000;
  const { token, session_id, name } = selectedAccount.value
  publishLoadingRef.value = true
  publishStepsRef.value = []
  publishCopyright1ListRef.value = []
  publishCopyright1ListJsonStrRef.value = ""
  publishGuideWordsRef.value = []
  publishStepRef.value = 0
  instantPublishRef.value = false
  const appmsgid = _getAppMsgId()
  const ret = await getMasssendInfo({
    appmsgid,
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
  }).catch((e) => {
    console.log("getMasssendInfo catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
    publishLoadingRef.value = false
  })
  const item_kQuotaTypeMassSendNormal = ret.data.quota_detail_list.find(v => v.quota_type === 'kQuotaTypeMassSendNormal')
  if (!item_kQuotaTypeMassSendNormal) {
    return
  }
  publishQuotaItemListRef.value = item_kQuotaTypeMassSendNormal.quota_item_list
  needScanQrcodeRef.value = ret.data.need_scan_qrcode
  operationSeqRef.value = ret.data.operation_seq

  // 检测发文限额
  checkQuota(today)

  //检测原创

}

const disableHours = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishTimingDateRef.value.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const hour = date.getHours()
  // const minute = date.getMinutes()

  const idx = HOUSRS.findIndex(v => v === hour)
  console.log("idx=>", idx)
  return HOUSRS.slice(0, idx)
}
const disableMinutes = (role, comparingDate) => {
  const todayStr = new Date().toISOString().split('T')[0]
  if (selectedPublishTimingDateRef.value.id !== todayStr) {
    return []
  }
  const date = new Date(+new Date() + 5 * 60 * 1000)
  const minute = date.getMinutes()
  // const minute = date.getMinutes()

  const idx = MINUTES.findIndex(v => v === minute)
  console.log("idx=>", idx)
  return MINUTES.slice(0, idx)
}

const handlePublishNext = async () => {
  const appmsgid = _getAppMsgId()

  if (publishStepRef.value === 0) {
    const { token, session_id, name } = selectedAccount.value
    publishLoadingRef.value = true
    let stepRet
    await stat_appmsg_copyright_stat_events({
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      appmsgid,
    }, (data) => {
      console.log("step raw=>", data)
      try {
        const v = data.replaceAll(/data: /gi, "")
        stepRet = JSON5.parse(v)
      } catch {
        console.error("检测失败")
        publishStepRef.value = 0
      }
    })
    publishLoadingRef.value = false
    // console.log("step data=>", o)
    if (stepRet.copyright === 1) {
      // <el-step title="设置发表参数" />
      //   <el-step title="确认发表方式" />
      //   <el-step title="填写编辑推荐语" />
      //   <el-step title="最终发表" />
      publishCopyright1ListJsonStrRef.value = stepRet.list_json_str
      const copyright1_list = JSON.parse(stepRet.list_json_str)
      console.log("copyright1_list=>", copyright1_list)
      publishCopyright1ListRef.value = copyright1_list.list
      publishStepsRef.value = ["设置发表参数", "确认发表方式", "填写编辑推荐语"]
      publishStepRef.value = 1
    } else if (stepRet.copyright === 0) {
      // 不是原创 不经历 确认发表方式和填写编辑推荐语
      // instantPublishRef.value = true
      // 不是原创改成直接提交
      instantPublishRef.value = true
      await handlePublishToWechat()
    } else {
      ElMessageBox.alert('检测原创', '错误', {
        confirmButtonText: '确定',
        type: 'error'
      }).catch(() => { })
    }
  } else if (publishStepRef.value === 1) {
    publishStepRef.value = 2
    instantPublishRef.value = true
  }

}
var groupstr = ref("")
const handlePublishToWechat = async () => {
  const appmsgid = _getAppMsgId()
  const appmsg_item_count = mp_msgsRef.value.length
  // console.log("publishTimeRef.value", publishTimeRef.value, typeof publishTimeRef.value)
  const publishTime = new Date(publishTimeRef.value)
  const join_date_str = `${selectedPublishTimingDateRef.value.id} ${publishTime.getHours()}:${publishTime.getMinutes()}`
  console.log('join_date_str=>', join_date_str)
  const send_time = publishTimingFlagRef.value ? (+new Date(join_date_str)) / 1000 : 0
  // const is_release_publish_page = bulkSendingNotificationFlag.value ? 0 : 1
  const isFreePublish = !bulkSendingNotificationFlag.value
  const hasNotify = bulkSendingNotificationFlag.value
  const reprint_info = publishCopyright1ListRef.value.length > 0 ? {
    item_list: publishCopyright1ListRef.value.map((_, i) => ({
      idx: i + 1,
      reprint_type: 'EN_REPRINT_TYPE_SHARE',
      guide_words: publishGuideWordsRef.value[i] ?? "",
    }))
  } : null
  const list = publishCopyright1ListJsonStrRef.value
  const need_scan_qrcode = needScanQrcodeRef.value
  showRefreshButtonRef.value = false
  let canPublish = false, code = null
  const { token, session_id, wechat_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  if (need_scan_qrcode) {
    //请求qrcode
    dialogMobileValidateVisibleRef.value = true
    const meta = await getQrcodeMobileValidate({
      category: "appmsg_publish_with_notify",
      operation_seq: operationSeqRef.value,
      appmsgid,
      token,
      cookies,
      publish_type: bulkSendingNotificationFlag.value ? "1" : undefined
    }).then(({ url, meta }) => {
      console.log("data=>", typeof url)
      console.log("meta=>", meta)
      qrcodeMobileValidateRef.value = url;
      qrcodeStatusRef.value = "未扫码"
      return meta
    })
    code = meta.uuid
    let stepRet, abortFn
    abortFn = await query_appmsg_publish_qrcode_validate_events({
      uuid: meta.uuid,
      appmsgid,
      token: parseInt(token),
      cookies,
    }, (data) => {
      console.log("step raw=>", data)
      try {
        const v = data.replaceAll(/data: /gi, "")
        stepRet = JSON5.parse(v)
        qrcodeStatusRef.value = stepRet.msg
      } catch {
        console.error("查询二维码状态失败")
        abortFn && abortFn()
        return
      }
    })
    if (stepRet.msg.includes("超时")) {
      abortFn()
      showRefreshButtonRef.value = true
      return
    }
    if (stepRet.is_validate === 1) {
      canPublish = true
    }
    // 正常走到这里
    dialogMobileValidateVisibleRef.value = false
    // 发送请求获取状态
  } else {
    canPublish = true
  }
  if (canPublish) {
    publishLoadingRef.value = true
    window.ipcRenderer.send('toMain', {
      tag: 'appmsg:publishToWechat',
      source: `${props.appmsg.appmsgid}`,
      token: getToken(),
      wechat_id,
      publishData: {
        // mp_msgs: toDeepRaw(mp_msgsRef.value),
        cookies,
        token: parseInt(token),
        send_time,
        isFreePublish,
        hasNotify,
        // is_release_publish_page,
        list, groupstr: groupstr.value,
        reprint_info,
        appmsgid,
        appmsg_item_count,
        operation_seq_val: operationSeqRef.value,
        code,
      }
    })
    setTimeout(() => {
      publishLoadingRef.value = false
      dialogExtractMpAritcleUrlRef.value = false
    }, timeoutPublish)
  }
}

const handleMobileValidateDialogClosed = () => {
  if (qrcodeStatusRef.value != "扫码并确认") {
    publishLoadingRef.value = false
  }
}


const removeArticle = async (msg_id) => {
  ElMessageBox.confirm(
    '此操作将删除该文章, 是否继续?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    console.log("removeArticle msg_id:", msg_id)
    if (checkHasNotSaveToDB(msg_id)) {
      console.log("checkHasNotSave=>", true)
      const not_save_idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
      console.log("not_save_idx=>", not_save_idx)
      const mp_msgs = mp_msgsRef.value
      mp_msgs.splice(not_save_idx, 1)
      mp_msgsRef.value = mp_msgs
      // 没选中就是
      msg_idRef.value = 0
      return
    }

    const { token, name, session_id, wechat_id } = selectedAccount.value
    const postData = {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      wechat_id,
      msg_id,
    }
    console.log("remove postData=>", postData)
    const loader = ElLoading.service({
      target: '.main'
    })

    await removeMpMsg(postData).catch((e) => {
      handleActionErr(name, e)
    }).finally(() => {
      loader.close()
    })
    ElMessage({
      message: `文章删除成功`,
      type: 'success',
      duration: 2 * 1000
    })

    await listArticles()
    console.log("mp_msgsRef.value=>", mp_msgsRef.value)
    if (mp_msgsRef.value.length === 0) {
      //该系列下没有文章，删除localStorage中保存的数据
      currentAppmsgRef.value = null
    }

  }).catch(() => {
    console.log('取消removeArticle')
  })
}

const openSendArticleDialog = () => {
  otherAccountsChoosedRef.value = []
  otherAccountsRef.value = accountsRef.value.filter(v => v.id !== selectedAccount.value?.id)
  dialogSendArticleVisibleRef.value = true
}

function handleInstantSend({ otherAccountsChoosed }) {
  otherAccountsChoosedRef.value = otherAccountsChoosed
  handleSendToOtherAccount()
}
const handleSendToOtherAccount = async () => {
  const appmsgid = _getAppMsgId()
  console.log('choosed', otherAccountsChoosedRef);
  if (otherAccountsChoosedRef.value.length === 0) {
    ElMessageBox.alert('请至少选择一个需要发送的账号', '警告', {
      confirmButtonText: '确定',
      type: 'warning'
    }).catch(() => { })
    return
  }
  dialogSendArticleVisibleRef.value = false

  const timeoutSendToOtherAccounts = timeoutSendToOneAccount * otherAccountsChoosedRef.value.length
  globalLoadingRef.value = true
  dialogPercentVisbleRef.value = true
  percentRef.value = 0
  progressDescRef.value = "开始处理"
  progressResultRef.value = null

  let timeoutId = setTimeout(() => {
    globalLoadingRef.value = false
    dialogPercentVisbleRef.value = false
    timeoutId = -1
    ElMessageBox.alert('请求超时，请稍后再试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
  }, timeoutSendToOtherAccounts)

  // await send_to_other_accounts({
  //   soruce_appmsgid: appmsgid,
  //   target_wechat_ids: otherAccountsChoosedRef.value
  // })
  const { wechat_id } = selectedAccount.value
  let stepRet
  await send_to_other_accounts_events({
    source_wechat_id: wechat_id,
    soruce_appmsgid: appmsgid,
    target_wechat_ids: otherAccountsChoosedRef.value
  }, (data) => {
    // console.log("step raw=>", data)
    try {
      const v = data.replaceAll(/data: /gi, "")
      stepRet = JSON5.parse(v)
      // console.log("step data=>", o)
      percentRef.value = stepRet.percent
      progressDescRef.value = stepRet.desc
    } catch {
      percentRef.value = 0;
      progressDescRef.value = ""
    }
  })
  if (stepRet) {
    console.log("stepRet=>", stepRet)
    progressResultRef.value = stepRet.result
  }
  globalLoadingRef.value = false

  if (timeoutId !== -1) {
    clearTimeout(timeoutId)
  }
}

const clickAllOtherAccounts = (checkedAll) => {
  if (checkedAll) {
    otherAccountsChoosedRef.value = otherAccountsRef.value.map(v => v.id)
  } else {
    otherAccountsChoosedRef.value = []
  }
}

// event handler
const emitChangeForPublishTimingDate = async (val) => {

  console.log("emitChangeForPublishTimingDate val=>", val)

  selectedPublishTimingDateRef.value = val
  const todayStr = new Date().toISOString().split('T')[0]
  if (todayStr === val.id) {
    // check 5 minutes
    publishTimeRef.value = +new Date() + 5 * 60 * 1000;
  } else {
    publishTimeRef.value = +new Date(val.id + "T00:00");
  }
  // let currentDate = new Date(val.id)
  checkQuota(new Date(val.id))
  // publishTimingDatesRef.value = Array.from({ length: 7 }, (_, i) => {
  //   if (i === 0) {
  //     return { name: "今天", id: today.toISOString().split('T')[0] }
  //   } else if (i === 1) {
  //     return { name: "明天", id: createDateByDays(today, 1).toISOString().split('T')[0] }
  //   } else {
  //     let theDate = createDateByDays(today, i)
  //     return { name: `${theDate.getMonth() + 1}月${theDate.getDate()}日`, id: theDate.toISOString().split('T')[0] }
  //   }
  // });
}

const triggerFileInput = () => {
  cdnFileInputRef.value.click()
}

const handleImage = async (e) => {
  const selectedImage = e.target.files[0]; // get first file
  if (selectedImage) {
    await createBase64Image(selectedImage);
  } else {
    selectedCdnImageRef.value = null
    cdnFileInputRef.value.value = ""
  }
}

const checkTitles = () => {

  globalLoadingRef.value = true
  const { token, session_id, name } = selectedAccount.value
  const titles = mp_msgsRef.value.map(v => v.title)
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:searchAppmsgsInPublishForQuerys',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    getData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      querys: titles,
      begin: 0,
    }
  })

  setTimeout(() => {
    globalLoadingRef.value = false
  }, timeoutCheckTitle * titles.length)

}

const isShowCheckTitleResults = (title) => {
  const idx = checkTitleResults.value.findIndex(v => v.query === title)
  return idx !== -1
}

const checkTitleIsPublished = (title, prev_days = 30) => {
  const ret = checkTitleResults.value.find(v => v.query === title)
  if (!ret) return
  if (ret.success) {
    // publish_list
    const { total_count, publish_list } = ret.value
    const pre_days_ts = +new Date() - prev_days * 24 * 3600 * 1000
    // console.log("aaa=>", publish_list.map(v => JSON.parse(v.publish_info)).flatMap(v => v.appmsg_info))
    // const a = publish_list.map(v => JSON.parse(v.publish_info)).flatMap(v => v.appmsg_info)
    // if (a.length > 0) {
    //   console.log('a:',a[0])
    //   console.log('a:', a[0],a[0].send_time * 1000, pre_days_ts, a[0].send_time * 1000 > pre_days_ts)
    // }
    //1748508012
    return total_count > 0 && publish_list.map(v => JSON.parse(v.publish_info)).flatMap(v => v.appmsg_info).filter(o => o.send_time * 1000 > pre_days_ts).length > 0
  }
  return false
}

const getTitleMessage = (title, prev_days = 30) => {
  const ret = checkTitleResults.value.find(v => v.query === title)
  console.log("ret=>", title, ret)
  if (!ret) return
  if (ret.success) {
    // publish_list
    const { total_count, publish_list } = ret.value
    const pre_days_ts = +new Date() - prev_days * 24 * 3600 * 1000

    const publish_item = total_count > 0 && publish_list.map(v => JSON.parse(v.publish_info)).flatMap(v => v.appmsg_info).find(o => o.send_time * 1000 > pre_days_ts)
    if (publish_item) {
      console.log("found publish_item:", publish_item)
      const datestr = formatDate(new Date(publish_item.send_time * 1000), "yyyy-MM-dd")
      return `${datestr} 已发送`
    } else {
      console.log("not found publish_item:")
      return `${prev_days}天内没有重复`
    }
  }
  return ret.reason || ""
}

const openExtractMpArticleUrlDialog = () => {
  dialogExtractMpAritcleUrlRef.value = true
}

const handleLocalExtractMpArticleUrl = async () => {
  if (!extractArticleUrlRef.value) {
    ElMessageBox.alert('请输入有效的提取链接', '警告', {
      confirmButtonText: '确定',
      type: 'warning'
    }).catch(() => { })
    return
  }

  globalLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:localExtractMpArticleUrl',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    extractArticleUrl: extractArticleUrlRef.value,
  })

  setTimeout(() => {
    globalLoadingRef.value = false
    dialogExtractMpAritcleUrlRef.value = false
  }, timeoutExtract)
}
async function onBatchExtractMpOld(list) {
  for (var item of list) {
    globalLoadingRef.value = true
    await newArticle(true, item.type)
    window.ipcRenderer.send('toMain', {
      tag: 'appmsg:localExtractMpArticleUrl',
      source: `${props.appmsg.appmsgid}`,
      token: getToken(),
      extractArticleUrl: item.url,
    })
    await new Promise(r => setTimeout(r, timeoutExtract))
  }
  globalLoadingRef.value = false
}

async function onBatchExtractMp(list) {
  globalLoadingRef.value = true
  // await newArticle(true, item.type)
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:batchExtractMpArticleUrls',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    extractArticleUrls: list.map(item => item.url),
  })

  globalLoadingRef.value = false
}

// type: 0-server 1-local init 2-local query
const openVideoMaterialDialog = async (type = 1) => {
  dialogVideoMaterialRef.value = true
  videoLoadingRef.value = true
  selected_videoRef.value = null
  videosRef.value = []
  video_current_pageRef.value = 1
  if (type < 2) {
    video_queryRef.value = "" // 打开对话框
  }

  const { token, session_id, name } = selectedAccount.value

  if (type === 0) {
    const ret = await listVideos({
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      begin: 0,
      count: video_count_per_page,
    }).catch((e) => {
      console.log("listVideos catch:", e)
      // handleActionErr(name, e)
    }).finally(() => {
      videoLoadingRef.value = false
    })
    console.log("videos=>", ret)
    // videosRef.value = [...ret.data, ...ret.data, ...ret.data, ...ret.data, ...ret.data]
    videosRef.value = ret.data
  } else {
    // 本地请求

    // const { token, session_id, name } = selectedAccount.value
    window.ipcRenderer.send('toMain', {
      tag: 'video:listVideos',
      source: `${props.appmsg.appmsgid}`,
      token: getToken(),
      listData: {
        cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
        token: parseInt(token),
        query: video_queryRef.value,
        begin: 0,
        count: video_count_per_page,
      }
    })

    setTimeout(() => {
      videoLoadingRef.value = false
    }, 15000)
  }
}

const paginate_videos = async ({ begin, count, new_page }) => {
  console.log(`begin:${begin}, count:${count}, new_page:${new_page}`)
  videoLoadingRef.value = true
  selected_videoRef.value = null
  video_current_pageRef.value = new_page

  const { token, session_id, name } = selectedAccount.value
  const type = 1
  if (type === 0) {
    const ret = await listVideos({
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      begin: 0,
      count,
    }).catch((e) => {
      console.log("listVideos catch:", e)
      // handleActionErr(name, e)
    }).finally(() => {
      videoLoadingRef.value = false
    })
    console.log("videos=>", ret)
    // videosRef.value = [...ret.data, ...ret.data, ...ret.data, ...ret.data, ...ret.data]
    videosRef.value = ret.data
  } else {
    // 本地请求
    // const { token, session_id, name } = selectedAccount.value
    window.ipcRenderer.send('toMain', {
      tag: 'video:listVideos',
      source: `${props.appmsg.appmsgid}`,
      token: getToken(),
      listData: {
        cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
        token: parseInt(token),
        query: video_queryRef.value,
        begin,
        count,
      }
    })

    setTimeout(() => {
      videoLoadingRef.value = false
    }, 15000)
  }
}


const handleChooseVideo = (val) => {
  selected_videoRef.value = val
  console.log("handleChooseVideo=>", selected_videoRef.value)
}

const handleImportVideo = () => {
  if (!selected_videoRef.value) {
    ElMessageBox.alert('请选择需要导入的视频', '信息', {
      confirmButtonText: '确定',
      type: 'info'
    }).catch(() => { })
    return
  }
  const { vid, title, cdn_url, guide_words } = selected_videoRef.value
  const content_noencode = getVideoFrameHtml(vid, cdn_url) //`<iframe class="edui-video-iframe" data-vidtype="2" data-mpvid="${vid}" data-cover="${cdn_url}" allowfullscreen="" frameborder="0" data-w="1080" data-ratio="0.5625" style="border-radius: 4px;" src="https://mp.weixin.qq.com/cgi-bin/readtemplate?t=tmpl/video_tmpl&vid=${vid}" width="100%"  frameborder="0" allowfullscreen=""></iframe>`
  // guide_words
  currentArticleRef.value = {
    ...currentArticleRef.value,
    // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
    // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
    content_noencode,
    title,
    cdn_url,
    vid,
    guide_words,
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === currentArticleRef.value.msg_id)
  if (idx !== -1) {
    mp_msgsRef.value[idx] = currentArticleRef.value
  }
  dialogVideoMaterialRef.value = false
}

const openAdDialog = () => {
  dialogAdVisibleRef.value = true
}

const insertAd = () => {
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;

  if (insertAdTypeRef.value == "1") {
    const found = has_ad_in_wangEditor(currentArticleRef.value.content_noencode)
    console.log("found=>", found)
    if (!found) {
      console.log("adMarkerContentInUEditor=>", adMarkerContentInUEditor)
      editor.execCommand('inserthtml', adMarkerContentInUEditor);
      // editor.setContent(adMarkerContentInUEditor, true); // 执行 editor API
    }
    currentArticleRef.value.can_insert_ad = 1
    currentArticleRef.value.insert_ad_mode = 1
  } else if (insertAdTypeRef.value == "2") {
    currentArticleRef.value.can_insert_ad = 1
    currentArticleRef.value.insert_ad_mode = 2
  } else {
    currentArticleRef.value.can_insert_ad = 0
    currentArticleRef.value.insert_ad_mode = 0
  }

  dialogAdVisibleRef.value = false;
  // const toolbar = DomEditor.getToolbar(editor);
  // console.log('toolbar=>', toolbar, toolbarConfig);
  // const curToolbarConfig = toolbar.getConfig();
  // console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组
  // console.log('menuconfig=>', editor.getMenuConfig('uploadImage'));
};

const openMiniAppDialog = () => {
  // dialogMiniAppVisibleRef.value = true
  setMiniAppRef.value.openDialog()
}
const searchMiniApp = (val) => {
  const { type, formData } = val
  console.log("formData=>", formData)
  let pattern;
  if (type === "byAppInfo") {
    // 直接插入
    const { miniAppLink } = formData
    setMiniAppRef.value.closeDialog()
    let html = ""
    if (formData.miniAppText) {
      html = tplWithAppLinkAndText({
        app_link: "", 
        app_title: formData.miniAppText,
        weapp_path: miniAppLink.weapp_path, ...miniAppLink.weapp
      })
    } else if (formData.miniAppImg) {
      html = tplWithAppLinkAndImage({
        app_link: "", img_link: formData.miniAppImg,
        weapp_path: miniAppLink.weapp_path, ...miniAppLink.weapp
      })
    } else if (formData.miniAppCardTitle && formData.miniAppCardImg) {
      const uniqid = gen_unique_id()
      const dep = {
        app_link: formData.miniAppLink,
        img_link: formData.miniAppCardImg,
        crop: formData.miniAppCardImgCrop,
        app_title: formData.miniAppCardTitle,
        weapp_path: miniAppLink.weapp_path, ...miniAppLink.weapp
      }
      mpExsRef.value.miniappcard_obj = {...mpExsRef.value.miniappcard_obj, [uniqid]: dep} 
      html = tplMiniAppCardInEditor(uniqid, dep, {br: true})
    }
    editorRef.value.execCommand('inserthtml', html);
    return
  } else if (type == "byAppLink") {
    const { miniAppLink } = formData
    pattern = miniAppLink
  } else if (type == "byAppName") {
    const { query } = formData
    pattern = query
  }
  const { token, session_id, wechat_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  window.ipcRenderer.send('toMain', {
    tag: 'mpa:searchMiniApp',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    wechat_id,
    searchData: {
      // mp_msgs: toDeepRaw(mp_msgsRef.value),
      cookies,
      token: parseInt(token),
      // pattern: "#小程序://问卷星/DAfnLzsZZn17Ibu",
      pattern,
    },
    ...val,
  })
}

const openMPDialog = () => {
  setMPCardRef.value.openDialog()
}

const searchMP = (val) => {
  const { query, ...others } = val
  const { token, session_id, wechat_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  window.ipcRenderer.send('toMain', {
    tag: 'mp:searchBiz',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    wechat_id,
    searchData: {
      cookies,
      token: parseInt(token),
      pattern: query,
    },
    ...others,
  })
}

const insertMPCard = (val) => {
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;
  const uniqid = gen_unique_id()
  mpExsRef.value.mps_obj = {...mpExsRef.value.mps_obj, [uniqid]: val}
  const html = tplMPCardInEditor(uniqid, val)
  editor.execCommand('inserthtml', html);
  setMPCardRef.value.closeDialog()
}

const validatePreview = () => {
  if (msg_idRef.value <= 0) {
    ElMessageBox.alert('请把文章先保存到公众号草稿箱，再预览', '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }
  if (!selectedAccount.value) {
    ElMessageBox.alert('请选择预览的账号', '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }

  const { token, name, session_id } = selectedAccount.value
  if (!session_id) {
    // ElMessage({
    //   message: `当前账号(${name})未登录,请重新登录`,
    //   type: 'error',
    //   duration: 2 * 1000
    // })
    ElMessageBox.alert(`当前账号(${name})未登录,请重新登录`, '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }
  return { validated: true, token, name, session_id }
}

const handlePreview = async () => {
  // if (msg_idRef.value == 0) {
  //   ElMessageBox.alert('请选择预览文章，或者将当前新建的文章暂存到草稿箱', '警告', {
  //     confirmButtonText: '确定',
  //     type: 'error'
  //   }).catch(() => { })
  //   return
  // }
  // if (!selectedAccount.value) {
  //   ElMessageBox.alert('请选择预览的账号', '警告', {
  //     confirmButtonText: '确定',
  //     type: 'error'
  //   }).catch(() => { })
  //   return
  // }

  // const { token, name, session_id } = selectedAccount.value
  // if (!session_id) {
  //   // ElMessage({
  //   //   message: `当前账号(${name})未登录,请重新登录`,
  //   //   type: 'error',
  //   //   duration: 2 * 1000
  //   // })
  //   ElMessageBox.alert(`当前账号(${name})未登录,请重新登录`, '警告', {
  //     confirmButtonText: '确定',
  //     type: 'error'
  //   }).catch(() => { })
  //   return
  // }

  const { validated, token, name, session_id } = validatePreview()
  if (!validated) {
    return
  }


  await genArticleDraftPreviewUrl({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    msg_id: parseInt(msg_idRef.value)
  }).then(async (data) => {
    // console.log('preview return data =>', data)
    const temp_url = data?.data?.temp_url
    if (temp_url) {
      window.ipcRenderer.send('toMain', {
        tag: 'appmsg:previewMpArticle',
        source: `${props.appmsg.appmsgid}`,
        url: temp_url,
      })
    }
  }).catch((e) => { }).finally(() => {
  })

}

const openMobilePreviewDialog = async () => {
  const { validated, token, name, session_id } = validatePreview()
  if (!validated) {
    console.log("validated=>", validated)
    return
  }
  dialogMobilePreviewVisibleRef.value = true
  await genArticleDraftPreviewUrl({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    msg_id: parseInt(msg_idRef.value)
  }).then(async (data) => {
    console.log('preview return data =>', data)
    const temp_url = data?.data?.temp_url
    if (temp_url) {
      qrcodeMobilePreviewRef.value = `${envVars.backend_url}/mp_msg/preview_qr_code?url=${encodeURIComponent(temp_url)}`
      console.log("qrcodeMobilePreviewRef.value=>", qrcodeMobilePreviewRef.value)
    }
  }).catch((e) => { }).finally(() => {
  })
}

const validateAppMsgPreview = () => {
  if (!currentAppmsgRef.value) {
    ElMessageBox.alert('请选择图文消息(文章列表)', '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }
  if (!selectedAccount.value) {
    ElMessageBox.alert('请选择预览的账号', '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }

  const { token, name, session_id } = selectedAccount.value
  if (!session_id) {
    // ElMessage({
    //   message: `当前账号(${name})未登录,请重新登录`,
    //   type: 'error',
    //   duration: 2 * 1000
    // })
    ElMessageBox.alert(`当前账号(${name})未登录,请重新登录`, '警告', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return { validated: false }
  }
  return { validated: true, token, name, session_id }
}


// 手机预览
const dialogMobilePreviewVisibleRef = ref(false)
const dialogAppMsgMobilePreviewVisibleRef = ref(false)
const qrcodeMobilePreviewRef = ref("")
const previewerInputRef = ref(null)
const previewerInputValue = ref('')
const previewersRef = ref([])
const previewerInputVisible = ref(false)


const removePreviewer = (previewer) => {
  previewersRef.value.splice(previewersRef.value.indexOf(previewer), 1)
}
const showAddPreviewerInput = () => {
  previewerInputVisible.value = true
  nextTick(() => {
    previewerInputRef.value.input.focus()
  })
}
const handleAddPreviewerConfirm = () => {
  if (previewerInputValue.value) {
    previewersRef.value.push(previewerInputValue.value)
  }
  previewerInputVisible.value = false
  previewerInputValue.value = ''
}

const handleMpWechatActionErr = (account_name, base_resp) => {
  console.error('handleMpWechatActionErr:', base_resp);
  if (base_resp.ret == 200003) {
    ElMessageBox.alert(apperrmsg.invalid_session, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    // callback.error(`当前账号(${name})session过期,请重新登录`)
  } else {
    ElMessage({
      message: `服务器错误:${base_resp.err_msg}`,
      type: 'error',
      duration: 2 * 1000
    })
  }
}

const openAppMsgMobilePreviewDialog = async () => {
  const { validated, token, name, session_id } = validateAppMsgPreview()
  if (!validated) {
    console.log("validated=>", validated)
    return
  }
  dialogAppMsgMobilePreviewVisibleRef.value = true

  getMpUserInfo({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
  }).then((v) => {
    const { data } = v
    // previewersRef.value = 
    console.log('getMpUserInfo =>', data)
    const { alias, base_resp } = data
    if (base_resp.ret == "0") {
      if (!previewersRef.value.includes(alias)) {
        previewersRef.value.push(alias)
      }
    } else {
      handleMpWechatActionErr(name, base_resp)
    }
  }).catch((e) => {
    console.log("getMpUserInfo catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
  })
}

const sendPreviewToMobile = () => {
  const { token, session_id, name } = selectedAccount.value
  const { appmsgid } = currentAppmsgRef.value
  const pre_view_users = previewersRef.value.join(",")
  console.log("appmsgid=>", appmsgid)
  console.log("pre_view_users=>", pre_view_users)
  dialogAppMsgMobilePreviewVisibleRef.value = false
  globalLoadingRef.value = true
  sendPreview({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    pre_view_users,
  }).then((v) => {
    const { data } = v
    const { base_resp } = data
    if (base_resp.ret == "0") {
      ElMessageBox.alert(`已经将预览消息发送到手机，请确保您已关注公众号`, '信息', {
        confirmButtonText: '确定',
        type: 'info'
      }).then(() => {
        //
        console.log("then")
      }).catch(() => {
        console.log("catch")
      })
    } else {
      console.log('sendPreview=>', base_resp)
      handleMpWechatActionErr(name, base_resp)
    }
  }).catch((e) => {
    console.log("sendPreviewToMobile catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
    globalLoadingRef.value = false
  })

}

// debug
const openDebugDialog = () => {
  dialogDebugVisibleRef.value = true
  console.log(mp_msgsRef.value)
}

const clickAllCategory = (checkedAll) => {
  console.log("clickAllCategory=>", checkedAll)
  if (checkedAll) {
    adCategoryChoosedRef.value = adCategoryRef.value.map(v => v.id)
  } else {
    adCategoryChoosedRef.value = []
  }
}


const syncToList = (key) => {
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === currentArticleRef.value.msg_id)
  if (idx !== -1) {
    mp_msgsRef.value[idx][key] = currentArticleRef.value[key]
  }
  if (key === "title") {
    emitEvents("titleChange", { appmsgid: props.appmsg.appmsgid, title: currentArticleRef.value[key] })
  }

}

const testQueryImages = () => {
  globalLoadingRef.value = true
  const { token, session_id, name } = selectedAccount.value
  window.ipcRenderer.send('toMain', {
    tag: 'image:listImages',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    listData: {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      group_id: pickerQuery.value.group_id, // 不传或者传0 就是我的图片
      begin: (pickerQuery.value.page - 1) * pickerQuery.value.limit,
    }
  })

  setTimeout(() => {
    globalLoadingRef.value = false
  }, 6000)
}
var pickerPageInfo = shallowRef(null)
var pickerQuery = ref({ page: 1, limit: 12, group_id: 0 })
watch(pickerQuery, () => {
  testQueryImages()
}, { deep: true })

const format_video_page_info = (page_info) => {
  const { file_cnt, item } = page_info
  const total_cnt = file_cnt.video_msg_cnt
  console.log(item)
  const items = item.map(v => ({
    cdn_url: v.img_url,
    guide_words: v.multi_item?.[0]?.video_desc ?? "",
    title: v.title,
    vid: v.multi_item?.[0]?.mp_video_info?.[0]?.vid ?? "" //v.content, //
  }))
  return {
    total_cnt,
    items,
  }
}

const parseExtractMpArticleData = (ret, opts = {}) => {

  let { nick_name, copyright_stat, cdn_url, item_show_type, video_page_info } = ret
  let { title, author, source_url, content_noencode, content_text, picture_page_info_list } = ret
  let guide_words = "", vid = ""
  console.log("item_show_type=>", item_show_type)
  // const { video_page_infos } = msg.data

  if (item_show_type === 5 && video_page_info) {
    // 独立视频
    // console.log("video_page_infos=>",)
    guide_words = content_text
    vid = video_page_info.video_id
    content_noencode = getVideoFrameHtml(vid, cdn_url) //`<iframe class="edui-video-iframe" data-vidtype="2" data-mpvid="${video_id}" data-cover="${cdn_url}" allowfullscreen="" frameborder="0" data-w="1080" data-ratio="0.5625" style="border-radius: 4px;" src="https://mp.weixin.qq.com/cgi-bin/readtemplate?t=tmpl/video_tmpl&vid=${video_id}" width="420" height="280" frameborder="0" allowfullscreen=""></iframe>`
  }
  console.log("content_noencode=>", content_noencode)
  // if (currentArticleRef.value.item_show_type === 0) {
  //   content_noencode = content_noencode + "<p>" + content_text + "<p>"
  // }
  if (item_show_type === 8 && currentArticleRef.value.item_show_type != 8) {
    // 小绿书
    console.log("小绿书:", ret)
    ElMessageBox.alert(`当前的素材和导入的是小绿书链接不匹配`, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => {
      console.log("publish receive catch")
    })
    return
  }
  if (item_show_type === 8 && picture_page_info_list) {
    guide_words = content_noencode
    //   if (typeof(o.theme_color) === "string") {
    //   const parts = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(o.theme_color);
    //   o.theme_color = {
    //     r: parts[1],
    //     g: parts[2],
    //     b: parts[3],
    //   }
    //   print("o.theme_color=>", o.theme_color)
    // }
    const reg = /^rgb\((\d+),(\d+),(\d+)\)$/
    picture_page_info_list.forEach(o => {
      const parts = reg.exec(o.theme_color);
      o.theme_color = {
        r: parseInt(parts[1]),
        g: parseInt(parts[2]),
        b: parseInt(parts[3]),
      }
    })
    picture_page_info_list = toPicPageInfo(picture_page_info_list, 0)
    console.log("picture_page_info_list=>", picture_page_info_list)
  }
  if (item_show_type === 10) {
    guide_words = content_noencode
    if (title.replaceAll("\\n", "") === content_noencode.replaceAll("\n", "")) {
      title = ""
    }
  }

  content_noencode += '\v'
  content_noencode = format_to_UEditor_html(content_noencode)

  if (item_show_type === 0 && video_page_info) {
    if (opts.import_settings?.only_video_flag) {
      const matches = extractVideoFrame(content_noencode)
      // console.log("matches=", )
      if (matches.length > 0) {
        content_noencode = matches.join("")
      } else {
        content_noencode = '\v'
      }
    }
  }
  if (opts.import_settings?.clear_content_url) {
    content_noencode = clearContentUrl(content_noencode)
  }
  if (opts.import_settings?.clear_abstract && item_show_type !== 10) {
    guide_words = ""
  }
  if (opts.import_settings?.clear_author) {
    author = ""
  }
  if (opts.import_settings?.clear_source_url) {
    source_url = ""
  }
  if (opts.import_settings?.clear_weapp) {
    content_noencode = clearWeApp(content_noencode)
  }
  if (opts.import_settings?.clear_ad) {
    content_noencode = removeAd(content_noencode)
  }

  return {
    item_show_type,
    // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
    // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
    content_noencode,
    title,
    author,
    copyright_type: 0,
    cdn_url,
    guide_words,
    vid,
    picture_page_info_list,
    sourceurl: source_url,
  }
}

watch(() => [props.mainMsg], async (newVal) => {
  console.log("EditorTab props.changed=>", newVal)
  const msg = newVal[0]
  if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
    const tag = msg.tag;
    if (tag === "appmsg-ret:localExtractMpArticleUrlResult") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret } = msg.data
      console.log("ret=>", ret)
      if (ret.code == 101) {
        ElMessage({ type: 'error', message: ret.msg })
        return
      }
      let parsed_data = parseExtractMpArticleData(ret, { import_settings: import_settings.value })
      
      // 公众号卡片
      const mps_obj = toDeepRaw(mpExsRef.value.mps_obj)
      parsed_data.content_noencode = replaceMPCardFromWechat(parsed_data.content_noencode, mps_obj)
      // 小程序卡片
      const miniappcard_obj = toDeepRaw(mpExsRef.value.miniappcard_obj)
      parsed_data.content_noencode = replaceMiniAppCardFromWechat(parsed_data.content_noencode, miniappcard_obj)
      console.log("parsed_data.content_noencode=>", parsed_data.content_noencode)
      console.log("mps_obj=>", mps_obj)
      console.log("miniappcard_obj=>", miniappcard_obj)
      mpExsRef.value = {
        mps_obj: mps_obj,
        miniappcard_obj: miniappcard_obj,
      }

      currentArticleRef.value = {
        ...currentArticleRef.value,
        ...parsed_data,
      }
      console.log("currentArticleRef.value.content_noencode=>", currentArticleRef.value.content_noencode)
      const idx = mp_msgsRef.value.findIndex(v => v.msg_id === currentArticleRef.value.msg_id)
      if (idx !== -1) {
        mp_msgsRef.value[idx] = currentArticleRef.value
      }

      extractArticleUrlRef.value = ""
      dialogExtractMpAritcleUrlRef.value = false
    } else if (tag === "appmsg-ret:batchExtractMpArticleUrls") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret, failed } = msg.data
      console.log("ret=>", ret)
      console.log("failed=>", failed)
      if (ret.code == 101) {
        ElMessage({ type: 'error', message: ret.msg })
        return
      }
      console.log("ret=>", ret.length)
      for (const item of ret) {
        await newArticle(true)
        let parsed_data = parseExtractMpArticleData(item)
        currentArticleRef.value = {
          ...currentArticleRef.value,
          ...parsed_data,
        }
        const idx = mp_msgsRef.value.findIndex(v => v.msg_id === currentArticleRef.value.msg_id)
        if (idx !== -1) {
          mp_msgsRef.value[idx] = currentArticleRef.value
        }

        // ### todo mp_msg_exs
      }

    } else if (tag === "appmsg-ret:publishToWechat") {
      console.log("publishToWechatResult msg=>", msg)
      console.log("publishToWechatResult msg.data=>", msg.data)
      const { ret } = msg.data
      console.log("----recv---- ret", ret)
      const { success, msg: retmsg, code } = ret
      if (success) {
        console.log("-----发布成功-----")
        dialogPublishArticleVisibleRef.value = false
        ElMessage({
          message: `发布成功`,
          type: 'success',
          duration: 2 * 1000
        })
      } else {
        if (wxretmsg[code]) {
          ElMessage({ type: 'error', message: wxretmsg[code] })
          return;
        }
        ElMessageBox.alert(`发布到微信出现错误:${retmsg}`, '错误', {
          confirmButtonText: '确定',
          type: 'error'
        }).catch(() => {
          console.log("publish receive catch")
        })
      }
      if (publishLoadingRef.value) {
        publishLoadingRef.value = false
      }
    } else if (tag === "appmsg-ret:searchAppmsgsInPublishForQuerys") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret } = msg.data
      console.log("ret=>", ret)
      const { success, items } = ret
      if (success) {
        checkTitleResults.value = items
      }

    } else if (tag === "image-ret:listImages") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret } = msg.data
      // console.log("ret=>", ret)
      const { success, page_info } = ret
      if (success) {
        console.log("page_info=>", page_info)
        pickerPageInfo.value = page_info
      }
    } else if (tag === "video-ret:listVideos") {
      // 关闭对话框
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret } = msg.data
      // console.log("ret=>", ret)
      const { success, page_info } = ret
      if (success) {
        // console.log("page_info=>", page_info)
        const { items, total_cnt } = format_video_page_info(page_info)
        // videosRef.value = [...items, ...items, ...items, ...items, ...items]
        // video_current_pageRef.value = 1
        // video_total_cntRef.value = 5 // total_cnt
        console.log("items=>", items)
        videosRef.value = items
        video_total_cntRef.value = total_cnt
        videoLoadingRef.value = false
      }
    } else if (tag === "mpa-ret:searchMiniApp") {
      const { ret, type, formData } = msg.data
      console.log("type=>", type)
      const { success, weapp, weapp_path } = ret
      if (success) {
        if (type === "byAppLink") {
          setMiniAppRef.value.closeDialog()
          let html = ""
          if (formData.miniAppText) {
            html = tplWithAppLinkAndText({
              app_link: formData.miniAppLink, app_title: formData.miniAppText,
              weapp_path, ...weapp
            })
          } else if (formData.miniAppImg) {
            html = tplWithAppLinkAndImage({
              app_link: formData.miniAppLink, img_link: formData.miniAppImg,
              weapp_path, ...weapp
            })
          } else if (formData.miniAppCardTitle && formData.miniAppCardImg) {
            // console.log("formData.miniAppCardImg=>", formData.miniAppCardImg.length)
            const uniqid = gen_unique_id()
            const dep = {
              app_link: formData.miniAppLink,
              img_link: formData.miniAppCardImg,
              crop: formData.miniAppCardImgCrop,
              app_title: formData.miniAppCardTitle,
              weapp_path, ...weapp
            }
            mpExsRef.value.miniappcard_obj = {...mpExsRef.value.miniappcard_obj, [uniqid]: dep} 
            html = tplMiniAppCardInEditor(uniqid, dep, {br: true})
          }
          editorRef.value.execCommand('inserthtml', html);
        } else {
          setMiniAppRef.value.setMiniApp(weapp, weapp_path)
        }
      }
    } else if (tag === "mp-ret:searchBiz") {
      const { ret } = msg.data
      // console.log("ret=>", ret)
      const { success, mps } = ret
      if (success) {
        setMPCardRef.value.setMPs(mps)
      }
    }

    if (globalLoadingRef.value) {
      globalLoadingRef.value = false

    }
  }

})

// 组件生命周期
onMounted(async () => {
  console.log("==onMounted editorTab==", props.appmsg)
  console.log("props.appmsg?.multi_item[0]?.item_show_type=>", props.appmsg?.multi_item[0]?.item_show_type)

  accountsRef.value = toDeepRaw(all_accounts.value.list)
  selectedAccount.value = props.account
  currentAppmsgRef.value = props.appmsg
  editorIdRef.value = `editor-${props.appmsg.appmsgid}`
  mp_msgsRef.value = props.appmsg.multi_item
  if (props.mode === 'create') {
    loadArticleByMsgId(mp_msgsRef.value[0].msg_id)
  } else if (props.mode === 'hydrate') {
    if (mp_msgsRef.value[0]?.msg_id) loadArticleByMsgId(mp_msgsRef.value[0].msg_id)
    mp_msgsRef.value.forEach((item, index) => {
      if (item.fromExtract) {
        newArticle(true, 0, index)
      }
      if (!item.msg_id || item.msg_id > 0) {
        // fix hydrate msg
        item.msg_id = 0 - Date.now() - index;
      }
    })
  } else if (props.mode === 'edit') {
    await listArticles()
    if (mp_msgsRef.value.length > 0) {
      loadArticle(mp_msgsRef.value[0])
    }
  }
})

onUnmounted(async () => {
  console.log("---onUnmounted editorTab----")
  if (channelCleans[channelName]) {
    console.log(`cleanup channel ${channelName} for editor4`)
    channelCleans[channelName]()
  }
})



// onActivated(async () => {
//   console.log("---onActivated editorTab----")
//   // await listArticles()
//   // 用户切换标签页时，主进程会发送 fromMain 消息，通知当前选中的标签页 ID。

// })

// onDeactivated(async () => {
//   console.log("---onDeactivated editorTab----")
//   if (channelCleans[channelName]) {
//     console.log(`cleanup channel ${channelName} for editor4`)
//     channelCleans[channelName]()
//   }
// })


</script>