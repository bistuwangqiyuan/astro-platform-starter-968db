import type { APIRoute } from 'astro';
import { db } from '../../utils/supabase';
import { withAuth } from '../../utils/auth';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    return withAuth(async (user) => {
        // 获取用户历史记录
        const { data: allHistory, error } = await db.history.getByUser(user.id, 1000); // 获取更多记录用于过滤
        
        if (error) {
            throw new Error(`获取历史记录失败: ${error.message}`);
        }
        
        let filteredHistory = allHistory || [];
        
        // 按操作类型过滤
        if (action) {
            filteredHistory = filteredHistory.filter(record => record.action === action);
        }
        
        // 按日期范围过滤
        if (startDate) {
            const start = new Date(startDate);
            filteredHistory = filteredHistory.filter(record => 
                new Date(record.created_at) >= start
            );
        }
        
        if (endDate) {
            const end = new Date(endDate);
            filteredHistory = filteredHistory.filter(record => 
                new Date(record.created_at) <= end
            );
        }
        
        // 统计信息
        const actionCounts = filteredHistory.reduce((counts, record) => {
            counts[record.action] = (counts[record.action] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
        
        // 日期分布统计
        const dateCounts = filteredHistory.reduce((counts, record) => {
            const date = new Date(record.created_at).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
        
        // 分页处理
        const total = filteredHistory.length;
        const paginatedHistory = filteredHistory.slice(offset, offset + limit);
        
        // 格式化历史记录，增加可读性
        const formattedHistory = paginatedHistory.map(record => ({
            id: record.id,
            action: record.action,
            action_display: formatActionDisplay(record.action),
            details: record.details,
            summary: generateActionSummary(record.action, record.details),
            created_at: record.created_at,
            relative_time: getRelativeTime(record.created_at)
        }));
        
        return {
            history: formattedHistory,
            pagination: {
                total,
                limit,
                offset,
                has_more: offset + limit < total
            },
            statistics: {
                total_records: total,
                actions_summary: actionCounts,
                date_distribution: dateCounts,
                most_frequent_action: Object.keys(actionCounts).reduce((a, b) => 
                    actionCounts[a] > actionCounts[b] ? a : b, Object.keys(actionCounts)[0] || ''
                )
            },
            filters: {
                action,
                start_date: startDate,
                end_date: endDate
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
        const { action, details } = body;
        
        // 验证必需参数
        if (!action) {
            return new Response(JSON.stringify({ 
                error: '缺少必需参数: action' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 验证操作类型
        const allowedActions = [
            'login', 'logout', 'create_analysis', 'update_analysis', 'delete_analysis',
            'add_favorite', 'remove_favorite', 'batch_analysis', 'batch_favorite_add',
            'batch_favorite_remove', 'view_analysis', 'download_results', 'share_analysis',
            'export_data', 'import_data', 'create_report', 'update_profile'
        ];
        
        if (!allowedActions.includes(action)) {
            return new Response(JSON.stringify({ 
                error: `无效的操作类型。支持的类型: ${allowedActions.join(', ')}` 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return withAuth(async (user) => {
            // 添加历史记录
            const { data: historyRecord, error } = await db.history.add(user.id, action, details || {});
            
            if (error) {
                throw new Error(`记录历史失败: ${error.message}`);
            }
            
            return {
                id: historyRecord.id,
                action,
                details: historyRecord.details,
                created_at: historyRecord.created_at,
                message: '历史记录已保存'
            };
            
        }).then(result => {
            if (result.error) {
                return new Response(JSON.stringify({ error: result.error }), {
                    status: result.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            return new Response(JSON.stringify({ data: result.data }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        });
    } catch (error) {
        console.error('历史记录API错误:', error);
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
    const recordId = url.searchParams.get('id');
    const deleteType = url.searchParams.get('type') || 'single'; // single, old, all
    const daysOld = parseInt(url.searchParams.get('daysOld') || '30');
    
    return withAuth(async (user) => {
        let deletedCount = 0;
        
        switch (deleteType) {
            case 'single':
                if (!recordId) {
                    throw new Error('删除单条记录需要提供记录ID');
                }
                
                // 这里需要扩展数据库操作来支持按ID删除单条历史记录
                // 目前简化处理
                throw new Error('暂不支持删除单条历史记录');
                
            case 'old':
                // 删除过期的历史记录
                const { error: deleteOldError } = await db.history.deleteOld(user.id, daysOld);
                
                if (deleteOldError) {
                    throw new Error(`删除过期记录失败: ${deleteOldError.message}`);
                }
                
                // 由于无法直接获取删除数量，这里返回估算值
                deletedCount = -1; // 表示操作成功但数量未知
                break;
                
            case 'all':
                // 删除所有历史记录 - 需要小心处理
                // 这里应该添加额外的确认机制
                
                // 先获取当前记录数量
                const { data: currentHistory } = await db.history.getByUser(user.id, 10000);
                const currentCount = currentHistory?.length || 0;
                
                // 删除所有记录（通过删除足够旧的记录实现）
                const { error: deleteAllError } = await db.history.deleteOld(user.id, -1); // 删除所有记录
                
                if (deleteAllError) {
                    throw new Error(`清空历史记录失败: ${deleteAllError.message}`);
                }
                
                deletedCount = currentCount;
                break;
                
            default:
                throw new Error('无效的删除类型，支持: single, old, all');
        }
        
        // 记录删除操作（如果不是删除所有记录的话）
        if (deleteType !== 'all') {
            await db.history.add(user.id, 'delete_history', {
                delete_type: deleteType,
                days_old: daysOld,
                record_id: recordId,
                estimated_count: deletedCount
            });
        }
        
        return {
            delete_type: deleteType,
            deleted_count: deletedCount,
            days_old: deleteType === 'old' ? daysOld : undefined,
            record_id: deleteType === 'single' ? recordId : undefined,
            message: getDeleteMessage(deleteType, deletedCount)
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

// 获取历史记录统计信息
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { operation } = body;
        
        if (operation !== 'statistics') {
            return new Response(JSON.stringify({ 
                error: '暂时只支持 statistics 操作' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return withAuth(async (user) => {
            // 获取完整的历史记录进行统计
            const { data: allHistory, error } = await db.history.getByUser(user.id, 10000);
            
            if (error) {
                throw new Error(`获取历史数据失败: ${error.message}`);
            }
            
            const history = allHistory || [];
            
            // 生成详细统计信息
            const statistics = generateDetailedStatistics(history);
            
            return statistics;
            
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
        console.error('历史统计API错误:', error);
        return new Response(JSON.stringify({ 
            error: '统计请求处理失败' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// 辅助函数
function formatActionDisplay(action: string): string {
    const actionMap: Record<string, string> = {
        'login': '登录',
        'logout': '登出',
        'create_analysis': '创建分析',
        'update_analysis': '更新分析',
        'delete_analysis': '删除分析',
        'add_favorite': '添加收藏',
        'remove_favorite': '取消收藏',
        'batch_analysis': '批量分析',
        'batch_favorite_add': '批量添加收藏',
        'batch_favorite_remove': '批量取消收藏',
        'view_analysis': '查看分析',
        'download_results': '下载结果',
        'share_analysis': '分享分析',
        'export_data': '导出数据',
        'import_data': '导入数据',
        'create_report': '创建报告',
        'update_profile': '更新个人资料',
        'delete_history': '删除历史记录'
    };
    
    return actionMap[action] || action;
}

function generateActionSummary(action: string, details: any): string {
    // Reason: 生成用户友好的操作摘要，提高历史记录的可读性
    try {
        switch (action) {
            case 'create_analysis':
                return `创建了分析 "${details.title}" (类型: ${details.analysis_type})`;
            
            case 'update_analysis':
                return `更新了分析 (修改字段: ${details.changes?.join(', ') || '未知'})`;
            
            case 'delete_analysis':
                return `删除了分析 "${details.title}"`;
            
            case 'add_favorite':
                return `收藏了 ${details.item_type} "${details.item_title || details.item_id}"`;
            
            case 'remove_favorite':
                return `取消收藏 ${details.item_type} "${details.item_title || details.item_id}"`;
            
            case 'batch_analysis':
                return `执行批量分析 (总数: ${details.total_count}, 成功: ${details.success_count}, 失败: ${details.error_count})`;
            
            case 'batch_favorite_add':
            case 'batch_favorite_remove':
                const operation = action.includes('add') ? '添加' : '取消';
                return `批量${operation}收藏 (总数: ${details.total_count}, 成功: ${details.success_count}, 失败: ${details.error_count})`;
            
            case 'delete_history':
                return `删除历史记录 (类型: ${details.delete_type}, 数量: ${details.estimated_count !== -1 ? details.estimated_count : '未知'})`;
            
            default:
                return `执行了 ${formatActionDisplay(action)} 操作`;
        }
    } catch (error) {
        return `执行了 ${formatActionDisplay(action)} 操作`;
    }
}

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
}

function getDeleteMessage(deleteType: string, deletedCount: number): string {
    switch (deleteType) {
        case 'single':
            return '单条历史记录已删除';
        case 'old':
            return deletedCount === -1 ? '过期历史记录清理完成' : `已删除 ${deletedCount} 条过期记录`;
        case 'all':
            return deletedCount > 0 ? `已清空所有历史记录 (${deletedCount} 条)` : '历史记录已清空';
        default:
            return '删除操作已完成';
    }
}

function generateDetailedStatistics(history: any[]): any {
    if (history.length === 0) {
        return {
            summary: { total: 0, actions: {}, date_range: null },
            timeline: [],
            patterns: { most_active_hour: null, most_active_day: null },
            trends: { daily_activity: [], weekly_activity: [] }
        };
    }
    
    // 基础统计
    const actionCounts = history.reduce((counts, record) => {
        counts[record.action] = (counts[record.action] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);
    
    // 时间分析
    const dates = history.map(record => new Date(record.created_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // 按小时统计
    const hourCounts = history.reduce((counts, record) => {
        const hour = new Date(record.created_at).getHours();
        counts[hour] = (counts[hour] || 0) + 1;
        return counts;
    }, {} as Record<number, number>);
    
    // 按星期统计
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayCounts = history.reduce((counts, record) => {
        const day = new Date(record.created_at).getDay();
        const dayName = dayNames[day];
        counts[dayName] = (counts[dayName] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);
    
    // 生成时间线数据
    const timeline = generateTimeline(history);
    
    // 生成趋势数据
    const trends = generateTrends(history);
    
    return {
        summary: {
            total: history.length,
            actions: actionCounts,
            date_range: {
                start: minDate.toISOString(),
                end: maxDate.toISOString(),
                days: Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
            }
        },
        timeline,
        patterns: {
            most_active_hour: Object.keys(hourCounts).reduce((a, b) => 
                hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0'
            ),
            most_active_day: Object.keys(dayCounts).reduce((a, b) => 
                dayCounts[a] > dayCounts[b] ? a : b, dayNames[0]
            ),
            hour_distribution: hourCounts,
            day_distribution: dayCounts
        },
        trends
    };
}

function generateTimeline(history: any[]): any[] {
    // 按日期分组
    const dailyGroups = history.reduce((groups, record) => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(record);
        return groups;
    }, {} as Record<string, any[]>);
    
    // 生成时间线
    return Object.keys(dailyGroups)
        .sort()
        .slice(-30) // 最近30天
        .map(date => ({
            date,
            count: dailyGroups[date].length,
            actions: dailyGroups[date].reduce((counts, record) => {
                counts[record.action] = (counts[record.action] || 0) + 1;
                return counts;
            }, {} as Record<string, number>)
        }));
}

function generateTrends(history: any[]): any {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        return {
            start: new Date(date.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: date.toISOString().split('T')[0]
        };
    }).reverse();
    
    // 按日统计
    const dailyActivity = last7Days.map(date => {
        const dayRecords = history.filter(record => 
            record.created_at.startsWith(date)
        );
        return {
            date,
            count: dayRecords.length,
            actions: dayRecords.reduce((counts, record) => {
                counts[record.action] = (counts[record.action] || 0) + 1;
                return counts;
            }, {} as Record<string, number>)
        };
    });
    
    // 按周统计
    const weeklyActivity = last4Weeks.map((week, index) => {
        const weekRecords = history.filter(record => {
            const recordDate = record.created_at.split('T')[0];
            return recordDate >= week.start && recordDate <= week.end;
        });
        return {
            week: index + 1,
            start_date: week.start,
            end_date: week.end,
            count: weekRecords.length,
            actions: weekRecords.reduce((counts, record) => {
                counts[record.action] = (counts[record.action] || 0) + 1;
                return counts;
            }, {} as Record<string, number>)
        };
    });
    
    return {
        daily_activity: dailyActivity,
        weekly_activity: weeklyActivity
    };
}