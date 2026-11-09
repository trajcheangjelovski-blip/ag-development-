/* AURELLE storefront prototype — shared engine
   Header, mega menu, mobile menu, search, cart drawer, product data,
   collection filtering, product page, forms. In the Shopify build these
   map 1:1 to Impact theme sections + Liquid snippets. */
(function(){
'use strict';

/* ---------------- Icons ---------------- */
const I={
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
  menu:'<svg viewBox="0 0 24 24"><path d="M3.5 8h17M3.5 16h17"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chev:'<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  filter:'<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  star:'<svg viewBox="0 0 20 20"><path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8l-4.3-4 5.8-.7z"/></svg>',
  truck:'<svg viewBox="0 0 24 24"><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  hand:'<svg viewBox="0 0 24 24"><path d="M8 12V5.5a1.5 1.5 0 013 0V11M11 10.5V4a1.5 1.5 0 013 0v7M14 10.5V5.5a1.5 1.5 0 013 0V13c0 4-2.5 7-6 7-2.6 0-4-1.2-5.6-3.7L3.8 13.6a1.5 1.5 0 012.5-1.6L8 14"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>',
  bulb:'<svg viewBox="0 0 24 24"><path d="M9 17.5h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1 1.3 1 2.1v1.6h5.2v-1.6c0-.8.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>',
  return:'<svg viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 010 10H8"/><path d="M8 5L4 9l4 4"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10.5H9l-5 4z"/></svg>',
  pen:'<svg viewBox="0 0 24 24"><path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/><path d="M13.5 7l3.5 3.5"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>',
  ig:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/></svg>',
  pin:'<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="7"/><path d="M10.5 9.5c0-2 3.8-2.5 3.8.2 0 1.8-1.4 2.8-2.6 2.6M11.3 11L9.5 20"/></svg>',
  mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13"/><path d="M3.5 6l8.5 7 8.5-7"/></svg>',
  phone:'<svg viewBox="0 0 24 24"><path d="M5 4h4l1.5 4.5-2.3 1.5a11 11 0 005.8 5.8l1.5-2.3L20 15v4a1.5 1.5 0 01-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 015 4z"/></svg>',
  check:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"/><path d="M15 24.5l6 6 12-13"/></svg>',
  grid2:'<svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6"/><rect x="9" y="1" width="6" height="6"/><rect x="1" y="9" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/></svg>',
  grid1:'<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14"/></svg>',
  grid4:'<svg viewBox="0 0 16 16"><rect x="1" y="1" width="3" height="6"/><rect x="5" y="1" width="3" height="6"/><rect x="9" y="1" width="3" height="6"/><rect x="13" y="1" width="2.4" height="6"/><rect x="1" y="9" width="3" height="6"/><rect x="5" y="9" width="3" height="6"/><rect x="9" y="9" width="3" height="6"/><rect x="13" y="9" width="2.4" height="6"/></svg>',
  box:'<svg viewBox="0 0 24 24"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>'
};

/* ---------------- Data ---------------- */
const F={ // finishes
  'Aged Brass':'#a8834d','Satin Brass':'#c6a467','Patina Bronze':'#5b4734','Matte Black':'#232120','Polished Nickel':'#c9c6c0',
  'Natural Alabaster':'#efe7da','Honed Travertine':'#d6c4a8','Chalk Plaster':'#e8e0d3','Smoked Oak':'#7d5c3e','Natural Oak':'#c39c6c',
  'Natural Rattan':'#cfae80','Carrara Marble':'#ebe8e3','Ivory Linen':'#ece4d4','Opal Glass':'#f1f0ea','Clay':'#b98d6c','Bone Enamel':'#efebe3'
};
const P=[
 {h:'halo-alabaster-sconce',n:'Halo Alabaster Sconce',type:'Wall',sub:'Sconces',mat:'Alabaster',price:680,img:['p-halo-sconce','ed-alabaster'],fin:['Aged Brass','Patina Bronze'],sz:[['Standard',0],['Large',220]],tags:['best','ready'],rooms:['bedroom','living'],r:4.9,rc:214,fx:'38%',fy:'45%',
  d:'A hand-carved shell of Spanish alabaster that turns any wall into a soft, moonlit glow. Each piece is cut from a single block, so the veining is entirely its own.',
  dim:'H 11" × W 7.5" × D 4.25"',bulb:'1 × E12, 40W max (LED included, 2700K)'},
 {h:'arc-plaster-sconce',n:'Arc Plaster Sconce',type:'Wall',sub:'Sconces',mat:'Plaster',price:420,img:['p-arc-sconce','room-bedroom'],fin:['Chalk Plaster','Clay'],sz:[['24"',0],['36"',140]],tags:['new'],rooms:['bedroom','living'],r:4.8,rc:63,fx:'50%',fy:'52%',
  d:'A sculpted half-moon of hand-finished plaster that washes the wall with light in both directions. Paintable to match your walls.',
  dim:'H 6" × W 24" × D 4"',bulb:'Integrated LED, 1,100 lm, 2700K, dimmable'},
 {h:'tube-sconce',n:'Linea Up/Down Sconce',type:'Wall',sub:'Sconces',mat:'Steel',price:360,img:['p-tube-sconce','j-1'],fin:['Polished Nickel','Matte Black','Aged Brass'],sz:[['Standard',0]],tags:['ready'],rooms:['living','study'],r:4.7,rc:88,fx:'45%',fy:'45%',
  d:'A precise turned-metal cylinder that casts a crisp beam up and down. Wet-rated for bathrooms and covered porches.',
  dim:'H 9" × W 3.5" × D 5"',bulb:'2 × GU10, 7W LED included'},
 {h:'carved-alabaster-lamp',n:'Carved Alabaster Table Lamp',type:'Table',sub:'Table Lamps',mat:'Alabaster',price:1180,img:['p-carved-alabaster','p-carved-alabaster-2','ed-alabaster'],fin:['Natural Alabaster'],sz:[['Standard',0]],tags:['best'],rooms:['living','bedroom'],r:5.0,rc:47,fx:'50%',fy:'62%',
  d:'A lathe-turned column of alabaster, carved by hand in Volterra, under a pleated ivory linen shade. Heirloom quality, made to be handed down.',
  dim:'H 28" × Shade Ø 15"',bulb:'1 × E26, 60W max, 3-way switch'},
 {h:'column-marble-lamp',n:'Column Marble Table Lamp',type:'Table',sub:'Table Lamps',mat:'Marble',price:890,img:['p-column-marble','room-bedroom'],fin:['Carrara Marble','Honed Travertine'],sz:[['Standard',0],['Tall',180]],tags:['best','ready'],rooms:['bedroom','living','study'],r:4.9,rc:156,fx:'50%',fy:'70%',
  d:'A solid stone cylinder, honed by hand, topped with a drum shade in natural linen. Quiet, architectural, and heavy enough to feel permanent.',
  dim:'H 24" × Shade Ø 14"',bulb:'1 × E26, 60W max, in-line dimmer'},
 {h:'cap-brass-lamp',n:'Cap Brass Table Lamp',type:'Table',sub:'Table Lamps',mat:'Brass',price:540,img:['p-cap-brass','j-1'],fin:['Satin Brass','Polished Nickel'],sz:[['Standard',0],['Mini',-120]],tags:['new'],rooms:['living','study'],r:4.8,rc:39,fx:'78%',fy:'55%',
  d:'A spun-brass dome on a slender stem. Small enough for a shelf, bright enough for a console, and lovely switched off.',
  dim:'H 16" × Ø 10"',bulb:'1 × E12, 25W max, touch dimmer'},
 {h:'plaster-mushroom-lamp',n:'Nube Plaster Lamp',type:'Table',sub:'Table Lamps',mat:'Plaster',price:460,img:['p-plaster-mushroom','j-2'],fin:['Chalk Plaster','Clay'],sz:[['Standard',0]],tags:['new','ready'],rooms:['bedroom','living'],r:4.9,rc:71,fx:'50%',fy:'35%',
  d:'A soft, cloud-like shade formed in textured plaster over a hand-thrown base. It glows warm and diffused, like candlelight through paper.',
  dim:'H 15" × Ø 14"',bulb:'1 × E26, 40W max'},
 {h:'scallop-glass-lamp',n:'Scallop Glass Lamp',type:'Table',sub:'Table Lamps',mat:'Glass',price:390,img:['p-scallop-glass','room-bedroom'],fin:['Opal Glass'],sz:[['Standard',0]],tags:['ready'],rooms:['bedroom'],r:4.7,rc:52,fx:'50%',fy:'40%',
  d:'Mouth-blown opal glass with a fluted scallop edge on a fine brass stem. Made for nightstands and late reading.',
  dim:'H 17" × Ø 11"',bulb:'1 × E12, 40W max'},
 {h:'trio-globe-lamp',n:'Orbit Trio Lamp',type:'Table',sub:'Table Lamps',mat:'Brass',price:720,img:['p-trio-globe','j-3'],fin:['Aged Brass','Matte Black'],sz:[['Standard',0]],tags:['new'],rooms:['living','dining'],r:4.8,rc:28,fx:'50%',fy:'30%',
  d:'Three opal globes balanced on a sculptural brass frame. Equal parts lamp and object.',
  dim:'H 22" × W 12"',bulb:'3 × G9, LED included'},
 {h:'travertine-lamp',n:'Travertine Pillar Lamp',type:'Table',sub:'Table Lamps',mat:'Travertine',price:980,img:['p-travertine','room-living'],fin:['Honed Travertine'],sz:[['Standard',0],['Grand',260]],tags:['best'],rooms:['living','dining'],r:4.9,rc:93,fx:'58%',fy:'52%',
  d:'Unfilled Roman travertine, chiselled into a squared pillar. Each lamp carries the natural pits and bands of the stone.',
  dim:'H 26" × Shade Ø 16"',bulb:'1 × E26, 60W max'},
 {h:'arco-dome-floor-lamp',n:'Arco Dome Floor Lamp',type:'Floor',sub:'Floor Lamps',mat:'Brass',price:1450,img:['p-arco-dome','hero-living'],fin:['Patina Bronze','Aged Brass'],sz:[['Standard',0]],tags:['best'],rooms:['living','study'],r:4.9,rc:132,fx:'40%',fy:'30%',
  d:'A sweeping brass arc that drops a pool of light right where you read. The weighted marble base keeps it perfectly balanced.',
  dim:'H 68" × Reach 34"',bulb:'1 × E26, 60W max, foot dimmer'},
 {h:'linen-column-floor-lamp',n:'Linen Column Floor Lamp',type:'Floor',sub:'Floor Lamps',mat:'Brass',price:1120,img:['p-linen-floor','ed-light'],fin:['Aged Brass','Matte Black'],sz:[['Standard',0]],tags:['ready'],rooms:['living','bedroom'],r:4.8,rc:66,fx:'50%',fy:'30%',
  d:'A tall pleated linen shade on a slim brass column. Soft, upward light that makes a room feel taller.',
  dim:'H 62" × Shade Ø 16"',bulb:'1 × E26, 100W max'},
 {h:'pleated-floor-lamp',n:'Pleat Paper Floor Lamp',type:'Floor',sub:'Floor Lamps',mat:'Paper',price:840,img:['p-pleated-floor','room-living'],fin:['Matte Black'],sz:[['Standard',0]],tags:['new'],rooms:['living','bedroom'],r:4.7,rc:24,fx:'52%',fy:'55%',
  d:'A column of hand-pleated washi paper on a slender black steel stand. Glows like a lantern; casts no harsh shadows.',
  dim:'H 58" × Ø 9"',bulb:'1 × E26, 40W max'},
 {h:'bow-floor-lamp',n:'Bow Floor Lamp',type:'Floor',sub:'Floor Lamps',mat:'Steel',price:760,img:['p-bow-floor','ed-light'],fin:['Bone Enamel','Matte Black'],sz:[['Standard',0]],tags:[],rooms:['living','study'],r:4.6,rc:41,fx:'66%',fy:'28%',
  d:'An enamelled dome on a bowed stem: mid-century bones, modern proportions. Ideal beside a reading chair.',
  dim:'H 60" × Reach 18"',bulb:'1 × E26, 60W max'},
 {h:'slatted-oak-pendant',n:'Slatted Oak Pendant',type:'Ceiling',sub:'Pendants',mat:'Oak',price:640,img:['p-slatted-oak','room-dining'],fin:['Natural Oak','Smoked Oak'],sz:[['Small',0],['Medium',140],['Large',290]],tags:['best','ready'],rooms:['dining','kitchen'],r:4.9,rc:187,fx:'50%',fy:'48%',
  d:'Fine oak slats bent around a cone, casting warm striped light. Beautiful in a group of three over an island.',
  dim:'H 22" × Ø 9" (Small)',bulb:'1 × E26, 60W max, 10 ft adjustable cord'},
 {h:'brass-dome-pendant',n:'Spun Brass Pendant',type:'Ceiling',sub:'Pendants',mat:'Brass',price:520,img:['p-brass-dome','room-dining'],fin:['Satin Brass','Patina Bronze'],sz:[['Ø 10"',0],['Ø 14"',120]],tags:['ready'],rooms:['dining','kitchen'],r:4.8,rc:119,fx:'48%',fy:'40%',
  d:'Hand-spun brass with a soft satin finish that warms with age. Opal diffuser underneath for glare-free light.',
  dim:'H 9" × Ø 10"',bulb:'1 × E26, 60W max, 10 ft cord'},
 {h:'woven-rattan-pendant',n:'Woven Rattan Pendant',type:'Ceiling',sub:'Pendants',mat:'Rattan',price:380,img:['p-rattan','room-bedroom'],fin:['Natural Rattan'],sz:[['Ø 14"',0],['Ø 20"',110]],tags:[],rooms:['bedroom','dining'],r:4.7,rc:58,fx:'50%',fy:'45%',
  d:'Hand-woven natural rattan on a two-tier frame. Filters light into a soft, textured glow.',
  dim:'H 16" × Ø 14"',bulb:'1 × E26, 60W max'},
 {h:'fontaine-chandelier',n:'Fontaine Chandelier',type:'Ceiling',sub:'Chandeliers',mat:'Brass',price:2650,cmp:3100,img:['p-crystal-chandelier','room-dining'],fin:['Aged Brass'],sz:[['6 Arm',0],['12 Arm',1450]],tags:['best'],rooms:['dining','living'],r:5.0,rc:22,fx:'50%',fy:'32%',
  d:'Cast brass arms dressed in hand-cut crystal pendalogues. A true statement for a dining room or double-height entry.',
  dim:'H 30" × Ø 32" (6 Arm)',bulb:'6 × E12, 40W max'},
 {h:'enamel-dome-pendant',n:'Enamel Dome Pendant',type:'Ceiling',sub:'Pendants',mat:'Steel',price:290,img:['p-enamel-pendant','j-1'],fin:['Bone Enamel','Matte Black'],sz:[['Ø 12"',0],['Ø 16"',90]],tags:['ready'],rooms:['kitchen','dining'],r:4.7,rc:96,fx:'50%',fy:'48%',
  d:'A classic workshop dome in glossy enamel with a white interior. Pure, clean, and very practical over a kitchen island.',
  dim:'H 8" × Ø 12"',bulb:'1 × E26, 60W max'},
 {h:'studio-brass-task-lamp',n:'Studio Brass Task Lamp',type:'Table',sub:'Task Lamps',mat:'Brass',price:420,img:['p-studio-task','room-study'],fin:['Satin Brass','Matte Black'],sz:[['Standard',0]],tags:['ready'],rooms:['study'],r:4.8,rc:77,fx:'45%',fy:'38%',
  d:'An adjustable brass shade on a weighted base. Focused, glare-free light for desks and reading nooks.',
  dim:'H 18" × Shade Ø 6"',bulb:'1 × E26, 40W max'}
];
const BY={};P.forEach((p,i)=>{p.i=i;BY[p.h]=p});
const img=(n)=>'img/'+n+'.jpg';
const money=(v)=>'$'+v.toLocaleString('en-US');

const COLL={
  all:{t:'All Lighting',d:'Every piece in the collection: hand-finished ceiling lights, sconces, table and floor lamps designed for American homes and wired to UL standards.',img:'hero-pendant',f:()=>true},
  ceiling:{t:'Ceiling Lighting',d:'Pendants and chandeliers in brass, oak, rattan and crystal. Supplied with adjustable cords and canopy covers for US junction boxes.',img:'room-dining',f:p=>p.type==='Ceiling'},
  pendants:{t:'Pendants',d:'Single statements or a run of three over the island. Every pendant ships with a 10 ft adjustable cord.',img:'room-dining',f:p=>p.sub==='Pendants'},
  chandeliers:{t:'Chandeliers',d:'Cast, crafted and dressed by hand. The centrepiece of a dining room.',img:'room-dining',f:p=>p.sub==='Chandeliers'},
  wall:{t:'Wall Sconces',d:'Hardwired or plug-in sconces in alabaster, plaster and turned metal. Layer light at eye level.',img:'ed-alabaster',f:p=>p.type==='Wall'},
  table:{t:'Table Lamps',d:'Stone, glass, plaster and brass lamps for consoles, nightstands and desks.',img:'room-bedroom',f:p=>p.type==='Table'},
  floor:{t:'Floor Lamps',d:'Arcs, columns and lanterns that bring warmth to the corners of a room.',img:'ed-light',f:p=>p.type==='Floor'},
  alabaster:{t:'The Alabaster Collection',d:'Our signature material. Translucent, cool to the touch and carved by hand, so no two pieces glow the same.',img:'ed-alabaster',f:p=>p.mat==='Alabaster'||p.mat==='Marble'||p.mat==='Travertine'},
  new:{t:'New Arrivals',d:'The latest pieces from our workshops, from sculpted plaster to hand-pleated paper.',img:'j-3',f:p=>p.tags.includes('new')},
  best:{t:'Best Sellers',d:'The pieces our clients come back for, again and again.',img:'hero-living',f:p=>p.tags.includes('best')},
  ready:{t:'Ready to Ship',d:'In stock in our New Jersey warehouse and dispatched within 2 business days.',img:'j-2',f:p=>p.tags.includes('ready')},
  living:{t:'Living Room',d:'Layered light for the room you live in most: a reading lamp, a glow on the console, a statement overhead.',img:'room-living',f:p=>p.rooms.includes('living')},
  dining:{t:'Dining Room',d:'Pendants and chandeliers scaled to the table, with sconces to soften the edges.',img:'room-dining',f:p=>p.rooms.includes('dining')},
  bedroom:{t:'Bedroom',d:'Warm, low, dimmable light for winding down.',img:'room-bedroom',f:p=>p.rooms.includes('bedroom')},
  study:{t:'Study',d:'Focused task light and calm ambient glow for long days at the desk.',img:'room-study',f:p=>p.rooms.includes('study')},
  kitchen:{t:'Kitchen',d:'Pendants built for islands and counters, easy to clean and properly bright.',img:'room-dining',f:p=>p.rooms.includes('kitchen')}
};

/* ---------------- Utils ---------------- */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const stars=(r)=>'<span class="stars" aria-label="'+r+' out of 5">'+Array(5).fill(I.star).join('')+'</span>';
const page=document.body.dataset.page;
const qs=new URLSearchParams(location.search);

/* ---------------- Layout: header + footer ---------------- */
const ANN=['Complimentary white-glove delivery over $750','Handcrafted in small batches · UL listed','Free lighting plan from our stylists'];
function header(){
  const lighting=`<div class="mega"><div class="wrap mega-in">
    <div><h4>Ceiling</h4><ul><li><a href="collection.html?c=chandeliers">Chandeliers</a></li><li><a href="collection.html?c=pendants">Pendants</a></li><li><a href="collection.html?c=ceiling">All ceiling</a></li></ul></div>
    <div><h4>Wall &amp; Lamps</h4><ul><li><a href="collection.html?c=wall">Wall sconces</a></li><li><a href="collection.html?c=table">Table lamps</a></li><li><a href="collection.html?c=floor">Floor lamps</a></li></ul></div>
    <div><h4>Shop by material</h4><ul><li><a href="collection.html?c=alabaster">Alabaster &amp; stone</a></li><li><a href="collection.html?c=all&amp;mat=Brass">Brass</a></li><li><a href="collection.html?c=all&amp;mat=Plaster">Plaster</a></li><li><a href="collection.html?c=all&amp;mat=Oak,Rattan,Paper">Natural fibres</a></li></ul></div>
    <a class="mega-card" href="collection.html?c=alabaster"><div class="ph"><img src="${img('ed-alabaster')}" alt="Alabaster lamps glowing on a walnut dresser" loading="lazy"></div><p>The Alabaster Collection</p><span>Our signature material</span></a>
    <a class="mega-card" href="collection.html?c=new"><div class="ph"><img src="${img('j-3')}" alt="Sculptural wooden lamp with a glowing wave" loading="lazy"></div><p>New Arrivals</p><span>Just landed for winter</span></a>
  </div></div>`;
  const rooms=`<div class="mega"><div class="wrap mega-rooms">
    ${[['living','Living Room','room-living'],['dining','Dining Room','room-dining'],['bedroom','Bedroom','room-bedroom'],['study','Study','room-study']].map(r=>`<a class="mega-card" href="collection.html?c=${r[0]}"><div class="ph"><img src="${img(r[2])}" alt="" loading="lazy"></div><p>${r[1]}</p><span>Shop the room</span></a>`).join('')}
  </div></div>`;
  const cur=page==='collection'?(qs.get('c')||'all'):page;
  const on=(k)=>cur===k?' on':'';
  return `
  <div class="demobar"><div class="wrap"><span><b>Demo</b> · Concept store design by AG Development<span class="hide-xs">. Products, prices and contact details are placeholders.</span></span><a href="/review">Want a store like this? →</a></div></div>
  <div class="announce"><div class="wrap"><div class="announce-track">${ANN.map((a,i)=>`<p class="${i?'':'on'}">${a}</p>`).join('')}</div>
    <div class="announce-side"><a href="contact.html">Trade program</a><a href="contact.html#consult">Design consultation</a><a href="faq.html">Help</a></div></div></div>
  <header class="hdr" id="hdr"><div class="wrap hdr-in">
    <div class="hdr-left">
      <button class="icon-btn burger only-m" id="openMenu" aria-label="Open menu" aria-controls="menuDrawer" aria-expanded="false">${I.menu}</button>
      <button class="icon-btn only-m" data-open-search aria-label="Search">${I.search}</button>
      <ul class="nav">
        <li><a class="nav-a${on('all')}" href="collection.html?c=all">Shop all</a></li>
        <li><a class="nav-a${['ceiling','pendants','chandeliers','wall','table','floor','alabaster'].includes(cur)?' on':''}" href="collection.html?c=all">Lighting</a>${lighting}</li>
        <li><a class="nav-a${['living','dining','bedroom','study','kitchen'].includes(cur)?' on':''}" href="collection.html?c=living">Rooms</a>${rooms}</li>
        <li><a class="nav-a${on('new')}" href="collection.html?c=new">New</a></li>
      </ul>
    </div>
    <a class="logo" href="index.html" aria-label="Aurelle home"><span class="logo-name">AURELLE</span><span class="logo-sub">Lighting · Objects</span></a>
    <div class="hdr-icons">
      <a class="nav-a hdr-text${on('about')}" href="about.html">About</a>
      <a class="nav-a hdr-text${on('faq')}" href="faq.html">FAQ</a>
      <a class="nav-a hdr-text${on('contact')}" href="contact.html" style="margin-right:12px">Contact</a>
      <button class="icon-btn hide-m" data-open-search aria-label="Search">${I.search}</button>
      <a class="icon-btn hide-m" href="contact.html" aria-label="Account">${I.user}</a>
      <button class="icon-btn" data-open-cart aria-label="Open bag">${I.bag}<span class="bag-count" id="bagCount">0</span></button>
    </div>
  </div></header>
  ${page==='home'||page==='collection'?`<nav class="chips m-only" aria-label="Categories">${[['all','All','hero-pendant'],['ceiling','Ceiling','p-slatted-oak'],['wall','Sconces','p-halo-sconce'],['table','Table','p-column-marble'],['floor','Floor','p-arco-dome'],['alabaster','Alabaster','p-carved-alabaster'],['new','New','p-plaster-mushroom'],['ready','Ready to ship','p-brass-dome']].map(c=>`<a class="chip${page==='collection'&&cur===c[0]?' on':''}" href="collection.html?c=${c[0]}"><img src="${img(c[2])}" alt="" loading="lazy">${c[1]}</a>`).join('')}</nav>`:''}
  <div class="scrim"></div>`;
}
function footer(){
  const col=(t,links)=>`<div class="ftr-col"><h4>${t}</h4><ul>${links.map(l=>`<li><a href="${l[1]}">${l[0]}</a></li>`).join('')}</ul></div>`;
  return `<section class="wrap"><div class="service">
    <div class="svc">${I.truck}<div><b>White-glove delivery</b><span>Free on orders over $750</span></div></div>
    <div class="svc">${I.return}<div><b>30-night home trial</b><span>Live with it before you decide</span></div></div>
    <div class="svc">${I.bulb}<div><b>Free lighting plan</b><span>From our in-house stylists</span></div></div>
    <div class="svc">${I.shield}<div><b>5-year warranty</b><span>UL listed, built to last</span></div></div>
  </div></section>
  <footer class="ftr">
    <div class="wrap ftr-news">
      <div><span class="eyebrow" style="color:var(--on-night-2)">The Aurelle Letter</span><h2 class="h2" style="margin-top:14px">Light, considered.<br><em>Once a month.</em></h2><p>New collections, studio visits and lighting advice from our designers. Plus 10% off your first order.</p></div>
      <form class="news-form" novalidate><div class="news"><label class="sr" for="nl">Email address</label><input id="nl" type="email" placeholder="Your email address" required><button type="submit">Subscribe</button></div><p class="news-ok">Thank you. Your welcome code is on its way.</p></form>
    </div>
    <div class="wrap ftr-cols">
      <div class="ftr-brand"><a class="logo" href="index.html"><span class="logo-name" style="font-size:24px">AURELLE</span><span class="logo-sub">Lighting · Objects</span></a>
        <p>Handcrafted lighting for considered American homes. Designed in Los Angeles, made by artisans in small batches.</p>
        <div class="social"><a href="#" aria-label="Instagram">${I.ig}</a><a href="#" aria-label="Pinterest">${I.pin}</a><a href="contact.html" aria-label="Email">${I.mail}</a></div></div>
      ${col('Shop',[['Ceiling lighting','collection.html?c=ceiling'],['Wall sconces','collection.html?c=wall'],['Table lamps','collection.html?c=table'],['Floor lamps','collection.html?c=floor'],['New arrivals','collection.html?c=new']])}
      ${col('Collections',[['Alabaster & stone','collection.html?c=alabaster'],['Best sellers','collection.html?c=best'],['Ready to ship','collection.html?c=ready'],['Living room','collection.html?c=living'],['Dining room','collection.html?c=dining']])}
      ${col('Help',[['FAQ','faq.html'],['Shipping & delivery','faq.html#shipping'],['Returns','faq.html#returns'],['Installation','faq.html#products'],['Contact us','contact.html']])}
      ${col('Aurelle',[['About','about.html'],['Trade program','contact.html'],['Design consultation','contact.html#consult'],['Showroom','contact.html'],['Journal','index.html#journal']])}
    </div>
    <div class="wrap ftr-bot"><span>© 2026 Aurelle Lighting · Demo store design by <a href="https://ag-development.dev" class="ulink">AG Development</a></span>
      <div class="pay-row" style="margin:0">${['VISA','MC','AMEX','PAY','GPAY','SHOP'].map(p=>`<span class="pay">${p}</span>`).join('')}</div>
      <span><a href="faq.html">Privacy</a> · <a href="faq.html">Terms</a></span></div>
  </footer>`;
}
function drawers(){
  return `<div class="overlay" id="overlay"></div>
  <aside class="drawer left" id="menuDrawer" aria-label="Menu" aria-hidden="true">
    <div class="drawer-hd"><a class="logo" href="index.html" style="align-items:flex-start"><span class="logo-name" style="font-size:20px">AURELLE</span></a><button class="x" data-close aria-label="Close menu">${I.x}</button></div>
    <div class="drawer-bd">
      <div class="mm-tabs"><button class="on" data-mt="0">Lighting</button><button data-mt="1">Rooms</button></div>
      <div data-mp="0"><ul class="mm-list">
        ${[['Ceiling',[['Chandeliers','chandeliers'],['Pendants','pendants'],['All ceiling lighting','ceiling']]],['Wall',[['Wall sconces','wall']]],['Lamps',[['Table lamps','table'],['Floor lamps','floor']]],['Materials',[['Alabaster & stone','alabaster'],['Brass','all&mat=Brass'],['Plaster','all&mat=Plaster']]]].map((g,i)=>`<li><button class="mm-row" aria-expanded="false" data-mm>${g[0]}${I.plus}</button><div class="mm-sub"><div><ul>${g[1].map(l=>`<li><a href="collection.html?c=${l[1]}">${l[0]}</a></li>`).join('')}</ul></div></div></li>`).join('')}
        <li><a class="mm-row" href="collection.html?c=new">New arrivals</a></li>
        <li><a class="mm-row" href="collection.html?c=best">Best sellers</a></li>
      </ul>
      <div class="mm-cards"><a href="collection.html?c=alabaster"><div class="ph"><img src="${img('ed-alabaster')}" alt="" loading="lazy"></div><p>Alabaster</p></a><a href="collection.html?c=ready"><div class="ph"><img src="${img('j-2')}" alt="" loading="lazy"></div><p>Ready to ship</p></a></div></div>
      <div data-mp="1" hidden><div class="mm-cards" style="padding-top:20px">${[['living','Living','room-living'],['dining','Dining','room-dining'],['bedroom','Bedroom','room-bedroom'],['study','Study','room-study']].map(r=>`<a href="collection.html?c=${r[0]}"><div class="ph"><img src="${img(r[2])}" alt="" loading="lazy"></div><p>${r[1]}</p></a>`).join('')}</div></div>
      <div class="mm-foot"><a href="about.html">About Aurelle</a><a href="faq.html">FAQ &amp; help</a><a href="contact.html">Contact &amp; showroom</a><a href="contact.html#consult">Book a design consultation</a></div>
    </div>
  </aside>
  <aside class="drawer right" id="cartDrawer" aria-label="Shopping bag" aria-hidden="true">
    <div class="drawer-hd"><h2>Your bag<sup id="cartN"></sup></h2><button class="x" data-close aria-label="Close bag">${I.x}</button></div>
    <div class="drawer-bd" id="cartBody"></div>
    <div class="drawer-ft" id="cartFoot"></div>
  </aside>
  <div class="search-panel" id="searchPanel" role="dialog" aria-label="Search" aria-hidden="true">
    <div class="wrap"><div class="search-bar">${I.search}<label class="sr" for="sq">Search products</label><input id="sq" type="search" placeholder="Search lighting, materials, rooms" autocomplete="off"><button class="x" data-close aria-label="Close search">${I.x}</button></div>
    <div class="search-res" id="searchRes"></div></div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

/* ---------------- Product card ---------------- */
function card(p,opts={}){
  const badge=p.cmp?'<span class="badge sale">Save '+money(p.cmp-p.price)+'</span>':p.tags.includes('new')?'<span class="badge">New</span>':p.tags.includes('best')?'<span class="badge dark">Bestseller</span>':p.tags.includes('ready')?'<span class="badge">Ready to ship</span>':'';
  const alt=p.img[1];
  return `<article class="pc">
    <div class="pc-m"><a href="product.html?p=${p.h}" class="pc-media" aria-label="${esc(p.n)}">${badge}
      <img class="main" src="${img(p.img[0])}" alt="${esc(p.n)}" loading="${opts.eager?'eager':'lazy'}">
      ${alt?`<img class="alt" src="${img(alt)}" alt="" loading="lazy">`:''}
    </a>
    <button class="quick" data-quick="${p.h}" aria-label="Quick add ${esc(p.n)}">${I.plus}<span>Quick add</span></button></div>
    <a href="product.html?p=${p.h}" class="pc-info">
      <div class="pc-top"><span class="pc-name">${esc(p.n)}</span><span class="pc-price">${p.sz.length>1?'From ':''}${money(p.price)}${p.cmp?`<s>${money(p.cmp)}</s>`:''}</span></div>
      <span class="pc-meta">${p.mat} · ${p.fin.length} finish${p.fin.length>1?'es':''}</span>
      <span class="swatches">${p.fin.map(f=>`<i class="sw" style="background:${F[f]}" title="${f}"></i>`).join('')}</span>
    </a>
  </article>`;
}

/* ---------------- Cart ---------------- */
let cart=store.get('aurelle-cart',[]);
const FREE=750;
function linePrice(l){const p=BY[l.h];const s=p.sz.find(z=>z[0]===l.s)||p.sz[0];return p.price+s[1]}
function cartTotal(){return cart.reduce((a,l)=>a+linePrice(l)*l.q,0)}
function cartCount(){return cart.reduce((a,l)=>a+l.q,0)}
function addToCart(h,fin,size,q=1,open=true){
  const p=BY[h];fin=fin||p.fin[0];size=size||p.sz[0][0];
  const ex=cart.find(l=>l.h===h&&l.f===fin&&l.s===size);
  if(ex)ex.q+=q;else cart.push({h,f:fin,s:size,q});
  saveCart();
  const b=$('#bagCount');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');
  if(open)openDrawer('cartDrawer');
}
function saveCart(){store.set('aurelle-cart',cart);renderCart()}
function renderCart(){
  const n=cartCount(),t=cartTotal();
  const bc=$('#bagCount');bc.textContent=n;bc.classList.toggle('on',n>0);
  $('#cartN').textContent=n?'('+n+')':'';
  const body=$('#cartBody'),foot=$('#cartFoot');
  if(!n){
    body.innerHTML=`<div class="cart-empty"><p class="h3">Your bag is empty</p><p>Begin with our most-loved pieces.</p><div class="cats">
      <a class="btn" href="collection.html?c=best">Shop best sellers</a><a class="btn ghost" href="collection.html?c=all">Shop all lighting</a></div></div>
      <div class="upsell"><h4>Most loved</h4><div class="upsell-row">${['halo-alabaster-sconce','column-marble-lamp','slatted-oak-pendant'].map(upsell).join('')}</div></div>`;
    foot.innerHTML='';foot.style.display='none';return;
  }
  foot.style.display='';
  const left=Math.max(0,FREE-t),pct=Math.min(100,t/FREE*100);
  const inCart=new Set(cart.map(l=>l.h));
  const ups=P.filter(p=>!inCart.has(p.h)&&p.price<700).sort((a,b)=>b.rc-a.rc).slice(0,4);
  body.innerHTML=`<div class="ship-meter"><p>${left?`You're <b>${money(left)}</b> away from complimentary white-glove delivery.`:'Your order ships with <b>complimentary white-glove delivery</b>.'}</p><div class="bar"><i style="width:${pct}%"></i></div></div>
    ${cart.map((l,i)=>{const p=BY[l.h];return `<div class="line">
      <a class="ph" href="product.html?p=${p.h}"><img src="${img(p.img[0])}" alt="${esc(p.n)}"></a>
      <div><div class="line-top"><div><h3><a href="product.html?p=${p.h}">${esc(p.n)}</a></h3><p class="meta">${l.f}${p.sz.length>1?' · '+l.s:''}</p></div><span class="price">${money(linePrice(l)*l.q)}</span></div>
      <div class="line-bot"><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease quantity">−</button><span>${l.q}</span><button data-q="${i}" data-d="1" aria-label="Increase quantity">+</button></div><button class="rm" data-rm="${i}">Remove</button></div></div></div>`}).join('')}
    ${ups.length?`<div class="upsell"><h4>Complete the room</h4><div class="upsell-row">${ups.map(p=>upsell(p.h)).join('')}</div></div>`:''}`;
  foot.innerHTML=`<button class="note-toggle" id="noteT">Add order note or gift message</button><textarea class="cart-note" id="note" placeholder="Delivery instructions, gift message…"></textarea>
    <div class="sum"><b>Subtotal</b><span>${money(t)}</span></div><p class="sum-sub">Taxes and shipping calculated at checkout. Or 4 interest-free payments of ${money(Math.round(t/4))}.</p>
    <button class="btn block" id="checkout">${I.lock.replace('<svg','<svg style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.4"')} Secure checkout</button>
    <div class="pay-row">${['VISA','MC','AMEX','PAY','GPAY','SHOP'].map(p=>`<span class="pay">${p}</span>`).join('')}</div>`;
}
function upsell(h){const p=BY[h];return `<div class="up"><a class="ph" href="product.html?p=${p.h}"><img src="${img(p.img[0])}" alt="" loading="lazy"></a><div><p>${esc(p.n)}</p><span>${money(p.price)}</span><br><button data-quick="${p.h}">Add</button></div></div>`}

/* ---------------- Drawers ---------------- */
let lastFocus=null;
function openDrawer(id){
  closeAll(true);lastFocus=document.activeElement;
  const d=$('#'+id);d.classList.add('on');d.setAttribute('aria-hidden','false');$('#overlay').classList.add('on');document.body.classList.add('lock');
  if(id==='menuDrawer')$('#openMenu').setAttribute('aria-expanded','true');
  setTimeout(()=>{const f=d.querySelector('[data-close]');f&&f.focus({preventScroll:true})},60);
}
function openSearch(){closeAll(true);lastFocus=document.activeElement;const s=$('#searchPanel');s.classList.add('on');s.setAttribute('aria-hidden','false');$('#overlay').classList.add('on');document.body.classList.add('lock');renderSearch('');setTimeout(()=>$('#sq').focus(),120)}
function closeAll(silent){
  $$('.drawer.on,.search-panel.on').forEach(d=>{d.classList.remove('on');d.setAttribute('aria-hidden','true')});
  $('#overlay').classList.remove('on');document.body.classList.remove('lock');
  const b=$('#openMenu');b&&b.setAttribute('aria-expanded','false');
  if(!silent&&lastFocus){lastFocus.focus({preventScroll:true});lastFocus=null}
}
function renderSearch(q){
  q=q.trim().toLowerCase();
  const res=q?P.filter(p=>(p.n+' '+p.mat+' '+p.type+' '+p.sub+' '+p.fin.join(' ')+' '+p.rooms.join(' ')).toLowerCase().includes(q)):P.filter(p=>p.tags.includes('best')).slice(0,5);
  $('#searchRes').innerHTML=`${q?'':`<h4>Popular searches</h4><div class="search-tags">${['Alabaster','Brass','Pendant','Sconce','Floor lamp','Travertine','Plaster'].map(t=>`<button class="chip plain" data-st="${t}">${t}</button>`).join('')}</div>`}
    <h4>${q?res.length+' result'+(res.length===1?'':'s')+' for “'+esc(q)+'”':'Trending now'}</h4>
    ${res.length?`<div class="search-grid">${res.slice(0,10).map(p=>card(p)).join('')}</div>`:`<p class="muted">No pieces match that search. Try “brass”, “pendant” or “alabaster”.</p>`}
    ${q&&res.length?`<p style="margin-top:28px"><a class="link" href="collection.html?c=all&q=${encodeURIComponent(q)}">View all results</a></p>`:''}`;
}

/* ---------------- Toast ---------------- */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3200)}

/* ---------------- Global init ---------------- */
document.getElementById('site-header').innerHTML=header();
document.getElementById('site-footer').innerHTML=footer()+drawers();
renderCart();

// announcement rotation
(function(){const ps=$$('.announce-track p');let i=0;setInterval(()=>{ps[i].classList.remove('on');i=(i+1)%ps.length;ps[i].classList.add('on')},4500)})();
// header border
const hdr=$('#hdr');const onS=()=>hdr.classList.toggle('scrolled',scrollY>10);addEventListener('scroll',onS,{passive:true});onS();
// mega scrim
$$('.nav>li').forEach(li=>{if(!li.querySelector('.mega'))return;li.addEventListener('mouseenter',()=>document.body.classList.add('mega-open'));li.addEventListener('mouseleave',()=>document.body.classList.remove('mega-open'))});

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-open-cart],[data-open-search],#openMenu,[data-close],#overlay,[data-quick],[data-q],[data-rm],#noteT,#checkout,[data-mm],[data-mt],[data-st],.ftr-col h4');
  if(!t)return;
  if(t.matches('[data-open-cart]'))openDrawer('cartDrawer');
  else if(t.matches('[data-open-search]'))openSearch();
  else if(t.id==='openMenu')openDrawer('menuDrawer');
  else if(t.matches('[data-close]')||t.id==='overlay')closeAll();
  else if(t.matches('[data-quick]')){e.preventDefault();const p=BY[t.dataset.quick];if($('#searchPanel').classList.contains('on'))closeAll(true);addToCart(p.h)}
  else if(t.matches('[data-q]')){const l=cart[+t.dataset.q];l.q+=+t.dataset.d;if(l.q<1)cart.splice(+t.dataset.q,1);saveCart()}
  else if(t.matches('[data-rm]')){cart.splice(+t.dataset.rm,1);saveCart()}
  else if(t.id==='noteT'){$('#note').classList.toggle('on')}
  else if(t.id==='checkout'){toast('Demo store: in the live build this opens Shopify Checkout.')}
  else if(t.matches('[data-mm]')){const ex=t.getAttribute('aria-expanded')==='true';t.setAttribute('aria-expanded',!ex);t.nextElementSibling.classList.toggle('on',!ex)}
  else if(t.matches('[data-mt]')){$$('[data-mt]').forEach(b=>b.classList.toggle('on',b===t));$$('[data-mp]').forEach(p=>p.hidden=p.dataset.mp!==t.dataset.mt)}
  else if(t.matches('[data-st]')){$('#sq').value=t.dataset.st;renderSearch(t.dataset.st)}
  else if(t.matches('.ftr-col h4')&&innerWidth<1000){t.parentElement.classList.toggle('on')}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
$('#sq').addEventListener('input',e=>renderSearch(e.target.value));
$('#sq').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim())location.href='collection.html?c=all&q='+encodeURIComponent(e.target.value.trim())});
$('.news-form').addEventListener('submit',e=>{e.preventDefault();const i=$('#nl');if(!/^\S+@\S+\.\S+$/.test(i.value)){i.focus();toast('Please enter a valid email address.');return}e.target.querySelector('.news').style.display='none';$('.news-ok').classList.add('on')});

// reveal on scroll
function reveal(){const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{rootMargin:'0px 0px -8% 0px'}):null;$$('.rv:not(.in)').forEach(el=>io?io.observe(el):el.classList.add('in'))}

// rail progress bars (mobile carousels)
function railBar(rail,bar){if(!rail||!bar)return;const i=bar.querySelector('i');const u=()=>{const max=rail.scrollWidth-rail.clientWidth;const w=rail.clientWidth/rail.scrollWidth*100;i.style.width=w+'%';i.style.left=(max>0?rail.scrollLeft/max*(100-w):0)+'%'};rail.addEventListener('scroll',u,{passive:true});addEventListener('resize',u);u()}

/* =========================================================
   HOME
   ========================================================= */
if(page==='home'){
  // hero film: pick the right cut for the viewport, respect reduced motion, pause off-screen
  const v=$('#heroVideo');
  if(v){
    const mob=matchMedia('(max-width: 899px)').matches, file=mob?'video/hero-mobile.mp4':'video/hero-desktop.mp4';
    v.poster=mob?'img/hero-video-mobile.jpg':'img/hero-video-desktop.jpg';
    const btn=$('#vidBtn');const setBtn=()=>{btn.classList.toggle('paused',v.paused);btn.setAttribute('aria-label',v.paused?'Play background video':'Pause background video')};
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){v.src=file;v.play().catch(()=>{})}
    v.addEventListener('play',setBtn);v.addEventListener('pause',setBtn);setBtn();
    btn.addEventListener('click',()=>{if(!v.getAttribute('src'))v.src=file;v.paused?v.play():v.pause();btn.dataset.user='1'});
    if('IntersectionObserver' in window)new IntersectionObserver(([en])=>{if(btn.dataset.user||!v.getAttribute('src'))return;en.isIntersecting?v.play().catch(()=>{}):v.pause()}).observe(v);
  }
  // hero slideshow (legacy, only if present)
  if($('.slide')){
  const slides=$$('.slide'),dots=$$('.hero-dots button'),num=$('.hero-dots .num');let cur=0,timer;
  const go=(n)=>{slides[cur].classList.remove('on');dots[cur].classList.remove('on');cur=(n+slides.length)%slides.length;
    slides[cur].classList.add('on');dots.forEach((d,i)=>{d.classList.toggle('done',i<cur);d.classList.remove('on')});void dots[cur].offsetWidth;dots[cur].classList.add('on');
    num.textContent='0'+(cur+1)+' / 0'+slides.length;clearTimeout(timer);timer=setTimeout(()=>go(cur+1),6500)};
  dots.forEach((d,i)=>d.addEventListener('click',()=>go(i)));
  let sx=null;const hero=$('.hero');hero.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});hero.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(cur+(dx<0?1:-1));sx=null});
  go(0);
  }

  // tabs rail
  const TABS={best:P.filter(p=>p.tags.includes('best')),new:P.filter(p=>p.tags.includes('new')),alabaster:P.filter(p=>['Alabaster','Marble','Travertine'].includes(p.mat))};
  const rail=$('#rail');
  const setTab=(k)=>{rail.innerHTML=TABS[k].slice(0,4).map(p=>card(p)).join('');rail.classList.remove('fade');void rail.offsetWidth;rail.classList.add('fade');rail.scrollLeft=0;$('#railAll').href='collection.html?c='+k;railBar(rail,$('#railBar'))};
  $$('.tabs button').forEach(b=>b.addEventListener('click',()=>{$$('.tabs button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});setTab(b.dataset.tab)}));
  setTab('best');

  // shop the look
  const lk=['arco-dome-floor-lamp','halo-alabaster-sconce','plaster-mushroom-lamp'];
  $('#lookList').innerHTML=lk.map(h=>{const p=BY[h];return `<div class="look-item"><a class="ph" href="product.html?p=${h}"><img src="${img(p.img[0])}" alt="" loading="lazy"></a><a href="product.html?p=${h}"><p>${esc(p.n)}</p><span>${money(p.price)}</span></a><button data-quick="${h}">Add</button></div>`}).join('');
  $('#lookAll').addEventListener('click',()=>{lk.forEach(h=>addToCart(h,null,null,1,false));openDrawer('cartDrawer')});
  $$('.hot').forEach(h=>{const c=$('#'+h.dataset.card);const tog=(on)=>c.classList.toggle('on',on);h.addEventListener('click',e=>{e.stopPropagation();tog(!c.classList.contains('on'))});h.addEventListener('mouseenter',()=>tog(true))});
  document.addEventListener('click',e=>{if(!e.target.closest('.hot-card'))$$('.hot-card').forEach(c=>c.classList.remove('on'))});

  // quotes
  const qq=$$('.quote'),qn=$$('.quote-nav button');let qi=0,qt;const qgo=n=>{qq[qi].classList.remove('on');qn[qi].classList.remove('on');qi=n%qq.length;qq[qi].classList.add('on');qn[qi].classList.add('on');clearTimeout(qt);qt=setTimeout(()=>qgo(qi+1),7000)};
  qn.forEach((b,i)=>b.addEventListener('click',()=>qgo(i)));qgo(0);
}

/* =========================================================
   COLLECTION
   ========================================================= */
if(page==='collection'){
  const key=COLL[qs.get('c')]?qs.get('c'):'all';const C=COLL[key];
  document.title=C.t+' | Aurelle Lighting';
  $('#cTitle').textContent=C.t;$('#cDesc').textContent=C.d;$('#cImg').src=img(C.img);$('#cCrumb').textContent=C.t;
  // sub-nav
  const subs={all:['ceiling','wall','table','floor','alabaster','ready'],ceiling:['pendants','chandeliers'],pendants:['ceiling','chandeliers'],chandeliers:['ceiling','pendants'],wall:['alabaster','table'],table:['floor','wall','alabaster'],floor:['table','living'],alabaster:['table','wall'],new:['best','ready'],best:['new','ready'],ready:['best','new'],living:['dining','bedroom','study'],dining:['living','kitchen'],bedroom:['living','study'],study:['living','bedroom'],kitchen:['dining']};
  $('#subnav').innerHTML=`<a class="chip plain on" href="collection.html?c=${key}">${C.t} <em style="font-style:normal;opacity:.6">${P.filter(C.f).length}</em></a>`+(subs[key]||[]).map(k=>`<a class="chip plain" href="collection.html?c=${k}">${COLL[k].t}</a>`).join('');

  const base=P.filter(C.f);
  const st={type:new Set(),mat:new Set((qs.get('mat')||'').split(',').filter(Boolean)),fin:new Set(),avail:new Set(),min:'',max:'',sort:'featured',q:qs.get('q')||''};
  const groups=[['type','Category',p=>p.type==='Wall'?'Wall':p.type,v=>({Ceiling:'Ceiling lights',Wall:'Wall sconces',Table:'Table lamps',Floor:'Floor lamps'}[v])],['mat','Material',p=>p.mat],['fin','Finish',p=>p.fin],['avail','Availability',p=>p.tags.includes('ready')?'Ready to ship':'Made to order']];
  function filtersHTML(){
    return groups.map(([k,label,get,fmt],gi)=>{
      const counts={};base.forEach(p=>{[].concat(get(p)).forEach(v=>counts[v]=(counts[v]||0)+1)});
      const vals=Object.keys(counts).sort();if(vals.length<2&&!st[k].size)return'';
      return `<div class="fgroup${gi>2&&innerWidth>999?' closed':''}"><button type="button" aria-expanded="true">${label}${I.chev}</button><div class="fopts">${vals.map(v=>`<label class="fopt"><input type="checkbox" data-f="${k}" value="${esc(v)}"${st[k].has(v)?' checked':''}>${k==='fin'?`<i class="sw" style="background:${F[v]}"></i>`:''}${fmt?fmt(v):v}<em>${counts[v]}</em></label>`).join('')}</div></div>`}).join('')+
      `<div class="fgroup"><button type="button" aria-expanded="true">Price${I.chev}</button><div class="fopts"><div class="price-range"><label>$<input type="number" inputmode="numeric" data-p="min" placeholder="0" value="${st.min}" aria-label="Minimum price"></label><label>$<input type="number" inputmode="numeric" data-p="max" placeholder="3,000" value="${st.max}" aria-label="Maximum price"></label></div></div></div>`;
  }
  const side=$('#filtersSide'),fd=$('#filterBody');
  function paintFilters(){side.innerHTML=filtersHTML();fd.innerHTML=filtersHTML()}
  paintFilters();
  function apply(){
    let r=base.filter(p=>(!st.type.size||st.type.has(p.type))&&(!st.mat.size||st.mat.has(p.mat))&&(!st.fin.size||p.fin.some(f=>st.fin.has(f)))&&(!st.avail.size||st.avail.has(p.tags.includes('ready')?'Ready to ship':'Made to order'))&&(st.min===''||p.price>=+st.min)&&(st.max===''||p.price<=+st.max)&&(!st.q||(p.n+' '+p.mat+' '+p.sub+' '+p.fin.join(' ')).toLowerCase().includes(st.q.toLowerCase())));
    const s=st.sort;
    if(s==='low')r.sort((a,b)=>a.price-b.price);else if(s==='high')r.sort((a,b)=>b.price-a.price);else if(s==='best')r.sort((a,b)=>b.rc-a.rc);else if(s==='new')r.sort((a,b)=>(b.tags.includes('new')-a.tags.includes('new')));else if(s==='az')r.sort((a,b)=>a.n.localeCompare(b.n));
    const n=r.length;$('#count').textContent=n+' piece'+(n===1?'':'s');
    const fcount=st.type.size+st.mat.size+st.fin.size+st.avail.size+(st.min!==''?1:0)+(st.max!==''?1:0)+(st.q?1:0);
    $$('.tb-btn .n').forEach(x=>{x.textContent=fcount;x.classList.toggle('on',fcount>0)});
    $('#applyN').textContent='Show '+n+' result'+(n===1?'':'s');
    const chips=[];['type','mat','fin','avail'].forEach(k=>st[k].forEach(v=>chips.push(`<button class="af" data-af="${k}" data-v="${esc(v)}">${esc(v)} ${I.x}</button>`)));
    if(st.min!=='')chips.push(`<button class="af" data-af="min">From $${st.min} ${I.x}</button>`);if(st.max!=='')chips.push(`<button class="af" data-af="max">Up to $${st.max} ${I.x}</button>`);
    if(st.q)chips.push(`<button class="af" data-af="q">“${esc(st.q)}” ${I.x}</button>`);
    $('#activeF').innerHTML=chips.length?chips.join('')+'<button class="af clear" data-af="all">Clear all</button>':'';
    const g=$('#grid');
    if(!n){g.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><p class="h3">Nothing matches just yet</p><p>Try removing a filter, or browse the full collection.</p><button class="btn ghost" data-af="all">Clear filters</button></div>`;$('#more').style.display='none';return}
    const html=r.map((p,i)=>card(p,{eager:i<4}));
    if(n>=6&&!fcount&&s==='featured'){html.splice(4,0,`<a class="promo" href="collection.html?c=alabaster"><img src="${img(key==='alabaster'?'hero-nook':'ed-alabaster')}" alt="" loading="lazy"><div><span class="eyebrow">${key==='alabaster'?'Design service':'Signature material'}</span><p class="h3">${key==='alabaster'?'Not sure what size? Our stylists will plan it for you.':'The Alabaster Collection. Carved by hand, lit from within.'}</p><span class="link">${key==='alabaster'?'Book a consultation':'Discover'}</span></div></a>`)}
    g.innerHTML=html.join('');
    $('#more').style.display='';$('#moreTxt').textContent='You’ve viewed '+n+' of '+n+' pieces';
  }
  const onChange=e=>{const t=e.target;if(t.dataset.f){const s=st[t.dataset.f];t.checked?s.add(t.value):s.delete(t.value);
      $$(`[data-f="${t.dataset.f}"][value="${CSS.escape(t.value)}"]`).forEach(x=>x.checked=t.checked);apply()}
    if(t.dataset.p){st[t.dataset.p]=t.value;$$(`[data-p="${t.dataset.p}"]`).forEach(x=>{if(x!==t)x.value=t.value});apply()}};
  [side,fd].forEach(el=>{el.addEventListener('change',onChange);el.addEventListener('click',e=>{const b=e.target.closest('.fgroup>button');if(b){b.parentElement.classList.toggle('closed');b.setAttribute('aria-expanded',!b.parentElement.classList.contains('closed'))}})});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-af]');if(!a)return;const k=a.dataset.af;
    if(k==='all'){['type','mat','fin','avail'].forEach(x=>st[x].clear());st.min=st.max=st.q=''}else if(k==='min'||k==='max'||k==='q')st[k]='';else st[k].delete(a.dataset.v);
    paintFilters();apply()});
  $('#sort').addEventListener('change',e=>{st.sort=e.target.value;apply()});
  $$('[data-open-filters]').forEach(b=>b.addEventListener('click',()=>openDrawer('filterDrawer')));
  $('#applyF').addEventListener('click',()=>closeAll());
  $('#clearF').addEventListener('click',()=>{['type','mat','fin','avail'].forEach(x=>st[x].clear());st.min=st.max='';paintFilters();apply()});
  const toggles=$$('.cols-toggle button');toggles.forEach(b=>b.addEventListener('click',()=>{toggles.forEach(x=>x.classList.toggle('on',x===b));$('#grid').classList.toggle('one',b.dataset.cols==='1');$('#grid').classList.toggle('c4',b.dataset.cols==='4')}));
  // desktop sidebar toggle
  $('#toggleSide').addEventListener('click',()=>{if(innerWidth<1000){openDrawer('filterDrawer');return}const body=$('.coll-body');const hid=body.classList.toggle('nofilters');side.style.display=hid?'none':'';$('#toggleSide .lbl').textContent=hid?'Show filters':'Hide filters'});
  apply();
}

