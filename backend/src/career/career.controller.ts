import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CareerService } from './career.service';
import { CareerVaultService } from './career-vault.service';

@Controller('career')
export class CareerController {
  constructor(
    private readonly careerService: CareerService,
    private readonly careerVault: CareerVaultService,
  ) {}

  @Get('documents')
  async listDocuments(
    @Request() req: { user: { id: number } },
    @Query('type') type?: string,
  ) {
    return this.careerService.findAll(req.user.id, type);
  }

  @Get('documents/:id')
  async getDocument(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.careerService.findOne(id, req.user.id);
  }

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  async createDocument(
    @Request() req: { user: { id: number } },
    @Body() dto: { title: string; type: string; content?: string; fileUrl?: string },
  ) {
    const doc = await this.careerService.create(req.user.id, dto);
    // Auto-index if content provided
    if (dto.content) {
      await this.careerVault.indexDocument(doc.id, req.user.id, dto.content);
    }
    return doc;
  }

  @Put('documents/:id')
  async updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: any,
  ) {
    const doc = await this.careerService.update(id, req.user.id, dto);
    if (dto.content) {
      await this.careerVault.indexDocument(id, req.user.id, dto.content);
    }
    return doc;
  }

  @Delete('documents/:id')
  async deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    await this.careerVault.deleteIndex(id);
    return this.careerService.remove(id, req.user.id);
  }

  @Post('search')
  async search(
    @Request() req: { user: { id: number } },
    @Body() body: { query: string; topK?: number },
  ) {
    return this.careerVault.search(req.user.id, body.query, body.topK || 5);
  }

  @Post('report/industry')
  async industryReport(
    @Request() req: { user: { id: number } },
    @Body() body: { industry: string },
  ) {
    return this.careerVault.generateIndustryReport(req.user.id, body.industry);
  }

  @Get('recommendations')
  async recommendations(
    @Request() req: { user: { id: number } },
    @Query('field') field?: string,
  ) {
    return this.careerVault.getRecommendations(req.user.id, field || '');
  }
}