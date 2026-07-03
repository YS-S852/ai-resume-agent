import { Controller, Get, Post, Body, Param, Request, HttpCode } from '@nestjs/common';
import { ATSService } from './ats.service';
import { Public } from '../auth/public.decorator';

@Controller('ats')
export class ATSController {
  constructor(private readonly atsService: ATSService) {}

  @Post('analyze')
  @HttpCode(200)
  async analyze(
    @Request() req: { user?: { id: number } },
    @Body() body: { resumeId?: number; jdId?: number; resumeContent: string; jdContent: string },
  ) {
    return this.atsService.analyze(req.user?.id ?? 1, body);
  }

  @Get('history')
  @Public()
  async getHistory(@Request() req: { user?: { id: number } }) {
    if (!req.user) return [];
    return this.atsService.getHistory(req.user.id);
  }

  @Get(':id')
  @Public()
  async getReport(@Request() req: { user?: { id: number } }, @Param('id') id: string) {
    if (!req.user) return null;
    return this.atsService.getReport(+id, req.user.id);
  }
}
