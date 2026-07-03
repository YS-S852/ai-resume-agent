import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { InterviewDashboardController } from './interview-dashboard.controller';
import { InterviewDashboardService } from './interview-dashboard.service';
import { InterviewTtsService } from './interview-tts.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [InterviewController, InterviewDashboardController],
  providers: [InterviewService, InterviewDashboardService, InterviewTtsService],
  exports: [InterviewService, InterviewDashboardService],
})
export class InterviewModule {}
