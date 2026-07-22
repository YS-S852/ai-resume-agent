'use client';

import StarField from '@/components/StarField';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Rocket,
  LogOut,
  Settings,
  Menu,
  X,
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  BarChart3,
  Loader2,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  TrendingUp,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { atsApi } from '@/lib/api';

// ─── Sidebar Navigation ────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: '仪表盘', key: 'dashboard', href: '/dashboard' },
  { icon: User, label: '用户档案', key: 'profile', href: '/profile' },
  { icon: FileText, label: '简历管理', key: 'resume', href: '/resume' },
  { icon: Target, label: 'JD 分析', key: 'jd', href: '/jd' },
  { icon: ShieldCheck, label: 'ATS 检测', key: 'ats', href: '/ats' },
  { icon: MessageSquare, label: '面试中心', key: 'interview', href: '/interview' },
  { icon: Briefcase, label: '求职管理', key: 'jobs', href: '/jobs' },
  { icon: BookOpen, label: '知识库', key: 'career', href: '/career' },
  { icon: Search, label: '联网调研', key: 'search', href: '/search' },
];

// ─── Dimension Config ──────────────────────────────────────────────────────────
const dimensionConfig = [
  { key: 'keywordCoverage', label: '关键词覆盖率', max: 20, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.15)', barColor: 'from-purple-500 to-violet-400' },
  { key: 'skillMatch', label: '技能匹配度', max: 25, color: '#06B6D4', bgColor: 'rgba(6,182,212,0.15)', barColor: 'from-cyan-500 to-teal-400' },
  { key: 'projectExperience', label: '项目经验', max: 20, color: '#10B981', bgColor: 'rgba(16,185,129,0.15)', barColor: 'from-emerald-500 to-green-400' },
  { key: 'resultQuantification', label: '成果量化', max: 20, color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)', barColor: 'from-amber-500 to-yellow-400' },
  { key: 'formatStandard', label: '格式规范', max: 15, color: '#EC4899', bgColor: 'rgba(236,72,153,0.15)', barColor: 'from-pink-500 to-rose-400' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DimensionScore {
  keywordCoverage: number;
  skillMatch: number;
  projectExperience: number;
  resultQuantification: number;
  formatStandard: number;
}

interface ATSResult {
  overallScore: number;
  dimensions: DimensionScore;
  strengths: string[];
  weaknesses: string[];
  suggestions: { category: string; issue: string; fix: string }[];
}

interface HistoryItem {
  id: number;
  overallScore: number;
  jobTitle: string;
  createdAt: string;
  resumeTitle?: string;
}

// ─── Score Color Helper ────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#06B6D4';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 50) return '一般';
  return '需改进';
}

function getScoreGradient(score: number): string {
  if (score >= 90) return 'from-emerald-500 to-green-400';
  if (score >= 70) return 'from-cyan-500 to-teal-400';
  if (score >= 50) return 'from-amber-500 to-yellow-400';
  return 'from-red-500 to-rose-400';
}

// ─── SVG Circular Score ────────────────────────────────────────────────────────
function CircularScore({ score, size = 200 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-black tabular-nums"
          style={{ color, textShadow: `0 0 20px ${color}30` }}
        >
          {score}
        </span>
        <span className="text-white/40 text-sm mt-1">/ 100</span>
        <span
          className="text-xs font-medium mt-2 px-3 py-1 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Dimension Bar ─────────────────────────────────────────────────────────────
function DimensionBar({ config, score }: { config: typeof dimensionConfig[0]; score: number }) {
  const pct = Math.min((score / config.max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm font-medium">{config.label}</span>
        <span className="text-white/90 text-sm font-semibold tabular-nums">
          {score}
          <span className="text-white/30 font-normal">/{config.max}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: config.bgColor }}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.barColor}`}
          style={{
            width: `${pct}%`,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 12px ${config.color}30`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function ATSPage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [activeNav] = useState('ats');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Input state
  const [resumeContent, setResumeContent] = useState('');
  const [jdContent, setJdContent] = useState('');

  // Result state
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedChanges, setOptimizedChanges] = useState<string[]>([]);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Detail expand state
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  // ─── Load History ──────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await atsApi.getHistory();
      const data = res.data;
      setHistory(Array.isArray(data) ? data : data?.data || []);
    } catch {
      // Silently fail for history
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ─── Run ATS Analysis ──────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!resumeContent.trim() || !jdContent.trim()) {
      setError('请填写简历内容和目标 JD 后再开始检测');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setOptimizedChanges([]);
    try {
      const res = await atsApi.analyze({
        resumeContent: resumeContent.trim(),
        jdContent: jdContent.trim(),
      });
      const data = res.data?.data || res.data;
      setResult({
        overallScore: data.overallScore ?? data.score ?? 0,
        dimensions: {
          keywordCoverage: data.dimensions?.keywordCoverage ?? data.keywordCoverage ?? 0,
          skillMatch: data.dimensions?.skillMatch ?? data.skillMatch ?? 0,
          projectExperience: data.dimensions?.projectExperience ?? data.projectExperience ?? 0,
          resultQuantification: data.dimensions?.resultQuantification ?? data.resultQuantification ?? 0,
          formatStandard: data.dimensions?.formatStandard ?? data.formatStandard ?? 0,
        },
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: (data.suggestions || []).map((s: Record<string, string>) => ({
          category: s.category || s.title || '通用',
          issue: s.issue || s.problem || '',
          fix: s.fix || s.suggestion || s.recommendation || '',
        })),
      });
      loadHistory();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'ATS 检测失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!resumeContent.trim() || !jdContent.trim()) return;
    setOptimizing(true);
    setError(null);
    try {
      const res = await atsApi.optimize({
        resumeContent: resumeContent.trim(),
        jdContent: jdContent.trim(),
      });
      const data = res.data?.data || res.data;
      if (!data.optimizedContent) throw new Error('AI 未返回可用的优化内容');
      setResumeContent(data.optimizedContent);
      setOptimizedChanges(Array.isArray(data.changes) ? data.changes : []);
      document.getElementById('ats-input')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiError.response?.data?.message || apiError.message || '简历优化失败，请稍后重试');
    } finally {
      setOptimizing(false);
    }
  };

  // ─── View History Report ───────────────────────────────────────────────
  const handleViewReport = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await atsApi.getReport(id);
      const data = res.data?.data || res.data;
      setResult({
        overallScore: data.overallScore ?? data.score ?? 0,
        dimensions: {
          keywordCoverage: data.dimensions?.keywordCoverage ?? data.keywordCoverage ?? 0,
          skillMatch: data.dimensions?.skillMatch ?? data.skillMatch ?? 0,
          projectExperience: data.dimensions?.projectExperience ?? data.projectExperience ?? 0,
          resultQuantification: data.dimensions?.resultQuantification ?? data.resultQuantification ?? 0,
          formatStandard: data.dimensions?.formatStandard ?? data.formatStandard ?? 0,
        },
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: (data.suggestions || []).map((s: Record<string, string>) => ({
          category: s.category || s.title || '通用',
          issue: s.issue || s.problem || '',
          fix: s.fix || s.suggestion || s.recommendation || '',
        })),
      });
      // Scroll to result
      setTimeout(() => {
        document.getElementById('ats-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setError('加载历史报告失败');
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    setResult(null);
    setError(null);
    setResumeContent('');
    setJdContent('');
    setOptimizedChanges([]);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dark-900)' }}>
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
      </div>

      {/* Star field */}
      <StarField />

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
          {/* Sidebar Header */}
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
                <Link
                  key={item.key}
                  href={item.href}
                  prefetch
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
                </Link>
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
        <header
          className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(10, 10, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
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
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 focus:bg-white/[0.08] transition-all w-64"
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
        <div className="p-6 space-y-8 pb-20">
          {/* Page Header */}
          <div className="slide-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <ShieldCheck size={22} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  ATS <span className="holo-text">兼容检测</span>
                </h2>
                <p className="text-white/40 text-sm mt-0.5">
                  对标企业 ATS 筛选规则，提升简历通过率
                </p>
              </div>
            </div>
          </div>

          {/* ── Input Section ────────────────────────────────────────────── */}
          <div id="ats-input" className="grid grid-cols-1 lg:grid-cols-2 gap-5 slide-in-up" style={{ animationDelay: '0.15s' }}>
            {/* Resume Input */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-purple-400" />
                <h3 className="text-white font-semibold text-base">简历内容</h3>
              </div>
              <textarea
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                placeholder="请粘贴您的完整简历文本内容..."
                className="w-full h-64 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/80 text-sm placeholder:text-white/25 outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-white/25 text-xs">
                  已输入 {resumeContent.length} 字符
                </span>
                {resumeContent && (
                  <button
                    onClick={() => setResumeContent('')}
                    className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    清空
                  </button>
                )}
              </div>
            </div>

            {/* JD Input */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-cyan-400" />
                <h3 className="text-white font-semibold text-base">目标 JD</h3>
              </div>
              <textarea
                value={jdContent}
                onChange={(e) => setJdContent(e.target.value)}
                placeholder="请粘贴目标职位的完整 JD（职位描述）文本..."
                className="w-full h-64 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/80 text-sm placeholder:text-white/25 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-white/25 text-xs">
                  已输入 {jdContent.length} 字符
                </span>
                {jdContent && (
                  <button
                    onClick={() => setJdContent('')}
                    className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    清空
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Action Buttons ───────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4 slide-in-up" style={{ animationDelay: '0.25s' }}>
            {result && (
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 text-sm font-medium transition-all flex items-center gap-2"
              >
                <RotateCcw size={16} />
                重新检测
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading || !resumeContent.trim() || !jdContent.trim()}
              className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
              style={{ width: 'auto', minWidth: 220 }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>AI 分析中...</span>
                </>
              ) : (
                <>
                  <ScanSearch size={20} />
                  <span>开始 ATS 检测</span>
                </>
              )}
            </button>
          </div>

          {/* ── Error Message ────────────────────────────────────────────── */}
          {error && (
            <div className="glass-card p-4 border-red-500/20 slide-in-up flex items-center gap-3" style={{ animationDelay: '0s' }}>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <p className="text-red-300/90 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-300 transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          {/* ── Loading State ────────────────────────────────────────────── */}
          {loading && !result && (
            <div className="glass-card p-16 flex flex-col items-center justify-center slide-in-up" style={{ animationDelay: '0s' }}>
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={24} className="text-purple-400" />
                </div>
              </div>
              <p className="text-white/70 text-base font-medium">AI 正在分析您的简历与 JD 匹配度...</p>
              <p className="text-white/30 text-sm mt-2">正在检测关键词覆盖、技能匹配、项目经验等维度</p>
            </div>
          )}

          {/* ── Result Section ───────────────────────────────────────────── */}
          {result && !loading && (
            <div id="ats-result" className="space-y-6">
              {/* Score Overview */}
              <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <BarChart3 size={18} className="text-purple-400" />
                  <h3 className="text-white font-semibold text-lg">ATS 评分总览</h3>
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing || !resumeContent.trim() || !jdContent.trim()}
                    className="ml-auto flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/15 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {optimizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    <span>{optimizing ? '优化中...' : '一键优化简历'}</span>
                  </button>
                </div>

                {optimizedChanges.length > 0 && (
                  <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                      <CheckCircle2 size={15} />
                      优化结果已回填到简历输入框
                    </div>
                    <ul className="space-y-1 text-xs leading-relaxed text-white/50">
                      {optimizedChanges.map((change, index) => (
                        <li key={`${change}-${index}`}>{index + 1}. {change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row items-center gap-10">
                  {/* Circular Score */}
                  <div className="flex-shrink-0 spring-in" style={{ animationDelay: '0.3s' }}>
                    <CircularScore score={result.overallScore} size={200} />
                  </div>

                  {/* Dimension Bars */}
                  <div className="flex-1 w-full space-y-4">
                    {dimensionConfig.map((cfg, idx) => (
                      <div
                        key={cfg.key}
                        className="slide-in-up"
                        style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                      >
                        <DimensionBar
                          config={cfg}
                          score={result.dimensions[cfg.key as keyof DimensionScore] || 0}
                        />
                      </div>
                    ))}

                    {/* Total */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-white/50 text-sm">综合得分</span>
                      <span className={`text-lg font-bold bg-gradient-to-r ${getScoreGradient(result.overallScore)} bg-clip-text text-transparent`}>
                        {result.overallScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Strengths & Weaknesses ─────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Strengths */}
                <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                    <h3 className="text-white font-semibold text-base">优势亮点</h3>
                    <span className="ml-auto text-emerald-400/60 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {result.strengths.length} 项
                    </span>
                  </div>
                  {result.strengths.length > 0 ? (
                    <div className="space-y-3">
                      {result.strengths.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-b-0"
                        >
                          <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <p className="text-white/65 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/25 text-sm">暂无数据</p>
                  )}
                </div>

                {/* Weaknesses */}
                <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.7s' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-amber-400" />
                    </div>
                    <h3 className="text-white font-semibold text-base">待改进项</h3>
                    <span className="ml-auto text-amber-400/60 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {result.weaknesses.length} 项
                    </span>
                  </div>
                  {result.weaknesses.length > 0 ? (
                    <div className="space-y-3">
                      {result.weaknesses.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-b-0"
                        >
                          <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-white/65 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/25 text-sm">暂无数据</p>
                  )}
                </div>
              </div>

              {/* ── Optimization Suggestions ───────────────────────────────── */}
              {result.suggestions.length > 0 && (
                <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.8s' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Lightbulb size={16} className="text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold text-base">优化建议</h3>
                    <span className="ml-auto text-purple-400/60 text-xs bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {result.suggestions.length} 条建议
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.suggestions.map((sug, idx) => {
                      const isExpanded = expandedSuggestion === idx;
                      return (
                        <div
                          key={idx}
                          className="border border-white/[0.06] rounded-xl hover:border-white/10 transition-colors"
                        >
                          <button
                            onClick={() => setExpandedSuggestion(isExpanded ? null : idx)}
                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-400 text-xs font-bold">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50">
                                  {sug.category}
                                </span>
                              </div>
                              <p className="text-white/80 text-sm mt-1 truncate">{sug.issue}</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="ml-11 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Lightbulb size={12} className="text-emerald-400" />
                                  <span className="text-emerald-400/80 text-xs font-medium">优化方案</span>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed">{sug.fix}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── History Panel ────────────────────────────────────────────── */}
          <div className="glass-card slide-in-up" style={{ animationDelay: result ? '1s' : '0.35s' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Clock size={16} className="text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold text-base">检测历史</h3>
                <span className="text-white/25 text-xs bg-white/[0.05] px-2 py-0.5 rounded-full">
                  {history.length} 条记录
                </span>
              </div>
              {showHistory ? (
                <ChevronUp size={18} className="text-white/30" />
              ) : (
                <ChevronDown size={18} className="text-white/30" />
              )}
            </button>

            {showHistory && (
              <div className="px-6 pb-6">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <Loader2 size={18} className="animate-spin text-white/30" />
                    <span className="text-white/30 text-sm">加载历史记录...</span>
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02] transition-all group cursor-pointer"
                        onClick={() => handleViewReport(item.id)}
                      >
                        {/* Score Badge */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getScoreGradient(item.overallScore)}`}
                          style={{ opacity: 0.85 }}
                        >
                          <span className="text-white text-sm font-bold">{item.overallScore}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium truncate">
                            {item.jobTitle || '未命名职位'}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {item.resumeTitle || '简历检测'}
                          </p>
                        </div>

                        {/* Date */}
                        <div className="hidden sm:flex items-center gap-1.5 text-white/25 text-xs flex-shrink-0">
                          <Clock size={12} />
                          <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>

                        {/* Score Label */}
                        <span
                          className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                          style={{
                            background: `${getScoreColor(item.overallScore)}15`,
                            color: getScoreColor(item.overallScore),
                          }}
                        >
                          {getScoreLabel(item.overallScore)}
                        </span>

                        {/* Action */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(item.id);
                            }}
                            className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all"
                            title="查看报告"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                      <Award size={28} className="text-white/15" />
                    </div>
                    <p className="text-white/25 text-sm">暂无检测记录</p>
                    <p className="text-white/15 text-xs mt-1">完成首次 ATS 检测后将在此显示历史记录</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Quick Tips ───────────────────────────────────────────────── */}
          {!result && !loading && (
            <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.45s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold text-base">ATS 优化小贴士</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-purple-400" />
                    <span className="text-white/70 text-sm font-medium">关键词匹配</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed">
                    确保简历中包含 JD 中的核心技能关键词，使用相同的专业术语表述
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={14} className="text-cyan-400" />
                    <span className="text-white/70 text-sm font-medium">量化成果</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed">
                    使用具体数字描述工作成果，如"提升性能 40%"、"管理团队 8 人"等
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-emerald-400" />
                    <span className="text-white/70 text-sm font-medium">格式规范</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed">
                    使用标准章节标题、简洁的排版格式，避免表格和图片等 ATS 难以解析的元素
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
