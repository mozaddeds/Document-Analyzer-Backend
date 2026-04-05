// src/gemini/gemini.service.ts
import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

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
                {
                    text: `Summarize this document in the following JSON format ONLY (no markdown, no extra text):
{
    "title": "brief document title",
    "summary": "2-3 sentence overview",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "mainTopics": ["topic 1", "topic 2"]
}

Keep it concise. Maximum 150 words total.` },
                {
                    inlineData: {
                        mimeType: file.mimetype || 'application/pdf',
                        data: file.buffer.toString('base64')
                    }
                }
            ];

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: contents
            });

            // Get the response text with a fallback
            let cleanResponse = response.text || '';

            // Remove markdown code blocks if present
            cleanResponse = cleanResponse.replace(/```json\n?/g, '');
            cleanResponse = cleanResponse.replace(/```\n?/g, '');
            cleanResponse = cleanResponse.trim();

            // If empty response, throw error
            if (!cleanResponse) {
                throw new Error('Empty response from Gemini API');
            }

            // Parse JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cleanResponse);
                console.log('Parsed Gemini response:\n', parsedResponse);
            } catch (parseError) {
                // If parsing fails, return a structured fallback
                console.error('Failed to parse JSON, raw response:', cleanResponse);
                parsedResponse = {
                    title: "Summary",
                    summary: cleanResponse.substring(0, 200),
                    keyPoints: [],
                    mainTopics: []
                };
            }

            return {
                text: parsedResponse,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error connecting to Gemini API:', error);
            throw new Error(`Failed to connect to Gemini API: ${error.message}`);
        }
    }
}