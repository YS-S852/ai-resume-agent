'use client';

import StarField from '@/components/StarField';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Lock, Eye, EyeOff, Rocket, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // If already has token, redirect to dashboard
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  // Mouse parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login({ username, password });
      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
      } else {
        setErrorMsg('登录成功但未获取到令牌，请重试');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || '登录失败，请检查用户名和密码';
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
      {/* ============================================ */}
      {/* EFFECT 1: Aurora Background (3 layers)       */}
      {/* ============================================ */}
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

      {/* ============================================ */}
      {/* EFFECT 2: Star Field Background              */}
      {/* ============================================ */}
      <StarField count={80} bright />

      {/* ============================================ */}
      {/* EFFECT 3: 5 Colorful Floating Particles      */}
      {/* ============================================ */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT                                 */}
      {/* ============================================ */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4 py-8">

        {/* ============================================ */}
        {/* EFFECT 4: Logo Area (Rotating Border + SVG)  */}
        {/* ============================================ */}
        <div
          className={`spring-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex flex-col items-center mb-6">
            <div className="logo-border-wrapper shine-sweep">
              <div className="logo-border">
                <div className="logo-border-inner">
                  {/* SVG Rocket Icon */}
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                  >
                    {/* Rocket body */}
                    <path
                      d="M32 8C32 8 20 20 20 36C20 42 22 46 24 48H40C42 46 44 42 44 36C44 20 32 8 32 8Z"
                      fill="url(#rocketGradient)"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    {/* Rocket window */}
                    <circle cx="32" cy="30" r="5" fill="#0a0a1a" stroke="#22D3EE" strokeWidth="1.5" />
                    <circle cx="32" cy="30" r="2.5" fill="#22D3EE" opacity="0.6" />
                    {/* Rocket fins */}
                    <path d="M20 36L14 44L22 42Z" fill="#EC4899" opacity="0.8" />
                    <path d="M44 36L50 44L42 42Z" fill="#8B5CF6" opacity="0.8" />
                    {/* Rocket flame */}
                    <path
                      d="M28 48C28 48 30 56 32 58C34 56 36 48 36 48"
                      fill="url(#flameGradient)"
                      className="animate-pulse"
                    />
                    {/* Sparkle accents */}
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

            {/* ============================================ */}
            {/* EFFECT 5: Holographic Text                   */}
            {/* ============================================ */}
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
              AI 智能求职助手 - 让简历乘风破浪
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* EFFECT 6: Glass Morphism Login Card          */}
        {/* ============================================ */}
        <div
          className={`glass-card w-full p-8 spring-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '0.5s' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Card Header */}
            <div className="text-center mb-2">
              <h2 className="text-xl font-semibold text-white/90">欢迎回来</h2>
              <p className="text-white/40 text-sm mt-1">请登录您的账户以继续</p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ============================================ */}
            {/* EFFECT 7: Glass Input - Username             */}
            {/* ============================================ */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.7s' }}
            >
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                用户名 / 邮箱
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
                  placeholder="请输入用户名或邮箱"
                  className="glass-input"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* ============================================ */}
            {/* EFFECT 7: Glass Input - Password             */}
            {/* ============================================ */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '0.85s' }}
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
                  placeholder="请输入密码"
                  className="glass-input pr-12"
                  autoComplete="current-password"
                  required
                />
                {/* EFFECT: Password show/hide toggle */}
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

            {/* ============================================ */}
            {/* EFFECT 8: Remember Me + Forgot Password      */}
            {/* ============================================ */}
            <div
              className={`flex items-center justify-between slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1s' }}
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded border border-white/20 bg-white/5 peer-checked:bg-aurora-purple peer-checked:border-aurora-purple transition-all duration-200 flex items-center justify-center">
                    {rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
                  记住我
                </span>
              </label>
              <a
                href="#"
                className="text-sm text-aurora-purple-light/70 hover:text-aurora-purple-light transition-colors duration-200 hover:underline underline-offset-4"
              >
                忘记密码?
              </a>
            </div>

            {/* ============================================ */}
            {/* EFFECT 9: Gradient Login Button              */}
            {/* ============================================ */}
            <div
              className={`slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.15s' }}
            >
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <span>登 录</span>
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

            {/* Social Login Buttons */}
            <div
              className={`flex gap-3 slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.4s' }}
            >
              <button
                type="button"
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.87c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.072 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
                </svg>
                微信
              </button>
              <button
                type="button"
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 6.937l-2.14 10.076c-.161.708-.58.884-1.176.55l-3.25-2.395-1.567 1.51c-.174.174-.32.32-.654.32l.233-3.31 6.016-5.437c.262-.232-.057-.362-.405-.13L7.68 13.282l-3.193-1c-.695-.217-.708-.695.145-1.029l12.484-4.812c.576-.217 1.08.13.894 1.029l-.116.467z" />
                </svg>
                Telegram
              </button>
              <button
                type="button"
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            {/* Register Link */}
            <p
              className={`text-center text-white/40 text-sm slide-in-up ${mounted ? '' : 'opacity-0'}`}
              style={{ animationDelay: '1.5s' }}
            >
              还没有账户?{' '}
              <a
                href="/register"
                className="text-aurora-purple-light hover:text-aurora-purple transition-colors duration-200 font-medium hover:underline underline-offset-4"
              >
                立即注册
              </a>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p
          className={`text-white/20 text-xs mt-6 text-center fade-scale-in ${mounted ? '' : 'opacity-0'}`}
          style={{ animationDelay: '1.7s' }}
        >
          &copy; 2026 ResumePilot AI. Powered by AI Agent Technology.
        </p>
      </div>
    </div>
  );
}
