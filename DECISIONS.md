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

## 2026-10-10 — Slice 2: agency pages carry only what the agency may see

**Context:** TSD 2.8 TV-9 allows no margin basis, figure or sentence in the agency portal's markup, and the old profile export showed the margin basis.

**Decision:** The agency pages are generated from a data set scoped to the agency's own organisation (other organisations appear only by name where a link names them), and the contract card shows payment terms and the self-billing agreement only. The *Visibility Confirmed* banner reads "You see your pay rates only" and nothing else.

**Consequences:** A grep for margin, charge, spread and base pay over the agency pages returns nothing.

## 2026-10-11 — Two-step verification: one page for set-up and backup codes, three steps, no self-service way off

**Context:** Slice 1 brief A9–A12 left the arrangement of the enrolment steps, the handling of backup codes and the recovery wording to the designer. The contract (TSD §3.1.13) fixes the rest: TOTP only, ten backup codes shown once, no trusted devices, no switching off, a reset that only Abstract can perform.

**Decision:** (1) `/{portal}/account/two-factor` is one page in the shell, not a dialog: off, set-up and on are states of the same page, so the required-by-policy landing and the My account link arrive at the same place. (2) Set-up is three steps, not the brief's four: scanning the code and confirming it share a screen, because the person looks from phone to screen once and the key for manual entry sits beside the field it feeds. (3) Backup codes are never listed again; the page offers only *Create new codes*, behind the password and a warning that the old set stops working. Copy, download and print are all offered. (4) When the policy requires it and the person has not set it up, the shell keeps its frame but offers no navigation, since every other route returns here. (5) The sign-in step is a single field with a link to switch to a backup code; a page for the ended step (`AUTH_TWO_FACTOR_CHALLENGE_EXPIRED`) was added from the error registry, though the brief does not list it. (6) On Users, two-step status is a second line under the status badge, not a column, so the table still fits at 1024 px; client and agency lists show the status and no action. (7) User-facing copy says *two-step verification*, following the TSD's quoted strings.

**Consequences:** A person who changes phone must ask Abstract for a reset, and the page says so before they turn it on. The QR codes are static SVG for a demo secret, so the pages need no extra library. The prototype remembers "on" per browser, which makes the TV-13 walk (set up, sign out, sign in with a code) demonstrable end to end.

## 2026-10-11 — Two-step reset: the organisation's own administrators first, never your own, two confirmations

**Context:** The screens delivered for slice 1 brief A12 gave the reset to Abstract alone, as the TSD then said. On 2026-10-11 Ujjwal Sharma ruled the four points those screens left open (slice 1 TSD R-39).

**Decision:** (1) A holder of *Reset two-step verification* resets a user of their own organisation; Abstract resets from the administering context when nobody there can. The action is on all three Users pages. (2) It is never on the signed-in person's own row: a reset always takes a second person, so it cannot become a way of switching two-step verification off for yourself. (3) The confirmation says what follows by the organisation's policy: set up again at next sign-in where it is required, off until turned on where it is not. The prototype shows one organisation of each kind. (4) The recovery copy sends a person to an administrator at their own organisation, who asks Abstract if they cannot. (5) No enrolment date and no count of unused backup codes is shown.

**Consequences:** A sole administrator who is locked out, or who changes phone, needs Abstract. The earlier decision entry of the same date ("no self-service way off") stands; its sentence that a person who changes phone must ask Abstract now reads "an administrator at their organisation, or Abstract".

## 2026-10-11 — User detail: the row's actions on a page of their own; Forgot password shows its confirmation

**Context:** The slice 1 TSD has the route `/{portal}/settings/users/:id` and a *User detail* UI-state row (§3.3.11, §5.9), and no portal had the page; Ujjwal Sharma ruled on 2026-10-11 to draw it. The same day's batch added the reset-request page where it was missing (TSD §5.8, 1.8 TV-3).

