import { Module } from '@nestjs/common';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerVaultService } from './career-vault.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [CareerController],
  providers: [CareerService, CareerVaultService],
  exports: [CareerService, CareerVaultService],
})
export class CareerModule {}