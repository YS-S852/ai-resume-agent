import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AiService, ChatMessage } from './ai.service';
import { Public } from '../auth/public.decorator';

@Controller('ai')
@Public()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/ai/analyze-jd
   * Analyze a job description
   */
  @Post('analyze-jd')
  @HttpCode(200)
  async analyzeJD(
    @Body() body: { rawJD: string },
  ) {
    return this.aiService.analyzeJD(body.rawJD);
  }

  /**
   * POST /api/ai/ats-score
   * Score resume against JD
   */
  @Post('ats-score')
  @HttpCode(200)
  async scoreATS(
    @Body() body: { resumeContent: string; jdContent: string },
  ) {
    return this.aiService.scoreATS(body.resumeContent, body.jdContent);
  }

  /**
   * POST /api/ai/interview-questions
   * Generate interview questions
   */
  @Post('interview-questions')
  @HttpCode(200)
  async generateQuestions(
    @Body() body: { jdContent: string; resumeContent: string; count?: number },
  ) {
    return this.aiService.generateInterviewQuestions(
      body.jdContent,
      body.resumeContent,
      body.count ?? 15,
    );
  }

  /**
   * POST /api/ai/interview-chat
   * Mock interview conversation
   */
  @Post('interview-chat')
  @HttpCode(200)
  async interviewChat(
    @Body() body: { history: ChatMessage[]; jdContent: string },
  ) {
    const reply = await this.aiService.mockInterviewChat(body.history, body.jdContent);
    return { reply };
  }

  /**
   * POST /api/ai/generate-resume
   * Generate resume content
   */
  @Post('generate-resume')
  @HttpCode(200)
  async generateResume(
    @Body() body: { profileData: Record<string, unknown>; jdContent?: string },
  ) {
    return this.aiService.generateResumeContent(body.profileData, body.jdContent);
  }

  /**
   * POST /api/ai/polish-resume
   * Polish resume content
   */
  @Post('polish-resume')
  @HttpCode(200)
  async polishResume(
    @Body() body: { text: string; style?: 'professional' | 'creative' | 'technical' },
  ) {
    const result = await this.aiService.polishResumeContent(body.text, body.style ?? 'professional');
    return { polished: result };
  }

  /**
   * POST /api/ai/extract-profile
   * Extract profile info from natural language
   */
  @Post('extract-profile')
  @HttpCode(200)
  async extractProfile(
    @Body() body: { rawInput: string },
  ) {
    return this.aiService.extractProfileInfo(body.rawInput);
  }
}
