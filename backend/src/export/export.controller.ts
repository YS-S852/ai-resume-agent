import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportResumeDto } from './dto/export.dto';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  async exportPdf(
    @Body() body: ExportResumeDto,
    @Res() res: Response,
  ) {
    const html = this.exportService.generateResumeHtml(
      body.resumeData,
      body.template,
    );
    const pdfBuffer = await this.exportService.generatePdf(html);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }

  @Post('docx')
  @HttpCode(HttpStatus.OK)
  async exportDocx(
    @Body() body: ExportResumeDto,
    @Res() res: Response,
  ) {
    const docxBuffer = await this.exportService.generateDocx(
      body.resumeData,
      body.template,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="resume.docx"',
      'Content-Length': docxBuffer.length.toString(),
    });
    res.end(docxBuffer);
  }
}
