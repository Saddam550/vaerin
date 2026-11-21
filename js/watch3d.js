/* =========================================================
   VÆRIN — procedural 3D watch (Three.js r128)
   Built entirely from geometry + canvas textures, so it
   needs no external model. The hands show the real time.
   ========================================================= */
(function () {
  'use strict';
  var V = (window.VAERIN = window.VAERIN || {});
  var TAU = Math.PI * 2;

  /* ---------- canvas texture helpers ---------- */
  function mkCanvas(size) {
    var c = document.createElement('canvas'); c.width = c.height = size; return c;
  }
  function tex(canvas, renderer) {
    var t = new THREE.CanvasTexture(canvas);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  function drawDial(canvas) {
    var S = canvas.width, C = S / 2, g = canvas.getContext('2d');
    // base — charcoal with a soft radial falloff
    var bg = g.createRadialGradient(C, C * .85, S * .05, C, C, C);
    bg.addColorStop(0, '#34353b'); bg.addColorStop(.6, '#202126'); bg.addColorStop(1, '#131316');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    // sunburst brushing
    g.save(); g.translate(C, C);
    for (var i = 0; i < 520; i++) {
      var a = (i / 520) * TAU;
      g.strokeStyle = 'rgba(255,255,255,' + (0.012 + Math.random() * .03) + ')';
      g.lineWidth = 1 + Math.random() * 1.6;
      g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a) * C, Math.sin(a) * C); g.stroke();
    }
    g.restore();
    // inner ring line
    g.strokeStyle = 'rgba(217,189,143,.28)'; g.lineWidth = 2;
    g.beginPath(); g.arc(C, C, S * .455, 0, TAU); g.stroke();
    // minute ticks
    for (var m = 0; m < 60; m++) {
      var a2 = m / 60 * TAU - Math.PI / 2, r1 = S * .45, r2 = m % 5 === 0 ? S * .43 : S * .44;
      g.strokeStyle = 'rgba(236,230,220,' + (m % 5 === 0 ? .0 : .35) + ')'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(C + Math.cos(a2) * r1, C + Math.sin(a2) * r1); g.lineTo(C + Math.cos(a2) * r2, C + Math.sin(a2) * r2); g.stroke();
    }
    // hour batons (rose-gold, tapered)
    for (var h = 0; h < 12; h++) {
      if (h === 3) continue; // date window
      g.save(); g.translate(C, C); g.rotate(h / 12 * TAU);
      var len = h === 0 ? S * .075 : S * .065, w = h === 0 ? S * .02 : S * .015, y0 = -S * .35;
      var gr = g.createLinearGradient(-w, 0, w, 0);
      gr.addColorStop(0, '#b98259'); gr.addColorStop(.5, '#f0d1b2'); gr.addColorStop(1, '#b98259');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(-w, y0); g.lineTo(w, y0); g.lineTo(w * .75, y0 - len); g.lineTo(-w * .75, y0 - len); g.closePath(); g.fill();
      if (h === 0) { g.translate(w * 2.6, 0); g.fill(); g.translate(-w * 5.2, 0); g.fill(); }
      g.restore();
    }
    // date window at 3
    g.save(); g.translate(C, C); g.rotate(Math.PI / 2);
    g.fillStyle = '#0b0b0d'; g.strokeStyle = '#c9936b'; g.lineWidth = 3;
    g.fillRect(-S * .04, -S * .375, S * .08, S * .062); g.strokeRect(-S * .04, -S * .375, S * .08, S * .062);
    g.restore();
    var d = new Date().getDate();
    g.fillStyle = '#ece6dc'; g.font = '400 ' + S * .042 + 'px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(d), C + S * .344, C + 2);
    // wordmark
    g.fillStyle = '#ece6dc'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '500 ' + S * .066 + 'px "Cormorant Garamond", serif';
    if (g.letterSpacing !== undefined) g.letterSpacing = S * .012 + 'px';
    g.fillText('VÆRIN', C, C - S * .21);
    g.font = '400 ' + S * .022 + 'px Jost, sans-serif';
    if (g.letterSpacing !== undefined) g.letterSpacing = S * .01 + 'px';
    g.fillStyle = 'rgba(236,230,220,.6)';
    g.fillText('VANTAGE', C, C - S * .165);
    g.fillStyle = '#e3b896'; g.font = '500 ' + S * .03 + 'px Jost, sans-serif';
    g.fillText('GMT', C, C + S * .2);
    g.fillStyle = 'rgba(236,230,220,.55)'; g.font = '400 ' + S * .02 + 'px Jost, sans-serif';
    g.fillText('AUTOMATIC', C, C + S * .24);
    g.fillText('200M', C, C + S * .268);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  }

  function drawBezel(canvas) {
    var S = canvas.width, C = S / 2, g = canvas.getContext('2d');
    g.clearRect(0, 0, S, S);
    var rOut = C, rIn = C * (0.80 / 0.97);
    var gr = g.createRadialGradient(C, C, rIn, C, C, rOut);
    gr.addColorStop(0, '#d8c29a'); gr.addColorStop(.5, '#ead8b4'); gr.addColorStop(1, '#c9ae80');
    g.fillStyle = gr; g.beginPath(); g.arc(C, C, rOut, 0, TAU); g.arc(C, C, rIn, 0, TAU, true); g.fill('evenodd');
    var rm = (rOut + rIn) / 2;
    g.fillStyle = '#17171a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '500 ' + S * .052 + 'px Jost, sans-serif';
    for (var i = 0; i < 12; i++) {
      var hr = i * 2 === 0 ? 24 : i * 2; // 24 at top
      var a = i / 12 * TAU - Math.PI / 2;
      var x = C + Math.cos(a) * rm, y = C + Math.sin(a) * rm;
      if (i % 2 === 1) { g.beginPath(); g.arc(x, y, S * .008, 0, TAU); g.fill(); continue; }
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillText(String(hr), 0, 0); g.restore();
    }
    // tiny hour dots between numerals
    for (var j = 0; j < 24; j++) {
      if (j % 2 === 0) continue;
      var a2 = j / 24 * TAU - Math.PI / 2;
      g.beginPath(); g.arc(C + Math.cos(a2) * rm, C + Math.sin(a2) * rm, S * .007, 0, TAU); g.fill();
    }
  }

  function drawStrap(canvas) {
    var W = canvas.width, H = canvas.height, g = canvas.getContext('2d');
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, H);
    // fine grain
    for (var i = 0; i < 9000; i++) {
      g.fillStyle = 'rgba(255,255,255,' + Math.random() * .045 + ')';
      g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    // perforations
    g.fillStyle = '#050506';
    for (var y = 40; y < H; y += 48) for (var x = 120; x < W - 100; x += 48) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
    // edge stitches
    g.strokeStyle = '#8a6045'; g.lineWidth = 4; g.setLineDash([16, 12]);
    [34, W - 34].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); });
    g.setLineDash([]);
  }

  function drawCrownCap(canvas) {
    var S = canvas.width, C = S / 2, g = canvas.getContext('2d');
    g.fillStyle = '#1b1b1e'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#d9bd8f'; g.lineWidth = S * .05; g.lineJoin = 'miter';
    g.beginPath(); g.moveTo(C - S * .22, C - S * .2); g.lineTo(C, C + S * .22); g.lineTo(C + S * .22, C - S * .2); g.stroke();
  }

  /* ---------- geometry helpers ---------- */
  function roundedShape(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function flutedCylinder(radius, height, segs, depth, openEnded) {
    var geo = new THREE.CylinderGeometry(radius, radius, height, segs, 1, openEnded);
    var p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var idx = i % (segs + 1);
      if (i < (segs + 1) * 2) { // side vertices only
        var k = idx % 2 ? 1 : 1 - depth;
        p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }

  function handShape(len, w, tail, tip) {
    var s = new THREE.Shape();
    s.moveTo(-w / 2, -tail); s.lineTo(w / 2, -tail); s.lineTo(w / 2, len - tip);
    s.lineTo(0, len); s.lineTo(-w / 2, len - tip); s.closePath();
    return s;
  }

  /* ---------- main factory ---------- */
  V.createWatchScene = function (canvas) {
    if (!window.THREE || !canvas) return null;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 4, 24);
    camera.position.set(0, 0, 9);

    /* environment — a tiny studio with soft boxes, baked to a PMREM */
    var envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: 0x0b0b0e, side: THREE.BackSide })));
    function panel(w, h, pos, col, k) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); envScene.add(m);
    }
    panel(10, 3, [0, 9, 4], 0xffffff, 7);
    panel(3, 10, [-9, 1, 3], 0xffe0c0, 5);
    panel(3, 10, [9, 0, 2], 0xbfd2ff, 3);
    panel(12, 2, [0, -7, 6], 0xffffff, 1.4);
    panel(6, 6, [0, 0, 11], 0xffffff, 1.1);
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.03).texture;

    scene.add(new THREE.AmbientLight(0xffffff, .15));
    var key = new THREE.DirectionalLight(0xffd7b8, 1.6); key.position.set(-4, 5, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0x9db6ff, 1.1); rim.position.set(6, 1, -4); scene.add(rim);

    /* materials */
    var steel = new THREE.MeshStandardMaterial({ color: 0x101012, metalness: .9, roughness: .38, envMapIntensity: .55 });
    var steelBrushed = new THREE.MeshStandardMaterial({ color: 0x15151a, metalness: .9, roughness: .5, envMapIntensity: .5 });
    var roseMat = new THREE.MeshStandardMaterial({ color: 0xd9a37b, metalness: 1, roughness: .26, envMapIntensity: .8 });
    var handMat = new THREE.MeshStandardMaterial({ color: 0xf0d3b5, metalness: 1, roughness: .2, side: THREE.DoubleSide });
    var secMat = new THREE.MeshStandardMaterial({ color: 0xd9a37b, metalness: 1, roughness: .25, side: THREE.DoubleSide });
    var gmtMat = new THREE.MeshStandardMaterial({ color: 0xf2e4c4, metalness: .6, roughness: .3, side: THREE.DoubleSide });

    var dialCanvas = mkCanvas(1024), bezelCanvas = mkCanvas(1024), strapCanvas = mkCanvas(512), capCanvas = mkCanvas(128);
    function redrawTextures() {
      drawDial(dialCanvas); drawBezel(bezelCanvas); drawStrap(strapCanvas); drawCrownCap(capCanvas);
      [dialMat.map, bezelMat.map, strapMat.map, capMat.map].forEach(function (t) { if (t) t.needsUpdate = true; });
    }
    var dialTex = tex(dialCanvas, renderer), bezelTex = tex(bezelCanvas, renderer), strapTex = tex(strapCanvas, renderer), capTex = tex(capCanvas, renderer);
    var dialMat = new THREE.MeshStandardMaterial({ map: dialTex, metalness: .15, roughness: .7, envMapIntensity: .35 });
    var bezelMat = new THREE.MeshStandardMaterial({ map: bezelTex, metalness: .3, roughness: .5, envMapIntensity: .5, transparent: true });
    var strapMat = new THREE.MeshStandardMaterial({ map: strapTex, roughness: .85, metalness: 0, vertexColors: true, envMapIntensity: .5 });
    var capMat = new THREE.MeshStandardMaterial({ map: capTex, metalness: .9, roughness: .4 });
    redrawTextures();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawTextures);

    /* build the watch (axis of the dial = +Z) */
    var pivot = new THREE.Group();   // driven by GSAP scroll
    var tilt = new THREE.Group();    // driven by mouse
    var watch = new THREE.Group();
    pivot.add(tilt); tilt.add(watch); scene.add(pivot);

    // case
    var body = new THREE.Mesh(new THREE.CylinderGeometry(.98, .98, .36, 96).rotateX(Math.PI / 2), steel);
    watch.add(body);
    // rose-gold mid ring
    var midRing = new THREE.Mesh(new THREE.TorusGeometry(.985, .018, 16, 128), roseMat); watch.add(midRing);
    // fluted bezel wall
    var bez = new THREE.Mesh(flutedCylinder(1.04, .15, 180, .014, true).rotateX(Math.PI / 2), steel);
    bez.position.z = .245; watch.add(bez);
    // bezel top (dark ring) + gmt insert
    var topRing = new THREE.Mesh(new THREE.RingGeometry(.955, 1.04, 128), steelBrushed); topRing.position.z = .321; watch.add(topRing);
    var gmtRing = new THREE.Mesh(new THREE.RingGeometry(.80, .97, 128), bezelMat); gmtRing.position.z = .323; watch.add(gmtRing);
    // inner wall
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .14, 96, 1, true).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: .9, roughness: .4, side: THREE.DoubleSide }));
    wall.position.z = .25; watch.add(wall);
    // dial
    var dial = new THREE.Mesh(new THREE.CircleGeometry(.8, 128), dialMat); dial.position.z = .2; watch.add(dial);
    // crystal
    var crystal = new THREE.Mesh(new THREE.CircleGeometry(.805, 96), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: .05, transparent: true, opacity: .05, envMapIntensity: .3, depthWrite: false }));
    crystal.position.z = .3; watch.add(crystal);

    // hands
    function hand(shape, mat, z) {
      var m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat); m.position.z = z; return m;
    }
    var hourH = new THREE.Group(), minH = new THREE.Group(), gmtH = new THREE.Group(), secH = new THREE.Group();
    hourH.add(hand(handShape(.43, .085, .07, .12), handMat, 0));
    minH.add(hand(handShape(.66, .06, .09, .14), handMat, .014));
    var gmtShape = handShape(.58, .012, .12, .001);
    gmtH.add(hand(gmtShape, gmtMat, .028));
    var tri = new THREE.Shape(); tri.moveTo(0, .6); tri.lineTo(.045, .5); tri.lineTo(-.045, .5); tri.closePath();
    var triMesh = hand(tri, gmtMat, .029); gmtH.add(triMesh);
    secH.add(hand(handShape(.7, .01, .18, .001), secMat, .042));
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .05, 24).rotateX(Math.PI / 2), roseMat); cap.position.z = .05; secH.add(cap);
    [hourH, minH, gmtH, secH].forEach(function (h) { h.position.z = .22; watch.add(h); });

    // lugs
    var lugGeo = new THREE.ExtrudeGeometry(roundedShape(.34, .55, .06), { depth: .26, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3 });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (s) {
      var l = new THREE.Mesh(lugGeo, steel);
      l.position.set(s[0] * .52, s[1] * .95, -.15);
      l.rotation.x = s[1] * -.12;
      watch.add(l);
    });

    // crown + guard
    var crown = new THREE.Mesh(flutedCylinder(.115, .2, 28, .09, false).rotateZ(Math.PI / 2), steel);
    crown.position.set(1.1, 0, 0); watch.add(crown);
    var crownCap = new THREE.Mesh(new THREE.CircleGeometry(.1, 32), capMat);
    crownCap.rotation.y = Math.PI / 2; crownCap.position.set(1.202, 0, 0); watch.add(crownCap);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .14, 16).rotateZ(Math.PI / 2), roseMat); stem.position.set(1.0, 0, 0); watch.add(stem);
    var guard = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedShape(.2, .5, .04), { depth: .16, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 2 }).rotateY(Math.PI / 2), steel);
    guard.position.set(1.0, 0, -.08); watch.add(guard);

    // strap (curved + faded at the ends)
    function strapPiece(dir) {
      var g = new THREE.BoxGeometry(.74, 1.9, .1, 1, 60, 1);
      var p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (var i = 0; i < p.count; i++) {
        var y = p.getY(i) + dir * 1.95;       // global y
        var d = Math.max(0, Math.abs(y) - 1.05);
        p.setZ(i, p.getZ(i) - .16 * d * d);
        p.setY(i, p.getY(i));
        var k = Math.max(0, 1 - d / 1.2); k = k * k;
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      var m = new THREE.Mesh(g, strapMat); m.position.set(0, dir * 1.95, -.02); return m;
    }
    watch.add(strapPiece(1)); watch.add(strapPiece(-1));

    /* sizing */
    function resize() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      var a = w / h; camera.aspect = a;
      var need = 3.9 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * a);
      camera.position.z = Math.max(9, need);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* mouse tilt */
    var mx = 0, my = 0;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5;
    });

    /* live time */
    function setHands() {
      var d = new Date();
      var s = d.getSeconds() + d.getMilliseconds() / 1000;
      var m = d.getMinutes() + s / 60;
      var h = (d.getHours() % 12) + m / 60;
      var u = d.getUTCHours() + d.getUTCMinutes() / 60;
      hourH.rotation.z = -h / 12 * TAU;
      minH.rotation.z = -m / 60 * TAU;
      secH.rotation.z = -s / 60 * TAU;
      gmtH.rotation.z = -u / 24 * TAU;
    }

    var active = true, running = false;
    function frame(t) {
      requestAnimationFrame(frame);
      if (!active) return;
      setHands();
      tilt.rotation.y += (mx * .5 - tilt.rotation.y) * .06;
      tilt.rotation.x += (my * .35 - tilt.rotation.x) * .06;
      watch.position.y = Math.sin(t * .0009) * .04;
      key.position.x = -4 + Math.sin(t * .0004) * 1.2;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { active = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }

    return {
      renderer: renderer, camera: camera, pivot: pivot, tilt: tilt, watch: watch,
      setActive: function (v) { active = v; }
    };
  };
})();
