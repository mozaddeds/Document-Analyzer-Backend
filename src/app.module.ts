import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { GeminiModule } from './gemini/gemini.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AnalyzerModule,
    GeminiModule,
    ConfigModule.forRoot({
      isGlobal: true, // No need to import in other modules
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
