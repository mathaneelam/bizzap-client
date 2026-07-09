import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Deal, LogActivity } from '../types'

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

const STATUS_CLASSES: Record<string, string> = {
  sent: 'pill-contacted',
  paid: 'pill-won',
  due:  'pill-lost'
}

export default function DealsTab({ onToast, logActivity }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDeals() {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*, clients(*, leads(*, businesses(*)))')
      .order('due_date', { ascending: true })
    if (error) {
      onToast('❌ Failed to load deals: ' + error.message)
    } else {
      setDeals(data as Deal[])
    }
    setLoading(false)
  }

  async function markPaid(deal: Deal) {
    const { error } = await supabase
      .from('deals')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', deal.id)
    if (error) {
      onToast('❌ Failed to update: ' + error.message)
    } else {
      onToast('✅ Deal marked as paid!')
      logActivity?.({
        action: 'deal_paid',
        entityType: 'deal',
        entityId: deal.id,
        entityLabel: deal.clients?.leads?.businesses?.name || `Deal #${deal.id}`,
        metadata: { amount: deal.amount },
      })
      fetchDeals()
    }
  }

  useEffect(() => { fetchDeals() }, [])

  const totalRevenue = deals.filter(d => d.status === 'paid').reduce((acc, d) => acc + Number(d.amount), 0)
  const pending      = deals.filter(d => d.status !== 'paid').length

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading deals…</span></div>
  )

  if (!deals.length) return (
    <div className="state-box">
      <span style={{ fontSize: 40 }}>💳</span>
      <strong>No deals yet</strong>
      <span>Run <code>python pipeline/outreach.py --slug &lt;slug&gt;</code> to generate your first payment link.</span>
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--green)' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-lbl">Revenue Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{deals.length}</div>
          <div className="stat-lbl">Total Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{pending}</div>
          <div className="stat-lbl">Outstanding</div>
        </div>
      </div>

      <p className="section-label">Deals — {deals.length} total</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="deal-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Package</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => {
              const biz = deal.clients?.leads?.businesses
              return (
                <tr key={deal.id}>
                  <td><strong>{biz?.name || '—'}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{deal.clients?.package || '—'}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                    ₹{Number(deal.amount).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{deal.type}</td>
                  <td>
                    <span className={`pill ${STATUS_CLASSES[deal.status] || 'pill-new'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>
                    {deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {deal.status !== 'paid' && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
                          onClick={() => markPaid(deal)}
                        >
                          ✓ Mark Paid
                        </button>
                      )}
                      {deal.razorpay_id && deal.razorpay_id !== 'manual-id' && (
                        <a
                          className="btn btn-ghost btn-sm"
                          href={`https://dashboard.razorpay.com/app/payment-links`}
                          target="_blank" rel="noreferrer"
                        >
                          💳 Razorpay
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
