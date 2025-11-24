import { gen_unique_id } from './msic';

/**
 * 微信小店/返佣商品标签处理模块
 * 支持 cardtype: 0(大图卡), 1(小图卡), 2(文字链接), 12(图片链接)
 */

// ============ 微信格式模板生成 ============

/**
 * 生成微信原生商品标签
 * @param {Object} data - 商品数据
 * @returns {string} 微信格式的 HTML
 */
export function tplWithCommission(data) {
  const windowproduct = data.windowproduct || data.product_key || data.id || '';
  const title = data.title || '';
  const type = data.type || 0;
  const cardtype = parseCardType(data);

  // 基础商品标签
  const productTag = `<mp-common-product data-windowproduct="${windowproduct}" data-cardtype="${cardtype}" data-title="${escapeAttr(
    title
  )}" data-type="${type}"></mp-common-product>`;

  // 图片链接样式（cardtype=12）
  if (cardtype === 12 && data.product_imageurl) {
    return buildImageLinkTemplate(windowproduct, title, data.product_imageurl, productTag);
  }

  // 文字链接样式（cardtype=2）
  if (cardtype === 2) {
    return `<span class="product_card_text_wrp" data-weui-theme="light">
      <a href="javascript:void(0);" class="product_text_link" style="color: rgb(87, 107, 149);">
        ${escapeHtml(title)}
      </a>
      <iframe src="#" scrolling="no" frameborder="0" class="iframe_style" style="width: 350px; display: none;"></iframe>
    </span>`;
  }

  // 默认：包装在 wrapper 中
  const wrapperClass = 'mp_common_product_iframe_wrp';
  return `<section class="${wrapperClass}" nodeleaf="">${productTag}</section>`;
}

/**
 * 生成图片链接模板
 */
function buildImageLinkTemplate(windowproduct, title, imageUrl, productTag) {
  return `<section>
    <span leaf="">${productTag}</span>
    <a class="product_image_link js_product_entry"
       data-windowproduct="${windowproduct}"
       data-cardtype="12"
       data-title="${escapeAttr(title)}"
       data-product-imageurl="${imageUrl}"
       tagname="mp-common-product">
      <img class="rich_pages wxw-img"
           data-ratio="1.33359375"
           data-w="1280"
           data-imgqrcoded="1"
           data-src="${imageUrl}">
    </a>
  </section>`;
}

// ============ 编辑器格式模板生成 ============

/**
 * 生成编辑器内的占位符标签
 */
export function tplCommissionInEditor(uniqid, data) {
  return `<section id="${uniqid}" role="gqs-mpcommission">${_buildEditorPreview(data)}</section>`;
}

/**
 * 根据 cardtype 生成不同的编辑器预览
 */
function _buildEditorPreview(data) {
  const cardtype = parseCardType(data);
  const title = data.title || '';
  const img = data.product_imageurl || data.img || '';

  switch (cardtype) {
    case 0:
      return buildLargeCardPreview(title, img);
    case 1:
      return buildSmallCardPreview(title, img);
    case 2:
      return buildTextLinkPreview(title);
    case 12:
      return buildImageLinkPreview(title, img);
    default:
      return `<section class="unknown-card">未识别的商品卡片类型: ${cardtype}</section>`;
  }
}

/**
 * 大图卡预览
 */
function buildLargeCardPreview(title, img) {
  return `<section class="iframe_wrp wx_card_root" data-weui-theme="light">
    <section class="product-container client-type-B">
      <section id="product-id-card" class="product-large">
        <section class="normal-product-large">
          <section class="product-img-container" style="width: 350px; height: 350px;">
            <img src="${img}" class="product-img large" style="object-fit: cover; width: 350px; height: 350px;" />
            <section class="product-img-error" style="display: none;">图片加载失败</section>
          </section>
          <section class="product-title__outer large">
            <section class="product-title two-line">
              <span></span><span>${escapeHtml(title)}</span>
            </section>
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
                  <section><button class="btn type-primary">购买</button></section>
                </section>
              </section>
            </section>
          </section>
          <section class="product-shop__outer large">
            <section class="product-shop">
              <section class="product-shop__inner">
                <section class="left">
                  <img src="https://res.wx.qq.com/shop/public/2024-10-17/fae7be51-beb6-4e61-aad8-4c1f7ccfab83.png" class="icon img-color-invert">
                  <section class="text">店铺名称</section>
                  <img src="https://res.wx.qq.com/shop/public/2025-07-30/54c42de7-2686-4650-ac5e-87605f0a3011.png" class="right-icon icon-r">
                </section>
              </section>
            </section>
          </section>
        </section>
      </section>
    </section>
  </section>`;
}

/**
 * 小图卡预览
 */
function buildSmallCardPreview(title, img) {
  return `<section class="iframe_wrp wx_card_root" data-weui-theme="light">
    <section class="product-container client-type-B">
      <section id="product-id-card" class="product-little">
        <section class="small-product-little">
          <section class="product-little__outer">
            <section class="product-img-container" style="width: 109px; height: 109px;">
              <img src="${img}" class="product-img little" style="object-fit: cover; width: 109px; height: 109px;">
              <section class="product-img-error" style="display: none;">图片加载失败</section>
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
                    <section class="tag-body primary" style="visibility: visible;">先用后付</section>
                    <section class="tag-body primary" style="visibility: visible;">运费险</section>
                    <section class="tag-body primary" style="visibility: visible;">7天无理由</section>
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
                        <section class="price-box">
                          <section class="more">
                            <section class="money">¥6.9</section>
                            <section class="add">起</section>
                          </section>
                        </section>
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
                  <img src="https://res.wx.qq.com/shop/public/2024-10-17/fae7be51-beb6-4e61-aad8-4c1f7ccfab83.png" class="icon img-color-invert">
                  <section class="text">店铺名称</section>
                  <img src="https://res.wx.qq.com/shop/public/2025-07-30/54c42de7-2686-4650-ac5e-87605f0a3011.png" class="right-icon icon-r">
                </section>
              </section>
            </section>
          </section>
        </section>
      </section>
    </section>
  </section>`;
}

