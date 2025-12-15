<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Search, ArrowDown } from '@element-plus/icons-vue';
import { serializeCookie } from '@/utils/cookie';
import { ElMessage } from 'element-plus';
import ImgPicker from '@/components/editor/ImgPicker.vue';
import { tplCommissionInEditor } from '@/utils/mpcommission';
import { gen_unique_id } from '@/utils/msic';
import { ElMessageBox } from 'element-plus';

const props = defineProps(['selectedAccount', 'pickerPageInfo']);
const emit = defineEmits(['insert-commission', 'close']);

const selectedCommodities = ref([]);
const windowProductResp = ref(null);
const stylesDialogVisible = ref(false);
const selectedStyle = ref(0); // 0:大图,1:小图,2:文字链接,3:图片链接(12)
const awaitingWindowProduct = ref(false);
const selectedImage = ref('');
const refPicker = ref(null);

function previewSrcdocFor(styleIndex) {
  if (!selectedCommodities.value || !selectedCommodities.value.length) return '';
  // 构造用于该 styleIndex 的数据（以第一个商品为例）
  const commodity = selectedCommodities.value[0];
  const title = commodity?.spu?.name || commodity?.spu?.title || '';
  const img =
    styleIndex === 3
      ? selectedImage.value || commodity?.spu?.headImage || ''
      : commodity?.spu?.headImage || commodity?.spu?.picUrl || '';
  const cardtype = styleIndex === 3 ? 12 : styleIndex;
  const data = {
    windowproduct: '',
    cardtype,
    title,
    product_imageurl: img,
    type: 0
  };
  let tpl = '';
  try {
    const uniq = `preview-${gen_unique_id()}`;
    tpl = tplCommissionInEditor(uniq, data);
  } catch (e) {
    tpl = `<div>无法生成预览</div>`;
  }
  const cssLink = '/UEditorPlus/themes/iframe.css';
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${cssLink}"></head><body>${tpl}</body></html>`;
}

const activeCategory = ref('0');
const categoryList = [
  {
    id: '0',
    name: '全部'
  },
  {
    id: '11099070301657575487',
    name: '食品生鲜',
    categoryId: '11099070301657575487',
    categoryName: '食品生鲜',
    categoryIds_1: ['7339', '502043', '7419', '6625']
  },
  {
    id: '16579416177373560313',
    name: '服饰鞋包',
    categoryId: '16579416177373560313',
    categoryName: '服饰鞋包',
    categoryIds_1: ['6033', '1653', '6831', '7378', '6932']
  },
  {
    id: '888',
    name: '本地生活',
    categoryId: '888',
    categoryName: '本地生活'
  },
  {
    id: '17007902228422672609',
    name: '个护美妆',
    categoryId: '17007902228422672609',
    categoryName: '个护美妆',
    categoryIds_1: ['1001', '6870']
  },
  {
    id: '12377324634086192020',
    name: '图书',
    categoryId: '12377324634086192020',
    categoryName: '图书',
    categoryIds_1: ['135835']
  },
  {
    id: '8261345894708739273',
    name: '家清日用',
    categoryId: '8261345894708739273',
    categoryName: '家清日用',
    categoryIds_1: ['1142', '1421', '1453', '1208', '6153', '6472', '1069', '1247']
  },
  {
    id: '12379480883574690382',
    name: '其他',
    categoryId: '12379480883574690382',
    categoryName: '其他',
    categoryIds_1: [
      '530004',
      '376707',
      '1804',
      '442005',
      '1701',
      '381003',
      '128209',
      '6263',
      '377078',
      '378228',
      '530032',
      '7363',
      '378136',
      '429008',
      '6706'
    ]
  }
];
const selectCategory = value => {
  activeCategory.value = value;
};

const keyword = ref('');
const pageContext = ref('');
const spuSort = ref('commend_sort'); // 商品排序
const guaranteeTags = ref([]);
const monthlySalesRange = ref(''); // 月销量
const goodEvaluationRatioRange = ref(''); // 好评率
const shopScoreRange = ref(''); // 店铺评分
const priceOrRate = ref({
  min: null,
  max: null
}); // 价格和比例