**Decision:** (1) The detail page is the Users page's shell, dialogs and action code with the list swapped for one person, so its actions are the row's actions by construction: same labels, same order, same confirmations, same last-administrator refusal. They sit in one *Actions* card, beside the record on a wide screen and directly under the name on a phone. (2) Two-step status is a card of its own that says on, off or not set up, and what a reset leads to under the organisation's policy; no enrolment date and no count of backup codes (R-39). On your own record there is no reset, and the card says why. (3) Out of scope is a 404 inside the shell whose copy never says whether the person exists. (4) Slice 2's parts (Scope, *Set scope*, *Change email*, a pending email change) are marked `data-s1-later` or left out by the action list in *Slice 1 only*. (5) The row's name is the link; generated rows in the *Large data* state and a person invited a moment ago are plain text, because the prototype has no record for them. (6) Forgot password stops on its confirmation, which is the state TV-3 tests, and offers the emailed-link hop as a marked *Prototype only* link instead of walking it after a second. The agency's older Forgot password page still walks the hop (decision of 2026-08-18); it was not redrawn. (7) The full-product My Account carries the Two-step verification row from Profile in place of its two-factor card, because the contract allows no switching off and never lists the codes again (TSD §3.1.13).

**Consequences:** A change to a row action must be made on both pages. An `Invited` user has no email correction on the detail page because the row has none; the TSD lists one for both (open point in `PROGRESS.md`).

## 2026-10-11 — One set of role names, one signed-in person, and slice 2 parts that follow the mode

**Context:** Checking the day's first batch showed five things that were already wrong: slice 2 parts visible in *Slice 1 only*, role names that differed between Users and the matrix, permission counts that differed between portals, older pages signed in as a different person described by a role title, and no email correction for an `Invited` user although the TSD lists one. Ujjwal Sharma ruled each on 2026-10-11.

**Decision:** (1) Sample roles carry the TSD's seed names (§3.3.4) plus one custom role per party, with one set of ids across Users, User detail and the matrix. (2) Abstract's view of a party's roles and keys is a copy of that party's own matrix; no matrix was redrawn onto the TSD's key list. (3) The older full-product pages show the same signed-in person as the slice 1 pages, with his organisation under his name. The *View as role* control of 2026-08-18 stays, as a labelled prototype control that lists role records by name; the identity line no longer repeats the role. (4) A static slice 2 part carries `data-s1-later`; a part drawn by script asks the mode when it draws and is redrawn on the kit's `s1:mode` event, because the kit hides marked elements only at the moment the mode is applied. (5) *Correct email* is its own action and dialog for an `Invited` user, separate from slice 2's *Change email* for an `Active` user: a correction takes effect at once and sends a new activation link, a change waits for the person to confirm it.

**Consequences:** The prototype's key lists still differ from the TSD's twelve slice 1 keys per party; that is a contract gap for a later pass, recorded in `PROGRESS.md`.

## 2026-11-13 — Design audit: withdrawn change email, backup codes as built (Ujjwal Sharma)

- *Change email* is removed (slice 2 R-33 withdrew it; only *Correct email* for an Invited user is built). The confirm-email page is kept, marked withdrawn, with no inbound link.
- Backup codes: *Copy codes* and *I've saved these* only, as built; Download and Print dropped.
- Design passes keep the existing look (AGENTS.md, ruling of 2026-11-12).

## 2026-11-15 — Slice 5: the agency's operational pages restyled in their own look, data from the shared slice 5 store

**Context:** Slice 5 builds the agency's operational pages (TSD 5.8). The agency's versions of them are the older full-product exports, which keep their own look (DESIGN-BRIEF *Keep the existing look*, AGENTS.md).

