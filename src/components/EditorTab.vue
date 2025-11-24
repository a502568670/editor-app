<template>
  <div class="flex flex-col h-full">
    <div class="p-2 flex space-x-2 items-center border-b shadow-md">
      <div class="flex items-center pl-1">
        <img class="w-7 h-7 rounded-full" :src="selectedAccount?.avatar" />
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
          <el-button style="margin-left: 10px;" @click="handleSaveAppMsg" type="success">保存到本地草稿</el-button>
          <el-button @click="handleSyncToWechatDraftBox" type="success">保存到公众号草稿箱</el-button>
          <el-button @click="openSendArticleDialog" type="success">同步到其他账号</el-button>
          <el-button @click="confirmOpenPublishToWechatDialog" type="danger">发表</el-button>
        </div>
      </div>
    </div>
    <div class="flex-1 items-stretch h-0 flex">
      <div class="bg-white shadow-xl w-[300px] p-3">
        <div v-if="mp_msgsRef" class="h-full flex flex-col">
          <el-button class="mb-2" type="primary" :disabled="mp_msgsRef.length === 0" @click="checkTitles">
            检测标题(30天内)
          </el-button>
          <div ref="elListMsgsRef" class="overflow-auto border-b flex-1 h-0">
            <div @click="loadArticle(item, true)" v-for="(item, index) in mp_msgsRef" :key="item.msg_id"
              class="flex overflow-hidden items-center w-full relative group border-2 border-transparent hover:border-[var(--jzl-primary-color)]"
              :class="{
                '!border-[var(--jzl-primary-color)]': (item.msg_id === msg_idRef),
                'rounded-t-lg': (index === 0)
              }"
            >
              <img v-if="item.cdn_url" :src="fmtImageUrl(item.cdn_url)" style="width:0px;height:0px;"
                referrerpolicy="no-referrer" />
              <div v-if="index === 0" class='relative w-full flex h-40 justify-between items-end bg-[#e6e6e6]'>
                <div v-if="isShowCheckTitleResults(item.title)"
                  class="flex absolute left-0 top-0 justify-between px-1 space-x-2 text-white text-sm opacity-70"
                  :class="checkTitleIsPublished(item.title) ? 'bg-red-600' : 'bg-green-600'">
                  {{ getTitleMessage(item.title) }}
                </div>
                <img v-if="item.cdn_url" class="w-full h-full object-cover rounded-sm" :src="item.cdn_url"
                  referrerpolicy="no-referrer" />
                <div class="absolute text-white p-1 bg-gray-800 opacity-80 w-full truncate">
                  {{ item.msg_id === 0 ? '*' : '' }} {{ item.title }}
                </div>
                <!-- <div
                  class="flex absolute right-0 justify-between px-1 space-x-2 py-1 text-white bg-gray-600 opacity-70"
                  v-if="item.msg_id === msg_idRef && !is_xiaolvshu">
                  <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                    <component :is="ArrowDown"></component>
                  </el-icon>
                  <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                    <component :is="Delete"></component>
                  </el-icon>
                </div> -->
              </div>
              <div class="w-full flex h-20 items-center relative" v-else>
                <div class="flex flex-col flex-1 h-full justify-end w-0">
                  <div class="w-full max-w-full max-h-full overflow-y-hidden p-1"><span
                      class="mx-1 text-red-500" v-if="item.msg_id === 0">*</span>
                    <el-icon v-if="item.item_show_type === 5" :size="20"
                      class="cursor-pointer flex justify-center items-end" title="视频文章">
                      <Video />
                    </el-icon>
                    <div class="w-full truncate">
                      {{ item.title }}
                    </div>
                  </div>
                  <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
                </div>
                <div v-if="isShowCheckTitleResults(item.title)"
                  class="flex absolute top-0 justify-between px-1 space-x-2 text-white text-sm opacity-70"
                  :class="checkTitleIsPublished(item.title) ? 'bg-red-600' : 'bg-green-600'">
                  {{ getTitleMessage(item.title) }}
                </div>
                <img v-if="item.cdn_url" class="h-20 w-20 p-1 rounded-sm object-cover" :src="fmtImageUrl(item.cdn_url)" />
                <!-- <div class="flex flex-col justify-around px-1 h-full" v-if="item.msg_id === msg_idRef">
                  <el-icon class="cursor-pointer" @click="swapUp(item.msg_id)">
                    <component :is="ArrowUpRef"></component>
                  </el-icon>
                  <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                    <component :is="ArrowDownRef" v-if="index < mp_msgsRef.length - 1"></component>
                  </el-icon>
                  <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                    <component :is="DeleteRef"></component>
                  </el-icon>
                </div> -->
              </div>
              <div class="absolute hidden group-hover:block bg-black/60 p-1 bottom-0 left-0 w-full">
                <div class="flex justify-end">
                  <div class="flex justify-center items-center bg-white rounded-full p-1 mx-1">
                    <el-icon class="cursor-pointer" @click="swapUp(item.msg_id, index)">
                      <component :is="ArrowUpRef"></component>
                    </el-icon>
                  </div>
                  <div class="flex justify-center items-center bg-white rounded-full p-1 mx-1">
                    <el-icon class="cursor-pointer" @click="swapDown(item.msg_id, index)">
                      <component :is="ArrowDown"></component>
                    </el-icon>
                  </div>
                  <div class="flex justify-center items-center bg-white rounded-full p-1 mx-1">
                    <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                      <component :is="Delete"></component>
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-center mt-2">
            <el-dropdown v-if="!is_xiaolvshu">
              <el-button type="primary">
                新建内容<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="() => newArticle(true, 0)">图文</el-dropdown-item>
                  <el-dropdown-item @click="() => newArticle(true, 5)">视频</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="w-full flex h-1 items-center p-1 justify-center">
            <!-- <div @click="newArticle()"  class="cursor-pointer">+新建文章</div> -->
            <!-- <el-button @click="newArticle" type="primary">新建文章</el-button> -->
          </div>
        </div>
      </div>
      <div class="h-full flex-1 p-2 bg-white border-x border-[#efefef] flex flex-col">
        <el-input
          class="no-border"
          v-model="currentArticleRef.title"
          style="--el-input-text-color:#000;--el-input-height:52px;font-size:24px"
          clearable
          placeholder="请输入文章标题"
          @input="syncToList('title')"
          v-if="![5, 8, 10].includes(currentArticleRef.item_show_type)"
        />
        <div ref="ueditor_wrapper" class="flex-1">
          <div class="h-full flex flex-col" v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 0">
            <vue-ueditor-wrap class="ueditor-wrapper flex-1 flex items-stretch"
              v-model="currentArticleRef.content_noencode" :editor-id="editorIdRef" @ready="ready"
              :config="editorConfigRef" :editorDependencies="['ueditor.config.js', 'ueditor.all.js']" />
          </div>
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
          <div v-if="msg_idRef !== 0 && (currentArticleRef.item_show_type === 8 || currentArticleRef.item_show_type === 10)"
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
          <!-- <div v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 10"
            class="w-full p-2 pb-5 flex-col h-full overflow-auto">
            <el-row :gutter="4" class="mb-1 w-full">
              <el-col :span="24">
                <el-input v-model="currentArticleRef.title" clearable class="w-full" placeholder="请在这里输入标题 (选填)"
                  @input="syncToList('title')" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-1 w-full ">
              <el-col :span="24" class="flex w-full"> -->
                <!-- <el-input v-model="currentArticleRef.author" clearable class="w-full" placeholder="请输入视频介绍,可以不填" /> -->
                <!-- <el-mention v-model="currentArticleRef.guide_words" type="textarea" class="w-full h-96"
                  placeholder="填写描述信息，让大家了解更多内容" />
              </el-col>
            </el-row>
          </div> -->
        </div>
        <div class="flex items-center justify-between pt-2">
          <div>
            <p v-if="warningMsg != null" class="automatic-save-msg">
              {{ warningMsg === '' ? `自动保存成功 ${lastSaveTime}` : `自动保存失败：${warningMsg}` }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white">
        <div v-for="(item,index) of operationList" :key="index">
          <div v-if="!item.isShow && !item.component" class="p-2 border-b" @click="item.action">
            <el-tooltip :content="item.title" placement="left">
              <Icon :icon="item.icon" style="font-size: 20px;" />
            </el-tooltip>
          </div>
          <div v-else-if="item.component" class="p-2 border-b">
            <component :is="item.component" v-bind="item.componentProps" />
          </div>
        </div>
        <!-- <BatchExtractMpArticle v-model="mp_msgsRef" @confirm="onBatchExtractMp" /> -->
        <!-- <el-icon v-if="isDebugRef" :size="20" class="cursor-pointer flex justify-center"
          @click="handleLocalExtractMpArticleUrl" title="测试本地提取链接">
          <Link2 />
        </el-icon> -->
      </div>
      <el-tabs type="border-card" class="editor-inner-tabs w-[300px]">
        <el-tab-pane label="发布设置" class="h-full">
          <div class="overflow-y-auto h-full">
            <el-row :gutter="4" class="mb-6" v-if="false&&![5, 8, 10].includes(currentArticleRef.item_show_type)">
              <el-col :span="24">
                <el-input v-model="currentArticleRef.title" clearable class="grid-content-control" placeholder="请输入文章标题"
                  @input="syncToList('title')" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6" v-if="![8, 10].includes(currentArticleRef.item_show_type)">
              <el-col :span="24">
                <p class="set-title">作者</p>
                <el-input v-model="currentArticleRef.author" clearable placeholder="请输入文章作者" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">封面设置</p>
                <ImgPicker ref="refImgPicker" v-model="pickerQuery"
                  :pageInfo="pickerPageInfo" :imgSrc="currentArticleRef.cdn_url" placeholder="设置封面图"
                  @change="handleImageUpload" @confirm="onImgPick" :editorInst="editorRef" />
              </el-col>
              <!-- <el-col :span="24" class="h-20 py-2 w-full flex justify-center items-center" style="display: none;">
                <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-if="selectedCdnImageRef"
                  :src="selectedCdnImageRef" alt="封面预览">
                <img class="cursor-pointer max-h-16 block" @click="triggerFileInput"
                  v-else-if="currentArticleRef.cdn_url" :src="currentArticleRef.cdn_url" referrerpolicy="no-referrer"
                  alt="封面图" />
                <div v-else @click="triggerFileInput"
                  class="cursor-pointer border h-16 w-[180px] flex justify-center items-center bg-[#8c8c8c]">设置封面图</div>
                <input class="invisible" ref="cdnFileInputRef" @change="handleImage" type="file" accept="image/*">
              </el-col> -->
              <!-- <ImgCrop :imgSrc="currentArticleRef.cdn_url" placeholder="设置封面图" @change="handleImageUpload"></ImgCrop> -->
            </el-row>
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">创作来源</p>
                <el-select v-model="selected_claim_source_typeRef" value-key="id" filterable placeholder="创作来源">
                  <el-option v-for="(item) in claim_source_typesRef" :key="item.id" :label="item.name" :value="item" />
                </el-select>
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6" v-if="selected_claim_source_typeRef.id === 2">
              <el-col :span="24">
                <p class="set-title">素材来源</p>
                <el-radio-group v-model="materialSourceRef">
                  <el-radio label="official_account">公众号/服务号</el-radio>
                  <el-radio label="other">其他来源</el-radio>
                </el-radio-group>
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6"
              v-if="selected_claim_source_typeRef.id === 2 && materialSourceRef === 'official_account'">
              <el-col :span="24">
                <p class="set-title">来源文章链接</p>
                <el-input 
                  v-model="claimSourceLinkRef" 
                  clearable 
                  placeholder="请填写政/媒体/事业单位等官方组织机构发表的内容"
                  @blur="handleClaimSourceLinkChange"
                  :loading="claimSourceLinkLoadingRef"
                />
                <div v-if="claimSourceAccountRef || claimSourceTimeRef" class="mt-3 space-y-2">
                  <div v-if="claimSourceAccountRef" class="flex items-center text-sm">
                    <span class="text-gray-600 min-w-[80px]">来源账号</span>
                    <div class="flex items-center space-x-2">
                      <img 
                        v-if="claimSourceAccountAvatarRef" 
                        :src="claimSourceAccountAvatarRef" 
                        class="w-5 h-5 rounded-full object-cover"
                        referrerpolicy="no-referrer"
                        alt="账号头像"
                      />
                      <span class="text-gray-800 font-medium">{{ claimSourceAccountRef }}</span>
                    </div>
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600 min-w-[80px]">事件时间</span>
                    <el-date-picker
                      v-model="claimSourceTimeRef"
                      type="date"
                      placeholder="选择事件时间"
                      format="YYYY/MM/DD"
                      value-format="YYYY/MM/DD"
                      :disabled-date="(time) => time.getTime() >= Date.now()"
                      style="width: 180px"
                    />
                  </div>
                  <div v-if="claimSourceTimeRef" class="flex items-center text-sm">
                    <span class="text-gray-600 min-w-[80px]">事件地点</span>
                    <el-cascader 
                      v-model="claimSourceLocationRef" 
                      :options="eventLocationOpts" 
                      :props="eventLocationProps" 
                      placeholder="选择该事件发生的地点" 
                      clearable 
                      filterable
                      style="width: 100%"
                    />
                  </div>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6"
              v-if="selected_claim_source_typeRef.id === 2 && materialSourceRef === 'other'">
              <el-col :span="24">
                <p class="set-title">来源账号/平台</p>
                <el-input v-model="claimSourcePlatformRef" clearable placeholder="请填写具体来源全称 (如北京发布、中国地震台网)" />
                <div class="mt-3 space-y-2">
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600 min-w-[80px]">事件时间</span>
                    <el-date-picker
                      v-model="claimSourceTimeRef"
                      type="date"
                      placeholder="选择事件时间"
                      format="YYYY/MM/DD"
                      value-format="YYYY/MM/DD"
                      :disabled-date="(time) => time.getTime() >= Date.now()"
                      style="width: 180px"
                    />
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600 min-w-[80px]">事件地点</span>
                    <el-cascader 
                      v-model="claimSourceLocationRef" 
                      :options="eventLocationOpts" 
                      :props="eventLocationProps" 
                      placeholder="选择该事件发生的地点" 
                      clearable 
                      filterable
                      style="width: 100%"
                    />
                  </div>
                </div>
              </el-col>
            </el-row>
            <!-- 在这里显示 -->
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">原创设置</p>
                <el-checkbox label="声明原创" v-model="copyrightRef" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">原文链接</p>
                <el-input v-model="currentArticleRef.sourceurl" clearable placeholder="原文链接" />
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">留言设置</p>
                <el-checkbox label="打开留言" v-model="needOpenCommentRef" />
                <el-radio-group :disabled="!needOpenCommentRef" v-model="commentTypeRef">
                  <el-radio label="0">所有人可留言</el-radio>
                  <el-radio label="1">仅关注后可留言</el-radio>
                </el-radio-group>
              </el-col>
            </el-row>
            <el-row :gutter="4" class="mb-6">
              <el-col :span="24">
                <p class="set-title">评论区广告</p>
                <el-radio-group v-model="commentAreaAdvertise">
                  <el-radio :label="1">开启</el-radio>
                  <el-radio :label="2">关闭</el-radio>
                </el-radio-group>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        <el-tab-pane label="样式中心" class="h-full">
          <SysTempl :editorInst="editorRef" />
        </el-tab-pane>
        <el-tab-pane label="自定义模板" class="h-full">
          <UserTempl v-model="currentArticleRef.content_noencode" :visible="currentArticleRef.item_show_type === 0" />
        </el-tab-pane>
        <el-tab-pane label="默认模板" class="h-full">
          <DefaultTempl v-model="currentArticleRef.content_noencode" :account="$props.account" :appmsg="$props.appmsg" @useTemplate="handleUseTemplate" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
  <el-dialog :close-on-click-modal="false" title="提取文章链接内容" v-model="dialogExtractMpAritcleUrlRef" width="720px" @close="extractLinkClose">
    <el-tabs style="width: 100%;" v-model="extractLink" @tab-change="handleChange">
      <el-tab-pane label="单个提取" name="single">
        <div v-loading="extractLoadingRef" element-loading-text="提取中，请稍候...">
          <div class="flex">
            <el-input class="mr-2" v-model="extractArticleUrlRef" clearable placeholder="请输入文章提取地址 Ctrl + v 粘贴" />
            <el-button @click="handleLocalExtractMpArticleUrl" type="primary" :loading="extractLoadingRef" :disabled="extractLoadingRef">
              {{ extractLoadingRef ? '提取中...' : '提取链接内容' }}
            </el-button>
          </div>
          <el-checkbox label="仅视频" v-model="import_settings.only_video_flag" />
          <el-row :gutter="40">
            <el-col :span="4">
              <el-checkbox label="清除链接" v-model="import_settings.clear_content_url" />
            </el-col>
            <el-col :span="4">
              <el-checkbox label="清除摘要" v-model="import_settings.clear_abstract" />
            </el-col>
            <el-col :span="4">
              <el-checkbox label="清除作者" v-model="import_settings.clear_author" />
            </el-col>
            <el-col :span="4">
              <el-checkbox label="清除原文链接" v-model="import_settings.clear_source_url" />
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="4">
              <el-checkbox label="清除小程序" v-model="import_settings.clear_weapp" />
            </el-col>
            <el-col :span="4">
              <el-checkbox label="清除广告" v-model="import_settings.clear_ad" />
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="批量提取" name="batch">
        <div>
          <el-input v-for="(v,idx) of inputs" :key="idx" v-model.trim="inputs[idx].url" clearable placeholder="请输入文章提取地址">
            <template #prepend>#{{ idx + mp_msgsRef.length+1 }}</template>
          </el-input>
          <div class="flex justify-end mt-4 space-x-2">
            <el-button type="primary" @click="onConfirm" :loading="extractLoadingRef" :disabled="extractLoadingRef">
              {{ extractLoadingRef ? '提取中...' : '批量提取' }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
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
  <SetMPV ref="setMPVRef" @search-mpv="searchMPV" @insert-mpv-content="insertMPVContent" />
  <InsertMPLink ref="insertMPLinkRef" :pickerPageInfo="pickerPageInfo" v-model:pickerQuery="pickerQuery" :editorInst="editorRef" @search-mp="searchMPForLink" @search-article="searchArticle" @insert-link="insertMPLink" @select-current="selectCurrentArticles" />
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
  <el-dialog :close-on-click-modal="false" title="敏感性检测" v-model="dialogSensitiveCheckVisibleRef" width="720px">
    <div class="sensitive-check-dialog" v-loading="sensitiveCheckLoadingRef" element-loading-text="检测中，请稍候...">
      <div class="flex items-center space-x-3 mb-5">
        <el-button plain @click="handleOpenSensitiveManage">
          敏感词管理
        </el-button>
        <el-select
          v-model="selectedSensitiveCustomGroupRef"
          multiple
          collapse-tags
          collapse-tags-tooltip
          class="flex-1"
          clearable
          filterable
          placeholder="请选择自定义敏感词组"
        >
          <el-option
            v-for="item in sensitiveCustomGroupOptionsRef"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" plain @click="handleSensitiveRetry">
          重新检测
        </el-button>
      </div>
      <div class="mb-5">
        <div class="font-medium text-gray-700 mb-2">处理方案</div>
        <el-radio-group v-model="sensitiveHandleStrategyRef" class="flex flex-wrap gap-4">
          <el-radio label="none">不处理</el-radio>
          <el-radio label="remove">删除敏感词</el-radio>
          <el-radio label="replace">替换为自定义字符</el-radio>
          <el-radio label="insert">字符中插入自定义字符</el-radio>
        </el-radio-group>
        <div v-if="sensitiveHandleStrategyRef === 'replace' || sensitiveHandleStrategyRef === 'insert'" class="mt-3">
          <el-input
            v-model="sensitiveCustomCharRef"
            placeholder="请输入自定义字符"
            maxlength="10"
            class="w-full"
          />
        </div>
      </div>
      <div class="space-y-4 max-h-72 overflow-y-auto pr-1">
        <template v-if="sensitiveCheckDraftsRef.length">
          <div
            v-for="item in sensitiveCheckDraftsRef"
            :key="item.id"
            class="border border-gray-200 rounded-md bg-gray-50 px-4 py-3"
          >
            <div class="flex items-center text-base text-gray-800 font-medium">
              <span class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded mr-3 text-xs">{{ item.label }}</span>
              <span class="truncate">{{ item.title }}</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">{{ item.description }}</div>
            <div class="text-xs text-gray-400 mt-2">共 {{ item.words.length }} 个敏感词</div>
            <div class="flex flex-wrap gap-2 mt-3">
              <el-tag
                v-for="word in item.words"
                :key="word"
                closable
                size="small"
                type="danger"
                @close="handleRemoveSensitiveWord(item.id, word)"
              >
                {{ word }}
              </el-tag>
            </div>
          </div>
        </template>
        <el-empty v-else description="暂无敏感词记录" />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSensitiveCheckVisibleRef = false">取消</el-button>
        <el-button type="primary" @click="handleSensitiveDialogConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="敏感词管理" v-model="dialogSensitiveManageVisibleRef" width="820px">
    <div class="sensitive-manage-dialog space-y-4" v-loading="sensitiveManageLoadingRef">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <el-input
            v-model="sensitiveManageKeywordQueryRef"
            placeholder="关键词搜索"
            class="w-56"
            clearable
          />

        </div>
        <el-button type="primary" @click="handleSensitiveManageCreate">
          新建自定义敏感词组
        </el-button>
      </div>
      <el-table
        :data="sensitiveKeywordGroupsRef"
        border
        stripe
        class="sensitive-manage-table"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="px-6 py-3 flex flex-wrap gap-2">
              <el-tag
                v-for="word in row.words"
                :key="`${row.id}-${word}`"
                size="small"
                type="info"
              >
                {{ word }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="敏感词组" prop="name" min-width="160" />
        <el-table-column label="描述" prop="description" min-width="160" />
        <el-table-column label="创建时间" prop="createdAt" min-width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :disabled="row.userId !== currentUserIdRef"
              @click="handleSensitiveManageEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :disabled="row.userId !== currentUserIdRef"
              @click="handleSensitiveManageDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end">
        <el-pagination
          layout="prev, pager, next"
          :total="sensitiveManagePaginationRef.total"
          :page-size="sensitiveManagePaginationRef.pageSize"
          :current-page="sensitiveManagePaginationRef.page"
          small
          @current-change="handleSensitiveManagePageChange"
        />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSensitiveManageVisibleRef = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="编辑敏感词组" v-model="dialogSensitiveManageEditVisibleRef" width="620px">
    <el-form :model="sensitiveManageEditFormRef" label-width="120px" class="sensitive-manage-edit-dialog">
      <el-form-item label="敏感词组名称">
        <el-input v-model="sensitiveManageEditFormRef.name" placeholder="请输入敏感词组名称" />
      </el-form-item>
      <el-form-item label="敏感词组描述">
        <el-input
          v-model="sensitiveManageEditFormRef.description"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 4 }"
          placeholder="请输入敏感词组描述"
        />
      </el-form-item>
      <el-form-item label="敏感词组">
        <el-input
          v-model="sensitiveManageEditFormRef.words"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 10 }"
          placeholder="换行分隔每个敏感词"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleSensitiveManageEditCancel">取消</el-button>
        <el-button type="primary" :loading="sensitiveManageEditSubmittingRef" @click="handleSensitiveManageEditConfirm">确定</el-button>
      </div>
    </template>
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
  <el-dialog :close-on-click-modal="false" title="原创性检测结果" v-model="dialogCopyrightCheckVisibleRef" width="800px">
    <div class="w-full flex flex-col" v-loading="copyrightCheckLoadingRef" element-loading-text="检测中，请稍候...">
      <div v-if="copyrightCheckResultRef" class="flex flex-col space-y-2">
        <div v-if="copyrightCheckResultRef.copyright === 0" class="flex flex-col space-y-2">
          <div class="flex font-bold text-lg text-green-600">
            <el-icon class="mr-2"><CircleCheckFilled /></el-icon>
            原创检测通过
          </div>
          <div class="text-gray-600">
            您的内容已通过原创校验，可以声明原创发表
          </div>
        </div>
        <div v-else-if="copyrightCheckResultRef.copyright === 1" class="flex flex-col space-y-2">
          <div class="flex font-bold text-lg text-orange-600">
            <el-icon class="mr-2"><WarningFilled /></el-icon>
            原创检测未通过
          </div>
          <div v-if="copyrightCheckListRef && copyrightCheckListRef.length > 0">
            <div class="flex font-bold mb-2">
              共 {{ copyrightCheckListRef.length }} 篇相关联内容未通过原创校验逻辑
            </div>
            <table class="w-full border shadow-lg">
              <thead class="text-lg bg-gray-200 text-gray-400">
                <tr>
                  <th class="text-left p-4" style="width:80%">未通过原因</th>
                  <th class="text-left p-4" style="width:20%">建议</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b h-[80px]" v-for="item in copyrightCheckListRef" :key="item.source_idx">
                  <td class="p-4">你的内容《{{ item.article_title }}》与原创内容《{{ item.source_title }}》相似度过高</td>
                  <td class="p-4 text-orange-600">分享发表</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-gray-600">
            您的内容未通过原创校验，建议修改后重新检测
          </div>
        </div>
        <div v-else class="flex flex-col space-y-2">
          <div class="flex font-bold text-lg text-red-600">
            <el-icon class="mr-2"><CircleCloseFilled /></el-icon>
            检测失败
          </div>
          <div class="text-gray-600">
            原创性检测失败，请稍后重试
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogCopyrightCheckVisibleRef = false">关闭</el-button>
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
  height: 100%;

  .el-tabs__content {
    @apply p-2;
  }

  .el-tabs__item {
    /* font-size: 12px; */
    /* padding: 0 10px !important; */
    /* --el-tabs-header-height: 32px; */
  }
}