const againGet = () => {
  // 重置分页参数
  pageContext.value = '';
  // 清空商品列表
  commodityList.value = [];
  // 获取商品
  debounceGetCommodity();
};
watch(
  [spuSort, guaranteeTags, monthlySalesRange, goodEvaluationRatioRange, shopScoreRange, priceOrRate, activeCategory],
  againGet,
  {
    deep: true
  }
);
/** 重置 */
const reset = () => {
  keyword.value = '';
  spuSort.value = 'commend_sort'; // 商品排序
  guaranteeTags.value = [];
  monthlySalesRange.value = ''; // 月销量
  goodEvaluationRatioRange.value = ''; // 好评率
  shopScoreRange.value = ''; // 店铺评分
  priceOrRate.value = {
    min: null,
    max: null
  };
};

// 店铺评分选择列表
const shopScoreList = [
  {
    name: '4.8以上',
    value: 480
  },
  {
    name: '4.5以上',
    value: 450
  },
  {
    name: '4.0以上',
    value: 400
  }
];
// 好评率选择列表
const goodEvaluationRatioList = [
  {
    name: '95%',
    value: 950000
  },
  {
    name: '90%',
    value: 900000
  },
  {
    name: '85%',
    value: 850000
  },
  {
    name: '80%',
    value: 800000
  }
];
// 月销量选择列表
const monthlySalesList = [
  {
    name: '五万以上',
    value: 50000
  },
  {
    name: '一万以上',
    value: 10000
  },
  {
    name: '五千以上',
    value: 5000
  },
  {
    name: '一千以上',
    value: 1000
  }
];
// 服务保障选择列表
const guaranteeTagsList = [
  {
    name: '七天无理由',
    value: 0
  },
  {
    name: '运费险',
    value: 1
  },
  {
    name: '品牌',
    value: 2
  },
  {
    name: '损坏包退',
    value: 4
  },
  {
    name: '假一赔三',
    value: 5
  },
  {
    name: '先用后付',
    value: 6
  },
  {
    name: '包邮',
    value: 7
  }
];
// 商品排序选择列表
const sortList = [
  {
    name: '按推荐排序',
    value: 'commend_sort'
  },
  {
    name: '高佣金排序',
    value: 'gyj_sort'
  },
  {
    name: '热销排序',
    value: 'hot_sort'
  },
  {
    name: '价格由低到高',
    value: 'price_sort_up'
  },
  {
    name: '价格由高到低',
    value: 'price_sort_down'
  }
];
// 商品排序值
const SORT_ITEMS = {
  commend_sort: {
    sortOrder: 0,
    sortType: 0
  },
  gyj_sort: {
    sortOrder: 2,
    sortType: 1
  },
  hot_sort: {
    sortOrder: 2,
    sortType: 3
  },
  price_sort_up: {
    sortOrder: 1,
    sortType: 2
  },
  price_sort_down: {
    sortOrder: 2,
    sortType: 2
  }
};

const filterType = ref('sellingPriceRange');
const switchType = command => {
  priceOrRate.value = {
    min: 0,
    max: 0
  };
  filterType.value = command;
};

