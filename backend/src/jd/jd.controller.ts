import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { JDService } from './jd.service';
import { Public } from '../auth/public.decorator';

@Controller('jd')
export class JDController {
  constructor(private readonly jdService: JDService) {}

  @Post()
  @HttpCode(201)
  async create(@Request() req: { user: { id: number } }, @Body() body: { title: string; company?: string; rawContent: string }) {
    return this.jdService.create(req.user?.id ?? 1, body);
  }

  @Get()
  @Public()
  async findAll(@Request() req: { user?: { id: number } }) {
    if (!req.user) return [];
    return this.jdService.findAll(req.user.id);
  }

  @Get(':id')
  @Public()
  async findOne(@Request() req: { user?: { id: number } }, @Param('id') id: string) {
    if (!req.user) return null;
    return this.jdService.findOne(+id, req.user.id);
  }

  @Post(':id/analyze')
  @HttpCode(200)
  async analyze(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.jdService.analyzeAndSave(+id, req.user?.id ?? 1);
  }

  @Post(':id/match')
  @HttpCode(200)
  async matchScore(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.jdService.getMatchScore(+id, req.user?.id ?? 1);
  }

  @Delete(':id')
  async remove(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.jdService.remove(+id, req.user?.id ?? 1);
  }
}
