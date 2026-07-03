import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class JDService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: number, data: { title: string; company?: string; rawContent: string }) {
    return this.prisma.jobDescription.create({
      data: { userId, ...data },
    });
  }

  async findAll(userId: number) {
    return this.prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.jobDescription.findFirst({
      where: { id, userId },
      include: { atsReports: true },
    });
  }

  async analyzeAndSave(id: number, userId: number) {
    const jd = await this.prisma.jobDescription.findFirst({ where: { id, userId } });
    if (!jd) throw new Error('JD not found');

    const result = await this.aiService.analyzeJD(jd.rawContent);
    return this.prisma.jobDescription.update({
      where: { id },
      data: { parsedData: result.parsed as any },
    });
  }

  async getMatchScore(jdId: number, userId: number) {
    const jd = await this.prisma.jobDescription.findFirst({ where: { id: jdId, userId } });
    if (!jd) throw new Error('JD not found');

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const skills = await this.prisma.skill.findMany({ where: { userId } });
    const work = await this.prisma.workExperience.findMany({ where: { userId } });
    const projects = await this.prisma.project.findMany({ where: { userId } });

    const profileData = {
      summary: profile?.summary,
      jobIntention: profile?.jobIntention,
      skills: skills.map(s => `${s.name} (${s.level || ''})`).join(', '),
      workExperience: work.map(w => `${w.company} - ${w.position}: ${w.responsibilities || ''}`).join('\n'),
      projects: projects.map(p => `${p.name} [${p.techStack || ''}]: ${p.background || ''}`).join('\n'),
    };

    const atsResult = await this.aiService.scoreATS(
      JSON.stringify(profileData),
      jd.rawContent,
    );

    await this.prisma.jobDescription.update({
      where: { id: jdId },
      data: { matchScore: atsResult.overallScore },
    });

    return atsResult;
  }

  async remove(id: number, userId: number) {
    return this.prisma.jobDescription.deleteMany({ where: { id, userId } });
  }
}
