import { Module } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerController } from './analyzer.controller';
import { GeminiService } from 'src/gemini/gemini.service';

@Module({
  controllers: [AnalyzerController],
  providers: [AnalyzerService, GeminiService],
})
export class AnalyzerModule {}
