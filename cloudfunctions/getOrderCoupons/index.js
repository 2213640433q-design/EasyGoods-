// cloudfunctions/getOrderCoupons/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 获取订单可用优惠券云函数
 * 
 * @param {Object} event - 事件参数
 * @param {Number} event.orderAmount - 订单金额（不含押金）
 * 
 * @returns {Object} 可用优惠券列表
 */
exports.main = async (event, context) => {
  console.log('🎟️ getOrderCoupons 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // 📋 提取参数
    const { orderAmount = 0 } = event
    
    console.log('💰 订单金额:', orderAmount, '英镑')
    
    // 🔍 查询用户未使用的优惠券
    const now = new Date()
    const couponsResult = await db.collection('user_coupons')
      .where({
        _openid: openid,
        status: 'unused'
      })
      .get()
    
    let coupons = couponsResult.data
    
    console.log('📊 用户未使用优惠券总数:', coupons.length)
    
    // 🔧 过滤可用优惠券
    const availableCoupons = coupons.filter(coupon => {
      // 检查是否过期
      if (new Date(coupon.endTime) < now) {
        console.log('  优惠券已过期:', coupon.couponName)
        return false
      }
      
      // 检查是否已开始
      if (new Date(coupon.startTime) > now) {
        console.log('  优惠券未开始:', coupon.couponName)
        return false
      }
      
      // 检查订单金额是否满足
      if (orderAmount < coupon.minAmount) {
        console.log('  订单金额不满足:', coupon.couponName, '需要', coupon.minAmount, '英镑')
        return false
      }
      
      console.log('  ✅ 可用:', coupon.couponName)
      return true
    })
    
    // 💰 计算每个优惠券的优惠金额
    const couponsWithDiscount = availableCoupons.map(coupon => {
      let discountAmount = 0
      
      if (coupon.couponType === 'reduce') {
        // 满减券：直接减免
        discountAmount = coupon.discountValue
      } else if (coupon.couponType === 'discount') {
        // 折扣券：打折
        discountAmount = orderAmount * (coupon.discountValue / 100)
        
        // 如果有最高优惠限制
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount
        }
      }
      
      // 保留两位小数
      discountAmount = Math.round(discountAmount * 100) / 100
      
      return {
        ...coupon,
        discountAmount: discountAmount,  // 实际优惠金额
        finalAmount: orderAmount - discountAmount  // 使用后的订单金额
      }
    })
    
    // 📊 按优惠金额倒序排序（优惠最多的排前面）
    couponsWithDiscount.sort((a, b) => b.discountAmount - a.discountAmount)
    
    console.log('✅ 查询成功！')
    console.log('  可用优惠券:', couponsWithDiscount.length, '张')
    
    if (couponsWithDiscount.length > 0) {
      console.log('  最优优惠券:', couponsWithDiscount[0].couponName)
      console.log('  可优惠:', couponsWithDiscount[0].discountAmount, '英镑')
    }
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '获取可用优惠券成功',
      data: couponsWithDiscount,
      summary: {
        total: couponsWithDiscount.length,
        maxDiscount: couponsWithDiscount.length > 0 ? couponsWithDiscount[0].discountAmount : 0,
        bestCoupon: couponsWithDiscount.length > 0 ? couponsWithDiscount[0] : null
      }
    }
    
  } catch (err) {
    console.error('❌ 获取可用优惠券失败:', err)
    
    return {
      success: false,
      message: '获取可用优惠券失败: ' + err.message,
      error: err,
      code: 'GET_ORDER_COUPONS_FAILED'
    }
  }
}

