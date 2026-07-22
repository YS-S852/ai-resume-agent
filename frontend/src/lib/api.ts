import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just reject - let individual pages/components handle 401 and other errors
    // Do NOT auto-redirect to login; pages decide when auth is needed
    return Promise.reject(error);
  }
);

export default api;

// ---- Auth API ----
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// ---- Resume API ----
export const resumeApi = {
  list: () => api.get('/resumes'),
  getById: (id: string) => api.get(`/resumes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/resumes', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/resumes/${id}`, data),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  // Version management
  getVersions: (id: string) => api.get(`/resumes/${id}/versions`),
  getVersion: (versionId: number) => api.get(`/resumes/versions/${versionId}`),
  createVersion: (id: string, data: Record<string, unknown>) =>
    api.post(`/resumes/${id}/versions`, data),
  restoreVersion: (versionId: number) =>
    api.post(`/resumes/versions/${versionId}/restore`),
};

// ---- JD Analysis API ----
export const jdApi = {
  list: () => api.get('/jd'),
  getById: (id: number) => api.get(`/jd/${id}`),
  create: (data: { title: string; company?: string; rawContent: string }) =>
    api.post('/jd', data),
  analyze: (id: number) => api.post(`/jd/${id}/analyze`),
  match: (id: number) => api.post(`/jd/${id}/match`),
  delete: (id: number) => api.delete(`/jd/${id}`),
};

// ---- JD Extract API (multi-input) ----
export const jdExtractApi = {
  extractFromImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/jd/extract/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  extractFromPdf: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/jd/extract/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  extractFromLink: (url: string) => api.post('/jd/extract/link', { url }),
  extractFromClipboard: (text: string) =>
    api.post('/jd/extract/clipboard', { text }),
};

// ---- ATS Check API ----
export const atsApi = {
  analyze: (data: { resumeContent: string; jdContent: string; resumeId?: number; jdId?: number }) =>
    api.post('/ats/analyze', data),
  optimize: (data: { resumeContent: string; jdContent: string }) =>
    api.post('/ats/optimize', data),
  getHistory: () => api.get('/ats/history'),
  getReport: (id: number) => api.get(`/ats/${id}`),
};

// ---- Interview API ----
export const interviewApi = {
  createSession: (data: { jobId?: number; type: string }) =>
    api.post('/interview/session', data),
  generateQuestions: (id: number, data: { jdContent: string; resumeContent: string }) =>
    api.post(`/interview/session/${id}/questions`, data),
  chat: (id: number, data: { history: { role: string; content: string }[]; jdContent: string }) =>
    api.post(`/interview/session/${id}/chat`, data),
  saveFeedback: (id: number, data: { feedback: Record<string, unknown>; score: number }) =>
    api.post(`/interview/session/${id}/feedback`, data),
  saveAnswers: (id: number, data: { answers: Array<{ question?: string; answer: string }> }) =>
    api.post(`/interview/session/${id}/answers`, data),
  scoreSession: (
    id: number,
    data: {
      questions: Array<{ id?: number; question: string; expectedPoints?: string[] }>;
      answers: Array<{ question?: string; answer: string }>;
      jdContent: string;
    },
  ) => api.post(`/interview/session/${id}/score`, data),
  getHistory: () => api.get('/interview/history'),
  getSession: (id: number) => api.get(`/interview/session/${id}`),
  getDashboard: () => api.get('/interview/dashboard'),
  getSessionDetail: (id: number) => api.get(`/interview/dashboard/${id}`),
  textToSpeech: (text: string, options?: Record<string, unknown>) =>
    api.post('/interview/tts', { text, options }),
};

// ---- AI API ----
export const aiApi = {
  analyzeJD: (rawJD: string) => api.post('/ai/analyze-jd', { rawJD }),
  atsScore: (resumeContent: string, jdContent: string) =>
    api.post('/ai/ats-score', { resumeContent, jdContent }),
  generateQuestions: (jdContent: string, resumeContent: string, count?: number) =>
    api.post('/ai/interview-questions', { jdContent, resumeContent, count }),
  interviewChat: (history: { role: string; content: string }[], jdContent: string) =>
    api.post('/ai/interview-chat', { history, jdContent }),
  generateResume: (profileData: Record<string, unknown>, jdContent?: string) =>
    api.post('/ai/generate-resume', { profileData, jdContent }),
  polishResume: (text: string, style?: string) =>
    api.post('/ai/polish-resume', { text, style }),
  extractProfile: (rawInput: string) =>
    api.post('/ai/extract-profile', { rawInput }),
};

