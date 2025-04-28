require("./common_preload");

//登录
if(!window.getWorkType){

    const xhrProxy = require('./xhr_proxy.js');
    xhrProxy.addHandler(async (data) => {
         //获取个人信息接口
        if (data.responseURL.indexOf('baijiahao.baidu.com/builder/app/appinfo') > -1) {
            if (data.status != 200) {
                return;
            }
            let applyQueryAndQuote = JSON.parse(data.response);
            if(applyQueryAndQuote.errno!=0){
              return
            }
            setTimeout(()=>{
              window.ipc.send('logined', {
                name:applyQueryAndQuote.data.user.name,
                avatar:applyQueryAndQuote.data.user.avatar
              });
            },5000)
        }
    });
  const fetchProxy = require('./fetch_proxy.js');
  fetchProxy.addHandler(async (data) => {
    if (data.status != 200) {
      return;
    }
    if (data.url.indexOf('baijiahao.baidu.com/builder/app/appinfo') > -1) {
      data.json().then(async (res)=> {
        if(res.errno!=0){
          return
        }
        setTimeout(()=> {
          window.ipc.send('logined', {
            name: res.data.user.name,
            avatar: res.data.user.avatar
          });
        },5000)
      })
    }
  })

}
