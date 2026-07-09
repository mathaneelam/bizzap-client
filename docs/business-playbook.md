# Bizzap Local Sites — Operating Playbook

**A productized website service for Tiruppur businesses on Google Maps.**
Team: 3 (part-time). Runs as a service line under Bizzap (reuse brand, `bizzap.app`, IG/rendering toolkit).

---

## 0. The one-line strategy

> We don't sell websites. We sell "get found and get inquiries" to businesses where a website converts to money — anchored on **Tiruppur garment manufacturers/exporters** (your credibility), with **local service shops** as volume underneath. We pre-build a real demo from their Google Maps data *before* we reach out.

Three non-obvious bets this plan makes:
1. **Niche the wedge, not the volume.** A website alone is weak value to a random shop. It's a *sales asset* to a manufacturer courting B2B/export buyers. Lead there.
2. **The demo is the pitch.** Pre-built demo site → "want to see it?" is the highest-converting web-design outreach that exists, and it's automatable.
3. **Recurring, not one-off.** Annual renewal + a small Google-Business retainer is what turns a side hustle into a compounding business.

---

## 1. Who we sell to

| Segment | Why a site converts for *them* | ACV | Notes |
|---|---|---|---|
| **Garment manufacturers / job-work units / exporters** *(anchor wedge)* | Credibility with B2B & export buyers: catalog, capacity, certs, factory photos, MOQ, enquiry CTA | ₹18k–25k + ₹5k/yr | Mathan's network → warm intros. Slower but higher trust & value. |
| **Local service businesses** *(volume)* — clinics, dental, gyms, tuition/coaching, salons, real estate, cafes/restaurants, boutiques | Get found on Google, look legit, one link for Instagram bio, WhatsApp/booking CTA | ₹5k–10k + ₹2.5–3.5k/yr | Faster cash. Thinner margin. Referral-driven. |

**Disqualify:** businesses with a decent existing site, no phone, near-zero reviews (not a real/active business), or price-shoppers who won't pay the productized rate.

---

## 2. The offer (productized — no custom quoting spiral)

Every package bundles the *outcome*, not just "a website": **site + Google Business Profile optimization + WhatsApp click-to-chat + domain/hosting**.

| Package | What's in it | Price | Annual renewal |
|---|---|---|---|
| **Starter** (local shop) | 1-page site, GBP optimization, WhatsApp button, domain + hosting | ₹4,999 | ₹2,499/yr |
| **Business** | 4–5 pages, gallery/catalog, contact form, basic SEO | ₹9,999 | ₹3,499/yr |
| **Manufacturer/Export** | Full product catalog, capacity/certs, bilingual, enquiry system, product-PDF export | ₹18k–25k | ₹4,999/yr |

**Add-ons (the recurring gold):**
- Monthly GBP posting + review-reply retainer — **₹1,500/mo** (this is the stickiness).
- Content writing, product photography, extra catalog uploads — per unit.

Collect **50% advance**. Renewal + retainer is where the real business lives — track it from client #1.

---

## 3. Internal operations (team of 3)

Roles blur, but **one accountable owner per function.**

| Person | Hat | Owns |
|---|---|---|
| **A — Closer/Field** *(Mathan: network, Tamil, trust)* | Discovery → close | Pipeline stages 0–6, walk-ins, warm intros, collections |
| **B — Builder/Ops** *(Sakthi: React)* | Delivery | Template system, deployment, hosting, tech QA |
| **C — Content/Coordinator** *(Kameswaran: CPO)* | Growth + admin | IG content, demo generation, intake, follow-up cadence, invoicing, renewals, CRM hygiene |

**Weekly rhythm:** 30-min Monday standup on one KPI board.

**Capacity math (the real constraint):** a templated site = ~4–6 hrs to assemble + fill content. One part-time builder ships **~5–8 sites/week**. *Sales must not outrun delivery.* Productize hard so build time stays flat.

**KPIs from day 1:** demos generated · outreach touches · demo→reply · reply→call · call→close · avg deal value · delivery time · **renewal rate**.

---

## 4. System / tech setup (keep it dead simple)

- **Template system, not custom builds.** One reusable component/theme library — 5–8 layouts × industry variants. Assemble, don't rebuild. Static site (Astro or Next static export, or a solid HTML/Tailwind kit). Reuse `bizzap-renderer`.
- **Hosting:** static → Cloudflare Pages / Netlify / Vercel free tier (near-zero marginal cost = high renewal margin). Domains at wholesale, charge retail.
- **Demo/staging:** `shopname.demo.bizzap.app` subdomains.
- **Intake:** one structured form (Tally / Google Form) → feeds content into the template.
- **CRM:** stay lightweight — **Google Sheet** (you already run Sheets tracking) or Notion. Stages, next action, owner, value. Don't buy a CRM.
- **Payments:** Razorpay / UPI QR / payment links.
- **Assets:** one Google Drive folder per client.
- **Comms:** one shared **WhatsApp Business number** for client servicing — *never* for cold outreach.

---

## 5. Customer discovery → close (the funnel)

