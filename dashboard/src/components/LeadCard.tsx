import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, Business, LogActivity } from '../types'
import { CALL_STATUS_OPTIONS, formatStatusLabel } from '../types'
import CopyDraftModal from './CopyDraftModal'
import ScheduleAppointmentModal from './ScheduleAppointmentModal'

function getGmbUrl(business: Business): string {
  if (business.raw) {
    try {
      const rawObj = JSON.parse(business.raw)
      if (rawObj.scraped_url) {
        return rawObj.scraped_url
      }
    } catch {
      // fallback
    }
  }
  if (business.place_ref && !business.place_ref.startsWith('google-maps-')) {
    return `https://www.google.com/maps/place/${business.place_ref}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ' ' + (business.address || 'Tiruppur'))}`
}

function slugify(name: string): string {
  let slug = name
    .replace(/ /g, '-')
    .split('')
    .map(c => (/[a-z0-9-]/i.test(c) ? c.toLowerCase() : '-'))
    .join('')
  while (slug.includes('--')) slug = slug.replace(/--/g, '-')
  return slug.replace(/^-+|-+$/g, '')
}

interface Props {
  lead: Lead
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
  isAdmin?: boolean
}

function scoreClass(score: number) {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-mid'
  return 'score-low'
}

function statusPillClass(status: string) {
  return `pill pill-${status}`
}

export default function LeadCard({ lead, onUpdated, onToast, logActivity, isAdmin }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showApptModal, setShowApptModal] = useState(false)
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const b = lead.businesses!
  const siteUrl = `https://bizzap-demos.pages.dev/${slugify(b.name)}/`

  async function handleStatusChange(newStatus: string) {
    if (!newStatus || newStatus === lead.status) return
    setUpdatingStatus(true)

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', lead.id)

    setUpdatingStatus(false)

    if (error) {
      onToast('❌ Failed to update status: ' + error.message)
    } else {
      const label = formatStatusLabel(newStatus)
      onToast(`📞 Call status updated to "${label}"`)
      logActivity?.({
        action: 'lead_status_changed',
        entityType: 'lead',
        entityId: lead.id,
        entityLabel: b.name,
        metadata: { status: newStatus, label },
      })
      onUpdated()
    }
  }


  async function handleDeleteBusiness() {
    if (!window.confirm(`Are you sure you want to delete ${b.name}? This will remove the business, lead, and any generated demos from the database.`)) return
    
    setDeleting(true)
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', b.id)
      
    setDeleting(false)
    if (error) {
      onToast('❌ Failed to delete business: ' + error.message)
    } else {
      onToast('🗑️ Business profile deleted.')
      logActivity?.({
        action: 'business_deleted',
        entityType: 'lead',
        entityLabel: b.name,
      })
      onUpdated()
    }
  }

  async function handleMoveToDemos() {
    setMoving(true)
    const slug = slugify(b.name)
    const { error: demoErr } = await supabase
      .from('demos')
      .insert({ lead_id: lead.id, slug, approved: false })
    if (demoErr) {
      setMoving(false)
      const dup = demoErr.code === '23505' || /duplicate|unique/i.test(demoErr.message)
      onToast(dup
        ? `⚠️ A demo with slug "${slug}" already exists.`
        : '❌ Failed to create demo: ' + demoErr.message)
      return
    }

    const { error: leadErr } = await supabase
      .from('leads')
      .update({ status: 'demo_built' })
      .eq('id', lead.id)
    setMoving(false)
    if (leadErr) {
      onToast('❌ Demo created, but status update failed: ' + leadErr.message)
    } else {
      onToast('🖥️ Moved to Demos — pending review!')
    }
    logActivity?.({
      action: 'demo_created',
      entityType: 'demo',
      entityLabel: b.name,
    })
    onUpdated()
  }

  const needsFix = lead.status === 'needs_fix'

  return (
    <>
      <div className={`card ${needsFix ? 'card-priority' : ''}`}>
        {needsFix && (
          <div className="priority-banner">
            ⚠️ Sent back from Demos — fix the copy/site, then Move to Demos again.
          </div>
        )}
        <div className="card-header">
          <div>
            <div className="card-name">{b.name}</div>
            <div className="card-category">{b.category}</div>
          </div>
          <div className={`score-badge ${scoreClass(lead.score)}`}>
            <span className="score-num">{lead.score}</span>
            <span className="score-label">score</span>
          </div>
        </div>

        <div className="meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
          {b.address || '—'}
        </div>

        {/* Clickable Phone Number Link */}
        <div className="meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          {b.phone ? (
            <a
              href={`tel:${b.phone}`}
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              title="Click to call business directly"
            >
              {b.phone} 📞
            </a>
          ) : (
            '—'
          )}
        </div>

        <div className="meta-row">
          ⭐ {b.rating?.toFixed(1) || '—'} &nbsp;·&nbsp; {b.review_count || 0} reviews
          &nbsp;·&nbsp; <span className={statusPillClass(lead.status)}>{formatStatusLabel(lead.status)}</span>
          {lead.gen_count > 0 && (
            <>
              &nbsp;·&nbsp; <span className="pill pill-new">generated ×{lead.gen_count}</span>
            </>
          )}
        </div>

        {/* Call Status Dropdown Selector */}
        <div style={{ marginTop: 14, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--accent)', fontWeight: 600 }}>
              📞 Call Outcome Status
            </span>
            {updatingStatus && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Updating…</span>}
          </div>
          <select
            className="call-status-select"
            value={CALL_STATUS_OPTIONS.some(o => o.value === lead.status) ? lead.status : ''}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
          >
            <option value="" disabled>-- Update Call Outcome --</option>
            {CALL_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment & Note Summary Banner */}
        {lead.reason && (
          <div style={{ marginTop: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--text)' }}>
            <span style={{ fontWeight: 600, color: '#60a5fa', display: 'block', marginBottom: 2 }}>
              📌 Appointment & Notes:
            </span>
            <em>{lead.reason}</em>
          </div>
        )}



        <div className="card-actions">
          {/* Book Appointment Button */}
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
            onClick={() => setShowApptModal(true)}
            title="Schedule an in-person meeting or call back appointment"
          >
            📅 Book Appointment
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            {lead.copy_draft ? '🔄 Re-Generate' : '✨ Generate'}
          </button>
          <a
            className="btn btn-ghost btn-sm"
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            title="View generated website"
          >
            🌐
          </a>
          <button className="btn btn-ghost btn-sm" onClick={handleMoveToDemos} disabled={moving}>
            {moving ? 'Moving…' : '🖥️ Move to Demos'}
          </button>
          {b.website && (
            <a className="btn btn-ghost btn-sm" href={b.website} target="_blank" rel="noreferrer">
              🌐 Their Site
            </a>
          )}
          <a
            className="btn btn-ghost btn-sm"
            href={getGmbUrl(b)}
            target="_blank"
            rel="noreferrer"
            title="Verify Google Business Profile"
          >
            📍 GMB Profile
          </a>
          {isAdmin && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleDeleteBusiness} 
              disabled={deleting}
              style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
              title="Delete business profile"
            >
              {deleting ? 'Deleting…' : '🗑 Delete'}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <CopyDraftModal
          lead={lead}
          onClose={() => setShowModal(false)}
          onUpdated={onUpdated}
          onToast={onToast}
        />
      )}

      {showApptModal && (
        <ScheduleAppointmentModal
          lead={lead}
          onClose={() => setShowApptModal(false)}
          onUpdated={onUpdated}
          onToast={onToast}
          logActivity={logActivity}
        />
      )}
    </>
  )
}

