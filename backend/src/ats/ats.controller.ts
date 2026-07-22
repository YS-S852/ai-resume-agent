import { Controller, Get, Post, Body, Param, Request, HttpCode } from '@nestjs/common';
import { ATSService } from './ats.service';
import { AnalyzeATSDto, OptimizeResumeDto } from './dto/ats.dto';

@Controller('ats')
export class ATSController {
  constructor(private readonly atsService: ATSService) {}

  @Post('analyze')
  @HttpCode(200)
  async analyze(
    @Request() req: { user: { id: number } },
    @Body() body: AnalyzeATSDto,
  ) {
    return this.atsService.analyze(req.user.id, body);
  }

  @Post('optimize')
  @HttpCode(200)
  async optimize(
    @Body() body: OptimizeResumeDto,
  ) {
    return this.atsService.optimize(body);
  }

  @Get('history')
  async getHistory(@Request() req: { user: { id: number } }) {
    return this.atsService.getHistory(req.user.id);
  }

  @Get(':id')
  async getReport(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.atsService.getReport(+id, req.user.id);
  }
}
