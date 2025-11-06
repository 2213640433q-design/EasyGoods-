// pages/store/login.js
Page({
  data: {
    statusBarHeight: 0,
    storeList: [], // 门店列表
    selectedStoreIndex: 0,
    selectedStore: null, // 选中的门店
    password: '' // 输入的密码
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    })
    
    // 加载门店列表
    this.loadStoreList()
  },

  // 加载门店列表
  async loadStoreList() {
    try {
      // 模拟门店数据（后续可从数据库获取）
      const stores = [
        { 
          id: 'store_london', 
          name: '伦敦门店', 
          password: '123456',
          phone: '020-1234-5678',
          address: '伦敦市中心店',
          postcode: 'EC1A 1BB'
        },
        { 
          id: 'store_southampton', 
          name: '南安普顿店', 
          password: '123456',
          phone: '023-8012-3456',
          address: '南安普顿市中心',
          postcode: 'SO14 2AE'
        },
        { 
          id: 'store_manchester', 
          name: '曼彻斯特店', 
          password: '123456',
          phone: '016-1234-5678',
          address: '曼彻斯特市中心',
          postcode: 'M1 1AD'
        }
      ]
      
      this.setData({
        storeList: stores,
        selectedStore: stores[0],
        selectedStoreIndex: 0
      })
      
      console.log('✅ 门店列表加载成功:', stores)
      
    } catch (error) {
      console.error('❌ 加载门店列表失败:', error)
      wx.showToast({
        title: '加载门店失败',
        icon: 'none'
      })
    }
  },

  // 选择门店
  onStoreChange(e) {
    const index = e.detail.value
    const selectedStore = this.data.storeList[index]
    
    this.setData({
      selectedStoreIndex: index,
      selectedStore: selectedStore
    })
    
    console.log('🏪 选择门店:', selectedStore.name)
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 登录
  onLogin() {
    const { selectedStore, password } = this.data
    
    if (!selectedStore) {
      wx.showToast({
        title: '请选择门店',
        icon: 'none'
      })
      return
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
      return
    }
    
    // 验证密码
    if (password === selectedStore.password) {
      console.log('✅ 密码验证成功，登录门店:', selectedStore.name)
      
      // 保存门店信息到本地存储
      wx.setStorageSync('currentStore', selectedStore)
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1000
      })
      
      // 跳转到门店管理首页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/store/home'
        })
      }, 1000)
      
    } else {
      console.log('❌ 密码错误')
      
      wx.showModal({
        title: '密码错误',
        content: '门店密码不正确，请重新输入',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

