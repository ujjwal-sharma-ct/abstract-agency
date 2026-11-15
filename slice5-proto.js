/*
 * slice5-proto.js — the slice 5 prototype's shared behaviour (agency fulfilment), one copy per portal.
 *
 * BUILT for the agency portal — do not edit; edit the source and rebuild.
 * SOURCE: `Design/abstract admin/scripts/slice5-proto.src.js`. Each portal's `slice5-proto.js` is BUILT from it by
 * `node scripts/build-slice5-proto.mjs` (run from the abstract admin folder): the build keeps the lines outside a fence
 * and the lines inside a fence that names the portal (`//#if abstract`, `//#if client agency`, … closed by `//#endif`),
 * and drops the other portals' blocks and the fence lines themselves. Edit the source, never a built copy.
 *
 * Load order on a page: slice3-proto.js (absent on the agency portal) → slice5-proto.js → slice4-proto.js → slice1-kit.js.
 *
 * What a copy carries (slice 4's rule): only what its portal's responses would carry. The client's copy has no pay
 * figure, no booking source, no wave number, no candidate's personal data and no agency status; the agency's copy has
 * no charge rate, no margin, no other agency, no wave, no roster and no position total. The demo store (localStorage
 * `s5-demo-v1`, shared by the three portals on one origin) holds the cross-portal facts — releases with their waves,
 * proposals, the agency's candidates, the Agency-sourced bookings, absence confirmations, and each released vacancy's
 * agency-facing facts and open count. A copy's accessors never return what its party may not read, even where the
 * store holds it (a prototype simplification: the store is one blob, the reader is the gate).
 *
 * What it gives a screen:
 *   S5.on()                          true in the slice 5 mode and the full product; every slice 5 addition is gated on it
 *   S5.proposals(f) / S5.proposal(id) the proposals the portal may read (ProposalSummary / Proposal, TSD §3.3.2)
 *   S5.ui.proposalBadge(status) / S5.ui.confBadge(state) / S5.ui.sourceBadge(src)   the kernel badges as drawn here
 *   abstract: S5.waves(vid), S5.releaseOptions(vid), S5.act.release, S5.act.startReview / accept / reject, S5.agencies()
 *   client:   S5.act.startReview / accept / reject; S5.directory() (B3); S5.supplyingParty(agencyId)
 *   agency:   S5.releasedVacancies() / S5.releasedVacancy(id), S5.myCandidates(), S5.act.propose / editNotes / withdraw,
 *             S5.act.saveCandidate, S5.agencyBookings(), S5.agencyWeeks(bookingId), S5.act.justify
 *   abstract and client also: the overlay on S3 (Agency-sourced bookings in the bookings and the roster, a released
 *   vacancy's status) and the S4 seam (S5.s4.*: the seeded weeks of the Agency-sourced booking, the confirmation states).
 *
 * "Today" is slice 3's: Saturday 10 Oct 2026.
 */
