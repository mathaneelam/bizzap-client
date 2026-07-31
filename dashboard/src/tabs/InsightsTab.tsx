import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, ActivityLog } from '../types'
import { formatStatusLabel } from '../types'

interface Props {
  onToast: (msg: string) => void
}

export default function InsightsTab({ onToast }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  async function fetchInsightsData() {
    setLoading(true)
    const [leadsRes, logsRes] = await Promise.all([
      supabase.from('leads').select('*, businesses(*)').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200)
    ])

    if (leadsRes.error || logsRes.error) {
      onToast('❌ Failed to load insights: ' + (leadsRes.error || logsRes.error)!.message)
    } else {
      setLeads((leadsRes.data as Lead[]) || [])
      setLogs((logsRes.data as ActivityLog[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInsightsData()
  }, [])

  // Categorize lead dropoffs & reasons
  const droppedStatuses = new Set([
    'ring_no_response',
    'switched_off',
    'unable_to_call',
    'not_interested',
    'already_have_site',
    'others',
    'lost',
    'dnc',
    'needs_fix'
  ])

  const leadDropoffs = leads.filter(l => droppedStatuses.has(l.status))
  const needsFixLeads = leads.filter(l => l.status === 'needs_fix')
  const unreachableLeads = leads.filter(l => ['switched_off', 'unable_to_call', 'ring_no_response'].includes(l.status))
  const declinedLeads = leads.filter(l => ['not_interested', 'already_have_site', 'dnc', 'lost'].includes(l.status))

  // Reason Distribution Breakdown
  const reasonCounts: Record<string, number> = {}
  leadDropoffs.forEach(l => {
    const label = formatStatusLabel(l.status)
    reasonCounts[label] = (reasonCounts[label] || 0) + 1
  })

  // Filter logs for dropoff / fix / comment activity
  const dropoffActivityActions = new Set([
    'lead_status_changed',
    'lead_comment_updated',
    'demo_sent_back',
    'demo_dropped',
    'business_deleted'
  ])

  const filteredLogs = logs.filter(log => {
    if (!dropoffActivityActions.has(log.action)) return false
    if (stageFilter === 'lead' && !['lead_status_changed', 'lead_comment_updated'].includes(log.action)) return false
    if (stageFilter === 'demo' && !['demo_sent_back', 'demo_dropped'].includes(log.action)) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const label = (log.entity_label || '').toLowerCase()
      const user = (log.user_name || log.user_email || '').toLowerCase()
      const reason = JSON.stringify(log.metadata || {}).toLowerCase()
      return label.includes(q) || user.includes(q) || reason.includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner" />
        <span>Analyzing lead performance & dropoff statistics…</span>
      </div>
    )
  }

  return (
    <div>
      {/* Overview Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{leads.length}</div>
          <div className="stat-lbl">Total Leads Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{leadDropoffs.length}</div>
          <div className="stat-lbl">Total Dropoffs / Rejections</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: '#818cf8' }}>{unreachableLeads.length}</div>
          <div className="stat-lbl">Unreachable (Switched Off / No Response)</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--red)' }}>{declinedLeads.length}</div>
          <div className="stat-lbl">Declined / Already Have Site</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{needsFixLeads.length}</div>
          <div className="stat-lbl">Demo Fix Requests</div>
        </div>
      </div>

      {/* Reason Category Distribution */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 14 }}>📊 Top Dropoff & Call Outcome Reasons</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(reasonCounts).length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>No dropoffs logged yet.</span>
          ) : (
            Object.entries(reasonCounts).map(([reason, count]) => {
              const pct = Math.round((count / Math.max(1, leadDropoffs.length)) * 100)
              return (
                <div key={reason} style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  flex: '1 1 180px',
                  minWidth: 160
                }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{reason}</div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--accent)', marginTop: 2 }}>
                    {count} <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>({pct}%)</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Dropped Businesses & Reason Audit Log Table */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', margin: 0 }}>📋 Stage-by-Stage Dropoff & Reason Log</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Tracks every business dropped, sent back, or commented on across all pipeline stages</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="textarea"
              placeholder="Search company or reason..."
              style={{ minHeight: 'unset', padding: '8px 14px', width: 220, fontSize: 13 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'lead', 'demo'].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${stageFilter === st ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStageFilter(st)}
            >
              {st === 'all' ? 'All Stages' : st === 'lead' ? '📋 Lead Stage' : '🖥️ Demo Stage'}
            </button>
          ))}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="state-box" style={{ padding: '40px 20px' }}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <span>No stage dropoff records match your search filter.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="deal-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Action / Stage</th>
                  <th>Outcome / Status</th>
                  <th>Reason / Comment Notes</th>
                  <th>Logged By</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const meta = log.metadata || {}
                  const statusStr = (meta.status as string) || (log.action === 'demo_sent_back' ? 'needs_fix' : log.action === 'demo_dropped' ? 'dropped' : 'updated')
                  const reasonStr = (meta.reason as string) || (meta.label as string) || 'No comment provided'
                  const isDemoStage = ['demo_sent_back', 'demo_dropped'].includes(log.action)

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.entity_label || 'Business'}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          {isDemoStage ? '🖥️ Demo Stage' : '📋 Lead Stage'}
                        </span>
                      </td>
                      <td>
                        <span className={`pill pill-${statusStr}`}>
                          {formatStatusLabel(statusStr)}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <span style={{ color: 'var(--text)', fontSize: 13 }}>{reasonStr}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {log.user_name || log.user_email}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

