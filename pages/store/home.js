// pages/store/home.js
Page({
  data: {
    statusBarHeight: 0,
    storeName: '',
    currentStore: null,
    
    // 筛选栏
    currentFilter: '全部',
    filterList: [
      { name: '全部', status: '全部', count: 0 },
      { name: '待取件', status: '待取件', count: 0 },
      { name: '租赁中', status: '租赁中', count: 0 },
      { name: '检查中', status: '检查中', count: 0 },
      { name: '已完成', status: '已完成', count: 0 }
    ],
    
    // 订单列表
    orderList: []
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    })
    
    // 检查登录状态
    this.checkLogin()
  },

  onShow() {
    // 每次显示时刷新订单列表
    if (this.data.currentStore) {
      this.loadOrders()
    }
  },

  // 检查登录状态
  checkLogin() {
    const currentStore = wx.getStorageSync('currentStore')
    
    if (!currentStore) {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/store/login'
      })
      return
    }
    
    console.log('✅ 门店已登录:', currentStore.name)
    
    this.setData({
      currentStore: currentStore,
      storeName: currentStore.name
    })
    
    // 加载订单列表
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    const { currentFilter } = this.data
    
    try {
      wx.showLoading({ title: '加载中...' })
      
      console.log('📦 加载订单列表，筛选条件:', currentFilter)
      
      // 调用云函数获取订单
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: {
          status: currentFilter === '全部' ? '' : currentFilter
        }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        const orders = res.result.data || []
        
        // 格式化订单数据
        const formattedOrders = orders.map(order => {
          const statusMap = {
            'pending': '待支付',
            'paid': '待取件',
            'picked': '租赁中',
            'checking': '检查中',
            'completed': '已完成',
            'damaged': '有折损'
          }
          
          return {
            ...order,
            statusText: statusMap[order.status] || order.status,
            createTime: this.formatTime(order.createTime)
          }
        })
        
        this.setData({
          orderList: formattedOrders
        })
        
        console.log('✅ 订单列表加载成功，共', formattedOrders.length, '单')
        
        // 更新订单数量统计
        this.updateOrderCounts()
        
      } else {
        throw new Error('加载订单失败')
      }
      
    } catch (error) {
      console.error('❌ 加载订单失败:', error)
      wx.hideLoading()
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 更新订单数量统计
  async updateOrderCounts() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderStats',
        data: {}
      })
      
      if (res.result && res.result.success) {
        const stats = res.result.data
        
        const filterList = this.data.filterList.map(item => {
          if (item.status === '全部') {
            item.count = stats.allOrderCount || 0
          } else if (item.status === '待取件') {
            item.count = stats.pickupOrderCount || 0
          } else if (item.status === '租赁中') {
            item.count = stats.rentingOrderCount || 0
          } else if (item.status === '检查中') {
            item.count = stats.checkingOrderCount || 0
          } else if (item.status === '已完成') {
            item.count = stats.completedOrderCount || 0
          }
          return item
        })
        
        this.setData({
          filterList: filterList
        })
      }
    } catch (error) {
      console.error('❌ 更新统计失败:', error)
    }
  },

  // 切换筛选
  onFilterChange(e) {
    const status = e.currentTarget.dataset.status
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 筛选点击事件触发')
    console.log('  当前筛选:', this.data.currentFilter)
    console.log('  新筛选:', status)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (status === this.data.currentFilter) {
      console.log('⚠️ 已经是当前筛选，跳过')
      return
    }
    
    this.setData({
      currentFilter: status
    })
    
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    })
    
    this.loadOrders()
  },

  // 查看订单详情
  onViewOrder(e) {
    const orderId = e.currentTarget.dataset.orderId
    
    console.log('📋 查看订单:', orderId)
    
    wx.navigateTo({
      url: `/pages/store/order-detail?orderId=${orderId}`
    })
  },

  // 一键扫码
  onQuickScan() {
    console.log('📷 打开扫码页面')
    
    wx.navigateTo({
      url: '/pages/store/scan'
    })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出门店管理？',
      confirmText: '退出',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('currentStore')
          
          wx.showToast({
            title: '已退出',
            icon: 'success',
            duration: 1000
          })
          
          // 跳转到登录页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/store/login'
            })
          }, 1000)
        }
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${month}-${day} ${hour}:${minute}`
  }
})

