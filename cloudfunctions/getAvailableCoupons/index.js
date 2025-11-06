// cloudfunctions/getAvailableCoupons/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 获取可领取优惠券列表云函数
 * 
 * @param {Object} event - 事件参数
 * @param {Number} event.page - 页码（默认1）
 * @param {Number} event.pageSize - 每页数量（默认20）
 * 
 * @returns {Object} 可领取优惠券列表
 */
exports.main = async (event, context) => {
  console.log('🎁 getAvailableCoupons 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // 📋 提取参数
    const {
      page = 1,
      pageSize = 20
    } = event
    
    // 🔍 查询有效的优惠券模板
    const now = new Date()
    const query = db.collection('coupons').where({
      status: 'valid',  // 只查询有效的优惠券
      startTime: db.command.lte(now),  // 已开始
      endTime: db.command.gte(now)     // 未结束
    })
    
    // 📊 查询总数
    const countResult = await query.count()
    const total = countResult.total
    
    console.log('📊 可领取优惠券总数:', total)
    
    // 📄 分页查询
    const skip = (page - 1) * pageSize
    const couponsResult = await query
      .orderBy('createTime', 'desc')  // 按创建时间倒序
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const coupons = couponsResult.data
    
    // 🔍 检查用户是否已领取
    const couponIds = coupons.map(c => c._id)
    const userCouponsResult = await db.collection('user_coupons')
      .where({
        _openid: openid,
        couponId: db.command.in(couponIds)
      })
      .get()
    
    const receivedCouponIds = new Set(userCouponsResult.data.map(uc => uc.couponId))
    
    // 🏷️ 标记优惠券是否已领取
    const couponsWithStatus = coupons.map(coupon => ({
      ...coupon,
      isReceived: receivedCouponIds.has(coupon._id),
      canReceive: !receivedCouponIds.has(coupon._id) && coupon.stock > 0
    }))
    
    console.log('✅ 查询成功！')
    console.log('  当前页:', page)
    console.log('  返回数量:', couponsWithStatus.length)
    console.log('  总数:', total)
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '获取可领取优惠券成功',
      data: couponsWithStatus,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
    
  } catch (err) {
    console.error('❌ 获取可领取优惠券失败:', err)
    
    return {
      success: false,
      message: '获取可领取优惠券失败: ' + err.message,
      error: err,
      code: 'GET_AVAILABLE_COUPONS_FAILED'
    }
  }
}

