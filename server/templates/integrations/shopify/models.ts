// Nango SDK types
export interface NangoSync {
  paginate: (config: any) => AsyncGenerator<any>;
  batchSave: (records: any[], model: string) => Promise<void>;
  log: (message: string) => Promise<void>;
  getLastSyncDate: () => Promise<Date | null>;
}

export interface NangoAction {
  get: (config: any) => Promise<any>;
  post: (config: any) => Promise<any>;
  put: (config: any) => Promise<any>;
  delete: (config: any) => Promise<any>;
  log: (message: string) => Promise<void>;
  ActionError: new (error: { type: string; message: string }) => Error;
}

// Shopify Data Models
export interface Product {
  id: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  handle: string;
  status: string;
  variants: any[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: number;
  email?: string;
  total_price: string;
  financial_status: string;
  fulfillment_status?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  orders_count?: number;
  total_spent?: string;
  created_at: string;
  updated_at: string;
}

// Input Models for Actions
export interface CreateProductInput {
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  status?: string;
  variants?: any[];
}

export interface GetProductInput {
  id: number;
}

export interface UpdateInventoryInput {
  inventory_item_id: number;
  location_id: number;
  available: number;
}

export interface GetOrdersInput {
  status?: string;
  financial_status?: string;
  fulfillment_status?: string;
  created_at_min?: string;
  created_at_max?: string;
  limit?: number;
}

// Output Models
export interface OrderList {
  orders: Order[];
}

export interface InventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}