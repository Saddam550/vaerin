/* =========================================================
   VÆRIN — core: smooth scroll, preloader, nav, cursor,
   scroll reveals, page transitions, video scrubbing
   Requires: GSAP, ScrollTrigger, smooth-scrollbar
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var V = (window.VAERIN = window.VAERIN || {});
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover:none)').matches;
  var readyCbs = [];
  var isReady = false;
  V.onReady = function (fn) { isReady ? fn() : readyCbs.push(fn); };

  if (!window.gsap || !window.ScrollTrigger) { document.body.classList.remove('is-loading'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scrollbar + ScrollTrigger proxy ---------- */
  var viewport = $('#viewport');
  var scrollbar = null;
  if (window.Scrollbar && viewport && !reduce) {
    scrollbar = Scrollbar.init(viewport, { damping: 0.085, delegateTo: document, alwaysShowTracks: false });
    ScrollTrigger.scrollerProxy(viewport, {
      scrollTop: function (v) {
        if (arguments.length) { scrollbar.scrollTop = v; }
        return scrollbar.scrollTop;
      },
      getBoundingClientRect: function () {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: 'transform'
    });
    scrollbar.addListener(ScrollTrigger.update);
    ScrollTrigger.defaults({ scroller: viewport });
  } else {
    document.documentElement.classList.add('no-smooth');
  }
  V.scrollbar = scrollbar;
  V.scroller = scrollbar ? viewport : window;
  V.scrollY = function () { return scrollbar ? scrollbar.scrollTop : window.pageYOffset; };
  V.scrollTo = function (y, d) {
    if (scrollbar) scrollbar.scrollTo(0, y, d == null ? 1200 : d);
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  V.onScroll = function (cb) {
    if (scrollbar) scrollbar.addListener(function (s) { cb(s.offset.y, s); });
    else window.addEventListener('scroll', function () { cb(window.pageYOffset); }, { passive: true });
  };
  V.maxScroll = function () {
    return scrollbar ? scrollbar.limit.y : (document.documentElement.scrollHeight - window.innerHeight);
  };

  /* pinned sections must refresh top-to-bottom, regardless of creation order */
  V.pinPriority = function (el) {
    var all = $$('.stage, .hscroll, .process, .scrub');
    return 20 - all.indexOf(el);
  };

  /* ---------- word splitting ---------- */
  V.splitWords = function (el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = t;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') { walk(ch); }
      });
    })(el);
    return $$('.wi', el);
  };

  /* ---------- preloader ---------- */
  var pre = $('.preloader');
  var firstVisit = !sessionStorage.getItem('vaerin-seen');
  function runPreloader() {
    if (!pre) { start(); return; }
    var bar = $('.pl-bar span', pre), num = $('.pl-num', pre), logo = $('.pl-logo', pre);
    var counter = { v: 0 };
    var dur = firstVisit ? 1.7 : 0.55;
    var tl = gsap.timeline({ onComplete: start });
    tl.from(logo, { y: 30, opacity: 0, duration: .7, ease: 'power3.out' }, 0)
      .to(bar, { scaleX: 1, duration: dur, ease: 'power2.inOut' }, 0)
      .to(counter, { v: 100, duration: dur, ease: 'power2.inOut', onUpdate: function () { if (num) num.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0)
      .to(pre, { yPercent: -100, duration: .95, ease: 'expo.inOut' }, '+=.15');
    sessionStorage.setItem('vaerin-seen', '1');
  }
  function start() {
    if (pre) pre.style.display = 'none';
    document.body.classList.remove('is-loading');
    isReady = true;
    initAll();
    readyCbs.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    readyCbs.length = 0;
    document.dispatchEvent(new CustomEvent('vaerin:ready'));
    setTimeout(function () { ScrollTrigger.refresh(); }, 400);
  }

  /* ---------- init everything ---------- */
  function initAll() {
    initNav();
    initCursor();
    initTransitions();
    initReveals();
    initMarquee();
    initMagnetic();
    initTilt();
    initCounters();
    initScrubVideos();
    initTimelines();
    initLazyVideos();
    initAnchors();
  }

  /* nav */
  function initNav() {
    var nav = $('.nav'), prog = $('.progress');
    var page = document.body.getAttribute('data-nav') || document.body.getAttribute('data-page');
    $$('.nav-links a, .mobile-menu a[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === page) a.classList.add('active');
    });
    var last = 0;
    V.onScroll(function (y) {
      if (nav) {
        nav.classList.toggle('scrolled', y > 40);
        nav.classList.toggle('hide', y > last && y > 400 && !document.body.classList.contains('menu-open'));
      }
      last = y;
      if (prog) { var m = V.maxScroll(); prog.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, y / m) : 0) + ')'; }
    });
    var burger = $('.burger');
    if (burger) {
      burger.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
      $$('.mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); }); });
    }
    var mm = $$('.mobile-menu a.m-link');
    if (mm.length) {
      new MutationObserver(function () {
        if (document.body.classList.contains('menu-open')) {
          gsap.fromTo(mm, { yPercent: 100 }, { yPercent: 0, stagger: .07, duration: .9, ease: 'expo.out', delay: .25 });
        }
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* cursor */
  function initCursor() {
    var c = $('.cursor'), d = $('.cursor-dot');
    if (!c || isTouch) return;
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; d.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; });
    gsap.ticker.add(function () {
      cx += (mx - cx) * .16; cy += (my - cy) * .16;
      c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    });
    document.addEventListener('mouseover', function (e) {
      c.classList.toggle('is-hover', !!e.target.closest('a,button,.card,[data-cursor],.chip,.faq-q'));
    });
  }

  /* page transitions */
  function initTransitions() {
    var curtain = $('.page-curtain');
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && curtain) { gsap.set(curtain, { yPercent: 100 }); }
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || !curtain) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/.test(href)) return;
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin && location.protocol !== 'file:') return;
      if (url.pathname === location.pathname && url.search === location.search) { e.preventDefault(); return; }
      e.preventDefault();
      document.body.classList.remove('menu-open');
      gsap.set(curtain, { yPercent: 100 });
      gsap.to(curtain, { yPercent: 0, duration: .75, ease: 'expo.inOut', onComplete: function () { location.href = a.href; } });
    });
  }

  /* reveals */
  function initReveals() {
    $$('[data-split]').forEach(function (el) {
      var mode = el.getAttribute('data-split');
      var words = V.splitWords(el);
      if (mode === 'fill') {
        el.classList.add('fill');
        gsap.to(words, {
          opacity: 1, ease: 'none', stagger: .1,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
        });
      } else if (mode === 'load') {
        gsap.from(words, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: .06, delay: .1 });
      } else {
        gsap.from(words, {
          yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: .05,
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
      }
    });

    $$('[data-reveal]').forEach(function (el) {
      var delay = parseFloat(el.getAttribute('data-delay') || 0);
      var isLoad = el.hasAttribute('data-load');
      var cfg = { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: delay };
      if (!isLoad) cfg.scrollTrigger = { trigger: el, start: 'top 90%' };
      else cfg.delay = delay + .4;
      gsap.to(el, cfg);
    });

    // staggered groups
    $$('[data-stagger]').forEach(function (g) {
      var kids = $$(g.getAttribute('data-stagger') || ':scope > *', g);
      gsap.set(kids, { opacity: 0, y: 50 });
      gsap.to(kids, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: g, start: 'top 85%' } });
    });

    // image frame parallax
    $$('.img-frame img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.s-img img, .sc-img img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.ph-bg, .cta-bg').forEach(function (bg) {
      var host = bg.parentElement;
      var isCta = bg.classList.contains('cta-bg');
      gsap.fromTo(bg, { yPercent: isCta ? -6 : 0 }, { yPercent: isCta ? 6 : 8, ease: 'none', scrollTrigger: { trigger: host, start: isCta ? 'top bottom' : 'top top', end: isCta ? 'bottom top' : 'bottom top', scrub: true } });
    });

    // mask reveal images
    $$('.mask-img').forEach(function (el) {
      gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // ghost text drift
    $$('[data-drift]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-drift'));
      gsap.fromTo(el, { xPercent: -amt }, { xPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* marquee */
  function initMarquee() {
    $$('.marquee').forEach(function (m) {
      var track = $('.marquee-track', m);
      track.innerHTML += track.innerHTML;
      var tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 });
      V.onScroll(function (y, s) {
        var v = s && s.delta ? Math.abs(s.delta.y) : 0;
        gsap.to(tween, { timeScale: 1 + Math.min(v * .35, 7), duration: .3, overwrite: true });
        gsap.to(tween, { timeScale: 1, duration: 1.2, delay: .3 });
      });
    });
  }

  /* magnetic buttons */
  function initMagnetic() {
    if (isTouch) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () { gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }); });
    });
  }

  /* card tilt */
  function initTilt() {
    if (isTouch) return;
    $$('[data-tilt]').forEach(function (el) {
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotationY: px * 8, rotationX: -py * 8, duration: .6, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () { gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1,.5)' }); });
    });
  }

  /* counters */
  function initCounters() {
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var o = { v: 0 };
      var node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : el.insertBefore(document.createTextNode('0'), el.firstChild);
      gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: function () { node.nodeValue = Math.round(o.v); } });
    });
  }

  /* scroll-scrubbed video (exploded movement) */
  function initScrubVideos() {
    $$('.scrub').forEach(function (sec) {
      var vid = $('video', sec);
      if (!vid) return;
      var caps = $$('.scrub-cap > div', sec);
      var meter = $('.scrub-meter span', sec);
      var target = 0, cur = 0, shown = -1, lastT = -1;
      vid.pause(); vid.muted = true;
      var endLen = sec.getAttribute('data-end') || '+=320%';
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: endLen, pin: true, scrub: true, anticipatePin: 1, refreshPriority: V.pinPriority(sec),
        onUpdate: function (self) {
          target = self.progress;
          if (meter) meter.style.transform = 'scaleY(' + self.progress + ')';
          var idx = Math.min(caps.length - 1, Math.floor(self.progress * caps.length));
          if (idx !== shown && caps.length) {
            if (shown >= 0) gsap.to(caps[shown], { opacity: 0, y: -24, duration: .5, ease: 'power2.in', overwrite: true });
            gsap.fromTo(caps[idx], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', delay: shown >= 0 ? .25 : 0, overwrite: true });
            shown = idx;
          }
        }
      });
      gsap.ticker.add(function () {
        cur += (target - cur) * .1;
        if (vid.readyState >= 1 && vid.duration) {
          var t = cur * (vid.duration - .04);
          if (Math.abs(t - lastT) > .012) { vid.currentTime = t; lastT = t; }
        }
      });
    });
  }

  /* timeline draw lines */
  function initTimelines() {
    $$('.timeline').forEach(function (tl) {
      var line = $('.tl-line', tl);
      if (line) gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 60%', end: 'bottom 70%', scrub: true } });
      $$('.tl-item', tl).forEach(function (it) {
        gsap.from(it, { opacity: 0, x: 40, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 82%' } });
      });
    });
  }

  /* play/pause looping videos with visibility */
  function initLazyVideos() {
    $$('video[data-lazy]').forEach(function (v) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
      }, { threshold: .1 });
      io.observe(v);
    });
  }

  /* anchors */
  function initAnchors() {
    $$('[data-scroll-to]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = $(a.getAttribute('data-scroll-to'));
        if (!t) return;
        if (scrollbar) scrollbar.scrollIntoView(t, { offsetTop: 0, alwaysScrollToTop: true });
        else t.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* newsletter demo */
  $$('.news').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = $('button', f); b.innerHTML = '<i class="fa-solid fa-check"></i>';
      $('input', f).value = ''; $('input', f).placeholder = 'Thank you — you are on the list.';
    });
  });

  /* kickoff */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('resize', function () { ScrollTrigger.refresh(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runPreloader);
  else runPreloader();
})();
