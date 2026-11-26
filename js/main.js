(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // comparsa al scroll
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .img-reveal, .steps li').forEach((el) => io.observe(el));

  // menu mobile
  const burger = $('.burger'), menu = $('#menu-mobile');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // FAQ
  $$('.q button').forEach((b) => b.addEventListener('click', () => {
    const q = b.closest('.q'), open = !q.classList.contains('open');
    q.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open);
  }));

  // scorrimento: barra, header, parallax con inerzia
  const top = $('.top'), bar = $('.progress span'), steps = $('.steps');
  const par = reduce ? [] : $$('[data-speed]').map((el) => ({ el, s: +el.dataset.speed, y: 0 }));
  let lastY = scrollY, ticking = false;

  const frame = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    top.classList.toggle('scrolled', y > 30);
    top.classList.toggle('hide', y > lastY && y > 400 && menu.hidden);
    lastY = y;

    if (steps) {
      const r = steps.getBoundingClientRect();
      steps.style.setProperty('--sp', Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height)).toFixed(3));
    }

    let moving = false;
    par.forEach((p) => {
      const r = p.el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const target = (r.top + r.height / 2 - innerHeight / 2) * -p.s;
      p.y += (target - p.y) * 0.1;
      if (Math.abs(target - p.y) > 0.05) moving = true;
      p.el.style.translate = `0 ${p.y.toFixed(2)}px`;
    });
    ticking = false;
    if (moving) request();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  request();

  // cursore luminoso e pulsanti magnetici (solo con mouse)
  if (fine && !reduce) {
    const c = $('.cursor');
    let tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop); else run = false;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY; c.classList.add('on');
      if (!run) { run = true; requestAnimationFrame(loop); }
    });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    $$('a, button').forEach((el) => {
      el.addEventListener('pointerenter', () => c.classList.add('big'));
      el.addEventListener('pointerleave', () => c.classList.remove('big'));
    });
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 14}px,${((e.clientY - r.top) / r.height - 0.5) * 10}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
