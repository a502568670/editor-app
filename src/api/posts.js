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