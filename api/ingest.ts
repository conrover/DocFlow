import { GoogleGenAI } from "@google/genai";

// Standard Vercel Serverless Function (Node.js)
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer df_')) {
    return res.status(401).json({ error: 'Invalid or missing Authorization token' });
  }

  try {
    const { filename, mimeType, base64Data, metadata } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing document payload (base64Data)' });
    }

    // Initialize AI on the server
    // Fix: Use process.env.API_KEY exclusively as per SDK requirements.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Act as a Strategic Controller. Analyze this document. 
    If it is NOT a valid financial document (Invoice/PO/Packing Slip), set "doc_type" to "unknown" 
    and return a warning: "NOT_A_VALID_DOCUMENT".
    Otherwise, extract all fields, line items, and suggest GL codes. 
    Return strictly valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'application/pdf'
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const result = JSON.parse(response.text || '{}');

    // Return the extraction to the sender (or you could save to a DB here)
    return res.status(200).json({
      status: 'success',
      docId: Math.random().toString(36).substr(2, 9),
      extraction: result,
      ingestedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}