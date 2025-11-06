# 静态资源目录说明

本目录存放EasyGoods小程序的所有静态资源文件。

## 📂 目录结构

```
static/
├── tabbar/           # 底部导航栏图标
│   ├── home.png      # 首页图标（选中/未选中）
│   ├── home_active.png
│   ├── nearby.png    # 附近图标
│   ├── nearby_active.png
│   ├── message.png   # 消息图标
│   ├── message_active.png
│   ├── profile.png   # 我的图标
│   ├── profile_active.png
│   └── README.md     # 导航图标说明
├── icons/            # 功能图标
│   ├── search.svg    # 搜索图标
│   └── trade/        # 交易相关图标
│       ├── rent.png      # 我的租赁
│       ├── publish.png   # 我发布的
│       ├── sold.png      # 我卖出的
│       ├── bought.png    # 我买到的
│       └── README.md     # 交易图标说明
└── images/           # 其他图片资源（预留）
    └── placeholder/  # 占位图（如有需要）
```

## 📋 资源规范

### 图标规范

#### 底部导航图标 (tabbar/)
- **尺寸**：24x24px
- **格式**：PNG
- **背景**：透明
- **状态**：选中/未选中两种状态
- **命名**：`{name}.png` / `{name}_active.png`
- **颜色**：
  - 未选中：`#8E8E93` (中灰)
  - 选中：`#4A6FA5` (主题蓝)

#### 功能图标 (icons/)
- **尺寸**：24x24px（标准）、18x18px（小尺寸）
- **格式**：PNG / SVG
- **背景**：透明
- **颜色**：根据使用场景调整

#### 交易图标 (icons/trade/)
- **尺寸**：24x24px
- **格式**：PNG
- **背景**：透明
- **颜色**：`#4A6FA5` 或主题色
- **用途**：个人中心"我的交易"区域

### 图片规范

#### 商品图片
- **推荐尺寸**：400x400px（正方形）
- **格式**：JPG / PNG / WebP
- **质量**：75-85（平衡质量与体积）
- **来源**：
  - 开发阶段：Unsplash外链
  - 生产环境：建议使用CDN

#### 用户头像
- **尺寸**：150x150px
- **格式**：JPG / PNG
- **形状**：圆形
- **来源**：
  - 开发阶段：Pravatar占位服务
  - 生产环境：微信头像API或用户上传

## 🎨 设计资源

### Figma设计稿
- [EasyGoods设计稿](https://www.figma.com/design/Ys2JX47684PTKkV0QjrLqI/EasyGoods-1028?node-id=1002-634)

### 颜色参考
- **主色调**：`#4A6FA5` (蓝色)
- **辅助色**：
  - 文字主色：`#1D1D1F` (深灰)
  - 文字辅助色：`#8E8E93` (中灰)
  - 背景色：`#F8F9FA` (浅灰)
  - 价格色：`#FF6B6B` (红色)

## 📦 资源优化建议

### 开发阶段
- ✅ 使用外链服务（Unsplash、Pravatar）
- ✅ 使用SVG格式（图标）
- ✅ 保持文件尺寸小于100KB

### 生产环境优化
- 🔲 图片压缩（TinyPNG、ImageOptim）
- 🔲 使用CDN加速（腾讯云COS、阿里云OSS）
- 🔲 图片懒加载
- 🔲 WebP格式（支持降级）
- 🔲 雪碧图（小图标合并）

## 🔄 更新记录

### 2025-10-29
- ✅ 创建static目录结构
- ✅ 添加底部导航图标（PNG格式）
- ✅ 添加搜索图标（SVG格式）
- ✅ 添加交易功能图标（4个PNG）
- ✅ 统一图标规范文档

### 2025-10-28
- ✅ 初始化静态资源目录

## 📝 使用说明

### 引用方式

#### WXML中引用
```xml
<!-- 图片 -->
<image src="/static/tabbar/home.png" mode="aspectFit" />

<!-- SVG图标 -->
<image src="/static/icons/search.svg" mode="aspectFit" />
```

#### WXSS中引用
```css
.icon {
  background-image: url('/static/icons/search.svg');
}
```

#### JS中引用
```javascript
data: {
  iconPath: '/static/tabbar/home.png'
}
```

### 替换资源
1. 准备符合规范的新资源文件
2. 保持文件名不变（或同步修改代码中的引用）
3. 直接替换对应目录下的文件
4. 重新编译小程序

## ⚠️ 注意事项

1. **文件大小**：单个文件不超过2MB（小程序限制）
2. **总包大小**：整个小程序不超过2MB，分包不超过20MB
3. **命名规范**：使用小写字母、数字、下划线，避免特殊字符
4. **版权问题**：确保所有资源有合法使用权
5. **CDN加速**：生产环境建议将大文件放到CDN

## 🔗 相关链接

- [微信小程序图片规范](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/image.html)
- [小程序性能优化](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/)
- [腾讯云COS](https://cloud.tencent.com/product/cos)

---

**维护者**：Zhuanz  
**最后更新**：2025-10-29

