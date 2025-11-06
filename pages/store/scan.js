// pages/store/scan.js
Page({
  data: {
    statusBarHeight: 0,
    orderInfo: null, // 扫描后的订单信息
    inputOrderId: '', // 手动输入的订单号
    pendingOrderId: '', // 等待验证的订单号
    qrType: 'unknown', // 二维码类型：pickup(取件) 或 return(归还)
    showPasswordModal: false, // 是否显示密码验证弹窗
    storePassword: '' // 门店密码（可配置）
  },

  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    })
    
    // 检查门店登录状态
    const currentStore = wx.getStorageSync('currentStore')
    if (!currentStore) {
      wx.showToast({
        title: '请先登录门店',
        icon: 'none',
        duration: 2000
      })
      
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/store/login'
        })
      }, 2000)
      return
    }
    
    console.log('✅ 当前门店:', currentStore.name)
    console.log('📱 门店扫码页面参数:', options)
    
    // 检查是否携带订单号参数（从首页跳转过来或扫小程序码）
    const orderId = options.orderId || ''
    
    if (orderId) {
      // 通过小程序码扫描后从首页跳转过来
      console.log('🎫 检测到订单号参数:', orderId)
      
      // 已登录门店，直接加载订单
      this.loadOrderByOrderId(orderId)
    }
  },

  // 输入订单号
  onOrderIdInput(e) {
    this.setData({
      inputOrderId: e.detail.value
    })
  },
  
  // 查询订单（手动输入）- 已登录门店，直接查询
  async onSearchOrder() {
    const { inputOrderId } = this.data
    
    if (!inputOrderId || inputOrderId.trim() === '') {
      wx.showToast({
        title: '请输入订单号',
        icon: 'none'
      })
      return
    }
    
    // 已登录门店，直接加载订单
    await this.loadOrderByOrderId(inputOrderId.trim())
  },
  
  // 扫描二维码
  onScanQRCode() {
    wx.scanCode({
      onlyFromCamera: false, // 允许从相册选择图片
      scanType: ['qrCode'], // 只扫描二维码
      success: (res) => {
        console.log('📷 扫码成功:', res.result)
        this.handleScanResult(res.result)
      },
      fail: (err) => {
        console.error('❌ 扫码失败:', err)
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  // 通过订单号加载订单
  async loadOrderByOrderId(orderId) {
    const { qrType } = this.data
    
    try {
      wx.showLoading({ title: '加载订单...' })
      
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: orderId }
      })
      
      wx.hideLoading()
      
      console.log('📦 订单详情:', res.result)
      console.log('🔍 二维码类型:', qrType)
      
      if (res.result && res.result.success) {
        const order = res.result.data
        
        // 验证订单状态是否符合操作要求
        const statusMap = {
          'pending': '待支付',
          'paid': '待取件',
          'picked': '租赁中',
          'returning': '归还中',
          'checking': '检查中',
          'completed': '已完成'
        }
        
        // 根据二维码类型验证订单状态
        if (qrType === 'pickup') {
          // 取件二维码：只能用于"待取件"状态
          if (order.status !== 'paid') {
            wx.showModal({
              title: '无法取件',
              content: `该订单当前状态为"${statusMap[order.status]}"，不能取件`,
              showCancel: false
            })
            return
          }
        } else if (qrType === 'return') {
          // 归还二维码：只能用于"租赁中"状态
          if (order.status !== 'picked') {
            wx.showModal({
              title: '无法归还',
              content: `该订单当前状态为"${statusMap[order.status]}"，不能归还`,
              showCancel: false
            })
            return
          }
        }
        
        // 显示订单信息
        this.setData({
          orderInfo: order,
          inputOrderId: '' // 清空输入框
        })
        
        // 播放成功提示音
        wx.showToast({
          title: '订单加载成功',
          icon: 'success',
          duration: 1000
        })
        
      } else {
        throw new Error(res.result?.message || '订单不存在')
      }
      
    } catch (err) {
      console.error('❌ 加载订单失败:', err)
      wx.hideLoading()
      
      wx.showModal({
        title: '查询失败',
        content: err.message || '订单不存在或查询失败',
        showCancel: false
      })
    }
  },
  
  // 处理扫码结果 - 先验证密码，再加载订单
  async handleScanResult(result) {
    try {
      // 尝试解析二维码（可能是 JSON 或纯订单号）
      let orderId = ''
      let qrType = 'unknown' // 二维码类型：pickup(取件) 或 return(归还)
      
      // 尝试解析 JSON 格式
      try {
        const data = JSON.parse(result)
        if (data.orderId) {
          orderId = data.orderId
          qrType = data.type || 'unknown'
        }
      } catch (e) {
        // 不是 JSON，当作纯订单号处理
        orderId = result.trim()
      }
      
      console.log('🔍 扫码获取到订单号:', orderId)
      console.log('🔍 二维码类型:', qrType)
      
      // 验证订单号格式
      if (!orderId || !orderId.startsWith('ORDER')) {
        wx.showToast({
          title: '无效的订单号',
          icon: 'none'
        })
        return
      }
      
      // 保存二维码类型
      this.setData({
        qrType: qrType
      })
      
      // 已登录门店，直接加载订单
      await this.loadOrderByOrderId(orderId)
      
    } catch (err) {
      console.error('❌ 处理扫码结果失败:', err)
      
      wx.showModal({
        title: '扫码失败',
        content: err.message || '二维码格式错误',
        showCancel: false
      })
    }
  },

  // 确认操作（取件或归还）
  onConfirmAction() {
    const { orderInfo, qrType } = this.data
    
    if (!orderInfo) {
      wx.showToast({
        title: '请先扫描二维码',
        icon: 'none'
      })
      return
    }
    
    // 根据二维码类型显示不同的确认弹窗
    if (qrType === 'pickup') {
      // 取件确认
      wx.showModal({
        title: '确认取件',
        content: `确认顾客已取走设备？\n\n订单号：${orderInfo.orderId}\n商品：${orderInfo.productName}`,
        confirmText: '确认',
        confirmColor: '#2E5A9B',
        success: async (res) => {
          if (res.confirm) {
            await this.confirmPickup()
          }
        }
      })
    } else if (qrType === 'return') {
      // 归还确认
      wx.showModal({
        title: '确认归还',
        content: `确认归还设备？\n\n订单号：${orderInfo.orderId}\n商品：${orderInfo.productName}\n\n归还后将进入检查流程`,
        confirmText: '确认归还',
        confirmColor: '#2E5A9B',
        success: async (res) => {
          if (res.confirm) {
            await this.confirmReturn()
          }
        }
      })
    }
  },

  // 执行确认取件
  async confirmPickup() {
    const { orderInfo } = this.data
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: orderInfo.orderId,
          newStatus: 'picked', // 更新为"租赁中"
          note: '门店扫码确认取件'
        }
      })
      
      wx.hideLoading()
      
      console.log('✅ 取件确认结果:', res.result)
      
      if (res.result && res.result.success) {
        // 显示成功提示
        wx.showToast({
          title: '✅ 取件成功',
          icon: 'success',
          duration: 2000
        })
        
        // 清空订单信息，准备下一单
        this.setData({
          orderInfo: null,
          qrType: 'unknown'
        })
        
        // 可选：播放成功音效
        wx.vibrateShort()
        
      } else {
        throw new Error(res.result?.message || '操作失败')
      }
      
    } catch (error) {
      console.error('❌ 确认取件失败:', error)
      wx.hideLoading()
      
      wx.showModal({
        title: '操作失败',
        content: error.message || '确认取件失败，请稍后重试',
        showCancel: false
      })
    }
  },
  
  // 执行确认归还
  async confirmReturn() {
    const { orderInfo } = this.data
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: orderInfo.orderId,
          newStatus: 'checking', // 更新为"检查中"
          note: '门店扫码确认归还'
        }
      })
      
      wx.hideLoading()
      
      console.log('✅ 归还确认结果:', res.result)
      
      if (res.result && res.result.success) {
        // 显示成功提示
        wx.showToast({
          title: '✅ 归还成功',
          icon: 'success',
          duration: 2000
        })
        
        // 清空订单信息，准备下一单
        this.setData({
          orderInfo: null,
          qrType: 'unknown'
        })
        
        // 可选：播放成功音效
        wx.vibrateShort()
        
      } else {
        throw new Error(res.result?.message || '操作失败')
      }
      
    } catch (error) {
      console.error('❌ 确认归还失败:', error)
      wx.hideLoading()
      
      wx.showModal({
        title: '操作失败',
        content: error.message || '确认归还失败，请稍后重试',
        showCancel: false
      })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