const debounce = (func, delay) => {
  let timer;

  return function (...args) {
    if (timer) {
      clearTimeout(timer); // 清除上一次的定时器
    }
    // 设置一个新的定时器，延迟执行 func
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const getCommodity = () => {
  const { session_id, token } = props.selectedAccount;
  const cookie = serializeCookie(JSON.parse(session_id)['cookie']);
  const newBody = {
    pageContextReq: {
      limit: 20
    },
    spuCondition: {
      commissionRateRange: {},
      guaranteeTags: guaranteeTags.value,
      shopScoreRange: shopScoreRange.value === '' ? {} : { min: shopScoreRange.value }
    },
    spuSort: SORT_ITEMS[spuSort.value]
  };

  // 判断是否添加分页参数
  if (pageContext.value !== '') {
    newBody.pageContextReq.pageContext = pageContext.value;
  }
  // 判断是否添加价格和比例
  const { min, max } = priceOrRate.value;
  const range = {};
  const isPriceRange = filterType.value === 'sellingPriceRange';
  if (min) range.min = min * (isPriceRange ? 100 : 10000);
  if (max) range.max = max * (isPriceRange ? 100 : 10000);
  newBody.spuCondition[filterType.value] = range;
  // 判断是否添加种类
  if (activeCategory.value !== '0') {
    newBody.category = categoryList.find(item => item.id === activeCategory.value);
  }
  // 判断是否添加好评率
  if (goodEvaluationRatioRange.value !== '') {
    newBody.spuCondition.goodEvaluationRatioRange = { min: goodEvaluationRatioRange.value };
  }
  // 判断是否添加月销量
  if (monthlySalesRange.value !== '') {
    newBody.spuCondition.monthlySalesRange = { min: monthlySalesRange.value };
  }

  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:getShopCommodity',
    token,
    cookie,
    keyword: '',
    listCondition: JSON.stringify(newBody),
    keyword: keyword.value
  });
};

const debounceGetCommodity = debounce(getCommodity, 500);

const commodityList = ref([]);

const ipcOff = window.ipcRenderer.receive('fromMain', msg => {
  if (msg.tag === 'appmsg-ret:getShopCommodity') {
    if (msg.data.success) {
      if (!msg.data.talentSpuItems.length) {
        ElMessage.warning('没有更多商品了');
        return;
      }
      commodityList.value.push(...msg.data.talentSpuItems);
      pageContext.value = msg.data.pageContextResp.pageContext;
    } else {
      console.error('获取商品失败', msg.data.message);
      ElMessageBox.alert(msg.data.err_msg, '错误', {
        confirmButtonText: '确定',
        type: 'error'
      });
    }
  }
  if (msg.tag === 'appmsg-ret:getWindowProduct') {
    // 仅在当前有 pending 请求时处理，避免页面打开时误触发
    if (!awaitingWindowProduct.value) return;
    awaitingWindowProduct.value = false;
    // 返回 windowproduct 信息
    windowProductResp.value = JSON.parse(msg.data.ext_info) || {};
    // 打开选择样式弹窗
    stylesDialogVisible.value = true;
  }
});

// 注意：不自动打开图片选择器，用户可在样式弹窗下方手动选择图片

const productsListRef = ref(null);

onMounted(() => {
  commodityList.value = [];
  getCommodity();

  productsListRef.value.addEventListener('scroll', () => {
    // 判断滚动条是否到达底部
    if (productsListRef.value.scrollHeight - productsListRef.value.scrollTop === productsListRef.value.clientHeight) {
      debounceGetCommodity();
    }
  });
});

onUnmounted(() => {
  ipcOff();
});

const selectCommodityItem = item => {
  // 多选：切换选择状态
  const idx = selectedCommodities.value.findIndex(v => v.spu.id === item.spu.id);
  if (idx === -1) {
    selectedCommodities.value.push(item);
  } else {
    selectedCommodities.value.splice(idx, 1);
  }
};

const handleNext = () => {
  if (!selectedCommodities.value.length) {
    ElMessage.warning('请先选择至少一个商品');
    return;
  }

  const { session_id, token } = props.selectedAccount;
  const cookie = serializeCookie(JSON.parse(session_id)['cookie']);
  const product_id = selectedCommodities.value.map(it => it.spu.id);
  // 标记为等待回包，收到后才打开样式弹窗
  awaitingWindowProduct.value = true;
  window.ipcRenderer.send('toMain', {
    tag: 'appmsg:getWindowProduct',
    token,
    cookie,
    product_id
  });
};

