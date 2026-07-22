'use client';

import StarField from '@/components/StarField';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Plus,
  BookOpen,
  Lightbulb,
  FileCode,
  GraduationCap,
  Building2,
  Compass,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  TrendingUp,
  Trash2,
  Edit3,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Send,
} from 'lucide-react';
import { careerApi } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CareerDocument {
  id: number;
  userId: number;
  title: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  vectorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  docId: number;
  score: number;
  title: string;
  content: string;
  type: string;
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

const DOC_TYPES = [
  { key: 'all', label: '全部', icon: BookOpen, color: 'text-white/60' },
  { key: 'knowledge', label: '知识库', icon: BookOpen, color: 'text-cyan-400' },
  { key: 'case', label: '案例库', icon: FileCode, color: 'text-purple-400' },
  { key: 'template', label: '模板库', icon: FileText, color: 'text-amber-400' },
  { key: 'experience', label: '经验分享', icon: Lightbulb, color: 'text-green-400' },
  { key: 'industry', label: '行业洞察', icon: Building2, color: 'text-pink-400' },
  { key: 'guide', label: '求职指南', icon: Compass, color: 'text-indigo-400' },
];

const TYPE_LABEL: Record<string, string> = {
  knowledge: '知识库',
  case: '案例库',
  template: '模板库',
  experience: '经验分享',
  industry: '行业洞察',
  guide: '求职指南',
};

const TYPE_COLOR: Record<string, string> = {
  knowledge: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  case: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  template: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  experience: 'text-green-400 border-green-500/30 bg-green-500/10',
  industry: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  guide: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  knowledge: BookOpen,
  case: FileCode,
  template: FileText,
  experience: Lightbulb,
  industry: Building2,
  guide: Compass,
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CareerPage() {
  const router = useRouter();
  const handleLogout = useLogout();

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Semantic search
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CareerDocument | null>(null);
  const [form, setForm] = useState({ title: '', type: 'knowledge', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // Detail view
  const [selectedDoc, setSelectedDoc] = useState<CareerDocument | null>(null);

  // AI features
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIndustry, setReportIndustry] = useState('');
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [showRecModal, setShowRecModal] = useState(false);
  const [recField, setRecField] = useState('');
  const [recResult, setRecResult] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const typeParam = filterType !== 'all' ? filterType : undefined;
      const res = await careerApi.listDocuments(typeParam);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载数据失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      setSubmitting(true);
      await careerApi.createDocument({
        title: form.title,
        type: form.type,
        content: form.content || undefined,
      });
      setShowModal(false);
      resetForm();
      await fetchDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDoc || !form.title.trim()) return;
    try {
      setSubmitting(true);
      await careerApi.updateDocument(editingDoc.id, {
        title: form.title,
        type: form.type,
        content: form.content || undefined,
      });
      setShowModal(false);
      setEditingDoc(null);
      resetForm();
      await fetchDocuments();
      if (selectedDoc?.id === editingDoc.id) {
        setSelectedDoc(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await careerApi.deleteDocument(id);
      setDeleteTarget(null);
      if (selectedDoc?.id === id) setSelectedDoc(null);
      await fetchDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除失败';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setSearchResults(null);
      const res = await careerApi.search(searchQuery, 5);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '搜索失败';
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportIndustry.trim()) return;
    try {
      setReportLoading(true);
      setReportResult(null);
      const res = await careerApi.generateIndustryReport(reportIndustry);
      setReportResult(res.data?.report ?? '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '生成报告失败';
      setError(message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    try {
      setRecLoading(true);
      setRecResult(null);
      const res = await careerApi.getRecommendations(recField || undefined);
      setRecResult(res.data?.recommendations ?? '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取推荐失败';
      setError(message);
    } finally {
      setRecLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', type: 'knowledge', content: '' });
    setEditingDoc(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (doc: CareerDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      type: doc.type,
      content: doc.content ?? '',
    });
    setShowModal(true);
  };

  // -------------------------------------------------------------------------
  // Filtered documents
  // -------------------------------------------------------------------------
  const filteredDocs = useMemo(() => {
    if (searchResults !== null) {
      // Map search results to display format
      return searchResults.map((r) => ({
        id: r.docId,
        userId: 0,
        title: r.title,
        type: r.type,
        content: r.content,
        fileUrl: null,
        vectorId: null,
        createdAt: '',
        updatedAt: '',
        _score: r.score,
      })) as (CareerDocument & { _score?: number })[];
    }

    let result = [...documents];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.content ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, searchQuery, searchResults]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // -------------------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------------------
  const renderMarkdown = (text: string) => {
    // Simple markdown rendering: bold, headers, lists
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="text-md font-semibold text-white/90 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="text-white/70 text-sm ml-4 list-disc">
            {line.replace('- ', '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Inline bold
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      return (
        <p key={i} className="text-white/70 text-sm" dangerouslySetInnerHTML={{ __html: bolded }} />
      );
    });
  };

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
              const isActive = item.key === 'career';
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
            {/* Career Vault nav item (active) */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-white border border-purple-500/20 relative"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
              <BookOpen size={18} className="text-purple-400" />
              <span>职业知识库</span>
              <ChevronRight size={14} className="ml-auto text-purple-400/60" />
            </button>
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
              <BookOpen size={20} className="text-purple-400" />
              职业知识库
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white/80">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                U
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
              职业 <span className="holo-text">知识库</span>
            </h3>
            <p className="text-white/40 text-sm">
              管理您的职业知识、案例、模板和经验，AI 驱动的智能检索与推荐
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm slide-in-up">
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

          {/* ---- Toolbar ---- */}
          <div
            className="flex flex-wrap items-center gap-3 slide-in-up"
            style={{ animationDelay: '0.15s' }}
          >
            {/* Semantic Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                placeholder="语义搜索知识库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSemanticSearch();
                }}
                className="w-full pl-9 pr-16 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 focus:bg-white/8 transition-all"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchResults !== null && (
                  <button
                    onClick={clearSearch}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={handleSemanticSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 disabled:opacity-40 transition-colors"
                >
                  {searching ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Create Document */}
            <button
              onClick={openCreateModal}
              className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm whitespace-nowrap"
              style={{ width: 'auto', borderRadius: '12px' }}
            >
              <Plus size={16} />
              新建文档
            </button>

            {/* AI Industry Report */}
            <button
              onClick={() => {
                setReportResult(null);
                setReportIndustry('');
                setShowReportModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all whitespace-nowrap"
            >
              <Sparkles size={16} />
              AI 行业报告
            </button>

            {/* AI Recommendations */}
            <button
              onClick={() => {
                setRecResult(null);
                setRecField('');
                setShowRecModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-pink-500/20 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-all whitespace-nowrap"
            >
              <TrendingUp size={16} />
              智能推荐
            </button>
          </div>

          {/* ---- Type Filter Sidebar (left) + Document List (right) ---- */}
          <div className="flex gap-6">
            {/* Type Filter */}
            <div
              className="hidden md:block w-48 flex-shrink-0 slide-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="glass-card p-4 space-y-1 sticky top-28">
                <p className="text-white/40 text-xs mb-3 px-2">文档分类</p>
                {DOC_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  const isActive = filterType === dt.key;
                  return (
                    <button
                      key={dt.key}
                      onClick={() => {
                        setFilterType(dt.key);
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                        ${
                          isActive
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon size={16} className={isActive ? dt.color : 'text-white/40'} />
                      <span>{dt.label}</span>
                      {isActive && (
                        <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                          {documents.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document List */}
            <div
              className="flex-1 slide-in-up"
              style={{ animationDelay: '0.25s' }}
            >
              {/* Mobile type filter */}
              <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-2">
                {DOC_TYPES.map((dt) => {
                  const isActive = filterType === dt.key;
                  return (
                    <button
                      key={dt.key}
                      onClick={() => {
                        setFilterType(dt.key);
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border
                        ${isActive ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/8 text-white/50'}
                      `}
                    >
                      {dt.label}
                    </button>
                  );
                })}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="text-purple-400 animate-spin" />
                  <span className="ml-3 text-white/40 text-sm">加载知识库中...</span>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center mb-5">
                    <BookOpen size={36} className="text-purple-400/50" />
                  </div>
                  <h4 className="text-white/70 font-semibold text-lg mb-2">
                    {searchResults !== null
                      ? '未找到匹配的文档'
                      : searchQuery
                      ? '没有找到匹配的文档'
                      : '知识库为空'}
                  </h4>
                  <p className="text-white/30 text-sm mb-6">
                    {searchResults !== null
                      ? '尝试调整搜索关键词'
                      : searchQuery
                      ? '尝试调整搜索关键词或筛选条件'
                      : '点击「新建文档」开始积累您的职业知识'}
                  </p>
                  {!searchQuery && searchResults === null && (
                    <button
                      onClick={openCreateModal}
                      className="btn-gradient flex items-center gap-2 px-8 py-3 text-sm"
                      style={{ width: 'auto' }}
                    >
                      <Plus size={16} />
                      创建第一篇文档
                    </button>
                  )}
                </div>
              )}

              {/* Search Results Indicator */}
              {searchResults !== null && filteredDocs.length > 0 && (
                <div className="mb-3 px-1">
                  <p className="text-white/40 text-xs">
                    语义搜索结果：找到 {filteredDocs.length} 个相关文档
                    <button
                      onClick={clearSearch}
                      className="ml-2 text-purple-400 hover:text-purple-300"
                    >
                      清除搜索
                    </button>
                  </p>
                </div>
              )}

              {/* Document Cards Grid */}
              {!loading && filteredDocs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDocs.map((doc, idx) => {
                    const TypeIcon = TYPE_ICON[doc.type] || BookOpen;
                    const isSelected = selectedDoc?.id === doc.id;
                    const score = (doc as any)._score;

                    return (
                      <div
                        key={doc.id}
                        className={`glass-card p-0 cursor-pointer transition-all duration-300 hover:border-white/15 group ${
                          isSelected ? 'ring-2 ring-purple-500/40 border-purple-500/30' : ''
                        }`}
                        onClick={() =>
                          setSelectedDoc(isSelected ? null : doc as CareerDocument)
                        }
                        style={{ animationDelay: `${0.05 * idx}s` }}
                      >
                        {/* Card header */}
                        <div className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold text-sm truncate">
                                {doc.title}
                              </h4>
                              {score !== undefined && (
                                <p className="text-purple-400 text-xs mt-0.5">
                                  相似度: {(score * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${
                                TYPE_COLOR[doc.type] || 'text-white/50 border-white/20 bg-white/5'
                              }`}
                            >
                              {TYPE_LABEL[doc.type] || doc.type}
                            </span>
                          </div>
                        </div>

                        {/* Card preview */}
                        <div className="px-4 pb-3">
                          <p className="text-white/40 text-xs line-clamp-3">
                            {(doc.content ?? '').substring(0, 150) || '暂无内容'}
                          </p>
                        </div>

                        {/* Card footer */}
                        <div
                          className="px-4 py-2.5 flex items-center justify-between border-t border-white/5"
                        >
                          <div className="flex items-center gap-2 text-white/30 text-xs">
                            <Clock size={12} />
                            <span>{formatDate(doc.createdAt) || formatDate(doc.updatedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(doc as CareerDocument);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-cyan-400 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(doc.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ---- Document Detail Panel ---- */}
          {selectedDoc && (
            <div
              className="slide-in-up glass-card p-6"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                    {(() => {
                      const Icon = TYPE_ICON[selectedDoc.type] || BookOpen;
                      return <Icon size={20} className="text-purple-400" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedDoc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOR[selectedDoc.type] || 'text-white/50 border-white/20 bg-white/5'}`}>
                        {TYPE_LABEL[selectedDoc.type] || selectedDoc.type}
                      </span>
                      <span className="text-white/30 text-xs">
                        {formatDate(selectedDoc.createdAt)} 创建
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedDoc)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    <Edit3 size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selectedDoc.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className="rounded-xl p-5 max-h-96 overflow-y-auto"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {selectedDoc.content ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    {renderMarkdown(selectedDoc.content)}
                  </div>
                ) : (
                  <p className="text-white/30 text-sm italic">暂无内容</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* CREATE / EDIT MODAL                          */}
      {/* ============================================ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />

          {/* Modal */}
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
                {editingDoc ? (
                  <>
                    <Edit3 size={18} className="text-purple-400" />
                    编辑文档
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-purple-400" />
                    新建文档
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div
              className="px-6 pb-6 space-y-4 overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 100px)' }}
            >
              {/* Title */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">
                  标题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="文档标题"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">文档类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all cursor-pointer"
                >
                  {DOC_TYPES.filter((t) => t.key !== 'all').map((t) => (
                    <option key={t.key} value={t.key} className="bg-[#0f0f2e]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 ml-1">内容</label>
                <textarea
                  placeholder="输入文档内容...（支持 Markdown 格式）"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={editingDoc ? handleUpdate : handleCreate}
                disabled={submitting || !form.title.trim()}
                className="btn-gradient flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ width: '100%', borderRadius: '12px' }}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : editingDoc ? (
                  <Edit3 size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {editingDoc ? '保存修改' : '创建文档'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* AI INDUSTRY REPORT MODAL                     */}
      {/* ============================================ */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}
          />
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden spring-in"
            style={{
              background: 'rgba(15, 15, 46, 0.92)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '90vh',
            }}
          >
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  'linear-gradient(90deg, #8B5CF6, #06B6D4, #EC4899, #A78BFA, #22D3EE)',
              }}
            />
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                AI 生成行业报告
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="px-6 pb-6 space-y-4 overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 100px)' }}
            >
              {!reportResult ? (
                <>
                  <div>
                    <label className="block text-white/50 text-xs mb-1.5 ml-1">
                      目标行业
                    </label>
                    <input
                      type="text"
                      placeholder="例如：人工智能、互联网、金融科技..."
                      value={reportIndustry}
                      onChange={(e) => setReportIndustry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateReport();
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/40 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading || !reportIndustry.trim()}
                    className="btn-gradient flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #06B6D4, #3B82F6, #8B5CF6)',
                    }}
                  >
                    {reportLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    生成行业报告
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="rounded-xl p-5 max-h-96 overflow-y-auto"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {renderMarkdown(reportResult)}
                  </div>
                  <button
                    onClick={() => setReportResult(null)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                  >
                    重新生成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* AI RECOMMENDATIONS MODAL                     */}
      {/* ============================================ */}
      {showRecModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRecModal(false)}
          />
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden spring-in"
            style={{
              background: 'rgba(15, 15, 46, 0.92)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '90vh',
            }}
          >
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  'linear-gradient(90deg, #8B5CF6, #06B6D4, #EC4899, #A78BFA, #22D3EE)',
              }}
            />
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-pink-400" />
                智能职业推荐
              </h3>
              <button
                onClick={() => setShowRecModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="px-6 pb-6 space-y-4 overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 100px)' }}
            >
              {!recResult ? (
                <>
                  <div>
                    <label className="block text-white/50 text-xs mb-1.5 ml-1">
                      职业方向（可选）
                    </label>
                    <input
                      type="text"
                      placeholder="例如：前端开发、数据分析、产品经理..."
                      value={recField}
                      onChange={(e) => setRecField(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGetRecommendations();
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-pink-500/40 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleGetRecommendations}
                    disabled={recLoading}
                    className="btn-gradient flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #EC4899, #8B5CF6, #3B82F6)',
                    }}
                  >
                    {recLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <TrendingUp size={16} />
                    )}
                    获取职业推荐
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="rounded-xl p-5 max-h-96 overflow-y-auto"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {renderMarkdown(recResult)}
                  </div>
                  <button
                    onClick={() => setRecResult(null)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                  >
                    重新生成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* DELETE CONFIRMATION                          */}
      {/* ============================================ */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 spring-in"
            style={{
              background: 'rgba(15, 15, 46, 0.95)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">确认删除</h3>
              <p className="text-white/50 text-sm mb-6">
                此操作不可撤销。确定要删除这个文档吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
