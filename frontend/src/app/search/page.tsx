'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Globe, Building2, TrendingUp, DollarSign,
  Loader2, Sparkles, Clock, RotateCcw, ExternalLink, ChevronRight, X,
} from 'lucide-react';
import { searchApi } from '@/lib/api';

/* ---- Types ---- */
interface SearchResult {
  query: string;
  results?: string[];
  summary?: string;
  analysis?: string;
  report?: string;
  timestamp: string;
}

interface HistoryItem {
  type: string;
  query: string;
  results: any;
  createdAt: string;
}

/* ---- Stars ---- */
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
    opacity: 0.15 + Math.random() * 0.4,
    size: Math.random() > 0.9 ? 3 : Math.random() > 0.7 ? 2 : 1,
  }));
}

const stars = generateStars(50);

/* ---- Tabs ---- */
const tabs = [
  { key: 'market', label: '市场分析', icon: Globe },
  { key: 'company', label: '公司调研', icon: Building2 },
  { key: 'industry', label: '行业趋势', icon: TrendingUp },
  { key: 'salary', label: '薪资查询', icon: DollarSign },
] as const;

/* ===================================================== */
/* Toast                                                   */
/* ===================================================== */
function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[9999] slide-in-up">
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl"
        style={{ background: 'rgba(15,15,46,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <Sparkles size={16} className="text-purple-400" />
        <span className="text-white/90 text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 text-white/30 hover:text-white/60"><X size={14} /></button>
      </div>
    </div>
  );
}

/* ===================================================== */
/* MAIN PAGE                                               */
/* ===================================================== */
export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<string>('market');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  /* Form state */
  const [marketQuery, setMarketQuery] = useState('');
  const [marketIndustry, setMarketIndustry] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [salaryPosition, setSalaryPosition] = useState('');
  const [salaryLocation, setSalaryLocation] = useState('');

  /* Toast */
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => { setMounted(true); }, []);

  /* Load history */
  useEffect(() => {
    if (!mounted) return;
    searchApi.getHistory()
      .then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {});
  }, [mounted]);

  /* ---- Search handlers ---- */
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      switch (activeTab) {
        case 'market':
          res = await searchApi.searchMarket(marketQuery || '求职市场', marketIndustry, marketLocation);
          break;
        case 'company':
          res = await searchApi.researchCompany(companyName || '互联网公司');
          break;
        case 'industry':
          res = await searchApi.industryTrends(industryName || '互联网');
          break;
        case 'salary':
          res = await searchApi.salaryBenchmark(salaryPosition || '软件工程师', salaryLocation);
          break;
        default:
          return;
      }
      const data = res.data?.data || res.data;
      setResult(data);
      // Refresh history
      searchApi.getHistory().then(r => {
        const d = r.data?.data || r.data;
        if (Array.isArray(d)) setHistory(d);
      }).catch(() => {});
    } catch {
      setToast({ visible: true, message: '搜索失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, marketQuery, marketIndustry, marketLocation, companyName, industryName, salaryPosition, salaryLocation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  /* ---- Render ---- */
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--dark-900)' }}>
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ visible: false, message: '' })} />

      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
      </div>
      <div className="star-field">
        {stars.map(s => (
          <div key={s.id} className="star" style={{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity, animationDelay: s.animationDelay, animationDuration: s.animationDuration }} />
        ))}
      </div>

      {/* Top nav */}
      <header className="relative z-20 px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Search size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base hidden sm:block">ResumePilot AI</span>
          <ChevronRight size={14} className="text-white/20 hidden sm:block" />
          <span className="text-white/50 text-sm">联网调研</span>
        </div>
        <a href="/dashboard" className="text-white/40 text-sm hover:text-white/70 transition-colors">返回仪表盘</a>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex gap-5 p-5" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Left sidebar - History */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-3 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card p-4 flex-1 overflow-y-auto">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={12} />
              历史记录
            </h3>
            {history.length === 0 ? (
              <p className="text-white/25 text-xs text-center py-4">暂无搜索记录</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-purple-400/70 uppercase">{h.type}</span>
                    <p className="text-white/60 text-xs mt-0.5 truncate">{h.query}</p>
                    <p className="text-white/20 text-[10px] mt-0.5">
                      {new Date(h.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 slide-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Tab bar */}
          <div className="glass-card p-1.5 flex items-center gap-1 flex-shrink-0">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setResult(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.key
                      ? 'bg-purple-500/15 text-white border border-purple-500/25'
                      : 'text-white/45 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search form */}
          <div className="glass-card p-5 flex-shrink-0">
            {activeTab === 'market' && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">搜索关键词</label>
                  <input value={marketQuery} onChange={e => setMarketQuery(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="如：前端工程师 招聘 2025" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">行业 (可选)</label>
                    <input value={marketIndustry} onChange={e => setMarketIndustry(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="如：互联网" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">城市 (可选)</label>
                    <input value={marketLocation} onChange={e => setMarketLocation(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="如：北京" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div>
                <label className="text-white/50 text-xs mb-1 block">公司名称</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="如：字节跳动" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
              </div>
            )}

            {activeTab === 'industry' && (
              <div>
                <label className="text-white/50 text-xs mb-1 block">行业名称</label>
                <input value={industryName} onChange={e => setIndustryName(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="如：人工智能" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
              </div>
            )}

            {activeTab === 'salary' && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">职位</label>
                  <input value={salaryPosition} onChange={e => setSalaryPosition(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="如：高级前端工程师" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">城市 (可选)</label>
                  <input value={salaryLocation} onChange={e => setSalaryLocation(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="如：上海" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40" />
                </div>
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-gradient flex items-center justify-center gap-2 w-full py-3 mt-4 !rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>搜索中...</span></>
              ) : (
                <><Search size={18} /><span>开始调研</span></>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="glass-card p-5 flex-1 slide-in-up">
              {activeTab === 'market' && result.summary && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <Globe size={18} className="text-purple-400" />
                    市场分析
                  </h3>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.summary}
                  </div>
                </div>
              )}
              {activeTab === 'company' && result.analysis && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <Building2 size={18} className="text-purple-400" />
                    公司分析报告
                  </h3>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.analysis}
                  </div>
                </div>
              )}
              {activeTab === 'industry' && result.report && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-400" />
                    行业分析报告
                  </h3>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.report}
                  </div>
                </div>
              )}
              {activeTab === 'salary' && result.analysis && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <DollarSign size={18} className="text-purple-400" />
                    薪资分析
                  </h3>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.analysis}
                  </div>
                </div>
              )}

              {/* Source snippets */}
              {result.results && result.results.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">搜索来源</h4>
                  <div className="space-y-1.5">
                    {result.results.map((r, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-white/45 text-xs leading-relaxed">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-white/20 text-[10px] mt-4">
                调研时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
