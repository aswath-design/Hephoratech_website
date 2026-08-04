/* ═══════════════════════════════════════════════
   HephoraTech — shared behaviour
   ═══════════════════════════════════════════════ */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav state, scroll progress, parallax ---- */
  const nav  = document.getElementById('nav');
  const prog = document.getElementById('prog');
  let ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(()=>{
      if(nav) nav.classList.toggle('scrolled', scrollY > 30);
      if(prog){
        const h = document.documentElement.scrollHeight - innerHeight;
        prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
      }
      document.querySelectorAll('[data-par]').forEach(el=>{
        const r = el.getBoundingClientRect();
        if(r.bottom > 0 && r.top < innerHeight){
          const off = (r.top + r.height/2 - innerHeight/2) * parseFloat(el.dataset.par);
          el.style.transform = `translate3d(0,${off}px,0)`;
        }
      });
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.1, rootMargin:'0px 0px -70px 0px'});
  document.querySelectorAll('.rv,.mask').forEach(el=>io.observe(el));

  /* ---- process timeline ---- */
  const tl = document.getElementById('tl');
  if(tl){
    new IntersectionObserver((es,ob)=>{
      es.forEach(e=>{
        if(!e.isIntersecting) return;
        tl.querySelectorAll('.step').forEach((s,i)=>setTimeout(()=>s.classList.add('lit'), 350 + i*280));
        ob.unobserve(e.target);
      });
    }, {threshold:.35}).observe(tl);
  }

  /* ---- count-up stats ---- */
  const cio = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target, end = parseInt(el.textContent);
      if(isNaN(end)) return;
      let t0 = null; const dur = 1400;
      function tick(t){
        if(!t0) t0 = t;
        const p = Math.min((t - t0)/dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.childNodes[0].nodeValue = Math.round(end * eased);
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, {threshold:.5});
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
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mm.classList.remove('open'); toggle.textContent = '☰'; document.body.style.overflow = '';
    }));
  }

  /* ---- seamless marquee ---- */
  const mt = document.getElementById('mtrack');
  if(mt) mt.innerHTML += mt.innerHTML;

  /* ---- sticky service showcase ---- */
  const ssList = document.getElementById('ssList');
  const ssStage = document.getElementById('ssStage');
  if(ssList && ssStage){
    const items  = [...ssList.querySelectorAll('.ss-item')];
    const panels = [...ssStage.querySelectorAll('.ss-panel')];
    function setActive(i){
      items.forEach(it=>it.classList.toggle('active', +it.dataset.i === i));
    }
    const sio = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) setActive(+e.target.dataset.i); });
    }, {rootMargin:'-45% 0px -45% 0px', threshold:0});
    panels.forEach(p=>sio.observe(p));
    /* click a service name to jump to its panel */
    items.forEach(it=>it.addEventListener('click', ()=>{
      const p = panels[+it.dataset.i];
      if(p) p.scrollIntoView({behavior:'smooth', block:'center'});
    }));
  }

  /* ---- contact form (demo behaviour) ---- */
  document.querySelectorAll('form[data-demo]').forEach(f=>{
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const s = f.querySelector('button span');
      if(s) s.textContent = 'Message Sent ✓';
    });
  });

  if(reduce) return;

  /* ---- cursor glow ---- */
  const glow = document.getElementById('glow');
  if(glow){
    let gx = innerWidth/2, gy = innerHeight/2, tx = gx, ty = gy;
    addEventListener('mousemove', e=>{ tx = e.clientX; ty = e.clientY; }, {passive:true});
    (function loop(){
      gx += (tx - gx) * .09; gy += (ty - gy) * .09;
      glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---- mesh drift ---- */
  const mesh = document.querySelector('.mesh');
  if(mesh){
    addEventListener('mousemove', e=>{
      const x = (e.clientX/innerWidth - .5), y = (e.clientY/innerHeight - .5);
      mesh.style.transform = `translate3d(${x*22}px,${y*22}px,0)`;
    }, {passive:true});
  }

  /* ---- magnetic buttons ---- */
  document.querySelectorAll('.mag').forEach(b=>{
    b.addEventListener('mousemove', e=>{
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2, y = e.clientY - r.top - r.height/2;
      b.style.transform = `translate(${x*.22}px,${y*.3}px)`;
    });
    b.addEventListener('mouseleave', ()=>{ b.style.transform = ''; });
  });

  /* ---- 3D tilt + spotlight ---- */
  document.querySelectorAll('.tilt').forEach(c=>{
    c.addEventListener('mousemove', e=>{
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
      c.style.setProperty('--mx', (px*100) + '%');
      c.style.setProperty('--my', (py*100) + '%');
      c.style.transform = `perspective(900px) rotateX(${(py-.5)*-5}deg) rotateY(${(px-.5)*6}deg) translateY(-6px)`;
    });
    c.addEventListener('mouseleave', ()=>{ c.style.transform = ''; });
  });
})();
