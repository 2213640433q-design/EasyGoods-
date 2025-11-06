// 退出登录调试脚本
// 在微信开发者工具的控制台中执行

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 退出登录状态检查')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// 1. 检查本地存储
console.log('\n📋 步骤1：检查本地存储')
const userInfo = wx.getStorageSync('userInfo')
const openid = wx.getStorageSync('openid')
const cityName = wx.getStorageSync('CITY_NAME')

console.log('userInfo:', userInfo)
console.log('openid:', openid)
console.log('cityName:', cityName)

if (!userInfo || Object.keys(userInfo).length === 0) {
  console.log('✅ userInfo 已清空')
} else {
  console.log('❌ userInfo 仍有数据，退出登录可能失败')
}

if (!openid) {
  console.log('✅ openid 已清空')
} else {
  console.log('❌ openid 仍有数据')
}

// 2. 检查页面数据
console.log('\n📋 步骤2：检查页面 data')
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
console.log('当前页面路径:', currentPage.route)
console.log('页面 data.userInfo:', currentPage.data.userInfo)
console.log('页面 data.openid:', currentPage.data.openid)

// 3. 模拟退出登录
console.log('\n📋 步骤3：模拟退出登录')
console.log('执行以下代码来模拟退出：')
console.log('wx.removeStorageSync("userInfo")')
console.log('wx.removeStorageSync("openid")')
console.log('wx.reLaunch({ url: "/pages/profile/index" })')

// 4. 手动执行退出（取消注释以执行）
/*
wx.removeStorageSync('userInfo')
wx.removeStorageSync('openid')
console.log('✅ 已清除本地数据')
wx.reLaunch({ url: '/pages/profile/index' })
*/

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('💡 使用说明：')
console.log('1. 如果看到 userInfo 或 openid 仍有数据，说明退出登录失败')
console.log('2. 可以手动执行上面的代码来清除数据')
console.log('3. 观察控制台输出的详细日志')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')


