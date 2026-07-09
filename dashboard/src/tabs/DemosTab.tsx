import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Demo } from '../types'

interface Props {
  onToast: (msg: string) => void
}

export default function DemosTab({ onToast }: Props) {
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDemos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('demos')
      .select('*, leads(*, businesses(*))')
      .order('built_at', { ascending: false })

    if (error) {
      onToast('❌ Failed to load demos: ' + error.message)
    } else {
      setDemos(data as Demo[])
    }
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
      fetchDemos()
    }
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
                {demo.demo_url && (
                  <a className="btn btn-primary btn-sm" href={demo.demo_url} target="_blank" rel="noreferrer">
                    🔗 View Demo
                  </a>
                )}
                {biz?.place_ref && (
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`https://www.google.com/maps/place/${biz.place_ref}/`}
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
    </div>
  )
}
