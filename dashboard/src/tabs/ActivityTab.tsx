import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import type { ActivityLog, StaffAccess } from '../types'

interface Props {
  currentUser: StaffAccess
  onToast: (msg: string) => void
}

// Human-readable phrasing for each action key (see Action Glossary).
const ACTION_TEXT: Record<string, string> = {
  login: 'signed in',
  lead_viewed: 'viewed lead',
  lead_status_changed: 'changed lead status',
  demo_generated: 'generated a demo for',
  demo_approved: 'approved demo',
  deal_created: 'created a deal for',
  deal_paid: 'marked deal paid',
  outreach_sent: 'sent outreach to',
  staff_approved: 'approved staff',
  staff_rejected: 'rejected staff',
  staff_removed: 'removed staff',
}

const ACTION_ICON: Record<string, string> = {
  login: '🔑',
  lead_viewed: '👀',
  lead_status_changed: '🔄',
  demo_generated: '🖥️',
  demo_approved: '✅',
  deal_created: '🧾',
  deal_paid: '💰',
  outreach_sent: '💬',
  staff_approved: '👤',
  staff_rejected: '🚫',
  staff_removed: '🗑️',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN')
}

export default function ActivityTab({ currentUser, onToast }: Props) {
  const isAdmin = currentUser.role === 'admin'
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [staff, setStaff] = useState<StaffAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [userFilter, setUserFilter] = useState<string>('all')

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    // Staff members only ever see their own activity.
    if (!isAdmin) query = query.eq('user_email', currentUser.email)

    const [{ data: logData, error }, { data: staffData }] = await Promise.all([
      query,
      supabase.from('staff_access').select('*'),
    ])

    if (error) onToast('❌ Failed to load activity: ' + error.message)
    else setLogs(logData as ActivityLog[])
    if (staffData) setStaff(staffData as StaffAccess[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const avatarByEmail = useMemo(() => {
    const m = new Map<string, string | null>()
    staff.forEach(s => m.set(s.email, s.avatar_url))
    return m
  }, [staff])

  const filtered = userFilter === 'all' ? logs : logs.filter(l => l.user_email === userFilter)

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading activity…</span></div>
  )

  return (
    <div>
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="section-label" style={{ margin: 0 }}>Filter by staff:</span>
          <button className={`btn btn-sm ${userFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setUserFilter('all')}>Everyone</button>
          {staff.filter(s => s.status === 'approved').map(s => (
            <button key={s.email}
              className={`btn btn-sm ${userFilter === s.email ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setUserFilter(s.email)}>{s.name || s.email}</button>
          ))}
        </div>
      )}

      <p className="section-label">📋 Activity Feed — {filtered.length} events</p>

      {filtered.length === 0 ? (
        <div className="state-box">
          <span style={{ fontSize: 40 }}>🕓</span>
          <strong>No activity yet</strong>
          <span>Actions across the dashboard will appear here.</span>
        </div>
      ) : (
        <div className="activity-feed">
          {filtered.map(log => {
            const avatar = avatarByEmail.get(log.user_email)
            const name = log.user_name || log.user_email
            return (
              <div className="activity-row" key={log.id}>
                {avatar
                  ? <img className="staff-avatar" src={avatar} alt={name} referrerPolicy="no-referrer" />
                  : <div className="staff-avatar staff-avatar-fallback">{name.charAt(0).toUpperCase()}</div>}
                <div className="activity-body">
                  <div className="activity-line">
                    <span className="activity-icon">{ACTION_ICON[log.action] || '•'}</span>
                    <strong>{name}</strong>&nbsp;
                    {ACTION_TEXT[log.action] || log.action.replace(/_/g, ' ')}
                    {log.entity_label && <>&nbsp;<span className="activity-entity">{log.entity_label}</span></>}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="activity-meta">
                      {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="activity-time">{timeAgo(log.created_at)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
