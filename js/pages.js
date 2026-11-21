/* =========================================================
   VÆRIN — page-specific behaviour (home, collection,
   craftsmanship, contact, product)
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var V = window.VAERIN, page = document.body.getAttribute('data-page');
  if (!V || !window.gsap) return;
  var narrow = function () { return window.innerWidth < 800; };

  /* ================= PRODUCT (fill before reveals run) ================= */
  if (page === 'product') {
    var data = window.VAERIN_DATA || {};
    var id = new URLSearchParams(location.search).get('w');
    var w = data[id] || data.aurelis;
    document.title = w.name + ' — VÆRIN';
    var set = function (sel, html) { var el = $(sel); if (el) el.innerHTML = html; };
    set('#p-type', w.type);
    set('#p-name', w.name);
    set('#p-short', w.short);
    set('#p-long', w.long);
    set('#p-price', '<small>From</small>$' + w.price);
    var img = $('#p-img'); if (img) { img.src = w.img; img.alt = w.name + ' watch'; }
    set('#p-specs', w.specs.map(function (s) { return '<li><span>' + s[0] + '</span><span>' + s[1] + '</span></li>'; }).join(''));
    set('#p-stats', w.stats.map(function (s) { return '<div class="stat"><b data-count="' + s[0] + '">0</b><span>' + s[1] + '</span></div>'; }).join(''));
    set('#p-thumbs', w.gallery.map(function (g) { return '<div class="img-frame"><img src="' + g + '" alt="' + w.name + ' detail" loading="lazy"></div>'; }).join(''));
    var rel = Object.keys(data).filter(function (k) { return k !== w.id; });
    set('#p-related', rel.map(function (k) {
      var r = data[k];
      return '<a class="card" href="product.html?w=' + r.id + '" data-tilt><div class="c-img"><img src="' + r.img + '" alt="' + r.name + '" loading="lazy"><span class="tag">' + r.type.split('·')[0].trim() + '</span></div>' +
        '<div class="c-body"><h3>' + r.name + '</h3><div class="c-sub">' + r.type + '</div><div class="c-row"><span>From</span><b>$' + r.price + '</b></div></div></a>';
    }).join(''));
    var si = $('#p-stats'); if (si) si.style.gridTemplateColumns = 'repeat(3,1fr)';
    $$('[data-watch]').forEach(function (el) { el.value = w.name; });

    // reserve modal
    var modal = $('#modal');
    $$('[data-open-modal]').forEach(function (b) { b.addEventListener('click', function () { modal.classList.add('open'); }); });
    $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', function () { modal.classList.remove('open'); }); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });
  }

  V.onReady(function () {

    /* ================= HOME ================= */
    if (page === 'home') {
      gsap.fromTo('.hero-media', { scale: 1.14 }, { scale: 1, duration: 2.6, ease: 'expo.out' });
      gsap.from('.hero-meta span', { y: 40, opacity: 0, stagger: .1, duration: 1.2, ease: 'expo.out', delay: .6 });
      gsap.from('.hero-cta > *', { y: 30, opacity: 0, stagger: .12, duration: 1.2, ease: 'expo.out', delay: .9 });
      gsap.to('.hero-content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
      gsap.to('.hero-media', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

      // ---- 3D watch scene ----
      var cv = $('#watch-canvas');
      var wp = cv && V.createWatchScene(cv);
      if (wp) {
        var P = wp.pivot, nr = narrow();
        P.rotation.set(.32, -.7, 0); P.scale.setScalar(.55);
        var steps = $$('.stage-step'), dots = $$('.stage-dots i');
        var tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: '#stage', start: 'top top', end: '+=480%', pin: true, scrub: 1, anticipatePin: 1, refreshPriority: V.pinPriority($('#stage')),
            onUpdate: function (s) {
              var i = Math.min(3, Math.floor(s.progress * 4));
              dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
            }
          }
        });
        function stepIn(i, t) { tl.fromTo(steps[i], { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out' }, t); }
        function stepOut(i, t) { tl.to(steps[i], { opacity: 0, y: -36, duration: .3, ease: 'power2.in' }, t); }
        // 1 — arrive
        tl.to(P.rotation, { x: .1, y: .2, duration: 1 }, 0).to(P.scale, { x: 1, y: 1, z: 1, duration: 1 }, 0);
        stepIn(0, .15); stepOut(0, .82);
        // 2 — crown side
        tl.to(P.rotation, { x: .04, y: -1.05, duration: 1 }, 1).to(P.position, { x: nr ? 0 : .5, duration: 1 }, 1);
        stepIn(1, 1.15); stepOut(1, 1.82);
        // 3 — tilt to show depth
        tl.to(P.rotation, { x: -.8, y: .55, duration: 1 }, 2).to(P.position, { x: nr ? 0 : -.6, y: nr ? .5 : 0, duration: 1 }, 2);
        stepIn(2, 2.15); stepOut(2, 2.82);
        // 4 — dial close-up
        tl.to(P.rotation, { x: 0, y: 0, duration: 1 }, 3).to(P.scale, { x: nr ? 1.25 : 1.5, y: nr ? 1.25 : 1.5, z: nr ? 1.25 : 1.5, duration: 1 }, 3)
          .to(P.position, { x: nr ? 0 : 1.3, y: nr ? .6 : -.1, duration: 1 }, 3);
        stepIn(3, 3.15);
        tl.to('.stage-ghost', { xPercent: -30, ease: 'none', duration: 4 }, 0);
        tl.to({}, { duration: .35 });
      } else {
        // WebGL unavailable → static fallback
        var st = $('#stage'); if (st) st.classList.add('no-webgl');
      }

      // ---- horizontal collection ----
      var hs = $('#hscroll');
      if (hs) {
        var track = $('.hs-track', hs), bar = $('.hs-bar span', hs);
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var hTween = gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: hs, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: V.pinPriority(hs),
            onUpdate: function (s) { bar.style.transform = 'scaleX(' + s.progress + ')'; }
          }
        });
        $$('.hs-panel', hs).forEach(function (p) {
          var im = $('.hs-img img', p);
          if (im) gsap.fromTo(im, { scale: 1.25 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
        });
      }
    }

    /* ================= COLLECTION ================= */
    if (page === 'collection') {
      var chips = $$('.chip'), cards = $$('.cards .card');
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on');
          var f = c.getAttribute('data-filter');
          var keep = cards.filter(function (k) { return f === 'all' || k.getAttribute('data-tags').split(' ').indexOf(f) > -1; });
          gsap.to(cards, {
            opacity: 0, y: 30, duration: .35, onComplete: function () {
              cards.forEach(function (k) { k.classList.toggle('hide', keep.indexOf(k) < 0); });
              gsap.fromTo(keep, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .8, stagger: .1, ease: 'expo.out', onComplete: function () { ScrollTrigger.refresh(); } });
            }
          });
        });
      });
    }

    /* ================= CRAFTSMANSHIP ================= */
    if (page === 'craft') {
      var pr = $('#process');
      if (pr) {
        var nums = $$('.pr-num span', pr), txts = $$('.pr-txt > div', pr), imgs = $$('.pr-right img', pr), lis = $$('.pr-list i', pr);
        var n = txts.length, cur = -1;
        function show(i) {
          if (i === cur) return;
          if (cur >= 0) {
            gsap.to([nums[cur], txts[cur]], { opacity: 0, y: -30, duration: .45, ease: 'power2.in', overwrite: true });
            gsap.to(imgs[cur], { opacity: 0, scale: 1.05, duration: .9, ease: 'power2.inOut', overwrite: true });
          }
          gsap.fromTo([nums[i], txts[i]], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, delay: .3, ease: 'expo.out', overwrite: true });
          gsap.fromTo(imgs[i], { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.04, duration: 1.6, ease: 'expo.out', overwrite: true });
          lis.forEach(function (l, k) { l.classList.toggle('on', k === i); });
          cur = i;
        }
        show(0);
        ScrollTrigger.create({
          trigger: pr, start: 'top top', end: '+=' + (n * 100) + '%', pin: true, anticipatePin: 1, refreshPriority: V.pinPriority(pr),
          onUpdate: function (s) { show(Math.min(n - 1, Math.floor(s.progress * n))); }
        });
      }
    }

    /* ================= CONTACT ================= */
    if (page === 'contact') {
      $$('.faq-item').forEach(function (it) {
        var a = $('.faq-a', it);
        $('.faq-q', it).addEventListener('click', function () {
          var open = it.classList.contains('open');
          $$('.faq-item.open').forEach(function (o) {
            o.classList.remove('open');
            gsap.to($('.faq-a', o), { height: 0, duration: .6, ease: 'expo.inOut' });
          });
          if (!open) {
            it.classList.add('open');
            gsap.to(a, { height: 'auto', duration: .7, ease: 'expo.out', onComplete: function () { ScrollTrigger.refresh(); } });
          } else { setTimeout(function () { ScrollTrigger.refresh(); }, 650); }
        });
      });
    }

    /* forms (demo — wire to your backend / form service) */
    $$('form.form').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = $('.form-msg', f);
        if (msg) { msg.style.display = 'block'; msg.textContent = 'Thank you — your message has been received. We will reply within two working days.'; }
        f.reset();
      });
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
})();
