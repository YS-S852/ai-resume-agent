import { Controller, Get, Post, Body, Param, Request, HttpCode, ParseIntPipe } from '@nestjs/common';
import { InterviewService } from './interview.service';
import {
  CreateInterviewSessionDto,
  GenerateInterviewQuestionsDto,
  InterviewChatDto,
  SaveAnswersDto,
  SaveFeedbackDto,
  ScoreInterviewDto,
} from './dto/interview.dto';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('session')
  @HttpCode(201)
  async createSession(
    @Request() req: { user: { id: number } },
    @Body() body: CreateInterviewSessionDto,
  ) {
    return this.interviewService.createSession(req.user.id, body);
  }

  @Post('session/:id/questions')
  @HttpCode(200)
  async generateQuestions(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GenerateInterviewQuestionsDto,
  ) {
    return this.interviewService.generateQuestions(req.user.id, id, body.jdContent, body.resumeContent);
  }

  @Post('session/:id/chat')
  @HttpCode(200)
  async chat(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: InterviewChatDto,
  ) {
    return this.interviewService.chat(req.user.id, id, body.history, body.jdContent);
  }

  @Post('session/:id/feedback')
  @HttpCode(200)
  async saveFeedback(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SaveFeedbackDto,
  ) {
    return this.interviewService.saveFeedback(id, req.user.id, body.feedback, body.score);
  }

  @Post('session/:id/answers')
  @HttpCode(200)
  async saveAnswers(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SaveAnswersDto,
  ) {
    return this.interviewService.saveAnswers(id, req.user.id, body.answers);
  }

  /**
   * AI-driven interview scoring: evaluates answers against the JD and persists
   * answers + feedback + score. Returns the structured report.
   */
  @Post('session/:id/score')
  @HttpCode(200)
  async scoreSession(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ScoreInterviewDto,
  ) {
    return this.interviewService.scoreAndSave(id, req.user.id, body);
  }

  @Get('history')
  async getHistory(@Request() req: { user: { id: number } }) {
    return this.interviewService.getHistory(req.user.id);
  }

  @Get('session/:id')
  async getSession(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewService.getSession(id, req.user.id);
  }
}
