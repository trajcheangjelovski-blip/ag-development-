/* Crumb Club — delivery cafe demo (AG Development)
   Everything runs client-side: cart, checkout, payments (simulated), loyalty, accounts.
   State is kept in localStorage so the demo feels like a real, persistent account. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (id, cls = '') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const finePointer = matchMedia('(pointer:fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ data */
const CATS = [
  { id: 'coffee', name: 'Espresso bar' },
  { id: 'cold', name: 'Iced & cold' },
  { id: 'tea', name: 'Matcha & chai' },
  { id: 'bakes', name: 'Bakes' },
  { id: 'brunch', name: 'Brunch plates' },
];

const SIZE = { id: 'size', label: 'Size', type: 'radio', def: 1, ch: [['Small · 8oz', -30], ['Regular · 12oz', 0], ['Large · 16oz', 40]] };
const MILK = { id: 'milk', label: 'Milk', type: 'radio', def: 0, ch: [['Whole', 0], ['Oat', 40], ['Almond', 40], ['Skimmed', 0]] };
const SWEET = { id: 'sweet', label: 'Sweetness', type: 'radio', def: 0, ch: [['None', 0], ['Half', 0], ['Regular', 0]] };
const OPTS = {
  coffee: [SIZE, MILK, { id: 'extra', label: 'Extras', type: 'check', ch: [['Extra shot', 50], ['Vanilla syrup', 30], ['Salted caramel', 30], ['Make it decaf', 0]] }, SWEET],
  black: [SIZE, { id: 'extra', label: 'Extras', type: 'check', ch: [['Extra shot', 50], ['Splash of milk', 0], ['Make it decaf', 0]] }, SWEET],
  cold: [SIZE, MILK, { id: 'extra', label: 'Extras', type: 'check', ch: [['Extra shot', 50], ['Cold foam', 60], ['Vanilla syrup', 30]] }, { id: 'ice', label: 'Ice', type: 'radio', def: 1, ch: [['Light', 0], ['Regular', 0], ['Extra', 0]] }],
  juice: [{ id: 'size', label: 'Size', type: 'radio', def: 0, ch: [['Regular · 300ml', 0], ['Large · 450ml', 60]] }, { id: 'extra', label: 'Add', type: 'check', ch: [['Ginger shot', 40], ['Chia seeds', 30]] }],
  tea: [SIZE, { ...MILK, ch: [['Whole', 0], ['Oat', 40], ['Almond', 40], ['No milk', 0]] }, SWEET],
  bake: [{ id: 'serve', label: 'Serve', type: 'radio', def: 0, ch: [['Warmed', 0], ['Room temp', 0]] }, { id: 'extra', label: 'Add on', type: 'check', ch: [['Salted butter', 20], ['House jam', 30], ['Scoop of vanilla gelato', 80]] }],
  brunch: [{ id: 'bread', label: 'Bread', type: 'radio', def: 0, ch: [['Sourdough', 0], ['Multigrain', 0], ['Gluten-free', 40]] }, { id: 'extra', label: 'Make it bigger', type: 'check', ch: [['Extra egg', 50], ['Smashed avocado', 80], ['Grilled halloumi', 110], ['Side of greens', 60]] }],
  plate: [{ id: 'extra', label: 'Make it bigger', type: 'check', ch: [['Extra egg', 50], ['Seasonal berries', 70], ['Maple syrup', 30], ['Side of greens', 60]] }],
};

const MENU = [
  ['flat-white', 'coffee', 'Flat White', 220, 'Double ristretto, silky microfoam. Our most-ordered cup.', ['popular', 'veg'], 120, 'coffee'],
  ['cappuccino', 'coffee', 'Cappuccino', 200, 'Classic thirds — espresso, milk, foam — with a cocoa dust.', ['veg'], 130, 'coffee'],
  ['cortado', 'coffee', 'Cortado', 190, 'Equal parts espresso and warm milk. Short and punchy.', ['veg'], 90, 'coffee'],
  ['americano', 'coffee', 'Long Black', 160, 'Double shot over hot water. Chocolate & dried cherry notes.', ['vegan', 'veg'], 10, 'black'],
  ['iced-latte', 'cold', 'Iced Latte', 240, 'Espresso over cold milk and big clear ice.', ['popular', 'veg'], 140, 'cold'],
  ['cold-brew', 'cold', 'Cold Brew White', 260, '18-hour steep poured over milk. Low acid, high charm.', ['new', 'veg'], 110, 'cold'],
  ['iced-mocha', 'cold', 'Iced Mocha', 270, 'Dark chocolate ganache, espresso, cold milk, cream.', ['veg'], 290, 'cold'],
  ['orange-juice', 'cold', 'Cold-pressed OJ', 180, 'Pressed every morning at 6am. Nothing else in it.', ['vegan', 'veg'], 120, 'juice'],
  ['matcha', 'tea', 'Ceremonial Matcha', 280, 'Uji ceremonial grade, whisked to order. Grassy, sweet, calm.', ['popular', 'veg'], 150, 'tea'],
  ['chai', 'tea', 'Masala Chai', 150, 'House blend slow-simmered with ginger, cardamom & clove.', ['veg'], 160, 'tea'],
  ['croissant', 'bakes', 'Butter Croissant', 140, '72-hour laminated dough. Shatters properly, honeycomb inside.', ['popular', 'veg'], 280, 'bake'],
  ['cinnamon-knot', 'bakes', 'Cinnamon Knot', 160, 'Cardamom-cinnamon brioche knot with a crackly sugar crust.', ['veg'], 340, 'bake'],
  ['cookie', 'bakes', 'Brown-butter Cookie', 110, '70% chocolate, brown butter, flaky salt. It is big.', ['new', 'veg'], 310, 'bake'],
  ['bagel', 'bakes', 'Everything Bagel', 170, 'Boiled then baked, with whipped scallion cream cheese.', ['veg'], 360, 'bake'],
  ['banana-bread', 'bakes', 'Banana Bread', 150, 'Toasted thick slice, walnuts, burnt-honey butter.', ['veg'], 320, 'bake'],
  ['brownie', 'bakes', 'Fudge Brownie', 150, 'Dense, fudgy, a little underbaked on purpose.', ['veg'], 380, 'bake'],
  ['donut', 'bakes', 'Sprinkle Donut', 130, 'Brioche ring, dark chocolate glaze, rainbow sprinkles.', ['veg'], 300, 'bake'],
  ['avo-toast', 'brunch', 'Avo & Soft Eggs', 340, 'Smashed avocado, soft eggs, chilli crisp on sourdough.', ['popular', 'veg'], 480, 'brunch'],
  ['egg-toast', 'brunch', 'Sunny Pesto Toast', 290, 'Crispy fried egg, basil pesto, cracked pepper.', ['veg'], 420, 'brunch'],
  ['grilled-cheese', 'brunch', 'Three-cheese Melt', 260, 'Cheddar, mozzarella, gouda, pickled onion, chutney dip.', ['veg'], 560, 'brunch'],
  ['pancakes', 'brunch', 'Buttermilk Stack', 320, 'Three fluffy pancakes, banana, maple brown butter.', ['veg'], 610, 'plate'],
  ['french-toast', 'brunch', 'Brioche French Toast', 330, 'Thick-cut brioche, blueberries, whipped mascarpone.', ['veg'], 640, 'plate'],
  ['seoul-bowl', 'brunch', 'Seoul Bowl', 390, 'Rice, gochujang, sesame greens, kimchi, jammy egg.', ['new'], 520, 'plate'],
].map(([id, cat, name, price, desc, tags, kcal, opt]) => ({ id, cat, name, price, desc, tags, kcal, opt, img: `img/${id}.jpg` }));
const byId = Object.fromEntries(MENU.map(m => [m.id, m]));

const REWARDS = [
  { id: 'r-cookie', cost: 150, name: 'Free brown-butter cookie', desc: 'Added to your bag on us.', img: 'img/cookie.jpg', kind: 'item', item: 'cookie' },
  { id: 'r-drink', cost: 300, name: 'Any hot drink', desc: 'Applied to the priciest hot drink in your bag.', img: 'img/flat-white.jpg', kind: 'cat', cats: ['coffee', 'tea'] },
  { id: 'r-100', cost: 500, name: '₹100 off your order', desc: 'Stack it with delivery or collection.', img: 'img/kitchen.jpg', kind: 'amount', amount: 100 },
  { id: 'r-brunch', cost: 900, name: 'Any brunch plate', desc: 'Applied to the priciest plate in your bag.', img: 'img/french-toast.jpg', kind: 'cat', cats: ['brunch'] },
];
const TIERS = [
  { id: 'crumb', name: 'Crumb', min: 0, mult: 1, perks: ['1 crumb per ₹10', 'Every 8th coffee free', 'Birthday cookie'] },
  { id: 'slice', name: 'Slice', min: 500, mult: 1.25, perks: ['1.25× crumbs', 'Free size upgrade every Friday', 'Early access to new bakes'] },
  { id: 'loaf', name: 'Loaf', min: 1500, mult: 1.5, perks: ['1.5× crumbs', 'Free delivery on every order', 'Members-only tasting drops'] },
];
const PROMOS = { CRUMB10: { label: '10% off (max ₹150)', fn: sub => Math.min(150, Math.round(sub * 0.1)) }, FIRSTBITE: { label: 'Free delivery', freeDel: true, fn: () => 0 } };

/* ------------------------------------------------------------------ state */
const KEY = 'crumbclub:v1';
const blank = () => ({ cart: [], ful: 'delivery', address: '', slot: 0, tip: 20, promo: null, redeem: [], pay: 'card', payCard: 'new', draft: {}, user: null, orders: [], points: 0, lifetime: 0, ledger: [], stamps: 0, sub: false, addresses: [], cards: [], settings: { sms: true, email: false, tues: true, diet: [] } });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ } };

const tierOf = lt => [...TIERS].reverse().find(t => lt >= t.min);
const nextTier = lt => TIERS.find(t => t.min > lt);

/* ------------------------------------------------------------------ line pricing */
function defaultOpts(m) {
  const o = {};
  (OPTS[m.opt] || []).forEach(g => { o[g.id] = g.type === 'radio' ? (g.def ?? 0) : []; });
  return o;
}
function unitPrice(m, opts) {
  let p = m.price;
  (OPTS[m.opt] || []).forEach(g => {
    const v = opts[g.id];
    if (g.type === 'radio') p += g.ch[v]?.[1] || 0;
    else (v || []).forEach(i => { p += g.ch[i]?.[1] || 0; });
  });
  return p;
}
function optLabel(m, opts) {
  const out = [];
  (OPTS[m.opt] || []).forEach(g => {
    const v = opts[g.id];
    if (g.type === 'radio') {
      if (g.id === 'sweet' && v === 0) return;
      if (g.id === 'ice' && v === 1) return;
      const l = g.ch[v]?.[0]; if (l) out.push(l.split(' · ')[0]);
    } else (v || []).forEach(i => out.push(g.ch[i][0]));
  });
  return out.join(', ');
}
const lineKey = (id, opts, note) => id + '|' + JSON.stringify(opts) + '|' + (note || '');

function addLine(id, opts, qty = 1, note = '') {
  const m = byId[id]; if (!m) return;
  opts = opts || defaultOpts(m);
  const key = lineKey(id, opts, note);
  const ex = S.cart.find(l => l.key === key && !l.free);
  if (ex) ex.qty += qty; else S.cart.push({ key, id, opts, qty, note });
  save(); renderCartCount(); renderDrawer();
}