**Decision:** (1) Each page keeps its export's shell, cards and chrome; a script draws its records from `S5` into the same markup in slices 1 to 5 and the full product, and the export's static rows stay in the file. Parts slice 5 does not build are `data-s5-later` (full product only), never deleted. (2) The propose step is the existing *Create Proposal* page, reached from Vacancy Detail with `?vacancy=`; refusals show as a banner above the form, a candidate refusal under the picker. (3) `AgencyBookingWeeks` is a new card on Booking Detail: one row per day (day, status, hours and Shift, the absence with its confirmation, and pay only on an invoiced week); the export's weeks list stays as the full product's. The export's *Absence Confirmation* card now lists the booking's requested and justified days and holds the Justify panel. (4) Payroll and Pay Statement are new pages built from the Self-Bills page's shell. (5) The kit adds Payroll after Bookings (s5 and full) and puts Proposals before Candidates in s5 only, so the full product's menu order is as before. (6) ProposalStatusBadge and the confirmation badges use the pass's buckets (`Rejected (Position Filled)` closed/archival with user-check; `Requested (awaiting agency)` waiting; `Justified` good terminal); since these pages' Tailwind config flattens blue and purple, `slice5-agency.js` supplies the badge colours as plain CSS. (7) The agency has no s3/s4 mode: a stored `s3`/`s4` from another portal still reads as the full product here.

**Consequences:** In the full product Booking Detail shows both the new day view and the export's weeks list. The notification drawer on the older pages still carries the export's sample items.

**Addendum (same day, layout at 1024 px):** the slice 5 lists (Released Vacancies, My Proposals, Candidates, Bookings, Payroll) show their table from 1280 px up and, below it, the same records as cards in the same white card (`A5.mirror`), because at 1024 the sidebar (and on Bookings the filter column) leaves too little room for the columns. The Released Vacancies table is condensed for 1280: close date under dates and Shift, status with *My proposals n of cap*. On Booking Detail each day is two lines at every width: status, hours, Shift and (on an invoiced week) pay, then the absence, override marker, confirmation, reason and Justify full width.

## 2026-11-16 — No requirement IDs in copy (ruled by Ujjwal Sharma)

No requirement ID in the copy a user reads. Dropped from Booking Detail's slice 5 Absence Confirmation note (XR-015).
The slice 5 design hub keeps its IDs (a reviewer page). Earlier slices' pages are not changed by this entry.


## 2026-11-16 — Requirement IDs stripped from the earlier slices' pages too (ruled by Ujjwal Sharma)

Extends the entry above to every page: no requirement ID in copy a user reads — text, tooltips (`title`), toasts
and dialog bodies drawn by script. A trailing *(XX-NNN)* goes with its space; a leading *XX-NNN ·* label goes and
the rest is capitalised (*SYS-007 · effective-dated* → *Effective-dated*). Code comments keep their IDs, and so do
the slice design hubs (reviewer pages). Nothing else in the copy changed.

## 2026-11-16 — One more released vacancy for TechForce (ruled by Ujjwal Sharma)

The demo used to start with nothing to propose to (VAC-1041 at 2 of 2, VAC-1042 at 1 of 1, VAC-1043 Filled). The seed
now releases **VAC-1050 *Goods-in operatives*** (Acme Logistics, Leicester DC, Morning, 26 Oct to 18 Dec 2026, three
open positions, closes 23 Oct) to TechForce on 9 Oct 2026 at 11:30, pay rate £13.20/hr, so Released Vacancies opens
with *Propose* enabled (0 of 2). The rebuilt `slice5-proto.js` still names no other agency and carries no charge rate,
margin or wave; the agency's week and statement reads are unchanged.

## 2026-11-16 — Slice 5 TSD review R5: the rulings applied to the agency's pages (ruled by Ujjwal Sharma)

From the slice 5 TSD review R5 (project-docs `review/slices/SLICE-5-TSD-REVIEW-R5-RECORD.md`); `slice5-proto.js` rebuilt
from the source in the Abstract repo.

1. **R5-D4 — Finance keeps Settings.** The *View as role* switch no longer hides Settings for Finance, on every page
   that has it. Finance still loses Vacancies, Proposals and Candidates; a Recruiter still has no Payroll.
