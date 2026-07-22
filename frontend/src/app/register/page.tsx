'use client';

import StarField from '@/components/StarField';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Lock, Mail, Eye, EyeOff, Rocket, Sparkles, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // 已登录直接跳仪表盘
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !email || !password) {
      setErrorMsg('请填写所有必填字段');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('两次密码输入不一致');
      return;
    }
    // 简单邮箱校验
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('邮箱格式不正确');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({ username, email, password });
      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        setSuccessMsg('注册成功！正在跳转到仪表盘...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        setErrorMsg('注册成功但未获取到令牌，请前往登录页');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || '注册失败，用户名或邮箱可能已被占用';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const parallaxX = mousePos.x * 20;
  const parallaxY = mousePos.y * 20;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--dark-900)' }}
    >
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div
          className="aurora-layer aurora-layer-1"
          style={{
            transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.3}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="aurora-layer aurora-layer-2"
          style={{
            transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="aurora-layer aurora-layer-3"
          style={{
            transform: `translate(${parallaxX * 0.7}px, ${parallaxY * 0.7}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Star Field */}
      <StarField count={80} bright />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4 py-8">

        {/* Logo */}
        <div
          className={`spring-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex flex-col items-center mb-6">
            <div className="logo-border-wrapper shine-sweep">
              <div className="logo-border">
                <div className="logo-border-inner">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                  >
                    <path
                      d="M32 8C32 8 20 20 20 36C20 42 22 46 24 48H40C42 46 44 42 44 36C44 20 32 8 32 8Z"
                      fill="url(#rocketGradient)"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <circle cx="32" cy="30" r="5" fill="#0a0a1a" stroke="#22D3EE" strokeWidth="1.5" />
                    <circle cx="32" cy="30" r="2.5" fill="#22D3EE" opacity="0.6" />
                    <path d="M20 36L14 44L22 42Z" fill="#EC4899" opacity="0.8" />
                    <path d="M44 36L50 44L42 42Z" fill="#8B5CF6" opacity="0.8" />
                    <path
                      d="M28 48C28 48 30 56 32 58C34 56 36 48 36 48"
                      fill="url(#flameGradient)"
                      className="animate-pulse"
                    />
                    <circle cx="18" cy="18" r="1.5" fill="#A78BFA" className="animate-pulse" />
                    <circle cx="48" cy="22" r="1" fill="#22D3EE" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <circle cx="14" cy="30" r="1" fill="#F472B6" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    <defs>
                      <linearGradient id="rocketGradient" x1="20" y1="8" x2="44" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#A78BFA" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                      <linearGradient id="flameGradient" x1="32" y1="48" x2="32" y2="58" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="50%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            <h1
              className={`holo-text text-4xl font-bold mt-6 tracking-tight spring-in ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.3s' }}
            >
              ResumePilot AI
            </h1>
            <p
              className={`text-white/50 text-sm mt-2 spring-in ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.45s' }}
            >
              <Sparkles size={14} className="inline mr-1.5 text-aurora-purple" />
              创建账户，开启 AI 求职之旅
            </p>
          </div>
        </div>

        {/* Register Card */}
        <div
          className={`glass-card w-full p-8 spring-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '0.5s' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-semibold text-white/90">创建新账户</h2>
              <p className="text-white/40 text-sm mt-1">填写以下信息完成注册</p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Username */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.7s' }}
            >
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                用户名
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="glass-input"
                  autoComplete="username"
                  required
                  minLength={2}
                />
              </div>
            </div>

            {/* Email */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.8s' }}
            >
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                邮箱
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="glass-input"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.9s' }}
            >
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="glass-input pr-12"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-200 p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.0s' }}
            >
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                确认密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="glass-input pr-12"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.15s' }}
            >
              <button
                type="submit"
                disabled={isLoading || !username || !email || !password || !confirmPassword}
                className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>注册中...</span>
                  </>
                ) : (
                  <>
                    <span>注 册</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div
              className={`flex items-center gap-3 slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.3s' }}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-white/30 text-xs">或</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Login Link */}
            <p
              className={`text-center text-white/40 text-sm slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.4s' }}
            >
              已有账户?{' '}
              <a
                href="/login"
                className="text-aurora-purple-light hover:text-aurora-purple transition-colors duration-200 font-medium hover:underline underline-offset-4"
              >
                返回登录
              </a>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p
          className={`text-white/20 text-xs mt-6 text-center fade-scale-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '1.6s' }}
        >
          &copy; 2026 ResumePilot AI. Powered by AI Agent Technology.
        </p>
      </div>
    </div>
  );
}
