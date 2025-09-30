/**
 * Twilio Integration Models
 * TypeScript definitions for Twilio data structures
 */

export interface TwilioMessage {
  sid: string;
  account_sid: string;
  from: string;
  to: string;
  body: string;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'delivered' | 'undelivered' | 'receiving' | 'received' | 'accepted' | 'scheduled' | 'read' | 'partially_delivered' | 'canceled';
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  date_created: string;
  date_sent?: string;
  date_updated: string;
  error_code?: number;
  error_message?: string;
  messaging_service_sid?: string;
  num_media: string;
  num_segments: string;
  price?: string;
  price_unit?: string;
  uri: string;
  subresource_uris: Record<string, string>;
  searchableContent: string;  // For vector search
  syncedAt: string;
}

export interface TwilioCall {
  sid: string;
  account_sid: string;
  from: string;
  to: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  date_created: string;
  date_updated: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  price?: string;
  price_unit?: string;
  uri: string;
  subresource_uris: Record<string, string>;
}

export interface TwilioSendMessageRequest {
  to: string;
  from: string;
  body?: string;
  media_url?: string[];
  messaging_service_sid?: string;
  status_callback?: string;
  application_sid?: string;
  max_price?: string;
  provide_feedback?: boolean;
  attempt?: number;
  validity_period?: number;
  force_delivery?: boolean;
  content_retention?: 'retain' | 'discard';
  address_retention?: 'retain' | 'discard';
}

export interface TwilioMakeCallRequest {
  to: string;
  from: string;
  url?: string;
  application_sid?: string;
  method?: 'GET' | 'POST';
  fallback_url?: string;
  fallback_method?: 'GET' | 'POST';
  status_callback?: string;
  status_callback_event?: string[];
  status_callback_method?: 'GET' | 'POST';
  send_digits?: string;
  timeout?: number;
  record?: boolean;
  recording_channels?: 'mono' | 'dual';
  recording_status_callback?: string;
  recording_status_callback_method?: 'GET' | 'POST';
  sip_auth_username?: string;
  sip_auth_password?: string;
  machine_detection?: 'Enable' | 'DetectMessageEnd';
  machine_detection_timeout?: number;
  recording_status_callback_event?: string[];
  trim?: 'trim-silence' | 'do-not-trim';
  caller_id?: string;
  machine_detection_speech_threshold?: number;
  machine_detection_speech_end_threshold?: number;
  machine_detection_silence_timeout?: number;
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