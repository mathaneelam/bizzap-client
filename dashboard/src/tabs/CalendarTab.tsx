import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Appointment, LogActivity } from '../types'
import EditablePhoneLink from '../components/EditablePhoneLink'

interface Props {
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

export default function CalendarTab({ onToast, logActivity }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [missingTable, setMissingTable] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  async function fetchAppointments() {
    setLoading(true)
    setMissingTable(false)
    const { data, error } = await supabase
      .from('appointments')
      .select('*, leads(*, businesses(*))')
      .order('scheduled_at', { ascending: true })

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('Could not find the table') || error.code === 'PGRST204') {
        setMissingTable(true)
      } else {
        onToast('❌ Failed to load appointments: ' + error.message)
      }
    } else if (data) {
      setAppointments(data as Appointment[])
      setMissingTable(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function updateAppointmentStatus(id: number, status: 'completed' | 'rescheduled' | 'cancelled', bizName?: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) {
      onToast('❌ Failed to update status: ' + error.message)
    } else {
      onToast(`Status updated to ${status}`)
      logActivity?.({
        action: `appointment_${status}`,
        entityType: 'appointment',
        entityId: id,
        entityLabel: bizName,
      })
      fetchAppointments()
    }
  }

  // Today's appointments
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at).toISOString().split('T')[0]
    return d === todayStr && a.status !== 'cancelled'
  })

  // Filtered list
  const filtered = appointments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterType !== 'all' && a.type !== filterType) return false
    return true
  })

  function getGcalUrl(appt: Appointment): string {
    const biz = appt.leads?.businesses
    const title = encodeURIComponent(`Meeting: ${biz?.name || 'Client'}`)
    const details = encodeURIComponent(`Bizzap Appointment (${appt.type.replace('_', ' ')})\nNotes: ${appt.notes || 'None'}\nPhone: ${biz?.phone || 'N/A'}`)
    const location = encodeURIComponent(biz?.address || 'Tiruppur')

    const start = new Date(appt.scheduled_at)
    const end = new Date(start.getTime() + 45 * 60000) // 45 min duration default

    const formatIso = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '')
    const dates = `${formatIso(start)}/${formatIso(end)}`

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`
  }

  function getMapsUrl(address: string | null, name: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (address || 'Tiruppur'))}`
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner" />
        <span>Loading calendar & appointments…</span>
      </div>
    )
  }

  if (missingTable) {
    const sqlScript = `CREATE TABLE IF NOT EXISTS appointments (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  type          VARCHAR(50) DEFAULT 'in_person',
  notes         TEXT,
  status        VARCHAR(50) DEFAULT 'scheduled',
  created_by    VARCHAR(255),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to appointments" ON appointments;
CREATE POLICY "Enable full access to appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);`

    return (
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 16,
        padding: '28px',
        maxWidth: 800,
        margin: '20px auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)' }}>Table <code>public.appointments</code> Not Found in Supabase</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              The <strong>appointments</strong> table is missing from your Supabase database schema.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
          To fix this error, open your <strong>Supabase Dashboard &rarr; SQL Editor</strong>, run the following SQL script, and click <strong>Run</strong>:
        </p>

        <pre style={{
          background: 'var(--surface-2)',
          padding: 16,
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text)',
          overflowX: 'auto',
          border: '1px solid var(--border)',
          fontFamily: 'monospace',
          marginBottom: 16,
          lineHeight: 1.5
        }}>
          {sqlScript}
        </pre>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(sqlScript)
              onToast('📋 SQL script copied to clipboard!')
            }}
          >
            📋 Copy SQL to Clipboard
          </button>
          <button className="btn btn-ghost btn-sm" onClick={fetchAppointments}>
            🔄 Refresh / Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Today's Agenda Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,100,66,0.15) 0%, rgba(59,130,246,0.15) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 28,
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>
              📅 Today's Schedule — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', margin: '4px 0 0', color: 'var(--text)' }}>
              {todayAppts.length === 0 ? 'No meetings scheduled for today' : `${todayAppts.length} Meeting${todayAppts.length > 1 ? 's' : ''} Today`}
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchAppointments}>🔄 Refresh Schedule</button>
        </div>

        {todayAppts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 20 }}>
            {todayAppts.map(a => {
              const biz = a.leads?.businesses
              return (
                <div key={a.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text)' }}>{biz?.name}</strong>
                    <span className="pill pill-contacted" style={{ fontSize: 10 }}>
                      {new Date(a.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                    {a.type === 'in_person' ? '🚶 In-Person Visit' : a.type === 'phone_call' ? '📞 Call Back' : '💬 WhatsApp'}
                  </div>
                  {biz?.address && (
                    <a
                      href={getMapsUrl(biz.address, biz.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: 11, padding: '4px 10px', width: '100%', justifyContent: 'center' }}
                    >
                      📍 Open Directions (Maps)
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Filter Status:</span>
        {['all', 'scheduled', 'completed', 'rescheduled', 'cancelled'].map(st => (
          <button
            key={st}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterStatus(st)}
          >
            {st === 'all' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Type:</span>
          {['all', 'in_person', 'phone_call', 'whatsapp'].map(tp => (
            <button
              key={tp}
              className={`btn btn-sm ${filterType === tp ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterType(tp)}
            >
              {tp === 'all' ? 'All Types' : tp === 'in_person' ? 'In-Person' : tp === 'phone_call' ? 'Calls' : 'WhatsApp'}
            </button>
          ))}
        </div>
      </div>

      <p className="section-label">All Scheduled Appointments ({filtered.length})</p>

      {filtered.length === 0 ? (
        <div className="state-box">
          <span style={{ fontSize: 36 }}>📅</span>
          <strong>No appointments found</strong>
          <span>Book an appointment on any lead card in the Lead Manager tab to see it here.</span>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(appt => {
            const biz = appt.leads?.businesses
            const scheduledDate = new Date(appt.scheduled_at)
            const isPast = scheduledDate < new Date() && appt.status === 'scheduled'

            return (
              <div key={appt.id} className="card" style={{ borderColor: isPast ? 'rgba(239,68,68,0.4)' : undefined }}>
                {isPast && (
                  <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>
                    ⚠️ Overdue Appointment — Mark Completed or Reschedule
                  </div>
                )}
                <div className="card-header">
                  <div>
                    <div className="card-name">{biz?.name || `Lead #${appt.lead_id}`}</div>
                    <div className="card-category">{biz?.category}</div>
                  </div>
                  <span className={`pill ${appt.status === 'completed' ? 'pill-won' : appt.status === 'cancelled' ? 'pill-lost' : 'pill-contacted'}`}>
                    {appt.status.toUpperCase()}
                  </span>
                </div>

                <div className="meta-row">
                  ⏰ <strong>{scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong> &nbsp;at&nbsp;
                  <strong>{scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>

                <div className="meta-row">
                  {appt.type === 'in_person' ? '🚶 In-Person Visit' : appt.type === 'phone_call' ? '📞 Phone Call' : '💬 WhatsApp Discussion'}
                  {biz?.id && (
                    <>
                      &nbsp;·&nbsp;{' '}
                      <EditablePhoneLink
                        phone={biz.phone}
                        businessId={biz.id}
                        businessName={biz.name}
                        onUpdated={fetchAppointments}
                        onToast={onToast}
                        logActivity={logActivity}
                      />
                    </>
                  )}
                </div>

                {biz?.address && (
                  <div className="meta-row">
                    📍 {biz.address}
                  </div>
                )}

                {appt.notes && (
                  <div style={{ marginTop: 12, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
                    💬 <em>"{appt.notes}"</em>
                  </div>
                )}

                <div className="card-actions" style={{ marginTop: 18 }}>
                  {appt.status === 'scheduled' && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
                        onClick={() => updateAppointmentStatus(appt.id, 'completed', biz?.name)}
                      >
                        ✓ Complete
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--amber)' }}
                        onClick={() => updateAppointmentStatus(appt.id, 'rescheduled', biz?.name)}
                      >
                        🔄 Reschedule
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--red)' }}
                        onClick={() => updateAppointmentStatus(appt.id, 'cancelled', biz?.name)}
                      >
                        ❌ Cancel
                      </button>
                    </>
                  )}

                  {biz?.address && (
                    <a
                      className="btn btn-ghost btn-sm"
                      href={getMapsUrl(biz.address, biz.name)}
                      target="_blank"
                      rel="noreferrer"
                      title="Google Maps directions"
                    >
                      📍 Maps
                    </a>
                  )}

                  <a
                    className="btn btn-ghost btn-sm"
                    href={getGcalUrl(appt)}
                    target="_blank"
                    rel="noreferrer"
                    title="Add to Google Calendar"
                  >
                    📅 GCal Sync
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
