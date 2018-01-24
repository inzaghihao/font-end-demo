//index.js
import utils from '../../utils/util.js';
import config from '../../utils/config.js';
import * as Mock from '../../utils/mock.js';
//获取应用实例
const app = getApp()

Page({
  data: {
    page: 1, //当前加载第几页的数据
    days: 3,
    pageSize: 4,
    totalSize: 0,
    hasMore: true,// 用来判断下拉加载更多内容操作
    articleList: [], // 存放文章列表数据，与视图相关联
    defaultImg: config.defaultImg,
    hiddenLoading:false
  },
  //事件处理函数

  onLoad: function () {
    this.requestArticle();
  },
  requestArticle(){
    wx.showLoading({
      title: '数据加载中...',
    })
    utils.request({
      url: Mock.list,
      mock: true,
      data: {
        tag: '微信热门',
        start: this.data.page || 1,
        days: this.data.days || 3,
        pageSize: this.data.pageSize,
        langs: 'en'
      }
    }).then(res => {
      // 数据正常返回
      if (res && res.status === 0 && res.data && res.data.length) {
        let articleData = res.data;
        //格式化原始数据
        let formatData = this.formatArticleData(articleData);
        this.renderArticle(formatData)
      }
      /*
      * 如果加载第一页就没有数据，说明数据存在异常情况
      * 处理方式：弹出异常提示信息（默认提示信息）并设置下拉加载功能不可用
      */
      else if (this.data.page === 1 && res.data && res.data.length === 0) {
        utils.alert();
        this.setData({
          hasMore: false
        });
      }
      /*
      * 如果非第一页没有数据，那说明没有数据了，停用下拉加载功能即可
      */
      else if (this.data.page !== 1 && res.data && res.data.length === 0) {
        this.setData({
          hasMore: false
        });
      }
      /*
      * 返回异常错误
      * 展示后端返回的错误信息，并设置下拉加载功能不可用
      */
      else {
        utils.alert('提示', res);
        this.setData({
          hasMore: false
        });
        return null;
      }
    })
  },
  /*
  * 格式化文章列表数据
  */
  formatArticleData(data) {
    let formatData = undefined;
    if (data && data.length) {
      formatData = data.map((group) => {
        // 格式化日期
        group.formateDate = this.dateConvert(group.date);
        if (group && group.articles) {
          let formatArticleItems = group.articles.map((item) => {
            // 判断是否已经访问过
            item.hasVisited = this.isVisited(item.contentId);
            return item;
          }) || [];
          group.articles = formatArticleItems;
        }
        return group
      })
    }
    return formatData;
  },
  /*
  * 将原始日期字符串格式化 '2017-06-12'
  * return '今日' / 08-21 / 2017-06-12
  */
  dateConvert(dateStr) {
    if (!dateStr) {
      return '';
    }
    let today = new Date(),
      todayYear = today.getFullYear(),
      todayMonth = ('0' + (today.getMonth() + 1)).slice(-2),
      todayDay = ('0' + today.getDate()).slice(-2);
    let convertStr = '';
    let originYear = +dateStr.slice(0, 4);
    let todayFormat = `${todayYear}-${todayMonth}-${todayDay}`;
    if (dateStr === todayFormat) {
      convertStr = '今日';
    } else if (originYear < todayYear) {
      let splitStr = dateStr.split('-');
      convertStr = `${splitStr[0]}年${splitStr[1]}月${splitStr[2]}日`;
    } else {
      convertStr = dateStr.slice(5).replace('-', '月') + '日'
    }
    return convertStr;
  },
  /*
  * 判断文章是否访问过 ,判断此文章id 是否存在在全局变量数组 visitedArticles 中，如果存在则访问过
  * @param contentId
  */
  isVisited(contentId) {
    let visitedArticles = app.globalData && app.globalData.visitedArticles || '';
    return visitedArticles.indexOf(`${contentId}`) > -1;
  },
  renderArticle(data) {
    if (data && data.length) {
      let newList = this.data.articleList.concat(data);
      setTimeout(()=>{
        wx.hideLoading()
        this.setData({
          articleList: newList,
          hiddenLoading: true
        })
      },1000)
      
    }
  },
  showDetail(e){
    // let dataset = e.currentTarget.dataset
    // let item = dataset && dataset.item
    // let contentId = item.contentId || 0
    let contentId = e.currentTarget.dataset.contentid
    // 调用实现阅读标识的函数
    this.markRead(contentId)
    wx.navigateTo({
      url: `../detail/detail?contentId=${contentId}`
    });
  },
  markRead(contentId){
    //先从缓存中查找 visited 字段对应的所有文章 contentId 数据
    utils.getStorageData('visited', (data) => {
      let newStorage = data;
      if (data) {
        //如果当前的文章 contentId 不存在，也就是还没有阅读，就把当前的文章 contentId 拼接进去
        if (data.indexOf(contentId) === -1) {
          newStorage = `${data},${contentId}`;
        }
      }
      // 如果还没有阅读 visited 的数据，那说明当前的文章是用户阅读的第一篇，直接赋值就行了 
      else {
        newStorage = `${contentId}`;
      }

      /*
      * 处理过后，如果 data(老数据) 与 newStorage(新数据) 不一样，说明阅读记录发生了变化
      * 不一样的话，我们就需要把新的记录重新存入缓存和 globalData 中 
      */
      if (data !== newStorage) {
        if (app.globalData) {
          app.globalData.visitedArticles = newStorage;
        }
        utils.setStorageData('visited', newStorage, () => {
          this.resetArticles();
        });
      }
    });
  },
  resetArticles() {
    let old = this.data.articleList;
    let newArticles = this.formatArticleData(old);
    this.setData({
      articleList: newArticles
    });
  },
  //到底部下拉加载
  onReachBottom(){
    if (this.data.hasMore) {
      let nextPage = this.data.page + 1;
      this.setData({
        page: nextPage
      });
      this.requestArticle();
    }
  },
  /*
  * 分享
  */
  onShareAppMessage() {
    let title = config.defaultShareText || '';
    return {
      title: title,
      path: `/pages/index/index`,
      imageUrl:'/images/timg.jpg',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
})
