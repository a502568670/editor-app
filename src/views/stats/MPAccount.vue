<template>
    <el-table v-loading="loading" :data="tableData" class="mp_account_table w-full " row-key="id">
      <el-table-column fixed prop="name" label="公众号名称" />
      <el-table-column prop="login" label="登录状态">
        <!-- <template #default="v">
          <span>{{ v.row.login ? '登录成功' : '登录失败' }}</span>
        </template> -->
      </el-table-column>

      <el-table-column prop="total_fans_num" label="粉丝数" />
      <el-table-column prop="illegal_recent" label="7日内违规信息" />
      <el-table-column prop="income_yesterday" label="昨日收入" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before2" label="前天收入" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before3" label="往前3天" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before4" label="往前4天" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before5" label="往前5天" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before6" label="往前6天" :formatter="moneyFormatter" />
      <el-table-column prop="income_yesterday_before7" label="往前7天" :formatter="moneyFormatter" />
      <el-table-column prop="income_last_week" label="上周收入" :formatter="moneyFormatter" />
      <el-table-column prop="income_30_days" label="30天收入" :formatter="moneyFormatter" />
      <el-table-column prop="income_cur_month" label="本月收入" :formatter="moneyFormatter" />
      <el-table-column prop="income_all" label="累计收入" :formatter="moneyFormatter" />
      <el-table-column prop="bank" label="收款账户信息" />
      <el-table-column prop="pv" label="昨日阅读" />
      <el-table-column prop="share" label="昨日分享" />
      <el-table-column prop="subscribe" label="昨日增粉" />
      <el-table-column prop="quota_today" label="今日发文情况" />
      <el-table-column prop="quota_tomorrow" label="明天定时情况" />
      <el-table-column prop="female_fans_rate" label="女粉比" :formatter="percentFormatter" />
      <el-table-column prop="male_fans_rate" label="男粉比" :formatter="percentFormatter" />
    </el-table>
