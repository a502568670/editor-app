<template>
  <div class="flex flex-col h-full bg-[#e9f9f1]">
    <div class="h-10 flex space-x-2 items-center pl-2 border-b mb-1 shadow-md">
      <div>账号：</div>
      <el-select v-model="selectedAccount" class="grid-content-control" value-key="id" filterable placeholder="选择发布公众账号"
        @change="emitChangeForAccount">
        <el-option v-for="(item) in accountsRef" :key="item.id" :label="item.name" :value="item" />
      </el-select>
      <el-dropdown>
        <el-button type="primary">
          新消息列表<el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="() => newArticleGroup(0)">图文消息</el-dropdown-item>
            <el-dropdown-item @click="() => newArticleGroup(5)">视频消息</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- <el-button @click="saveArticle" type="danger">暂存文章</el-button> -->
      <el-button @click="handleSaveAppMsg" type="success">暂存</el-button>
      <el-dropdown split-button type="danger">
        其他
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleSyncToWechatDraftBox">同步到微信草稿箱</el-dropdown-item>
            <el-dropdown-item @click="confirmOpenPublishToWechatDialog">发布到微信</el-dropdown-item>
            <el-dropdown-item divided @click="openSendArticleDialog">同步到其他账号</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- <el-button @click="handleSyncToWechatDraftBox" type="danger">同步到微信草稿箱</el-button>
      <el-button @click="openSendArticleDialog" type="danger">同步到其他账号</el-button> -->
    </div>
    <el-row :gutter="0" class="flex-1">
      <el-col :span="6" class="h-full overflow-scroll bg-white">
        <div class="grid-content flex space-x-1 pl-1 mt-1">
          <el-select v-model="selected_mp_msg_groupRef" value-key="appmsgid" filterable placeholder="文章列表"
            @change="emitChangeForAppMsgGroup">
            <el-option v-for="(item) in mp_msg_groupsRef" :key="item.appmsgid"
              :label="item.name + (item.publish_flag ? '(已发布)' : '')" :value="item" />
          </el-select>

          <!-- <el-button @click="newArticleGroup" class="max-w-[80px]" type="primary">新列表</el-button> -->
        </div>
        <div class="bg-white  shadow-xl">
          <div v-if="mp_msgsRef">
            <div ref="elListMsgsRef" class="overflow-auto" style="height:calc(100vh - 230px)">
              <div @click="loadArticle(item, true)" v-for="(item, index) in mp_msgsRef" :key="item.msg_id"
                class="flex items-center p-2 border-b w-full">
                <img v-if="item.cdn_url" :src="item.cdn_url" style="width:0px;height:0px;"
                  referrerpolicy="no-referrer" />
                <div v-if="index === 0" :style="{ '--image-url': 'url(' + item.cdn_url + ')' }"
                  class='w-full flex h-40 justify-between items-end bg-no-repeat bg-center bg-cover bg-[#e6e6e6] bg-[image:var(--image-url)]'
                  :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }">
                  <div class="flex text-white p-1"><span v-if="item.msg_id === 0">*</span>{{ item.title }}</div>
                  <div class="flex justify-between px-1 space-x-2 py-1 text-white bg-gray-600 opacity-50"
                    v-if="item.msg_id === msg_idRef">
                    <el-icon class="cursor-pointer" @click="swapDown(item.msg_id)">
                      <component :is="ArrowDown"></component>
                    </el-icon>
                    <el-icon class="cursor-pointer" @click="removeArticle(item.msg_id)">
                      <component :is="Delete"></component>
                    </el-icon>
                  </div>
                </div>
                <div class="w-full flex h-20 items-center p-1"
                  :class="{ 'border-2 border-[#07C160]': (item.msg_id === msg_idRef) }" v-else>
                  <div class="flex flex-col flex-1 h-full">
                    <div class="flex-1 h-2/3 w-full max-w-full max-h-2/3 overflow-y-hidden"><span
                        class="mx-1 text-red-500" v-if="item.msg_id === 0">*</span>
                      <el-icon v-if="item.item_show_type === 5" :size="20"
                        class="cursor-pointer flex justify-center items-end" title="视频文章">
                        <Video />
                      </el-icon>
                      {{ item.title }}
                    </div>
                    <!-- <div class=" text-sm flex-0" style="color: #51ce94">{{ item.author }}</div> -->
                  </div>
                  <img v-if="item.cdn_url" class="w-10 h-10 rounded-sm" :src="item.cdn_url" />
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
            </div>
            <div class="w-full flex h-20 items-center p-1 justify-center">
              <!-- <div @click="newArticle()"  class="cursor-pointer">+新建文章</div> -->
              <!-- <el-button @click="newArticle" type="primary">新建文章</el-button> -->
              <el-dropdown>
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
        </div>
      </el-col>
      <el-col :span="12" class="h-full" v-loading="globalLoadingRef">
        <div class="h-full flex flex-col">
          <div ref="ueditor_wrapper" style="height:calc(100vh - 140px)">
            <vue-ueditor-wrap v-if="msg_idRef !== 0 && currentArticleRef.item_show_type === 0"
              v-model="currentArticleRef.content_noencode" editor-id="editor" @ready="ready" :config="editorConfigRef"
              :editorDependencies="['ueditor.config.js', 'ueditor.all.js']" />
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
                  <el-mention v-model="currentArticleRef.guide_words" type="textarea" class="w-full"
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
          </div>
        </div>
      </el-col>
      <el-col :span="1" class="h-full overflow-scroll bg-white">
        <div
          class="grid-content flex flex-col h-full justify-start items-center border  space-y-2 p-2 bg-slate-100 text-blue-500">
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openExtractMpArticleUrlDialog"
            title="提取链接内容">
            <Link />
          </el-icon>
          <el-icon :size="20" class="cursor-pointer flex justify-center" @click="openAdDialog" title="设置广告">
            <DollarSign />
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
      <el-col :span="5" class="h-full p-1">
        <el-row :gutter="4" class="mb-1" v-if="currentArticleRef.item_show_type !== 5">
          <el-col :span="24">
            <el-input v-model="currentArticleRef.title" clearable class="grid-content-control" placeholder="请输入文章标题"
              @input="syncToList('title')" />
          </el-col>
        </el-row>
        <el-row :gutter="4" class="mb-1">
          <el-col :span="24">
            <el-input v-model="currentArticleRef.author" clearable class="grid-content-control" placeholder="请输入文章作者" />
          </el-col>
        </el-row>
        <el-row :gutter="4" class="mb-1 w-full">
          <el-col :span="24" class="h-20 py-2 w-full flex justify-center items-center">
            <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-if="selectedCdnImageRef"
              :src="selectedCdnImageRef" alt="封面预览">
            <img class="cursor-pointer max-h-16 block" @click="triggerFileInput" v-else-if="currentArticleRef.cdn_url"
              :src="currentArticleRef.cdn_url" referrerpolicy="no-referrer" alt="封面图" />
            <div v-else @click="triggerFileInput"
              class="cursor-pointer border h-16 w-[180px] flex justify-center items-center bg-[#8c8c8c]">设置封面图</div>
            <input class="invisible" ref="cdnFileInputRef" @change="handleImage" type="file" accept="image/*">
          </el-col>
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
            <el-input v-model="currentArticleRef.sourceurl" clearable class="grid-content-control" placeholder="原文链接" />
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

        <el-row :gutter="4" class="my-2">
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
        </el-row>
      </el-col>
    </el-row>
  </div>
  <el-dialog :close-on-click-modal="false" title="提取文章链接内容" v-model="dialogExtractMpAritcleUrlRef" width="600px">
    <el-row :gutter="40" class="w-full">
      <el-col :span="18" class="w-full">
        <el-input v-model="extractArticleUrlRef" clearable placeholder="请输入文章提取地址" />
      </el-col>
      <el-col :span="6">
        <el-button @click="handleLocalExtractMpArticleUrl" type="primary">提取链接内容</el-button>
      </el-col>
    </el-row>
  </el-dialog>
  <el-dialog :close-on-click-modal="false" title="视频素材" v-model="dialogVideoMaterialRef" width="600px">
    <el-row :gutter="40" class="w-full h-[400px]" v-loading="videoLoadingRef">
      <el-col :span="24" class="w-full h-full overflow-auto">
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
      <div class="dialog-footer">
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
  <el-dialog :close-on-click-modal="false" title="发送到其他账号" v-model="dialogSendArticleVisibleRef" width="600px">
    <el-row :gutter="40">
      <el-col :span="18">
        <el-checkbox label="全部" @change="clickAllOtherAccounts"></el-checkbox>
        <el-checkbox-group v-model="otherAccountsChoosedRef">
          <el-checkbox v-for="(item) in otherAccountsRef" :key="item.id" :label="item.id">
            {{ item.name }}
          </el-checkbox>
          <!-- <el-checkbox label="Option 2 & Value 2" /> -->
        </el-checkbox-group>
      </el-col>
      <el-col :span="6">
        <el-button @click="handleSendToOtherAccount" type="primary">立即发送</el-button>
      </el-col>
    </el-row>
  </el-dialog>
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
</style>
<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { listAccount } from '@/api/account'
import { getToken } from "@/utils/auth";
import {
  saveArticleDraft,
  listArticlesByAppMsg, listArticleGroups, swapArticles,
  deleteArticleDraft, removeMpMsg, genArticleDraftPreviewUrl, previewQRCode,
} from "@/api/mp_msg"
import { saveAppMsg, send_to_other_accounts_events } from "@/api/appmsg"
import { getMpUserInfo, getLastPreviewAccounts, sendPreview, listVideos, getMasssendInfo, stat_appmsg_copyright_stat_events } from "@/api/mp_wechat"
import { getArticleContent, getArticleContent2 } from '@/api/jzl'
import { format_to_UEditor_html, restore_from_UEditor_html } from "@/utils/dom";
import { uploadImage } from "@/api/img"
import { toDeepRaw } from "@/utils/convert"
import { createDateByDays, parseDate, formatDate } from "@/utils/date"
import { ad_categorys, adMarkerContentInUEditor, format_ad_content_in_UEditor, restore_ad_content_from_UEditor, has_ad_in_wangEditor, has_ad_in_raw } from "@/utils/ad"
import { getVideoFrameHtml } from "@/utils/video"
import { claim_source_types, HOUSRS, MINUTES } from "@/utils/constants"
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { ArrowUp, ArrowDown, Delete, CircleCheckFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { removeAppMsgId, setAppMsgId, getAppMsgId, getSelectedAccountId, setSelectedAccountId } from '@/utils/editor'
import { Link, Link2, RadioTower, DollarSign, SquareTerminal, Eye, ScanEye, Minus, Smartphone, Video } from 'lucide-vue-next';
import axios from 'axios'
import JSON5 from "json5"

// console.log('envVars.backend_url=>', envVars.backend_url)
// editor 
const isDebugRef = ref(envVars.is_debug)
const ueditor_wrapper = ref(null)
const editorRef = shallowRef()
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
          ElMessageBox.alert(`当前账号(${name})session过期,请切换到*账号中心*重新登录`, '错误', {
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
const mp_msg_groupsRef = ref([])
const selected_mp_msg_groupRef = ref(null)
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
const timeoutSendToOneAccount = 30 * 1000; // ms



// 提取链接
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/G2TYEsgZsTJ1VWj4R2F2hQ?from=kdocs_link")
// const extractArticleUrlRef = ref("https://mp.weixin.qq.com/s/riiYjv8HUqyUZz_-IQKe9g")
const extractArticleUrlRef = ref("")
const dialogExtractMpAritcleUrlRef = ref(false)
const timeoutExtract = 3 * 1000; // ms

// 视频素材
const dialogVideoMaterialRef = ref(false)
const videosRef = ref([])
const selected_videoRef = ref(null)
const videoLoadingRef = ref(false)

// global loading
const globalLoadingRef = ref(false)

// 发布
const timeoutPublish = 10 * 1000; // ms
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
  editorInstance.setHeight(wrapprHeight - toolbarHeight + 1)
  // listHeightRef.value = `${wrapprHeight-120}px`
  // elListMsgsRef.value.style.height = `${wrapprHeight - 120}px`

}


// 组件生命周期
onMounted(async () => {
  console.log("==onMounted==")

  const accountsRet = await listAccount()
  console.log('accountsRet=>', accountsRet)
  // accountsRef.value = accountsRet.data.data.list
  accountsRef.value = accountsRet.data.data.list
  console.log("load accounts:", accountsRef.value)
  const init_account_id = getSelectedAccountId()
  console.log("init_account_id=>", init_account_id)
  if (init_account_id) {
    const find_account = accountsRef.value.find(v => v.id === parseInt(init_account_id))
    console.log("find_account=>", find_account)
    if (find_account) {
      selectedAccount.value = find_account
      // setImageUploadConfig()
    }
  } else {
    if (accountsRef.value.length > 0) {
      selectedAccount.value = accountsRef.value[0];
      // setImageUploadConfig()
      setSelectedAccountId(selectedAccount.value.id)
    }
  }

  await loadArticleGroups()
  await listArticles()
})

// 组件销毁时，也及时销毁编辑器
// onBeforeUnmount(() => {
//   const editor = editorRef.value
//   if (editor == null) return
//   try {
//     editor.destroy()
//   } catch (e) {
//     console.error("destroy error", e)
//   }
// })


// 帮助方法
const _getAppMsgId = () => {
  return selected_mp_msg_groupRef.value?.appmsgid
}

const serializeCookie = (arr) => {
  const items = []
  arr.forEach((v) => {
    items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
  });
  // console.log("items=>", items)
  return items.join(";")
}

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

const validateArticleData = () => {

  if (!currentArticleRef.value.title.trim()) {
    ElMessageBox.alert('标题不能为空', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return false;
  }
  if (!currentArticleRef.value.author.trim()) {
    ElMessageBox.alert('作者不能为空', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return false;
  }
  if (!currentArticleRef.value.cdn_url && !cdnRef.value) {
    ElMessageBox.alert('封面图片不能为空', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return false;
  }
  if (mp_msgsRef.value.length >= 8 && msg_idRef.value === 0) {
    ElMessageBox.alert('超出单消息最大文章数8篇', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).catch(() => { })
    return false;
  }

  return true
}
const needRefreshGroup = (msg_id) => {
  if (msg_id > 0) {
    const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
    return idx === 0
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
    currentArticleRef.value.cdn_url = cdn_url

    syncToList("cdn_url")
  }
}

// data methods
const loadArticleGroups = async () => {
  if (!selectedAccount.value) {
    ElMessage({
      message: `请选择公众账号`,
      type: 'warning',
      duration: 2 * 1000
    })
    return
  }

  mp_msg_groupsRef.value = await listArticleGroups(selectedAccount.value.wechat_id).catch((err) => { }).then(response => {
    return response.data;
  })
  console.log("mp_msg_groupsRef.value=>", mp_msg_groupsRef.value)

  // if (!selected_mp_msg_groupRef.value) {

  // }
  const init_appmsgid = getAppMsgId()
  console.log("init_appmsgid=>", init_appmsgid)
  if (init_appmsgid) {
    const find_group = mp_msg_groupsRef.value.find(v => v.appmsgid === parseInt(init_appmsgid))
    console.log("find_group=>", find_group)
    if (find_group) {
      selected_mp_msg_groupRef.value = find_group
      console.log("1 selected_mp_msg_groupRef.value=>", selected_mp_msg_groupRef.value)
      setAppMsgId(selected_mp_msg_groupRef.value.appmsgid)
      return
    }
  }
  if (mp_msg_groupsRef.value.length > 0) {
    selected_mp_msg_groupRef.value = mp_msg_groupsRef.value[0]
    console.log("2 selected_mp_msg_groupRef.value=>", selected_mp_msg_groupRef.value)
    setAppMsgId(selected_mp_msg_groupRef.value.appmsgid)
  } else {
    setAppMsgId("")
    selected_mp_msg_groupRef.value = null
  }
}

const listArticles = async () => {
  const appmsgid = _getAppMsgId()
  // appmsgidRef.value
  console.log("appmsgid=>", appmsgid)
  if (appmsgid) {
    mp_msgsRef.value = await listArticlesByAppMsg(appmsgid).catch((err) => { }).then(response => {
      return response.data;
    })
    console.log("mp_msgsRef.value=>", mp_msgsRef.value)
  } else {
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
  console.log("category_id_list=>", category_id_list)
  console.log("ad_id=>", ad_id)
  ad_idRef.value = ad_id
  // mp_msg.content_noencode = format_to_wangEditor_html(formated)
  mp_msg.content_noencode = formated
  // appmsgidRef.value = mp_msg.appmsgid
  currentArticleRef.value = {
    ...mp_msg,
  }

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
  await swapArticles(prev, msg_id).catch((err) => { })
  if (needRefreshGroup(prev)) {
    await loadArticleGroups()
  }
  await listArticles()
}
const swapDown = async (msg_id) => {
  if (checkHasNotSave(true)) {
    return
  }
  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  const next = mp_msgsRef.value[idx + 1].msg_id
  console.log("next index:", next)
  await swapArticles(msg_id, next)
  if (idx === 0) {
    await loadArticleGroups()
  }
  await listArticles()
}

const checkHasNotSave = (showMessage) => {
  const not_save = mp_msgsRef.value.find(v => v.msg_id === 0)
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

const newArticle = async (before_save = true, item_show_type = 0) => {
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
  const new_msg_id = 0 - (+new Date())
  mp_msgsRef.value.push({
    ...new_mp_msg,
    msg_id: new_msg_id
  })

  loadArticleByMsgId(new_msg_id)

  // console.log('elListMsgsRef.value.scrollHeight=>', elListMsgsRef.value.scrollHeight)
  // elListMsgsRef.value.scrollTop = elListMsgsRef.value.scrollHeight
  await nextTick()
  elListMsgsRef.value.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
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
    ElMessageBox.alert(`当前账号(${account_name})session过期,请切换到*账号中心*重新登录`, '错误', {
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

const saveArticle = async () => {

  if (!validateAccount() || !validateArticleData()) {
    return
  }
  console.log("==continue saveArticle===")

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


  console.log("adCategoryChoosedRef=>", adCategoryChoosedRef.value)

  console.log(currentArticleRef.value)

  const { token, name, session_id, wechat_id } = selectedAccount.value
  console.log("session_id=>", session_id)
  // const saveContent = currentArticleRef.value.content_noencode
  // console.log("token:", token)
  console.log("save name:", name)


  // console.log("wechat_id:", wechat_id)
  // console.log("raw content_noencode:", debug_content_noencode_ref.value)

  // console.log("restore content_noencode:", currentArticleRef.value.content_noencode)
  // const parser = new DOMParser();
  // const doc1 = parser.parseFromString(debug_content_noencode_ref.value, "text/html");
  // const doc2 = parser.parseFromString(currentArticleRef.value.content_noencode, "text/html");
  // console.log("compare", doc1, doc2)
  // const to_save_content_noencode = restore_from_UEditor_html(currentArticleRef.value.content_noencode);
  const to_save_content_noencode = currentArticleRef.value.content_noencode;
  // console.log("to_save_content_noencode:", to_save_content_noencode)

  const category_id_list = adCategoryChoosedRef.value.join("|")
  console.log("category_id_list:", category_id_list)

  const vhtml = restore_ad_content_from_UEditor(to_save_content_noencode, category_id_list, ad_idRef.value)
  console.log("ad vhtml=>", vhtml)
  currentArticleRef.value.content_noencode = vhtml


  const msg_id = msg_idRef.value
  // const appmsgid =  appmsgidRef.value 
  const appmsgid = _getAppMsgId()
  // console.log("msg_id", msg_id)
  // console.log("appmsgid", appmsgid)
  console.log("session_id:", session_id)
  if (!session_id) {
    ElMessageBox.alert(`当前账号(${name})session过期,请切换到*账号中心*重新登录`, '错误', {
      confirmButtonText: '确定',
      type: 'error'
    }).then(() => {
      console.log("then")
    }).catch(() => {
      console.log("catch")
    })
    return
  }

  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    wechat_id,
    appmsgid,
    msg_id,
    material_list: [{
      ...currentArticleRef.value
    }],
    // material_list: [{
    //     content_noencode: currentArticleRef.value.content_noencode,
    //     // cdn_url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/4WT2I2qqeFAibhrnd1BP6uhtX6Y395tHhMxfXaJrWW5w8JpQibmicJCqfdGL1uWQErUlUVyScV2bs59oj9rhicnTaQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=13&tp=wxpic",
    //     cdn_url: "",
    //     desc: "",
    //     title: titleRef.value,
    //     author: authorRef.value,
    //     copyright_type: 0
    //   }],
    ...cdnRef.value
  }
  console.log("save postData=>", postData)
  const loader = ElLoading.service({
    target: '.main'
  })
  await saveArticleDraft(postData).then(async (res) => {
    ElMessage({
      message: `文章暂存成功`,
      type: 'success',
      duration: 2 * 1000
    })
    console.log("saveArticleDraft res=>", res)
    if (msg_id === 0 && (!appmsgid && res.data.data.appmsgid)) {
      // 新列表 需要设置新的appmsgid到localstorage
      setAppMsgId(res.data.data.appmsgid)
    }
    if (needRefreshGroup(msg_id)) {
      await loadArticleGroups()
    }


    await listArticles()
    const new_msg_id = res.data.data.msg_id
    loadArticleByMsgId(new_msg_id)

  }).catch((e) => {
    handleActionErr(name, e)
  }).finally(() => {
    loader.close()
  })

  // 暂时从前端提交
  //   window.ipcRenderer.send('toMain', {
  //   tag: 'saveArticleDraft',
  //   content: postData
  // })
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


  console.log("adCategoryChoosedRef=>", adCategoryChoosedRef.value)


  const to_save_content_noencode = currentArticleRef.value.content_noencode;
  // console.log("to_save_content_noencode:", to_save_content_noencode)

  const category_id_list = adCategoryChoosedRef.value.join("|")
  console.log("category_id_list:", category_id_list)

  const vhtml = restore_ad_content_from_UEditor(to_save_content_noencode, category_id_list, ad_idRef.value)
  console.log("ad vhtml=>", vhtml)
  currentArticleRef.value.content_noencode = vhtml

  const idx = mp_msgsRef.value.findIndex(v => v.msg_id === msg_id)
  if (idx !== -1) {
    mp_msgsRef.value[idx] = currentArticleRef.value
  }

  return idx

}

const _saveAppMsg = async (push_to_remote) => {
  if (!validateAccount()) {
    return
  }

  const { token, name, session_id, wechat_id } = selectedAccount.value
  if (!session_id) {
    ElMessageBox.alert(`当前账号(${name})session过期,请切换到*账号中心*重新登录`, '错误', {
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
  let selected_idx = saveCurrentToList(msg_id)
  console.log("save all mp_msgsRef.value=>", mp_msgsRef.value)
  // const appmsgid =  appmsgidRef.value 
  let appmsgid = _getAppMsgId()

  const postData = {
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    appmsgid,
    material_list: mp_msgsRef.value,
    wechat_id,
    push_to_remote,
  }

  console.log("save appmsg postData=>", postData)
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
    const isCreateNewAppMsg = appmsgid <= 0 && res.data.data.appmsgid > 0
    appmsgid = res.data.data.appmsgid
    if (isCreateNewAppMsg) {
      // 新列表 需要设置新的appmsgid到localstorage
      setAppMsgId(appmsgid)
      await loadArticleGroups()
    }
    mp_msgsRef.value = res.data.data.mp_msgs
    // await listArticles()
    // const msg_ids = res.data.data.msg_ids
    if (selected_idx === -1) {
      selected_idx = 0
    }
    loadArticle(mp_msgsRef.value[selected_idx])
  }).catch((e) => {
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
  const publish_flag = selected_mp_msg_groupRef.value.publish_flag;
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
  const publish_flag = selected_mp_msg_groupRef.value.publish_flag;
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
  const ret = await getMasssendInfo({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
  }).catch((e) => {
    console.log("getMasssendInfo catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
    publishLoadingRef.value = false
  })
  const item_kQuotaTypeMassSendNormal = ret.data.find(v => v.quota_type === 'kQuotaTypeMassSendNormal')
  if (!item_kQuotaTypeMassSendNormal) {
    return
  }
  publishQuotaItemListRef.value = item_kQuotaTypeMassSendNormal.quota_item_list

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

const handlePublishToWechat = async () => {
  publishLoadingRef.value = true
  const appmsgid = _getAppMsgId()
  const appmsg_item_count = mp_msgsRef.value.length
  // console.log("publishTimeRef.value", publishTimeRef.value, typeof publishTimeRef.value)
  const publishTime = new Date(publishTimeRef.value)
  const join_date_str = `${selectedPublishTimingDateRef.value.id} ${publishTime.getHours()}:${publishTime.getMinutes()}`
  console.log('join_date_str=>', join_date_str)
  const send_time = publishTimingFlagRef.value ? (+new Date(join_date_str)) / 1000 : 0
  const is_release_publish_page = bulkSendingNotificationFlag.value ? 0 : 1
  const reprint_info = publishCopyright1ListRef.value.length > 0 ? {
    item_list: publishCopyright1ListRef.value.map((_, i) => ({
      idx: i + 1,
      reprint_type: 'EN_REPRINT_TYPE_SHARE',
      guide_words: publishGuideWordsRef.value[i] ?? "",
    }))
  } : null
  const list = publishCopyright1ListJsonStrRef.value
  console.log('is_release_publish_page=>', is_release_publish_page)
  console.log('send_time=>', send_time)
  console.log("reprint_info=>", reprint_info)
  console.log("list=>", list)
  console.log('appmsgid=>', appmsgid)
  console.log("appmsg_item_count=>", appmsg_item_count)
  const { token, session_id, wechat_id } = selectedAccount.value
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:publishToWechat',
    token: getToken(),
    wechat_id,
    publishData: {
      // mp_msgs: toDeepRaw(mp_msgsRef.value),
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      send_time,
      is_release_publish_page,
      list,
      reprint_info,
      appmsgid,
      appmsg_item_count
    }
  })

  setTimeout(() => {
    publishLoadingRef.value = false
    dialogExtractMpAritcleUrlRef.value = false
  }, timeoutPublish)
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
      removeAppMsgId()
      selected_mp_msg_groupRef.value = null
    }
    if (needRefreshGroup(msg_id) || mp_msgsRef.value.length === 0) {
      await loadArticleGroups()
      listArticles().then(() => {
        loadArticle(mp_msgsRef.value[0])
      })
    }
  }).catch(() => {
    console.log('取消removeArticle')
  })
}

const deleteArticle = async (msg_id) => {
  ElMessageBox.confirm(
    '此操作将删除该文章, 是否继续?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    if (checkHasNotSave(false)) {
      console.log("checkHasNotSave=>", true)
      const not_save_idx = mp_msgsRef.value.findIndex(v => v.msg_id === 0)
      console.log("not_save_idx=>", not_save_idx)
      const mp_msgs = mp_msgsRef.value
      mp_msgs.splice(not_save_idx, 1)
      mp_msgsRef.value = mp_msgs
      return
    }

    const { token, name, session_id, wechat_id } = selectedAccount.value
    const postData = {
      cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
      token: parseInt(token),
      wechat_id,
      msg_id,
    }
    console.log("delete postData=>", postData)
    const loader = ElLoading.service({
      target: '.main'
    })

    await deleteArticleDraft(postData).catch((e) => {
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
      removeAppMsgId()
      selected_mp_msg_groupRef.value = null
    }
    if (needRefreshGroup(msg_id) || mp_msgsRef.value.length === 0) {
      await loadArticleGroups()
      listArticles().then(() => {
        loadArticle(mp_msgsRef.value[0])
      })
    }
  }).catch(() => {
    console.log('取消')
  })

}

const openSendArticleDialog = () => {
  otherAccountsChoosedRef.value = []
  otherAccountsRef.value = accountsRef.value.filter(v => v.id !== selectedAccount.value?.id)
  dialogSendArticleVisibleRef.value = true
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
  let stepRet
  await send_to_other_accounts_events({
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


const newArticleGroup = (item_show_type = 0) => {
  // msg_idRef.value = 0
  mp_msgsRef.value = []
  cdnFileInputRef.value.value = ""

  const new_appmsgid = 0 - (+new Date())
  setAppMsgId(new_appmsgid)
  newArticle(false, item_show_type)
  const newAppMsg = {
    appmsgid: new_appmsgid,
    name: currentArticleRef.value.title
  }
  selected_mp_msg_groupRef.value = newAppMsg
  mp_msg_groupsRef.value.push(newAppMsg)

  console.log("selected_mp_msg_groupRef=>")
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

const emitChangeForAppMsgGroup = async (val) => {
  console.log("emitChangeForAppMsgGroup val=>", val)
  if (val) {
    selected_mp_msg_groupRef.value = val
    await listArticles()
    if (mp_msgsRef.value.length > 0) {
      loadArticle(mp_msgsRef.value[0])
    } else {
      // newArticle()
    }
    setAppMsgId(val.appmsgid)

  }
}

const emitChangeForAccount = async (val) => {
  console.log("emitChange=>", val)
  selectedAccount.value = val;
  // setImageUploadConfig()
  setSelectedAccountId(selectedAccount.value.id)
  await loadArticleGroups()
  await listArticles()
  if (mp_msgsRef.value.length > 0) {
    loadArticle(mp_msgsRef.value[0])
  } else {
    // newArticle()
  }
  setAppMsgId(val.appmsgid)
  // await loadArticleGroups()
  // console.log("editorConfigRef=>", editorConfigRef.value)
  // console.log("selectedAccount=>", selectedAccount)
  // this.$emit('change', val)
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

const openExtractMpArticleUrlDialog = () => {
  dialogExtractMpAritcleUrlRef.value = true
}

// const handleExtractMpArticleUrl = async () => {
//   const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
//   if (editor == null) return;

//   if (!extractArticleUrlRef.value) {
//     ElMessageBox.alert('请输入有效的提取链接', '警告', {
//       confirmButtonText: '确定',
//       type: 'warning'
//     }).catch(() => { })
//     return
//   }
//   await handleLocalExtractMpArticleUrl()
// }

// const handleRemoteExtractMpArticleUrl = async () => {
//   const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
//   if (editor == null) return;

//   if (!extractArticleUrlRef.value) {
//     ElMessageBox.alert('请输入有效的提取链接', '警告', {
//       confirmButtonText: '确定',
//       type: 'warning'
//     }).catch(() => { })
//     return
//   }

//   const loader = ElLoading.service({
//     target: '.main'
//   })
//   const v = await getArticleContent(extractArticleUrlRef.value)
//   console.log("v.data=>", v.data)
//   const { title, nick_name, copyright_stat, cdn_url, item_show_type } = v.data
//   let { content_noencode } = v.data
//   // console.log("content_noencode=>", content_noencode)
//   if (item_show_type === 5) {
//     // 独立视频
//     const { video_id } = v.data
//     content_noencode = `<iframe class="edui-video-iframe" data-vidtype="2" data-mpvid="${video_id}" data-cover="${cdn_url}" allowfullscreen="" frameborder="0" data-w="1080" data-ratio="0.5625" style="border-radius: 4px;" src="https://mp.weixin.qq.com/cgi-bin/readtemplate?t=tmpl/video_tmpl&vid=${video_id}" width="420" height="280" frameborder="0" allowfullscreen=""></iframe>` + content_noencode
//   }

//   currentArticleRef.value = {
//     ...currentArticleRef.value,
//     // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
//     // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
//     content_noencode: format_to_UEditor_html(content_noencode),
//     title,
//     author: nick_name,
//     copyright_type: copyright_stat,
//     cdn_url,
//   }

//   dialogExtractMpAritcleUrlRef.value = false
//   loader.close()
// }

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
    tag: 'localExtractMpArticleUrl',
    token: getToken(),
    extractArticleUrl: extractArticleUrlRef.value,
  })

  setTimeout(() => {
    globalLoadingRef.value = false
    dialogExtractMpAritcleUrlRef.value = false
  }, timeoutExtract)
}

const openVideoMaterialDialog = async () => {
  dialogVideoMaterialRef.value = true
  videoLoadingRef.value = true
  selected_videoRef.value = null
  videosRef.value = []

  const { token, session_id, name } = selectedAccount.value

  const ret = await listVideos({
    cookies: serializeCookie(JSON.parse(session_id)["cookie"]),
    token: parseInt(token),
    begin: 0,
    count: 100,
  }).catch((e) => {
    console.log("listVideos catch:", e)
    // handleActionErr(name, e)
  }).finally(() => {
    videoLoadingRef.value = false
  })
  console.log("videos=>", ret)
  // videosRef.value = [...ret.data, ...ret.data, ...ret.data, ...ret.data, ...ret.data]
  videosRef.value = ret.data
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

const validatePreview = () => {
  if (msg_idRef.value <= 0) {
    ElMessageBox.alert('请选择预览文章，或者将当前新建的文章暂存到草稿箱', '警告', {
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
        tag: 'previewMpArticle',
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
  if (!selected_mp_msg_groupRef.value) {
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
    ElMessageBox.alert(`当前账号(${account_name})session过期,请切换到*账号中心*重新登录`, '错误', {
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
  const { appmsgid } = selected_mp_msg_groupRef.value
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
}

// 用户切换标签页时，主进程会发送 fromMain 消息，通知当前选中的标签页 ID。
window.ipcRenderer.receive('fromMain', (msg) => {
  console.log("ipcRenderer receive fromMain:", msg)
  if (typeof msg === 'object' && Object.prototype.hasOwnProperty.call(msg, 'tag')) {
    const tag = msg.tag;
    if (tag === "localExtractMpArticleUrlResult") {
      console.log(`tag:${msg.tag}`, typeof msg.data)
      const { title, nick_name, copyright_stat, cdn_url, item_show_type, video_page_info } = msg.data
      let { content_noencode, content_text } = msg.data
      console.log("msg.data=>", msg.data)
      let guide_words = "", vid = ""
      console.log("item_show_type=>", item_show_type)
      // const { video_page_infos } = msg.data

      if (video_page_info) {
        // 独立视频
        console.log("video_page_infos=>",)
        guide_words = content_text
        vid = video_page_info.video_id
        content_noencode = getVideoFrameHtml(vid, cdn_url) //`<iframe class="edui-video-iframe" data-vidtype="2" data-mpvid="${video_id}" data-cover="${cdn_url}" allowfullscreen="" frameborder="0" data-w="1080" data-ratio="0.5625" style="border-radius: 4px;" src="https://mp.weixin.qq.com/cgi-bin/readtemplate?t=tmpl/video_tmpl&vid=${video_id}" width="420" height="280" frameborder="0" allowfullscreen=""></iframe>`
      }
      if (currentArticleRef.value.item_show_type === 0) {
        content_noencode = content_noencode + "<p>" + content_text + "<p>"
      }

      currentArticleRef.value = {
        ...currentArticleRef.value,
        // content_noencode: content_noencode.replace(/[\u200B-\u200D\uFEFF]/gim, ''),
        // content_noencode: "<p>" + format_to_wangEditor_html(content_noencode) + "<p>",
        content_noencode: format_to_UEditor_html(content_noencode),
        title,
        author: nick_name,
        copyright_type: copyright_stat,
        cdn_url,
        guide_words,
        vid,
      }
      const idx = mp_msgsRef.value.findIndex(v => v.msg_id === currentArticleRef.value.msg_id)
      if (idx !== -1) {
        mp_msgsRef.value[idx] = currentArticleRef.value
      }
      dialogExtractMpAritcleUrlRef.value = false
    } else if (tag === "appmsg-ret:publishToWechat") {
      console.log("publishToWechatResult msg.data=>", msg.data)
      const { success, msg: retmsg } = msg.data
      if (success) {
        dialogPublishArticleVisibleRef.value = false
        ElMessage({
          message: `发布成功`,
          type: 'success',
          duration: 2 * 1000
        })
      } else {
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
    }

    if (globalLoadingRef.value) {
      globalLoadingRef.value = false

    }
  }
})

</script>