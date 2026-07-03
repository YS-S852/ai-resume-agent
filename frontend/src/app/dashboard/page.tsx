'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';
import {
  LayoutDashboard,
  User,
  FileText,
  Target,
  ShieldCheck,
  MessageSquare,
  Briefcase,
  ChevronRight,
  Bell,
  Search,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  Rocket,
  LogOut,
  Settings,
  Menu,
  X,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

// Sidebar navigation items
const navItems = [
  { icon: LayoutDashboard, label: '仪表盘', key: 'dashboard', active: true, href: '/dashboard' },
  { icon: User, label: '用户档案', key: 'profile', active: false, href: '/profile' },
  { icon: FileText, label: '简历管理', key: 'resume', active: false, href: '/resume' },
  { icon: Target, label: 'JD 分析', key: 'jd', active: false, href: '/jd' },
  { icon: ShieldCheck, label: 'ATS 检测', key: 'ats', active: false, href: '/ats' },
  { icon: MessageSquare, label: '面试中心', key: 'interview', active: false, href: '/interview' },
  { icon: Briefcase, label: '求职管理', key: 'jobs', active: false, href: '/jobs' },
  { icon: BookOpen, label: '知识库', key: 'career', active: false, href: '/career' },
  { icon: Search, label: '联网调研', key: 'search', active: false, href: '/search' },
];

// Feature cards
const featureCards = [
  {
    icon: FileText,
    title: 'AI 一键生成简历',
    description: '先一键生成，再支持二次编辑与 AI 优化，完整覆盖求职简历工作流',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    iconColor: 'text-purple-400',
    borderColor: 'hover:border-purple-500/30',
    href: '/resume?mode=generate',
  },
  {
    icon: Target,
    title: 'JD 智能分析',
    description: '深度解析职位描述，匹配您的技能与经验，精准推荐',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
    borderColor: 'hover:border-cyan-500/30',
    href: '/jd',
  },
  {
    icon: ShieldCheck,
    title: 'ATS 兼容检测',
    description: '检测简历的 ATS 通过率，提供优化建议提升面试机会',
    gradient: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
    borderColor: 'hover:border-green-500/30',
    href: '/ats',
  },
  {
    icon: MessageSquare,
    title: 'AI 面试模拟',
    description: '模拟真实面试场景，AI 面试官实时提问并提供反馈',
    gradient: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-400',
    borderColor: 'hover:border-pink-500/30',
    href: '/interview',
  },
  {
    icon: Briefcase,
    title: '求职进度追踪',
    description: '管理求职申请状态，跟踪面试进度，规划职业路径',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    borderColor: 'hover:border-amber-500/30',
    href: '/jobs',
  },
  {
    icon: Sparkles,
    title: '简历润色优化',
    description: 'AI 智能润色简历内容，量化成果描述，提升专业度',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    iconColor: 'text-violet-400',
    borderColor: 'hover:border-violet-500/30',
    href: '/resume',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    resumeCount: 0,
    jobApplicationCount: 0,
    atsAvgScore: 0,
    lastActive: '',
    recentActivities: [] as { action: string; time: string; type: string }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await dashboardApi.stats();
        const data = res.data?.data || res.data;
        if (data) {
          setStats({
            resumeCount: data.resumeCount || 0,
            jobApplicationCount: data.jobApplicationCount || 0,
            atsAvgScore: data.atsAvgScore || 0,
            lastActive: data.lastActive || '',
            recentActivities: data.recentActivities || [],
          });
        }
      } catch {
        // Keep empty defaults
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dark-900)' }}>
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
      </div>

      {/* Star field */}
      <div className="star-field">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.15 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================ */}
      {/* SIDEBAR                                      */}
      {/* ============================================ */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-10
          w-72 lg:w-64 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div
          className="h-full flex flex-col"
          style={{
            background: 'rgba(10, 10, 26, 0.85)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Sidebar Header / Logo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Rocket size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">ResumePilot</h1>
                <p className="text-white/30 text-xs">AI 智能求职助手</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { setActiveNav(item.key); router.push(item.href); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-white border border-purple-500/20'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
                  )}
                  <Icon
                    size={18}
                    className={isActive ? 'text-purple-400' : 'text-white/40 group-hover:text-white/60'}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto text-purple-400/60" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 space-y-1 border-t border-white/5">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200">
              <Settings size={16} />
              <span>设置</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400/80 hover:bg-red-500/5 transition-all duration-200">
              <LogOut size={16} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================ */}
      {/* MAIN CONTENT                                 */}
      {/* ============================================ */}
      <main className="flex-1 relative z-10 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between" style={{
          background: 'rgba(10, 10, 26, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="搜索功能、简历..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 focus:bg-white/8 transition-all w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white/80">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                Y
              </div>
              <span className="text-white/70 text-sm font-medium hidden sm:block">用户</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-8">
          {/* Welcome Section */}
          <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-white mb-1">
              欢迎回来，<span className="holo-text">用户</span>
            </h2>
            <p className="text-white/40 text-sm">
              今天是个好日子，让我们继续优化您的求职之旅
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 slide-in-up" style={{ animationDelay: '0.2s' }}>
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-purple-400/50" />
              </div>
            ) : (
              [
                { icon: FileText, label: '简历数量', value: String(stats.resumeCount), color: 'text-purple-400' },
                { icon: Briefcase, label: '求职申请', value: String(stats.jobApplicationCount), color: 'text-cyan-400' },
                { icon: TrendingUp, label: 'ATS 平均分', value: stats.atsAvgScore ? `${stats.atsAvgScore}%` : '--', color: 'text-green-400' },
                { icon: Clock, label: '最近活跃', value: stats.lastActive || '--', color: 'text-amber-400' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="glass-card p-4 flex items-center gap-4 hover:border-white/15 transition-all duration-300 cursor-default"
                    style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Icon size={20} className={stat.color} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">{stat.label}</p>
                      <p className="text-white text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Feature Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 slide-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                功能中心
              </h3>
              <a href="#" className="text-sm text-purple-400/70 hover:text-purple-400 transition-colors">
                查看全部
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {featureCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => router.push(card.href)}
                    className={`
                      glass-card p-6 cursor-pointer group
                      hover:shadow-lg hover:shadow-purple-500/5
                      transition-all duration-300 hover:-translate-y-1
                      border border-transparent ${card.borderColor}
                      slide-in-up
                    `}
                    style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={24} className={card.iconColor} />
                    </div>
                    <h4 className="text-white font-semibold text-base mb-2 group-hover:text-white transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-white/40 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-purple-400/60 text-sm group-hover:text-purple-400 transition-colors">
                      <span>开始使用</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '1.1s' }}>
            <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-cyan-400" />
              最近活动
            </h3>
            <div className="space-y-4">
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-purple-400/50" />
                </div>
              ) : stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity, idx) => {
                  const colorMap: Record<string, string> = {
                    resume: 'bg-purple-500',
                    ats: 'bg-green-500',
                    interview: 'bg-cyan-500',
                    jd: 'bg-amber-500',
                  };
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 py-3 border-b border-white/5 last:border-b-0"
                    >
                      <div className={`w-2 h-2 rounded-full ${colorMap[activity.type] || 'bg-purple-500'} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm truncate">{activity.action}</p>
                      </div>
                      <span className="text-white/30 text-xs flex-shrink-0">{activity.time}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <Clock size={24} className="text-white/10 mx-auto mb-2" />
                  <p className="text-white/25 text-sm">暂无近期活动</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
