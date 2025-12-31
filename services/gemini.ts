
import { GoogleGenAI, Type } from "@google/genai";
import { EXTRACTION_SCHEMA } from "../constants";
import { ExtractionResult, DocType } from "../types";

export class GeminiService {
  /**
   * Performs deterministic financial data extraction using Gemini Flash.
   * Emphasizes strict accuracy for tax, subtotal, and vendor identification.
   */
  async extractFromImage(base64Data: string, mimeType: string): Promise<ExtractionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Act as a senior forensic accountant and data entry architect. 
    Analyze the provided document with 100% precision.
    
    EXTRACTION RULES:
    1. STRICT DATA TYPING: Numbers must be floats, Dates must be ISO-8601 or YYYY-MM-DD.
    2. FINANCIAL RECONCILIATION: Ensure (specialized.invoice.subtotal + specialized.invoice.tax + specialized.invoice.shipping) == specialized.invoice.total. If there is a variance, note it in 'warnings'.
    3. CONFIDENCE SCORES: Provide an honest float [0.0 - 1.0] for every field and table.
    4. VENDOR IDENTIFICATION: Look for headers, logos, and 'From' sections.
    5. ZERO HALLUCINATION: If a field is not physically present, return null.
    6. COORDINATE REASONING: Associate extracted text with the specific page it was found on.
    
    Return the result in strict JSON format matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
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
        temperature: 0.1, // Near-deterministic for data extraction
      }
    });

    try {
      const text = response.text;
      if (!text) throw new Error("Empty response from AI engine.");
      
      const result = JSON.parse(text);
      return result as ExtractionResult;
    } catch (error) {
      console.error("Gemini Extraction Failure:", error);
      throw new Error("The AI failed to parse the document structure reliably. Please try a higher-resolution scan.");
    }
  }

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
