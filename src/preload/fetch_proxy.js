
let gHandlerList = [],//截获请求的处理函数列表
    gIsInited = false;//是否已经初始化
let initProxy = function(){
    if(gIsInited)return;
    gIsInited = true;
    // const originFetch = fetch;
    // Object.defineProperty(window, "fetch", {
    //     configurable: true,
    //     enumerable: true,
    //     // writable: true,
    //     get() {
    //         return (url,options) => {
    //             return originFetch(url)
    //                 // checkStatus 这里可以做返回错误处理，实现返回拦截
    //                 .then(response =>{
    //                     gHandlerList.map(proxyHandler => proxyHandler.call(this,response));
    //                     return response;
    //                 })
    //         }
    //     }});

    window.au_fetch=window.fetch;
    window.fetch=function(url){
        return window.au_fetch.apply(window,arguments).then((response) => {
            let ret=response.clone()
            gHandlerList.map(proxyHandler => proxyHandler.call(this,ret));
            return response;
        });
    };
}

/**
 * 增加一个handler
 * 当xhr.readyState == 4时，回调handler，handler中，可以通过xhr.responseText获取请求返回内容
 * @param {function} handler function(xhr){}
 */
let addHandler = function(handler){
    initProxy();
    gHandlerList.push(handler);
}
/**
 * 移除指定的handler
 * @param {function} handler 调用addHandler时添加的handler
 */
let removeHandler = function(handler){
    gHandlerList = gHandlerList.filter(h => h!== handler);
}
module.exports.addHandler = addHandler;
module.exports.removeHandler = removeHandler;
