// cloudfunctions/receiveCoupon/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

/**
 * 领取优惠券云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.couponId - 优惠券模板ID
 * 
 * @returns {Object} 领取结果
 */
exports.main = async (event, context) => {
  console.log('🎁 receiveCoupon 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // ✅ 验证必填参数
    const { couponId } = event
    
    if (!couponId) {
      console.error('❌ 缺少必填参数: couponId')
      return {
        success: false,
        message: '缺少必填参数: couponId',
        code: 'MISSING_PARAM'
      }
    }
    
    console.log('🔍 查询优惠券模板:', couponId)
    
    // 🔍 查询优惠券模板
    const couponResult = await db.collection('coupons').doc(couponId).get()
    
    if (!couponResult.data) {
      console.warn('⚠️ 优惠券不存在')
      return {
        success: false,
        message: '优惠券不存在',
        code: 'COUPON_NOT_FOUND'
      }
    }
    
    const coupon = couponResult.data
    
    // ✅ 验证优惠券状态
    if (coupon.status !== 'valid') {
      console.warn('⚠️ 优惠券已下架')
      return {
        success: false,
        message: '优惠券已下架',
        code: 'COUPON_INVALID'
      }
    }
    
    // ✅ 验证优惠券有效期
    const now = new Date()
    if (new Date(coupon.endTime) < now) {
      console.warn('⚠️ 优惠券已过期')
      return {
        success: false,
        message: '优惠券已过期',
        code: 'COUPON_EXPIRED'
      }
    }
    
    if (new Date(coupon.startTime) > now) {
      console.warn('⚠️ 优惠券未开始')
      return {
        success: false,
        message: '优惠券未开始',
        code: 'COUPON_NOT_STARTED'
      }
    }
    
    // ✅ 验证库存
    if (coupon.stock <= 0) {
      console.warn('⚠️ 优惠券库存不足')
      return {
        success: false,
        message: '优惠券已被抢光',
        code: 'COUPON_OUT_OF_STOCK'
      }
    }
    
    // ✅ 检查是否已领取
    const existResult = await db.collection('user_coupons')
      .where({
        _openid: openid,
        couponId: couponId
      })
      .get()
    
    if (existResult.data.length > 0) {
      console.warn('⚠️ 优惠券已领取')
      return {
        success: false,
        message: '您已领取过该优惠券',
        code: 'COUPON_ALREADY_RECEIVED'
      }
    }
    
    // 💾 创建用户优惠券记录
    console.log('💾 正在创建用户优惠券记录...')
    
    const userCoupon = {
      _openid: openid,
      couponId: couponId,
      couponName: coupon.name,
      couponType: coupon.type,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount || null,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      status: 'unused',
      receiveTime: now,
      updateTime: now
    }
    
    const addResult = await db.collection('user_coupons').add({
      data: userCoupon
    })
    
    // 📉 减少优惠券库存
    await db.collection('coupons').doc(couponId).update({
      data: {
        stock: _.inc(-1),  // 库存减1
        receivedCount: _.inc(1)  // 领取数量加1
      }
    })
    
    console.log('✅ 优惠券领取成功！')
    console.log('  用户优惠券 ID:', addResult._id)
    console.log('  优惠券名称:', coupon.name)
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '领取成功',
      data: {
        _id: addResult._id,
        couponName: coupon.name,
        discountValue: coupon.discountValue,
        minAmount: coupon.minAmount,
        endTime: coupon.endTime
      }
    }
    
  } catch (err) {
    console.error('❌ 领取优惠券失败:', err)
    
    return {
      success: false,
      message: '领取优惠券失败: ' + err.message,
      error: err,
      code: 'RECEIVE_COUPON_FAILED'
    }
  }
}

