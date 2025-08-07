-- 文本分析平台 Supabase 数据库初始化脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 analyses 表（分析记录）
CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建 favorites 表（收藏记录）
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, analysis_id)
);

-- 创建 history 表（历史记录）
CREATE TABLE IF NOT EXISTS history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_analysis_id ON favorites(analysis_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON history(action);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 analyses 表创建更新时间触发器
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE
    ON analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略 (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- analyses 表的 RLS 策略
-- 用户只能查看自己的分析
CREATE POLICY "Users can view own analyses" ON analyses
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的分析
CREATE POLICY "Users can insert own analyses" ON analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的分析
CREATE POLICY "Users can update own analyses" ON analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的分析
CREATE POLICY "Users can delete own analyses" ON analyses
    FOR DELETE USING (auth.uid() = user_id);

-- favorites 表的 RLS 策略
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- history 表的 RLS 策略
CREATE POLICY "Users can view own history" ON history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON history
    FOR DELETE USING (auth.uid() = user_id);

-- 创建存储过程：获取用户统计信息
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE (
    total_analyses BIGINT,
    total_favorites BIGINT,
    monthly_analyses BIGINT,
    daily_analyses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM analyses WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM favorites WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM analyses 
         WHERE user_id = p_user_id 
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM analyses 
         WHERE user_id = p_user_id 
         AND created_at >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权函数给认证用户
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;

-- 创建视图：最近的分析（带收藏状态）
CREATE OR REPLACE VIEW recent_analyses_with_favorites AS
SELECT 
    a.id,
    a.user_id,
    a.content,
    a.result,
    a.created_at,
    a.updated_at,
    CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
FROM analyses a
LEFT JOIN favorites f ON a.id = f.analysis_id AND a.user_id = f.user_id
WHERE a.user_id = auth.uid()
ORDER BY a.created_at DESC;

-- 授权视图给认证用户
GRANT SELECT ON recent_analyses_with_favorites TO authenticated;

-- 初始化完成
-- 注意：请在 Supabase 控制台的 SQL 编辑器中运行此脚本