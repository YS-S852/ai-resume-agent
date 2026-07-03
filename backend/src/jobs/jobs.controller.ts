import { Controller, Get, Post, Put, Delete, Body, Param, Request, HttpCode } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Public } from '../auth/public.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(201)
  async create(@Request() req: { user?: { id: number } }, @Body() body: {
    company: string; position: string; salary?: string;
    location?: string; source?: string; status?: string; notes?: string; jdId?: number;
  }) {
    return this.jobsService.create(req.user?.id ?? 1, body);
  }

  @Get()
  @Public()
  async findAll(@Request() req: { user?: { id: number } }) {
    if (!req.user) return [];
    return this.jobsService.findAll(req.user.id);
  }

  @Get('stats')
  @Public()
  async getStats(@Request() req: { user?: { id: number } }) {
    if (!req.user) return { total: 0, wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    return this.jobsService.getStats(req.user.id);
  }

  @Put(':id')
  async update(@Request() req: { user?: { id: number } }, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.jobsService.update(+id, req.user?.id ?? 1, body);
  }

  @Delete(':id')
  async remove(@Request() req: { user?: { id: number } }, @Param('id') id: string) {
    return this.jobsService.remove(+id, req.user?.id ?? 1);
  }
}
