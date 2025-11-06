// 云函数：getOrderStats - 获取订单统计数量
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('📊 getOrderStats 云函数被调用')
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('👤 用户 openid:', openid)
  
  try {
    const _ = db.command
    
    // 查询用户的全部订单数量（排除已取消的订单）
    const allOrderResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: _.neq('cancelled')  // 排除已取消订单
      })
      .count()
    
    // 查询待支付订单数量
    const pendingResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: 'pending'
      })
      .count()
    
    // 查询待取件订单数量
    const pickupResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: 'paid'
      })
      .count()
    
    // 查询租赁中订单数量（status 值为 'picked'）
    const rentingResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: 'picked'
      })
      .count()
    
    // 查询检查中订单数量
    const checkingResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: 'checking'
      })
      .count()
    
    // 查询已完成订单数量
    const completedResult = await db.collection('orders')
      .where({ 
        _openid: openid,
        status: 'completed'
      })
      .count()
    
    const stats = {
      allOrderCount: allOrderResult.total,
      pendingOrderCount: pendingResult.total,
      pickupOrderCount: pickupResult.total,
      rentingOrderCount: rentingResult.total,
      checkingOrderCount: checkingResult.total,
      completedOrderCount: completedResult.total
    }
    
    console.log('✅ 订单统计数据:', stats)
    
    return {
      success: true,
      data: stats,
      message: '获取订单统计成功'
    }
    
  } catch (error) {
    console.error('❌ 获取订单统计失败:', error)
    
    return {
      success: false,
      data: {
        allOrderCount: 0,
        pendingOrderCount: 0,
        pickupOrderCount: 0,
        rentingOrderCount: 0,
        checkingOrderCount: 0,
        completedOrderCount: 0
      },
      message: '获取订单统计失败',
      error: error.message
    }
  }
}

