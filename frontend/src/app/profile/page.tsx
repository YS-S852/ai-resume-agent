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
  LogOut,
  Settings,
  Menu,
  X,
  Rocket,
  GraduationCap,
  Building2,
  FolderKanban,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Award,
  BookOpen,
  Trophy,
  Calendar,
  Code2,
  Globe,
  Medal,
  CircleUser,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';

/* ================================================================
   NAV ITEMS
   ================================================================ */
const navItems = [
  { icon: LayoutDashboard, label: '仪表盘', key: 'dashboard', active: false, href: '/dashboard' },
  { icon: User, label: '用户档案', key: 'profile', active: true, href: '/profile' },
  { icon: FileText, label: '简历管理', key: 'resume', active: false, href: '/resume' },
  { icon: Target, label: 'JD 分析', key: 'jd', active: false, href: '/jd' },
  { icon: ShieldCheck, label: 'ATS 检测', key: 'ats', active: false, href: '/ats' },
  { icon: MessageSquare, label: '面试中心', key: 'interview', active: false, href: '/interview' },
  { icon: Briefcase, label: '求职管理', key: 'jobs', active: false, href: '/jobs' },
  { icon: BookOpen, label: '知识库', key: 'career', active: false, href: '/career' },
  { icon: Globe, label: '联网调研', key: 'search', active: false, href: '/search' },
];

/* ================================================================
   TAB DEFINITIONS
   ================================================================ */
type TabKey = 'education' | 'work' | 'project' | 'skills';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'education', label: '教育经历', icon: GraduationCap },
  { key: 'work', label: '工作经历', icon: Building2 },
  { key: 'project', label: '项目经历', icon: FolderKanban },
  { key: 'skills', label: '技能中心', icon: Wrench },
];

import { profileApi } from '@/lib/api';

/* ================================================================
   TYPES
   ================================================================ */
interface Education {
  id: number;
  school: string;
  major: string;
  degree: string;
  period: string;
  gpa: string;
  honors: string;
}

interface Work {
  id: number;
  company: string;
  industry: string;
  title: string;
  period: string;
  responsibilities: string;
  achievements: string;
}

interface Project {
  id: number;
  name: string;
  period: string;
  techStack: string[];
  background: string;
  responsibilities: string;
  contributions: string;
  outcomes: string;
}

interface Skill {
  id: number;
  name: string;
  category: 'tech' | 'software' | 'language' | 'certificate';
  level?: string;
  color: string;
}

const skillColorPool = [
  'from-blue-500 to-cyan-400',
  'from-blue-600 to-indigo-500',
  'from-green-500 to-emerald-400',
  'from-green-600 to-teal-500',
  'from-purple-500 to-pink-400',
  'from-cyan-500 to-blue-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-500',
];

const categoryColorMap: Record<string, string> = {
  tech: 'from-blue-500 to-cyan-400',
  software: 'from-purple-500 to-pink-400',
  language: 'from-amber-500 to-orange-400',
  certificate: 'from-rose-500 to-pink-500',
};

/* ================================================================
   SKILL CATEGORY HELPERS
   ================================================================ */
const skillCategoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  tech: { label: '技术技能', icon: Code2, color: 'text-blue-400' },
  software: { label: '软件工具', icon: Wrench, color: 'text-purple-400' },
  language: { label: '语言能力', icon: Globe, color: 'text-amber-400' },
  certificate: { label: '职业证书', icon: Medal, color: 'text-rose-400' },
};

/* ================================================================
   PROFILE PAGE COMPONENT
   ================================================================ */
