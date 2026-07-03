import { Module } from '@nestjs/common';
import { ATSService } from './ats.service';
import { ATSController } from './ats.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ATSController],
  providers: [ATSService],
  exports: [ATSService],
})
export class ATSModule {}
