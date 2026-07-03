import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ATSService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async analyze(userId: number, data: { resumeId?: number; jdId?: number; resumeContent: string; jdContent: string }) {
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
        suggestions: result.suggestions as any,
      },
    });

    return { id: report.id, ...result };
  }

  async getHistory(userId: number) {
    return this.prisma.atsReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { jobDescription: true },
    });
  }

  async getReport(id: number, userId: number) {
    return this.prisma.atsReport.findFirst({
      where: { id, userId },
      include: { jobDescription: true },
    });
  }
}
