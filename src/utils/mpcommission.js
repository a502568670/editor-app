import { gen_unique_id } from './msic';

// 处理微信小店/返佣商品标签 (<mp-common-product>) 的双向替换逻辑
// 支持 cardtype: 0(大图), 1(小图), 2(文字/内联), 12(图片链接)

export function tplWithCommission(data) {
  // 根据 data.cardtype 返回对应的微信原生片段
  const windowproduct = data.windowproduct || data.product_key || data.id || '';
  const title = data.title || '';
  const type = data.type || 0; // 0 表示商品
  const cardtype = (data.cardtype !== undefined) ? data.cardtype : (data.cardType || 0);

  // 基础 mp-common-product 标签
  const productTag = `<mp-common-product data-windowproduct="${windowproduct}" data-cardtype="${cardtype}" data-title="${escapeAttr(title)}" data-type="${type}"></mp-common-product>`;

  if (cardtype === 2 && data.product_imageurl) {
    // 图片链接样式（Python 示例中的 tag_pic_link）
    const imgUrl = data.product_imageurl;
    return `<section><span leaf="">${productTag}</span><a class="product_image_link js_product_entry" data-windowproduct="${windowproduct}" data-cardtype="12" data-title="${escapeAttr(title)}" style="" data-product-imageurl="${imgUrl}" tagname="mp-common-product"><img class="rich_pages wxw-img" data-ratio="1.33359375" data-w="1280" data-imgqrcoded="1" data-src="${imgUrl}"></a></section>`;
  }

  // 默认：包在一个 wrapper 中
  const wrapperClass = 'mp_common_product_iframe_wrp';
  return `<section class="${wrapperClass}" nodeleaf="">${productTag}</section>`;
}

export function tplCommissionInEditor(uniqid, data) {
  return `<section id="${uniqid}" role="gqs-mpcommission">${_tplCommissionInEditor(data)}</section>`;
}

