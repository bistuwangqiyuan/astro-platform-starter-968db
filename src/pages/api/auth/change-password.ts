import type { APIRoute } from 'astro';
import { AuthService } from '../../../utils/auth';
import type { ChangePasswordForm } from '../../../types/global.d';

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('[API] 开始处理密码修改请求');
  
  try {
    // Reason: 验证用户认证状态
    const user = locals.user;
    
    if (!user) {
      console.log('[API] 密码修改失败: 用户未认证');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: '用户未认证'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 解析请求体
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body as ChangePasswordForm;
    
    // Reason: 验证必填字段
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.log('[API] 密码修改失败: 缺少必填字段');
      return new Response(
        JSON.stringify({
          success: false,
          error: '当前密码、新密码和确认密码不能为空'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 验证新密码强度
    if (newPassword.length < 6) {
      console.log('[API] 密码修改失败: 新密码太短');
      return new Response(
        JSON.stringify({
          success: false,
          error: '新密码长度不能少于6位'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 验证新密码确认
    if (newPassword !== confirmPassword) {
      console.log('[API] 密码修改失败: 新密码确认不一致');
      return new Response(
        JSON.stringify({
          success: false,
          error: '新密码确认不一致'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 验证新密码与当前密码不同
    if (currentPassword === newPassword) {
      console.log('[API] 密码修改失败: 新密码与当前密码相同');
      return new Response(
        JSON.stringify({
          success: false,
          error: '新密码不能与当前密码相同'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 调用认证服务进行密码修改
    const result = await AuthService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword
    });
    
    console.log(`[API] 密码修改结果: ${result.success ? '成功' : '失败'}`);
    
    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error('[API] 密码修改过程出错:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: '服务器内部错误，请稍后重试'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};