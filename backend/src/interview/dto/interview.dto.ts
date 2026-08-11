import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
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
import { ChatMessageDto } from '../../ai/dto/ai.dto';

export class CreateInterviewSessionDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  jobId?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;
}

export class GenerateInterviewQuestionsDto {
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

export class SaveFeedbackDto {
  @ApiProperty()
  @IsObject()
  feedback: Record<string, unknown>;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}

export class InterviewAnswerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class SaveAnswersDto {
  @ApiProperty({ type: [InterviewAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterviewAnswerDto)
  answers: InterviewAnswerDto[];
}

export class InterviewQuestionDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  expectedPoints?: string[];
}

export class ScoreInterviewDto {
  @ApiProperty({ type: [InterviewQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterviewQuestionDto)
  questions: InterviewQuestionDto[];

  @ApiProperty({ type: [InterviewAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterviewAnswerDto)
  answers: InterviewAnswerDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  jdContent: string;
}
