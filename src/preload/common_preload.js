window.ipc = require('electron').ipcRenderer;
delete window.process.type
window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;

window.getLocalStorage=function(){
    var i = 0,oJson = {},sKey;
    for (; sKey = window.localStorage.key(i); i++) {
        oJson[sKey] = window.localStorage.getItem(sKey);
    }
    return oJson;
}
window.getSessionStorage=function(){
    var i = 0,oJson = {},sKey;
    for (; sKey = window.sessionStorage.key(i); i++) {
        oJson[sKey] = window.sessionStorage.getItem(sKey);
    }
    return oJson;
}
window.clearCache=function(){
    localStorage.clear();
    sessionStorage.clear();
}
window.getWorkType = window.ipc.sendSync('getWorkType', {})


window.ipc.on('superLogin',  (event, token_data)=> {
    console.log('认证信息',token_data)
    if(token_data.localStorage){
        for(let key in token_data.localStorage){
            window.localStorage.setItem(key,token_data.localStorage[key]);
        }
    }
    if(token_data.sessionStorage){
        for(let key in token_data.sessionStorage){
            window.sessionStorage.setItem(key,token_data.sessionStorage[key]);
        }
    }
    window.ipc.send('superLoginEnd', {});
});
