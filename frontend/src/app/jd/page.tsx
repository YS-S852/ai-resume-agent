'use client';

import StarField from '@/components/StarField';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
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
  Sparkles,
  Rocket,
  LogOut,
  Settings,
  Menu,
  X,
  Loader2,
  Trash2,
  Save,
  BarChart3,
  Bookmark,
  Building2,
  Clock,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Tag,
  AlertCircle,
  CheckCircle2,
  Star,
  Zap,
  Gift,
  Upload,
  Link,
  Clipboard,
  Image,
  BookOpen,
} from 'lucide-react';
import { jdApi, aiApi, jdExtractApi } from '@/lib/api';

/* =====================================================
   TYPES
   ===================================================== */
interface SavedJD {
  id: number;
  title: string;
  company: string;
  rawContent: string;
  createdAt?: string;
  analysisResult?: string | null;
}

interface ParsedJD {
  jobTitle?: string;
  company?: string;
  department?: string;
  experienceRequired?: string;
  educationRequired?: string;
  salaryRange?: string;
  location?: string;
  coreSkills?: string[];
  niceToHave?: string[];
  responsibilities?: string[];
  benefits?: string[];
  keywords?: string[];
}

interface AnalysisResult {
  parsed: ParsedJD;
  suggestions: string[];
}

interface MatchResult {
  overallScore?: number;
  skillMatch?: number;
  experienceMatch?: number;
  educationMatch?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  recommendations?: string[];
}

/* =====================================================
   SIDEBAR NAV ITEMS
   ===================================================== */
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

/* =====================================================
   TOAST COMPONENT
   ===================================================== */
