# Bizzap Local Sites — Technical Build Plan (₹0 Validation Edition)

The engineering blueprint, rebuilt around one constraint: **spend nothing until the model is proven.** No domain purchase, no credit card on file anywhere, no cloud server bill. Everything below runs free through the first paying clients — the only money that ever moves is a client's own domain, bought with *their* advance, not yours.

---

## 0. Design principles

1. **Sites are data, not code.** One renderer + one `site.json` per business. Never hand-code a site.
2. **Static output, always.** Every site (demo or production) is pre-built static HTML/CSS/JS. Cheapest possible hosting, fastest possible local SEO.
3. **One pipeline for demos and production.** Same `site.json`, same build — only the deploy target differs.
4. **Zero cost until revenue says otherwise.** Every tool below is free-tier, no-card-required. Section 14 lists exact triggers for when (if ever) to start paying for anything.
5. **No server to run or pay for.** Phase 0 is scripts on a laptop + git + a free static host. No EC2, no database bill, no monthly anything.
6. **Automate up to the human gate.** Scrape, score, generate copy, assemble, build, deploy — automated. First-touch send and demo approval stay human.

### What we deliberately do NOT build (yet)
- ❌ A hosted backend server / API (Phase 0 needs none — see §7).
- ❌ A paid database (SQLite file or a Google Sheet is enough at this scale).
- ❌ A custom CMS or drag-drop builder → `site.json` + git is the CMS.
- ❌ Bulk WhatsApp automation → compliance + simplicity; drafting is automated, sending is human.
- ❌ Any signup that asks for a credit card, even if it says "won't charge you."

---

## 1. The ₹0 stack at a glance

