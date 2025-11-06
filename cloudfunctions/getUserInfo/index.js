// 云函数：getUserInfo - 获取用户信息
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('📋 getUserInfo 云函数被调用')
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('👤 用户 openid:', openid)
  
  try {
    // 查询用户信息
    const result = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()
    
    if (result.data && result.data.length > 0) {
      const userInfo = result.data[0]
      console.log('✅ 找到用户信息:', userInfo.nickname || '未设置昵称')
      
      return {
        success: true,
        data: userInfo,
        message: '获取用户信息成功'
      }
    } else {
      console.log('⚠️ 用户信息不存在，返回 openid')
      
      return {
        success: true,
        data: {
          _openid: openid
        },
        message: '用户信息不存在'
      }
    }
    
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error)
    
    return {
      success: false,
      data: null,
      message: '获取用户信息失败',
      error: error.message
    }
  }
}

