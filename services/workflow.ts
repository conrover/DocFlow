
import { db } from './db';
import { geminiService } from './gemini';
import { storageService } from './storage';
import { DocumentRecord, DocStatus, DocType, IngestionSource, AuditEntry } from '../types';

export const workflowService = {
  async processInboundDocument(file: File, source: IngestionSource = 'MANUAL', onUpdate?: () => void) {
    const currentUser = db.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required");

    const docId = Math.random().toString(36).substr(2, 9);
    
    await storageService.saveBlob(docId, file);

    const newDoc: DocumentRecord = {
      id: docId,
      userId: currentUser.id,
      filename: file.name,
      source: source,
      status: DocStatus.EXTRACTING,
      type: DocType.UNKNOWN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileUrl: '',
      auditTrail: [{
        timestamp: Date.now(),
        user: source === 'EMAIL' ? 'Mail Daemon' : (source === 'API' ? 'API Gateway' : currentUser.name),
        action: 'INGEST',
        details: source === 'EMAIL' 
          ? `Inbound email received at ${currentUser.inboundAddress}. Attachment detected.`
          : source === 'API' ? 'Payload received via REST API connector.' : 'Manual document transmit initiated.'
      }]
    };
    
    db.saveDocument(newDoc);
    if (onUpdate) onUpdate();

    try {
      const extraction = await geminiService.extractFromDocument(file);
      
      // Step: Validate Document Type Integrity
      if (extraction.doc_type === DocType.UNKNOWN || (extraction.warnings && extraction.warnings.some(w => w.includes('NOT_A_VALID_DOCUMENT')))) {
        const failedDoc: DocumentRecord = {
          ...newDoc,
          status: DocStatus.FAILED,
          type: DocType.UNKNOWN,
          extraction,
          lastError: { 
            code: 'INVALID_DOC_TYPE', 
            message: 'The uploaded file is not a valid financial document (Invoice/PO/Receipt).' 
          },
          updatedAt: Date.now(),
          auditTrail: [...newDoc.auditTrail, {
            timestamp: Date.now(),
            user: 'Security Firewall',
            action: 'REJECT',
            details: 'Document classification failed. Content does not match financial schemas.'
          }]
        };
        db.saveDocument(failedDoc);
        if (onUpdate) onUpdate();
        return docId;
      }

      const validation = db.validateExtraction({ ...newDoc, extraction });
      const confidences = extraction.fields.map(f => f.confidence);
      const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
      
      let finalStatus = DocStatus.NEEDS_REVIEW;
      const additionalAudit: AuditEntry[] = [];
      
      if (currentUser.autoApproveEnabled && validation.valid && !validation.isDuplicate && !validation.errors.length) {
        const threshold = (currentUser.autoApproveThreshold ?? 98) / 100;
        if (avgConfidence >= threshold) {
          finalStatus = DocStatus.APPROVED;
          additionalAudit.push({
            timestamp: Date.now(),
            user: 'Automation Intelligence',
            action: 'AUTO_APPROVE',
            details: `Straight-through processed (STP). Avg confidence (${Math.round(avgConfidence * 100)}%) >= threshold (${currentUser.autoApproveThreshold}%). No audit exceptions found.`
          });
        }
      }

      const updatedDoc = {
        ...newDoc,
        status: finalStatus,
        type: extraction.doc_type,
        extraction,
        validation,
        updatedAt: Date.now(),
        auditTrail: [...newDoc.auditTrail, ...additionalAudit]
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
    
    return docId;
  },

  async reprocessDocument(docId: string, onUpdate?: () => void) {
    const doc = db.getDocument(docId);
    const currentUser = db.getCurrentUser();
    if (!doc || !currentUser) return;

    const updatedDoc: DocumentRecord = {
      ...doc,
      status: DocStatus.EXTRACTING,
      updatedAt: Date.now(),
      auditTrail: [...doc.auditTrail, {
        timestamp: Date.now(),
        user: currentUser.name || 'System',
        action: 'REPROCESS',
        details: 'Manual re-extraction triggered.'
      }]
    };
    
    db.saveDocument(updatedDoc);
    if (onUpdate) onUpdate();

    try {
      const blob = await storageService.getBlob(docId);
      if (!blob) throw new Error("Original source file lost from persistent storage.");
      
      const file = new File([blob], doc.filename, { type: blob.type });

      const extraction = await geminiService.extractFromDocument(file);
      
      if (extraction.doc_type === DocType.UNKNOWN) {
        throw new Error("Re-classification failed. Document remains invalid.");
      }

      const validation = db.validateExtraction({ ...updatedDoc, extraction });
      const confidences = extraction.fields.map(f => f.confidence);
      const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
      
      let finalStatus = DocStatus.NEEDS_REVIEW;
      const additionalAudit: AuditEntry[] = [];
      
      if (currentUser.autoApproveEnabled && validation.valid && !validation.isDuplicate && !validation.errors.length) {
        const threshold = (currentUser.autoApproveThreshold ?? 98) / 100;
        if (avgConfidence >= threshold) {
          finalStatus = DocStatus.APPROVED;
          additionalAudit.push({
            timestamp: Date.now(),
            user: 'Automation Intelligence',
            action: 'AUTO_APPROVE',
            details: `Reprocess auto-approved. Confidence metrics met STP criteria.`
          });
        }
      }

      const finalDoc = {
        ...updatedDoc,
        status: finalStatus,
        type: extraction.doc_type,
        extraction,
        validation,
        updatedAt: Date.now(),
        auditTrail: [...updatedDoc.auditTrail, ...additionalAudit]
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
