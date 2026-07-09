import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Deal, LogActivity } from '../types'

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
  // 'active' shows unpaid deals (Deals & Invoices); 'archive' shows paid deals.
  variant?: 'active' | 'archive'
}

const STATUS_CLASSES: Record<string, string> = {
  sent: 'pill-contacted',
  paid: 'pill-won',
  due:  'pill-lost'
}

export default function DealsTab({ onToast, logActivity, variant = 'active' }: Props) {
  const isArchive = variant === 'archive'
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
      onToast('✅ Paid — moved to Archive!')
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

  // Each deal lives in exactly one place: paid → Archive, everything else → active.
  const visible = deals.filter(d => (isArchive ? d.status === 'paid' : d.status !== 'paid'))
  const visibleValue = visible.reduce((acc, d) => acc + Number(d.amount), 0)
  const paidCount = deals.filter(d => d.status === 'paid').length

  if (loading) return (
    <div className="state-box"><div className="spinner" /><span>Loading deals…</span></div>
  )

  if (!visible.length) return (
    <div className="state-box">
      <span style={{ fontSize: 40 }}>{isArchive ? '📦' : '💳'}</span>
      <strong>{isArchive ? 'No archived deals yet' : 'No active deals'}</strong>
      <span>
        {isArchive
          ? 'Deals you mark as paid will be archived here.'
          : <>Complete <strong>Outreach &amp; Invoice</strong> on a demo to create a deal, or run <code>python pipeline/outreach.py --slug &lt;slug&gt;</code>.</>}
      </span>
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-row">
        {isArchive ? (
          <>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--green)' }}>
                ₹{visibleValue.toLocaleString('en-IN')}
              </div>
              <div className="stat-lbl">Revenue Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{visible.length}</div>
              <div className="stat-lbl">Archived Deals</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-val">{visible.length}</div>
              <div className="stat-lbl">Active Deals</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--amber)' }}>
                ₹{visibleValue.toLocaleString('en-IN')}
              </div>
              <div className="stat-lbl">Pending Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--green)' }}>{paidCount}</div>
              <div className="stat-lbl">Paid &amp; Archived</div>
            </div>
          </>
        )}
      </div>

      <p className="section-label">
        {isArchive ? `Archived (Paid) — ${visible.length}` : `Active Deals — ${visible.length}`}
      </p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="deal-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Package</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>{isArchive ? 'Paid On' : 'Due Date'}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(deal => {
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
                    {isArchive
                      ? (deal.paid_at ? new Date(deal.paid_at).toLocaleDateString('en-IN') : '—')
                      : (deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-IN') : '—')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isArchive && (
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
