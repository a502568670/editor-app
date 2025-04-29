<template>
  <div style="border: 1px solid #ccc; background-color:white;">
    <div class="out-btns" >
      <!-- <button @click="insertText" style="padding:4px;margin-bottom:2px;">导入url</button> -->
      <el-input v-model="extractUrl" clearable style="width: 400px;" placeholder="请输入文章提取地址" />
      <button @click="extractArticle" style="padding:4px;margin-bottom:2px;">立即提取</button>
      <button @click="saveArticle" style="padding:4px;margin-bottom:2px;">保存文章</button>
    </div>
    <hr />
    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode"
      @onCreated="handleCreated" />
  </div>
</template>
<style>
.out-btns{
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: start;
  flex-direction: row;
  padding: 5px;
  width: 100%;
}
.w-e-text-container [data-slate-editor] p:has(:not(span)){
  padding:0;
  margin:2px;
  line-height:0;
}
</style>
<script>
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { getArticleContent, getArticleContent2 } from '@/api/jzl'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { DomEditor } from '@wangeditor/editor';
import { IButtonMenu, IDomEditor, Boot } from '@wangeditor/editor'
console.log("====enter editor====")

export default {
  components: { Editor, Toolbar },

  setup() {
    
    
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // 内容 HTML
    const valueHtml = ref('<section>hello</section>')
    const extractUrl = "https://mp.weixin.qq.com/s/ECdk1kmW2FYNY6EaXZTYGQ"

    // 模拟 ajax 异步获取内容
    onMounted(() => {
//       setTimeout(() => {
//         // valueHtml.value = '<p>模拟 Ajax 异步设置内容</p>'
//         valueHtml.value = `<section><img
//                   data-ratio="1.737037037037037"
//                   src="https://mmbiz.qpic.cn/sz_mmbiz_jpg/I5RHldhvmKmffAQ3F7YCb7Zib3fnrnXxnhncicZLQyILtsWfAV25rVia2OhXtJRWNQIM14I0iaCOQSayL5A6iciaJJhA/640?wx_fmt=jpeg"
//                   data-type="jpg" data-w="1080" /></section>
// `
//       }, 1500)
    })


    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value
      if (editor == null) return
      editor.destroy()
    })

    
    // class AlertMenu extends BtnMenu {
    //   constructor(editor) {
    //     const $elem = editor.value.$(
    //       `<div class="w-e-menu" data-title="Alert" style="width:52px;">
    //         <button class="save">保存</button>
    //     </div>`
    //     )
    //     super($elem, editor.value)
    //   }
    //   clickHandler() {
    //     console.log('自定义保存按钮')
    //   }
    //   tryChangeActive() {
    //     this.active()
    //   }
    // }

  

    const toolbarConfig = {
      excludeKeys: [
        'bold', // 排除菜单组，写菜单组 key 的值即可
      ],
    };
    // toolbarConfig.insertKeys = {
    //   index: 5, // 插入的位置，基于当前的 toolbarKeys
    //   keys: ['menux'],
    // };

    const editorConfig = { placeholder: '请输入内容...', MENU_CONF: {}, htmlSanitize: false };

    editorConfig.MENU_CONF['uploadImage'] = {
      server: '/api/upload-image',
      fieldName: 'custom-field-name',
      // 继续写其他配置...

      //【注意】不需要修改的不用写，wangEditor 会去 merge 当前其他配置
    };

    const handleCreated = (editor) => {
      editorRef.value = editor // 记录 editor 实例，重要！
      // const menuKey = 'alertMenuKey'
      // 注册菜单
      // const module = {
      //   menus: [latex],
      // }
      // editor.registerMenu(menuKey, AlertMenu)
      // Boot.registerMenu(module)
    }

    const insertText = () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      editor.insertText('hello world'); // 执行 editor API
      const toolbar = DomEditor.getToolbar(editor);
      console.log('toolbar=>', toolbar, toolbarConfig);
      const curToolbarConfig = toolbar.getConfig();
      console.log(curToolbarConfig.toolbarKeys); // 当前菜单排序和分组
      console.log('menuconfig=>', editor.getMenuConfig('uploadImage'));
    };

    const extractArticle = async () => {
      const editor = editorRef.value; // 获取 editor ，必须等待它渲染完之后
      if (editor == null) return;

      console.log("导入url=>", extractUrl)
      const v = await getArticleContent2(extractUrl)
      console.log("v=>", v)
      const rawExtractContent = v.data.content_noencode
      // console.log('rawExtractContent=>', rawExtractContent)
      // const reg1 = /<section/g, reg2 = /section>/g, reg3 = /data-src/g, reg4 = /&quot;/g
      // const replaceTag = "span"
      const extractContent = rawExtractContent
        // .replaceAll(reg1, `<${replaceTag}`)
        // .replaceAll(reg2, `${replaceTag}>`)
        // .replaceAll(reg3, "src")
        // .replaceAll(reg4, "");
      console.log("extractContent=>", extractContent);
      valueHtml.value = "<p>" + extractContent + "<p>"
    }

    const saveArticle = async() => {
      const saveContent = valueHtml.value
      window.ipcRenderer.send('toMain', {
      tag: 'saveArticleDraft',
      content: saveContent
    })
    }


    return {
      editorRef,
      valueHtml,
      extractUrl,
      mode: 'default', // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated,
      insertText,
      extractArticle,
      saveArticle,
    }
  },
}
</script>