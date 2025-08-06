#!/bin/bash

# 部署脚本
# 用法: ./scripts/deploy.sh [environment]
# 环境: development, staging, production

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必需工具
check_requirements() {
    log_info "检查部署环境要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $node_version -lt 18 ]; then
        log_error "Node.js 版本必须 >= 18，当前版本: $(node --version)"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查 Netlify CLI (可选)
    if command -v netlify &> /dev/null; then
        log_success "Netlify CLI 已安装: $(netlify --version)"
    else
        log_warning "Netlify CLI 未安装，无法使用本地部署功能"
    fi
    
    log_success "环境检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    
    if npm run test:run; then
        log_success "所有测试通过"
    else
        log_error "测试失败，停止部署"
        exit 1
    fi
}

# 构建项目
build_project() {
    local env=$1
    log_info "构建项目 (环境: $env)..."
    
    # 设置环境变量
    export APP_ENV=$env
    export NODE_ENV=production
    
    # 清理之前的构建
    rm -rf dist
    
    # 执行构建
    npm run build
    
    if [ -d "dist" ]; then
        log_success "项目构建完成"
        log_info "构建大小: $(du -sh dist | cut -f1)"
    else
        log_error "构建失败，dist 目录不存在"
        exit 1
    fi
}

# 验证构建产物
validate_build() {
    log_info "验证构建产物..."
    
    # 检查关键文件
    local critical_files=("dist/index.html" "dist/404.html" "dist/500.html")
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "关键文件缺失: $file"
            exit 1
        fi
    done
    
    # 检查 API 路由
    if [ ! -d "dist/_astro" ]; then
        log_warning "Astro 资源目录缺失"
    fi
    
    log_success "构建产物验证通过"
}

# 部署到 Netlify
deploy_to_netlify() {
    local env=$1
    log_info "部署到 Netlify ($env)..."
    
    if ! command -v netlify &> /dev/null; then
        log_error "请安装 Netlify CLI: npm install -g netlify-cli"
        exit 1
    fi
    
    # 检查是否已链接站点
    if [ ! -f ".netlify/state.json" ]; then
        log_warning "站点未链接，请先运行: netlify link"
        read -p "是否现在链接站点? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            netlify link
        else
            log_error "站点未链接，无法部署"
            exit 1
        fi
    fi
    
    # 选择部署类型
    case $env in
        "production")
            netlify deploy --prod --dir=dist
            log_success "生产环境部署完成"
            ;;
        "staging"|"preview")
            netlify deploy --dir=dist
            log_success "预览环境部署完成"
            ;;
        *)
            netlify deploy --dir=dist
            log_success "开发环境部署完成"
            ;;
    esac
}

# 运行健康检查
health_check() {
    local url=$1
    if [ -z "$url" ]; then
        log_warning "未提供URL，跳过健康检查"
        return
    fi
    
    log_info "运行健康检查: $url"
    
    # 等待站点启动
    sleep 10
    
    # 检查主页
    if curl -f -s "$url" > /dev/null; then
        log_success "主页响应正常"
    else
        log_error "主页无法访问"
        exit 1
    fi
    
    # 检查健康检查端点
    if curl -f -s "$url/api/health" > /dev/null; then
        log_success "API健康检查通过"
    else
        log_warning "API健康检查失败"
    fi
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    
    # 清理node_modules中的缓存
    npm cache clean --force > /dev/null 2>&1 || true
    
    # 清理构建缓存
    rm -rf .astro > /dev/null 2>&1 || true
    
    log_success "清理完成"
}

# 主函数
main() {
    local environment=${1:-"development"}
    local deploy_url=""
    
    log_info "开始部署流程 (环境: $environment)"
    echo "=================================="
    
    # 执行部署步骤
    check_requirements
    install_dependencies
    run_tests
    build_project $environment
    validate_build
    
    # 部署确认
    read -p "是否继续部署到 Netlify? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_netlify $environment
        
        # 获取部署URL
        if command -v netlify &> /dev/null; then
            deploy_url=$(netlify status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$deploy_url" ]; then
                log_info "部署URL: $deploy_url"
                health_check $deploy_url
            fi
        fi
    else
        log_info "跳过 Netlify 部署"
    fi
    
    cleanup
    
    echo "=================================="
    log_success "部署流程完成!"
    
    if [ ! -z "$deploy_url" ]; then
        echo -e "\n${GREEN}站点地址:${NC} $deploy_url"
        echo -e "${GREEN}健康检查:${NC} $deploy_url/api/health"
        echo -e "${GREEN}分析工具:${NC} $deploy_url/analyze"
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [OPTIONS] [ENVIRONMENT]"
    echo ""
    echo "环境选项:"
    echo "  development  开发环境 (默认)"
    echo "  staging      预发布环境" 
    echo "  production   生产环境"
    echo ""
    echo "选项:"
    echo "  -h, --help   显示帮助信息"
    echo "  -v, --version 显示版本信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 部署到开发环境"
    echo "  $0 staging           # 部署到预发布环境"
    echo "  $0 production        # 部署到生产环境"
}

# 处理命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -v|--version)
        echo "部署脚本版本 1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac