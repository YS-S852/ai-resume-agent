import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class CareerVaultService {
  private readonly logger = new Logger(CareerVaultService.name);

  /** Fallback in-memory store when Qdrant is unavailable. */
  private memoryFallback: Map<string, { docId: number; userId: number; vector: number[]; content: string }> = new Map();
  private fallbackMode = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly qdrant: QdrantService,
  ) {}

  /**
   * Compute cosine similarity between two vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  /**
   * Semantic search via Qdrant (with in-memory fallback).
   */
  async search(
    userId: number,
    query: string,
    topK: number = 5,
  ): Promise<{ docId: number; score: number; title: string; content: string; type: string }[]> {
    const queryVec = await this.ai.generateEmbedding(query);

    if (this.qdrant.isReady() && !this.fallbackMode) {
      return this.searchQdrant(userId, queryVec, topK);
    }
    return this.searchFallback(userId, queryVec, topK);
  }

  /** Qdrant-backed search. */
  private async searchQdrant(
    userId: number,
    vector: number[],
    topK: number,
  ): Promise<{ docId: number; score: number; title: string; content: string; type: string }[]> {
    try {
      const results = await this.qdrant.search(vector, {
        limit: topK,
        filter: {
          must: [{ key: 'userId', match: { value: userId } }],
        },
      });

      return results.map((r) => ({
        docId: (r.payload.docId ?? r.id) as number,
        score: Math.round(r.score * 10000) / 10000,
        title: (r.payload.title as string) ?? '',
        content: (r.payload.content as string) ?? '',
        type: (r.payload.type as string) ?? '',
      }));
    } catch (error) {
      this.logger.error(`Qdrant search failed: ${error.message}, falling back`);
      this.fallbackMode = true;
      return this.searchFallback(userId, vector, topK);
    }
  }

  /** In-memory fallback search. */
  private async searchFallback(
    userId: number,
    vector: number[],
    topK: number,
  ): Promise<{ docId: number; score: number; title: string; content: string; type: string }[]> {
    const candidates: { entry: { docId: number; userId: number; content: string }; score: number }[] = [];
    for (const [, entry] of this.memoryFallback) {
      if (entry.userId === userId) {
        const score = this.cosineSimilarity(vector, entry.vector);
        candidates.push({ entry, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, topK);

    return Promise.all(
      top.map(async (c) => {
        try {
          const doc = await this.prisma.careerDocument.findUnique({
            where: { id: c.entry.docId },
            select: { title: true, content: true, type: true },
          });
          return {
            docId: c.entry.docId,
            score: Math.round(c.score * 10000) / 10000,
            title: doc?.title ?? '',
            content: doc?.content ?? '',
            type: doc?.type ?? '',
          };
        } catch {
          return {
            docId: c.entry.docId,
            score: Math.round(c.score * 10000) / 10000,
            title: '',
            content: c.entry.content,
            type: '',
          };
        }
      }),
    );
  }

  /**
   * Index a document — store vector in Qdrant (or fallback memory).
   */
  async indexDocument(docId: number, userId: number, content: string): Promise<void> {
    try {
      const vector = await this.ai.generateEmbedding(content);

      if (this.qdrant.isReady() && !this.fallbackMode) {
        try {
          await this.qdrant.upsert(docId, vector, {
            docId,
            userId,
            content: content.substring(0, 2000),
          });
          this.logger.log(`Indexed document ${docId} in Qdrant`);
        } catch (error) {
          this.logger.error(`Qdrant upsert failed: ${error.message}, using fallback`);
          this.fallbackMode = true;
          this.memoryFallback.set(`user:${userId}:doc:${docId}`, { docId, userId, vector, content });
        }
      } else {
        this.memoryFallback.set(`user:${userId}:doc:${docId}`, { docId, userId, vector, content });
      }

      // Update vectorId in MySQL as a reference marker
      await this.prisma.careerDocument.update({
        where: { id: docId },
        data: { vectorId: `vec_${docId}_${Date.now()}` },
      });
    } catch (error) {
      this.logger.error(`Failed to index document ${docId}: ${error.message}`);
    }
  }

  /**
   * Remove a document from the vector index.
   */
  async deleteIndex(docId: number): Promise<void> {
    try {
      if (this.qdrant.isReady() && !this.fallbackMode) {
        await this.qdrant.delete(docId);
      }
    } catch (error) {
      this.logger.warn(`Qdrant delete failed for doc ${docId}: ${error.message}`);
    }

    // Always clean up fallback
    for (const [key, entry] of this.memoryFallback) {
      if (entry.docId === docId) {
        this.memoryFallback.delete(key);
        this.logger.log(`Removed fallback index for document ${docId}`);
        return;
      }
    }
  }

  /**
   * Generate a structured industry insight report using AI.
   */
  async generateIndustryReport(userId: number, industry: string): Promise<{ report: string }> {
    const docs = await this.prisma.careerDocument.findMany({
      where: {
        userId,
        type: { in: ['industry', 'knowledge', 'experience'] },
      },
      select: { title: true, content: true },
      take: 10,
    });

    const context = docs
      .map((d) => `【${d.title}】${(d.content ?? '').substring(0, 500)}`)
      .join('\n');

    const prompt = `你是一个行业分析专家AI。请根据以下信息，为「${industry}」行业生成一份结构化的行业洞察报告。
    
参考信息：
${context || '暂无用户存储的行业资料'}

请按以下格式输出报告（使用Markdown）：

## 行业概况
- 当前市场状况和发展趋势

## 核心技能需求
- 该行业最需要的核心技能和技术栈

## 薪资水平
- 不同级别岗位的薪资范围参考

## 职业发展路径
- 典型的职业晋升路径

## 求职建议
- 针对该行业的求职策略和准备建议

请用中文输出，内容详实专业。`;

    const report = await this.ai.chat(
      [
        { role: 'system', content: '你是一个专业的行业分析专家，请提供详细、结构化的行业洞察报告。' },
        { role: 'user', content: prompt },
      ],
      { model: 'pro', temperature: 0.5 },
    );

    return { report };
  }

  /**
   * Generate career path recommendations based on stored knowledge.
   */
  async getRecommendations(userId: number, careerField: string): Promise<{ recommendations: string }> {
    const docs = await this.prisma.careerDocument.findMany({
      where: {
        userId,
        type: { in: ['knowledge', 'experience', 'guide', 'case'] },
      },
      select: { title: true, content: true, type: true },
      take: 15,
    });

    const context = docs
      .map((d) => `[${d.type}] ${d.title}: ${(d.content ?? '').substring(0, 400)}`)
      .join('\n');

    const prompt = `你是一个职业规划专家AI。请根据用户的知识库内容，为其提供职业发展建议。

用户职业方向：${careerField || '未指定'}

用户知识库摘要：
${context || '暂无相关知识储备'}

请按以下格式输出建议（使用Markdown）：

## 能力评估
- 基于知识库内容评估用户当前能力水平

## 技能缺口分析
- 与目标岗位相比，需要补充的技能

## 学习路径建议
- 推荐的学习资源和学习顺序

## 项目实践建议
- 可以积累的项目经验方向

## 简历优化建议
- 如何更好地呈现现有能力和经验

## 求职策略
- 针对性的求职方向和准备建议

请用中文输出，结合用户的实际知识库内容，给出个性化建议。`;

    const recommendations = await this.ai.chat(
      [
        { role: 'system', content: '你是一个资深的职业规划顾问，请根据用户的知识库提供个性化、可操作的职业发展建议。' },
        { role: 'user', content: prompt },
      ],
      { model: 'pro', temperature: 0.6 },
    );

    return { recommendations };
  }
}
