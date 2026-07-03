<div align="center">

# ResumePilot AI

**AI 智能求职助手 · 从简历到 Offer 的全流程闭环**

</div>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=next.js">
  <img alt="React" src="https://img.shields.io/badge/React-18-149eca?logo=react">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-ea2845?logo=nestjs">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8-4479a1?logo=mysql">
  <img alt="Qdrant" src="https://img.shields.io/badge/Qdrant-vector_search-dc382d?logo=qdrant">
  <img alt="DeepSeek" src="https://img.shields.io/badge/DeepSeek-V4-4d6bfe">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript">
  <img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green">
</p>

---

## 📖 项目简介

**ResumePilot AI** 是一套面向求职者的全流程 AI 求职平台，覆盖「写简历 → 投简历 → 测匹配 → 练面试 → 跟进度」的完整链路。系统借助 DeepSeek V4 大模型完成简历优化、JD 解析、ATS 评分、面试问答等智能任务，并结合 Qdrant 向量检索构建个人知识库，帮助求职者更高效地拿到 Offer。

### ✨ 核心亮点

- **AI 驱动** · 全程接入 DeepSeek V4（`pro` 思考模式 / `flash` 快速模式）
- **可视化简历编辑器** · 浏览器原生 A4 实时预览，所见即所得
- **PDF / DOCX 双向导出** · Puppeteer 渲染 PDF，docx 生成 Word
- **ATS 简历筛查** · 模拟企业 ATS 系统，给出可读性 / 关键词 / 结构评分
- **AI 模拟面试** · 根据 JD 自动出题、追问、评分、TTS 朗读
- **个人知识库** · Qdrant 向量检索 + 语义召回，未启用时自动降级到内存模式
- **玻璃拟态 UI** · 极光渐变背景 + 星空粒子 + 流光特效

---

## 🧠 功能模块

| 模块 | 说明 |
|------|------|
| 🎯 **仪表盘** | 求职全流程数据概览，简历完善度 / 投递漏斗 / 面试进度 |
| 👤 **用户档案** | 教育 / 工作 / 项目 / 技能四象限管理，CRUD 完整 |
| 📄 **简历管理** | 多版本简历，可视化 A4 编辑，模块自由排序 |
| 🎯 **JD 分析** | AI 抽取 JD 关键词、岗位画像、技能要求、薪资估算 |
| 🛡️ **ATS 检测** | 模拟企业简历筛查系统，给出过筛率与优化建议 |
| 💬 **面试中心** | AI 模拟面试官，自适应追问 + 语音朗读 + 评分反馈 |
| 💼 **求职管理** | 投递记录看板，状态流转（待投 / 已投 / 面试 / Offer / 拒绝） |
| 📚 **知识库** | 个人文档向量化，语义搜索召回，支持增量入库 |
| 🌐 **联网调研** | 抓取职位信息 + 联网补充行业洞察 |

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────────────────┐
│                        浏览器 (Browser)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 (App Router)  ·  React 18  ·  TypeScript   │ │
│  │  Tailwind CSS  ·  framer-motion  ·  lucide-react       │ │
│  │  zustand 状态管理  ·  axios HTTP 客户端                 │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                        │ JWT Bearer Token
┌───────────────────────┴──────────────────────────────────────┐
│                NestJS 10 后端 (port 3002)                    │
│  ┌────────────┬────────────┬────────────┬────────────────┐  │
│  │  Auth/JWT  │  Profiles  │  Resumes   │      AI        │  │
│  ├────────────┼────────────┼────────────┼────────────────┤  │
│  │  JD 解析   │  ATS 检测  │  面试中心  │    求职管理     │  │
│  ├────────────┴────────────┴────────────┴────────────────┤  │
│  │         Swagger 文档 /api/docs  ·  multer 文件上传      │  │
│  └─────┬──────────────┬───────────────┬──────────────────┘  │
└────────┼──────────────┼───────────────┼─────────────────────┘
         │              │               │
   ┌─────▼─────┐  ┌─────▼─────┐  ┌──────▼──────┐
   │   MySQL   │  │  Qdrant   │  │  DeepSeek   │
   │  (3306)   │  │  (6333)   │  │   V4 API    │
   │           │  │  向量搜索  │  │ pro / flash │
   │ 业务数据   │  │  知识库    │  │   大模型    │
   └───────────┘  └───────────┘  └─────────────┘

            ┌──────────────────────────┐
            │  Puppeteer  +  docx       │
            │  PDF / DOCX 简历导出       │
            └──────────────────────────┘
