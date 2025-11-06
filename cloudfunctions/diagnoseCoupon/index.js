// cloudfunctions/diagnoseCoupon/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 🔍 优惠券消耗诊断云函数
 * 
 * 用于诊断优惠券为什么没有被消耗，并尝试自动修复
 */
exports.main = async (event, context) => {
  console.log('🔍 优惠券消耗诊断（云函数版）')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    console.log('👤 当前用户:', openid)
    console.log('')

    // 1️⃣ 查看最近的订单
    console.log('📦 查询最近的订单...')
    const orderRes = await db.collection('orders')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()

    if (orderRes.data.length === 0) {
      console.log('❌ 暂无订单')
      return {
        success: false,
        message: '暂无订单',
        logs: ['❌ 暂无订单']
      }
    }

    const order = orderRes.data[0]
    let logs = []

    logs.push('📦 最近的订单:')
    logs.push(`  订单号: ${order.orderId}`)
    logs.push(`  状态: ${order.status}`)
    logs.push(`  优惠券ID: ${order.couponId || '未使用优惠券'}`)
    logs.push(`  优惠金额: ${order.couponDiscount || 0} 英镑`)
    logs.push('')

    console.log('📦 最近的订单:')
    console.log('  订单号:', order.orderId)
    console.log('  状态:', order.status)
    console.log('  优惠券ID:', order.couponId || '未使用优惠券')
    console.log('  优惠金额:', order.couponDiscount || 0, '英镑')
    console.log('')

    if (!order.couponId) {
      logs.push('⚠️ 这个订单没有使用优惠券')
      logs.push('💡 请创建一个使用优惠券的订单再测试')
      console.log('⚠️ 这个订单没有使用优惠券')
      return {
        success: false,
        message: '订单未使用优惠券',
        logs: logs
      }
    }

    // 2️⃣ 查询优惠券状态
    console.log('🎟️ 查询优惠券状态...')
    logs.push('🎟️ 查询优惠券状态...')
    
    const couponRes = await db.collection('user_coupons')
      .doc(order.couponId)
      .get()

    const coupon = couponRes.data
    
    logs.push(`  优惠券名称: ${coupon.couponName}`)
    logs.push(`  优惠券状态: ${coupon.status}`)
    logs.push(`  使用订单: ${coupon.usedOrderId || '未使用'}`)
    logs.push(`  使用时间: ${coupon.usedTime || '未使用'}`)
    logs.push('')

    console.log('  优惠券名称:', coupon.couponName)
    console.log('  优惠券状态:', coupon.status)
    console.log('  使用订单:', coupon.usedOrderId || '未使用')
    console.log('  使用时间:', coupon.usedTime || '未使用')
    console.log('')

    // 3️⃣ 判断优惠券状态
    if (coupon.status === 'unused') {
      logs.push('❌ 问题确认：优惠券未被标记为已使用')
      logs.push('')
      logs.push('🔧 正在尝试手动标记...')

      console.log('❌ 问题确认：优惠券未被标记为已使用')
      console.log('')
      console.log('🔧 正在尝试手动标记...')

      // 🛠️ 尝试手动标记
      try {
        const updateRes = await db.collection('user_coupons')
          .doc(order.couponId)
          .update({
            data: {
              status: 'used',
              usedOrderId: order.orderId,
              usedTime: new Date(),
              updateTime: new Date()
            }
          })

        logs.push(`✅ 手动标记成功！受影响记录数: ${updateRes.stats.updated}`)
        console.log(`✅ 手动标记成功！受影响记录数: ${updateRes.stats.updated}`)

        return {
          success: true,
          message: '优惠券已手动标记为已使用',
          action: 'manual_fix',
          logs: logs,
          data: {
            order: order,
            coupon: coupon,
            updateResult: updateRes
          }
        }
      } catch (err) {
        logs.push(`❌ 手动标记失败: ${err.errMsg || err.message}`)
        logs.push(`  错误代码: ${err.errCode}`)
        logs.push('')
        logs.push('🔧 可能的解决方案：')
        logs.push('  1. 检查 user_coupons 集合权限配置')
        logs.push('  2. 确保 write 权限设置为 true（允许云函数写入）')

        console.error('❌ 手动标记失败:', err.errMsg || err.message)
        console.error('  错误代码:', err.errCode)

        return {
          success: false,
          message: '手动标记失败',
          error: err.errMsg || err.message,
          errCode: err.errCode,
          logs: logs,
          needPermissionFix: true
        }
      }
    } else if (coupon.status === 'used') {
      logs.push('✅ 优惠券已正确标记为已使用')
      logs.push('💡 但"我的"页面数字可能需要刷新')
      logs.push('  尝试：退出"我的"页面再重新进入')

      console.log('✅ 优惠券已正确标记为已使用')
      console.log('💡 但"我的"页面数字可能需要刷新')

      return {
        success: true,
        message: '优惠券状态正常',
        logs: logs,
        data: {
          order: order,
          coupon: coupon
        }
      }
    } else if (coupon.status === 'expired') {
      logs.push('⚠️ 优惠券已过期')
      
      console.log('⚠️ 优惠券已过期')

      return {
        success: true,
        message: '优惠券已过期',
        logs: logs,
        data: {
          order: order,
          coupon: coupon
        }
      }
    }

  } catch (err) {
    console.error('❌ 诊断失败:', err)
    return {
      success: false,
      message: '诊断失败: ' + (err.errMsg || err.message),
      error: err.errMsg || err.message,
      errCode: err.errCode,
      logs: ['❌ 诊断过程出错，请查看云函数日志']
    }
  }
}

