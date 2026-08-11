import { Controller, Get, Post, Body, Request, Param, ParseIntPipe, HttpCode } from '@nestjs/common';
import { InterviewDashboardService } from './interview-dashboard.service';
import { InterviewTtsService } from './interview-tts.service';

@Controller('interview')
export class InterviewDashboardController {
  constructor(
    private readonly dashboardService: InterviewDashboardService,
    private readonly ttsService: InterviewTtsService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Request() req: { user: { id: number } }) {
    return this.dashboardService.getDashboard(req.user.id);
  }

  @Get('dashboard/:id')
  async getSessionDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.dashboardService.getSessionDetail(id, req.user.id);
  }

  @Post('tts')
  @HttpCode(200)
  async textToSpeech(
    @Request() req: { user: { id: number } },
    @Body() body: { text: string; options?: { voice?: string; rate?: number; pitch?: number } },
  ) {
    const result = this.ttsService.generateSsml(body.text, body.options);
    return { ssmlData: result };
  }
}
