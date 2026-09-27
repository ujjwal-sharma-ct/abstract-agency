# Decisions Log

Append-only. Newest at the bottom. Records the *why* behind design/flow choices so a future
session doesn't relitigate them.

---

## 2026-07-31 — This repo optimizes for flow + continuity, not code quality

**Context:** These are directly-openable HTML mockups whose only job is to demonstrate the app's
UI/UX flow. Linting, formatting, and framework conventions add friction with no payoff here.

**Decision:** The AI kit tracks exactly two things — **flow integrity** (`scripts/check-flow.mjs`
regenerates `FLOWS.md` and flags dead links/orphans) and **continuity** (`PROGRESS.md` +
`DECISIONS.md`, updated by habit when screens change). No package.json, no prettier, no test
harness, no git hooks. Visual consistency is *guided* by the skills + `../DESIGN-SPEC-v4.md`, not
hard-gated.

**Consequences:** Fast to iterate; the flow map stays honest; nothing to install or run at commit time.

---

## 2026-08-18 — Detail screens are reached from their list, not from a notification

**Context:** Booking Detail was reachable only from a notification card; Candidate, Proposal,
Self-Bill Detail and Report Viewer were reachable from nowhere at all. Six screens were built,
populated and orphaned, while every list screen was a terminus.

**Decision:** A contextual screen's **parent is its list**. Notifications may deep-link to the same
screen, but never as the only route in. Row-level navigation follows the pattern the Vacancies list
already used — `onclick` on the `<tr>` for the whole-row target, plus an explicit anchor in an
`Actions` column so the row is reachable by keyboard. Where a row carries a second action with a
*different* destination (Vacancies `Propose`), that action stops propagation so the row's own
navigation can't hijack it.

**Consequences:** No orphans; `check-flow.mjs` passes clean. The Candidates table gains an `Actions`
column to hold its View affordance, matching Vacancies.

---

## 2026-08-18 — The prototype walks the emailed-link hop in the password reset

**Context:** Forgot Password's `Send Reset Link` went nowhere, and Set New Password — the screen the
emailed link would open — was an orphan with no way in and no way back to sign-in.

**Decision:** The prototype **walks the hop the user would take from their inbox**: Send Reset Link
lands on Set New Password after the simulated send, and the confirmation panel says explicitly that
this stands in for the email. Reset Password returns to Login with `?reset=1`, which shows a success
banner.

**Consequences:** The reset journey is demonstrable end to end and the orphan is gone. The tradeoff
is that the mockup shows a hop the real product routes through email — called out in the UI copy so
the prototype doesn't misrepresent the product.

---

## 2026-08-18 — A link to the wrong screen is worse than an honest dead link

**Context:** The Notifications screen's `New Vacancy Posted` card linked to **Branches**. Five other
cards pointed at `#`. `Notification Settings` also points at `#`, and its real target — a Settings →
Notifications tab — does not exist yet.

**Decision:** Wrong targets are bugs and were fixed. Dead links whose destination genuinely doesn't
exist yet are **left dead** rather than pointed at the nearest available screen. `Notification
Settings` stays `href="#"` until the Settings section is built.

**Consequences:** One deliberate `href="#"` remains on screen 18. It is a placeholder for missing
scope, not an oversight — retiring it is part of building the Settings section.

---

## 2026-08-18 — The bell opens a drawer; the page stays

**Context:** The header bell was an inert `<button>` on 18 of 19 screens. A full Notifications
screen already existed, and the client portal wires its bell to that screen on every page.

**Decision:** The bell opens a **slide-over drawer**, not the page. The drawer carries the latest
items with unread emphasis and per-item deep links; the **page stays** and keeps what a drawer
cannot hold — filters, grouping by day, and history. The drawer's footer links to both. Both use the
same item template so they never drift.

**Consequences:** One shared component injected into every in-app screen. The unread count is live
and drives the bell dot, so "mark as read" has a visible consequence in the chrome.

---

## 2026-08-18 — Agency Settings shows what Abstract owns, read-only

**Context:** The agency portal's settings tab bar advertised General Profile and Integrations with
no screens behind them, and the gear landed on Users & Roles — a leaf standing in for its section.
ONB-013 rules out agency self-configuration in MVP.

**Decision:** A Settings **home** owns the tab bar. The section is split by ownership rather than by
topic: **editable** — Branches (AM-002), Users & Roles (AM-004), Notification preferences (CFG-011),
My Account. **Read-only, labelled "Maintained by Abstract"** — General Profile, Compliance &
Accreditation, commercial terms. Read-only does not mean hidden: an agency must be able to see that
its insurance or self-billing agreement is about to lapse, because those gate its ability to trade
(ONB-010).

**Consequences:** Six tabs, all resolving. The read-only screens carry an explicit "contact your
Abstract account manager" affordance rather than disabled inputs with no explanation.

---

## 2026-08-18 — Actions a mockup cannot perform get a toast, not silence

**Context:** Download PDF, Export CSV, Print, Browse, Upload and Share have no meaningful
implementation in a static prototype. Left unwired they read as broken, which is exactly the defect
this round set out to remove.

