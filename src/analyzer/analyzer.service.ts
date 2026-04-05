// analyzer.service.ts
import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class AnalyzerService {
  constructor(private readonly geminiService: GeminiService) {}

  async analyzeFile(file: Express.Multer.File) {
    console.log('Analyzing file:');
    console.log('- Original name:', file.originalname);
    console.log('- Mimetype:', file.mimetype);
    console.log('- Size:', file.size, 'bytes');
    console.log('- Buffer length:', file.buffer.length);

    const response = await this.geminiService.connectGemini(file)
    
    return { 
      message: 'File analyzed successfully', 
      result: response,
      text: response.text
    };
  }
}