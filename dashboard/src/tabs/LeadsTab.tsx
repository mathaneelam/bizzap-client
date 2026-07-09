import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, LogActivity } from '../types'
import LeadCard from '../components/LeadCard'

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

export default function LeadsTab({ onToast, logActivity }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  async function fetchLeads() {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*, businesses(*)')
      .order('score', { ascending: false })

    if (error) {
      onToast('❌ Failed to load leads: ' + error.message)
    } else {
      setLeads(data as Lead[])
    }
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const statuses = ['all', 'new', 'demo_built', 'contacted', 'won', 'lost']
  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const totalLeads = leads.length
  const qualified  = leads.filter(l => l.score >= 40).length
  const withDraft  = leads.filter(l => l.copy_draft).length

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading leads from Supabase…</span></div>
  )

  if (!leads.length) return (
    <div className="state-box">
      <span style={{ fontSize: 40 }}>📭</span>
      <strong>No leads yet</strong>
      <span>Run <code>python pipeline/score_leads.py --import-file pipeline/sample_raw_leads.json --score</code> to populate leads.</span>
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{totalLeads}</div>
          <div className="stat-lbl">Total Leads</div>
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
