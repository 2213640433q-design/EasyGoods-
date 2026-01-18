// 🧪 测试脚本：验证云函数和数据库权限
// 在微信开发者工具的控制台中运行此代码

async function testUpdateProductImages() {
  console.log('🧪 开始测试...')
  
  try {
    // 测试云函数是否部署成功
    console.log('📤 步骤1: 测试云函数调用...')
    
    const res = await wx.cloud.callFunction({
      name: 'updateProductImages',
      data: {
        productId: 'a0bcc5a169088ffe00d7b6202972c32a',
        sampleImages: [
          'cloud://test1.jpg',
          'cloud://test2.jpg'
        ],
        introImage: 'cloud://test-intro.jpg'
      }
    })
    
    console.log('📦 云函数返回结果:', res)
    
    if (res.result && res.result.success) {
      console.log('✅ 成功！更新了', res.result.data.updated, '条记录')
      console.log('🎉 数据库权限配置正确！')
      console.log('👉 请刷新云数据库页面，查看字段是否出现')
    } else {
      console.error('❌ 失败！', res.result)
      console.log('👉 请检查数据库权限设置')
    }
    
  } catch (err) {
    console.error('❌ 错误:', err)
    
    if (err.errCode === -501000) {
      console.log('⚠️ 云函数未部署！')
      console.log('👉 请右键点击 cloudfunctions/updateProductImages，选择"上传并部署"')
    } else {
      console.log('👉 可能是数据库权限问题，请检查 products 集合的权限')
    }
  }
}

// 运行测试
testUpdateProductImages()

