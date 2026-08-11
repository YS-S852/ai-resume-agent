import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarketSearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;
}

export class CompanySearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  company: string;
}

export class IndustryTrendsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  industry: string;
}

export class SalaryBenchmarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;
}
