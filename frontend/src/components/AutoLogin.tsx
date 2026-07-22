'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function AutoLogin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const demoLoginEnabled =
    process.env.NEXT_PUBLIC_DEMO_AUTO_LOGIN === 'true' ||
    process.env.NODE_ENV === 'development';

  useEffect(() => {
    let active = true;
    const autoLogin = async () => {
      if (isAuthPage || !demoLoginEnabled) {
        if (active) setReady(true);
        return;
      }

      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        if (active) setReady(true);
        return;
      }

      setReady(false);
      try {
        // Try to login with default credentials
        const res = await authApi.login({ username: 'user', password: '123456' });
        const token = res.data?.token || res.data?.data?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
      } catch {
        // If login fails, try to register
        try {
          const regRes = await authApi.register({
            username: 'user',
            email: 'user@resume.ai',
            password: '123456',
          });
          const token = regRes.data?.token || regRes.data?.data?.token;
          if (token) {
            localStorage.setItem('token', token);
          }
        } catch {
          // Registration failed, user can login manually
        }
      } finally {
        if (active) setReady(true);
      }
    };

    autoLogin();
    return () => {
      active = false;
    };
  }, [isAuthPage, demoLoginEnabled]);

  return ready ? children : null;
}