(function () {
  'use strict';
  var PORTAL = 'agency';
  var TODAY = '2026-10-10';
  var KEY = 's5-demo-v1';
  var S5 = window.S5 = { PORTAL: PORTAL, TODAY: TODAY, KEY: KEY };

  // ---------- the slice mode (the kit's key; read directly when the kit has not loaded yet) ----------
  function mode() {
    if (window.S1 && S1.mode) return S1.mode();
    var m = null; try { m = window.localStorage.getItem('s1-mode'); } catch (e) { /* blocked */ }
    return m === 'on' ? 's1' : ['s2', 's3', 's4', 's5'].indexOf(m) >= 0 ? m : 'full';
  }
  function on() { var m = mode(); return m === 's5' || m === 'full'; }
  S5.mode = mode; S5.on = on;

  // ---------- storage ----------
  function read(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function write(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window: this page only */ } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function now() { var d = new Date(); return TODAY + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2); }
  function refuse(code, message, data) { var e = new Error(message); e.code = code; e.data = data || {}; throw e; }
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) { if (!iso) return '—'; var p = iso.slice(0, 10).split('-'); return Number(p[2]) + ' ' + MN[Number(p[1]) - 1] + ' ' + p[0]; }
  function fmtDateTime(iso) { return fmtDate(iso) + ', ' + iso.slice(11, 16); }
  S5.esc = esc; S5.now = now; S5.fmtDate = fmtDate; S5.fmtDateTime = fmtDateTime;
  var ABSENCES = ['Sick Leave', 'Holiday', 'No-show'];
  var PENDING = ['Submitted', 'Under Review'];

  // ---------- reference data: the agencies (slice 2's records) ----------
  // The signed-in agency user's organisation. Nothing of any other agency is in this copy.
  var ME = { agencyId: 'techforce', agencyName: 'TechForce Recruitment', userName: 'Daniel Wright' };
  S5.ME = ME;
  function agencyName(id) { return id === ME.agencyId ? ME.agencyName : ''; }

  // ---------- the agencies' branch structures (agencyOrgNodeId → the branch a candidate belongs to) ----------
  var BRANCHES = {
    techforce: [
      { id: 'tf-root', parentId: null, name: 'TechForce Recruitment', root: true },
      { id: 'tf-north', parentId: 'tf-root', name: 'North' },
      { id: 'tf-leeds', parentId: 'tf-north', name: 'Leeds branch' },
      { id: 'tf-mid', parentId: 'tf-root', name: 'Midlands' },
      { id: 'tf-bham', parentId: 'tf-mid', name: 'Birmingham branch' }
    ]
  };
  function branchName(agencyId, id) { var n = (BRANCHES[agencyId] || []).filter(function (x) { return x.id === id; })[0]; return n ? n.name : null; }
  S5.BRANCHES = BRANCHES; S5.branchName = branchName;

  // ---------- the agencies' candidates: what every party may read (name, compliance, licence validity) ----------
  function lic(t, e) { return { licenceType: t, expiryDate: e || null }; }
  var CANDS = [
    { id: 'ac-kofi', fullName: 'Kofi Mensah', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [lic('Reach truck (RTITB)', '2028-03-31')] },
    { id: 'ac-liam', fullName: 'Liam Carter', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [lic('Reach truck (RTITB)', '2027-06-30'), lic('Counterbalance (ITSSAR)', '2027-11-30')] },
    { id: 'ac-ryan', fullName: 'Ryan Hughes', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [lic('Reach truck (RTITB)', '2026-08-15')] },
    { id: 'ac-chloe', fullName: 'Chloe Adams', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [] },
    { id: 'ac-hannah', fullName: 'Hannah Brooks', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [lic('Counterbalance (ITSSAR)', '2027-04-30')] },
    { id: 'ac-daniel', fullName: 'Daniel Osei', agencyId: 'techforce', complianceStatus: 'Pending', licences: [] },
    { id: 'ac-megan', fullName: 'Megan Price', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [] },
    { id: 'ac-amira', fullName: 'Amira Hassan', agencyId: 'techforce', complianceStatus: 'Compliant', licences: [lic('Reach truck (RTITB)', '2027-09-30')] }
  ];
  // The personal data and the record itself: Abstract reads both owners, the agency its own (pii_restricted, XR-002).
  function item(status, expiry, doc) { return { status: status, expiryDate: expiry || null, doc: doc || null }; }
  function items(a, b, c, d) { return { right_to_work: a, dbs_check: b, references: c, hs_training: d }; }
  var OK = function (e, d) { return item('Compliant', e, d); }, NA = item('Not Applicable'), PD = item('Pending');
  function addr(l, t, p) { return { line1: l, line2: null, town: t, postcode: p, country: 'GB' }; }
  function priv(branch, dob, tel, email, a, ni, kin, it, licIssuers, extra) { return Object.assign({ agencyOrgNodeId: branch, dateOfBirth: dob, telephone: tel, email: email, address: a, nationalInsuranceNumber: ni, nextOfKin: kin, items: it, issuers: licIssuers || [], documents: [], createdAt: '2026-08-20T10:00:00', updatedAt: '2026-10-01T09:00:00', createdBy: 'Daniel Wright' }, extra || {}); }
  var PRIV = {
    'ac-kofi': priv('tf-leeds', '1990-02-11', '07700 900301', 'kofi.mensah@example.com', addr('8 Burley Road', 'Leeds', 'LS4 2EU'), 'QQ112233A', { name: 'Ama Mensah', relationship: 'Sister', telephone: '07700 900401' }, items(OK('2030-02-28', 'Share code.pdf'), OK('2027-05-31'), OK(), OK('2027-06-30')), ['RTITB'], { documents: [{ name: 'Share code.pdf', size: '180 KB', by: 'Daniel Wright', at: '2026-08-20T10:20:00' }] }),
    'ac-liam': priv('tf-leeds', '1995-06-03', '07700 900302', 'liam.carter@example.com', addr('21 Kirkstall Road', 'Leeds', 'LS3 1LH'), 'QQ223344B', null, items(OK('2031-01-31'), NA, OK(), OK('2027-08-31')), ['RTITB', 'ITSSAR']),
    'ac-ryan': priv('tf-leeds', '1987-10-19', '07700 900303', 'ryan.hughes@example.com', addr('4 Beeston Road', 'Leeds', 'LS11 6AA'), 'QQ334455C', { name: 'Kerry Hughes', relationship: 'Spouse', telephone: '07700 900403' }, items(OK('2029-03-31'), OK('2027-01-31'), OK(), OK('2027-02-28')), ['RTITB']),
    'ac-chloe': priv('tf-bham', '1998-12-08', '07700 900304', 'chloe.adams@example.com', addr('15 Moseley Road', 'Birmingham', 'B12 0HJ'), 'QQ445566D', null, items(OK('2030-09-30'), NA, OK(), OK('2027-03-31')), []),
    'ac-hannah': priv('tf-bham', '1993-04-27', '07700 900305', 'hannah.brooks@example.com', addr('30 Hagley Road', 'Birmingham', 'B16 8PE'), 'QQ556677A', { name: 'Paul Brooks', relationship: 'Father', telephone: '07700 900405' }, items(OK('2032-04-30'), OK('2027-10-31'), OK(), OK('2027-09-30')), ['ITSSAR']),
    'ac-daniel': priv('tf-bham', '2000-01-15', '07700 900306', 'daniel.osei@example.com', addr('2 Ladypool Road', 'Birmingham', 'B12 8JY'), null, null, items(OK('2030-12-31'), PD, OK(), OK('2027-12-31')), []),
    'ac-megan': priv('tf-bham', '1996-07-30', '07700 900307', 'megan.price@example.com', addr('9 Coventry Road', 'Birmingham', 'B10 0RX'), 'QQ778899C', null, items(OK('2029-07-31'), NA, OK(), OK('2027-01-31')), []),
    'ac-amira': priv('tf-leeds', '1992-03-09', '07700 900308', 'amira.hassan@example.com', addr('11 Harehills Lane', 'Leeds', 'LS8 4AA'), 'QQ889900D', { name: 'Omar Hassan', relationship: 'Husband', telephone: '07700 900408' }, items(OK('2031-03-31'), OK('2027-04-30'), OK(), OK('2027-05-31')), ['RTITB'])
  };

  // ---------- the store seed: the cross-portal facts ----------
  // Each copy seeds only the records (and the fields) its party may hold, so the agency's file has no other agency's
  // proposal and no wave number, and the client's no release row. The store is the union: on load a copy adds the seed
  // records no copy has seeded yet and fills in the fields of the ones another copy seeded with fewer (store.seeded keeps
  // the keys, so a record a write removed — an ended confirmation — never comes back).
  function rel(vid, agency, at, wave, by) { var r = { vacancyId: vid, agencyId: agency, releasedAt: at }; if (wave) { r.waveNumber = wave; r.releasedByName = by; } return r; }
  function prp(n, vid, cand, agency, status, sub, extra) {
    return Object.assign({ id: 'p' + n, reference: 'PRP-' + n, vacancyId: vid, candidateId: cand, agencyId: agency, status: status, notes: '', submittedAt: sub, updatedAt: sub, reviewStartedAt: null, decidedAt: null, decidedByParty: null, decisionReason: null, positionNumber: null, bookingId: null, bookingReference: null }, extra || {});
  }
  function abk(o) {
    return Object.assign({ extendedAt: null, startedBy: null, completedAt: null, completedBy: null, cancelledAt: null, cancelledBy: null, cancellationReason: null, updatedAt: o.createdAt }, o);
  }
  function by(x, extra) { return Object.assign({}, extra, x); }
  function seed() {
    var releases = [
      rel('v1042', 'techforce', '2026-09-24T10:15:00'), rel('v1043', 'techforce', '2026-09-30T08:50:00'), rel('v1041', 'techforce', '2026-10-05T14:20:00')
    ];
    // who decided, as each party may read it: Abstract's user by name only in Abstract's copy
    var ABS_DEC = {};
    var proposals = [
      prp(1001, 'v1042', 'ac-kofi', 'techforce', 'Accepted', '2026-09-24T13:40:00', by(ABS_DEC, { notes: 'Kofi drove reach trucks for three years at a Leeds cold store and holds a current RTITB licence. He can start on the 28th and is happy on the afternoon Shift.', reviewStartedAt: '2026-09-25T09:10:00', decidedAt: '2026-09-25T16:05:00', decidedByParty: 'abstract', positionNumber: 2, bookingId: 'b2210', bookingReference: 'BK-2210', updatedAt: '2026-09-25T16:05:00' })),
      prp(1002, 'v1042', 'ac-liam', 'techforce', 'Submitted', '2026-10-09T10:30:00', { notes: 'Liam holds reach truck and counterbalance licences and has worked high-bay replenishment at two distribution centres. Available from Monday.' }),
      prp(1003, 'v1042', 'ac-ryan', 'techforce', 'Rejected', '2026-09-25T09:00:00', by(ABS_DEC, { notes: 'Ryan has six years on reach trucks in Leeds and Wakefield.', decidedAt: '2026-09-26T11:20:00', decidedByParty: 'abstract', decisionReason: 'His reach truck licence expired on 15 Aug 2026. Propose him again once it is renewed.', updatedAt: '2026-09-26T11:20:00' })),
      prp(1004, 'v1043', 'ac-chloe', 'techforce', 'Rejected (Position Filled)', '2026-10-01T10:00:00', { notes: 'Chloe has worked nights at a Birmingham parcel hub for two years.', decidedAt: '2026-10-06T16:30:00', decidedByParty: 'system', updatedAt: '2026-10-06T16:30:00' }),
      prp(1005, 'v1041', 'ac-hannah', 'techforce', 'Under Review', '2026-10-05T16:10:00', { notes: 'Hannah led a goods-in team of six at a Birmingham DC over last year’s peak and holds a counterbalance licence.', reviewStartedAt: '2026-10-06T09:05:00', updatedAt: '2026-10-06T09:05:00' }),
      prp(1006, 'v1041', 'ac-daniel', 'techforce', 'Submitted', '2026-10-06T11:45:00', { notes: 'Daniel has two seasons of picking and packing experience. His DBS check is in progress.' }),
      prp(1007, 'v1041', 'ac-megan', 'techforce', 'Withdrawn', '2026-10-05T16:30:00', { notes: 'Megan has worked peak cover at this site before.', decidedAt: '2026-10-07T12:00:00', decidedByParty: 'agency', decidedByName: 'Daniel Wright', decisionReason: 'Megan has accepted a permanent role elsewhere.', updatedAt: '2026-10-07T12:00:00' })
    ];
    // the Agency-sourced bookings; the names are stored with them so the agency's copy (which has no slice 3 data) reads them
    var KOFI = { id: 'b2210', reference: 'BK-2210', vacancyId: 'v1042', candidateId: 'ac-kofi', candidateName: 'Kofi Mensah', clientId: 'acme', clientName: 'Acme Logistics', orgNodeName: 'Leeds Hub', jobRoleTitle: 'Forklift Driver (Reach)', shiftName: 'Afternoon', startDate: '2026-09-28', endDate: '2026-11-27', workingTimes: 'Mon to Fri, 14:00 to 22:00', status: 'Active', startedAt: '2026-09-28T00:30:00', agencyId: 'techforce', proposalId: 'p1001', createdAt: '2026-09-25T16:05:00' };
    var bookings = [abk(KOFI)
    ];
    // Each released vacancy's agency-facing facts (ReleasedVacancy, TSD §3.3.1), its open count and first release, kept
    // current by the Abstract and client copies whenever they read the vacancy. No pay rate here: each copy has its own money.
    function facts(id, ref, title, role, node, start, end, close, shift, times, desc, req, open, status, first) { return { id: id, reference: ref, jobTitle: title, jobRoleTitle: role, clientId: 'acme', clientName: 'Acme Logistics', orgNodeName: node, startDate: start, endDate: end, closeDate: close, shiftName: shift, workingTimes: times, description: desc, requirements: req, openCount: open, status: status, firstReleasedAt: first }; }
    var vacancies = {
      v1041: facts('v1041', 'VAC-1041', 'Warehouse operatives, peak cover', 'Warehouse Operative', 'Birmingham DC', '2026-10-19', '2026-12-18', '2026-10-16', 'Morning', 'Mon to Fri, 06:00 to 14:00', 'General warehouse duties at the site: goods in, picking to order, and loading for despatch.', 'Safety boots and hi-vis provided on site. Able to lift up to 20 kg.', 3, 'Released to Agencies', '2026-10-05T14:20:00'),
      v1042: facts('v1042', 'VAC-1042', 'Reach truck drivers', 'Forklift Driver (Reach)', 'Leeds Hub', '2026-09-28', '2026-11-27', null, 'Afternoon', 'Mon to Fri, 14:00 to 22:00', 'Racking and replenishment in the high-bay aisles.', 'Current reach truck licence.', 1, 'Released to Agencies', '2026-09-24T10:15:00'),
      v1043: facts('v1043', 'VAC-1043', 'Night shift operatives', 'Warehouse Operative', 'Nights', '2026-10-12', '2026-11-13', null, 'Night', 'Sun to Thu, 22:00 to 06:00', null, null, 0, 'Filled', '2026-09-30T08:50:00')
    };
    // Absence confirmations, keyed booking|date (glossary AbsenceConfirmationRequest; TSD §3.3.7)
    var confirmations = {
      'b2210|2026-09-30': { requestedAt: '2026-09-30T13:10:00', requestedByParty: 'policy', justification: 'Kofi called our Leeds branch at 12:40, before his shift, to say he was unwell. His self-certification is on file with us.', justifiedAt: '2026-09-30T16:20:00', justifiedByName: 'Daniel Wright' },
      'b2210|2026-10-07': { requestedAt: '2026-10-07T15:10:00', requestedByParty: 'client', justification: null, justifiedAt: null, justifiedByName: null }
    };
    var audit = [
    ];
    return { releases: releases, proposals: proposals, candidates: [], bookings: bookings, vacancies: vacancies, confirmations: confirmations, weeks: {}, audit: audit, seq: { prp: 1012, bk: 2300, cand: 100 } };
  }

  // ---------- store ----------
  var KEYS = { releases: function (r) { return r.vacancyId + '|' + r.agencyId; }, proposals: function (r) { return r.id; }, bookings: function (r) { return r.id; }, audit: function (r) { return r.type + '|' + r.id + '|' + r.at + '|' + r.text; } };
  function merge(store, sd) {
    var seen = store.seeded || {}, changed = false;
    Object.keys(KEYS).forEach(function (c) {
      store[c] = store[c] || [];
      sd[c].forEach(function (rec) {
        var k = c + ':' + KEYS[c](rec), cur = store[c].filter(function (x) { return c + ':' + KEYS[c](x) === k; })[0];
        if (cur) { Object.keys(rec).forEach(function (f) { if (!(f in cur)) { cur[f] = rec[f]; changed = true; } }); }
        else if (!seen[k]) { store[c].push(JSON.parse(JSON.stringify(rec))); changed = true; }
        if (!seen[k]) { seen[k] = 1; changed = true; }
      });
    });
    ['vacancies', 'confirmations'].forEach(function (c) {
      store[c] = store[c] || {};
      Object.keys(sd[c]).forEach(function (key) {
        var k = c + ':' + key, cur = store[c][key], rec = sd[c][key];
        if (cur) { Object.keys(rec).forEach(function (f) { if (!(f in cur)) { cur[f] = rec[f]; changed = true; } }); }
        else if (!seen[k]) { store[c][key] = JSON.parse(JSON.stringify(rec)); changed = true; }
        if (!seen[k]) { seen[k] = 1; changed = true; }
      });
    });
    ['candidates', 'weeks'].forEach(function (c) { if (!store[c]) { store[c] = sd[c]; changed = true; } });
    if (!store.seq) { store.seq = sd.seq; changed = true; }
    store.seeded = seen;
    return changed;
  }
  var db = read(KEY);
  if (!db) { db = { seeded: {} }; merge(db, seed()); write(KEY, db); } else if (merge(db, seed())) write(KEY, db);
  function save() { write(KEY, db); }
  S5.reset = function () { try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ } db = { seeded: {} }; merge(db, seed()); save(); };
  function log(type, id, text, who) { db.audit.push({ type: type, id: id, at: now(), by: who === undefined ? S5.me : who, text: text }); }
  S5.me = ME.userName; var PARTY = 'agency';

  // ---------- candidates ----------
  // The seeded record, merged with any write the agency made (store.candidates), dressed with the compliance roll-up.
  function rawCand(id) {
    var w = db.candidates.filter(function (c) { return c.id === id; })[0];
    if (w) return w;
    var p = CANDS.filter(function (c) { return c.id === id; })[0]; if (!p) return null;
    var o = JSON.parse(JSON.stringify(p));
    var x = PRIV[id]; if (x) { Object.assign(o, JSON.parse(JSON.stringify(x))); o.licences = o.licences.map(function (l, i) { return Object.assign({ id: id + '-l' + i, issuingBody: (x.issuers || [])[i] || null, removedAt: null }, l); }); delete o.issuers; }
    return o;
  }
  function rollup(c) { if (!c.items) return c.complianceStatus; var w = Object.keys(c.items).map(function (k) { return c.items[k].status; }); return w.indexOf('Expired') >= 0 ? 'Expired' : w.indexOf('Pending') >= 0 ? 'Pending' : 'Compliant'; }
  function dressCand(c) {
    var o = JSON.parse(JSON.stringify(c));
    o.licences = (o.licences || []).filter(function (l) { return !l.removedAt; }).map(function (l) { return Object.assign(l, { expired: !!l.expiryDate && l.expiryDate < TODAY }); });
    o.ownerType = 'agency'; o.ownerName = agencyName(c.agencyId); o.complianceStatus = rollup(c);
    o.agencyOrgNodeName = branchName(c.agencyId, c.agencyOrgNodeId); o.jobRoleId = null; o.jobRoleTitle = null;
    o.availability = null; o.legalHold = false; o.anonymised = !!c.anonymisedAt; o.photo = null;
    o.unavailableFrom = null; o.unavailableUntil = null;
    return o;
  }
  function allCandIds() { var ids = CANDS.map(function (c) { return c.id; }); db.candidates.forEach(function (c) { if (ids.indexOf(c.id) < 0) ids.push(c.id); }); return ids; }
  // GET /candidates?ownerType=agency — the agency's own candidates (CP-020); the propose picker's source (K53)
  S5.myCandidates = function () { return allCandIds().map(rawCand).filter(function (c) { return c && c.agencyId === ME.agencyId && !c.anonymisedAt; }).map(dressCand); };
  S5.myCandidate = function (id) { var c = rawCand(id); return c && c.agencyId === ME.agencyId ? dressCand(c) : null; };
  // POST / PATCH /candidates from an agency caller: branch required, no job role, no availability, no legal hold (Q11)
  S5.act = S5.act || {};
  S5.act.saveCandidate = function (f, id) {
    if (!f.agencyOrgNodeId || !branchName(ME.agencyId, f.agencyOrgNodeId)) refuse('CANDIDATE_BRANCH_INVALID', 'Choose one of your branches for this candidate.');
    ['jobRoleId', 'legalHold', 'unavailableFrom'].forEach(function (k) { if (f[k] != null) refuse('CANDIDATE_FIELD_NOT_ALLOWED', 'An agency can’t set ' + k + ' on a candidate.', { field: k }); });
    var c = id ? rawCand(id) : null;
    if (!c) { c = { id: 'ac-n' + (++db.seq.cand), agencyId: ME.agencyId, items: items(PD, PD, PD, PD), licences: [], documents: [], createdAt: now(), createdBy: ME.userName }; }
    Object.keys(f).forEach(function (k) { c[k] = f[k]; }); c.updatedAt = now();
    db.candidates = db.candidates.filter(function (x) { return x.id !== c.id; }).concat([c]); save(); return c.id;
  };

  // ---------- reads: proposals ----------
  function rawP(id) { return db.proposals.filter(function (p) { return p.id === id; })[0]; }
  function facts(vid) { return db.vacancies[vid] || null; }
  function dressP(p) {
    var c = rawCand(p.candidateId) || { fullName: '—', complianceStatus: 'Pending', licences: [] }, dc = dressCand(c), f = facts(p.vacancyId) || {};
    var o = { id: p.id, reference: p.reference, vacancyId: p.vacancyId, vacancyReference: f.reference || '', jobTitle: f.jobTitle || '', clientId: f.clientId || 'acme', clientName: f.clientName || '', orgNodeName: f.orgNodeName || '',
      candidateId: p.candidateId, candidateName: dc.fullName, candidateComplianceStatus: dc.complianceStatus, candidateLicences: (dc.licences || []).map(function (l) { return { licenceType: l.licenceType, expiryDate: l.expiryDate, expired: l.expired }; }),
      supplyingParty: agencyName(p.agencyId), status: p.status, submittedAt: p.submittedAt, updatedAt: p.updatedAt,
      notes: p.notes, reviewStartedAt: p.reviewStartedAt, decidedAt: p.decidedAt, decidedByParty: p.decidedByParty, decisionReason: p.decisionReason,
      positionNumber: p.positionNumber, bookingId: p.bookingId, bookingReference: p.bookingReference };
    o.decidedByName = p.decidedByParty === 'agency' ? p.decidedByName : null;
    return o;
  }
  function readable(p) {
    return p.agencyId === ME.agencyId;
  }
  // GET /proposals: vacancyId, status (array), pending, agencyId (Abstract only), q; newest first
  S5.proposals = function (f) {
    f = f || {};
    return db.proposals.filter(readable).filter(function (p) {
      if (f.vacancyId && p.vacancyId !== f.vacancyId) return false;
      if (f.candidateId && p.candidateId !== f.candidateId) return false;
      if (f.status && f.status.length && f.status.indexOf(p.status) < 0) return false;
      if (f.pending && PENDING.indexOf(p.status) < 0) return false;
      return true;
    }).map(dressP).filter(function (x) { return !f.q || (x.reference + ' ' + x.candidateName + ' ' + x.vacancyReference).toLowerCase().indexOf(f.q.toLowerCase()) >= 0; })
      .sort(function (a, b) { return a.submittedAt < b.submittedAt ? 1 : -1; });
  };
  S5.proposal = function (id) { var p = rawP(id); return p && readable(p) ? dressP(p) : null; };
  S5.audit = function (type, id) { return db.audit.filter(function (a) { return a.type === type && a.id === id; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  S5.PENDING = PENDING;

  // ---------- reads: releases (Abstract only — an agency never reads a wave, another release row or the history) ----------

  // ---------- writes ----------
  S5.act = S5.act || {};
  function myFacts(vid) { var f = facts(vid), r = db.releases.filter(function (x) { return x.vacancyId === vid && x.agencyId === ME.agencyId; })[0]; return f && r ? { f: f, r: r } : null; }
  // the cap (PP-007, PP-014, CFG-010; Q6): min(openCount, proposals.max_per_vacancy) — the key resolves to 2 for TechForce today
  var MAX_PER_VACANCY = 2;
  S5.MAX_PER_VACANCY = MAX_PER_VACANCY;
  function dressRV(vid) {
    var m = myFacts(vid); if (!m) return null; var f = m.f;
    var mine = db.proposals.filter(function (p) { return p.vacancyId === vid && p.agencyId === ME.agencyId && PENDING.indexOf(p.status) >= 0; }).length;
    // ReleasedVacancySummary / ReleasedVacancy (TSD §3.3.1): never a wave, the roster, the total or another agency
    return { id: vid, reference: f.reference, jobTitle: f.jobTitle, jobRoleTitle: f.jobRoleTitle, clientId: f.clientId, clientName: f.clientName, orgNodeName: f.orgNodeName, status: f.status, openCount: f.openCount, startDate: f.startDate, endDate: f.endDate, closeDate: f.closeDate, shiftName: f.shiftName, workingTimes: f.workingTimes, payRate: PAY[vid] || f.payRate || null, releasedAt: m.r.releasedAt, myPendingCount: mine, myProposalCap: Math.min(f.openCount, MAX_PER_VACANCY), description: f.description, requirements: f.requirements };
  }
  // The agency pay rate of each seeded released vacancy (VacancyRate.agencyPayRate, slice 2's card); a vacancy released
  // later carries it in its facts. This copy holds no charge rate.
  var PAY = { v1041: '14.10', v1042: '15.90', v1043: '15.70', v1047: '14.10' };
  S5.releasedVacancies = function () { return db.releases.filter(function (r) { return r.agencyId === ME.agencyId; }).map(function (r) { return dressRV(r.vacancyId); }).filter(Boolean).sort(function (a, b) { return a.releasedAt < b.releasedAt ? 1 : -1; }); };
  S5.releasedVacancy = function (vid) { return dressRV(vid); };
  // POST /proposals — refusals in the TSD's order (§3.1.2)
  S5.act.propose = function (vid, candidateId, notes) {
    var v = dressRV(vid); if (!v) refuse('RELEASED_VACANCY_NOT_FOUND', 'We can’t find that vacancy.');
    if (['Closed', 'Cancelled'].indexOf(v.status) >= 0) refuse('VACANCY_STATUS_INVALID', v.reference + ' is ' + v.status + ', so it takes no new proposal.', { status: v.status });
    var c = S5.myCandidate(candidateId); if (!c) refuse('CANDIDATE_NOT_FOUND', 'Choose one of your candidates.');
    if (c.anonymised) refuse('PROPOSAL_CANDIDATE_INVALID', c.fullName + '’s record is anonymised, so they can’t be proposed.', { reason: 'anonymised' });
    var dup = db.proposals.filter(function (p) { return p.vacancyId === vid && p.candidateId === candidateId && (PENDING.indexOf(p.status) >= 0 || p.status === 'Accepted'); })[0];
    if (dup) refuse('PROPOSAL_CANDIDATE_DUPLICATE', c.fullName + ' is already proposed on this vacancy (' + dup.reference + ').', { proposalId: dup.id });
    if (v.openCount === 0) refuse('VACANCY_NO_OPEN_POSITIONS', 'Every position on this vacancy is filled, so it takes no new proposal.');
    if (v.myPendingCount + 1 > v.myProposalCap) refuse('PROPOSAL_CAP_REACHED', 'You have reached your proposal limit for this vacancy (' + v.myPendingCount + ' of ' + v.myProposalCap + ').', { pending: v.myPendingCount, openCount: v.openCount, maxPerVacancy: MAX_PER_VACANCY });
    if (!notes || !notes.trim()) refuse('VALIDATION_ERROR', 'Say why this candidate suits the vacancy.', { fields: { notes: 'Say why this candidate suits the vacancy.' } });
    if (notes.length > 2000) refuse('VALIDATION_ERROR', 'Keep the notes to 2,000 characters.', { fields: { notes: 'Keep the notes to 2,000 characters.' } });
    var n = ++db.seq.prp, p = prp(n, vid, candidateId, ME.agencyId, 'Submitted', now(), { notes: notes.trim(), submittedByName: ME.userName });
    db.proposals.push(p); log('proposal', p.id, 'Proposal submitted'); save(); return p.id;
  };
  // PATCH /proposals/:id { notes } — only while Submitted
  S5.act.editNotes = function (id, notes, o) {
    var p = rawP(id); o = o || {};
    if (o.simulateStale || p.status !== 'Submitted') refuse('PROPOSAL_STATUS_INVALID', 'This proposal is ' + (o.simulateStale ? 'Under Review' : p.status) + ' now, so its notes can’t be changed. The page shows the latest.', { status: p.status });
    if (!notes || !notes.trim()) refuse('VALIDATION_ERROR', 'Say why this candidate suits the vacancy.', { fields: { notes: 'Say why this candidate suits the vacancy.' } });
    p.notes = notes.trim(); p.updatedAt = now(); log('proposal', id, 'Notes changed'); save();
  };
  // POST /proposals/:id/withdraw { reason? } — while pending
  S5.act.withdraw = function (id, reason, o) {
    var p = rawP(id); o = o || {};
    if (o.simulateStale || PENDING.indexOf(p.status) < 0) refuse('PROPOSAL_STATUS_INVALID', 'This proposal is ' + (o.simulateStale ? 'Accepted' : p.status) + ' now, so it can’t be withdrawn. The page shows the latest.', { status: p.status });
    var was = p.status; p.status = 'Withdrawn'; p.decidedAt = now(); p.decidedByParty = 'agency'; p.decidedByName = ME.userName; p.decisionReason = reason ? reason.trim() : null; p.updatedAt = now();
    log('proposal', id, 'Status: ' + was + ' → Withdrawn'); save();
  };

  // ---------- Agency-sourced bookings ----------
  function rawAB(id) { return db.bookings.filter(function (b) { return b.id === id; })[0]; }
  S5.isAgencyBooking = function (id) { return !!rawAB(id); };
  // GET /bookings for an agency caller: its own Agency-sourced bookings; agencyPayRate only, no source (BK-004, R1-D10)
  function dressAgencyB(b) { return { id: b.id, reference: b.reference, candidateId: b.candidateId, candidateName: b.candidateName, jobRoleTitle: b.jobRoleTitle, clientName: b.clientName, orgNodeName: b.orgNodeName, startDate: b.startDate, endDate: b.endDate, shiftName: b.shiftName, workingTimes: b.workingTimes, status: b.status, payRate: PAY[b.vacancyId] || null, proposalId: b.proposalId, supplyingParty: ME.agencyName, cancelledAt: b.cancelledAt, cancellationReason: b.cancellationReason }; }
  S5.agencyBookings = function () { return db.bookings.filter(function (b) { return b.agencyId === ME.agencyId; }).map(dressAgencyB).sort(function (a, b) { return a.startDate < b.startDate ? 1 : -1; }); };
  S5.agencyBooking = function (id) { var b = rawAB(id); return b && b.agencyId === ME.agencyId ? dressAgencyB(b) : null; };

  // ---------- absence confirmation (TSD §3.3.7) ----------
  var INVOICED = [
    // Prototype stand-in for slice 6's timesheet_invoiced_periods: one booking-week counts as invoiced, so the agency's
    // pay figures (§3.3.6 rule 3) and the "can't reopen" rule have a week to show on. Slice 5 writes no such row.
    { bookingId: 'b2210', weekStart: '2026-09-28', invoicedAt: '2026-10-07T10:00:00' }
  ];
  function invoiced(bookingId, ws) { return INVOICED.filter(function (r) { return r.bookingId === bookingId && r.weekStart === ws; })[0] || null; }
  S5.invoiced = invoiced;
  function confKey(bookingId, date) { return bookingId + '|' + date; }
  function confState(bookingId, date, dayStatus) {
    if (ABSENCES.indexOf(dayStatus) < 0) return null;
    var c = db.confirmations[confKey(bookingId, date)];
    return c ? (c.justification ? 'Justified' : 'Requested (awaiting agency)') : 'Not Requested';
  }
  function confOf(bookingId, date) {
    var c = db.confirmations[confKey(bookingId, date)]; if (!c) return null;
    var o = { requestedAt: c.requestedAt, requestedByParty: c.requestedByParty, justification: c.justification, justifiedAt: c.justifiedAt };
    return o;
  }
  S5.confState = confState; S5.confirmation = confOf;
  // POST /timesheets/:id/days/:date/justification — the agency's one timesheet write, any week status (TS-022, XR-014)
  S5.act.justify = function (bookingId, date, reason, o) {
    o = o || {}; var b = rawAB(bookingId); if (!b || b.agencyId !== ME.agencyId) refuse('TIMESHEET_NOT_FOUND', 'We can’t find that week.');
    var c = db.confirmations[confKey(bookingId, date)];
    if (o.simulateStale || !c || c.justification) refuse('TIMESHEET_CONFIRMATION_STATE_INVALID', 'This day is ' + (o.simulateStale ? 'Justified' : c ? 'Justified' : 'no longer waiting for a reason') + ' now. The week shows the latest.', { confirmationState: c && c.justification ? 'Justified' : 'Not Requested' });
    if (!reason || !reason.trim()) refuse('VALIDATION_ERROR', 'Give the reason for the absence.', { fields: { reason: 'Give the reason for the absence.' } });
    if (reason.length > 1000) refuse('VALIDATION_ERROR', 'Keep the reason to 1,000 characters.', { fields: { reason: 'Keep the reason to 1,000 characters.' } });
    c.justification = reason.trim(); c.justifiedAt = now(); c.justifiedByName = ME.userName; save();
  };
  // AgencyBookingWeeks' source: each week's days as the agency reads them (§3.3.6). The Abstract and client copies write a
  // snapshot when they read the week (store.weeks); until one has, the seed below stands in. Pay figures only on an
  // invoiced week, worked out here from the hours and the booking's agency pay rate.
  var WEEKS_SEED = [
    { id: 'ts-s5-1', bookingId: 'b2210', weekStart: '2026-09-28', status: 'Approved', days: [
      { date: '2026-09-28', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' }, { date: '2026-09-29', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' },
      { date: '2026-09-30', dayStatus: 'Sick Leave', absenceComment: 'Phoned the branch before the shift.', absencePay: 'Paid', shiftName: 'Afternoon' },
      { date: '2026-10-01', dayStatus: 'No-show', absencePay: 'Paid', overridden: true, shiftName: 'Afternoon' },
      { date: '2026-10-02', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' }, { date: '2026-10-03', dayStatus: 'Not Booked' }, { date: '2026-10-04', dayStatus: 'Not Booked' }] },
    { id: 'ts-s5-2', bookingId: 'b2210', weekStart: '2026-10-05', status: 'Draft', days: [
      { date: '2026-10-05', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' }, { date: '2026-10-06', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' },
      { date: '2026-10-07', dayStatus: 'No-show', absenceComment: 'Did not arrive; the site called the branch at 14:30.', absencePay: 'Unpaid' },
      { date: '2026-10-08', dayStatus: 'Sick Leave', absenceComment: 'Texted the site at 12:00.', absencePay: 'Paid', shiftName: 'Afternoon' },
      { date: '2026-10-09', dayStatus: 'Worked', hours: '8.00', shiftName: 'Afternoon' }, { date: '2026-10-10', dayStatus: null }, { date: '2026-10-11', dayStatus: null }] }
  ];
  S5.agencyWeeks = function (bookingId) {
    var b = rawAB(bookingId); if (!b || b.agencyId !== ME.agencyId) return [];
    var live = Object.keys(db.weeks).map(function (k) { return db.weeks[k]; }).filter(function (w) { return w.bookingId === bookingId; });
    var list = live.length ? live : WEEKS_SEED.filter(function (w) { return w.bookingId === bookingId; });
    var rate = PAY[b.vacancyId] || null;
    return list.map(function (w) {
      var inv = invoiced(bookingId, w.weekStart), o = { id: w.id, bookingId: bookingId, weekStart: w.weekStart, status: w.status, invoicedAt: inv ? inv.invoicedAt : null };
      o.days = w.days.map(function (y) {
        var x = { date: y.date, dayStatus: y.dayStatus, hours: y.hours || null, shiftName: y.shiftName || null, absenceComment: y.absenceComment || null, absencePay: y.absencePay || null, overridden: !!y.overridden, inRange: y.inRange !== false, confirmationState: confState(bookingId, y.date, y.dayStatus), confirmation: confOf(bookingId, y.date) };
        // pay figures (pay columns) only on an invoiced booking-week; absent, not null, otherwise
        if (inv && rate && (y.dayStatus === 'Worked' || y.absencePay === 'Paid')) { x.agencyPayRate = rate; x.agencyCost = (Math.round(Number(rate) * Number(y.hours || '8.00') * 100) / 100).toFixed(2); }
        return x;
      });
      if (inv) o.agencyCost = o.days.reduce(function (m, x) { return m + (x.agencyCost ? Number(x.agencyCost) : 0); }, 0).toFixed(2);
      return o;
    }).sort(function (a, b2) { return a.weekStart < b2.weekStart ? 1 : -1; });
  };
  // GET /pay-statements, /pay-statements/:id for an agency caller (TS-100; TSD §3.3.8): its own workers' statements. A
  // statement exists once its week is approved (slice 4 §3.3.5: written at approval) — here, a week of AgencyBookingWeeks
  // whose status is Approved, Invoiced or Adjusted. One line per Worked day and Paid absence; the job role is the
  // booking's (the agency's week projection carries no covered role). The pay fields (agencyPayRate, agencyAmount,
  // agencyGrossPay) are present only on an invoiced booking-week (§3.3.6 rule 3): absent, not null, otherwise. No worker
  // pay (abstract_margin), no charge and no source are in this copy.
  var PS_GENERATED = { 'ts-s5-1': '2026-10-05T09:30:00' };
  function agencyStatement(w, b) {
    var lines = w.days.filter(function (y) { return y.dayStatus === 'Worked' || (ABSENCES.indexOf(y.dayStatus) >= 0 && y.absencePay === 'Paid'); }).map(function (y) {
      var l = { date: y.date, dayStatus: y.dayStatus, shiftName: y.shiftName || b.shiftName || null, jobRoleWorkedTitle: b.jobRoleTitle, hourType: 'Standard', hours: y.hours || '8.00', overridden: y.overridden };
      if (y.agencyPayRate) { l.agencyPayRate = y.agencyPayRate; l.agencyAmount = y.agencyCost; }
      return l;
    });
    var s = { id: 'ps-' + w.id + '-v1', timesheetId: w.id, bookingId: b.id, bookingReference: b.reference, candidateId: b.candidateId, candidateName: b.candidateName, clientName: b.clientName, orgNodeName: b.orgNodeName, jobRoleTitle: b.jobRoleTitle, supplyingParty: ME.agencyName, weekStart: w.weekStart, version: 1, supersededAt: null, generatedAt: PS_GENERATED[w.id] || null, invoicedAt: w.invoicedAt, totalHours: lines.reduce(function (m, l) { return m + Number(l.hours); }, 0).toFixed(2), lines: lines };
    if (w.invoicedAt) s.agencyGrossPay = lines.reduce(function (m, l) { return m + (l.agencyAmount ? Number(l.agencyAmount) : 0); }, 0).toFixed(2);
    return s;
  }
  S5.agencyPayStatements = function () {
    var out = [];
    db.bookings.filter(function (b) { return b.agencyId === ME.agencyId; }).forEach(function (raw) {
      var b = dressAgencyB(raw);
      S5.agencyWeeks(raw.id).forEach(function (w) { if (['Approved', 'Invoiced', 'Adjusted'].indexOf(w.status) >= 0) out.push(agencyStatement(w, b)); });
    });
    return out.sort(function (a, b2) { return a.weekStart < b2.weekStart ? 1 : a.weekStart > b2.weekStart ? -1 : a.candidateName < b2.candidateName ? -1 : 1; });
  };
  S5.agencyPayStatement = function (id) { return S5.agencyPayStatements().filter(function (s) { return s.id === id; })[0] || null; };

  // ---------- the overlay on slice 3 (Abstract and client): Agency-sourced bookings, a released vacancy's status ----------

  // ---------- the slice 4 seam (Abstract and client): the Agency-sourced booking's weeks, the confirmation states ----------

  // ---------- the look: badges as the kernel buckets them (design-tokens §5); every portal ----------
  var BUCKET = { neutral: 'bg-slate-100 text-slate-700 border border-slate-200', info: 'bg-blue-50 text-blue-700 border border-blue-200', waiting: 'bg-amber-50 text-amber-700 border border-amber-200', good: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bad: 'bg-red-50 text-red-700 border border-red-200', closed: 'bg-slate-100 text-slate-600 border border-slate-200', released: 'bg-purple-50 text-purple-700 border border-purple-200' };
  // ProposalStatusBadge: Rejected (Position Filled) takes closed/archival with user-check — a system outcome, not a
  // judgement on the candidate (the pass's choice, flagged for K59). The confirmation words likewise (K59).
  var PWORD = { 'Submitted': ['info', 'fa-paper-plane'], 'Under Review': ['info', 'fa-magnifying-glass'], 'Accepted': ['good', 'fa-circle-check'], 'Rejected': ['bad', 'fa-circle-xmark'], 'Withdrawn': ['closed', 'fa-rotate-left'], 'Rejected (Position Filled)': ['closed', 'fa-user-check'] };
  var CWORD = { 'Not Requested': ['neutral', 'fa-minus'], 'Requested (awaiting agency)': ['waiting', 'fa-hourglass-half'], 'Justified': ['good', 'fa-circle-check'] };
  function badge(map, s, small) { var w = map[s] || ['neutral', 'fa-circle']; return '<span class="inline-flex items-center gap-1.5 ' + (small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs') + ' rounded-full font-semibold whitespace-nowrap ' + BUCKET[w[0]] + '"><i class="fa-solid ' + w[1] + ' text-[10px]" aria-hidden="true"></i>' + esc(s) + '</span>'; }
  S5.ui = {
    proposalBadge: function (s, small) { return badge(PWORD, s, small); },
    confBadge: function (s, small) { return badge(CWORD, s, small); },
    complianceBadge: function (s, small) { return badge({ Compliant: ['good', 'fa-circle-check'], Pending: ['waiting', 'fa-hourglass-half'], Expired: ['bad', 'fa-circle-xmark'] }, s, small); },
    licenceChip: function (l) { return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ' + (l.expired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200') + '"><i class="fa-solid ' + (l.expired ? 'fa-circle-xmark' : 'fa-id-card') + ' text-[10px]" aria-hidden="true"></i>' + esc(l.licenceType) + (l.expiryDate ? ' · ' + (l.expired ? 'expired ' : 'until ') + fmtDate(l.expiryDate) : '') + '</span>'; }
  };
  S5.PROPOSAL_STATUSES = Object.keys(PWORD);
})();
