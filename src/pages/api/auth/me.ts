import type { APIRoute } from 'astro';
import { getCurrentUser, isAuthenticated } from '../../../utils/supabase';
import type { ApiResponse } from '../../../types/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('检查用户认证状态');
    
    // 获取当前用户信息
    const user = await getCurrentUser();
    const authenticated = await isAuthenticated();
    
    if (authenticated && user) {
      console.log('用户已认证:', { userId: user.id, email: user.email });
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at !== null,
              fullName: user.user_metadata?.full_name || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
              createdAt: user.created_at,
              lastSignInAt: user.last_sign_in_at
            },
            authenticated: true
          },
          message: '用户已认证'
        } as ApiResponse),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    } else {
      console.log('用户未认证');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            user: null,
            authenticated: false
          },
          message: '用户未认证'
        } as ApiResponse),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }
  } catch (error) {
    console.error('用户状态检查API发生错误:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      } as ApiResponse),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};