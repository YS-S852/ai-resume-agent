import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JdExtractService {
  private readonly logger = new Logger(JdExtractService.name);

  /**
   * Extract text from an image buffer using Tesseract.js OCR.
   * Supports both Chinese (chi_sim) and English (eng).
   */
  async extractFromImage(buffer: Buffer): Promise<string> {
    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('chi_sim+eng');
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();
      this.logger.log(`OCR extracted ${text.length} characters from image`);
      return text.trim();
    } catch (error) {
      this.logger.error('OCR extraction failed:', error);
      throw new Error('图片文本提取失败，请确认图片清晰且包含文字');
    }
  }

  /**
   * Extract text from a PDF buffer using pdf-parse.
   */
  async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const text = result.text?.trim() || '';
      this.logger.log(`PDF extracted ${text.length} characters`);
      if (!text) {
        throw new Error('PDF 中没有提取到文本内容');
      }
      return text;
    } catch (error) {
      this.logger.error('PDF extraction failed:', error);
      throw new Error('PDF 文本提取失败，请确认文件为文本型 PDF');
    }
  }

  /**
   * Fetch a URL and extract plain text by stripping HTML tags.
   */
  async extractFromLink(url: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fetch = require('node-fetch') as (
        url: string,
        init?: { timeout?: number; headers?: Record<string, string> },
      ) => Promise<{
        ok: boolean;
        status: number;
        statusText: string;
        headers: { get: (name: string) => string | null };
        text: () => Promise<string>;
      }>;
      const response = await fetch(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();

      let text: string;
      if (contentType.includes('text/html') || raw.includes('<html') || raw.includes('<body')) {
        // Strip HTML tags
        text = raw
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#\d+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        text = raw.trim();
      }

      this.logger.log(`Link extracted ${text.length} characters from ${url}`);
      if (!text) {
        throw new Error('无法从该链接提取文本内容');
      }
      return text;
    } catch (error: unknown) {
      this.logger.error('Link extraction failed:', error);
      if (error instanceof Error && error.message.includes('无法从该链接')) {
        throw error;
      }
      throw new Error('链接内容提取失败，请确认链接可访问');
    }
  }

  /**
   * Clean up raw text: remove excessive whitespace, normalize line breaks,
   * and attempt to detect structured fields (title, company, skills).
   */
  cleanAndStructure(text: string): string {
    if (!text) return '';

    let cleaned = text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Collapse multiple blank lines into one
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Collapse multiple spaces
      .replace(/[ \t]{2,}/g, ' ')
      // Remove non-printable characters (except CJK and common punctuation)
      .replace(/[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9\s.,;:!?()（）、。，；：！？【】《》""''/\-+@#$%^&*=_|~`[\]{}<>｜·\n]/g, '')
      .trim();

    // If the text is already well-structured, return as-is
    if (cleaned.length < 50) {
      return cleaned;
    }

    // Attempt to detect and label common JD sections
    const structured = this.detectSections(cleaned);
    return structured;
  }

  /**
   * Detect common JD sections and label them for better readability.
   */
  private detectSections(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];

    const sectionPatterns = [
      { regex: /^(?:职位名称|岗位名称|岗位|[职岗]位|[Jj]ob\s*[Tt]itle)\s*[：:]/u, label: '' },
      { regex: /^(?:公司名称|公司|[公企]业名称|[Cc]ompany)\s*[：:]/u, label: '' },
      { regex: /^(?:工作地点|地点|位置|所在城市|[Ll]ocation)\s*[：:]/u, label: '' },
      { regex: /^(?:薪资范围|薪资|薪酬|工资|[Ss]alary)\s*[：:]/u, label: '' },
      { regex: /^(?:经验要求|工作经验|年限要求|[Ee]xperience)\s*[：:]/u, label: '' },
      { regex: /^(?:学历要求|学历|教育背景|[Ee]ducation)\s*[：:]/u, label: '' },
      { regex: /^(?:岗位职责|职责描述|工作职责|职责|工作内容|[Rr]esponsibilit)/u, label: '' },
      { regex: /^(?:任职要求|岗位要求|任职资格|要求|资格|胜任条件|[Rr]equirement)/u, label: '' },
      { regex: /^(?:技能要求|技能|技术栈|[Ss]kill)/u, label: '' },
      { regex: /^(?:福利待遇|福利|薪酬福利|[Bb]enefit)/u, label: '' },
      { regex: /^(?:我们提供|优势亮点|为什么加入)/u, label: '' },
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        result.push('');
        continue;
      }

      // Check if this line matches a known section header
      const isSectionHeader = sectionPatterns.some((p) => p.regex.test(trimmed));
      if (isSectionHeader && trimmed.length < 60) {
        result.push('');
        result.push(trimmed);
        result.push('');
      } else {
        result.push(trimmed);
      }
    }

    // Clean up excessive blank lines
    return result.join('\n').replace(/\n{4,}/g, '\n\n\n').trim();
  }
}
