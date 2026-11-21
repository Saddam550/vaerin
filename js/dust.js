/* VÆRIN — floating gold dust (Three.js points) */
(function () {
  'use strict';
  var V = (window.VAERIN = window.VAERIN || {});

  V.createDust = function (canvas, opts) {
    if (!window.THREE || !canvas) return null;
    opts = opts || {};
    var count = opts.count || (window.innerWidth < 700 ? 140 : 380);
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 50);
    camera.position.z = 6;

    // soft round sprite
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,230,200,1)');
    grad.addColorStop(.35, 'rgba(255,214,170,.55)');
    grad.addColorStop(1, 'rgba(255,200,150,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);

    var pos = new Float32Array(count * 3), spd = new Float32Array(count), sizes = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - .5) * 14;
      pos[i * 3 + 1] = (Math.random() - .5) * 9;
      pos[i * 3 + 2] = (Math.random() - .5) * 8;
      spd[i] = .08 + Math.random() * .22;
      sizes[i] = Math.random();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      size: opts.size || .09, map: tex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: opts.opacity || .75, color: opts.color || 0xe3b896
    });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);

    var mx = 0, my = 0, active = true, t0 = performance.now();
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - .5);
      my = (e.clientY / window.innerHeight - .5);
    });

    function resize() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      requestAnimationFrame(frame);
      if (!active) return;
      var t = (performance.now() - t0) / 1000;
      var p = geo.attributes.position.array;
      for (var i = 0; i < count; i++) {
        p[i * 3 + 1] += spd[i] * .006;
        p[i * 3] += Math.sin(t * .3 + i) * .0007;
        if (p[i * 3 + 1] > 4.6) p[i * 3 + 1] = -4.6;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.y += (mx * .25 - pts.rotation.y) * .03;
      pts.rotation.x += (my * .15 - pts.rotation.x) * .03;
      renderer.render(scene, camera);
    }
    frame();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { active = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }
    return { renderer: renderer };
  };

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('canvas.dust'), function (c) { V.createDust(c); });
  });
})();