.grid-content {
  border-radius: 4px;
  /* min-height: 36px;   */
}

.grid-content-control {
  max-width: 180px;
}

.sensitive-check-dialog,
.sensitive-manage-dialog,
.sensitive-manage-edit-dialog {
  width: 100%;
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

/* 隐藏自动排版按钮的下拉箭头 */
.edui-toolbar .edui-for-autotypeset .edui-splitborder,
.edui-toolbar .edui-for-autotypeset .edui-arrow,
.edui-toolbar .edui-for-autotypeset .edui-splitbutton-arrow,
.edui-toolbar [data-command="autotypeset"] .edui-splitborder,
.edui-toolbar [data-command="autotypeset"] .edui-arrow,
.edui-toolbar [data-command="autotypeset"] .edui-splitbutton-arrow {
  display: none !important;
}

/* 移除自动排版按钮的分割线样式 */
.edui-toolbar .edui-for-autotypeset.edui-splitbutton,
.edui-toolbar [data-command="autotypeset"].edui-splitbutton {
  border-right: none !important;
}

/* 使自动排版按钮看起来像普通按钮 */
.edui-toolbar .edui-for-autotypeset,
.edui-toolbar [data-command="autotypeset"] {
  cursor: pointer !important;
}
</style>
<style scoped>
.set-title{
  font-size: 14px;
  color: #444;
  margin-bottom: 5px;
}

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

.no-border :deep(.el-input__wrapper) {
  box-shadow: none !important; /* 去掉阴影 */
  border-bottom: 1px solid #eee !important;     /* 去掉边框 */
}

.ueditor-wrapper :deep(.edui-default .edui-editor) {
  border: none !important;     /* 去掉边框 */
  border-bottom: 1px solid #eee !important;
}

.automatic-save-msg{
  font-size: 12px;
  color: var(--jzl-primary-color);
  font-weight: 600;
  text-align: end;
}
</style>
<script setup>
import { ref, toRefs, shallowRef, onMounted, onBeforeUnmount, nextTick, onActivated, onDeactivated, onUnmounted, watch, computed, provide, toRaw, unref, reactive } from 'vue';
// import { listAccount } from '@/api/account'
import store from '@/store'
import { getToken } from "@/utils/auth";
import {
  saveArticleDraft,
  newlistArticlesByAppMsg, listArticleGroups, swapArticles,
  deleteArticleDraft, removeMpMsg, genArticleDraftPreviewUrl, previewQRCode,
} from "@/api/mp_msg"
import { saveAppMsg, send_to_other_accounts_events, listAppMsgs } from "@/api/appmsg"
import {
  getMpUserInfo, getLastPreviewAccounts, sendPreview,
  listVideos, getMasssendInfo, stat_appmsg_copyright_stat_events,
  query_appmsg_publish_qrcode_validate_events, getQrcodeMobileValidate
} from "@/api/mp_wechat"
import { format_to_UEditor_html, clearContentUrl, clearWeApp, restore_from_UEditor_html } from "@/utils/dom";
import { uploadImage } from "@/api/img"
import {
  listSensitiveWordGroups,
  createSensitiveWordGroup,
  updateSensitiveWordGroup,
  deleteSensitiveWordGroup,
  checkSensitiveWords
} from "@/api/sensitiveWords"
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
import {hasMPVContentInEditor, replaceMPVContentToWechat, tplMPVContentInEditor, replaceMPVContentFromWechat} from "@/utils/mpvcontent"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { ArrowUp, ArrowDown, Delete, CircleCheckFilled, CircleCloseFilled, InfoFilled, Search, Plus, BrushFilled, Close, WarningFilled } from '@element-plus/icons-vue'
import { Link, Link2, RadioTower, DollarSign, SquareTerminal, Eye, ScanEye, Minus, Smartphone, Video } from 'lucide-vue-next';
import WechatMiniAppIcon from "@/components/icons/WechatMiniAppIcon"
import WechatMPIcon from "@/components/icons/WechatMPIcon"
import WechatVideoIcon from "@/components/icons/WechatVideoIcon"
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
import DefaultTempl from './editor/DefaultTempl.vue';
import debounce from 'lodash-es/debounce'
import { dog } from '@/utils';
import SysTempl from './editor/SysTempl.vue';
// import SetMiniApp from "@/components/editor/SetMiniApp.vue"
import SetMiniApp from "@/components/editor/SetMiniAppWeiYu.vue"
import SetMPCard from "@/components/editor/SetMPCard.vue"
import SetMPV from './editor/SetMPV.vue';
import InsertMPLink from './editor/InsertMPLink.vue';
import { useDraggable } from 'vue-draggable-plus'

const props = defineProps(['account', 'appmsg', 'mode', 'mainMsg']);
const emitEvents = defineEmits(['titleChange', 'createAppmsg', 'msgidChange'])
const is_xiaolvshu = computed(() => {
  const type = (props.appmsg?.multi_item[0] || currentArticleRef.value)?.item_show_type
  return type === 8 || type === 10
});

const { all_accounts } = toRefs(store.getters)
const currentUserIdRef = computed(() => {
  const user = store.getters.getUserData || {}
  return user.user_id ?? user.userId ?? null
})
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
  },
  elementPathEnabled: false,
  wordCount: false,
  // 自定义工具栏按钮点击回调
  toolbarCallback: function (cmd, editor) {
    // 处理自动排版按钮点击（拦截 autotypeset 命令）
    if (cmd === 'autotypeset') {
      // 延迟调用，确保 handleAutoFormat 已经定义
      setTimeout(() => {
        if (typeof handleAutoFormat === 'function') {
          handleAutoFormat()
        }
      }, 0)
      return true // 返回 true 表示已经处理，阻止默认行为
    }
    return false
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
const normalizeClaimSourceInfo = (mpMsgs) => {
  if (!Array.isArray(mpMsgs)) return
  mpMsgs.forEach((item) => {
    if (!item || !item.claim_source_info) return
    if (typeof item.claim_source_info === 'string') {
      try {
        item.claim_source_info = JSON.parse(item.claim_source_info)
      } catch (e) {
        console.error('claim_source_info解析失败:', e)
        item.claim_source_info = null
      }
    }
  })
}
const mpExsRef = ref({
  mps_obj: {},
  miniappcard_obj: {},
  mpvcontent_obj: {},
})
const mp_msg_groupsRef = ref([])
const currentAppmsgRef = ref(null)
const elListMsgsRef = ref(null)
// 封面
const cdnRef = ref(null)
const selectedCdnImageRef = ref(null)
// const cdnFileInputRef = ref(null)

//声明原创
const copyrightRef = ref(false)

// 留言
const needOpenCommentRef = ref(false)
const commentTypeRef = ref("0") // 0-全部 1-只有粉丝
const commentAreaAdvertise = ref(1)

// 创作来源
const claim_source_typesRef = ref(claim_source_types)
const selected_claim_source_typeRef = ref(claim_source_types[0])
const claimSourceLinkRef = ref('') // 来源文章链接
const claimSourcePlatformRef = ref('') // 来源账号/平台
const claimSourceAccountRef = ref('') // 来源账号（从链接获取）
const claimSourceAccountAvatarRef = ref('') // 来源账号头像
const claimSourceTimeRef = ref('') // 事件时间
const claimSourceLocationRef = ref([]) // 事件地点
const claimSourceLinkLoadingRef = ref(false) // 加载状态

// 素材来源
const materialSourceRef = ref('official_account') // 默认选中"公众号/服务号"

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

// 敏感性检测
const dialogSensitiveCheckVisibleRef = ref(false)
const sensitiveCheckLoadingRef = ref(false)
const baseSensitiveGroupOptions = [
]
const sensitiveCustomGroupOptionsRef = ref([...baseSensitiveGroupOptions])
const selectedSensitiveCustomGroupRef = ref([])
const sensitiveHandleStrategyRef = ref('none')
const sensitiveCustomCharRef = ref('')
const sensitiveCheckDraftsRef = ref([])
const dialogSensitiveManageVisibleRef = ref(false)
const sensitiveManageOnlyMineRef = ref(true)
const sensitiveManageKeywordQueryRef = ref('')
const sensitiveKeywordGroupsRef = ref([])
const sensitiveManageLoadingRef = ref(false)
const sensitiveManagePaginationRef = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})
const sensitiveManageLoadedOnceRef = ref(false)
const dialogSensitiveManageEditVisibleRef = ref(false)
const sensitiveManageEditFormRef = reactive({
  id: '',
  name: '',
  description: '',
  words: '',
  createdAt: '',
  isPrivate: true,
})
const sensitiveManageEditIsNewRef = ref(false)
const sensitiveManageEditSubmittingRef = ref(false)

