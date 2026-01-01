
import { DocumentRecord, DocStatus, Destination, ExportJob, ValidationResult, DocType, User, UserRole, MatchingState, APIToken } from "../types";

const DOCS_KEY = 'docflow_documents';
const DEST_KEY = 'docflow_destinations';
const EXPORT_KEY = 'docflow_export_jobs';
const USERS_KEY = 'docflow_users';
const CURRENT_USER_KEY = 'docflow_current_user';
const TOKENS_KEY = 'docflow_api_tokens';

export const db = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  register: (user: User) => {
    const users = db.getUsers();
    if (users.find(u => u.email === user.email)) {
      throw new Error("User already exists");
    }
    const uniqueHash = Math.random().toString(36).substring(2, 6);
    user.inboundAddress = `inbox_${uniqueHash}@inbound.docflow.io`;
    user.role = user.role || UserRole.ADMIN;
    
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User) => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx > -1) {
      users[idx] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const isPersistent = !!localStorage.getItem(CURRENT_USER_KEY);
      const storage = isPersistent ? localStorage : sessionStorage;
      storage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  },

  login: (email: string, password?: string, rememberMe: boolean = false): User | null => {
    const user = db.getUsers().find(u => u.email === email && u.password === password);
    if (user) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const localData = localStorage.getItem(CURRENT_USER_KEY);
    const sessionData = sessionStorage.getItem(CURRENT_USER_KEY);
    const data = localData || sessionData;
    return data ? JSON.parse(data) : null;
  },

  getTokens: (): APIToken[] => {
    const user = db.getCurrentUser();
    if (!user) return [];
    const data = localStorage.getItem(TOKENS_KEY);
    const allTokens: APIToken[] = data ? JSON.parse(data) : [];
    return allTokens.filter(t => t.userId === user.id);
  },

  saveToken: (token: APIToken) => {
    const data = localStorage.getItem(TOKENS_KEY);
    let allTokens: APIToken[] = data ? JSON.parse(data) : [];
    allTokens.push(token);
    localStorage.setItem(TOKENS_KEY, JSON.stringify(allTokens));
  },

  deleteToken: (id: string) => {
    const data = localStorage.getItem(TOKENS_KEY);
    let allTokens: APIToken[] = data ? JSON.parse(data) : [];
    const filtered = allTokens.filter(t => t.id !== id);
    localStorage.setItem(TOKENS_KEY, JSON.stringify(filtered));
  },

  getDocuments: (): DocumentRecord[] => {
    const user = db.getCurrentUser();
    if (!user) return [];
    const data = localStorage.getItem(DOCS_KEY);
    const allDocs: DocumentRecord[] = data ? JSON.parse(data) : [];
    return allDocs.filter(d => d.userId === user.id);
  },

  saveDocument: (doc: DocumentRecord) => {
    const user = db.getCurrentUser();
    if (!user) return;
    const data = localStorage.getItem(DOCS_KEY);
    let allDocs: DocumentRecord[] = data ? JSON.parse(data) : [];
    
    const docToSave = { ...doc, userId: user.id };
    const existingIndex = allDocs.findIndex(d => d.id === doc.id);
    
    if (existingIndex > -1) {
      allDocs[existingIndex] = docToSave;
    } else {
      allDocs.push(docToSave);
    }
    localStorage.setItem(DOCS_KEY, JSON.stringify(allDocs));
  },

  bulkUpdateDocuments: (docs: DocumentRecord[]) => {
    const user = db.getCurrentUser();
    if (!user) return;
    const data = localStorage.getItem(DOCS_KEY);
    let allDocs: DocumentRecord[] = data ? JSON.parse(data) : [];
    
    docs.forEach(doc => {
      const existingIndex = allDocs.findIndex(d => d.id === doc.id);
      if (existingIndex > -1) {
        allDocs[existingIndex] = { ...doc, userId: user.id };
      }
    });
    
    localStorage.setItem(DOCS_KEY, JSON.stringify(allDocs));
  },

  getDocument: (id: string): DocumentRecord | undefined => {
    return db.getDocuments().find(d => d.id === id);
  },

  getAdjacentDocIds: (currentId: string): { prev: string | null, next: string | null } => {
    const docs = db.getDocuments().sort((a, b) => b.createdAt - a.createdAt);
    const idx = docs.findIndex(d => d.id === currentId);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? docs[idx - 1].id : null,
      next: idx < docs.length - 1 ? docs[idx + 1].id : null
    };
  },

  getAnalytics: () => {
    const docs = db.getDocuments();
    const totalProcessed = docs.length;
    const reprocessed = docs.filter(d => d.auditTrail.some(a => a.action === 'REPROCESS')).length;
    const billable = totalProcessed * 0.10;
    
    return {
      totalProcessed,
      reprocessed,
      billable,
      approved: docs.filter(d => d.status === DocStatus.APPROVED || d.status === DocStatus.EXPORTED).length,
      exceptions: docs.filter(d => d.status === DocStatus.NEEDS_REVIEW || d.status === DocStatus.FAILED).length
    };
  },

  simulateThreeWayMatch: (doc: DocumentRecord): MatchingState => {
    const inv = doc.extraction?.specialized.invoice;
    if (!inv || !inv.po_number) {
      return { po_match: 'NOT_FOUND', receipt_match: 'NOT_FOUND', variances: ['No PO reference found on invoice.'] };
    }
    const poNum = inv.po_number.toUpperCase();
    const variances: string[] = [];
    let poMatch: MatchingState['po_match'] = 'MATCHED';
    let recMatch: MatchingState['receipt_match'] = 'MATCHED';

    if (poNum.includes('99')) {
      poMatch = 'VARIANCE';
      variances.push('Price Variance: Invoice unit price ($250.00) differs from PO unit price ($225.00)');
    } else if (poNum.includes('11')) {
      recMatch = 'VARIANCE';
      variances.push('Quantity Variance: Invoiced (50) exceeds Received (45)');
    }

    return { po_match: poMatch, receipt_match: recMatch, variances };
  },

  validateExtraction: (doc: DocumentRecord): ValidationResult => {
    const errors: string[] = [];
    if (!doc.extraction) return { valid: false, errors: ['No extraction results'] };

    const { doc_type, specialized, fields } = doc.extraction;
    let isDuplicate = false;
    let mathBalanced = true;

    if (doc_type === DocType.INVOICE && specialized.invoice) {
      const currentInv = specialized.invoice;
      const userDocs = db.getDocuments();
      const duplicate = userDocs.find(d => 
        d.id !== doc.id && 
        d.type === DocType.INVOICE &&
        d.extraction?.specialized.invoice?.supplier_name === currentInv.supplier_name &&
        d.extraction?.specialized.invoice?.invoice_number === currentInv.invoice_number &&
        d.extraction?.specialized.invoice?.total === currentInv.total
      );
      if (duplicate) {
        isDuplicate = true;
        errors.push(`DUPLICATE DETECTED: Matches document ${duplicate.filename}`);
      }
    }

    if (doc_type === DocType.INVOICE && specialized.invoice) {
      const inv = specialized.invoice;
      if (!inv.supplier_name) errors.push('Missing supplier name');
      if (!inv.invoice_number) errors.push('Missing invoice number');
      if (!inv.invoice_date) errors.push('Missing invoice date');
      
      if (inv.total !== null) {
        const subtotal = inv.subtotal || 0;
        const tax = inv.tax || 0;
        const shipping = inv.shipping || 0;
        if (Math.abs((subtotal + tax + shipping) - inv.total) > 0.01) {
          mathBalanced = false;
          errors.push(`Math error: Components (${subtotal} + ${tax} + ${shipping}) do not equal Total (${inv.total})`);
        }
      } else {
        errors.push('Missing total amount');
      }
    }

    fields.forEach(f => {
      if (f.confidence < 0.7) {
        errors.push(`Low confidence for field: ${f.key} (${Math.round(f.confidence * 100)}%)`);
      }
    });

    return { 
      valid: errors.length === 0, 
      errors, 
      isDuplicate, 
      mathBalanced 
    };
  },

  getDestinations: (): Destination[] => {
    const user = db.getCurrentUser();
    if (!user) return [];
    const data = localStorage.getItem(DEST_KEY);
    const allDests: Destination[] = data ? JSON.parse(data) : [];
    const userDests = allDests.filter(d => d.userId === user.id);
    
    if (userDests.length === 0) {
      return [
        { id: 'dest-1', userId: user.id, name: 'SAP Ariba Webhook', type: 'ariba_cxml', config: { url: 'https://ariba-mock.docflow.io/v1/invoices', headers: { 'X-API-KEY': 'prod_key_123' } } },
        { id: 'dest-2', userId: user.id, name: 'Main Controller S3', type: 'csv', config: {} }
      ];
    }
    return userDests;
  },

  saveDestination: (dest: Destination) => {
    const user = db.getCurrentUser();
    if (!user) return;
    const data = localStorage.getItem(DEST_KEY);
    let allDests: Destination[] = data ? JSON.parse(data) : [];
    allDests.push({ ...dest, userId: user.id });
    localStorage.setItem(DEST_KEY, JSON.stringify(allDests));
  },

  getExportJobs: (documentId?: string): ExportJob[] => {
    const data = localStorage.getItem(EXPORT_KEY);
    const jobs: ExportJob[] = data ? JSON.parse(data) : [];
    return documentId ? jobs.filter(j => j.documentId === documentId) : jobs;
  },

  createExportJob: (job: ExportJob) => {
    const jobs = db.getExportJobs();
    jobs.push(job);
    localStorage.setItem(EXPORT_KEY, JSON.stringify(jobs));
  },

  updateExportJob: (job: ExportJob) => {
    const jobs = db.getExportJobs();
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx > -1) {
      jobs[idx] = job;
      localStorage.setItem(EXPORT_KEY, JSON.stringify(jobs));
    }
  },

  generateCSVFromDocs: (docs: DocumentRecord[]): string => {
    const header = [
      'vendor_name',
      'invoice_number',
      'invoice_date',
      'due_date',
      'po_number',
      'gl_code_suggested',
      'payment_terms',
      'currency',
      'subtotal',
      'tax_amount',
      'shipping_amount',
      'total_amount',
      'audit_status',
      'audit_trace_id',
      'export_timestamp'
    ].join(',');

    const rows = docs.map(doc => {
      const inv = doc.extraction?.specialized.invoice;
      return [
        `"${(inv?.supplier_name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(inv?.invoice_number || '').replace(/"/g, '""')}"`,
        `"${inv?.invoice_date || ''}"`,
        `"${inv?.due_date || ''}"`,
        `"${(inv?.po_number || '').replace(/"/g, '""')}"`,
        `"${(inv?.gl_code_suggestion || '').replace(/"/g, '""')}"`,
        `"${(inv?.payment_terms || '').replace(/"/g, '""')}"`,
        `"${inv?.currency || 'USD'}"`,
        inv?.subtotal || 0,
        inv?.tax || 0,
        inv?.shipping || 0,
        inv?.total || 0,
        `"${doc.status}"`,
        `"${doc.id}"`,
        `"${new Date().toISOString()}"`
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
};
