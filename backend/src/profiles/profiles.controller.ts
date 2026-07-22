import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateSkillDto,
  UpdateSkillDto,
  ImportProfileDto,
} from './dto/profiles.dto';

@ApiTags('用户档案')
@Controller('profiles')
@ApiBearerAuth()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // ========== Profile ==========

  @Get()
  @ApiOperation({ summary: '获取当前用户档案' })
  async getProfile(@Request() req: { user: { id: number } }) {
    try { return await this.profilesService.getProfile(req.user.id); } catch { return null; }
  }

  @Get('full')
  @ApiOperation({ summary: '获取当前用户完整档案（含教育、工作经历、项目、技能）' })
  async getFullProfile(@Request() req: { user: { id: number } }) {
    return await this.profilesService.getFullProfile(req.user.id);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从自然语言提取职业信息并合并到当前用户档案' })
  async importProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: ImportProfileDto,
  ) {
    return this.profilesService.importFromText(req.user.id, dto.rawInput);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户档案' })
  async createProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateProfileDto,
  ) {
    return this.profilesService.createProfile(req.user.id, dto);
  }

  @Put()
  @ApiOperation({ summary: '更新用户档案' })
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除用户档案' })
  async deleteProfile(@Request() req: { user: { id: number } }) {
    return this.profilesService.deleteProfile(req.user.id);
  }

  // ========== Education ==========

  @Get('education')
  @ApiOperation({ summary: '获取教育经历列表' })
  async getEducations(@Request() req: { user: { id: number } }) {
    return this.profilesService.getEducations(req.user.id);
  }

  @Post('education')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建教育经历' })
  async createEducation(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateEducationDto,
  ) {
    return this.profilesService.createEducation(req.user.id, dto);
  }

  @Put('education/:id')
  @ApiOperation({ summary: '更新教育经历' })
  async updateEducation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateEducationDto,
  ) {
    return this.profilesService.updateEducation(id, req.user.id, dto);
  }

  @Delete('education/:id')
  @ApiOperation({ summary: '删除教育经历' })
  async deleteEducation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.profilesService.deleteEducation(id, req.user.id);
  }

  // ========== Work Experience ==========

  @Get('work-experience')
  @ApiOperation({ summary: '获取工作经历列表' })
  async getWorkExperiences(@Request() req: { user: { id: number } }) {
    return this.profilesService.getWorkExperiences(req.user.id);
  }

  @Post('work-experience')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建工作经历' })
  async createWorkExperience(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateWorkExperienceDto,
  ) {
    return this.profilesService.createWorkExperience(req.user.id, dto);
  }

  @Put('work-experience/:id')
  @ApiOperation({ summary: '更新工作经历' })
  async updateWorkExperience(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateWorkExperienceDto,
  ) {
    return this.profilesService.updateWorkExperience(id, req.user.id, dto);
  }

  @Delete('work-experience/:id')
  @ApiOperation({ summary: '删除工作经历' })
  async deleteWorkExperience(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.profilesService.deleteWorkExperience(id, req.user.id);
  }

  // ========== Projects ==========

  @Get('projects')
  @ApiOperation({ summary: '获取项目列表' })
  async getProjects(@Request() req: { user: { id: number } }) {
    return this.profilesService.getProjects(req.user.id);
  }

  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建项目' })
  async createProject(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateProjectDto,
  ) {
    return this.profilesService.createProject(req.user.id, dto);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: '更新项目' })
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProjectDto,
  ) {
    return this.profilesService.updateProject(id, req.user.id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: '删除项目' })
  async deleteProject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.profilesService.deleteProject(id, req.user.id);
  }

  // ========== Skills ==========

  @Get('skills')
  @ApiOperation({ summary: '获取技能列表' })
  async getSkills(@Request() req: { user: { id: number } }) {
    return this.profilesService.getSkills(req.user.id);
  }

  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建技能' })
  async createSkill(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateSkillDto,
  ) {
    return this.profilesService.createSkill(req.user.id, dto);
  }

  @Put('skills/:id')
  @ApiOperation({ summary: '更新技能' })
  async updateSkill(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateSkillDto,
  ) {
    return this.profilesService.updateSkill(id, req.user.id, dto);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: '删除技能' })
  async deleteSkill(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.profilesService.deleteSkill(id, req.user.id);
  }
}