/**
 * 文字链接预览
 */
function buildTextLinkPreview(title) {
  return `<span class="product_card_text_wrp" data-weui-theme="light">
    <a href="javascript:void(0);" class="product_text_link" style="color: rgb(87, 107, 149);">
      ${escapeHtml(title)}
    </a>
    <iframe src="#" scrolling="no" frameborder="0" class="iframe_style" style="width: 350px; display: none;"></iframe>
  </span>`;
}

/**
 * 图片链接预览
 */
function buildImageLinkPreview(title, img) {
  return `<span class="product_card_text_wrp" data-weui-theme="light">
    <a href="javascript:void(0);" class="product_text_link" style="color: rgb(87, 107, 149);">
      ${escapeHtml(title)}
    </a>
    <iframe src="#" scrolling="no" frameborder="0" class="iframe_style" style="width: 350px; display: none;"></iframe>
  </span>
  <a class="product_image_link js_product_entry" style="">
    <img src="${img}" class="rich_pages wxw-img" data-ratio="1" data-w="1024" data-imgqrcoded="1">
  </a>`;
}

// ============ 双向转换函数 ============

/**
 * 检测 HTML 中是否包含商品卡片
 */
export function hasCommissionInEditor(html) {
  return /gqs-mpcommission/gm.test(html);
}

/**
 * 编辑器格式 → 微信格式
 */
export function replaceCommissionToWechat(html, deps) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const gqsSections = tempDiv.querySelectorAll('section[role="gqs-mpcommission"]');
  if (gqsSections.length === 0) return html;

  gqsSections.forEach(section => {
    const uniqid = section.getAttribute('id');
    const dep = deps[uniqid];

    if (!dep) {
      console.warn(`Missing data for commission card: ${uniqid}`);
      return;
    }

    const replacement = document.createElement('div');
    replacement.innerHTML = tplWithCommission(dep);
    section.parentNode.replaceChild(replacement, section);
  });

  return tempDiv.innerHTML;
}

/**
 * 微信格式 → 编辑器格式
 */
export function replaceCommissionFromWechat(html, deps) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const wechatTags = tempDiv.querySelectorAll('mp-common-product');
  if (wechatTags.length === 0) return html;

  wechatTags.forEach(ct => {
    const section = ct.closest('section') || ct.parentNode;
    const uniqid = gen_unique_id();
    const replacement = document.createElement('section');
    replacement.setAttribute('id', uniqid);
    replacement.setAttribute('role', 'gqs-mpcommission');

    // 提取属性
    const dataAttrs = extractAttributes(ct, section);

    replacement.innerHTML = _buildEditorPreview(dataAttrs);
    section.parentNode.replaceChild(replacement, section);
    deps[uniqid] = dataAttrs;
  });

  return tempDiv.innerHTML;
}

/**
 * 从微信标签中提取属性
 */
function extractAttributes(ct, section) {
  const dataAttrs = {
    windowproduct:
      ct.getAttribute('data-windowproduct') ||
      ct.getAttribute('data-windowProduct') ||
      ct.getAttribute('data-window_product') ||
      '',
    cardtype: ct.getAttribute('data-cardtype') || ct.getAttribute('data-cardType') || '0',
    title: ct.getAttribute('data-title') || '',
    type: ct.getAttribute('data-type') || '0'
  };

  // 尝试提取图片链接
  const siblingA = section.querySelector('.product_image_link');
  if (siblingA) {
    dataAttrs.product_imageurl =
      siblingA.getAttribute('data-product-imageurl') ||
      siblingA.querySelector('img')?.getAttribute('data-src') ||
      siblingA.querySelector('img')?.getAttribute('src') ||
      '';

    // 如果有图片链接但 cardtype 未设置，默认为 2
    if (!dataAttrs.cardtype) {
      dataAttrs.cardtype = '2';
    }
  }

  return dataAttrs;
}

// ============ API 请求函数 ============

/**
 * 获取商品加密 key（windowproduct）
 */
export async function getWindowProduct({ token, cookies, product_id, fingerprint = '' } = {}) {
  const url = 'https://mp.weixin.qq.com/cgi-bin/windowproduct?action=get_windowproduct';

  const dataField = JSON.stringify({
    base_req: { action: 'GetCpsProductEncryptKey' },
    ext_info: JSON.stringify({
      product_id: [product_id],
      cps_id: []
    })
  });

  const body = new URLSearchParams({
    data: dataField,
    lang: 'zh_CN',
    f: 'json',
    ajax: '1'
  });

  if (fingerprint) body.append('fingerprint', fingerprint);
  if (token) body.append('token', token);

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  };
  if (cookies) headers['cookie'] = cookies;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: body.toString(),
      credentials: 'include'
    });
    return await resp.json();
  } catch (error) {
    console.error('获取 windowproduct 失败:', error);
    throw error;
  }
}

// ============ 工具函数 ============

/**
 * 解析 cardtype
 */
function parseCardType(data) {
  if (data.cardtype !== undefined) return parseInt(data.cardtype);
  if (data.cardType !== undefined) return parseInt(data.cardType);
  return 0;
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 属性转义
 */
function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
