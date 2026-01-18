// test-coze-endpoints.js
// 测试不同的 Coze API 端点

const https = require('https')

const COZE_CONFIG = {
  apiKey: 'pat_LeJdSKbpb6yiu8qLKykEth6j3pQfAtSY8oKJy0cCMlSlQ8xQn3Y4151gFIqCX7PK',
  botId: '7571393353158819867'
}

const TEST_MESSAGE = '你们在英国还有其他门店吗？'

// 不同的 API 端点配置
const API_ENDPOINTS = [
  {
    name: 'V2 Chat API（当前使用）',
    url: 'https://api.coze.cn/open_api/v2/chat',
    buildRequest: (conversationId) => ({
      conversation_id: conversationId,
      bot_id: COZE_CONFIG.botId,
      user: 'test_user',
      query: TEST_MESSAGE,
      stream: false,
      auto_save_history: true,
      with_knowledge: true
    })
  },
  {
    name: 'V3 Chat API（新版本）',
    url: 'https://api.coze.cn/v3/chat',
    buildRequest: (conversationId) => ({
      bot_id: COZE_CONFIG.botId,
      user_id: 'test_user',
      additional_messages: [{
        role: 'user',
        content: TEST_MESSAGE,
        content_type: 'text'
      }],
      auto_save_history: true,
      custom_variables: {
        with_knowledge: 'true'
      }
    })
  },
  {
    name: 'V1 Conversation API（旧版本）',
    url: 'https://api.coze.cn/v1/conversation/message/create',
    buildRequest: (conversationId) => ({
      conversation_id: conversationId,
      bot_id: COZE_CONFIG.botId,
      user_id: 'test_user',
      query: TEST_MESSAGE,
      stream: false
    })
  }
]

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const conversationId = `test_${Date.now()}`
    const requestBody = endpoint.buildRequest(conversationId)
    const postData = JSON.stringify(requestBody)

    const url = new URL(endpoint.url)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📡 测试端点: ${endpoint.name}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🔗 URL: ${endpoint.url}`)
    console.log('\n📦 请求体:')
    console.log(JSON.stringify(requestBody, null, 2))
    console.log('\n⏳ 发送请求...')

    const startTime = Date.now()

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        const duration = Date.now() - startTime
        
        try {
          const response = JSON.parse(data)
          
          console.log(`\n✅ 响应成功（${duration}ms）`)
          console.log('\n📊 响应摘要:')
          console.log(`  状态码: ${response.code}`)
          console.log(`  消息: ${response.msg || response.message || 'N/A'}`)
          
          if (response.code === 0) {
            // 成功
            const answerMsg = response.messages?.find(m => m.type === 'answer')
            if (answerMsg) {
              console.log('\n💬 AI 回复:')
              console.log(`  "${answerMsg.content.substring(0, 100)}${answerMsg.content.length > 100 ? '...' : ''}"`)
              
              // 判断是否使用了知识库
              const usedKnowledge = !answerMsg.content.includes('不太清楚') && 
                                   !answerMsg.content.includes('暂时无法提供')
              
              console.log(`\n  📚 是否使用知识库: ${usedKnowledge ? '✅ 是' : '❌ 否（回答"不知道"）'}`)
            }
          } else {
            // 失败
            console.log('\n❌ 请求失败')
            console.log(`  错误: ${response.msg || JSON.stringify(response)}`)
          }
          
          resolve({ endpoint: endpoint.name, success: response.code === 0, response, duration })
          
        } catch (error) {
          console.error('\n❌ 解析失败:', error.message)
          console.log('原始响应:', data.substring(0, 200))
          reject({ endpoint: endpoint.name, error: error.message })
        }
      })
    })

    req.on('error', (error) => {
      console.error(`\n❌ 网络错误: ${error.message}`)
      reject({ endpoint: endpoint.name, error: error.message })
    })

    req.write(postData)
    req.end()
  })
}

// 执行所有端点测试
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║          Coze API 端点对比测试工具                      ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log(`\n🎯 测试问题: "${TEST_MESSAGE}"`)
  console.log(`🤖 Bot ID: ${COZE_CONFIG.botId}`)
  console.log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`)
  
  const results = []
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const result = await testEndpoint(endpoint)
      results.push(result)
    } catch (error) {
      results.push(error)
    }
    
    // 间隔
    console.log('\n⏸️  等待 2 秒...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 总结
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                      测试总结                            ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ ${result.endpoint}`)
      console.log(`   响应时间: ${result.duration}ms`)
    } else {
      console.log(`❌ ${result.endpoint}`)
      console.log(`   错误: ${result.error || '请求失败'}`)
    }
  })
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

runAllTests().catch(console.error)

