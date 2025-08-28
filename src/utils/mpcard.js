import {gen_unique_id} from './msic'

export function tplWithMPCard (data){
  return `<section class="mp_profile_iframe_wrp" nodeleaf="">${_tplWithMPCard(data)}</section>`
}

function _tplWithMPCard ({ fakeid, nickname, alias, round_head_img, signature, service_type, verify_status }){
  return `<mp-common-profile class="js_uneditable custom_select_card mp_profile_iframe" data-pluginname="mpprofile" data-nickname="${nickname}" data-alias="${alias}" data-from="0" data-headimg="${round_head_img}" data-signature="${signature}" data-id="${fakeid}" data-is_biz_ban="0" data-service_type="${service_type}" data-verify_status="${verify_status}"></mp-common-profile>`
}

export function tplMPCardInEditor (uniqid, data){
  return `<section id="${uniqid}" role="gqs-mpcard">${_tplMPCardInEditor(data)}</section>`
  // return `<section class="custom_select_card_wrp" nodeleaf=""><mp-common-app-link class="js_uneditable custom_select_card" data-pluginname="mpapplink" data-app_link="${app_link}" data-app_title="${app_title}"></mp-common-app-link></section>`
}

function _tplMPCardInEditor(data) {
  return `<section role="option" tabindex="0" aria-labelledby="js_a11y_wx_profile_nickname js_a11y_comma js_a11y_wx_profile_desc js_a11y_comma0 js_a11y_wx_profile_tips js_a11y_comma1 js_a11y_wx_profile_logo" class="appmsg_card_context wx_profile_card wx-root wx_tap_card wx_card_root common-web" data-weui-theme="light"><section class="wx_profile_card_inner"><section aria-hidden="true" class="wx_profile_card_bd"><section class="wx_profile weui-flex"><section class="wx_profile_hd"><img src="${data.round_head_img}" alt="" class="wx_profile_avatar"></section> <section class="wx_profile_bd weui-flex weui-flex__item"><section class="weui-flex__item"><section class="wx_profile_nickname_wrp"><strong id="js_a11y_wx_profile_nickname" class="wx_profile_nickname">${data.nickname}</strong> <span class="wx_follow_verify show-verify-company"></span></section> <section id="js_a11y_wx_profile_desc" class="wx_profile_desc">${data.signature}</section> <!----></section> <i class="weui-icon-arrow"></i></section></section></section> <section id="js_a11y_wx_profile_logo" aria-hidden="true" class="wx_profile_card_ft">${data.service_type == 2 ? "服务号" : "公众号"}</section> <!----></section></section> <span aria-hidden="true" id="js_a11y_comma" class="weui-a11y_ref" style="display: none;">，</span>`
}

export function hasMPCardInEditor(html) {
  const reg = /gqs-mpcard/gm
  return reg.test(html)
}

export function replaceMPCardToWechat(html, deps) {
    console.log("deps:", deps)
    // 创建一个临时容器
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 查找所有 role="gqs-mpcard" 的 section 元素
    const gqsSections = tempDiv.querySelectorAll('section[role="gqs-mpcard"]');
    
    if (gqsSections.length === 0) {
      return html
    }
    // 替换每个匹配的 section
    gqsSections.forEach(section => {
        const replacement = document.createElement('section');
        replacement.setAttribute('class', 'mp_profile_iframe_wrp')
        const uniqid = section.getAttribute('id')
        const dep = deps[uniqid]
        replacement.innerHTML = _tplWithMPCard(dep);
        section.parentNode.replaceChild(replacement, section);
    });
    console.log("tempDiv.innerHTML:", tempDiv.innerHTML)
    return tempDiv.innerHTML;
}

export function replaceMPCardFromWechat(html, deps) {
  // console.log("replaceMPCardFromWechat::html=>", deps, html)
  const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 查找所有 role="gqs-mpcard" 的 section 元素
    const wechatMPCardSections = tempDiv.querySelectorAll('section[class*="mp_profile_iframe_wrp"]');
    
    if (wechatMPCardSections.length === 0) {
      return html
    }

    wechatMPCardSections.forEach(section => {
      const uniqid = gen_unique_id()
      const replacement = document.createElement('section');
      replacement.setAttribute('id', uniqid)
      replacement.setAttribute('role', 'gqs-mpcard')
      // fakeid, nickname, alias, round_head_img, signature, service_type, verify_status
      const customElem = section.childNodes[0]
      const dataAttrs = {
        fakeid: customElem.getAttribute('data-id'),
        nickname: customElem.getAttribute('data-nickname'),
        alias: customElem.getAttribute('data-alias'),
        round_head_img: customElem.getAttribute('data-headimg'),
        signature: customElem.getAttribute('data-signature'),
        service_type: customElem.getAttribute('data-service_type'),
        verify_status: customElem.getAttribute('data-verify_status'),
      }

      replacement.innerHTML = _tplMPCardInEditor(dataAttrs);
      section.parentNode.replaceChild(replacement, section);
      // deps = {...deps, [uniqid]: dataAttrs} 改变了传入对象
      deps[uniqid] = dataAttrs
    })

    return tempDiv.innerHTML;

}