function Toast({
  message,
  type,
  visible,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const borderColor =
    type === 'success'
      ? 'rgba(34, 197, 94, 0.3)'
      : type === 'error'
        ? 'rgba(239, 68, 68, 0.3)'
        : 'rgba(139, 92, 246, 0.3)';

  const shadowColor =
    type === 'success'
      ? 'rgba(34, 197, 94, 0.2)'
      : type === 'error'
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(139, 92, 246, 0.2)';

  const IconComp = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Sparkles;
  const iconColor =
    type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-purple-400';

  return (
    <div className="fixed top-6 right-6 z-[9999] slide-in-up">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl"
        style={{
          background: 'rgba(15, 15, 46, 0.9)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
          boxShadow: `0 8px 32px ${shadowColor}`,
        }}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            type === 'success'
              ? 'bg-green-500/20'
              : type === 'error'
                ? 'bg-red-500/20'
                : 'bg-purple-500/20'
          }`}
        >
          <IconComp size={16} className={iconColor} />
        </div>
        <span className="text-white/90 text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   FILE DROP ZONE COMPONENT
   ===================================================== */
function FileDropZone({
  accept,
  label,
  icon: IconComp,
  loading,
  onFile,
}: {
  accept: string;
  label: string;
  icon: React.ElementType;
  loading: boolean;
  onFile: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFile],
  );

  return (
    <div
      onClick={() => !loading && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl border-2 border-dashed
        transition-all duration-200 cursor-pointer select-none
        ${dragOver
          ? 'border-purple-400/60 bg-purple-500/10'
          : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      {loading ? (
        <>
          <Loader2 size={32} className="animate-spin text-purple-400" />
          <span className="text-purple-400/80 text-sm font-medium">正在处理...</span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <IconComp size={24} className="text-purple-400/80" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium">{label}</p>
            <p className="text-white/25 text-xs mt-1">支持拖拽上传，单文件不超过 10MB</p>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

/* =====================================================
   MAIN PAGE COMPONENT
   ===================================================== */
export default function JDAnalysisPage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('jd');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---- Input State ---- */
  const [jdTitle, setJdTitle] = useState('');
  const [jdCompany, setJdCompany] = useState('');
  const [rawJD, setRawJD] = useState('');

  /* ---- Multi-Input State ---- */
  const [inputTab, setInputTab] = useState<'text' | 'image' | 'pdf' | 'link'>('text');
  const [extractLoading, setExtractLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  /* ---- Analysis State ---- */
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  /* ---- Saved JD List ---- */
  const [savedJDs, setSavedJDs] = useState<SavedJD[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedJDId, setSelectedJDId] = useState<number | null>(null);

  /* ---- Match State ---- */
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  /* ---- Save State ---- */
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedCurrentId, setSavedCurrentId] = useState<number | null>(null);

  /* ---- Toast ---- */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  /* =====================================================
     EFFECTS
     ===================================================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Load saved JDs on mount */
  useEffect(() => {
    if (!mounted) return;
    fetchSavedJDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* =====================================================
     FETCH SAVED JDs
     ===================================================== */
  const fetchSavedJDs = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await jdApi.list();
      const data = res.data?.data || res.data || [];
      setSavedJDs(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail - user may not have any saved JDs
      setSavedJDs([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  /* =====================================================
     AI ANALYZE
     ===================================================== */
  const handleAnalyze = useCallback(async () => {
    if (!rawJD.trim()) {
      showToast('请先粘贴职位描述 (JD) 内容', 'error');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setMatchResult(null);
    setSavedCurrentId(null);

    try {
      const res = await aiApi.analyzeJD(rawJD);
      const data = res.data?.data || res.data;
      if (data && data.parsed) {
        setAnalysisResult({
          parsed: data.parsed,
          suggestions: data.suggestions || [],
        });
        // Auto-fill title and company from parsed result if empty
        if (!jdTitle && data.parsed.jobTitle) {
          setJdTitle(data.parsed.jobTitle);
        }
        if (!jdCompany && data.parsed.company) {
          setJdCompany(data.parsed.company);
        }
        showToast('JD 解析完成!', 'success');
      } else {
        throw new Error('解析结果为空');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'AI 分析失败，请稍后重试'
          : 'AI 分析失败，请稍后重试';
      setAnalysisError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setAnalysisLoading(false);
    }
  }, [rawJD, jdTitle, jdCompany, showToast]);

  /* =====================================================
     SAVE JD
     ===================================================== */
  const handleSaveJD = useCallback(async () => {
    if (!rawJD.trim()) {
      showToast('没有可保存的内容', 'error');
      return;
    }

    const title = jdTitle.trim() || analysisResult?.parsed?.jobTitle || '未命名 JD';
    const company = jdCompany.trim() || analysisResult?.parsed?.company || '';

    setSaveLoading(true);
    try {
      const res = await jdApi.create({ title, company, rawContent: rawJD });
      const savedData = res.data?.data || res.data;
      const newId = savedData?.id || savedData?.ID;
      if (newId) {
        setSavedCurrentId(newId);
      }
      showToast('JD 已成功保存!', 'success');
      fetchSavedJDs();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '保存失败，请稍后重试'
          : '保存失败，请稍后重试';
      showToast(errorMsg, 'error');
    } finally {
      setSaveLoading(false);
    }
  }, [rawJD, jdTitle, jdCompany, analysisResult, showToast, fetchSavedJDs]);

  /* =====================================================
     MATCH ANALYSIS
     ===================================================== */
  const handleMatch = useCallback(async () => {
    const jdId = savedCurrentId || selectedJDId;
    if (!jdId) {
      showToast('请先保存 JD 后再进行匹配度分析', 'error');
      return;
    }

    setMatchLoading(true);
    setMatchResult(null);
    try {
      const res = await jdApi.match(jdId);
      const data = res.data?.data || res.data;
      if (data) {
        setMatchResult(data);
        showToast('匹配度分析完成!', 'success');
      } else {
        throw new Error('匹配结果为空');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '匹配分析失败，请稍后重试'
          : '匹配分析失败，请稍后重试';
      showToast(errorMsg, 'error');
    } finally {
      setMatchLoading(false);
    }
  }, [savedCurrentId, selectedJDId, showToast]);

  /* =====================================================
     DELETE JD
     ===================================================== */
  const handleDeleteJD = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await jdApi.delete(id);
        showToast('JD 已删除', 'success');
        if (selectedJDId === id) {
          setSelectedJDId(null);
        }
        fetchSavedJDs();
      } catch {
        showToast('删除失败', 'error');
      }
    },
    [selectedJDId, showToast, fetchSavedJDs],
  );

  /* =====================================================
     LOAD SAVED JD
     ===================================================== */
  const handleLoadJD = useCallback(
    async (jd: SavedJD) => {
      setSelectedJDId(jd.id);
      setJdTitle(jd.title || '');
      setJdCompany(jd.company || '');
      setRawJD(jd.rawContent || '');
      setMatchResult(null);
      setSavedCurrentId(jd.id);

      // If there's an existing analysis result, try to parse it
      if (jd.analysisResult) {
        try {
          const parsed = typeof jd.analysisResult === 'string' ? JSON.parse(jd.analysisResult) : jd.analysisResult;
          setAnalysisResult(parsed);
        } catch {
          // Re-analyze if we can't parse
          setAnalysisResult(null);
        }
      } else {
        setAnalysisResult(null);
      }
    },
    [],
  );

  /* =====================================================
     MULTI-INPUT EXTRACTION HANDLERS
     ===================================================== */

  /** Handle image file upload -> OCR */
  const handleImageUpload = useCallback(async (file: File) => {
    setExtractLoading(true);
    try {
      const res = await jdExtractApi.extractFromImage(file);
      const text = res.data?.text || '';
      if (text) {
        setRawJD(text);
        showToast('图片文字提取成功!', 'success');
      } else {
        showToast('未能从图片中提取到文字', 'error');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '图片提取失败'
          : '图片提取失败';
      showToast(errorMsg, 'error');
    } finally {
      setExtractLoading(false);
    }
  }, [showToast]);

  /** Handle PDF file upload -> parse */
  const handlePdfUpload = useCallback(async (file: File) => {
    setExtractLoading(true);
    try {
      const res = await jdExtractApi.extractFromPdf(file);
      const text = res.data?.text || '';
      if (text) {
        setRawJD(text);
        showToast('PDF 内容提取成功!', 'success');
      } else {
        showToast('未能从 PDF 中提取到文字', 'error');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'PDF 提取失败'
          : 'PDF 提取失败';
      showToast(errorMsg, 'error');
    } finally {
      setExtractLoading(false);
    }
  }, [showToast]);

  /** Handle link URL -> fetch & extract */
  const handleLinkExtract = useCallback(async () => {
    if (!linkUrl.trim()) {
      showToast('请输入链接地址', 'error');
      return;
    }
    setExtractLoading(true);
    try {
      const res = await jdExtractApi.extractFromLink(linkUrl.trim());
      const text = res.data?.text || '';
      if (text) {
        setRawJD(text);
        showToast('链接内容提取成功!', 'success');
      } else {
        showToast('未能从链接中提取到文字', 'error');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '链接提取失败'
          : '链接提取失败';
      showToast(errorMsg, 'error');
    } finally {
      setExtractLoading(false);
    }
  }, [linkUrl, showToast]);

  /** Handle clipboard one-click import */
  const handleClipboardImport = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        // Optionally send to backend for structuring
        try {
          const res = await jdExtractApi.extractFromClipboard(clipboardText);
          const structured = res.data?.text || clipboardText;
          setRawJD(structured);
        } catch {
          // If backend call fails, just paste raw text
          setRawJD(clipboardText);
        }
        showToast('剪贴板内容已导入!', 'success');
      } else {
        showToast('剪贴板为空', 'error');
      }
    } catch {
      showToast('无法读取剪贴板，请检查浏览器权限', 'error');
    }
  }, [showToast]);

  /* =====================================================
     STYLE HELPERS
     ===================================================== */
  const inputCls =
    'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/40 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/30';
  const labelCls = 'block text-white/50 text-xs mb-1.5 font-medium';

  /* =====================================================
     RENDER
     ===================================================== */
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dark-900)' }}>
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      {/* ============================================ */}
      {/* AURORA BACKGROUND                             */}
      {/* ============================================ */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
      </div>

      {/* Star field */}
      <StarField count={50} />

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
                <NextLink
                  key={item.key}
                  href={item.href}
                  prefetch
                  onClick={() => setActiveNav(item.key)}
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
                  {isActive && <ChevronRight size={14} className="ml-auto text-purple-400/60" />}
                </NextLink>
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Target size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-base hidden sm:block">JD 智能分析</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="搜索功能、简历..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 focus:bg-white/[0.08] transition-all w-52"
              />
            </div>
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

        {/* ============================================ */}
        {/* TWO-COLUMN LAYOUT                          */}
        {/* ============================================ */}
        <div className="flex-1 flex gap-5 p-5" style={{ height: 'calc(100vh - 72px)' }}>
          {/* ======================================== */}
          {/* LEFT PANEL (45%) - INPUT & HISTORY       */}
          {/* ======================================== */}
          <div
            className="flex-[0.45] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 slide-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {/* Page Title */}
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target size={20} className="text-cyan-400" />
                JD 智能分析
              </h2>
              <p className="text-white/40 text-sm mt-1">粘贴职位描述，AI 为您深度解析岗位需求</p>
            </div>

            {/* ==================================== */}
            {/* JD INPUT FORM                         */}
            {/* ==================================== */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-purple-400" />
                <h3 className="text-white/80 text-sm font-semibold">输入职位描述</h3>
              </div>

              {/* ---- Input Method Tab Bar ---- */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                {([
                  { key: 'text' as const, label: '粘贴文本', icon: Clipboard },
                  { key: 'image' as const, label: '上传图片', icon: Image },
                  { key: 'pdf' as const, label: '上传PDF', icon: Upload },
                  { key: 'link' as const, label: '粘贴链接', icon: Link },
                ] as const).map((tab) => {
                  const TIcon = tab.icon;
                  const isActive = inputTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setInputTab(tab.key)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium
                        transition-all duration-200
                        ${isActive
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
                        }
                      `}
                    >
                      <TIcon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ---- Conditional Input Zone ---- */}
              {inputTab === 'text' && (
                <div>
                  {/* Title & Company Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={labelCls}>职位名称</label>
                      <div className="relative">
                        <Briefcase
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                        />
                        <input
                          className={`${inputCls} !pl-9`}
                          placeholder="如: 前端工程师"
                          value={jdTitle}
                          onChange={(e) => setJdTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>公司名称</label>
                      <div className="relative">
                        <Building2
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                        />
                        <input
                          className={`${inputCls} !pl-9`}
                          placeholder="如: 字节跳动"
                          value={jdCompany}
                          onChange={(e) => setJdCompany(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* JD Content Textarea */}
                  <div>
                    <label className={labelCls}>职位描述 (JD) 内容</label>
                    <textarea
                      className={`${inputCls} resize-none leading-relaxed`}
                      rows={10}
                      placeholder={`请粘贴完整的职位描述内容...\n\n例如:\n- 岗位职责\n- 任职要求\n- 福利待遇\n- 工作地点等`}
                      value={rawJD}
                      onChange={(e) => setRawJD(e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-white/20 text-xs">{rawJD.length} 字</span>
                      <div className="flex items-center gap-2">
                        {/* Clipboard Import Button */}
                        <button
                          onClick={handleClipboardImport}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/30 transition-all duration-200"
                          title="从剪贴板导入"
                        >
                          <Clipboard size={13} />
                          <span>剪贴板导入</span>
                        </button>
                        {rawJD && (
                          <button
                            onClick={() => {
                              setRawJD('');
                              setAnalysisResult(null);
                              setMatchResult(null);
                            }}
                            className="text-white/30 text-xs hover:text-white/60 transition-colors"
                          >
                            清空内容
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Image Upload Zone ---- */}
              {inputTab === 'image' && (
                <FileDropZone
                  accept="image/*"
                  label="点击或拖拽上传截图 / 图片"
                  icon={Image}
                  loading={extractLoading}
                  onFile={handleImageUpload}
                />
              )}

              {/* ---- PDF Upload Zone ---- */}
              {inputTab === 'pdf' && (
                <FileDropZone
                  accept=".pdf"
                  label="点击或拖拽上传 PDF 文件"
                  icon={Upload}
                  loading={extractLoading}
                  onFile={handlePdfUpload}
                />
              )}

              {/* ---- Link Input Zone ---- */}
              {inputTab === 'link' && (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>职位链接 URL</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                        />
                        <input
                          className={`${inputCls} !pl-9`}
                          placeholder="粘贴招聘页面的链接地址..."
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLinkExtract();
                          }}
                        />
                      </div>
                      <button
                        onClick={handleLinkExtract}
                        disabled={extractLoading || !linkUrl.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {extractLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Link size={14} />
                        )}
                        <span>{extractLoading ? '提取中...' : '提取'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Extracted Text Preview & Clipboard Button (non-text tabs) ---- */}
              {inputTab !== 'text' && rawJD && (
                <div>
                  <label className={labelCls}>
                    已提取的文字 ({rawJD.length} 字)
                  </label>
                  <textarea
                    className={`${inputCls} resize-none leading-relaxed`}
                    rows={6}
                    value={rawJD}
                    onChange={(e) => setRawJD(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/20 text-xs">您可以编辑提取后的文字</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClipboardImport}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/30 transition-all duration-200"
                      >
                        <Clipboard size={13} />
                        <span>剪贴板导入</span>
                      </button>
                      {rawJD && (
                        <button
                          onClick={() => {
                            setRawJD('');
                            setAnalysisResult(null);
                            setMatchResult(null);
                          }}
                          className="text-white/30 text-xs hover:text-white/60 transition-colors"
                        >
                          清空内容
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analysisLoading || extractLoading || !rawJD.trim()}
                className="btn-gradient flex items-center justify-center gap-2 !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {analysisLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI 正在深度解析...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>AI 智能分析</span>
                  </>
                )}
              </button>

              {/* ---- Extraction Loading Overlay ---- */}
              {extractLoading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                  <span className="text-purple-400/80 text-xs">
                    {inputTab === 'image' && '正在 OCR 识别图片文字...'}
                    {inputTab === 'pdf' && '正在解析 PDF 内容...'}
                    {inputTab === 'link' && '正在提取链接内容...'}
                  </span>
                </div>
              )}
            </div>

            {/* ==================================== */}
            {/* SAVED JDs HISTORY                     */}
            {/* ==================================== */}
            <div className="glass-card p-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Bookmark size={13} />
                  已保存的 JD
                </h3>
                <span className="text-white/20 text-xs">{savedJDs.length} 条记录</span>
              </div>

              {listLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-purple-400/50" />
                </div>
              ) : savedJDs.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark size={28} className="text-white/10 mx-auto mb-2" />
                  <p className="text-white/25 text-sm">暂无保存的 JD</p>
                  <p className="text-white/15 text-xs mt-1">分析后点击「保存此 JD」即可收藏</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedJDs.map((jd) => {
                    const isActive = selectedJDId === jd.id;
                    return (
                      <div
                        key={jd.id}
                        onClick={() => handleLoadJD(jd)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                          ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-500/15 to-cyan-500/10 border border-purple-500/25'
                              : 'hover:bg-white/5 border border-transparent'
                          }
                        `}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-cyan-500/20' : 'bg-white/5'
                          }`}
                        >
                          <Target size={14} className={isActive ? 'text-cyan-400' : 'text-white/30'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/70'}`}
                          >
                            {jd.title || '未命名 JD'}
                          </p>
                          <p className="text-white/30 text-xs flex items-center gap-1.5 mt-0.5">
                            {jd.company && <span>{jd.company}</span>}
                            {jd.company && jd.createdAt && <span className="text-white/10">|</span>}
                            {jd.createdAt && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(jd.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteJD(jd.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0 ml-1"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ======================================== */}
          {/* RIGHT PANEL (55%) - RESULTS              */}
          {/* ======================================== */}
          <div
            className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 slide-in-up"
            style={{ animationDelay: '0.25s' }}
          >
            {/* ---- LOADING STATE ---- */}
            {analysisLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center spring-in">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        border: '3px solid transparent',
                        borderTopColor: '#8B5CF6',
                        borderRightColor: '#06B6D4',
                        animationDuration: '1.5s',
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full animate-spin"
                      style={{
                        border: '2px solid transparent',
                        borderBottomColor: '#EC4899',
                        borderLeftColor: '#A78BFA',
                        animationDuration: '2s',
                        animationDirection: 'reverse',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target size={24} className="text-purple-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-white/70 text-base font-medium mb-2">AI 正在深度解析...</p>
                  <p className="text-white/30 text-sm">正在提取关键信息、技能要求与岗位洞察</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {['解析结构', '提取技能', '分析关键词', '生成建议'].map((step, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{
                            backgroundColor: i === 0 ? '#8B5CF6' : i === 1 ? '#06B6D4' : i === 2 ? '#EC4899' : '#A78BFA',
                            animationDelay: `${i * 0.3}s`,
                          }}
                        />
                        <span className="text-white/25 text-xs">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---- ERROR STATE ---- */}
            {!analysisLoading && analysisError && (
              <div className="flex-1 flex items-center justify-center">
                <div className="glass-card p-8 max-w-md text-center slide-in-up">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">分析失败</h3>
                  <p className="text-white/40 text-sm mb-6">{analysisError}</p>
                  <button
                    onClick={handleAnalyze}
                    className="btn-gradient !w-auto px-8 !py-3 inline-flex items-center gap-2"
                  >
                    <Zap size={16} />
                    重新分析
                  </button>
                </div>
              </div>
            )}

            {/* ---- EMPTY STATE ---- */}
            {!analysisLoading && !analysisError && !analysisResult && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center spring-in">
                  <div className="w-24 h-24 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Target size={40} className="text-white/15" />
                  </div>
                  <h3 className="text-white/50 text-lg font-medium mb-2">等待分析</h3>
                  <p className="text-white/25 text-sm max-w-sm mx-auto leading-relaxed">
                    在左侧粘贴职位描述内容，点击「AI 智能分析」按钮，
                    <br />
                    即可获取结构化的岗位需求解析
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-8">
                    {[
                      { icon: Lightbulb, label: '技能提取' },
                      { icon: ListChecks, label: '职责梳理' },
                      { icon: Tag, label: '关键词分析' },
                      { icon: BarChart3, label: '匹配建议' },
                    ].map((feat, i) => {
                      const FIcon = feat.icon;
                      return (
                        <div key={i} className="text-center">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-2 border border-white/5">
                            <FIcon size={18} className="text-white/20" />
                          </div>
                          <span className="text-white/20 text-xs">{feat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ---- ANALYSIS RESULTS ---- */}
            {!analysisLoading && !analysisError && analysisResult && (
              <div className="flex flex-col gap-4">
                {/* Action Bar */}
                <div className="glass-card p-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-semibold">解析完成</p>
                      <p className="text-white/30 text-xs">已提取 {Object.keys(analysisResult.parsed).length} 个维度的信息</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveJD}
                      disabled={saveLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 disabled:opacity-50"
                      style={{
                        background: savedCurrentId
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(139, 92, 246, 0.15)',
                        border: `1px solid ${savedCurrentId ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                      }}
                    >
                      {saveLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : savedCurrentId ? (
                        <CheckCircle2 size={14} className="text-green-400" />
                      ) : (
                        <Save size={14} className="text-purple-400" />
                      )}
                      <span>{savedCurrentId ? '已保存' : '保存此 JD'}</span>
                    </button>
                    <button
                      onClick={handleMatch}
                      disabled={matchLoading || (!savedCurrentId && !selectedJDId)}
                      className="btn-gradient !py-2 !px-4 !text-sm !rounded-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      {matchLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <BarChart3 size={14} />
                      )}
                      <span>{matchLoading ? '分析中...' : '匹配度分析'}</span>
                    </button>
                  </div>
                </div>

                {/* ---- Top Info Cards ---- */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  {/* Job Title */}
                  {(analysisResult.parsed.jobTitle || jdTitle) && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={14} className="text-purple-400" />
                        <span className="text-white/40 text-xs">职位名称</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {analysisResult.parsed.jobTitle || jdTitle}
                      </p>
                    </div>
                  )}

                  {/* Company */}
                  {(analysisResult.parsed.company || jdCompany) && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={14} className="text-cyan-400" />
                        <span className="text-white/40 text-xs">公司</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {analysisResult.parsed.company || jdCompany}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {analysisResult.parsed.experienceRequired && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-white/40 text-xs">经验要求</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {analysisResult.parsed.experienceRequired}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {analysisResult.parsed.educationRequired && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap size={14} className="text-green-400" />
                        <span className="text-white/40 text-xs">学历要求</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {analysisResult.parsed.educationRequired}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  {analysisResult.parsed.location && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={14} className="text-pink-400" />
                        <span className="text-white/40 text-xs">工作地点</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{analysisResult.parsed.location}</p>
                    </div>
                  )}

                  {/* Salary */}
                  {analysisResult.parsed.salaryRange && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={14} className="text-yellow-400" />
                        <span className="text-white/40 text-xs">薪资范围</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{analysisResult.parsed.salaryRange}</p>
                    </div>
                  )}
                </div>

                {/* ---- Core Skills ---- */}
                {analysisResult.parsed.coreSkills && analysisResult.parsed.coreSkills.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <Zap size={14} className="text-purple-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">核心技能要求</h3>
                      <span className="text-white/20 text-xs ml-auto">
                        {analysisResult.parsed.coreSkills.length} 项
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.parsed.coreSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#A78BFA',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Nice-to-Have Skills ---- */}
                {analysisResult.parsed.niceToHave && analysisResult.parsed.niceToHave.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <Star size={14} className="text-cyan-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">加分技能</h3>
                      <span className="text-white/20 text-xs ml-auto">
                        {analysisResult.parsed.niceToHave.length} 项
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.parsed.niceToHave.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default"
                          style={{
                            background: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            color: '#22D3EE',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Responsibilities ---- */}
                {analysisResult.parsed.responsibilities && analysisResult.parsed.responsibilities.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
                        <ListChecks size={14} className="text-pink-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">岗位职责</h3>
                      <span className="text-white/20 text-xs ml-auto">
                        {analysisResult.parsed.responsibilities.length} 项
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.parsed.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 group">
                          <div className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-purple-500/10 transition-colors">
                            <span className="text-white/25 text-[10px] font-bold">{i + 1}</span>
                          </div>
                          <span className="text-white/65 text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ---- Keywords ---- */}
                {analysisResult.parsed.keywords && analysisResult.parsed.keywords.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <Tag size={14} className="text-amber-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">关键词</h3>
                      <span className="text-white/30 text-xs ml-auto">建议在简历中体现</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.parsed.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default"
                          style={{
                            background:
                              i % 3 === 0
                                ? 'rgba(245, 158, 11, 0.12)'
                                : i % 3 === 1
                                  ? 'rgba(139, 92, 246, 0.12)'
                                  : 'rgba(6, 182, 212, 0.12)',
                            border: `1px solid ${
                              i % 3 === 0
                                ? 'rgba(245, 158, 11, 0.25)'
                                : i % 3 === 1
                                  ? 'rgba(139, 92, 246, 0.25)'
                                  : 'rgba(6, 182, 212, 0.25)'
                            }`,
                            color:
                              i % 3 === 0 ? '#FBBF24' : i % 3 === 1 ? '#A78BFA' : '#22D3EE',
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Benefits ---- */}
                {analysisResult.parsed.benefits && analysisResult.parsed.benefits.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                        <Gift size={14} className="text-green-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">福利待遇</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.parsed.benefits.map((b, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            background: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            color: '#4ADE80',
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Optimization Suggestions ---- */}
                {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/15 to-cyan-500/15 flex items-center justify-center">
                        <Lightbulb size={14} className="text-yellow-300" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">优化建议</h3>
                    </div>
                    <div className="space-y-3">
                      {analysisResult.suggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 rounded-xl transition-colors hover:bg-white/[0.03]"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background:
                                i % 2 === 0
                                  ? 'rgba(139, 92, 246, 0.15)'
                                  : 'rgba(6, 182, 212, 0.15)',
                            }}
                          >
                            <span
                              className="text-xs font-bold"
                              style={{ color: i % 2 === 0 ? '#A78BFA' : '#22D3EE' }}
                            >
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-white/75 text-sm leading-relaxed">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Match Result ---- */}
                {matchResult && (
                  <div className="glass-card p-5 slide-in-up">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500/15 to-emerald-500/15 flex items-center justify-center">
                        <BarChart3 size={14} className="text-green-400" />
                      </div>
                      <h3 className="text-white/90 text-sm font-semibold">匹配度分析</h3>
                    </div>

                    {/* Overall Score */}
                    {matchResult.overallScore !== undefined && (
                      <div className="flex items-center gap-6 mb-5">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="none"
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="none"
                              stroke="url(#scoreGradient)"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${matchResult.overallScore * 2.64} 264`}
                            />
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#06B6D4" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-white text-2xl font-bold">{matchResult.overallScore}</span>
                              <span className="text-white/30 text-xs block -mt-0.5">分</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[
                            { label: '技能匹配', value: matchResult.skillMatch, color: '#8B5CF6' },
                            { label: '经验匹配', value: matchResult.experienceMatch, color: '#06B6D4' },
                            { label: '学历匹配', value: matchResult.educationMatch, color: '#EC4899' },
                          ].map((item, i) => (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white/50 text-xs">{item.label}</span>
                                <span className="text-white/70 text-xs font-medium">{item.value ?? '--'}%</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${item.value ?? 0}%`,
                                    backgroundColor: item.color,
                                    boxShadow: `0 0 8px ${item.color}40`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched & Missing Skills */}
                    <div className="grid grid-cols-2 gap-3">
                      {matchResult.matchedSkills && matchResult.matchedSkills.length > 0 && (
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: 'rgba(34, 197, 94, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.1)',
                          }}
                        >
                          <h4 className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            已匹配技能
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResult.matchedSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md text-[11px]"
                                style={{
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  color: '#4ADE80',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {matchResult.missingSkills && matchResult.missingSkills.length > 0 && (
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                          }}
                        >
                          <h4 className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            待提升技能
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResult.missingSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md text-[11px]"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#FCA5A5',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {matchResult.recommendations && matchResult.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <h4 className="text-white/70 text-xs font-semibold mb-2 flex items-center gap-1.5">
                          <Lightbulb size={12} className="text-yellow-300" />
                          匹配建议
                        </h4>
                        <ul className="space-y-1.5">
                          {matchResult.recommendations.map((rec, i) => (
                            <li key={i} className="text-white/50 text-xs leading-relaxed flex items-start gap-2">
                              <span className="text-purple-400/60 mt-0.5 flex-shrink-0">-</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
