/* ===========================================================
   INDERA — shared behaviour. Vanilla JS, no dependencies.
   Works offline from the folder; every motion path checks
   prefers-reduced-motion first.
   =========================================================== */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return motionQuery.matches; }

  /* ---------- catalogue: the single source of product truth ---------- */
  var CATALOG = {
    kopitiam: {
      id: 'kopitiam',
      name: 'Kopitiam',
      scent: 'Freesia Pear',
      front: 'assets/kopitiam-front.jpg',
      back: 'assets/kopitiam-back.jpg',
      pair: 'assets/kopitiam-pair.jpg',
      artwork: 'A kopitiam scene — the shopfront, a hibiscus, the KL skyline and dishes laid out on a black table.',
      frontAlt: 'The Kopitiam charm, logo face: a white herringbone-twill pouch with the INDERA mark, a silver eyelet and a cotton tape loop.',
      backAlt: 'The Kopitiam charm, painted face: a kopitiam scene with the shopfront, a hibiscus, the KL skyline and dishes on a black table.',
      pairAlt: 'Two Kopitiam charms hanging side by side, showing the logo face and the painted kopitiam face together.'
    },
    tehtarik: {
      id: 'tehtarik',
      name: 'Teh Tarik',
      scent: 'White Musk',
      front: 'assets/tehtarik-front.jpg',
      back: 'assets/tehtarik-back.jpg',
      pair: 'assets/tehtarik-pair.jpg',
      artwork: 'A glass of teh tarik on a blue saucer.',
      frontAlt: 'The Teh Tarik charm, logo face: the INDERA mark above a fine line drawing of a glass of teh tarik.',
      backAlt: 'The Teh Tarik charm, painted face: a glass of teh tarik on a blue saucer.',
      pairAlt: 'Two Teh Tarik charms hanging side by side, showing the logo face and the painted face together.'
    },
    nasilemak: {
      id: 'nasilemak',
      name: 'Nasi Lemak',
      scent: 'White Musk',
      front: 'assets/nasilemak-front.jpg',
      back: 'assets/nasilemak-back.jpg',
      pair: 'assets/nasilemak-pair.jpg',
      artwork: 'A nasi lemak spread — egg, sambal, anchovies and cucumber.',
      frontAlt: 'The Nasi Lemak charm, logo face: the INDERA mark above a coloured line drawing of a nasi lemak plate.',
      backAlt: 'The Nasi Lemak charm, painted face: a nasi lemak spread with egg, sambal, anchovies and cucumber.',
      pairAlt: 'Two Nasi Lemak charms hanging side by side, showing the logo face and the painted face together.'
    }
  };

  var UNIT = 18.99;
  var BUNDLE_PRICE = 50;
  var BUNDLE_SIZE = 3;
  var DELIVERY = 8;
  var CART_KEY = 'indera_cart_v1';
  var DETAILS_KEY = 'indera_details_v1';
  var WHATSAPP = '601113129932';

  /* ---------- money ---------- */
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function rm(n) { return 'RM' + round2(n).toFixed(2); }

  /* Bundle pricing: every 3 charms cost RM50, the remainder RM18.99 each. */
  function price(count) {
    count = Math.max(0, Math.floor(count || 0));
    var bundles = Math.floor(count / BUNDLE_SIZE);
    var singles = count % BUNDLE_SIZE;
    var items = round2(bundles * BUNDLE_PRICE + singles * UNIT);
    var full = round2(count * UNIT);
    var delivery = count > 0 ? DELIVERY : 0;
    return {
      count: count, bundles: bundles, singles: singles,
      items: items, full: full, saving: round2(full - items),
      delivery: delivery, total: round2(items + delivery)
    };
  }

  /* ---------- cart state ---------- */
  function readCart() {
    var raw;
    try { raw = JSON.parse(window.localStorage.getItem(CART_KEY) || '{}'); }
    catch (e) { raw = {}; }
    var cart = {};
    Object.keys(CATALOG).forEach(function (id) {
      var n = parseInt(raw && raw[id], 10);
      cart[id] = isNaN(n) || n < 0 ? 0 : Math.min(n, 999);
    });
    return cart;
  }

  function writeCart(cart) {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('indera:cart', { detail: cart }));
  }

  function cartCount(cart) {
    cart = cart || readCart();
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }

  function cartLines(cart) {
    cart = cart || readCart();
    return Object.keys(CATALOG)
      .filter(function (id) { return cart[id] > 0; })
      .map(function (id) { return { item: CATALOG[id], qty: cart[id] }; });
  }

  function addToCart(id, qty) {
    if (!CATALOG[id]) { return; }
    qty = Math.max(1, Math.min(parseInt(qty, 10) || 1, 99));
    var cart = readCart();
    cart[id] = Math.min(cart[id] + qty, 999);
    writeCart(cart);
    toast(qty + ' \u00D7 ' + CATALOG[id].name + ' added to your cart');
    popBadge();
  }

  function setQty(id, qty) {
    if (!CATALOG[id]) { return; }
    var cart = readCart();
    cart[id] = Math.max(0, Math.min(parseInt(qty, 10) || 0, 999));
    writeCart(cart);
  }

  /* ---------- small helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }

  var toastTimer = null;
  function toast(message) {
    var host = $('#toast');
    if (!host) { return; }
    host.innerHTML = '';
    host.appendChild(el('p', 'toast__msg', message));
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { host.innerHTML = ''; }, 4000);
  }

  function popBadge() {
    var badge = $('#cart-count');
    if (!badge) { return; }
    badge.classList.remove('is-pop');
    void badge.offsetWidth;
    badge.classList.add('is-pop');
    window.setTimeout(function () { badge.classList.remove('is-pop'); }, 900);
  }

  /* ---------- header ---------- */
  function initHeader() {
    var header = $('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-condensed', window.scrollY > 28);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (toggle && nav) {
      var setOpen = function (open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.hidden = !open;
      };
      var mq = window.matchMedia('(max-width: 880px)');
      var sync = function () { setOpen(!mq.matches ? true : false); };
      sync();
      if (mq.addEventListener) { mq.addEventListener('change', sync); }
      else if (mq.addListener) { mq.addListener(sync); }
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && mq.matches) { setOpen(false); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mq.matches && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });
    }
  }

  function renderBadge() {
    var badge = $('#cart-count');
    if (!badge) { return; }
    var n = cartCount();
    badge.textContent = String(n);
    var label = $('#cart-label');
    if (label) {
      label.textContent = n === 1 ? 'Cart, 1 charm' : 'Cart, ' + n + ' charms';
    }
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var targets = $$('[data-reveal]');
    if (!targets.length) { return; }
    if (reduced() || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-visible'); });
      return;
    }
    var groups = {};
    targets.forEach(function (t) {
      var key = t.getAttribute('data-reveal-group') || 'none';
      groups[key] = groups[key] || 0;
      if (key !== 'none') {
        t.style.transitionDelay = Math.min(groups[key] * 110, 550) + 'ms';
        groups[key] += 1;
      }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- count-up statistics ---------- */
  function initCountUps() {
    var nodes = $$('[data-countup]');
    if (!nodes.length) { return; }
    var format = function (node, value) {
      var dec = parseInt(node.getAttribute('data-decimals'), 10) || 0;
      var text = value.toFixed(dec);
      if (node.getAttribute('data-group') === 'true') {
        var parts = text.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        text = parts.join('.');
      }
      node.textContent = (node.getAttribute('data-prefix') || '') + text + (node.getAttribute('data-suffix') || '');
    };
    if (reduced() || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { format(n, parseFloat(n.getAttribute('data-countup'))); });
      return;
    }
    nodes.forEach(function (n) { format(n, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var node = entry.target;
        io.unobserve(node);
        var target = parseFloat(node.getAttribute('data-countup'));
        var duration = 1500;
        var start = null;
        var tick = function (ts) {
          if (start === null) { start = ts; }
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          format(node, target * eased);
          if (p < 1) { window.requestAnimationFrame(tick); }
        };
        window.requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- flip cards ---------- */
  function initFlips() {
    $$('.flip__btn').forEach(function (btn) {
      var hint = $('.flip__hint', btn);
      var name = btn.getAttribute('data-flip-name') || 'this charm';
      var sync = function () {
        var on = btn.getAttribute('aria-pressed') === 'true';
        if (hint) { hint.textContent = on ? 'Showing the painted side' : 'Flip for the painted side'; }
        btn.setAttribute('aria-label', (on ? 'Show the logo side of ' : 'Show the painted side of ') + name);
      };
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        sync();
      });
      sync();
    });
  }

  /* ---------- hero: idle sway + cursor parallax ---------- */
  function initHero() {
    var hero = $('.hero');
    if (!hero || reduced()) { return; }
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }
    var photo = $('.hero__media img', hero);
    var charm = $('.hero__charm', hero);
    var raf = null;
    var tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) { return; }
      raf = window.requestAnimationFrame(function () {
        raf = null;
        if (photo) { photo.style.transform = 'scale(1.06) translate3d(' + (tx * -9) + 'px,' + (ty * -7) + 'px,0)'; }
        if (charm) { charm.style.transform = 'translate3d(' + (tx * 7) + 'px,' + (ty * 5) + 'px,0)'; }
      });
    });
    hero.addEventListener('pointerleave', function () {
      if (photo) { photo.style.transform = ''; }
      if (charm) { charm.style.transform = ''; }
    });
  }

  /* ---------- quick-look modal ---------- */
  var modal = {
    root: null, panel: null, lastFocus: null,
    open: function (id, trigger) {
      var item = CATALOG[id];
      this.root = $('#quicklook');
      if (!item || !this.root) { return; }
      this.panel = $('.modal__panel', this.root);
      this.lastFocus = trigger || document.activeElement;
      $('#quicklook-title').textContent = item.name;
      $('#quicklook-scent').textContent = item.scent;
      $('#quicklook-art').textContent = item.artwork;
      var img = $('#quicklook-img');
      img.src = item.pair;
      img.alt = item.pairAlt;
      var qty = $('#quicklook-qty');
      qty.value = '1';
      $('#quicklook-add').setAttribute('data-add', id);
      $('#quicklook-shop').textContent = 'See ' + item.name + ' in the shop';
      this.root.hidden = false;
      $$('body > *:not(#quicklook):not(#toast)').forEach(function (n) { n.setAttribute('data-inert-by-modal', 'true'); n.setAttribute('aria-hidden', 'true'); });
      var close = $('.modal__close', this.root);
      if (close) { close.focus(); }
      document.body.style.overflow = 'hidden';
    },
    close: function () {
      if (!this.root || this.root.hidden) { return; }
      this.root.hidden = true;
      document.body.style.overflow = '';
      $$('[data-inert-by-modal]').forEach(function (n) { n.removeAttribute('aria-hidden'); n.removeAttribute('data-inert-by-modal'); });
      if (this.lastFocus && this.lastFocus.focus) { this.lastFocus.focus(); }
    },
    trap: function (e) {
      if (!this.root || this.root.hidden || e.key !== 'Tab') { return; }
      var focusables = $$('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])', this.panel)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!focusables.length) { return; }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  function initModal() {
    var root = $('#quicklook');
    if (!root) { return; }
    root.addEventListener('click', function (e) {
      if (e.target === root || e.target.closest('[data-close]')) { modal.close(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { modal.close(); }
      modal.trap(e);
    });
  }

  /* ---------- steppers + add-to-cart wiring ---------- */
  function stepperValue(scope) {
    var input = $('input[type="number"]', scope);
    return input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;
  }

  function initActions() {
    document.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) {
        var input = $('input[type="number"]', step.closest('.stepper'));
        if (input) {
          var min = parseInt(input.getAttribute('min'), 10);
          if (isNaN(min)) { min = 1; }
          var next = (parseInt(input.value, 10) || min) + parseInt(step.getAttribute('data-step'), 10);
          input.value = String(Math.max(min, Math.min(next, 99)));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }
      var add = e.target.closest('[data-add]');
      if (add) {
        var scope = add.closest('[data-product]') || add.closest('.modal__panel') || document;
        addToCart(add.getAttribute('data-add'), stepperValue(scope));
        return;
      }
      var look = e.target.closest('[data-quicklook]');
      if (look) {
        modal.open(look.getAttribute('data-quicklook'), look);
      }
    });
  }

  /* ---------- order page ---------- */
  function initOrder() {
    var page = $('#order-flow');
    if (!page) { return; }

    var FIELDS = [
      { id: 'f-name', key: 'name', label: 'Name', required: true,
        test: function (v) { return v.trim().length >= 2; },
        msg: 'Please enter your name.' },
      { id: 'f-email', key: 'email', label: 'Email address', required: true,
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        msg: 'Please enter a valid email address, e.g. name@example.com.' },
      { id: 'f-phone', key: 'phone', label: 'Contact number', required: true,
        test: function (v) { return (v.replace(/\D/g, '').length >= 9); },
        msg: 'Please enter a contact number with at least 9 digits, e.g. 60 12-345 6789.' },
      { id: 'f-address', key: 'address', label: 'Full delivery address', required: true,
        test: function (v) { return v.trim().length >= 12; },
        msg: 'Please enter the full delivery address, including postcode and state.' },
      { id: 'f-message', key: 'message', label: 'Message for the artisans', required: false,
        test: function () { return true; }, msg: '' }
    ];

    var steps = $$('.step-btn');
    var panels = $$('.step-panel');
    var current = 1;
    var totalsOnly = false;

    function details() {
      var out = {};
      FIELDS.forEach(function (f) {
        var node = document.getElementById(f.id);
        out[f.key] = node ? node.value.trim() : '';
      });
      return out;
    }

    function saveDetails() {
      try { window.localStorage.setItem(DETAILS_KEY, JSON.stringify(details())); } catch (e) {}
    }

    function restoreDetails() {
      var saved;
      try { saved = JSON.parse(window.localStorage.getItem(DETAILS_KEY) || '{}'); }
      catch (e) { saved = {}; }
      FIELDS.forEach(function (f) {
        var node = document.getElementById(f.id);
        if (node && saved && typeof saved[f.key] === 'string') { node.value = saved[f.key]; }
      });
    }

    function markField(f, ok) {
      var node = document.getElementById(f.id);
      if (!node) { return; }
      var wrap = node.closest('.field');
      node.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (wrap) { wrap.classList.toggle('has-error', !ok); }
    }

    function validate(report) {
      var bad = [];
      FIELDS.forEach(function (f) {
        if (!f.required) { return; }
        var node = document.getElementById(f.id);
        var ok = node ? f.test(node.value) : false;
        if (report) { markField(f, ok); }
        if (!ok) { bad.push(f); }
      });
      if (report) {
        var box = $('#form-errors');
        var list = $('#form-errors-list');
        if (box && list) {
          list.innerHTML = '';
          bad.forEach(function (f) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + f.id;
            a.textContent = f.label + ' — ' + f.msg;
            a.addEventListener('click', function (ev) {
              ev.preventDefault();
              var node = document.getElementById(f.id);
              if (node) { node.focus(); }
            });
            li.appendChild(a);
            list.appendChild(li);
          });
          box.hidden = bad.length === 0;
          if (bad.length) { box.focus(); }
        }
      }
      return bad.length === 0;
    }

    function go(n, announce) {
      if (n >= 2 && cartCount() === 0) {
        toast('Your cart is empty — add a charm first.');
        n = 1;
      }
      if (n === 3 && !validate(true)) {
        n = 2;
      }
      current = n;
      steps.forEach(function (btn, i) {
        var isCurrent = (i + 1) === n;
        btn.setAttribute('aria-current', isCurrent ? 'step' : 'false');
        var done = $('.step-btn__done', btn);
        if (done) { done.textContent = (i + 1) < n ? '\u2713 done' : ''; }
      });
      panels.forEach(function (panel, i) { panel.hidden = (i + 1) !== n; });
      if (n === 3) { renderPayment(); }
      var heading = $('#step-' + n + ' h2');
      if (heading && announce) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
      var live = $('#step-live');
      if (live) { live.textContent = 'Step ' + n + ' of 3: ' + ['Your cart', 'Your details', 'Payment'][n - 1]; }
    }

    function renderCart() {
      var host = $('#cart-items');
      var empty = $('#cart-empty');
      var lines = cartLines();
      host.innerHTML = '';
      empty.hidden = lines.length > 0;
      $$('[data-needs-cart]').forEach(function (n) { n.hidden = lines.length === 0; });

      lines.forEach(function (line) {
        var row = el('div', 'line-item');
        var img = el('img');
        img.src = line.item.front;
        img.alt = line.item.frontAlt;
        img.width = 92; img.height = 92; img.loading = 'lazy';
        row.appendChild(img);

        var mid = el('div');
        mid.appendChild(el('p', 'line-item__name', line.item.name));
        mid.appendChild(el('p', 'line-item__meta', line.item.scent + ' \u00B7 ' + rm(UNIT) + ' each'));
        row.appendChild(mid);

        var right = el('div', 'line-item__right');
        var stepper = el('div', 'stepper');
        var minus = el('button', null, '\u2212');
        minus.type = 'button';
        minus.setAttribute('data-step', '-1');
        minus.setAttribute('aria-label', 'Decrease ' + line.item.name + ' quantity');
        var input = el('input');
        input.type = 'number'; input.min = '0'; input.max = '99';
        input.value = String(line.qty);
        input.id = 'qty-' + line.item.id;
        input.setAttribute('aria-label', line.item.name + ' quantity');
        var plus = el('button', null, '+');
        plus.type = 'button';
        plus.setAttribute('data-step', '1');
        plus.setAttribute('aria-label', 'Increase ' + line.item.name + ' quantity');
        stepper.appendChild(minus); stepper.appendChild(input); stepper.appendChild(plus);
        input.addEventListener('change', function () {
          var next = Math.max(0, parseInt(input.value, 10) || 0);
          // a non-zero change keeps the row (and the focused control) in place
          totalsOnly = next > 0;
          setQty(line.item.id, next);
          totalsOnly = false;
        });
        right.appendChild(stepper);

        var remove = el('button', 'link-btn', 'Remove');
        remove.type = 'button';
        remove.setAttribute('aria-label', 'Remove ' + line.item.name + ' from your cart');
        remove.addEventListener('click', function () {
          setQty(line.item.id, 0);
          toast(line.item.name + ' removed from your cart');
          var heading = $('#step-1 h2');
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
        });
        right.appendChild(remove);
        row.appendChild(right);
        host.appendChild(row);
      });
      renderTotals();
    }

    function renderTotals() {
      var p = price(cartCount());
      $$('[data-total-count]').forEach(function (n) { n.textContent = p.count === 1 ? '1 charm' : p.count + ' charms'; });
      $$('[data-total-items]').forEach(function (n) { n.textContent = rm(p.items); });
      $$('[data-total-delivery]').forEach(function (n) { n.textContent = p.count ? rm(p.delivery) : rm(0); });
      $$('[data-total-grand]').forEach(function (n) { n.textContent = rm(p.total); });
      $$('[data-total-saving]').forEach(function (n) {
        n.textContent = 'Bundle applied \u2014 you saved ' + rm(p.saving);
      });
      $$('[data-saving-row]').forEach(function (n) { n.hidden = p.saving <= 0; });
      $$('[data-bundle-hint]').forEach(function (n) {
        var need = p.count === 0 ? 3 : (BUNDLE_SIZE - p.singles) % BUNDLE_SIZE;
        if (p.singles === 0 && p.count > 0) {
          n.textContent = 'Every charm in this order is priced in a bundle of 3.';
        } else {
          n.textContent = 'Add ' + need + ' more ' + (need === 1 ? 'charm' : 'charms') +
            ' to turn the next 3 into a RM50 bundle.';
        }
      });
    }

    function summaryText() {
      var p = price(cartCount());
      var d = details();
      var lines = ['INDERA — order summary', '======================', ''];
      cartLines().forEach(function (line) {
        lines.push(line.qty + ' x ' + line.item.name + ' (' + line.item.scent + ')');
      });
      lines.push('');
      lines.push('Charms: ' + p.count);
      if (p.bundles > 0) {
        lines.push('Pricing: ' + p.bundles + ' x bundle of 3 @ RM50.00' +
          (p.singles ? ' + ' + p.singles + ' x RM18.99' : ''));
        lines.push('Bundle saving: ' + rm(p.saving));
      } else {
        lines.push('Pricing: ' + p.count + ' x RM18.99');
      }
      lines.push('Items: ' + rm(p.items));
      lines.push('Delivery: ' + rm(p.delivery));
      lines.push('TOTAL TO TRANSFER: ' + rm(p.total));
      lines.push('');
      lines.push('Name: ' + d.name);
      lines.push('Email: ' + d.email);
      lines.push('Contact number: ' + d.phone);
      lines.push('Delivery address: ' + d.address);
      if (d.message) {
        lines.push('Message for the artisans: ' + d.message);
      }
      lines.push('');
      lines.push('Payment: DuitNow transfer to Peng Qi Ern.');
      lines.push('I will attach my DuitNow receipt with this message.');
      return lines.join('\n');
    }

    function renderPayment() {
      renderTotals();
      var out = $('#order-summary');
      if (out) { out.value = summaryText(); }
      var text = encodeURIComponent(summaryText());
      var wa = $('#wa-link');
      if (wa) { wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + text; }
      var mail = $('#mail-link');
      if (mail) {
        mail.href = 'mailto:?subject=' + encodeURIComponent('INDERA order — ' + (details().name || 'new order')) + '&body=' + text;
      }
    }

    // wiring
    steps.forEach(function (btn, i) {
      btn.addEventListener('click', function () { go(i + 1, true); });
    });
    $$('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () { go(parseInt(btn.getAttribute('data-goto'), 10), true); });
    });

    FIELDS.forEach(function (f) {
      var node = document.getElementById(f.id);
      if (!node) { return; }
      node.addEventListener('blur', function () {
        if (f.required) { markField(f, f.test(node.value)); }
        saveDetails();
      });
      node.addEventListener('input', function () {
        if (f.required && node.getAttribute('aria-invalid') === 'true' && f.test(node.value)) {
          markField(f, true);
        }
      });
    });

    var copyBtn = $('#copy-summary');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var out = $('#order-summary');
        if (!out) { return; }
        var done = function () { toast('Order summary copied to your clipboard'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(out.value).then(done, function () {
            out.select(); document.execCommand('copy'); done();
          });
        } else {
          out.select(); document.execCommand('copy'); done();
        }
      });
    }

    document.addEventListener('indera:cart', function () {
      if (totalsOnly) { renderTotals(); } else { renderCart(); }
    });
    window.addEventListener('storage', function (e) {
      if (e.key === CART_KEY) { renderCart(); }
    });

    var detailsForm = $('#details-form');
    if (detailsForm) {
      detailsForm.addEventListener('submit', function (e) {
        e.preventDefault();
        go(3, true);
      });
    }

    restoreDetails();
    renderCart();
    go(1, false);
  }

  /* ---------- boot ---------- */
  function boot() {
    initHeader();
    renderBadge();
    initReveals();
    initCountUps();
    initFlips();
    initHero();
    initModal();
    initActions();
    initOrder();

    document.addEventListener('indera:cart', renderBadge);
    window.addEventListener('storage', function (e) {
      if (e.key === CART_KEY) { renderBadge(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.INDERA = { price: price, readCart: readCart, writeCart: writeCart, cartCount: cartCount, CATALOG: CATALOG };
}());
