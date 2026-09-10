import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto } from './dto/jobs.dto';

const JOB_STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'] as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  private text(value?: string) {
    return value?.trim() || null;
  }

  private date(value?: string) {
    return value ? new Date(value) : null;
  }

  private async validateRelations(userId: number, jdId?: number, resumeId?: number) {
    const [jd, resume] = await Promise.all([
      jdId
        ? this.prisma.jobDescription.findFirst({ where: { id: jdId, userId }, select: { id: true } })
        : null,
      resumeId
        ? this.prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } })
        : null,
    ]);
    if (jdId && !jd) throw new BadRequestException('关联的 JD 不存在');
    if (resumeId && !resume) throw new BadRequestException('关联的简历不存在');
  }

  async create(userId: number, data: CreateJobDto) {
    await this.validateRelations(userId, data.jdId, data.resumeId);
    const status = data.status || 'wishlist';
    const now = new Date();
    return this.prisma.jobApplication.create({
      data: {
        userId,
        company: data.company.trim(),
        position: data.position.trim(),
        salary: this.text(data.salary),
        location: this.text(data.location),
        source: this.text(data.source),
        status,
        notes: this.text(data.notes),
        jobUrl: this.text(data.jobUrl),
        jobDescriptionId: data.jdId,
        resumeId: data.resumeId,
        appliedDate: this.date(data.appliedDate) || (status === 'applied' ? now : null),
        interviewDate: this.date(data.interviewDate) || (status === 'interview' ? now : null),
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, userId: number, data: UpdateJobDto) {
    const existing = await this.prisma.jobApplication.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(`求职记录 #${id} 不存在`);

    await this.validateRelations(userId, data.jdId, data.resumeId);
    const now = new Date();
    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        ...(data.company !== undefined && { company: data.company.trim() }),
        ...(data.position !== undefined && { position: data.position.trim() }),
        ...(data.salary !== undefined && { salary: this.text(data.salary) }),
        ...(data.location !== undefined && { location: this.text(data.location) }),
        ...(data.source !== undefined && { source: this.text(data.source) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: this.text(data.notes) }),
        ...(data.jobUrl !== undefined && { jobUrl: this.text(data.jobUrl) }),
        ...(data.jdId !== undefined && { jobDescriptionId: data.jdId }),
        ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
        ...(data.appliedDate !== undefined && { appliedDate: this.date(data.appliedDate) }),
        ...(data.interviewDate !== undefined && { interviewDate: this.date(data.interviewDate) }),
        ...(data.status === 'applied' && !existing.appliedDate && data.appliedDate === undefined && { appliedDate: now }),
        ...(data.status === 'interview' && !existing.interviewDate && data.interviewDate === undefined && { interviewDate: now }),
      },
    });
  }

  async remove(id: number, userId: number) {
    const result = await this.prisma.jobApplication.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new NotFoundException(`求职记录 #${id} 不存在`);
    return result;
  }

  async getStats(userId: number) {
    const grouped = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });
    const stats: Record<string, number> = {
      total: 0, wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0,
    };
    for (const item of grouped) {
      const count = item._count._all;
      stats.total += count;
      const status = JOB_STATUSES.includes(item.status as typeof JOB_STATUSES[number]) ? item.status : 'wishlist';
      stats[status] += count;
    }
    return stats;
  }
}
