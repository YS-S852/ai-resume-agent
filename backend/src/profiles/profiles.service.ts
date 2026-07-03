import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

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
      phone: user.phone,
      avatar: user.avatar,
      profile: user.profile,
      education: user.education,
      workExperience: user.workExperience,
      projects: user.projects,
      skills: user.skills,
    };
  }
}