function totals() {
  const lines = S.cart.map(l => { const m = byId[l.id]; return { ...l, m, unit: l.free ? 0 : unitPrice(m, l.opts) }; });
  const sub = lines.reduce((n, l) => n + l.unit * l.qty, 0);
  let rewardDisc = 0; const rewardRows = [];
  S.redeem.forEach(rid => {
    const r = REWARDS.find(x => x.id === rid); if (!r) return;
    let v = 0, note = '';
    if (r.kind === 'amount') v = Math.min(r.amount, sub - rewardDisc);
    else if (r.kind === 'cat') {
      const c = lines.filter(l => !l.free && r.cats.includes(l.m.cat)).map(l => l.unit).sort((a, b) => b - a)[0];
      if (c) v = c; else note = r.cats.includes('brunch') ? 'Add a brunch plate to use this' : 'Add a hot drink to use this';
    } else if (r.kind === 'item') v = 0;
    rewardDisc += v; rewardRows.push({ r, v, note });
  });
  const promo = S.promo && PROMOS[S.promo];
  const promoDisc = promo ? promo.fn(Math.max(0, sub - rewardDisc)) : 0;
  const net = Math.max(0, sub - rewardDisc - promoDisc);
  const tier = tierOf(S.lifetime);
  const freeDel = S.sub || promo?.freeDel || tier.id === 'loaf' || sub >= 499;
  const delivery = S.ful === 'delivery' && sub > 0 ? (freeDel ? 0 : 39) : 0;
  const tax = Math.round(net * 0.05);
  const tip = S.ful === 'delivery' && sub > 0 ? S.tip : 0;
  const total = net + delivery + tax + tip;
  const mult = tier.mult * (S.ful === 'collection' ? 1.1 : 1) * (S.sub ? 2 : 1);
  const earn = Math.floor(net / 10 * mult);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const cost = S.redeem.reduce((n, rid) => n + (REWARDS.find(r => r.id === rid)?.cost || 0), 0);
  return { lines, sub, rewardDisc, rewardRows, promoDisc, promo, net, delivery, tax, tip, total, earn, count, cost, freeDel };
}

/* ------------------------------------------------------------------ seed demo account */
function seedDemo(name, email) {
  const day = 864e5, now = Date.now();
  const mk = (id, ago, ful, items, pay) => {
    const lines = items.map(([pid, qty, o]) => { const m = byId[pid]; const opts = Object.assign(defaultOpts(m), o || {}); return { key: lineKey(pid, opts), id: pid, opts, qty, unit: unitPrice(m, opts) }; });
    const sub = lines.reduce((n, l) => n + l.unit * l.qty, 0);
    const delivery = ful === 'delivery' && sub < 499 ? 39 : 0, tax = Math.round(sub * .05), tip = ful === 'delivery' ? 20 : 0;
    return { id, at: now - ago * day, ful, lines, pay, addr: ful === 'delivery' ? 'Flat 3B, Rosewood Apts, Market Lane' : 'Kitchen No. 4 hatch', slot: ful === 'collection' ? '08:45' : '', t: { sub, disc: 0, delivery, tax, tip, total: sub + delivery + tax + tip }, earned: Math.floor(sub / 10 * 1.25), done: true };
  };
  S.user = { name, email, phone: '+91 98450 21734', since: '2025-03-14' };
  S.orders = [
    mk('CC-4790', 3, 'delivery', [['flat-white', 2, { milk: 1 }], ['croissant', 1], ['cookie', 1]], 'Visa •••• 4242'),
    mk('CC-4711', 9, 'collection', [['avo-toast', 1], ['iced-latte', 1, { milk: 1, extra: [0] }], ['cinnamon-knot', 1]], 'Apple Pay'),
    mk('CC-4630', 21, 'delivery', [['matcha', 1, { milk: 1 }], ['banana-bread', 1], ['cookie', 2]], 'UPI · aanya@okaxis'),
    mk('CC-4502', 37, 'delivery', [['pancakes', 1], ['cappuccino', 2], ['orange-juice', 1]], 'Google Pay'),
  ];
  S.ledger = [
    { t: now - 3 * day, d: 'Order CC-4790', v: S.orders[0].earned },
    { t: now - 6 * day, d: 'Redeemed: any hot drink', v: -300 },
    { t: now - 9 * day, d: 'Order CC-4711 · collection bonus', v: S.orders[1].earned },
    { t: now - 21 * day, d: 'Order CC-4630', v: S.orders[2].earned },
    { t: now - 30 * day, d: 'Double-crumb Tuesday', v: 120 },
    { t: now - 37 * day, d: 'Order CC-4502', v: S.orders[3].earned },
    { t: now - 240 * day, d: 'Welcome to the club', v: 50 },
  ];
  S.points = 740; S.lifetime = 1240; S.stamps = 5;
  S.addresses = [
    { label: 'Home', line: 'Flat 3B, Rosewood Apartments', area: 'Market Lane · 2.1 km', def: true },
    { label: 'Studio', line: '2nd floor, 48 Mill Road', area: 'Old Town · 3.4 km', def: false },
  ];
  S.cards = [{ brand: 'VISA', last4: '4242', exp: '08/28', name }, { brand: 'Mastercard', last4: '5100', exp: '01/27', name }];
  S.payCard = 0;
  S.draft = Object.assign({ name, email, phone: S.user.phone, line1: S.addresses[0].line, area: 'Market Lane' }, S.draft);
}

/* ------------------------------------------------------------------ toasts / confetti */
function toast(msg, icon = 'check') {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = ic(icon) + `<span>${msg}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
}
function confetti() {
  if (reduced) return;
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--accent', '--accent-2', '--leaf', '--ink'].map(v => cs.getPropertyValue(v).trim());
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('i');
    c.className = 'crumb';
    const sz = 6 + Math.random() * 9;
    c.style.cssText = `left:${50 + (Math.random() - .5) * 20}vw;top:40vh;width:${sz}px;height:${sz * (Math.random() > .5 ? 1 : .5)}px;background:${cols[i % 4]};border-radius:${Math.random() > .5 ? '50%' : '3px'}`;
    document.body.appendChild(c);
    const dx = (Math.random() - .5) * innerWidth * .9, dy = -innerHeight * (.25 + Math.random() * .3);
    c.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * .6}px,${dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .35 },
      { transform: `translate(${dx}px,${innerHeight * .7}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 1800 + Math.random() * 1200, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => c.remove();
  }
}

/* ------------------------------------------------------------------ product cards */
function tagHtml(m) {
  const t = [];
  if (m.tags.includes('popular')) t.push('<span class="tag-s hot">Popular</span>');
  if (m.tags.includes('new')) t.push('<span class="tag-s new">New</span>');
  if (m.tags.includes('vegan')) t.push('<span class="tag-s veg">Vegan</span>');
  return t.join('');
}
function card(m) {
  return `<article class="p-card reveal" data-act="open" data-id="${m.id}" tabindex="0" aria-label="${esc(m.name)}">
    <div class="p-img"><div class="p-tags">${tagHtml(m)}</div><img src="${m.img}" alt="${esc(m.name)}" loading="lazy"></div>
    <div class="p-body"><h3 class="p-name">${esc(m.name)}</h3><p class="p-desc">${esc(m.desc)}</p>
      <div class="p-foot"><div><span class="price">${fmt(m.price)}</span><br><span class="p-kcal">${m.kcal} kcal</span></div>
      <button class="add-btn" data-act="add" data-id="${m.id}" aria-label="Add ${esc(m.name)} to bag">${ic('plus')}</button></div></div>
  </article>`;
}

const HOME_TABS = [{ id: 'popular', name: 'Most loved' }, ...CATS];
let homeTab = 'popular';
function renderHomeGrid() {
  const tabs = $('[data-tabs=home]');
  tabs.innerHTML = HOME_TABS.map(t => `<button class="${t.id === homeTab ? 'on' : ''}" data-hometab="${t.id}">${t.name}</button>`).join('');
  const items = homeTab === 'popular' ? MENU.filter(m => m.tags.includes('popular') || m.tags.includes('new')).slice(0, 8) : MENU.filter(m => m.cat === homeTab).slice(0, 8);
  $('#homeGrid').innerHTML = items.map(card).join('');
  wire($('#homeGrid'));
}

let menuQ = '', menuF = new Set();
function renderMenu() {
  const q = menuQ.trim().toLowerCase();
  const match = m => (!q || (m.name + ' ' + m.desc).toLowerCase().includes(q)) && [...menuF].every(f => m.tags.includes(f));
  const tabs = $('[data-tabs=menu]');
  tabs.innerHTML = CATS.map(c => `<button data-jump="${c.id}">${c.name} <small>${MENU.filter(m => m.cat === c.id && match(m)).length}</small></button>`).join('');
  const html = CATS.map(c => {
    const items = MENU.filter(m => m.cat === c.id && match(m));
    if (!items.length) return '';
    return `<section class="menu-sec" id="sec-${c.id}"><h2>${c.name} <small>${items.length} items</small></h2><div class="grid products">${items.map(card).join('')}</div></section>`;
  }).join('');
  $('#menuSections').innerHTML = html || `<div class="empty"><h3>Nothing matches that.</h3><p>Try “latte”, “croissant” or clear the filters.</p></div>`;
  wire($('#menuSections'));
}