function _tplCommissionInEditor(data) {
  // 生成编辑器内预览 HTML，根据 cardtype 可返回不同展示
  const cardtype = (data.cardtype !== undefined) ? parseInt(data.cardtype) : (data.cardType ? parseInt(data.cardType) : 0);
  const title = data.title || '';
  const img = data.product_imageurl || data.img || '';
  if (cardtype === 0) {
    // 大图卡
    return `<section class="iframe_wrp wx_card_root" data-weui-theme="light">
      <section class="product-container client-type-B">
        <section id="product-id-card" class="product-large">
          <section class="normal-product-large">
            <section class="product-img-container" style="width: 350px; height: 350px;">
              <img src="${img}" class="product-img large" style="object-fit: cover; width: 350px; height: 350px;" />
              <section class="product-img-error" style="display: none;">图片加载失败</section>
            </section>
            <section class="product-title__outer large">
              <section class="product-title two-line"><span></span><span>${escapeHtml(title)}</span></section>
            </section>
            <section class="product-tag__outer large">
              <section class="product-tag">
                <section class="tag-body primary" style="visibility: visible;">先用后付</section>
                <section class="tag-body primary" style="visibility: visible;">运费险</section>
                <section class="tag-body primary" style="visibility: visible;">7天无理由</section>
              </section>
            </section>
            <section class="product-info__outer">
              <section class="product-info">
                <section class="left">
                  <section class="product-price" price-type="more">
                    <section class="price-box">
                      <section class="more">
                        <section class="money">¥6.9</section>
                        <section class="add">起</section>
                      </section>
                    </section>
                  </section>
                  <section class="history large">
                    <section class="history-inner">已售1.4万</section>
                  </section>
                </section>
                <section class="right">
                  <section class="btn__area large">
                    <section>
                      <button class="btn type-primary">购买</button>
                    </section>
                  </section>
                </section>
              </section>
            </section>
            <section class="product-shop__outer large">
              <section class="product-shop">
                <section class="product-shop__inner">
                  <section class="left">
                    <img src="https://res.wx.qq.com/shop/public/2024-10-17/fae7be51-beb6-4e61-aad8-4c1f7ccfab83.png" class="icon img-color-invert"><section class="text">乐之沭花卉园艺</section><img src="https://res.wx.qq.com/shop/public/2025-07-30/54c42de7-2686-4650-ac5e-87605f0a3011.png" class="right-icon icon-r">
                  </section>
                </section>
              </section>
            </section>
          </section>
        </section>
      </section>
    </section>`;
  } else if (cardtype === 1) {
    // 小图卡
    return `
    <section class="iframe_wrp wx_card_root" data-weui-theme="light">
      <section class="product-container client-type-B">
        <section id="product-id-card" class="product-little">
          <section class="small-product-little">
            <section class="product-little__outer">
              <section class="product-img-container" style="width: 109px; height: 109px;">
                <img src="${img}" class="product-img little" style="object-fit: cover; width: 109px; height: 109px;">
                <section class="product-img-error" style="display: none;">
                  图片加载失败
                </section>
              </section>
            <section class="product-right">
              <section class="product-right-top">
                <section class="product-title__outer little">
                  <section class="product-title two-line">
                    <span></span><span>${escapeHtml(title)}</span>
                  </section>
                </section>
                <section class="product-tag__outer little">
                  <section class="product-tag">
                    <section class="tag-body primary" style="visibility: visible;">
                      先用后付
                    </section>
                    <section class="tag-body primary" style="visibility: visible;">
                      运费险
                    </section>
                    <section class="tag-body primary" style="visibility: visible;">
                      7天无理由
                    </section>
                  </section>
                </section>
                <section class="history little">
                  <section class="history-inner">已售1.4万</section>
                </section>
              </section>
              <section class="product-right-bottom">
                <section class="product-info__outer">
                  <section class="product-info">
                    <section class="info-left">
                      <section class="product-price" price-type="more">
                        <section class="price-box"><section class="more"><section class="money">¥6.9</section><section class="add">起</section></section></section>
                      </section>
                    </section>
                    <section class="info-right">
                      <section class="btn__area little">
                        <section><button class="btn type-primary">购买</button></section>
                      </section>
                    </section>
                  </section>
                </section>
              </section>
            </section>
          </section>
          <section class="product-shop__outer little">
            <section class="product-shop">
              <section class="product-shop__inner">
                <section class="left">
                  <img src="https://res.wx.qq.com/shop/public/2024-10-17/fae7be51-beb6-4e61-aad8-4c1f7ccfab83.png" class="icon img-color-invert"><section class="text">乐之沭花卉园艺</section><img src="https://res.wx.qq.com/shop/public/2025-07-30/54c42de7-2686-4650-ac5e-87605f0a3011.png" class="right-icon icon-r">
                </section>
              </section>
            </section>
          </section>
        </section>
      </section>
    </section>
  </section>`;
  } else if (cardtype === 12) {
    return `
    <span class="product_card_text_wrp" data-weui-theme="light">
      <a href="javascript:void(0);" class="product_text_link" style="color: rgb(87, 107, 149);">
      ${escapeHtml(title)}
      </a>
      <iframe src="https://mp.weixin.qq.com/shop/ssr/wap/business?productkey=v2%3DHBn3QBTsUXn-8xhONE13SbuYdeSi5GEjhuLTQAknlZMQxTvlol7Jy1f_jr3_-PUvp8ApUavSytLd2w&amp;reqScene=0&amp;token=1847538552&amp;cardtype=2" scrolling="no" frameborder="0" class="iframe_style" style="width: 350px; display: none;"></iframe>
    </span>
    <a class="product_image_link js_product_entry" data-windowproduct="v2=HOwe564MSF_KUkg3zvu8T2Yv1ipolT8JmdbqM0ykEGWOZJcBMH4wwg5iOHrG8Rz1qiX7ozF37pH5Jw" data-cardtype="12" data-title="${escapeHtml(title)}" style="" data-product-imageurl="https://mmbiz.qpic.cn/sz_mmbiz_png/01n22mhTEibJUt8dOe8hAFjq2ByR2MSkFY3EQGibbZBRRcP1CtMoNL647gIfd05Ft0lVf8J5LHMWHPxlcZYc7ibvg/0?wx_fmt=png&amp;from=appmsg" tagname="mp-common-product"><img src="https://mmbiz.qpic.cn/sz_mmbiz_png/01n22mhTEibJUt8dOe8hAFjq2ByR2MSkFY3EQGibbZBRRcP1CtMoNL647gIfd05Ft0lVf8J5LHMWHPxlcZYc7ibvg/0?wx_fmt=png&amp;from=appmsg" class="rich_pages wxw-img" contenteditable="false" data-ratio="1" data-w="1024" data-imgqrcoded="1"><img class="ProseMirror-separator" alt=""><br class="ProseMirror-trailingBreak"></a>
    `;
  } else if(cardtype === 2){
    return `
    <span class="product_card_text_wrp" data-weui-theme="light">
      <a href="javascript:void(0);" class="product_text_link" style="color: rgb(87, 107, 149);">
      ${escapeHtml(title)}
      </a>
      <iframe src="https://mp.weixin.qq.com/shop/ssr/wap/business?productkey=v2%3DHBn3QBTsUXn-8xhONE13SbuYdeSi5GEjhuLTQAknlZMQxTvlol7Jy1f_jr3_-PUvp8ApUavSytLd2w&amp;reqScene=0&amp;token=1847538552&amp;cardtype=2" scrolling="no" frameborder="0" class="iframe_style" style="width: 350px; display: none;"></iframe>
    </span>`;
  }
  return `<section>未识别的商品卡片</section>`;
}

