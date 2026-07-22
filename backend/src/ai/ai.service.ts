import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelPro: string;
  private readonly modelFlash: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('DEEPSEEK_API_KEY', '');
    this.baseUrl = this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com');
    this.modelPro = this.config.get<string>('DEEPSEEK_MODEL_PRO', 'deepseek-v4-pro');
    this.modelFlash = this.config.get<string>('DEEPSEEK_MODEL_FLASH', 'deepseek-v4-flash');
  }

  /**
   * Generic chat completion via DeepSeek API
   */
  async chat(
    messages: ChatMessage[],
    options?: { model?: 'pro' | 'flash'; temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const model = options?.model === 'pro' ? this.modelPro : this.modelFlash;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 4096;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`DeepSeek API error: ${response.status} ${errorText}`);
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error(`DeepSeek API call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze a Job Description - extract structured info
   */
  async analyzeJD(rawJD: string): Promise<{
    parsed: Record<string, unknown>;
    suggestions: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的HR和招聘专家AI。你的任务是深度解析职位描述(JD)，提取结构化信息，并给出**针对该具体岗位**的简历优化建议。

请严格按照以下JSON格式输出，不要添加任何额外文字：
{
  "jobTitle": "岗位名称",
  "company": "公司名称(如有)",
  "department": "部门(如有)",
  "experienceRequired": "工作经验要求",
  "educationRequired": "学历要求",
  "salaryRange": "薪资范围(如有)",
  "location": "工作地点(如有)",
  "coreSkills": ["核心技能1", "核心技能2"],
  "niceToHave": ["加分项1", "加分项2"],
  "responsibilities": ["职责1", "职责2"],
  "benefits": ["福利1", "福利2"],
  "keywords": ["关键词1", "关键词2"],
  "suggestions": [
    "针对该岗位的简历优化建议1（必须结合该岗位的具体技能要求、职责特点来给出，包含具体关键词和修改方向）",
    "针对该岗位的简历优化建议2",
    "针对该岗位的简历优化建议3",
    "针对该岗位的简历优化建议4",
    "针对该岗位的简历优化建议5"
  ]
}

优化建议要求：
- 必须高度贴合该JD所描述的岗位，不能写泛泛而谈的通用建议
- 每条建议应具体、可操作，说明在简历哪个部分（如摘要、技能列表、项目经历等）做什么修改
- 建议覆盖：关键词匹配策略、核心技能突出方式、项目经历选取与包装、量化成果方向、简历结构与排版
- 如果JD提到具体技术栈或工具，建议中应明确提到如何在简历中体现
- 输出5条建议`,
      },
      {
        role: 'user',
        content: `请分析以下职位描述：\n\n${rawJD}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.3 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      // Extract AI-generated suggestions; fall back to position-aware defaults
      const suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions
        : [
            `建议在简历中突出与「${parsed.jobTitle || '目标岗位'}」相关的核心技能：${(parsed.coreSkills || []).slice(0, 4).join('、')}`,
            `建议项目经历中体现与${parsed.jobTitle || '该岗位'}职责匹配的具体成果`,
            '建议量化工作成果，使用数据支撑（如提升效率百分比、管理团队规模等）',
          ];
      // Remove suggestions from parsed to keep the original structure clean
      const { suggestions: _s, ...parsedWithoutSuggestions } = parsed;
      return {
        parsed: parsedWithoutSuggestions,
        suggestions,
      };
    } catch {
      return { parsed: { raw: result }, suggestions: ['解析失败，请手动检查JD内容'] };
    }
  }

  /**
   * ATS Scoring - analyze resume against JD
   */
  async scoreATS(
    resumeContent: string,
    jdContent: string,
  ): Promise<{
    overallScore: number;
    keywordScore: number;
    skillMatchScore: number;
    projectScore: number;
    achievementScore: number;
    formatScore: number;
    details: Record<string, unknown>;
    suggestions: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个ATS(申请人追踪系统)专家AI。你需要根据目标JD对简历进行五维度评分(百分制)。
评分维度：
1. 关键词覆盖率(20分)：JD核心技能、岗位关键词在简历中的匹配数量与密度
2. 技能匹配度(25分)：用户技能栈与岗位要求的精准匹配程度
3. 项目经验(20分)：项目场景、技术栈、岗位职责与JD的契合度
4. 成果量化(20分)：是否具备数据化成果、落地效益、个人价值体现
5. 格式规范(15分)：排版、结构、字数是否符合ATS识别标准

严格按JSON格式输出：
{
  "overallScore": 85,
  "keywordScore": 17,
  "skillMatchScore": 22,
  "projectScore": 18,
  "achievementScore": 15,
  "formatScore": 13,
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": [
    {"category": "关键词", "issue": "缺少XX关键词", "fix": "建议在XX处添加"},
    {"category": "技能", "issue": "技能描述不够精准", "fix": "建议改为XX"}
  ],
  "optimizedContent": "优化后的关键段落内容示例"
}`,
      },
      {
        role: 'user',
        content: `请对以下简历进行ATS评分：

【目标JD】
${jdContent}

【简历内容】
${resumeContent}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.3 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        overallScore: parsed.overallScore ?? 0,
        keywordScore: parsed.keywordScore ?? 0,
        skillMatchScore: parsed.skillMatchScore ?? 0,
        projectScore: parsed.projectScore ?? 0,
        achievementScore: parsed.achievementScore ?? 0,
        formatScore: parsed.formatScore ?? 0,
        details: parsed,
        suggestions: parsed.suggestions?.map((s: { fix?: string }) => s.fix ?? String(s)) ?? [],
      };
    } catch {
      return {
        overallScore: 0, keywordScore: 0, skillMatchScore: 0,
        projectScore: 0, achievementScore: 0, formatScore: 0,
        details: { raw: result }, suggestions: ['评分解析失败，请重试'],
      };
    }
  }

  /**
   * Generate interview questions based on JD and resume
   */
  async generateInterviewQuestions(
    jdContent: string,
    resumeContent: string,
    count: number = 15,
  ): Promise<Record<string, unknown>[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个资深面试官AI。根据目标JD和候选人简历，生成${count}道高质量面试题。
题目类型分布：基础题(30%)、进阶题(30%)、项目实操题(20%)、行为面试题(20%)。
严格按JSON数组格式输出：
[
  {
    "id": 1,
    "type": "基础题|进阶题|项目实操题|行为面试题",
    "question": "面试题目",
    "expectedPoints": ["期望回答要点1", "期望回答要点2"],
    "difficulty": "easy|medium|hard"
  }

]`,
      },
      {
        role: 'user',
        content: `目标JD：\n${jdContent}\n\n候选人简历：\n${resumeContent}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.7 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }

  async optimizeResumeForJD(
    resumeContent: string,
    jdContent: string,
  ): Promise<{ optimizedContent: string; changes: string[] }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是资深简历顾问和 ATS 优化专家。请在不编造经历的前提下，针对目标 JD 优化候选人的简历。

严格遵守：
- 保留原简历中的姓名、公司、学校、时间、职位、项目和客观数据，不得虚构不存在的技能、项目或成果
- 可以重组表达、补充 JD 中已有且原简历能够支持的关键词、使用 STAR 结构，并指出仍需候选人补充的数据
- optimizedContent 必须是可直接编辑使用的纯文本完整简历，不要使用 Markdown 代码块
- changes 列出 3-8 条本次实际修改

严格按 JSON 输出：
{
  "optimizedContent": "优化后的完整简历文本",
  "changes": ["修改说明1", "修改说明2"]
}`,
      },
      {
        role: 'user',
        content: `【目标 JD】\n${jdContent}\n\n【原始简历】\n${resumeContent}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.25 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        optimizedContent: String(parsed.optimizedContent ?? '').trim(),
        changes: Array.isArray(parsed.changes) ? parsed.changes.map(String) : [],
      };
    } catch {
      return { optimizedContent: result.trim(), changes: [] };
    }
  }

  /**
   * Mock interview - AI plays the interviewer role
   */
  async mockInterviewChat(
    history: ChatMessage[],
    jdContent: string,
  ): Promise<string> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `你正在扮演一位专业面试官，对候选人进行模拟面试。
目标岗位JD：${jdContent}

面试规则：
1. 每次只问一个问题，等待候选人回答
2. 根据候选人的回答进行追问或转向下一个话题
3. 问题要有针对性，结合JD要求和候选人经历
4. 语气专业但友好，像真实面试官
5. 在候选人回答后，先给出简短反馈再问下一个问题
6. 如果候选人回答不清楚，给出引导性提示`,
    };

    return this.chat([systemMessage, ...history], { model: 'pro', temperature: 0.8 });
  }

  /**
   * Generate resume content based on user profile and target JD
   */
  async generateResumeContent(
    profileData: Record<string, unknown>,
    jdContent?: string,
  ): Promise<Record<string, unknown>> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业简历撰写专家AI。根据用户的个人信息和目标岗位，生成高质量简历内容。
输出JSON格式：
{
  "summary": "个人简介(3-4句话，突出核心竞争力)",
  "experienceEnhanced": [
    {
      "company": "公司名",
      "position": "职位",
      "bullets": ["优化后的工作描述1(使用STAR法则，量化成果)", "..."]
    }
  ],
  "projectEnhanced": [
    {
      "name": "项目名",
      "bullets": ["优化后的项目描述1(突出技术贡献和业务价值)", "..."]
    }
  ],
  "skillsSummary": "技能概述(按相关性排序)",
  "keywords": ["简历关键词1", "关键词2"]
}`,
      },
      {
        role: 'user',
        content: `用户资料：${JSON.stringify(profileData)}${jdContent ? `\n\n目标JD：${jdContent}` : ''}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.5 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { summary: result };
    }
  }

  /**
   * Polish / enhance resume content
   */
  async polishResumeContent(
    originalText: string,
    style: 'professional' | 'creative' | 'technical' = 'professional',
  ): Promise<string> {
    const styleMap = {
      professional: '专业正式',
      creative: '创意生动',
      technical: '技术精准',
    };

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个简历润色专家AI。请用${styleMap[style]}风格润色以下简历内容。
要求：
1. 使用STAR法则重构描述
2. 添加量化数据(如百分比、金额、人数)
3. 使用更有力的行动动词
4. 保持真实，不编造经历
5. 中文输出`,
      },
      { role: 'user', content: originalText },
    ];

    return this.chat(messages, { model: 'flash', temperature: 0.6 });
  }

  /**
   * Convenience method: generate a response from a user message and system prompt.
   */
  async generateResponse(
    userMessage: string,
    systemPrompt: string,
    options?: { model?: 'pro' | 'flash'; temperature?: number },
  ): Promise<string> {
    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      options,
    );
  }

  /**
   * Generate a text embedding vector.
   *
   * NOTE: DeepSeek does not offer an embeddings endpoint. Until a dedicated
   * embedding provider (e.g. OpenAI text-embedding-3, Cohere, or a local
   * sentence-transformers model) is wired in, we use a deterministic
   * character n-gram feature hash. This keeps Qdrant functional for keyword
   * overlap retrieval, but it is NOT true semantic search — upgrade this
   * method when better retrieval quality is required.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text?.trim()) return new Array(768).fill(0);
    return this.hashEmbedding(text);
  }

  /**
   * Fallback embedding: character n-gram hashing → 768-dim vector.
   */
  private hashEmbedding(text: string): number[] {
    const DIM = 768;
    const vector = new Array(DIM).fill(0);
    const normalized = text.toLowerCase().trim();
    if (!normalized) return vector;

    const ngrams: string[] = [];
    for (let i = 0; i < normalized.length; i++) {
      ngrams.push(normalized.substring(i, i + 1));
      if (i < normalized.length - 1) ngrams.push(normalized.substring(i, i + 2));
      if (i < normalized.length - 2) ngrams.push(normalized.substring(i, i + 3));
    }

    for (const gram of ngrams) {
      let hash = 0;
      for (let i = 0; i < gram.length; i++) {
        hash = ((hash << 5) - hash + gram.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % DIM;
      vector[idx] += 1;
    }

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / norm);
  }

  /**
   * Score a mock interview based on questions, candidate answers, and target JD.
   * Returns structured dimension scores, strengths, improvements and a summary.
   */
  async scoreInterview(
    questions: Array<{ id?: number; question: string; expectedPoints?: string[] }>,
    answers: Array<{ question?: string; answer: string }>,
    jdContent: string,
  ): Promise<{
    overallScore: number;
    dimensions: Array<{ label: string; score: number; maxScore: number }>;
    strengths: string[];
    improvements: string[];
    summary: string;
  }> {
    const qaBlock = answers
      .map((a, i) => {
        const q = a.question || questions[i]?.question || `问题${i + 1}`;
        const expected = questions[i]?.expectedPoints?.join('；') || '（无参考要点）';
        return `【Q${i + 1}】${q}\n参考要点：${expected}\n候选人回答：${a.answer || '（未作答）'}`;
      })
      .join('\n\n');

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一位资深面试评估专家AI。请根据目标岗位JD、面试问题、参考答案要点以及候选人的实际回答，对本次面试进行综合评分与点评。

严格按以下JSON格式输出，不要添加任何额外文字：
{
  "overallScore": 78,
  "dimensions": [
    { "label": "回答完整性", "score": 75, "maxScore": 100 },
    { "label": "专业性", "score": 80, "maxScore": 100 },
    { "label": "逻辑性", "score": 72, "maxScore": 100 },
    { "label": "岗位匹配度", "score": 85, "maxScore": 100 }
  ],
  "strengths": ["亮点1（结合具体回答）", "亮点2"],
  "improvements": ["改进建议1（具体、可操作）", "改进建议2"],
  "summary": "整体表现概述（2-3句话）"
}

评分要求：
- overallScore 为 0-100 整数，综合四个维度加权得出
- 四个维度固定为：回答完整性、专业性、逻辑性、岗位匹配度，maxScore 均为 100
- strengths 与 improvements 必须基于候选人的真实回答内容，每项 2-4 条
- 评分要客观严格，不要默认给高分；未作答或答非所问的题目要扣分`,
      },
      {
        role: 'user',
        content: `【目标岗位JD】\n${jdContent}\n\n【面试问答记录】\n${qaBlock}`,
      },
    ];

    const result = await this.chat(messages, { model: 'pro', temperature: 0.3 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const dimensions = Array.isArray(parsed.dimensions)
        ? parsed.dimensions.map((d: { label: string; score: number; maxScore: number }) => ({
            label: String(d.label ?? ''),
            score: Number(d.score ?? 0),
            maxScore: Number(d.maxScore ?? 100),
          }))
        : [];
      return {
        overallScore: Math.max(0, Math.min(100, Math.round(Number(parsed.overallScore ?? 0)))),
        dimensions,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
        summary: String(parsed.summary ?? ''),
      };
    } catch {
      return {
        overallScore: 0,
        dimensions: [],
        strengths: [],
        improvements: ['评分解析失败，请重试'],
        summary: 'AI 评分解析失败，无法生成评估报告。',
      };
    }
  }

  /**
   * AI-powered profile info extraction from natural language
   */
  async extractProfileInfo(rawInput: string): Promise<Record<string, unknown>> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是职业档案信息提取专家。只提取用户明确提供的信息，不推测、不补全、不编造。缺失的字符串输出空字符串，缺失的数组输出空数组。
严格按以下 JSON 格式输出，不要添加额外文字：
{
  "profile": {
    "fullName": "姓名",
    "phone": "电话",
    "city": "城市",
    "jobTitle": "当前职位",
    "jobIntention": "求职意向",
    "expectedSalary": "期望薪资",
    "summary": "基于原文整理的职业简介"
  },
  "education": [{
    "school": "学校", "major": "专业", "degree": "学历",
    "startDate": "开始时间", "endDate": "结束时间", "gpa": "GPA", "honors": "荣誉"
  }],
  "workExperience": [{
    "company": "公司", "industry": "行业", "position": "职位",
    "startDate": "开始时间", "endDate": "结束时间",
    "responsibilities": "职责", "achievements": "成果"
  }],
  "projects": [{
    "name": "项目名", "startDate": "开始时间", "endDate": "结束时间",
    "techStack": "逗号分隔的技术栈", "background": "背景",
    "responsibilities": "职责", "contributions": "个人贡献", "results": "结果"
  }],
  "skills": [{
    "category": "tech/software/language/certificate 四选一",
    "name": "技能名称", "level": "熟练度"
  }]
}`,
      },
      { role: 'user', content: rawInput },
    ];

    const result = await this.chat(messages, { model: 'flash', temperature: 0.2 });
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { raw: result };
    }
  }
}
