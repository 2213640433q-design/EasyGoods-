// 获取托管统计数据云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('📊 获取托管统计数据，用户:', openid)
  
  try {
    // 获取所有设备
    const allDevices = await db.collection('hosted_devices')
      .where({
        _openid: openid
      })
      .get()
    
    const devices = allDevices.data
    
    // 计算统计数据
    const stats = {
      deviceCount: devices.length,
      totalRevenue: devices.reduce((sum, d) => sum + (d.totalRevenue || 0), 0).toFixed(2),
      monthRevenue: devices.reduce((sum, d) => sum + (d.monthRevenue || 0), 0).toFixed(2)
    }
    
    // 计算各状态数量
    const counts = {
      pending: devices.filter(d => d.status === 'pending').length,
      online: devices.filter(d => d.status === 'online').length,
      rejected: devices.filter(d => d.status === 'rejected').length,
      recalled: devices.filter(d => d.status === 'recalled').length
    }
    
    console.log('✅ 统计数据:', stats, counts)
    
    return {
      success: true,
      data: {
        stats,
        counts
      }
    }
    
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error)
    return {
      success: false,
      message: '获取失败：' + error.message,
      data: {
        stats: { deviceCount: 0, totalRevenue: 0, monthRevenue: 0 },
        counts: { pending: 0, online: 0, rejected: 0, recalled: 0 }
      }
    }
  }
}

