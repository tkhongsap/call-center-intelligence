/**
 * Common type definitions used across the application
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  created_at: string;
  updated_at: string;
  affected_cases?: number;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Case {
  id: string;
  case_number: string;
  title?: string;
  description?: string;
  status: Status;
  priority?: Priority;
  severity?: Severity;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  customer_name?: string;
  customer_id?: string;
  assigned_to?: string;
  agent_id?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // Additional fields from backend
  channel?: string;
  sentiment?: string;
  risk_flag?: boolean;
  needs_review_flag?: boolean;
  business_unit?: string;
  summary?: string;
  upload_id?: string;
  // Complete incident data
  incident_data?: {
    incident_number?: string;
    reference_number?: string;
    received_date?: string;
    closed_date?: string;
    contact_channel?: string;
    customer_name?: string;
    phone?: string;
    issue_type?: string;
    issue_subtype_1?: string;
    issue_subtype_2?: string;
    product?: string;
    product_group?: string;
    factory?: string;
    production_code?: string;
    details?: string;
    solution?: string;
    solution_from_thaibev?: string;
    subject?: string;
    district?: string;
    province?: string;
    order_channel?: string;
    status?: string;
    receiver?: string;
    closer?: string;
    sla?: string;
    upload_id?: string;
  };
}

export interface Upload {
  id: string;
  filename: string;
  file_size: number;
  upload_date: string;
  status: 'processing' | 'completed' | 'failed';
  records_count?: number;
  error_count?: number;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface FeedItem {
  id: string;
  type: 'alert' | 'trending' | 'highlight' | 'upload';
  title: string;
  content?: string;
  created_at: string;
  metadata?: Record<string, any>;
  engagement?: {
    views?: number;
    shares?: number;
    comments?: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
}
