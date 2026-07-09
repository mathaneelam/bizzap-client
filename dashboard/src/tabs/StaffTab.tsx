import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { StaffAccess, LogActivity } from '../types'

interface Props {
  currentUser: StaffAccess
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

function Avatar({ staff }: { staff: StaffAccess }) {
  if (staff.avatar_url) {
    return <img className="staff-avatar" src={staff.avatar_url} alt={staff.name || staff.email} referrerPolicy="no-referrer" />
  }
  const initial = (staff.name || staff.email).charAt(0).toUpperCase()
  return <div className="staff-avatar staff-avatar-fallback">{initial}</div>
}

export default function StaffTab({ currentUser, onToast, logActivity }: Props) {
  const [staff, setStaff] = useState<StaffAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  async function fetchStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff_access')
      .select('*')
      .order('requested_at', { ascending: false })
    if (error) onToast('❌ Failed to load staff: ' + error.message)
    else setStaff(data as StaffAccess[])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  async function setStatus(member: StaffAccess, status: 'approved' | 'rejected') {
    setBusy(member.id)
    const patch: Record<string, unknown> = { status }
    if (status === 'approved') patch.approved_at = new Date().toISOString()
    const { error } = await supabase.from('staff_access').update(patch).eq('id', member.id)
    setBusy(null)
    if (error) { onToast('❌ ' + error.message); return }
    onToast(status === 'approved' ? `✅ Approved ${member.email}` : `🚫 Rejected ${member.email}`)
    logActivity?.({
      action: status === 'approved' ? 'staff_approved' : 'staff_rejected',
      entityType: 'staff',
      entityId: member.id,
      entityLabel: member.name || member.email,
    })
    fetchStaff()
  }

  async function removeStaff(member: StaffAccess) {
    setBusy(member.id)
    const { error } = await supabase.from('staff_access').delete().eq('id', member.id)
    setBusy(null)
    if (error) { onToast('❌ ' + error.message); return }
    onToast(`🗑️ Removed ${member.email}`)
    logActivity?.({
      action: 'staff_removed',
      entityType: 'staff',
      entityId: member.id,
      entityLabel: member.name || member.email,
    })
    fetchStaff()
  }

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading staff…</span></div>
  )

  const pending = staff.filter(s => s.status === 'pending')
  const active = staff.filter(s => s.status === 'approved')
  const rejected = staff.filter(s => s.status === 'rejected')

  function Row({ member, actions }: { member: StaffAccess; actions: React.ReactNode }) {
    return (
      <div className="staff-row">
        <Avatar staff={member} />
        <div className="staff-row-info">
          <div className="staff-row-name">
            {member.name || '—'}
            {member.role === 'admin' && <span className="staff-role-badge">Admin</span>}
            {member.email === currentUser.email && <span className="staff-you-badge">You</span>}
          </div>
          <div className="staff-row-email">{member.email}</div>
        </div>
        <div className="staff-row-actions">{actions}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{pending.length}</div>
          <div className="stat-lbl">Pending Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--green)' }}>{active.length}</div>
          <div className="stat-lbl">Active Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--red)' }}>{rejected.length}</div>
          <div className="stat-lbl">Rejected</div>
        </div>
      </div>

      <p className="section-label">🔴 Pending Requests — {pending.length}</p>
      {pending.length === 0 ? (
        <p className="staff-empty">No pending sign-in requests.</p>
      ) : (
        <div className="staff-list">
          {pending.map(m => (
            <Row key={m.id} member={m} actions={
              <>
                <button className="btn btn-sm" disabled={busy === m.id}
                  style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
                  onClick={() => setStatus(m, 'approved')}>✓ Approve</button>
                <button className="btn btn-ghost btn-sm" disabled={busy === m.id}
                  onClick={() => setStatus(m, 'rejected')}>✕ Reject</button>
              </>
            } />
          ))}
        </div>
      )}

      <p className="section-label" style={{ marginTop: 32 }}>✅ Active Staff — {active.length}</p>
      <div className="staff-list">
        {active.map(m => (
          <Row key={m.id} member={m} actions={
            m.role === 'admin' || m.email === currentUser.email ? (
              <span className="staff-locked">Protected</span>
            ) : (
              <button className="btn btn-ghost btn-sm" disabled={busy === m.id}
                style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => removeStaff(m)}>🗑 Remove</button>
            )
          } />
        ))}
      </div>

      {rejected.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 32 }}>❌ Rejected — {rejected.length}</p>
          <div className="staff-list">
            {rejected.map(m => (
              <Row key={m.id} member={m} actions={
                <button className="btn btn-ghost btn-sm" disabled={busy === m.id}
                  onClick={() => setStatus(m, 'approved')}>↩ Re-instate</button>
              } />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
