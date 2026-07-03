import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, data: {
    company: string;
    position: string;
    salary?: string;
    location?: string;
    source?: string;
    status?: string;
    notes?: string;
    jdId?: number;
  }) {
    return this.prisma.careerDocument.create({
      data: {
        userId,
        title: `${data.company} - ${data.position}`,
        type: 'job_application',
        content: JSON.stringify({
          company: data.company,
          position: data.position,
          salary: data.salary || '',
          location: data.location || '',
          source: data.source || '',
          status: data.status || 'wishlist',
          notes: data.notes || '',
          jdId: data.jdId,
          appliedDate: null,
          interviewDate: null,
        }),
      },
    });
  }

  async findAll(userId: number) {
    const docs = await this.prisma.careerDocument.findMany({
      where: { userId, type: 'job_application' },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map(d => {
      const data = typeof d.content === 'string' ? JSON.parse(d.content) : {};
      return { id: d.id, ...data, createdAt: d.createdAt, updatedAt: d.updatedAt };
    });
  }

  async update(id: number, userId: number, data: Record<string, any>) {
    const existing = await this.prisma.careerDocument.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found');

    const currentData = typeof existing.content === 'string' ? JSON.parse(existing.content) : {};
    const merged = { ...currentData, ...data };

    return this.prisma.careerDocument.update({
      where: { id },
      data: {
        content: JSON.stringify(merged),
        title: `${merged.company || ''} - ${merged.position || ''}`,
      },
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.careerDocument.deleteMany({ where: { id, userId } });
  }

  async getStats(userId: number) {
    const all = await this.findAll(userId);
    const stats = { total: all.length, wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    all.forEach(j => {
      if (j.status === 'applied') stats.applied++;
      else if (j.status === 'interview') stats.interview++;
      else if (j.status === 'offer') stats.offer++;
      else if (j.status === 'rejected') stats.rejected++;
      else stats.wishlist++;
    });
    return stats;
  }
}
