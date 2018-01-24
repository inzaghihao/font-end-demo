// pages/detail/detail.js
import utils from '../../utils/util.js';
import config from '../../utils/config.js';
import * as Mock from '../../utils/mock.js'
// WxParse HtmlFormater 用来解析 content 文本为小程序视图
import WxParse from '../../lib/wxParse/wxParse';
// 把 html 转为化标准安全的格式
import HtmlFormater from '../../lib/htmlFormater.js';

let app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scrollTop: 0,
    detailData:{},
    isFromShare:1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let id = options.contentId || 0;
    this.setData({
      isFromShare: !!options.share
    });
    this.init(id);
  },
  articleRevert() {
    // this.data.detailData 是之前我们通过 setData 设置的响应数据
    let htmlContent = this.data.detailData && this.data.detailData.content;
    WxParse.wxParse('article', 'html', htmlContent, this, 0);
  },
  init(contentId){
    if (contentId) {
      this.goTop()
      this.requestDetail(contentId).then(data => {
        this.configPageData(data)
      })
      //调用wxparse
      .then(() => {
        this.articleRevert()
      })
    }
  },
  goTop() {
    this.setData({
      scrollTop: 0
    })
  },
  next() {
    this.requestNextContentId().then(data => {
        let contentId = data && data.contentId || 0;
        this.init(contentId);
      })
  },
  requestNextContentId() {
    let pubDate = this.data.detailData && this.data.detailData.lastUpdateTime || ''
    let contentId = this.data.detailData && this.data.detailData.contentId || 0
    return utils.request({
      url: 'detail',
      mock: true,
      data: {
        tag: '微信热门',
        pubDate: pubDate,
        contentId: contentId,
        // langs: config.appLang || 'en'
      }
    }).then(res => {
        if (res && res.status === 0 && res.data && res.data.contentId) {
          console.log(res)
          return res.data
        } else {
          wx.showModal({
            title: '提示',
            content: '没有更多文章了!',
          })
          return null
        }
      })
  },
  requestDetail(contentId) {
    return utils.request({
      url: Mock.detail,
      mock: true,
      data: {
        source: 1
      }
    }).then(res => {
      let formateUpdateTime = this.formateTime(res.data.lastUpdateTime)
      // 格式化后的时间
      res.data.formateUpdateTime = formateUpdateTime
      return res.data
    })
  },
  formateTime(timeStr = '') {
    let year = timeStr.slice(0, 4),
      month = timeStr.slice(5, 7),
      day = timeStr.slice(8, 10);
    return `${year}/${month}/${day}`;
  },
  configPageData(data){
    if (data) {
      // 同步数据到 Model 层，Model 层数据发生变化的话，视图层会自动渲染
      this.setData({
        detailData: data
      });
      //设置标题
      let title = this.data.detailData.title || config.defaultBarTitle
      wx.setNavigationBarTitle({
        title: title
      })
    }
  },
  back() {
    if (this.data.isFromShare) {
      wx.navigateTo({
        url: '../index/index'
      })
    } else {
      wx.navigateBack()
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    let title = this.data.detailData && this.data.detailData.title || config.defaultShareText;
    let contentId = this.data.detailData && this.data.detailData.contentId || 0;
    return {
      // 分享出去的内容标题
      title: title,

      // 用户点击分享出去的内容，跳转的地址
      // contentId为文章id参数；share参数作用是说明用户是从分享出去的地址进来的，我们后面会用到
      path: `/pages/detail/detail?share=1&contentId=${contentId}`,

      // 分享成功
      success: function (res) { },

      // 分享失败
      fail: function (res) { }
    }
  },
})