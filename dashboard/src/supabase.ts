import { createClient } from '@supabase/supabase-js'

export type { Business, Lead, Demo, Deal } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Initialise with empty strings when credentials are missing
// (UI shows a warning banner — no crash on module load)
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
)

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)
