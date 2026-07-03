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
  ApiResponse,
} from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import {
  CreateResumeDto,
  UpdateResumeDto,
  CreateResumeVersionDto,
} from './dto/resumes.dto';

@ApiTags('简历')
@Controller('resumes')
@ApiBearerAuth()
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有简历' })
  @ApiResponse({ status: 200, description: '返回简历列表' })
  async findAll(@Request() req: { user: { id: number } }) {
    return this.resumesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定简历详情' })
  @ApiResponse({ status: 200, description: '返回简历详情' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.resumesService.findOne(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新简历' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateResumeDto,
  ) {
    return this.resumesService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新简历' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateResumeDto,
  ) {
    return this.resumesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.resumesService.remove(id, req.user.id);
  }

  // ========== Version Management ==========

  @Get(':id/versions')
  @ApiOperation({ summary: '获取简历的版本列表' })
  @ApiResponse({ status: 200, description: '返回版本列表' })
  async getVersions(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.resumesService.getVersions(id, req.user.id);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建简历新版本' })
  @ApiResponse({ status: 201, description: '版本创建成功' })
  async createVersion(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() dto: CreateResumeVersionDto,
  ) {
    return this.resumesService.createVersion(id, req.user.id, dto);
  }

  @Get('versions/:versionId')
  @ApiOperation({ summary: '获取指定版本详情' })
  @ApiResponse({ status: 200, description: '返回版本详情' })
  @ApiResponse({ status: 404, description: '版本不存在' })
  async getVersionDetail(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.resumesService.getVersionDetail(versionId, req.user.id);
  }

  @Post('versions/:versionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '恢复到指定版本' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '版本不存在' })
  async restoreVersion(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.resumesService.restoreVersion(versionId, req.user.id);
  }
}
