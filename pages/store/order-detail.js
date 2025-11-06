// pages/store/order-detail.js
Page({
  data: {
    statusBarHeight: 0,
    orderId: '',
    
    // 订单信息
    orderStatus: '',
    orderStatusText: '',
    productName: '',
    productImage: '',
    mainCategory: '',
    subCategory: '',
    accessoriesText: '',
    rentalStartDate: '',
    rentalEndDate: '',
    rentalDays: 0,
    storeName: '',
    equipmentPrice: 0,
    accessoriesPrice: 0,
    couponDiscount: 0,
    deposit: 0,
    totalAmount: 0,
    createTime: '',
    payTime: '',
    
    // 快捷操作按钮
    quickActions: []
  },

  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    })
    
    // 获取订单ID
    const orderId = options.orderId || ''
    
    if (!orderId) {
      wx.showToast({
        title: '订单号无效',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    this.setData({
      orderId: orderId
    })
    
    // 加载订单详情
    this.loadOrderDetail()
  },

  // 加载订单详情
  async loadOrderDetail() {
    const { orderId } = this.data
    
    try {
      wx.showLoading({ title: '加载中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: orderId }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        const order = res.result.data
        
        console.log('📦 订单详情:', order)
        
        // 格式化状态
        const statusMap = {
          'pending': '待支付',
          'paid': '待取件',
          'picked': '租赁中',
          'checking': '检查中',
          'completed': '已完成',
          'damaged': '有折损'
        }
        
        // 设置数据
        this.setData({
          orderStatus: order.status,
          orderStatusText: statusMap[order.status] || order.status,
          productName: order.productName,
          productImage: order.productImage,
          mainCategory: order.mainCategory || '娱乐',
          subCategory: order.subCategory || '',
          accessoriesText: (order.accessories || []).map(item => item.name).join('、') || '无',
          rentalStartDate: order.rentalStartDate,
          rentalEndDate: order.rentalEndDate,
          rentalDays: order.rentalDays,
          storeName: order.storeName || order.pickupLocation,
          equipmentPrice: order.totalRent || 0,
          accessoriesPrice: order.accessoryFee || 0,
          couponDiscount: order.couponDiscount || 0,
          deposit: order.deposit || 0,
          totalAmount: order.totalAmount || 0,
          createTime: this.formatTime(order.createTime),
          payTime: this.formatTime(order.payTime)
        })
        
        // 设置快捷操作按钮
        this.setupQuickActions(order.status)
        
      } else {
        throw new Error('订单不存在')
      }
      
    } catch (error) {
      console.error('❌ 加载订单详情失败:', error)
      wx.hideLoading()
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 设置快捷操作按钮
  setupQuickActions(status) {
    let actions = []
    
    switch(status) {
      case 'paid':
        // 待取件：确认已取件
        actions = [
          { type: 'confirm-pickup', text: '✅ 确认已取件', style: 'primary' }
        ]
        break
        
      case 'picked':
        // 租赁中：确认归还
        actions = [
          { type: 'confirm-return', text: '🔄 确认归还', style: 'primary' }
        ]
        break
        
      case 'checking':
        // 检查中：确认检查无误 / 设备有折损
        actions = [
          { type: 'confirm-ok', text: '✅ 确认检查无误', style: 'success' },
          { type: 'confirm-damaged', text: '⚠️ 设备有折损', style: 'warning' }
        ]
        break
        
      default:
        actions = []
    }
    
    this.setData({
      quickActions: actions
    })
    
    console.log('🎯 快捷操作按钮:', actions)
  },

  // 快捷操作
  async onQuickAction(e) {
    const action = e.currentTarget.dataset.action
    const { orderId, productName, orderStatus } = this.data
    
    console.log('🎯 快捷操作:', action)
    
    switch(action) {
      case 'confirm-pickup':
        // 确认已取件
        wx.showModal({
          title: '确认取件',
          content: `确认顾客已取走设备？\n\n商品：${productName}`,
          confirmText: '确认',
          confirmColor: '#2E5A9B',
          success: async (res) => {
            if (res.confirm) {
              await this.updateStatus('picked', '门店确认已取件')
            }
          }
        })
        break
        
      case 'confirm-return':
        // 确认归还
        wx.showModal({
          title: '确认归还',
          content: `确认归还设备？\n\n商品：${productName}\n\n归还后将进入检查流程`,
          confirmText: '确认归还',
          confirmColor: '#2E5A9B',
          success: async (res) => {
            if (res.confirm) {
              await this.updateStatus('checking', '门店确认已归还')
            }
          }
        })
        break
        
      case 'confirm-ok':
        // 确认检查无误
        wx.showModal({
          title: '确认检查无误',
          content: `确认设备完好无损？\n\n商品：${productName}\n\n确认后订单将完成`,
          confirmText: '确认',
          confirmColor: '#34C759',
          success: async (res) => {
            if (res.confirm) {
              await this.updateStatus('completed', '门店确认检查无误')
            }
          }
        })
        break
        
      case 'confirm-damaged':
        // 设备有折损
        wx.showModal({
          title: '设备有折损',
          content: `确认设备有折损？\n\n商品：${productName}\n\n将标记为有折损状态`,
          confirmText: '确认',
          confirmColor: '#FF3B30',
          success: async (res) => {
            if (res.confirm) {
              await this.updateStatus('damaged', '门店确认设备有折损')
            }
          }
        })
        break
    }
  },

  // 更新订单状态
  async updateStatus(newStatus, note) {
    const { orderId } = this.data
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: orderId,
          newStatus: newStatus,
          note: note
        }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '✅ 操作成功',
          icon: 'success',
          duration: 1500
        })
        
        // 重新加载订单详情
        setTimeout(() => {
          this.loadOrderDetail()
        }, 1500)
        
      } else {
        throw new Error('操作失败')
      }
      
    } catch (error) {
      console.error('❌ 更新状态失败:', error)
      wx.hideLoading()
      
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

