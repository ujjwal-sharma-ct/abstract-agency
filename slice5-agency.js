/*
 * slice5-agency.js — the agency portal's slice 5 page helpers (namespace A5), drawn in the older pages' own look:
 * Sora headings, Manrope body, gray neutrals, the flat agency tokens (navy, blue, purple, success, warning, danger),
 * white rounded-xl cards with a gray-100 border. Data comes from slice5-proto.js (S5); the slice mode and the state
 * switcher from slice1-kit.js (S1). Load order: slice5-proto.js → slice5-agency.js → page script → slice1-kit.js.
 *
 *   A5.q(name)                      a URL parameter
 *   A5.ready(fn)                    run fn(state) once the kit is ready and again on every state or mode change
 *   A5.live()                       slice 5 data is drawn (slices 1 to 5, or the full product)
 *   A5.skeletonRows(cols, n)        loading rows for a table body (never a spinner over stale data)
 *   A5.stateCard(kind, o)           'error' | 'denied' | 'notfound' | 'empty' card, in a white card
 *   A5.alert(tone, html)            an inline banner: 'error' | 'warning' | 'info' | 'success'
 *   A5.pager(host, total, page, go) "Showing a to b of n entries" with numbered buttons, 20 a page (conventions §4.3)
 *   A5.modal(o)                     a dialog in the older look: { title, body, confirm, danger, onConfirm(close, el) }
 *   A5.money(x), A5.initials(name)  formatting
 */
