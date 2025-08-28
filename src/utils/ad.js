// 餐饮, 出版发行, 房地产, 服饰鞋帽箱包, 工业工程和安保, 国家机构协会和社会工作, 护肤彩妆, 互联网电商服务, 互联网内容资讯服务, 互联网其他服务, 家装家具, 交通运输和仓储, 教育, 节能环保, 金融, 酒水, 科研和技术服务, 零售和百货, 旅游出行, 能源和供应, 农林牧渔和采矿, 汽车, 亲子, 日用百货, 软件工具, 商务服务, 生活服务, 食品, 数码家电, 数字内容创作, 通讯和IT服务, 文化体育娱乐活动, 医疗健康, 游戏, 运动户外, 招商加盟服务, 珠宝钟表眼镜, 个人护理, 玩具
// 50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2|17|67|68

export const ad_categorys = [{
  "name": "餐饮",
  "id": 50
}, {
  "name": "出版发行",
  "id": 47
}, {
  "name": "房地产",
  "id": 28
}, {
  "name": "服饰鞋帽箱包",
  "id": 55
}, {
  "name": "工业工程和安保",
  "id": 56
}, {
  "name": "国家机构协会和社会工作",
  "id": 39
}, {
  "name": "护肤彩妆",
  "id": 8
}, {
  "name": "互联网电商服务",
  "id": 1
}, {
  "name": "互联网内容资讯服务",
  "id": 64
}, {
  "name": "互联网其他服务",
  "id": 66
}, {
  "name": "家装家具",
  "id": 35
}, {
  "name": "交通运输和仓储",
  "id": 29
}, {
  "name": "教育",
  "id": 5
}, {
  "name": "节能环保",
  "id": 31
}, {
  "name": "金融",
  "id": 6
}, {
  "name": "酒水",
  "id": 63
}, {
  "name": "科研和技术服务",
  "id": 59
}, {
  "name": "零售和百货",
  "id": 51
}, {
  "name": "旅游出行",
  "id": 7
}, {
  "name": "能源和供应",
  "id": 57
}, {
  "name": "农林牧渔和采矿, ",
  "id": 46
}, {
  "name": "汽车",
  "id": 41
}, {
  "name": "亲子",
  "id": 24
}, {
  "name": "日用百货",
  "id": 37
}, {
  "name": "软件工具",
  "id": 42
}, {
  "name": "商务服务",
  "id": 58
}, {
  "name": "生活服务",
  "id": 61
}, {
  "name": "食品",
  "id": 62
}, {
  "name": "数码家电",
  "id": 48
}, {
  "name": "数字内容创作",
  "id": 65
}, {
  "name": "通讯和IT服务",
  "id": 36
}, {
  "name": "文化体育娱乐活动",
  "id": 60
}, {
  "name": "医疗健康",
  "id": 21
}, {
  "name": "游戏",
  "id": 43
}, {
  "name": "运动户外",
  "id": 16
}, {
  "name": "招商加盟服务",
  "id": 2
}, {
  "name": "珠宝钟表眼镜",
  "id": 17
}, {
  "name": "个人护理",
  "id": 67
}, {
  "name": "玩具",
  "id": 68
}]

export const adMarkerContentInUEditor = `<section style="display:flex;justify-content:center;align-items:center;width:100%;height:60px;border:solid 1px #ccc;background-color:#8c8c8c;padding:2px;">===手工广告区域，请勿修改===<\/section>`
const regAdMarkerInUEditor = /<section style="display:flex;justify-content:center;align-items:center;width:100%;height:60px;border:solid 1px #ccc;background-color:#8c8c8c;padding:2px;">===手工广告区域，请勿修改===<\/section>/gm

export const adMarkerContentInWangEditor = `<h1>===手工广告，请勿修改===<\/h1>`
const regAdMarkerInWangEditor = /<h1>===手工广告，请勿修改===<\/h1>/gm
const regAdMarkerInRaw = /<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="([^"]+)" data-id="(\d+)" src="\/cgi-bin\/readtemplate\?t=tmpl\/cpc_tmpl#\d+">&nbsp;<\/mpcpc><\/section>/gm

export function has_ad_in_raw(html) {
  const match = html.match(regAdMarkerInRaw)
  return match && match[1];
}

export function has_ad_in_UEditor(html) {
  console.log("=====has_ad_in_UEditor====", html)
  const match = html.match(regAdMarkerInUEditor)
  console.log("match=>", match)
  return match && match[0];
}

