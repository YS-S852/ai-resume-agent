import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [resumeCount, jobGroups, atsAggregate, interviewAggregate, profile, applicationDates, recentActivitiesRaw] =
      await Promise.all([
        this.prisma.resume.count({ where: { userId } }),
        this.prisma.jobApplication.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
        }),
        this.prisma.atsReport.aggregate({
          where: { userId },
          _avg: { overallScore: true },
        }),
        this.prisma.interviewRecord.aggregate({
          where: { userId },
          _count: { _all: true },
          _avg: { score: true },
          _max: { score: true },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            profile: { select: { fullName: true, phone: true, city: true, jobIntention: true, summary: true } },
            education: { take: 1, select: { id: true } },
            workExperience: { take: 1, select: { id: true } },
            projects: { take: 1, select: { id: true } },
            skills: { take: 1, select: { id: true } },
          },
        }),
        this.prisma.jobApplication.findMany({
          where: { userId, createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true },
        }),
        this.getRecentActivities(userId),
      ]);

    const jobFunnel = { wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const group of jobGroups) {
      const status = group.status as keyof typeof jobFunnel;
      if (status in jobFunnel) jobFunnel[status] = group._count._all;
      else jobFunnel.wishlist += group._count._all;
    }
    const jobApplicationCount = Object.values(jobFunnel).reduce((sum, count) => sum + count, 0);

    const basicFields = profile?.profile
      ? [profile.profile.fullName, profile.profile.phone, profile.profile.city, profile.profile.jobIntention, profile.profile.summary]
      : [];
    const profileCompletion = Math.min(100,
      basicFields.filter(Boolean).length * 8
      + (profile?.education.length ? 15 : 0)
      + (profile?.workExperience.length ? 20 : 0)
      + (profile?.projects.length ? 15 : 0)
      + (profile?.skills.length ? 10 : 0),
    );

    const applicationTrend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return { month: key, count: applicationDates.filter((item) => item.createdAt.toISOString().startsWith(key)).length };
    });

    const atsAvgScore = Math.round(atsAggregate._avg.overallScore || 0);

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
      jobFunnel,
      applicationTrend,
      profileCompletion,
      atsAvgScore,
      interviewStats: {
        total: interviewAggregate._count._all,
        averageScore: Math.round(interviewAggregate._avg.score || 0),
        highestScore: interviewAggregate._max.score || 0,
      },
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
      this.prisma.jobApplication.findMany({
        where: { userId },
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
        action: `新增投递 - ${application.company} ${application.position}`,
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
