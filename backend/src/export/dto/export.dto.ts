import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExportResumeDto {
  @ApiProperty()
  @IsObject()
  resumeData: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['minimal', 'classic', 'modern'] })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  template?: string;
}
