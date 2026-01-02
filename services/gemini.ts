
import { GoogleGenAI } from "@google/genai";
import { EXTRACTION_SCHEMA } from "../constants";
import { ExtractionResult, DocType } from "../types";

export class GeminiService {
  async extractFromImage(base64Data: string, mimeType: string): Promise<ExtractionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Act as a Strategic Controller and AP Automation Architect. 
    Analyze the provided document with extreme precision.
    
    CRITICAL CLASSIFICATION RULE:
    - First, determine if this is a valid financial document (Invoice, Purchase Order, Receipt, Packing List, or Statement).
    - If the document is NOT one of these (e.g., a photo of a cat, a general letter, a passport, or random text), you MUST set "doc_type" to "unknown" and add exactly one warning: "NOT_A_VALID_DOCUMENT: The uploaded file is not a recognized financial instrument for AP processing."
    
    INTELLIGENCE RULES FOR VALID DOCUMENTS:
    1. DISCOUNT DISCOVERY: Look for terms like '2/10 Net 30' or '1% discount'. If found, set 'specialized.invoice.has_discount_opportunity' to true.
    2. GL CODING: Based on the vendor name and the line items, suggest a standard General Ledger (GL) code.
    3. FINANCIAL RECONCILIATION: Components (subtotal, tax, shipping) must balance to the total.
    4. LINE ITEMS: Extract every line item with description, quantity, unit price, and amount.
    5. CONFIDENCE SCORES: Provide a confidence score (0.0 to 1.0) for every field.
    6. VENDOR IDENTIFICATION: Extract full legal entity name.
    
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
        temperature: 0.1,
      }
    });

    try {
      const text = response.text;
      if (!text) throw new Error("Empty response from AI engine.");
      
      const result = JSON.parse(text) as ExtractionResult;
      return result;
    } catch (error) {
      console.error("Gemini Extraction Failure:", error);
      throw new Error("The AI failed to parse the document structure reliably.");
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
