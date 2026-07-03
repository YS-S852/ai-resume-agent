import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SearchAgentService } from './search-agent.service';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchAgent: SearchAgentService,
    private readonly searchService: SearchService,
  ) {}

  @Post('market')
  @HttpCode(HttpStatus.OK)
  async searchMarket(
    @Request() req: { user: { id: number } },
    @Body()
    body: { query: string; industry?: string; location?: string },
  ) {
    const results = await this.searchAgent.searchJobMarket(body.query, {
      industry: body.industry,
      location: body.location,
    });
    await this.searchService.saveSearch(
      req.user.id,
      'market',
      body.query,
      results,
    );
    return results;
  }

  @Post('company')
  @HttpCode(HttpStatus.OK)
  async researchCompany(
    @Request() req: { user: { id: number } },
    @Body() body: { company: string },
  ) {
    const results = await this.searchAgent.researchCompany(body.company);
    await this.searchService.saveSearch(
      req.user.id,
      'company',
      body.company,
      results,
    );
    return results;
  }

  @Post('industry')
  @HttpCode(HttpStatus.OK)
  async industryTrends(
    @Request() req: { user: { id: number } },
    @Body() body: { industry: string },
  ) {
    const results = await this.searchAgent.industryTrends(body.industry);
    await this.searchService.saveSearch(
      req.user.id,
      'industry',
      body.industry,
      results,
    );
    return results;
  }

  @Post('salary')
  @HttpCode(HttpStatus.OK)
  async salaryBenchmark(
    @Request() req: { user: { id: number } },
    @Body() body: { position: string; location?: string },
  ) {
    const results = await this.searchAgent.salaryBenchmark(
      body.position,
      body.location,
    );
    await this.searchService.saveSearch(
      req.user.id,
      'salary',
      body.position,
      results,
    );
    return results;
  }

  @Get('history')
  async getHistory(@Request() req: { user: { id: number } }) {
    return this.searchService.getHistory(req.user.id);
  }
}