const handleInsert = () => {
  // 从 windowProductResp 中解析 product_key 列表（兼容多种返回格式）
  let product_keys = [];
  try {
    if (
      windowProductResp.value &&
      windowProductResp.value.product_encrypt_key &&
      windowProductResp.value.product_encrypt_key.length
    ) {
      product_keys = windowProductResp.value.product_encrypt_key;
    }
  } catch (e) {
    console.error('解析windowproduct失败', e);
  }

  // 根据 selectedCommodities 与 product_keys 构造多个 payload
  const items = selectedCommodities.value.map((commodity, idx) => {
    const title = commodity?.spu?.name || commodity?.spu?.title || '';
    const img =
      selectedStyle.value === 3
        ? selectedImage.value || commodity?.spu?.headImage || ''
        : commodity?.spu?.headImage || commodity?.spu?.picUrl || '';
    const cardtype = selectedStyle.value === 3 ? 12 : selectedStyle.value;
    return {
      windowproduct: product_keys[idx] || '',
      cardtype,
      title,
      product_imageurl: img,
      type: 0
    };
  });

  emit('insert-commission', items);
  // 关闭样式选择弹窗并清空选择
  stylesDialogVisible.value = false;
  selectedCommodities.value = [];
  selectedImage.value = '';
};

const onImgPick = urls => {
  if (urls && urls.length) selectedImage.value = urls[0];
};

const pickerQuery = defineModel();
</script>