// 原创性检测
const dialogCopyrightCheckVisibleRef = ref(false)
const copyrightCheckLoadingRef = ref(false)
const copyrightCheckResultRef = ref(null)
const copyrightCheckListRef = ref([])

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

// 批量提取文章
const extractLink = ref('single')
const MAX = 8
const inputs = ref([])
function handleChange(tab){
  if(tab === 'batch'){
    if(mp_msgsRef.value.length < MAX){
      inputs.value = Array.from({length: MAX - mp_msgsRef.value.length}, ()=>({type:0,url:''}))
      return;
    }
    ElMessage({type:'error',message:`超出单消息最大文章数 ${MAX} 篇`})
  }
}
function onConfirm(){
  const data = inputs.value.filter(v=>v.url)
  if(!data.length){
    ElMessage({type:'warning',message:'请输入有效的提取链接'})
    return;
  }
  onBatchExtractMp(data)
  // 批量提取时不立即关闭对话框，等提取完成后再关闭
  // dialogExtractMpAritcleUrlRef.value = false
}
const extractLinkClose = () => {
  extractLink.value = 'single'
  inputs.value = []
  extractLoadingRef.value = false
}

// 提取链接
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/G2TYEsgZsTJ1VWj4R2F2hQ?from=kdocs_link")
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/riiYjv8HUqyUZz_-IQKe9g")
const extractArticleUrlRef = ref("")
const dialogExtractMpAritcleUrlRef = ref(false)
const extractLoadingRef = ref(false)
const timeoutExtract = 60 * 1000; // ms

const setMiniAppRef = ref(null)

// 账号名片
const setMPCardRef = ref(null)

// 视频号
const setMPVRef = ref(null)

// 公众号链接
const insertMPLinkRef = ref(null)

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

  // 重写 execCommand 方法，完全阻止 autotypeset 命令的默认执行
  const originalExecCommand = editorInstance.execCommand
  editorInstance.execCommand = function(cmd, value) {
    // 拦截 autotypeset 命令，使用自定义实现
    if (cmd === 'autotypeset' || cmd === 'autotype') {
      // 调用自定义的自动排版函数
      if (typeof handleAutoFormat === 'function') {
        handleAutoFormat()
      }
      return true // 返回 true 表示命令已处理
    }
    // 其他命令使用原始方法
    try {
      return originalExecCommand.call(this, cmd, value)
    } catch (e) {
      console.warn('执行命令失败:', cmd, e)
      return false
    }
  }

  // 设置自动排版按钮的点击事件，并移除下拉箭头
  nextTick(() => {
    // 使用 setTimeout 确保 DOM 完全渲染
    setTimeout(() => {
      // 查找自动排版按钮（autotypeset 命令对应的按钮）
      const selectors = [
        '[data-command="autotypeset"]',
        '.edui-toolbar .edui-for-autotypeset',
        '.edui-toolbar [title*="自动排版"]',
        '.edui-toolbar [title*="排版"]',
        '.edui-toolbar .edui-splitbutton[title*="排版"]'
      ]
      
      let autoFormatBtn = null
      for (const selector of selectors) {
        autoFormatBtn = document.querySelector(selector)
        if (autoFormatBtn) break
      }
      
      if (autoFormatBtn) {
        // 移除所有可能的下拉箭头元素
        const arrowSelectors = ['.edui-splitborder', '.edui-arrow', '.edui-splitbutton-arrow', '.edui-menu']
        arrowSelectors.forEach(selector => {
          const arrows = autoFormatBtn.querySelectorAll(selector)
          arrows.forEach(arrow => {
            arrow.style.display = 'none'
          })
        })
        
        // 查找父级分割按钮容器
        const splitButton = autoFormatBtn.closest('.edui-splitbutton') || autoFormatBtn.parentElement
        if (splitButton && splitButton.classList.contains('edui-splitbutton')) {
          // 移除分割按钮样式
          splitButton.style.borderRight = 'none'
          splitButton.style.paddingRight = '0'
        }
        
        // 阻止下拉菜单的显示
        const handleClick = function(e) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          handleAutoFormat()
          return false
        }
        
        // 移除旧的事件监听器（如果存在）
        autoFormatBtn.removeEventListener('click', handleClick)
        autoFormatBtn.addEventListener('click', handleClick, true) // 使用捕获阶段
        
        // 阻止鼠标悬停时显示下拉菜单
        autoFormatBtn.addEventListener('mouseenter', function(e) {
          e.stopPropagation()
        }, true)
      }
    }, 100) // 延迟 100ms 确保工具栏完全渲染
  })

  const wrapprHeight = ueditor_wrapper.value.clientHeight
  console.log("wrapprHeight=>", wrapprHeight)
  // document.querySelector('#edui1_iframeholder').style.height = 'calc(100% - 100px)';
  const toolbarHeight = document.querySelector(".edui-editor-toolbarbox .edui-default")?.clientHeight
  // const conatinerHeight = document.querySelector("#edui1").clientHeight
  // console.log("toolbarHeight:", toolbarHeight)
  // console.log("conatinerHeight:", conatinerHeight)
  // editorInstance.setHeight(wrapprHeight - toolbarHeight - 40 + 1)
  // listHeightRef.value = `${wrapprHeight-120}px`
  // elListMsgsRef.value.style.height = `${wrapprHeight - 120}px`

}



