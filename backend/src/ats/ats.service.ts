import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AnalyzeATSDto, OptimizeResumeDto } from './dto/ats.dto';

@Injectable()
export class ATSService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async analyze(userId: number, data: AnalyzeATSDto) {
    await this.assertResourceOwnership(userId, data.resumeId, data.jdId);
    const result = await this.aiService.scoreATS(data.resumeContent, data.jdContent);

    const report = await this.prisma.atsReport.create({
      data: {
        userId,
        resumeId: data.resumeId,
        jobDescriptionId: data.jdId,
        overallScore: result.overallScore,
        keywordScore: result.keywordScore,
        skillMatchScore: result.skillMatchScore,
        projectScore: result.projectScore,
        achievementScore: result.achievementScore,
        formatScore: result.formatScore,
        details: result.details as any,
        suggestions: (result.details.suggestions ?? result.suggestions) as any,
      },
    });

    return this.toResponse({ ...report, details: result.details });
  }

  async optimize(data: OptimizeResumeDto) {
    return this.aiService.optimizeResumeForJD(data.resumeContent, data.jdContent);
  }

  async getHistory(userId: number) {
    const reports = await this.prisma.atsReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { jobDescription: true },
    });
    return reports.map((report) => ({
      id: report.id,
      overallScore: report.overallScore,
      jobTitle: report.jobDescription?.title ?? '未命名职位',
      createdAt: report.createdAt,
    }));
  }

  async getReport(id: number, userId: number) {
    const report = await this.prisma.atsReport.findFirst({
      where: { id, userId },
      include: { jobDescription: true },
    });
    return report ? this.toResponse(report) : null;
  }

  private toResponse(report: {
    id: number;
    overallScore: number;
    keywordScore: number | null;
    skillMatchScore: number | null;
    projectScore: number | null;
    achievementScore: number | null;
    formatScore: number | null;
    details: unknown;
    suggestions?: unknown;
  }) {
    const details = (report.details && typeof report.details === 'object'
      ? report.details
      : {}) as Record<string, any>;
    const suggestionsSource = Array.isArray(details.suggestions)
      ? details.suggestions
      : Array.isArray(report.suggestions)
        ? report.suggestions
        : [];
    const suggestions = suggestionsSource.map((suggestion) =>
      typeof suggestion === 'string'
        ? { category: '通用', issue: '', fix: suggestion }
        : suggestion,
    );

    return {
      id: report.id,
      overallScore: report.overallScore,
      dimensions: {
        keywordCoverage: report.keywordScore ?? 0,
        skillMatch: report.skillMatchScore ?? 0,
        projectExperience: report.projectScore ?? 0,
        resultQuantification: report.achievementScore ?? 0,
        formatStandard: report.formatScore ?? 0,
      },
      strengths: Array.isArray(details.strengths) ? details.strengths : [],
      weaknesses: Array.isArray(details.weaknesses) ? details.weaknesses : [],
      suggestions,
    };
  }

  private async assertResourceOwnership(
    userId: number,
    resumeId?: number,
    jdId?: number,
  ) {
    const [resume, jd] = await Promise.all([
      resumeId
        ? this.prisma.resume.findFirst({
            where: { id: resumeId, userId },
            select: { id: true },
          })
        : Promise.resolve(null),
      jdId
        ? this.prisma.jobDescription.findFirst({
            where: { id: jdId, userId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (resumeId && !resume) {
      throw new NotFoundException(`简历 #${resumeId} 不存在`);
    }
    if (jdId && !jd) {
      throw new NotFoundException(`JD #${jdId} 不存在`);
    }
  }
}
