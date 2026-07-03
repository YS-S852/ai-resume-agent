import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private readonly url: string;
  private readonly collectionName = 'career_documents';
  private readonly vectorSize = 768; // DeepSeek embedding dimension
  private ready = false;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('QDRANT_URL', 'http://localhost:6333');
  }

  async onModuleInit() {
    try {
      this.client = new QdrantClient({ url: this.url });
      // Test connection
      await this.client.getCollections();
      await this.ensureCollection();
      this.ready = true;
      this.logger.log(`Qdrant connected at ${this.url}, collection '${this.collectionName}' ready`);
    } catch (error) {
      this.logger.error(`Qdrant connection failed at ${this.url}: ${error.message}`);
      this.logger.warn('Vector search will fall back to in-memory store');
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Ensure the career_documents collection exists with correct vector config.
   */
  private async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created collection '${this.collectionName}'`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upsert (insert or update) a vector point.
   */
  async upsert(
    id: number,
    vector: number[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.ready) throw new Error('Qdrant not ready');
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    });
  }

  /**
   * Search for similar vectors with optional payload filter.
   */
  async search(
    vector: number[],
    options: {
      limit?: number;
      filter?: Record<string, unknown>;
    } = {},
  ): Promise<{ id: number; score: number; payload: Record<string, unknown> }[]> {
    if (!this.ready) throw new Error('Qdrant not ready');

    const result = await this.client.search(this.collectionName, {
      vector,
      limit: options.limit ?? 5,
      with_payload: true,
      filter: options.filter as any,
    });

    return result.map((r) => ({
      id: r.id as number,
      score: r.score,
      payload: (r.payload ?? {}) as Record<string, unknown>,
    }));
  }

  /**
   * Delete a vector point by id.
   */
  async delete(id: number): Promise<void> {
    if (!this.ready) throw new Error('Qdrant not ready');
    await this.client.delete(this.collectionName, {
      wait: true,
      points: [id],
    });
  }

  /**
   * Delete all points matching a filter (e.g. by userId).
   */
  async deleteByFilter(filter: Record<string, unknown>): Promise<void> {
    if (!this.ready) throw new Error('Qdrant not ready');
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: filter as any,
    });
  }
}