2. **R5-D5 — Filters trimmed to the API.** Candidates' branch filter and Vacancies' and Bookings' job-role filters are
   full product only (`data-s5-later`, no longer wired); Candidates' `validation` state (*That branch is outside your
   scope*) is gone. Kept: Candidates' name search and compliance; Vacancies' search, status and start-date range;
   Bookings' status, dates and search; Payroll's as before. Create Candidate's `branchinvalid` and `fieldnotallowed`
   stay (form fields).
3. **R5-D7 — The agency's own Agency Net Margin on an invoiced week.** Booking Detail's invoiced week (28 Sep) reads
   *Agency net margin −£121.30* beside its pay: agency cost − (worker gross pay + Σ statutory), £636.00 − (£580.00 +
   £177.30), worked out per day in this copy as the server works it out with slice 4's engine (the rate card line's
   worker pay rate and the statutory rates; neither is drawn). Never on a week that is not invoiced.
4. **R5-D9 — A defaulted request.** The Absence Confirmation card reads *Requested automatically (client setting)* for
   a request the client's setting made.
5. **R5-D10 — "Agency gross pay".** Payroll's column and card fact and Pay Statement's total read *Agency gross pay*
   for the £636.00 Abstract pays the agency, never *Gross pay*.
6. **R5-G1 — No proposal reference on a booking.** Booking Detail's *· from proposal PRP-n* is gone.
7. **R5-G6 — Finance's Booking Detail.** For Finance (the role switch, or the new `finance` state) the Candidate
   Profile card (contact details, address) and every *Justify* action are not drawn; a requested day reads *Awaiting a
   justification. Your role can’t give one.* Changing the role redraws the page.
8. **R5-P3 — Bookings' Large state** lists all 48 bookings, 20 a page: no status box is ticked there.
9. **R5-P4 — Vacancy Detail's Empty state** reads *0 of 2 pending* with no cap banner.
10. **R5-P5 — The notification drawer** reads slice 5 events in the kernel's words in slice 5 mode, from the slice 5
    sample data: *Vacancy released to you* (VAC-1050), *Absence confirmation requested* (Kofi Mensah, Wed 7 Oct),
    *Proposal rejected* (PRP-1003), *Proposal accepted* (PRP-1001). The export's later-slice items (un-book requests,
    compliance expiring, booking confirmed, self-bill generated) are full product only; its *Absence confirmation
    requested*, *New vacancy posted* and *Proposal approved* items are replaced by the slice 5 ones. The unread count
    counts the items the mode shows.

Not applied here: R5-D6's *Awaiting agency* label. The pass's brief scoped it to Abstract's and the client's pages, so
the agency's confirmation badge still reads *Requested (awaiting agency)*; flagged for the owner.

**Follow-up, same day (the brief's scope corrected):** R5-D6 is applied here too — a requested day's badge reads
*Awaiting agency* (design-tokens §6); *Justified* is unchanged. Booking Detail's invoiced week now reads *24.00 hours
worked · 40.00 hours paid · Agency gross pay £636.00 · Agency net margin −£121.30*: the figure is what Abstract pays
the agency (R5-D10, never a bare *Pay*), and it pays for the three Worked days and the two paid absences (40 h × £15.90),
so the paid hours are said beside the worked ones. For Finance the info note no longer says *you justify an absence*;
it says a recruiter or administrator at the agency justifies one (R5-G6). TechForce's seeded NI numbers now use the
sample prefix *AB* (they were *QQ…*), so Abstract's edits of an agency record save.

Availability on an agency's candidate is refused with `CANDIDATE_NOT_IN_POOL` for every caller (slice 5 TSD §3.1.0), not `CANDIDATE_FIELD_NOT_ALLOWED`; the agency's *fieldnotallowed* copy names the job role and the legal hold only (review R5 follow-up, from the TSD check of the design pass).
