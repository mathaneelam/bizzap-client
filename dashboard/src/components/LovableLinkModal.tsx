import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead, LogActivity } from '../types'

interface Props {
  lead: Lead
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string) => void
  logActivity?: LogActivity
}

function slugify(name: string): string {
  let slug = name
    .replace(/ /g, '-')
    .split('')
    .map(c => (/[a-z0-9-]/i.test(c) ? c.toLowerCase() : '-'))
    .join('')
  while (slug.includes('--')) slug = slug.replace(/--/g, '-')
  return slug.replace(/^-+|-+$/g, '')
}

export default function LovableLinkModal({
  lead,
  onClose,
  onUpdated,
  onToast,
  logActivity
}: Props) {
  const biz = lead.businesses!
  const slug = slugify(biz.name)
  const defaultUrl = `https://${slug}.lovable.app`

  const [lovableUrl, setLovableUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSaveLink() {
    const urlToSave = lovableUrl.trim()
    if (!urlToSave) {
      onToast('⚠️ Please paste a valid Lovable demo URL.')
      return
    }

    // Validate URL basic format
    try {
      new URL(urlToSave)
    } catch {
      onToast('⚠️ Invalid URL format. Please paste a full link (e.g. https://...lovable.app)')
      return
    }

    setSubmitting(true)
    try {
      // 1. Check if a demo row already exists for this lead
      const { data: existingDemo } = await supabase
        .from('demos')
        .select('id')
        .eq('lead_id', lead.id)
        .maybeSingle()

      if (existingDemo) {
        // Update existing demo with the new Lovable link
        const { error: updateErr } = await supabase
          .from('demos')
          .update({
            demo_url: urlToSave,
            slug,
          })
          .eq('id', existingDemo.id)

        if (updateErr) throw updateErr
      } else {
        // Insert new demo row
        const { error: insertErr } = await supabase
          .from('demos')
          .insert({
            lead_id: lead.id,
            slug,
            demo_url: urlToSave,
            approved: false
          })

        if (insertErr) throw insertErr
      }

      // 2. Update lead status to demo_built
      const { error: leadErr } = await supabase
        .from('leads')
        .update({ status: 'demo_built' })
        .eq('id', lead.id)

      if (leadErr) throw leadErr

      // 3. Log activity
      logActivity?.({
        action: 'lovable_demo_linked',
        entityType: 'demo',
        entityId: lead.id,
        entityLabel: biz.name,
        metadata: { demo_url: urlToSave }
      })

      onToast(`✨ Lovable demo linked for ${biz.name} & moved to Demos!`)
      onUpdated()
      onClose()
    } catch (err: any) {
      onToast('❌ Failed to save Lovable link: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">✨ Paste Lovable Demo Link</div>
        <p className="modal-sub">
          Link your Lovable web app demo for <strong>{biz.name}</strong> ({biz.category})
        </p>

        <p className="section-label">Lovable Demo Website URL</p>
        <input
          type="url"
          className="textarea"
          style={{ minHeight: 'unset', padding: '12px 14px', marginBottom: 12, fontFamily: 'monospace', fontSize: 14 }}
          placeholder="Paste Lovable link (e.g., https://your-demo.lovable.app)"
          value={lovableUrl}
          onChange={e => setLovableUrl(e.target.value)}
          autoFocus
        />

        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
          💡 <strong>Tip:</strong> Copy the published or preview link directly from your Lovable dashboard (e.g. <code>{defaultUrl}</code>) and paste it here. It will embed live on the Demo screen.
        </div>

        <div className="card-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSaveLink} disabled={submitting}>
            {submitting ? 'Saving Link...' : '🚀 Save & Move to Demos'}
          </button>
        </div>
      </div>
    </div>
  )
}
