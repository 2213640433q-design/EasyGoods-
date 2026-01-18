#!/bin/bash

# ============================================
# 微信小程序推送到GitHub脚本
# 项目：EasyGoods-租赁
# GitHub: https://github.com/2213640433q-design/EasyGoods-.git
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  微信小程序推送到GitHub脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 进入项目目录
PROJECT_DIR="/Users/Zhuanz/WeChatProjects/EasyGoods-租赁"
cd "$PROJECT_DIR"
echo -e "${GREEN}✓${NC} 已进入项目目录: $PROJECT_DIR"
echo ""

# 步骤1：检查Git配置
echo -e "${YELLOW}[步骤1] 检查Git配置...${NC}"
GIT_USER_NAME=$(git config --global user.name || echo "")
GIT_USER_EMAIL=$(git config --global user.email || echo "")

if [ -z "$GIT_USER_NAME" ] || [ -z "$GIT_USER_EMAIL" ]; then
    echo -e "${RED}⚠️  警告：Git用户信息未配置${NC}"
    echo "请先执行以下命令配置Git用户信息："
    echo "  git config --global user.name \"你的GitHub用户名\""
    echo "  git config --global user.email \"你的GitHub邮箱\""
    read -p "是否现在配置？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入GitHub用户名: " GIT_NAME
        read -p "请输入GitHub邮箱: " GIT_EMAIL
        git config --global user.name "$GIT_NAME"
        git config --global user.email "$GIT_EMAIL"
        echo -e "${GREEN}✓${NC} Git用户信息已配置"
    else
        echo -e "${RED}✗${NC} 请先配置Git用户信息后再运行此脚本"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Git用户信息已配置: $GIT_USER_NAME <$GIT_USER_EMAIL>"
fi
echo ""

# 步骤2：检查敏感信息
echo -e "${YELLOW}[步骤2] 检查敏感信息...${NC}"
SENSITIVE_FILE="cloudfunctions/callCozeAgent/index.js"
if [ -f "$SENSITIVE_FILE" ]; then
    if grep -q "pat_" "$SENSITIVE_FILE" 2>/dev/null; then
        echo -e "${RED}⚠️  警告：发现可能的敏感信息（API Key）在 $SENSITIVE_FILE${NC}"
        echo "建议在推送前将真实API Key替换为占位符或环境变量"
        read -p "是否继续推送？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}已取消推送，请先处理敏感信息${NC}"
            exit 1
        fi
    fi
fi
echo -e "${GREEN}✓${NC} 敏感信息检查完成"
echo ""

# 步骤3：查看当前状态
echo -e "${YELLOW}[步骤3] 查看Git状态...${NC}"
git status
echo ""

# 步骤4：配置远程仓库
echo -e "${YELLOW}[步骤4] 配置远程仓库...${NC}"
REMOTE_URL="https://github.com/2213640433q-design/EasyGoods-.git"

# 检查是否已有远程仓库
if git remote | grep -q "^origin$"; then
    CURRENT_URL=$(git remote get-url origin)
    if [ "$CURRENT_URL" != "$REMOTE_URL" ]; then
        echo -e "${YELLOW}检测到不同的远程仓库地址，正在更新...${NC}"
        git remote set-url origin "$REMOTE_URL"
    fi
    echo -e "${GREEN}✓${NC} 远程仓库已配置: $REMOTE_URL"
else
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}✓${NC} 已添加远程仓库: $REMOTE_URL"
fi
echo ""

# 步骤5：添加所有文件
echo -e "${YELLOW}[步骤5] 添加文件到暂存区...${NC}"
git add .
echo -e "${GREEN}✓${NC} 文件已添加到暂存区"
echo ""

# 显示将要提交的文件
echo -e "${YELLOW}将要提交的文件：${NC}"
git status --short
echo ""

# 步骤6：提交更改
echo -e "${YELLOW}[步骤6] 提交更改...${NC}"
read -p "请输入提交信息（直接回车使用默认信息）: " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="feat: 初始化EasyGoods微信小程序项目

- 添加小程序核心功能
- 集成云函数
- 添加用户系统、订单系统、优惠券系统
- 集成Coze AI客服功能
- 添加闲置托管功能"
fi

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✓${NC} 更改已提交"
echo ""

# 步骤7：推送到GitHub
echo -e "${YELLOW}[步骤7] 推送到GitHub...${NC}"
echo -e "${YELLOW}注意：如果首次推送，可能需要输入GitHub用户名和Personal Access Token${NC}"
read -p "是否现在推送？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 尝试推送到master分支
    if git push -u origin master 2>&1; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ 推送成功！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo "访问以下URL查看你的代码："
        echo "https://github.com/2213640433q-design/EasyGoods-"
    else
        # 如果master失败，尝试推送到main分支
        echo -e "${YELLOW}尝试推送到main分支...${NC}"
        if git push -u origin master:main 2>&1; then
            echo ""
            echo -e "${GREEN}========================================${NC}"
            echo -e "${GREEN}  ✓ 推送成功（推送到main分支）！${NC}"
            echo -e "${GREEN}========================================${NC}"
        else
            echo -e "${RED}✗ 推送失败，请查看上方错误信息${NC}"
            echo ""
            echo "常见问题解决方案："
            echo "1. 认证失败：使用Personal Access Token而不是密码"
            echo "2. 分支不匹配：检查GitHub仓库的默认分支名称"
            echo "3. 查看详细错误信息并参考 Git推送指南.md"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}已取消推送${NC}"
    echo "你可以稍后手动执行: git push -u origin master"
fi

echo ""
echo -e "${GREEN}脚本执行完成！${NC}"

