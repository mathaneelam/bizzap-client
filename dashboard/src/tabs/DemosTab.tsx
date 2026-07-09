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

export default function DemosTab({ onToast, logActivity }: Props) {
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null)

  async function fetchDemos() {
    setLoading(true)
    // A demo whose lead already has a `clients` row has advanced to Deals & Invoices,
    // so it leaves this stage — each card lives in exactly one tab.
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

  // Website not good enough → delete the demo so the card returns to Leads Manager,
  // and flag the lead `needs_fix` so it sorts to the top there for immediate correction.
  async function moveBackToLeads(demo: Demo) {
    const name = demo.leads?.businesses?.name || demo.slug
    if (!window.confirm(`Send "${name}" back to Leads for correction? This removes the current demo.`)) return

    const { error: demoErr } = await supabase.from('demos').delete().eq('id', demo.id)
    if (demoErr) {
      onToast('❌ Failed to move back: ' + demoErr.message)
      return
    }
    if (demo.lead_id) {
      await supabase.from('leads').update({ status: 'needs_fix' }).eq('id', demo.lead_id)
    }
    onToast('↩ Sent back to Leads — flagged for correction')
    logActivity?.({
      action: 'demo_sent_back',
      entityType: 'lead',
      entityId: demo.lead_id,
      entityLabel: name,
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
        {demos.map(demo => {
          const biz = demo.leads?.businesses
          return (
            <div className="card" key={demo.id}>
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

              <div className="card-actions">
                <a
                  className="btn btn-primary btn-sm"
                  href={demo.demo_url || `https://bizzap-demos.pages.dev/${demo.slug}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🌐 View Website
                </a>
                {demo.leads && (
                  <button className="btn btn-primary btn-sm" style={{ background: '#3b82f6' }} onClick={() => setOutreachLead(demo.leads!)}>
                    💬 Outreach & Invoice
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }}
                  onClick={() => moveBackToLeads(demo)}
                >
                  ↩ Send Back for Fixes
                </button>
                {biz && (
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
                  onClick={() => toggleApprove(demo)}
                  style={demo.approved ? {} : { background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  {demo.approved ? '↩ Unapprove' : '✓ Approve Demo'}
                </button>
              </div>
            </div>
          )
        })}
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
