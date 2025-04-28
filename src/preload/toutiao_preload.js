require("./common_preload");

//登录
if(!window.getWorkType){

    const xhrProxy = require('./xhr_proxy.js');
    xhrProxy.addHandler(async (data) => {
         //获取个人信息接口
        if (data.responseURL.indexOf('mp.toutiao.com/mp/agw/creator_center/user_info') > -1) {
            if (data.status != 200) {
                return;
            }
            let applyQueryAndQuote = JSON.parse(data.response);
            console.log('++++++++++++++测试',applyQueryAndQuote)
            if(applyQueryAndQuote.code!=0){
              return
            }
            window.ipc.send('logined', {
              name:applyQueryAndQuote.name,
              avatar:applyQueryAndQuote.avatar_url
            });
        }
    });
  const fetchProxy = require('./fetch_proxy.js');
  fetchProxy.addHandler(async (data) => {
    if (data.status != 200) {
      return;
    }
    if (data.url.indexOf('mp.toutiao.com/mp/agw/creator_center/user_info') > -1) {
      data.json().then(async (res)=> {
        if(res.code!=0){
          return
        }
        window.ipc.send('logined', {
          name:res.name,
          avatar:res.avatar_url
        });
      })
    }
  })

}

window.addEventListener('load', async () => {
    function replace(str) {
        if (!str) {
            return '';
        }
        str = str.replace(/  /g, '');
        str = str.replace(/&nbsp;/gi, '');
        str = str.replace(/ /g, '');
        str = str.replace(/,/g, '');
        str = str.replace(/\ +/g, "");//去掉空格
        str = str.replace(/[ ]/g, "");//去掉空格
        str = str.replace(/[\r\n]/g, "");//去掉回车换行
        str = str.replace(/\t|\n|\v|\r|\f/g, '');
        return str;
    }
    var url = window.location.href;
})
