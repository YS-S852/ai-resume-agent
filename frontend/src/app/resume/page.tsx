'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Download,
  Sparkles,
  Loader2,
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Eye,
  Copy,
  Trash2,
  Check,
  X,
  Rocket,
  Save,
  History,
} from 'lucide-react';
import { aiApi, profileApi, resumeApi, exportApi } from '@/lib/api';
import VersionPanel from './VersionPanel';

/* =====================================================
   TYPES
   ===================================================== */
interface ResumeItem {
  id: string;
  name: string;
  templateType: TemplateType;
  languageType: LanguageType;
  createdAt: string;
  status: '已完成' | '编辑中' | '草稿';
}

interface BasicInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
}

interface EduItem {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

interface WorkItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ProjectItem {
  id: string;
  name: string;
  role: string;
  tech: string;
  startDate: string;
  endDate: string;
  description: string;
  link: string;
}

interface SkillGroup {
  id: string;
  category: string;
  items: string;
}

type ModuleKey = 'basic' | 'education' | 'work' | 'projects' | 'skills';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
}

type TemplateType = 'minimal' | 'classic' | 'modern';
type LanguageType = 'zh' | 'en' | 'both';
type ResumeMode = 'edit' | 'generate';
type GenerationStage = 'idle' | 'extracting' | 'generating' | 'saving' | 'done';

/* =====================================================
   DEFAULT EMPTY DATA (no mock/fake data)
   ===================================================== */
const emptyBasicInfo: BasicInfo = {
  name: '', title: '', email: '', phone: '', location: '', website: '', summary: '',
};

const moduleConfigs: ModuleConfig[] = [
  { key: 'basic', label: '基础信息', icon: User },
  { key: 'education', label: '教育经历', icon: GraduationCap },
  { key: 'work', label: '工作经历', icon: Briefcase },
  { key: 'projects', label: '项目经历', icon: FolderGit2 },
  { key: 'skills', label: '技能清单', icon: Wrench },
];

const templateOptions: { value: TemplateType; label: string }[] = [
  { value: 'minimal', label: '简约' },
  { value: 'classic', label: '经典' },
  { value: 'modern', label: '现代' },
];

const languageOptions: { value: LanguageType; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'both', label: '双语' },
];

const statusColors: Record<string, string> = {
  '已完成': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  '编辑中': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '草稿': 'bg-white/10 text-white/50 border-white/10',
};

const templateLabelMap: Record<string, string> = {
  minimal: '简约', classic: '经典', modern: '现代', default: '简约',
};

const languageLabelMap: Record<string, string> = {
  zh: '中文', en: 'English', both: '双语',
};

const normalizeTemplate = (t: string): TemplateType => {
  if (t === 'minimal' || t === 'classic' || t === 'modern') return t;
  return 'minimal'; // 'default' or unknown → minimal
};

const normalizeLanguage = (l: string): LanguageType => {
  if (l === 'en' || l === 'both') return l;
  return 'zh';
};

const splitTextItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitTextItems(item));
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,，;；、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const formatBulletLines = (...items: string[]) => {
  const lines = items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `• ${item}`);
  return lines.join('\n');
};

const toRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
);

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const buildGeneratedResumeContent = (
  profileData: Record<string, unknown>,
  generatedData: Record<string, unknown>,
  options: { resumeTitle: string; targetRole: string },
) => {
  const extractedBasic = toRecord(profileData.basicInfo);
  const profileEducation = toArray(profileData.education);
  const profileWork = toArray(profileData.workExperience);
  const profileProjects = toArray(profileData.projects);
  const profileSkills = toArray(profileData.skills);
  const generatedExperience = toArray(generatedData.experienceEnhanced);
  const generatedProjects = toArray(generatedData.projectEnhanced);
  const generatedKeywords = splitTextItems(generatedData.keywords);
  const generatedSkillsSummary = typeof generatedData.skillsSummary === 'string'
    ? generatedData.skillsSummary.trim()
    : '';

  const education = profileEducation.length > 0
    ? profileEducation.map((edu, index) => {
        const item = toRecord(edu);
        return {
          id: String(item.id ?? `edu-${index + 1}`),
          school: String(item.school ?? ''),
          degree: String(item.degree ?? ''),
          major: String(item.major ?? ''),
          startDate: String(item.startDate ?? ''),
          endDate: String(item.endDate ?? ''),
          gpa: String(item.gpa ?? ''),
          description: String(item.description ?? item.honors ?? ''),
        };
      })
    : [];

  const work = generatedExperience.length > 0
    ? generatedExperience.map((item, index) => {
        const workItem = toRecord(item);
        const bullets = splitTextItems(workItem.bullets);
        return {
          id: String(workItem.id ?? `work-${index + 1}`),
          company: String(workItem.company ?? workItem.employer ?? ''),
          position: String(workItem.position ?? workItem.role ?? options.targetRole),
          startDate: String(workItem.startDate ?? ''),
          endDate: String(workItem.endDate ?? ''),
          description: formatBulletLines(...bullets),
        };
      })
    : profileWork.map((item, index) => {
        const workItem = toRecord(item);
        return {
          id: String(workItem.id ?? `work-${index + 1}`),
          company: String(workItem.company ?? ''),
          position: String(workItem.position ?? ''),
          startDate: String(workItem.startDate ?? ''),
          endDate: String(workItem.endDate ?? ''),
          description: String(workItem.description ?? workItem.achievements ?? workItem.responsibilities ?? ''),
        };
      });

  const projects = generatedProjects.length > 0
    ? generatedProjects.map((item, index) => {
        const projectItem = toRecord(item);
        const bullets = splitTextItems(projectItem.bullets);
        return {
          id: String(projectItem.id ?? `project-${index + 1}`),
          name: String(projectItem.name ?? ''),
          role: String(projectItem.role ?? ''),
          tech: String(projectItem.tech ?? projectItem.techStack ?? ''),
          startDate: String(projectItem.startDate ?? ''),
          endDate: String(projectItem.endDate ?? ''),
          description: formatBulletLines(...bullets),
          link: String(projectItem.link ?? ''),
        };
      })
    : profileProjects.map((item, index) => {
        const projectItem = toRecord(item);
        return {
          id: String(projectItem.id ?? `project-${index + 1}`),
          name: String(projectItem.name ?? ''),
          role: String(projectItem.role ?? projectItem.contributions ?? ''),
          tech: String(projectItem.tech ?? projectItem.techStack ?? ''),
          startDate: String(projectItem.startDate ?? ''),
          endDate: String(projectItem.endDate ?? ''),
          description: String(projectItem.description ?? projectItem.results ?? projectItem.responsibilities ?? ''),
          link: String(projectItem.link ?? ''),
        };
      });

  const keywordGroup = generatedKeywords.length > 0
    ? generatedKeywords.join('、')
    : generatedSkillsSummary;

  const skills = profileSkills.length > 0
    ? profileSkills.map((item, index) => {
        const skillItem = toRecord(item);
        return {
          id: String(skillItem.id ?? `skill-${index + 1}`),
          category: String(skillItem.category ?? ''),
          items: String(skillItem.items ?? ''),
        };
      })
    : [];

  if (generatedSkillsSummary) {
    skills.unshift({
      id: 'skill-summary',
      category: '技能概览',
      items: generatedSkillsSummary,
    });
  }

  if (keywordGroup) {
    skills.push({
      id: `skill-keywords-${skills.length + 1}`,
      category: 'AI 关键词',
      items: keywordGroup,
    });
  }

  const moduleOrder: ModuleKey[] = ['basic', 'education', 'work', 'projects', 'skills'];
  const basicInfo: BasicInfo = {
    name: String(extractedBasic.name ?? profileData.fullName ?? ''),
    title: String(extractedBasic.title ?? profileData.jobTitle ?? options.targetRole ?? ''),
    email: String(extractedBasic.email ?? profileData.email ?? ''),
    phone: String(extractedBasic.phone ?? profileData.phone ?? ''),
    location: String(extractedBasic.location ?? profileData.location ?? profileData.city ?? ''),
    website: String(extractedBasic.website ?? profileData.website ?? ''),
    summary: String(generatedData.summary ?? extractedBasic.summary ?? profileData.summary ?? ''),
  };

  return {
    title: options.resumeTitle,
    moduleOrder,
    basicInfo,
    education,
    work,
    projects,
    skills,
    generationMeta: {
      targetRole: options.targetRole,
      keywords: generatedKeywords,
    },
  };
};

