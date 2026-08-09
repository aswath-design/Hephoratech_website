/* ═══════════════════════════════════════════════
   HephoraTech — Xtract-style homepage behaviour
   ═══════════════════════════════════════════════ */
(function(){
  // Chrome restores the last scroll position on reload and, because of
  // `scroll-behavior:smooth`, animates the glide there instead of jumping —
  // which reads as "the page scrolling down on its own" on every reopen.
  // Always start at the top instead.
  if('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- page transitions ---- */
  if(!reduce){
    const veil = document.createElement('div');
    veil.className = 'pt-veil';
    document.body.appendChild(veil);
    // wrap everything after the fixed layers so it can animate as one page
    document.addEventListener('click', e=>{
      const a = e.target.closest && e.target.closest('a');
      if(!a) return;
      const href = a.getAttribute('href') || '';
      if(a.target === '_blank' || a.hasAttribute('download')) return;
      if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if(!/\.html($|[?#])/.test(href) && href !== '/') return;
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add('pt-leaving');
      veil.classList.add('show');
      setTimeout(()=>{ location.href = href; }, 430);
    });
    // if restored from bfcache, clear the leaving state
    addEventListener('pageshow', ()=>{
      document.body.classList.remove('pt-leaving');
      veil.classList.remove('show');
    });
  }

  /* ---- nav + scroll progress ---- */
  const nav = document.getElementById('nav');
  const prog = document.getElementById('prog');
  const pars = [...document.querySelectorAll('[data-par]')];
  let ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(()=>{
      if(nav){
        nav.classList.toggle('scrolled', scrollY > 24);
        nav.classList.toggle('collapsed', scrollY > 150);
      }
      if(prog){ const h = document.documentElement.scrollHeight - innerHeight; prog.style.width = (h>0 ? scrollY/h*100 : 0) + '%'; }
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- damped parallax (eased toward target every frame) ---- */
  if(!reduce && pars.length){
    const state = pars.map(()=>({cur:0, tgt:0}));
    const amt = pars.map(el => parseFloat(el.dataset.par || .05));
    let parRaf = 0, parIdle = 0;
    // Read ALL rects first, then write ALL transforms. Interleaving read/write
    // in one loop forced a synchronous layout per element, per frame.
    const par = () => {
      const vh = innerHeight, rects = [];
      for(let i=0;i<pars.length;i++) rects.push(pars[i].getBoundingClientRect());
      let moving = false;
      for(let i=0;i<pars.length;i++){
        const st = state[i], r = rects[i];
        if(r.bottom > -240 && r.top < vh + 240)
          st.tgt = -(r.top + r.height/2 - vh/2) * amt[i];
        st.cur += (st.tgt - st.cur) * .08;
        if(Math.abs(st.tgt - st.cur) > .05){
          pars[i].style.transform = `translate3d(0,${st.cur.toFixed(2)}px,0)`;
          moving = true;
        }
      }
      // idle for ~half a second with nothing moving → stop until the next scroll
      parIdle = moving ? 0 : parIdle + 1;
      parRaf = (parIdle > 30 || document.hidden) ? 0 : requestAnimationFrame(par);
    };
    const kickPar = () => { parIdle = 0; if(!parRaf && !document.hidden) parRaf = requestAnimationFrame(par); };
    addEventListener('scroll', kickPar, {passive:true});
    addEventListener('resize', kickPar, {passive:true});
    addEventListener('visibilitychange', ()=>{
      if(document.hidden){ if(parRaf){ cancelAnimationFrame(parRaf); parRaf = 0; } } else kickPar();
    });
    kickPar();
  }

  /* ---- hero headline: wrap words for stagger ---- */
  document.querySelectorAll('[data-words]').forEach(el=>{
    const html = el.innerHTML;
    // split on spaces but keep existing <span class="grad"> wrappers intact-ish
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    let out = '', delay = 0.25;
    function walk(node, grad){
      node.childNodes.forEach(n=>{
        if(n.nodeType === 3){
          n.textContent.split(/(\s+)/).forEach(w=>{
            if(w.trim()==='' ){ out += w; return; }
            out += `<span class="word${grad?' grad':''}" style="animation-delay:${delay.toFixed(2)}s">${w}</span>`;
            delay += 0.08;
          });
        } else if(n.nodeType === 1){
          walk(n, grad || n.classList.contains('grad'));
        }
      });
    }
    walk(tmp, false);
    el.innerHTML = out;
  });

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -70px 0px'});
  document.querySelectorAll('.rv,.stag,.mask-line').forEach(el=>io.observe(el));

  /* ---- auto-enhance: give grids staggered children & rows directional entry ---- */
  document.querySelectorAll('.benefits,.proc,.reasons,.card-grid,.deliv,.grid-3,.grid-2,.eng,.band-in,.svc-grid,.prod-wrap')
    .forEach(g=>{ if(!g.classList.contains('stag')){ g.classList.add('stag'); io.observe(g); } });
  document.querySelectorAll('.srow,.prow').forEach(row=>{
    const vis = row.querySelector('.srow-vis,.prow-vis');
    const txt = row.querySelector('.srow-txt,.prow-txt');
    if(!vis || !txt) return;
    const flip = row.classList.contains('flip');
    vis.classList.add('rv', flip ? 'rv-right' : 'rv-left');
    txt.classList.add('rv', flip ? 'rv-left' : 'rv-right', 'rv-d1');
    io.observe(vis); io.observe(txt);
  });

  /* ---- sticky showcase (products / services) ---- */
  document.querySelectorAll('.svc-sticky').forEach(block=>{
    const items  = [...block.querySelectorAll('.ss-item')];
    const panels = [...block.querySelectorAll('.ss-panel')];
    if(!items.length || !panels.length) return;
    const setActive = i => items.forEach(it=>it.classList.toggle('active', +it.dataset.i === i));
    setActive(0);
    const sio = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) setActive(+e.target.dataset.i); });
    }, {rootMargin:'-35% 0px -35% 0px', threshold:0});
    panels.forEach(p=>sio.observe(p));
    items.forEach(it=>it.addEventListener('click', ()=>{
      const p = panels[+it.dataset.i];
      if(p) p.scrollIntoView({behavior:'smooth', block:'center'});
    }));
  });

  /* ---- play videos only while on screen (saves CPU/battery) ---- */
  const vids = document.querySelectorAll('.srow-media video');
  if(vids.length){
    const vio = new IntersectionObserver(es=>{
      es.forEach(e=>{
        const v = e.target;
        if(e.isIntersecting){ const p = v.play(); if(p && p.catch) p.catch(()=>{}); }
        else v.pause();
      });
    }, {threshold:.25});
    vids.forEach(v=>{ v.muted = true; v.playsInline = true; vio.observe(v); });
  }

  /* ---- horizontal process timeline (inner pages) ---- */
  const tl = document.getElementById('tl');
  if(tl){
    new IntersectionObserver((es,ob)=>{
      es.forEach(e=>{
        if(!e.isIntersecting) return;
        tl.classList.add('in');
        tl.querySelectorAll('.step').forEach((s,i)=>setTimeout(()=>s.classList.add('lit'), 320 + i*260));
        ob.unobserve(e.target);
      });
    }, {threshold:.3}).observe(tl);
  }

  /* ---- count-up stats ---- */
  const cio = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target, end = parseInt(el.textContent);
      if(isNaN(end)){ cio.unobserve(el); return; }
      let t0 = null; const dur = 1400;
      (function tick(t){
        if(!t0) t0 = t;
        const p = Math.min((t-t0)/dur,1), eased = 1 - Math.pow(1-p,3);
        el.childNodes[0].nodeValue = Math.round(end*eased);
        if(p<1) requestAnimationFrame(tick);
      })(performance.now());
      cio.unobserve(el);
    });
  }, {threshold:.6});
  document.querySelectorAll('.stat .num').forEach(el=>cio.observe(el));

  /* ---- mobile menu ---- */
  const toggle = document.querySelector('.menu-toggle');
  const mm = document.getElementById('mobileMenu');
  if(toggle && mm){
    toggle.addEventListener('click', ()=>{
      const open = mm.classList.toggle('open');
      toggle.textContent = open ? '✕' : '☰';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      mm.classList.remove('open'); toggle.textContent = '☰'; document.body.style.overflow = '';
    }));
  }

  /* ---- seamless marquee ---- */
  const mt = document.getElementById('mtrack');
  if(mt) mt.innerHTML += mt.innerHTML;

  /* ---- custom dropdown (replaces native select) ---- */
  document.querySelectorAll('select').forEach(sel=>{
    if(sel.closest('.xsel')) return;
    const wrap = document.createElement('div');
    wrap.className = 'xsel';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    const opts = [...sel.options].map(o=>o.textContent);
    const btn  = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xsel-btn';
    btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = `<span class="lbl">${opts[sel.selectedIndex] || opts[0]}</span><span class="cv"></span>`;

    const list = document.createElement('ul');
    list.className = 'xsel-list';
    list.setAttribute('role','listbox');
    opts.forEach((t,i)=>{
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
      li.textContent = t;
      li.addEventListener('click', ()=>{
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        btn.querySelector('.lbl').textContent = t;
        [...list.children].forEach((c,j)=>c.setAttribute('aria-selected', j===i ? 'true':'false'));
        close();
      });
      list.appendChild(li);
    });

    wrap.appendChild(btn); wrap.appendChild(list);
    function open(){ wrap.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
    function close(){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      document.querySelectorAll('.xsel.open').forEach(o=>{ if(o!==wrap) o.classList.remove('open'); });
      wrap.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', e=>{ if(!wrap.contains(e.target)) close(); });
    addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });
  });

  /* ---- contact form → email ---- */
  document.querySelectorAll('form[data-mail]').forEach(f=>{
    const status = f.querySelector('.form-status');
    const btn    = f.querySelector('button[type="submit"]');
    const label  = btn ? btn.querySelector('span') : null;
    const original = label ? label.textContent : '';

    function say(kind, msg){
      if(!status) return;
      status.className = 'form-status show ' + kind;
      status.innerHTML = (kind === 'ok'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>') + '<span>' + msg + '</span>';
    }

    f.addEventListener('submit', async e=>{
      e.preventDefault();
      const key = f.dataset.mail;                      // Web3Forms access key
      const data = new FormData(f);
      data.append('subject', 'New enquiry from hephoratech.com');
      data.append('from_name', 'HephoraTech Website');

      /* no key configured yet → fall back to opening the visitor's mail app */
      if(!key || key === 'YOUR-ACCESS-KEY-HERE'){
        const body = [...data.entries()]
          .filter(([k])=>!['access_key','subject','from_name','botcheck'].includes(k))
          .map(([k,v])=>k + ': ' + v).join('\n');
        location.href = 'mailto:info@hephoratech.com?subject=' +
          encodeURIComponent('New enquiry from the website') + '&body=' + encodeURIComponent(body);
        say('ok','Opening your email app so you can send this to us…');
        return;
      }

      if(label) label.textContent = 'Sending…';
      if(btn) btn.disabled = true;
      try{
        const res = await fetch('https://api.web3forms.com/submit', {method:'POST', body:data});
        const out = await res.json();
        if(out.success){
          say('ok','Thanks! Your message is on its way — we usually reply the same working day.');
          f.reset();
          f.querySelectorAll('select').forEach(s=>{
            const lbl = s.closest('.xsel') && s.closest('.xsel').querySelector('.lbl');
            if(lbl) lbl.textContent = s.options[0].textContent;
          });
        } else {
          say('err', out.message || 'Something went wrong. Please email info@hephoratech.com directly.');
        }
      }catch(err){
        say('err','Could not send right now. Please email info@hephoratech.com directly.');
      }finally{
        if(label) label.textContent = original;
        if(btn) btn.disabled = false;
      }
    });
  });

  /* ---- newsletter → email ---- */
  document.querySelectorAll('form[data-news]').forEach(f=>{
    const btn   = f.querySelector('button[type="submit"]') || f.querySelector('button');
    const input = f.querySelector('input[type="email"]');
    const original = btn ? btn.textContent : 'Subscribe';

    /* honeypot — real people never see it, naive bots fill it in */
    const trap = document.createElement('input');
    trap.type = 'checkbox'; trap.name = 'botcheck'; trap.tabIndex = -1;
    trap.autocomplete = 'off'; trap.style.display = 'none';
    f.appendChild(trap);

    /* status line lives after the form: .foot-news is a flex row */
    const status = document.createElement('div');
    status.className = 'form-status foot-news-status';
    f.insertAdjacentElement('afterend', status);

    function say(kind, msg){
      status.className = 'form-status foot-news-status show ' + kind;
      status.innerHTML = (kind === 'ok'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>') + '<span>' + msg + '</span>';
    }

    f.addEventListener('submit', async e=>{
      e.preventDefault();
      const key   = f.dataset.news;
      const email = input ? input.value.trim() : '';
      if(!email) return;

      /* no key configured → hand off to the visitor's mail app rather than lie */
      if(!key || key === 'YOUR-ACCESS-KEY-HERE'){
        location.href = 'mailto:info@hephoratech.com?subject=' +
          encodeURIComponent('Newsletter signup') + '&body=' + encodeURIComponent('Please add me to the list: ' + email);
        say('ok','Opening your email app so you can send this to us…');
        return;
      }

      const data = new FormData();
      data.append('access_key', key);
      data.append('email', email);
      data.append('subject', 'New newsletter subscriber — hephoratech.com');
      data.append('from_name', 'HephoraTech Website');
      if(trap.checked) data.append('botcheck', 'on');

      if(btn){ btn.textContent = 'Sending…'; btn.disabled = true; }
      try{
        const res = await fetch('https://api.web3forms.com/submit', {method:'POST', body:data});
        const out = await res.json();
        if(out.success){
          say('ok','You’re on the list — thanks for subscribing.');
          f.reset();
        } else {
          say('err', out.message || 'Something went wrong. Please email info@hephoratech.com directly.');
        }
      }catch(err){
        say('err','Could not subscribe right now. Please email info@hephoratech.com directly.');
      }finally{
        if(btn){ btn.textContent = original; btn.disabled = false; }
      }
    });
  });

  if(reduce) return;

  /* ---- lottie, loaded lazily ----
     Uses the FULL build, not lottie_light: the light build ships no filter
     support, so blurred layers render as hard-edged solids — the flow animation
     turned its soft white glow into an opaque blob. 74KB gzipped vs 45KB, and
     every animation sits below the fold.
     Nothing here touches first paint, which keeps the initial page weight where
     it is. Sitting below the `reduce` guard also means a visitor who asked for
     reduced motion never downloads the player at all.
     If the script or a file fails, the card keeps whatever static art it has. */
  const lotties = document.querySelectorAll('[data-lottie]');
  if(lotties.length){
    let started = false;
    const start = () => {
      if(started) return;
      started = true;
      const s = document.createElement('script');
      s.src = 'assets/lottie/lottie.min.js';
      s.onload = () => {
        if(typeof lottie === 'undefined') return;
        lotties.forEach(el => {
          try{
            lottie.loadAnimation({
              container: el, renderer: 'svg', loop: true, autoplay: true,
              path: el.dataset.lottie,
              /* `meet` = contain. `slice` scaled the square up to cover the
                 card's full width and cropped it, which read as far too big.
                 data-par lets a panel left-align its artwork instead of
                 centring it — the annotation overlay reads the same value so
                 the two always line up. */
              rendererSettings: {
                progressiveLoad: true,
                preserveAspectRatio: el.dataset.par || 'xMidYMid meet'
              }
            });
            /* only now hide the still art beneath it — if the player or the
               JSON never arrives, the photo stays and the card looks intact */
            const card = el.closest('.sz-row, .sb-card');
            if(card) card.classList.add('lottie-live');
          }catch(e){ /* card falls back to its static art */ }
        });
      };
      document.head.appendChild(s);
    };
    /* Deliberately NOT gated on IntersectionObserver or a scroll event. Both
       proved unreliable here and their failure mode is the worst one available
       — the panel stays blank forever with no error. Waiting for `load` then
       idle keeps this off the critical path (first paint and LCP are already
       done by then) while making it certain the animation appears. */
    const boot = () => {
      const idle = window.requestIdleCallback || (fn => setTimeout(fn, 300));
      idle(start, { timeout: 2000 });
    };
    if(document.readyState === 'complete') boot();
    else addEventListener('load', boot, { once: true });
  }

  /* ---- starfield canvas ---- */
  const host = document.getElementById('stars');
  if(host){
    const cv = document.createElement('canvas'); host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let w, h, stars = [];
    // cap DPR: at 2x on a 1080p screen the old canvas was ~7.2M pixels,
    // cleared and repainted every frame
    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    function resize(){
      w = cv.width = innerWidth * DPR;
      h = cv.height = (host.offsetHeight || 940) * DPR;
      const n = Math.min(120, Math.floor(w*h/26000/DPR));
      stars = Array.from({length:n}, ()=>({
        x:Math.random()*w, y:Math.random()*h,
        r:(Math.random()*1.3+.3)*devicePixelRatio,
        a:Math.random(), s:Math.random()*.02+.004
      }));
    }
    // cached so we don't force a style recalc every frame
    let starRGB = '190,214,255';
    function syncStarColor(){
      const v = getComputedStyle(document.documentElement)
                  .getPropertyValue('--star').trim();
      if(v) starRGB = v;
    }
    syncStarColor();
    addEventListener('themechange', syncStarColor);

    let starRaf = 0, onScreen = true;
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(const st of stars){
        st.a += st.s; const al = .35 + Math.abs(Math.sin(st.a))*.6;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = `rgba(${starRGB},${al})`; ctx.fill();
      }
      starRaf = requestAnimationFrame(draw);
    }
    const startStars = () => {
      if(!starRaf && onScreen && !document.hidden
         && !matchMedia('(prefers-reduced-motion: reduce)').matches)
        starRaf = requestAnimationFrame(draw);
    };
    const stopStars = () => { if(starRaf){ cancelAnimationFrame(starRaf); starRaf = 0; } };
    // don't paint a canvas nobody can see
    new IntersectionObserver(es => {
      onScreen = es[0].isIntersecting;
      onScreen ? startStars() : stopStars();
    }, {threshold:0}).observe(host);
    addEventListener('visibilitychange', ()=> document.hidden ? stopStars() : startStars());
    // A View Transition rasterises the whole viewport twice. A canvas that
    // keeps repainting during that invalidates the snapshot every frame, which
    // is most of the theme-switch stutter — so hold still while it sweeps.
    addEventListener('ht:freeze', stopStars);
    addEventListener('ht:thaw', startStars);
    resize(); startStars();
    addEventListener('resize', resize, {passive:true});
  }

  /* ---- AI agent: liquid-glass dock ---- */
  (function agent(){
    const LABEL = ['Need a website or app?', 'Ask me'];

    const dock = document.createElement('div');
    dock.className = 'ai-dock';
    dock.innerHTML = `
      <div class="ai-panel" role="dialog" aria-label="Chat with the HephoraTech agent">
        <div class="ai-sheen" aria-hidden="true"></div>
        <header class="ai-head">
          <span class="ai-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2.2l2.15 5.4a4 4 0 002.25 2.25L21.8 12l-5.4 2.15a4 4 0 00-2.25 2.25L12 21.8l-2.15-5.4a4 4 0 00-2.25-2.25L2.2 12l5.4-2.15a4 4 0 002.25-2.25z"/></svg>
          </span>
          <span class="ai-id">
            <b>HephoraTech Agent</b>
            <i><span class="ai-live"></span>Usually replies instantly</i>
          </span>
          <button class="ai-x" aria-label="Close chat">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>

        <div class="ai-gate">
          <span class="ai-gate-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <h4>Before we start</h4>
          <p>Just so we know who we're talking to &mdash; and can follow up if you'd like a quote.</p>
          <form class="ai-gate-form">
            <input class="ai-gate-in" name="name" type="text" placeholder="Your name" autocomplete="name" required maxlength="60">
            <input class="ai-gate-in" name="phone" type="tel" placeholder="Phone or WhatsApp number" autocomplete="tel" required maxlength="20">
            <button class="ai-gate-go" type="submit"><span>Start chatting</span>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
          <button class="ai-skip" type="button">Skip for now</button>
        </div>

        <div class="ai-body" role="log" aria-live="polite"></div>
        <form class="ai-form">
          <input class="ai-input" type="text" placeholder="Ask about our services…" autocomplete="off" maxlength="600" aria-label="Your message">
          <button class="ai-send" type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
          </button>
        </form>
      </div>

      <button class="ai-teaser" type="button" aria-label="Chat with the HephoraTech agent">
        <b>${LABEL[0]}</b> <i>${LABEL[1]}</i>
      </button>

      <button class="ai-fab" aria-label="Chat with the HephoraTech agent" aria-expanded="false">
        <span class="ai-fab-glow" aria-hidden="true"></span>
        <svg class="ai-i-chat" viewBox="0 0 24 24"><path d="M12 2.2l2.15 5.4a4 4 0 002.25 2.25L21.8 12l-5.4 2.15a4 4 0 00-2.25 2.25L12 21.8l-2.15-5.4a4 4 0 00-2.25-2.25L2.2 12l5.4-2.15a4 4 0 002.25-2.25z"/><path d="M18.6 3.1l.62 1.58 1.58.62-1.58.62-.62 1.58-.62-1.58L16.4 5.3l1.58-.62z"/></svg>
        <span class="ai-badge">1</span>
      </button>`;
    document.body.appendChild(dock);

    const panel  = dock.querySelector('.ai-panel');
    const fab    = dock.querySelector('.ai-fab');
    const body   = dock.querySelector('.ai-body');
    const form   = dock.querySelector('.ai-form');
    const input  = dock.querySelector('.ai-input');
    const badge  = dock.querySelector('.ai-badge');
    const gate   = dock.querySelector('.ai-gate');
    const gform  = dock.querySelector('.ai-gate-form');
    const teaser = dock.querySelector('.ai-teaser');

    let history = [], busy = false, started = false;
    let lead = null;
    try{ lead = JSON.parse(sessionStorage.getItem('ht-lead') || 'null'); }catch(e){}

    function bubble(role, text){
      const row = document.createElement('div');
      row.className = 'ai-row ' + role;
      row.innerHTML = '<div class="ai-bub"></div>';
      row.querySelector('.ai-bub').textContent = text;
      body.appendChild(row);
      body.scrollTop = body.scrollHeight;
      return row;
    }
    function typing(){
      const row = document.createElement('div');
      row.className = 'ai-row bot ai-typing';
      row.innerHTML = '<div class="ai-bub"><span></span><span></span><span></span></div>';
      body.appendChild(row); body.scrollTop = body.scrollHeight;
      return row;
    }

    function greet(){
      const who = lead && lead.name ? lead.name.split(' ')[0] : null;
      const hello = who
        ? `Hi ${who} — good to meet you. How can I help today?`
        : "Hi — I'm the HephoraTech agent. How can I help today?";
      setTimeout(()=>{ bubble('bot', hello); }, 320);
    }

    function begin(){
      if(started) return;
      started = true;
      gate.classList.add('done');
      panel.classList.add('chatting');
      // give the model the visitor's details as quiet context
      if(lead){
        history.push({role:'user', content:
          `[Context — do not repeat back verbatim] Visitor name: ${lead.name}. Contact: ${lead.phone}. Greet them by first name once, then help.`});
        history.push({role:'assistant', content:'Understood.'});
      }
      greet();
      setTimeout(()=>input.focus(), 420);
    }

    gform.addEventListener('submit', e=>{
      e.preventDefault();
      const name  = gform.name.value.trim();
      const phone = gform.phone.value.trim();
      if(!name || !phone) return;
      lead = {name, phone};
      try{ sessionStorage.setItem('ht-lead', JSON.stringify(lead)); }catch(err){}
      begin();
    });
    dock.querySelector('.ai-skip').addEventListener('click', ()=>{ lead = null; begin(); });

    async function ask(text){
      history.push({role:'user', content:text});
      bubble('me', text);
      busy = true; input.disabled = true;
      const t = typing();
      try{
        const res  = await fetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});
        const data = await res.json().catch(()=>({}));
        t.remove();
        if(res.ok && data.reply){
          history.push({role:'assistant', content:data.reply});
          bubble('bot', data.reply);
        }else{
          bubble('bot', data.error && data.error.indexOf('not configured') > -1
            ? "The agent isn't switched on yet. In the meantime, email info@hephoratech.com or call +91 99942 29860 and we'll reply personally."
            : "Sorry — I couldn't reach the agent just then. Please try again in a moment.");
        }
      }catch(err){
        t.remove();
        bubble('bot', "Something went wrong reaching the agent. Please try again, or email info@hephoratech.com.");
      }finally{
        busy = false; input.disabled = false; input.focus();
      }
    }

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const v = input.value.trim();
      if(!v || busy) return;
      input.value=''; ask(v);
    });

    function open(){
      dock.classList.add('open');
      fab.setAttribute('aria-expanded','true');
      badge.style.display='none';
      teaser.classList.remove('show');
      if(lead && !started) begin();
      else if(!started) setTimeout(()=>{ const f = gform.querySelector('input'); if(f) f.focus(); }, 480);
    }
    function close(){
      dock.classList.remove('open');
      fab.setAttribute('aria-expanded','false');
    }
    fab.addEventListener('click', open);
    dock.querySelector('.ai-x').addEventListener('click', close);
    addEventListener('keydown', e=>{ if(e.key==='Escape' && dock.classList.contains('open')) close(); });

    // teaser + nudge, once per visit
    // the label shows on every visit; only the attention nudge is once-per-visit
    const firstTime = !sessionStorage.getItem('ht-ai-seen');
    setTimeout(()=>{
      if(!dock.classList.contains('open')) teaser.classList.add('show');
    }, 2200);
    if(firstTime){
      setTimeout(()=>{
        if(!dock.classList.contains('open')) fab.classList.add('nudge');
        sessionStorage.setItem('ht-ai-seen','1');
      }, 4500);
      setTimeout(()=>fab.classList.remove('nudge'), 7200);
    }else{
      badge.style.display='none';
    }
  })();

  /* ---- services branch tree: trunk grows, branches light up ---- */
  (function branchTree(){
    const tree = document.getElementById('svcTree');
    if(!tree) return;
    const fill = tree.querySelector('.tree-fill');
    const rows = [...tree.querySelectorAll('.tree-row')];
    if(!rows.length) return;

    if(reduce){ rows.forEach(r=>r.classList.add('lit')); if(fill) fill.style.height='100%'; return; }

    const LINE = 0.62;          // a row lights once its node passes this line
    let tick = false;

    function paint(){
      const box  = tree.getBoundingClientRect();
      const mark = innerHeight * LINE;
      let h = mark - box.top;
      h = Math.max(0, Math.min(h, box.height));
      if(fill) fill.style.height = h.toFixed(1) + 'px';
      rows.forEach(r=>{
        const n = r.getBoundingClientRect();
        if(n.top + n.height/2 <= mark) r.classList.add('lit');
      });
    }

    addEventListener('scroll', ()=>{
      if(tick) return; tick = true;
      requestAnimationFrame(()=>{ paint(); tick = false; });
    }, {passive:true});
    addEventListener('resize', paint, {passive:true});
    paint();
  })();

  /* ---- magnetic buttons ---- */
  if(!reduce){
    document.querySelectorAll('.mag').forEach(el=>{
      let raf = 0, cx = 0, cy = 0, tx = 0, ty = 0, on = false;
      el.addEventListener('mousemove', e=>{
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width/2))  * .22;
        ty = (e.clientY - (r.top  + r.height/2)) * .28;
        on = true; if(!raf) raf = requestAnimationFrame(loop);
      }, {passive:true});
      el.addEventListener('mouseleave', ()=>{ tx = 0; ty = 0; on = false; if(!raf) raf = requestAnimationFrame(loop); });
      function loop(){
        cx += (tx - cx) * .16; cy += (ty - cy) * .16;
        el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
        raf = (on || Math.abs(cx) > .1 || Math.abs(cy) > .1) ? requestAnimationFrame(loop) : 0;
      }
    });
  }

  /* ---- cursor spotlight on cards ---- */
  if(!reduce){
    document.querySelectorAll('.ss-card,.card,.xcard,.svc').forEach(el=>{
      el.addEventListener('mousemove', e=>{
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top)  + 'px');
      }, {passive:true});
    });
  }

  /* ---- annotated product stages ---- */
  document.querySelectorAll('[data-anno]').forEach(stage=>{
    new IntersectionObserver((es,ob)=>{
      es.forEach(e=>{ if(e.isIntersecting){ stage.classList.add('in'); ob.unobserve(e.target); } });
    }, {threshold:.2}).observe(stage);
  });

  /* ---- orbs drift with cursor ---- */
  const orbs = [...document.querySelectorAll('.orb')];
  const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(orbs.length && !noMotion && matchMedia('(hover:hover)').matches){
    let ox=0, oy=0, txo=0, tyo=0, orbRaf=0;
    // `translate` is its own property: compositor-only, and it does NOT fight
    // the keyframes' `transform`. Writing margin here used to force a layout
    // + a 90px blur repaint on every single frame.
    const drift = () => {
      ox += (txo-ox)*.06; oy += (tyo-oy)*.06;
      for(let i=0;i<orbs.length;i++){
        const k = (i+1)*16;
        orbs[i].style.translate = (ox*k).toFixed(1)+'px '+(oy*k).toFixed(1)+'px';
      }
      // stop once it has settled — no idle rAF burning frames
      orbRaf = (Math.abs(txo-ox) > .001 || Math.abs(tyo-oy) > .001)
        ? requestAnimationFrame(drift) : 0;
    };
    addEventListener('mousemove', e=>{
      txo = (e.clientX/innerWidth - .5); tyo = (e.clientY/innerHeight - .5);
      if(!orbRaf && !document.hidden) orbRaf = requestAnimationFrame(drift);
    }, {passive:true});
    addEventListener('visibilitychange', ()=>{
      if(document.hidden && orbRaf){ cancelAnimationFrame(orbRaf); orbRaf = 0; }
    });
  }

  /* ---- theme toggle: dark <-> light, remembered across visits ---- */
  (function themeToggle(){
    const root = document.documentElement;

    const SUN = '<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true">'
      + '<circle cx="12" cy="12" r="4.6"/>'
      + '<path d="M12 1.8v2.4M12 19.8v2.4M22.2 12h-2.4M4.2 12H1.8'
      + 'M19.21 4.79l-1.7 1.7M6.49 17.51l-1.7 1.7M19.21 19.21l-1.7-1.7M6.49 6.49l-1.7-1.7"/>'
      + '</svg>';
    const MOON = '<svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    function swap(mode){
      if(mode === 'light') root.setAttribute('data-theme','light');
      else root.removeAttribute('data-theme');
      try{ localStorage.setItem('ht-theme', mode); }catch(e){}
      document.querySelectorAll('.theme-tg').forEach(b=>{
        b.setAttribute('aria-label', mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
        b.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
      });
      dispatchEvent(new CustomEvent('themechange', {detail:{mode}}));
    }

    /* The new theme washes over the page as a circle growing out of the
       icon. Needs View Transitions; anything else gets the crossfade. */
    function apply(mode, animate, origin){
      // The wave snapshots the whole viewport twice. This page is expensive to
      // rasterise (two live canvases, backdrop-filters, big blurs), so on a
      // weak device or a phone the sweep costs more than it's worth — those
      // get the cheap crossfade instead.
      const weak = (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 760;
      const canWave = animate && !reduce && !weak && document.startViewTransition && origin;

      if(!canWave){
        if(animate){
          root.classList.add('theming');
          clearTimeout(apply._t);
          apply._t = setTimeout(()=>root.classList.remove('theming'), 420);
        }
        swap(mode);
        return;
      }

      // reach from the icon to whichever page corner is furthest away
      const far = Math.hypot(
        Math.max(origin.x, innerWidth  - origin.x),
        Math.max(origin.y, innerHeight - origin.y)
      );

      root.classList.add('wave');
      dispatchEvent(new CustomEvent('ht:freeze'));      // still canvases = clean snapshot
      const vt = document.startViewTransition(()=>swap(mode));

      vt.ready.then(()=>{
        root.animate(
          { clipPath:[`circle(0px at ${origin.x}px ${origin.y}px)`,
                      `circle(${far}px at ${origin.x}px ${origin.y}px)`] },
          { duration:560, easing:'cubic-bezier(.22,.61,.24,1)',
            pseudoElement:'::view-transition-new(root)' }
        );
      }).catch(()=>{});

      const done = ()=>{
        root.classList.remove('wave');
        dispatchEvent(new CustomEvent('ht:thaw'));
      };
      vt.finished.then(done).catch(done);
    }

    function current(){
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    // one floating button in the page corner — deliberately NOT inside .nav-in,
    // otherwise it blocks the nav pill from collapsing
    if(!document.querySelector('.theme-tg')){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-tg';
      btn.innerHTML = SUN + MOON;
      btn.addEventListener('click', ()=>{
        btn.classList.remove('pulse');
        void btn.offsetWidth;              // restart the halo
        btn.classList.add('pulse');
        const r = btn.getBoundingClientRect();
        apply(current() === 'light' ? 'dark' : 'light', true,
              {x:r.left + r.width/2, y:r.top + r.height/2});
      });
      document.body.appendChild(btn);
    }

    apply(current(), false);   // sync labels with whatever the inline script set

    // follow the OS only while the visitor hasn't chosen for themselves
    const mq = matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener && mq.addEventListener('change', e=>{
      let saved = null;
      try{ saved = localStorage.getItem('ht-theme'); }catch(err){}
      if(!saved) apply(e.matches ? 'light' : 'dark', true);
    });
  })();


  /* ---- hero magic rings background ---- */
  (function(){
    var host = document.getElementById('heroRings');
    if(!host) return;
    function init(){
      if(!window.HephoraMagicRings){
        console.warn('[hero] magic-rings.js did not load — hero background skipped');
        return;
      }
      var rings = window.HephoraMagicRings(host, {
      color:        '#1E5FFF',   // brand blue — inner rings
      colorTwo:     '#8FB4FF',   // pale blue  — outer rings
      ringCount:    6,
      speed:        0.85,
      attenuation:  11,
      lineThickness:2,
      baseRadius:   0.28,
      radiusStep:   0.10,
      scaleRate:    0.09,
      opacity:      1,
      noiseAmount:  0.08,
      rotation:     0,
      ringGap:      1.5,
      followMouse:  true,
      mouseInfluence: 0.12,
      hoverScale:   1.06,
        parallax:     0.03
      });
      /* The rings return null on any browser without WebGL — hardware
         acceleration off, a blocklisted GPU, a locked-down profile. The orbs
         are dimmed to .1 on the assumption the rings are carrying the hero,
         so without this the background is simply empty for those visitors. */
      if(!rings) document.documentElement.classList.add('no-hero-rings');
    }
    // run now if the library is already there, otherwise wait for load
    if(window.HephoraMagicRings) init(); else addEventListener('load', init);
  })();
})();
