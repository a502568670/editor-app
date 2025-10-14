import request from '@/utils/requestJson'

export function cachedStat(data){
    return request({
        url: '/stat/get_mp_accounts',
        method: 'post',
        data
    });
}
export function setCachedStat(data){
    return request({
        url: '/stat/set_mp_accounts',
        method: 'post',
        data
    });
}
export function getExMpstat(data={begin_date:'',end_date:''}){
    return request({
        url: '/stat/get_mp_accounts_ex',
        method: 'post',
        data
    });
}