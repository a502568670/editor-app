var {net} = require('electron');

var api = {
    yesterdaySumm: t => `https://mp.weixin.qq.com/cgi-bin/home?t=home/index&token=${t}&lang=zh_CN&f=json`,
    illegalRecord: t => `https://mp.weixin.qq.com/cgi-bin/illegalrecord?count=10&token=${t}&lang=zh_CN&f=json`,
    illegalRecordRecent: 'https://mp.weixin.qq.com/cgi-bin/sysnotify',
    fansRate: (t,d) => `https://mp.weixin.qq.com/misc/useranalysis?action=attr&token=${t}&lang=zh_CN&begin_date=${d}&end_date=${d}&f=json`,
    postCount: t => `https://mp.weixin.qq.com/cgi-bin/masssendpage?t=mass/send&token=${t}&lang=zh_CN&f=json`,
    promo: (t) => `https://mp.weixin.qq.com/promotion/publisher/publisher_mgr?token=${t}&appid=&spid=`,
    promoBank:t=>`https://mp.weixin.qq.com/promotion/publisher/bankinfo_mgr?action=get_info&token=${t}&appid=&spid`,
    income:t=>{
        var d = new Date(Date.now()-24*60*60*1000);
        var de = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        d = new Date(Date.now()-30*24*60*60*1000);
        var ds = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        return `https://mp.weixin.qq.com/promotion/publisher/publisher_stat?action=income&page=1&page_size=100&cont_type=0&start_date=${ds}&end_date=${de}&token=${t}&appid=&spid=`;
    },
    incomeMon:t=>{
        var d = new Date(Date.now()-24*60*60*1000);
        var de = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        d.setDate(1);
        var ds = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        return `https://mp.weixin.qq.com/promotion/publisher/publisher_stat?action=income&page=1&page_size=100&cont_type=0&start_date=${ds}&end_date=${de}&token=${t}&appid=&spid=&_=${Date.now()/1000|0}`;
    },
    info:t=>`https://mp.weixin.qq.com/cgi-bin/settingpage?t=setting/index&action=index&token=${t}&lang=zh_CN&f=json&f=json`,
};

async function batchWechatData(mpList) {
    var dataPromise = mpList.map(getWechatPvData);
    var data = await Promise.allSettled(dataPromise);
    return data;
}
function toReqOpts(url, opts = {}) {
    var {protocol,hostname,port,pathname,search} = new URL(url);
    port = port || protocol === 'https:' ? 443 : 80;
    return {protocol,hostname,port,path:pathname+search,...opts};
}
function netFetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
        var req = net.request(toReqOpts(url, opts));
        req.on('response', (res) => {
            var chunk = [];
            res.on('data', c => chunk.push(c));
            res.on('end', () => {
                resolve(Buffer.concat(chunk).toString());
            });
        });
        req.on('error', reject);
        if (opts.body) req.write(opts.body);
        req.end();
    });
}
async function getWechatPvData(info) {
    var cookie = JSON.parse(info.session_id).cookie.map(v => `${v.name}=${v.value}`).join(';')
    var opts = {headers:{cookie,referer:'https://mp.weixin.qq.com/'}};
    var d = new Date();
    var date = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
    // console.log(api.income(info.token),api.incomeMon(info.token));
    
    var data = await Promise.allSettled([
        netFetch(api.yesterdaySumm(info.token), opts),
        netFetch(api.illegalRecord(info.token), opts),
        netFetch(api.illegalRecordRecent, {...opts,method:'POST',body:`token=${info.token}&lang=zh_CN&f=json&ajax=1&fingerprint=aa8c8d5bea554e6e4c9ea1ed0dbb354e&random=0.42004186469861293&begin=0&count=20&status=0`}),
        netFetch(api.fansRate(info.token, date), opts),
        netFetch(api.postCount(info.token), opts),
        netFetch(api.promo(info.token), opts),
        netFetch(api.promoBank(info.token), opts),
        netFetch(api.income(info.token), opts),
        netFetch(api.incomeMon(info.token), opts),
        netFetch(api.info(info.token), opts),
    ]);
    return data;
}

exports.batchWechatData = batchWechatData;
exports.toReqOpts = toReqOpts;
exports.netFetch = netFetch;
