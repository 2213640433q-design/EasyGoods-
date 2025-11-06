// 云函数：获取商品列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { 
    mainCategory,      // 主分类：全部/娱乐/摄影/户外/其他
    subCategory,       // 子分类：麻将/德州扑克/CCD等
    page = 1,          // 页码，默认第1页
    pageSize = 20,     // 每页数量，默认20条
    keyword = '',      // 搜索关键词
    sortBy = 'createdAt',  // 排序字段：createdAt/price/rentedCount
    sortOrder = 'desc' // 排序方式：desc/asc
  } = event

  try {
    // 构建查询条件
    const query = db.collection('products')
    let condition = { status: 'valid' }  // 只查询有效商品

    // 主分类筛选
    if (mainCategory && mainCategory !== '全部' && mainCategory !== '') {
      condition.mainCategory = mainCategory
    }

    // 子分类筛选
    if (subCategory && subCategory !== '全部' && subCategory !== '') {
      condition.subCategory = subCategory
    }

    // 关键词搜索（支持商品名称模糊搜索）
    if (keyword && keyword.trim() !== '') {
      condition.name = db.RegExp({
        regexp: keyword,
        options: 'i'  // 不区分大小写
      })
    }

    // 计算总数
    const countResult = await query.where(condition).count()
    const total = countResult.total

    // 查询数据
    const dataResult = await query
      .where(condition)
      .orderBy(sortBy, sortOrder)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 🔧 处理 CSV 导入的数据格式
    const processedData = dataResult.data.map(product => {
      // 处理 images 字段
      let images = []
      if (typeof product.images === 'string') {
        // 如果字符串长度小于10，说明数据损坏，使用占位图
        if (product.images.length < 10) {
          images = ['/static/placeholder/p1.png']  // 使用占位图
        } else {
          images = product.images.includes(';') 
            ? product.images.split(';').filter(img => img.trim())
            : [product.images]
        }
      } else if (Array.isArray(product.images)) {
        images = product.images
      } else {
        // 如果 images 字段不存在，使用占位图
        images = ['/static/placeholder/p1.png']
      }
      
      // 确保至少有一张图片
      if (images.length === 0) {
        images = ['/static/placeholder/p1.png']
      }
      
      // 处理 stores 字段
      let stores = []
      if (typeof product.stores === 'string') {
        stores = product.stores.split(';').map(s => s.trim()).filter(s => s)
      } else if (Array.isArray(product.stores)) {
        stores = product.stores
      }
      
      // 处理 specs 字段
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
      
      return {
        ...product,
        images: images,
        stores: stores,
        specs: specs
      }
    })

    return {
      success: true,
      message: '获取商品列表成功',
      data: processedData,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: Math.ceil(total / pageSize)
      },
      openid: wxContext.OPENID
    }
  } catch (err) {
    console.error('获取商品列表失败:', err)
    return {
      success: false,
      message: '获取商品列表失败',
      error: err.message,
      openid: wxContext.OPENID
    }
  }
}

