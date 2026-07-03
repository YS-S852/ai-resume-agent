import { Module } from '@nestjs/common';
import { JDService } from './jd.service';
import { JDController } from './jd.controller';
import { JdExtractService } from './jd-extract.service';
import { JdExtractController } from './jd-extract.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [JDController, JdExtractController],
  providers: [JDService, JdExtractService],
  exports: [JDService, JdExtractService],
})
export class JDModule {}