</template>
<style scoped>
.mp_account_table {
  max-height: calc(100vh - theme('spacing.32'));
  overflow: scroll;
}
</style>
<script setup>
import {ref} from 'vue';
import {listAccount} from '@/api/account';
import {cachedStat,setCachedStat} from '@/api/stat-client';
var tableData = ref([]);
var loading=ref(true);
function moneyFormatter(row,col,v,i){
  return v==='-'? v:(v ? v/100 : 0);
}
function percentFormatter(row,col,v,i){
  return v==='-'?v:`${v}%`;
}
window.ipcRenderer.receive('fromMain', (msg) => {
  switch (msg.tag) {
    case 'stat-ret:getPvData': {
      var pvData = [];      
      var cacheData = [];
      var REG_ILLEGAL = /侵权|投诉|违规|处理|责令|屏蔽|限制|删除|流量主违规/;
      msg.data.forEach((res, i) => {
        var {id,name} = newAccounts[i];
        pvData[i] = {
          id,name,login:'登录失败',
          pv:'-',share:'-',subscribe:'-',
          total_fans_num: '-',
          income_yesterday:'-',
          income_yesterday_before2:'-',
          income_yesterday_before3:'-',
          income_yesterday_before4:'-',
          income_yesterday_before5:'-',
          income_yesterday_before6:'-',
          income_yesterday_before7:'-',
          income_last_week:'-',income_30_days:'-',income_cur_month:'-',income_all:'-',
          bank: '-',
          // illegal_record_count: '-',
          illegal_recent: '-',
          quota_today: '-',quota_tomorrow:'-',
          male_fans_rate:'-',female_fans_rate:'-',
        };
        if (res.status === 'fulfilled') {
          try {
            var {yesterday_summary:{pv,share,subscribe}} = JSON.parse(res.value[0].value);
            var {illegal_record_count} = JSON.parse(res.value[1].value);
            var {Title,UpdateTime,Content} = JSON.parse(res.value[2].value).List[0];
            var illegal_recent = '无违规';
            if (REG_ILLEGAL.test(Title)) {
              illegal_recent = `违规信息：${Title}\n详情：${Content}\n违规时间${new Date(UpdateTime*1000).toLocaleString()}`;
            }
            var {user_portrait} = JSON.parse(res.value[3].value);
            // var fansRate = '-';
            var male_fans_rate = 0, female_fans_rate=0;
            if (user_portrait.list.length) {
              var {genders,ages} = user_portrait.list[0];
              var total = 0,m,fm;
              genders?.forEach(v=>{
                total+=v.user_count;
                if(v.attr_value == 1) m=v.user_count;
                else if(v.attr_value == 2) fm=v.user_count;
              });
              if (total) {
                male_fans_rate = +((m/total)*100).toFixed(2);
                female_fans_rate = +((fm/total)*100).toFixed(2);
              }

              // fansRate = `${genders.map(v => v.attr_value).join('\n')}\n`
              //   + `---\n`
              //   + ages.map(v => `${v.attr_name}共计${v.user_count}人`);
            }
            var quota_today = '-',quota_tomorrow='-'
            var {time_send_total_num,quota_detail_list} = JSON.parse(res.value[4].value);
            // console.log(quota_detail_list);
            
            if(quota_detail_list){      
              var [normalMsg,actMsg] = quota_detail_list;
              var checkPost = (list) => {
                var {original_quota,str_date,quota} = list[0];
                var tomorrow = list[1].quota;
                // 服务号
                if (quota === 0 && tomorrow === 0 && time_send_total_num === 0) {
                  quota_today = '发文功能被封禁';
                  quota_tomorrow = '发文功能被封禁';
                  return;
                }
                if (original_quota === 4) {
                  quota_today = `4次|剩${Math.max(0,4-quota)}次`;
                  quota_tomorrow = `4次|剩${Math.max(0,4-tomorrow)}次`;
                } else if (original_quota === 1) {
                  quota_today = quota ? '今日未发文！' : '今日已发文';
                  quota_tomorrow = tomorrow ? '明日未定时！' : '明日已定时';
                }
              };
              checkPost(normalMsg.quota_item_list);
            }
            // var postCount = `群发：${checkPost(normalMsg.quota_item_list)}\n发布一天多次：${checkPost(actMsg.quota_item_list)}`;
            var {bank_info,bank_info_status} = JSON.parse(res.value[6].value);
            var bank = '-';
            if (bank_info){
              if(bank_info_status===1){
                bank='未填写收款信息'
              }else{
                bank=`${bank_info.bank_account_name}|${bank_info.bank_name}`;
              }
            }
            var {income_all=0,income_yesterday=0,revenue_last_week:income_last_week=0,income_list} = JSON.parse(res.value[7].value);
            var {income_list:currIncome} = JSON.parse(res.value[8].value);
            var income_yesterday_before2=0;
            var income_yesterday_before3=0;
            var income_yesterday_before4=0;
            var income_yesterday_before5=0;
            var income_yesterday_before6=0;
            var income_yesterday_before7=0;
            var income_30_days = 0;
            var income_cur_month = 0;
            if(income_list?.length){
              var now = Date.now();
              income_list.forEach((v)=>{
                var d=new Date(v.date).getTime();
                income_30_days+=v.income;
                if(now-d<2*24*60*60*1000) income_yesterday_before2+=v.income;
                else if(now-d<3*24*60*60*1000)income_yesterday_before3+=v.income;
                else if(now-d<4*24*60*60*1000)income_yesterday_before4+=v.income;
                else if(now-d<5*24*60*60*1000)income_yesterday_before5+=v.income;
                else if(now-d<6*24*60*60*1000)income_yesterday_before6+=v.income;
                else if(now-d<7*24*60*60*1000)income_yesterday_before7+=v.income;
              });
            }
            if(currIncome?.length){
              currIncome.forEach(v=>income_cur_month+=v.income);
            }
            var {setting_info:{total_fans_num}} = JSON.parse(res.value[9].value);
            // var {illegal_record_count} = JSON.parse(res.value[1].value);
            pvData[i] = {
              id,name,login: '登录成功',
              pv,share,subscribe,
              illegal_recent,
              male_fans_rate,female_fans_rate,
              quota_today,quota_tomorrow,
              bank,
              income_all,income_yesterday,income_last_week,income_30_days,income_cur_month,
              income_yesterday_before2,income_yesterday_before3,income_yesterday_before4,
              income_yesterday_before5,income_yesterday_before6,income_yesterday_before7,
              total_fans_num,
            };
            var useCachePv = ({id,name,login,...res})=>({account_id:id,...res});
            cacheData.push(useCachePv(pvData[i]));
          } catch (error) {
            console.error(error);
          }
        }
      });
      loading.value=false;
      tableData.value = [...tableData.value,...pvData];  
      if(cacheData.length){
        setCachedStat({items:cacheData});
      }
      // console.log(accounts, msg.data,pvData);
      // console.log(msg.data.find(v=>v.status==='fulfilled')?.value.map(v=>JSON.parse(v.value)));
      
      break;
    }
    default:
      break;
  }
});
var accounts,newAccounts;
async function main() {
  var data = await listAccount();
  accounts = data.data.data.list
  data = await cachedStat({account_ids:accounts.map(v=>v.id)});  
  data.data.items.forEach(v=>{
    var account = accounts.find(vv=>vv.id===v.account_id);
    v.id=v.account_id;
    v.name=account.name;
    v.login='登录成功'
  });
  tableData.value=data.data.items;
  newAccounts = accounts.filter(v=>!data.data.items.find(vv=>v.id===vv.account_id));
  if(newAccounts.length){
    window.ipcRenderer.send('toMain', {tag: 'stat:getPvData', data: newAccounts});
  }else{
    loading.value=false;
  }  
}
main();
</script>