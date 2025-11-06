// cloudfunctions/createOrder/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 创建订单云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.productId - 商品ID
 * @param {String} event.productName - 商品名称
 * @param {String} event.productImage - 商品图片
 * @param {String} event.mainCategory - 一级分类
 * @param {String} event.subCategory - 二级分类
 * @param {String} event.rentalStartDate - 租赁开始日期 (YYYY-MM-DD)
 * @param {String} event.rentalEndDate - 租赁结束日期 (YYYY-MM-DD)
 * @param {Number} event.rentalDays - 租赁天数
 * @param {String} event.pickupLocation - 取货地点
 * @param {Array} event.accessories - 额外配件 [{ id, name, price }]
 * @param {Number} event.dailyPrice - 日租金
 * @param {Number} event.deposit - 押金
 * @param {String} event.note - 备注
 * 
 * @returns {Object} 订单信息
 */
exports.main = async (event, context) => {
  console.log('📦 createOrder 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // ✅ 验证必填参数
    const requiredFields = [
      'productId', 'productName', 'productImage',
      'mainCategory', 'subCategory',
      'rentalStartDate', 'rentalEndDate', 'rentalDays',
      'pickupLocation', 'dailyPrice', 'deposit'
    ]
    
    for (const field of requiredFields) {
      if (!event[field] && event[field] !== 0) {
        console.error(`❌ 缺少必填参数: ${field}`)
        return {
          success: false,
          message: `缺少必填参数: ${field}`,
          code: 'MISSING_PARAM'
        }
      }
    }
    
    // 📋 提取参数
    const {
      productId,
      productName,
      productImage,
      mainCategory,
      subCategory,
      rentalStartDate,
      rentalEndDate,
      rentalDays,
      pickupLocation,
      accessories = [],
      dailyPrice,
      deposit,
      couponId = null,  // 🎟️ 优惠券ID
      couponDiscount = 0,  // 🎟️ 优惠券优惠金额
      note = ''
    } = event
    
    // 🔍 调试：检查接收到的参数
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 接收到的优惠券参数:')
    console.log('  couponId:', couponId, '(类型:', typeof couponId, ')')
    console.log('  couponDiscount:', couponDiscount, '(类型:', typeof couponDiscount, ')')
    console.log('  couponDiscount 原始值:', event.couponDiscount)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 💰 计算费用
    const totalRent = dailyPrice * rentalDays  // 总租金
    const accessoryFee = accessories.reduce((sum, item) => sum + (item.price || 0), 0)  // 配件费用
    
    // 🔍 确保 couponDiscount 是数字类型
    const couponDiscountNum = Number(couponDiscount) || 0
    
    console.log('🔍 计算前的值:')
    console.log('  totalRent:', totalRent)
    console.log('  deposit:', deposit)
    console.log('  accessoryFee:', accessoryFee)
    console.log('  couponDiscountNum:', couponDiscountNum)
    
    let totalAmount = totalRent + deposit + accessoryFee - couponDiscountNum  // 订单总额（含优惠券优惠）
    
    console.log('  计算结果 =', totalRent, '+', deposit, '+', accessoryFee, '-', couponDiscountNum)
    console.log('  totalAmount =', totalAmount)
    
    // 确保总额不为负数
    if (totalAmount < 0) {
      totalAmount = 0
    }
    
    console.log('💰 费用计算:')
    console.log('  日租金:', dailyPrice, '英镑')
    console.log('  租赁天数:', rentalDays, '天')
    console.log('  总租金:', totalRent, '英镑')
    console.log('  押金:', deposit, '英镑')
    console.log('  配件费用:', accessoryFee, '英镑')
    
    if (couponDiscountNum > 0) {
      console.log('  🎟️ 优惠券优惠:', couponDiscountNum, '英镑')
    }
    
    console.log('  订单总额:', totalAmount, '英镑')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 🆔 生成订单号（ORDER + 时间戳）
    const orderId = 'ORDER' + Date.now()
    console.log('🆔 生成订单号:', orderId)
    
    // 📅 当前时间
    const now = new Date()
    
    // 📦 构建订单对象
    const order = {
      _openid: openid,  // 🔑 用户标识
      
      // 订单基本信息
      orderId: orderId,
      status: 'pending',  // 待支付
      type: 'rent',
      
      // 商品信息
      productId: productId,
      productName: productName,
      productImage: productImage,
      mainCategory: mainCategory,
      subCategory: subCategory,
      
      // 租赁信息
      rentalStartDate: rentalStartDate,
      rentalEndDate: rentalEndDate,
      rentalDays: rentalDays,
      pickupLocation: pickupLocation,
      
      // 配件信息
      accessories: accessories,
      
      // 价格信息
      dailyPrice: dailyPrice,
      totalRent: totalRent,
      deposit: deposit,
      accessoryFee: accessoryFee,
      totalAmount: totalAmount,
      
      // 🎟️ 优惠券信息
      couponId: couponId,
      couponDiscount: couponDiscountNum,
      
      // 时间戳
      createTime: now,
      updateTime: now,
      
      // 其他信息
      note: note
    }
    
    console.log('📦 订单对象构建完成')
    
    // 💾 保存到数据库
    console.log('💾 正在保存到数据库...')
    const addResult = await db.collection('orders').add({
      data: order
    })
    
    console.log('✅ 订单创建成功！')
    console.log('  数据库 _id:', addResult._id)
    console.log('  订单号:', orderId)
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '订单创建成功',
      data: {
        _id: addResult._id,
        orderId: orderId,
        totalAmount: totalAmount,
        order: order
      }
    }
    
  } catch (err) {
    console.error('❌ 创建订单失败:', err)
    
    return {
      success: false,
      message: '创建订单失败: ' + err.message,
      error: err,
      code: 'CREATE_ORDER_FAILED'
    }
  }
}

