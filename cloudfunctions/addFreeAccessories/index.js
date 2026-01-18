// 云函数：为所有商品添加附赠配件数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 附赠配件映射表（根据商品类别自动分配）
const freeAccessoriesMap = {
  '相机': '相机包×1、镜头盖×1、相机带×1、清洁布×1',
  '镜头': '镜头盖×2、镜头袋×1、清洁布×1',
  '灯光': '灯罩×1、反光板×1、电源线×1',
  '稳定器': '快装板×1、平衡块×2、收纳袋×1、充电线×1',
  '音频': '防风罩×1、转接线×1、收纳袋×1',
  '存储': '读卡器×1、保护盒×1',
  '其他': '说明书×1、保修卡×1'
}

exports.main = async (event, context) => {
  try {
    // 获取所有商品
    const result = await db.collection('products').get()
    const products = result.data
    
    console.log(`📦 找到 ${products.length} 个商品`)
    
    let successCount = 0
    let errorCount = 0
    
    // 为每个商品添加附赠配件
    for (const product of products) {
      try {
        // 根据主分类确定附赠配件
        let freeAccessories = freeAccessoriesMap[product.mainCategory] || freeAccessoriesMap['其他']
        
        // 特殊商品自定义附赠配件
        if (product.name && product.name.includes('Sony')) {
          freeAccessories = '相机包×1、备用电池×1、充电器×1、镜头盖×1、相机带×1、清洁套装×1'
        } else if (product.name && product.name.includes('Canon')) {
          freeAccessories = '相机包×1、镜头盖×1、相机带×1、USB线×1、清洁布×1'
        } else if (product.name && product.name.includes('DJI')) {
          freeAccessories = '快装板×2、平衡块×3、收纳袋×1、充电线×1、三脚架底座×1'
        } else if (product.name && product.name.includes('Rode')) {
          freeAccessories = '防风罩×2、转接线×1、收纳袋×1、电池×2'
        }
        
        // 更新商品
        await db.collection('products').doc(product._id).update({
          data: {
            freeAccessories: freeAccessories
          }
        })
        
        console.log(`✅ 已更新商品: ${product.name} → ${freeAccessories}`)
        successCount++
        
      } catch (err) {
        console.error(`❌ 更新商品失败: ${product.name}`, err)
        errorCount++
      }
    }
    
    return {
      success: true,
      message: `批量更新完成`,
      data: {
        total: products.length,
        successCount: successCount,
        errorCount: errorCount
      }
    }
    
  } catch (err) {
    console.error('批量更新失败:', err)
    return {
      success: false,
      message: '批量更新失败',
      error: err.message
    }
  }
}