/* =========================================================
   PRODUCT
   ========================================================= */
if(page==='product'){
  const p=BY[qs.get('p')]||BY['halo-alabaster-sconce'];
  document.title=p.n+' | Aurelle Lighting';
  let fin=p.fin[0],sz=p.sz[0][0],qty=1;
  const crumbC=p.type==='Wall'?'wall':p.type.toLowerCase();
  const life=p.img.slice(1);
  const gal=[{s:p.img[0],a:p.n},{s:p.img[0],a:p.n+', detail',detail:true},...life.map(l=>({s:l,a:'',tag:'In the room'}))];
  $('#pdp').innerHTML=`
  <div class="g-wrap"><div class="gallery" id="gallery">${gal.map((g,i)=>`<figure class="g-item${g.detail?' detail':''}" style="margin:0;--fx:${p.fx};--fy:${p.fy}" data-i="${i}"><img src="${img(g.s)}" alt="${esc(g.a)}" ${i?'loading="lazy"':''}>${g.detail?'<span class="tag">Detail</span>':g.tag?`<span class="tag">${g.tag}</span>`:''}</figure>`).join('')}</div>
    <span class="g-count" id="gCount">1 / ${gal.length}</span><div class="g-dots" id="gDots">${gal.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div></div>
  <div class="info">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="collection.html?c=${crumbC}">${COLL[crumbC].t}</a><span aria-hidden="true">/</span><span>${esc(p.n)}</span></nav>
    <div class="rate">${stars(p.r)}<a href="#reviews">${p.r.toFixed(1)} · ${p.rc} reviews</a></div>
    <h1>${esc(p.n)}</h1>
    <p class="sub">${p.mat} · ${p.sub.replace(/s$/,'')} · Handcrafted</p>
    <p class="price-lg" id="price"></p><p class="instal" id="instal"></p>
    <p class="desc">${esc(p.d)}</p>
    <div class="opt"><div class="opt-hd">Finish <span id="finName">${fin}</span></div><div class="opt-sw">${p.fin.map((f,i)=>`<button type="button" class="${i?'':'on'}" data-fin="${f}" aria-label="${f}" title="${f}"><i style="background:${F[f]}"></i></button>`).join('')}</div></div>
    ${p.sz.length>1?`<div class="opt"><div class="opt-hd">Size <span>Need help sizing? <a class="ulink" href="contact.html#consult">Ask a stylist</a></span></div><div class="opt-sz">${p.sz.map((s,i)=>`<button type="button" class="${i?'':'on'}" data-sz="${s[0]}">${s[0]}${s[1]?`<small>${s[1]>0?'+':'−'}${money(Math.abs(s[1]))}</small>`:''}</button>`).join('')}</div></div>`:''}
    <div class="buy"><div class="qty lg"><button type="button" id="qm" aria-label="Decrease quantity">−</button><span id="qv">1</span><button type="button" id="qp" aria-label="Increase quantity">+</button></div><button class="btn" id="atc">Add to bag</button></div>
    <div class="stock"><i></i>${p.tags.includes('ready')?'In stock · Ships in 1–2 business days':'Made to order · Ships in 3–4 weeks'}</div>
    <div class="perks"><div class="perk">${I.truck}Free delivery over $750</div><div class="perk">${I.return}30-night home trial</div><div class="perk">${I.shield}5-year warranty</div></div>
    <div class="accs">
      <details class="acc" open><summary>Details</summary><div class="acc-bd"><ul><li>Handcrafted ${p.mat.toLowerCase()}${p.mat==='Alabaster'?', each with unique natural veining':''}</li><li>Finish: <span class="finTxt">${fin}</span></li><li>UL listed for damp locations; dimmable with an LED-compatible dimmer</li><li>Designed in Los Angeles, made by artisan partners</li></ul></div></details>
      <details class="acc"><summary>Dimensions &amp; specifications</summary><div class="acc-bd"><table class="specs"><tr><th>Dimensions</th><td>${p.dim}</td></tr><tr><th>Light source</th><td>${p.bulb}</td></tr><tr><th>Material</th><td>${p.mat}</td></tr><tr><th>Certification</th><td>UL / cUL listed</td></tr><tr><th>Installation</th><td>${p.type==='Ceiling'||p.type==='Wall'?'Hardwired; standard US junction box. Professional installation recommended.':'Plug-in, 8 ft fabric cord'}</td></tr></table></div></details>
      <details class="acc"><summary>Shipping &amp; returns</summary><div class="acc-bd"><p>Complimentary white-glove delivery on orders over $750 in the contiguous US. Otherwise, insured ground shipping from $29.</p><p>Not right for your room? Return within 30 nights for a full refund. <a class="ulink" href="faq.html#returns">Full policy</a></p></div></details>
      <details class="acc"><summary>Care</summary><div class="acc-bd"><p>Dust with a soft, dry cloth. ${p.mat==='Alabaster'||p.mat==='Marble'||p.mat==='Travertine'?'Natural stone is porous: avoid water and cleaning products, and keep away from direct sun to preserve its tone.':p.mat==='Brass'?'Unlacquered brass develops a living patina; polish occasionally if you prefer a brighter tone.':'Avoid moisture and harsh cleaners.'}</p></div></details>
    </div>
    <div class="consult"><div class="av"><img src="${img('about-still')}" alt=""></div><p><b>Need a lighting plan?</b>Our stylists will plan your room for free. <a class="ulink" href="contact.html#consult">Book a call</a></p></div>
  </div>`;
  const stickyHTML=`<div class="sticky-atc" id="sticky"><img src="${img(p.img[0])}" alt=""><div style="min-width:0"><p>${esc(p.n)}</p><span id="sPrice"></span></div><button class="btn" id="satc">Add to bag</button></div>`;
  document.body.insertAdjacentHTML('beforeend',stickyHTML);
  const price=()=>p.price+(p.sz.find(s=>s[0]===sz)||[0,0])[1];
  const upd=()=>{const v=price();$('#price').innerHTML=money(v)+(p.cmp?`<s>${money(p.cmp)}</s>`:'');$('#instal').textContent='Or 4 interest-free payments of '+money(Math.round(v/4))+' at checkout';$('#sPrice').textContent=money(v)+' · '+fin;$('#finName').textContent=fin;$$('.finTxt').forEach(x=>x.textContent=fin)};
  upd();
  $$('[data-fin]').forEach(b=>b.addEventListener('click',()=>{fin=b.dataset.fin;$$('[data-fin]').forEach(x=>x.classList.toggle('on',x===b));upd()}));
  $$('[data-sz]').forEach(b=>b.addEventListener('click',()=>{sz=b.dataset.sz;$$('[data-sz]').forEach(x=>x.classList.toggle('on',x===b));upd()}));
  $('#qm').addEventListener('click',()=>{qty=Math.max(1,qty-1);$('#qv').textContent=qty});
  $('#qp').addEventListener('click',()=>{qty=Math.min(20,qty+1);$('#qv').textContent=qty});
  const add=()=>{addToCart(p.h,fin,sz,qty);const b=$('#atc');b.textContent='Added';setTimeout(()=>b.textContent='Add to bag',1600)};
  $('#atc').addEventListener('click',add);$('#satc').addEventListener('click',()=>addToCart(p.h,fin,sz,qty));
  // sticky ATC when main button scrolled out
  const sticky=$('#sticky');
  if('IntersectionObserver' in window){new IntersectionObserver(([en])=>{sticky.classList.toggle('on',!en.isIntersecting&&en.boundingClientRect.top<0)}).observe($('#atc'))}
  // mobile gallery counter
  const g=$('#gallery');g.addEventListener('scroll',()=>{const i=Math.round(g.scrollLeft/g.clientWidth);$('#gCount').textContent=(i+1)+' / '+gal.length;$$('#gDots i').forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true});
  // lightbox (desktop)
  const lb=$('#lightbox');
  g.addEventListener('click',e=>{if(innerWidth<1000)return;const f=e.target.closest('.g-item');if(!f)return;lb.innerHTML=`<button class="x" aria-label="Close">${I.x}</button>`+gal.filter(x=>!x.detail).map(x=>`<img src="${img(x.s)}" alt="">`).join('');lb.classList.add('on');document.body.classList.add('lock');
    const t=lb.querySelectorAll('img')[f.dataset.i==='0'?0:Math.max(0,+f.dataset.i-1)];setTimeout(()=>t&&t.scrollIntoView(),30)});
  lb.addEventListener('click',()=>{lb.classList.remove('on');document.body.classList.remove('lock')});
  // story + related + reviews
  $('#storyImg').src=img(life[life.length-1]||p.img[0]);
  const rel=P.filter(x=>x.h!==p.h&&(x.type===p.type||x.mat===p.mat)).slice(0,4);
  const rel2=rel.length<4?rel.concat(P.filter(x=>x.h!==p.h&&!rel.includes(x)).slice(0,4-rel.length)):rel;
  $('#related').innerHTML=rel2.map(x=>card(x)).join('');railBar($('#related'),$('#relBar'));
  let pairs=P.filter(x=>x.type!==p.type&&x.rooms.some(r=>p.rooms.includes(r))).sort((a,b)=>b.rc-a.rc).slice(0,4);
  if(pairs.length<4)pairs=pairs.concat(P.filter(x=>x.h!==p.h&&!pairs.includes(x)&&x.type!==p.type).sort((a,b)=>b.rc-a.rc).slice(0,4-pairs.length));
  $('#pairs').innerHTML=pairs.map(x=>card(x)).join('');railBar($('#pairs'),$('#pairBar'));
  const dist=[[5,86],[4,10],[3,3],[2,1],[1,0]];
  $('#revSum').innerHTML=`<span class="eyebrow">Reviews</span><div class="big" style="margin-top:14px">${p.r.toFixed(1)}</div><div style="margin-top:10px">${stars(p.r)}</div><p class="muted small" style="margin:8px 0 0">Based on ${p.rc} verified reviews</p>
    <div class="rev-bars">${dist.map(d=>`<div><span>${d[0]}★</span><s><i style="width:${d[1]}%"></i></s><span>${Math.round(p.rc*d[1]/100)}</span></div>`).join('')}</div><button class="btn ghost" type="button" onclick="this.textContent='Thank you, demo only'">Write a review</button>`;
  const R=[['Even better in person','The photos don’t do the material justice. In the evening it glows like it’s lit from inside the stone. Packaging was immaculate.','Caroline M.','Austin, TX','2 weeks ago'],
           ['Our designer’s favourite','We specified this for a client project in Brooklyn and ordered a second for our own home. Finish quality is exceptional.','Daniel R.','New York, NY','1 month ago'],
           ['Worth every penny','Arrived well protected, installation was straightforward, and the light is soft and warm. The stylist call helped us pick the right size.','Priya S.','San Francisco, CA','2 months ago']];
  $('#revList').innerHTML=R.map(r=>`<div class="rev"><div class="rev-top">${stars(5)}<span>${r[4]}</span></div><h4>${r[0]}</h4><p>${r[1]}</p><div class="who"><b>${r[2]}</b> · ${r[3]} · <span class="verified">✓ Verified buyer</span></div></div>`).join('');
}

