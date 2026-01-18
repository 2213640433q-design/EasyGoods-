// pages/hosting/manage/index.js
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    currentTab: 'pending',
    loading: true,
    
    // 统计数据
    stats: {
      deviceCount: 0,
      totalRevenue: 0,
      monthRevenue: 0
    },
    
    // 各状态数量
    pendingCount: 0,
    onlineCount: 0,
    
    // 设备列表
    devices: [],
    
    // 状态映射
    statusMap: {
      'pending': '审核中',
      'approved': '已通过',
      'online': '已上架',
      'rejected': '已拒绝',
      'recalled': '已召回'
    }
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44
    const totalNavHeight = statusBarHeight + navBarHeight
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight
    })
    
    this.loadData()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      await Promise.all([
        this.loadStats(),
        this.loadDevices()
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
    
    this.setData({ loading: false })
  },

  async loadStats() {
    try {
      // 调用云函数获取统计数据
      const res = await wx.cloud.callFunction({
        name: 'getHostedStats',
        data: {}
      })
      
      if (res.result.success) {
        this.setData({
          stats: res.result.data.stats,
          pendingCount: res.result.data.counts.pending || 0,
          onlineCount: res.result.data.counts.online || 0
        })
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  },

  async loadDevices() {
    try {
      // 调用云函数获取设备列表
      const res = await wx.cloud.callFunction({
        name: 'getHostedDevices',
        data: {
          status: this.data.currentTab === 'all' ? 'all' : this.data.currentTab
        }
      })
      
      if (res.result.success) {
        // 格式化时间
        const devices = res.result.data.map(device => {
          if (device.submitTime) {
            device.submitTime = this.formatTime(device.submitTime)
          }
          if (device.offlineTime) {
            device.offlineTime = this.formatTime(device.offlineTime)
          }
          return device
        })
        
        this.setData({
          devices
        })
      }
    } catch (error) {
      console.error('获取设备列表失败:', error)
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab
    })
    this.loadDevices()
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/profile/index' })
      }
    })
  },

  goAddDevice() {
    wx.navigateTo({
      url: '/pages/hosting/submit/index'
    })
  },

  viewDeviceDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/hosting/device-detail/index?id=${id}`
    })
  },

  viewRevenue(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/hosting/revenue/index?id=${id}`
    })
  },

  recallDevice(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    
    wx.showModal({
      title: '确认召回设备',
      content: `确认召回「${name}」吗？召回后设备将下架，7天内不能重新托管`,
      success: async (res) => {
        if (res.confirm) {
          await this.doRecallDevice(id)
        }
      }
    })
  },

  async doRecallDevice(deviceId) {
    wx.showLoading({ title: '处理中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'recallHostedDevice',
        data: {
          deviceId,
          reason: '用户主动召回'
        }
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '召回成功',
          icon: 'success'
        })
        // 刷新列表
        this.loadData()
      } else {
        wx.showToast({
          title: res.result.message || '召回失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('召回失败:', error)
      wx.showToast({
        title: '召回失败',
        icon: 'error'
      })
    }
  },

  resubmit(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '修改重提功能开发中，请稍后再试',
      showCancel: false
    })
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})

