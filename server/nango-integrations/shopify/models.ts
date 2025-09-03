
// Auto-generated models for shopify


export interface Product {
  id: string;
  id: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  handle: string;
  status: string;
  variants: any[];
  _synced_at?: string;
  _vector_content?: string;
}

export interface Order {
  id: string;
  id: number;
  order_number: number;
  email?: string;
  total_price: string;
  financial_status: string;
  fulfillment_status?: string;
  created_at: string;
  _synced_at?: string;
  _vector_content?: string;
}

export interface Customer {
  id: string;
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  orders_count?: number;
  total_spent?: string;
  _synced_at?: string;
  _vector_content?: string;
}
