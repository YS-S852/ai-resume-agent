import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const CAREER_DOCUMENT_TYPES = [
  'knowledge',
  'case',
  'template',
  'experience',
  'industry',
  'guide',
];

export class CreateCareerDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: CAREER_DOCUMENT_TYPES })
  @IsIn(CAREER_DOCUMENT_TYPES)
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  fileUrl?: string;
}

export class UpdateCareerDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: CAREER_DOCUMENT_TYPES })
  @IsIn(CAREER_DOCUMENT_TYPES)
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  fileUrl?: string;
}

export class SearchCareerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  topK?: number;
}

export class IndustryReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  industry: string;
}
