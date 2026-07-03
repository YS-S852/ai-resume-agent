import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchHistoryEntry {
  id: number;
  userId: number;
  type: string;
  query: string;
  results: unknown;
  createdAt: Date;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async saveSearch(
    userId: number,
    type: string,
    query: string,
    results: unknown,
  ): Promise<SearchHistoryEntry> {
    return this.prisma.searchHistory.create({
      data: {
        userId,
        type,
        query,
        results: results as any,
      },
    });
  }

  async getHistory(
    userId: number,
    limit = 20,
  ): Promise<SearchHistoryEntry[]> {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getLatest(userId: number): Promise<SearchHistoryEntry | null> {
    const latest = await this.prisma.searchHistory.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return latest || null;
  }

  /**
   * Re-run a specific saved search by its ID
   */
  async getById(
    userId: number,
    id: number,
  ): Promise<SearchHistoryEntry | null> {
    return this.prisma.searchHistory.findFirst({
      where: { id, userId },
    });
  }
}