export function hasCommissionInEditor(html) {
  const reg = /gqs-mpcommission/gm;
  return reg.test(html);
}

export function replaceCommissionToWechat(html, deps) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const gqsSections = tempDiv.querySelectorAll('section[role="gqs-mpcommission"]');
  if (gqsSections.length === 0) return html;
  gqsSections.forEach(section => {
    const uniqid = section.getAttribute('id');
    const dep = deps[uniqid];
    const replacement = document.createElement('div');
    // tplWithCommission 返回字符串片段，直接作为 innerHTML
    replacement.innerHTML = tplWithCommission(dep || {});
    // 把占位替换为生成的微信片段
    section.parentNode.replaceChild(replacement, section);
  });
  return tempDiv.innerHTML;
}

export function replaceCommissionFromWechat(html, deps) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  // 查找微信端的商品自定义标签 mp-common-product
  const wechatTags = tempDiv.querySelectorAll('mp-common-product');
  if (wechatTags.length === 0) return html;
  wechatTags.forEach(ct => {
    // 父容器通常是 <section> 或 <span>
    const section = ct.closest('section') || ct.parentNode;
    const uniqid = gen_unique_id();
    const replacement = document.createElement('section');
    replacement.setAttribute('id', uniqid);
    replacement.setAttribute('role', 'gqs-mpcommission');

    // 提取属性
    const dataAttrs = {
      windowproduct: ct.getAttribute('data-windowproduct') || ct.getAttribute('data-windowProduct') || ct.getAttribute('data-window_product'),
      cardtype: ct.getAttribute('data-cardtype') || ct.getAttribute('data-cardType'),
      title: ct.getAttribute('data-title') || '',
      type: ct.getAttribute('data-type') || '',
    };

    // 如果外层有 <a.product_image_link>，尝试提取图片链接
    const siblingA = section.querySelector('.product_image_link');
    if (siblingA) {
      dataAttrs.product_imageurl = siblingA.getAttribute('data-product-imageurl') || (siblingA.querySelector('img') ? siblingA.querySelector('img').getAttribute('data-src') || siblingA.querySelector('img').getAttribute('src') : '');
      // special: when Python example uses cardtype 12 for the <a>, but original mp tag may be cardtype 2
      if (!dataAttrs.cardtype) dataAttrs.cardtype = '2';
    }

    replacement.innerHTML = _tplCommissionInEditor(dataAttrs);
    section.parentNode.replaceChild(replacement, section);
    deps[uniqid] = dataAttrs;
  });
  return tempDiv.innerHTML;
}

// 可选：向微信后台请求 product_encrypt_key（windowproduct）
export async function getWindowProduct({ token, cookies, product_id, fingerprint = '' } = {}) {
  // 在浏览器环境中直接请求微信接口可能涉及 CORS 与 Cookie 策略，
  // 这个函数按表单格式构造请求体，供在可用环境（Electron renderer with proper headers）调用。
  const url = 'https://mp.weixin.qq.com/cgi-bin/windowproduct?action=get_windowproduct';
  const dataField = `{"base_req":{"action":"GetCpsProductEncryptKey"},"ext_info":"{\\"product_id\\":[${product_id}],\\"cps_id\\":[]}"}`;
  const body = new URLSearchParams();
  body.append('data', dataField);
  if (fingerprint) body.append('fingerprint', fingerprint);
  if (token) body.append('token', token);
  body.append('lang', 'zh_CN');
  body.append('f', 'json');
  body.append('ajax', '1');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  };
  if (cookies) headers['cookie'] = cookies; // 仅在受信任环境有效

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: body.toString(),
    credentials: 'include'
  });
  const json = await resp.json();
  return json;
}

// 小工具：转义 HTML / 属性
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
