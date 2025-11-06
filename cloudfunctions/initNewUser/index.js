// cloudfunctions/initNewUser/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 初始化新用户云函数
 * 自动为新用户发放欢迎优惠券
 * 
 * @returns {Object} 初始化结果
 */
exports.main = async (event, context) => {
  console.log('👋 initNewUser 云函数被调用')
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // 🔍 检查用户是否已经初始化过
    const existingCoupons = await db.collection('user_coupons')
      .where({
        _openid: openid
      })
      .count()
    
    if (existingCoupons.total > 0) {
      console.log('⚠️ 用户已初始化过，不重复发放优惠券')
      return {
        success: true,
        message: '用户已初始化',
        isNewUser: false,
        couponsGiven: 0
      }
    }
    
    console.log('🎉 检测到新用户！开始发放欢迎优惠券...')
    
    // 🔍 查询优惠券模板（8折券）
    // 首先尝试查找名称包含"8折"或"新人"的优惠券
    const couponsResult = await db.collection('coupons')
      .where({
        status: 'valid',
        type: 'discount',
        discountValue: 20  // 8折 = 100% - 20% = 80%
      })
      .limit(2)
      .get()
    
    let couponTemplates = couponsResult.data
    
    console.log('📊 找到', couponTemplates.length, '张8折优惠券模板')
    
    // 🎁 如果没有找到8折券，创建默认的欢迎优惠券模板
    if (couponTemplates.length === 0) {
      console.log('⚠️ 未找到8折券模板，创建默认优惠券...')
      
      const now = new Date()
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 30)  // 30天有效期
      
      // 创建两张不同额度的8折券
      const newCoupons = [
        {
          name: '新人专享8折券（满50可用）',
          type: 'discount',
          discountValue: 20,  // 8折
          minAmount: 50,
          maxDiscount: 15,
          stock: 999999,
          receivedCount: 0,
          status: 'valid',
          startTime: now,
          endTime: endTime,
          createTime: now,
          description: '新用户专享，全场通用'
        },
        {
          name: '新人专享8折券（满100可用）',
          type: 'discount',
          discountValue: 20,  // 8折
          minAmount: 100,
          maxDiscount: 30,
          stock: 999999,
          receivedCount: 0,
          status: 'valid',
          startTime: now,
          endTime: endTime,
          createTime: now,
          description: '新用户专享，全场通用'
        }
      ]
      
      // 批量创建优惠券模板
      for (const coupon of newCoupons) {
        const addResult = await db.collection('coupons').add({
          data: coupon
        })
        
        couponTemplates.push({
          _id: addResult._id,
          ...coupon
        })
        
        console.log('✅ 创建优惠券模板:', coupon.name)
      }
    }
    
    // 🎁 为用户发放优惠券
    const now = new Date()
    const userCoupons = []
    
    for (const template of couponTemplates) {
      const userCoupon = {
        _openid: openid,
        couponId: template._id,
        couponName: template.name,
        couponType: template.type,
        discountValue: template.discountValue,
        minAmount: template.minAmount,
        maxDiscount: template.maxDiscount || null,
        startTime: template.startTime,
        endTime: template.endTime,
        status: 'unused',
        receiveTime: now,
        updateTime: now
      }
      
      const addResult = await db.collection('user_coupons').add({
        data: userCoupon
      })
      
      userCoupons.push({
        _id: addResult._id,
        name: template.name
      })
      
      console.log('✅ 发放优惠券:', template.name)
    }
    
    console.log('🎉 新用户初始化完成！')
    console.log('  发放优惠券数量:', userCoupons.length, '张')
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '欢迎新用户！已发放优惠券',
      isNewUser: true,
      couponsGiven: userCoupons.length,
      coupons: userCoupons
    }
    
  } catch (err) {
    console.error('❌ 初始化新用户失败:', err)
    
    return {
      success: false,
      message: '初始化失败: ' + err.message,
      error: err,
      code: 'INIT_NEW_USER_FAILED'
    }
  }
}

