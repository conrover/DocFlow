import { GoogleGenAI } from "@google/genai";

// Standard Vercel Serverless Function (Node.js)
export default async function handler(req: any, res: any) {
  // Handle CORS
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
    const { filename, mimeType, base64Data, emailMetadata } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing document payload (base64Data)' });
    }

    // Initialize AI on the server
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // System instruction for the "Inbound Gateway" firewall
    const systemInstruction = `Act as a Strategic AP Controller and Document Firewall.
    Your primary job is to classify and extract data from financial documents.
    
    REJECTION CRITERIA:
    - If the document is NOT an Invoice, Purchase Order (PO), Receipt, or Packing Slip, you MUST set "doc_type" to "unknown" in the JSON.
    - If rejected, add a warning: "INVALID_DOCUMENT_TYPE: This document is not a recognized financial instrument (Invoice/PO/Packing Slip)."
    
    EXTRACTION RULES:
    - For valid documents, extract all fields: vendor, amounts, dates, line items, and currency.
    - Provide a "gl_code_suggestion" based on the vendor and line items.
    - Identify early payment discount opportunities (e.g., 2/10 Net 30).
    
    EMAIL CONTEXT:
    The document was sent via email from: ${emailMetadata?.from || 'Unknown'}.
    Subject line: ${emailMetadata?.subject || 'No Subject'}.
    Use this context to help identify the vendor if the document is blurry.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: systemInstruction },
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

    const extraction = JSON.parse(response.text || '{}');

    // Return the result to the caller
    // In a real scenario, this would also write to a Postgres DB here.
    return res.status(200).json({
      status: extraction.doc_type === 'unknown' ? 'rejected' : 'ingested',
      source: emailMetadata ? 'EMAIL' : 'API',
      docId: `doc_${Math.random().toString(36).substr(2, 9)}`,
      extraction,
      receivedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
