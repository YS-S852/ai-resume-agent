import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AnalyzeJdDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  rawJD: string;
}

export class AtsScoreDto {
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

export class InterviewQuestionsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  jdContent: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  resumeContent: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  count?: number;
}

export class InterviewChatDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  jdContent: string;
}

export class GenerateResumeDto {
  @ApiProperty()
  @IsObject()
  profileData: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50_000)
  jdContent?: string;
}

export class PolishResumeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  text: string;

  @ApiPropertyOptional({ enum: ['professional', 'creative', 'technical'] })
  @IsIn(['professional', 'creative', 'technical'])
  @IsOptional()
  style?: 'professional' | 'creative' | 'technical';
}

export class ExtractProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  rawInput: string;
}
