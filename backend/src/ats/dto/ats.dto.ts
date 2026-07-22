import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AnalyzeATSDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  resumeId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  jdId?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  resumeContent: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  jdContent: string;
}

export class OptimizeResumeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  resumeContent: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  jdContent: string;
}
