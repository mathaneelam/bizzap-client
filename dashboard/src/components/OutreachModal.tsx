import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Lead, Demo, LogActivity } from '../types'

interface Props {
  lead: Lead
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

const PACKAGES = [
  { id: 'starter', name: 'Starter Package', price: 2999 },
  { id: 'business', name: 'Business Package', price: 4999 },
  { id: 'manufacturer', name: 'Manufacturer Package', price: 9999 }
]

function cleanPhone(phone: string | null): string {
  if (!phone) return '919999999999'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

export default function OutreachModal({ lead, onClose, onUpdated, onToast, logActivity }: Props) {
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState('business')
  const [price, setPrice] = useState(4999)
  const [paymentType, setPaymentType] = useState<'manual' | 'razorpay'>('manual')
  const [razorpayUrl, setRazorpayUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dealCreated, setDealCreated] = useState(false)
  const [waUrl, setWaUrl] = useState('')
  const [waMessage, setWaMessage] = useState('')

  const biz = lead.businesses!

  useEffect(() => {
    async function loadDemo() {
      setLoading(true)
      const { data, error } = await supabase
        .from('demos')
        .select('*')
        .eq('lead_id', lead.id)
        .maybeSingle()

      if (error) {
        onToast('Error loading demo: ' + error.message)
      } else if (data) {
        setDemo(data as Demo)
      }
      setLoading(false)
    }
    loadDemo()
  }, [lead.id])

  function handlePackageChange(id: string, cost: number) {
    setPkg(id)
    setPrice(cost)
  }

  async function handleCreateDeal() {
    if (paymentType === 'razorpay' && !razorpayUrl) {
      onToast('Please enter the Razorpay Payment Link.')
      return;
    }

    setSubmitting(true)
    try {
      // 1. Create client if not exists
      let clientId: number
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('lead_id', lead.id)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({
            lead_id: lead.id,
            package: pkg,
            site_json_path: demo?.site_json_path || null,
            live_url: demo?.demo_url || null
          })
          .select()
          .single()

        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      // 2. Create deal
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // 7 days due date

      const { error: dealErr } = await supabase
        .from('deals')
        .insert({
          client_id: clientId,
          amount: price,
          type: 'build',
          status: 'sent',
          razorpay_id: paymentType === 'razorpay' ? razorpayUrl : 'manual-id',
          due_date: dueDate.toISOString().split('T')[0]
        })

      if (dealErr) throw dealErr

      // 3. Update lead status
      const { error: leadErr } = await supabase
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', lead.id)

      if (leadErr) throw leadErr

      // 4. Generate WhatsApp Link
      const demoUrl = demo?.demo_url || `https://bizzap-demos.pages.dev/${demo?.slug || ''}/`
      const payLink = paymentType === 'razorpay' ? razorpayUrl : 'GPay / Bank Transfer details attached'
      
      const message = (
        `Hi! We have built a live demo website for ${biz.name} based in Tiruppur.\n\n` +
        `Please take a look: ${demoUrl}\n\n` +
        `If you like the work, we can connect your own domain & launch it live for only ₹${price.toLocaleString('en-IN')}.\n` +
        `Payment Link: ${payLink}\n\n` +
        `Let us know if you want to make any edits!`
      )

      const phone = cleanPhone(biz.phone)
      const encodedMsg = encodeURIComponent(message)
      
      setWaMessage(message)
      setWaUrl(`https://wa.me/${phone}?text=${encodedMsg}`)
      setDealCreated(true)
      onToast('Success: Deal created & status updated!')
      logActivity?.({
        action: 'deal_created',
        entityType: 'deal',
        entityId: lead.id,
        entityLabel: biz.name,
        metadata: { package: pkg, amount: price, payment: paymentType },
      })
      logActivity?.({
        action: 'lead_status_changed',
        entityType: 'lead',
        entityId: lead.id,
        entityLabel: biz.name,
        metadata: { status: 'contacted' },
      })
      onUpdated()
    } catch (err: any) {
      onToast('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '20px auto' }} />
          <span>Verifying demo status...</span>
        </div>
      </div>
    )
  }

  if (!demo) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal">
          <div className="modal-title">⚠️ Demo Required</div>
          <p className="modal-sub">
            You must compile a demo for <strong>{biz.name}</strong> before sending outreach messages.
          </p>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Outreach & Invoicing Wizard</div>
        <p className="modal-sub">{biz.name} ({biz.category})</p>

        {!dealCreated ? (
          <>
            {/* Package Selector */}
            <p className="section-label">Select Package</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {PACKAGES.map(p => (
                <button
                  key={p.id}
                  className={`btn ${pkg === p.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handlePackageChange(p.id, p.price)}
                  style={{ flex: 1, padding: '14px 10px', fontSize: 12 }}
                >
                  <strong style={{ display: 'block', marginBottom: 4 }}>{p.name}</strong>
                  ₹{p.price.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Price Edit */}
            <p className="section-label">Deal Amount (INR)</p>
            <input
              type="number"
              className="textarea"
              style={{ minHeight: 'unset', padding: '10px 14px', marginBottom: 20, fontFamily: 'sans-serif', fontSize: 14 }}
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
            />

            {/* Payment Method */}
            <p className="section-label">Invoice Link Type</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                className={`btn btn-sm ${paymentType === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPaymentType('manual')}
              >
                💵 Manual/UPI
              </button>
              <button
                className={`btn btn-sm ${paymentType === 'razorpay' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPaymentType('razorpay')}
              >
                💳 Razorpay Payment Link
              </button>
            </div>

            {paymentType === 'razorpay' && (
              <input
                type="text"
                className="textarea"
                placeholder="Paste Razorpay Payment Link (e.g. https://rzp.io/l/...)"
                style={{ minHeight: 'unset', padding: '10px 14px', marginBottom: 20, fontFamily: 'monospace' }}
                value={razorpayUrl}
                onChange={e => setRazorpayUrl(e.target.value)}
              />
            )}

            {paymentType === 'razorpay' && (
              <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--muted)' }}>
                Create link: <a href="https://dashboard.razorpay.com/app/payment-links" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Razorpay Dashboard →</a>
              </div>
            )}

            <div className="card-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={handleCreateDeal} disabled={submitting}>
                {submitting ? 'Creating Deal...' : 'Create Deal & Next'}
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="section-label">WhatsApp Message Draft</p>
            <div className="prompt-box" style={{ maxHeight: 220, marginBottom: 20 }}>
              {waMessage}
            </div>

            <div className="card-actions" style={{ marginTop: 24 }}>
              <a className="btn btn-primary" href={waUrl} target="_blank" rel="noreferrer" onClick={() => {
                logActivity?.({ action: 'outreach_sent', entityType: 'lead', entityId: lead.id, entityLabel: biz.name })
                onClose()
              }}>
                💬 Send on WhatsApp
              </a>
              <button className="btn btn-ghost" onClick={onClose}>Close Wizard</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
