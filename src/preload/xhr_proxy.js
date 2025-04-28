
let gHandlerList = [],//截获请求的处理函数列表
    gIsInited = false;//是否已经初始化
let initProxy = function(){
    if(gIsInited)return;
    gIsInited = true;


    let oldXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        let send = this.send;
        let _this = this
        this.send = function (...data) {
            if (url.indexOf('/carservernew/bizSave/caculatePremium') > -1) {
                window.apiPostData = JSON.parse(data[0]);
            }
            if (url.indexOf('/carSelfService/rest/save/basicInfo') > -1) {
                window.apiPostData = JSON.parse(data[0]);
            }
            if (url.indexOf('/khyx/newFront/qth/price/quote.do') > -1) {
                let json={}
                data[0].forEach(function(value, key) {
                    if (json[key] !== undefined) {
                        if (!Array.isArray(json[key])) {
                            json[key] = [json[key]];
                        }
                        json[key].push(value);
                    } else {
                        json[key] = value;
                    }
                });
                window.apiPostData = json;
            }
            return send.apply(_this, data)
        }
        this.addEventListener('load', async () => {
            //console.log('data: ' + this.responseText);
            try {
                //调用注册的handler
                await gHandlerList.map(proxyHandler => proxyHandler.call(this, this));
            } catch (e) {
                //TODO 这里可以替换为其他的错误处理逻辑
                console.error(e);
            }
        });
        return oldXHROpen.apply(this, arguments);
    }

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
