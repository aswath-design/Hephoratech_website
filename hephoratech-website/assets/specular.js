/*
 * HephoraTech — specular button edge highlight
 *
 * A vanilla-WebGL port of the React Bits <SpecularButton>. One shared canvas
 * and one render loop drive EVERY opted-in button, instead of the original's
 * one-WebGL-context-per-button — which would hit the browser's ~16-context cap
 * and revive the lag this site spent a session removing.
 *
 * Opt a button in with `data-specular`. It fades in as the cursor approaches
 * and the loop skips rendering whenever no button is lit, so idle cost is zero.
 * Respects prefers-reduced-motion (never starts) and pauses on tab-hide.
 *
 * Colours follow the theme: on dark, a white rim; on light, the brand blue,
 * because a white rim is invisible on a light ground.
 */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PAD = 20; // px the glow may bleed past the button edge

  const VERT =
    'attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}';

  const FRAG = [
    'precision highp float;',
    'uniform vec2 uCenter;uniform vec2 uHalfSize;uniform float uRadius;',
    'uniform float uAngle;uniform float uPx;uniform vec3 uLineColor;',
    'uniform vec3 uBaseColor;uniform float uIntensity;uniform float uShineSize;',
    'uniform float uShineFade;uniform float uThickness;uniform float uBaseWidth;',
    'float sdRoundedRect(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}',
    'float gaussianLine(float d,float sigma){float x=d/(sigma+1e-6);float k=mix(1.0,1.6,smoothstep(0.0,1.5,x));return exp(-k*x*x);}',
    'void main(){',
    '  vec2 p=gl_FragCoord.xy-uCenter;',
    '  float d=sdRoundedRect(p,uHalfSize,uRadius);',
    '  vec2 L=vec2(cos(uAngle),sin(uAngle));',
    '  float base=(1.0-smoothstep(0.0,uBaseWidth,abs(d)))*0.45;',
    '  vec2 nEll=normalize(p/(uHalfSize*uHalfSize)+1e-6);',
    '  float phi=acos(clamp(abs(dot(nEll,L)),0.0,1.0));',
    '  float rim=1.0-smoothstep(uShineSize-uShineFade,uShineSize+uShineFade+1e-4,phi);',
    '  float line=gaussianLine(d,uThickness);',
    '  float edgeClamp=1.0-smoothstep(0.5*uPx,3.0*uPx,abs(d));',
    '  float hi=line*rim*edgeClamp*uIntensity;',
    '  vec3 col=uBaseColor*base+uLineColor*hi;',
    '  float a=clamp(base+hi,0.0,1.0);',
    '  gl_FragColor=vec4(col*a,a);',
    '}'
  ].join('\n');

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function themeColors() {
    const root = document.documentElement;
    const light =
      root.getAttribute('data-theme') === 'light' ||
      (root.getAttribute('data-theme') !== 'dark' &&
        matchMedia('(prefers-color-scheme: light)').matches);
    // brand blue reads on a light ground; a warm white reads on the dark one
    return light
      ? { line: hexToRgb('#1450E6'), base: hexToRgb('#7f93b8') }
      : { line: hexToRgb('#dbe7ff'), base: hexToRgb('#3a4763') };
  }

  function init() {
    const buttons = [...document.querySelectorAll('[data-specular]')];
    if (!buttons.length) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:120';
    document.body.appendChild(canvas);

    const gl =
      canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true }) ||
      canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.remove(); return; }

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uCenter', 'uHalfSize', 'uRadius', 'uAngle', 'uPx', 'uLineColor', 'uBaseColor',
     'uIntensity', 'uShineSize', 'uShineFade', 'uThickness', 'uBaseWidth']
      .forEach(n => (U[n] = gl.getUniformLocation(prog, n)));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.SCISSOR_TEST);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let vw = 0, vh = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = innerWidth; vh = innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    // per-button animation state
    const st = buttons.map(() => ({ angle: 2.4, idle: 2.4, bright: 0, aim: null, prox: 0 }));

    addEventListener('pointermove', e => {
      for (let i = 0; i < buttons.length; i++) {
        const r = buttons[i].getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const dist = Math.hypot(dx, dy);
        const prox = parseFloat(buttons[i].dataset.specularProximity) || 220;
        if (dist === 0) {
          const nx = (e.clientX - cx) / (r.width / 2);
          const ny = (cy - e.clientY) / (r.height / 2);
          st[i].aim = Math.atan2(2 / r.height, -2 / r.width) + nx * 0.3 + ny * 0.15;
        } else {
          st[i].aim = Math.atan2(cy - e.clientY, e.clientX - cx);
        }
        const t = Math.max(0, 1 - dist / Math.max(prox, 1));
        st[i].prox = t * t * (3 - 2 * t);
      }
    }, { passive: true });

    let raf = 0, last = performance.now();
    const SPEED = 0.35, RADIUS = 100, THICK = 1;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // is anything lit or still fading? if not, skip the whole draw
      let anyLit = false;
      for (let i = 0; i < st.length; i++) if (st[i].prox > 0.001 || st[i].bright > 0.001) anyLit = true;
      if (!anyLit) return;

      const col = themeColors();
      gl.clearColor(0, 0, 0, 0);
      gl.scissor(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (let i = 0; i < buttons.length; i++) {
        const s = st[i];
        s.idle += SPEED * dt;
        const target = s.aim != null ? s.aim : s.idle;
        const diff = ((target - s.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        s.angle += diff * (1 - Math.exp(-dt * 7));
        s.bright += (s.prox - s.bright) * (1 - Math.exp(-dt * 8));
        if (s.prox < 0.001 && s.bright < 0.002) continue;

        const r = buttons[i].getBoundingClientRect();
        if (r.bottom < -PAD || r.top > vh + PAD) continue; // off screen
        const cx = (r.left + r.width / 2) * dpr;
        const cy = (vh - (r.top + r.height / 2)) * dpr;
        const rad = parseFloat(getComputedStyle(buttons[i]).borderTopLeftRadius) || 18;

        // scissor to this button's box so the fragment shader only runs there
        const sx = Math.floor((r.left - PAD) * dpr);
        const sy = Math.floor((vh - r.bottom - PAD) * dpr);
        const sw = Math.ceil((r.width + PAD * 2) * dpr);
        const shh = Math.ceil((r.height + PAD * 2) * dpr);
        gl.scissor(sx, sy, sw, shh);

        gl.uniform2f(U.uCenter, cx, cy);
        gl.uniform2f(U.uHalfSize, (r.width / 2) * dpr, (r.height / 2) * dpr);
        gl.uniform1f(U.uRadius, Math.min(rad, Math.min(r.width, r.height) / 2) * dpr);
        gl.uniform1f(U.uAngle, s.angle);
        gl.uniform1f(U.uPx, dpr);
        gl.uniform3fv(U.uLineColor, col.line);
        gl.uniform3fv(U.uBaseColor, col.base);
        gl.uniform1f(U.uIntensity, s.bright);
        gl.uniform1f(U.uShineSize, (10 * Math.PI) / 180);
        gl.uniform1f(U.uShineFade, (40 * Math.PI) / 180);
        gl.uniform1f(U.uThickness, THICK * dpr);
        gl.uniform1f(U.uBaseWidth, dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
    raf = requestAnimationFrame(frame);

    addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }

  if (document.readyState !== 'loading') init();
  else addEventListener('DOMContentLoaded', init);
})();
