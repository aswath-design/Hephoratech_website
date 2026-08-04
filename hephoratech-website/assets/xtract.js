/* ═══════════════════════════════════════════════
   HephoraTech — Xtract-style homepage behaviour
   ═══════════════════════════════════════════════ */
(function(){
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
    (function par(){
      for(let i=0;i<pars.length;i++){
        const el = pars[i], st = state[i];
        const r = el.getBoundingClientRect();
        if(r.bottom > -240 && r.top < innerHeight + 240){
          st.tgt = -(r.top + r.height/2 - innerHeight/2) * parseFloat(el.dataset.par || .05);
        }
        st.cur += (st.tgt - st.cur) * .08;          // damping
        if(Math.abs(st.tgt - st.cur) > .05)
          el.style.transform = `translate3d(0,${st.cur.toFixed(2)}px,0)`;
      }
      requestAnimationFrame(par);
    })();
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
    const sio = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) setActive(+e.target.dataset.i); });
    }, {rootMargin:'-45% 0px -45% 0px', threshold:0});
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
        location.href = 'mailto:Aswath@hephoratech.com?subject=' +
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
          say('err', out.message || 'Something went wrong. Please email Aswath@hephoratech.com directly.');
        }
      }catch(err){
        say('err','Could not send right now. Please email Aswath@hephoratech.com directly.');
      }finally{
        if(label) label.textContent = original;
        if(btn) btn.disabled = false;
      }
    });
  });

  /* ---- newsletter (demo) ---- */
  document.querySelectorAll('form[data-demo]').forEach(f=>{
    f.addEventListener('submit', e=>{ e.preventDefault(); const b=f.querySelector('button'); if(b) b.textContent='Subscribed ✓'; });
  });

  if(reduce) return;

  /* ---- starfield canvas ---- */
  const host = document.getElementById('stars');
  if(host){
    const cv = document.createElement('canvas'); host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let w, h, stars = [];
    function resize(){
      w = cv.width = innerWidth * devicePixelRatio;
      h = cv.height = (host.offsetHeight || 940) * devicePixelRatio;
      const n = Math.min(190, Math.floor(w*h/24000/devicePixelRatio));
      stars = Array.from({length:n}, ()=>({
        x:Math.random()*w, y:Math.random()*h,
        r:(Math.random()*1.3+.3)*devicePixelRatio,
        a:Math.random(), s:Math.random()*.02+.004
      }));
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(const st of stars){
        st.a += st.s; const al = .35 + Math.abs(Math.sin(st.a))*.6;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = `rgba(190,214,255,${al})`; ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); draw();
    addEventListener('resize', resize, {passive:true});
  }

  /* ---- chat dock: WhatsApp bubble + chat widget ---- */
  (function chatDock(){
    const WA_NUMBER = '919994229860';                 // +91 99942 29860
    const WA_TEXT   = encodeURIComponent("Hi HephoraTech! I'd like to talk about a project.");
    const waLink    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

    const dock = document.createElement('div');
    dock.className = 'chat-dock';
    dock.innerHTML = `
      <div class="cd-panel" role="dialog" aria-label="Chat with HephoraTech">
        <div class="cd-head">
          <div class="cd-avatar">HT</div>
          <div class="cd-head-tx"><b>HephoraTech</b><i>Typically replies in minutes</i></div>
          <button class="cd-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="cd-body">
          <div class="cd-msg"><span class="av">HT</span><div class="cd-bub">Hi there 👋 Thanks for stopping by!</div></div>
          <div class="cd-msg"><span class="av">HT</span><div class="cd-bub">What can we help you build today?</div></div>
        </div>
        <div class="cd-quick">
          <button data-q="I'd like a new website">New website</button>
          <button data-q="I need an e-commerce store">E-commerce</button>
          <button data-q="I'm interested in a custom app">Custom app</button>
          <button data-q="I'd like a quote">Get a quote</button>
        </div>
        <div class="cd-foot">
          <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            <span>Chat on WhatsApp</span>
            <span class="btn-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </a>
          <div class="cd-note">or <a href="contact.html" style="color:var(--pur-3)">send us a message</a></div>
        </div>
      </div>
      <div class="cd-actions">
        <a class="cd-btn cd-wa" href="${waLink}" target="_blank" rel="noopener" aria-label="WhatsApp">
          <span class="cd-tip">Chat on WhatsApp</span>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1112 20.2z"/></svg>
        </a>
        <button class="cd-btn cd-chat" aria-label="Open chat" aria-expanded="false">
          <span class="cd-tip">Need help? Chat with us</span>
          <span class="cd-dot">1</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </button>
      </div>`;
    document.body.appendChild(dock);

    const toggleBtn = dock.querySelector('.cd-chat');
    const closeBtn  = dock.querySelector('.cd-close');
    const dot       = dock.querySelector('.cd-dot');
    const body      = dock.querySelector('.cd-body');

    function open(){
      dock.classList.add('open');
      toggleBtn.setAttribute('aria-expanded','true');
      if(dot) dot.style.display = 'none';
    }
    function close(){
      dock.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded','false');
    }
    toggleBtn.addEventListener('click', ()=> dock.classList.contains('open') ? close() : open());
    closeBtn.addEventListener('click', close);
    addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });

    /* quick replies hand off to WhatsApp with the chosen message */
    dock.querySelectorAll('.cd-quick button').forEach(b=>{
      b.addEventListener('click', ()=>{
        // echo the choice into the thread, then show a typing bubble
        const mine = document.createElement('div');
        mine.className = 'cd-msg';
        mine.style.cssText = 'flex-direction:row-reverse;animation-delay:0s';
        mine.innerHTML = `<div class="cd-bub" style="background:var(--pur-soft);border-color:rgba(30,95,255,.3);border-radius:14px 4px 14px 14px">${b.textContent}</div>`;
        body.appendChild(mine); body.scrollTop = body.scrollHeight;

        const typing = document.createElement('div');
        typing.className = 'cd-msg';
        typing.style.animationDelay = '0s';
        typing.innerHTML = `<span class="av">HT</span><div class="cd-bub cd-typing"><i></i><i></i><i></i></div>`;
        setTimeout(()=>{ body.appendChild(typing); body.scrollTop = body.scrollHeight; }, 260);

        setTimeout(()=>{
          window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(b.dataset.q)}`, '_blank', 'noopener');
          typing.remove();
        }, 1150);
      });
    });

    /* nudge the user once, after they've had a look around */
    if(!sessionStorage.getItem('ht-chat-seen')){
      setTimeout(()=>{
        if(!dock.classList.contains('open')){
          toggleBtn.style.animation = 'none';
          toggleBtn.offsetHeight;
          toggleBtn.style.animation = 'cdIn .6s var(--soft)';
        }
        sessionStorage.setItem('ht-chat-seen','1');
      }, 12000);
    }
  })();

  /* ---- magnetic buttons ---- */
  document.querySelectorAll('.mag').forEach(b=>{
    let raf, tx=0, ty=0, cx=0, cy=0, active=false;
    function loop(){
      cx += (tx-cx)*.18; cy += (ty-cy)*.18;
      b.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
      if(active || Math.abs(cx)>.1 || Math.abs(cy)>.1) raf = requestAnimationFrame(loop);
      else b.style.transform = '';
    }
    b.addEventListener('mousemove', e=>{
      const r = b.getBoundingClientRect();
      tx = (e.clientX-r.left-r.width/2)*.22; ty = (e.clientY-r.top-r.height/2)*.34;
      if(!active){ active = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    });
    b.addEventListener('mouseleave', ()=>{ active=false; tx=0; ty=0; });
  });

  /* ---- spotlight + subtle tilt on cards ---- */
  document.querySelectorAll('.bcard,.xcard,.reason,.pstep,.srow-vis,.card,.dv,.eg').forEach(c=>{
    c.addEventListener('mousemove', e=>{
      const r = c.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width, py = (e.clientY-r.top)/r.height;
      c.style.setProperty('--mx', (px*100)+'%');
      c.style.setProperty('--my', (py*100)+'%');
      c.style.transform = `perspective(1000px) rotateX(${((py-.5)*-3).toFixed(2)}deg) rotateY(${((px-.5)*4).toFixed(2)}deg) translateY(-5px)`;
    });
    c.addEventListener('mouseleave', ()=>{ c.style.transform=''; });
  });

  /* ---- orbs drift with cursor ---- */
  const orbs = [...document.querySelectorAll('.orb')];
  if(orbs.length){
    let ox=0, oy=0, txo=0, tyo=0;
    addEventListener('mousemove', e=>{
      txo = (e.clientX/innerWidth - .5); tyo = (e.clientY/innerHeight - .5);
    }, {passive:true});
    (function drift(){
      ox += (txo-ox)*.04; oy += (tyo-oy)*.04;
      orbs.forEach((o,i)=>{
        const k = (i+1)*16;
        o.style.marginLeft = (ox*k).toFixed(1)+'px';
        o.style.marginTop  = (oy*k).toFixed(1)+'px';
      });
      requestAnimationFrame(drift);
    })();
  }
})();