```

### 技术栈一览

#### 前端
- **框架**：Next.js 14 (App Router) + React 18 + TypeScript
- **样式**：Tailwind CSS + 自定义玻璃拟态 / 极光背景
- **动画**：framer-motion
- **状态**：React Hooks + zustand
- **HTTP**：axios
- **图标**：lucide-react

#### 后端
- **框架**：NestJS 10 + TypeScript
- **ORM**：Prisma 5
- **数据库**：MySQL 8
- **认证**：JWT + Passport（Bearer Token）
- **向量库**：Qdrant（知识库语义搜索，可优雅降级）
- **AI**：DeepSeek V4（`deepseek-v4-pro` / `deepseek-v4-flash`）
- **文档**：Swagger / OpenAPI（`/api/docs`）
- **文件解析**：pdf-parse、tesseract.js（OCR）、cheerio（HTML 抓取）
- **导出**：Puppeteer（PDF）、docx（Word）

---

## 📁 目录结构

```
ai-resume-agent/
├── backend/                      # NestJS 后端
│   ├── prisma/
│   │   ├── schema.prisma         # 数据库模型
│   │   └── seed-test-data.ts     # 测试数据种子
│   ├── src/
│   │   ├── ai/                   # AI 服务（DeepSeek 集成）
│   │   ├── auth/                 # 认证（JWT + Passport）
│   │   ├── ats/                  # ATS 简历筛查
│   │   ├── career/               # 知识库 / 职业文档
│   │   ├── dashboard/            # 仪表盘数据聚合
│   │   ├── export/               # PDF / DOCX 导出
│   │   ├── interview/            # 面试中心（含 TTS）
│   │   ├── jd/                   # JD 解析
│   │   ├── jobs/                 # 求职记录管理
│   │   ├── profiles/             # 用户档案 CRUD
│   │   ├── qdrant/               # Qdrant 向量库服务
│   │   ├── resumes/              # 简历管理
│   │   ├── search/               # 联网调研 / 搜索 Agent
│   │   ├── users/                # 用户管理
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example              # 环境变量模板
│   └── package.json
│
├── frontend/                     # Next.js 14 前端
│   ├── public/
│   │   ├── architecture.html
│   │   └── login.html
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/        # 仪表盘
│   │   │   ├── profile/          # 用户档案
│   │   │   ├── resume/           # 简历管理 + 编辑器
│   │   │   ├── jd/               # JD 分析
│   │   │   ├── ats/              # ATS 检测
│   │   │   ├── interview/        # 面试中心
│   │   │   ├── jobs/             # 求职管理
│   │   │   ├── career/           # 知识库
│   │   │   ├── search/           # 联网调研
│   │   │   ├── login/            # 登录页
│   │   │   ├── register/         # 注册页
│   │   │   ├── globals.css       # 全局样式 + 极光/玻璃拟态
│   │   │   └── layout.tsx        # 根布局
│   │   ├── components/
│   │   │   └── AutoLogin.tsx     # 自动登录组件
│   │   ├── hooks/
│   │   │   └── useLogout.ts      # 退出登录 Hook
│   │   └── lib/
│   │       └── api.ts            # axios API 客户端
│   ├── tailwind.config.ts
│   └── package.json
│
├── qdrant/                       # Qdrant 一键启动脚本
│   ├── download.ps1
│   └── start.bat
│
├── .gitignore
└── README.md
```

---

## 🚀 快速开始

### 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.17 | 前后端运行时 |
| npm | ≥ 9 | 包管理 |
| MySQL | ≥ 8.0 | 主数据库 |
| Qdrant | ≥ 1.8 | 知识库向量搜索（可选，不装会自动降级到内存模式） |
| Git | ≥ 2.30 | 版本控制 |
| Windows / macOS / Linux | — | 跨平台支持 |

### 1. 克隆仓库

```bash
git clone https://github.com/YS-S852/ai-resume-agent.git
cd ai-resume-agent
```

### 2. 后端配置

```bash
cd backend
npm install

# 复制环境变量模板，填入真实配置
cp .env.example .env
# （Windows PowerShell：Copy-Item .env.example .env）

# 编辑 .env，填写：
#   DATABASE_URL      MySQL 连接串
#   JWT_SECRET        随机字符串（生产环境务必更换）
#   DEEPSEEK_API_KEY  在 https://platform.deepseek.com 获取
#   QDRANT_URL        Qdrant 地址（默认 http://localhost:6333）
```

`.env` 关键字段：

```bash
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/resume_pilot_ai?charset=utf8mb4"
JWT_SECRET="change-me-to-a-random-secret"
DEEPSEEK_API_KEY="sk-your-deepseek-api-key-here"
DEEPSEEK_MODEL_PRO="deepseek-v4-pro"      # 思考模式
DEEPSEEK_MODEL_FLASH="deepseek-v4-flash"  # 快速模式
QDRANT_URL="http://localhost:6333"
```

### 3. 初始化数据库

```bash
# 在 MySQL 中创建数据库
mysql -u root -p -e "CREATE DATABASE resume_pilot_ai CHARACTER SET utf8mb4;"

# 生成 Prisma 客户端 + 推送 schema
npm run prisma:generate
npx prisma db push

