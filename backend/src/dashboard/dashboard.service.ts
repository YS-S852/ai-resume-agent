import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: number) {
    // Resume count
    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });

    // Job description count (represents job applications)
    const jobApplicationCount = await this.prisma.jobDescription.count({
      where: { userId },
    });

    // ATS average score
    const atsReports = await this.prisma.atsReport.findMany({
      where: { userId },
      select: { overallScore: true },
    });
    const atsAvgScore =
      atsReports.length > 0
        ? Math.round(
            atsReports.reduce((sum, r) => sum + r.overallScore, 0) /
              atsReports.length,
          )
        : 0;

    // Last active time - find the most recent record across all activity types
    const recentActivitiesRaw = await this.getRecentActivities(userId);

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
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });
    resumes.forEach((r) => {
      activities.push({
        action: `简历「${r.title}」已更新`,
        type: 'resume',
        createdAt: r.updatedAt,
      });
    });

    // ATS report activities
    const atsReports = await this.prisma.atsReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    atsReports.forEach((r) => {
      activities.push({
        action: `ATS检测完成 - 得分 ${r.overallScore}/100`,
        type: 'ats',
        createdAt: r.createdAt,
      });
    });

    // Interview activities
    const interviews = await this.prisma.interviewRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    interviews.forEach((r) => {
      activities.push({
        action: `面试模拟 - ${r.type === 'mock' ? '模拟面试' : r.type}`,
        type: 'interview',
        createdAt: r.createdAt,
      });
    });

    // JD activities
    const jds = await this.prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    jds.forEach((j) => {
      activities.push({
        action: `新增JD - ${j.title}`,
        type: 'jd',
        createdAt: j.createdAt,
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