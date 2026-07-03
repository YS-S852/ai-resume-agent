import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  // ─── PDF Generation using Puppeteer ─────────────────────────────────
  async generatePdf(htmlContent: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0' as any,
        timeout: 30000,
      });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.4in',
          bottom: '0.4in',
          left: '0.5in',
          right: '0.5in',
        },
        preferCSSPageSize: true,
      });
      const buffer = Buffer.from(pdfBuffer);
      this.logger.log(`PDF generated, size: ${buffer.length} bytes`);
      return buffer;
    } catch (error: any) {
      this.logger.error(`PDF generation failed: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // ─── DOCX Generation using docx package ─────────────────────────────
  async generateDocx(resumeData: any): Promise<Buffer> {
    const data = this.normalizeData(resumeData);
    const children: (Paragraph | Table)[] = [];

    // ── Header: Name + Title ──
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.basicInfo.name || 'Your Name',
            bold: true,
            size: 48, // 24pt
            font: 'Helvetica',
          }),
        ],
      }),
    );

    if (data.basicInfo.title) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: data.basicInfo.title,
              size: 28, // 14pt
              color: '444444',
              font: 'Helvetica',
            }),
          ],
        }),
      );
    }

    // ── Contact Info ──
    const contactParts: string[] = [];
    if (data.basicInfo.email) contactParts.push(data.basicInfo.email);
    if (data.basicInfo.phone) contactParts.push(data.basicInfo.phone);
    if (data.basicInfo.location) contactParts.push(data.basicInfo.location);
    if (data.basicInfo.website) contactParts.push(data.basicInfo.website);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: contactParts.join('  |  '),
              size: 20, // 10pt
              color: '666666',
              font: 'Helvetica',
            }),
          ],
        }),
      );
    }

    // ── Summary ──
    if (data.basicInfo.summary) {
      children.push(this.sectionHeading('PROFESSIONAL SUMMARY'));
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: data.basicInfo.summary,
              size: 21, // 10.5pt
              color: '333333',
              font: 'Helvetica',
            }),
          ],
        }),
      );
    }

    // ── Process modules in order ──
    const moduleOrder: string[] = data.moduleOrder || [
      'education',
      'work',
      'projects',
      'skills',
    ];

    for (const moduleKey of moduleOrder) {
      switch (moduleKey) {
        case 'education':
          if (data.education?.length > 0) {
            children.push(this.sectionHeading('EDUCATION'));
            for (const edu of data.education) {
              children.push(...this.educationEntry(edu));
            }
          }
          break;
        case 'work':
          if (data.work?.length > 0) {
            children.push(this.sectionHeading('WORK EXPERIENCE'));
            for (const w of data.work) {
              children.push(...this.workEntry(w));
            }
          }
          break;
        case 'projects':
          if (data.projects?.length > 0) {
            children.push(this.sectionHeading('PROJECTS'));
            for (const p of data.projects) {
              children.push(...this.projectEntry(p));
            }
          }
          break;
        case 'skills':
          if (data.skills?.length > 0) {
            children.push(this.sectionHeading('SKILLS'));
            children.push(this.skillsTable(data.skills));
          }
          break;
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Helvetica',
              size: 22, // 11pt
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch (in twips)
                bottom: 720,
                left: 900,
                right: 900,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`DOCX generated, size: ${buffer.length} bytes`);
    return Buffer.from(buffer);
  }

  // ─── Section heading helper ─────────────────────────────────────────
  private sectionHeading(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: '2563EB',
          space: 4,
          size: 2,
          style: BorderStyle.SINGLE,
        },
      },
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: 26, // 13pt
          color: '1E3A5F',
          font: 'Helvetica',
        }),
      ],
    });
  }

  // ─── Education entry ────────────────────────────────────────────────
  private educationEntry(edu: any): Paragraph[] {
    const result: Paragraph[] = [];
    const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');

    // School + date
    result.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: edu.school || '',
            bold: true,
            size: 22,
            color: '1F2937',
            font: 'Helvetica',
          }),
          dateRange
            ? new TextRun({
                text: `    ${dateRange}`,
                size: 20,
                color: '6B7280',
                font: 'Helvetica',
              })
            : new TextRun({ text: '' }),
        ],
      }),
    );

    // Degree + major
    const subTitle = [edu.degree, edu.major].filter(Boolean).join(' · ');
    if (subTitle) {
      result.push(
        new Paragraph({
          spacing: { before: 20, after: 40 },
          children: [
            new TextRun({
              text: subTitle,
              size: 20,
              color: '4B5563',
              font: 'Helvetica',
              italics: true,
            }),
            edu.gpa
              ? new TextRun({
                  text: `  GPA: ${edu.gpa}`,
                  size: 20,
                  color: '9CA3AF',
                  font: 'Helvetica',
                })
              : new TextRun({ text: '' }),
          ],
        }),
      );
    }

    if (edu.description) {
      result.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: edu.description,
              size: 21,
              color: '4B5563',
              font: 'Helvetica',
            }),
          ],
        }),
      );
    }

    return result;
  }

  // ─── Work experience entry ──────────────────────────────────────────
  private workEntry(w: any): Paragraph[] {
    const result: Paragraph[] = [];
    const dateRange = [w.startDate, w.endDate].filter(Boolean).join(' - ');

    // Company + date
    result.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: w.company || '',
            bold: true,
            size: 22,
            color: '1F2937',
            font: 'Helvetica',
          }),
          dateRange
            ? new TextRun({
                text: `    ${dateRange}`,
                size: 20,
                color: '6B7280',
                font: 'Helvetica',
              })
            : new TextRun({ text: '' }),
        ],
      }),
    );

    // Position
    result.push(
      new Paragraph({
        spacing: { before: 20, after: 60 },
        children: [
          new TextRun({
            text: w.position || '',
            size: 20,
            color: '2563EB',
            font: 'Helvetica',
            italics: true,
          }),
        ],
      }),
    );

    // Description bullets
    if (w.description) {
      const lines = w.description
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => line.replace(/^[•\-–—]\s*/, ''));

      for (const line of lines) {
        result.push(
          new Paragraph({
            spacing: { after: 40 },
            bullet: {
              level: 0,
            },
            children: [
              new TextRun({
                text: line,
                size: 21,
                color: '374151',
                font: 'Helvetica',
              }),
            ],
          }),
        );
      }
    }

    // Extra spacing after entry
    result.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [],
      }),
    );

    return result;
  }

  // ─── Project entry ──────────────────────────────────────────────────
  private projectEntry(p: any): Paragraph[] {
    const result: Paragraph[] = [];
    const dateRange = [p.startDate, p.endDate].filter(Boolean).join(' - ');

    result.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: p.name || '',
            bold: true,
            size: 22,
            color: '1F2937',
            font: 'Helvetica',
          }),
          dateRange
            ? new TextRun({
                text: `    ${dateRange}`,
                size: 20,
                color: '6B7280',
                font: 'Helvetica',
              })
            : new TextRun({ text: '' }),
        ],
      }),
    );

    const subLine = [p.role, p.tech ? `Tech: ${p.tech}` : '']
      .filter(Boolean)
      .join('  ·  ');
    if (subLine) {
      result.push(
        new Paragraph({
          spacing: { before: 20, after: 60 },
          children: [
            new TextRun({
              text: subLine,
              size: 20,
              color: '6B7280',
              font: 'Helvetica',
              italics: true,
            }),
          ],
        }),
      );
    }

    if (p.description) {
      const lines = p.description
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => line.replace(/^[•\-–—]\s*/, ''));

      for (const line of lines) {
        result.push(
          new Paragraph({
            spacing: { after: 40 },
            bullet: {
              level: 0,
            },
            children: [
              new TextRun({
                text: line,
                size: 21,
                color: '374151',
                font: 'Helvetica',
              }),
            ],
          }),
        );
      }
    }

    if (p.link) {
      result.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: p.link,
              size: 20,
              color: '2563EB',
              font: 'Helvetica',
            }),
          ],
        }),
      );
    }

    result.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [],
      }),
    );

    return result;
  }

  // ─── Skills Table ───────────────────────────────────────────────────
  private skillsTable(skills: any[]): Table {
    const rows = skills.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2500, type: WidthType.DXA },
              shading: { fill: 'F8FAFC' },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: s.category || '',
                      bold: true,
                      size: 21,
                      color: '1E3A5F',
                      font: 'Helvetica',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 6500, type: WidthType.DXA },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: s.items || '',
                      size: 21,
                      color: '374151',
                      font: 'Helvetica',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    );

    return new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows,
    });
  }

  // ─── HTML Resume Generation ─────────────────────────────────────────
  generateResumeHtml(data: any, template: string): string {
    const d = this.normalizeData(data);
    const t = template || 'minimal';

    const css = this.getTemplateCss(t);
    const sectionsHtml = this.buildSectionsHtml(d, t);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(d.basicInfo.name || 'Resume')}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="resume-page">
    <!-- Header -->
    <header class="resume-header header-${t}">
      <h1 class="resume-name">${this.escapeHtml(d.basicInfo.name || 'Your Name')}</h1>
      <p class="resume-title">${this.escapeHtml(d.basicInfo.title || '')}</p>
      <div class="contact-row">
        ${d.basicInfo.email ? `<span class="contact-item"><span class="contact-icon">&#9993;</span> ${this.escapeHtml(d.basicInfo.email)}</span>` : ''}
        ${d.basicInfo.phone ? `<span class="contact-item"><span class="contact-icon">&#9742;</span> ${this.escapeHtml(d.basicInfo.phone)}</span>` : ''}
        ${d.basicInfo.location ? `<span class="contact-item"><span class="contact-icon">&#9872;</span> ${this.escapeHtml(d.basicInfo.location)}</span>` : ''}
        ${d.basicInfo.website ? `<span class="contact-item"><span class="contact-icon">&#127760;</span> ${this.escapeHtml(d.basicInfo.website)}</span>` : ''}
      </div>
    </header>

    ${d.basicInfo.summary ? `
    <section class="resume-section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary-text">${this.escapeHtml(d.basicInfo.summary)}</p>
    </section>
    ` : ''}

    ${sectionsHtml}
  </div>
</body>
</html>`;
  }

  // ─── Build sections HTML based on module order ──────────────────────
  private buildSectionsHtml(d: any, template: string): string {
    const moduleOrder: string[] = d.moduleOrder || [
      'education',
      'work',
      'projects',
      'skills',
    ];
    let html = '';

    for (const key of moduleOrder) {
      switch (key) {
        case 'education':
          if (d.education?.length > 0) {
            html += this.buildEducationHtml(d.education, template);
          }
          break;
        case 'work':
          if (d.work?.length > 0) {
            html += this.buildWorkHtml(d.work, template);
          }
          break;
        case 'projects':
          if (d.projects?.length > 0) {
            html += this.buildProjectsHtml(d.projects, template);
          }
          break;
        case 'skills':
          if (d.skills?.length > 0) {
            html += this.buildSkillsHtml(d.skills);
          }
          break;
      }
    }

    return html;
  }

  private buildEducationHtml(items: any[], _tpl: string): string {
    let html = '<section class="resume-section"><h2 class="section-title">Education</h2>';
    for (const edu of items) {
      const dateRange = [edu.startDate, edu.endDate]
        .filter(Boolean)
        .join(' - ');
      html += `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-name">${this.escapeHtml(edu.school || '')}</span>
            <span class="entry-date">${dateRange}</span>
          </div>
          <div class="entry-subtitle">${this.escapeHtml([edu.degree, edu.major].filter(Boolean).join(' · '))}${edu.gpa ? ` &nbsp;|&nbsp; GPA: ${this.escapeHtml(edu.gpa)}` : ''}</div>
          ${edu.description ? `<p class="entry-desc">${this.escapeHtml(edu.description)}</p>` : ''}
        </div>`;
    }
    html += '</section>';
    return html;
  }

  private buildWorkHtml(items: any[], _tpl: string): string {
    let html =
      '<section class="resume-section"><h2 class="section-title">Work Experience</h2>';
    for (const w of items) {
      const dateRange = [w.startDate, w.endDate]
        .filter(Boolean)
        .join(' - ');
      const descLines = w.description
        ? w.description
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
        : [];
      html += `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-name">${this.escapeHtml(w.company || '')}</span>
            <span class="entry-date">${dateRange}</span>
          </div>
          <div class="entry-subtitle accent">${this.escapeHtml(w.position || '')}</div>
          ${
            descLines.length > 0
              ? `<ul class="bullet-list">${descLines.map((l: string) => `<li>${this.escapeHtml(l.replace(/^[•\-–—]\s*/, ''))}</li>`).join('')}</ul>`
              : ''
          }
        </div>`;
    }
    html += '</section>';
    return html;
  }

  private buildProjectsHtml(items: any[], _tpl: string): string {
    let html =
      '<section class="resume-section"><h2 class="section-title">Projects</h2>';
    for (const p of items) {
      const dateRange = [p.startDate, p.endDate]
        .filter(Boolean)
        .join(' - ');
      const subLine = [p.role, p.tech ? `Tech: ${p.tech}` : '']
        .filter(Boolean)
        .join(' &nbsp;·&nbsp; ');
      const descLines = p.description
        ? p.description
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
        : [];
      html += `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-name">${this.escapeHtml(p.name || '')}</span>
            <span class="entry-date">${dateRange}</span>
          </div>
          <div class="entry-subtitle">${subLine}</div>
          ${
            descLines.length > 0
              ? `<ul class="bullet-list">${descLines.map((l: string) => `<li>${this.escapeHtml(l.replace(/^[•\-–—]\s*/, ''))}</li>`).join('')}</ul>`
              : ''
          }
          ${p.link ? `<p class="entry-link">${this.escapeHtml(p.link)}</p>` : ''}
        </div>`;
    }
    html += '</section>';
    return html;
  }

  private buildSkillsHtml(items: any[]): string {
    let html =
      '<section class="resume-section"><h2 class="section-title">Skills</h2>';
    html += '<table class="skills-table">';
    for (const s of items) {
      html += `<tr><td class="skill-cat">${this.escapeHtml(s.category || '')}</td><td class="skill-items">${this.escapeHtml(s.items || '')}</td></tr>`;
    }
    html += '</table></section>';
    return html;
  }

  // ─── Template CSS ───────────────────────────────────────────────────
  private getTemplateCss(template: string): string {
    const baseCss = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 10.5pt;
        color: #1e293b;
        line-height: 1.55;
        background: #fff;
      }

      .resume-page {
        max-width: 100%;
        padding: 0;
      }

      .resume-header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
      }

      .resume-name {
        font-size: 24pt;
        font-weight: 700;
        letter-spacing: 0.02em;
        margin-bottom: 2px;
      }

      .resume-title {
        font-size: 12pt;
        color: #4b5563;
        font-weight: 400;
        margin-bottom: 8px;
      }

      .contact-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px 18px;
        font-size: 9pt;
        color: #6b7280;
      }

      .contact-item { display: inline-flex; align-items: center; gap: 3px; }
      .contact-icon { font-size: 9pt; }

      .resume-section {
        margin-bottom: 16px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 11pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 8px;
        padding-bottom: 3px;
      }

      .summary-text {
        color: #374151;
        font-size: 10pt;
        line-height: 1.6;
      }

      .entry {
        margin-bottom: 10px;
      }

      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }

      .entry-name {
        font-weight: 600;
        font-size: 10.5pt;
        color: #1e293b;
      }

      .entry-date {
        font-size: 9pt;
        color: #9ca3af;
        white-space: nowrap;
      }

      .entry-subtitle {
        font-size: 9.5pt;
        color: #6b7280;
        font-style: italic;
        margin-bottom: 2px;
      }

      .entry-subtitle.accent { color: #4f46e5; }

      .entry-desc { font-size: 9.5pt; color: #4b5563; margin-top: 2px; }

      .entry-link { font-size: 9pt; color: #4f46e5; margin-top: 2px; }

      .bullet-list {
        list-style: disc;
        padding-left: 18px;
        margin-top: 4px;
        font-size: 9.5pt;
        color: #374151;
      }
      .bullet-list li { margin-bottom: 1px; }

      .skills-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5pt;
      }
      .skills-table td {
        padding: 4px 6px;
        vertical-align: top;
      }
      .skill-cat {
        font-weight: 600;
        color: #1e3a5f;
        width: 120px;
        white-space: nowrap;
      }
      .skill-items { color: #374151; }
    `;

    const minimalCss = `
      .section-title {
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 4px;
      }
    `;

    const classicCss = `
      .resume-header { border-bottom: 2px solid #1e3a5f; }
      .resume-name { color: #1e3a5f; }
      .section-title {
        color: #1e3a5f;
        border-left: 3px solid #1e3a5f;
        padding-left: 8px;
        padding-bottom: 0;
        margin-bottom: 8px;
      }
    `;

    const modernCss = `
      .resume-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 24px 28px;
        margin: 0 0 20px 0;
        border-radius: 0;
        color: #fff;
      }
      .resume-name { color: #fff; }
      .resume-title { color: rgba(255,255,255,0.85); }
      .contact-row { color: rgba(255,255,255,0.8); }
      .section-title {
        color: #7c3aed;
        position: relative;
        padding-left: 16px;
        padding-bottom: 0;
        margin-bottom: 8px;
      }
      .section-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 18px;
        background: linear-gradient(180deg, #7c3aed, #3b82f6);
        border-radius: 2px;
      }
      .entry-subtitle.accent { color: #7c3aed; }
    `;

    const templateCss =
      template === 'classic'
        ? classicCss
        : template === 'modern'
          ? modernCss
          : minimalCss;

    return baseCss + templateCss;
  }

  // ─── Helpers ────────────────────────────────────────────────────────
  private normalizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return {
        basicInfo: {},
        moduleOrder: [],
        education: [],
        work: [],
        projects: [],
        skills: [],
      };
    }

    return {
      basicInfo: {
        name: data.basicInfo?.name || '',
        title: data.basicInfo?.title || '',
        email: data.basicInfo?.email || '',
        phone: data.basicInfo?.phone || '',
        location: data.basicInfo?.location || '',
        website: data.basicInfo?.website || '',
        summary: data.basicInfo?.summary || '',
      },
      moduleOrder: Array.isArray(data.moduleOrder) ? data.moduleOrder : [],
      education: Array.isArray(data.education) ? data.education : [],
      work: Array.isArray(data.work) ? data.work : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
    };
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
