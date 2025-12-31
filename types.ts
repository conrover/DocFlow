
export enum DocStatus {
  UPLOADED = 'UPLOADED',
  EXTRACTING = 'EXTRACTING',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPORTING = 'EXPORTING',
  EXPORTED = 'EXPORTED',
  FAILED = 'FAILED'
}

export enum DocType {
  INVOICE = 'invoice',
  PURCHASE_ORDER = 'purchase_order',
  RECEIPT = 'receipt',
  PACKING_LIST = 'packing_list',
  BILL_OF_LADING = 'bill_of_lading',
  CONTRACT = 'contract',
  STATEMENT = 'statement',
  UNKNOWN = 'unknown'
}

export type IngestionSource = 'MANUAL' | 'EMAIL' | 'API';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  inboundAddress?: string;
  orgHandle?: string; // e.g. "acme.ap"
}

export interface Evidence {
  page: number | null;
  quote: string;
}

export interface Field {
  key: string;
  value: string | number | boolean | null;
  confidence: number;
  evidence: Evidence;
}

export interface Table {
  name: string;
  confidence: number;
  columns: string[];
  rows: string[][];
  evidence: Evidence;
}

export interface ExtractionResult {
  doc_type: DocType;
  summary: string;
  language: string | null;
  fields: Field[];
  tables: Table[];
  specialized: {
    invoice: {
      supplier_name: string | null;
      invoice_number: string | null;
      invoice_date: string | null;
      due_date: string | null;
      currency: string | null;
      subtotal: number | null;
      tax: number | null;
      shipping: number | null;
      total: number | null;
      po_number: string | null;
    } | null;
    purchase_order: {
      buyer_name: string | null;
      supplier_name: string | null;
      po_number: string | null;
      po_date: string | null;
      currency: string | null;
      total: number | null;
    } | null;
  };
  warnings: string[];
}

export interface AuditEntry {
  timestamp: number;
  user: string;
  action: string;
  details: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  mathBalanced?: boolean;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  filename: string;
  source: IngestionSource;
  status: DocStatus;
  type: DocType;
  createdAt: number;
  updatedAt: number;
  fileUrl: string;
  extraction?: ExtractionResult;
  validation?: ValidationResult;
  auditTrail: AuditEntry[];
  rejectionReason?: string;
  lastError?: {
    code: string;
    message: string;
  };
}

export type DestinationType = 'webhook' | 'csv' | 'ariba_cxml' | 'netsuite' | 'dynamics' | 'coupa';

export interface Destination {
  id: string;
  userId: string;
  name: string;
  type: DestinationType;
  config: any;
}

export interface ExportJob {
  id: string;
  documentId: string;
  destinationId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  artifactUri?: string;
  attempts: number;
  error?: string;
  createdAt: number;
}
