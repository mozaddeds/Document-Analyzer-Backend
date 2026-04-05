// src/analyzer/analyzer.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, HttpStatus } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded',
        error: true
      };
    }
    
    try {
      const result = await this.analyzerService.analyzeFile(file);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: true
      };
    }
  }
}