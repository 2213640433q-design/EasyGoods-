Page({
  data: {
    // 状态栏和导航栏高度
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    // 管理模式
    isManage: false,
    selectedIds: {},
    allChecked: false,
    
    // 浏览记录（按日期分组）
    groupedRecords: []
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
    
    this.loadBrowsingHistory()
  },

  onShow() {
    // 每次显示时重新加载
    this.loadBrowsingHistory()
  },

  // 🌟 从云端加载浏览记录
  async loadBrowsingHistory() {
    console.log('🌐 从云端加载浏览记录...')
    
    try {
      const db = wx.cloud.database()
      
      // 从云数据库查询浏览记录
      const res = await db.collection('browse_history')
        .orderBy('browseTime', 'desc')
        .limit(100)  // 最多显示100条
        .get()
      
      if (res.data && res.data.length > 0) {
        console.log('✅ 云端加载成功！共', res.data.length, '条记录')
        
        // 转换数据格式
        const history = res.data.map(record => ({
          id: record._id,
          productId: record.productId,
          type: 'rent',
          title: record.productName,
          image: record.productImage || '/static/placeholder/p1.png',
          price: record.price,
          currency: '£',
          unit: '天',
          date: this.formatDate(new Date(record.browseTime)),
          timestamp: new Date(record.browseTime).getTime()
        }))
        
        // 按日期分组
        const grouped = this.groupByDate(history)
        this.setData({ groupedRecords: grouped })
      } else {
        console.log('⚠️ 暂无浏览记录')
        this.setData({ groupedRecords: [] })
      }
    } catch (err) {
      console.error('❌ 云端加载失败:', err)
      
      // 失败时显示空状态
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      
      this.setData({ groupedRecords: [] })
    }
  },

  // 按日期分组
  groupByDate(records) {
    const groups = {}
    const today = this.formatDate(new Date())
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = this.formatDate(yesterday)
    
    records.forEach(record => {
      const date = record.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(record)
    })
    
    // 转换为数组并排序
    const result = Object.keys(groups).map(date => {
      let dateLabel = date
      if (date === today) {
        dateLabel = '今天'
      } else if (date === yesterdayStr) {
        dateLabel = '昨天'
      } else {
        // 格式化为 10月29日
        const d = new Date(date)
        dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`
      }
      
      return {
        date: date,
        dateLabel: dateLabel,
        records: groups[date].sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序
      }
    })
    
    // 按日期倒序排序
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return result
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 点击商品
  onProductTap(e) {
    if (this.data.isManage) return // 管理模式下不跳转
    
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/rental/detail?id=${productId}`
    })
  },

  // 切换管理模式
  toggleManage() {
    this.setData({
      isManage: !this.data.isManage,
      selectedIds: {},
      allChecked: false
    })
  },

  // 🔘 点击复选框（切换选中状态）
  onCheckboxTap(e) {
    const id = e.currentTarget.dataset.id
    
    if (!id) {
      console.error('❌ 复选框没有 id')
      return
    }
    
    console.log('🔘 点击复选框:', id, '类型:', typeof id)
    
    const map = { ...this.data.selectedIds }
    map[id] = !map[id]  // 切换状态
    
    // 检查是否全选
    let allRecordsCount = 0
    this.data.groupedRecords.forEach(group => {
      allRecordsCount += group.records.length
    })
    const selectedCount = Object.keys(map).filter(key => map[key]).length
    const allChecked = selectedCount === allRecordsCount && allRecordsCount > 0
    
    console.log('✅ 已选:', selectedCount, '/', allRecordsCount)
    console.log('📦 selectedIds:', map)
    
    this.setData({ selectedIds: map, allChecked })
  },

  // 全选/取消全选
  onToggleAll() {
    const next = !this.data.allChecked
    const map = {}
    
    if (next) {
      this.data.groupedRecords.forEach(group => {
        group.records.forEach(record => {
          map[record.id] = true
        })
      })
    }
    
    this.setData({ allChecked: next, selectedIds: map })
  },

  // 🌟 批量删除（从云端删除）
  async onBatchDelete() {
    console.log('🗑️ 准备删除，selectedIds:', this.data.selectedIds)
    
    const ids = Object.keys(this.data.selectedIds).filter(id => this.data.selectedIds[id])
    
    console.log('🗑️ 过滤后的 ids:', ids)
    
    if (ids.length === 0) {
      console.warn('⚠️ 未选择任何记录')
      return wx.showToast({ title: '未选择任何记录', icon: 'none' })
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除${ids.length}条浏览记录吗？`,
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            const db = wx.cloud.database()
            
            // 批量删除云端记录
            const deletePromises = ids.map(id => {
              return db.collection('browse_history').doc(id).remove()
            })
            
            await Promise.all(deletePromises)
            
            console.log('✅ 删除成功！删除了', ids.length, '条记录')
            
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            
            this.setData({
              isManage: false,
              selectedIds: {},
              allChecked: false
            })
            
            // 重新加载
            this.loadBrowsingHistory()
          } catch (err) {
            console.error('❌ 删除失败:', err)
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})

