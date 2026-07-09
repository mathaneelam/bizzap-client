---
name: demo-generation
description: Use this skill whenever the task involves generating a demo website for a business — building a site.json from business data, running the manual-copy handoff, building/deploying to Cloudflare Pages, or anything in the P0c "demo pipeline" milestone from AGENTS.md.
---

# Skill: Demo Generation Pipeline

This skill encodes the exact sequence for turning one qualified lead into a
live, screenshotted demo — the core product loop of Bizzap Local Sites.

## When to use this

Any request like: "generate a demo for [business]", "build the demo pipeline",
"deploy this site.json", "add a new business", or work inside `pipeline/generate_demo.py`.

## The sequence (do not skip or reorder steps)

1. **Load the business record.** From SQLite (`bizzap.db`) or the Google
   Sheet — must have at minimum: name, category, phone, address, and ideally
   a few review snippets and hours. If any required field is missing, stop
   and ask rather than inventing it.

2. **Pick the template by segment.**
   `manufacturer | shop | clinic | food | services` — see
   `docs/technical-plan.md` §5 for the section-order defaults per template.

3. **Copy generation — HUMAN STEP, not automated.** Do not call any LLM API
   for this. Instead:
   - Generate the exact prompt to paste into claude.ai (grounded in the real
     business data — see the prompt template below).
   - Tell the human to paste it into claude.ai chat, then paste the JSON
     reply into `drafts/{slug}_copy.json`.
   - Wait for that file to exist before continuing. Do not proceed with
     placeholder copy.

   **Prompt template to hand to the human:**
   ```
   Write concise, credible website copy for [business name], a [category] in
   Tiruppur, Tamil Nadu. Ground every claim in these facts — do not invent
   certifications, awards, or founding dates: [paste business facts + any
   review snippets here].

   Return ONLY JSON matching this shape, no other text:
   {
     "tagline": "...",
     "hero_headline": "...",
     "hero_sub": "...",
     "about_body": "...",
     "seo_title": "...",
     "seo_meta": "...",
     "blurbs": ["...", "...", "..."]
   }
   ```

4. **Assemble `site.json`.** Merge business data + `drafts/{slug}_copy.json`
   into the schema at `schema/site.schema.json`. Populate `contact`, `sections`,
   `seo`, and `source` (set `generated_by: "claude-manual"`,
   `human_approved: false`).

5. **Validate.** Run schema validation. If it fails, fix the `site.json` — never
   deploy an invalid file.

6. **Build.** `SITE_JSON=sites/{slug}/site.json npm run build --prefix renderer`

7. **Deploy to the free demo project.**
   ```bash
   wrangler pages deploy renderer/dist --project-name=bizzap-demos --branch=main
   ```
   The demo project serves all businesses as subpaths of one free
   `bizzap-demos.pages.dev` — do NOT create a new Pages project per demo (save
   the per-project quota for paying clients' production sites).

8. **Screenshot.** Playwright, headless, against the live demo URL. Save for
   outreach drafts and Instagram content — this doubles as marketing material.

9. **Log it.** Write a row to the `demos` table/sheet: slug, demo_url,
   screenshot path, `approved: false`.

10. **Stop — do not draft outreach or mark it approved.** A human reviews the
    demo (30 seconds, checking for hallucinated copy, wrong images, broken
    layout) before anything is sent to the business. That approval step is
    intentionally manual — see AGENTS.md "ask before spending" / quality gate.

## Guardrails specific to this skill

- Never fabricate a fact not present in the source business data.
- Never call a paid API to generate copy, even if it would be faster — this
  is a deliberate cost + quality gate, not a temporary limitation.
- Never deploy a `site.json` that fails schema validation.
- Never create more than one Cloudflare Pages project for demos — subpaths
  under `bizzap-demos` only, to stay well inside free-tier project limits.
