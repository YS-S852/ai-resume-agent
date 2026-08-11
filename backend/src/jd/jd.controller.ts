import { Controller, Get, Post, Delete, Body, Param, Request, HttpCode, ParseIntPipe } from '@nestjs/common';
import { JDService } from './jd.service';
import { CreateJdDto } from './dto/jd.dto';

@Controller('jd')
export class JDController {
  constructor(private readonly jdService: JDService) {}

  @Post()
  @HttpCode(201)
  async create(@Request() req: { user: { id: number } }, @Body() body: CreateJdDto) {
    return this.jdService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req: { user: { id: number } }) {
    return this.jdService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.jdService.findOne(id, req.user.id);
  }

  @Post(':id/analyze')
  @HttpCode(200)
  async analyze(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.jdService.analyzeAndSave(id, req.user.id);
  }

  @Post(':id/match')
  @HttpCode(200)
  async matchScore(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.jdService.getMatchScore(id, req.user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.jdService.remove(id, req.user.id);
  }
}
