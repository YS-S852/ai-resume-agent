'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Send,
  Bot,
  UserCircle,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Star,
  CheckCircle2,
  AlertCircle,
  History,
  Play,
  StopCircle,
  Brain,
  Mic,
  Lightbulb,
  BarChart3,
  Volume2,
  LayoutList,
} from 'lucide-react';
import { interviewApi, aiApi } from '@/lib/api';
import InterviewDashboard from './InterviewDashboard';

// ────────────────────────────────────────────
// Sidebar nav items
// ────────────────────────────────────────────
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

// ────────────────────────────────────────────
// Interview type options
// ────────────────────────────────────────────
const interviewTypes = [
  {
    key: 'technical',
    label: '技术面试',
    desc: '考察专业技能、算法、系统设计等技术能力',
    icon: Brain,
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  {
    key: 'behavioral',
    label: '行为面试',
    desc: '考察沟通、团队协作、领导力等软技能',
    icon: Mic,
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  {
    key: 'comprehensive',
    label: '综合面试',
    desc: '技术能力 + 软技能全方位考察',
    icon: Sparkles,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
];

// ────────────────────────────────────────────
// Question type badge config
// ────────────────────────────────────────────
const questionTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  basic: { label: '基础题', bg: 'bg-green-500/15', text: 'text-green-400' },
  advanced: { label: '进阶题', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  project: { label: '项目实操题', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  behavioral: { label: '行为面试题', bg: 'bg-amber-500/15', text: 'text-amber-400' },
};

const difficultyConfig: Record<string, { label: string; bg: string; text: string }> = {
  easy: { label: '简单', bg: 'bg-green-500/15', text: 'text-green-400' },
  medium: { label: '中等', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  hard: { label: '困难', bg: 'bg-red-500/15', text: 'text-red-400' },
};

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
type PageState = 'setup' | 'questions' | 'chat' | 'results';

interface Question {
  id: number;
  type: string;
  difficulty: string;
  question: string;
  expectedPoints?: string[];
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface DimensionScore {
  label: string;
  score: number;
  maxScore: number;
}

interface HistoryItem {
  id: number;
  type: string;
  date: string;
  score?: number;
  questionCount?: number;
}

// ────────────────────────────────────────────
// Main Page Component
// ────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [activeNav] = useState('interview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Page state machine
  const [pageState, setPageState] = useState<PageState>('setup');
  const [activeTab, setActiveTab] = useState<'interview' | 'history'>('interview');

  // Setup state
  const [selectedType, setSelectedType] = useState('technical');
  const [jdContent, setJdContent] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Results state
  const [overallScore, setOverallScore] = useState(0);
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Session tracking
  const [sessionId, setSessionId] = useState<number | null>(null);

  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Dashboard modal
  const [showDashboard, setShowDashboard] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await interviewApi.getHistory();
      setHistoryList(res.data || []);
    } catch {
      // silently fail - show empty state
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ── Setup: Generate questions ──
  const handleStartPreparation = async () => {
    if (!jdContent.trim() || !resumeContent.trim()) return;
    setIsPreparing(true);
    try {
      // Create session
      const sessionRes = await interviewApi.createSession({ type: selectedType });
      const sid = sessionRes.data?.id ?? sessionRes.data?.sessionId;
      setSessionId(sid);

      // Generate questions
      const qRes = await interviewApi.generateQuestions(sid, {
        jdContent: jdContent.trim(),
        resumeContent: resumeContent.trim(),
      });
      const generatedQuestions: Question[] = (qRes.data || []).map(
        (q: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          type: q.type || 'basic',
          difficulty: q.difficulty || 'medium',
          question: q.question || '',
          expectedPoints: (q.expectedPoints as string[]) || q.hints as string[] || [],
        })
      );
      setQuestions(generatedQuestions);
      setPageState('questions');
    } catch {
      // Fallback demo questions for UX continuity
      const demoQuestions: Question[] = [
        { id: 1, type: 'basic', difficulty: 'easy', question: '请简要介绍一下你的技术栈和工作经历。', expectedPoints: ['列举核心技术栈', '工作年限概述', '项目经验亮点'] },
        { id: 2, type: 'advanced', difficulty: 'medium', question: '请描述你在项目中遇到的最具挑战性的技术问题，以及你是如何解决的？', expectedPoints: ['问题描述清晰', '解决思路', '技术方案', '结果和反思'] },
        { id: 3, type: 'project', difficulty: 'hard', question: '如果让你设计一个高并发的消息推送系统，你会如何设计架构？', expectedPoints: ['整体架构设计', '技术选型理由', '性能优化方案', '容灾和监控'] },
        { id: 4, type: 'behavioral', difficulty: 'medium', question: '请举一个你在团队中解决冲突的例子，你是如何处理的？', expectedPoints: ['STAR 法则', '具体情境', '行动措施', '结果成效'] },
        { id: 5, type: 'advanced', difficulty: 'hard', question: '请谈谈你对微服务架构的理解，以及在什么场景下应该使用或不使用微服务？', expectedPoints: ['微服务优势', '适用场景', '不适用场景', '实践经验'] },
      ];
      setQuestions(demoQuestions);
      setPageState('questions');
    } finally {
      setIsPreparing(false);
    }
  };

  // ── Start mock interview chat ──
  const handleStartMockInterview = () => {
    setChatMessages([]);
    setCurrentQuestionIdx(0);
    setPageState('chat');

    // AI asks the first question
    const firstQ = questions[0];
    if (firstQ) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: `你好！欢迎参加今天的模拟面试。我是你的 AI 面试官，接下来我会逐一问你一些问题，请尽量结合你的实际经验来回答。\n\n让我们开始第一个问题：\n\n**${firstQ.question}**`,
      };
      setChatMessages([greeting]);
    }
  };

  // ── Send chat message ──
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await interviewApi.chat(sessionId!, { history, jdContent: jdContent.trim() });
      const aiReply = res.data?.reply || res.data?.message || '';

      if (aiReply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
      } else {
        advanceToNextQuestion(updatedMessages);
      }
    } catch {
      // Fallback: advance to next question
      advanceToNextQuestion(updatedMessages);
    } finally {
      setIsAiTyping(false);
    }
  }, [chatInput, isAiTyping, chatMessages, sessionId, jdContent, questions, currentQuestionIdx]);

  const advanceToNextQuestion = (messages: ChatMessage[]) => {
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIdx(nextIdx);
      const nextQ = questions[nextIdx];
      const feedback = `好的，感谢你的回答。\n\n接下来是第 ${nextIdx + 1} 个问题：\n\n**${nextQ.question}**`;
      setChatMessages((prev) => [...prev, { role: 'assistant', content: feedback }]);
    } else {
      // All questions asked, generate results
      const closing: ChatMessage = {
        role: 'assistant',
        content: '好的，所有问题已经问完了。感谢你的参与！让我来为你生成本次面试的评估报告。',
      };
      setChatMessages((prev) => [...prev, closing]);
      setTimeout(() => { void generateResults(messages); }, 1500);
    }
  };

  // ── End interview early ──
  const handleEndInterview = () => {
    void generateResults(chatMessages);
  };

  // ── Generate results via backend AI scoring ──
  const generateResults = async (messages: ChatMessage[]) => {
    setPageState('results');
    setIsScoring(true);
    setSavedSuccess(false);

    // Build { question, answer } pairs from the chat: user messages are answers
    // to the prepared questions, in order.
    const userAnswers = messages.filter((m) => m.role === 'user').map((m) => m.content);
    const answers = questions.map((q, i) => ({
      question: q.question,
      answer: userAnswers[i] || '（未作答）',
    }));

    try {
      const res = await interviewApi.scoreSession(sessionId!, {
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          expectedPoints: q.expectedPoints,
        })),
        answers,
        jdContent: jdContent.trim(),
      });
      const data = res.data || {};
      setOverallScore(Number(data.overallScore ?? 0));
      setDimensionScores(
        Array.isArray(data.dimensions)
          ? data.dimensions.map((d: { label: string; score: number; maxScore: number }) => ({
              label: d.label,
              score: d.score,
              maxScore: d.maxScore || 100,
            }))
          : [],
      );
      // Scoring endpoint already persists answers + feedback + score
      setSavedSuccess(true);
    } catch {
      // Fallback to a neutral placeholder so the UI still renders
      setOverallScore(0);
      setDimensionScores([
        { label: '回答完整性', score: 0, maxScore: 100 },
        { label: '专业性', score: 0, maxScore: 100 },
        { label: '逻辑性', score: 0, maxScore: 100 },
        { label: '岗位匹配度', score: 0, maxScore: 100 },
      ]);
      setSavedSuccess(false);
    } finally {
      setIsScoring(false);
    }
  };

  // ── Save feedback (manual retry if AI scoring did not persist) ──
  const handleSaveFeedback = async () => {
    if (!sessionId) return;
    setIsSaving(true);
    try {
      await interviewApi.saveFeedback(sessionId, {
        feedback: { dimensions: dimensionScores, questions },
        score: overallScore,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset to setup ──
  const handleReset = () => {
    setPageState('setup');
    setQuestions([]);
    setChatMessages([]);
    setCurrentQuestionIdx(0);
    setOverallScore(0);
    setDimensionScores([]);
    setSessionId(null);
    setSavedSuccess(false);
    setIsScoring(false);
  };

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────
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
        <div className="p-6 space-y-6">
          {/* ── Tab Switcher ── */}
          <div className="flex items-center gap-4 slide-in-up" style={{ animationDelay: '0.05s' }}>
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'interview'
                  ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-white border border-purple-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <MessageSquare size={16} />
              面试模拟
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-white border border-purple-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <History size={16} />
              历史记录
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent ml-auto"
            >
              <BarChart3 size={16} />
              面试仪表板
            </button>
          </div>

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white/90 mb-5 flex items-center gap-2">
                  <History size={18} className="text-purple-400" />
                  面试历史记录
                </h3>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="text-purple-400 animate-spin" />
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen size={48} className="text-white/15 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">暂无面试记录</p>
                    <p className="text-white/25 text-xs mt-1">完成一次模拟面试后，记录将显示在这里</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={18} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium">
                            {item.type === 'technical' ? '技术面试' : item.type === 'behavioral' ? '行为面试' : '综合面试'}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">{item.date}</p>
                        </div>
                        {item.score != null && (
                          <div className="flex items-center gap-1.5">
                            <Award size={14} className="text-amber-400" />
                            <span className="text-white/70 text-sm font-semibold">{item.score}分</span>
                          </div>
                        )}
                        <ChevronRight size={16} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── INTERVIEW TAB ── */}
          {activeTab === 'interview' && (
            <>
              {/* ── Progress indicator ── */}
              <div className="flex items-center gap-2 slide-in-up" style={{ animationDelay: '0.1s' }}>
                {(['setup', 'questions', 'chat', 'results'] as PageState[]).map((step, idx) => {
                  const labels = ['面试准备', '题目预览', '模拟面试', '面试报告'];
                  const isActive = pageState === step;
                  const isPast =
                    (['setup', 'questions', 'chat', 'results'] as PageState[]).indexOf(pageState) > idx;
                  return (
                    <React.Fragment key={step}>
                      {idx > 0 && (
                        <div className={`flex-1 h-px ${isPast ? 'bg-purple-500/40' : 'bg-white/10'}`} />
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isActive
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                              : isPast
                              ? 'bg-purple-500/30 text-purple-300'
                              : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-medium hidden sm:block transition-colors ${
                            isActive ? 'text-white' : isPast ? 'text-purple-300/70' : 'text-white/30'
                          }`}
                        >
                          {labels[idx]}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ======================================== */}
              {/* SETUP PANEL                              */}
              {/* ======================================== */}
              {pageState === 'setup' && (
                <div className="space-y-6 slide-in-up" style={{ animationDelay: '0.15s' }}>
                  {/* Header */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      <span className="holo-text">AI 面试中心</span>
                    </h2>
                    <p className="text-white/40 text-sm">
                      选择面试类型，输入目标岗位和简历内容，AI 将为你生成定制化面试题并进行模拟面试
                    </p>
                  </div>

                  {/* Interview Type Selector */}
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                      <Target size={16} className="text-purple-400" />
                      选择面试类型
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {interviewTypes.map((t) => {
                        const Icon = t.icon;
                        const isSelected = selectedType === t.key;
                        return (
                          <button
                            key={t.key}
                            onClick={() => setSelectedType(t.key)}
                            className={`p-5 rounded-xl text-left transition-all duration-300 border ${
                              isSelected
                                ? `bg-gradient-to-br ${t.gradient} ${t.borderColor} shadow-lg`
                                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3`}>
                              <Icon size={20} className={t.iconColor} />
                            </div>
                            <p className="text-white font-semibold text-sm mb-1">{t.label}</p>
                            <p className="text-white/40 text-xs leading-relaxed">{t.desc}</p>
                            {isSelected && (
                              <div className="mt-3 flex items-center gap-1 text-xs">
                                <CheckCircle2 size={12} className={t.iconColor} />
                                <span className={t.iconColor}>已选择</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* JD + Resume Input */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* JD Input */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-cyan-400" />
                        目标岗位 JD
                      </h3>
                      <textarea
                        value={jdContent}
                        onChange={(e) => setJdContent(e.target.value)}
                        placeholder="请粘贴目标岗位的职位描述（JD），包括岗位要求、技能需求、职责描述等..."
                        rows={10}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
                      />
                      <p className="text-white/25 text-xs mt-2">
                        已输入 {jdContent.length} 字
                      </p>
                    </div>

                    {/* Resume Input */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-green-400" />
                        我的简历内容
                      </h3>
                      <textarea
                        value={resumeContent}
                        onChange={(e) => setResumeContent(e.target.value)}
                        placeholder="请粘贴你的简历文本内容，包括教育背景、工作经历、技能特长、项目经验等..."
                        rows={10}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
                      />
                      <p className="text-white/25 text-xs mt-2">
                        已输入 {resumeContent.length} 字
                      </p>
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleStartPreparation}
                      disabled={!jdContent.trim() || !resumeContent.trim() || isPreparing}
                      className={`btn-gradient flex items-center justify-center gap-2 w-auto min-w-[240px] ${
                        !jdContent.trim() || !resumeContent.trim()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isPreparing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          AI 正在准备面试题...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          开始面试准备
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================== */}
              {/* QUESTION BANK                            */}
              {/* ======================================== */}
              {pageState === 'questions' && (
                <div className="space-y-6 slide-in-up" style={{ animationDelay: '0.15s' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        面试题库 <span className="holo-text">· 已生成</span>
                      </h2>
                      <p className="text-white/40 text-sm">
                        共 {questions.length} 道题目，点击查看参考答案要点
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 border border-white/[0.06] transition-all"
                    >
                      <RotateCcw size={14} />
                      重新准备
                    </button>
                  </div>

                  {/* Question List */}
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const typeConf = questionTypeConfig[q.type] || questionTypeConfig.basic;
                      const diffConf = difficultyConfig[q.difficulty] || difficultyConfig.medium;
                      const isExpanded = expandedQuestion === idx;
                      return (
                        <div
                          key={q.id}
                          className="glass-card p-5 cursor-pointer hover:border-white/15 transition-all duration-300"
                          onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Number */}
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-purple-400 text-sm font-bold">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${typeConf.bg} ${typeConf.text} font-medium`}>
                                  {typeConf.label}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${diffConf.bg} ${diffConf.text} font-medium`}>
                                  {diffConf.label}
                                </span>
                              </div>
                              <p className="text-white/85 text-sm leading-relaxed">{q.question}</p>
                            </div>
                            <div className="flex-shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-white/30" />
                              ) : (
                                <ChevronDown size={16} className="text-white/30" />
                              )}
                            </div>
                          </div>

                          {/* Expanded: expected answer points */}
                          {isExpanded && q.expectedPoints && q.expectedPoints.length > 0 && (
                            <div className="mt-4 ml-12 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                              <p className="text-white/50 text-xs font-medium mb-2 flex items-center gap-1.5">
                                <Lightbulb size={12} className="text-amber-400" />
                                参考答案要点
                              </p>
                              <ul className="space-y-1.5">
                                {q.expectedPoints.map((point, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-2 text-sm text-white/60">
                                    <span className="text-purple-400/60 mt-0.5 flex-shrink-0">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Start Mock Interview */}
                  <div className="flex justify-center pt-2">
                    <button onClick={handleStartMockInterview} className="btn-gradient flex items-center justify-center gap-2 w-auto min-w-[240px]">
                      <Play size={18} />
                      开始模拟面试
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================== */}
              {/* MOCK INTERVIEW CHAT                      */}
              {/* ======================================== */}
              {pageState === 'chat' && (
                <div className="slide-in-up" style={{ animationDelay: '0.15s' }}>
                  <div className="glass-card flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
                    {/* Chat Header */}
                    <div
                      className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"
                      style={{ background: 'rgba(15, 15, 46, 0.4)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <Bot size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">AI 面试官</p>
                          <p className="text-white/30 text-xs">
                            问题 {Math.min(currentQuestionIdx + 1, questions.length)} / {questions.length}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleEndInterview}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-red-500/15 transition-all"
                      >
                        <StopCircle size={14} />
                        结束面试
                      </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                      {chatMessages.map((msg, idx) => {
                        const isAi = msg.role === 'assistant';
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                          >
                            {/* Avatar */}
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isAi
                                  ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20'
                                  : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'
                              }`}
                            >
                              {isAi ? (
                                <Bot size={16} className="text-purple-400" />
                              ) : (
                                <UserCircle size={16} className="text-cyan-400" />
                              )}
                            </div>
                            {/* Bubble */}
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                isAi
                                  ? 'bg-white/[0.05] border border-white/[0.08] text-white/85 rounded-tl-sm'
                                  : 'bg-purple-500/15 border border-purple-500/20 text-white/90 rounded-tr-sm'
                              }`}
                            >
                              {msg.content.split('\n').map((line, lineIdx) => (
                                <p
                                  key={lineIdx}
                                  className={lineIdx > 0 ? 'mt-2' : ''}
                                  dangerouslySetInnerHTML={{
                                    __html: line.replace(
                                      /\*\*(.*?)\*\*/g,
                                      '<strong class="text-white font-semibold">$1</strong>'
                                    ),
                                  }}
                                />
                              ))}
                              {/* TTS Speak Button */}
                              {isAi && (
                                <button
                                  onClick={() => speakText(msg.content)}
                                  disabled={isSpeaking}
                                  className={`mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs transition-all ${
                                    isSpeaking
                                      ? 'text-purple-300/60 cursor-not-allowed'
                                      : 'text-white/40 hover:text-purple-300 hover:bg-purple-500/10'
                                  }`}
                                  title="朗读这段内容"
                                >
                                  <Volume2 size={12} className={isSpeaking ? 'animate-pulse' : ''} />
                                  朗读
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      {isAiTyping && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-purple-400" />
                          </div>
                          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-2 text-white/40 text-sm">
                              <Loader2 size={14} className="animate-spin" />
                              面试官正在思考...
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div
                      className="px-6 py-4 border-t border-white/[0.06]"
                      style={{ background: 'rgba(15, 15, 46, 0.4)' }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="输入你的回答..."
                          disabled={isAiTyping}
                          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/30 focus:bg-white/[0.07] transition-all disabled:opacity-50"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || isAiTyping}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            chatInput.trim() && !isAiTyping
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
                              : 'bg-white/5 text-white/20 cursor-not-allowed'
                          }`}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================== */}
              {/* RESULTS / FEEDBACK                       */}
              {/* ======================================== */}
              {pageState === 'results' && (
                <div className="space-y-6 slide-in-up" style={{ animationDelay: '0.15s' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        面试报告 <span className="holo-text">· 评估结果</span>
                      </h2>
                      <p className="text-white/40 text-sm">以下是本次模拟面试的综合评估</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 border border-white/[0.06] transition-all"
                    >
                      <RotateCcw size={14} />
                      新的面试
                    </button>
                  </div>

                  {/* AI scoring in progress */}
                  {isScoring && (
                    <div className="glass-card p-10 flex flex-col items-center justify-center">
                      <Loader2 size={32} className="text-purple-400 animate-spin mb-4" />
                      <p className="text-white/80 text-sm font-medium">AI 正在评估你的面试表现...</p>
                      <p className="text-white/30 text-xs mt-1">基于岗位 JD、问题与你的回答综合打分中</p>
                    </div>
                  )}

                  {!isScoring && (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall Score - Circular */}
                    <div className="glass-card p-6 flex flex-col items-center justify-center spring-in">
                      <BarChart3 size={18} className="text-purple-400 mb-4" />
                      <div className="relative w-36 h-36 mb-4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="10"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(overallScore / 100) * 327} 327`}
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="50%" stopColor="#06B6D4" />
                              <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-white">{overallScore}</span>
                          <span className="text-white/30 text-xs">综合得分</span>
                        </div>
                      </div>
                      <p className="text-white/50 text-sm text-center">
                        {overallScore >= 85
                          ? '表现优秀！你已具备很强的面试能力'
                          : overallScore >= 70
                          ? '表现良好！还有一些方面可以继续提升'
                          : '继续加油！建议多进行模拟练习'}
                      </p>
                    </div>

                    {/* Dimension Scores */}
                    <div className="glass-card p-6 lg:col-span-2 spring-in" style={{ animationDelay: '0.15s' }}>
                      <h3 className="text-base font-semibold text-white/90 mb-5 flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        维度评分
                      </h3>
                      <div className="space-y-5">
                        {dimensionScores.map((dim, idx) => {
                          const pct = (dim.score / dim.maxScore) * 100;
                          const colors = [
                            { bar: 'from-purple-500 to-indigo-500', bg: 'bg-purple-500/10' },
                            { bar: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10' },
                            { bar: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
                            { bar: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
                          ];
                          const c = colors[idx % colors.length];
                          return (
                            <div key={idx}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/70 text-sm">{dim.label}</span>
                                <span className="text-white font-semibold text-sm">{dim.score}/{dim.maxScore}</span>
                              </div>
                              <div className={`w-full h-2.5 rounded-full ${c.bg}`}>
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-1000 ease-out`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Question-by-question Review */}
                  <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
                    <h3 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                      <BookOpen size={16} className="text-cyan-400" />
                      逐题回顾
                    </h3>
                    <div className="space-y-3">
                      {questions.map((q, idx) => {
                        const typeConf = questionTypeConfig[q.type] || questionTypeConfig.basic;
                        // Extract user answer from chat messages (skip first AI greeting)
                        const userMessages = chatMessages.filter((m) => m.role === 'user');
                        const userAnswer = userMessages[idx]?.content || '未作答';
                        const isExpanded = expandedQuestion === idx;

                        return (
                          <div
                            key={q.id}
                            className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                              className="w-full flex items-start gap-3 p-4 text-left"
                            >
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeConf.bg} ${typeConf.text}`}>
                                    {typeConf.label}
                                  </span>
                                </div>
                                <p className="text-white/80 text-sm">{q.question}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp size={14} className="text-white/30 flex-shrink-0 mt-1" />
                              ) : (
                                <ChevronDown size={14} className="text-white/30 flex-shrink-0 mt-1" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3">
                                {/* User Answer */}
                                <div className="ml-10 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                  <p className="text-white/40 text-xs font-medium mb-1.5 flex items-center gap-1">
                                    <UserCircle size={11} className="text-cyan-400" />
                                    你的回答
                                  </p>
                                  <p className="text-white/70 text-sm leading-relaxed">{userAnswer}</p>
                                </div>
                                {/* Expected Points */}
                                {q.expectedPoints && q.expectedPoints.length > 0 && (
                                  <div className="ml-10 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                    <p className="text-white/40 text-xs font-medium mb-1.5 flex items-center gap-1">
                                      <Lightbulb size={11} className="text-amber-400" />
                                      参考答案要点
                                    </p>
                                    <ul className="space-y-1">
                                      {q.expectedPoints.map((pt, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-2 text-xs text-white/50">
                                          <span className="text-purple-400/50 mt-0.5">•</span>
                                          {pt}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleSaveFeedback}
                      disabled={isSaving || savedSuccess}
                      className={`btn-gradient flex items-center justify-center gap-2 w-auto min-w-[240px] ${
                        savedSuccess ? 'opacity-80' : ''
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          保存中...
                        </>
                      ) : savedSuccess ? (
                        <>
                          <CheckCircle2 size={18} />
                          已保存成功
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          保存面试记录
                        </>
                      )}
                    </button>
                  </div>
                  </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Interview Dashboard Modal */}
      {showDashboard && (
        <InterviewDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}
