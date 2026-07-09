import { supabase } from '../supabase'
import type { LogActivityOptions } from '../types'

export function useActivityLogger(userEmail: string, userName: string | null) {
  async function logActivity(opts: LogActivityOptions) {
    if (!userEmail) return
    try {
      await supabase.from('activity_log').insert({
        user_email: userEmail,
        user_name: userName,
        action: opts.action,
        entity_type: opts.entityType ?? null,
        entity_id: opts.entityId != null ? String(opts.entityId) : null,
        entity_label: opts.entityLabel ?? null,
        metadata: opts.metadata ?? null,
      })
    } catch {
      // Non-blocking — never crash the UI for a logging failure
    }
  }

  return { logActivity }
}
