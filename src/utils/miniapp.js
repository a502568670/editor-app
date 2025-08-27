import {gen_unique_id} from './msic'
// function getid(e) {
//   for (var t = "", i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = 0; e > n; n++)t += i.charAt(Math.floor(Math.random() * i.length));
//   return t;
// }

// function gen_unique_id() {
//   return `${getid(8)}-${getid(6)}`
// }

export function tplWithAppLinkAndText ({ app_link, app_title, weapp_path, appid, nickname, service_type }){
  return `<section><span leaf=""><a class="weapp_text_link js_weapp_entry" style="" data-unique-id="${gen_unique_id()}" data-miniprogram-type="text" data-miniprogram-appid="${appid}" data-miniprogram-path="${weapp_path}" data-miniprogram-nickname="${nickname}" data-miniprogram-servicetype="${service_type}" data-miniprogram-applink="${app_link}">${app_title}</a></span></section>`
}

export function tplWithAppLinkAndImage ({ app_link, img_link, weapp_path, appid, nickname, service_type }){
  return `<section><span leaf=""><br></span><a class="weapp_image_link js_weapp_entry" data-miniprogram-type="image" style="" data-miniprogram-appid="${appid}" data-miniprogram-path="${weapp_path}" data-miniprogram-nickname="${nickname}" data-miniprogram-servicetype="${service_type}" data-miniprogram-applink="${app_link}" data-miniprogram-imageurl="${img_link}"><img class="rich_pages wxw-img" data-ratio="1" data-w="240" src="${img_link}" data-src="${img_link}"></a></section>`
}

export function tplWithAppLinkAndCard ({ app_link, img_link, crop, app_title, weapp_path, appid, nickname, headimg_url, service_type }){

  const json_str = JSON.stringify({
    "c": {
      "x": crop.x1,
      "y": crop.y1,
      "x2": crop.x2,
      "y2": crop.y2,
      "w": crop.x2 - crop.x1,
      "h": crop.y2 - crop.y1,
    }
  });
  console.log("json_str=>", json_str)
  const encodedCrop = encodeURIComponent(json_str);
  console.log("encodedCrop=>", encodedCrop)
  return `<section nodeleaf=""><mp-common-miniprogram class="js_uneditagle custom_select_card mp_miniprogram_iframe" data-pluginname="insertminiprogram" data-miniprogram-path="${weapp_path}" data-miniprogram-nickname="${nickname}" data-miniprogram-avatar="${headimg_url}" data-miniprogram-title="${app_title}" data-miniprogram-imageurl="${img_link}" data-miniprogram-type="card" data-miniprogram-servicetype="${service_type}" data-miniprogram-applink="${app_link}" data-miniprogram-appid="${appid}" data-miniprogram-imageurlback="${img_link}" data-miniprogram-cropperinfo="${encodedCrop}"></mp-common-miniprogram></section>`
}