// 帮助方法
/** 获取appmsgid */
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

// const createBase64Image = async (fileObject) => {
//   const reader = new FileReader();
//   const filename = fileObject.name;

//   reader.onload = async (e) => {
//     const cover = e.target.result;
//     console.log("e", e)
//     console.log("e.target", e.target)
//     // console.log("cover:", cover);
//     const matches = cover.match(/data:(image\/.*);base64,(.*)/);
//     if (matches && matches.length >= 3) {
//       const cdn_content_type = matches[1];  // 图像MIME类型 (image/webp)
//       const cdn_base64_image = matches[2]; // Base64编码数据

//       // console.log("cdn_content_type:", cdn_content_type);
//       // console.log("cdn_base64_image:", cdn_base64_image);
//       cdnRef.value = { cdn_content_type, cdn_base64_image, cdn_filename: filename }
//       // 切换时上传图片获取cdn_url
//       await uploadCover()
//     } else {
//       ElMessage({
//         message: '无效的图片',
//         type: 'error',
//         duration: 2 * 1000
//       })
//     }
//     // console.log('image_base64:',cover.value)
//     // this.uploadImage();
//     selectedCdnImageRef.value = reader.result
//   };
//   reader.readAsDataURL(fileObject);
// }

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
      normalizeClaimSourceInfo(response.data)
      console.log('aaa',response)
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
  // 视频号内容
  const mpvcontent_obj = toDeepRaw(mpExsRef.value.mpvcontent_obj)
  vhtml = replaceMPVContentFromWechat(vhtml, mpvcontent_obj)

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
    mpvcontent_obj: mpvcontent_obj,
  }
  console.log("mpExsRef=>", mpExsRef.value)

  selectedCdnImageRef.value = null
  // cdnFileInputRef.value.value = ""
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
  
  // 解析并还原claim_source_info
  if (currentArticleRef.value.claim_source_info) {
    let claimSourceInfo = currentArticleRef.value.claim_source_info
    // 如果是字符串，需要解析JSON
    if (typeof claimSourceInfo === 'string') {
      try {
        claimSourceInfo = JSON.parse(claimSourceInfo)
      } catch (e) {
        console.error('解析claim_source_info失败:', e)
        claimSourceInfo = null
      }
    }
    
    if (claimSourceInfo && claimSourceInfo.media_source_type_info) {
      const mediaInfo = claimSourceInfo.media_source_type_info
      
      // 还原素材来源类型（兼容数字和字符串类型）
      if (mediaInfo.media_source_from === 1 || mediaInfo.media_source_from === "1") {
        materialSourceRef.value = 'official_account'
        // 还原公众号/服务号相关字段
        claimSourceLinkRef.value = mediaInfo.biz_link_url || ''
        claimSourceAccountRef.value = mediaInfo.biz_nickname || ''
        claimSourceAccountAvatarRef.value = mediaInfo.biz_headimgurl || ''
      } else if (mediaInfo.media_source_from === 2 || mediaInfo.media_source_from === "2") {
        materialSourceRef.value = 'other'
        // 还原其他来源相关字段
        claimSourcePlatformRef.value = mediaInfo.other_from_account || ''
      }
      
      // 还原事件时间（时间戳转日期字符串）
      if (mediaInfo.news_time) {
        try {
          const timestamp = parseInt(mediaInfo.news_time)
          if (timestamp > 0) {
            const date = new Date(timestamp * 1000)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            claimSourceTimeRef.value = `${year}/${month}/${day}`
          }
        } catch (e) {
          console.error('解析事件时间失败:', e)
          claimSourceTimeRef.value = ''
        }
      } else {
        claimSourceTimeRef.value = ''
      }
      
      // 还原事件地点
      if (mediaInfo.news_position_info) {
        const posInfo = mediaInfo.news_position_info
        if (posInfo.country === "中国" && posInfo.province) {
          // 中国地区
          let province = posInfo.province
          // 对于香港、澳门、台湾，需要映射回"中国香港"、"中国澳门"、"中国台湾"以匹配级联选择器的 value
          if (province === '香港') {
            province = '中国香港'
          } else if (province === '澳门') {
            province = '中国澳门'
          } else if (province === '台湾') {
            province = '中国台湾'
          }
          const location = ['china', province]
          if (posInfo.city) {
            location.push(posInfo.city)
          }
          claimSourceLocationRef.value = location
        } else if (posInfo.country && posInfo.country !== "中国") {
          // 国际地区
          claimSourceLocationRef.value = ['international', posInfo.country]
        } else {
          // 无确切地点或空
          claimSourceLocationRef.value = []
        }
      } else {
        claimSourceLocationRef.value = []
      }
    } else {
      // 重置所有字段
      materialSourceRef.value = 'official_account'
      claimSourceLinkRef.value = ''
      claimSourcePlatformRef.value = ''
      claimSourceAccountRef.value = ''
      claimSourceAccountAvatarRef.value = ''
      claimSourceTimeRef.value = ''
      claimSourceLocationRef.value = []
    }
  } else {
    // 没有claim_source_info，重置所有字段
    materialSourceRef.value = 'official_account'
    claimSourceLinkRef.value = ''
    claimSourcePlatformRef.value = ''
    claimSourceAccountRef.value = ''
    claimSourceAccountAvatarRef.value = ''
    claimSourceTimeRef.value = ''
    claimSourceLocationRef.value = []
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

const swapUp = async (msg_id, index) => {
  if (checkHasNotSave(true) || index === 0) {
    return
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  // const prev = mp_msgsRef.value[idx - 1].msg_id
  // if (props.mode === 'create' || props.mode == 'hydrate') {
  var tmp = mp_msgsRef.value[idx];
  mp_msgsRef.value[idx] = mp_msgsRef.value[idx - 1]
  mp_msgsRef.value[idx - 1] = tmp

  //   return;
  // }
  // await swapArticles(prev, msg_id).catch((err) => { })
  // await listArticles()
}
const swapDown = async (msg_id, index) => {
  if (checkHasNotSave(true) || index === mp_msgsRef.value.length - 1) {
    return
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  // const next = mp_msgsRef.value[idx + 1]?.msg_id
  // if (!next) return
  // if (props.mode === 'create' || props.mode == 'hydrate') {
  var tmp = mp_msgsRef.value[idx];
  mp_msgsRef.value[idx] = mp_msgsRef.value[idx + 1]
  mp_msgsRef.value[idx + 1] = tmp

  //   return;
  // }
  // await swapArticles(msg_id, next)
  // await listArticles()
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
      console.log("剩余的所有文章=>", mp_msgsRef.value)
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

  if(elListMsgsRef.value.children.length - 2 > 0){
    var { clientHeight } = elListMsgsRef.value.children[elListMsgsRef.value.children.length - 2]
    var top = clientHeight + elListMsgsRef.value.scrollTop
    elListMsgsRef.value.scrollTo({ top, behavior: 'smooth' })
  }
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
  
  // 新增创作来源json体保存
  if (selected_claim_source_typeRef.value.id === 2) {
    // 构建claim_source_info对象
    const claimSourceInfo = {
      claim_source_type: String(selected_claim_source_typeRef.value.id),
      claim_source: selected_claim_source_typeRef.value.name,
      aigc_type: "",
      aigc_wording: "",
      media_source_type_info: {}
    }
    
    // 构建media_source_type_info
    if (materialSourceRef.value === 'official_account') {
      // 公众号/服务号
      claimSourceInfo.media_source_type_info = {
        media_source_from: 1,
        biz_nickname: claimSourceAccountRef.value || "",
        news_time: claimSourceTimeRef.value ? String(Math.floor(new Date(claimSourceTimeRef.value).getTime() / 1000)) : "",
        biz_link_url: claimSourceLinkRef.value || "",
        biz_headimgurl: claimSourceAccountAvatarRef.value || "",
        other_from_account: "",
        news_position_info: {}
      }
    } else {
      // 其他来源
      claimSourceInfo.media_source_type_info = {
        media_source_from: 2,
        biz_nickname: "",
        news_time: claimSourceTimeRef.value ? String(Math.floor(new Date(claimSourceTimeRef.value).getTime() / 1000)) : "",
        biz_link_url: "",
        biz_headimgurl: "",
        other_from_account: claimSourcePlatformRef.value || "",
        news_position_info: {}
      }
    }
    
    // 处理地点信息
    if (claimSourceLocationRef.value && claimSourceLocationRef.value.length > 0) {
      const location = claimSourceLocationRef.value
      if (location[0] === 'china' && location.length >= 2) {
        // 中国地区
        let province = location[1] || ""
        // 对于香港、澳门、台湾，去掉"中国"前缀
        if (province === '中国香港') {
          province = '香港'
        } else if (province === '中国澳门') {
          province = '澳门'
        } else if (province === '中国台湾') {
          province = '台湾'
        }
        claimSourceInfo.media_source_type_info.news_position_info = {
          country: "中国",
          province: province,
          city: location.length >= 3 ? location[2] : ""
        }
      } else if (location[0] === 'international' && location.length >= 2) {
        // 国际地区
        claimSourceInfo.media_source_type_info.news_position_info = {
          country: location[1] || "",
          province: "",
          city: ""
        }
      } else if (location[0] === 'no_location') {
        // 无确切地点
        claimSourceInfo.media_source_type_info.news_position_info = {
          country: "",
          province: "",
          city: ""
        }
      }
    }
    
    currentArticleRef.value.claim_source_info = claimSourceInfo
  } else {
    // 其他创作来源类型，不保存claim_source_info或保存空对象
    currentArticleRef.value.claim_source_info = null
  }

  // 评论区广告
  currentArticleRef.value.open_comment_ad = commentAreaAdvertise.value

  const to_save_content_noencode = currentArticleRef.value.content_noencode;

  const category_id_list = adCategoryChoosedRef.value.join("|")
  let vhtml = restore_ad_content_from_UEditor(to_save_content_noencode, category_id_list, ad_idRef.value)

  vhtml = replaceMPCardToWechat(vhtml, mpExsRef.value.mps_obj)
  vhtml = replaceMiniAppCardToWechat(vhtml, mpExsRef.value.miniappcard_obj)
  vhtml = replaceMPVContentToWechat(vhtml, mpExsRef.value.mpvcontent_obj)

  currentArticleRef.value.content_noencode = vhtml

  console.log("abc",currentArticleRef.value)
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
  const mpvcontent_obj = toDeepRaw(mpExsRef.value.mpvcontent_obj)
  targetItems.forEach(v => {
    if (hasMPCardInEditor(v.content_noencode)) {
      v.content_noencode = replaceMPCardToWechat(v.content_noencode, mps_obj)
    }
    if (hasMiniAppCardInEditor(v.content_noencode)) {
      v.content_noencode = replaceMiniAppCardToWechat(v.content_noencode, miniappcard_obj)
    }
    if (hasMPVContentInEditor(v.content_noencode)) {
      v.content_noencode = replaceMPVContentToWechat(v.content_noencode, mpvcontent_obj)
    }
  })
}

const validateMsgData = () => {
  return mp_msgsRef.value.every(v => {
    if ([8, 10].includes(v.item_show_type)) return true
    if (!v.title) {
      ElMessage({
        message: `请输入标题`,
        type: 'error',
        duration: 2 * 1000
      })
      return false
    }
    if (!v.cdn_url) {
      ElMessage({
        message: `请设置封面图`,
        type: 'error',
        duration: 2 * 1000
      })
      return false
    }
    return true
  })
}

const warningMsg = ref(null)
const lastSaveTime = ref('')
const automaticSaveExamine = () => {
  if (!selectedAccount.value) {
    warningMsg.value = '发布的公众账号不存在'
    return false;
  }
  return mp_msgsRef.value.every(v => {
    if ([8, 10].includes(v.item_show_type)) return true
    if (!v.title) {
      warningMsg.value = '未设置标题'
      return false
    }
    if (!v.cdn_url) {
      warningMsg.value = '未设置封面'
      return false
    }
    return true
  })
}
const automaticSave = async (push_to_remote) => {
  // 检查是否添加了标题和封面
  if (!automaticSaveExamine()) {
    return
  }

  const { token, session_id, wechat_id } = selectedAccount.value
  if (!session_id) {
    warningMsg.value = apperrmsg.invalid_session
    return
  }

  const msg_id = msg_idRef.value
  let selected_idx = saveCurrentToList(msg_id)
  saveOthersToListForCustomTag(msg_id)

  let appmsgid = _getAppMsgId()

  const material_list = mp_msgsRef.value.map((item) => {
    // 清空文章中的垂直制表符，防止出现空白行
    if(item.content_noencode) {
      item.content_noencode = item.content_noencode.replace(/<p>\u000b<\/p>$/, '')
    }
    // 小绿书处理有图片和无图片的类型
    if([8, 10].includes(item.item_show_type)) {
      if (item.cdn_url === '' && !item.picture_page_info_list?.length){
        item.item_show_type = 10
        item.content_noencode = item.guide_words
      } else {
        item.item_show_type = 8
        if(item.cdn_url == null || item.cdn_url === ''){
          item.cdn_url = item.picture_page_info_list[0].url
        }
      }
    }
    return item
  })
  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    material_list: toRaw(material_list),
    wechat_id,
    push_to_remote,
  }

  await saveAppMsg(postData).then(async (res) => {
    res.data.data.mp_msgs.forEach(gen_picture_page_info_list)
    mp_msgsRef.value = res.data.data.mp_msgs.map((item, index)=>({
      ...item,
      content_noencode: mp_msgsRef.value[index].content_noencode
    }))
    normalizeClaimSourceInfo(res.data.data.mp_msgs)


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

    lastSaveTime.value = new Date().toTimeString().slice(0, 8)
    warningMsg.value = ''
  }).catch((e) => {
    console.log('saveAppMsg catched e:', e)
    warningMsg.value = e
    console.log("=========")
  })
}
const throttle = (fn, delay = 200) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}
const throttledAutoSave = throttle(automaticSave, 5000) // 只创建一次
watch(()=>currentArticleRef.value.content_noencode,()=>{
  throttledAutoSave(0)
})

const _saveAppMsg = async (push_to_remote) => {
  if (!validateAccount()) {
    return false
  }

  // 检查是否添加了标题和封面
  if (!validateMsgData()) {
    return false
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
    return false
  }

  const msg_id = msg_idRef.value
  let selected_idx = saveCurrentToList(msg_id)
  saveOthersToListForCustomTag(msg_id)

  // const appmsgid =  appmsgidRef.value
  let appmsgid = _getAppMsgId()

  const material_list = mp_msgsRef.value.map((item) => {
    // 清空文章中的垂直制表符，防止出现空白行
    if(item.content_noencode) {
      item.content_noencode = item.content_noencode.replace(/<p>\u000b<\/p>$/, '')
    }
    // 小绿书处理有图片和无图片的类型
    if([8, 10].includes(item.item_show_type)) {
      if (item.cdn_url === '' && !item.picture_page_info_list?.length){
        item.item_show_type = 10
        item.content_noencode = item.guide_words
      } else {
        item.item_show_type = 8
        if(item.cdn_url == null || item.cdn_url === ''){
          item.cdn_url = item.picture_page_info_list[0].url
        }
      }
    }
    return item
  })
  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    material_list: toRaw(material_list),
    wechat_id,
    push_to_remote,
  }
  console.log("save appmsg postData=>", postData)
  // return
  const loader = ElLoading.service({
    target: '.main'
  })

  let saveSuccess = false
  await saveAppMsg(postData).then(async (res) => {
    ElMessage({
      message: `消息${push_to_remote === 0 ? "暂存" : "同步"}成功`,
      type: 'success',
      duration: 2 * 1000
    })
    res.data.data.mp_msgs.forEach(gen_picture_page_info_list)
    normalizeClaimSourceInfo(res.data.data.mp_msgs)
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
    saveSuccess = true
  }).catch((e) => {
    console.log('saveAppMsg catched e:', e)
    handleActionErr(name, e)
    console.log("=========")
  }).finally(() => {
    loader.close()
  })

  return saveSuccess
}

