import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Demo, Business, Lead, LogActivity } from '../types'
import OutreachModal from '../components/OutreachModal'
import ScheduleAppointmentModal from '../components/ScheduleAppointmentModal'
import EditablePhoneLink from '../components/EditablePhoneLink'

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
  onDrop,
  onOutreach,
  onUpdated,
  onToast,
  logActivity,
}: {
  demo: Demo
  onToggleApprove: (demo: Demo) => void
  onMoveBack: (demo: Demo) => void
  onDrop: (demo: Demo) => void
  onOutreach: (lead: Lead) => void
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
}) {
  const [showApptModal, setShowApptModal] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'screenshot'>('preview')

  // Normalize joined lead object from Supabase (handles array or object)
  const rawLead = Array.isArray(demo.leads) ? (demo.leads as any)[0] : demo.leads
  const effectiveLead: Lead = rawLead || {
    id: demo.lead_id || 0,
    business_id: 0,
    score: 50,
    has_website: false,
    reason: null,
    copy_draft: null,
    gen_count: 0,
    status: 'demo_built',
    created_at: demo.built_at,
    businesses: {
      id: 0,
      place_ref: demo.slug,
      name: demo.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: 'Business',
      segment: 'services',
      phone: null,
      website: demo.demo_url,
      rating: 5,
      review_count: 1,
      address: 'Tiruppur',
      lat: null,
      lng: null,
      raw: null,
    }
  }
  const biz = effectiveLead.businesses
  const targetUrl = demo.demo_url || `https://bizzap-demos.pages.dev/${demo.slug}/`

  return (
    <>
      <div className="card">
        {/* Toggle Bar for Live Preview vs Screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Website Demo Preview
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-xs ${viewMode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => setViewMode('preview')}
            >
              🌐 Live Preview
            </button>
            <button
              className={`btn btn-xs ${viewMode === 'screenshot' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => setViewMode('screenshot')}
            >
              🖼️ Screenshot
            </button>
          </div>
        </div>

        {/* Live Preview Iframe or Screenshot */}
        {viewMode === 'preview' ? (
          <div style={{ position: 'relative', width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: '#090d16', marginBottom: 16 }}>
            <iframe
              src={targetUrl}
              title={`${biz?.name || demo.slug} Live Preview`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        ) : demo.screenshot ? (
          <div style={{ overflow: 'hidden', borderRadius: 10, marginBottom: 16 }}>
            <img
              className="demo-screenshot"
              src={`file:///${demo.screenshot?.replace(/\\/g, '/')}`}
              alt={`${biz?.name} screenshot`}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="demo-screenshot-placeholder" style={{ height: 160, marginBottom: 16 }}>📷 No screenshot taken yet</div>
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
          {biz && biz.id > 0 && (
            <>
              &nbsp;·&nbsp;{' '}
              <EditablePhoneLink
                phone={biz.phone}
                businessId={biz.id}
                businessName={biz.name}
                onUpdated={onUpdated}
                onToast={onToast}
                logActivity={logActivity}
              />
            </>
          )}
          {demo.demo_url && (
            <>
              &nbsp;·&nbsp; <span style={{ color: '#a855f7', fontWeight: 600 }}>✨ Lovable Demo Linked</span>
            </>
          )}
        </div>

        {effectiveLead.reason && (
          <div style={{ marginTop: 10, background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}>
            💬 Note / Appointment: <em>{effectiveLead.reason}</em>
          </div>
        )}

        <div className="card-actions" style={{ marginTop: 18 }}>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
            onClick={() => setShowApptModal(true)}
            title="Schedule an in-person meeting or call back appointment"
          >
            📅 Book Appointment
          </button>

          <a
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', border: 'none' }}
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
          >
            ✨ Open Lovable Site
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
          <button className="btn btn-primary btn-sm" style={{ background: '#3b82f6' }} onClick={() => onOutreach(effectiveLead)}>
            💬 Outreach & Invoice
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }}
            onClick={() => onMoveBack(demo)}
          >
            ↩ Send Back for Fixes
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
            onClick={() => onDrop(demo)}
            title="Drop this demo and record the drop reason in Insights"
          >
            🚫 Drop
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

      {showApptModal && (
        <ScheduleAppointmentModal
          lead={effectiveLead}
          onClose={() => setShowApptModal(false)}
          onUpdated={onUpdated}
          onToast={onToast}
          logActivity={logActivity}
        />
      )}
    </>
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

  async function dropDemo(demo: Demo) {
    const name = demo.leads?.businesses?.name || demo.slug
    const dropReason = window.prompt(
      `Drop demo for "${name}"?\n\nPlease state the reason why this demo is being dropped:`,
      'Owner declined website demo / unresponsive.'
    )
    if (dropReason === null) return

    const finalReason = dropReason.trim() || 'Demo dropped'

    const { error: demoErr } = await supabase.from('demos').delete().eq('id', demo.id)
    if (demoErr) {
      onToast('❌ Failed to drop demo: ' + demoErr.message)
      return
    }
    if (demo.lead_id) {
      await supabase.from('leads').update({ status: 'dropped', reason: finalReason }).eq('id', demo.lead_id)
    }
    onToast('🚫 Demo dropped and recorded in Insights.')
    logActivity?.({
      action: 'demo_dropped',
      entityType: 'demo',
      entityId: demo.id,
      entityLabel: name,
      metadata: { reason: finalReason, status: 'dropped' },
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
            onDrop={dropDemo}
            onOutreach={lead => setOutreachLead(lead)}
            onUpdated={fetchDemos}
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

