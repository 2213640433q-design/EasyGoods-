// test-coze-agent.js
// Coze AI 云函数测试脚本

const cloud = require('wx-server-sdk')

// ========== 配置区域 ==========
// 请在微信开发者工具的「云开发控制台」查看环境 ID
const ENV_ID = 'cloud1-0gdlqkxu25dc8c64'  // 替换为你的云开发环境 ID

// 测试用例
const TEST_CASES = [
  {
    name: '基础问候',
    data: {
      message: '你好'
    }
  },
  {
    name: '商品价格咨询',
    data: {
      message: '你好，我想了解相机租赁的价格'
    }
  },
  {
    name: '租期咨询',
    data: {
      message: '租期有什么要求吗？'
    }
  },
  {
    name: '带商品上下文的咨询',
    data: {
      message: '这个商品可以租多久？',
      productContext: {
        name: 'Sony A7III 相机',
        price: 5,
        category: '相机'
      }
    }
  }
]
// ==============================

// 初始化云开发
cloud.init({
  env: ENV_ID
})

// 测试单个用例
async function testCase(testCase) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📝 测试用例: ${testCase.name}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📤 发送数据:`)
  console.log(JSON.stringify(testCase.data, null, 2))
  console.log(`⏳ 调用云函数中...`)
  
  const startTime = Date.now()
  
  try {
    const result = await cloud.callFunction({
      name: 'callCozeAgent',
      data: testCase.data
    })
    
    const duration = Date.now() - startTime
    
    console.log(`\n✅ 调用成功！（耗时: ${duration}ms）`)
    console.log(`📊 返回结果:`)
    console.log(JSON.stringify(result.result, null, 2))
    
    if (result.result.success) {
      console.log(`\n💬 AI 回复:`)
      console.log(`"${result.result.reply}"`)
      return { success: true, duration, case: testCase.name }
    } else {
      console.log(`\n⚠️ AI 调用失败，使用兜底回复:`)
      console.log(`"${result.result.fallbackReply || result.result.error}"`)
      return { success: false, duration, case: testCase.name, error: result.result.error }
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`\n❌ 云函数调用失败！（耗时: ${duration}ms）`)
    console.error(`错误信息:`, error.message)
    console.error(`错误详情:`, error)
    return { success: false, duration, case: testCase.name, error: error.message }
  }
}

// 执行所有测试
async function runAllTests() {
  console.log(`\n╔════════════════════════════════════════╗`)
  console.log(`║     Coze AI 云函数测试工具           ║`)
  console.log(`╚════════════════════════════════════════╝`)
  console.log(`\n🔧 环境 ID: ${ENV_ID}`)
  console.log(`📦 云函数: callCozeAgent`)
  console.log(`🧪 测试用例数量: ${TEST_CASES.length}`)
  
  const results = []
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i]
    const result = await testCase(testCase)
    results.push(result)
    
    // 每个测试之间暂停一下，避免请求过快
    if (i < TEST_CASES.length - 1) {
      console.log(`\n⏸️  等待 2 秒后继续下一个测试...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // 输出测试总结
  console.log(`\n\n╔════════════════════════════════════════╗`)
  console.log(`║           测试总结                    ║`)
  console.log(`╚════════════════════════════════════════╝`)
  
  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  
  console.log(`\n📊 测试统计:`)
  console.log(`   总数: ${results.length}`)
  console.log(`   成功: ${successCount} ✅`)
  console.log(`   失败: ${failCount} ${failCount > 0 ? '❌' : ''}`)
  console.log(`   平均响应时间: ${avgDuration.toFixed(0)}ms`)
  
  console.log(`\n📋 详细结果:`)
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${status} ${result.case} (${result.duration}ms)`)
    if (!result.success && result.error) {
      console.log(`      错误: ${result.error}`)
    }
  })
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  if (successCount === results.length) {
    console.log(`🎉 所有测试通过！`)
  } else if (successCount > 0) {
    console.log(`⚠️  部分测试通过，建议检查失败的用例`)
  } else {
    console.log(`❌ 所有测试失败，请检查配置和云函数`)
  }
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// 执行测试
runAllTests().catch(error => {
  console.error('\n❌ 测试脚本执行失败:', error)
  process.exit(1)
})

