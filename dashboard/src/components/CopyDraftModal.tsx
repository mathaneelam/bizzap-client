import { useState } from 'react'
import { supabase } from '../supabase'
import type { Lead } from '../types'

interface Props {
  lead: Lead
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string) => void
}

export function buildClaudePrompt(lead: Lead): string {
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

export default function CopyDraftModal({ lead, onClose, onUpdated, onToast }: Props) {
  const [draft, setDraft] = useState(lead.copy_draft || '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const b = lead.businesses!
  const prompt = buildClaudePrompt(lead)
  const isRegen = !!lead.copy_draft

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
    const nextCount = (lead.gen_count ?? 0) + 1
    const { error } = await supabase
      .from('leads')
      .update({ copy_draft: draft, gen_count: nextCount })
      .eq('id', lead.id)
    setSaving(false)
    if (error) {
      onToast('❌ Failed to generate: ' + error.message)
    } else {
      onToast(isRegen ? `🔄 Website re-generated (×${nextCount})!` : '🌐 Website generated!')
      onClose()
      onUpdated()
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
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
            {saving ? 'Generating…' : (isRegen ? '🔄 Re-Generate' : '✨ Generate')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
