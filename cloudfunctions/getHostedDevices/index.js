// 获取托管设备列表云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { status } = event  // status: 'all' | 'pending' | 'online' | 'rejected' | 'recalled'
  
  console.log('📦 获取托管设备列表，用户:', openid, '状态:', status)
  
  try {
    // 构建查询条件
    let query = {
      _openid: openid
    }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    // 查询设备列表
    const result = await db.collection('hosted_devices')
      .where(query)
      .orderBy('createdAt', 'desc')
      .get()
    
    console.log(`✅ 查询到 ${result.data.length} 个设备`)
    
    return {
      success: true,
      data: result.data
    }
    
  } catch (error) {
    console.error('❌ 获取托管设备列表失败:', error)
    return {
      success: false,
      message: '获取失败：' + error.message,
      data: []
    }
  }
}

