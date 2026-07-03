import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterviewDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query all interview records for this user and compute dashboard statistics.
   */
  async getDashboard(userId: number) {
    const allRecords = await this.prisma.interviewRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Total interviews
    const totalInterviews = allRecords.length;

    // Average score (only for records that have a score)
    const scoredRecords = allRecords.filter((r) => r.score !== null && r.score !== undefined);
    const averageScore =
      scoredRecords.length > 0
        ? Math.round(scoredRecords.reduce((sum, r) => sum + (r.score as number), 0) / scoredRecords.length)
        : 0;

    // Highest score
    const highestScore =
      scoredRecords.length > 0
        ? Math.max(...scoredRecords.map((r) => r.score as number))
        : 0;

    // Last session date
    const lastSessionDate = allRecords.length > 0 ? allRecords[0].createdAt : null;

    // Trend data: last 5 scores with dates
    const trend = scoredRecords.slice(0, 5).map((r) => ({
      score: r.score as number,
      date: this.formatDate(r.createdAt),
      type: r.type,
    }));

    // Question type distribution (count by interview type)
    const typeDistribution: Record<string, number> = {};
    allRecords.forEach((r) => {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    });

    // Most common feedback patterns
    const feedbackPatterns = this.extractFeedbackPatterns(allRecords);

    // Past sessions list
    const pastSessions = allRecords.map((r) => ({
      id: r.id,
      type: r.type,
      date: this.formatDate(r.createdAt),
      score: r.score,
      questionCount: r.questions ? (Array.isArray(r.questions) ? (r.questions as any[]).length : 0) : 0,
    }));

    return {
      totalInterviews,
      averageScore,
      highestScore,
      lastSessionDate: lastSessionDate ? this.formatDate(lastSessionDate) : null,
      trend,
      typeDistribution,
      feedbackPatterns,
      pastSessions,
    };
  }

  /**
   * Get full session detail with questions, answers, feedback.
   */
  async getSessionDetail(id: number, userId: number) {
    const record = await this.prisma.interviewRecord.findFirst({
      where: { id, userId },
    });

    if (!record) return null;

    return {
      id: record.id,
      type: record.type,
      date: this.formatDate(record.createdAt),
      score: record.score,
      questions: record.questions || [],
      answers: record.answers || [],
      feedback: record.feedback || {},
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private extractFeedbackPatterns(
    records: Array<{ feedback: any }>,
  ): Array<{ pattern: string; count: number }> {
    const patternCounts: Record<string, number> = {};
    records.forEach((r) => {
      const fb = r.feedback;
      if (!fb) return;
      // Extract strengths and improvements from feedback JSON
      if (fb && typeof fb === 'object') {
        const strengths = fb.strengths || fb.dimensions || [];
        const items = Array.isArray(strengths) ? strengths : [strengths];
        items.forEach((item: any) => {
          const key = typeof item === 'string' ? item : item.label || item.name || JSON.stringify(item);
          patternCounts[key] = (patternCounts[key] || 0) + 1;
        });
      }
    });

    return Object.entries(patternCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }
}
