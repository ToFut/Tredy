/**
 * Gmail Integration Models
 * TypeScript definitions for Gmail data structures
 */

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  labelIds: string[];
  sizeEstimate: number;
  internalDate: string;
  searchableContent: string;  // For vector search
  syncedAt: string;
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
}

export interface GmailSendRequest {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  threadId?: string;  // For replies
  replyTo?: string;
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string;  // Base64 encoded
}

// Nango SDK types
export interface NangoSync {
  get: (config: { endpoint: string; params?: any }) => Promise<any>;
  post: (config: { endpoint: string; data?: any }) => Promise<any>;
  batchSave: (data: any[], model: string) => Promise<void>;
  log: (message: string, meta?: any) => Promise<void>;
}

export interface NangoAction {
  input: any;
  get: (config: { endpoint: string; params?: any }) => Promise<any>;
  post: (config: { endpoint: string; data?: any }) => Promise<any>;
  put: (config: { endpoint: string; data?: any }) => Promise<any>;
  delete: (config: { endpoint: string }) => Promise<any>;
}