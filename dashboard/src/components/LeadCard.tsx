import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, Business, LogActivity } from '../types'
import CopyDraftModal from './CopyDraftModal'

function getGmbUrl(business: Business): string {
  let url = `https://www.google.com/maps/place/${business.place_ref}/`
  if (business.raw) {
    try {
      const rawObj = JSON.parse(business.raw)
      if (rawObj.scraped_url) {
        url = rawObj.scraped_url
      }
    } catch {
      // fallback
    }
  }
  return url
}

// Mirrors the Python slugify() in pipeline/generate_demo.py & pipeline/outreach.py so a
// UI-created demo row uses the exact slug the pipeline will later build against.
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
}

function scoreClass(score: number) {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-mid'
  return 'score-low'
}

function statusPillClass(status: string) {
  return `pill pill-${status}`
}

export default function LeadCard({ lead, onUpdated, onToast, logActivity }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [moving, setMoving] = useState(false)

  const b = lead.businesses!
  // Predictable generated-site URL (built by the pipeline from the saved copy draft).
  const siteUrl = `https://bizzap-demos.pages.dev/${slugify(b.name)}/`

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

        <div className="meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          {b.phone || '—'}
        </div>

        <div className="meta-row">
          ⭐ {b.rating?.toFixed(1) || '—'} &nbsp;·&nbsp; {b.review_count || 0} reviews
          &nbsp;·&nbsp; <span className={statusPillClass(lead.status)}>{lead.status.replace('_', ' ')}</span>
        </div>

        <div className="meta-row" style={{ marginTop: 10 }}>
          🌐 <a href={siteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
            {siteUrl.replace('https://', '')}
          </a>
          {lead.gen_count > 0 && (
            <span className="pill pill-new" style={{ marginLeft: 8 }}>
              generated ×{lead.gen_count}
            </span>
          )}
        </div>

        <div className="card-actions">
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
          {b.place_ref && !b.place_ref.startsWith('google-maps-') && (
            <a
              className="btn btn-ghost btn-sm"
              href={getGmbUrl(b)}
              target="_blank"
              rel="noreferrer"
            >
              📍 GMB Link
            </a>
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
    </>
  )
}
