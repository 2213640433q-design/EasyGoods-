// debug-coze-api.js
// Coze API 详细调试脚本 - 显示完整请求和响应

const https = require('https')

// ========== 配置区域 ==========
const COZE_CONFIG = {
  apiKey: 'pat_LeJdSKbpb6yiu8qLKykEth6j3pQfAtSY8oKJy0cCMlSlQ8xQn3Y4151gFIqCX7PK',
  botId: '7571393353158819867',
  apiUrl: 'https://api.coze.cn/open_api/v2/chat'
}

// 测试消息
const TEST_MESSAGE = '你们在英国还有其他门店吗？'
// ==============================

function debugCozeAPI(message, testCase = {}) {
  return new Promise((resolve, reject) => {
    const conversationId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 构建请求数据 - 可以测试不同的参数组合
    const requestBody = {
      conversation_id: conversationId,
      bot_id: COZE_CONFIG.botId,
      user: 'test_user',
      query: message,
      stream: false,
      auto_save_history: true,
      with_knowledge: true,  // 启用知识库
      ...testCase.extraParams  // 额外参数
    }
    
    const postData = JSON.stringify(requestBody)

    const url = new URL(COZE_CONFIG.apiUrl)
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

    console.log('\n')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('                    🔍 COZE API 详细调试                       ')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`\n📝 测试用例: ${testCase.name || '默认测试'}`)
    console.log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('\n───────────────────────────────────────────────────────────────')
    console.log('📤 请求信息')
    console.log('───────────────────────────────────────────────────────────────')
    console.log(`🔗 API 端点: ${COZE_CONFIG.apiUrl}`)
    console.log(`🤖 Bot ID: ${COZE_CONFIG.botId}`)
    console.log(`🔑 API Key: ${COZE_CONFIG.apiKey.substring(0, 10)}...${COZE_CONFIG.apiKey.substring(COZE_CONFIG.apiKey.length - 5)}`)
    
    console.log('\n📋 请求头 (Headers):')
    console.log(JSON.stringify(options.headers, null, 2))
    
    console.log('\n📦 请求体 (Request Body):')
    console.log(JSON.stringify(requestBody, null, 2))
    
    console.log('\n⏳ 发送请求中...\n')

    const startTime = Date.now()

    const req = https.request(options, (res) => {
      let data = ''

      console.log(`📊 响应状态码: ${res.statusCode}`)
      console.log(`📋 响应头:`)
      console.log(JSON.stringify(res.headers, null, 2))
      console.log('\n⏳ 接收响应数据中...\n')

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        const duration = Date.now() - startTime
        
        console.log('───────────────────────────────────────────────────────────────')
        console.log('📥 响应信息')
        console.log('───────────────────────────────────────────────────────────────')
        console.log(`⏱️  响应时间: ${duration}ms`)
        console.log(`📦 响应体大小: ${data.length} bytes`)
        
        try {
          const response = JSON.parse(data)
          
          console.log('\n📊 完整响应 JSON:')
          console.log(JSON.stringify(response, null, 2))
          
          console.log('\n───────────────────────────────────────────────────────────────')
          console.log('🔍 详细分析')
          console.log('───────────────────────────────────────────────────────────────')
          
          // 分析响应代码
          console.log(`\n✓ 响应代码: ${response.code}`)
          if (response.code === 0) {
            console.log('  状态: ✅ 成功')
          } else {
            console.log(`  状态: ❌ 失败`)
            console.log(`  错误信息: ${response.msg}`)
          }
          
          // 分析会话 ID
          console.log(`\n✓ 会话 ID: ${response.conversation_id}`)
          console.log(`  发送的: ${conversationId}`)
          console.log(`  匹配: ${response.conversation_id === conversationId ? '✅' : '❌'}`)
          
          // 分析消息
          if (response.messages && response.messages.length > 0) {
            console.log(`\n✓ 消息数量: ${response.messages.length}`)
            console.log('\n  消息列表:')
            
            response.messages.forEach((msg, index) => {
              console.log(`\n  [消息 ${index + 1}]`)
              console.log(`    角色 (role): ${msg.role}`)
              console.log(`    类型 (type): ${msg.type}`)
              console.log(`    内容类型: ${msg.content_type}`)
              
              if (msg.type === 'answer') {
                console.log(`    📝 AI 回复:`)
                console.log(`    "${msg.content}"`)
              } else if (msg.type === 'follow_up') {
                console.log(`    💡 推荐问题: "${msg.content}"`)
              } else if (msg.type === 'verbose') {
                console.log(`    🔧 调试信息: ${msg.content.substring(0, 100)}...`)
              } else {
                console.log(`    内容: ${msg.content.substring(0, 100)}...`)
              }
              
              // 检查是否有 reasoning_content（可能包含知识库检索信息）
              if (msg.reasoning_content) {
                console.log(`    🧠 推理内容: ${msg.reasoning_content}`)
              }
            })
          }
          
          // 提取答案
          const answerMessage = response.messages?.find(msg => msg.type === 'answer')
          if (answerMessage) {
            console.log('\n───────────────────────────────────────────────────────────────')
            console.log('💬 最终 AI 回复')
            console.log('───────────────────────────────────────────────────────────────')
            console.log(answerMessage.content)
            
            // 分析回复内容
            console.log('\n📊 回复内容分析:')
            console.log(`  长度: ${answerMessage.content.length} 字符`)
            
            // 检查是否是"不知道"类的回复
            const unknownKeywords = ['不太清楚', '不知道', '无法提供', '暂时无法']
            const isUnknownReply = unknownKeywords.some(kw => answerMessage.content.includes(kw))
            
            if (isUnknownReply) {
              console.log('  类型: ⚠️  未找到答案型回复')
              console.log('\n  🔍 可能的原因:')
              console.log('     1. 知识库未创建或未关联到 Bot')
              console.log('     2. 知识库索引未完成')
              console.log('     3. 知识库中没有相关内容')
              console.log('     4. Bot 的系统提示词限制了知识库使用')
              console.log('\n  💡 建议操作:')
              console.log('     → 在 Coze 平台网页端测试相同问题')
              console.log('     → 确认知识库状态为"已启用"')
              console.log('     → 检查知识库内容是否包含答案')
            } else {
              console.log('  类型: ✅ 正常回复（可能来自知识库）')
            }
          }
          
          // 检查是否有额外的调试信息
          if (response.debug_info || response.usage) {
            console.log('\n📊 额外信息:')
            if (response.debug_info) {
              console.log('  调试信息:', response.debug_info)
            }
            if (response.usage) {
              console.log('  Token 使用:', response.usage)
            }
          }
          
          console.log('\n═══════════════════════════════════════════════════════════════')
          console.log('                         测试完成                               ')
          console.log('═══════════════════════════════════════════════════════════════\n')
          
          resolve(response)
          
        } catch (error) {
          console.error('\n❌ 解析响应失败:', error.message)
          console.log('\n原始响应数据:')
          console.log(data)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      const duration = Date.now() - startTime
      console.error(`\n❌ 请求失败！（耗时: ${duration}ms）`)
      console.error('错误类型:', error.code)
      console.error('错误信息:', error.message)
      console.error('\n完整错误:')
      console.error(error)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

// 多个测试场景
const TEST_CASES = [
  {
    name: '测试1: 基础问题（有知识库）',
    message: '你们在英国还有其他门店吗？',
    extraParams: {}
  },
  {
    name: '测试2: 价格咨询',
    message: '相机租金多少？',
    extraParams: {}
  },
  {
    name: '测试3: 对比不启用知识库',
    message: '你们在英国还有其他门店吗？',
    extraParams: {
      with_knowledge: false  // 故意不启用知识库做对比
    }
  }
]

// 执行测试
async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║              COZE API 调试测试工具 v2.0                     ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\n🎯 将执行 ${TEST_CASES.length} 个测试用例`)
  console.log(`📅 开始时间: ${new Date().toLocaleString('zh-CN')}`)
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i]
    
    console.log(`\n\n`)
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓')
    console.log(`┃  测试用例 ${i + 1}/${TEST_CASES.length}`)
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')
    
    try {
      await debugCozeAPI(testCase.message, testCase)
      
      // 测试间隔
      if (i < TEST_CASES.length - 1) {
        console.log('\n⏸️  等待 3 秒后继续下一个测试...\n')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`❌ 测试 ${i + 1} 执行失败`)
    }
  }
  
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                     所有测试完成                            ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`📅 结束时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log('\n💡 对比建议:')
  console.log('   1. 查看测试1和测试3的回复差异（启用/不启用知识库）')
  console.log('   2. 如果测试1仍回答"不知道"，说明知识库未生效')
  console.log('   3. 在 Coze 平台网页端测试相同问题，对比回复内容')
  console.log('   4. 检查 Coze 平台的知识库是否正确配置\n')
}

// 执行测试
runTests().catch(error => {
  console.error('\n❌ 测试脚本执行失败:', error)
  process.exit(1)
})

