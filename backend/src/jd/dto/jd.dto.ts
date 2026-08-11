import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJdDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  rawContent: string;
}