const handleSaveAppMsg = async () => {
  await _saveAppMsg(0)
}

const handleSyncToWechatDraftBox = async () => {
  const publish_flag = currentAppmsgRef.value.publish_flag;
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
  if (!currentArticleRef.value.cdn_url && ![8,10].includes(currentArticleRef.value.item_show_type)) return
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
    console.log('打印是否是原创',stepRet)
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

// 原创性检测处理函数
const handleCopyrightCheck = async () => {
  // 先同步到微信草稿箱，确保检测的是最新内容
  const saveResult = await _saveAppMsg(1)

  // 如果保存失败（包括验证失败，如未设置封面图），则不继续执行
  if (!saveResult) {
    return
  }

  const appmsgid = _getAppMsgId()

  if (!appmsgid) {
    ElMessage.warning('请先保存文章')
    return
  }

  const { token, session_id } = selectedAccount.value
  if (!token || !session_id) {
    ElMessage.warning('账号信息不完整')
    return
  }

  // 打开弹窗并显示加载状态
  dialogCopyrightCheckVisibleRef.value = true
  copyrightCheckLoadingRef.value = true
  copyrightCheckResultRef.value = null
  copyrightCheckListRef.value = []

  let stepRet
  try {
    await stat_appmsg_copyright_stat_events({
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      appmsgid,
    }, (data) => {
      console.log("copyright check raw=>", data)
      try {
        const v = data.replaceAll(/data: /gi, "")
        stepRet = JSON5.parse(v)
      } catch (e) {
        console.error("检测数据解析失败", e)
      }
    })

    copyrightCheckLoadingRef.value = false

    if (stepRet) {
      copyrightCheckResultRef.value = stepRet

      // copyright === 1 表示有原创问题，需要解析未通过原因列表
      if (stepRet.copyright === 1 && stepRet.list_json_str) {
        try {
          const copyright1_list = JSON.parse(stepRet.list_json_str)
          copyrightCheckListRef.value = copyright1_list.list || []
        } catch (e) {
          console.error("解析检测结果列表失败", e)
        }
      }
    } else {
      ElMessage.error('检测失败，请重试')
      dialogCopyrightCheckVisibleRef.value = false
    }
  } catch (error) {
    console.error("原创性检测失败", error)
    copyrightCheckLoadingRef.value = false
    ElMessage.error('检测失败，请重试')
    dialogCopyrightCheckVisibleRef.value = false
  }
}

const htmlToPlainText = (value) => {
  if (!value) return ''
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const buildArticleCheckText = (article) => {
  if (!article) return ''
  const segments = []
  const plainFields = ['title', 'digest', 'abstract', 'guide_words']
  plainFields.forEach((field) => {
    const value = article[field]
    if (value) {
      segments.push(htmlToPlainText(value))
    }
  })
  const content = article.content_noencode || article.content || ''
  if (content) {
    segments.push(htmlToPlainText(content))
  }
  return segments.join('\n').replace(/\s+/g, ' ').trim()
}

const getSelectedCustomWords = () => {
  if (!Array.isArray(selectedSensitiveCustomGroupRef.value) || !selectedSensitiveCustomGroupRef.value.length) {
    return []
  }
  const words = new Set()
  const groupMap = new Map(sensitiveKeywordGroupsRef.value.map((item) => [item.id, item.words || []]))
  selectedSensitiveCustomGroupRef.value.forEach((value) => {
    const groupId = typeof value === 'number' ? value : Number(value)
    if (Number.isInteger(groupId) && groupMap.has(groupId)) {
      const groupWords = groupMap.get(groupId) || []
      groupWords.forEach((word) => {
        if (word) {
          words.add(String(word))
        }
      })
    }
  })
  return Array.from(words)
}

const matchCustomWordsInText = (text, words) => {
  if (!text || !words.length) return []
  const matches = new Set()
  words.forEach((word) => {
    if (!word) return
    if (text.includes(word)) {
      matches.add(word)
    }
  })
  return Array.from(matches)
}

const runSensitiveWordCheck = async () => {
  sensitiveCheckLoadingRef.value = true
  console.log("mp_msgsRef",mp_msgsRef.value)
  try {
    if (!sensitiveManageLoadedOnceRef.value) {
      await fetchSensitiveWordGroups()
    }
    const articlesRaw = toDeepRaw(mp_msgsRef.value) || []
    if (!articlesRaw.length) {
      sensitiveCheckDraftsRef.value = []
      return
    }

    const customWords = getSelectedCustomWords()
    const articlePayloads = articlesRaw.map((item, index) => {
      const text = buildArticleCheckText(item)
      return {
        id: item.msg_id ?? item.id ?? index,
        label: `第${index + 1}稿`,
        title: item.title || '',
        description: item.digest || item.abstract || '',
        text,
      }
    })

    const results = await Promise.all(articlePayloads.map(async (article) => {
      let backendWords = []
      if (article.text) {
        const response = await checkSensitiveWords({ text: article.text })
        backendWords = response?.data?.sensitive_words || []
      }
      const customMatches = matchCustomWordsInText(article.text, customWords)
      const words = Array.from(new Set([...backendWords, ...customMatches]))
      return {
        id: article.id,
        label: article.label,
        title: article.title,
        description: article.description,
        words,
      }
    }))

    sensitiveCheckDraftsRef.value = results
  } catch (error) {
    console.error('敏感词检测失败', error)
    const message = error?.response?.data?.detail || error?.message || '敏感性检测失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    sensitiveCheckLoadingRef.value = false
  }
}

const handleSensitiveCheck = async () => {
  // 先同步当前编辑的文章内容到 mp_msgsRef
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_idRef.value)
  if (idx !== -1) {
    mp_msgsRef.value[idx] = { ...mp_msgsRef.value[idx], ...currentArticleRef.value }
  }

  dialogSensitiveCheckVisibleRef.value = true
  await nextTick()
  await runSensitiveWordCheck()
}

const handleSensitiveRetry = async () => {
  // 先同步当前编辑的文章内容到 mp_msgsRef
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_idRef.value)
  if (idx !== -1) {
    mp_msgsRef.value[idx] = { ...mp_msgsRef.value[idx], ...currentArticleRef.value }
  }

  await runSensitiveWordCheck()
}

const handleRemoveSensitiveWord = (draftId, word) => {
  sensitiveCheckDraftsRef.value = sensitiveCheckDraftsRef.value.map((item) => {
    if (item.id !== draftId) return item
    return {
      ...item,
      words: item.words.filter((w) => w !== word)
    }
  })
}

// 处理敏感词的辅助函数
const processSensitiveWords = (text, words, strategy, customChar = '') => {
  if (!text || !words.length) return text

  let processedText = text

  switch (strategy) {
    case 'none':
      return processedText
    case 'remove':
      words.forEach(word => {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        processedText = processedText.replace(regex, '')
      })
      break
    case 'replace':
      words.forEach(word => {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        processedText = processedText.replace(regex, customChar)
      })
      break
    case 'insert':
      words.forEach(word => {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        const chars = word.split('')
        const replacement = chars.join(customChar)
        processedText = processedText.replace(regex, replacement)
      })
      break
  }

  return processedText
}

const handleSensitiveDialogConfirm = async () => {
  const strategy = sensitiveHandleStrategyRef.value
  const customChar = sensitiveCustomCharRef.value || ''

  if (strategy === 'none') {
    dialogSensitiveCheckVisibleRef.value = false
    return
  }

  try {
    // 处理每篇稿件中的敏感词
    sensitiveCheckDraftsRef.value.forEach(draft => {
      const articleIndex = mp_msgsRef.value.findIndex(item => item.msg_id === draft.id)
      if (articleIndex !== -1) {
        const article = mp_msgsRef.value[articleIndex]

        // 处理标题
        if (article.title) {
          article.title = processSensitiveWords(article.title, draft.words, strategy, customChar)
        }

        // 处理摘要
        if (article.digest) {
          article.digest = processSensitiveWords(article.digest, draft.words, strategy, customChar)
        }

        // 处理正文内容
        if (article.content_noencode) {
          article.content_noencode = processSensitiveWords(article.content_noencode, draft.words, strategy, customChar)
        }

        // 更新到 currentArticleRef（如果当前正在编辑这篇文章）
        if (msg_idRef.value === draft.id) {
          currentArticleRef.value = { ...article }
        }
      }
    })

    ElMessage.success('敏感词处理完成')
    dialogSensitiveCheckVisibleRef.value = false
  } catch (error) {
    console.error('敏感词处理失败', error)
    ElMessage.error('敏感词处理失败，请重试')
  }
}

const updateSensitiveGroupOptions = (groups) => {
  sensitiveCustomGroupOptionsRef.value = [
    ...baseSensitiveGroupOptions,
    ...groups.map((item) => ({
      label: item.name,
      value: item.id,
    })),
  ]
}

