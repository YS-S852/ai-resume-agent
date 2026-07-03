'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Plus,
  Heart,
  Send,
  Users,
  Trophy,
  XCircle,
  MapPin,
  DollarSign,
  Building2,
  ExternalLink,
  Trash2,
  ChevronDown,
  Filter,
  Calendar,
  StickyNote,
  Loader2,
  AlertCircle,
  GripVertical,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { jobApi } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface JobApplication {
  id: number;
  company: string;
  position: string;
  salary?: string;
  location?: string;
  source?: string;
  status: JobStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

type JobStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';

interface JobStats {
  total: number;
  wishlist: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
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

const STATUS_LABEL: Record<JobStatus, string> = {
  wishlist: '心愿单',
  applied: '已投递',
  interview: '面试中',
  offer: '已录用',
  rejected: '已拒绝',
};

const STATUS_ICON: Record<JobStatus, React.ElementType> = {
  wishlist: Heart,
  applied: Send,
  interview: Users,
  offer: Trophy,
  rejected: XCircle,
};

const STATUS_COLOR: Record<JobStatus, string> = {
  wishlist: 'text-purple-400',
  applied: 'text-cyan-400',
  interview: 'text-amber-400',
  offer: 'text-green-400',
  rejected: 'text-red-400',
};

const STATUS_BG: Record<JobStatus, string> = {
  wishlist: 'from-purple-500/20 to-purple-600/10',
  applied: 'from-cyan-500/20 to-cyan-600/10',
  interview: 'from-amber-500/20 to-amber-600/10',
  offer: 'from-green-500/20 to-green-600/10',
  rejected: 'from-red-500/20 to-red-600/10',
};

const STATUS_BORDER: Record<JobStatus, string> = {
  wishlist: 'border-purple-500/30',
  applied: 'border-cyan-500/30',
  interview: 'border-amber-500/30',
  offer: 'border-green-500/30',
  rejected: 'border-red-500/30',
};

const STATUS_DOT: Record<JobStatus, string> = {
  wishlist: 'bg-purple-500',
  applied: 'bg-cyan-500',
  interview: 'bg-amber-500',
  offer: 'bg-green-500',
  rejected: 'bg-red-500',
};

const SOURCE_OPTIONS = [
  { value: '', label: '请选择来源' },
  { value: 'company_website', label: '公司官网' },
  { value: 'boss', label: 'BOSS 直聘' },
  { value: 'lagou', label: '拉勾网' },
  { value: 'zhilian', label: '智联招聘' },
  { value: 'liepin', label: '猎聘' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'neitui', label: '内推' },
  { value: 'other', label: '其他' },
];

const SOURCE_LABEL: Record<string, string> = {
  company_website: '公司官网',
  boss: 'BOSS 直聘',
  lagou: '拉勾网',
  zhilian: '智联招聘',
  liepin: '猎聘',
  linkedin: 'LinkedIn',
  neitui: '内推',
  other: '其他',
};

// Kanban columns: the "result" column merges offer + rejected
const KANBAN_COLUMNS: { key: string; label: string; statuses: JobStatus[] }[] = [
  { key: 'wishlist', label: '心愿单', statuses: ['wishlist'] },
  { key: 'applied', label: '已投递', statuses: ['applied'] },
  { key: 'interview', label: '面试中', statuses: ['interview'] },
  { key: 'result', label: '结果', statuses: ['offer', 'rejected'] },
];

type SortOption = 'newest' | 'oldest' | 'company';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function getStatColor(key: string): string {
  const map: Record<string, string> = {
    total: 'text-white',
    wishlist: 'text-purple-400',
    applied: 'text-cyan-400',
    interview: 'text-amber-400',
    offer: 'text-green-400',
    rejected: 'text-red-400',
  };
  return map[key] || 'text-white';
}

function getStatBg(key: string): string {
  const map: Record<string, string> = {
    total: 'from-white/10 to-white/5',
    wishlist: 'from-purple-500/20 to-purple-600/10',
    applied: 'from-cyan-500/20 to-cyan-600/10',
    interview: 'from-amber-500/20 to-amber-600/10',
    offer: 'from-green-500/20 to-green-600/10',
    rejected: 'from-red-500/20 to-red-600/10',
  };
  return map[key] || 'from-white/10 to-white/5';
}

function getStatIcon(key: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    total: Briefcase,
    wishlist: Heart,
    applied: Send,
    interview: Users,
    offer: Trophy,
    rejected: XCircle,
  };
  return map[key] || Briefcase;
}

function getStatLabel(key: string): string {
  const map: Record<string, string> = {
    total: '总数',
    wishlist: '心愿单',
    applied: '已投递',
    interview: '面试中',
    offer: '已录用',
    rejected: '已拒绝',
  };
  return map[key] || key;
}

// ---------------------------------------------------------------------------
// Default empty form
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  company: '',
  position: '',
  salary: '',
  location: '',
  source: '',
  status: 'wishlist' as JobStatus,
  notes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function JobsPage() {
  const router = useRouter();
  const handleLogout = useLogout();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    wishlist: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsRes, statsRes] = await Promise.all([
        jobApi.list(),
        jobApi.stats(),
      ]);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
      setStats(
        statsRes.data && typeof statsRes.data === 'object'
          ? statsRes.data
          : { total: 0, wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '加载数据失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------------------
  // CRUD operations
  // -------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!form.company.trim() || !form.position.trim()) return;
    try {
      setSubmitting(true);
      if (editingJob) {
        await jobApi.update(editingJob.id, {
          company: form.company,
          position: form.position,
          salary: form.salary || undefined,
          location: form.location || undefined,
          source: form.source || undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
      } else {
        await jobApi.create({
          company: form.company,
          position: form.position,
          salary: form.salary || undefined,
          location: form.location || undefined,
          source: form.source || undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
      }
      setShowAddModal(false);
      setEditingJob(null);
      setForm({ ...EMPTY_FORM });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (job: JobApplication, newStatus: JobStatus) => {
    try {
      await jobApi.update(job.id, { status: newStatus });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '状态更新失败';
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await jobApi.delete(id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除失败';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (job: JobApplication) => {
    setEditingJob(job);
    setForm({
      company: job.company,
      position: job.position,
      salary: job.salary || '',
      location: job.location || '',
      source: job.source || '',
      status: job.status,
      notes: job.notes || '',
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingJob(null);
    setForm({ ...EMPTY_FORM });
    setShowAddModal(true);
  };

  // -------------------------------------------------------------------------
  // Filtered & sorted jobs
  // -------------------------------------------------------------------------
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.position.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((j) => j.status === filterStatus);
    }

    // Sort
    if (sortOption === 'newest') {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortOption === 'oldest') {
      result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortOption === 'company') {
      result.sort((a, b) => a.company.localeCompare(b.company, 'zh'));
    }

    return result;
  }, [jobs, searchQuery, filterStatus, sortOption]);

  // Group jobs by kanban column
  const kanbanData = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      jobs: filteredJobs.filter((j) => col.statuses.includes(j.status)),
    }));
  }, [filteredJobs]);

  // Next / previous status helpers
  const STATUS_FLOW: JobStatus[] = ['wishlist', 'applied', 'interview', 'offer'];

  function getNextStatus(current: JobStatus): JobStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  }

  function getPrevStatus(current: JobStatus): JobStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx > 0) return STATUS_FLOW[idx - 1];
    if (current === 'rejected') return 'interview';
    return null;
  }

  // Stat entries for the top bar
  const statEntries = ['total', 'wishlist', 'applied', 'interview', 'offer', 'rejected'];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setShowFilterDropdown(false);
    if (showFilterDropdown) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showFilterDropdown]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
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
              const isActive = item.key === 'jobs';
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.href)}
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
      <main className="flex-1 relative z-10 min-h-screen flex flex-col">
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
            <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Briefcase size={20} className="text-purple-400" />
              求职管理
            </h2>
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

        {/* Scrollable Content */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Title */}
          <div className="slide-in-up" style={{ animationDelay: '0.05s' }}>
            <h3 className="text-2xl font-bold text-white mb-1">
              求职 <span className="holo-text">跟踪看板</span>
            </h3>
            <p className="text-white/40 text-sm">
              管理您的求职申请，追踪每一个机会的状态与进展
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm slide-in-up"
            >
              <AlertCircle size={18} />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ---- Top Stats Bar ---- */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 slide-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {statEntries.map((key, idx) => {
              const Icon = getStatIcon(key);
              const count =
                key === 'total'
                  ? stats.total
                  : stats[key as keyof Omit<JobStats, 'total'>] ?? 0;
              return (
                <div
                  key={key}
                  className="glass-card p-4 flex items-center gap-3 hover:border-white/15 transition-all duration-300 cursor-default group"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getStatBg(key)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={18} className={getStatColor(key)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs truncate">{getStatLabel(key)}</p>
                    <p className={`text-xl font-bold ${getStatColor(key)}`}>
                      {loading ? '-' : count}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---- Filter / Search / Actions Bar ---- */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 slide-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                placeholder="搜索公司或职位..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 focus:bg-white/8 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowFilterDropdown((v) => !v)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all
                  ${
                    filterStatus !== 'all'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border-white/8 text-white/60 hover:border-white/15'
                  }
                `}
              >
                <Filter size={14} />
                <span>
                  {filterStatus === 'all' ? '全部状态' : STATUS_LABEL[filterStatus]}
                </span>
                <ChevronDown size={14} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFilterDropdown && (
                <div
                  className="absolute top-full mt-2 left-0 w-44 rounded-xl overflow-hidden z-40"
                  style={{
                    background: 'rgba(15, 15, 46, 0.95)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {(['all', 'wishlist', 'applied', 'interview', 'offer', 'rejected'] as const).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setFilterStatus(s);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                          filterStatus === s
                            ? 'bg-purple-500/15 text-purple-300'
                            : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                        }`}
                      >
                        {s !== 'all' && (
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                        )}
                        {s === 'all' ? '全部状态' : STATUS_LABEL[s]}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white/60 outline-none focus:border-purple-500/30 transition-all cursor-pointer appearance-none"
              style={{ minWidth: '130px' }}
            >
              <option value="newest" className="bg-[#0f0f2e]">最新优先</option>
              <option value="oldest" className="bg-[#0f0f2e]">最早优先</option>
              <option value="company" className="bg-[#0f0f2e]">按公司排序</option>
            </select>

            {/* Add Job Button */}
            <button
              onClick={openAddModal}
              className="btn-gradient flex items-center justify-center gap-2 px-6 py-2.5 text-sm whitespace-nowrap"
              style={{ width: 'auto', borderRadius: '12px' }}
            >
              <Plus size={16} />
              添加职位
            </button>
          </div>

          {/* ---- Loading State ---- */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-purple-400 animate-spin" />
              <span className="ml-3 text-white/40 text-sm">加载求职数据中...</span>
            </div>
          )}

          {/* ---- Empty State ---- */}
          {!loading && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 slide-in-up">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center mb-5">
                <Briefcase size={36} className="text-purple-400/50" />
              </div>
              <h4 className="text-white/70 font-semibold text-lg mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? '没有找到匹配的职位'
                  : '还没有添加任何职位'}
              </h4>
              <p className="text-white/30 text-sm mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? '尝试调整筛选条件或搜索关键词'
                  : '点击「添加职位」开始追踪您的求职进度'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={openAddModal}
                  className="btn-gradient flex items-center gap-2 px-8 py-3 text-sm"
                  style={{ width: 'auto' }}
                >
                  <Plus size={16} />
                  添加第一个职位
                </button>
              )}
            </div>
          )}

          {/* ---- Kanban Board ---- */}
          {!loading && filteredJobs.length > 0 && (
            <div
              className="slide-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
                {kanbanData.map((column) => (
                  <div
                    key={column.key}
                    className="flex-shrink-0 w-80 flex flex-col"
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        column.key === 'wishlist' ? 'bg-purple-500' :
                        column.key === 'applied' ? 'bg-cyan-500' :
                        column.key === 'interview' ? 'bg-amber-500' :
                        'bg-gradient-to-r from-green-500 to-red-500'
                      }`} />
                      <h4 className="text-white/80 font-semibold text-sm">
                        {column.label}
                      </h4>
                      <span className="ml-auto text-white/30 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                        {column.jobs.length}
                      </span>
                    </div>

                    {/* Column Body */}
                    <div
                      className="flex-1 rounded-2xl p-2 space-y-3 overflow-y-auto"
                      style={{
                        background: 'rgba(15, 15, 46, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        maxHeight: 'calc(100vh - 360px)',
                      }}
                    >
                      {column.jobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-white/20 text-sm">
                          <Briefcase size={24} className="mb-2 opacity-40" />
                          <span>暂无职位</span>
                        </div>
                      )}
                      {column.jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onNext={getNextStatus(job.status)}
                          onPrev={getPrevStatus(job.status)}
                          onStatusChange={handleStatusChange}
                          onDelete={setDeleteTarget}
                          onEdit={openEditModal}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* ADD / EDIT MODAL                             */}
      {/* ============================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setEditingJob(null);
            }}
          />

          {/* Modal Panel */}
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden spring-in"
            style={{
              background: 'rgba(15, 15, 46, 0.92)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '90vh',
            }}
          >
            {/* Top gradient line */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  'linear-gradient(90deg, #8B5CF6, #06B6D4, #EC4899, #A78BFA, #22D3EE)',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingJob ? (
                  <>
                    <Settings size={18} className="text-purple-400" />
                    编辑职位
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-purple-400" />
                    添加新职位
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingJob(null);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-6 pb-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {/* Company */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">
                  公司名称 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="例如：字节跳动"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">
                  职位名称 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Briefcase
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="例如：高级前端工程师"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Salary + Location Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 ml-1">薪资范围</label>
                  <div className="relative">
                    <DollarSign
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      type="text"
                      placeholder="例如：25-40K"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 ml-1">工作地点</label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      type="text"
                      placeholder="例如：北京"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Source + Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 ml-1">来源渠道</label>
                  <div className="relative">
                    <ExternalLink
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                    <select
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all appearance-none cursor-pointer"
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#0f0f2e] text-white"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 ml-1">当前状态</label>
                  <div className="relative">
                    <GripVertical
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as JobStatus })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all appearance-none cursor-pointer"
                    >
                      {(Object.keys(STATUS_LABEL) as JobStatus[]).map((s) => (
                        <option key={s} value={s} className="bg-[#0f0f2e] text-white">
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">备注</label>
                <textarea
                  placeholder="添加备注信息..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.company.trim() || !form.position.trim()}
                className={`
                  btn-gradient flex items-center justify-center gap-2 w-full
                  ${(!form.company.trim() || !form.position.trim()) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ padding: '14px 32px' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {editingJob ? '保存中...' : '添加中...'}
                  </>
                ) : (
                  <>
                    {editingJob ? '保存修改' : '添加职位'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* DELETE CONFIRMATION MODAL                    */}
      {/* ============================================ */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden spring-in p-6"
            style={{
              background: 'rgba(15, 15, 46, 0.95)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h4 className="text-white font-semibold text-lg mb-2">确认删除</h4>
              <p className="text-white/40 text-sm mb-6">
                此操作不可撤销，确定要删除这个职位记录吗？
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={14} />
                      删除
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Job Card Sub-Component
// ===========================================================================
interface JobCardProps {
  job: JobApplication;
  onNext: JobStatus | null;
  onPrev: JobStatus | null;
  onStatusChange: (job: JobApplication, newStatus: JobStatus) => void;
  onDelete: (id: number) => void;
  onEdit: (job: JobApplication) => void;
}

function JobCard({ job, onNext, onPrev, onStatusChange, onDelete, onEdit }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATUS_ICON[job.status];

  return (
    <div
      className={`
        rounded-xl p-4 transition-all duration-300 group cursor-pointer
        hover:border-white/15
        ${STATUS_BORDER[job.status]}
      `}
      style={{
        background: 'rgba(15, 15, 46, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h5 className="text-white font-semibold text-sm truncate group-hover:text-purple-300 transition-colors">
            {job.company}
          </h5>
          <p className="text-white/50 text-xs truncate mt-0.5">{job.position}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${STATUS_BG[job.status]} flex-shrink-0`}>
          <Icon size={12} className={STATUS_COLOR[job.status]} />
          <span className={`text-[10px] font-medium ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>
      </div>

      {/* Info Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {job.salary && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/50">
            <DollarSign size={10} />
            {job.salary}
          </span>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/50">
            <MapPin size={10} />
            {job.location}
          </span>
        )}
        {job.source && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/50">
            <ExternalLink size={10} />
            {SOURCE_LABEL[job.source] || job.source}
          </span>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-[11px] text-white/30 mb-2">
        <Calendar size={10} />
        <span>{formatDate(job.createdAt)}</span>
      </div>

      {/* Notes Preview */}
      {job.notes && !expanded && (
        <p className="text-[11px] text-white/30 truncate">
          <StickyNote size={10} className="inline mr-1" />
          {job.notes}
        </p>
      )}

      {/* Expanded: Full Notes */}
      {expanded && job.notes && (
        <div className="mt-2 mb-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap">
            {job.notes}
          </p>
        </div>
      )}

      {/* Action Buttons (visible on hover or expanded) */}
      <div
        className={`flex items-center gap-1.5 mt-2 transition-all duration-200 ${
          expanded ? 'opacity-100 max-h-10' : 'opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-10'
        } overflow-hidden`}
      >
        {/* Previous Status */}
        {onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(job, onPrev);
            }}
            title={`移至「${STATUS_LABEL[onPrev]}」`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all border border-white/5 hover:border-white/10"
          >
            <ArrowLeft size={11} />
            {STATUS_LABEL[onPrev]}
          </button>
        )}

        {/* Next Status */}
        {onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(job, onNext);
            }}
            title={`移至「${STATUS_LABEL[onNext]}」`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-all border border-purple-500/20 hover:border-purple-500/30"
          >
            {STATUS_LABEL[onNext]}
            <ArrowRight size={11} />
          </button>
        )}

        {/* Special: for interview column, add reject button */}
        {job.status === 'interview' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(job, 'rejected');
            }}
            title="标记为已拒绝"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-all border border-red-500/15 hover:border-red-500/25"
          >
            <XCircle size={11} />
            拒绝
          </button>
        )}

        <div className="flex-1" />

        {/* Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(job);
          }}
          title="编辑"
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          title="删除"
          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