| Component | Zero-cost validation choice | Card required? | Upgrade later to… |
|---|---|---|---|
| Domain (ours) | **None needed.** Free `*.pages.dev` subdomain | No | `bizzap.app` (~₹700–900/yr) once branding matters |
| Demo hosting | Cloudflare Pages **free tier** | No | Same — never actually need to pay |
| Production hosting | Cloudflare Pages **free tier** (own project per client, client's own domain attached) | No | Pages Pro only if you exceed 100 projects (100+ clients) |
| Database | **SQLite file** (or Google Sheet for v0) | No | Postgres/RDS once the team needs concurrent multi-user writes |
| Backend/API | **None — local Python scripts** on a laptop | No | FastAPI service once the admin needs to run 24/7 or be multi-user |
| Lead sourcing | **Manual collection** from Google Maps (free) → self-hosted Playwright scraper if volume demands it | No | Bright Data subscription once manual/self-scraped sourcing is the bottleneck |
| Copy generation | **Claude.ai chat, manually** (copy prompt in, paste JSON out) | No (uses access you already have) | Claude API (pennies/demo) once you're generating dozens/week and want it automatic |
| Screenshots | **Playwright, local** | No | — |
| Admin/CRM | **Google Sheet** | No | React admin (Phase 3) once volume outgrows a sheet |
| Payments | **Razorpay** — free to set up, fee only on a captured payment | No upfront | — |
| Renderer/build | React + Vite, local `npm run build` | No | — |

**Net result:** you can build the renderer, source real leads, generate real demos, deploy them live at working URLs, message prospects, close a deal, and get paid — all before spending a single rupee or entering a card anywhere.

---

## 2. Core concept — sites as data (unchanged)

A website = one JSON file. The renderer is a pure function: `render(site.json) → static site`.

```
site.json  ──►  bizzap-renderer (React/Vite)  ──►  dist/  ──►  free static host
```

Any business's site is versioned in git, editable by hand or script, rebuildable in seconds. Content edits never touch code.

---

## 3. Data model

### 3.1 `site.json` schema (the central contract — unchanged from before)

```jsonc
{
  "schema_version": 1,
  "slug": "garment-manufacturer-tirupur",
  "template": "manufacturer",          // manufacturer | shop | clinic | food | services
  "meta": {
    "name": "Garment Manufacturer Tirupur",
    "category": "Garment Manufacturer",
    "tagline": "Export-quality knitwear from Tiruppur since 1998",
    "description": "…",
    "locale": ["en", "ta"]
  },
  "theme": {
    "preset": "navy",
    "primary": "#0A1628", "accent": "#1889F6",
    "font_head": "Montserrat", "font_body": "Inter",
    "logo": "assets/logo.png"
  },
  "contact": {
    "phone": "+919XXXXXXXXX", "whatsapp": "+919XXXXXXXXX",
    "email": "info@…",
    "address": "SIDCO Industrial Estate, Tiruppur, TN 641604",
    "geo": { "lat": 11.108, "lng": 77.341 },
    "hours": { "mon_sat": "9:30–18:30", "sun": "closed" },
    "gbp_url": "https://maps.google.com/…",
    "socials": { "instagram": "", "facebook": "" }
  },
  "sections": [
    { "type": "hero", "headline": "…", "sub": "…", "cta": "Get a quote", "image": "assets/hero.jpg" },
    { "type": "about", "body": "…", "stats": [{"k":"Since","v":"1998"},{"k":"Capacity","v":"50k pcs/mo"}] },
    { "type": "catalog", "items": [ {"name":"…","image":"…","moq":"…","desc":"…"} ] },
    { "type": "capabilities", "items": ["Knitting","Dyeing","Printing","GOTS certified"] },
    { "type": "gallery", "images": ["assets/g1.jpg","assets/g2.jpg"] },
    { "type": "testimonials", "items": [ {"quote":"…","by":"…"} ] },
    { "type": "contact", "form": true }
  ],
  "seo": {
    "title": "Sri Vinayak Cotsyn | Garment Manufacturer in Tiruppur",
    "meta_description": "…",
    "keywords": ["knitwear manufacturer tiruppur", "garment exporter"],
    "localbusiness_jsonld": true
  },
  "source": {
    "place_id": "manual-or-scraped-id",
    "scraped_at": "2026-07-09T10:00:00Z",
    "reviews_used": 12,
    "generated_by": "claude-manual",     // "claude-manual" in Phase 0, "claude-sonnet-5-api" later
    "human_approved": false
  }
}
```

### 3.2 Storage — SQLite, not Postgres (Phase 0)

A single file, `bizzap.db`, lives in the repo (or just outside it, gitignored). Same schema as a "real" database — swapping to Postgres later is a one-line connection-string change since you'll use SQLAlchemy either way.

```sql
CREATE TABLE businesses (
  id            INTEGER PRIMARY KEY,
  place_ref     TEXT UNIQUE,          -- Maps URL or manually assigned id
  name          TEXT NOT NULL,
  category      TEXT,
  segment       TEXT,
  phone         TEXT,
  website       TEXT,
  rating        REAL,
  review_count  INTEGER,
  address       TEXT,
  lat           REAL, lng REAL,
  raw           TEXT,                 -- JSON blob of everything collected
  scraped_at    TEXT
);

CREATE TABLE leads (
  id            INTEGER PRIMARY KEY,
  business_id   INTEGER REFERENCES businesses(id),
  score         INTEGER,
  has_website   INTEGER,              -- 0/1
  reason        TEXT,
  status        TEXT DEFAULT 'new',   -- new|demo_built|contacted|replied|call|won|lost|dnc
  created_at    TEXT
);

CREATE TABLE demos (
  id            INTEGER PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id),
  slug          TEXT UNIQUE,
  site_json_path TEXT,
  demo_url      TEXT,                 -- https://bizzap-demos.pages.dev/{slug}/
  screenshot    TEXT,
  approved      INTEGER DEFAULT 0,
  built_at      TEXT
);

CREATE TABLE clients (
  id            INTEGER PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id),
  package       TEXT,
  domain        TEXT,                 -- the client's own domain, bought by them
  site_json_path TEXT,
  live_url      TEXT,
  gbp_managed   INTEGER DEFAULT 0,
  onboarded_at  TEXT
);

CREATE TABLE deals (
  id            INTEGER PRIMARY KEY,
  client_id     INTEGER REFERENCES clients(id),
  amount        REAL,
  type          TEXT,                 -- build|renewal|retainer|addon
  status        TEXT DEFAULT 'sent',
  razorpay_id   TEXT,
  due_date      TEXT,
  paid_at       TEXT
);
```

**v0 shortcut:** if even SQLite feels like overhead in week one, run the `leads`/`demos` tables as a **Google Sheet** with the same columns, and have the pipeline scripts read/write it via the `gspread` library (free). Move to SQLite the moment two people need to touch data at once without stepping on each other.

---

## 4. Component 1 — Lead pipeline (no paid scraper, no billing account)

**Goal:** Tiruppur businesses → scored `leads`, ranked — without Bright Data and without a Google Cloud billing account (Places API technically has a free tier, but Google still requires a card on file to enable it — skip it for now).

### 4.1 Sourcing — two free routes

| Route | How | Cost | When to use |
|---|---|---|---|
| **Manual collection** *(start here)* | Open Google Maps, search each category + "Tiruppur," and copy name/category/phone/website-or-not/rating/review count into the Sheet by hand. | ₹0, no tools | First 20–40 leads. Genuinely fine — this is one afternoon of work and it's exactly how you'd qualify them anyway. |
| **Self-hosted scraper** | A small Playwright script (Python or Node) that opens Google Maps search results and extracts the same fields, run locally on a laptop, no subscription. | ₹0, your own compute | Once manual collection becomes the bottleneck (dozens → hundreds of leads/week). Keep volume modest and paced — this is a personal/internal tool, not a public service. |

Both feed the same `businesses` table — nothing downstream cares which route filled it in.

### 4.2 Qualify & score (unchanged logic)

```python
def score(b: dict) -> tuple[int, str]:
    if not b.get("phone"):                    return 0, "no phone"
    if (b.get("review_count") or 0) < 3:       return 0, "not an active business"
    s = 0
    s += 40 if not b.get("website") else 5     # no website = the whole point
    s += min(b.get("review_count", 0), 40)     # real, active business
    s += {"manufacturer":15,"clinic":10,"food":8,"services":6,"shop":5}.get(b.get("segment"), 0)
    s += 5 if (b.get("rating") or 0) >= 4.0 else 0
    return min(s, 100), "ok"
```

A plain Python script (`pipeline/score_leads.py`) reads `businesses`, writes `leads`, sorted by score — runnable with `python score_leads.py`, no server.

---

## 5. Component 2 — The renderer & templates (unchanged — this needs no money either)

```
renderer/
  src/
    Site.tsx                 # reads site.json, renders <SEO> + maps sections[]
    sections/                # Hero, About, Catalog, Gallery, Contact, …
    templates/                # manufacturer.ts, shop.ts, clinic.ts, food.ts, services.ts
    theme/tokens.css
    seo/LocalBusinessJsonLd.tsx
  vite.config.ts
```

- `Site.tsx` loads the injected `site.json`, applies theme tokens, renders `sections[]` in order.
- Always emits: responsive layout, SEO meta tags, **schema.org LocalBusiness JSON-LD**, a `wa.me` WhatsApp button, and a contact form.
- Build: `SITE_JSON=sites/garment-manufacturer-tirupur/site.json npm run build --prefix renderer` → `renderer/dist/`. Vite, npm, React — all free, local, no account needed.
- **Tests to write first:** schema validation against `site.schema.json`; one HTML snapshot per template; an SEO smoke test asserting `<title>`, meta description, and JSON-LD are present.

---

## 6. Component 3 — Demo generation pipeline (the killer move, now card-free)

Input: a qualified lead. Output: a live demo URL + screenshot, logged in `demos`.

```python
# pipeline/generate_demo.py — run locally, no server, no queue
def generate_demo(lead_id: int):
    b = fetch_business(lead_id)              # from SQLite/Sheet

    # 1) enrich — from whatever was collected manually/scraped: photos, hours, a few reviews
    details = enrich(b)

    # 2) generate copy — Phase 0: MANUAL Claude.ai chat, not the API
    #    Paste this prompt into claude.ai, paste the JSON reply back into copy.json:
    #
    #    "Write concise, credible website copy for [business]. Ground every claim in
    #     the reviews/details given. No hype, no invented facts, no fake certifications.
    #     Return ONLY JSON: {tagline, hero_headline, hero_sub, about_body, seo_title,
    #     seo_meta, blurbs: [3 short product/service descriptions]}"
    #
    copy = json.load(open(f"drafts/{b['slug']}_copy.json"))   # human pastes Claude's output here

    # 3) assemble site.json (template chosen by segment)
    site = assemble_site_json(b, details, copy, template=TEMPLATE_BY_SEGMENT[b["segment"]])
    validate(site, "schema/site.schema.json")   # fail fast — malformed json never ships

    # 4) build + deploy to the free demo project
    slug = site["slug"]
    build_static(site)                          # SITE_JSON=… npm run build
    deploy_demo(slug)                            # wrangler pages deploy → bizzap-demos.pages.dev/{slug}/

    # 5) screenshot for outreach + Instagram — Playwright, local, free
    shot = screenshot(f"https://bizzap-demos.pages.dev/{slug}/")

    save_demo(lead_id, slug, site, shot, approved=False)   # awaits 30-second human approval
```

**Why manual Claude.ai chat instead of the API in Phase 0:** the API is metered and requires a billing-enabled account (a card on file), which conflicts with "don't pay until proven." At your Phase-0 volume (a handful of demos a day), copy-pasting into claude.ai — which you already use — costs nothing extra and takes seconds per business. The `copy.json` drop-in point means switching to the API later is a five-line code change, not a rebuild.

**Ground copy in real facts, forbid invention** — this is what makes a demo credible instead of embarrassing, whether you're pasting manually or calling the API later.

---

## 7. Component 4 — Deployment & hosting (genuinely free, confirmed)

Cloudflare Pages free tier: **100 projects per account** (soft limit, raisable on request), each project gets **its own free `*.pages.dev` subdomain automatically** — no domain purchase, no card — plus **5 free custom domains per project**. No signup requires a credit card.

| Target | Setup | Cost |
|---|---|---|
| **Demos** | One Pages project, e.g. `bizzap-demos` → auto-URL `bizzap-demos.pages.dev`. Every demo deploys to a subpath: `bizzap-demos.pages.dev/{slug}/` | ₹0 |
| **Production (client sites)** | One Pages project **per client**, e.g. `garment-manufacturer-tirupur-site`. Gets a free `garment-manufacturer-tirupur-site.pages.dev` URL immediately. If/when the client wants their own domain, they buy it (~₹700–900/yr — bundled into the package price, funded by their 50% advance) and you attach it as a custom domain on their project — still free on your side. | ₹0 to you |

You can run **up to ~100 client sites** this way before ever contacting Cloudflare about a limit increase — far beyond where you'll be when you decide it's worth paying for anything.

```bash
# install once, free, no card
npm install -g wrangler

# deploy a demo (subpath convention handled by your deploy script)
wrangler pages deploy renderer/dist --project-name=bizzap-demos --branch=main

# deploy a client's production site (its own project)
wrangler pages deploy renderer/dist --project-name=garment-manufacturer-tirupur-site --branch=main
# then attach their domain in the Cloudflare dashboard → free custom domain slot
```

**If you ever do want your own brand domain** (e.g. `bizzap.app`, so demo links look like `demo.bizzap.app/{slug}` instead of `bizzap-demos.pages.dev/{slug}`) — that's a ~₹700–900/yr purchase you can make the day it feels worth it. Nothing in this architecture requires it; it's a pure branding upgrade, not a functional one.

---

## 8. Component 5 — Internal admin / CRM (Google Sheet first)

Run stages 1–3 in a **Google Sheet** — free, already familiar, multi-user by default:

| Sheet tab | Columns | Fed by |
|---|---|---|
| **Leads** | name, category, segment, phone, has_website, score, status | `score_leads.py` writes here (via `gspread`) or you paste manually |
| **Demos** | lead, slug, demo_url, screenshot, approved (checkbox) | `generate_demo.py` appends a row per demo |
| **Pipeline** | same rows, status dropdown (new → demo_built → contacted → replied → call → won) | updated by hand as the team works leads |
| **Clients** | client, package, domain, live_url, renewal_date, retainer? | filled at close |

This is the entire CRM until volume genuinely outgrows a spreadsheet — no reason to build the React admin (Phase 3 in the original plan) before that point.

---

## 9. Component 6 — Outreach tooling (compliant, still free)

Same rule as before, now doubly true since there's no infra to pay for: **automate drafting, keep sending human.**

```python
def draft_message(demo: dict) -> str:
    # Phase 0: paste this into claude.ai manually, same as the copy step —
    # or write it yourself in two lines, it's short enough not to need automation at all.
    prompt = (
        f"Write a short, warm first-touch WhatsApp message (under 45 words) for "
        f"{demo['name']} ({demo['category']}), mentioning we already built them a free "
        f"demo site, with the link: {demo['demo_url']}. No salesy opener."
    )
    return prompt   # human reviews, edits, sends themselves
```

The admin (Sheet) shows a **click-to-send** link:
```
https://wa.me/91XXXXXXXXXX?text=<url-encoded draft>
```
Sends from a person's own WhatsApp, one at a time, low volume, 3 touches max over ~11 days. For the manufacturer wedge, prefer warm intros and in-person demo walkthroughs over any messaging at all.

---

## 10. Component 7 — Payments (only real money in the whole system)

- **Razorpay:** free to create an account; you're charged only a small % when a payment is actually captured — never upfront, never for having the account open. This is the one external signup in the whole stack, and it costs nothing until someone pays you.
- Collect **50% advance** via a Razorpay Payment Link before any client-facing work starts. That advance is what funds the client's own domain purchase — you're never fronting money.
- Renewals: once you have a handful of clients, a simple script scans `deals.due_date` and generates a fresh Payment Link 30 days out. Runs manually (`python renewals.py`) until it's worth automating on a schedule.

---

## 11. Repo layout

```
bizzap-sites/
  CLAUDE.md                 # architecture, conventions, "do not build" list, cost rules
  renderer/                 # React/Vite site engine
  templates/                # segment presets
  schema/site.schema.json   # the site.json contract
  pipeline/                 # score_leads.py, generate_demo.py, deploy.py, screenshot.py
  drafts/                   # {slug}_copy.json — where pasted Claude output lands
  sites/<slug>/site.json    # per-business content + assets (git-versioned)
  bizzap.db                 # SQLite (gitignored) — or nothing, if using the Sheet
  infra/                    # wrangler.toml, deploy scripts
  tests/
```

Build it with Claude Code against `CLAUDE.md` — keep the "don't build yet" list in there so the agent doesn't reach for a server or a paid API by default.

---

## 12. Build sequence

| Phase | Deliverable | Definition of done | Cost |
|---|---|---|---|
| **P0a · Renderer** | `bizzap-renderer` consumes `site.json`; 5 templates; static build; schema + snapshot tests | Hand-write one `site.json`, build, deploy to `bizzap-demos.pages.dev/test/` | ₹0 |
| **P0b · Lead pipeline** | Manual/self-scraped sourcing → `businesses` (Sheet or SQLite) → scored `leads` | 30–50 real Tiruppur leads, ranked | ₹0 |
| **P0c · Demo pipeline** ⭐ | `generate_demo.py` end-to-end with manual Claude-copy step → live demo + screenshot | Pick a lead → live demo URL in a few minutes, awaiting approval | ₹0 |
| **P0d · Outreach + close** | `wa.me` draft-and-send flow, Sheet pipeline tracking, Razorpay payment link | First 3–5 paying clients, funded entirely by their own advances | ₹0 to you |
| **P1 · Prove it, then decide** | Once revenue is flowing: pick your own domain, consider Claude API, consider a scraper subscription, consider a real admin — only the pieces that are now the actual bottleneck | see §14 triggers | pay only what's justified |

P0a → P0c is the same critical path as before — it's just running on a laptop instead of a server, and using tools you already have instead of new subscriptions.

---

## 13. Tech stack summary

| Layer | Phase 0 (₹0) | Card/signup required? |
|---|---|---|
| Sourcing | Manual Maps lookup → self-hosted Playwright if needed | No |
| Data | SQLite file or Google Sheet | No |
| Copy generation | Claude.ai chat (manual copy/paste) | No |
| Renderer | React + Vite, local build | No |
| Screenshots | Playwright, local | No |
| Demo/prod hosting | Cloudflare Pages free tier (≤100 projects) | No |
| Domain | None — `*.pages.dev` free subdomains; clients buy their own | No (for you) |
| Outreach | Manually drafted/reviewed, sent via `wa.me` links | No |
| Payments | Razorpay — free account, fee only on captured payment | No upfront |
| Orchestration | Python scripts + Claude Code, run locally | No |

---

## 14. When (and only when) to start spending

Every upgrade below is optional and independent — do only the ones that are actually your bottleneck, and only once revenue is covering it.

| Trigger | What to add | Rough cost | Why then, not now |
|---|---|---|---|
| Manual lead sourcing takes longer than closing does | Self-hosted scraper matures into a scheduled job, or a Bright Data/Apify subscription | Metered, small | You're now sourcing-bound, not close-bound |
| Generating >10–15 demos/week by hand feels slow | Wire up the Claude API (`copy = claude_json(...)`) instead of manual paste | Cents per demo | The manual step is now the bottleneck, not proof-of-concept |
| >5 people need to edit the Sheet/DB at once, or it's getting unwieldy | Move SQLite → Postgres/RDS; build the React admin | A few hundred ₹/mo | Team coordination, not tooling, becomes the constraint |
| You want `demo.bizzap.app` links instead of `bizzap-demos.pages.dev` for brand polish | Buy `bizzap.app` | ~₹700–900/yr | Pure branding, first real revenue in hand |
| You pass ~100 active client Pages projects | Cloudflare Pages Pro, or self-host on EC2 | $5/mo (Pages Pro) | You'd need 100 paying clients first — good problem to have |

Nothing on this list is required to source leads, build demos, close a deal, or get paid. It's all upside spending once the model has already proven itself.