const fetchSensitiveWordGroups = async () => {
  sensitiveManageLoadingRef.value = true
  try {
    const { data } = await listSensitiveWordGroups({
      keyword: sensitiveManageKeywordQueryRef.value || undefined,
      only_self: sensitiveManageOnlyMineRef.value,
      page: sensitiveManagePaginationRef.page,
      page_size: sensitiveManagePaginationRef.pageSize,
    })
    const payload = data?.data || {}
    sensitiveKeywordGroupsRef.value = payload.list || []
    sensitiveManagePaginationRef.total = payload.total || 0
    sensitiveManagePaginationRef.page = payload.page || sensitiveManagePaginationRef.page
    sensitiveManagePaginationRef.pageSize = payload.page_size || sensitiveManagePaginationRef.pageSize
    updateSensitiveGroupOptions(sensitiveKeywordGroupsRef.value)
    sensitiveManageLoadedOnceRef.value = true
    if (Array.isArray(selectedSensitiveCustomGroupRef.value)) {
      const preservedValues = selectedSensitiveCustomGroupRef.value.filter((value) => {
        if (typeof value === 'number') {
          return sensitiveKeywordGroupsRef.value.some((item) => item.id === value)
        }
        return true
      })
      if (preservedValues.length !== selectedSensitiveCustomGroupRef.value.length) {
        selectedSensitiveCustomGroupRef.value = preservedValues
      }
    }
  } catch (error) {
    console.error('加载敏感词组失败', error)
    const message = error?.response?.data?.detail || '加载敏感词组失败'
    ElMessage.error(message)
  } finally {
    sensitiveManageLoadingRef.value = false
  }
}

const handleOpenSensitiveManage = async () => {
  dialogSensitiveManageVisibleRef.value = true
}

const resetSensitiveManageEditForm = (payload = null) => {
  sensitiveManageEditFormRef.id = payload?.id ?? ''
  sensitiveManageEditFormRef.name = payload?.name ?? ''
  sensitiveManageEditFormRef.description = payload?.description ?? ''
  sensitiveManageEditFormRef.words = payload?.words?.join?.('\n') ?? ''
  sensitiveManageEditFormRef.createdAt = payload?.createdAt ?? ''
  sensitiveManageEditFormRef.isPrivate = payload?.isPrivate ?? true
}

const handleSensitiveManageCreate = () => {
  sensitiveManageEditIsNewRef.value = true
  resetSensitiveManageEditForm({
    id: '',
    name: '',
    description: '',
    words: [],
    createdAt: '',
    isPrivate: true,
  })
  dialogSensitiveManageEditVisibleRef.value = true
}

const handleSensitiveManageEdit = (row) => {
  sensitiveManageEditIsNewRef.value = false
  resetSensitiveManageEditForm(row)
  dialogSensitiveManageEditVisibleRef.value = true
}

const handleSensitiveManageDelete = (row) => {
  ElMessageBox.confirm(`确定删除敏感词组「${row.name}」吗？`, '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteSensitiveWordGroup(row.id)
      ElMessage.success('删除成功')
      if (Array.isArray(selectedSensitiveCustomGroupRef.value)) {
        selectedSensitiveCustomGroupRef.value = selectedSensitiveCustomGroupRef.value.filter((id) => id !== row.id)
      }
      if (
        sensitiveKeywordGroupsRef.value.length === 1 &&
        sensitiveManagePaginationRef.page > 1
      ) {
        sensitiveManagePaginationRef.page -= 1
      }
      await fetchSensitiveWordGroups()
    } catch (error) {
      console.error('删除敏感词组失败', error)
      const message = error?.response?.data?.detail || '删除敏感词组失败'
      ElMessage.error(message)
    }
  }).catch(() => {})
}

const handleSensitiveManageEditCancel = () => {
  dialogSensitiveManageEditVisibleRef.value = false
}

const parseSensitiveWordsInput = (value) => {
  return value
    .split('\n')
    .map((word) => word.trim())
    .filter(Boolean)
}

const handleSensitiveManageEditConfirm = async () => {
  if (!sensitiveManageEditFormRef.name.trim()) {
    ElMessage.warning('请填写敏感词组名称')
    return
  }

  const words = parseSensitiveWordsInput(sensitiveManageEditFormRef.words)

  const payload = {
    name: sensitiveManageEditFormRef.name.trim(),
    description: (sensitiveManageEditFormRef.description || '').trim(),
    words,
    is_private: sensitiveManageEditFormRef.isPrivate,
  }

  sensitiveManageEditSubmittingRef.value = true
  try {
    let response
    if (sensitiveManageEditIsNewRef.value || !sensitiveManageEditFormRef.id) {
      response = await createSensitiveWordGroup(payload)
      ElMessage.success('创建成功')
    } else {
      response = await updateSensitiveWordGroup(sensitiveManageEditFormRef.id, payload)
      ElMessage.success('更新成功')
    }
    const groupData = response?.data?.data
    if (groupData?.id) {
      if (!Array.isArray(selectedSensitiveCustomGroupRef.value)) {
        selectedSensitiveCustomGroupRef.value = []
      }
      if (!selectedSensitiveCustomGroupRef.value.includes(groupData.id)) {
        selectedSensitiveCustomGroupRef.value = [...selectedSensitiveCustomGroupRef.value, groupData.id]
      }
    }
    dialogSensitiveManageEditVisibleRef.value = false
    await fetchSensitiveWordGroups()
  } catch (error) {
    console.error('保存敏感词组失败', error)
    const message = error?.response?.data?.detail || '保存敏感词组失败'
    ElMessage.error(message)
  } finally {
    sensitiveManageEditSubmittingRef.value = false
  }
}

const handleSensitiveManagePageChange = (page) => {
  sensitiveManagePaginationRef.page = page
  fetchSensitiveWordGroups()
}

const triggerSensitiveManageSearch = debounce(() => {
  if (dialogSensitiveManageVisibleRef.value) {
    fetchSensitiveWordGroups()
  }
}, 300)

watch(dialogSensitiveManageVisibleRef, (visible) => {
  if (visible) {
    sensitiveManagePaginationRef.page = 1
    fetchSensitiveWordGroups()
  }
})

watch(sensitiveManageOnlyMineRef, () => {
  sensitiveManagePaginationRef.page = 1
  if (dialogSensitiveManageVisibleRef.value) {
    fetchSensitiveWordGroups()
  }
})

watch(sensitiveManageKeywordQueryRef, () => {
  sensitiveManagePaginationRef.page = 1
  triggerSensitiveManageSearch()
})

