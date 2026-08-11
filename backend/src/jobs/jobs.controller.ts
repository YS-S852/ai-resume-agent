import { Controller, Get, Post, Put, Delete, Body, Param, Request, HttpCode, ParseIntPipe } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto } from './dto/jobs.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(201)
  async create(@Request() req: { user: { id: number } }, @Body() body: CreateJobDto) {
    return this.jobsService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req: { user: { id: number } }) {
    return this.jobsService.findAll(req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req: { user: { id: number } }) {
    return this.jobsService.getStats(req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
    @Body() body: UpdateJobDto,
  ) {
    return this.jobsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.jobsService.remove(id, req.user.id);
  }
}
