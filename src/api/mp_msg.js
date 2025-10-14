import request from '@/utils/requestJson';
// {
//   wechat_id: 123
//   msg_id: 0 | 123
//   cookies: "",
//   token: 2033,
//   material_list: [{
//     content_noencode: "",
//     // cdn_url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/4WT2I2qqeFAibhrnd1BP6uhtX6Y395tHhMxfXaJrWW5w8JpQibmicJCqfdGL1uWQErUlUVyScV2bs59oj9rhicnTaQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=13&tp=wxpic",
//     cdn_url: "",
//     desc: "",
//     title: "",
//     author: "",
//     copyright_type: 0
//   }]
// }

export function saveArticleDraft(data) {
  return request({
    url: '/mp_msg/save',
    method: 'post',
    data
  });
}

export function send_to_other_accounts(data) {
  return request({
    url: '/mp_msg/send_to_other_accounts',
    method: 'post',
    data
  });
}

export function listArticlesByAppMsg(appmsgid) {
  return request({
    url: `/mp_msg/${appmsgid}/list`
  });
}

export function newlistArticlesByAppMsg(wechat_id, appmsgid) {
  return request({
    url: `/mp_msg/${wechat_id}/newlist?appmsgid=${appmsgid}`
  });
}

export function listArticleGroups(wechat_id) {
  return request({
    url: `/mp_msg/${wechat_id}/groups`
  });
}

export function swapArticles(msg_id1, msg_id2) {
  return request({
    url: `/mp_msg/swap`,
    method: 'post',
    data: {
      msg_id1,
      msg_id2
    }
  });
}

export function deleteArticleDraft(data) {
  return request({
    url: `/mp_msg/delete`,
    method: 'post',
    data
  });
}

export function removeMpMsg(data) {
  return request({
    url: `/mp_msg/remove`,
    method: 'post',
    data
  });
}

export function genArticleDraftPreviewUrl(data) {
  return request({
    url: `/mp_msg/gen_preview_url`,
    method: 'post',
    data
  });
}

// http://mp.weixin.qq.com/s?__biz=Mzk0NzI2NTI3Ng==&tempkey=MTMyMl9oRC92Vit1NmRQdUZsRDFPREVDSldoYkF3RXJGeUh3M2lwQk9EWlFRYkFnMGxwVGFMVkIxRGY3YnRBODdBczYxY19GV1VJRXFhLWlxTGtPbHBBNGRZMC1mRWdsLVBLYk5JWXd6WWl1QnJsQXFRbVptQ2hyZjVzSXBOTGVHeUR6T3YxOERvNUFtdWtwTFoxNEEzbEduVGg0ejlUTkhGcTNmWC12Q053fn4%3D&chksm=4378ca1a740f430ce42b4b1675a3644c192ce468ec7b61c5ddfb4332f15329121231a91ac238#rd

export function previewArticleDraft(url) {
  return request({
    url: `/mp_msg/proxy_preview_url?url=${url}`
  });
}

export function previewQRCode(url) {
  return request({
    url: `/mp_msg/preview_qr_code?url=${url}`
  });
}

export function getUserTempl(data) {
  return request({ url: '/style/customize_list', data });
}
export function saveUserTempl(data = { template_name: '', content: '' }) {
  return request({ url: '/style/customize', method: 'post', data });
}
export function delUserTempl(data = { style_ids: [0] }) {
  return request({ url: '/style/delete', method: 'post', data });
}
export function getSysTempl(params) {
  return request({ url: '/style/categories', params });
}
export async function getNiceSysTempl(params) {
  var res = await request({ url: '/style/categories', params });
  var CAG_ROOT_ID = 1;
  var list = [];
  res.data.data.forEach(v => {
    if (v.parent_id === CAG_ROOT_ID) {
      v.children = res.data.data.filter(c => c.parent_id === v.id).sort((a, b) => a.sort_no - b.sort_no);
      list.push(v);
    }
  });
  list.sort((a, b) => a.sort_no - b.sort_no);
  res.data.data = list;
  return res;
}
export function getSysTemplByCat(id, params = { offset: 0, limit: 5000 }) {
  return request({ url: `/style/category/${id}/styles`, params });
}

// 查询默认模板数据
export function getDefaultTempl() {
  return request({
    url: `/user/guides`,
    method: 'get'
  });
}

export function setDefaultTempl(data) {
  return request({
    url: '/user/guides/set',
    method: 'post',
    data
  });
}

export function delDefaultTempl() {
  return request({
    url: '/user/guides/delete',
    method: 'post'
  });
}
