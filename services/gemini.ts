
import { GoogleGenAI, Type } from "@google/genai";
import { EXTRACTION_SCHEMA } from "../constants";
import { ExtractionResult, DocType } from "../types";

export class GeminiService {
  // Guidelines: Do not persist 'ai' instance to avoid stale API keys.
  // Instead, create it right before use.

  async extractFromImage(base64Data: string, mimeType: string): Promise<ExtractionResult> {
    // Correct initialization: always use named parameter { apiKey: ... }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Act as an expert data entry specialist. Analyze this document and extract all relevant information in a strict JSON format based on the provided schema. Do not hallucinate. If a value is unknown, use null. Set doc_type correctly. If doc_type is invoice, fill specialized.invoice and set specialized.purchase_order to null." },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA as any,
        temperature: 0.1,
      }
    });

    try {
      // Access .text property directly as defined in the response object
      const result = JSON.parse(response.text || '{}');
      return result as ExtractionResult;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("Invalid extraction format received from AI.");
    }
  }

  // Simplified PDF processing: Extracting first page for MVP demo
  async extractFromDocument(file: File): Promise<ExtractionResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await this.extractFromImage(base64, file.type);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const geminiService = new GeminiService();
