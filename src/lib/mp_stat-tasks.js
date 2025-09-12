var {net, app} = require('electron');
var dayjs=require('dayjs')
var dog=require('debug')('editor:mp_stat-tasks');
var path=require('path');
var fs=require('fs');
var {postJsonToEditorApi}=require('./request.js');
var statUseranalysisJson=path.join(app.getPath('userData'),'stat_useranalysis.json');


var padZero = n => `${n<10?'0':''}${n}`
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
        var de = `${d.getFullYear()}-${padZero(d.getMonth()+1)}-${padZero(d.getDate())}`;
        d = new Date(Date.now()-30*24*60*60*1000);
        var ds = `${d.getFullYear()}-${padZero(d.getMonth()+1)}-${padZero(d.getDate())}`;
        return `https://mp.weixin.qq.com/promotion/publisher/publisher_stat?action=income&page=1&page_size=100&cont_type=0&start_date=${ds}&end_date=${de}&token=${t}&appid=&spid=`;
    },
    incomeMon:t=>{
        var d = new Date(Date.now()-24*60*60*1000);
        var de = `${d.getFullYear()}-${padZero(d.getMonth()+1)}-${padZero(d.getDate())}`;
        d.setDate(1);
        var ds = `${d.getFullYear()}-${padZero(d.getMonth()+1)}-${padZero(d.getDate())}`;
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
        // dog('netFetch',url,opts);
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
    var d = new Date(Date.now()-24*60*60*1000);
    var date = `${d.getFullYear()}-${padZero(d.getMonth()+1)}-${padZero(d.getDate())}`
    // console.log(api.fansRate(info.token,date));
    
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
async function getWxGroupList(account) {
    var cookie = JSON.parse(account.session_id).cookie.map(v => `${v.name}=${v.value}`).join(';')
    var opts = {headers:{cookie,referer:'https://mp.weixin.qq.com/'}};
    var res = await netFetch(`https://mp.weixin.qq.com/cgi-bin/masssendpage?t=mass/send&token=${account.token}&lang=zh_CN&f=json`, opts);
    return JSON.parse(res)
}
async function batchWxUploadImg(account, urls) {
    var cookie = JSON.parse(account.session_id).cookie.map(v => `${v.name}=${v.value}`).join(';')
    var opts = {
        method: 'POST',
        headers:{cookie,referer:'https://mp.weixin.qq.com/'},
    };
    var res = await Promise.all(urls.map(img=>
        netFetch(`https://mp.weixin.qq.com/cgi-bin/uploadimg2cdn?_=${Date.now()}&f=json&userlang=zh_CN&lang=zh_CN&ajax=1&plugin=mptooler&token=${account.token}`,
            {...opts,body:`t=ajax-editor-upload-img&imgUrl=${encodeURIComponent(img)}&token=${account.token}`})));
    
    return res.map(s => JSON.parse(s));
}
function wxFetch(url,opts={}){
    return netFetch(`https://mp.weixin.qq.com${url}`,{...opts,headers:{...opts.headers,referer:'https://mp.weixin.qq.com/'}}).then(s=>JSON.parse(s));
}
var queuePromises=[];
async function queueFetch(...opts){
    if(queuePromises.length>3){
        await (queuePromises.shift());
        await new Promise(r=>setTimeout(r,Math.random()*200+50));
    }
    var p=wxFetch(...opts);
    queuePromises.push(p);
    return p;
}
async function wxAggregate({account,user_id,start,end}){
    var {session_id,token,wechat_id,id} = account;
    var cookie = JSON.parse(session_id).cookie.map(v => `${v.name}=${v.value}`).join(';')
    var opts = {headers:{cookie}};
    var cubequery=tmpl=>new URLSearchParams({
        action:'query',token,f:'json',ajax:1,lang:'zh_CN',busi:3,tmpl,
        args:JSON.stringify({begin_date:start.replaceAll('-',''),end_date:end.replaceAll('-',''),offset:0,size:1000})
    }).toString()
    var res = await Promise.allSettled([
        wxFetch(`/cgi-bin/home?t=home/index&token=${token}&lang=zh_CN&f=json`,opts),
        // wxFetch(`/misc/useranalysis?action=attr&token=${token}&lang=zh_CN&begin_date=${end}&end_date=${end}&f=json`,opts),
        wxFetch(`/promotion/publisher/publisher_stat?action=income&page=1&page_size=9999&cont_type=0&start_date=${start}&end_date=${end}&token=${token}&appid=&spid=`,opts),
        wxFetch(`/promotion/publisher/publisher_stat?action=biz_ads_stat&page=1&page_size=9999&cont_type=0&start_date=${start}&end_date=${end}&token=${token}&appid=&spid=`,opts),
        wxFetch(`/misc/datacubequery?action=query`,{
            method:'POST',headers:{cookie},body:cubequery(17),
        }),
        wxFetch(`/misc/datacubequery?action=query`,{
            method:'POST',headers:{cookie},body:cubequery(2),
        }),
        wxFetch(`/misc/datacubequery?action=query`,{
            method:'POST',headers:{cookie},body:cubequery(4),
        }),
        wxFetch(`/useranalysis?&begin_date=${start}&end_date=${end}&source=99999999&token=${token}&lang=zh_CN&f=json&ajax=1`,opts),
    ]);
    if(res[0].status==='rejected'||res[0].value.base_resp.ret!==0){
        throw new Error(JSON.stringify(res[0].value));
    }
    if (!localDates[user_id]) localDates[user_id]={};
    else if (!localDates[user_id][id]) localDates[user_id][id]=[];
    var endDate=dayjs(end),startDate=dayjs(start).add(1,'day');
    var oneDates=[];
    while(endDate.isAfter(startDate)){
        var str=endDate.format('YYYY-MM-DD');
        if(!localDates[user_id][id].includes(str)){
            oneDates.push(str);
        }
        endDate=endDate.subtract(1,'day');
    }
    var useranalysis=await Promise.allSettled(oneDates.map(d=>
        queueFetch(`/misc/useranalysis?action=attr&token=${token}&lang=zh_CN&begin_date=${d}&end_date=${d}&f=json`,opts)
            .then((res) => {
                if(res.base_resp.ret===0){
                    localDates[user_id][id].push(d);
                }
                return res;
            })
    ));
    useranalysis=useranalysis.filter(v=>v.status==='fulfilled').map(v=>v.value);
    var [home_index,publisher_stat_income,publisher_stat_biz_ads_stat,datacubequery,datacubequery_read,datacubequery_share,useranalysis_cumulate]=res.map(v=>v.value)
    var stat_data={home_index,publisher_stat_income,publisher_stat_biz_ads_stat,datacubequery,datacubequery_read,datacubequery_share,useranalysis,useranalysis_cumulate}
    var data={wechat_id,stat_data};
    // dog('wxAggregate',data);
    return data;
}
async function batchWxAggregate({accounts,user_id,token},offset=0,limit=10) {
    if(offset>=accounts.length)return
    var end=dayjs().subtract(1,'day').format('YYYY-MM-DD');
    var start=dayjs().subtract(1,'day').subtract(1,'month').format('YYYY-MM-DD');
    var res=await Promise.allSettled(accounts.slice(offset,offset+limit).map(account=>wxAggregate({account,user_id,token,start,end})));
    var items=res.filter(v=>v.status==='fulfilled').map(v=>v.value)
    if(items.length>0){
        var setRes=await postJsonToEditorApi('/stat/set_mp_accounts_ex',{begin_date:start,end_date:end,items},{authorization:`Bearer ${token}`});
        dog('batchWxAggregate',offset,items,setRes);
    }
    return batchWxAggregate({accounts,user_id,token},offset+limit)
}
var localDates={};
/** @type {Promise<any>} */
var batchPromise;
async function batchWxAggregateSafe(accounts){
    if(!batchPromise){
        try {
            // localDates=require(statUseranalysisJson);
            localDates=JSON.parse(fs.readFileSync(statUseranalysisJson,'utf-8'));
            dog('load localDates from %o', statUseranalysisJson);
        } catch (err) {
            fs.writeFileSync(statUseranalysisJson,JSON.stringify({}),'utf-8');
        }
        batchPromise=batchWxAggregate(accounts);
        batchPromise.finally(()=>{
            batchPromise=null;
            fs.writeFileSync(statUseranalysisJson,JSON.stringify(localDates),'utf-8');
            dog('save localDates to %o', statUseranalysisJson);
        });
    }
    return batchPromise;
}

exports.getWxGroupList = getWxGroupList;
exports.batchWxUploadImg = batchWxUploadImg;
exports.batchWechatData = batchWechatData;
exports.batchWxAggregateSafe = batchWxAggregateSafe;
exports.toReqOpts = toReqOpts;
exports.netFetch = netFetch;
