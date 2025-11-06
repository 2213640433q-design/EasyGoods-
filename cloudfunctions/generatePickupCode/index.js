// cloudfunctions/generatePickupCode/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 生成取件小程序码
 * 使用微信官方 API，稳定可靠
 */
exports.main = async (event, context) => {
  const { orderId } = event
  
  try {
    console.log('🎫 开始生成取件小程序码，订单号:', orderId)
    
    // 方案1：尝试使用 getUnlimited（无限制数量）
    try {
      const result = await cloud.openapi.wxacode.getUnlimited({
        scene: orderId,
        page: 'pages/index/index', // 明确指定首页
        width: 280,
        autoColor: false,
        lineColor: { r: 0, g: 0, b: 0 },
        isHyaline: false
      })
      
      console.log('✅ 小程序码生成成功（getUnlimited）')
      
      return {
        success: true,
        buffer: result.buffer,
        contentType: result.contentType
      }
    } catch (err1) {
      console.log('⚠️ getUnlimited 失败，尝试 get 接口...', err1.message)
      
      // 方案2：使用 get 接口（开发环境更兼容）
      const result = await cloud.openapi.wxacode.get({
        path: `pages/index/index?scene=${orderId}`, // 完整路径 + 参数
        width: 280
      })
      
      console.log('✅ 小程序码生成成功（get）')
      
      return {
        success: true,
        buffer: result.buffer,
        contentType: result.contentType
      }
    }
    
  } catch (error) {
    console.error('❌ 生成小程序码失败:', error)
    
    return {
      success: false,
      message: error.message || '生成小程序码失败',
      error: error
    }
  }
}

