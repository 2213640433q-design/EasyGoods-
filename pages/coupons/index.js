Page({
  data: {
    // 状态栏和导航栏高度
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    // Tab切换
    currentTab: 0,  // 0: 我的优惠券, 1: 领取优惠券
    
    // 我的优惠券列表
    myCoupons: [],
    
    // 可领取优惠券列表
    availableCoupons: [],
    
    // 规则弹窗
    showRulesModal: false,
    currentRules: ''
  },

  onLoad() {
    // 获取系统信息，计算导航栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44
    const totalNavHeight = statusBarHeight + navBarHeight
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight
    })
    
    // 加载我的优惠券
    this.loadMyCoupons()
  },

  onShow() {
    // 刷新当前tab的数据
    if (this.data.currentTab === 0) {
      this.loadMyCoupons()
    } else {
      this.loadAvailableCoupons()
    }
  },
  
  // 🔄 切换Tab
  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    console.log('🔄 切换Tab:', index)
    
    this.setData({ currentTab: index })
    
    // 加载对应tab的数据
    if (index === 0) {
      this.loadMyCoupons()
    } else {
      this.loadAvailableCoupons()
    }
  },

  // 🌟 加载我的优惠券（云端化）
  async loadMyCoupons() {
    console.log('🎟️ 开始加载我的优惠券...')
    
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      // ☁️ 调用云函数获取用户优惠券
      const res = await wx.cloud.callFunction({
        name: 'getUserCoupons',
        data: {
          status: '',  // 获取所有状态的优惠券
          page: 1,
          pageSize: 100
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        let coupons = res.result.data || []
        
        console.log('✅ 加载成功！共', coupons.length, '张优惠券')
        
        // 📊 格式化优惠券数据
        const formattedCoupons = coupons.map(coupon => {
          // 计算有效期文本
          const expiryText = this.formatExpiryText(coupon.endTime)
          
          // 生成使用规则文本
          const rules = this.generateRules(coupon)
          
          return {
            id: coupon._id,
            couponId: coupon.couponId,
            name: coupon.couponName,
            amount: coupon.discountValue,
            threshold: coupon.minAmount,
            expiryDate: this.formatDate(coupon.endTime),
            expiryText: expiryText,
            rules: rules,
            status: coupon.status,
            type: coupon.couponType
          }
        })
        
        this.setData({ myCoupons: formattedCoupons })
        
        console.log('📊 显示我的优惠券数:', formattedCoupons.length)
        
      } else {
        throw new Error(res.result?.message || '加载优惠券失败')
      }
      
    } catch (err) {
      console.error('❌ 加载我的优惠券失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setData({ myCoupons: [] })
    }
  },
  
  // 🎁 加载可领取优惠券（云端化）
  async loadAvailableCoupons() {
    console.log('🎁 开始加载可领取优惠券...')
    
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      // ☁️ 调用云函数获取可领取优惠券
      const res = await wx.cloud.callFunction({
        name: 'getAvailableCoupons',
        data: {
          page: 1,
          pageSize: 100
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        let coupons = res.result.data || []
        
        console.log('✅ 加载成功！共', coupons.length, '张可领取优惠券')
        
        // 📊 格式化优惠券数据
        const formattedCoupons = coupons.map(coupon => {
          // 计算有效期文本
          const expiryText = this.formatExpiryText(coupon.endTime)
          
          // 生成使用规则文本
          const rules = this.generateRules(coupon)
          
          return {
            id: coupon._id,
            name: coupon.name,
            amount: coupon.discountValue,
            threshold: coupon.minAmount,
            stock: coupon.stock,
            expiryDate: this.formatDate(coupon.endTime),
            expiryText: expiryText,
            rules: rules,
            type: coupon.type,
            isReceived: coupon.isReceived,
            canReceive: coupon.canReceive
          }
        })
        
        this.setData({ availableCoupons: formattedCoupons })
        
        console.log('📊 显示可领取优惠券数:', formattedCoupons.length)
        
      } else {
        throw new Error(res.result?.message || '加载优惠券失败')
      }
      
    } catch (err) {
      console.error('❌ 加载可领取优惠券失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setData({ availableCoupons: [] })
    }
  },
  
  // 格式化有效期文本
  formatExpiryText(endTime) {
    const now = new Date()
    const expiry = new Date(endTime)
    const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    
    if (days < 0) {
      return '已过期'
    } else if (days === 0) {
      return '今日到期'
    } else if (days === 1) {
      return '明日到期'
    } else if (days <= 3) {
      return `仅剩${days}天`
    } else {
      return this.formatDate(endTime) + '到期'
    }
  },
  
  // 格式化日期
  formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 生成使用规则
  generateRules(coupon) {
    let rules = '使用规则：\n'
    
    if (coupon.couponType === 'reduce') {
      rules += `1. 满${coupon.minAmount}英镑可用\n`
      rules += `2. 立减${coupon.discountValue}英镑\n`
    } else if (coupon.couponType === 'discount') {
      const discount = 10 - coupon.discountValue
      rules += `1. 满${coupon.minAmount}英镑可用\n`
      rules += `2. 享${discount}折优惠\n`
      if (coupon.maxDiscount) {
        rules += `3. 最高优惠${coupon.maxDiscount}英镑\n`
      }
    }
    
    rules += `3. 仅限租赁设备使用\n`
    rules += `4. 不可与其他优惠叠加\n`
    rules += `5. 逾期自动失效`
    
    return rules
  },

  // 显示规则弹窗
  showRules(e) {
    const rules = e.currentTarget.dataset.rules
    this.setData({
      showRulesModal: true,
      currentRules: rules
    })
  },

  // 关闭规则弹窗
  closeRules() {
    this.setData({
      showRulesModal: false,
      currentRules: ''
    })
  },

  // 阻止冒泡
  stopPropagation() {
    // 空函数，防止点击弹窗内容时关闭
  },

  // 🎁 领取优惠券
  async onReceiveCoupon(e) {
    const id = e.currentTarget.dataset.id
    const coupon = this.data.availableCoupons.find(c => c.id === id)
    
    if (!coupon) return
    
    if (!coupon.canReceive) {
      return wx.showToast({
        title: coupon.isReceived ? '您已领取过该优惠券' : '优惠券已抢光',
        icon: 'none'
      })
    }
    
    console.log('🎁 开始领取优惠券:', coupon.name)
    
    wx.showLoading({ title: '领取中...', mask: true })
    
    try {
      // ☁️ 调用云函数领取优惠券
      const res = await wx.cloud.callFunction({
        name: 'receiveCoupon',
        data: {
          couponId: id
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        console.log('✅ 领取成功!')
        
        wx.showToast({
          title: '领取成功',
          icon: 'success',
          duration: 1500
        })
        
        // 刷新可领取列表
        setTimeout(() => {
          this.loadAvailableCoupons()
        }, 1500)
        
      } else {
        throw new Error(res.result?.message || '领取失败')
      }
      
    } catch (err) {
      console.error('❌ 领取优惠券失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '领取失败',
        content: err.message || '请稍后重试',
        showCancel: false
      })
    }
  },
  
  // 使用优惠券（跳转首页）
  onUseCoupon(e) {
    const id = e.currentTarget.dataset.id
    const coupon = this.data.myCoupons.find(c => c.id === id)
    
    if (coupon) {
      wx.showToast({
        title: '跳转首页选择商品',
        icon: 'none',
        duration: 1500
      })
      
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