const generationStageLabel: Record<GenerationStage, string> = {
  idle: '待生成',
  extracting: '解析信息中',
  generating: 'AI 生成中',
  saving: '保存草稿中',
  done: '生成完成',
};

/* =====================================================
   STAR GENERATOR
   ===================================================== */
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

/* =====================================================
   TOAST COMPONENT
   ===================================================== */
function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] slide-in-up">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl"
        style={{
          background: 'rgba(15, 15, 46, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
          <Sparkles size={16} className="text-purple-400" />
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
   RESUME PREVIEW (A4 Paper Simulation)
   ===================================================== */
function ResumePreview({
  template,
  language,
  basicInfo,
  education,
  work,
  projects,
  skills,
  moduleOrder,
}: {
  template: TemplateType;
  language: LanguageType;
  basicInfo: BasicInfo;
  education: EduItem[];
  work: WorkItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  moduleOrder: ModuleKey[];
}) {
  /* Template-specific style helpers */
  const sectionTitle = (text: string, textEn: string) => {
    const displayText = language === 'en' ? textEn : language === 'both' ? `${text} / ${textEn}` : text;
    if (template === 'minimal') {
      return (
        <h3 className="text-[11px] font-semibold text-gray-800 uppercase tracking-[0.15em] mb-2 border-b border-gray-200 pb-1">
          {displayText}
        </h3>
      );
    }
    if (template === 'classic') {
      return (
        <h3 className="text-[12px] font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-1 h-3.5 bg-blue-700 rounded-sm inline-block" />
          {displayText}
        </h3>
      );
    }
    /* modern */
    return (
      <h3 className="text-[12px] font-bold mb-2 flex items-center gap-2" style={{ color: '#6D28D9' }}>
        <span
          className="w-5 h-0.5 inline-block rounded-full"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #3B82F6)' }}
        />
        {displayText}
      </h3>
    );
  };

  const headerBg =
    template === 'minimal'
      ? 'bg-white'
      : template === 'classic'
        ? 'bg-blue-50'
        : 'bg-gradient-to-r from-purple-50 to-indigo-50';

  const headerNameColor =
    template === 'minimal'
      ? 'text-gray-900'
      : template === 'classic'
        ? 'text-blue-900'
        : 'text-purple-900';

  const bodyFont = template === 'classic' ? 'font-serif' : 'font-sans';

  const renderModule = (key: ModuleKey) => {
    switch (key) {
      case 'basic':
        return (
          <div key="basic" className="mb-3">
            {sectionTitle('个人信息', 'Profile')}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-gray-600">
              {basicInfo.email && (
                <span className="flex items-center gap-1">
                  <Mail size={8} className="text-gray-400 flex-shrink-0" />
                  {basicInfo.email}
                </span>
              )}
              {basicInfo.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={8} className="text-gray-400 flex-shrink-0" />
                  {basicInfo.phone}
                </span>
              )}
              {basicInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={8} className="text-gray-400 flex-shrink-0" />
                  {basicInfo.location}
                </span>
              )}
              {basicInfo.website && (
                <span className="flex items-center gap-1">
                  <Globe size={8} className="text-gray-400 flex-shrink-0" />
                  {basicInfo.website}
                </span>
              )}
            </div>
            {basicInfo.summary && (
              <p className="text-[9px] text-gray-600 mt-1.5 leading-relaxed">{basicInfo.summary}</p>
            )}
          </div>
        );

      case 'education':
        return (
          <div key="education" className="mb-3">
            {sectionTitle('教育经历', 'Education')}
            {education.map((edu) => (
              <div key={edu.id} className="mb-1.5">
                <div className="flex items-baseline justify-between">
                  <span className={`text-[10px] font-semibold ${template === 'modern' ? 'text-purple-800' : 'text-gray-800'}`}>
                    {edu.school}
                  </span>
                  <span className="text-[8px] text-gray-400">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <div className="text-[9px] text-gray-600">
                  {edu.degree} · {edu.major}
                  {edu.gpa && <span className="ml-2 text-gray-400">GPA: {edu.gpa}</span>}
                </div>
                {edu.description && (
                  <p className="text-[8.5px] text-gray-500 mt-0.5 leading-relaxed">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        );

      case 'work':
        return (
          <div key="work" className="mb-3">
            {sectionTitle('工作经历', 'Work Experience')}
            {work.map((w) => (
              <div key={w.id} className="mb-2">
                <div className="flex items-baseline justify-between">
                  <span className={`text-[10px] font-semibold ${template === 'modern' ? 'text-purple-800' : 'text-gray-800'}`}>
                    {w.company}
                  </span>
                  <span className="text-[8px] text-gray-400">
                    {w.startDate} - {w.endDate}
                  </span>
                </div>
                <div className={`text-[9px] ${template === 'modern' ? 'text-indigo-600' : 'text-gray-500'} mb-0.5`}>
                  {w.position}
                </div>
                {w.description && (
                  <div className="text-[8.5px] text-gray-600 leading-relaxed whitespace-pre-line">
                    {w.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'projects':
        return (
          <div key="projects" className="mb-3">
            {sectionTitle('项目经历', 'Projects')}
            {projects.map((p) => (
              <div key={p.id} className="mb-2">
                <div className="flex items-baseline justify-between">
                  <span className={`text-[10px] font-semibold ${template === 'modern' ? 'text-purple-800' : 'text-gray-800'}`}>
                    {p.name}
                  </span>
                  <span className="text-[8px] text-gray-400">
                    {p.startDate} - {p.endDate}
                  </span>
                </div>
                <div className="text-[9px] text-gray-500">
                  {p.role} · <span className="text-gray-400">{p.tech}</span>
                </div>
                {p.description && (
                  <div className="text-[8.5px] text-gray-600 mt-0.5 leading-relaxed whitespace-pre-line">
                    {p.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'skills':
        return (
          <div key="skills" className="mb-3">
            {sectionTitle('技能清单', 'Skills')}
            <div className="space-y-1">
              {skills.map((s) => (
                <div key={s.id} className="flex text-[9px]">
                  <span className={`font-semibold w-20 flex-shrink-0 ${template === 'modern' ? 'text-purple-700' : 'text-gray-700'}`}>
                    {s.category}
                  </span>
                  <span className="text-gray-600">{s.items}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${bodyFont} text-gray-800`}>
      {/* Header / Name */}
      <div className={`${headerBg} px-6 py-4 -mx-6 -mt-6 mb-4 rounded-t-sm`}>
        <h1 className={`text-[18px] font-bold ${headerNameColor} tracking-wide`}>
          {language === 'en' ? 'Mingyuan Zhang' : basicInfo.name}
        </h1>
        <p className={`text-[10px] mt-0.5 ${template === 'modern' ? 'text-indigo-600' : 'text-gray-500'}`}>
          {language === 'en' ? 'Senior Frontend Engineer' : basicInfo.title}
        </p>
      </div>

      {/* Modules in order */}
      {moduleOrder.map(renderModule)}
    </div>
  );
}

/* =====================================================
   MAIN PAGE COMPONENT
   ===================================================== */
export default function ResumeEditorPage() {
  const [mounted, setMounted] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [resumeList, setResumeList] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [activeMode, setActiveMode] = useState<ResumeMode>('edit');
  const [template, setTemplate] = useState<TemplateType>('minimal');
  const [language, setLanguage] = useState<LanguageType>('zh');
  const [generationForm, setGenerationForm] = useState({
    resumeTitle: 'AI 生成简历',
    targetRole: '',
    rawInput: '',
    targetJD: '',
    template: 'modern' as TemplateType,
    language: 'zh' as LanguageType,
  });

  /* Module state */
  const [moduleOrder, setModuleOrder] = useState<ModuleKey[]>([
    'basic',
    'education',
    'work',
    'projects',
    'skills',
  ]);
  const [expandedModules, setExpandedModules] = useState<Set<ModuleKey>>(new Set<ModuleKey>(['basic']));

  /* Form data */
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(emptyBasicInfo);
  const [education, setEducation] = useState<EduItem[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<SkillGroup[]>([]);

  /* Toast */
  const [toast, setToast] = useState({ visible: false, message: '' });

  /* AI loading */
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');

  /* Save loading */
  const [saving, setSaving] = useState(false);

  /* Version panel */
  const [showVersions, setShowVersions] = useState(false);

  /* Profile data cache (shared across all resumes) */
  const [profileBasicInfo, setProfileBasicInfo] = useState<BasicInfo>(emptyBasicInfo);
  const [profileEducation, setProfileEducation] = useState<EduItem[]>([]);
  const [profileWork, setProfileWork] = useState<WorkItem[]>([]);
  const [profileProjects, setProfileProjects] = useState<ProjectItem[]>([]);
  const [profileSkills, setProfileSkills] = useState<SkillGroup[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const mode = new URLSearchParams(window.location.search).get('mode');
      setActiveMode(mode === 'generate' ? 'generate' : 'edit');
    }
  }, []);

  /* ---- Fetch real data from API ---- */
  useEffect(() => {
    if (!mounted) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch profile data (basic info, education, work, projects, skills)
        const profileRes = await profileApi.getFull();
        const profileData = profileRes.data?.data || profileRes.data;
        if (profileData) {
          const p = profileData.profile || profileData;
          const basic: BasicInfo = { ...emptyBasicInfo };
          if (p) {
            basic.name = p.fullName || '';
            basic.title = p.jobTitle || '';
            basic.email = p.email || '';
            basic.phone = p.phone || '';
            basic.location = p.address || p.city || '';
            basic.website = '';
            basic.summary = p.summary || '';
            setProfileBasicInfo(basic);
          }
          // Education
          const eduList = profileData.education || profileData.workExperience || [];
          if (Array.isArray(eduList) && eduList.length > 0) {
            const mappedEdu = eduList.map((e: Record<string, unknown>) => ({
              id: String(e.id || ''),
              school: (e.school as string) || '',
              degree: (e.degree as string) || '',
              major: (e.major as string) || '',
              startDate: (e.startDate as string) || '',
              endDate: (e.endDate as string) || '',
              gpa: (e.gpa as string) || '',
              description: (e.honors as string) || '',
            }));
            setProfileEducation(mappedEdu);
          }
          // Work experience
          const workList = profileData.workExperience || [];
          if (Array.isArray(workList) && workList.length > 0) {
            const mappedWork = workList.map((w: Record<string, unknown>) => ({
              id: String(w.id || ''),
              company: (w.company as string) || '',
              position: (w.position as string) || '',
              startDate: (w.startDate as string) || '',
              endDate: (w.endDate as string) || '',
              description: (w.achievements as string) || (w.responsibilities as string) || '',
            }));
            setProfileWork(mappedWork);
          }
          // Projects
          const projList = profileData.projects || [];
          if (Array.isArray(projList) && projList.length > 0) {
            const mappedProj = projList.map((pr: Record<string, unknown>) => ({
              id: String(pr.id || ''),
              name: (pr.name as string) || '',
              role: (pr.contributions as string) || '',
              tech: (pr.techStack as string) || '',
              startDate: (pr.startDate as string) || '',
              endDate: (pr.endDate as string) || '',
              description: (pr.results as string) || (pr.responsibilities as string) || '',
              link: '',
            }));
            setProfileProjects(mappedProj);
          }
          // Skills - group by category
          const skillList = profileData.skills || [];
          if (Array.isArray(skillList) && skillList.length > 0) {
            const grouped: Record<string, string[]> = {};
            skillList.forEach((s: Record<string, unknown>) => {
              const cat = (s.category as string) || '其他';
              const name = (s.name as string) || '';
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(name);
            });
            const mappedSkills = Object.entries(grouped).map(([cat, items], i) => ({
              id: `s${i + 1}`,
              category: cat,
              items: items.join(', '),
            }));
            setProfileSkills(mappedSkills);
          }
        }
        // Fetch resume list
        const resumeRes = await resumeApi.list();
        const resumeData = resumeRes.data?.data || resumeRes.data;
        if (Array.isArray(resumeData) && resumeData.length > 0) {
          setResumeList(resumeData.map((r: Record<string, unknown>) => ({
            id: String(r.id || ''),
            name: (r.title as string) || '未命名简历',
            templateType: normalizeTemplate((r.template as string) || 'default'),
            languageType: normalizeLanguage((r.language as string) || 'zh'),
            createdAt: r.createdAt ? new Date(r.createdAt as string).toISOString().split('T')[0] : '',
            status: r.isActive ? '已完成' : '草稿',
          })));
          const first = resumeData[0];
          setSelectedResumeId(String(first.id || ''));
          setTemplate(normalizeTemplate((first.template as string) || 'default'));
          setLanguage(normalizeLanguage((first.language as string) || 'zh'));
        }
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          return;
        }
        setToast({ visible: true, message: '数据加载失败，请刷新页面重试' });
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [mounted]);

  /* ---- Load resume-specific content when switching resumes ---- */
  useEffect(() => {
    if (!selectedResumeId || dataLoading) return;
    const loadResumeContent = async () => {
      try {
        const res = await resumeApi.getById(selectedResumeId);
        const data = res.data?.data || res.data;
        const content = data?.content as Record<string, unknown> | null;

        // If resume has saved content, load it into form state
        if (content && typeof content === 'object' && content.basicInfo) {
          const c = content as {
            basicInfo?: BasicInfo;
            education?: EduItem[];
            work?: WorkItem[];
            projects?: ProjectItem[];
            skills?: SkillGroup[];
            moduleOrder?: ModuleKey[];
          };
          if (c.basicInfo) setBasicInfo(c.basicInfo);
          if (c.education && c.education.length > 0) setEducation(c.education);
          if (c.work && c.work.length > 0) setWork(c.work);
          if (c.projects && c.projects.length > 0) setProjects(c.projects);
          if (c.skills && c.skills.length > 0) setSkills(c.skills);
          if (c.moduleOrder && c.moduleOrder.length > 0) setModuleOrder(c.moduleOrder);
        } else {
          // No saved content - use profile defaults
          setBasicInfo({ ...profileBasicInfo });
          setEducation(profileEducation.map((item) => ({ ...item })));
          setWork(profileWork.map((item) => ({ ...item })));
          setProjects(profileProjects.map((item) => ({ ...item })));
          setSkills(profileSkills.map((item) => ({ ...item })));
          setModuleOrder(['basic', 'education', 'work', 'projects', 'skills']);
        }
      } catch {
        // If fetching resume detail fails, fall back to profile data
        setBasicInfo({ ...profileBasicInfo });
        setEducation(profileEducation.map((item) => ({ ...item })));
        setWork(profileWork.map((item) => ({ ...item })));
        setProjects(profileProjects.map((item) => ({ ...item })));
        setSkills(profileSkills.map((item) => ({ ...item })));
        setModuleOrder(['basic', 'education', 'work', 'projects', 'skills']);
      }
    };
    loadResumeContent();
  }, [selectedResumeId, dataLoading, profileBasicInfo, profileEducation, profileWork, profileProjects, profileSkills]);

  /* ---- Module helpers ---- */
  const toggleModule = useCallback((key: ModuleKey) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const moveModule = useCallback(
    (key: ModuleKey, direction: 'up' | 'down') => {
      setModuleOrder((prev) => {
        const idx = prev.indexOf(key);
        if (direction === 'up' && idx > 0) {
          const next = [...prev];
          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          return next;
        }
        if (direction === 'down' && idx < prev.length - 1) {
          const next = [...prev];
          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  /* ---- Resume CRUD helpers ---- */
  const addNewResume = useCallback(
    async () => {
      try {
        const res = await resumeApi.create({
          title: `新建简历 #${resumeList.length + 1}`,
          template: 'minimal',
          language: 'zh',
        });
        const data = res.data?.data || res.data;
        if (data) {
          const rawTemplate = normalizeTemplate((data.template as string) || 'minimal');
          const rawLanguage: LanguageType = normalizeLanguage((data.language as string) || 'zh');
          const newItem: ResumeItem = {
            id: String(data.id),
            name: data.title || `新建简历 #${resumeList.length + 1}`,
            templateType: rawTemplate,
            languageType: rawLanguage,
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: '草稿',
          };
          setResumeList((prev) => [newItem, ...prev]);
          setSelectedResumeId(String(data.id));
          setTemplate(rawTemplate);
          setLanguage(rawLanguage);
          setExpandedModules(new Set<ModuleKey>(['basic']));
          setToast({ visible: true, message: '新简历已创建' });
        }
      } catch {
        setToast({ visible: true, message: '创建失败，请重试' });
      }
    },
    [resumeList.length],
  );

  const deleteResume = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (resumeList.length <= 1) {
        setToast({ visible: true, message: '至少保留一份简历' });
        return;
      }
      try {
        await resumeApi.delete(id);
        const newList = resumeList.filter((r) => r.id !== id);
        setResumeList(newList);
        if (selectedResumeId === id) {
          const next = newList[0];
          if (next) {
            setSelectedResumeId(next.id);
            setTemplate(next.templateType);
            setLanguage(next.languageType);
            setExpandedModules(new Set<ModuleKey>(['basic']));
          }
        }
        setToast({ visible: true, message: '简历已删除' });
      } catch {
        setToast({ visible: true, message: '删除失败，请重试' });
      }
    },
    [resumeList, selectedResumeId],
  );

  /* ---- AI Optimize ---- */
  const handleAiOptimize = useCallback(() => {
    const targetText = [basicInfo.summary, ...work.map((item) => item.description), ...projects.map((item) => item.description)]
      .filter(Boolean)
      .join('\n');

    if (!targetText.trim()) {
      setToast({ visible: true, message: '请先填写一些简历内容再进行 AI 优化' });
      return;
    }

    setAiLoading(true);
    setToast({ visible: true, message: 'AI 正在优化简历摘要...' });

    void (async () => {
      try {
        const res = await aiApi.polishResume(targetText, 'professional');
        const polished = res.data?.polished || res.data?.data?.polished || res.data?.data || res.data;
        if (typeof polished === 'string' && polished.trim()) {
          setBasicInfo((prev) => ({ ...prev, summary: polished.trim() }));
          setToast({ visible: true, message: 'AI 已优化摘要，您可以继续手动微调' });
        } else {
          setToast({ visible: true, message: 'AI 优化完成' });
        }
      } catch {
        setToast({ visible: true, message: 'AI 优化失败，请稍后重试' });
      } finally {
        setAiLoading(false);
      }
    })();
  }, [basicInfo.summary, projects, work]);

  /* ---- AI Generate ---- */
  const handleGenerateResume = useCallback(async () => {
    const rawInput = generationForm.rawInput.trim();
    const targetJD = generationForm.targetJD.trim();
    const targetRole = generationForm.targetRole.trim();

    if (!rawInput && !targetJD && !targetRole) {
      setToast({ visible: true, message: '请至少填写目标岗位、补充信息或 JD 描述中的一项' });
      return;
    }

    setGenerating(true);
    setGenerationStage('extracting');
    setToast({ visible: true, message: 'AI 正在解析信息并生成简历...' });

    let generatedSuccessfully = false;
    try {
      if (rawInput) {
        setGenerationStage('extracting');
      }
      const extractedRes = rawInput ? await aiApi.extractProfile(rawInput) : null;
      const extractedData = extractedRes?.data?.data || extractedRes?.data || {};
      const profilePayload = {
        ...extractedData,
        ...toRecord(extractedData.profile),
        fullName: extractedData.fullName || profileBasicInfo.name || '',
        jobTitle: targetRole || extractedData.position || profileBasicInfo.title || '',
        email: extractedData.email || profileBasicInfo.email || '',
        phone: extractedData.phone || profileBasicInfo.phone || '',
        location: extractedData.location || profileBasicInfo.location || '',
        website: extractedData.website || profileBasicInfo.website || '',
        summary: extractedData.summary || profileBasicInfo.summary || '',
        education: profileEducation,
        workExperience: profileWork,
        projects: profileProjects,
        skills: profileSkills,
        rawInput,
        targetRole,
      };

      setGenerationStage('generating');
      const generatedRes = await aiApi.generateResume(profilePayload, targetJD || undefined);
      const generatedData = generatedRes.data?.data || generatedRes.data || {};
      const content = buildGeneratedResumeContent(profilePayload, generatedData, {
        resumeTitle: generationForm.resumeTitle.trim() || `${targetRole || 'AI'} 生成简历`,
        targetRole,
      });

      setGenerationStage('saving');
      const createRes = await resumeApi.create({
        title: content.title,
        template: generationForm.template,
        language: generationForm.language,
        content,
      });
      const created = createRes.data?.data || createRes.data;

      if (created?.id) {
        const newItem: ResumeItem = {
          id: String(created.id),
          name: created.title || content.title,
          templateType: normalizeTemplate(created.template || generationForm.template),
          languageType: normalizeLanguage(created.language || generationForm.language),
          createdAt: created.createdAt ? new Date(created.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: '编辑中',
        };
        setResumeList((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
        setSelectedResumeId(newItem.id);
        setTemplate(newItem.templateType);
        setLanguage(newItem.languageType);
        setBasicInfo({ ...content.basicInfo });
        setEducation(content.education.map((item) => ({ ...item })));
        setWork(content.work.map((item) => ({ ...item })));
        setProjects(content.projects.map((item) => ({ ...item })));
        setSkills(content.skills.map((item) => ({ ...item })));
        setModuleOrder(content.moduleOrder);
        setExpandedModules(new Set<ModuleKey>(['basic']));
        setActiveMode('edit');
        setGenerationStage('done');
        generatedSuccessfully = true;
        setToast({ visible: true, message: '简历已生成并可继续二次编辑' });
      } else {
        setToast({ visible: true, message: '生成成功，但创建简历记录失败' });
      }
    } catch {
      setGenerationStage('idle');
      setToast({ visible: true, message: 'AI 生成失败，请稍后重试' });
    } finally {
      setGenerating(false);
      if (!generatedSuccessfully) {
        setGenerationStage('idle');
      }
    }
  }, [generationForm, profileBasicInfo, profileEducation, profileWork, profileProjects, profileSkills]);

  /* ---- Export PDF ---- */
  const handleExportPdf = useCallback(async () => {
    setToast({ visible: true, message: 'PDF 导出中，请稍候...' });
    try {
      const resumeData = {
        basicInfo,
        education,
        work,
        projects,
        skills,
        moduleOrder,
      };
      const res = await exportApi.exportPdf(resumeData, template);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${basicInfo.name || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToast({ visible: true, message: 'PDF 已成功导出' });
    } catch {
      setToast({ visible: true, message: 'PDF 导出失败，请稍后重试' });
    }
  }, [basicInfo, education, work, projects, skills, moduleOrder, template]);

  /* ---- Export DOCX ---- */
  const handleExportDocx = useCallback(async () => {
    setToast({ visible: true, message: 'DOCX 导出中，请稍候...' });
    try {
      const resumeData = {
        basicInfo,
        education,
        work,
        projects,
        skills,
        moduleOrder,
      };
      const res = await exportApi.exportDocx(resumeData, template);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${basicInfo.name || 'resume'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToast({ visible: true, message: 'DOCX 已成功导出' });
    } catch {
      setToast({ visible: true, message: 'DOCX 导出失败，请稍后重试' });
    }
  }, [basicInfo, education, work, projects, skills, moduleOrder, template]);

  /* ---- Save resume ---- */
  const handleSave = useCallback(async () => {
    if (!selectedResumeId) {
      setToast({ visible: true, message: '请先选择一份简历' });
      return;
    }
    setSaving(true);
    try {
      await resumeApi.update(selectedResumeId, {
        template,
        language,
        content: {
          moduleOrder,
          basicInfo,
          education,
          work,
          projects,
          skills,
        },
      });
      // Auto-create version snapshot after save
      try {
        await resumeApi.createVersion(selectedResumeId, { changeNotes: `保存于 ${new Date().toLocaleString('zh-CN')}` });
      } catch { /* version creation is optional */ }
      // Update local list to reflect changes
      setResumeList((prev) =>
        prev.map((r) =>
          r.id === selectedResumeId
            ? { ...r, templateType: template, languageType: language, status: '编辑中' }
            : r,
        ),
      );
      setToast({ visible: true, message: '简历已保存' });
    } catch {
      setToast({ visible: true, message: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  }, [selectedResumeId, template, language, moduleOrder, basicInfo, education, work, projects, skills]);

  /* ---- Education field updater ---- */
  const updateEdu = (id: string, field: keyof EduItem, value: string) => {
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  /* ---- Work field updater ---- */
  const updateWork = (id: string, field: keyof WorkItem, value: string) => {
    setWork((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  /* ---- Project field updater ---- */
  const updateProject = (id: string, field: keyof ProjectItem, value: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  /* ---- Skill field updater ---- */
  const updateSkill = (id: string, field: keyof SkillGroup, value: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  /* ---- Glass input class for form fields ---- */
  const inputCls =
    'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all duration-200 placeholder:text-white/25';
  const labelCls = 'block text-white/50 text-xs mb-1';
  const textareaCls =
    'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500/40 focus:bg-white/8 transition-all duration-200 placeholder:text-white/25 resize-none';

  /* ===================================================== */
  /* RENDER                                                */
  /* ===================================================== */
  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--dark-900)' }}>
      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      {/* Loading overlay */}
      {dataLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(10, 10, 26, 0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-purple-400" />
            <p className="text-white/70 text-sm">加载简历数据中...</p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* AURORA BACKGROUND                             */}
      {/* ============================================ */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
      </div>

      {/* Star field */}
      <div className="star-field">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
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

      {/* ============================================ */}
      {/* TOP NAV BAR                                   */}
      {/* ============================================ */}
      <header
        className="relative z-20 px-6 py-3 flex items-center justify-between slide-in-up"
        style={{
          background: 'rgba(10, 10, 26, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base hidden sm:block">ResumePilot AI</span>
          <ChevronRight size={14} className="text-white/20 hidden sm:block" />
          <span className="text-white/50 text-sm">{activeMode === 'generate' ? 'AI 一键生成' : '简历编辑器'}</span>
        </div>
        <a
          href="/dashboard"
          className="text-white/40 text-sm hover:text-white/70 transition-colors flex items-center gap-1.5"
        >
          <ArrowDown size={14} className="rotate-[-135deg]" />
          返回仪表盘
        </a>
      </header>

      {/* ============================================ */}
      {/* MAIN TWO-COLUMN LAYOUT                        */}
      {/* ============================================ */}
      <main className="relative z-10 flex-1 flex gap-5 p-5" style={{ height: 'calc(100vh - 72px)' }}>
        {/* ========================================== */}
        {/* LEFT PANEL (40%) - EDITOR                  */}
        {/* ========================================== */}
        <div
          className="w-[40%] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 slide-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-purple-400" />
              {activeMode === 'generate' ? 'AI 一键生成简历' : '简历编辑器'}
            </h2>
            <span className="text-white/30 text-xs">{resumeList.length} 份简历</span>
          </div>

          {/* Mode Switch + Generator */}
          <div className="glass-card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/8">
              <button
                onClick={() => setActiveMode('edit')}
                className={
                  activeMode === 'edit'
                    ? 'py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/15 text-white border border-purple-500/25'
                    : 'py-2 rounded-xl text-sm font-medium text-white/55 hover:text-white/80'
                }
              >
                自己编辑
              </button>
              <button
                onClick={() => setActiveMode('generate')}
                className={
                  activeMode === 'generate'
                    ? 'py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-500/15 text-white border border-cyan-500/25'
                    : 'py-2 rounded-xl text-sm font-medium text-white/55 hover:text-white/80'
                }
              >
                AI 一键生成
              </button>
            </div>

            {activeMode === 'generate' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>简历名称</label>
                    <input
                      className={inputCls}
                      value={generationForm.resumeTitle}
                      onChange={(e) => setGenerationForm((prev) => ({ ...prev, resumeTitle: e.target.value }))}
                      placeholder="例如：前端工程师简历"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>目标岗位</label>
                    <input
                      className={inputCls}
                      value={generationForm.targetRole}
                      onChange={(e) => setGenerationForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                      placeholder="例如：高级前端工程师"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>补充信息</label>
                  <textarea
                    className={textareaCls}
                    rows={4}
                    value={generationForm.rawInput}
                    onChange={(e) => setGenerationForm((prev) => ({ ...prev, rawInput: e.target.value }))}
                    placeholder="把你的经历、技能、项目亮点写进来，AI 会自动提炼成简历"
                  />
                </div>

                <div>
                  <label className={labelCls}>目标 JD（可选）</label>
                  <textarea
                    className={textareaCls}
                    rows={4}
                    value={generationForm.targetJD}
                    onChange={(e) => setGenerationForm((prev) => ({ ...prev, targetJD: e.target.value }))}
                    placeholder="粘贴目标岗位描述，让 AI 按 JD 优先生成"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>模板</label>
                    <select
                      value={generationForm.template}
                      onChange={(e) => setGenerationForm((prev) => ({ ...prev, template: e.target.value as TemplateType }))}
                      className={inputCls}
                    >
                      {templateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0f0f2e] text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>语言</label>
                    <select
                      value={generationForm.language}
                      onChange={(e) => setGenerationForm((prev) => ({ ...prev, language: e.target.value as LanguageType }))}
                      className={inputCls}
                    >
                      {languageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0f0f2e] text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateResume}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-70"
                  style={{
                    background: generating
                      ? 'rgba(34, 211, 238, 0.15)'
                      : 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(139, 92, 246, 0.2))',
                    border: '1px solid rgba(34, 211, 238, 0.28)',
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>AI 生成中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="text-cyan-300" />
                      <span>{generationStage === 'idle' ? '智能解析并生成' : generationStageLabel[generationStage]}</span>
                    </>
                  )}
                </button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-white/35">
                    <span>生成流程</span>
                    <span>{generationStageLabel[generationStage]}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['extracting', 'generating', 'saving', 'done'] as GenerationStage[]).map((stage) => {
                      const isActive = generationStage === stage;
                      const isDone = generationStage === 'done' || ['generating', 'saving'].includes(generationStage) && ['extracting', 'generating'].includes(stage);
                      return (
                        <div
                          key={stage}
                          className={
                            `h-1.5 rounded-full transition-all duration-300 ${
                              isActive ? 'bg-cyan-400' : isDone ? 'bg-emerald-400/80' : 'bg-white/10'
                            }`
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <p className="text-white/35 text-xs leading-relaxed">
                  生成后会自动创建一份可编辑简历草稿，并切换到编辑模式，你可以继续手工微调。
                </p>
              </div>
            )}
          </div>

          {/* ====================================== */}
          {/* RESUME LIST                             */}
          {/* ====================================== */}
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">我的简历</h3>
              <button
                onClick={addNewResume}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus size={14} />
                <span>新建</span>
              </button>
            </div>
            {resumeList.length === 0 && !dataLoading ? (
              <p className="text-white/40 text-sm text-center py-4">暂无简历，点击「新建」创建第一份简历</p>
            ) : (
              resumeList.map((resume) => {
                const isSelected = resume.id === selectedResumeId;
                return (
                  <div
                    key={resume.id}
                    onClick={() => {
                      setSelectedResumeId(resume.id);
                      setTemplate(resume.templateType);
                      setLanguage(resume.languageType);
                      setExpandedModules(new Set<ModuleKey>(['basic']));
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                      ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/10 border border-purple-500/25'
                          : 'hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-purple-500/20' : 'bg-white/5'
                      }`}
                    >
                      <FileText size={14} className={isSelected ? 'text-purple-400' : 'text-white/30'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                        {resume.name}
                      </p>
                      <p className="text-white/30 text-xs flex items-center gap-1.5 mt-0.5">
                        <span>{templateLabelMap[resume.templateType] || resume.templateType}</span>
                        <span className="text-white/10">|</span>
                        <span>{languageLabelMap[resume.languageType] || resume.languageType}</span>
                        <span className="text-white/10">|</span>
                        <span>{resume.createdAt}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColors[resume.status]}`}>
                      {resume.status}
                    </span>
                    <button
                      onClick={(e) => deleteResume(resume.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0 ml-1"
                      title="删除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ====================================== */}
          {/* MODULE MANAGEMENT                       */}
          {/* ====================================== */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">模块管理</h3>
              <span className="text-white/20 text-[10px]">拖拽排序 / 展开编辑</span>
            </div>

            <div className="space-y-2">
              {moduleOrder.map((key, idx) => {
                const config = moduleConfigs.find((m) => m.key === key)!;
                const Icon = config.icon;
                const isExpanded = expandedModules.has(key);
                const canMoveUp = idx > 0;
                const canMoveDown = idx < moduleOrder.length - 1;

                return (
                  <div key={key}>
                    {/* Module header */}
                    <div
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${isExpanded ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-white/5 border border-transparent'}
                      `}
                    >
                      <button
                        onClick={() => toggleModule(key)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <Icon size={15} className={isExpanded ? 'text-purple-400' : 'text-white/40'} />
                        <span className={`text-sm ${isExpanded ? 'text-white' : 'text-white/60'}`}>
                          {config.label}
                        </span>
                      </button>

                      {/* Move buttons */}
                      <div className="flex items-center gap-0.5 mr-1">
                        <button
                          onClick={() => moveModule(key, 'up')}
                          disabled={!canMoveUp}
                          className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="上移"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => moveModule(key, 'down')}
                          disabled={!canMoveDown}
                          className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="下移"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleModule(key)}
                        className="text-white/30 hover:text-white/60 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Module edit form (expanded) */}
                    {isExpanded && (
                      <div className="ml-2 mt-1 mb-2 pl-4 border-l-2 border-purple-500/20 space-y-3 fade-scale-in">
                        {key === 'basic' && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelCls}>姓名</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.name}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>职位</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.title}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, title: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelCls}>邮箱</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.email}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, email: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>电话</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.phone}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, phone: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelCls}>所在地</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.location}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, location: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>个人网站</label>
                                <input
                                  className={inputCls}
                                  value={basicInfo.website}
                                  onChange={(e) => setBasicInfo((p) => ({ ...p, website: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>个人简介</label>
                              <textarea
                                className={textareaCls}
                                rows={3}
                                value={basicInfo.summary}
                                onChange={(e) => setBasicInfo((p) => ({ ...p, summary: e.target.value }))}
                              />
                            </div>
                          </>
                        )}

                        {key === 'education' &&
                          education.map((edu) => (
                            <div
                              key={edu.id}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>学校</label>
                                  <input
                                    className={inputCls}
                                    value={edu.school}
                                    onChange={(e) => updateEdu(edu.id, 'school', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>学历</label>
                                  <input
                                    className={inputCls}
                                    value={edu.degree}
                                    onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={labelCls}>专业</label>
                                  <input
                                    className={inputCls}
                                    value={edu.major}
                                    onChange={(e) => updateEdu(edu.id, 'major', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>开始</label>
                                  <input
                                    className={inputCls}
                                    value={edu.startDate}
                                    onChange={(e) => updateEdu(edu.id, 'startDate', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>结束</label>
                                  <input
                                    className={inputCls}
                                    value={edu.endDate}
                                    onChange={(e) => updateEdu(edu.id, 'endDate', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>GPA</label>
                                <input
                                  className={inputCls}
                                  value={edu.gpa}
                                  onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>描述</label>
                                <textarea
                                  className={textareaCls}
                                  rows={2}
                                  value={edu.description}
                                  onChange={(e) => updateEdu(edu.id, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}

                        {key === 'work' &&
                          work.map((w) => (
                            <div
                              key={w.id}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>公司</label>
                                  <input
                                    className={inputCls}
                                    value={w.company}
                                    onChange={(e) => updateWork(w.id, 'company', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>职位</label>
                                  <input
                                    className={inputCls}
                                    value={w.position}
                                    onChange={(e) => updateWork(w.id, 'position', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>开始</label>
                                  <input
                                    className={inputCls}
                                    value={w.startDate}
                                    onChange={(e) => updateWork(w.id, 'startDate', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>结束</label>
                                  <input
                                    className={inputCls}
                                    value={w.endDate}
                                    onChange={(e) => updateWork(w.id, 'endDate', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>工作描述</label>
                                <textarea
                                  className={textareaCls}
                                  rows={4}
                                  value={w.description}
                                  onChange={(e) => updateWork(w.id, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}

                        {key === 'projects' &&
                          projects.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>项目名称</label>
                                  <input
                                    className={inputCls}
                                    value={p.name}
                                    onChange={(e) => updateProject(p.id, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>角色</label>
                                  <input
                                    className={inputCls}
                                    value={p.role}
                                    onChange={(e) => updateProject(p.id, 'role', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>技术栈</label>
                                <input
                                  className={inputCls}
                                  value={p.tech}
                                  onChange={(e) => updateProject(p.id, 'tech', e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>开始</label>
                                  <input
                                    className={inputCls}
                                    value={p.startDate}
                                    onChange={(e) => updateProject(p.id, 'startDate', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>结束</label>
                                  <input
                                    className={inputCls}
                                    value={p.endDate}
                                    onChange={(e) => updateProject(p.id, 'endDate', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>项目描述</label>
                                <textarea
                                  className={textareaCls}
                                  rows={3}
                                  value={p.description}
                                  onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>项目链接</label>
                                <input
                                  className={inputCls}
                                  value={p.link}
                                  onChange={(e) => updateProject(p.id, 'link', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}

                        {key === 'skills' &&
                          skills.map((s) => (
                            <div
                              key={s.id}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                            >
                              <div>
                                <label className={labelCls}>分类</label>
                                <input
                                  className={inputCls}
                                  value={s.category}
                                  onChange={(e) => updateSkill(s.id, 'category', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>技能项（逗号分隔）</label>
                                <input
                                  className={inputCls}
                                  value={s.items}
                                  onChange={(e) => updateSkill(s.id, 'items', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT PANEL (60%) - PREVIEW                */}
        {/* ========================================== */}
        <div
          className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 slide-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {/* Toolbar */}
          <div className="glass-card p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              {/* Template Selector */}
              <div className="flex items-center gap-2">
                <label className="text-white/40 text-xs">模板</label>
                <select
                  value={template}
                  onChange={(e) => {
                    const val = e.target.value as TemplateType;
                    setTemplate(val);
                    if (selectedResumeId) {
                      setResumeList((prev) => prev.map((r) => r.id === selectedResumeId ? { ...r, templateType: val } : r));
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-1.5 outline-none focus:border-purple-500/40 transition-all cursor-pointer appearance-none pr-7"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  {templateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0f0f2e] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <label className="text-white/40 text-xs">语言</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const val = e.target.value as LanguageType;
                    setLanguage(val);
                    if (selectedResumeId) {
                      setResumeList((prev) => prev.map((r) => r.id === selectedResumeId ? { ...r, languageType: val } : r));
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-1.5 outline-none focus:border-purple-500/40 transition-all cursor-pointer appearance-none pr-7"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0f0f2e] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => setShowVersions(true)}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/20 rounded-lg px-3 py-1.5 hover:border-purple-500/40"
              >
                <History size={13} />
                <span>版本历史</span>
              </button>
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Calendar size={12} />
                <span>实时预览</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* A4 Preview Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex justify-center py-2">
              {/* A4 Paper Simulation */}
              <div
                className="relative bg-white shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '595px', /* ~A4 width at 96dpi */
                  minHeight: '842px', /* ~A4 height at 96dpi */
                  padding: '48px 48px 60px',
                  boxShadow:
                    '0 4px 6px rgba(0,0,0,0.1), 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
                  borderRadius: '2px',
                }}
              >
                {/* Paper top accent line for modern template */}
                {template === 'modern' && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-sm"
                    style={{ background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)' }}
                  />
                )}
                {template === 'classic' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-800 rounded-t-sm" />
                )}

                <ResumePreview
                  template={template}
                  language={language}
                  basicInfo={basicInfo}
                  education={education}
                  work={work}
                  projects={projects}
                  skills={skills}
                  moduleOrder={moduleOrder}
                />

                {/* Page number */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-[8px] text-gray-300">
                  1 / 1
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-70"
              style={{
                background: saving ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save size={18} className="text-emerald-400" />
                  <span>保存</span>
                </>
              )}
            </button>
            <button
              onClick={handleExportPdf}
              className="btn-gradient flex items-center justify-center gap-2 flex-1 !py-3 !rounded-xl"
            >
              <Download size={18} />
              <span>导出 PDF</span>
            </button>
            <button
              onClick={handleExportDocx}
              className="btn-gradient flex items-center justify-center gap-2 flex-1 !py-3 !rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Download size={18} />
              <span>导出 DOCX</span>
            </button>
            <button
              onClick={handleAiOptimize}
              disabled={aiLoading}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
              style={{
                background: aiLoading
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: aiLoading ? 'none' : '0 0 20px rgba(139, 92, 246, 0.1)',
              }}
            >
              {aiLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AI 优化中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-purple-400" />
                  <span>AI 优化</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Version History Panel */}
      <VersionPanel
        resumeId={selectedResumeId}
        visible={showVersions}
        onClose={() => setShowVersions(false)}
        onRestore={() => {
          setShowVersions(false);
          // Reload resume content after restore
          if (selectedResumeId) {
            resumeApi.getById(selectedResumeId).then(res => {
              const data = res.data?.data || res.data;
              const content = data?.content as Record<string, unknown> | null;
              if (content && typeof content === 'object' && content.basicInfo) {
                const c = content as {
                  basicInfo?: BasicInfo;
                  education?: EduItem[];
                  work?: WorkItem[];
                  projects?: ProjectItem[];
                  skills?: SkillGroup[];
                  moduleOrder?: ModuleKey[];
                };
                if (c.basicInfo) setBasicInfo(c.basicInfo);
                if (c.education && c.education.length > 0) setEducation(c.education);
                if (c.work && c.work.length > 0) setWork(c.work);
                if (c.projects && c.projects.length > 0) setProjects(c.projects);
                if (c.skills && c.skills.length > 0) setSkills(c.skills);
                if (c.moduleOrder && c.moduleOrder.length > 0) setModuleOrder(c.moduleOrder);
              }
            }).catch(() => {});
          }
        }}
      />
    </div>
  );
}
