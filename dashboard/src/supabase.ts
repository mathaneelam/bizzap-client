import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Bizzap Dashboard] Missing Supabase credentials. ' +
    'Please copy dashboard/.env.example to dashboard/.env and fill in your project credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

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
}

export interface Lead {
  id: number
  business_id: number
  score: number
  has_website: boolean
  reason: string | null
  status: string
  copy_draft: string | null
  created_at: string
  businesses?: Business
}

export interface Demo {
  id: number
  lead_id: number
  slug: string
  demo_url: string | null
  screenshot: string | null
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
