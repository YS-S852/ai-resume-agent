import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ResumesModule } from './resumes/resumes.module';
import { AiModule } from './ai/ai.module';
import { JDModule } from './jd/jd.module';
import { ATSModule } from './ats/ats.module';
import { InterviewModule } from './interview/interview.module';
import { JobsModule } from './jobs/jobs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CareerModule } from './career/career.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { ExportModule } from './export/export.module';
import { SearchModule } from './search/search.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ResumesModule,
    AiModule,
    JDModule,
    ATSModule,
    InterviewModule,
    JobsModule,
    DashboardModule,
    CareerModule,
    QdrantModule,
    ExportModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
