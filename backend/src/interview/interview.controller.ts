import { Controller, Get, Post, Body, Param, Request, HttpCode } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { ChatMessage } from '../ai/ai.service';
import { Public } from '../auth/public.decorator';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('session')
  @HttpCode(201)
  async createSession(@Request() req: { user?: { id: number } }, @Body() body: { jobId?: number; type: string }) {
    return this.interviewService.createSession(req.user?.id ?? 1, body);
  }

  @Post('session/:id/questions')
  @HttpCode(200)
  async generateQuestions(
    @Request() req: { user?: { id: number } },
    @Param('id') id: string,
    @Body() body: { jdContent: string; resumeContent: string },
  ) {
    return this.interviewService.generateQuestions(req.user?.id ?? 1, +id, body.jdContent, body.resumeContent);
  }

  @Post('session/:id/chat')
  @HttpCode(200)
  async chat(
    @Request() req: { user?: { id: number } },
    @Param('id') id: string,
    @Body() body: { history: ChatMessage[]; jdContent: string },
  ) {
    return this.interviewService.chat(req.user?.id ?? 1, +id, body.history, body.jdContent);
  }

  @Post('session/:id/feedback')
  @HttpCode(200)
  async saveFeedback(
    @Param('id') id: string,
    @Body() body: { feedback: Record<string, unknown>; score: number },
  ) {
    return this.interviewService.saveFeedback(+id, body.feedback, body.score);
  }

  @Post('session/:id/answers')
  @HttpCode(200)
  async saveAnswers(
    @Param('id') id: string,
    @Body() body: { answers: Array<{ question?: string; answer: string }> },
  ) {
    return this.interviewService.saveAnswers(+id, body.answers);
  }

  /**
   * AI-driven interview scoring: evaluates answers against the JD and persists
   * answers + feedback + score. Returns the structured report.
   */
  @Post('session/:id/score')
  @HttpCode(200)
  async scoreSession(
    @Request() req: { user?: { id: number } },
    @Param('id') id: string,
    @Body() body: {
      questions: Array<{ id?: number; question: string; expectedPoints?: string[] }>;
      answers: Array<{ question?: string; answer: string }>;
      jdContent: string;
    },
  ) {
    return this.interviewService.scoreAndSave(+id, req.user?.id ?? 1, body);
  }

  @Get('history')
  @Public()
  async getHistory(@Request() req: { user?: { id: number } }) {
    if (!req.user) return [];
    return this.interviewService.getHistory(req.user.id);
  }

  @Get('session/:id')
  @Public()
  async getSession(@Request() req: { user?: { id: number } }, @Param('id') id: string) {
    if (!req.user) return null;
    return this.interviewService.getSession(+id, req.user.id);
  }
}
