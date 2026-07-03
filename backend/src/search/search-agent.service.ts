import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

@Injectable()
export class SearchAgentService {
  private readonly logger = new Logger(SearchAgentService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Search for job market data - industry trends, salary ranges, demand
   */
  async searchJobMarket(
    query: string,
    options?: { industry?: string; location?: string },
  ) {
    const searchQuery = `${query} ${options?.industry || ''} ${options?.location || ''} 薪资 招聘 行业趋势`;
    const results = await this.fetchSearchResults(searchQuery);

    // Use AI to summarize results
    const summary = await this.aiService.generateResponse(
      `基于以下搜索结果，生成一份简洁的市场分析摘要：\n${results.join('\n')}`,
      '你是一位专业的职业市场分析师，请用中文生成分析报告',
    );

    return {
      query,
      results,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Research a specific company - culture, tech stack, hiring trends
   */
  async researchCompany(companyName: string) {
    const searchQuery = `${companyName} 公司 技术栈 招聘 文化 薪资`;
    const results = await this.fetchSearchResults(searchQuery);

    const analysis = await this.aiService.generateResponse(
      `基于以下关于${companyName}的搜索结果，生成公司分析报告（包括：公司概况、技术栈、薪资水平、工作文化、招聘趋势）：\n${results.join('\n')}`,
      '你是一位专业的公司研究分析师，请用中文生成详细报告',
    );

    return {
      company: companyName,
      results,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate industry trend report
   */
  async industryTrends(industry: string) {
    const searchQuery = `${industry} 行业趋势 2024 2025 发展前景 薪资水平`;
    const results = await this.fetchSearchResults(searchQuery);

    const report = await this.aiService.generateResponse(
      `基于以下搜索结果，生成一份${industry}行业深度分析报告（包括：行业现状、发展趋势、热门岗位、薪资范围、入行建议）：\n${results.join('\n')}`,
      '你是一位专业的行业分析师，请用中文生成行业报告，要求结构清晰、数据详实',
    );

    return {
      industry,
      results,
      report,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Salary benchmarking for a specific position
   */
  async salaryBenchmark(position: string, location?: string) {
    const searchQuery = `${position} ${location || ''} 薪资 工资 待遇 2024 2025`;
    const results = await this.fetchSearchResults(searchQuery);

    const analysis = await this.aiService.generateResponse(
      `基于以下搜索结果，分析${position}在${location || '全国'}的薪资水平（包括：平均薪资、薪资区间、不同经验级别薪资、福利待遇）：\n${results.join('\n')}`,
      '你是一位专业的薪酬分析师，请用中文生成薪资分析报告',
    );

    return {
      position,
      location: location || '全国',
      results,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch search results from DuckDuckGo (free, no API key needed)
   */
  private async fetchSearchResults(query: string): Promise<string[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });
      const html = await response.text();

      // Parse with cheerio for robust extraction
      const $ = cheerio.load(html);
      const snippets: string[] = [];

      // Try DuckDuckGo result snippets first
      $('.result__snippet').each((_i, el) => {
        if (snippets.length >= 10) return false;
        const text = $(el).text().trim();
        if (text) snippets.push(text);
      });

      // Also try result bodies as fallback
      if (snippets.length === 0) {
        $('.result__body').each((_i, el) => {
          if (snippets.length >= 10) return false;
          const text = $(el).text().trim();
          if (text) snippets.push(text);
        });
      }

      // Fallback: extract any readable text from the page
      if (snippets.length === 0) {
        $('body')
          .find('*')
          .contents()
          .filter((_i, node) => node.type === 'text')
          .each((_i, node) => {
            if (snippets.length >= 10) return false;
            const text = $(node).text().trim();
            if (text.length > 20) snippets.push(text.substring(0, 300));
          });
      }

      // Final fallback
      if (snippets.length === 0) {
        const textOnly = $('body').text().replace(/\s+/g, ' ').trim();
        snippets.push(textOnly.substring(0, 1000));
      }

      this.logger.log(
        `Search for "${query.substring(0, 50)}..." returned ${snippets.length} snippets`,
      );
      return snippets;
    } catch (error) {
      this.logger.error(`Search failed for "${query}": ${error}`);
      return [`无法获取搜索结果，请稍后重试。查询词: ${query}`];
    }
  }
}