watch(dialogSensitiveManageEditVisibleRef, (visible) => {
  if (!visible) {
    sensitiveManageEditSubmittingRef.value = false
  }
})

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
  console.log('打印otherAccountsChoosedRef的值', otherAccountsChoosedRef);
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
    try {
      const v = data.replaceAll(/data: /gi, "")
      stepRet = JSON5.parse(v)
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

// const triggerFileInput = () => {
//   cdnFileInputRef.value.click()
// }

// const handleImage = async (e) => {
//   const selectedImage = e.target.files[0]; // get first file
//   if (selectedImage) {
//     await createBase64Image(selectedImage);
//   } else {
//     selectedCdnImageRef.value = null
//     cdnFileInputRef.value.value = ""
//   }
// }

const checkTitles = () => {

  globalLoadingRef.value = true
  const { token, session_id, name } = selectedAccount.value
  const titles = mp_msgsRef.value.map(v => v.title)
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:searchAppmsgsInPublishForQuerys',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    type: 'examine_title',
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

const runEditorCMD = (cmd) => {
  if (!['cleardoc'].includes(cmd)) return
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;
  editor.execCommand(cmd)
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

  extractLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:localExtractMpArticleUrl',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    extractArticleUrl: extractArticleUrlRef.value,
  })

  setTimeout(() => {
    extractLoadingRef.value = false
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
  extractLoadingRef.value = true
  // await newArticle(true, item.type)
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:batchExtractMpArticleUrls',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    extractArticleUrls: list.map(item => item.url),
  })

  setTimeout(() => {
    extractLoadingRef.value = false
    dialogExtractMpAritcleUrlRef.value = false
  }, timeoutExtract * list.length)
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

const openMPVDialog = () => {
  setMPVRef.value.openDialog()
}

const searchMPV = (val) => {
  const { type, username, query, ...others } = val
  const { token, session_id, wechat_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  let tag
  if (type == "account") {
    tag = 'mpv:searchMpvAccount'
  } else if (type == "video") {
    tag = 'mpv:searchMpvVideo'
  } else if (type == "live") {
    tag = 'mpv:searchMpvLive'
  }
  console.log("tag=>", tag)
  if (!tag) return
  window.ipcRenderer.send('toMain', {
      tag: tag,
      source: `${props.appmsg.appmsgid}`,
      token: getToken(),
      wechat_id,
      searchData: {
        cookies,
        token: parseInt(token),
        pattern: query,
        username: username,
        count: 10,
      },
      ...others,
    })
}

const insertMPVContent = (val) => {
  const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
  if (editor == null) return;
  // val is array
  const htmls = []
  const insert_mpvcontent_obj = {}
  val.forEach((v) => {
    const uniqid = gen_unique_id()
    console.log("v=>", v)
    insert_mpvcontent_obj[uniqid] = v
    htmls.push(tplMPVContentInEditor(uniqid, v))
  })
  console.log("insert_mpvcontent_obj=>", insert_mpvcontent_obj)
  mpExsRef.value.mpvcontent_obj = {...mpExsRef.value.mpvcontent_obj, ...insert_mpvcontent_obj}
  editor.execCommand('inserthtml', htmls.join(''));
  setMPVRef.value.closeDialog()
}

// 公众号链接相关方法
const openMPLinkDialog = () => {
  insertMPLinkRef.value.openDialog()
  // 打开对话框后自动搜索最新文章（使用空查询）
  setTimeout(() => {
    searchArticle({ query: '', mp: null })
  }, 100)
}

const searchMPForLink = (val) => {
  const { query, ...others } = val
  const { token, session_id, wechat_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  window.ipcRenderer.send('toMain', {
    tag: 'mp:searchBizForLink',
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

const searchArticle = async (val) => {
  console.log("searchArticle val=>", val);

  const { query, mp } = val
  try {

    globalLoadingRef.value = true
    const { token, session_id } = selectedAccount.value
    console.log("当前选中草稿的账号",selectedAccount.value);
    console.log("搜索的公众号 mp=>", mp);

    const cookies = serializeCookie(JSON.parse(session_id)["cookie"])

    // 如果选择了其他公众号，使用其 fakeid
    const fakeid = mp ? mp.fakeid : undefined

    if (query && query.trim()) {
      // 有查询词，使用搜索接口
      window.ipcRenderer.send('toMain', {
        tag: 'appmsg:searchAppmsgsInPublishForQuerys',
        source: `${props.appmsg.appmsgid}`,
        token: getToken(),
        type: 'insert_link',
        getData: {
          cookies: cookies,
          token: parseInt(token),
          querys: [query.trim()],
          begin: 0,
          fakeid: fakeid
        }
      })
    } else {
      // 无查询词，使用列表接口获取最新文章
      window.ipcRenderer.send('toMain', {
        tag: 'appmsg:listAppmsgsInPublishForQuerys',
        source: `${props.appmsg.appmsgid}`,
        token: getToken(),
        listData: {
          cookies: cookies,
          token: parseInt(token),
          querys: [''],  // 空查询获取所有文章
          begin: 0,
          count: 20,
          fakeid: fakeid
        }
      })
    }

    // 设置超时取消加载状态
    setTimeout(() => {
      if (globalLoadingRef.value) {
        globalLoadingRef.value = false
      }
    }, 10000)
  } catch (error) {
    console.error('搜索文章失败:', error)
    ElMessage.error('搜索文章失败')
    globalLoadingRef.value = false
  }
}

// 解析已发布文章列表
const parsePublishedArticles = (publishList) => {
  const articles = []

  publishList.forEach(item => {
    try {
      const publishData = JSON.parse(item.publish_info)
      const appmsgInfoList = publishData.appmsg_info || []

      // 获取发布时间：publish_type=1 用 publish_info.create_time，publish_type=101 用 sent_info.time
      let publishTime = ''
      if (item.publish_type === 1 && publishData.publish_info) {
        publishTime = new Date(publishData.publish_info.create_time * 1000).toLocaleString('zh-CN')
      } else if (item.publish_type === 101 && publishData.sent_info) {
        publishTime = new Date(publishData.sent_info.time * 1000).toLocaleString('zh-CN')
      }

      // 过滤掉已删除的文章
      appmsgInfoList.forEach(appmsgInfo => {
        if (!appmsgInfo.is_deleted) {
          articles.push({
            msg_id: publishData.msgid,
            appmsgid: appmsgInfo.appmsgid,
            title: appmsgInfo.title,
            digest: appmsgInfo.digest,
            cdn_url: appmsgInfo.cover || appmsgInfo.pic_cdn_url_235_1,
            content_url: appmsgInfo.content_url,
            update_time: publishTime,
            itemidx: appmsgInfo.itemidx
          })
        }
      })
    } catch (e) {
      console.error('解析 publish_info 失败:', e, item)
    }
  })

  return articles
}

const selectCurrentArticles = () => {
  // 将当前编辑的文章列表设置到对话框中
  if (mp_msgsRef.value && mp_msgsRef.value.length > 0) {
    insertMPLinkRef.value.setArticles(mp_msgsRef.value)
  } else {
    ElMessage.warning('当前没有文章')
  }
}

const insertMPLink = (linkData) => {
  const editor = editorRef.value
  if (editor == null) return

  const { displayType, templateType, linkTitle, customImage, articles } = linkData

  // 处理模板模式
  if (displayType === 'template' && templateType === 'modern') {
    // 现代风格：生成整体容器包裹所有文章
    let articlesHtml = ''
    articles.forEach((article) => {
      const title = linkTitle ? linkTitle : article.title
      const contentUrl = article.content_url || '#'
      const imageUrl = customImage || article.cdn_url

      articlesHtml += `<a href="${contentUrl}" target="_blank"><section style="display: flex;border-top: 1px solid #e9e9e9;padding: 14px; margin-bottom: 8px;"><span style="align-self: flex-start;width: 48px; margin-right: 15px;"><section style="background: url(${imageUrl});background-size: cover;width: 48px;height: 48px;"></section></span><section style="font-size: 14px; vertical-align: top;height: 48px;line-height: 24px;overflow: hidden;">${title}</section></section></a>`
    })

    const finalHtml = `<section style="padding: 20px;border: 1px solid #e9e9e9; margin-top: 20px;"><section style="font-size: 14px;padding-left: 10px;border-left: 4px solid #F5222D;margin-bottom: 20px;">更多推荐</section>${articlesHtml}</section><p></p>`

    editor.execCommand('inserthtml', finalHtml)
    ElMessage.success(`成功插入 ${articles.length} 篇文章链接`)
    return
  }

  // 往期推荐模板
  if (displayType === 'template' && templateType === 'past-recommend') {
    let articlesHtml = ''
    articles.forEach((article, index) => {
      const title = linkTitle ? linkTitle : article.title
      const contentUrl = article.content_url || '#'
      const num = index + 1

      articlesHtml += `<section class="box-edit"><a href="${contentUrl}" target="_blank" style="text-decoration: none; color: inherit;"><section style="box-shadow:0px 0px 5px #e5e5e5 ;height:65px;${index > 0 ? 'margin: 10px auto;' : ''}"><section style="display: flex;justify-content: flex-start;align-items: center;"><section style="width:60px;height: 65px;box-sizing:border-box;"><section class="135brush" data-brushtype="text" style="background: #6f8691;border-top-left-radius:7px;border-bottom-left-radius: 7px;border-top-right-radius: 100%;border-bottom-right-radius: 100%;color:#fff; font-size:18px;letter-spacing:1.5px;width:60px;height: 65px;font-size: 20px; line-height:63px;text-align: center;box-sizing:border-box;"><strong>0<span class="autonum" data-original-title="" title="" data-num="${num}">${num}</span></strong></section></section><section class="135brush" data-brushtype="text" style="padding:0px 0.4em 0px 0.5em;font-size: 16px;letter-spacing: 1.5px;color: #71868f;box-sizing:border-box;"><p style="vertical-align:inherit;">${title}</p></section></section></section></a></section>`
    })

    const finalHtml = `<section class="_135editor" itemscope="" itemtype="https://mp.weixin.qq.com/voc/Guide" data-id="93971" data-tools="135编辑器"><section style="padding:1em;box-sizing:border-box;"><section style="display: flex;justify-content:center;margin: 1em auto;align-items: center;"><section><section data-bgless="spin" data-bglessp="280" data-bgopacity="1%" style="width:1.2em;height:1.2em;border-radius:100% ;background:#b3c0c6;margin-bottom: -20px;box-sizing:border-box;"></section><section data-bgless="spin" data-bglessp="280" data-bgopacity="1%" style="width:6px;height:6px;border-radius:100% ;background:#b3c0c6;margin-left:1.4em;box-sizing:border-box;"></section><section data-bgless="spin" data-bglessp="280" data-bgopacity="50%" style="width:2.5em;height:2.5em;border-radius:100% ;background:rgba(179,192,198,0.6);margin-left: 10px;box-sizing:border-box;"></section></section><section class="135brush" data-brushtype="text" style="margin-left:-1em;text-align:center;font-size: 20px;letter-spacing:2px;color: #71868f;">往期推荐</section></section>${articlesHtml}</section></section><p></p>`

    editor.execCommand('inserthtml', finalHtml)
    ElMessage.success(`成功插入 ${articles.length} 篇文章链接`)
    return
  }

  // 往期推荐2模板
  if (displayType === 'template' && templateType === 'past-recommend2') {
    let articlesHtml = ''
    articles.forEach((article, index) => {
      const title = linkTitle ? linkTitle : article.title
      const contentUrl = article.content_url || '#'
      const marginTop = index === 0 ? '10px' : '5px'

      articlesHtml += `<p class="box-edit" style="vertical-align:inherit;margin-top: ${marginTop};margin-bottom: 5px;padding-right: 0em;padding-left: 0em;letter-spacing: 1.5px;line-height: normal;color: #888888;font-size: 13px;text-align:justify;" align="justify"><a href="${contentUrl}" target="_blank" style="color: #888888; text-decoration: none;">●${title}</a></p>`
    })

    const finalHtml = `<section class="_135editor" data-tools="135编辑器" data-id="93709"><section style="border-style: solid; border-width: 2px; padding: 5px; box-sizing: border-box;" itemscope="" itemtype="https://mp.weixin.qq.com/voc/Guide"><section style="border-style: dashed;border-width: 1px;padding: 15px;box-sizing: border-box;"><section style="text-align: center;"><span data-role="width" style="display:inline-block;width:80%;box-sizing:border-box;max-width:80% !important;" data-width="80%"><img class="assistant" src="https://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9naWYvN1FSVHZrSzJxQzdJSEFCRm11TWxXUWtTU3pPTWljaWNmQkxmc2RJamtPbkR2c3N1NlpueDRUVFBzSDh5WlpOWjE3aFNiRDk1d3c0M2ZzNU9GRXBwUlRXZy8wP3d4X2ZtdD1naWY=" style="margin: 0px; width: 100%;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" data-width="80%" data-op="change" width="80%" height="" border="0" mapurl="" title="" alt="" draggable="false" data-ratio="0.08658008658008658" data-w="462"/></span></section><section>${articlesHtml}</section></section></section></section><p></p>`

    editor.execCommand('inserthtml', finalHtml)
    ElMessage.success(`成功插入 ${articles.length} 篇文章链接`)
    return
  }

  // 其他模式：逐个生成HTML
  const htmlArray = []

  articles.forEach((article, index) => {
    // 如果用户输入了自定义标题，使用自定义标题；否则使用文章原标题
    const title = linkTitle ? linkTitle : article.title
    const contentUrl = article.content_url || '#'
    // 图片优先级：自定义图片 > 文章封面
    const imageUrl = customImage || article.cdn_url

    let html = ''
    if (displayType === 'text') {
      // 文字链接
      html = `<a target="_blank" href="${contentUrl}" textvalue="${title}" linktype="text" imgurl="" imgdata="null" data-itemshowtype="0" tab="innerlink" data-linktype="2">${title}</a>`
    } else if (displayType === 'image') {
      // 图片链接
      if (imageUrl) {
        html = `<a href="${contentUrl}" imgurl="${imageUrl}" linktype="image" tab="innerlink" data-itemshowtype="0" target="_blank" data-linktype="1"><span class="js_jump_icon h5_image_link"><img src="${imageUrl}" class="rich_pages wxw-img" contenteditable="false" draggable="true" referrerpolicy="no-referrer"></span></a>`
      } else {
        console.warn(`文章 ${article.title} 没有封面图且未设置自定义图片`)
        return
      }
    } else if (displayType === 'template') {
      // 其他模板样式
      if (templateType === 'classic') {
        // 经典风格：方正、边框、简洁
        html = `
          <a target="_blank" href="${contentUrl}" textvalue="${title}" linktype="template" imgurl="${imageUrl || ''}" imgdata="null" data-itemshowtype="0" tab="innerlink" data-linktype="2" style="text-decoration: none; color: inherit;">
            <div style="border: 1px solid #d9d9d9; border-radius: 2px; padding: 10px; margin: 10px 0; display: flex; align-items: center; background: #ffffff;">
              ${imageUrl ? `<img src="${imageUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 2px; margin-right: 10px; border: 1px solid #eee;" referrerpolicy="no-referrer"/>` : ''}
              <div style="flex: 1;">
                <div style="font-weight: 500; margin-bottom: 5px; font-size: 14px; color: #000;">${title}</div>
                <div style="font-size: 12px; color: #888;">${article.update_time || ''}</div>
              </div>
            </div>
          </a>
        `
      } else if (templateType === 'simple') {
        // 简约风格：无边框、极简
        html = `
          <a target="_blank" href="${contentUrl}" textvalue="${title}" linktype="template" imgurl="${imageUrl || ''}" imgdata="null" data-itemshowtype="0" tab="innerlink" data-linktype="2" style="text-decoration: none; color: inherit;">
            <div style="border: none; border-bottom: 1px solid #f0f0f0; padding: 12px 0; margin: 0; display: flex; align-items: center; background: transparent;">
              ${imageUrl ? `<img src="${imageUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 12px;" referrerpolicy="no-referrer"/>` : ''}
              <div style="flex: 1;">
                <div style="font-weight: 400; margin-bottom: 4px; font-size: 14px; color: #333;">${title}</div>
                <div style="font-size: 11px; color: #aaa;">${article.update_time || ''}</div>
              </div>
            </div>
          </a>
        `
      }
    }

    if (html) {
      htmlArray.push(html)
    }
  })

  if (htmlArray.length === 0) {
    ElMessage.warning('没有可插入的内容')
    return
  }

  // 将所有HTML用换行符连接起来插入
  const finalHtml = htmlArray.join('<br/>')
  editor.execCommand('inserthtml', finalHtml)
  ElMessage.success(`成功插入 ${htmlArray.length} 篇文章链接`)
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
      const { ret } = msg.data
      console.log("ret=>", ret)
      extractLoadingRef.value = false
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
      // 视频号内容
      const mpvcontent_obj = toDeepRaw(mpExsRef.value.mpvcontent_obj)
      parsed_data.content_noencode = replaceMPVContentFromWechat(parsed_data.content_noencode, mpvcontent_obj)
      
      
      console.log("parsed_data.content_noencode=>", parsed_data.content_noencode)
      console.log("mps_obj=>", mps_obj)
      console.log("miniappcard_obj=>", miniappcard_obj)
      console.log("mpvcontent_obj=>", mpvcontent_obj)
      mpExsRef.value = {
        mps_obj: mps_obj,
        miniappcard_obj: miniappcard_obj,
        mpvcontent_obj: mpvcontent_obj,
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
      extractLoadingRef.value = false
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
      dialogExtractMpAritcleUrlRef.value = false

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
      const { ret, type } = msg.data
      const { success, items } = ret
      if (success) {
        switch (type) {
          case 'examine_title':
            // 标题检测
            checkTitleResults.value = items
            break;
          case 'insert_link':
            // 插入公众号链接
            const publishList = items[0]?.value?.publish_list || []
            const articles = parsePublishedArticles(publishList)
            insertMPLinkRef.value.setArticles(articles)
            break;
          default:
            console.log("appmsg-ret:searchAppmsgsInPublishForQuerys: 无type对应操作")
        }
      }
      globalLoadingRef.value = false

    } else if (tag === "appmsg-ret:listAppmsgsInPublishForQuerys") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { ret } = msg.data
      const { success, items } = ret
      if (success && items.length > 0) {
        // 获取文章列表并设置到对话框中
        const publishList = items[0]?.value?.publish_list || []
        const articles = parsePublishedArticles(publishList)
        console.log("※解析后的 articles=>※", articles)
        if (insertMPLinkRef.value) {
          insertMPLinkRef.value.setArticles(articles)
        }
      }
      globalLoadingRef.value = false

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
      } else {
        ElMessage({ type: 'error', message: ret.err_msg })
      }
    } else if (tag === "mp-ret:searchBiz") {
      const { ret } = msg.data
      // console.log("ret=>", ret)
      const { success, mps } = ret
      if (success) {
        setMPCardRef.value.setMPs(mps)
      } else {
        ElMessage({ type: 'error', message: ret.err_msg })
      }
    } else if (tag === "mp-ret:searchBizForLink") {
      const { ret } = msg.data
      const { success, mps } = ret
      if (success) {
        insertMPLinkRef.value.setMPs(mps)
      } else {
        ElMessage({ type: 'error', message: ret.err_msg })
      }
    } else if (tag==="mpv-ret:searchMpvAccount") {
      const { ret } = msg.data
      console.log("ret=>", ret)
      const { success, mpvs } = ret
      if (success) {
        setMPVRef.value.setMPVs('account', mpvs)
      }
    } else if (tag === "mpv-ret:searchMpvVideo") {
      const { ret } = msg.data
      console.log("ret=>", ret)
      const { success, mpv_videos } = ret
      if (success) {
        setMPVRef.value.setMPVs('video', mpv_videos)
      }
    } else if (tag === "mpv-ret:searchMpvLive") {
      const { ret } = msg.data
      console.log("ret=>", ret)
      const { success, mpv_lives } = ret
      if (success) {
        setMPVRef.value.setMPVs('live', mpv_lives)
      }
    } else if (tag === "appmsg-ret:getLinkInfo") {
      const { ret } = msg.data
      console.log("getLinkInfo ret=>", ret)
      claimSourceLinkLoadingRef.value = false
      if (ret.success && ret.detail_info) {
        const { biz_nickname, publish_time, biz_headimgurl } = ret.detail_info
        claimSourceAccountRef.value = biz_nickname || ''
        claimSourceAccountAvatarRef.value = biz_headimgurl || ''
        if (publish_time) {
          // 将时间戳转换为日期字符串，格式为 YYYY/MM/DD 以匹配日期选择器
          const date = new Date(publish_time * 1000)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          claimSourceTimeRef.value = `${year}/${month}/${day}`
        } else {
          claimSourceTimeRef.value = ''
        }
      } else {
        claimSourceAccountRef.value = ''
        claimSourceAccountAvatarRef.value = ''
        claimSourceTimeRef.value = ''
        if (!ret.success) {
          ElMessage.warning(ret.err_msg || '获取链接信息失败')
        }
      }
    }

    if (globalLoadingRef.value) {
      globalLoadingRef.value = false

    }
  }

})

// 文章拖拽
const { start } = useDraggable(elListMsgsRef, mp_msgsRef, {
  animation: 150,
  ghostClass: 'ghost'
})

// 事件地点相关
const eventLocationOpts = ref([])

// 获取地区数据的函数
async function fetchEventLocationData(id = 0) {
  try {
    if (!selectedAccount.value) {
      return []
    }
    const res = await window.webBridge.callRpc('getRegions', {
      account: selectedAccount.value ? toRaw(selectedAccount.value) : null,
      id: id
    })
    if (res?.success) {
      return res.data || []
    }
  } catch (error) {
    console.error('获取地区数据失败:', error)
  }
  return []
}

// 事件地点级联选择器配置
const eventLocationProps = {
  expandTrigger: 'click',
  checkStrictly: true, // 允许选择任意级别的节点
  lazy: true,
  lazyLoad: async (node, resolve) => {
    if (node.level === 0) {
      // 第一级：中国、国际、无确切地点
      const options = [
        { label: '中国', value: 'china', leaf: false },
        { label: '国际', value: 'international', leaf: false },
        { label: '无确切地点', value: 'no_location', leaf: true }
      ]
      resolve(options)
    } else if (node.level === 1) {
      // 第二级：根据第一级的选择加载数据
      if (node.value === 'china') {
        // 加载中国的省份，以及香港、澳门、台湾
        const regions = await fetchEventLocationData(0)
        console.log("regions",regions)
        const chinaRegion = regions.find(r => r.name === '中国')
        const hongkongRegion = regions.find(r => r.name === '中国香港')
        const macaoRegion = regions.find(r => r.name === '中国澳门')
        const taiwanRegion = regions.find(r => r.name === '中国台湾')
        
        const options = []
        
        // 添加香港、澳门、台湾（直接选择，leaf: true）
        if (hongkongRegion) {
          options.push({
            label: '香港', // 显示时去掉"中国"前缀
            value: hongkongRegion.name, // value 保持原值用于识别
            regionId: hongkongRegion.id,
            leaf: true // 直接选择，不加载下一级
          })
        }
        if (macaoRegion) {
          options.push({
            label: '澳门', // 显示时去掉"中国"前缀
            value: macaoRegion.name, // value 保持原值用于识别
            regionId: macaoRegion.id,
            leaf: true // 直接选择，不加载下一级
          })
        }
        if (taiwanRegion) {
          options.push({
            label: '台湾', // 显示时去掉"中国"前缀
            value: taiwanRegion.name, // value 保持原值用于识别
            regionId: taiwanRegion.id,
            leaf: true // 直接选择，不加载下一级
          })
        }
        
        // 加载中国的省份
        if (chinaRegion) {
          const provinces = await fetchEventLocationData(chinaRegion.id)
          // 直辖市列表：北京、上海、天津、重庆
          const municipalities = ['北京', '上海', '天津', '重庆']
          provinces.forEach(province => {
            const isMunicipality = municipalities.includes(province.name)
            options.push({
              label: province.name,
              value: province.name,
              regionId: province.id,
              leaf: isMunicipality // 直辖市直接选择，其他省份可以继续加载市
            })
          })
        }
        
        resolve(options)
      } else if (node.value === 'international') {
        // 加载国际地区（排除中国相关），直接选择，不加载下一级
        const regions = await fetchEventLocationData(0)
        const internationalRegions = regions.filter(r => 
          r.name !== '中国' && 
          r.name !== '中国台湾' && 
          r.name !== '中国澳门' && 
          r.name !== '中国香港'
        )
        const options = internationalRegions.map(region => ({
          label: region.name,
          value: region.name,
          regionId: region.id,
          leaf: true // 国际国家直接选择，不加载下一级
        }))
        resolve(options)
      } else {
        resolve([])
      }
    } else if (node.level === 2) {
      // 第三级：加载省份下的市（最多到市，设为leaf: true）
      const parentId = node.data?.regionId
      if (parentId) {
        const cities = await fetchEventLocationData(parentId)
        const options = cities.map(city => ({
          label: city.name,
          value: city.name,
          regionId: city.id,
          leaf: true // 市是最后一级，不能再往下
        }))
        resolve(options)
      } else {
        resolve([])
      }
    } else {
      // 超过第三级，不再加载
      resolve([])
    }
  }
}

// 处理来源文章链接变化
const handleClaimSourceLinkChange = () => {
  const link = claimSourceLinkRef.value?.trim()
  if (!link) {
    claimSourceAccountRef.value = ''
    claimSourceAccountAvatarRef.value = ''
    claimSourceTimeRef.value = ''
    return
  }
  
  // 检查是否是微信公众号文章链接
  if (!link.startsWith('https://mp.weixin.qq.com/s/')) {
    claimSourceAccountRef.value = ''
    claimSourceAccountAvatarRef.value = ''
    claimSourceTimeRef.value = ''
    return
  }
  
  // 调用接口获取链接信息
  if (!selectedAccount.value || !selectedAccount.value.session_id) {
    ElMessage.warning('请先选择账号')
    return
  }
  
  const { token, session_id } = selectedAccount.value
  const cookies = serializeCookie(JSON.parse(session_id)["cookie"])
  
  claimSourceLinkLoadingRef.value = true
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:getLinkInfo',
    source: `${props.appmsg.appmsgid}`,
    token: getToken(),
    linkData: {
      cookies,
      token: parseInt(token),
      link: link
    }
  })
}

