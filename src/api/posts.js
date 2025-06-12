import {ElMessage} from 'element-plus'
import dayjs from 'dayjs'

export async function getPosts(params) {
    var req = await fetch(`https://www.dajiala.com/fbmain/main/v1/today_hot?${new URLSearchParams(params)}`);
    var res = await req.json();
    if(res.code!==0){
        ElMessage({type:'error',message:res.msg})
        throw new Error(res.msg);
    }
    return res.data;
}

export async function getDetailPosts(params) {
    var {start_time,end_time,is_original,category}=params;
    if(end_time){
        start_time=dayjs(end_time).unix()
        end_time=dayjs(end_time).add(1,'day').unix()
    }else{
        start_time=dayjs().startOf('date').subtract(3,'days').unix();
        end_time=dayjs().startOf('date').unix();
    }
    var search = {
        ...params,
        start_time,end_time,
    }
    var searchParams = new URLSearchParams(search);
    if(is_original===-1){
        searchParams.delete('is_original')
    }
    if(category===-1){
        searchParams.delete('category')
    }
    var req = await fetch(`http://47.96.22.8:5057/api/get_burst_articles?api_key=sRqGF0Tet701kiTpJsdhfdardfdf123&${searchParams}`,{method:'POST'});
    var res = await req.json();
    if(res.code!==0){
        ElMessage({type:'error',message:res.msg})
        throw new Error(res.msg);
    }
    return res;
}

var accesstoken='69712_6d054f8b28b153bfa6ab8f5bd486c6ba';
function showErrorMsg(resp) {
    var success=false;
    if('code' in resp){
        success=resp.code===0
    }else if('error_code' in resp){
        success=resp.error_code===0
    }else{
        throw new Error('showErrorMsg 未定义错误码')
    }
    if(!success){
        ElMessage({type:'error',message:resp.msg})
        throw new Error(resp.msg);
    }
}
export async function getMpFavAccounts(body={"group_id":0,"group_name":"全部"}) {
    var req = await fetch(`https://www.dajiala.com/fbmain/search/v1/favorite_list`,{
        method:'POST',headers:{accesstoken,'content-type':'application/json'},
        body:JSON.stringify(body),
    });
    var res = await req.json();
    showErrorMsg(res)
    return res.data
}
export async function delMpFavAccounts(body={mid:0}) {
    var req = await fetch(`https://www.dajiala.com/fbmain/search/v1/favorite_delete`,{
        method:'POST',headers:{accesstoken,'content-type':'application/json'},
        body:JSON.stringify(body),
    });
    var res = await req.json();
    showErrorMsg(res)
    return res.data
}
var REG_MPLINK=/https?\:\/\/mp\.weixin\.qq\.com\/[a-zA-Z]+(\?|\/[^\u4E00-\u9FFF]+)/im
export async function searchMpAccounts(body={"kw":"","num":6,"page":0}) {
    var mplink=REG_MPLINK.test(body.kw)
    var req = mplink ? 
        await fetch(`https://www.dajiala.com/fbmain/follow/v1/follow_key_search?kw=${encodeURIComponent(body.kw)}`,{headers:{accesstoken}})
        : await fetch(`https://www.dajiala.com/fbmain/search/v1/key_search`,{
            method:'POST',headers:{accesstoken,'content-type':'application/json'},
            body:JSON.stringify(body),
        });
    var res = await req.json();
    showErrorMsg(res)
    if(mplink){
        if(res.error_code==50000){
            // 自动收录
            req=await fetch(`https://www.dajiala.com/fbmain/follow/v1/collect_mp2`,{
                method:'POST',headers:{accesstoken},
                body:JSON.stringify({article_url:body.kw}),
            })
            res=await req.json()
            showErrorMsg(res)
            ElMessage({type:'success',message:'公众号已收录，请重新搜索后加关注'})
        }
        return {total:1,accounts:[res.data]}
    }
    return res.data
}
export async function getMpGroups() {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/group_list_ext`,{headers:{accesstoken}})
    var res = await req.json();
    showErrorMsg(res)
    return res.data;
}
export async function addMpGroup(body={name:''}) {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/group_add`,{
        method:'POST',headers:{accesstoken,'content-type':'application/json'},
        body:JSON.stringify(body),
    })
    var res = await req.json();
    showErrorMsg(res)
    return res.data;
}
export async function editMpGroup(body={group_id:0,name:''}) {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/group_rename`,{
        method:'PUT',headers:{accesstoken,'content-type':'application/json'},
        body:JSON.stringify(body),
    })
    var res = await req.json();
    showErrorMsg(res)
    return res.data;
}
export async function delMpGroup(params={group_id:0}) {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/group_delete?${new URLSearchParams(params)}`,{
        method:'DELETE',headers:{accesstoken},
    })
    var res = await req.json();
    showErrorMsg(res)
    return res.data;
}
export async function addMpFavAccounts(body={group_id:0,mids:0}) {
    var req = await fetch(`https://www.dajiala.com/fbmain/search/v1/favorite_add`,{
        method:'POST',headers:{accesstoken,'content-type':'application/json'},
        body:JSON.stringify(body),
    });
    var res = await req.json();
    showErrorMsg(res)
    return res.data
}
export async function getMpFavPosts(params) {
    var searchParams=new URLSearchParams(params)
    if(params.is_top===-1)searchParams.delete('is_top')
    if(params.is_video===-1)searchParams.delete('is_video')
    searchParams.delete(params.mid===-1?'mid':'group_id')
    
    var req=await fetch(`https://www.dajiala.com/fbmain/follow/v1/follow_account_article?${searchParams}`,{headers:{accesstoken}})
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}
export async function getMpSimilarPosts(params={aid:'',mid:0}) {
    var searchParams=new URLSearchParams(params)
    var req=await fetch(`https://www.dajiala.com/fbmain/follow/v1/similar_article?${searchParams}`,{headers:{accesstoken}})
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}
export function openUrl(url){
    window.ipcRenderer.send('toMain',{tag:'gotoExternal',content:{url}})
}
export async function getUserKeywords() {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/userkeyword`,{headers:{accesstoken}})
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}
export async function addUserKeyword(kw='') {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/userkeyword?kw=${encodeURIComponent(kw)}`,{
        method:'POST',headers:{accesstoken},
        body:JSON.stringify({kw}),
    })
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}
export async function delUserKeyword(kw='') {
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/userkeyword?kw=${encodeURIComponent(kw)}`,{method:'DELETE',headers:{accesstoken}})
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}
export async function getUserKeyPosts(params) {
    var searchParams=new URLSearchParams(params)
    if(params.is_top===-1)searchParams.delete('is_top')
    if(params.is_video===-1)searchParams.delete('is_video')
    
    var req=await fetch(`https://www.dajiala.com/fbmain/search/v1/user_keyword_search?${searchParams}`,{headers:{accesstoken}})
    var res=await req.json()
    showErrorMsg(res)
    return res.data
}

