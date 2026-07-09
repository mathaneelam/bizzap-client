import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead } from '../types'

interface Props {
  lead: Lead
  onUpdated: () => void
  onToast: (msg: string) => void
}

function buildClaudePrompt(lead: Lead): string {
  const b = lead.businesses!
  return `Write concise, credible website copy for "${b.name}", a "${b.category}" (${b.segment}) located in Tiruppur, Tamil Nadu.
Ground every claim in these facts — do not invent certifications, awards, or founding dates:
- Name: ${b.name}
- Category: ${b.category}
- Address: ${b.address || 'Tiruppur, Tamil Nadu'}
- Rating: ${b.rating}/5.0 based on ${b.review_count} reviews on Google Maps.

Return ONLY JSON matching this shape, no other text or markdown block wrappers:
{
  "tagline": "A single premium B2B or B2C tagline for this business",
  "hero_headline": "Bold, high-converting headline",
  "hero_sub": "Sub-headline elaborating on specializations",
  "about_body": "Detailed paragraph about their work, history, and commitment to quality.",
  "seo_title": "SEO Title (max 60 chars)",
  "seo_meta": "SEO Description (max 160 chars)",
  "blurbs": [
    "Short description (under 15 words) of product/service line 1",
    "Short description (under 15 words) of product/service line 2",
    "Short description (under 15 words) of product/service line 3"
  ]
}`
}

function scoreClass(score: number) {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-mid'
  return 'score-low'
}

function statusPillClass(status: string) {
  return `pill pill-${status}`
}

export default function LeadCard({ lead, onUpdated, onToast }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState(lead.copy_draft || '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const b = lead.businesses!
  const prompt = buildClaudePrompt(lead)

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      JSON.parse(draft) // validate JSON
    } catch {
      onToast('⚠️ Invalid JSON. Please paste the exact Claude response.')
      setSaving(false)
      return
    }
    const { error } = await supabase
      .from('leads')
      .update({ copy_draft: draft })
      .eq('id', lead.id)
    setSaving(false)
    if (error) {
      onToast('❌ Failed to save draft: ' + error.message)
    } else {
      onToast('✅ Copy draft saved to Supabase!')
      setShowModal(false)
      onUpdated()
    }
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-name">{b.name}</div>
            <div className="card-category">{b.category}</div>
          </div>
          <div className={`score-badge ${scoreClass(lead.score)}`}>
            <span className="score-num">{lead.score}</span>
            <span className="score-label">score</span>
          </div>
        </div>

        <div className="meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
          {b.address || '—'}
        </div>

        <div className="meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          {b.phone || '—'}
        </div>

        <div className="meta-row">
          ⭐ {b.rating?.toFixed(1) || '—'} &nbsp;·&nbsp; {b.review_count || 0} reviews
          &nbsp;·&nbsp; <span className={statusPillClass(lead.status)}>{lead.status.replace('_', ' ')}</span>
        </div>

        {lead.copy_draft && (
          <div className="meta-row" style={{ color: 'var(--green)', marginTop: 10 }}>
            ✓ Copy draft saved
          </div>
        )}

        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            {lead.copy_draft ? '✏️ Edit Copy Draft' : '📋 Generate Copy'}
          </button>
          {b.website && (
            <a className="btn btn-ghost btn-sm" href={b.website} target="_blank" rel="noreferrer">
              🌐 Website
            </a>
          )}
          <a
            className="btn btn-ghost btn-sm"
            href={`https://www.google.com/maps/place/${b.place_ref}/`}
            target="_blank"
            rel="noreferrer"
          >
            📍 GMB Link
          </a>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{b.name}</div>
            <div className="modal-sub">
              1. Copy the prompt below → 2. Paste into Claude.ai → 3. Copy the JSON reply back here
            </div>

            <p className="section-label">Claude Prompt</p>
            <div className="prompt-box">{prompt}</div>
            <div className="card-actions" style={{ marginTop: 0, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={handleCopyPrompt}>
                {copied ? '✅ Copied!' : '📋 Copy Prompt'}
              </button>
              <a className="btn btn-ghost btn-sm" href="https://claude.ai" target="_blank" rel="noreferrer">
                Open Claude.ai →
              </a>
            </div>

            <p className="section-label">Paste Claude's JSON Reply</p>
            <textarea
              className="textarea"
              placeholder={'{\n  "tagline": "...",\n  "hero_headline": "...",\n  ...\n}'}
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            <div className="card-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save to Supabase'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
