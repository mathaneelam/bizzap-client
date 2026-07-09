import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, LogActivity } from '../types'
import LeadCard from '../components/LeadCard'

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

export default function LeadsTab({ onToast, logActivity }: Props) {
  // Only leads that have NOT yet advanced down the pipeline live here:
  // a `demos` row means it moved to Demos, a `clients` row means it moved to Deals.
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  async function fetchLeads() {
    setLoading(true)
    const [leadsRes, demosRes, clientsRes] = await Promise.all([
      supabase.from('leads').select('*, businesses(*)').order('score', { ascending: false }),
      supabase.from('demos').select('lead_id'),
      supabase.from('clients').select('lead_id'),
    ])

    if (leadsRes.error || demosRes.error || clientsRes.error) {
      onToast('❌ Failed to load leads: ' + (leadsRes.error || demosRes.error || clientsRes.error)!.message)
      setLoading(false)
      return
    }

    const moved = new Set<number>([
      ...(demosRes.data as { lead_id: number }[]).map(d => d.lead_id),
      ...(clientsRes.data as { lead_id: number }[]).map(c => c.lead_id),
    ])
    setLeads((leadsRes.data as Lead[]).filter(l => !moved.has(l.id)))
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const statuses = ['all', 'needs_fix', 'new', 'lost']
  // `needs_fix` leads were sent back from Demos — surface them first so they get fixed immediately.
  const filtered = (filter === 'all' ? leads : leads.filter(l => l.status === filter))
    .slice()
    .sort((a, b) => (a.status === 'needs_fix' ? 0 : 1) - (b.status === 'needs_fix' ? 0 : 1) || b.score - a.score)

  const totalLeads = leads.length
  const needsFix   = leads.filter(l => l.status === 'needs_fix').length
  const qualified  = leads.filter(l => l.score >= 40).length
  const withDraft  = leads.filter(l => l.copy_draft).length

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading leads from Supabase…</span></div>
  )

  if (!leads.length) return (
    <div className="state-box">
      <span style={{ fontSize: 40 }}>📭</span>
      <strong>No leads waiting</strong>
      <span>Every scraped lead has moved into Demos or Deals. Run <code>python pipeline/score_leads.py --import-file pipeline/sample_raw_leads.json --score</code> to add more.</span>
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{totalLeads}</div>
          <div className="stat-lbl">Leads Waiting</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{needsFix}</div>
          <div className="stat-lbl">Needs Fix</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--green)' }}>{qualified}</div>
          <div className="stat-lbl">Qualified (40+)</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{withDraft}</div>
          <div className="stat-lbl">Copy Drafts Ready</div>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <p className="section-label">Leads — {filtered.length} shown</p>

      <div className="grid grid-3">
        {filtered.map(lead => (
          <LeadCard key={lead.id} lead={lead} onUpdated={fetchLeads} onToast={onToast} logActivity={logActivity} />
        ))}
      </div>
    </div>
  )
}
