
import { Type } from "@google/genai";
import { DocType } from './types';

export const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    doc_type: { 
      type: Type.STRING, 
      enum: ["invoice", "purchase_order", "receipt", "packing_list", "bill_of_lading", "contract", "statement", "unknown"] 
    },
    summary: { type: Type.STRING },
    language: { type: Type.STRING, nullable: true },
    fields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          evidence: {
            type: Type.OBJECT,
            properties: {
              page: { type: Type.NUMBER, nullable: true },
              quote: { type: Type.STRING }
            }
          }
        }
      }
    },
    tables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          columns: { type: Type.ARRAY, items: { type: Type.STRING } },
          rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
          evidence: {
            type: Type.OBJECT,
            properties: {
              page: { type: Type.NUMBER, nullable: true },
              quote: { type: Type.STRING }
            }
          }
        }
      }
    },
    specialized: {
      type: Type.OBJECT,
      properties: {
        invoice: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            supplier_name: { type: Type.STRING, nullable: true },
            invoice_number: { type: Type.STRING, nullable: true },
            invoice_date: { type: Type.STRING, nullable: true },
            due_date: { type: Type.STRING, nullable: true },
            currency: { type: Type.STRING, nullable: true },
            subtotal: { type: Type.NUMBER, nullable: true },
            tax: { type: Type.NUMBER, nullable: true },
            shipping: { type: Type.NUMBER, nullable: true },
            total: { type: Type.NUMBER, nullable: true },
            po_number: { type: Type.STRING, nullable: true }
          }
        },
        purchase_order: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            buyer_name: { type: Type.STRING, nullable: true },
            supplier_name: { type: Type.STRING, nullable: true },
            po_number: { type: Type.STRING, nullable: true },
            po_date: { type: Type.STRING, nullable: true },
            currency: { type: Type.STRING, nullable: true },
            total: { type: Type.NUMBER, nullable: true }
          }
        }
      }
    },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};
