// 当用户登录哔哩哔哩时，预加载脚本（blbl_preload.js）会监听 logined 消息，并将用户信息发送给主进程。
require("./common_preload");

//登录
if(!window.getWorkType){
  console.info('+++++++++++++++++++测试1')
    const xhrProxy = require('./xhr_proxy.js');
    xhrProxy.addHandler(async (data) => {
         //获取个人信息接口
        if (data.responseURL.indexOf('api.bilibili.com/x/space/v2/myinfo') > -1) {
            if (data.status != 200) {
                return;
            }
            let applyQueryAndQuote = JSON.parse(data.response);
            console.log('++++++++++++++测试',applyQueryAndQuote)
            if(applyQueryAndQuote.code!=0){
              return
            }
            // 监听 logined 消息
            window.ipc.send('logined', {
              name:applyQueryAndQuote.data.profile.name,
              avatar:applyQueryAndQuote.data.profile.face
            });
        }
    });
  const fetchProxy = require('./fetch_proxy.js');
  fetchProxy.addHandler(async (data) => {
    if (data.status != 200) {
      return;
    }
    if (data.url.indexOf('api.bilibili.com/x/space/v2/myinfo') > -1) {
      data.json().then(async (res)=> {
        console.log('++++++++++++++测试2',res)
        if(res.code!=0){
          return
        }
        window.ipc.send('logined', {
          name:res.data.profile.name,
          avatar:res.data.profile.face
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
