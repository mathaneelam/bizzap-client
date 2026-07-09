# Handing this off to Antigravity

This folder is a ready-to-open Antigravity project. Everything Antigravity
needs to understand the plan is already in here — you're not explaining the
project from scratch, you're pointing the agent at it.

## 1. Get the folder onto your machine

Download this whole `bizzap-antigravity-handoff` folder and put it wherever
you keep projects, e.g. `~/projects/bizzap-local-sites/`. Rename the folder
if you like — Antigravity doesn't care about the name.

**Recommended: turn it into a git repo first**, even a local one with no
remote yet — Antigravity works best with git initialized, and it can commit
incrementally as it builds.
```bash
cd ~/projects/bizzap-local-sites
git init
git add .
git commit -m "Initial handoff: planning docs, AGENTS.md, schema, skills"
```

## 2. Open it as an Antigravity project

Open Antigravity → **+ Open Workspace** → point it at this folder. Antigravity
will auto-detect `AGENTS.md` at the root and `.agents/skills/` /
`.agents/workflows/` inside it — no manual configuration needed. (If your
Antigravity version is older than 1.20.3 and doesn't pick up `AGENTS.md`
automatically, open **Customizations → Rules → + Workspace** and point it at
`AGENTS.md` manually.)

## 3. What's in here and why

| File/folder | Purpose |
|---|---|
| `AGENTS.md` | The always-on rules file — condensed architecture, the ₹0 constraint, build order, repo layout. Antigravity reads this at the start of every session. |
| `docs/business-playbook.md` | Full go-to-market plan — read for *why*, not *how*. |
| `docs/technical-plan.md` | Full technical architecture — read for implementation depth `AGENTS.md` doesn't spell out. |
| `schema/site.schema.json` | The `site.json` contract — every generated site must validate against this. |
| `.agents/skills/demo-generation/SKILL.md` | Loads automatically when a task matches "build/generate a demo" — the exact 10-step pipeline. |
| `.agents/workflows/build-demo.md` | Lets you type `/build-demo <business>` instead of re-explaining the pipeline each time. |
| `sites/`, `renderer/`, `pipeline/`, `drafts/`, `infra/`, `tests/` | Empty on purpose — Antigravity builds into these per the P0a→P0d sequence in `AGENTS.md`. |

## 4. Your first prompt

Don't ask it to "build the whole thing" in one shot. Start narrow, per the
build order already in `AGENTS.md`:

```
Read AGENTS.md and docs/technical-plan.md section 5 (the renderer).
Then produce an Implementation Plan for P0a: the bizzap-renderer —
React + Vite, 5 templates, reads site.json, static build. Don't write
any code yet, just the plan — I want to review it first.
```

Let it produce the Implementation Plan artifact, review it (this is the
"Artifacts" review step Antigravity is built around — comment on it like a
Google Doc if something's off), approve, then let it build. Repeat for P0b,
then P0c using the skill/workflow that's already set up.

## 5. Guardrail to watch for

If at any point Antigravity's agent proposes adding a paid API key, a
database service, or a hosting upgrade — that's `AGENTS.md`'s "ask before
spending" rule doing its job if it stops and asks you first. If it doesn't
stop and just does it, that's worth flagging to it directly: point it back at
the "₹0 until proven" section of `AGENTS.md`.
