import {gen_unique_id} from './msic'

export function tplWithMPVContent (data){
  return `<section class="channels_iframe_wrp" nodeleaf="">${_tplWithMPVContent(data)}</section>`
}

function _tplWithMPVContent (data){
  if (data.type === 'video') {
    return `<mp-common-videosnap class="js_uneditable custom_select_card channels_iframe videosnap_video_iframe mp_common_widget" data-pluginname="mpvideosnap" data-url="${data.cover_url}" data-headimgurl="${data.head_url}" data-username="${data.username}" data-nickname="${data.nickname}" data-desc="${data.desc}" data-nonceid="${data.nonceid}" data-width="${data.width}" data-height="${data.height}" data-type="${data.type}" data-id="${data.id}" contenteditable="false"></<mp-common-videosnap>`
  } else if (data.type === 'live') {
    return `<mp-common-videosnap class="js_uneditable custom_select_card channels_iframe videosnap_video_iframe mp_common_widget" data-pluginname="mpvideosnap"  data-headimgurl="${data.head_url}" data-username="${data.username}" data-nickname="${data.nickname}" data-desc="${data.desc}" data-intro="${data.introduction}" data-noticeid="${data.notice_id}" data-status="${data.status}" data-type="${data.type}"  contenteditable="false"></<mp-common-videosnap>`
  }
  return ''
  
}

export function tplMPVContentInEditor (uniqid, data){
  return `<section id="${uniqid}" role="gqs-mpvcontent">${_tplMPVContentInEditor(data)}</section>`
  // return `<section class="custom_select_card_wrp" nodeleaf=""><mp-common-app-link class="js_uneditable custom_select_card" data-pluginname="mpapplink" data-app_link="${app_link}" data-app_title="${app_title}"></mp-common-app-link></section>`
}

function _tplMPVContentInEditor(data) {
  if (data.type === 'video') {
    return `<section class="wx-root common-web" data-weui-theme="light"><sectionrole="option" tabindex="0" title="" class="wxw_wechannel_card appmsg_card_channel appmsg_card_context js_wechannel_video_card wx_tap_card wx_card_root common-web" style="width: 254px;"><section class="wxw_wechannel_card_bd"><section class="wxw_wechannel_video_context" style="background-image: url(&quot;${data.cover_url}&quot;); height: 338px;"><i class="weui-play-btn_primary"></i><!----><!----><!----></section><section class="wxw_wechannel_card_ft weui-flex"><section class="wxw_wechannel_profile weui-flex"><section class="wxw_wechannel_logo"></section><section class="wxw_wechannel_nickname js_wx_tap_highlight">${data.nickname}</section><!----></section><!----></section></section><section class="wxw_wechannel_msg_web js_wechannel_msg"><section class="wxw_wechannel_msg_inner js_wechannel_msg_text"></section></section></section></section>`
  } else if (data.type === 'live') {
    return `<section class="wx-root common-web" data-weui-theme="light"><section data-noticeid="${data.notice_id}" data-username="username" class="wxw_wechannel_card appmsg_card_context wxw_wechannel_card_live js_wechannel_live_card wx_tap_card"><section class="wxw_wechannel_card_bd"><section class="wxw_wechannel_live_context"><section class="weui-flex wxw_wechannel_live_overview"><section class="wxw_wechannel_live_hd"><img src="${data.head_url}" alt="" class="wxw_wechannel_live_avatar"></section> <section role="option" title="" class="wxw_wechannel_live_bd weui-flex__item"><section style="display: flex; align-items: center;"><strong class="wxw_wechannel_live_nickname">${data.nickname}</strong> <i class="wxw_wechannel_logo"></i></section> <section class="weui-hidden_abs">，</section> <section class="wxw_wechannel_live_desc js_wechannel_live_desc">${data.desc}</section></section> <section class="wxw_wechannel_live_ft js_wechannel_operation_area"><button data-reservation="0" data-noticeid="${data.notice_id}" data-username="${data.username}" type="button" class="weui-btn weui-btn_mini wxw_wechannel_live_btn js_channel_btn_operation weui-btn_disabled"><i class="icon_wxw_wechannel_live js_wechannnel_live wxw_hide"></i> <span class="js_channel_btn_operation_wording">预约</span></button></section></section> <section class="wxw_wechannel_live_tips">开播有惊喜!预约点一点！</section></section> <!----> <!----> <!----></section> <section class="wxw_wechannel_msg_web js_wechannel_msg wxw_wechannel_live_msg"><section class="wxw_wechannel_msg_inner js_wechannel_msg_text"></section></section></section></section>`
  }

  return '<section>未实现内容</section>'
}

export function hasMPVContentInEditor(html) {
  const reg = /gqs-mpvcontent/gm
  return reg.test(html)
}

export function replaceMPVContentToWechat(html, deps) {
    console.log("deps:", deps)
    // 创建一个临时容器
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const gqsSections = tempDiv.querySelectorAll('section[role="gqs-mpvcontent"]');
    
    if (gqsSections.length === 0) {
      return html
    }
    // 替换每个匹配的 section
    gqsSections.forEach(section => {
        const replacement = document.createElement('section');
        replacement.setAttribute('class', 'channels_iframe_wrp')
        const uniqid = section.getAttribute('id')
        const dep = deps[uniqid]
        replacement.innerHTML = _tplWithMPVContent(dep);
        section.parentNode.replaceChild(replacement, section);
    });
    console.log("tempDiv.innerHTML:", tempDiv.innerHTML)
    return tempDiv.innerHTML;
}

export function replaceMPVContentFromWechat(html, deps) {
  // console.log("replaceMPVContentFromWechat::html=>", deps, html)
  const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 查找所有 role="gqs-mpcard" 的 section 元素
    // mp-common-profile
    const wechatMPVContentCustTags = tempDiv.querySelectorAll('section > mp-common-videosnap');
    if (wechatMPVContentCustTags.length === 0) {
      return html
    }

    wechatMPVContentCustTags.forEach(ct => {
      const section = ct.parentNode
      const uniqid = gen_unique_id()
      const replacement = document.createElement('section');
      replacement.setAttribute('id', uniqid)
      replacement.setAttribute('role', 'gqs-mpvcontent')
      const customElem = ct
      const type = customElem.getAttribute('data-type')
      const dataAttrs = {
        head_url: customElem.getAttribute('data-headimgurl'),
        username: customElem.getAttribute('data-username'),
        nickname: customElem.getAttribute('data-nickname'),
        desc: customElem.getAttribute('data-desc'),
        type: customElem.getAttribute('data-type'),
      }
      if (type === 'video') {
        dataAttrs.exportid = customElem.getAttribute('data-id'),
        dataAttrs.cover_url = customElem.getAttribute('data-url')
        dataAttrs.nonceid = customElem.getAttribute('data-nonceid'),
        dataAttrs.width = customElem.getAttribute('data-width')
        dataAttrs.height = customElem.getAttribute('data-height')
      } else if (type === 'live') {
        dataAttrs.introduction = customElem.getAttribute('data-intro')
        dataAttrs.notice_id = customElem.getAttribute('data-noticeid')
        dataAttrs.status = customElem.getAttribute('data-status')
      }
      console.log("dataAttrs=>", dataAttrs)
      replacement.innerHTML = _tplMPVContentInEditor(dataAttrs);
      section.parentNode.replaceChild(replacement, section);
      deps[uniqid] = dataAttrs
    })

    return tempDiv.innerHTML;
}
