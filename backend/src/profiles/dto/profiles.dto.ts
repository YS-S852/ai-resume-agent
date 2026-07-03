import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiPropertyOptional({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '北京市朝阳区' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '北京' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '前端工程师' })
  @IsString()
  @IsOptional()
  jobIntention?: string;

  @ApiPropertyOptional({ example: '15k-25k' })
  @IsString()
  @IsOptional()
  expectedSalary?: string;

  @ApiPropertyOptional({ example: '5年前端开发经验...' })
  @IsString()
  @IsOptional()
  summary?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '张三' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '北京市朝阳区' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '北京' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '前端工程师' })
  @IsString()
  @IsOptional()
  jobIntention?: string;

  @ApiPropertyOptional({ example: '15k-25k' })
  @IsString()
  @IsOptional()
  expectedSalary?: string;

  @ApiPropertyOptional({ example: '5年前端开发经验...' })
  @IsString()
  @IsOptional()
  summary?: string;
}

export class CreateEducationDto {
  @ApiPropertyOptional({ example: '北京大学' })
  @IsString()
  @IsNotEmpty()
  school: string;

  @ApiPropertyOptional({ example: '计算机科学' })
  @IsString()
  @IsNotEmpty()
  major: string;

  @ApiPropertyOptional({ example: '本科' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiPropertyOptional({ example: '2018-09' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2022-06' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: '3.8' })
  @IsString()
  @IsOptional()
  gpa?: string;

  @ApiPropertyOptional({ example: '优秀毕业生' })
  @IsString()
  @IsOptional()
  honors?: string;
}

export class UpdateEducationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  school?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  major?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  degree?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gpa?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  honors?: string;
}

export class CreateWorkExperienceDto {
  @ApiPropertyOptional({ example: '腾讯' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiPropertyOptional({ example: '互联网' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: '高级前端工程师' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiPropertyOptional({ example: '2022-07' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '至今' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  achievements?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  teamSize?: number;
}

export class UpdateWorkExperienceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  achievements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  teamSize?: number;
}

export class CreateProjectDto {
  @ApiPropertyOptional({ example: '电商平台重构' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '2023-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-06' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'React, TypeScript, Node.js' })
  @IsString()
  @IsOptional()
  techStack?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  background?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contributions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  results?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  techStack?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  background?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contributions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  results?: string;
}

export class CreateSkillDto {
  @ApiPropertyOptional({ example: '前端' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'React' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '精通' })
  @IsString()
  @IsOptional()
  level?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  level?: string;
}