<template>
  <div class="rebate-products">
    <el-input v-model="keyword" class="rebate-products_input">
      <template #append>
        <el-button :icon="Search" @click="againGet" />
      </template>
    </el-input>
    <div class="rebate-products_category">
      <ul>
        <li
          v-for="item of categoryList"
          :class="{ 'rebate-products_category--active': item.id === activeCategory }"
          :key="item.id"
          @click="selectCategory(item.id)"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>
    <div class="rebate-products_filter">
      <div class="rebate-products_filter-item">
        <p class="rebate-products_filter-title">商品排序</p>
        <div class="rebate-products_filter-select">
          <el-select v-model="spuSort">
            <el-option v-for="item of sortList" :key="item.value" :label="item.name" :value="item.value" />
          </el-select>
        </div>
      </div>
      <div class="rebate-products_filter-item">
        <p class="rebate-products_filter-title">服务保障</p>
        <div class="rebate-products_filter-select">
          <el-select v-model="guaranteeTags" multiple collapse-tags clearable>
            <el-option v-for="item of guaranteeTagsList" :key="item.value" :label="item.name" :value="item.value" />
          </el-select>
        </div>
      </div>
      <div style="width: 330px" class="rebate-products_filter-item">
        <el-dropdown @command="switchType">
          <p class="rebate-products_filter-title">
            {{ filterType === 'sellingPriceRange' ? '价格' : '佣金比例' }}
            <el-icon>
              <arrow-down />
            </el-icon>
          </p>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sellingPriceRange">价格</el-dropdown-item>
              <el-dropdown-item command="commissionRateRange">佣金比例</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div
          class="rebate-products_filter-select"
          style="display: flex; align-items: center; justify-content: space-between"
        >
          <el-input-number
            v-model="priceOrRate.min"
            :min="0"
            :max="filterType === 'sellingPriceRange' ? 500000 : 100"
            controls-position="right"
            style="width: 110px"
          />
          <p>-</p>
          <el-input-number
            v-model="priceOrRate.max"
            :min="0"
            :max="filterType === 'sellingPriceRange' ? 500000 : 100"
            controls-position="right"
            style="width: 110px"
          />
        </div>
      </div>
      <div class="rebate-products_filter-item">
        <p class="rebate-products_filter-title">月销量</p>
        <div class="rebate-products_filter-select">
          <el-select v-model="monthlySalesRange">
            <el-option v-for="item of monthlySalesList" :key="item.value" :label="item.name" :value="item.value" />
          </el-select>
        </div>
      </div>
      <div class="rebate-products_filter-item">
        <p class="rebate-products_filter-title">好评率</p>
        <div class="rebate-products_filter-select">
          <el-select v-model="goodEvaluationRatioRange">
            <el-option
              v-for="item of goodEvaluationRatioList"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <div class="rebate-products_filter-item">
        <p class="rebate-products_filter-title">店铺评分</p>
        <div class="rebate-products_filter-select">
          <el-select v-model="shopScoreRange">
            <el-option v-for="item of shopScoreList" :key="item.value" :label="item.name" :value="item.value" />
          </el-select>
        </div>
      </div>
      <el-button type="primary" link @click="reset"> 重置 </el-button>
    </div>
    <div ref="productsListRef" class="rebate-products_products-list">
      <div
        class="rebate-products_commodity"
        v-for="commodity in commodityList"
        :key="commodity.spu.id"
        @click="selectCommodityItem(commodity)"
        :class="{
          'rebate-products--selected':
            selectedCommodities &&
            selectedCommodities.length &&
            selectedCommodities.some(s => s.spu.id === commodity.spu.id)
        }"
      >
        <div class="rebate-products_commodity-img">
          <img :src="commodity.spu.headImage" alt="" />
        </div>
        <div class="rebate-products_commodity-info">
          <div class="rebate-products_commodity-title">{{ commodity.spu.name }}</div>
          <div class="rebate-products_commodity-sales-volume">月销{{ commodity.spu.sales.monthlySales }}</div>
          <div class="rebate-products_commodity-shop">
            <div
              style="
                display: inline-block;
                max-width: 70%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
            >
              {{ commodity.shop.name }}
            </div>
            <div style="color: #4d4d4d; font-style: italic; margin-left: 2px">
              {{ commodity.shop.detailedSellerRating.detailedRating.score / 100 }}
              <span style="font-style: normal">
                {{
                  commodity.shop.detailedSellerRating.detailedRating.level === 0
                    ? '低'
                    : commodity.shop.detailedSellerRating.detailedRating.level === 1
                    ? '中'
                    : '高'
                }}
              </span>
            </div>
          </div>
          <div class="rebate-products_commodity-money">
            赚
            <span style="font-size: 13px; margin-left: 4px">¥{{ commodity.promote.commission.commission / 100 }}</span>
          </div>
          <div class="rebate-products_commodity-introduce">
            售价¥{{ commodity.spu.price.sellingPrice / 100 }} {{ commodity.promote.commission.commissionRateDesc }}
          </div>
        </div>
      </div>
      <div style="text-align: center; width: 100%; font-size: 18px; color: var(--jzl-primary-color); font-weight: 700">
        加载商品中……
      </div>
    </div>
    <div class="rebate-products_operate">
      <el-button type="primary" @click="handleNext">下一步</el-button>
      <el-button @click="$emit('close')">取消</el-button>
    </div>

    <el-dialog title="选择展示样式" v-model="stylesDialogVisible" width="850px">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; width: 100%">
        <div
          style="width: 48%; border: 1px solid #eee; padding: 12px; cursor: pointer"
          :class="{ active: selectedStyle === 0 }"
          @click="selectedStyle = 0"
        >
          <div style="font-size: 16px; font-weight: bold">大图卡片（点击标题选择）</div>
          <div style="background: #fafafa; margin-top: 8px">
            <div v-if="selectedCommodities && selectedCommodities.length">
              <iframe
                class="preview-iframe"
                :srcdoc="previewSrcdocFor(0)"
                style="width: 100%; height: 520px; border: 0; background: #fff"
              ></iframe>
            </div>
            <div v-else style="height: 120px; display: flex; align-items: center; justify-content: center">
              封面大图
            </div>
          </div>
        </div>
        <div style="width: 48%; display: flex; flex-direction: column; gap: 12px">
          <div
            style="width: 100%; border: 1px solid #eee; padding: 12px; cursor: pointer"
            :class="{ active: selectedStyle === 1 }"
            @click="selectedStyle = 1"
          >
            <div style="font-size: 16px; font-weight: bold">小图卡片（点击标题选择）</div>
            <div style="background: #fafafa; margin-top: 8px">
              <div v-if="selectedCommodities && selectedCommodities.length">
                <iframe
                  class="preview-iframe"
                  :srcdoc="previewSrcdocFor(1)"
                  style="width: 100%; height: 190px; border: 0; background: #fff"
                ></iframe>
              </div>
              <div v-else style="height: 120px; display: flex; align-items: center; justify-content: center">小图</div>
            </div>
          </div>
          <div
            style="width: 100%; border: 1px solid #eee; padding: 12px; cursor: pointer"
            :class="{ active: selectedStyle === 2 }"
            @click="selectedStyle = 2"
          >
            <div style="font-size: 16px; font-weight: bold">文字链接（点击标题选择）</div>
            <div style="height: 80px; background: #fafafa; margin-top: 8px">
              <div v-if="selectedCommodities && selectedCommodities.length">
                <iframe
                  class="preview-iframe"
                  :srcdoc="previewSrcdocFor(2)"
                  style="width: 100%; height: 80px; border: 0; background: #fff"
                ></iframe>
              </div>
              <div v-else style="height: 120px; display: flex; align-items: center; justify-content: center">
                文字链接
              </div>
            </div>
          </div>
          <div
            style="width: 100%; border: 1px solid #eee; padding: 12px; cursor: pointer"
            :class="{ active: selectedStyle === 3 }"
            @click="selectedStyle = 3"
          >
            <div style="font-size: 16px; font-weight: bold">图片链接（点击选择图片）</div>
            <div style="margin-top: 8px">
              <template v-if="selectedCommodities && selectedCommodities.length === 1">
                <ImgPicker
                  ref="refPicker"
                  :h="198"
                  placeholder="设置链接图片"
                  :imgSrc="selectedImage"
                  v-model="pickerQuery"
                  :pageInfo="$props.pickerPageInfo"
                  @confirm="onImgPick"
                />
              </template>
              <template v-else>
                <div
                  style="
                    height: 198px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px dashed #e6e6e6;
                    color: #999;
                    border-radius: 4px;
                  "
                >
                  多选时无法设置图片链接，请只选择 1 个商品后重试
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="text-align: right">
          <el-button @click="stylesDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleInsert">插入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.rebate-products {
  width: 100%;
}

