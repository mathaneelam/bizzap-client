import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, LogActivity } from '../types'

interface Props {
  lead: Lead
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
  currentUserEmail?: string
}

export default function ScheduleAppointmentModal({
  lead,
  onClose,
  onUpdated,
  onToast,
  logActivity,
  currentUserEmail
}: Props) {
  // Default to tomorrow 10:00 AM
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 1)
  defaultDate.setHours(10, 0, 0, 0)
  const defaultIso = defaultDate.toISOString().slice(0, 16)

  const [scheduledAt, setScheduledAt] = useState(defaultIso)
  const [type, setType] = useState<'in_person' | 'phone_call' | 'whatsapp'>('in_person')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const biz = lead.businesses!

  async function handleSchedule() {
    if (!scheduledAt) {
      onToast('⚠️ Please select date and time for the appointment.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Insert appointment
      const { error: apptErr } = await supabase.from('appointments').insert({
        lead_id: lead.id,
        scheduled_at: new Date(scheduledAt).toISOString(),
        type,
        notes: notes.trim() || null,
        status: 'scheduled',
        created_by: currentUserEmail || null,
      })

      if (apptErr) throw apptErr

      // 2. Update lead status & reason
      const statusNote = `Appointment (${type.replace('_', ' ')}) set for ${new Date(scheduledAt).toLocaleString('en-IN')}${notes ? `: ${notes}` : ''}`
      const { error: leadErr } = await supabase
        .from('leads')
        .update({
          status: 'appointment_scheduled',
          reason: statusNote
        })
        .eq('id', lead.id)

      if (leadErr) throw leadErr

      // 3. Log Activity
      logActivity?.({
        action: 'appointment_scheduled',
        entityType: 'lead',
        entityId: lead.id,
        entityLabel: biz.name,
        metadata: {
          scheduledAt,
          type,
          notes,
        }
      })

      onToast(`📅 Appointment scheduled for ${biz.name}!`)
      onUpdated()
      onClose()
    } catch (err: any) {
      if (err.message?.includes('schema cache') || err.message?.includes('Could not find the table') || err.code === 'PGRST204') {
        onToast("❌ Table 'appointments' does not exist in Supabase. Please run schema.sql in Supabase SQL Editor.")
      } else {
        onToast('❌ Failed to schedule appointment: ' + err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">📅 Schedule Appointment / Meeting</div>
        <p className="modal-sub">
          Set up a meeting or call back date for <strong>{biz.name}</strong>
        </p>

        {/* Date Time Picker */}
        <p className="section-label">Meeting Date & Time</p>
        <input
          type="datetime-local"
          className="textarea"
          style={{ minHeight: 'unset', padding: '10px 14px', marginBottom: 20, fontFamily: 'sans-serif', fontSize: 14 }}
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
        />

        {/* Meeting Type */}
        <p className="section-label">Meeting Type</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${type === 'in_person' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('in_person')}
            style={{ flex: 1, padding: '12px 8px', fontSize: 13 }}
          >
            🚶 In-Person Visit
          </button>
          <button
            type="button"
            className={`btn ${type === 'phone_call' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('phone_call')}
            style={{ flex: 1, padding: '12px 8px', fontSize: 13 }}
          >
            📞 Phone Call Back
          </button>
          <button
            type="button"
            className={`btn ${type === 'whatsapp' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('whatsapp')}
            style={{ flex: 1, padding: '12px 8px', fontSize: 13 }}
          >
            💬 WhatsApp Call
          </button>
        </div>

        {/* Notes / Agenda */}
        <p className="section-label">Notes & Meeting Agenda (Optional)</p>
        <textarea
          className="textarea"
          placeholder="e.g., Founder Mr. Kumar requested in-person demo at factory. Bring tablet preview."
          style={{ minHeight: 100, marginBottom: 20 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="card-actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSchedule} disabled={submitting}>
            {submitting ? 'Scheduling...' : 'Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}
