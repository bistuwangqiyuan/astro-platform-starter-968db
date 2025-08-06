import type { APIRoute } from 'astro';
import { db } from '../../../utils/supabase';
import { withAuth } from '../../../utils/auth';
import { AnalysisType } from '../../../types/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { analyses } = body;
        
        // 验证请求数据
        if (!Array.isArray(analyses) || analyses.length === 0) {
            return new Response(JSON.stringify({ 
                error: '批处理分析需要提供分析任务数组' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 限制批处理数量
        if (analyses.length > 10) {
            return new Response(JSON.stringify({ 
                error: '单次批处理最多支持10个分析任务' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return withAuth(async (user) => {
            const results = [];
            const errors = [];
            
            // 验证所有分析任务
            for (let i = 0; i < analyses.length; i++) {
                const analysis = analyses[i];
                const { title, dataSource, analysisType } = analysis;
                
                if (!title || !dataSource || !analysisType) {
                    errors.push({
                        index: i,
                        error: '缺少必需参数: title, dataSource, analysisType'
                    });
                    continue;
                }
                
                if (!Object.values(AnalysisType).includes(analysisType)) {
                    errors.push({
                        index: i,
                        error: '无效的分析类型'
                    });
                    continue;
                }
            }
            
            // 如果有验证错误，直接返回
            if (errors.length > 0) {
                throw new Error(`批处理验证失败: ${JSON.stringify(errors)}`);
            }
            
            // 创建所有分析任务
            for (let i = 0; i < analyses.length; i++) {
                try {
                    const analysis = analyses[i];
                    const analysisData = {
                        user_id: user.id,
                        title: analysis.title,
                        description: analysis.description || null,
                        data_source: analysis.dataSource,
                        analysis_type: analysis.analysisType,
                        parameters: analysis.parameters || {},
                        status: 'pending' as const,
                        results: {},
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { data: createdAnalysis, error } = await db.analyses.create(analysisData);
                    
                    if (error) {
                        errors.push({
                            index: i,
                            error: `创建分析任务失败: ${error.message}`
                        });
                        continue;
                    }
                    
                    results.push({
                        index: i,
                        analysis: createdAnalysis
                    });
                    
                    // 异步启动分析处理
                    processBatchAnalysis(createdAnalysis.id, analysisData).catch(error => {
                        console.error(`批处理分析 ${createdAnalysis.id} 失败:`, error);
                    });
                    
                } catch (error) {
                    errors.push({
                        index: i,
                        error: error instanceof Error ? error.message : '未知错误'
                    });
                }
            }
            
            // 记录批处理操作历史
            await db.history.add(user.id, 'batch_analysis', {
                total_count: analyses.length,
                success_count: results.length,
                error_count: errors.length,
                batch_id: `batch_${Date.now()}`
            });
            
            return {
                batch_id: `batch_${Date.now()}`,
                total: analyses.length,
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
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        });
    } catch (error) {
        console.error('批处理API错误:', error);
        return new Response(JSON.stringify({ 
            error: '批处理请求处理失败' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batchId');
    const status = url.searchParams.get('status');
    
    return withAuth(async (user) => {
        let query = db.analyses.getAll(user.id);
        
        // 如果提供了批次ID或状态过滤器，需要在应用层过滤
        // Reason: Supabase查询能力有限，复杂过滤在应用层处理更灵活
        const { data: allAnalyses, error } = await query;
        
        if (error) {
            throw new Error(`获取批处理状态失败: ${error.message}`);
        }
        
        let filteredAnalyses = allAnalyses || [];
        
        // 按状态过滤
        if (status) {
            filteredAnalyses = filteredAnalyses.filter(analysis => analysis.status === status);
        }
        
        // 按批次ID过滤（如果在创建时存储了批次信息）
        if (batchId) {
            // 这里可以根据实际的批次存储方式来过滤
            // 目前简化处理，返回指定时间范围的分析
            const batchTimestamp = parseInt(batchId.replace('batch_', ''));
            const timeRange = 5 * 60 * 1000; // 5分钟范围
            
            filteredAnalyses = filteredAnalyses.filter(analysis => {
                const analysisTime = new Date(analysis.created_at).getTime();
                return Math.abs(analysisTime - batchTimestamp) <= timeRange;
            });
        }
        
        // 统计批处理结果
        const statusCounts = filteredAnalyses.reduce((counts, analysis) => {
            counts[analysis.status] = (counts[analysis.status] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
        
        return {
            batch_id: batchId,
            total: filteredAnalyses.length,
            status_summary: statusCounts,
            analyses: filteredAnalyses.map(analysis => ({
                id: analysis.id,
                title: analysis.title,
                status: analysis.status,
                analysis_type: analysis.analysis_type,
                created_at: analysis.created_at,
                updated_at: analysis.updated_at,
                error_message: analysis.error_message
            }))
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

// 批处理分析处理函数
async function processBatchAnalysis(analysisId: string, analysisData: any) {
    try {
        // 更新状态为处理中
        await db.analyses.update(analysisId, { 
            status: 'processing',
            updated_at: new Date().toISOString()
        });
        
        // 添加随机延迟模拟真实处理时间
        const processingTime = Math.random() * 10000 + 2000; // 2-12秒
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        // 执行分析
        let results = {};
        
        switch (analysisData.analysis_type) {
            case AnalysisType.DESCRIPTIVE:
                results = await performBatchDescriptiveAnalysis(analysisData);
                break;
            case AnalysisType.CORRELATION:
                results = await performBatchCorrelationAnalysis(analysisData);
                break;
            case AnalysisType.REGRESSION:
                results = await performBatchRegressionAnalysis(analysisData);
                break;
            case AnalysisType.CLUSTERING:
                results = await performBatchClusteringAnalysis(analysisData);
                break;
            case AnalysisType.CLASSIFICATION:
                results = await performBatchClassificationAnalysis(analysisData);
                break;
            case AnalysisType.TIME_SERIES:
                results = await performBatchTimeSeriesAnalysis(analysisData);
                break;
            default:
                results = await performBatchCustomAnalysis(analysisData);
        }
        
        // 更新结果
        await db.analyses.update(analysisId, { 
            status: 'completed',
            results,
            updated_at: new Date().toISOString()
        });
        
        console.log(`批处理分析 ${analysisId} 完成`);
        
    } catch (error) {
        console.error(`批处理分析 ${analysisId} 错误:`, error);
        
        // 更新状态为失败
        await db.analyses.update(analysisId, { 
            status: 'failed',
            error_message: error instanceof Error ? error.message : '批处理分析失败',
            updated_at: new Date().toISOString()
        });
    }
}

// 批处理专用分析函数
async function performBatchDescriptiveAnalysis(data: any) {
    return {
        summary: {
            count: Math.floor(Math.random() * 10000) + 1000,
            mean: Math.random() * 1000,
            median: Math.random() * 1000,
            std: Math.random() * 200,
            min: Math.random() * 100,
            max: Math.random() * 1000 + 1000,
            skewness: (Math.random() - 0.5) * 4,
            kurtosis: Math.random() * 5
        },
        distribution: generateBatchDistributionData(),
        outliers: generateOutliersData(),
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchCorrelationAnalysis(data: any) {
    return {
        correlation_matrix: generateLargeCorrelationMatrix(),
        significant_correlations: generateBatchSignificantCorrelations(),
        heatmap_data: generateHeatmapData(),
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchRegressionAnalysis(data: any) {
    return {
        model_summary: {
            r_squared: Math.random() * 0.8 + 0.15,
            adjusted_r_squared: Math.random() * 0.75 + 0.1,
            f_statistic: Math.random() * 100 + 10,
            p_value: Math.random() * 0.01
        },
        coefficients: generateBatchRegressionCoefficients(),
        residuals: generateResidualsData(),
        diagnostics: generateDiagnosticsData(),
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchClusteringAnalysis(data: any) {
    return {
        clusters: generateClusterData(),
        cluster_centers: generateClusterCenters(),
        silhouette_score: Math.random() * 0.6 + 0.4,
        inertia: Math.random() * 1000 + 100,
        optimal_clusters: Math.floor(Math.random() * 8) + 3,
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchClassificationAnalysis(data: any) {
    return {
        model_performance: {
            accuracy: Math.random() * 0.25 + 0.75,
            precision: Math.random() * 0.25 + 0.75,
            recall: Math.random() * 0.25 + 0.75,
            f1_score: Math.random() * 0.25 + 0.75,
            auc_roc: Math.random() * 0.25 + 0.75
        },
        confusion_matrix: generateConfusionMatrix(),
        feature_importance: generateFeatureImportance(),
        classification_report: generateClassificationReport(),
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchTimeSeriesAnalysis(data: any) {
    return {
        trend_analysis: generateTrendData(),
        seasonality: generateSeasonalityData(),
        forecast: generateForecastData(),
        anomalies: generateAnomaliesData(),
        model_metrics: {
            mae: Math.random() * 10 + 1,
            mse: Math.random() * 100 + 10,
            rmse: Math.random() * 15 + 3,
            mape: Math.random() * 20 + 5
        },
        batch_processed_at: new Date().toISOString()
    };
}

async function performBatchCustomAnalysis(data: any) {
    return {
        custom_results: {
            algorithm: data.parameters?.algorithm || 'batch_default',
            metrics: generateBatchCustomMetrics(),
            visualization_data: generateBatchVisualizationData(),
            processing_stats: {
                data_points: Math.floor(Math.random() * 100000) + 10000,
                processing_time: Math.random() * 30 + 5,
                memory_usage: Math.random() * 512 + 128
            }
        },
        batch_processed_at: new Date().toISOString()
    };
}

// 辅助函数生成批处理数据
function generateBatchDistributionData() {
    return Array.from({ length: 20 }, (_, i) => ({
        bin: i * 50,
        count: Math.floor(Math.random() * 500) + 100,
        percentage: Math.random() * 100
    }));
}

function generateOutliersData() {
    return Array.from({ length: Math.floor(Math.random() * 10) + 5 }, () => ({
        value: Math.random() * 1000,
        z_score: Math.random() * 5 + 3,
        is_extreme: Math.random() > 0.7
    }));
}

function generateLargeCorrelationMatrix() {
    const variables = Array.from({ length: 8 }, (_, i) => `var${i + 1}`);
    const matrix: Record<string, Record<string, number>> = {};
    
    variables.forEach(var1 => {
        matrix[var1] = {};
        variables.forEach(var2 => {
            if (var1 === var2) {
                matrix[var1][var2] = 1;
            } else {
                matrix[var1][var2] = (Math.random() - 0.5) * 2;
            }
        });
    });
    
    return matrix;
}

function generateBatchSignificantCorrelations() {
    return Array.from({ length: 5 }, (_, i) => ({
        variables: [`var${i + 1}`, `var${i + 2}`],
        correlation: (Math.random() - 0.5) * 2,
        p_value: Math.random() * 0.05,
        confidence_interval: [
            Math.random() * 0.5,
            Math.random() * 0.5 + 0.5
        ]
    }));
}

function generateHeatmapData() {
    return Array.from({ length: 64 }, (_, i) => ({
        x: i % 8,
        y: Math.floor(i / 8),
        value: Math.random()
    }));
}

function generateBatchRegressionCoefficients() {
    return {
        intercept: { value: Math.random() * 20 - 10, p_value: Math.random() * 0.1 },
        slopes: Array.from({ length: 5 }, (_, i) => ({
            variable: `var${i + 1}`,
            coefficient: Math.random() * 4 - 2,
            p_value: Math.random() * 0.1,
            std_error: Math.random() * 0.5
        }))
    };
}

function generateResidualsData() {
    return Array.from({ length: 100 }, () => ({
        predicted: Math.random() * 100,
        residual: (Math.random() - 0.5) * 20
    }));
}

function generateDiagnosticsData() {
    return {
        normality_test: { statistic: Math.random() * 10, p_value: Math.random() * 0.1 },
        homoscedasticity: { statistic: Math.random() * 5, p_value: Math.random() * 0.1 },
        linearity: { r_squared: Math.random() * 0.9 + 0.1 }
    };
}

function generateClusterData() {
    const numClusters = Math.floor(Math.random() * 6) + 3;
    return Array.from({ length: numClusters }, (_, i) => ({
        cluster_id: i,
        size: Math.floor(Math.random() * 200) + 50,
        centroid: Array.from({ length: 4 }, () => Math.random() * 100)
    }));
}

function generateClusterCenters() {
    return Array.from({ length: 5 }, (_, i) => ({
        cluster: i,
        coordinates: Array.from({ length: 4 }, () => Math.random() * 100)
    }));
}

function generateConfusionMatrix() {
    const classes = ['class_a', 'class_b', 'class_c'];
    const matrix: Record<string, Record<string, number>> = {};
    
    classes.forEach(actual => {
        matrix[actual] = {};
        classes.forEach(predicted => {
            matrix[actual][predicted] = Math.floor(Math.random() * 100) + 10;
        });
    });
    
    return matrix;
}

function generateFeatureImportance() {
    return Array.from({ length: 8 }, (_, i) => ({
        feature: `feature_${i + 1}`,
        importance: Math.random(),
        rank: i + 1
    })).sort((a, b) => b.importance - a.importance);
}

function generateClassificationReport() {
    const classes = ['class_a', 'class_b', 'class_c'];
    return classes.map(cls => ({
        class: cls,
        precision: Math.random() * 0.3 + 0.7,
        recall: Math.random() * 0.3 + 0.7,
        f1_score: Math.random() * 0.3 + 0.7,
        support: Math.floor(Math.random() * 200) + 50
    }));
}

function generateTrendData() {
    return {
        trend_direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        trend_strength: Math.random(),
        seasonal_periods: [7, 30, 365],
        trend_components: Array.from({ length: 100 }, (_, i) => ({
            timestamp: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString(),
            trend: Math.random() * 100,
            seasonal: (Math.random() - 0.5) * 20,
            residual: (Math.random() - 0.5) * 10
        }))
    };
}

function generateSeasonalityData() {
    return {
        detected_periods: [7, 30],
        seasonal_strength: Math.random() * 0.8 + 0.2,
        seasonal_patterns: Array.from({ length: 7 }, (_, i) => ({
            period: i + 1,
            average_value: Math.random() * 100 + 50
        }))
    };
}

function generateForecastData() {
    return Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        forecast: Math.random() * 100 + 50,
        lower_bound: Math.random() * 30 + 30,
        upper_bound: Math.random() * 30 + 100,
        confidence: Math.random() * 0.2 + 0.8
    }));
}

function generateAnomaliesData() {
    return Array.from({ length: Math.floor(Math.random() * 10) + 3 }, () => ({
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.random() * 200,
        anomaly_score: Math.random() * 0.4 + 0.6,
        is_significant: Math.random() > 0.7
    }));
}

function generateBatchCustomMetrics() {
    return {
        processing_efficiency: Math.random() * 0.3 + 0.7,
        data_quality_score: Math.random() * 0.2 + 0.8,
        algorithm_performance: Math.random() * 0.3 + 0.7,
        resource_utilization: Math.random() * 0.4 + 0.6
    };
}

function generateBatchVisualizationData() {
    return {
        chart_type: 'multi_series',
        series: Array.from({ length: 3 }, (_, seriesIndex) => ({
            name: `Series ${seriesIndex + 1}`,
            data: Array.from({ length: 50 }, (_, i) => ({
                x: i,
                y: Math.random() * 100 + seriesIndex * 20
            }))
        }))
    };
}