// ---- Profile API ----
export const profileApi = {
  getFull: () => api.get('/profiles/full'),
  get: () => api.get('/profiles'),
  create: (data: Record<string, unknown>) => api.post('/profiles', data),
  update: (data: Record<string, unknown>) => api.put('/profiles', data),
  importFromText: (rawInput: string) => api.post('/profiles/import', { rawInput }),
  // Education
  getEducation: () => api.get('/profiles/education'),
  createEducation: (data: Record<string, unknown>) => api.post('/profiles/education', data),
  updateEducation: (id: number, data: Record<string, unknown>) => api.put(`/profiles/education/${id}`, data),
  deleteEducation: (id: number) => api.delete(`/profiles/education/${id}`),
  // Work Experience
  getWork: () => api.get('/profiles/work-experience'),
  createWork: (data: Record<string, unknown>) => api.post('/profiles/work-experience', data),
  updateWork: (id: number, data: Record<string, unknown>) => api.put(`/profiles/work-experience/${id}`, data),
  deleteWork: (id: number) => api.delete(`/profiles/work-experience/${id}`),
  // Projects
  getProjects: () => api.get('/profiles/projects'),
  createProject: (data: Record<string, unknown>) => api.post('/profiles/projects', data),
  updateProject: (id: number, data: Record<string, unknown>) => api.put(`/profiles/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/profiles/projects/${id}`),
  // Skills
  getSkills: () => api.get('/profiles/skills'),
  createSkill: (data: Record<string, unknown>) => api.post('/profiles/skills', data),
  updateSkill: (id: number, data: Record<string, unknown>) => api.put(`/profiles/skills/${id}`, data),
  deleteSkill: (id: number) => api.delete(`/profiles/skills/${id}`),
};

// ---- Job Tracking API ----
export const jobApi = {
  list: () => api.get('/jobs'),
  stats: () => api.get('/jobs/stats'),
  create: (data: { company: string; position: string; salary?: string; location?: string; source?: string; status?: string; notes?: string }) =>
    api.post('/jobs', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/jobs/${id}`, data),
  delete: (id: number) => api.delete(`/jobs/${id}`),
};

// ---- Dashboard API ----
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

// ---- Export API ----
export const exportApi = {
  exportPdf: (resumeData: any, template: string) =>
    api.post('/export/pdf', { resumeData, template }, { responseType: 'blob' }),
  exportDocx: (resumeData: any, template: string) =>
    api.post('/export/docx', { resumeData, template }, { responseType: 'blob' }),
};

// ---- Search API ----
export const searchApi = {
  searchMarket: (query: string, industry?: string, location?: string) =>
    api.post('/search/market', { query, industry, location }),
  researchCompany: (company: string) =>
    api.post('/search/company', { company }),
  industryTrends: (industry: string) =>
    api.post('/search/industry', { industry }),
  salaryBenchmark: (position: string, location?: string) =>
    api.post('/search/salary', { position, location }),
  getHistory: () => api.get('/search/history'),
};

// ---- Career Vault API ----
export const careerApi = {
  listDocuments: (type?: string) =>
    api.get('/career/documents', { params: type ? { type } : {} }),
  getDocument: (id: number) => api.get(`/career/documents/${id}`),
  createDocument: (data: { title: string; type: string; content?: string; fileUrl?: string }) =>
    api.post('/career/documents', data),
  updateDocument: (id: number, data: Record<string, unknown>) =>
    api.put(`/career/documents/${id}`, data),
  deleteDocument: (id: number) => api.delete(`/career/documents/${id}`),
  search: (query: string, topK?: number) =>
    api.post('/career/search', { query, topK }),
  generateIndustryReport: (industry: string) =>
    api.post('/career/report/industry', { industry }),
  getRecommendations: (field?: string) =>
    api.get('/career/recommendations', { params: field ? { field } : {} }),
};
