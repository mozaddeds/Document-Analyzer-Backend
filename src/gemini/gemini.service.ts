import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { application } from 'express';
import * as fs from 'fs';

@Injectable()
export class GeminiService {

    async connectGemini(file: Express.Multer.File) {

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        try {
            const contents = [
                { text: "summerize this document briefly" },
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: file.buffer.toString('base64')
                    }
                }
            ]

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: contents
            });

            console.log('Gemini API response: \n', response.text);
            
            return response;
        }

        catch (error) {
            console.error('Error connecting to Gemini API:', error);
            throw new Error('Failed to connect to Gemini API');
        }
    }

}