export default function ProfilePage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [activeNav, setActiveNav] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('education');
  const [mounted, setMounted] = useState(false);
  const [tabAnimating, setTabAnimating] = useState(false);

  /* ---- Profile data state ---- */
  const [profileData, setProfileData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    city: string;
    jobIntention: string;
    expectedSalary: string;
    summary: string;
  }>({ fullName: '', phone: '', email: '', city: '', jobIntention: '', expectedSalary: '', summary: '' });
  const [education, setEducation] = useState<Education[]>([]);
  const [work, setWork] = useState<Work[]>([]);

  /* ---- Edit modal state ---- */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState(profileData);

  // 打开编辑模态框：把当前 profileData 复制到 editForm
  const openEditModal = () => {
    setEditForm(profileData);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEditField = (key: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      // 后端 Profile 表字段：fullName, phone, city, jobIntention, expectedSalary, summary
      // email 是 User 表字段，不在 profile 接口里更新
      await profileApi.update({
        fullName: editForm.fullName,
        phone: editForm.phone,
        city: editForm.city,
        jobIntention: editForm.jobIntention,
        expectedSalary: editForm.expectedSalary,
        summary: editForm.summary,
      });
      setProfileData(editForm);
      setEditModalOpen(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setEditSaving(false);
    }
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---- Fetch profile data from API ---- */
  useEffect(() => {
    if (!mounted) return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await profileApi.getFull();
        const fullData = res.data?.data || res.data;
        if (fullData) {
          const profile = fullData.profile || {};
          setProfileData({
            fullName: profile.fullName || fullData.username || '',
            phone: fullData.phone || '',
            email: fullData.email || '',
            city: profile.city || '',
            jobIntention: profile.jobIntention || '',
            expectedSalary: profile.expectedSalary || '',
            summary: profile.summary || '',
          });
          setEducation(
            (fullData.education || []).map((e: { id: number; school: string; major: string; degree: string; startDate: string; endDate?: string; gpa?: string; honors?: string }) => ({
              id: e.id,
              school: e.school || '',
              major: e.major || '',
              degree: e.degree || '',
              period: `${e.startDate || ''} - ${e.endDate || '至今'}`,
              gpa: e.gpa || '',
              honors: e.honors || '',
            })),
          );
          setWork(
            (fullData.workExperience || []).map((w: { id: number; company: string; industry?: string; position: string; startDate: string; endDate?: string; responsibilities?: string; achievements?: string }) => ({
              id: w.id,
              company: w.company || '',
              industry: w.industry || '',
              title: w.position || '',
              period: `${w.startDate || ''} - ${w.endDate || '至今'}`,
              responsibilities: w.responsibilities || '',
              achievements: w.achievements || '',
            })),
          );
          setProjects(
            (fullData.projects || []).map((p: { id: number; name: string; startDate?: string; endDate?: string; techStack?: string; background?: string; responsibilities?: string; contributions?: string; results?: string }) => ({
              id: p.id,
              name: p.name || '',
              period: `${p.startDate || ''} - ${p.endDate || '至今'}`,
              techStack: p.techStack ? p.techStack.split(',').map((s: string) => s.trim()) : [],
              background: p.background || '',
              responsibilities: p.responsibilities || '',
              contributions: p.contributions || '',
              outcomes: p.results || '',
            })),
          );
          setSkills(
            (fullData.skills || []).map((s: { id: number; name: string; category: string; level?: string }, idx: number) => ({
              id: s.id,
              name: s.name || '',
              category: (['tech', 'software', 'language', 'certificate'].includes(s.category) ? s.category : 'tech') as Skill['category'],
              level: s.level || '',
              color: categoryColorMap[s.category] || skillColorPool[idx % skillColorPool.length],
            })),
          );
        }
      } catch {
        // User may not have created a profile yet
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [mounted]);

  const handleTabChange = (key: TabKey) => {
    if (key === activeTab || tabAnimating) return;
    setTabAnimating(true);
    setTimeout(() => {
      setActiveTab(key);
      setTabAnimating(false);
    }, 150);
  };

  /* ==============================================================
     RENDER
     ============================================================== */
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
                {profileData.fullName ? profileData.fullName.charAt(0) : 'U'}
              </div>
              <span className="text-white/70 text-sm font-medium hidden sm:block">{profileData.fullName || '用户'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Loading State */}
          {profileLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-white/40 text-sm">加载档案数据中...</p>
              </div>
            </div>
          )}

          {!profileLoading && (
            <>
          {/* Page Title */}
          <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-white mb-1">
              <span className="holo-text">用户档案中心</span>
            </h2>
            <p className="text-white/40 text-sm">管理您的个人信息、教育经历、工作经历与技能</p>
          </div>

          {/* ============================================ */}
          {/* BASIC INFO CARD                              */}
          {/* ============================================ */}
          <div
            className="glass-card p-6 md:p-8 spring-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))',
                      border: '2px solid rgba(139,92,246,0.3)',
                    }}
                  >
                    <CircleUser size={48} className="text-purple-300/80" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors duration-300 cursor-pointer flex items-center justify-center">
                    <Pencil size={16} className="text-white/0 group-hover:text-white/70 transition-colors duration-300" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{profileData.fullName || '未设置姓名'}</h3>
                    <p className="text-white/40 text-sm mt-0.5">{profileData.jobIntention || '未设置求职意向'}</p>
                  </div>
                  <button
                    onClick={openEditModal}
                    className="btn-gradient flex items-center justify-center gap-2 text-sm px-6 py-2.5 w-auto"
                    style={{ width: 'auto' }}
                  >
                    <Pencil size={15} />
                    <span>编辑资料</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Phone */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Phone size={15} className="text-cyan-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">{profileData.phone || '未设置'}</span>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Mail size={15} className="text-purple-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">{profileData.email || '未设置'}</span>
                  </div>
                  {/* City */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <MapPin size={15} className="text-pink-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">{profileData.city || '未设置'}</span>
                  </div>
                  {/* Job Intention */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Briefcase size={15} className="text-indigo-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">{profileData.jobIntention || '未设置'}</span>
                  </div>
                  {/* Expected Salary */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <DollarSign size={15} className="text-green-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">{profileData.expectedSalary || '未设置'}</span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Award size={15} className="text-amber-400/70 flex-shrink-0" />
                    <span className="text-white/60 text-sm truncate">在职 - 看机会</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* TAB SWITCHER                                 */}
          {/* ============================================ */}
          <div
            className="slide-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {/* Glass Tab Bar */}
            <div
              className="flex items-center gap-1 p-1.5 rounded-2xl mb-6 overflow-x-auto"
              style={{
                background: 'rgba(15, 15, 46, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`
                      relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium
                      transition-all duration-300 whitespace-nowrap flex-shrink-0
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/15 text-white shadow-lg shadow-purple-500/10'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
                    )}
                    <Icon size={16} className={isActive ? 'text-purple-400' : ''} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div
              className={`transition-all duration-300 ${
                tabAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* ======================================== */}
              {/* EDUCATION TAB                            */}
              {/* ======================================== */}
              {activeTab === 'education' && (
                <div className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                      <GraduationCap size={18} className="text-cyan-400" />
                      教育经历
                    </h3>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
                      <Plus size={15} />
                      <span>添加</span>
                    </button>
                  </div>

                  {education.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <GraduationCap size={40} className="text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">暂无教育经历</p>
                      <p className="text-white/15 text-xs mt-1">点击上方「添加」按钮开始填写</p>
                    </div>
                  ) : education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="glass-card p-6 group hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5 slide-in-up"
                      style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <BookOpen size={20} className="text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{edu.school}</h4>
                            <p className="text-white/40 text-sm">{edu.major} | {edu.degree}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-white/30" />
                          <span className="text-white/50">{edu.period}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy size={14} className="text-white/30" />
                          <span className="text-white/50">GPA: {edu.gpa}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award size={14} className="text-white/30" />
                          <span className="text-white/50 truncate">{edu.honors}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ======================================== */}
              {/* WORK TAB                                 */}
              {/* ======================================== */}
              {activeTab === 'work' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-400" />
                      工作经历
                    </h3>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
                      <Plus size={15} />
                      <span>添加</span>
                    </button>
                  </div>

                  {work.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Building2 size={40} className="text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">暂无工作经历</p>
                      <p className="text-white/15 text-xs mt-1">点击上方「添加」按钮开始填写</p>
                    </div>
                  ) : work.map((work, idx) => (
                    <div
                      key={work.id}
                      className="glass-card p-6 group hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5 slide-in-up"
                      style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{work.company}</h4>
                            <p className="text-white/40 text-sm">{work.title} | {work.industry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Calendar size={14} className="text-white/30" />
                        <span className="text-white/50">{work.period}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">职责</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{work.responsibilities}</p>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">成果</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{work.achievements}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ======================================== */}
              {/* PROJECT TAB                              */}
              {/* ======================================== */}
              {activeTab === 'project' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                      <FolderKanban size={18} className="text-pink-400" />
                      项目经历
                    </h3>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
                      <Plus size={15} />
                      <span>添加</span>
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <FolderKanban size={40} className="text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">暂无项目经历</p>
                      <p className="text-white/15 text-xs mt-1">点击上方「添加」按钮开始填写</p>
                    </div>
                  ) : projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="glass-card p-6 group hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5 slide-in-up"
                      style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                            <FolderKanban size={20} className="text-pink-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{proj.name}</h4>
                            <p className="text-white/40 text-sm flex items-center gap-2">
                              <Calendar size={13} />
                              {proj.period}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Tech Stack Pills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {proj.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/[0.08] text-white/60"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">背景</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{proj.background}</p>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">职责</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{proj.responsibilities}</p>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">贡献</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{proj.contributions}</p>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs font-medium uppercase tracking-wider">成果</span>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">{proj.outcomes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ======================================== */}
              {/* SKILLS TAB                               */}
              {/* ======================================== */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                      <Wrench size={18} className="text-amber-400" />
                      技能中心
                    </h3>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
                      <Plus size={15} />
                      <span>添加技能</span>
                    </button>
                  </div>

                  {skills.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Wrench size={40} className="text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">暂无技能记录</p>
                      <p className="text-white/15 text-xs mt-1">点击上方「添加技能」按钮开始填写</p>
                    </div>
                  ) : Object.entries(skillCategoryConfig).map(([catKey, catConfig], catIdx) => {
                    const catSkills = skills.filter((s) => s.category === catKey);
                    if (catSkills.length === 0) return null;
                    const CatIcon = catConfig.icon;

                    return (
                      <div
                        key={catKey}
                        className="glass-card p-6 slide-in-up"
                        style={{ animationDelay: `${0.1 + catIdx * 0.12}s` }}
                      >
                        <h4 className="text-white/80 font-medium text-sm mb-4 flex items-center gap-2">
                          <CatIcon size={16} className={catConfig.color} />
                          {catConfig.label}
                          <span className="text-white/20 text-xs ml-1">({catSkills.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {catSkills.map((skill) => (
                            <div
                              key={skill.id}
                              className="group relative"
                            >
                              <div
                                className={`
                                  flex items-center gap-2.5 px-4 py-2.5 rounded-full
                                  bg-gradient-to-r ${skill.color}
                                  bg-opacity-10
                                  border border-white/[0.08]
                                  hover:border-white/20
                                  transition-all duration-300
                                  hover:-translate-y-0.5 hover:shadow-lg
                                  cursor-default
                                `}
                                style={{
                                  background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
                                }}
                              >
                                {/* Colored dot */}
                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${skill.color}`} />
                                <span className="text-white/80 text-sm font-medium">{skill.name}</span>
                                {skill.level && (
                                  <span
                                    className={`
                                      text-[10px] font-semibold px-2 py-0.5 rounded-full
                                      bg-gradient-to-r ${skill.color} text-white/90
                                    `}
                                  >
                                    {skill.level}
                                  </span>
                                )}
                                {/* Delete on hover */}
                                <button className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded-full hover:bg-red-500/20">
                                  <X size={12} className="text-white/40 group-hover:text-red-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* EDIT PROFILE MODAL                           */}
      {/* ============================================ */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => !editSaving && setEditModalOpen(false)}
        >
          <div
            className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto spring-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Pencil size={18} className="text-purple-400" />
                  编辑个人资料
                </h3>
                <p className="text-white/40 text-sm mt-1">更新您的基本信息</p>
              </div>
              <button
                onClick={() => !editSaving && setEditModalOpen(false)}
                disabled={editSaving}
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">姓名</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => handleEditField('fullName', e.target.value)}
                    placeholder="请输入姓名"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">电话</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => handleEditField('phone', e.target.value)}
                    placeholder="请输入电话"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">邮箱</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditField('email', e.target.value)}
                    placeholder="请输入邮箱"
                    className="glass-input"
                    disabled
                    title="邮箱请在登录账号管理中修改"
                  />
                  <p className="text-white/30 text-[11px] mt-1 ml-1">邮箱暂不支持在此修改</p>
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">城市</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => handleEditField('city', e.target.value)}
                    placeholder="请输入城市"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">求职意向</label>
                  <input
                    type="text"
                    value={editForm.jobIntention}
                    onChange={(e) => handleEditField('jobIntention', e.target.value)}
                    placeholder="如：高级前端工程师"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">期望薪资</label>
                  <input
                    type="text"
                    value={editForm.expectedSalary}
                    onChange={(e) => handleEditField('expectedSalary', e.target.value)}
                    placeholder="如：25-35k"
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">个人简介</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => handleEditField('summary', e.target.value)}
                  placeholder="请输入个人简介..."
                  rows={4}
                  className="glass-input resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={editSaving}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white/80 transition-all duration-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={saveProfile}
                disabled={editSaving}
                className="btn-gradient flex items-center justify-center gap-2 text-sm px-6 py-2.5"
              >
                {editSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>保存</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