**Decision:** Each resolves to a **toast** naming what would happen ("Download started — the file
will appear in your downloads"). Print calls `window.print()`, which genuinely works.

**Consequences:** No control in the portal is silent. The toast is honest about being a stand-in
rather than pretending a file was produced.

---

## 2026-08-18 — Roles are demonstrated, not just stored

**Context:** BRD §5.1 defines Agency Admin, Recruiter and Finance, and the Users screen assigns all
three — but every screen showed the same nav, so the roles had no design consequence.

**Decision:** A **role switcher** in the account menu applies the nav each role actually gets:
Recruiter loses Self-Bills, Reports and Settings; Finance loses Vacancies, Candidates, Proposals and
Settings. It is a prototype control, labelled as one.

**Consequences:** The access model is reviewable by clicking rather than by reading the BRD. The
choice persists per session so a reviewer can walk a whole journey in one role.

---

## 2026-08-18 — "Manage Booking" was scope the agency does not have

**Context:** Booking Detail offered `Manage Booking`, implying extend and cancel. BK-007/008 are not
agency rights; the agency's control is day-level scheduling on the timesheet (BK-018, TS-043/044).

**Decision:** Relabelled **Manage days on timesheet** and routed to Timesheets, with a note on the
screen drawing the boundary: dates, shift pattern and cancellation belong to Abstract; which days
the candidate is booked belongs to the agency, with client approval on future un-bookings.

**Consequences:** The button matches the permission. The note means a reviewer who expected
extend/cancel learns why it is absent instead of assuming it was missed.

## 2026-08-26 — An internal login is a door, not a landing page

**Context:** `21-…Agency Portal.html` was a 50/50 split: a form on the left, and on the right a
marketing column — "Enterprise VMS" badge, headline, three-item feature list, a decorative fake
dashboard, a legal strip — plus an SSO block offering Office 365 and Google. The Admin portal had
already been through this and stripped it back.

**Decision:** Replace it with a centred card on the brand gradient. Removed: the marketing column
(whoever is signing in already knows what the product is), the **SSO buttons** (not in scope —
email + password only; in the prototype both merely resolved to the dashboard anyway), and the
`A2`-chip wordmark in favour of `logo.png`. Kept: email, password with show/hide, keep-me-signed-in,
forgot-password, one primary action. The **two sibling auth screens** (`1-` Forgot Password,
`2-` Set New Password) were rebuilt on the same shell — they shared the split layout, and redesigning
only the sign-in screen would have split the auth journey across two visual languages.

**Consequences:** Auth is one coherent set of three screens. The portal has no SSO affordance; if
SSO returns to scope it comes back as a deliberate addition, not as decoration. Screen behaviour is
untouched — the reset journey, `?reset=1` banner, strength checker and enumeration-safe confirmation
all survive the reskin.

---

## 2026-08-26 — The sidebar brand block trades its fixed 64px header for a stacked logo

**Context:** All 25 in-app screens opened the sidebar with `h-16 flex items-center px-6` holding a
blue `A2` chip and the text "Abstractvms 2". A stacked `h-12` logo plus a portal label needs ~112px
and would overflow that fixed height.

**Decision:** Option A from `LOGIN-LOGO-HANDOFF.md` — drop `h-16 flex items-center`, use `px-6 py-5`,
and stack the `h-12` logo above an "Agency Portal" label, matching the Admin portal. Applied by a
**div-matching script**, not regex or hand-editing, because the old block had nested divs; the script
asserted tag balance on every file before writing.

**Consequences:** Nav starts ~48px lower; the sidebar already had `overflow-y-auto` and a bottom-pinned
account block, so nothing was cut off. The portal now reads as the same product as the Admin portal.

**Two traps inherited from the Admin pass, both avoided.** (1) The PNG has **5.57% transparent padding
on its left edge** — left-aligned placements need a negative left margin (`-ml-[5px]` at `h-12`) or the
artwork visibly floats inward from the label beneath it; centred placements need none, since left and
right padding differ by only 0.6%. (2) **No `mix-blend-mode`.** An earlier asset had a baked black
ground and needed `mix-blend-mode:screen`; this one is genuinely transparent (verified: 0 opaque dark
pixels), and that hack breaks the moment any ancestor creates a stacking context.

---

## 2026-09-26 — Slice 1 screens: kernel system, shared kit, "slice 1 mode" instead of stripping

**Context:** The slice 1 design brief (`Abstract-VMS-plan/docs/slices/1/design/DESIGN-BRIEF.md`)
asks for missing slice 1 screens and for corrections that remove later-slice content (KPI
dashboards, business units/branches, org-level overrides). This repo shows the *whole* product,
so deleting that content would lose the later slices' design.

**Decision:**
1. New slice 1 screens follow the kernel design system (`docs/kernel/design-tokens.md` §9): Inter,
   gradient sidebar, `bg-slate-100`, kernel badge buckets — in every portal, even where older
   screens still carry Sora/Manrope.
2. Shared prototype behaviour lives in `slice1-kit.js` (namespaced `S1`): state switcher for the
   six required states, Toast, ConfirmDialog, notification Drawer with unread count, background-job
   chip, session-timeout warning, signed-out banner. Only its top `S1_CONFIG` block differs per portal.
3. **Slice 1 mode** (Prototype menu, the Slice 1 Index page, or `?s1=1`) hides nav links that are
   not slice 1 screens and every element marked `data-s1-later`, and points Dashboard / `data-s1-home`
   links at the slice 1 placeholder dashboard. Later-slice content is tagged, not deleted. Only
   content wrong for the whole MVP was removed (data-access audit tiles, keep-me-signed-in, SSO,
   invite-with-roles, non-kernel status words).
4. `scripts/check-flow.mjs` treats the activation-email landing and the Slice 1 Index as entry
   points (they are reached from an email and as the demo start, not by a link).

**Consequences:** The full-product flow is unchanged; the slice 1 demo is one toggle away. Older
agency/client screens look different from the new kernel-styled ones until they are rebuilt.
