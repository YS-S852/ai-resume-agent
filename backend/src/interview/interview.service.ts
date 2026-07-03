import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, ChatMessage } from '../ai/ai.service';

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createSession(userId: number, data: { jobId?: number; type: string }) {
    return this.prisma.interviewRecord.create({
      data: {
        userId,
        jobId: data.jobId,
        type: data.type,
      },
    });
  }

  async generateQuestions(userId: number, sessionId: number, jdContent: string, resumeContent: string) {
    const questions = await this.aiService.generateInterviewQuestions(jdContent, resumeContent);

    await this.prisma.interviewRecord.update({
      where: { id: sessionId },
      data: { questions: questions as any },
    });

    return questions;
  }

  async chat(userId: number, sessionId: number, history: ChatMessage[], jdContent: string) {
    const reply = await this.aiService.mockInterviewChat(history, jdContent);
    return { reply };
  }

  /**
   * Persist the candidate's per-question answers for a session.
   */
  async saveAnswers(
    sessionId: number,
    answers: Array<{ question?: string; answer: string }>,
  ) {
    return this.prisma.interviewRecord.update({
      where: { id: sessionId },
      data: { answers: answers as any },
    });
  }

  /**
   * AI-driven interview scoring: evaluates the conversation against the JD,
   * then persists answers + feedback + score in one transaction-like update.
   */
  async scoreAndSave(
    sessionId: number,
    userId: number,
    payload: {
      questions: Array<{ id?: number; question: string; expectedPoints?: string[] }>;
      answers: Array<{ question?: string; answer: string }>;
      jdContent: string;
    },
  ) {
    const report = await this.aiService.scoreInterview(
      payload.questions,
      payload.answers,
      payload.jdContent,
    );

    const feedback: Record<string, unknown> = {
      dimensions: report.dimensions,
      strengths: report.strengths,
      improvements: report.improvements,
      summary: report.summary,
      questions: payload.questions,
    };

    await this.prisma.interviewRecord.update({
      where: { id: sessionId },
      data: {
        answers: payload.answers as any,
        feedback: feedback as any,
        score: report.overallScore,
      },
    });

    return { ...report, sessionId, userId };
  }

  async saveFeedback(sessionId: number, feedback: Record<string, unknown>, score: number) {
    return this.prisma.interviewRecord.update({
      where: { id: sessionId },
      data: { feedback: feedback as any, score },
    });
  }

  async getHistory(userId: number) {
    return this.prisma.interviewRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSession(id: number, userId: number) {
    return this.prisma.interviewRecord.findFirst({
      where: { id, userId },
    });
  }
}
