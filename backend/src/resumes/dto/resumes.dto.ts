import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {
  @ApiProperty({ example: '我的第一份简历' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'default' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ example: 'zh' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  content?: Record<string, unknown>;
}

export class UpdateResumeDto {
  @ApiPropertyOptional({ example: '更新后的简历标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'modern' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateResumeVersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '修改了工作经历部分' })
  @IsString()
  @IsOptional()
  changeNotes?: string;
}