.rebate-products_input {
  width: 400px;
  margin-bottom: 20px;
}

.rebate-products_category {
  margin-bottom: 20px;
}

.rebate-products_category > ul {
  display: flex;

  > li {
    width: 80px;
    padding: 7px 0px;
    margin-right: 10px;
    background-color: #f6f7f8;
    border-radius: 20px;
    font-size: 14px;
    color: #000;
    text-align: center;
    cursor: pointer;
  }

  > .rebate-products_category--active {
    background-color: #e6f9ef;
    color: #20c76f;
  }
}

.rebate-products_filter {
  display: flex;
  flex-wrap: wrap;
}
.rebate-products_filter-item {
  display: flex;
  align-items: center;
  width: 250px;
  margin: 0 10px 10px 0;
}
.rebate-products_filter-title {
  width: 80px;
}
.rebate-products_filter-select {
  flex: 1;
  width: 0;
}

.rebate-products_products-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  height: 400px;
  overflow-y: auto;
}
.rebate-products_commodity {
  width: calc(20% - 14px);
  flex-basis: calc(20% - 14px);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}
.rebate-products_commodity-img {
  width: 100%;
  aspect-ratio: 1;
}
.rebate-products_commodity-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rebate-products_commodity-info {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 135px;
  padding: 8px;
  background-color: #fafafa;
}
.rebate-products_commodity-title {
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #000;
  display: -webkit-box;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rebate-products_commodity-sales-volume {
  font-size: 12px;
  margin-top: 4px;
  color: #fa9d3b;
}
.rebate-products_commodity-shop {
  display: flex;
  font-size: 12px;
  transform: scale(0.9);
  transform-origin: left top;
}
.rebate-products_commodity-money {
  color: #fa9d3b;
  font-size: 12px;
  font-weight: 600;
  margin-top: 5px;
  transform: scale(0.9);
  transform-origin: left top;
}
.rebate-products_commodity-introduce {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  transform: scale(0.8);
  transform-origin: left top;
}

.rebate-products_operate {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.rebate-products--selected {
  position: relative;
}
.rebate-products--selected::before {
  background: rgba(7, 193, 96, 0.1);
  border: 1px solid #07c160;
  border-radius: 8px;
  box-sizing: border-box;
  content: '';
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1;
}

/* style selection highlight */
.rebate-products .active {
  border-color: #07c160 !important;
  box-shadow: 0 0 0 4px rgba(7, 193, 96, 0.06);
}
</style>
