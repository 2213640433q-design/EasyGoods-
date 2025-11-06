// pages/rental/renew-confirm.js
Page({
  data: {
    statusBarHeight: 0,
    
    // 订单信息
    orderId: '',
    productId: '',
    productName: '',
    productSubtitle: '',
    productImage: '',
    
    // 续租信息
    originalEndDate: '',
    renewEndDate: '',
    renewDays: 0,
    renewPrice: 0
  },

  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    })
    
    // 获取参数
    const {
      orderId,
      productId,
      productName,
      renewEndDate,
      renewDays,
      renewPrice
    } = options
    
    console.log('🔄 续租确认页面参数:', options)
    
    // 加载订单信息
    this.loadOrderInfo(orderId, {
      productId,
      productName: decodeURIComponent(productName || ''),
      renewEndDate,
      renewDays: parseInt(renewDays),
      renewPrice: parseFloat(renewPrice)
    })
  },

  // 加载订单信息
  async loadOrderInfo(orderId, renewData) {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: orderId }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        const order = res.result.data
        
        this.setData({
          orderId: orderId,
          productId: renewData.productId,
          productName: renewData.productName,
          productSubtitle: order.subCategory || '',
          productImage: order.productImage,
          originalEndDate: order.rentalEndDate,
          renewEndDate: renewData.renewEndDate,
          renewDays: renewData.renewDays,
          renewPrice: renewData.renewPrice
        })
        
        console.log('✅ 订单信息加载成功')
        
      } else {
        throw new Error('订单不存在')
      }
      
    } catch (error) {
      console.error('❌ 加载订单失败:', error)
      wx.hideLoading()
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 支付续租费用
  async onPayRenew() {
    const { orderId, renewEndDate, renewDays, renewPrice } = this.data
    
    console.log('💳 支付续租费用')
    console.log('  订单号:', orderId)
    console.log('  续租天数:', renewDays)
    console.log('  续租费用:', renewPrice)
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      // 调用续租云函数
      const res = await wx.cloud.callFunction({
        name: 'renewOrder',
        data: {
          orderId: orderId,
          renewEndDate: renewEndDate,
          renewDays: renewDays,
          renewPrice: renewPrice
        }
      })
      
      wx.hideLoading()
      
      console.log('📤 续租结果:', res.result)
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '✅ 续租成功',
          icon: 'success',
          duration: 2000
        })
        
        // 返回订单详情页并刷新
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
        
      } else {
        throw new Error(res.result?.message || '续租失败')
      }
      
    } catch (error) {
      console.error('❌ 续租失败:', error)
      wx.hideLoading()
      
      wx.showModal({
        title: '续租失败',
        content: error.message || '操作失败，请稍后重试',
        showCancel: false
      })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

