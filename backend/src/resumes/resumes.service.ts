import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto, UpdateResumeDto, CreateResumeVersionDto } from './dto/resumes.dto';

@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        template: true,
        language: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { versions: true },
        },
      },
    });
  }

  async findOne(id: number, userId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${id} 不存在`);
    }

    return resume;
  }

  async create(userId: number, dto: CreateResumeDto) {
    return this.prisma.resume.create({
      data: {
        userId,
        title: dto.title,
        template: dto.template || 'default',
        language: dto.language || 'zh',
        content: dto.content as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    });
  }

  async update(id: number, userId: number, dto: UpdateResumeDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${id} 不存在`);
    }

    const data: Prisma.ResumeUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.template !== undefined) data.template = dto.template;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.pdfUrl !== undefined) data.pdfUrl = dto.pdfUrl;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.content !== undefined) {
      data.content = dto.content as Prisma.InputJsonValue ?? Prisma.JsonNull;
    }

    return this.prisma.resume.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, userId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${id} 不存在`);
    }

    // Delete all versions first
    await this.prisma.resumeVersion.deleteMany({
      where: { resumeId: id },
    });

    return this.prisma.resume.delete({
      where: { id },
    });
  }

  // ========== Version Management ==========

  async getVersions(resumeId: number, userId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${resumeId} 不存在`);
    }

    return this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });
  }

  async createVersion(
    resumeId: number,
    userId: number,
    dto: CreateResumeVersionDto,
  ) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${resumeId} 不存在`);
    }

    // Get the latest version number
    const latestVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Use the provided content or the current resume content
    const content = dto.content
      ? (dto.content as Prisma.InputJsonValue)
      : resume.content !== null
        ? (resume.content as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    return this.prisma.resumeVersion.create({
      data: {
        resumeId,
        version: nextVersion,
        content: content as Prisma.NullableJsonNullValueInput,
        changeNotes: dto.changeNotes,
      },
    });
  }

  async getVersionDetail(versionId: number, userId: number) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: {
        resume: {
          select: { userId: true },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`版本 #${versionId} 不存在`);
    }

    if (version.resume.userId !== userId) {
      throw new ForbiddenException('无权访问此版本');
    }

    // Remove the nested resume select from the result
    const { resume: _resume, ...versionData } = version;
    return versionData;
  }

  async restoreVersion(versionId: number, userId: number) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: {
        resume: {
          select: { userId: true },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`版本 #${versionId} 不存在`);
    }

    if (version.resume.userId !== userId) {
      throw new ForbiddenException('无权操作此版本');
    }

    // Restore the resume content to this version's content
    return this.prisma.resume.update({
      where: { id: version.resumeId },
      data: {
        content: version.content as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    });
  }
}
