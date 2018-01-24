//app.js
import util from './utils/util.js';
App({
  onLaunch: function () {
    // 增加初始化缓存数据功能
    util.getStorageData('visited', (data) => {
      this.globalData.visitedArticles = data;
    });

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  getDevideInfo() {
    let self = this;
    wx.getSystemInfo({
      success: function (res) {
        self.globalData.deviceInfo = res;
      }
    })
  },
  alert(title = '提示', content = '好像哪里出了小问题~请再试一次~') {
    wx.showModal({
      title: title,
      content: content
    })
  },
  globalData: {
    userInfo: null,
    visitedArticles: '',
    deviceInfo:{}
  }
})