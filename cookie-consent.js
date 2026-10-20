/*!
 * Connected Commons cookie consent. No dependencies.
 * - Essential only until the visitor chooses. Optional scripts never load before consent.
 * - Accept and Reject have equal prominence. Choice is stored for 12 months.
 * - Any element with [data-cc-open-preferences] reopens the settings.
 *
 * Gate third-party scripts like this (they stay inert until consent):
 *   <script type="text/plain" data-cc-category="analytics" src="https://example.com/a.js"></script>
 *   <script type="text/plain" data-cc-category="functional">/* inline chatbot snippet *\/</script>
 * Categories: analytics | functional | marketing
 */
(function () {
  'use strict';
  var KEY = 'cc_consent', MONTHS = 12, VERSION = 1;
  var CATS = [
    { id: 'analytics',  label: 'Analytics',  desc: 'Anonymous counts of visits and popular pages, so we can improve the site.' },
    { id: 'functional', label: 'Functional and third-party', desc: 'Features from other services, such as the website chatbot and embedded content.' }
  ];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || v.version !== VERSION || Date.now() > v.expires) return null;
      return v;
    } catch (e) { return null; }
  }
  function save(choices) {
    var rec = { version: VERSION, choices: choices, ts: Date.now(),
                expires: Date.now() + MONTHS * 30 * 24 * 3600 * 1000 };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    return rec;
  }
  function allowed(cat) { var r = read(); return !!(r && r.choices && r.choices[cat]); }

  // Activate gated scripts for consented categories (once each).
  function activate() {
    var nodes = document.querySelectorAll('script[type="text/plain"][data-cc-category]');
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.getAttribute('data-cc-done') || !allowed(n.getAttribute('data-cc-category'))) return;
      var s = document.createElement('script');
      Array.prototype.forEach.call(n.attributes, function (a) {
        if (a.name !== 'type' && a.name !== 'data-cc-category') s.setAttribute(a.name, a.value);
      });
      s.text = n.text;
      n.setAttribute('data-cc-done', '1');
      n.parentNode.insertBefore(s, n.nextSibling);
    });
    document.dispatchEvent(new CustomEvent('cc:consent', { detail: (read() || {}).choices || {} }));
  }

  // Remove our own known optional cookies if consent is withdrawn (third parties: see Cookie Policy).
  function clearOptional(choices) {
    if (choices.analytics) return;
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gid|_gat)/.test(name)) {
        ['', '.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#cc-root{position:fixed;inset:auto 0 0 0;z-index:2147483000;font:16px/1.5 Figtree,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#E8EDDF}' +
      '#cc-root *{box-sizing:border-box}' +
      '.cc-card{max-width:760px;margin:16px;background:#333533;border:1px solid #5B6B5F;border-radius:20px;padding:22px 24px;box-shadow:0 12px 40px rgba(0,0,0,.45)}' +
      '.cc-card h2{margin:0 0 6px;font-size:18px;color:#E8EDDF}' +
      '.cc-card p{margin:0 0 14px;color:#CFDBD5;font-size:15px}' +
      '.cc-card a{color:#F5CB5C}' +
      '.cc-row{display:flex;flex-wrap:wrap;gap:10px}' +
      '.cc-btn{font:inherit;font-weight:700;font-size:15px;border-radius:999px;padding:10px 22px;cursor:pointer;border:2px solid #F5CB5C;background:#F5CB5C;color:#242423}' +
      '.cc-btn.alt{background:transparent;color:#E8EDDF;border-color:#CFDBD5}' +
      '.cc-btn:hover{filter:brightness(1.08)}' +
      '.cc-btn:focus-visible,.cc-switch input:focus-visible+span{outline:3px solid #E8EDDF;outline-offset:2px}' +
      '.cc-cat{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:12px 0;border-top:1px solid #5B6B5F}' +
      '.cc-cat strong{display:block;color:#E8EDDF}.cc-cat small{color:#CFDBD5;font-size:14px}' +
      '.cc-switch{position:relative;flex:none}.cc-switch input{position:absolute;opacity:0;width:44px;height:26px;margin:0;cursor:pointer}' +
      '.cc-switch span{display:block;width:44px;height:26px;border-radius:999px;background:#5B6B5F;transition:background .15s}' +
      '.cc-switch span:after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#E8EDDF;transition:transform .15s}' +
      '.cc-switch input:checked+span{background:#F5CB5C}.cc-switch input:checked+span:after{transform:translateX(18px);background:#242423}' +
      '.cc-switch input:disabled{cursor:not-allowed}.cc-switch input:disabled+span{opacity:.6}' +
      '#cc-prefs{display:none;margin-bottom:14px}#cc-root.prefs #cc-prefs{display:block}' +
      '@media(max-width:560px){.cc-card{margin:8px;padding:18px}.cc-btn{flex:1 1 100%}}' +
      '@media(prefers-reduced-motion:reduce){.cc-switch span,.cc-switch span:after{transition:none}}';
    document.head.appendChild(s);
  }

  var root, lastFocus;
  function build() {
    root = document.createElement('div');
    root.id = 'cc-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'cc-title');
    var cats = CATS.map(function (c) {
      return '<div class="cc-cat"><div><strong>' + c.label + '</strong><small>' + c.desc + '</small></div>' +
        '<label class="cc-switch"><input type="checkbox" data-cat="' + c.id + '" aria-label="' + c.label + '"><span></span></label></div>';
    }).join('');
    root.innerHTML =
      '<div class="cc-card">' +
        '<h2 id="cc-title">Your privacy choices</h2>' +
        '<p>We use essential cookies to make this site work. With your permission we would also use analytics and third-party features. ' +
        'Nothing optional runs until you choose. See our <a href="/cookie-policy">Cookie Policy</a> and <a href="/privacy-policy">Privacy Policy</a>.</p>' +
        '<div id="cc-prefs">' +
          '<div class="cc-cat"><div><strong>Essential</strong><small>Remember your choice and keep the site secure. Always on.</small></div>' +
          '<label class="cc-switch"><input type="checkbox" checked disabled aria-label="Essential"><span></span></label></div>' + cats +
        '</div>' +
        '<div class="cc-row">' +
          '<button class="cc-btn" data-act="accept">Accept all</button>' +
          '<button class="cc-btn alt" data-act="reject">Reject non-essential</button>' +
          '<button class="cc-btn alt" data-act="customise">Customise</button>' +
          '<button class="cc-btn" data-act="save" style="display:none">Save choices</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && read()) hide(); });
  }

  function setToggles(choices) {
    CATS.forEach(function (c) {
      var i = root.querySelector('input[data-cat="' + c.id + '"]');
      if (i) i.checked = !!(choices && choices[c.id]);
    });
  }
  function readToggles() {
    var o = {};
    CATS.forEach(function (c) { o[c.id] = !!root.querySelector('input[data-cat="' + c.id + '"]').checked; });
    return o;
  }
  function commit(choices) {
    save(choices); clearOptional(choices); hide(); activate();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onClick(e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    var all = {}, none = {};
    CATS.forEach(function (c) { all[c.id] = true; none[c.id] = false; });
    if (act === 'accept') commit(all);
    else if (act === 'reject') commit(none);
    else if (act === 'customise') {
      root.classList.add('prefs');
      e.target.style.display = 'none';
      root.querySelector('[data-act="save"]').style.display = '';
    } else if (act === 'save') commit(readToggles());
  }
  function hide() { if (root) root.style.display = 'none'; }
  function show(openPrefs) {
    if (!root) build();
    lastFocus = document.activeElement;
    var r = read();
    setToggles(r && r.choices);
    root.style.display = 'block';
    root.classList.toggle('prefs', !!openPrefs);
    root.querySelector('[data-act="customise"]').style.display = openPrefs ? 'none' : '';
    root.querySelector('[data-act="save"]').style.display = openPrefs ? '' : 'none';
    var first = root.querySelector('.cc-btn'); if (first) first.focus();
  }

  function init() {
    css();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cc-open-preferences]');
      if (t) { e.preventDefault(); show(true); }
    });
    if (read()) activate(); else show(false);
  }

  window.ccConsent = { allowed: allowed, open: function () { show(true); }, reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} show(false); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