# （可选）填充测试数据
npx ts-node prisma/seed-test-data.ts
```

### 4. 启动后端

```bash
npm run start:dev
# 默认运行在 http://localhost:3002
# Swagger 文档：http://localhost:3002/api/docs
```

### 5. 启动前端

```bash
cd ../frontend
npm install
npm run dev
# 默认运行在 http://localhost:3000（如被占用可用 npx next dev -p 3001）
```

### 6. 启动 Qdrant（可选，用于知识库）

```powershell
# Windows：在项目根目录运行
.\qdrant\start.bat
```

Qdrant 未启动时，知识库 / 联网调研功能会自动降级到内存模式，其他功能不受影响。

### 7. 访问应用

打开浏览器访问 `http://localhost:3000`，使用默认账号登录：

- **用户名**：`user`
- **密码**：`123456`

---

## 📡 API 一览

后端启动后访问 `http://localhost:3002/api/docs` 查看完整 Swagger 文档。

| 模块 | 路由前缀 | 主要功能 |
|------|---------|---------|
| 认证 | `/auth` | 注册 / 登录 / Token 验证 |
| 用户档案 | `/profiles` | Profile / Education / Work / Project / Skill CRUD |
| 简历 | `/resumes` | 多版本简历管理 |
| JD 分析 | `/jd` | JD 文本抽取 / 关键词分析 |
| ATS 检测 | `/ats` | 简历过筛率评分 + 优化建议 |
| 面试中心 | `/interview` | 模拟面试 / 自适应追问 / TTS |
| 求职管理 | `/jobs` | 投递记录看板 |
| 知识库 | `/career` | 文档向量化 / 语义检索 |
| 联网调研 | `/search` | 职位搜索 Agent |
| 导出 | `/export` | PDF / DOCX 下载 |
| AI | `/ai` | DeepSeek 调用封装 |
| 仪表盘 | `/dashboard` | 全局数据聚合 |

---

## 🔑 数据模型

核心表结构（详见 `backend/prisma/schema.prisma`）：

```
User ─┬─ Profile              用户基础档案
      ├─ Education[]         教育经历
      ├─ WorkExperience[]    工作经历
      ├─ Project[]           项目经历
      ├─ Skill[]             技能矩阵
      ├─ Resume[]            简历版本
      ├─ JobDescription[]    JD 记录
      ├─ AtsReport[]         ATS 评分报告
      ├─ InterviewRecord[]   面试记录
      ├─ CareerDocument[]    知识库文档
      └─ SearchHistory[]     调研历史
```

---

## 🛡️ 安全提醒

- ⚠️ **生产环境部署前务必更换 `JWT_SECRET`** 为足够随机的字符串
- ⚠️ **`.env` 文件已被 `.gitignore` 排除**，请勿提交真实密钥到 git
- ⚠️ DeepSeek 旧模型名（`deepseek-chat` / `deepseek-reasoner`）将于 **2026-07-24 退役**，本项目已切换至 `deepseek-v4-pro` / `deepseek-v4-flash`
- ⚠️ 公开部署前请检查 CORS 配置，避免 API 暴露
- ⚠️ 建议为 MySQL 配置独立账号，最小权限原则

---

## 🧩 部署说明

### 生产环境构建

```bash
# 后端
cd backend
npm run build
npm run start:prod   # node dist/main

# 前端
cd ../frontend
npm run build
npm run start        # next start，默认 3000
```

### 反向代理建议

生产环境推荐使用 Nginx 反向代理：

```
/api/*     →  http://127.0.0.1:3002    # 后端
/*         →  http://127.0.0.1:3000    # 前端（next start）
```

---

## ❓ 常见问题

**Q: 启动前端报 "Port 3000 is in use" 怎么办？**
A: 用 `npx next dev -p 3001` 改到其他端口；或在 Windows 上用 `netstat -ano | findstr :3000` 找到占用进程。

**Q: Qdrant 下载特别慢怎么办？**
A: Qdrant 二进制从 GitHub releases 拉取，国内访问较慢。可改用 GitHub 镜像（如 ghproxy）或直接跳过 Qdrant —— 其他功能会自动降级到内存模式，不影响使用。

**Q: DeepSeek API 调用失败？**
A: 检查 `.env` 中 `DEEPSEEK_API_KEY` 是否正确、账户是否有余额。模型名务必用 `deepseek-v4-pro` / `deepseek-v4-flash`，旧名即将退役。

**Q: PDF 导出乱码？**
A: Puppeteer 首次运行会下载 Chromium，确保网络通畅；如已安装 Chrome，可在 `.env` 中指定 `PUPPETEER_EXECUTABLE_PATH`。

---

## 📜 License

本项目采用 [MIT License](LICENSE) 开源。

## 🙏 鸣谢

- [DeepSeek](https://www.deepseek.com) — 大模型支持
- [Qdrant](https://qdrant.tech) — 向量数据库
- [Next.js](https://nextjs.org) · [NestJS](https://nestjs.com) · [Prisma](https://www.prisma.io) · [Tailwind CSS](https://tailwindcss.com)
- [Puppeteer](https://pptr.dev) · [docx](https://docx.js.org) · [lucide-react](https://lucide.dev)

---

<div align="center">

**如果这个项目对你有帮助，欢迎 ⭐ Star 支持一下！**

Made with ❤️ by [YS-S852](https://github.com/YS-S852)

</div>