| Stage | What happens | Owner |
|---|---|---|
| **0 · Source** | Pull Tiruppur businesses from Google Maps by category → name, category, phone, has-website, rating, reviews, address. Route A: Places API (free tier at low volume). Route B: Maps scraper (Bright Data / Apify) for the website flag. Modest volume, respect rate limits. | C |
| **1 · Qualify/score** | Filter: no-website OR bad site, has phone, real review count. Score by segment fit (manufacturer wedge = high). Ranked list → CRM. | C |
| **2 · Pre-build the hook** ⭐ | Auto-generate a real demo (or polished mockup) for top prospects from their Maps data (name, category, photos, hours, reviews). Deploy to subdomain. | B/C |
| **3 · First touch** *(compliant — see §6)* | **Field-first for Tiruppur:** walk in with the demo on a tablet. Warm intros for the manufacturer wedge. Personal 1-to-1 WhatsApp (low volume, not broadcast). Cold call in Tamil. IG DM after they engage. | A |
| **4 · Follow-up** | 3 touches / 11 days, different angle each time. Reminders automated — *sends stay human.* | A |
| **5 · Close** | Demo call or in-person. Productized price, no haggling. 50% advance + content via intake form. | A |
| **6 · Deliver** | Assemble from template, 48–72 hr turnaround, QA, go live, hand over GBP. | B |
| **7 · Retain/expand** | Renewal reminder, GBP retainer upsell, **referral ask** (Tiruppur is tight — referrals are the growth engine), turn the site into an IG case study. | C |

---

## 6. Automation strategy — automate the pipeline, keep the *send* human

The mistake to avoid: an "automated WhatsApp outreach bot." In 2026 cold bulk WhatsApp = quality-rating collapse or a permanent ban, and general-purpose AI bots are banned on the WhatsApp API. So:

| Step | Automate? | How |
|---|---|---|
| Lead sourcing | ✅ Full | Scraper/API → Sheet |
| Qualification & scoring | ✅ Full | Script |
| Demo generation | ✅ Full | Template + scraped data → deploy (Claude Code + `bizzap-renderer`) |
| Message personalization | ✅ Full | LLM drafts a per-prospect message from their data |
| **First-touch SEND** | ❌ **Human / semi-manual** | Walk-in, warm intro, or personal 1-to-1 message — low volume |
| Follow-up | ⚠️ Reminder only | CRM nudges the human; human sends |
| Intake / content collection | ✅ Full | Form → template |
| Site assembly | ⚙️ Semi-auto | Template + human QA |
| Invoicing / payment links | ✅ Full | Razorpay |
| Renewal reminders | ✅ Full | Sheet/calendar trigger |
| KPI reporting | ✅ Full | Sheet dashboard |

**Principle:** everything up to and after the trust moment is automated; the trust moment itself (first touch + close) is a human. Maximum leverage without the ban risk.

---

## 7. Instagram content

**Purpose:** (1) trust asset prospects check before buying, (2) inbound, (3) proof. Use your IG carousel skill + `bizzap-renderer`. Bio link → WhatsApp + a "get your free demo" form. Tamil + English.

**Content pillars (start: 3 reels + 2 carousels/week):**
- **Before / After transformations** — local site glow-ups. Most shareable; pure proof.
- **"We built a free demo for [Tiruppur business]"** reveal reels — doubles as outreach.
- **Micro-tips for local owners** — GBP optimization, getting more WhatsApp inquiries, photos that convert.
- **Speed-build / behind-the-scenes** — "site built in X hours."
- **Client testimonials** — face-to-camera in Tamil = huge local trust.
- **Tiruppur business spotlights** — goodwill, local reach, warms up future prospects.

**Reuse rule:** every demo you build = one post. The demo pipeline *is* your content pipeline.

---

## 8. First 90 days

**Weeks 1–2 — Build the machine.** Template system (5 layouts), pick hosting, CRM sheet, demo-subdomain pipeline, finalize the 3 packages, Razorpay links. Build **5 free demo sites for real local businesses** to seed Instagram and have proof.

**Weeks 3–4 — First blood.** Scrape 200–300 Tiruppur leads, score, generate 20–30 demos. Start walk-ins + warm intros. Target **first 3–5 paying clients.**

**Month 2 — Systematize.** Hit ~2–3 closes/week. Launch IG cadence. Start renewal/retainer tracking.

**Month 3 — Optimize.** Raise prices on the manufacturer wedge, build the referral loop, decide whether to add a part-time field/sales rep.

---

## 9. Unit economics (why this compounds)

Marginal cost per site ≈ domain (~₹700–1,000/yr wholesale) + static hosting (₹0) + ~5 hrs labor. Against ₹5k–25k deals + ₹2.5k–5k annual renewals + optional ₹1,500/mo retainers.

Near-zero infra cost → fast break-even. The **renewal + retainer base is the asset** — it grows every month you ship, independent of new sales. Ten clients on retainer ≈ ₹15k/mo recurring before a single new deal.

---

## 10. Honest risks & guardrails

- **WhatsApp:** cold bulk = ban in 2026. Automate up to the send; send human & low-volume; 3 touches max.
- **Maps scraping:** ToS gray area — keep volume modest, or use the official Places API within its free caps.
- **Delivery bottleneck:** if sales outruns build capacity, quality dies. Productize relentlessly; protect the builder's throughput.
- **Local-shop churn:** low-tier clients churn if they see no value. Tie the sale to a measurable outcome (inquiries) and use the GBP retainer for stickiness.
- **"Website alone" is weak:** always bundle GBP + WhatsApp CTA + an outcome.
- **Don't overengineer** (your own rule): templates, static, simple. 100 lines over 1,000.
