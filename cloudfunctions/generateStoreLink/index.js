// cloudfunctions/generateStoreLink/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 生成门店扫码页面的 URL Scheme
 * 工作人员可以通过浏览器链接直接打开小程序
 */
exports.main = async (event, context) => {
  try {
    console.log('🔗 开始生成门店扫码页面 URL Scheme')
    
    // 调用微信官方 API 生成 URL Scheme
    const result = await cloud.openapi.urlscheme.generate({
      jumpWxa: {
        path: 'pages/store/scan', // 门店扫码页面路径
        query: '' // 无需额外参数
      },
      isExpire: false, // 永久有效（不过期）
      expireType: 0
    })
    
    console.log('✅ URL Scheme 生成成功')
    console.log('🔗 链接:', result.openlink)
    
    return {
      success: true,
      link: result.openlink,
      message: '链接生成成功'
    }
    
  } catch (error) {
    console.error('❌ 生成 URL Scheme 失败:', error)
    
    return {
      success: false,
      message: error.message || '生成链接失败',
      error: error
    }
  }
}