// 使用默认模板触发，填充当前文章作者及来源链接
const handleUseTemplate = (data) => {
  currentArticleRef.value.sourceurl = data.originalLink
  currentArticleRef.value.author = data.author
}

// 自动排版功能
const handleAutoFormat = async () => {
  if (!currentArticleRef.value || !currentArticleRef.value.content_noencode) {
    ElMessage({
      message: '编辑器内容为空',
      type: 'warning',
      duration: 2000
    })
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在排版中，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 获取编辑器纯文本内容（去除HTML标签）
    const htmlContent = currentArticleRef.value.content_noencode || ''
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const textContent = tempDiv.innerText || tempDiv.textContent || ''
    
    if (!textContent.trim()) {
      ElMessage({
        message: '编辑器内容为空',
        type: 'warning',
        duration: 2000
      })
      loading.close()
      return
    }

    console.log('准备发送排版请求，文本长度:', textContent.length)

    // 调用自动排版接口（流式响应）
    const response = await axios.post('https://img.aiguidehub.com/api/v1/open-api/ai/', {
      text: textContent,
      service_type: 'dashscope',
      categories: '现代布局',
      theme_color: '#3B82F6',
      platform: 'wechat',
      auto_image: '0',
      image_count: '0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dassd4a6sd4awea5s4da5sd4asre1d3f1sd3f1sadfa4sdsd'
      },
      responseType: 'text',
      transformResponse: [(data) => data] // 禁用自动转换，保持原始文本
    })
    
    console.log('收到响应，状态码:', response.status)

    // 解析流式响应
    let formattedContent = ''
    
    // 确保 response.data 是字符串
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const lines = responseText.split('\n')
    
    for (const line of lines) {
      if (!line || typeof line !== 'string') continue
      
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('data: ')) {
        try {
          const jsonStr = trimmedLine.substring(6)
          if (!jsonStr) continue
          
          const data = JSON.parse(jsonStr)
          
          if (data.type === 'chunk' && data.content) {
            formattedContent += data.content
          } else if (data.type === 'complete') {
            console.log('排版完成')
            break
          } else if (data.type === 'error') {
            throw new Error(data.error || '排版失败')
          }
        } catch (e) {
          console.warn('解析数据失败:', line, e)
        }
      }
    }

    // 提取 [doc]...[/doc] 标签内的内容
    const docMatch = formattedContent.match(/\[doc\]([\s\S]*?)\[\/doc\]/)
    if (docMatch && docMatch[1]) {
      const cleanedContent = docMatch[1].trim()
      
      // 使用编辑器的 setContent 方法更新内容，避免直接修改 v-model 导致的状态不一致
      if (editorRef.value) {
        try {
          // 先更新 v-model 绑定的内容
          currentArticleRef.value.content_noencode = cleanedContent
          
          // 等待 DOM 更新
          await nextTick()
          
          // 使用 setContent 方法更新编辑器内容（第二个参数 false 表示不触发内容变化事件）
          editorRef.value.setContent(cleanedContent, false)
          
          // 再等待一下，确保编辑器内部状态更新完成
          await new Promise(resolve => setTimeout(resolve, 100))
          
          ElMessage({
            message: '排版成功',
            type: 'success',
            duration: 2000
          })
        } catch (e) {
          console.error('更新编辑器内容失败:', e)
          // 如果 setContent 失败，至少 v-model 已经更新了
          ElMessage({
            message: '排版成功（编辑器状态可能未完全更新）',
            type: 'warning',
            duration: 2000
          })
        }
      } else {
        // 编辑器未初始化，直接更新 v-model
        currentArticleRef.value.content_noencode = cleanedContent
        ElMessage({
          message: '排版成功',
          type: 'success',
          duration: 2000
        })
      }
    } else {
      throw new Error('接口返回格式错误，未找到排版内容')
    }
  } catch (error) {
    console.error('自动排版失败:', error)
    ElMessage({
      message: error.response?.data?.message || error.message || '自动排版失败，请稍后重试',
      type: 'error',
      duration: 3000
    })
  } finally {
    loading.close()
  }
}

const operationList = [
{
    title: '提取链接内容',
    icon: 'ph:link-bold',
    action: () => { openExtractMpArticleUrlDialog() }
  },
  {
    title: '清空',
    icon: 'tdesign:clear-formatting-1',
    action: () => { runEditorCMD('cleardoc') }
  },
  // {
  //   title: '批量提取链接内容',
  //   icon: 'fluent:link-add-20-filled',
  //   component: BatchExtractMpArticle,
  //   componentProps: {
  //     modelValue: mp_msgsRef,
  //     'onUpdate:modelValue': (val) => { mp_msgsRef.value = val },
  //     onConfirm: onBatchExtractMp
  //   }
  // },
  {
    title: '设置广告',
    icon: 'ic:sharp-attach-money',
    action: () => { openAdDialog() }
  },
  {
    title: '插入小程序',
    icon: 'ri:mini-program-line',
    action: () => { openMiniAppDialog() }
  },
  {
    title: '公众号链接',
    icon: 'mingcute:wechat-line',
    action: () => { openMPLinkDialog() }
  },
  {
    title: '插入公众号名片',
    icon: 'mdi:business-card-outline',
    action: () => { openMPDialog() }
  },
  {
    title: '插入视频',
    icon: 'ri:wechat-channels-line',
    action: () => { openMPVDialog() }
  },
  {
    title: '文章预览',
    icon: 'mdi:eye-outline',
    action: () => { handlePreview() }
  },
  {
    title: '文章手机预览',
    icon: 'tabler:scan-eye',
    action: () => { openMobilePreviewDialog() }
  },
  {
    title: '原创性检测',
    icon: 'ic:round-copyright',
    action: () => { handleCopyrightCheck() }
  },
  {
    title: '敏感性检测',
    icon: 'mdi:shield-alert-outline',
    action: () => { handleSensitiveCheck() }
  },
  {
    title: '消息手机预览',
    icon: 'mdi:mobile-phone-message',
    action: () => { openAppMsgMobilePreviewDialog() }
  },
  {
    title: '调试信息',
    icon: 'mdi:bug-outline',
    action: () => { openDebugDialog() },
    isShow: !isDebugRef.value
  }
]

// 组件生命周期
onMounted(async () => {
  start()
  console.log('props的值',props)

  accountsRef.value = toDeepRaw(all_accounts.value.list)
  selectedAccount.value = props.account
  currentAppmsgRef.value = props.appmsg
  editorIdRef.value = `editor-${props.appmsg.appmsgid}`
  mp_msgsRef.value = props.appmsg.multi_item
  normalizeClaimSourceInfo(mp_msgsRef.value)
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
  dialogSensitiveManageVisibleRef.value = false
  dialogSensitiveManageEditVisibleRef.value = false
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

