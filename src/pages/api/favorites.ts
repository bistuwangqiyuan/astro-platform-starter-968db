import type { APIRoute } from 'astro';
import { db } from '../../utils/supabase';
import { withAuth } from '../../utils/auth';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const itemType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    return withAuth(async (user) => {
        // 获取用户收藏列表
        const { data: favorites, error } = await db.favorites.getByUser(user.id);
        
        if (error) {
            throw new Error(`获取收藏列表失败: ${error.message}`);
        }
        
        let filteredFavorites = favorites || [];
        
        // 按类型过滤
        if (itemType) {
            filteredFavorites = filteredFavorites.filter(fav => fav.item_type === itemType);
        }
        
        // 分页处理
        const total = filteredFavorites.length;
        const paginatedFavorites = filteredFavorites.slice(offset, offset + limit);
        
        // 获取收藏项目的详细信息
        const favoritesWithDetails = await Promise.all(
            paginatedFavorites.map(async (favorite) => {
                let itemDetails = null;
                
                try {
                    // 根据收藏类型获取对应的详细信息
                    switch (favorite.item_type) {
                        case 'analysis':
                            const { data: analysis } = await db.analyses.getById(favorite.item_id);
                            itemDetails = analysis ? {
                                id: analysis.id,
                                title: analysis.title,
                                description: analysis.description,
                                analysis_type: analysis.analysis_type,
                                status: analysis.status,
                                created_at: analysis.created_at,
                                updated_at: analysis.updated_at
                            } : null;
                            break;
                        // 可以扩展其他类型的收藏项
                        default:
                            itemDetails = { id: favorite.item_id, type: favorite.item_type };
                    }
                } catch (error) {
                    console.error(`获取收藏项详情失败 ${favorite.item_id}:`, error);
                    itemDetails = { id: favorite.item_id, type: favorite.item_type, error: '无法获取详情' };
                }
                
                return {
                    favorite_id: favorite.id,
                    item_id: favorite.item_id,
                    item_type: favorite.item_type,
                    created_at: favorite.created_at,
                    item_details: itemDetails
                };
            })
        );
        
        return {
            favorites: favoritesWithDetails,
            pagination: {
                total,
                limit,
                offset,
                has_more: offset + limit < total
            },
            summary: {
                total_favorites: total,
                by_type: filteredFavorites.reduce((counts, fav) => {
                    counts[fav.item_type] = (counts[fav.item_type] || 0) + 1;
                    return counts;
                }, {} as Record<string, number>)
            }
        };
        
    }).then(result => {
        if (result.error) {
            return new Response(JSON.stringify({ error: result.error }), {
                status: result.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ data: result.data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    });
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { itemId, itemType } = body;
        
        // 验证必需参数
        if (!itemId || !itemType) {
            return new Response(JSON.stringify({ 
                error: '缺少必需参数: itemId, itemType' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 验证收藏类型
        const allowedTypes = ['analysis', 'dataset', 'report', 'dashboard'];
        if (!allowedTypes.includes(itemType)) {
            return new Response(JSON.stringify({ 
                error: `无效的收藏类型。支持的类型: ${allowedTypes.join(', ')}` 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return withAuth(async (user) => {
            // 检查是否已经收藏
            const { exists } = await db.favorites.checkExists(user.id, itemId);
            
            if (exists) {
                return { message: '已经收藏过该项目', already_favorited: true };
            }
            
            // 验证被收藏的项目是否存在且用户有访问权限
            let itemExists = false;
            let itemTitle = '';
            
            switch (itemType) {
                case 'analysis':
                    try {
                        const { data: analysis, error } = await db.analyses.getById(itemId);
                        if (analysis && (analysis.user_id === user.id || analysis.status === 'completed')) {
                            itemExists = true;
                            itemTitle = analysis.title;
                        }
                    } catch (error) {
                        console.error('验证分析项目失败:', error);
                    }
                    break;
                // 可以添加其他类型的验证
                default:
                    // 对于其他类型，暂时假设存在
                    itemExists = true;
                    itemTitle = `${itemType}_${itemId}`;
            }
            
            if (!itemExists) {
                throw new Error('要收藏的项目不存在或您没有访问权限');
            }
            
            // 添加收藏
            const { data: favorite, error } = await db.favorites.add(user.id, itemId, itemType);
            
            if (error) {
                throw new Error(`添加收藏失败: ${error.message}`);
            }
            
            // 记录操作历史
            // Reason: 跟踪用户收藏行为，分析用户兴趣和使用模式
            await db.history.add(user.id, 'add_favorite', {
                favorite_id: favorite.id,
                item_id: itemId,
                item_type: itemType,
                item_title: itemTitle
            });
            
            return {
                favorite_id: favorite.id,
                item_id: itemId,
                item_type: itemType,
                created_at: favorite.created_at,
                message: '收藏成功'
            };
            
        }).then(result => {
            if (result.error) {
                return new Response(JSON.stringify({ error: result.error }), {
                    status: result.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const statusCode = result.data?.already_favorited ? 200 : 201;
            return new Response(JSON.stringify({ data: result.data }), {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
        });
    } catch (error) {
        console.error('收藏API错误:', error);
        return new Response(JSON.stringify({ 
            error: '请求处理失败' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const favoriteId = url.searchParams.get('favoriteId');
    
    if (!itemId && !favoriteId) {
        return new Response(JSON.stringify({ 
            error: '需要提供 itemId 或 favoriteId 参数' 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return withAuth(async (user) => {
        let itemTitle = '';
        let itemType = '';
        
        if (favoriteId) {
            // 通过收藏ID删除 - 需要先验证所有权
            // 这里需要扩展 db.favorites 来支持通过ID获取收藏
            // 目前简化处理，只支持通过itemId删除
            throw new Error('暂不支持通过favoriteId删除，请使用itemId');
        }
        
        if (itemId) {
            // 检查收藏是否存在
            const { exists } = await db.favorites.checkExists(user.id, itemId);
            
            if (!exists) {
                return { message: '该项目未被收藏', not_found: true };
            }
            
            // 获取收藏信息用于历史记录
            try {
                const { data: userFavorites } = await db.favorites.getByUser(user.id);
                const favorite = userFavorites?.find(fav => fav.item_id === itemId);
                if (favorite) {
                    itemType = favorite.item_type;
                    
                    // 尝试获取项目标题
                    if (itemType === 'analysis') {
                        const { data: analysis } = await db.analyses.getById(itemId);
                        itemTitle = analysis?.title || itemId;
                    }
                }
            } catch (error) {
                console.error('获取收藏信息失败:', error);
            }
            
            // 删除收藏
            const { error } = await db.favorites.remove(user.id, itemId);
            
            if (error) {
                throw new Error(`取消收藏失败: ${error.message}`);
            }
            
            // 记录操作历史
            await db.history.add(user.id, 'remove_favorite', {
                item_id: itemId,
                item_type: itemType,
                item_title: itemTitle
            });
            
            return {
                item_id: itemId,
                message: '取消收藏成功'
            };
        }
        
    }).then(result => {
        if (result.error) {
            return new Response(JSON.stringify({ error: result.error }), {
                status: result.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ data: result.data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    });
};

// 批量操作收藏
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action, items } = body;
        
        // 验证请求参数
        if (!action || !Array.isArray(items)) {
            return new Response(JSON.stringify({ 
                error: '批量操作需要提供 action 和 items 数组' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!['add', 'remove'].includes(action)) {
            return new Response(JSON.stringify({ 
                error: '无效的操作类型，支持: add, remove' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (items.length > 50) {
            return new Response(JSON.stringify({ 
                error: '单次批量操作最多支持50个项目' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return withAuth(async (user) => {
            const results = [];
            const errors = [];
            
            for (let i = 0; i < items.length; i++) {
                try {
                    const item = items[i];
                    
                    if (action === 'add') {
                        const { itemId, itemType } = item;
                        
                        if (!itemId || !itemType) {
                            errors.push({
                                index: i,
                                item,
                                error: '缺少 itemId 或 itemType'
                            });
                            continue;
                        }
                        
                        // 检查是否已收藏
                        const { exists } = await db.favorites.checkExists(user.id, itemId);
                        
                        if (exists) {
                            results.push({
                                index: i,
                                item,
                                status: 'already_exists',
                                message: '已经收藏'
                            });
                            continue;
                        }
                        
                        // 添加收藏
                        const { data: favorite, error } = await db.favorites.add(user.id, itemId, itemType);
                        
                        if (error) {
                            errors.push({
                                index: i,
                                item,
                                error: error.message
                            });
                            continue;
                        }
                        
                        results.push({
                            index: i,
                            item,
                            status: 'added',
                            favorite_id: favorite.id
                        });
                        
                    } else if (action === 'remove') {
                        const { itemId } = item;
                        
                        if (!itemId) {
                            errors.push({
                                index: i,
                                item,
                                error: '缺少 itemId'
                            });
                            continue;
                        }
                        
                        // 检查是否存在
                        const { exists } = await db.favorites.checkExists(user.id, itemId);
                        
                        if (!exists) {
                            results.push({
                                index: i,
                                item,
                                status: 'not_found',
                                message: '未收藏'
                            });
                            continue;
                        }
                        
                        // 删除收藏
                        const { error } = await db.favorites.remove(user.id, itemId);
                        
                        if (error) {
                            errors.push({
                                index: i,
                                item,
                                error: error.message
                            });
                            continue;
                        }
                        
                        results.push({
                            index: i,
                            item,
                            status: 'removed'
                        });
                    }
                } catch (error) {
                    errors.push({
                        index: i,
                        item: items[i],
                        error: error instanceof Error ? error.message : '未知错误'
                    });
                }
            }
            
            // 记录批量操作历史
            await db.history.add(user.id, `batch_favorite_${action}`, {
                total_count: items.length,
                success_count: results.length,
                error_count: errors.length,
                batch_id: `batch_favorite_${Date.now()}`
            });
            
            return {
                action,
                total: items.length,
                successful: results.length,
                failed: errors.length,
                results,
                errors
            };
            
        }).then(result => {
            if (result.error) {
                return new Response(JSON.stringify({ error: result.error }), {
                    status: result.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            return new Response(JSON.stringify({ data: result.data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        });
    } catch (error) {
        console.error('批量收藏操作错误:', error);
        return new Response(JSON.stringify({ 
            error: '批量操作请求处理失败' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};