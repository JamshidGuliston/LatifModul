import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private chatSession: ChatSession | null = null;
    private readonly MODEL_NAME = 'gemini-2.5-flash'; // Good balance of speed and capability

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

    /**
     * Rasmni yuklab base64 ga o'giradi
     */
    private async fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
        console.log('[GeminiService] Fetching image:', url);
        const response = await fetch(url);
        console.log('[GeminiService] Image fetch status:', response.status, response.headers.get('content-type'));
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const data = btoa(binary);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return { data, mimeType };
    }

    /**
     * Rasm + talaba ta'rifini AI ga yuboradi, baholaydi va feedback qaytaradi.
     * @returns { score: 0-100, feedback: string }
     */
    async gradeImageAnswer(
        imageUrl: string,
        studentAnswer: string,
        maxPoints: number = 10
    ): Promise<{ score: number; feedback: string }> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
            const image = await this.fetchImageAsBase64(imageUrl);

            const prompt = `Sen o'zbek tili bo'yicha kompyuter fanlari o'qituvchisisisan.
Talaba quyidagi kompyuter qurilmasi rasmini ko'rib, unga o'zbek tilida ta'rif yozdi.

Talabaning ta'rifi: "${studentAnswer}"

Maksimal ball: ${maxPoints}

Iltimos, talabaning ta'rifini quyidagi mezonlar bo'yicha baholang:
- Rasmda tasvirlangan qurilmani to'g'ri aniqlaganmi?
- Ta'rif to'liq va aniqmi?
- O'zbek tili to'g'ri ishlatilganmi?

Javobni FAQAT quyidagi JSON formatda ber (boshqa hech narsa yozma):
{"score": <0 dan ${maxPoints} gacha son>, "feedback": "<o'zbek tilida 1-2 gap izoh>"}`;

            const result = await model.generateContent([
                { inlineData: { data: image.data, mimeType: image.mimeType } },
                prompt
            ]);

            const text = result.response.text().trim();
            console.log('[GeminiService] Raw response:', text);

            // Handle ```json ... ``` blocks and plain JSON
            const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                console.log('[GeminiService] Parsed:', parsed);
                return {
                    score: Math.min(Math.max(Number(parsed.score) || 0, 0), maxPoints),
                    feedback: parsed.feedback || ''
                };
            }
            console.warn('[GeminiService] Could not parse JSON from:', cleaned);
            return { score: 0, feedback: text };
        } catch (err: any) {
            console.error('[GeminiService] AI grading error:', err?.message || err);
            return { score: 0, feedback: 'AI tekshirishda xatolik yuz berdi.' };
        }
    }
}