export function format_ad_content_in_UEditor(html) {
  // const reg1 = /<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="([^"]+)" data-id="(\d+)" src="\/cgi-bin\/readtemplate\?t=tmpl\/cpc_tmpl#\d+">&nbsp;<\/mpcpc><\/section>/gm
  const matches = html.matchAll(regAdMarkerInRaw)
  let category_id_list = "", ad_id = 0
  console.log("matches=>", matches)
  let hasMatched = false
  for (const match of matches) {
    if (match[1] && match[2]) {
      // console.log(`category_id_list: ${match[1]} / id: ${match[2]}.`);
      // console.log("match=>", match)
      category_id_list = match[1]
      ad_id = parseInt(match[2])
      hasMatched = true
      break;
    }
  }
  let formated = html
  if (hasMatched) {
    formated = html.replaceAll(regAdMarkerInRaw, adMarkerContentInUEditor)
    console.log("adMarkerContentInUEditor=>", adMarkerContentInUEditor)
  }
  
  return {
    formated,
    category_id_list,
    ad_id
  }
}

export function restore_ad_content_from_UEditor(html, category_id_list, ad_id) {
  const ts = +new Date()
  if (ad_id === 0) {
    ad_id = ts
  }
  const ad_content_template = `<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="${category_id_list}" data-id="${ad_id}" src="/cgi-bin/readtemplate?t=tmpl/cpc_tmpl#${ad_id}">&nbsp;</mpcpc></section>`
  let replaced = html.replaceAll(regAdMarkerInUEditor, ad_content_template)
  return replaced
}

export function has_ad_in_wangEditor(html) {
  console.log("=====has_ad_in_wangEditor====", html)
  const match = html.match(regAdMarkerInWangEditor)
  console.log("match=>", match)
  return match && match[0];
}



export function format_ad_content(html) {
  // const reg1 = /<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="([^"]+)" data-id="(\d+)" src="\/cgi-bin\/readtemplate\?t=tmpl\/cpc_tmpl#\d+">&nbsp;<\/mpcpc><\/section>/gm
  const matches = html.matchAll(regAdMarkerInRaw)
  let category_id_list = "", ad_id = 0
  // console.log("matches=>", matches)
  let hasMatched = false
  for (const match of matches) {
    if (match[1] && match[2]) {
      // console.log(`category_id_list: ${match[1]} / id: ${match[2]}.`);
      // console.log("match=>", match)
      category_id_list = match[1]
      ad_id = parseInt(match[2])
      hasMatched = true
      break;
    }
  }
  let formated = html
  if (hasMatched) {
    formated = html.replaceAll(regAdMarkerInRaw, adMarkerContentInWangEditor)
  }
  return {
    formated,
    category_id_list,
    ad_id
  }
}

// ===手工广告，请勿修改===
// 餐饮, 出版发行, 房地产, 服饰鞋帽箱包, 工业工程和安保, 国家机构协会和社会工作, 护肤彩妆, 互联网电商服务, 互联网内容资讯服务, 互联网其他服务, 家装家具, 交通运输和仓储, 教育, 节能环保, 金融, 酒水, 科研和技术服务, 零售和百货, 旅游出行, 能源和供应, 农林牧渔和采矿, 汽车, 亲子, 日用百货, 软件工具, 商务服务, 生活服务, 食品, 数码家电, 数字内容创作, 通讯和IT服务, 文化体育娱乐活动, 医疗健康, 游戏, 运动户外, 招商加盟服务, 珠宝钟表眼镜, 个人护理, 玩具
// 50|47|28|55|56|39|8|1|64|66|35|29|5|31|6|63|59|51|7|57|46|41|24|37|42|58|61|62|48|65|36|60|21|43|16|2|17|67|68
export function restore_ad_content(html, category_id_list, ad_id) {
  const ts = +new Date()
  if (ad_id === 0) {
    ad_id = ts
  }
  const ad_content_template = `<section class="wx-edui-media-wrp custom_select_card_wrp audio_card_wrp"><mpcpc class="js_cpc_area res_iframe cpc_iframe" js_editor_cpcad="" data-category_id_list="${category_id_list}" data-id="${ad_id}" src="/cgi-bin/readtemplate?t=tmpl/cpc_tmpl#${ad_id}">&nbsp;</mpcpc></section>`
  // const reg1 = /<h1>===手工广告，请勿修改===<\/h1>/gm
  let replaced = html.replaceAll(regAdMarkerInWangEditor, ad_content_template)
  return replaced
}

export function removeAd(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const mpcpcs = tempDiv.querySelectorAll('mpcpc');
    
    if (mpcpcs.length === 0) {
      return html
    }
    // 替换每个匹配的 section
    mpcpcs.forEach(ct => {
        ct.parentNode.removeChild(ct);
    });
    return tempDiv.innerHTML;
}