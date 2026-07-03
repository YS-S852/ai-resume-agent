import { Controller, Get, Post, Body, Request, Param, ParseIntPipe, HttpCode } from '@nestjs/common';
import { InterviewDashboardService } from './interview-dashboard.service';
import { InterviewTtsService } from './interview-tts.service';
import { Public } from '../auth/public.decorator';

@Controller('interview')
export class InterviewDashboardController {
  constructor(
    private readonly dashboardService: InterviewDashboardService,
    private readonly ttsService: InterviewTtsService,
  ) {}

  @Get('dashboard')
  @Public()
  async getDashboard(@Request() req: { user?: { id: number } }) {
    if (!req.user) return null;
    return this.dashboardService.getDashboard(req.user.id);
  }

  @Get('dashboard/:id')
  @Public()
  async getSessionDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user?: { id: number } },
  ) {
    if (!req.user) return null;
    return this.dashboardService.getSessionDetail(id, req.user.id);
  }

  @Post('tts')
  @HttpCode(200)
  async textToSpeech(
    @Request() req: { user?: { id: number } },
    @Body() body: { text: string; options?: { voice?: string; rate?: number; pitch?: number } },
  ) {
    const result = this.ttsService.generateSsml(body.text, body.options);
    return { ssmlData: result };
  }
}
