Page({
  data: {
    statusBarHeight: 0,
    currentFilter: 'all', // 筛选：all/valid
    isManage: false,
    list: [], // 全量收藏（仅租赁商品）
    displayList: [], // 当前展示
    totalCount: 0,
    selectedIds: {},
    allChecked: false
  },
  onLoad() {
    try { const w = wx.getWindowInfo(); this.setData({ statusBarHeight: w.statusBarHeight }) } catch(e) {}
  },
  onShow() {
    this.loadFavorites()
  },
  // 加载收藏（本地存储），无数据时注入示例
  loadFavorites() {
    let favs = wx.getStorageSync('favorites') || []
    
    // 只保留租赁商品
    let rentFavs = favs.filter(i => i.type === 'rent')
    
    // 如果没有租赁商品的收藏，注入示例数据
    if (rentFavs.length === 0) {
      const now = Date.now()
      rentFavs = [
        { id: 'f1', type: 'rent', title: 'Sony A7 III 全画幅相机', image: '/static/placeholder/p1.png', price: 25, currency: '£', status: 'valid', rentedCount: 203, favTime: now-1000 },
        { id: 'f2', type: 'rent', title: 'Canon EOS R5 相机', image: '/static/placeholder/p2.png', price: 35, currency: '£', status: 'valid', rentedCount: 89, favTime: now-2000 },
        { id: 'f3', type: 'rent', title: 'DJI Mini 3 Pro 无人机', image: '/static/placeholder/p3.png', price: 30, currency: '£', status: 'offline', rentedCount: 342, favTime: now-3000 },
        { id: 'f4', type: 'rent', title: 'GoPro Hero 11 运动相机', image: '/static/placeholder/p1.png', price: 20, currency: '£', status: 'valid', rentedCount: 156, favTime: now-4000 }
      ]
      // 更新本地存储（保留集市商品 + 添加租赁商品）
      const allFavs = [...favs.filter(i => i.type === 'market'), ...rentFavs]
      wx.setStorageSync('favorites', allFavs)
    }
    
    this.setData({ list: rentFavs, totalCount: rentFavs.length })
    this.applyFilter()
  },
  // 排序：有效优先，其次收藏时间倒序
  sortFavs(arr) {
    const statusRank = { valid: 0, sold: 1, offline: 2 }
    return arr.slice().sort((a,b)=>{
      const r = (statusRank[a.status]||9) - (statusRank[b.status]||9)
      if (r!==0) return r
      return (b.favTime||0) - (a.favTime||0)
    })
  },
  // 过滤
  applyFilter() {
    const { list, currentFilter } = this.data
    let arr = list
    // 筛选：全部或在售
    if (currentFilter === 'valid') {
      arr = list.filter(i => i.status === 'valid')
    }
    arr = this.sortFavs(arr)
    this.setData({ displayList: arr })
  },
  onFilterTap(e) { 
    this.setData({ currentFilter: e.currentTarget.dataset.key })
    this.applyFilter() 
  },
  toggleManage(){ this.setData({ isManage: !this.data.isManage, selectedIds: {}, allChecked: false }) },
  onSelectChange(e){
    const id = e.currentTarget.dataset.id
    const map = { ...this.data.selectedIds }
    map[id] = !map[id]
    const allChecked = this.data.displayList.every(i=>map[i.id])
    this.setData({ selectedIds: map, allChecked })
  },
  onToggleAll(){
    const next = !this.data.allChecked
    const map = {}
    if (next) this.data.displayList.forEach(i=>map[i.id]=true)
    this.setData({ allChecked: next, selectedIds: map })
  },
  onBatchDelete(){
    const ids = Object.keys(this.data.selectedIds).filter(id=>this.data.selectedIds[id])
    if (ids.length===0) return wx.showToast({ title: '未选择', icon: 'none' })
    let favs = wx.getStorageSync('favorites') || []
    favs = favs.filter(i=>!ids.includes(i.id))
    wx.setStorageSync('favorites', favs)
    wx.showToast({ title: '已删除', icon: 'success' })
    this.setData({ isManage:false, selectedIds:{}, allChecked:false })
    this.loadFavorites()
  },
  onUnfavorite(e){
    const id = e.currentTarget.dataset.id
    let favs = wx.getStorageSync('favorites') || []
    favs = favs.filter(i=>i.id!==id)
    wx.setStorageSync('favorites', favs)
    wx.showToast({ title: '已取消收藏', icon: 'success' })
    this.loadFavorites()
  },
  onItemTap(e){
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find(i=>i.id===id)
    if (!item) return
    if (item.type==='rent') {
      wx.navigateTo({ url: `/pages/rental/detail?id=${item.id}` })
    } else {
      wx.navigateTo({ url: `/pages/product/detail?id=${item.id}` })
    }
  },
  goBack(){ wx.navigateBack() }
})