/* tilt + reveal wiring for freshly rendered content */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
function wire(root) {
  $$('.reveal:not(.in)', root).forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  if (!finePointer) return;
  $$('.p-card', root).forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-6px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

/* ------------------------------------------------------------------ fly to bag */
function flyToBag(fromEl, img) {
  const target = innerWidth <= 920 ? $('.mobile-tabbar [data-act=cart]') : $('#cartBtn');
  if (!fromEl || !target || reduced) { bump(); return; }
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly'; f.innerHTML = `<img src="${img}" alt="">`;
  f.style.left = a.left + a.width / 2 - 32 + 'px'; f.style.top = a.top + a.height / 2 - 32 + 'px';
  document.body.appendChild(f);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  f.animate([
    { transform: 'translate(0,0) scale(.6)', opacity: 0 },
    { transform: `translate(${dx * .3}px,${dy * .3 - 120}px) scale(1.1) rotate(-12deg)`, opacity: 1, offset: .35 },
    { transform: `translate(${dx}px,${dy}px) scale(.25) rotate(20deg)`, opacity: .7 },
  ], { duration: 850, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => { f.remove(); bump(); };
}
function bump() { ['#cartBtn', '.mobile-tabbar [data-act=cart]'].forEach(s => { const el = $(s); if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }); }

/* ------------------------------------------------------------------ product modal */
let pm = null;
function openProduct(id) {
  const m = byId[id]; if (!m) return;
  pm = { m, opts: defaultOpts(m), qty: 1, note: '' };
  const groups = (OPTS[m.opt] || []).map(g => `<div class="opt-group"><h4>${g.label}<span>${g.type === 'radio' ? 'Pick one' : 'Optional'}</span></h4><div class="opts">${g.ch.map(([l, p], i) => `<label class="opt"><input type="${g.type === 'radio' ? 'radio' : 'checkbox'}" name="${g.id}" value="${i}" ${g.type === 'radio' && i === (g.def ?? 0) ? 'checked' : ''}><span>${l}${p ? ` <small>${p > 0 ? '+' : '−'}${fmt(Math.abs(p))}</small>` : ''}</span></label>`).join('')}</div></div>`).join('');
  $('#pModalCard').innerHTML = `<button class="icon-btn" data-act="close-modal" aria-label="Close">${ic('x')}</button>
    <div class="pm"><div class="pm-img"><img src="${m.img}" alt="${esc(m.name)}"></div>
    <div class="pm-body"><div class="p-tags" style="position:static">${tagHtml(m)}<span class="tag-s">${m.kcal} kcal</span></div>
      <h2>${esc(m.name)}</h2><p>${esc(m.desc)}</p>${groups}
      <div class="opt-group"><h4>Note for the bar<span>Optional</span></h4><textarea class="note-in" rows="2" maxlength="120" placeholder="e.g. extra hot, name on cup: Sam" id="pmNote"></textarea></div>
      <div class="pm-foot"><div class="qty"><button data-act="pm-dec" aria-label="Less">${ic('minus')}</button><b id="pmQty">1</b><button data-act="pm-inc" aria-label="More">${ic('plus')}</button></div>
      <button class="btn primary" style="flex:1" data-act="pm-add" id="pmAdd">Add · ${fmt(m.price)}</button></div>
    </div></div>`;
  updatePm();
  openModal('#pModal');
}
function readPm() {
  (OPTS[pm.m.opt] || []).forEach(g => {
    const ins = $$(`#pModalCard input[name=${g.id}]`);
    pm.opts[g.id] = g.type === 'radio' ? +((ins.find(i => i.checked) || ins[0]).value) : ins.filter(i => i.checked).map(i => +i.value);
  });
  pm.note = $('#pmNote')?.value.trim() || '';
}
function updatePm() { readPm(); $('#pmQty').textContent = pm.qty; $('#pmAdd').textContent = `Add ${pm.qty > 1 ? pm.qty + ' ' : ''}· ${fmt(unitPrice(pm.m, pm.opts) * pm.qty)}`; }

let lastFocus = null;
function openModal(sel) { lastFocus = document.activeElement; const m = $(sel); m.classList.add('on'); m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; setTimeout(() => $('button, input', m)?.focus({ preventScroll: true }), 50); }
function closeModal(sel) { const ms = sel ? [$(sel)] : $$('.modal.on'); ms.forEach(m => { m.classList.remove('on'); m.setAttribute('aria-hidden', 'true'); }); if (!$('.drawer.on')) document.body.style.overflow = ''; lastFocus?.focus?.({ preventScroll: true }); }

/* ------------------------------------------------------------------ drawer */
function openDrawer() { renderDrawer(); $('#drawer').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { $('#drawer').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on'); document.body.style.overflow = ''; }

function renderCartCount() {
  const n = S.cart.reduce((a, l) => a + l.qty, 0);
  $('#cartCount').textContent = n; $('#cartCount').style.display = n ? '' : 'none';
  const mt = $('.mt-count'); if (mt) { mt.textContent = n; mt.style.display = n ? '' : 'none'; }
}
function lineHtml(l, small) {
  const m = l.m || byId[l.id];
  const unit = l.unit ?? (l.free ? 0 : unitPrice(m, l.opts));
  return `<div class="line-item"><img src="${m.img}" alt="">
    <div><div class="li-name">${small ? l.qty + ' × ' : ''}${esc(m.name)}${l.free ? ' <span class="tag-s new">Reward</span>' : ''}</div><div class="li-opts">${esc(optLabel(m, l.opts))}${l.note ? ' · “' + esc(l.note) + '”' : ''}</div></div>
    <div class="li-right"><span class="price">${l.free ? 'Free' : fmt(unit * l.qty)}</span>
    ${small ? '' : l.free ? `<button class="mono muted" style="font-size:12px" data-act="unredeem" data-id="${l.reward}">Remove</button>` : `<div class="qty sm"><button data-act="dec" data-key="${esc(l.key)}" aria-label="Less">${ic('minus')}</button><b>${l.qty}</b><button data-act="inc" data-key="${esc(l.key)}" aria-label="More">${ic('plus')}</button></div>`}</div></div>`;
}
function sumHtml(t) {
  return `<div class="sum">
    <div><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
    ${t.rewardRows.filter(r => r.r.kind !== 'item').map(r => `<div class="disc"><span>${esc(r.r.name)}${r.note ? ` <small class="muted">(${r.note})</small>` : ''}</span><span>−${fmt(r.v)}</span></div>`).join('')}
    ${t.promo ? `<div class="disc"><span>Promo ${S.promo} · ${t.promo.label}</span><span>${t.promoDisc ? '−' + fmt(t.promoDisc) : '✓'}</span></div>` : ''}
    ${S.ful === 'delivery' ? `<div><span>Delivery</span><span>${t.delivery ? fmt(t.delivery) : 'Free'}</span></div><div><span>Rider tip</span><span>${t.tip ? fmt(t.tip) : '—'}</span></div>` : `<div><span>Collection</span><span>Free</span></div>`}
    <div><span>GST (5%)</span><span>${fmt(t.tax)}</span></div>
    <div class="tot"><span>Total</span><span>${fmt(t.total)}</span></div></div>`;
}
function earnHtml(t) {
  return S.user
    ? `<div class="earn-note">${ic('star')}<span>You'll earn <b>${t.earn} crumbs</b> on this order${S.ful === 'collection' ? ' (incl. +10% collection bonus)' : ''}.</span></div>`
    : `<div class="earn-note">${ic('star')}<span><a href="#/account" style="text-decoration:underline">Join the club</a> to earn <b>${t.earn} crumbs</b> on this order.</span></div>`;
}
function renderDrawer() {
  const body = $('#drawerBody'), foot = $('#drawerFoot');
  const t = totals();
  if (!S.cart.length) {
    body.innerHTML = `<div class="empty"><svg style="width:90px;height:90px;color:var(--accent)"><use href="#i-cup"/></svg><h3>Your bag is empty</h3><p>Start with a flat white. Everyone does.</p><a href="#/menu" class="btn primary" data-close-drawer style="margin-top:12px">Browse menu</a></div>`;
    foot.innerHTML = ''; return;
  }
  const toFree = Math.max(0, 499 - t.sub);
  body.innerHTML = `
    <div class="mini-seg"><button class="${S.ful === 'delivery' ? 'on' : ''}" data-act="ful" data-val="delivery">${ic('scooter')}Delivery</button><button class="${S.ful === 'collection' ? 'on' : ''}" data-act="ful" data-val="collection">${ic('hatch')}Collection</button></div>
    ${S.ful === 'delivery' ? (t.freeDel ? `<p class="progress-free">${ic('check')} <b>Free delivery</b> unlocked${S.sub ? ' with Crumb Club+' : ''}.</p>` : `<p class="progress-free">Add <b>${fmt(toFree)}</b> more for free delivery<span class="bar"><i style="width:${Math.min(100, t.sub / 499 * 100)}%"></i></span></p>`) : `<p class="progress-free">${ic('clock')} Ready at the hatch in ~12 min · Kitchen No. 4</p>`}
    ${t.lines.map(l => lineHtml(l)).join('')}
    ${t.rewardRows.filter(r => r.r.kind !== 'item').map(r => `<div class="line-item li-reward"><span class="gift">${ic('gift')}</span><div><div class="li-name">${esc(r.r.name)}</div><div class="li-opts">${r.note || `−${fmt(r.v)} · uses ${r.r.cost} crumbs`}</div></div><div class="li-right"><button class="mono muted" style="font-size:12px" data-act="unredeem" data-id="${r.r.id}">Remove</button></div></div>`).join('')}
    ${upsellHtml()}`;
  foot.innerHTML = `
    ${S.ful === 'delivery' ? `<div class="row gap" style="margin-bottom:12px;font-size:13.5px"><span class="mono muted" style="font-size:11.5px;text-transform:uppercase">Tip rider</span>${[0, 20, 30, 50].map(v => `<button class="chip ${S.tip === v ? 'on' : ''}" style="height:32px" data-act="tip" data-val="${v}">${v ? fmt(v) : 'No tip'}</button>`).join('')}</div>` : ''}
    <form class="promo" id="promoForm"><input name="code" placeholder="Promo code (try CRUMB10)" value="${esc(S.promo || '')}" aria-label="Promo code"><button class="btn sm ghost" type="submit">${S.promo ? 'Remove' : 'Apply'}</button></form>
    ${sumHtml(t)}${earnHtml(t)}
    ${S.cart.some(l => !l.free) ? `<a href="#/checkout" class="btn primary block" data-close-drawer>Checkout · ${fmt(t.total)} ${ic('arrow')}</a>` : `<a href="#/menu" class="btn dark block" data-close-drawer>Add something to go with your reward ${ic('arrow')}</a>`}`;
}
function upsellHtml() {
  const inCart = new Set(S.cart.map(l => l.id));
  const ups = ['cookie', 'croissant', 'brownie', 'cinnamon-knot', 'banana-bread', 'donut'].filter(id => !inCart.has(id)).slice(0, 4);
  if (!ups.length) return '';
  return `<div class="upsell"><h4>Goes well with</h4><div class="upsell-row">${ups.map(id => { const m = byId[id]; return `<button class="up-card" data-act="add" data-id="${id}"><img src="${m.img}" alt=""><b>${m.name}</b><span>+ ${fmt(m.price)}</span></button>`; }).join('')}</div></div>`;
}

/* ------------------------------------------------------------------ redeem */
function redeem(rid) {
  const r = REWARDS.find(x => x.id === rid); if (!r) return;
  if (!S.user) { toast('Sign in to use your crumbs', 'user'); location.hash = '#/account'; return; }
  const t = totals();
  if (S.points - t.cost < r.cost) { toast(`You need ${r.cost - (S.points - t.cost)} more crumbs`, 'star'); return; }
  if (S.redeem.includes(rid)) { toast('Already in your bag', 'gift'); return; }
  S.redeem.push(rid);
  if (r.kind === 'item') S.cart.push({ key: 'reward|' + rid, id: r.item, opts: defaultOpts(byId[r.item]), qty: 1, free: true, reward: rid });
  save(); renderCartCount(); renderDrawer(); toast(`${r.name} added to your bag`, 'gift');
  if (location.hash.startsWith('#/rewards')) renderRewards();
}
function unredeem(rid) {
  S.redeem = S.redeem.filter(x => x !== rid);
  S.cart = S.cart.filter(l => l.reward !== rid);
  save(); renderCartCount(); renderDrawer();
  if (location.hash.startsWith('#/checkout')) renderCheckout();
}

/* ------------------------------------------------------------------ member card + stamps */
function memberCardHtml() {
  const u = S.user, lt = S.lifetime, tier = tierOf(lt);
  const name = u ? u.name : 'Your name here';
  return `<div class="mc-inner"><div class="mc-face mc-front"><div class="mc-sheen"></div>
      <div class="mc-top"><span class="mc-brand">Crumb<em>Club</em></span><span class="mc-tier">${tier.name}</span></div>
      <div class="mc-chip"></div>
      <div class="mc-bot"><div class="mc-pts">${u ? S.points.toLocaleString('en-IN') : '0'}<small>crumbs to spend</small></div><div class="mc-name">${esc(name)}<small>${u ? 'Member since ' + new Date(u.since).getFullYear() : 'Join free'}</small></div></div></div>
    <div class="mc-face mc-back"><div class="mc-sheen"></div><p class="mono">SCAN AT THE HATCH · MEMBER ${u ? 'CC-' + (u.email.length * 7919 % 90000 + 10000) : '— — —'}</p><div class="barcode"></div>
      <p>${tier.mult}× crumbs on every ₹10 · ${nextTier(lt) ? `${nextTier(lt).min - lt} lifetime crumbs to ${nextTier(lt).name}` : 'Top tier — thank you!'}</p>
      <p style="margin-top:auto" class="mono">crumbclub.cafe/club</p></div></div>`;
}
function renderMemberCards() { $$('.member-card').forEach(c => { c.innerHTML = memberCardHtml(); }); }
function stampsHtml() {
  const n = S.user ? S.stamps : 3;
  return Array.from({ length: 8 }, (_, i) => i === 7
    ? `<span class="stamp ${n >= 8 ? 'on' : 'free'}" style="--i:${i}">FREE</span>`
    : `<span class="stamp ${i < n ? 'on' : ''}" style="--i:${i}">${i < n ? ic('cup') : i + 1}</span>`).join('');
}
function renderStamps() { $$('.stamp-card').forEach(s => { s.innerHTML = stampsHtml(); }); }

document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('.tilt'); if (!c || !finePointer) return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  const flip = c.classList.contains('flip') ? 180 : 0;
  c.style.transform = `rotateY(${(x - .5) * 22}deg) rotateX(${(.5 - y) * 18}deg)`;
  c.style.setProperty('--mx', (flip ? 100 - x * 100 : x * 100) + '%'); c.style.setProperty('--my', y * 100 + '%');
});
document.addEventListener('pointerout', e => { const c = e.target.closest?.('.tilt'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });

/* ------------------------------------------------------------------ map (SVG, used on home + tracking) */
const ROUTE = 'M110 420 L110 300 L260 300 L260 190 L420 190 L420 110 L520 110';
function mapHtml(withEta) {
  const xs = [0, 110, 260, 420, 540, 600], ys = [0, 110, 190, 300, 420, 520];
  let blocks = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const x = xs[i] + 14, y = ys[j] + 14, w = xs[i + 1] - xs[i] - 28, h = ys[j + 1] - ys[j] - 28;
    if (w <= 0 || h <= 0) continue;
    const cls = (i === 1 && j === 3) ? 'park' : (i === 4 && j === 4) ? 'water' : (i === 0 && j === 1) ? 'park' : 'block';
    blocks += `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>`;
  }
  const streets = xs.slice(1, -1).map(x => `<path class="street" d="M${x} -10V530"/>`).join('') + ys.slice(1, -1).map(y => `<path class="street ${y === 300 ? 'main' : ''}" d="M-10 ${y}H610"/>`).join('');
  return `<div class="map"><svg viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${blocks}${streets}
      <path class="route-bg" d="${ROUTE}"/><path class="route" d="${ROUTE}" stroke-dasharray="1000" stroke-dashoffset="1000"/></svg>
    <div class="map-pin" style="left:${110 / 6}%;top:${420 / 5.2}%"><b>Kitchen No. 4</b><i></i></div>
    <div class="map-pin home" style="left:${520 / 6}%;top:${110 / 5.2}%"><b>You</b><i></i></div>
    <div class="rider" style="left:${110 / 6}%;top:${420 / 5.2}%">${ic('scooter')}</div>
    ${withEta ? `<div class="map-eta"><span>Arriving in</span><b class="eta-v">— min</b></div>` : ''}</div>`;
}
function setRider(mapEl, p) {
  const path = $('.route', mapEl), rider = $('.rider', mapEl);
  if (!path || !rider) return;
  const L = path.getTotalLength(), pt = path.getPointAtLength(L * p);
  path.setAttribute('stroke-dasharray', L); path.setAttribute('stroke-dashoffset', L * (1 - p));
  rider.style.left = pt.x / 6 + '%'; rider.style.top = pt.y / 5.2 + '%';
}

/* ------------------------------------------------------------------ rewards view */
function renderRewards() {
  const t = totals(); const avail = S.points - t.cost;
  $('#rwBalance').innerHTML = S.user
    ? `<b>${avail.toLocaleString('en-IN')}</b><div><strong>crumbs available</strong><br><span class="muted">${tierOf(S.lifetime).name} member · ${S.lifetime.toLocaleString('en-IN')} lifetime</span></div>`
    : `<div><strong>You have 0 crumbs.</strong><br><span class="muted">Join free and get 50 welcome crumbs.</span></div><a href="#/account" class="btn primary sm">Join the club</a>`;
  $('#rewardsGrid').innerHTML = REWARDS.map(r => {
    const used = S.redeem.includes(r.id), can = S.user && avail >= r.cost;
    return `<article class="rw-card"><div class="rw-img"><img src="${r.img}" alt="" loading="lazy"><span class="rw-cost">${r.cost} crumbs</span></div>
      <div class="rw-body"><h4>${r.name}</h4><p>${r.desc}</p>
      ${used ? `<button class="btn sm ghost" data-act="unredeem" data-id="${r.id}">${ic('check')} In your bag · remove</button>` : can ? `<button class="btn sm primary" data-act="redeem" data-id="${r.id}">Redeem</button>` : `<span class="rw-lock">${S.user ? `${r.cost - avail} more crumbs to go` : 'Sign in to redeem'}</span>`}</div></article>`;
  }).join('');
  const cur = tierOf(S.lifetime).id;
  $('#tiers').innerHTML = TIERS.map(tr => `<div class="tier ${S.user && tr.id === cur ? 'cur' : ''}">${S.user && tr.id === cur ? '<span class="status live t-badge">You are here</span>' : ''}<span class="mult">${tr.mult}×</span><h3>${tr.name}</h3><span class="mono">${tr.min ? tr.min.toLocaleString('en-IN') + '+ lifetime crumbs' : 'From your first order'}</span><ul>${tr.perks.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('');
  renderMemberCards(); renderStamps();
}

/* ------------------------------------------------------------------ checkout */
function slotList() {
  const d = new Date(); d.setSeconds(0, 0); d.setMinutes(Math.ceil((d.getMinutes() + 20) / 15) * 15);
  const out = ['ASAP · ~12 min'];
  for (let i = 0; i < 5; i++) { out.push(d.toTimeString().slice(0, 5)); d.setMinutes(d.getMinutes() + 15); }
  return out;
}
const cardBrand = n => /^3[47]/.test(n) ? 'amex' : /^(5[1-5]|2[2-7])/.test(n) ? 'mastercard' : /^(60|65|81|82|508)/.test(n) ? 'rupay' : /^4/.test(n) ? 'visa' : '';
const luhn = n => { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return n.length >= 13 && s % 10 === 0; };

function field(name, label, attrs = '', cls = '') {
  return `<label class="field ${cls}"><span>${label}</span><input name="${name}" value="${esc(S.draft[name] || '')}" ${attrs}></label>`;
}
function renderCheckout() {
  const el = $('#checkout');
  const t = totals();
  if (!S.cart.some(l => !l.free)) {
    el.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nothing to check out yet.</h3><p>${S.cart.length ? 'Your reward is waiting — add something to go with it.' : 'Your bag is empty — the counter is not.'}</p><a class="btn primary" href="#/menu" style="margin-top:14px">Browse the menu</a></div>`;
    return;
  }
  if (S.draft.line1 == null && S.address) S.draft.line1 = S.address;
  const slots = slotList();
  const deliveryHtml = `
    ${S.addresses.length ? `<div class="slots" style="margin-bottom:14px">${S.addresses.map((a, i) => `<button class="chip ${S.draft.line1 === a.line ? 'on' : ''}" data-act="pick-addr" data-i="${i}">${ic('pin')}${esc(a.label)}</button>`).join('')}</div>` : ''}
    <div class="f-grid">${field('line1', 'Street & number', 'required autocomplete="street-address" placeholder="Flat / house, street"', 'full')}${field('area', 'Area / landmark', 'placeholder="Near the old post office"')}${field('notes', 'Rider notes', 'placeholder="Leave at the door, ring twice"')}</div>
    <p class="secure">${ic('clock')} Estimated arrival <b>&nbsp;24–30 min</b>&nbsp;· within our 5 km zone</p>`;
  const collectHtml = `
    <div class="pickup-card"><img src="img/counter.jpg" alt=""><div><b>Kitchen No. 4 · the hatch</b><br><span class="muted" style="font-size:13.5px">Market Lane, next to the bookshop · open 7am – 11pm</span></div></div>
    <p class="mono muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">Pick-up time</p>
    <div class="slots">${slots.map((s, i) => `<button class="chip ${S.slot === i ? 'on' : ''}" data-act="slot" data-val="${i}">${ic('clock')}${s}</button>`).join('')}</div>`;

  const bn = (S.draft.cnum || '').replace(/\D/g, ''); const brand = cardBrand(bn);
  const savedCards = S.cards.length ? `<div class="wallets" style="margin-bottom:16px">${S.cards.map((c, i) => `<label class="set-row" style="margin:0;cursor:pointer"><span class="row gap"><input type="radio" name="savedcard" value="${i}" ${S.payCard === i ? 'checked' : ''} style="accent-color:var(--accent);width:18px;height:18px"><span><b>${c.brand} •••• ${c.last4}</b><span>Expires ${c.exp}</span></span></span>${i === 0 ? '<span class="status ok">Default</span>' : ''}</label>`).join('')}<label class="set-row" style="margin:0;cursor:pointer"><span class="row gap"><input type="radio" name="savedcard" value="new" ${S.payCard === 'new' ? 'checked' : ''} style="accent-color:var(--accent);width:18px;height:18px"><b>Use a new card</b></span></label></div>` : '';
  const cardForm = `
    <div class="card-zone ${S.cards.length && S.payCard !== 'new' ? 'hide' : ''}" id="cardZone">
      <div class="cc" id="cc" data-brand="${brand}"><div class="cc-inner">
        <div class="cc-face"><div class="cc-row"><span class="cc-chip"></span><span class="cc-brand" id="ccBrand">${brand ? brand.toUpperCase() : 'CARD'}</span></div>
          <div class="cc-num" id="ccNum">${fmtCardShow(bn)}</div>
          <div class="cc-meta"><span><small>Card holder</small><span id="ccName">${esc(S.draft.cname || 'YOUR NAME')}</span></span><span><small>Expires</small><span id="ccExp">${esc(S.draft.cexp || 'MM/YY')}</span></span></div></div>
        <div class="cc-face cc-back"><div class="strip"></div><div class="cvc" id="ccCvc">${'•'.repeat((S.draft.ccvc || '').length) || 'CVC'}</div></div>
      </div></div>
      <div class="f-grid">
        ${field('cnum', 'Card number', 'inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23"', 'full')}
        ${field('cname', 'Name on card', 'autocomplete="cc-name" placeholder="As printed"', 'full')}
        ${field('cexp', 'Expiry', 'inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"')}
        ${field('ccvc', 'CVC', 'inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"')}
        <div class="full row gap" style="justify-content:space-between"><label class="check"><input type="checkbox" name="savecard" checked> Save card for next time</label><button type="button" class="mono" style="font-size:12.5px;text-decoration:underline" data-act="test-card">Use test card 4242</button></div>
      </div>
    </div>`;
  const payBody = S.pay === 'card' ? savedCards + cardForm
    : S.pay === 'wallet' ? `<div class="wallets">
        <button class="wallet-btn apple" data-act="wallet" data-val="apple">${ic('apple')} Pay</button>
        <button class="wallet-btn gpay" data-act="wallet" data-val="gpay"><svg><use href="#i-google"/></svg> Pay</button>
        <button class="wallet-btn paypal" data-act="wallet" data-val="paypal">Pay<b>Pal</b></button></div>
        <p class="secure">${ic('lock')} Wallets confirm on your device — we never see your card number.</p>`
    : `<div class="upi-zone"><div class="qr">${qrSvg('upi://pay?pa=crumbclub@okhdfc&am=' + t.total)}</div>
        <div><p style="margin:0 0 10px"><b>Scan with any UPI app</b> or enter your UPI ID.</p>
        <div class="f-grid">${field('vpa', 'UPI ID', 'placeholder="yourname@okaxis" autocomplete="off"', 'full')}</div>
        <div class="upi-apps"><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>BHIM</span></div></div></div>`;

  el.innerHTML = `<form id="coForm" novalidate autocomplete="on">
    <div class="co-step"><h3><i>1</i>How &amp; where</h3>
      <div class="mini-seg"><button type="button" class="${S.ful === 'delivery' ? 'on' : ''}" data-act="ful" data-val="delivery">${ic('scooter')}Delivery</button><button type="button" class="${S.ful === 'collection' ? 'on' : ''}" data-act="ful" data-val="collection">${ic('hatch')}Collection</button></div>
      ${S.ful === 'delivery' ? deliveryHtml : collectHtml}</div>
    <div class="co-step"><h3><i>2</i>Your details</h3>
      <div class="f-grid">${field('name', 'Full name', 'required autocomplete="name" placeholder="Aanya Kapoor"')}${field('phone', 'Mobile', 'required type="tel" autocomplete="tel" placeholder="+91 98xxx xxxxx"')}${field('email', 'Email for receipt', 'type="email" autocomplete="email" placeholder="you@email.com"', 'full')}
      ${S.user ? '' : `<label class="check full"><input type="checkbox" name="join" ${S.draft.join === false ? '' : 'checked'}> Create my free Crumb Club account and earn <b>&nbsp;${t.earn + 50} crumbs&nbsp;</b> today (incl. 50 welcome crumbs)</label>`}</div></div>
    <div class="co-step"><h3><i>3</i>Payment</h3>
      <div class="pay-tabs">
        <button type="button" class="${S.pay === 'card' ? 'on' : ''}" data-act="paytab" data-val="card">${ic('card')}Card</button>
        <button type="button" class="${S.pay === 'wallet' ? 'on' : ''}" data-act="paytab" data-val="wallet">${ic('wallet')}Wallets</button>
        <button type="button" class="${S.pay === 'upi' ? 'on' : ''}" data-act="paytab" data-val="upi"><b style="font-size:17px;font-style:italic;line-height:22px">UPI</b>Any UPI app</button>
      </div>${payBody}
      <p class="secure">${ic('lock')} 256-bit encrypted · PCI-DSS via Stripe / Razorpay · 3-D Secure ready</p></div>
    </form>
    <aside class="co-summary"><h3>Your order</h3>
      ${t.lines.map(l => lineHtml(l, true)).join('')}
      ${sumHtml(t)}${earnHtml(t)}
      ${S.pay === 'wallet' ? `<p class="demo-note" style="margin:0 0 12px">Choose Apple Pay, Google Pay or PayPal on the left to pay.</p>` : `<button class="btn primary block" data-act="place">${ic('lock')} Pay ${fmt(t.total)}</button>`}
      <p class="demo-note">Demo mode — no real payment is taken.</p></aside>`;
}
function fmtCardShow(n) { const s = (n || '').padEnd(16, '•'); return s.replace(/(.{4})/g, '$1 ').trim(); }
function qrSvg(seed) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const N = 25; let cells = '';
  const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#111"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#111"/>`;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if ((x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)) continue;
    if (rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges"><g fill="#111">${cells}</g>${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}</svg>`;
}

function checkoutInput(e) {
  const i = e.target; if (!i.name || !i.closest('#coForm')) return;
  if (i.type === 'checkbox') { S.draft[i.name] = i.checked; save(); return; }
  if (i.name === 'savedcard') { S.payCard = i.value === 'new' ? 'new' : +i.value; $('#cardZone')?.classList.toggle('hide', S.payCard !== 'new'); save(); return; }
  let v = i.value;
  if (i.name === 'cnum') { const d = v.replace(/\D/g, '').slice(0, 19); v = d.replace(/(.{4})/g, '$1 ').trim(); i.value = v; const b = cardBrand(d); $('#cc')?.setAttribute('data-brand', b); $('#ccBrand') && ($('#ccBrand').textContent = b ? b.toUpperCase() : 'CARD'); $('#ccNum') && ($('#ccNum').textContent = fmtCardShow(d)); }
  if (i.name === 'cexp') { let d = v.replace(/\D/g, '').slice(0, 4); if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2); v = d; i.value = v; $('#ccExp') && ($('#ccExp').textContent = v || 'MM/YY'); }
  if (i.name === 'ccvc') { v = v.replace(/\D/g, '').slice(0, 4); i.value = v; $('#ccCvc') && ($('#ccCvc').textContent = '•'.repeat(v.length) || 'CVC'); }
  if (i.name === 'cname') $('#ccName') && ($('#ccName').textContent = v.toUpperCase() || 'YOUR NAME');
  i.closest('.field')?.classList.remove('err');
  S.draft[i.name] = v; save();
}
document.addEventListener('input', checkoutInput);
document.addEventListener('change', e => { if (e.target.name === 'savedcard' || e.target.type === 'checkbox') checkoutInput(e); if (e.target.closest('#pModalCard')) updatePm(); });
document.addEventListener('focusin', e => { if (e.target.name === 'ccvc') $('#cc')?.classList.add('flip'); });
document.addEventListener('focusout', e => { if (e.target.name === 'ccvc') $('#cc')?.classList.remove('flip'); });

function validate(needCard) {
  const f = $('#coForm'); if (!f) return false;
  const bad = [];
  const req = ['name', 'phone']; if (S.ful === 'delivery') req.push('line1');
  req.forEach(n => { if (!(S.draft[n] || '').trim()) bad.push(n); });
  if ((S.draft.phone || '').replace(/\D/g, '').length && (S.draft.phone || '').replace(/\D/g, '').length < 8) bad.push('phone');
  if (needCard && S.pay === 'card' && (S.payCard === 'new' || !S.cards.length)) {
    const n = (S.draft.cnum || '').replace(/\D/g, '');
    if (!luhn(n)) bad.push('cnum');
    const [mm, yy] = (S.draft.cexp || '').split('/').map(Number);
    const now = new Date(); if (!mm || mm > 12 || !yy || (2000 + yy) * 12 + mm < now.getFullYear() * 12 + now.getMonth() + 1) bad.push('cexp');
    if (!/^\d{3,4}$/.test(S.draft.ccvc || '')) bad.push('ccvc');
    if (!(S.draft.cname || '').trim()) bad.push('cname');
  }
  if (needCard && S.pay === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(S.draft.vpa || '')) bad.push('vpa');
  bad.forEach(n => { const fl = $(`[name=${n}]`, f)?.closest('.field'); if (fl) { fl.classList.remove('err'); void fl.offsetWidth; fl.classList.add('err'); } });
  if (bad.length) { $(`[name=${bad[0]}]`, f)?.focus(); toast('Please check the highlighted fields', 'x'); return false; }
  return true;
}

function payLabel(method) {
  if (method === 'card') {
    if (S.cards.length && S.payCard !== 'new') { const c = S.cards[S.payCard]; return `${c.brand} •••• ${c.last4}`; }
    const n = (S.draft.cnum || '').replace(/\D/g, ''); const b = cardBrand(n);
    return `${b ? ({ visa: 'VISA', mastercard: 'Mastercard', amex: 'Amex', rupay: 'RuPay' })[b] : 'Card'} •••• ${n.slice(-4)}`;
  }
  return { apple: 'Apple Pay', gpay: 'Google Pay', paypal: 'PayPal' }[method] || ('UPI · ' + (S.draft.vpa || ''));
}

function placeOrder(method) {
  const t = totals();
  const ov = $('#payOverlay');
  ov.innerHTML = `<div class="brew"><div class="brew-cup"><span class="steam"></span><span class="steam"></span><span class="steam"></span><div class="body"><div class="fill"></div></div><div class="handle"></div></div>
    <h2 id="brewMsg">Authorising payment…</h2><p id="brewSub">${esc(payLabel(method))} · ${fmt(t.total)}</p>
    <div class="brew-steps"><span class="on">Pay</span><span>Confirm</span><span>Brew</span></div></div>`;
  ov.classList.add('on'); ov.setAttribute('aria-hidden', 'false');
  const steps = $$('.brew-steps span', ov);
  setTimeout(() => { $('#brewMsg').textContent = method === 'card' ? '3-D Secure check…' : 'Confirming…'; steps[1].classList.add('on'); }, 900);
  setTimeout(() => { $('#brewMsg').textContent = 'Sending to the bar…'; steps[2].classList.add('on'); }, 1800);
  setTimeout(() => {
    // create account on the fly if requested
    let joined = false;
    if (!S.user && S.draft.join !== false) {
      S.user = { name: S.draft.name, email: S.draft.email || (S.draft.name || 'guest').toLowerCase().replace(/\s+/g, '.') + '@mail.com', phone: S.draft.phone, since: new Date().toISOString().slice(0, 10) };
      S.points += 50; S.lifetime += 50; S.ledger.unshift({ t: Date.now(), d: 'Welcome to the club', v: 50 }); joined = true;
    }
    if (method === 'card' && (S.payCard === 'new' || !S.cards.length) && S.draft.savecard !== false && S.user) {
      const n = (S.draft.cnum || '').replace(/\D/g, ''); const b = cardBrand(n);
      if (!S.cards.some(c => c.last4 === n.slice(-4))) S.cards.push({ brand: b === 'mastercard' ? 'Mastercard' : b === 'amex' ? 'Amex' : b === 'rupay' ? 'RuPay' : 'VISA', last4: n.slice(-4), exp: S.draft.cexp, name: S.draft.cname });
    }
    const id = 'CC-' + (4800 + S.orders.length * 7 + Math.floor(Math.random() * 6));
    const slots = slotList();
    const order = {
      id, at: Date.now(), ful: S.ful, pay: payLabel(method),
      lines: t.lines.map(l => ({ key: l.key, id: l.id, opts: l.opts, qty: l.qty, unit: l.unit, note: l.note, free: l.free })),
      addr: S.ful === 'delivery' ? [S.draft.line1, S.draft.area].filter(Boolean).join(', ') : 'Kitchen No. 4 hatch',
      slot: S.ful === 'collection' ? slots[S.slot] : '', name: S.draft.name,
      t: { sub: t.sub, disc: t.rewardDisc + t.promoDisc, delivery: t.delivery, tax: t.tax, tip: t.tip, total: t.total },
      earned: S.user ? t.earn : 0,
    };
    S.orders.unshift(order);
    if (S.user) {
      S.points += t.earn - t.cost; S.lifetime += t.earn;
      S.ledger.unshift({ t: Date.now(), d: `Order ${id}${S.ful === 'collection' ? ' · collection bonus' : ''}`, v: t.earn });
      if (t.cost) S.ledger.unshift({ t: Date.now(), d: 'Redeemed: ' + S.redeem.map(r => REWARDS.find(x => x.id === r)?.name).join(', '), v: -t.cost });
      const cups = t.lines.filter(l => ['coffee', 'cold', 'tea'].includes(l.m.cat)).reduce((n, l) => n + l.qty, 0);
      S.stamps = Math.min(8, S.stamps + cups);
    }
    S.cart = []; S.redeem = []; S.promo = null;
    ['cnum', 'ccvc', 'cexp', 'cname', 'vpa'].forEach(k => delete S.draft[k]);
    save(); renderCartCount();
    ov.classList.remove('on'); ov.setAttribute('aria-hidden', 'true');
    location.hash = '#/track/' + id;
    setTimeout(() => { confetti(); toast(joined ? `Welcome to the club! +${order.earned + 50} crumbs` : order.earned ? `Order placed · +${order.earned} crumbs` : 'Order placed — the bar is on it', 'star'); }, 300);
  }, 2800);
}

function walletSheet(kind) {
  const t = totals();
  const title = { apple: 'Apple Pay', gpay: 'Google Pay', paypal: 'PayPal' }[kind];
  $('#sheetCard').innerHTML = `<button class="icon-btn" data-act="close-modal" aria-label="Close">${ic('x')}</button>
    <div class="wallet-sheet"><h3>${kind === 'apple' ? ic('apple') : kind === 'gpay' ? '<svg><use href="#i-google"/></svg>' : ''} ${title}</h3>
      <div class="rowx"><span class="muted">Pay</span><b>CRUMB CLUB · KITCHEN NO. 4</b></div>
      <div class="rowx"><span class="muted">Card</span><b>${kind === 'paypal' ? 'PayPal balance' : 'VISA •••• 4242'}</b></div>
      <div class="rowx"><span class="muted">${S.ful === 'delivery' ? 'Deliver to' : 'Collect'}</span><b>${esc(S.ful === 'delivery' ? (S.draft.line1 || 'Your address') : 'Kitchen No. 4 hatch')}</b></div>
      <div class="amt">${fmt(t.total)}</div>
      <div class="faceid" id="faceid">${kind === 'apple' ? ic('user') : ic('lock')}</div>
      <p class="muted" id="walletMsg" style="margin:0">${kind === 'apple' ? 'Double-click side button to pay' : kind === 'gpay' ? 'Tap to verify with your screen lock' : 'Log in to PayPal to approve'}</p>
      <button class="btn dark block" data-act="wallet-confirm" data-val="${kind}">Confirm with ${title}</button>
      <p class="demo-note" style="color:var(--muted)">Simulated wallet sheet — demo mode.</p></div>`;
  openModal('#sheet');
}

/* ------------------------------------------------------------------ tracking */
const PH = {
  delivery: [['Order received', 'The bar has your ticket.', 'receipt', 0], ['Brewing & baking', 'Shots pulled, bakes warming.', 'cup', 6], ['Packed & sealed', 'Insulated bag, tamper seal on.', 'bag', 16], ['On the way', 'Your rider is heading over.', 'scooter', 24], ['At your door', 'Enjoy it hot!', 'check', 70]],
  collection: [['Order received', 'The bar has your ticket.', 'receipt', 0], ['Brewing & baking', 'Shots pulled, bakes warming.', 'cup', 6], ['Ready at the hatch', 'Show your code at the window.', 'hatch', 22], ['Collected', 'See you tomorrow?', 'check', 1e9]],
};
function phaseOf(o) {
  const ph = PH[o.ful]; const el = o.done ? 1e10 : (Date.now() - o.at) / 1000;
  let i = 0; ph.forEach((p, k) => { if (el >= p[3]) i = k; });
  if (o.done) i = ph.length - 1;
  return { ph, i, el };
}
let trackTimer = null, trackId = null;
function renderTrack(id) {
  clearInterval(trackTimer); trackId = null;
  const el = $('#track');
  const o = id ? S.orders.find(x => x.id === id) : S.orders.find(x => !x.done && phaseOf(x).i < PH[x.ful].length - 1);
  if (!o) {
    el.innerHTML = `<div class="track-head"><div><p class="eyebrow mono">Track an order</p><h1 class="h1 sm">No live orders<br>right <em>now</em>.</h1></div></div>
      <div class="track-grid"><div class="track-panel"><form id="trackForm" class="row gap" style="flex-wrap:nowrap"><label class="field" style="flex:1"><span>Order number</span><input name="oid" placeholder="CC-4790" style="text-transform:uppercase"></label><button class="btn primary" style="align-self:end">Track</button></form>
      ${S.orders.length ? `<h3 class="mono muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:26px 0 12px">Recent orders</h3>${S.orders.slice(0, 4).map(orderCard).join('')}` : `<p class="muted" style="margin-top:20px">Place an order and you'll be able to follow it here, live.</p><a class="btn ghost sm" href="#/menu">Browse the menu</a>`}</div>
      <div>${mapHtml(false)}</div></div>`;
    return;
  }
  trackId = o.id;
  const isD = o.ful === 'delivery';
  el.innerHTML = `<div class="track-head"><div><p class="eyebrow mono">Order ${o.id} · ${new Date(o.at).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p><h1 class="h1 sm" id="trkTitle">…</h1></div>
      <div class="row gap"><button class="btn ghost sm" data-act="receipt" data-id="${o.id}">${ic('receipt')} Receipt</button><button class="btn ghost sm" data-act="reorder" data-id="${o.id}">${ic('repeat')} Order again</button></div></div>
    <div class="track-grid">
      <div>${isD ? mapHtml(true) : `<div class="track-panel"><h3 class="mono muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px">Collection</h3><p style="margin:0;font:400 30px/1.1 var(--display)">Kitchen No. 4 hatch · ${esc(o.slot || 'ASAP')}</p>
        <div class="collect-code"><div class="qr">${qrSvg(o.id)}</div><div><span class="mono muted" style="font-size:12px;text-transform:uppercase">Your pick-up code</span><b class="code">${o.id.slice(-4)}</b><p class="muted" style="margin:6px 0 0;font-size:14px">Show this at the window. Name on cup: <b>${esc((o.name || S.user?.name || 'Guest').split(' ')[0])}</b></p></div></div></div>`}</div>
      <div class="track-panel"><ol class="timeline" id="timeline"></ol>
        <hr style="border:0;border-top:1px dashed var(--line);margin:18px 0">
        ${o.lines.map(l => lineHtml({ ...l, m: byId[l.id] }, true)).join('')}
        <div class="sum" style="margin-top:12px"><div class="tot"><span>Paid · ${esc(o.pay)}</span><span>${fmt(o.t.total)}</span></div></div>
        ${o.earned ? `<div class="earn-note">${ic('star')}<span><b>+${o.earned} crumbs</b> added to your card.</span></div>` : ''}
      </div></div>`;
  const tick = () => {
    if (!$('#timeline')) { clearInterval(trackTimer); return; }
    const { ph, i, el: secs } = phaseOf(o);
    $('#timeline').innerHTML = ph.map((p, k) => `<li class="${k < i || (k === i && k === ph.length - 1) ? 'done' : k === i ? 'now' : ''}"><span class="tl-dot">${ic(p[2])}</span><div><b>${p[0]}</b><small>${p[1]}</small></div><time>${k <= i ? new Date(o.at + p[3] * 1000 * (o.done ? 20 : 1)).toTimeString().slice(0, 5) : ''}</time></li>`).join('');
    $('#trkTitle').innerHTML = i === ph.length - 1 ? (isD ? 'Delivered.<br><em>Enjoy</em> it hot.' : 'Collected.<br>See you <em>soon</em>.') : `${ph[i][0]}<em>.</em>`;
    if (isD) {
      const start = ph[3][3], end = ph[4][3];
      const p = Math.max(0, Math.min(1, (secs - start) / (end - start)));
      setRider($('#track .map'), i >= 3 ? p : 0);
      const mins = Math.max(0, Math.ceil(((end - secs) / (end)) * 26));
      const etaEl = $('#track .eta-v'); if (etaEl) etaEl.textContent = i === ph.length - 1 ? 'Arrived' : `${mins} min`;
    }
    if (i === ph.length - 1 && !o.done && isD) { o.done = true; save(); }
  };
  tick(); trackTimer = setInterval(tick, 1000);
}

/* ------------------------------------------------------------------ account */
function orderCard(o) {
  const live = !o.done && phaseOf(o).i < PH[o.ful].length - 1;
  const items = o.lines.reduce((n, l) => n + l.qty, 0);
  return `<div class="order-card"><div class="oc-thumbs">${o.lines.slice(0, 3).map(l => `<img src="${byId[l.id].img}" alt="">`).join('')}</div>
    <div class="oc-meta"><b>${o.id} · ${fmt(o.t.total)}</b><span>${new Date(o.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${items} item${items > 1 ? 's' : ''} · ${o.ful === 'delivery' ? 'Delivery' : 'Collection'} · ${esc(o.pay)}</span><br>
      <span class="status ${live ? 'live' : 'ok'}">${live ? '● ' + PH[o.ful][phaseOf(o).i][0] : (o.ful === 'delivery' ? 'Delivered' : 'Collected')}</span>${o.earned ? ` <span class="status">+${o.earned} crumbs</span>` : ''}</div>
    <div class="oc-actions">${live ? `<a class="btn sm primary" href="#/track/${o.id}">Track</a>` : ''}<button class="btn sm ghost" data-act="receipt" data-id="${o.id}">${ic('receipt')} Receipt</button><button class="btn sm dark" data-act="reorder" data-id="${o.id}">${ic('repeat')} Reorder</button></div></div>`;
}
let authTab = 'in';
function renderAccount(tab = 'orders') {
  const el = $('#account');
  if (!S.user) {
    el.innerHTML = `<div class="auth"><div><p class="eyebrow mono">Your account</p><h1 class="h1 sm">Your cafe,<br><em>remembered</em>.</h1>
        <p class="lead">One account for everything — order history, one-tap reorders, saved addresses and cards, and your Crumb Club card.</p>
        <ul class="perks-list"><li>${ic('star')}50 welcome crumbs when you join</li><li>${ic('repeat')}Reorder your usual in one tap</li><li>${ic('gift')}Birthday bake &amp; members-only drops</li><li>${ic('card')}Saved cards &amp; wallets — checkout in seconds</li></ul></div>
      <div class="auth-card"><h2>${authTab === 'in' ? 'Welcome back' : 'Join the club'}</h2><p class="muted" style="margin:0">${authTab === 'in' ? 'Sign in to see your orders and crumbs.' : 'Free forever. Takes 20 seconds.'}</p>
        <div class="auth-tabs"><button class="${authTab === 'in' ? 'on' : ''}" data-act="authtab" data-val="in">Sign in</button><button class="${authTab === 'up' ? 'on' : ''}" data-act="authtab" data-val="up">Create account</button></div>
        <form id="authForm" class="f-grid">
          ${authTab === 'up' ? `<label class="field full"><span>Full name</span><input name="name" required autocomplete="name" placeholder="Aanya Kapoor"></label>` : ''}
          <label class="field full"><span>Email or mobile</span><input name="email" required autocomplete="username" placeholder="you@email.com"></label>
          <label class="field full"><span>Password</span><input name="pw" type="password" required autocomplete="${authTab === 'in' ? 'current-password' : 'new-password'}" placeholder="••••••••"></label>
          ${authTab === 'up' ? `<label class="field full"><span>Birthday (for your free bake)</span><input name="bday" type="date"></label>` : ''}
          <button class="btn primary block full" type="submit">${authTab === 'in' ? 'Sign in' : 'Create account · +50 crumbs'}</button></form>
        <div class="or">or</div>
        <div class="social"><button data-act="demo-login">${ic('google')} Google</button><button data-act="demo-login">${ic('apple')} Apple</button></div>
        <button class="btn dark block" style="margin-top:12px" data-act="demo-login">Explore with the demo member account ${ic('arrow')}</button></div></div>`;
    return;
  }
  const u = S.user, tier = tierOf(S.lifetime), nt = nextTier(S.lifetime);
  const tabs = [['orders', 'Orders', 'receipt', S.orders.length], ['membership', 'Membership', 'star', S.points], ['addresses', 'Addresses', 'pin', S.addresses.length], ['wallet', 'Payment methods', 'wallet', S.cards.length], ['settings', 'Settings', 'bell', '']];
  let main = '';
  if (tab === 'orders') {
    const spent = S.orders.reduce((n, o) => n + o.t.total, 0);
    main = `<h2>Hey ${esc(u.name.split(' ')[0])}.</h2><p class="lead">Your usual is one tap away.</p>
      <div class="stats"><div class="stat"><b>${S.orders.length}</b><span>Orders</span></div><div class="stat"><b>${S.points.toLocaleString('en-IN')}</b><span>Crumbs</span></div><div class="stat"><b>${fmt(spent)}</b><span>Lifetime</span></div></div>
      ${S.orders.length ? S.orders.map(orderCard).join('') : `<div class="empty"><h3>No orders yet</h3><p>Your first flat white is waiting.</p><a class="btn primary" href="#/menu">Browse the menu</a></div>`}`;
  } else if (tab === 'membership') {
    const pct = nt ? ((S.lifetime - tier.min) / (nt.min - tier.min)) * 100 : 100;
    main = `<h2>Membership</h2><p class="lead">${tier.name} member since ${new Date(u.since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.</p>
      <div class="acct-section club-card-wrap" style="justify-items:start"><div class="member-card tilt">${memberCardHtml()}</div><p class="mono hint-small">tap the card to flip ↻</p></div>
      <div class="acct-section"><h3>Tier progress</h3><div class="tier-prog"><div class="row"><b>${tier.name} · ${tier.mult}× crumbs</b><span class="muted">${nt ? `${(nt.min - S.lifetime).toLocaleString('en-IN')} to ${nt.name}` : 'Top tier'}</span></div><div class="bar"><i style="width:${pct}%"></i></div><div class="row"><span class="mono muted" style="font-size:12px">${tier.min.toLocaleString('en-IN')}</span><span class="mono muted" style="font-size:12px">${nt ? nt.min.toLocaleString('en-IN') : '∞'}</span></div></div></div>
      <div class="acct-section"><h3>Crumb Club+</h3><div class="sub-card"><div><h4>Crumb Club+ · ₹149/month</h4><p>Free delivery on every order, 2× crumbs and a free pastry each week. Cancel anytime.</p>${S.sub ? '<p class="mono" style="margin-top:8px;font-size:12.5px">ACTIVE · renews on the 1st</p>' : ''}</div><button class="switch ${S.sub ? 'on' : ''}" data-act="sub-toggle" aria-label="Toggle Crumb Club+" aria-pressed="${S.sub}"></button></div></div>
      <div class="acct-section"><h3>Coffee stamps</h3><div class="stamp-card" style="margin:0">${stampsHtml()}</div></div>
      <div class="acct-section"><h3>Crumb history</h3><ul class="ledger">${S.ledger.slice(0, 12).map(x => `<li><span>${esc(x.d)}<small>${new Date(x.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small></span><span class="${x.v >= 0 ? 'plus' : 'minus'}">${x.v >= 0 ? '+' : ''}${x.v}</span></li>`).join('')}</ul></div>`;
  } else if (tab === 'addresses') {
    main = `<h2>Addresses</h2><p class="lead">Saved spots for faster checkout.</p>
      <div class="tiles">${S.addresses.map((a, i) => `<div class="tile ${a.def ? 'def' : ''}">${a.def ? '<span class="status ok badge">Default</span>' : `<button class="mono badge muted" style="font-size:12px" data-act="addr-def" data-i="${i}">Make default</button>`}<b>${ic('pin')} ${esc(a.label)}</b><span>${esc(a.line)}</span><span>${esc(a.area)}</span><button class="mono muted" style="font-size:12px;justify-self:start;margin-top:6px;text-decoration:underline" data-act="addr-del" data-i="${i}">Remove</button></div>`).join('')}
      <form class="tile" id="addrForm" style="gap:10px"><b>${ic('plus')} Add address</b><input class="note-in" name="label" placeholder="Label (Home, Work…)" required><input class="note-in" name="line" placeholder="Flat / house, street" required><input class="note-in" name="area" placeholder="Area / landmark"><button class="btn sm primary">Save address</button></form></div>`;
  } else if (tab === 'wallet') {
    main = `<h2>Payment methods</h2><p class="lead">Cards are tokenised by the payment provider — we never store your full number.</p>
      <div class="acct-section"><h3>Cards</h3><div class="tiles">${S.cards.map((c, i) => `<div><div class="mini-cc ${c.brand === 'Mastercard' ? 'mc' : ''}"><b>${c.brand}</b><span>•••• •••• •••• ${c.last4}</span><span style="display:flex;justify-content:space-between;font-size:12px;opacity:.8"><span>${esc((c.name || '').toUpperCase())}</span><span>${c.exp}</span></span></div><button class="mono muted" style="font-size:12px;margin-top:8px;text-decoration:underline" data-act="card-del" data-i="${i}">Remove</button></div>`).join('')}<a class="tile add" href="#/checkout">${ic('plus')}<span>Add a card at checkout</span></a></div></div>
      <div class="acct-section"><h3>Wallets</h3>
        <div class="set-row"><span class="row gap">${ic('apple')}<span><b>Apple Pay</b><span>Available on Safari / iPhone</span></span></span><span class="status ok">Ready</span></div>
        <div class="set-row"><span class="row gap"><svg><use href="#i-google"/></svg><span><b>Google Pay</b><span>Linked to ${esc(u.email)}</span></span></span><span class="status ok">Linked</span></div>
        <div class="set-row"><span class="row gap"><b style="font-style:italic">UPI</b><span><b>UPI · ${esc(u.email.split('@')[0])}@okaxis</b><span>Pay with any UPI app</span></span></span><span class="status ok">Verified</span></div></div>`;
  } else {
    const st = S.settings;
    const sw = (k, t, d) => `<div class="set-row"><span><b>${t}</b><span>${d}</span></span><button class="switch ${st[k] ? 'on' : ''}" data-act="set-toggle" data-key="${k}" aria-pressed="${!!st[k]}" aria-label="${t}"></button></div>`;
    main = `<h2>Settings</h2><p class="lead">${esc(u.name)} · ${esc(u.email)} · ${esc(u.phone || '')}</p>
      <div class="acct-section"><h3>Notifications</h3>${sw('sms', 'Order updates by SMS / WhatsApp', 'Brewing, on the way, at your door.')}${sw('email', 'Offers by email', 'New bakes and seasonal menus, max 2 a month.')}${sw('tues', 'Double-crumb reminders', 'A nudge every Tuesday morning.')}</div>
      <div class="acct-section"><h3>Dietary preferences</h3><div class="chips">${['Vegetarian', 'Vegan', 'Nut-free', 'Gluten-free', 'Less sugar'].map(d => `<button class="chip ${st.diet.includes(d) ? 'on' : ''}" data-act="diet" data-val="${d}">${d}</button>`).join('')}</div></div>
      <div class="acct-section"><button class="btn ghost" data-act="logout">${ic('out')} Sign out</button></div>`;
  }
  el.innerHTML = `<div class="acct"><nav class="acct-side" aria-label="Account">
      <div class="acct-hello"><div class="av">${esc(u.name[0] || 'C')}</div><b>${esc(u.name)}</b><span>${tier.name} · ${S.points} crumbs</span></div>
      ${tabs.map(([id, l, i, c]) => `<a href="#/account/${id}" class="${tab === id ? 'on' : ''}">${ic(i)}${l}${c !== '' ? `<span class="count">${c}</span>` : ''}</a>`).join('')}
      <button data-act="logout">${ic('out')}Sign out</button></nav>
    <div class="acct-main">${main}</div></div>`;
}

function receiptSheet(id) {
  const o = S.orders.find(x => x.id === id); if (!o) return;
  $('#sheetCard').innerHTML = `<button class="icon-btn" data-act="close-modal" aria-label="Close">${ic('x')}</button>
    <div class="rcpt"><h3>Crumb Club</h3><p class="c">Kitchen No. 4 · Market Lane<br>GSTIN 29ABCDE1234F1Z5 (demo)</p><hr>
      <div class="r"><span>${o.id}</span><span>${new Date(o.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="r"><span>${o.ful === 'delivery' ? 'DELIVERY' : 'COLLECTION'}</span><span>${esc(o.pay)}</span></div><hr>
      ${o.lines.map(l => { const m = byId[l.id]; return `<div class="r"><span>${l.qty}× ${esc(m.name)}</span><span>${l.free ? 'FREE' : fmt(l.unit * l.qty)}</span></div>${optLabel(m, l.opts) ? `<div class="c" style="text-align:left;margin:-2px 0 4px">  ${esc(optLabel(m, l.opts))}</div>` : ''}`; }).join('')}<hr>
      <div class="r"><span>Subtotal</span><span>${fmt(o.t.sub)}</span></div>
      ${o.t.disc ? `<div class="r"><span>Rewards & promos</span><span>−${fmt(o.t.disc)}</span></div>` : ''}
      ${o.ful === 'delivery' ? `<div class="r"><span>Delivery</span><span>${o.t.delivery ? fmt(o.t.delivery) : 'FREE'}</span></div><div class="r"><span>Tip</span><span>${fmt(o.t.tip)}</span></div>` : ''}
      <div class="r"><span>GST 5%</span><span>${fmt(o.t.tax)}</span></div><hr>
      <div class="r b"><span>TOTAL</span><span>${fmt(o.t.total)}</span></div>
      ${o.earned ? `<p class="c" style="margin-top:10px">★ ${o.earned} crumbs earned ★</p>` : ''}
      <div class="barcode"></div><p class="c">Thank you — see you tomorrow?</p></div>`;
  openModal('#sheet');
}
function reorder(id) {
  const o = S.orders.find(x => x.id === id); if (!o) return;
  o.lines.filter(l => !l.free).forEach(l => addLine(l.id, l.opts, l.qty, l.note));
  S.ful = o.ful; save(); openDrawer(); toast(`${o.id} added back to your bag`, 'repeat');
}

/* ------------------------------------------------------------------ router */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [view, sub] = h.split('/');
  const v = ['menu', 'rewards', 'checkout', 'track', 'account'].includes(view) ? view : 'home';
  $$('.view').forEach(s => s.classList.toggle('active', s.dataset.view === v));
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === v));
  $$('.mobile-tabbar [data-tab]').forEach(a => a.classList.toggle('active', a.dataset.tab === v));
  closeDrawer(); closeModal();
  if (v !== 'track') clearInterval(trackTimer);
  if (v === 'menu') renderMenu();
  if (v === 'rewards') renderRewards();
  if (v === 'checkout') renderCheckout();
  if (v === 'track') renderTrack(sub && sub.toUpperCase());
  if (v === 'account') renderAccount(sub || 'orders');
  if (v === 'home') { renderMemberCards(); renderStamps(); }
  document.title = { home: 'Crumb Club — Coffee & bakes, delivered warm', menu: 'Menu · Crumb Club', rewards: 'Rewards · Crumb Club', checkout: 'Checkout · Crumb Club', track: 'Track order · Crumb Club', account: 'Account · Crumb Club' }[v];
  if (!routedOnce || v !== 'home' || !h) scrollTo({ top: 0, behavior: routedOnce ? 'instant' : 'auto' });
  routedOnce = true;
  updateAcctBtn();
}
let routedOnce = false;
function updateAcctBtn() { $('#acctLabel').textContent = S.user ? S.user.name.split(' ')[0] + ' · ' + S.points : 'Sign in'; }

/* ------------------------------------------------------------------ hero bits */
function setSeg(seg) {
  const on = $('button.on', seg), th = $('.seg-thumb', seg);
  if (on && th) { th.style.width = on.offsetWidth + 'px'; th.style.transform = `translateX(${on.offsetLeft - 4}px)`; }
}
function setFul(v, quiet) {
  S.ful = v; save();
  $$('[data-seg=fulfilment] button').forEach(b => b.classList.toggle('on', b.dataset.val === v));
  $$('[data-seg=fulfilment]').forEach(setSeg);
  $('#heroOrder').classList.toggle('collect', v === 'collection');
  renderDrawer();
  if (location.hash.startsWith('#/checkout')) renderCheckout();
  if (!quiet) toast(v === 'delivery' ? 'Switched to delivery' : 'Switched to collection · +10% crumbs', v === 'delivery' ? 'scooter' : 'hatch');
}

function countUp() {
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count), dec = String(el.dataset.count).includes('.') ? 1 : 0, suf = el.dataset.suffix || '';
    const t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - p, 3); el.textContent = (target * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

/* ------------------------------------------------------------------ brand kit */
const PRESETS = {
  house: { name: 'House roast', paper: '#F4EDE1', ink: '#23160F', accent: '#E0532F', accent2: '#F3B83F', leaf: '#5E7F4E', display: 'Gloock', body: 'Schibsted Grotesk' },
  matcha: { name: 'Matcha garden', paper: '#ECEEDD', ink: '#1C2719', accent: '#3F7A3A', accent2: '#E8C468', leaf: '#B5603F', display: 'Fraunces', body: 'DM Sans' },
  midnight: { name: 'Midnight roast', paper: '#17110D', ink: '#F3E7D6', accent: '#FF7A3D', accent2: '#F7C548', leaf: '#7FB069', display: 'Syne', body: 'Manrope' },
  berry: { name: 'Berry pop', paper: '#FCEFF1', ink: '#2A0F22', accent: '#D6336C', accent2: '#FFB703', leaf: '#2A9D8F', display: 'Bagel Fat One', body: 'Nunito' },
};
const FONTS = {
  display: { 'Gloock': 'Gloock', 'Fraunces': 'Fraunces:ital,wght@0,400;1,400', 'Bagel Fat One': 'Bagel+Fat+One', 'Syne': 'Syne:wght@500;700', 'Playfair Display': 'Playfair+Display:ital@0;1', 'Archivo Black': 'Archivo+Black', 'DM Serif Display': 'DM+Serif+Display:ital@0;1' },
  body: { 'Schibsted Grotesk': '', 'DM Sans': 'DM+Sans:wght@400;500;600;700', 'Manrope': 'Manrope:wght@400;500;600;700', 'Work Sans': 'Work+Sans:wght@400;500;600;700', 'Nunito': 'Nunito:wght@400;600;700;800', 'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700' },
};
const loadedFonts = new Set(['Gloock', 'Schibsted Grotesk']);
function loadFont(name, q) {
  if (!q || loadedFonts.has(name)) return; loadedFonts.add(name);
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${q}&display=swap`; document.head.appendChild(l);
}
const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgb2hex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));
const lum = h => { const [r, g, b] = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
let theme;
try { theme = JSON.parse(localStorage.getItem('crumbclub:theme') || 'null'); } catch { theme = null; }
theme = Object.assign({ preset: 'house' }, PRESETS.house, theme || {});
function applyTheme(keepKit) {
  const r = document.documentElement.style, light = lum(theme.paper) > .4;
  r.setProperty('--paper', theme.paper); r.setProperty('--ink', theme.ink); r.setProperty('--accent', theme.accent); r.setProperty('--accent-2', theme.accent2); r.setProperty('--leaf', theme.leaf);
  r.setProperty('--card', light ? mix(theme.paper, '#ffffff', .55) : mix(theme.paper, '#ffffff', .06));
  r.setProperty('--on-accent', lum(theme.accent) > .45 ? '#1b120c' : '#ffffff');
  r.setProperty('color-scheme', light ? 'light' : 'dark');
  loadFont(theme.display, FONTS.display[theme.display]); loadFont(theme.body, FONTS.body[theme.body]);
  r.setProperty('--display', `"${theme.display}", Georgia, serif`); r.setProperty('--body', `"${theme.body}", system-ui, sans-serif`);
  $('.grain').style.mixBlendMode = light ? 'multiply' : 'screen';
  $('meta[name=theme-color]').setAttribute('content', theme.paper);
  try { localStorage.setItem('crumbclub:theme', JSON.stringify(theme)); } catch { }
  window.dispatchEvent(new CustomEvent('cc-theme', { detail: theme }));
  if (!keepKit) renderKit(); else $$('#kitPresets button').forEach(b => b.classList.remove('on'));
  setTimeout(() => $$('[data-seg]').forEach(setSeg), 300);
}
window.ccTheme = () => theme;
function renderKit() {
  $('#kitPresets').innerHTML = Object.entries(PRESETS).map(([k, p]) => `<button class="${theme.preset === k ? 'on' : ''}" data-preset="${k}"><span class="sw">${[p.paper, p.ink, p.accent, p.accent2].map(c => `<i style="background:${c}"></i>`).join('')}</span>${p.name}<span class="mono muted" style="font-size:11px;font-weight:400">${p.display} / ${p.body}</span></button>`).join('');
  $('#kitColors').innerHTML = [['paper', 'Base'], ['ink', 'Ink'], ['accent', 'Primary'], ['accent2', 'Second'], ['leaf', 'Third']].map(([k, l]) => `<label>${l}<input type="color" data-color="${k}" value="${theme[k]}"></label>`).join('');
  $('#fontDisplay').innerHTML = Object.keys(FONTS.display).map(f => `<option ${f === theme.display ? 'selected' : ''}>${f}</option>`).join('');
  $('#fontBody').innerHTML = Object.keys(FONTS.body).map(f => `<option ${f === theme.body ? 'selected' : ''}>${f}</option>`).join('');
}
$('#kitFab').addEventListener('click', () => { const k = $('#kit'); const on = !k.classList.contains('on'); k.classList.toggle('on', on); k.setAttribute('aria-hidden', String(!on)); });
$('#kitClose').addEventListener('click', () => { $('#kit').classList.remove('on'); $('#kit').setAttribute('aria-hidden', 'true'); });
$('#kit').addEventListener('click', e => { const b = e.target.closest('[data-preset]'); if (!b) return; theme = { preset: b.dataset.preset, ...PRESETS[b.dataset.preset] }; applyTheme(); });
$('#kit').addEventListener('input', e => {
  const c = e.target.dataset.color; if (c) { theme[c] = e.target.value; theme.preset = 'custom'; applyThemeLite(); }
});
$('#kit').addEventListener('change', e => {
  if (e.target.id === 'fontDisplay') { theme.display = e.target.value; theme.preset = 'custom'; applyTheme(); }
  if (e.target.id === 'fontBody') { theme.body = e.target.value; theme.preset = 'custom'; applyTheme(); }
  if (e.target.dataset.color) applyTheme();
});
let liteRaf = 0;
function applyThemeLite() { cancelAnimationFrame(liteRaf); liteRaf = requestAnimationFrame(() => applyTheme(true)); }

/* ------------------------------------------------------------------ global events */
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close-drawer]')) closeDrawer();
  const ht = t.closest('[data-hometab]'); if (ht) { homeTab = ht.dataset.hometab; renderHomeGrid(); return; }
  const jp = t.closest('[data-jump]'); if (jp) { $('#sec-' + jp.dataset.jump)?.scrollIntoView({ behavior: 'smooth' }); $$('[data-jump]').forEach(b => b.classList.toggle('on', b === jp)); return; }
  const fl = t.closest('[data-filter]'); if (fl) { const f = fl.dataset.filter; menuF.has(f) ? menuF.delete(f) : menuF.add(f); fl.classList.toggle('on'); renderMenu(); return; }
  const sb = t.closest('[data-seg=fulfilment] button'); if (sb) { setFul(sb.dataset.val); return; }
  const mc = t.closest('[data-mode]'); if (mc) { setFul(mc.dataset.mode, true); location.hash = '#/menu'; toast(mc.dataset.mode === 'delivery' ? 'Delivery it is — pick your order' : 'Collection it is · +10% crumbs', mc.dataset.mode === 'delivery' ? 'scooter' : 'hatch'); return; }
  const tilt = t.closest('.member-card'); if (tilt && !t.closest('a,button')) { tilt.classList.toggle('flip'); return; }
  if (t.closest('#cartBtn')) { openDrawer(); return; }
  if (t === $('#scrim')) { closeDrawer(); return; }
  if (t.classList.contains('modal')) { closeModal(); return; }

  const a = t.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act, id = a.dataset.id;
  switch (act) {
    case 'add': e.stopPropagation(); { const m = byId[id]; addLine(id); flyToBag(a.closest('.p-card')?.querySelector('.p-img') || a, m.img); a.classList.add('done'); a.innerHTML = ic('check'); setTimeout(() => { a.classList.remove('done'); a.innerHTML = ic('plus'); }, 1100); toast(`${m.name} added`, 'bag'); } break;
    case 'open': openProduct(id); break;
    case 'close-modal': closeModal(); break;
    case 'pm-inc': pm.qty = Math.min(20, pm.qty + 1); updatePm(); break;
    case 'pm-dec': pm.qty = Math.max(1, pm.qty - 1); updatePm(); break;
    case 'pm-add': readPm(); addLine(pm.m.id, pm.opts, pm.qty, pm.note); closeModal(); flyToBag($('#pModalCard .pm-img') || a, pm.m.img); toast(`${pm.qty > 1 ? pm.qty + '× ' : ''}${pm.m.name} added`, 'bag'); break;
    case 'cart': openDrawer(); break;
    case 'inc': case 'dec': { const l = S.cart.find(x => x.key === a.dataset.key); if (l) { l.qty += act === 'inc' ? 1 : -1; if (l.qty <= 0) S.cart = S.cart.filter(x => x !== l); } if (!S.cart.some(l => !l.free)) { S.cart = []; S.redeem = []; } save(); renderCartCount(); renderDrawer(); } break;
    case 'ful': setFul(a.dataset.val, true); break;
    case 'tip': S.tip = +a.dataset.val; save(); renderDrawer(); break;
    case 'redeem': redeem(id); break;
    case 'unredeem': unredeem(id); if (location.hash.startsWith('#/rewards')) renderRewards(); break;
    case 'slot': S.slot = +a.dataset.val; save(); renderCheckout(); break;
    case 'pick-addr': { const ad = S.addresses[+a.dataset.i]; S.draft.line1 = ad.line; S.draft.area = ad.area.split(' · ')[0]; save(); renderCheckout(); } break;
    case 'paytab': S.pay = a.dataset.val; save(); renderCheckout(); break;
    case 'test-card': Object.assign(S.draft, { cnum: '4242 4242 4242 4242', cexp: '12/29', ccvc: '123', cname: S.draft.cname || S.draft.name || 'Aanya Kapoor' }); save(); renderCheckout(); toast('Stripe test card filled in', 'card'); break;
    case 'place': if (validate(true)) placeOrder(S.pay === 'upi' ? 'upi' : 'card'); break;
    case 'wallet': if (validate(false)) walletSheet(a.dataset.val); break;
    case 'wallet-confirm': { const fid = $('#faceid'); fid.classList.add('ok'); $('#walletMsg').textContent = 'Verified'; a.disabled = true; setTimeout(() => { closeModal(); placeOrder(a.dataset.val); }, 1100); } break;
    case 'receipt': receiptSheet(id); break;
    case 'reorder': reorder(id); break;
    case 'authtab': authTab = a.dataset.val; renderAccount(); break;
    case 'demo-login': seedDemo('Aanya Kapoor', 'aanya.kapoor@mail.com'); save(); renderAccount('orders'); renderCartCount(); updateAcctBtn(); toast('Signed in as the demo member', 'user'); break;
    case 'logout': { const keepTheme = true; S = blank(); save(); renderAccount(); renderCartCount(); updateAcctBtn(); toast('Signed out', 'out'); } break;
    case 'sub-toggle': S.sub = !S.sub; save(); renderAccount('membership'); toast(S.sub ? 'Crumb Club+ is on — free delivery & 2× crumbs' : 'Crumb Club+ cancelled', 'star'); break;
    case 'set-toggle': S.settings[a.dataset.key] = !S.settings[a.dataset.key]; save(); a.classList.toggle('on'); a.setAttribute('aria-pressed', String(S.settings[a.dataset.key])); break;
    case 'diet': { const d = a.dataset.val, L = S.settings.diet; L.includes(d) ? L.splice(L.indexOf(d), 1) : L.push(d); save(); a.classList.toggle('on'); } break;
    case 'addr-del': S.addresses.splice(+a.dataset.i, 1); if (S.addresses.length && !S.addresses.some(x => x.def)) S.addresses[0].def = true; save(); renderAccount('addresses'); break;
    case 'addr-def': S.addresses.forEach((x, i) => { x.def = i === +a.dataset.i; }); save(); renderAccount('addresses'); break;
    case 'card-del': S.cards.splice(+a.dataset.i, 1); S.payCard = S.cards.length ? 0 : 'new'; save(); renderAccount('wallet'); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeDrawer(); $('#kit').classList.remove('on'); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.p-card')) { e.preventDefault(); openProduct(e.target.dataset.id); }
});
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'heroForm') {
    const v = $('#heroAddr').value.trim();
    if (S.ful === 'delivery' && v) { S.address = v; S.draft.line1 = v; save(); toast(`Delivering to ${esc(v)} · ~24 min`, 'pin'); }
    location.hash = '#/menu';
  }
  if (f.id === 'promoForm') {
    if (S.promo) { S.promo = null; save(); renderDrawer(); return; }
    const c = f.code.value.trim().toUpperCase();
    if (PROMOS[c]) { S.promo = c; save(); renderDrawer(); toast(`${c} applied · ${PROMOS[c].label}`, 'gift'); } else toast('That code isn’t valid — try CRUMB10', 'x');
  }
  if (f.id === 'authForm') {
    const email = f.email.value.trim(), pw = f.pw.value;
    if (!email || pw.length < 4) { toast('Enter an email and a password (4+ characters)', 'x'); return; }
    if (authTab === 'in') { seedDemo(email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Member', email); }
    else { S.user = { name: f.name.value.trim() || 'New member', email, since: new Date().toISOString().slice(0, 10) }; S.points = 50; S.lifetime = 50; S.ledger = [{ t: Date.now(), d: 'Welcome to the club', v: 50 }]; S.draft = Object.assign(S.draft, { name: S.user.name, email }); }
    save(); renderAccount('orders'); updateAcctBtn(); toast(authTab === 'in' ? 'Welcome back!' : 'Welcome to the club · +50 crumbs', 'star');
  }
  if (f.id === 'addrForm') { S.addresses.push({ label: f.label.value.trim(), line: f.line.value.trim(), area: f.area.value.trim() || '—', def: !S.addresses.length }); save(); renderAccount('addresses'); toast('Address saved', 'pin'); }
  if (f.id === 'trackForm') { const v = f.oid.value.trim().toUpperCase(); if (S.orders.some(o => o.id === v)) location.hash = '#/track/' + v; else toast('No order with that number on this device', 'x'); }
});
$('#menuSearch').addEventListener('input', e => { menuQ = e.target.value; renderMenu(); });

/* magnetic buttons */
if (finePointer) document.addEventListener('pointermove', e => {
  const b = e.target.closest?.('.magnetic'); $$('.magnetic.mag-on').forEach(x => { if (x !== b) { x.style.transform = ''; x.classList.remove('mag-on'); } });
  if (!b) return; const r = b.getBoundingClientRect();
  b.classList.add('mag-on'); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
});

/* nav shadow on scroll */
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 10), { passive: true });

/* mobile tab bar */
document.body.insertAdjacentHTML('beforeend', `<nav class="mobile-tabbar" aria-label="Quick">
  <a href="#/" data-tab="home">${ic('cup')}Home</a><a href="#/menu" data-tab="menu">${ic('search')}Menu</a>
  <button data-act="cart">${ic('bag')}Bag<span class="mt-count">0</span></button>
  <a href="#/rewards" data-tab="rewards">${ic('star')}Rewards</a><a href="#/account" data-tab="account">${ic('user')}Account</a></nav>`);

/* home map loop */
function homeMapLoop() {
  const host = $('#homeMap'); host.innerHTML = mapHtml(true);
  const map = $('.map', host); let t0 = performance.now();
  const loop = now => {
    if ($('[data-view=home]').classList.contains('active')) {
      const p = ((now - t0) / 11000) % 1; const eased = p < .85 ? p / .85 : 1;
      setRider(map, eased); $('.eta-v', map).textContent = eased >= 1 ? 'Arrived' : Math.max(1, Math.ceil((1 - eased) * 14)) + ' min';
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ boot */
const eta = 22 + (new Date().getMinutes() % 6);
$('#heroEta').textContent = eta; $('#ctaEta').textContent = eta; $('.sticker span').firstChild.textContent = eta;
if (S.address) $('#heroAddr').value = S.address;
applyTheme();
renderHomeGrid();
renderCartCount();
renderDrawer();
renderMemberCards(); renderStamps();
homeMapLoop();
setFul(S.ful, true);
wire(document);
const proof = $('.hero-proof'); new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { countUp(); o.disconnect(); } }).observe(proof);
addEventListener('hashchange', route);
addEventListener('resize', () => $$('[data-seg]').forEach(setSeg));
route();
document.fonts?.ready.then(() => $$('[data-seg]').forEach(setSeg));
// Fallback if WebGL / three.js never comes up
setTimeout(() => { if (!window.__sceneReady) document.body.classList.add('no-webgl'); }, 5000);
})();
