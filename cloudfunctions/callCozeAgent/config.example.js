/**
 * Coze AI 配置示例
 * 
 * 使用说明：
 * 1. 复制 index.js 中的 COZE_CONFIG 部分
 * 2. 替换为你的实际配置
 * 3. 不要将包含真实 API Key 的文件提交到 Git
 */

const COZE_CONFIG = {
  // ========== 必填配置 ==========
  
  // API Key（访问令牌）
  // 在 Coze 平台「设置」→「开发者选项」中获取
  apiKey: 'coze_xxxxxxxxxxxxxxxxxxxxxx',
  
  // Bot ID
  // 在 Bot 详情页面或 URL 中查看
  botId: 'bot_xxxxxxxxxxxxxxxxx',
  
  // API 地址
  // 国内版：https://api.coze.cn/v1/conversation/message/create
  // 国际版：https://api.coze.com/v1/conversation/message/create
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  
  
  // ========== 可选配置 ==========
  
  // AI 模型
  // 可选值：'gpt-4', 'gpt-3.5-turbo' 等
  model: 'gpt-4',
  
  // 温度参数（0-1）
  // 0.3-0.5: 更准确、一致、保守
  // 0.7-0.9: 更有创意、多样、随机
  temperature: 0.7,
  
  // 最大返回 Token 数
  // 建议范围：500-2000
  // 数值越大，回复可能越长，但费用也越高
  maxTokens: 2000
}

// 示例1: 保守准确型配置（适合客服咨询）
const CONSERVATIVE_CONFIG = {
  apiKey: 'your_api_key',
  botId: 'your_bot_id',
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  model: 'gpt-4',
  temperature: 0.3,    // 更准确
  maxTokens: 1000      // 中等长度
}

// 示例2: 创意活泼型配置（适合营销推广）
const CREATIVE_CONFIG = {
  apiKey: 'your_api_key',
  botId: 'your_bot_id',
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  model: 'gpt-4',
  temperature: 0.8,    // 更有创意
  maxTokens: 2000      // 较长回复
}

// 示例3: 经济快速型配置（节省成本）
const ECONOMIC_CONFIG = {
  apiKey: 'your_api_key',
  botId: 'your_bot_id',
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  model: 'gpt-3.5-turbo',  // 更便宜的模型
  temperature: 0.7,
  maxTokens: 500           // 更短的回复
}

module.exports = {
  COZE_CONFIG,
  CONSERVATIVE_CONFIG,
  CREATIVE_CONFIG,
  ECONOMIC_CONFIG
}

