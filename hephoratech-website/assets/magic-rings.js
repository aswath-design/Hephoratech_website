/* ═══════════════════════════════════════════════════════════════════════
   Magic Rings hero background — vanilla WebGL, zero dependencies.

   Shader ported from React Bits (MIT) by David Haz — https://reactbits.dev
   The original is a React component driven by three.js. The fragment shader
   is the whole visual; this replaces three.js with ~40 lines of raw WebGL so
   it runs in a static site with no React and no 600 KB 3D library.

   Guards, because a full-screen shader is real GPU work:
     · never starts under prefers-reduced-motion
     · never starts below 760px (phones keep the static background)
     · pauses when the hero leaves the viewport or the tab is hidden
     · device pixel ratio capped at 1.5
     · silently does nothing if WebGL is unavailable
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'void main(){ gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    '',
    'uniform float uTime, uAttenuation, uLineThickness;',
    'uniform float uBaseRadius, uRadiusStep, uScaleRate;',
    'uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;',
    'uniform float uFadeIn, uFadeOut;',
    'uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;',
    'uniform vec2 uResolution, uMouse;',
    'uniform vec3 uColor, uColorTwo;',
    'uniform int uRingCount;',
    '',
    'const float HP = 1.5707963;',
    'const float CYCLE = 3.45;',
    '',
    'float fade(float t) {',
    '  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);',
    '}',
    '',
    'float ring(vec2 p, float ri, float cut, float t0, float px) {',
    '  float t = mod(uTime + t0, CYCLE);',
    '  float r = ri + t / CYCLE * uScaleRate;',
    '  float d = abs(length(p) - r);',
    '  float a = atan(abs(p.y), abs(p.x)) / HP;',
    '  float th = max(1.0 - a, 0.5) * px * uLineThickness;',
    '  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;',
    '  d += pow(cut * a, 3.0) * r;',
    '  return h * exp(-uAttenuation * d) * fade(t);',
    '}',
    '',
    'void main() {',
    '  float px = 1.0 / min(uResolution.x, uResolution.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;',
    '  float cr = cos(uRotation), sr = sin(uRotation);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p -= uMouse * uMouseInfluence;',
    '  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;',
    '  p /= sc;',
    '  vec3 c = vec3(0.0);',
    '  float rcf = max(float(uRingCount) - 1.0, 1.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    if (i >= uRingCount) break;',
    '    float fi = float(i);',
    '    vec2 pr = p - fi * uParallax * uMouse;',
    '    vec3 rc = mix(uColor, uColorTwo, fi / rcf);',
    '    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));',
    '  }',
    '  c *= 1.0 + uBurst * 2.0;',
    '  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (n - 0.5) * uNoiseAmount;',
    '  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);',
    '}'
  ].join('\n');

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  window.HephoraMagicRings = function (host, o) {
    o = o || {};
    if (!host) return null;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    if (innerWidth < 760) return null;

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false })
          || canvas.getContext('experimental-webgl', { alpha: true, antialias: true, depth: false });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uTime','uAttenuation','uLineThickness','uBaseRadius','uRadiusStep','uScaleRate',
     'uOpacity','uNoiseAmount','uRotation','uRingGap','uFadeIn','uFadeOut',
     'uMouseInfluence','uHoverAmount','uHoverScale','uParallax','uBurst',
     'uResolution','uMouse','uColor','uColorTwo','uRingCount'
    ].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var p = {
      color: o.color || '#1E5FFF',
      colorTwo: o.colorTwo || '#8FB4FF',
      speed: o.speed == null ? 1 : o.speed,
      ringCount: o.ringCount == null ? 6 : o.ringCount,
      attenuation: o.attenuation == null ? 10 : o.attenuation,
      lineThickness: o.lineThickness == null ? 2 : o.lineThickness,
      baseRadius: o.baseRadius == null ? 0.35 : o.baseRadius,
      radiusStep: o.radiusStep == null ? 0.1 : o.radiusStep,
      scaleRate: o.scaleRate == null ? 0.1 : o.scaleRate,
      opacity: o.opacity == null ? 1 : o.opacity,
      noiseAmount: o.noiseAmount == null ? 0.1 : o.noiseAmount,
      rotation: o.rotation == null ? 0 : o.rotation,
      ringGap: o.ringGap == null ? 1.5 : o.ringGap,
      fadeIn: o.fadeIn == null ? 0.7 : o.fadeIn,
      fadeOut: o.fadeOut == null ? 0.5 : o.fadeOut,
      followMouse: !!o.followMouse,
      mouseInfluence: o.mouseInfluence == null ? 0.2 : o.mouseInfluence,
      hoverScale: o.hoverScale == null ? 1.2 : o.hoverScale,
      parallax: o.parallax == null ? 0.05 : o.parallax
    };

    // static uniforms
    var c1 = hexToRgb(p.color), c2 = hexToRgb(p.colorTwo);
    gl.uniform3f(U.uColor, c1[0], c1[1], c1[2]);
    gl.uniform3f(U.uColorTwo, c2[0], c2[1], c2[2]);
    gl.uniform1i(U.uRingCount, p.ringCount);
    gl.uniform1f(U.uAttenuation, p.attenuation);
    gl.uniform1f(U.uLineThickness, p.lineThickness);
    gl.uniform1f(U.uBaseRadius, p.baseRadius);
    gl.uniform1f(U.uRadiusStep, p.radiusStep);
    gl.uniform1f(U.uScaleRate, p.scaleRate);
    gl.uniform1f(U.uOpacity, p.opacity);
    gl.uniform1f(U.uNoiseAmount, p.noiseAmount);
    gl.uniform1f(U.uRotation, p.rotation * Math.PI / 180);
    gl.uniform1f(U.uRingGap, p.ringGap);
    gl.uniform1f(U.uFadeIn, p.fadeIn);
    gl.uniform1f(U.uFadeOut, p.fadeOut);
    gl.uniform1f(U.uHoverScale, p.hoverScale);
    gl.uniform1f(U.uParallax, p.parallax);
    gl.uniform1f(U.uBurst, 0);
    gl.uniform1f(U.uMouseInfluence, p.followMouse ? p.mouseInfluence : 0);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Take the canvas out of flow from JS, not just from CSS. It is sized from
    // the host's measured height, so if the host were ever in normal flow the
    // canvas would size the host, which would resize the canvas, forever — the
    // page grows without bound. Positioning it here means that can't happen
    // even if the stylesheet is missing or overridden.
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    var DPR = Math.min(devicePixelRatio || 1, 1.5);
    var lastW = 0, lastH = 0;
    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      // a hero background never needs to exceed the viewport
      w = Math.min(w, innerWidth); h = Math.min(h, innerHeight);
      if (w === lastW && h === lastH) return;     // no-op guard for the observer
      lastW = w; lastH = h;
      canvas.width = w * DPR; canvas.height = h * DPR;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uResolution, canvas.width, canvas.height);
    }
    addEventListener('resize', resize, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    host.appendChild(canvas);
    resize();

    // pointer state — uniform writes only, no layout work
    var mx = 0, my = 0, sx = 0, sy = 0, hov = 0, hovering = false;
    if (p.followMouse) {
      host.addEventListener('mousemove', function (e) {
        var r = host.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = -((e.clientY - r.top) / r.height - 0.5);
      }, { passive: true });
      host.addEventListener('mouseenter', function () { hovering = true; }, { passive: true });
      host.addEventListener('mouseleave', function () { hovering = false; mx = 0; my = 0; }, { passive: true });
    }

    var raf = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
      hov += ((hovering ? 1 : 0) - hov) * 0.08;
      gl.uniform1f(U.uTime, t * 0.001 * p.speed);
      gl.uniform2f(U.uMouse, sx, sy);
      gl.uniform1f(U.uHoverAmount, hov);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    var api = {
      play: function () { if (!raf) raf = requestAnimationFrame(frame); },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    };

    var visible = false;
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      visible && !document.hidden ? api.play() : api.pause();
    }, { threshold: 0 }).observe(host);
    addEventListener('visibilitychange', function () {
      document.hidden ? api.pause() : (visible && api.play());
    });

    host.classList.add('ready');
    return api;
  };
})();
