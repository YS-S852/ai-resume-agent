'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Award,
  TrendingUp,
  BarChart3,
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  ChevronLeft,
  UserCircle,
  Lightbulb,
  MessageSquare,
  Star,
  ArrowUp,
  AlertCircle,
} from 'lucide-react';
import { interviewApi } from '@/lib/api';

interface DashboardData {
  totalInterviews: number;
  averageScore: number;
  highestScore: number;
  lastSessionDate: string | null;
  trend: { score: number; date: string; type: string }[];
  typeDistribution: Record<string, number>;
  feedbackPatterns: { pattern: string; count: number }[];
  pastSessions: { id: number; type: string; date: string; score: number | null; questionCount: number }[];
}

interface SessionDetail {
  id: number;
  type: string;
  date: string;
  score: number | null;
  questions: any[];
  answers: any[];
  feedback: any;
}

const typeLabels: Record<string, string> = {
  technical: '技术面试',
  behavioral: '行为面试',
  comprehensive: '综合面试',
};

export default function InterviewDashboard({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Session detail view
  const [detailSession, setDetailSession] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interviewApi.getDashboard();
      setData(res.data);
    } catch {
      setError('无法加载面试数据，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const viewSessionDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await interviewApi.getSessionDetail(id);
      setDetailSession(res.data);
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Helpers ──
  const maxTrendScore = data?.trend && data.trend.length > 0
    ? Math.max(...data.trend.map((t) => t.score))
    : 100;

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-500/20';
    if (score >= 70) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  // ────────────────────────────────────────────
  // SESSION DETAIL SUB-VIEW
  // ────────────────────────────────────────────
  if (detailSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setDetailSession(null)}
        />
        {/* Panel */}
        <div
          className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08]"
          style={{
            background: 'rgba(15, 15, 40, 0.95)',
            backdropFilter: 'blur(24px) saturate(1.4)',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[rgba(15,15,40,0.98)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDetailSession(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white/80"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-white font-semibold">
                  {typeLabels[detailSession.type] || detailSession.type}
                </h3>
                <p className="text-white/30 text-xs">{detailSession.date}</p>
              </div>
            </div>
            {detailSession.score != null && (
              <div className="flex items-center gap-1.5">
                <Award size={16} className="text-amber-400" />
                <span className="text-white font-bold text-lg">{detailSession.score}</span>
                <span className="text-white/30 text-sm">/100</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Questions */}
            <div>
              <h4 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-cyan-400" />
                面试题目
              </h4>
              <div className="space-y-3">
                {(detailSession.questions || []).map((q: any, idx: number) => {
                  const questionText = typeof q === 'string' ? q : q.question || JSON.stringify(q);
                  const answer = detailSession.answers?.[idx];
                  const answerText = typeof answer === 'string' ? answer : answer?.content || answer?.answer || '未作答';
                  return (
                    <div
                      key={idx}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-purple-400 text-xs font-bold mt-0.5 flex-shrink-0">
                          Q{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm">{questionText}</p>
                        </div>
                      </div>
                      {/* Answer */}
                      <div className="mt-3 ml-8 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <p className="text-white/40 text-xs font-medium mb-1 flex items-center gap-1">
                          <UserCircle size={11} className="text-cyan-400" />
                          你的回答
                        </p>
                        <p className="text-white/60 text-sm leading-relaxed">{answerText}</p>
                      </div>
                    </div>
                  );
                })}
                {(!detailSession.questions || detailSession.questions.length === 0) && (
                  <p className="text-white/30 text-sm text-center py-8">暂无题目数据</p>
                )}
              </div>
            </div>

            {/* Feedback */}
            {detailSession.feedback && Object.keys(detailSession.feedback).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <Star size={14} className="text-amber-400" />
                  AI 反馈
                </h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                  {detailSession.feedback.dimensions ? (
                    <div className="space-y-3">
                      {detailSession.feedback.dimensions.map((dim: any, i: number) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/60 text-sm">
                              {dim.label || dim.name}
                            </span>
                            <span className="text-white font-semibold text-sm">
                              {dim.score}/{dim.maxScore || 100}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                              style={{
                                width: `${((dim.score || 0) / (dim.maxScore || 100)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-white/50 text-xs whitespace-pre-wrap">
                      {JSON.stringify(detailSession.feedback, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-white/[0.06] bg-[rgba(15,15,40,0.98)]">
            <button
              onClick={() => setDetailSession(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.08] text-sm font-medium transition-all"
            >
              返回仪表盘
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // MAIN DASHBOARD VIEW
  // ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08]"
        style={{
          background: 'rgba(15, 15, 40, 0.95)',
          backdropFilter: 'blur(24px) saturate(1.4)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[rgba(15,15,40,0.98)]">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-purple-400" />
            <h2 className="text-white font-bold text-lg">面试仪表盘</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white/80"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-purple-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle size={40} className="text-red-400/60 mx-auto mb-4" />
              <p className="text-white/50 text-sm">{error}</p>
              <button
                onClick={loadDashboard}
                className="mt-4 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white/80 text-sm transition-all"
              >
                重试
              </button>
            </div>
          ) : !data ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="text-white/15 mx-auto mb-4" />
              <p className="text-white/40 text-sm">暂无面试数据</p>
            </div>
          ) : (
            <>
              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-white/30 text-xs mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    总面试次数
                  </p>
                  <p className="text-white font-bold text-2xl">{data.totalInterviews}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-white/30 text-xs mb-2 flex items-center gap-1.5">
                    <Award size={12} />
                    平均得分
                  </p>
                  <p className={`font-bold text-2xl ${scoreColor(data.averageScore)}`}>
                    {data.averageScore}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-white/30 text-xs mb-2 flex items-center gap-1.5">
                    <Star size={12} />
                    最高得分
                  </p>
                  <p className="text-green-400 font-bold text-2xl">{data.highestScore}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-white/30 text-xs mb-2 flex items-center gap-1.5">
                    <Clock size={12} />
                    最近面试
                  </p>
                  <p className="text-white font-bold text-lg">
                    {data.lastSessionDate || '--'}
                  </p>
                </div>
              </div>

              {/* ── Score Trend ── */}
              {data.trend.length > 0 && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                  <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-purple-400" />
                    分数趋势
                  </h3>
                  <div className="flex items-end gap-4 h-32">
                    {data.trend.map((item, idx) => {
                      const heightPct = (item.score / maxTrendScore) * 100;
                      const barColors = [
                        'bg-gradient-to-t from-purple-500/60 to-purple-500',
                        'bg-gradient-to-t from-cyan-500/60 to-cyan-500',
                        'bg-gradient-to-t from-green-500/60 to-green-500',
                        'bg-gradient-to-t from-amber-500/60 to-amber-500',
                        'bg-gradient-to-t from-pink-500/60 to-pink-500',
                      ];
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                          <span className="text-white font-semibold text-xs">{item.score}</span>
                          <div
                            className={`w-full max-w-[48px] rounded-t-lg ${barColors[idx % barColors.length]} transition-all duration-500`}
                            style={{ height: `${Math.max(4, heightPct)}%` }}
                          />
                          <span className="text-white/30 text-[10px] truncate w-full text-center">
                            {item.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Type Distribution + Feedback Patterns ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Type Distribution */}
                {Object.keys(data.typeDistribution).length > 0 && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <Target size={14} className="text-cyan-400" />
                      面试类型分布
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(data.typeDistribution).map(([type, count]) => {
                        const pct = (count / data.totalInterviews) * 100;
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white/60 text-sm">
                                {typeLabels[type] || type}
                              </span>
                              <span className="text-white/60 text-xs">
                                {count} 次 ({Math.round(pct)}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Feedback Patterns */}
                {data.feedbackPatterns.length > 0 && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <Lightbulb size={14} className="text-amber-400" />
                      常见反馈主题
                    </h3>
                    <div className="space-y-2.5">
                      {data.feedbackPatterns.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-white/20 text-xs flex-shrink-0 w-4">
                            {idx + 1}
                          </span>
                          <span className="text-white/60 text-sm flex-1 truncate">{p.pattern}</span>
                          <span className="text-white/30 text-xs">{p.count}次</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Past Sessions ── */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                  <BookOpen size={14} className="text-purple-400" />
                  历史面试记录
                </h3>
                {data.pastSessions.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-8">暂无面试记录</p>
                ) : (
                  <div className="space-y-2">
                    {data.pastSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => viewSessionDetail(session.id)}
                        disabled={detailLoading}
                        className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04] transition-all text-left disabled:opacity-50"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={16} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium">
                            {typeLabels[session.type] || session.type}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {session.date} · {session.questionCount} 题
                          </p>
                        </div>
                        {session.score != null && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-sm font-bold ${scoreColor(session.score)}`}>
                              {session.score}
                            </span>
                            <span className="text-white/20 text-xs">分</span>
                          </div>
                        )}
                        <ChevronLeft size={14} className="text-white/20 flex-shrink-0 rotate-180" />
                      </button>
                    ))}
                  </div>
                )}
                {detailLoading && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 size={18} className="text-purple-400 animate-spin" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
