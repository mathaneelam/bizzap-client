# AGENTS.md — Bizzap Local Sites

You are building **Bizzap Local Sites**: a system that generates real, live demo
websites for Tiruppur (Tamil Nadu, India) businesses found on Google Maps, then
sells production versions. Full business context: `docs/business-playbook.md`.
Full technical architecture: `docs/technical-plan.md`. Read both before planning
any non-trivial task — this file is the condensed, always-on summary.

## Non-negotiable constraint: ₹0 until proven

**Do not introduce any tool, service, or library that requires a credit card or
paid signup**, even ones with a "free tier." This includes: Google Cloud /
Places API billing, Anthropic/OpenAI API keys, Bright Data or any paid scraper,
any hosting plan above free tier, any database-as-a-service with a paid floor.
If a task seems to need one of these, stop and propose the free alternative
below instead of proceeding.

If you're unsure whether something costs money, ask before adding it.

## Core architecture principle

**Sites are data, not code.** One renderer + one `site.json` per business.
`render(site.json) → static HTML`. Never hand-code an individual business's
site. A demo and a paid production site are the *same* build from the *same*
`site.json` schema — only the deploy target differs.

## The ₹0 stack (use exactly this, nothing else, until told otherwise)

| Need | Use | Do NOT use (yet) |
|---|---|---|
| Renderer | React + Vite, static build | Next.js SSR, any server-rendered framework |
| Hosting (demos + production) | Cloudflare Pages free tier — one project per client, auto `*.pages.dev` subdomain | Vercel/Netlify paid tiers, Pages Pro, EC2 |
| Database | SQLite file (`bizzap.db`) or a Google Sheet | Postgres/RDS, any hosted DB |
| Backend | None — local Python scripts run on demand | A deployed FastAPI server, any always-on service |
| Lead sourcing | Manual entry from Google Maps, or a local Playwright scraper | Bright Data, Places API (needs a billing account) |
| Copy generation | Human pastes a prompt into claude.ai chat, pastes JSON back into `drafts/{slug}_copy.json` | Claude API / any metered LLM API call |
| Screenshots | Playwright, local | Any paid screenshot API |
| Payments | Razorpay (free to set up; fee only when a payment is captured) | — |

See `docs/technical-plan.md` §14 for the exact triggers for when it's OK to
introduce a paid tool later (e.g. "generating >15 demos/week by hand feels
slow" → wire up the Claude API). Don't pre-empt those triggers.

## Repo layout

```
renderer/       React/Vite site engine — reads site.json, renders static HTML
schema/         site.schema.json — validate every site.json against this
pipeline/       score_leads.py, generate_demo.py, deploy.py, screenshot.py
drafts/         {slug}_copy.json — human-pasted Claude output lands here
sites/<slug>/   site.json + assets, one folder per business, git-versioned
infra/          wrangler.toml, deploy scripts
tests/          schema validation, render snapshots, SEO smoke tests
docs/           the full business + technical plans — read these for depth
```

## Build order — work through these in sequence, don't skip ahead

1. **Renderer (P0a).** `bizzap-renderer`: 5 templates (`manufacturer`, `shop`,
   `clinic`, `food`, `services`), reads `site.json`, emits static HTML with SEO
   meta tags, `schema.org LocalBusiness` JSON-LD, and a `wa.me` WhatsApp
   button. Write schema validation + render snapshot tests first.
2. **Lead pipeline (P0b).** `score_leads.py` — takes manually-collected or
   scraped business records, scores them (see scoring function in
   `docs/technical-plan.md` §4.2), writes ranked leads to SQLite/Sheet.
3. **Demo pipeline (P0c) — the core deliverable.** `generate_demo.py`:
   assemble a `site.json` from business data + the human-pasted copy draft →
   validate against schema → build static → deploy to
   `bizzap-demos.pages.dev/{slug}/` via `wrangler` → screenshot → mark
   `approved: false` pending human review.
4. **Outreach + payments (P0d).** Draft-message helper (produces a prompt/text
   a human reviews and sends via a `wa.me` link — never auto-send), Razorpay
   payment link generation.

Do not build the React admin dashboard, a hosted backend, or any automated
outreach-sending until explicitly asked — see "what we deliberately do not
build yet" in `docs/technical-plan.md` §0.

## Working style

- **Plan before code.** For anything beyond a trivial fix, produce an
  Implementation Plan artifact and wait for approval before writing files.
- **Surgical edits.** Touch only what's needed for the current task. Don't
  refactor or "improve" unrelated code.
- **Ground generated copy in real data.** Any business copy (in `drafts/` or
  assembled into `site.json`) must be based on the actual scraped/entered
  facts — never invent certifications, awards, or founding dates.
- **Validate before deploy.** Every `site.json` must pass `schema/site.schema.json`
  validation before a build is triggered. Fail loudly, never ship malformed data.
- **Ask before spending.** Any step that would require a card, a paid signup,
  or exceeding a free-tier limit — stop and ask first.

## Full-Stack Transition (Step 2)

Once a client approves their static HTML demo and converts to a paying client:
- **Core generator remains clean**: Do not add client-specific backend code to the main `pipeline/` or `renderer/` folders. Keep the core generator dedicated only to sourcing leads and generating first-touch demos.
- **Move code on Close**: Initialize their full-stack app inside `sites/{slug}/`. If the codebase gets too large or they want ownership, you can easily initialize a new git repository in `sites/{slug}/` and push it to their private GitHub account for handover.
- **Template the Backend**: Use the serverless templates (e.g. `infra/templates/fullstack-worker-db`) containing a simple Cloudflare D1 SQLite database + Hono API to deploy their database features. Keep hosting costs at ₹0 using Cloudflare Workers and D1 free tiers.

## Team

Mathan (Founder — closer/field, final approval), Sakthi (CTO — builder/ops,
primary reviewer of your Implementation Plans), Kameswaran (CPO — content/
coordination). All work happens in Tiruppur, Tamil Nadu, India context —
bilingual (Tamil/English) content is a plus where noted in `site.json.meta.locale`.
