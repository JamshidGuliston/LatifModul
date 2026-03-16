import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private chatSession: ChatSession | null = null;
    private readonly MODEL_NAME = 'gemini-1.5-flash'; // Good balance of speed and capability

    constructor() {
        // If you don't have it in your environment.ts, please add it:
        // export const environment = { ..., geminiApiKey: 'YOUR_API_KEY' };
        const apiKey = environment.geminiApiKey || '';
        if (!apiKey) {
            console.warn('Gemini API Key is missing in environment.ts! Chat may not work.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async startChat(systemInstruction?: string) {
        const model = this.genAI.getGenerativeModel({
            model: this.MODEL_NAME,
            systemInstruction: systemInstruction || "Sen o'quvchilarga dasturlash, modullar va boshqa darslar bo'yicha yordam beradigan yordamchisan. Xushmuomala bo'l va o'zbek tilida qisqa va aniq javob ber.",
        });

        this.chatSession = model.startChat({
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
            history: []
        });

        return this.chatSession;
    }

    async sendMessage(message: string): Promise<string> {
        if (!this.chatSession) {
            await this.startChat();
        }

        try {
            const result = await this.chatSession!.sendMessage(message);
            return result.response.text();
        } catch (error) {
            console.error('Error in Gemini Service:', error);
            throw error;
        }
    }
}
