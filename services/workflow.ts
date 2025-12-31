
import { db } from './db';
import { geminiService } from './gemini';
import { DocumentRecord, DocStatus, DocType, IngestionSource } from '../types';

export const workflowService = {
  async processInboundDocument(file: File, source: IngestionSource = 'MANUAL', onUpdate?: () => void) {
    const currentUser = db.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required");

    const newDoc: DocumentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      filename: file.name,
      source: source,
      status: DocStatus.EXTRACTING,
      type: DocType.UNKNOWN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileUrl: URL.createObjectURL(file),
      auditTrail: [{
        timestamp: Date.now(),
        user: source === 'EMAIL' ? 'Mail Daemon' : currentUser.name,
        action: 'INGEST',
        details: source === 'EMAIL' 
          ? `Inbound email received at ${currentUser.inboundAddress}. Attachment detected.`
          : 'Manual document transmit initiated.'
      }]
    };
    
    db.saveDocument(newDoc);
    if (onUpdate) onUpdate();

    try {
      const extraction = await geminiService.extractFromDocument(file);
      const updatedDoc = {
        ...newDoc,
        status: DocStatus.NEEDS_REVIEW,
        type: extraction.doc_type,
        extraction,
        validation: db.validateExtraction({ ...newDoc, extraction }),
        updatedAt: Date.now()
      };
      db.saveDocument(updatedDoc);
    } catch (error: any) {
      const failedDoc = {
        ...newDoc,
        status: DocStatus.FAILED,
        lastError: { code: 'AI_FAILURE', message: error.message },
        updatedAt: Date.now()
      };
      db.saveDocument(failedDoc);
    } finally {
      if (onUpdate) onUpdate();
    }
    
    return newDoc.id;
  },

  async reprocessDocument(docId: string, onUpdate?: () => void) {
    const doc = db.getDocument(docId);
    if (!doc) return;

    const updatedDoc: DocumentRecord = {
      ...doc,
      status: DocStatus.EXTRACTING,
      updatedAt: Date.now(),
      auditTrail: [...doc.auditTrail, {
        timestamp: Date.now(),
        user: db.getCurrentUser()?.name || 'System',
        action: 'REPROCESS',
        details: 'Manual re-extraction triggered.'
      }]
    };
    
    db.saveDocument(updatedDoc);
    if (onUpdate) onUpdate();

    try {
      // Fetch the file from URL
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const file = new File([blob], doc.filename, { type: blob.type });

      const extraction = await geminiService.extractFromDocument(file);
      const finalDoc = {
        ...updatedDoc,
        status: DocStatus.NEEDS_REVIEW,
        type: extraction.doc_type,
        extraction,
        validation: db.validateExtraction({ ...updatedDoc, extraction }),
        updatedAt: Date.now()
      };
      db.saveDocument(finalDoc);
    } catch (error: any) {
      const failedDoc = {
        ...updatedDoc,
        status: DocStatus.FAILED,
        lastError: { code: 'AI_FAILURE', message: error.message },
        updatedAt: Date.now()
      };
      db.saveDocument(failedDoc);
    } finally {
      if (onUpdate) onUpdate();
    }
  }
};
