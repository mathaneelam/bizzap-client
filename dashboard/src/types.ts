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
export interface Appointment {
  id: number
  lead_id: number
  business_id?: number
  scheduled_at: string
  type: 'in_person' | 'phone_call' | 'whatsapp'
  notes: string | null
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled'
  created_by?: string | null
  created_at: string
  leads?: Lead & { businesses?: Business }
  businesses?: Business
}

export interface LogActivityOptions {
  action: string
  entityType?: string
  entityId?: string | number
  entityLabel?: string
  metadata?: Record<string, unknown>
}

export type LogActivity = (opts: LogActivityOptions) => void

export const CALL_STATUS_OPTIONS = [
  { value: 'ring_no_response', label: 'Ring No Response' },
  { value: 'switched_off', label: 'Switched Off' },
  { value: 'unable_to_call', label: 'Unable To Call' },
  { value: 'call_back_later', label: 'Call Back Later' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'already_have_site', label: 'Already Have Site' },
  { value: 'others', label: 'Others' },
] as const

export function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    ring_no_response: 'Ring No Response',
    switched_off: 'Switched Off',
    unable_to_call: 'Unable To Call',
    call_back_later: 'Call Back Later',
    not_interested: 'Not Interested',
    already_have_site: 'Already Have Site',
    others: 'Others',
    needs_fix: 'Needs Fix',
    demo_built: 'Demo Built',
    appointment_scheduled: 'Appointment Scheduled',
    new: 'New Lead',
    contacted: 'Contacted',
    won: 'Won',
    lost: 'Lost',
    dnc: 'Do Not Contact',
  }
  if (statusMap[status]) return statusMap[status]
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}


