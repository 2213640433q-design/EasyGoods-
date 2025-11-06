# 底部导航栏图标说明

## 📋 文件清单

本目录存放底部导航栏的所有图标（5个导航项，发布按钮使用特殊样式）。

### 必需文件
- `home.png` - 首页图标（未选中）
- `home_active.png` - 首页图标（选中）
- `nearby.png` - 附近图标（未选中）
- `nearby_active.png` - 附近图标（选中）
- `message.png` - 消息图标（未选中）
- `message_active.png` - 消息图标（选中）
- `profile.png` - 我的图标（未选中）
- `profile_active.png` - 我的图标（选中）

### 特殊说明
**发布按钮**不使用图片图标，而是使用CSS绘制的圆形按钮 + iOS风格白色加号。

## 🎨 设计规范

### 尺寸要求
- **图标尺寸**：24x24px
- **文件格式**：PNG
- **背景**：透明
- **分辨率**：@2x（实际48x48px，在小程序中按24x24px显示）

### 颜色规范
- **未选中状态**：`#8E8E93` (中灰色)
- **选中状态**：`#4A6FA5` (主题蓝色)
- **发布按钮背景**：`#4A6FA5` (圆形背景)
- **发布按钮图标**：`#FFFFFF` (白色加号)

### 风格要求
- 线条风格：简洁、统一
- 线条粗细：1.5-2px
- 图标留白：保持4px内边距
- 整体风格：扁平化、现代化

## 💡 使用方式

### WXML引用
```xml
<!-- 普通导航项 -->
<image 
  class="nav-icon-img" 
  src="/static/tabbar/{{item.icon}}.png" 
  mode="aspectFit"
/>

<!-- 发布按钮（特殊样式） -->
<view class="nav-publish-btn">
  <view class="nav-plus-icon">
    <view class="line horizontal"></view>
    <view class="line vertical"></view>
  </view>
</view>
```

### JS数据配置
```javascript
data: {
  tabbarIcons: {
    home: '/static/tabbar/home',
    nearby: '/static/tabbar/nearby',
    message: '/static/tabbar/message',
    profile: '/static/tabbar/profile'
  }
}
```

## 🔄 图标替换流程

1. **准备新图标**
   - 按照设计规范制作图标
   - 导出@2x尺寸PNG（48x48px）
   - 确保背景透明

2. **命名规范**
   - 未选中：`{name}.png`
   - 选中：`{name}_active.png`
   - 例如：`home.png` / `home_active.png`

3. **替换文件**
   - 直接替换对应目录下的文件
   - 保持文件名不变
   - 无需修改代码

4. **预览效果**
   - 重新编译小程序
   - 检查选中/未选中状态
   - 确认尺寸和颜色正确

## 📊 当前状态

### 已实现
- ✅ home.png / home_active.png
- ✅ nearby.png / nearby_active.png
- ✅ message.png / message_active.png
- ✅ profile.png / profile_active.png
- ✅ 发布按钮（CSS绘制）

### 图标来源
- 用户提供的设计稿图标
- 如使用占位图，建议替换为正式设计稿

## 🎯 优化建议

### 性能优化
- 使用PNG格式（小程序兼容性好）
- 保持文件大小 < 10KB
- 考虑使用雪碧图（5个导航项合并为1张图）

### 体验优化
- 确保点击区域足够大（44x44px）
- 选中/未选中状态对比明显
- 图标语义清晰，易于识别

## ⚠️ 注意事项

1. **文件命名**：必须使用下划线分隔，不能使用中划线（如 `home_active.png` ✅，`home-active.png` ❌）
2. **透明背景**：确保PNG背景透明，避免白色背景
3. **颜色一致**：所有图标颜色需与设计规范一致
4. **尺寸统一**：所有图标尺寸必须一致（24x24px）
5. **版本控制**：替换图标前备份原文件

## 🔗 相关文件

- 首页导航栏：`pages/index/index.wxml` (line 150-171)
- 消息页导航栏：`pages/message/message.wxml` (line 30-51)
- 个人中心导航栏：`pages/profile/index.wxml` (line 60-81)
- 导航栏样式：各页面对应的 `.wxss` 文件

---

**维护者**：Zhuanz  
**最后更新**：2025-10-29  
**版本**：v2.0.0
