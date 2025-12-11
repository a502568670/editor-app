import request from '@/utils/request';

export function getShopCommodity(data) {
  return request({
    url: `https://mp.weixin.qq.com/shop-faas/mmeckolnode/mp/listTalentSelectionSpuItems?token=${data.token}&lang=zh_CN`,
    method: 'post',
    data: {
      listCondition: data.listCondition
    },
    headers: {
      Cookie: data.cookie,
      Referer: 'https://mp.weixin.qq.com/cgi-bin/appmsg'
    }
  });
}
