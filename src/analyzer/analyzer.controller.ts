// analyzer.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))  // ← Matches formData.append('file', ...)
  uploadFile(
    @UploadedFile() file: Express.Multer.File  // ← Correct type!
  ) {
    if (!file) {
      return { message: 'No file uploaded', error: true };
    }
    
    return this.analyzerService.analyzeFile(file);
  }
}