(function () {
  'use strict';
  var A5 = window.A5 = {};
  // The older pages' Tailwind config replaces the blue and purple scales with one flat token each, so the kernel badge
  // classes (design-tokens §5) that name blue-50/700 and purple-50/700 would draw nothing. Plain CSS supplies them.
  var css = document.createElement('style'); css.id = 'a5-css';
  css.textContent = '.bg-blue-50{background-color:#eff6ff}.text-blue-700{color:#1d4ed8}.border-blue-200{border-color:#bfdbfe}' +
    '.bg-purple-50{background-color:#faf5ff}.text-purple-700{color:#7e22ce}.border-purple-200{border-color:#e9d5ff}' +
    // the hidden attribute wins over a display utility (flex, grid) on the slice 5 pages' own slots and cards
    '[hidden]{display:none!important}';
  document.head.appendChild(css);
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
  A5.esc = esc;
  A5.PAGE = 20;
  A5.q = function (n) { return new URLSearchParams(location.search).get(n); };
  A5.live = function () { return !!(window.S5 && S5.on()); };
  A5.money = function (x) { return x == null ? '—' : '£' + Number(x).toFixed(2); };
  A5.initials = function (n) { return String(n || '').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); };
  A5.state = function () { return document.body.getAttribute('data-s1-state') || 'default'; };
  A5.ready = function (fn) {
    var go = function () { try { fn(A5.state()); } catch (e) { if (window.console) console.error(e); } };
    document.addEventListener('s1:ready', function () {
      go();
      document.addEventListener('s1:state', go);
      document.addEventListener('s1:mode', go);
    });
  };
  A5.skeletonRows = function (cols, n) {
    var r = '';
    for (var i = 0; i < (n || 6); i++) {
      r += '<tr class="animate-pulse">';
      for (var c = 0; c < cols; c++) r += '<td class="px-4 sm:px-6 py-4"><div class="h-3 rounded bg-gray-200 ' + (c === 0 ? 'w-36' : 'w-20') + '"></div>' + (c === 0 ? '<div class="h-2.5 rounded bg-gray-100 w-24 mt-2"></div>' : '') + '</td>';
      r += '</tr>';
    }
    return r;
  };
  A5.skeletonBlock = function (lines) {
    var r = '<div class="animate-pulse space-y-3 w-full min-w-[12rem]" aria-hidden="true">';
    for (var i = 0; i < (lines || 4); i++) r += '<div class="h-3 rounded bg-gray-200" style="width:' + (90 - i * 13) + '%"></div>';
    return r + '</div><span class="sr-only">Loading</span>';
  };
  var CARD = {
    error: ['fa-triangle-exclamation', 'bg-danger/10 text-danger', 'We couldn’t load this page', 'Something went wrong on our side. Nothing you entered was lost.'],
    denied: ['fa-lock', 'bg-gray-100 text-gray-500', 'You don’t have access to this page', 'Your role doesn’t include this area. Ask an administrator at your organisation if you need it.'],
    notfound: ['fa-magnifying-glass', 'bg-gray-100 text-gray-500', 'We can’t find that', 'It may have been removed, or it isn’t available to your agency.'],
    empty: ['fa-inbox', 'bg-gray-100 text-gray-400', 'Nothing here yet', '']
  };
  A5.stateCard = function (kind, o) {
    o = o || {}; var k = CARD[kind] || CARD.empty;
    return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-14 text-center" role="' + (kind === 'error' ? 'alert' : 'status') + '">' +
      '<div class="w-12 h-12 rounded-full ' + k[1] + ' flex items-center justify-center mx-auto mb-4"><i class="fa-solid ' + (o.icon || k[0]) + '"></i></div>' +
      '<p class="text-sm font-semibold text-gray-900 font-sora">' + esc(o.title || k[2]) + '</p>' +
      ((o.body || k[3]) ? '<p class="text-sm text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">' + (o.html ? o.body : esc(o.body || k[3])) + '</p>' : '') +
      (kind === 'error' ? '<button type="button" data-a5-retry class="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-blue text-white rounded-md text-sm font-medium hover:bg-blue/90 transition-colors"><i class="fa-solid fa-rotate-right text-xs"></i> Retry</button>' : '') +
      (o.action || '') + '</div>';
  };
  // a Retry on an error card returns the page to its default state (the prototype's stand-in for the refetch)
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-a5-retry]'); if (b && window.S1) S1.setState('default'); });
  var TONE = { error: ['bg-danger/5 border-danger/20 text-danger', 'fa-circle-exclamation'], warning: ['bg-warning/10 border-warning/30 text-amber-800', 'fa-triangle-exclamation'], info: ['bg-blue/5 border-blue/20 text-blue', 'fa-circle-info'], success: ['bg-success/10 border-success/20 text-success', 'fa-circle-check'] };
  A5.alert = function (tone, html) {
    var t = TONE[tone] || TONE.info;
    return '<div class="flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm ' + t[0] + '" role="' + (tone === 'error' ? 'alert' : 'status') + '"><i class="fa-solid ' + t[1] + ' mt-0.5"></i><div class="min-w-0 leading-relaxed">' + html + '</div></div>';
  };
  A5.pager = function (host, total, page, go) {
    if (typeof host === 'string') host = document.getElementById(host);
    if (!host) return;
    var pages = Math.max(1, Math.ceil(total / A5.PAGE)); page = Math.min(Math.max(1, page || 1), pages);
    var a = total ? (page - 1) * A5.PAGE + 1 : 0, b = Math.min(total, page * A5.PAGE);
    var btn = function (p, label, cur, dis) { return '<button type="button" ' + (dis ? 'disabled ' : '') + 'data-p="' + p + '" class="w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ' + (cur ? 'bg-blue text-white border-blue' : dis ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-700 hover:bg-gray-50') + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</button>'; };
    var nums = '';
    for (var p = 1; p <= pages; p++) { if (pages > 5 && p > 2 && p < pages - 1 && Math.abs(p - page) > 0) { if (p === 3 || p === pages - 2) nums += '<span class="w-8 h-8 flex items-center justify-center text-gray-400">…</span>'; continue; } nums += btn(p, p, p === page); }
    // the host keeps the page's own footer classes; one without any gets the older pages' footer look
    if (!host.className) host.className = 'px-4 sm:px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500';
    host.innerHTML = '<span class="text-sm text-gray-600">Showing <span class="font-medium text-gray-900">' + a + '</span> to <span class="font-medium text-gray-900">' + b + '</span> of <span class="font-medium text-gray-900">' + total + '</span> entries · 20 a page</span>' +
      '<div class="flex flex-wrap gap-1">' + btn(page - 1, '<i class="fa-solid fa-chevron-left text-xs"></i>', false, page <= 1) + nums + btn(page + 1, '<i class="fa-solid fa-chevron-right text-xs"></i>', false, page >= pages) + '</div>';
    host.hidden = false;
    host.querySelectorAll('button[data-p]').forEach(function (x) { x.onclick = function () { if (!x.disabled) go(Number(x.getAttribute('data-p'))); }; });
    return { from: a - 1, to: b };
  };
  A5.modal = function (o) {
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'a5-m-t');
    wrap.innerHTML = '<div class="absolute inset-0 bg-navy/40 backdrop-blur-[1px]" data-a5-close></div>' +
      '<div class="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">' +
      '<div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-gray-100"><h2 id="a5-m-t" class="text-base font-sora font-semibold text-gray-900">' + esc(o.title) + '</h2>' +
      '<button type="button" data-a5-close aria-label="Close" class="w-8 h-8 -mr-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"><i class="fa-solid fa-xmark"></i></button></div>' +
      '<div class="px-6 py-4 overflow-y-auto text-sm text-gray-600 space-y-3" data-a5-body>' + o.body + '</div>' +
      '<div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2">' +
      '<button type="button" data-a5-close class="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">' + esc(o.cancel || 'Cancel') + '</button>' +
      (o.confirm ? '<button type="button" data-a5-ok class="px-4 py-2 rounded-md text-sm font-medium text-white ' + (o.danger ? 'bg-danger hover:bg-danger/90' : 'bg-blue hover:bg-blue/90') + '">' + esc(o.confirm) + '</button>' : '') + '</div></div>';
    document.body.appendChild(wrap);
    var close = function () { wrap.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    wrap.querySelectorAll('[data-a5-close]').forEach(function (b) { b.onclick = close; });
    var ok = wrap.querySelector('[data-a5-ok]'); if (ok) ok.onclick = function () { o.onConfirm && o.onConfirm(close, wrap); };
    var f = wrap.querySelector('textarea, input, select, [data-a5-ok]'); if (f) f.focus();
    return { el: wrap, close: close };
  };
  // VacancyStatusBadge / BookingStatusBadge / timesheet and day statuses, in design-tokens §5's buckets
  var B = { released: 'bg-purple-50 text-purple-700 border-purple-200', good: 'bg-emerald-50 text-emerald-700 border-emerald-200', waiting: 'bg-amber-50 text-amber-700 border-amber-200', bad: 'bg-red-50 text-red-700 border-red-200', closed: 'bg-slate-100 text-slate-600 border-slate-200', neutral: 'bg-slate-100 text-slate-700 border-slate-200', info: 'bg-blue-50 text-blue-700 border-blue-200' };
  var WORD = { 'Released to Agencies': 'released', 'Filled': 'good', 'Closed': 'closed', 'Cancelled': 'bad', 'Active': 'good', 'Completed': 'good', 'Extended': 'waiting', 'Pending Start': 'neutral', 'Draft': 'neutral', 'Submitted': 'info', 'Approved': 'good', 'Invoiced': 'closed', 'Adjusted': 'closed', 'Worked': 'good', 'Not Booked': 'neutral', 'Sick Leave': 'waiting', 'Holiday': 'info', 'No-show': 'bad' };
  A5.badge = function (s, small) { var b = B[WORD[s] || 'neutral']; return '<span class="inline-flex items-center gap-1.5 ' + (small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs') + ' rounded-full font-semibold border whitespace-nowrap ' + b + '">' + esc(s) + '</span>'; };
  A5.fieldError = function (msg) { return '<p class="text-xs text-danger mt-1.5 flex items-center gap-1" role="alert"><i class="fa-solid fa-circle-exclamation"></i> ' + esc(msg) + '</p>'; };
  // A list below 1280 px: the table frame shows from xl up, and a card list in the same white card below it, so every
  // key column reads at 1024 and 375 without sideways scrolling. mirror(tbody, html): html is the cards for the rows
  // just drawn; without it, a skeleton or message row of the table is mirrored as such.
  A5.mirror = function (body, html) {
    var frame = body.closest('.overflow-x-auto, .overflow-auto'); if (!frame) return;
    frame.classList.add('hidden', 'xl:block');
    var cards = frame.nextElementSibling && frame.nextElementSibling.hasAttribute('data-a5-cards') ? frame.nextElementSibling : null;
    if (!cards) { cards = document.createElement('div'); cards.setAttribute('data-a5-cards', ''); cards.className = 'xl:hidden flex-1 overflow-y-auto divide-y divide-gray-100 border-t border-gray-100'; frame.after(cards); }
    if (html == null) html = body.querySelector('.animate-pulse') ? '<div class="p-4">' + A5.skeletonBlock(6) + '</div>' : '<div class="px-6 py-10 text-center text-sm text-gray-500">' + esc(body.textContent.trim()) + '</div>';
    cards.innerHTML = html; cards.hidden = false;
  };
  // one labelled fact in a list card
  A5.fact = function (label, html) { return '<div class="min-w-0"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">' + label + '</p><div class="text-sm text-gray-900 mt-0.5">' + html + '</div></div>'; };
})();
