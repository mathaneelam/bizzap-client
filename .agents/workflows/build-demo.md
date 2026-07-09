---
description: Build a demo site end-to-end for one business (P0c pipeline)
---

When the user runs `/build-demo <business-slug-or-name>`, follow the
`demo-generation` skill exactly. In order:

1. Look up the business record by slug/name in the local DB or Sheet. If it
   doesn't exist yet, ask the user for the minimum fields (name, category,
   phone, address) before continuing.
2. Confirm which template applies (manufacturer / shop / clinic / food / services).
3. Produce the claude.ai copy prompt (per the skill's template) and STOP —
   output it clearly and ask the user to paste it into claude.ai and save the
   reply to `drafts/{slug}_copy.json`. Do not proceed until that file exists.
4. Once `drafts/{slug}_copy.json` is present, assemble `sites/{slug}/site.json`,
   validate it against `schema/site.schema.json`, and report any validation
   errors instead of forcing a deploy.
5. Build the renderer for that site, deploy to `bizzap-demos.pages.dev/{slug}/`
   via wrangler, take a screenshot with Playwright.
6. Report back: the live demo URL, the screenshot location, and a reminder
   that a human must review and approve before any outreach is sent.

Never skip step 3's pause. Never call a paid API as a substitute for it.
