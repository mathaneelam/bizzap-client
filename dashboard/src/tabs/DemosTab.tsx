import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Demo, Business, Lead, LogActivity } from '../types'
import OutreachModal from '../components/OutreachModal'

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

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

function DemoCard({

  demo,
  onToggleApprove,
  onMoveBack,
  onOutreach,
  onToast,
  logActivity
}: {
  demo: Demo
  onToggleApprove: (demo: Demo) => void
  onMoveBack: (demo: Demo) => void
  onOutreach: (lead: Lead) => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
}) {
  const biz = demo.leads?.businesses
  const initialComment = demo.leads?.reason || ''
  const [commentText, setCommentText] = useState(initialComment)
  const [savingComment, setSavingComment] = useState(false)

  async function handleSaveComment() {
    if (!demo.lead_id) return
    setSavingComment(true)
    const { error } = await supabase
      .from('leads')
      .update({ reason: commentText.trim() || null })
      .eq('id', demo.lead_id)

    setSavingComment(false)

    if (error) {
      onToast('❌ Failed to save demo note: ' + error.message)
    } else {
      onToast('📝 Demo comment / note saved!')
      logActivity?.({
        action: 'demo_comment_updated',
        entityType: 'demo',
        entityId: demo.id,
        entityLabel: biz?.name || demo.slug,
        metadata: { reason: commentText }
      })
    }
  }

  return (
    <div className="card">
      {/* Screenshot */}
      {demo.screenshot ? (
        <div style={{ overflow: 'hidden', borderRadius: 10, marginBottom: 16 }}>
          <img
            className="demo-screenshot"
            src={`file:///${demo.screenshot?.replace(/\\/g, '/')}`}
            alt={`${biz?.name} screenshot`}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      ) : (
        <div className="demo-screenshot-placeholder">📷 No screenshot yet</div>
      )}

      <div className="card-header">
        <div>
          <div className="card-name">{biz?.name || demo.slug}</div>
          <div className="card-category">{biz?.category}</div>
        </div>
        <span className={`pill ${demo.approved ? 'pill-won' : 'pill-contacted'}`}>
          {demo.approved ? '✓ Approved' : 'Pending'}
        </span>
      </div>

      <div className="meta-row">
        🗓️ Built {new Date(demo.built_at).toLocaleDateString('en-IN')}
      </div>

      {/* Demo Notes & Comment Input Box */}
      <div style={{ marginTop: 14, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          📝 Demo Notes & Client Feedback
        </span>
        <textarea
          className="textarea"
          style={{ minHeight: 48, maxHeight: 90, padding: '8px 10px', fontSize: 12, borderRadius: 8, marginBottom: 6 }}
          placeholder="Capture recent client feedback, demo edits, or review notes..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
        />
        {commentText !== initialComment && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSaveComment}
              disabled={savingComment}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              {savingComment ? 'Saving…' : '💾 Save Demo Note'}
            </button>
          </div>
        )}
      </div>

      <div className="card-actions">
        <a
          className="btn btn-primary btn-sm"
          href={demo.demo_url || `https://bizzap-demos.pages.dev/${demo.slug}/`}
          target="_blank"
          rel="noreferrer"
        >
          ✨ AI Website
        </a>
        {biz?.website && (
          <a
            className="btn btn-ghost btn-sm"
            href={biz.website}
            target="_blank"
            rel="noreferrer"
            title="Compare with their current website"
          >
            🌐 Their Current Site
          </a>
        )}
        {demo.leads && (
          <button className="btn btn-primary btn-sm" style={{ background: '#3b82f6' }} onClick={() => onOutreach(demo.leads!)}>
            💬 Outreach & Invoice
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }}
          onClick={() => onMoveBack(demo)}
        >
          ↩ Send Back for Fixes
        </button>
        {biz && biz.place_ref && !biz.place_ref.startsWith('google-maps-') && (
          <a
            className="btn btn-ghost btn-sm"
            href={getGmbUrl(biz)}
            target="_blank"
            rel="noreferrer"
          >
            📍 GMB Link
          </a>
        )}
        <button
          className={`btn btn-sm ${demo.approved ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => onToggleApprove(demo)}
          style={demo.approved ? {} : { background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          {demo.approved ? '↩ Unapprove' : '✓ Approve Demo'}
        </button>
      </div>
    </div>
  )
}

export default function DemosTab({ onToast, logActivity }: Props) {
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null)

  async function fetchDemos() {
    setLoading(true)
    const [demosRes, clientsRes] = await Promise.all([
      supabase.from('demos').select('*, leads(*, businesses(*))').order('built_at', { ascending: false }),
      supabase.from('clients').select('lead_id'),
    ])

    if (demosRes.error || clientsRes.error) {
      onToast('❌ Failed to load demos: ' + (demosRes.error || clientsRes.error)!.message)
      setLoading(false)
      return
    }

    const invoiced = new Set((clientsRes.data as { lead_id: number }[]).map(c => c.lead_id))
    setDemos((demosRes.data as Demo[]).filter(d => !invoiced.has(d.lead_id)))
    setLoading(false)
  }

  async function toggleApprove(demo: Demo) {
    const { error } = await supabase
      .from('demos')
      .update({ approved: !demo.approved })
      .eq('id', demo.id)
    if (error) {
      onToast('❌ Failed to update: ' + error.message)
    } else {
      onToast(demo.approved ? '⏸️ Demo unapproved' : '✅ Demo approved!')
      if (!demo.approved) {
        logActivity?.({
          action: 'demo_approved',
          entityType: 'demo',
          entityId: demo.id,
          entityLabel: demo.leads?.businesses?.name || demo.slug,
        })
      }
      fetchDemos()
    }
  }

  async function moveBackToLeads(demo: Demo) {
    const name = demo.leads?.businesses?.name || demo.slug
    const reasonInput = window.prompt(
      `Send "${name}" back to Leads for correction?\n\nPlease enter the reason or fix instructions for the designer:`,
      demo.leads?.reason || 'Demo rejected — needs design/content fixes.'
    )
    if (reasonInput === null) return

    const { error: demoErr } = await supabase.from('demos').delete().eq('id', demo.id)
    if (demoErr) {
      onToast('❌ Failed to move back: ' + demoErr.message)
      return
    }
    if (demo.lead_id) {
      const fixReason = reasonInput.trim() || 'Demo rejected — needs fixes'
      await supabase.from('leads').update({ status: 'needs_fix', reason: fixReason }).eq('id', demo.lead_id)
    }
    onToast('↩ Sent back to Leads — flagged with fix instructions')
    logActivity?.({
      action: 'demo_sent_back',
      entityType: 'lead',
      entityId: demo.lead_id,
      entityLabel: name,
      metadata: { reason: reasonInput },
    })
    fetchDemos()
  }

  useEffect(() => { fetchDemos() }, [])

  const approved = demos.filter(d => d.approved).length

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading demos…</span></div>
  )

  if (!demos.length) return (
    <div className="state-box">
      <span style={{ fontSize: 40 }}>🖥️</span>
      <strong>No demos built yet</strong>
      <span>Run <code>python pipeline/generate_demo.py --slug &lt;slug&gt; --bypass-watcher</code> to build a demo.</span>
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{demos.length}</div>
          <div className="stat-lbl">Demos Built</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--green)' }}>{approved}</div>
          <div className="stat-lbl">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{demos.length - approved}</div>
          <div className="stat-lbl">Pending Review</div>
        </div>
      </div>

      <p className="section-label">Demos — {demos.length} built</p>

      <div className="grid grid-2">
        {demos.map(demo => (
          <DemoCard
            key={demo.id}
            demo={demo}
            onToggleApprove={toggleApprove}
            onMoveBack={moveBackToLeads}
            onOutreach={lead => setOutreachLead(lead)}
            onToast={onToast}
            logActivity={logActivity}
          />
        ))}
      </div>

      {outreachLead && (
        <OutreachModal
          lead={outreachLead}
          onClose={() => setOutreachLead(null)}
          onUpdated={fetchDemos}
          onToast={onToast}
          logActivity={logActivity}
        />
      )}
    </div>
  )
}

