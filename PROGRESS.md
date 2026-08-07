# Agency Portal mockups — current state

Static HTML UX-flow prototype for the VMS **Agency** portal ("Abstractvms 2", ~22 screens). Main areas:
auth (Forgot / Set Password, Agency Portal sign-in), Dashboard, Job Vacancies + Vacancy Detail,
Candidates (overview, detail, create), Proposals (management, create, detail), Bookings (list, detail),
Self-bills (overview, detail), Reports (overview, viewer), Notifications, Branches, User Management.

Each `.html` is openable directly; the click-path between them is the demonstrated flow (see `FLOWS.md`).

## Next Steps

- Run `node scripts/check-flow.mjs` to regenerate `FLOWS.md` and see the journey + any dead links/orphans.
- When adding/editing a screen: use `/new-screen`, wire it into the flow (link to and from it), then note it here.

## Log

- 2026-08-06 — **Per-shift role change — read-only view** (`22-Abstractvms 2 - Timesheets.html`). When the client/Abstract records a worked shift against a **different job role** than the worker's booked role (ad-hoc cover), that day cell is now **highlighted** here: purple ring + `fa-right-left` swap badge + the covered role's short name + a tooltip ("covering as FLT Driver — booked role: Forklift Operative"). Added a **"Role covered (different)"** legend entry. The agency view stays **read-only** — no edit affordance (agencies never enter hours/roles). Candidate `role` strings became `roleKey`s with a `ROLES` label map; seeded Grace Owusu's Wednesday as an FLT cover to demo it. Mirrors the client/admin change; see BRD TS-049–051 (v4.4) and `../DESIGN-SPEC-v4.md` §6.5. No flow/link changes.
- 2026-07-31 — Added the AI UX-flow kit (CLAUDE.md/AGENTS.md, `scripts/check-flow.mjs`, design skills, `FLOWS.md`). No screens changed.
