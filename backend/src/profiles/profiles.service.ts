import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateSkillDto,
  UpdateSkillDto,
} from './dto/profiles.dto';

export interface ExtractedProfile {
  profile?: Record<string, unknown>;
  education?: Array<Record<string, unknown>>;
  workExperience?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  skills?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async importFromText(userId: number, rawInput: string) {
    const extracted = (await this.ai.extractProfileInfo(rawInput)) as ExtractedProfile;
    const source = extracted.profile ?? extracted;
    const text = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim() ? value.trim() : undefined;
    const keyOf = (...parts: Array<string | undefined>) =>
      parts.map((part) => (part ?? '').trim().toLowerCase()).join('|');

    const imported = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          education: true,
          workExperience: true,
          projects: true,
          skills: true,
        },
      });
      if (!user) throw new NotFoundException('用户不存在');

      const profileUpdate = {
        fullName: text(source.fullName) ?? user.profile?.fullName ?? user.username,
        phone: text(source.phone),
        city: text(source.city),
        jobTitle: text(source.jobTitle),
        jobIntention: text(source.jobIntention) ?? text(source.position),
        expectedSalary: text(source.expectedSalary),
        summary: text(source.summary),
      };
      const compactProfileUpdate = Object.fromEntries(
        Object.entries(profileUpdate).filter(([, value]) => value !== undefined),
      );

      await tx.profile.upsert({
        where: { userId },
        create: { userId, ...compactProfileUpdate, fullName: profileUpdate.fullName },
        update: compactProfileUpdate,
      });

      const counts = { education: 0, workExperience: 0, projects: 0, skills: 0 };
      const educationKeys = new Set(
        user.education.map((item) => keyOf(item.school, item.major, item.degree)),
      );
      for (const item of extracted.education ?? []) {
        const school = text(item.school);
        if (!school) continue;
        const major = text(item.major) ?? '未提供';
        const degree = text(item.degree) ?? '未提供';
        const key = keyOf(school, major, degree);
        if (educationKeys.has(key)) continue;
        await tx.education.create({
          data: {
            userId,
            school,
            major,
            degree,
            startDate: text(item.startDate) ?? '未提供',
            endDate: text(item.endDate),
            gpa: text(item.gpa),
            honors: text(item.honors),
          },
        });
        educationKeys.add(key);
        counts.education++;
      }

      const workKeys = new Set(
        user.workExperience.map((item) => keyOf(item.company, item.position)),
      );
      for (const item of extracted.workExperience ?? []) {
        const company = text(item.company);
        const position = text(item.position);
        if (!company || !position) continue;
        const key = keyOf(company, position);
        if (workKeys.has(key)) continue;
        await tx.workExperience.create({
          data: {
            userId,
            company,
            position,
            industry: text(item.industry),
            startDate: text(item.startDate) ?? '未提供',
            endDate: text(item.endDate),
            responsibilities: text(item.responsibilities),
            achievements: text(item.achievements),
          },
        });
        workKeys.add(key);
        counts.workExperience++;
      }

      const projectKeys = new Set(user.projects.map((item) => keyOf(item.name)));
      for (const item of extracted.projects ?? []) {
        const name = text(item.name);
        if (!name) continue;
        const key = keyOf(name);
        if (projectKeys.has(key)) continue;
        const techStack = Array.isArray(item.techStack)
          ? item.techStack.map(String).join(', ')
          : text(item.techStack);
        await tx.project.create({
          data: {
            userId,
            name,
            startDate: text(item.startDate),
            endDate: text(item.endDate),
            techStack,
            background: text(item.background),
            responsibilities: text(item.responsibilities),
            contributions: text(item.contributions),
            results: text(item.results),
          },
        });
        projectKeys.add(key);
        counts.projects++;
      }

      const skillKeys = new Set(user.skills.map((item) => keyOf(item.name)));
      const validCategories = new Set(['tech', 'software', 'language', 'certificate']);
      for (const item of extracted.skills ?? []) {
        const name = text(item.name);
        if (!name) continue;
        const key = keyOf(name);
        if (skillKeys.has(key)) continue;
        const rawCategory = text(item.category) ?? 'tech';
        await tx.skill.create({
          data: {
            userId,
            name,
            category: validCategories.has(rawCategory) ? rawCategory : 'tech',
            level: text(item.level),
          },
        });
        skillKeys.add(key);
        counts.skills++;
      }

      return counts;
    });

    return {
      imported,
      extracted,
      profile: await this.getFullProfile(userId),
    };
  }

  // ========== Profile ==========

  async getProfile(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('档案不存在');
    }

    return profile;
  }

  async createProfile(userId: number, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new NotFoundException('档案已存在，请使用更新接口');
    }

    return this.prisma.profile.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.getProfile(userId);

    return this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
  }

  async deleteProfile(userId: number) {
    await this.getProfile(userId);

    return this.prisma.profile.delete({
      where: { userId },
    });
  }

  // ========== Education ==========

  async getEducations(userId: number) {
    return this.prisma.education.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createEducation(userId: number, dto: CreateEducationDto) {
    return this.prisma.education.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateEducation(id: number, userId: number, dto: UpdateEducationDto) {
    const education = await this.prisma.education.findFirst({
      where: { id, userId },
    });

    if (!education) {
      throw new NotFoundException(`教育记录 #${id} 不存在`);
    }

    return this.prisma.education.update({
      where: { id },
      data: dto,
    });
  }

  async deleteEducation(id: number, userId: number) {
    const education = await this.prisma.education.findFirst({
      where: { id, userId },
    });

    if (!education) {
      throw new NotFoundException(`教育记录 #${id} 不存在`);
    }

    return this.prisma.education.delete({
      where: { id },
    });
  }

  // ========== Work Experience ==========

  async getWorkExperiences(userId: number) {
    return this.prisma.workExperience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createWorkExperience(userId: number, dto: CreateWorkExperienceDto) {
    return this.prisma.workExperience.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateWorkExperience(
    id: number,
    userId: number,
    dto: UpdateWorkExperienceDto,
  ) {
    const experience = await this.prisma.workExperience.findFirst({
      where: { id, userId },
    });

    if (!experience) {
      throw new NotFoundException(`工作经历 #${id} 不存在`);
    }

    return this.prisma.workExperience.update({
      where: { id },
      data: dto,
    });
  }

  async deleteWorkExperience(id: number, userId: number) {
    const experience = await this.prisma.workExperience.findFirst({
      where: { id, userId },
    });

    if (!experience) {
      throw new NotFoundException(`工作经历 #${id} 不存在`);
    }

    return this.prisma.workExperience.delete({
      where: { id },
    });
  }

  // ========== Projects ==========

  async getProjects(userId: number) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(userId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateProject(id: number, userId: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException(`项目 #${id} 不存在`);
    }

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProject(id: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException(`项目 #${id} 不存在`);
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  // ========== Skills ==========

  async getSkills(userId: number) {
    return this.prisma.skill.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });
  }

  async createSkill(userId: number, dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateSkill(id: number, userId: number, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findFirst({
      where: { id, userId },
    });

    if (!skill) {
      throw new NotFoundException(`技能 #${id} 不存在`);
    }

    return this.prisma.skill.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSkill(id: number, userId: number) {
    const skill = await this.prisma.skill.findFirst({
      where: { id, userId },
    });

    if (!skill) {
      throw new NotFoundException(`技能 #${id} 不存在`);
    }

    return this.prisma.skill.delete({
      where: { id },
    });
  }

  // ========== Full Profile (aggregated) ==========

  async getFullProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        education: { orderBy: { startDate: 'desc' } },
        workExperience: { orderBy: { startDate: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
        skills: { orderBy: { category: 'asc' } },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.profile?.phone ?? user.phone,
      avatar: user.avatar,
      profile: user.profile,
      education: user.education,
      workExperience: user.workExperience,
      projects: user.projects,
      skills: user.skills,
    };
  }
}
