// Type definitions matching our schema.sql tables
export interface Business {
  id: number
  place_ref: string
  name: string
  category: string
  segment: string
  phone: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  address: string | null
  lat: number | null
  lng: number | null
  raw: string | null
}

export interface Lead {
  id: number
  business_id: number
  score: number
  has_website: boolean
  reason: string | null
  copy_draft: string | null
  gen_count: number
  status: string
  created_at: string
  businesses?: Business
}

export interface Demo {
  id: number
  lead_id: number
  slug: string
  demo_url: string | null
  screenshot: string | null
  site_json_path: string | null
  approved: boolean
  built_at: string
  leads?: Lead & { businesses?: Business }
}

export interface Deal {
  id: number
  client_id: number
  amount: number
  type: string
  status: string
  razorpay_id: string | null
  due_date: string | null
  paid_at: string | null
  clients?: {
    id: number
    package: string
    domain: string | null
    leads?: Lead & { businesses?: Business }
  }
}

export interface StaffAccess {
  id: number
  email: string
  name: string | null
  avatar_url: string | null
  role: 'admin' | 'staff'
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  approved_at: string | null
}

export interface ActivityLog {
  id: number
  user_email: string
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Shared shape for the activity logger, passed down to tabs so any
// meaningful action can be recorded against the current user.
export interface LogActivityOptions {
  action: string
  entityType?: string
  entityId?: string | number
  entityLabel?: string
  metadata?: Record<string, unknown>
}

export type LogActivity = (opts: LogActivityOptions) => void

