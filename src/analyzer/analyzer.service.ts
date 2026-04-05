// src/analyzer/analyzer.service.ts
import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class AnalyzerService {
  constructor(private readonly geminiService: GeminiService) {}

  async analyzeFile(file: Express.Multer.File) {
    try {
      // Call Gemini service to analyze the file
      const result = await this.geminiService.connectGemini(file);
      
      // Return a structured response
      return {
        summary: result.text || 'No summary generated',
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}