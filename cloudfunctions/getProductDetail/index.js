// 云函数：获取商品详情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { productId } = event
  
  // 参数验证
  if (!productId) {
    return {
      success: false,
      message: '缺少商品ID参数',
      openid: wxContext.OPENID
    }
  }

  try {
    // 方式1：如果 productId 是数据库 _id
    let product = null
    
    try {
      const result = await db.collection('products')
        .doc(productId)
        .get()
      
      product = result.data
    } catch (err) {
      // 如果通过 _id 查询失败，尝试通过自定义 id 字段查询
      console.log('尝试通过 id 字段查询...')
      
      const queryResult = await db.collection('products')
        .where({
          id: productId
        })
        .limit(1)
        .get()
      
      if (queryResult.data && queryResult.data.length > 0) {
        product = queryResult.data[0]
      }
    }
    
    // 如果找不到商品
    if (!product) {
      return {
        success: false,
        message: '商品不存在',
        openid: wxContext.OPENID
      }
    }
    
    // 检查商品状态
    if (product.status !== 'valid') {
      return {
        success: false,
        message: '商品已下架或不可用',
        data: product,
        openid: wxContext.OPENID
      }
    }
    
    // 🔧 数据格式转换（处理 CSV 导入的数据）
    
    // 处理 images 字段（可能是字符串或数组）
    let images = []
    if (typeof product.images === 'string') {
      // 如果字符串长度小于10，说明数据损坏，使用占位图
      if (product.images.length < 10) {
        images = ['/static/placeholder/p1.png', '/static/placeholder/p2.png', '/static/placeholder/p3.png']
      } else {
        // 如果是字符串，可能是单个URL或分号分隔的URL
        images = product.images.includes(';') 
          ? product.images.split(';').filter(img => img.trim())
          : [product.images]
      }
    } else if (Array.isArray(product.images)) {
      images = product.images
    } else {
      // 如果 images 字段不存在，使用占位图
      images = ['/static/placeholder/p1.png', '/static/placeholder/p2.png', '/static/placeholder/p3.png']
    }
    
    // 确保至少有一张图片
    if (images.length === 0) {
      images = ['/static/placeholder/p1.png', '/static/placeholder/p2.png', '/static/placeholder/p3.png']
    }
    
    // 处理 stores 字段（可能是字符串或数组）
    let stores = []
    if (typeof product.stores === 'string') {
      // CSV 导入时是分号分隔的字符串
      stores = product.stores.split(';').map(s => s.trim()).filter(s => s)
    } else if (Array.isArray(product.stores)) {
      stores = product.stores
    }
    
    // 处理 specs 字段（可能是 JSON 字符串或数组）
    let specs = []
    if (typeof product.specs === 'string') {
      try {
        specs = JSON.parse(product.specs)
      } catch (e) {
        specs = []
      }
    } else if (Array.isArray(product.specs)) {
      specs = product.specs
    }
    
    // 返回完整的商品信息
    return {
      success: true,
      message: '获取商品详情成功',
      data: {
        // 基本信息
        _id: product._id,
        id: product.id || product._id,
        name: product.name,
        subtitle: product.subtitle || '',
        
        // 分类信息
        mainCategory: product.mainCategory,
        subCategory: product.subCategory,
        
        // 价格信息
        price: product.price,
        deposit: product.deposit,
        
        // 图片信息（已处理）
        images: images,
        
        // 详细信息
        description: product.description || '',
        accessories: product.accessories || '',
        freeAccessories: product.freeAccessories || '',  /* ✅ 附赠配件 */
        
        // 规格参数（已处理）
        specs: specs,
        
        // 库存信息
        stock: product.stock || 0,
        rentedCount: product.rentedCount || 0,
        
        // 门店信息（已处理）
        stores: stores,
        
        // 状态
        status: product.status,
        
        // 时间信息
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        
        // 其他信息
        comparisonImages: product.comparisonImages || [],
        sampleImages: product.sampleImages || [],
        introImage: product.introImage || '',  /* ✅ 产品介绍长图 */
        startRent: product.startRent || '自取0天起租'
      },
      openid: wxContext.OPENID
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    return {
      success: false,
      message: '获取商品详情失败',
      error: err.message,
      openid: wxContext.OPENID
    }
  }
}

