'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

/**
 * 退出登录 hook：清 token + 调后端 logout + 跳回登录页
 * 用法：const handleLogout = useLogout();
 *       <button onClick={handleLogout}>退出登录</button>
 */
export function useLogout() {
  const router = useRouter();
  return useCallback(async () => {
    // 先清本地 token，即使后端 logout 失败也能退出
    try {
      localStorage.removeItem('token');
    } catch {
      /* ignore */
    }
    // 异步通知后端（不阻塞跳转，失败也不影响退出）
    authApi.logout().catch(() => {
      /* ignore */
    });
    router.push('/login');
  }, [router]);
}
