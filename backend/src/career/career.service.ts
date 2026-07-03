import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_TYPES = ['knowledge', 'case', 'template', 'experience', 'industry', 'guide'];

export interface CreateCareerDocumentDto {
  title: string;
  type: string;
  content?: string;
  fileUrl?: string;
}

export interface UpdateCareerDocumentDto {
  title?: string;
  type?: string;
  content?: string;
  fileUrl?: string;
}

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all career documents for a user, optionally filtered by type.
   */
  async findAll(userId: number, type?: string) {
    const where: any = { userId };
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }
    return this.prisma.careerDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        type: true,
        content: true,
        fileUrl: true,
        vectorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a single career document by id, scoped to user.
   */
  async findOne(id: number, userId: number) {
    const doc = await this.prisma.careerDocument.findFirst({
      where: { id, userId },
    });
    if (!doc) {
      throw new NotFoundException(`CareerDocument with id ${id} not found`);
    }
    return doc;
  }

  /**
   * Create a new career document.
   */
  async create(userId: number, dto: CreateCareerDocumentDto) {
    if (!VALID_TYPES.includes(dto.type)) {
      throw new Error(`Invalid type: ${dto.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
    }
    return this.prisma.careerDocument.create({
      data: {
        userId,
        title: dto.title,
        type: dto.type,
        content: dto.content ?? null,
        fileUrl: dto.fileUrl ?? null,
      },
    });
  }

  /**
   * Update an existing career document.
   */
  async update(id: number, userId: number, dto: UpdateCareerDocumentDto) {
    const existing = await this.findOne(id, userId);
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) {
      if (!VALID_TYPES.includes(dto.type)) {
        throw new Error(`Invalid type: ${dto.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
      }
      data.type = dto.type;
    }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl;

    return this.prisma.careerDocument.update({
      where: { id: existing.id },
      data,
    });
  }

  /**
   * Delete a career document.
   */
  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // throws if not found
    return this.prisma.careerDocument.delete({
      where: { id },
    });
  }

  /**
   * Search documents by title and content (MySQL LIKE query).
   */
  async searchByKeyword(userId: number, query: string) {
    return this.prisma.careerDocument.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}