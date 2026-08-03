import { useState } from 'react'
import { supabase } from '../supabase'
import type { LogActivity } from '../types'

interface Props {
  phone: string | null
  businessId: number
  businessName: string
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
  style?: React.CSSProperties
}

function cleanPhoneForWa(phone: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return '91' + digits
  return digits
}

function cleanPhoneForDial(phone: string | null): string {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '')
}

export default function EditablePhoneLink({
  phone,
  businessId,
  businessName,
  onUpdated,
  onToast,
  logActivity,
  style,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [phoneInput, setPhoneInput] = useState(phone || '')
  const [saving, setSaving] = useState(false)

  async function handleSavePhone(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = phoneInput.trim()
    setSaving(true)

    const { error } = await supabase
      .from('businesses')
      .update({ phone: trimmed || null })
      .eq('id', businessId)

    setSaving(false)

    if (error) {
      onToast('❌ Failed to save contact number: ' + error.message)
    } else {
      onToast(trimmed ? `✅ Saved contact number: ${trimmed}` : '✅ Removed contact number')
      logActivity?.({
        action: 'business_phone_updated',
        entityType: 'business',
        entityId: businessId,
        entityLabel: businessName,
        metadata: { old_phone: phone, new_phone: trimmed },
      })
      setIsEditing(false)
      setShowModal(false)
      onUpdated()
    }
  }

  function handleStartEdit(e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    setPhoneInput(phone || '')
    setIsEditing(true)
    setShowModal(false)
  }

  function handleCopyPhone(e: React.MouseEvent) {
    e.stopPropagation()
    if (phone) {
      navigator.clipboard.writeText(phone)
      onToast('📋 Copied phone number to clipboard')
    }
  }

  const waPhone = cleanPhoneForWa(phone)
  const dialPhone = cleanPhoneForDial(phone)

  if (isEditing) {
    return (
      <form
        onSubmit={handleSavePhone}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface-2)',
          padding: '2px 6px',
          borderRadius: 8,
          border: '1px solid var(--accent)',
          ...style,
        }}
      >
        <input
          type="tel"
          value={phoneInput}
          onChange={e => setPhoneInput(e.target.value)}
          placeholder="Enter phone number..."
          autoFocus
          disabled={saving}
          style={{
            background: 'var(--surface-1)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 13,
            fontWeight: 600,
            width: 150,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="btn btn-xs btn-primary"
          disabled={saving}
          style={{ padding: '3px 8px', fontSize: 12 }}
          title="Save contact number"
        >
          {saving ? '...' : '✓ Save'}
        </button>
        <button
          type="button"
          className="btn btn-xs btn-ghost"
          disabled={saving}
          onClick={() => setIsEditing(false)}
          style={{ padding: '3px 6px', fontSize: 12, color: 'var(--muted)' }}
          title="Cancel"
        >
          ✕
        </button>
      </form>
    )
  }

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        {phone ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--accent)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
            title="Click for Dial Pad or WhatsApp options"
          >
            {phone} 📞
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            style={{
              background: 'none',
              border: '1px dashed var(--border)',
              padding: '2px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ➕ Add Contact Number
          </button>
        )}

        <button
          type="button"
          onClick={handleStartEdit}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 4px',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 12,
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          title="Edit contact number"
        >
          ✏️
        </button>
      </div>

      {/* Action Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 380,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Contact Action
            </div>
            <h3 style={{ fontSize: 18, margin: '0 0 4px 0', color: 'var(--text)' }}>{businessName}</h3>
            <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, margin: '0 0 20px 0' }}>
              {phone}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {/* Option 1: Mobile Dial Pad */}
              <a
                href={`tel:${dialPhone}`}
                className="btn"
                onClick={() => setShowModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }}
              >
                <span style={{ fontSize: 18 }}>📞</span>
                <div style={{ textAlign: 'left' }}>
                  <div>1st Option: Mobile Dial Pad</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>Open phone dialer directly</div>
                </div>
              </a>

              {/* Option 2: WhatsApp Chat */}
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noreferrer"
                className="btn"
                onClick={() => setShowModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                }}
              >
                <span style={{ fontSize: 18 }}>💬</span>
                <div style={{ textAlign: 'left' }}>
                  <div>2nd Option: WhatsApp Chat</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>Start WhatsApp conversation</div>
                </div>
              </a>
            </div>

            {/* Sub-actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleStartEdit}
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                ✏️ Edit Number
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleCopyPhone}
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                📋 Copy
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setShowModal(false)}
                style={{ fontSize: 12, color: 'var(--muted)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
