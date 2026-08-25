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

- 2026-08-18 — **Bands 2–4: shared shell components, six new screens, and states.** Follows the Band 1 wiring pass the same day.

  **New shared components, on all 25 in-app screens.** A **notification drawer** (`#notif-drawer`) — the header bell was an inert `<button>` on 18 of 19 screens; it now opens a right-hand slide-over with unread emphasis, per-item deep links, `Mark as read` / `Mark all read`, a live unread count that drives the bell dot, Esc-to-close, and a footer into the full Notifications page and preferences. An **account menu** in the sidebar footer — the portal had **no sign-out at all** (the strings never appeared in any file); the footer user block is now a menu with My account, Notification preferences, Settings and Sign out. A **branch switcher** replacing the static "Global Branch View" label, present on every screen (it was missing from nine). A **confirm dialog** (`openConfirm(key)`) that states each consequence in plain English, and a **toast** for actions a static mockup cannot really perform (downloads, uploads, share).

  **Six new screens.** `23` Settings / General Profile — the Settings home the gear now lands on, owning a six-tab bar; identity, contract and commercial terms shown **read-only and marked as Abstract-owned** (ONB-013). `24` Compliance & Accreditation — insurance and accreditation expiries plus the ONB-010 activation gates. `25` Notification Preferences — per-event email/in-app toggles (CFG-011); the Notifications page's settings link finally has a destination. `26` My Account — profile, password, 2FA, sessions, sign-out. `27` Integrations — the advertised tab, built rather than left pointing at `#`. `28` Search Results — the header search was decorative on all 19 screens; it now submits on Enter and the magnifier links in.

  **Band 4.** Empty states on all nine list screens (there were none anywhere), each explaining the agency-visibility rule that applies — preview any with `?empty=1`. Confirm dialogs on deactivate user/branch, withdraw proposal and acknowledge self-bill. Real kebab menus and a bulk-selection bar on Bookings (the checkboxes did nothing). Edit Candidate via the create wizard in an edit state (`?mode=edit`) rather than a second screen. A role switcher in the account menu that applies the nav each BRD §5.1 role actually gets. AWR tab placeholder replaced with the 9/12 week indicator (AW-012). Favourites on Reports made a real toggle. `Action Req` → `Pending` and `Expiring soon` → `Pending` (CP-006); `Distrubution` typo fixed.

  **Two scope calls, previously flagged as open.** `Manage Booking` on Booking Detail implied extend/cancel rights the BRD does not give agencies — relabelled **Manage days on timesheet**, routed to Timesheets, with the boundary explained on the screen (BK-018, TS-044). Login SSO buttons now resolve to the dashboard.

  **State:** 29 screens · `check-flow.mjs` reports **0 dead links, 0 orphans** · flow-critical dead controls **85 → 0**. Every file structurally clean (balanced tags, no unclosed containers).

- 2026-08-18 — **Band 1 of the flow audit: every list now reaches its detail screen.** The portal had six orphans and 85 flow-critical dead controls; the screens existed, nothing linked to them. Wired, with no new screens: **Candidates** rows + a new `Actions` column → Candidate Detail; **Proposals** `View Details` and **Vacancy Detail**'s My-Proposals `View` → Proposal Detail; **Bookings** `BKG-…` refs (were `href="#"`) → Booking Detail; **Self-Bills** rows + `View Detail` → Self-Bill Detail; **Reports** `Generate Report` → Report Viewer. The **propose journey** now runs end to end: `Propose` on the Vacancies row and `Propose Candidate` on Vacancy Detail → Create Proposal → `Submit Proposal` → Proposal Detail (row-click bubbling stopped with `event.stopPropagation()` so the row's own navigation can't hijack the button). **Notifications**: `New Vacancy Posted` pointed at *Branches* — retargeted to Vacancy Detail; the five remaining `href="#"` cards wired to Proposal Detail, Candidate Detail, Bookings List, Self-Bill Detail, Proposal Detail. **Auth loop closed**: Send Reset Link → Set New Password (the prototype walks the hop the user would take from their inbox; the confirmation panel says so) → Login with a `?reset=1` success banner. `FLOWS.md` now reports **0 dead links, 0 orphans**. Flow-critical dead controls: 85 → 57.

  Still open, by design — these are Bands 2–4 of the audit and need new components or screens, not wiring: the **notification drawer** (the header bell is still inert on 18 of 19 screens), **sign-out** (still absent portal-wide), a **Settings home** (the gear still lands on Users & Roles, and General Profile / Integrations still point at `#`), edit/deactivate modals on Users and Branches, Edit Candidate, empty states, confirm dialogs, and the branch switcher. `Notification Settings` on screen 18 is deliberately left dead — its target screen doesn't exist yet, and a link to the wrong screen is the failure mode this pass just removed.

- 2026-08-06 — **Per-shift role change — read-only view** (`22-Abstractvms 2 - Timesheets.html`). When the client/Abstract records a worked shift against a **different job role** than the worker's booked role (ad-hoc cover), that day cell is now **highlighted** here: purple ring + `fa-right-left` swap badge + the covered role's short name + a tooltip ("covering as FLT Driver — booked role: Forklift Operative"). Added a **"Role covered (different)"** legend entry. The agency view stays **read-only** — no edit affordance (agencies never enter hours/roles). Candidate `role` strings became `roleKey`s with a `ROLES` label map; seeded Grace Owusu's Wednesday as an FLT cover to demo it. Mirrors the client/admin change; see BRD TS-049–051 (v4.4) and `../DESIGN-SPEC-v4.md` §6.5. No flow/link changes.
- 2026-07-31 — Added the AI UX-flow kit (CLAUDE.md/AGENTS.md, `scripts/check-flow.mjs`, design skills, `FLOWS.md`). No screens changed.
