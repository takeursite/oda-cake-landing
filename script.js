(function () {
  'use strict';

  var OCCASIONS = [{ id: 'bday', name: 'Birthday' }, { id: 'wedding', name: 'Wedding' }, { id: 'kids', name: 'Kids party' }, { id: 'none', name: 'Just because' }];
  var SHAPES = [{ id: 'round', name: 'Round', note: 'classic' }, { id: 'square', name: 'Square', note: 'clean lines' }, { id: 'bento', name: 'Bento', note: 'for two' }];
  var GUESTS = [6, 10, 12, 20, 30, 50];
  var BASES = [{ id: 'vanilla', name: 'Vanilla', color: '#F3D9A4' }, { id: 'choco', name: 'Chocolate', color: '#5A2B22' }, { id: 'velvet', name: 'Red velvet', color: '#B8283E' }, { id: 'carrot', name: 'Carrot', color: '#D88A4A' }];
  var FILLS = [{ id: 'caramel', name: 'Salted caramel', color: '#F2A154' }, { id: 'cherry', name: 'Cherry', color: '#D6385E' }, { id: 'banana', name: 'Banana', color: '#F3E08A' }, { id: 'pistachio', name: 'Pistachio', color: '#A9B86A' }];
  var COVERS = [{ id: 'cream', name: 'Cream', color: '#FBF4EC' }, { id: 'honey', name: 'Honey', color: '#F7D46B' }, { id: 'orange', name: 'Sunset', color: '#F2A154' }, { id: 'coral', name: 'Coral', color: '#EC5B3C' }, { id: 'berry', name: 'Raspberry', color: '#D6385E' }, { id: 'plum', name: 'Plum', color: '#6B2A3A' }];
  var DECORS = [{ id: 'berries', name: 'Berries' }, { id: 'flowers', name: 'Flowers' }, { id: 'drip', name: 'Chocolate drip' }, { id: 'gold', name: 'Gold trim' }];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // TODO: заполнить — Telegram username без @ и номер WhatsApp в международном формате без «+»
  var TELEGRAM_USERNAME = 'takeursite';
  var WHATSAPP_NUMBER = '12125550142';
  // Real cake photos. Only look-defining options count: shape, tiers, cover, decor (exact set).
  var PHOTOS = [
    { src: 'img/builder/cake-square-2-plum.jpg', alt: 'Two-tier square plum cake with strawberries, cherries and gold trim', shape: 'square', tiers: 2, cover: 'plum', decor: ['berries', 'gold'] },
    { src: 'img/builder/cake-round-1-cream-drip.jpg', alt: 'Bento cake with cream frosting and chocolate drip', shape: 'bento', tiers: 1, cover: 'cream', decor: ['drip'] },
    { src: 'img/builder/cake-round-3-cream-wedding.jpg', alt: 'Three-tier cream wedding cake with fresh flowers and gold trim', shape: 'round', tiers: 3, cover: 'cream', decor: ['flowers', 'gold'] }
  ];
  PHOTOS.forEach(function (p) { new Image().src = p.src; }); // preload for an instant swap
  var MAX_TEXT = 24;
  var MIN_DAYS = 30;

  var state = { occasion: 'bday', shape: 'round', guests: 6, base: 'vanilla', fill: 'caramel', cover: 'cream', decor: { berries: true }, text: '', date: '', sent: false };

  var $ = function (id) { return document.getElementById(id); };
  var find = function (list, id) { return list.filter(function (x) { return x.id === id; })[0] || list[0]; };

  /* ---------- build controls ---------- */
  var buttons = { occasion: [], shape: [], guests: [], base: [], fill: [], cover: [], decor: [] };

  function touch() { state.sent = false; render(); }

  function makeChips(container, key, list, extraClass, inner) {
    list.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip ' + (extraClass || '');
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = inner(o);
      b.addEventListener('click', function () { state[key] = o.id; touch(); });
      b.dataset.id = o.id;
      container.appendChild(b);
      buttons[key].push(b);
    });
  }

  makeChips($('occasionChips'), 'occasion', OCCASIONS, '', function (o) { return o.name; });
  makeChips($('shapeChips'), 'shape', SHAPES, 'shape', function (o) { return '<b>' + o.name + '</b><small>' + o.note + '</small>'; });
  makeChips($('guestChips'), 'guests', GUESTS.map(function (n) { return { id: n, name: String(n) }; }), 'guest', function (o) { return o.name; });
  makeChips($('baseChips'), 'base', BASES, 'opt', function (o) { return '<i style="background:' + o.color + '"></i>' + o.name; });
  makeChips($('fillChips'), 'fill', FILLS, 'opt', function (o) { return '<i class="round" style="background:' + o.color + '"></i>' + o.name; });

  COVERS.forEach(function (o) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = o.color;
    b.setAttribute('aria-label', o.name);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { state.cover = o.id; touch(); });
    b.dataset.id = o.id;
    $('coverSwatches').appendChild(b);
    buttons.cover.push(b);
  });

  DECORS.forEach(function (o) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { state.decor[o.id] = !state.decor[o.id]; touch(); });
    b.dataset.id = o.id;
    $('decorChips').appendChild(b);
    buttons.decor.push(b);
  });

  /* ---------- cake tiers (created once so CSS can animate them) ---------- */
  var tiersEl = $('tiers');
  var tierEls = [];
  for (var i = 0; i < 3; i++) {
    var t = document.createElement('div');
    t.className = 'tier off';
    t.setAttribute('aria-hidden', 'true');
    var drip = document.createElement('div');
    drip.className = 'drip';
    [['f'], ['d', 34], ['f'], ['d', 26], ['f'], ['d', 40], ['f']].forEach(function (p) {
      var s = document.createElement('span');
      s.className = p[0];
      if (p[1]) s.style.height = p[1] + 'px';
      drip.appendChild(s);
    });
    var gold = document.createElement('div');
    gold.className = 'gold';
    var label = document.createElement('span');
    label.className = 'tier-label';
    label.style.opacity = '0';
    t.appendChild(drip); t.appendChild(gold); t.appendChild(label);
    tiersEl.appendChild(t); // column-reverse: first = bottom tier
    tierEls.push({ el: t, drip: drip, gold: gold, label: label });
  }

  /* ---------- inputs ---------- */
  var msg = $('msg'), dateInput = $('date');
  msg.addEventListener('input', function () {
    state.text = msg.value.slice(0, MAX_TEXT);
    if (msg.value !== state.text) msg.value = state.text;
    touch();
  });
  dateInput.addEventListener('change', function () { state.date = dateInput.value; touch(); });
  (function setMinDate() {
    var d = new Date();
    d.setDate(d.getDate() + MIN_DAYS);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    dateInput.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  })();

  /* ---------- send ---------- */
  var sendBtn = $('sendBtn');
  var summaryRows = [];

  function requestText() {
    return ["Hi! I'd like to order a cake from oda.", ''].concat(summaryRows.map(function (r) { return r[0] + ': ' + r[1]; })).join('\n');
  }
  function channelUrl(channel) {
    var text = encodeURIComponent(requestText());
    if (channel === 'wa') return WHATSAPP_NUMBER ? 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text : '';
    return TELEGRAM_USERNAME ? 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + text : '';
  }
  function sendRequest(channel) {
    if (!state.date) {
      dateInput.classList.add('invalid');
      $('dateErr').hidden = false;
      dateInput.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
      dateInput.focus({ preventScroll: true });
      return;
    }
    var url = channelUrl(channel);
    if (url) window.open(url, '_blank', 'noopener');
    else console.warn('Set TELEGRAM_USERNAME / WHATSAPP_NUMBER in script.js. Request text:\n' + requestText());
    state.sent = true;
    render();
  }
  sendBtn.addEventListener('click', function () { sendRequest('tg'); });
  $('sendTg').addEventListener('click', function () { sendRequest('tg'); });
  $('sendWa').addEventListener('click', function () { sendRequest('wa'); });
  dateInput.addEventListener('change', function () { dateInput.classList.remove('invalid'); $('dateErr').hidden = true; });

  // CTA links in the contact block
  if (TELEGRAM_USERNAME) $('ctaTg').href = 'https://t.me/' + TELEGRAM_USERNAME;
  if (WHATSAPP_NUMBER) $('ctaWa').href = 'https://wa.me/' + WHATSAPP_NUMBER;

  function reduceMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------- presets from the cake cards ---------- */
  var PRESETS = {
    bento: { shape: 'bento' },
    classic: { shape: 'round', guests: 20 },
    wedding: { occasion: 'wedding', guests: 50 },
    desserts: {}
  };
  document.querySelectorAll('[data-preset]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var key = a.getAttribute('data-preset');
      Object.keys(PRESETS[key]).forEach(function (k) { state[k] = PRESETS[key][k]; });
      state.sent = false;
      render();
      var target = key === 'desserts' ? document.querySelector('.build-steps .step') : $('build');
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- render ---------- */
  function setPressed(list, isOn) {
    list.forEach(function (b) {
      var id = b.dataset.id;
      b.setAttribute('aria-pressed', isOn(id) ? 'true' : 'false');
    });
  }

  function tiersFor(s) {
    return s.shape === 'bento' ? 1 : s.guests <= 12 ? 1 : s.guests <= 30 ? 2 : 3;
  }
  function matchPhoto(s) {
    var decor = Object.keys(s.decor).filter(function (k) { return s.decor[k]; }).sort().join(',');
    var tiers = tiersFor(s);
    for (var i = 0; i < PHOTOS.length; i++) {
      var p = PHOTOS[i];
      if (p.shape === s.shape && p.tiers === tiers && p.cover === s.cover && p.decor.slice().sort().join(',') === decor) return p;
    }
    return null;
  }

  var showPhoto = false;
  $('photoBtn').addEventListener('click', function () { showPhoto = !showPhoto; render(); });

  function render() {
    var s = state;
    var bento = s.shape === 'bento';
    var base = find(BASES, s.base), fill = find(FILLS, s.fill), cover = find(COVERS, s.cover);
    var shape = find(SHAPES, s.shape), occ = find(OCCASIONS, s.occasion);

    setPressed(buttons.occasion, function (id) { return id === s.occasion; });
    setPressed(buttons.shape, function (id) { return id === s.shape; });
    setPressed(buttons.guests, function (id) { return Number(id) === s.guests; });
    setPressed(buttons.base, function (id) { return id === s.base; });
    setPressed(buttons.fill, function (id) { return id === s.fill; });
    setPressed(buttons.cover, function (id) { return id === s.cover; });
    buttons.decor.forEach(function (b) {
      var on = !!s.decor[b.dataset.id];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = (on ? '✓ ' : '+ ') + find(DECORS, b.dataset.id).name;
    });

    $('guestsStep').hidden = bento;
    var nTiers = tiersFor(s);
    var tierWord = nTiers === 1 ? '1 tier' : nTiers + ' tiers';
    $('tierNote').textContent = tierWord;
    $('coverName').textContent = cover.name;

    // dims from the bottom tier up
    var dims = bento ? [{ w: 170, h: 90 }] : nTiers === 1 ? [{ w: 280, h: 130 }] : [{ w: 320, h: 120 }, { w: 236, h: 100 }, { w: 160, h: 86 }].slice(0, nTiers);
    var darkCover = ['coral', 'berry', 'plum'].indexOf(cover.id) > -1;
    var radius = s.shape === 'square' ? '4px' : '16px 16px 10px 10px';
    tierEls.forEach(function (t, idx) {
      var d = dims[idx];
      var used = !!d;
      var top = used && idx === dims.length - 1;
      t.el.classList.toggle('off', !used);
      if (used) {
        t.el.style.width = d.w + 'px';
        t.el.style.height = d.h + 'px';
      } else {
        // keep previous width so the removed tier shrinks in place
        t.el.style.width = dims[dims.length - 1].w + 'px';
      }
      t.el.style.backgroundColor = cover.color;
      t.el.style.borderRadius = radius;
      t.drip.classList.toggle('on', top && !!s.decor.drip);
      t.gold.classList.toggle('on', used && !!s.decor.gold);
      t.label.textContent = top ? s.text : '';
      t.label.style.opacity = top && s.text ? '1' : '0';
      t.label.style.fontSize = used ? (d.w >= 236 ? 15 : d.w >= 170 ? 13 : 12) + 'px' : '';
      t.label.style.color = darkCover ? '#FBF4EC' : '#6B2A3A';
    });
    $('plate').style.width = (dims[0].w + 60) + 'px';
    $('topBerries').classList.toggle('on', !!s.decor.berries);
    $('topFlowersL').classList.toggle('on', !!s.decor.flowers);
    $('topFlowersR').classList.toggle('on', !!s.decor.flowers);
    $('cake').setAttribute('aria-label', 'Cake: ' + cover.name + ' frosting, ' + tierWord + (s.text ? ', says “' + s.text + '”' : ''));

    // real photo when the selection matches one
    var photo = matchPhoto(s);
    if (!photo) showPhoto = false;
    var photoBtn = $('photoBtn');
    photoBtn.disabled = !photo;
    photoBtn.setAttribute('aria-pressed', showPhoto ? 'true' : 'false');
    $('photoBtnLabel').textContent = !photo ? 'No real photo for this look yet' : showPhoto ? 'Back to the sketch' : 'See it in real life';
    if (!showPhoto) photo = null;
    var img = $('previewPhoto');
    if (photo) {
      if (img.getAttribute('src') !== photo.src) img.src = photo.src;
      img.alt = photo.alt;
      img.removeAttribute('aria-hidden');
      $('cake').setAttribute('aria-hidden', 'true');
    } else {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      $('cake').removeAttribute('aria-hidden');
    }
    $('previewCard').classList.toggle('has-photo', !!photo);

    // cross-section
    $('xCover').style.backgroundColor = cover.color;
    ['xBase1', 'xBase2', 'xBase3'].forEach(function (id) { $(id).style.backgroundColor = base.color; });
    ['xFill1', 'xFill2'].forEach(function (id) { $(id).style.backgroundColor = fill.color; });
    $('crossMain').textContent = base.name + ' · ' + fill.name;
    $('crossSub').textContent = 'Frosting: ' + cover.name;

    // summary
    var kg = bento ? 0.5 : Math.max(1, Math.round(s.guests * 0.15 * 2) / 2);
    var decorNames = DECORS.filter(function (x) { return s.decor[x.id]; }).map(function (x) { return x.name; });
    var dateStr = 'Not set';
    if (s.date) {
      var p = s.date.split('-');
      dateStr = MONTHS[Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0];
    }
    var rows = [
      ['Occasion', occ.name],
      ['Shape', shape.name + (bento ? '' : ' · ' + tierWord)],
      ['Guests / weight', bento ? '1–2 · ≈0.5 kg' : s.guests + ' · ≈' + kg + ' kg'],
      ['Flavor', base.name + ' + ' + fill.name.toLowerCase()],
      ['Frosting', cover.name],
      ['Decor', decorNames.length ? decorNames.join(', ') : 'None'],
      ['Message', s.text ? '“' + s.text + '”' : 'None'],
      ['Date', dateStr]
    ];
    summaryRows = rows;
    var box = $('summaryRows');
    box.innerHTML = '';
    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'sum-row';
      var a = document.createElement('span'), b = document.createElement('span');
      a.textContent = r[0]; b.textContent = r[1];
      row.appendChild(a); row.appendChild(b);
      box.appendChild(row);
    });

    $('msgCount').textContent = s.text.length + '/' + MAX_TEXT;
    sendBtn.textContent = s.sent ? 'Request sent ✓' : 'Send request';
  }

  // initial render without animation flash
  render();

  /* ---------- mobile menu ---------- */
  var burger = $('burger'), navLinks = $('navLinks');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Inside: layers build up once when the list is in view ---------- */
  var layersSection = $('layers'), layerList = $('layerList');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var lio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { layersSection.classList.add('built'); lio.disconnect(); }
    }, { threshold: 0.35 });
    lio.observe(layerList);
  } else {
    layersSection.classList.add('built');
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }
})();
