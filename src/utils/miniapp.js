import { gen_unique_id } from './msic'

export function tplWithAppLinkAndText({ app_link, app_title, weapp_path, appid, nickname, service_type }) {
  return `<section><span leaf=""><a class="weapp_text_link js_weapp_entry" style="" data-unique-id="${gen_unique_id()}" data-miniprogram-type="text" data-miniprogram-appid="${appid}" data-miniprogram-path="${weapp_path}" data-miniprogram-nickname="${nickname}" data-miniprogram-servicetype="${service_type}" data-miniprogram-applink="${app_link}">${app_title}</a></span></section>`
}

export function tplWithAppLinkAndImage({ app_link, img_link, weapp_path, appid, nickname, service_type }) {
  return `<section><span leaf=""><br></span><a class="weapp_image_link js_weapp_entry" data-miniprogram-type="image" style="" data-miniprogram-appid="${appid}" data-miniprogram-path="${weapp_path}" data-miniprogram-nickname="${nickname}" data-miniprogram-servicetype="${service_type}" data-miniprogram-applink="${app_link}" data-miniprogram-imageurl="${img_link}"><img class="rich_pages wxw-img" data-ratio="1" data-w="240" src="${img_link}" data-src="${img_link}"></a></section>`
}

export function tplWithMiniAppCard(data) {
  return `<section nodeleaf="">${_tplWithMiniAppCard(data)}</section>`
}
function _tplWithMiniAppCard(data) {
  let encodedCrop = data.encodedCrop
  if (!encodedCrop) {
    encodedCrop = encodeURIComponent(JSON.stringify({
      "c": {
        "x": data.crop.x1,
        "y": data.crop.y1,
        "x2": data.crop.x2,
        "y2": data.crop.y2,
        "w": data.crop.x2 - data.crop.x1,
        "h": data.crop.y2 - data.crop.y1,
      }
    }));
  }

  return `<mp-common-miniprogram class="js_uneditagle custom_select_card mp_miniprogram_iframe" data-pluginname="insertminiprogram" data-miniprogram-path="${data.weapp_path}" data-miniprogram-nickname="${data.nickname}" data-miniprogram-avatar="${data.headimg_url}" data-miniprogram-title="${data.app_title}" data-miniprogram-imageurl="${data.img_link}" data-miniprogram-type="card" data-miniprogram-servicetype="${data.service_type}" data-miniprogram-applink="${data.app_link}" data-miniprogram-appid="${data.appid}" data-miniprogram-imageurlback="${data.img_link}" data-miniprogram-cropperinfo="${encodedCrop}"></mp-common-miniprogram>`
}

export function tplMiniAppCardInEditor(uniqid, data, opts) {
  return `<section id="${uniqid}" role="gqs-miniappcard" >${_tplMiniAppCardInEditor(data)}</section>${opts?.br ? "<p><br/></p>" : ""}`
  // return `<section class="custom_select_card_wrp" nodeleaf=""><mp-common-app-link class="js_uneditable custom_select_card" data-pluginname="mpapplink" data-app_link="${app_link}" data-app_title="${app_title}"></mp-common-app-link></section>`
}

function _tplMiniAppCardInEditor(data) {
  return `<section class="wx-root weapp_root common-web" data-weui-theme="light"><section role="option" title="" class="weapp_card appmsg_card_context wx_tap_card wx_card_root wx_hover_card"><section class="weapp_card_bd"><section class="weapp_card_profile weui-flex weui-flex_align-center"><img alt="" data-weappavatar="${data.headimg_url}" src="${data.headimg_url}" class="weapp_card_avatar js_weapp_card_avatar_img"><section class="weui-flex__item"><section class="weapp_card_nickname_wrp weui-flex weui-flex_align-center"><span class="weapp_card_nickname">${data.nickname}</span> <span class="weui-hidden_abs">，</span> <!----> <span class="weui-hidden_abs">，</span> <!----> <span class="weui-hidden_abs">，</span></section></section></section><section class="weapp_card_info"><section class="weapp_card_title">${data.app_title}</section><section class="weapp_card_thumb_wrp weui-circle-loading_before"><img alt="" data-weappcover="${data.img_link}" src="${data.img_link}" class="weapp_card_thumb js_weapp_card_thumb_img"></section></section></section><section class="weapp_card_ft"><span class="weapp_card_logo">小程序</span></section></section></section>`
}

export function hasMiniAppCardInEditor(html) {
  const reg = /gqs-miniappcard/gm
  return reg.test(html)
}

export function replaceMiniAppCardToWechat(html, deps) {
  console.log("deps:", deps)
  // 创建一个临时容器
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 查找所有 role="gqs-mpcard" 的 section 元素
  const gqsSections = tempDiv.querySelectorAll('section[role="gqs-miniappcard"]');

  if (gqsSections.length === 0) {
    return html
  }
  // 替换每个匹配的 section
  gqsSections.forEach(section => {
    const replacement = document.createElement('section');
    replacement.setAttribute('nodeleaf', '')
    const uniqid = section.getAttribute('id')
    const dep = deps[uniqid]
    replacement.innerHTML = _tplWithMiniAppCard(dep);
    section.parentNode.replaceChild(replacement, section);
  });
  return tempDiv.innerHTML;
}

export function replaceMiniAppCardFromWechat(html, deps) {
  // console.log("replaceMPCardFromWechat::html=>", deps, html)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const wechatMiniAppCardCustTags = tempDiv.querySelectorAll('section > mp-common-miniprogram');
  if (wechatMiniAppCardCustTags.length === 0) {
    return html
  }
  
  wechatMiniAppCardCustTags.forEach(ct => {
    const section = ct.parentNode
    const uniqid = gen_unique_id()
    const replacement = document.createElement('section');
    replacement.setAttribute('id', uniqid)
    replacement.setAttribute('role', 'gqs-miniappcard')
    // fakeid, nickname, alias, round_head_img, signature, service_type, verify_status
    const customElem = ct
    const dataAttrs = {
      weapp_path: customElem.getAttribute('data-miniprogram-path'),
      nickname: customElem.getAttribute('data-miniprogram-nickname'),
      headimg_url: customElem.getAttribute('data-miniprogram-avatar'),
      app_link: customElem.getAttribute('data-miniprogram-applink'),
      app_title: customElem.getAttribute('data-miniprogram-title'),
      img_link: customElem.getAttribute('data-miniprogram-imageurl'),
      appid: customElem.getAttribute('data-miniprogram-appid'),
      service_type: customElem.getAttribute('data-miniprogram-servicetype'),
      encodedCrop: customElem.getAttribute('data-miniprogram-cropperinfo'),
    }

    replacement.innerHTML = _tplMiniAppCardInEditor(dataAttrs);
    section.parentNode.replaceChild(replacement, section);
    // deps = {...deps, [uniqid]: dataAttrs} 改变了传入对象
    deps[uniqid] = dataAttrs
  })

  return tempDiv.innerHTML;
}