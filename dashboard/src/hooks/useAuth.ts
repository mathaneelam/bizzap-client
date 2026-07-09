import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { StaffAccess } from '../types'

// Manages the Supabase auth session and mirrors the signed-in user into the
// `staff_access` table. First-time sign-ins are auto-created as `pending`.
export function useAuth() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [staff, setStaff] = useState<StaffAccess | null>(null)
  const loggedInRef = useRef(false)

  async function resolveStaff(sess: Session): Promise<StaffAccess | null> {
    const email = sess.user.email
    if (!email) return null

    const meta = (sess.user.user_metadata ?? {}) as Record<string, string>
    const name = meta.full_name || meta.name || null
    const avatar = meta.avatar_url || meta.picture || null

    const { data: existing } = await supabase
      .from('staff_access')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      // Backfill name/avatar from Google if they were missing (e.g. pre-seeded admin row)
      if ((!existing.name && name) || (!existing.avatar_url && avatar)) {
        const { data: updated } = await supabase
          .from('staff_access')
          .update({
            name: existing.name || name,
            avatar_url: existing.avatar_url || avatar,
          })
          .eq('email', email)
          .select()
          .maybeSingle()
        return (updated as StaffAccess) ?? (existing as StaffAccess)
      }
      return existing as StaffAccess
    }

    const { data: created } = await supabase
      .from('staff_access')
      .insert({ email, name, avatar_url: avatar, role: 'staff', status: 'pending' })
      .select()
      .maybeSingle()
    return (created as StaffAccess) ?? null
  }

  async function loadFor(sess: Session | null) {
    if (!sess) {
      setSession(null)
      setStaff(null)
      setLoading(false)
      return
    }
    setSession(sess)
    const s = await resolveStaff(sess)
    setStaff(s)
    setLoading(false)

    // Record the login exactly once per browser session, only for approved users.
    if (s && s.status === 'approved' && !loggedInRef.current) {
      loggedInRef.current = true
      void supabase.from('activity_log').insert({
        user_email: s.email,
        user_name: s.name,
        action: 'login',
        entity_type: 'staff',
        entity_id: String(s.id),
        entity_label: s.name || s.email,
      })
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadFor(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      loadFor(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function refreshStaff() {
    if (session) setStaff(await resolveStaff(session))
  }

  async function signOut() {
    await supabase.auth.signOut()
    loggedInRef.current = false
    setSession(null)
    setStaff(null)
  }

  return { loading, session, staff, signOut, refreshStaff }
}
