'use client';

import { useEffect } from 'react';
import { authApi } from '@/lib/api';

export default function AutoLogin() {
  useEffect(() => {
    const autoLogin = async () => {
      if (typeof window === 'undefined') return;
      const existingToken = localStorage.getItem('token');
      if (existingToken) return; // already logged in

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
      }
    };

    autoLogin();
  }, []);

  return null; // renders nothing
}
