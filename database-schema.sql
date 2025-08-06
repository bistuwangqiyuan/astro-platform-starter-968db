-- Astro Platform Starter 数据库架构
-- 使用 Supabase PostgreSQL

-- 1. 创建分析记录表
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'google', -- google, baidu, bing等
    region VARCHAR(10) DEFAULT 'CN',
    time_range VARCHAR(20) DEFAULT '12months',
    analysis_type VARCHAR(20) DEFAULT 'detailed',
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    results JSONB, -- 存储分析结果
    metadata JSONB, -- 存储元数据
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT '默认分类',
    priority INTEGER DEFAULT 3, -- 1-5优先级
    tags TEXT[], -- 标签数组
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, keyword)
);

-- 3. 创建历史记录表
CREATE TABLE IF NOT EXISTS history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- analyze, favorite_add, favorite_remove等
    target_type VARCHAR(50), -- keyword, favorite等
    target_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建用户扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    api_quota_used INTEGER DEFAULT 0,
    api_quota_limit INTEGER DEFAULT 100,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建API使用统计表
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- 毫秒
    request_size INTEGER, -- 字节
    response_size INTEGER, -- 字节
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_keyword ON analyses(keyword);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_keyword ON favorites(keyword);
CREATE INDEX IF NOT EXISTS idx_favorites_category ON favorites(category);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON history(action);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity ON user_profiles(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON favorites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 RLS (Row Level Security) 策略
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- 分析记录的 RLS 策略
CREATE POLICY "用户只能查看自己的分析记录" ON analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的分析记录" ON analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的分析记录" ON analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的分析记录" ON analyses
    FOR DELETE USING (auth.uid() = user_id);

-- 收藏的 RLS 策略
CREATE POLICY "用户只能查看自己的收藏" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的收藏" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的收藏" ON favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的收藏" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 历史记录的 RLS 策略
CREATE POLICY "用户只能查看自己的历史记录" ON history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的历史记录" ON history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的历史记录" ON history
    FOR DELETE USING (auth.uid() = user_id);

-- 用户资料的 RLS 策略
CREATE POLICY "用户只能查看自己的资料" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的资料" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- API使用统计的 RLS 策略
CREATE POLICY "用户只能查看自己的API使用统计" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "系统可以插入API使用统计" ON api_usage
    FOR INSERT WITH CHECK (true);

-- 创建一些有用的视图
CREATE OR REPLACE VIEW user_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    up.display_name,
    up.subscription_plan,
    COUNT(a.id) as total_analyses,
    COUNT(f.id) as total_favorites,
    COUNT(h.id) as total_history_entries,
    up.api_quota_used,
    up.api_quota_limit,
    up.last_activity,
    up.created_at as user_created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN analyses a ON u.id = a.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN history h ON u.id = h.user_id
GROUP BY u.id, u.email, up.display_name, up.subscription_plan, 
         up.api_quota_used, up.api_quota_limit, up.last_activity, up.created_at;

-- 创建函数：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, created_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：新用户注册时自动创建资料
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 插入一些示例数据（仅用于开发测试）
-- 注意：生产环境中删除这些示例数据

-- 示例收藏分类
INSERT INTO favorites (user_id, keyword, category, priority, tags, notes) VALUES
('00000000-0000-0000-0000-000000000000', 'AI工具', '人工智能', 5, ARRAY['热门', 'AI'], '重点关注的AI相关关键词'),
('00000000-0000-0000-0000-000000000000', '数据分析', '技术', 4, ARRAY['技术', '分析'], '数据分析相关的关键词'),
('00000000-0000-0000-0000-000000000000', 'React框架', '前端开发', 3, ARRAY['前端', 'JavaScript'], 'React相关技术关键词')
ON CONFLICT (user_id, keyword) DO NOTHING;

-- 创建一些有用的函数
CREATE OR REPLACE FUNCTION get_user_quota(user_uuid UUID)
RETURNS TABLE(used INTEGER, limit_val INTEGER, remaining INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(up.api_quota_used, 0) as used,
        COALESCE(up.api_quota_limit, 100) as limit_val,
        COALESCE(up.api_quota_limit, 100) - COALESCE(up.api_quota_used, 0) as remaining
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：记录API使用
CREATE OR REPLACE FUNCTION log_api_usage(
    user_uuid UUID,
    endpoint_name VARCHAR(100),
    http_method VARCHAR(10),
    status_code INTEGER DEFAULT 200,
    response_time INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time)
    VALUES (user_uuid, endpoint_name, http_method, status_code, response_time);
    
    -- 更新用户配额使用量
    UPDATE user_profiles 
    SET api_quota_used = api_quota_used + 1,
        last_activity = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成数据库设置
-- 数据库架构创建完成，包含：
-- 1. 5个主要表：analyses, favorites, history, user_profiles, api_usage
-- 2. 完整的索引优化
-- 3. Row Level Security (RLS) 策略
-- 4. 自动触发器和函数
-- 5. 有用的视图和工具函数
