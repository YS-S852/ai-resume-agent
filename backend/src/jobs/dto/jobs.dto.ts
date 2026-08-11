import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const JOB_STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  company: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  salary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ enum: JOB_STATUSES })
  @IsIn(JOB_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  jdId?: number;
}

export class UpdateJobDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  salary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ enum: JOB_STATUSES })
  @IsIn(JOB_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  jdId?: number;
}
