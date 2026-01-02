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

  // Token Authorization Check
  // We check both the Authorization header AND the query parameter for webhook compatibility.
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : queryToken;

  if (!token || !token.startsWith('df_')) {
    return res.status(401).json({ error: 'Invalid or missing Gateway Token (df_...)' });
  }

  try {
    // Handle different webhook payload formats
    // filename/mimeType/base64Data for direct API
    // attachments[0] for common email parse providers
    let { filename, mimeType, base64Data, emailMetadata, attachments } = req.body;

    // If using a standard Inbound Parse service, they might send an array of attachments
    if (attachments && attachments.length > 0) {
      const first = attachments[0];
      base64Data = first.content || first.base64; // Depends on the provider's schema
      filename = first.filename;
      mimeType = first.contentType || first.type;
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing document payload. Ensure the email has an attachment.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `Act as a Strategic AP Controller and Document Firewall.
    Analyze the provided attachment. 
    
    VALIDATION:
    - If the document is NOT an Invoice, PO, Receipt, or Packing Slip, set "doc_type" to "unknown".
    
    CONTEXT:
    - Sender: ${emailMetadata?.from || req.body.from || 'Unknown'}
    - Subject: ${emailMetadata?.subject || req.body.subject || 'No Subject'}
    
    Return strictly valid JSON extraction results.`;

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

    return res.status(200).json({
      status: extraction.doc_type === 'unknown' ? 'rejected' : 'ingested',
      docId: `doc_${Math.random().toString(36).substr(2, 9)}`,
      extraction,
      receivedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
