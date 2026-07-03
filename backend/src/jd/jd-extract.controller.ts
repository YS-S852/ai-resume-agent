import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JdExtractService } from './jd-extract.service';

/** Minimal Multer file type to avoid dependency on Express.Multer namespace */
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('jd')
export class JdExtractController {
  constructor(private readonly jdExtractService: JdExtractService) {}

  /** Image upload -> OCR -> extract text */
  @Post('extract/image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async extractFromImage(@UploadedFile() file: MulterFile) {
    const text = await this.jdExtractService.extractFromImage(file.buffer);
    return { text, source: 'image' };
  }

  /** PDF upload -> parse -> extract text */
  @Post('extract/pdf')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async extractFromPdf(@UploadedFile() file: MulterFile) {
    const text = await this.jdExtractService.extractFromPdf(file.buffer);
    return { text, source: 'pdf' };
  }

  /** Link/URL parsing -> fetch -> extract text */
  @Post('extract/link')
  @HttpCode(HttpStatus.OK)
  async extractFromLink(@Body() body: { url: string }) {
    const text = await this.jdExtractService.extractFromLink(body.url);
    return { text, source: 'link' };
  }

  /** Clipboard parsing -> extract structured JD from raw text */
  @Post('extract/clipboard')
  @HttpCode(HttpStatus.OK)
  async extractFromClipboard(@Body() body: { text: string }) {
    const text = await this.jdExtractService.cleanAndStructure(body.text);
    return { text, source: 'clipboard' };
  }
}
