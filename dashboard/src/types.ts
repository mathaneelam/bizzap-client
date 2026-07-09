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
