import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // 1. Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Token Security (df_...)
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : queryToken;

  if (!token || !token.startsWith('df_')) {
    return res.status(401).json({ 
      error: 'Gateway Access Denied', 
      message: 'A valid Gateway Token (df_...) is required in the Authorization header or ?token= query parameter.' 
    });
  }

  try {
    // 3. Payload Normalization (Supports CloudMailin, Postmark, and Direct API)
    // CloudMailin sends files in an 'attachments' array.
    const body = req.body;
    let base64Data = body.base64Data;
    let filename = body.filename;
    let mimeType = body.mimeType;
    let sender = body.from || body.envelope?.from || 'Unknown';
    let subject = body.subject || 'No Subject';

    if (body.attachments && body.attachments.length > 0) {
      const firstAttachment = body.attachments[0];
      // CloudMailin provides content in 'content' (base64)
      base64Data = firstAttachment.content || firstAttachment.base64;
      filename = firstAttachment.file_name || firstAttachment.filename;
      mimeType = firstAttachment.content_type || firstAttachment.contentType;
    }

    if (!base64Data) {
      return res.status(400).json({ 
        error: 'Inbound Payload Empty', 
        message: 'No document detected. Ensure your email has a PDF or image attachment.' 
      });
    }

    // 4. AI Processing
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `Act as a Forensic AP Auditor.
    Extract data from the attached document. 
    
    STRICT RULES:
    1. Only process Invoices, POs, Receipts, or Packing Slips.
    2. If it's something else, set "doc_type" to "unknown".
    3. Return valid JSON only.
    
    CONTEXT:
    Sent by: ${sender}
    Subject: ${subject}
    `;

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

    // 5. Success Response
    return res.status(200).json({
      status: extraction.doc_type === 'unknown' ? 'rejected' : 'ingested',
      docId: `doc_${Math.random().toString(36).substr(2, 9)}`,
      extraction,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return res.status(500).json({ error: 'Gateway Error', message: error.message });
  }
}
