import request from '@/utils/requestJson'

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
  })
}

export function listArticlesByAppMsg(appmsgid) {
  return request({
    url: `/mp_msg/${appmsgid}/list`
  })
}

export function swapArticles(msg_id1, msg_id2) {
  return request({
    url: `/mp_msg/swap`,
    method: 'post',
    data: {
      msg_id1, 
      msg_id2
    }
  })
}

export function deleteArticleDraft(data) {
  return request({
    url: `/mp_msg/delete`,
    method: 'post',
    data
  })
}

