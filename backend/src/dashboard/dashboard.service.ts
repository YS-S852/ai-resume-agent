import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: number) {
    const [resumeCount, jobApplicationCount, atsReports, recentActivitiesRaw] =
      await Promise.all([
        this.prisma.resume.count({ where: { userId } }),
        this.prisma.careerDocument.count({
          where: { userId, type: 'job_application' },
        }),
        this.prisma.atsReport.findMany({
          where: { userId },
          select: { overallScore: true },
        }),
        this.getRecentActivities(userId),
      ]);

    const atsAvgScore =
      atsReports.length > 0
        ? Math.round(
            atsReports.reduce((sum, r) => sum + r.overallScore, 0) /
              atsReports.length,
          )
        : 0;

    // Determine lastActive from the most recent activity
    const lastActive =
      recentActivitiesRaw.length > 0
        ? this.formatRelativeTime(recentActivitiesRaw[0].createdAt)
        : '';

    const recentActivities = recentActivitiesRaw.slice(0, 5).map((a) => ({
      action: a.action,
      time: this.formatRelativeTime(a.createdAt),
      type: a.type,
    }));

    return {
      resumeCount,
      jobApplicationCount,
      atsAvgScore,
      lastActive,
      recentActivities,
    };
  }

  private async getRecentActivities(userId: number) {
    const activities: {
      action: string;
      type: string;
      createdAt: Date;
    }[] = [];

    // Resume activities
    const [resumes, atsReports, interviews, jds, applications] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.atsReport.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.interviewRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.jobDescription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.careerDocument.findMany({
        where: { userId, type: 'job_application' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    resumes.forEach((r) => {
      activities.push({
        action: `简历「${r.title}」已更新`,
        type: 'resume',
        createdAt: r.updatedAt,
      });
    });

    // ATS report activities
    atsReports.forEach((r) => {
      activities.push({
        action: `ATS检测完成 - 得分 ${r.overallScore}/100`,
        type: 'ats',
        createdAt: r.createdAt,
      });
    });

    // Interview activities
    interviews.forEach((r) => {
      activities.push({
        action: `面试模拟 - ${r.type === 'mock' ? '模拟面试' : r.type}`,
        type: 'interview',
        createdAt: r.createdAt,
      });
    });

    // JD activities
    jds.forEach((j) => {
      activities.push({
        action: `新增JD - ${j.title}`,
        type: 'jd',
        createdAt: j.createdAt,
      });
    });

    applications.forEach((application) => {
      activities.push({
        action: `新增投递 - ${application.title}`,
        type: 'job',
        createdAt: application.createdAt,
      });
    });

    // Sort all activities by createdAt descending and take top 5
    activities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return activities.slice(0, 5);
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  }
}
