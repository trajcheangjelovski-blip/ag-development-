/* AG Development — demo open tracker.
   Included in every /demos/<slug>/ page. Records one "open" per browser session,
   counts page/section views inside the demo, and reports visible time on exit.
   No cookies, no personal data. */
(function () {
  try {
    var m = location.pathname.match(/^\/demos\/([a-z0-9][a-z0-9_-]{0,63})\//);
    if (!m || location.protocol === 'file:') return;
    var slug = m[1], KEY = 'agdemo:' + slug, EP = '/api/demo-track';
    var params = new URLSearchParams(location.search);
    var ref = params.get('ref');
    if (ref) {
      params.delete('ref');
      var q = params.toString();
      history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }
    var ss = {};
    try { ss = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) {}
    var visible = 0, since = document.visibilityState === 'visible' ? Date.now() : 0;
    var base = ss.dur || 0, pages = (ss.pages || 0) + 1;

    function secs() { return Math.round(base + (visible + (since ? Date.now() - since : 0)) / 1000); }
    function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ id: ss.id, dur: secs(), pages: pages })); } catch (e) {} }
    function send(beacon) {
      if (!ss.id) return;
      save();
      var body = JSON.stringify({ id: ss.id, dur: secs(), pages: pages });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon(EP, new Blob([body], { type: 'text/plain' }));
      else fetch(EP, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    }

    if (ss.id) { save(); send(false); }
    else {
      fetch(EP, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ slug: slug, ref: ref || '', referrer: document.referrer || '' }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.id) { ss.id = d.id; save(); } })
        .catch(function () {});
    }

    var lastUrl = location.pathname + location.hash;
    function nav() { var u = location.pathname + location.hash; if (u === lastUrl) return; lastUrl = u; pages++; save(); }
    addEventListener('hashchange', nav);
    addEventListener('popstate', nav);
    var push = history.pushState;
    history.pushState = function () { var r = push.apply(this, arguments); nav(); return r; };

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { if (since) { visible += Date.now() - since; since = 0; } send(true); }
      else since = Date.now();
    });
    addEventListener('pagehide', function () { send(true); });
    setInterval(function () { if (document.visibilityState === 'visible') send(false); }, 30000);
  } catch (e) {}
})();