/* =========================================================
   CONTACT
   ========================================================= */
if(page==='contact'){
  const f=$('#cform');
  f.addEventListener('submit',e=>{e.preventDefault();let ok=true;
    $$('[required]',f).forEach(i=>{const fl=i.closest('.field');const bad=!i.value.trim()||(i.type==='email'&&!/^\S+@\S+\.\S+$/.test(i.value));fl.classList.toggle('bad',bad);if(bad&&ok){i.focus();ok=false}});
    if(!ok)return;const name=$('#fname').value.trim().split(' ')[0];
    f.hidden=true;$('#formOk').classList.add('on');$('#okName').textContent=name;});
  $('#again').addEventListener('click',()=>{f.reset();f.hidden=false;$('#formOk').classList.remove('on')});
  $$('[required]',f).forEach(i=>i.addEventListener('input',()=>i.closest('.field').classList.remove('bad')));
  const t=location.hash==='#consult'?'Design consultation':null;if(t){const r=$(`input[name=topic][value="${t}"]`);if(r)r.checked=true}
}

/* =========================================================
   FAQ
   ========================================================= */
if(page==='faq'){
  const groups=$$('.faq-group'),items=$$('.faq-group .acc');
  items.forEach(d=>{d.dataset.q=d.querySelector('summary').textContent;d.dataset.a=d.querySelector('.acc-bd').innerHTML});
  $('#faqQ').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let any=0;
    items.forEach(d=>{const hit=!q||(d.dataset.q+' '+d.querySelector('.acc-bd').textContent).toLowerCase().includes(q);d.hidden=!hit;if(hit)any++;
      const s=d.querySelector('summary');s.innerHTML='<span>'+(q&&hit?esc(d.dataset.q).replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>'):esc(d.dataset.q))+'</span>';d.open=!!q&&hit&&any<=2});
    groups.forEach(g=>g.hidden=!g.querySelector('.acc:not([hidden])'));$('#faqNone').classList.toggle('on',!any)});
  // nav counts + scrollspy
  $$('.faq-nav a').forEach(a=>{const g=$(a.getAttribute('href'));a.insertAdjacentHTML('beforeend',`<em>${g.querySelectorAll('.acc').length}</em>`)});
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){$$('.faq-nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id));const on=$('.faq-nav a.on');if(on&&innerWidth<900)on.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'})}}),{rootMargin:'-30% 0px -60% 0px'});groups.forEach(g=>io.observe(g))}
  if(location.hash){const g=$(location.hash);if(g){const d=g.querySelector('.acc');if(d)d.open=true}}
}

reveal();
window.AURELLE={P,BY,card,img,money};
})();
