import { Injectable } from '@nestjs/common';

@Injectable()
export class InterviewTtsService {
  /**
   * Generate SSML markup + voice options that the frontend can render
   * via the browser's Web Speech API (server-side has no audio device).
   *
   * NOTE: The frontend currently drives TTS directly with window.speechSynthesis,
   * so this endpoint is only a fallback for clients that prefer SSML.
   */
  generateSsml(text: string, options?: { voice?: string; rate?: number; pitch?: number }): string {
    const rate = options?.rate || 1.0;
    const pitch = options?.pitch || 1.0;
    return JSON.stringify({
      text,
      ssml: `<speak><prosody rate="${rate}" pitch="${pitch * 100}%">${this.escapeXml(text)}</prosody></speak>`,
      options: { rate, pitch, voice: options?.voice || 'zh-CN' },
    });
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
