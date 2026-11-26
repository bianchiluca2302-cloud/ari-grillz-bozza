(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- gemme che disegnano forme ---------- */
  const TINTS = ['clear', 'pink', 'clear', 'lilac', 'clear', 'ice', 'pink'];
  const f = (n) => +n.toFixed(2);

  const gemMarkup = (type, tint, r) => {
    const fill = `url(#gm-${tint})`;
    const hi = `<ellipse cx="${f(-r * .32)}" cy="${f(-r * .4)}" rx="${f(r * .26)}" ry="${f(r * .14)}" fill="#fff" opacity=".9" transform="rotate(-35 ${f(-r * .32)} ${f(-r * .4)})"/>`;
    if (type === 'spark') {
      const a = r * 1.7, b = r * .38;
      return `<polygon points="0,${f(-a)} ${f(b)},${f(-b)} ${f(a)},0 ${f(b)},${f(b)} 0,${f(a)} ${f(-b)},${f(b)} ${f(-a)},0 ${f(-b)},${f(-b)}" fill="#fff" stroke="#ff4f9f" stroke-opacity=".55" stroke-width="${f(r * .1)}"/>`;
    }
    if (type === 'rhomb') {
      const h = r * 1.3, w = r * .9;
      return `<polygon points="0,${f(-h)} ${f(w)},0 0,${f(h)} ${f(-w)},0" fill="${fill}" stroke="#9a6aa8" stroke-opacity=".6" stroke-width="${f(r * .14)}"/><path d="M${f(-w)} 0H${f(w)}M0 ${f(-h)}L${f(w * .35)} 0L0 ${f(h)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${f(r * .08)}"/>${hi}`;
    }
    if (type === 'heart') {
      const s = r / 8;
      return `<path transform="scale(${f(s)})" d="M0 7C-9 1 -8.5 -6 -3.6 -6C-1.6 -6 0 -4.6 0 -3.4C0 -4.6 1.6 -6 3.6 -6C8.5 -6 9 1 0 7Z" fill="${fill}" stroke="#9a6aa8" stroke-opacity=".6" stroke-width="1.1"/>${hi}`;
    }
    return `<circle r="${f(r)}" fill="${fill}" stroke="#9a6aa8" stroke-opacity=".6" stroke-width="${f(r * .14)}"/><path d="M${f(-r * .6)} ${f(-r * .15)}L0 ${f(-r * .8)}L${f(r * .6)} ${f(-r * .15)}M${f(-r * .6)} ${f(-r * .15)}L0 ${f(r * .85)}L${f(r * .6)} ${f(-r * .15)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="${f(r * .08)}"/>${hi}`;
  };

  const resample = (pts, n, closed) => {
    const p = closed ? [...pts, pts[0]] : pts;
    const cum = [0];
    for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const total = cum[cum.length - 1], step = total / (closed ? n : n - 1), out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
      const d = k * step;
      while (j < cum.length - 1 && cum[j] < d) j++;
      const t = (d - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
      out.push([p[j - 1][0] + (p[j][0] - p[j - 1][0]) * t, p[j - 1][1] + (p[j][1] - p[j - 1][1]) * t]);
    }
    return out;
  };

  const SHAPES = {
    heart: (n) => {
      const pts = [];
      for (let t = 0; t < Math.PI * 2; t += .03) pts.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
      return resample(pts, n, true);
    },
    star: (n) => {
      const v = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? 21 : 50; v.push([R * Math.cos(a), R * Math.sin(a)]); }
      return resample(v, n, true);
    },
    butterfly: (n) => {
      // quattro petali (ali alte piu' grandi di quelle basse) e un corpo centrale
      const nb = Math.max(4, Math.round(n * .16)), wings = [];
      for (let t = 0; t <= Math.PI * 2; t += .02) {
        const r = Math.abs(Math.sin(2 * t)) ** .6 * 50, y = Math.sin(t) * r;
        wings.push([Math.cos(t) * r * .95, y < 0 ? y * 1.25 : y * .85]);
      }
      const body = [];
      for (let i = 0; i < nb; i++) body.push([0, -14 + (i / (nb - 1)) * 42]);
      return [...resample(wings, n - nb, true), ...body];
    },
    smile: (n) => {
      const pts = [];
      for (let x = -50; x <= 50; x += 1) pts.push([x, 17 * (1 - (x / 50) ** 2)]);
      return resample(pts, n, false);
    },
    stars: () => [[6, 8], [62, 2], [119, 10], [122, 52], [114, 96], [8, 92], [2, 50]]
  };

  const buildArt = (el, idx) => {
    const shape = el.dataset.shape, n = +el.dataset.count || 20, size = +el.dataset.size || 1.2;
    let seed = 11 + idx * 17;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let pts = SHAPES[shape](n), vb;
    if (shape === 'stars') vb = [0, 0, 124.5, 100];
    else {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
      const s = 100 / Math.max(maxx - minx, maxy - miny), pad = 6;
      pts = pts.map(([x, y]) => [(x - minx) * s, (y - miny) * s]);
      vb = [-pad, -pad, (maxx - minx) * s + pad * 2, (maxy - miny) * s + pad * 2];
    }
    const g = pts.map(([x, y], i) => {
      let type = i % 7 === 3 ? 'spark' : i % 5 === 2 ? 'rhomb' : i % 9 === 4 && shape === 'heart' ? 'heart' : 'round';
      if (shape === 'stars') type = i % 2 ? 'rhomb' : 'spark';
      const tint = TINTS[Math.floor(rnd() * TINTS.length)];
      const r = size * 1.8 * (.72 + rnd() * .6) * (type === 'spark' ? .8 : 1);
      const tw = (i % 3 === 0 || type === 'spark') ? ' tw' : '';
      return `<g transform="translate(${f(x)} ${f(y)})"><g class="gem" style="--i:${i}"><g class="${tw.trim()}">${gemMarkup(type, tint, r)}</g></g></g>`;
    }).join('');
    el.innerHTML = `<svg viewBox="${vb.map(f).join(' ')}" role="presentation" focusable="false">${g}</svg>`;
  };

  $$('.gem-art').forEach(buildArt);

  /* ---------- hero: il percorso del grillz, guidato dallo scorrimento ---------- */
  const hero = $('.hero');
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const STEPS = 5;
  const rail = $$('.rail li', hero), caps = $$('.cap', hero);
  const outline = $('.draw__outline', hero), divs = [], dayDots = $$('.days i', hero);
  const ring = $('.gem-art--ring', hero);

  // pulsanti del percorso: una gemma per passo
  const railKinds = ['round', 'rhomb', 'spark', 'heart', 'round'];
  $$('.rail svg', hero).forEach((svg, i) => { svg.innerHTML = gemMarkup(railKinds[i], TINTS[(i * 2) % TINTS.length], 8); });

  // grillz disegnato: denti, gemme e pietre sulla curva
  (() => {
    const q = (t, a, b, c) => (1 - t) * (1 - t) * a + 2 * t * (1 - t) * b + t * t * c;
    const top = (t) => [q(t, 46, 200, 354), q(t, 96, 196, 96)], bot = (t) => [q(t, 62, 200, 338), q(t, 140, 232, 140)];
    let lines = '', gems = '';
    for (let i = 1; i < 8; i++) {
      const [x1, y1] = top(i / 8), [x2, y2] = bot(i / 8);
      lines += `<line class="draw__div" pathLength="1" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
    }
    [[.5, 'spark', 9], [.25, 'round', 4.6], [.75, 'round', 4.6], [.125, 'rhomb', 3.4], [.875, 'rhomb', 3.4]].forEach(([t, type, r], i) => {
      const [x1, y1] = top(t), [x2, y2] = bot(t);
      gems += `<g transform="translate(${f((x1 + x2) / 2)} ${f((y1 + y2) / 2)})">${gemMarkup(type, TINTS[(i * 2 + 1) % TINTS.length], r)}</g>`;
    });
    $('.draw__divs', hero).innerHTML = lines;
    $('.draw__gems', hero).innerHTML = gems;
    divs.push(...$$('.draw__div', hero));
  })();

  let curStep = -1, lastOutline = -1, lastDivs = -1, lastDays = -1;
  const heroFrame = () => {
    const range = hero.offsetHeight - innerHeight;
    if (range <= 0) return;
    const p = clamp01(-hero.getBoundingClientRect().top / range);
    const raw = p * STEPS, idx = Math.min(STEPS - 1, Math.floor(raw)), lp = raw - idx;

    if (idx !== curStep) {
      curStep = idx;
      hero.dataset.step = idx;
      caps.forEach((c, i) => c.classList.toggle('on', i === idx));
      rail.forEach((li, i) => {
        li.classList.toggle('on', i <= idx);
        li.classList.toggle('cur', i === idx);
        li.classList.toggle('done', i < idx);
        const b = $('button', li);
        if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      ring.classList.toggle('in', idx === STEPS - 1);
    }

    const draw = idx === 0 ? 0 : idx === 1 ? lp : 1;
    const o = +(1 - clamp01(draw / .6)).toFixed(3), d = +(1 - clamp01((draw - .5) / .5)).toFixed(3);
    if (o !== lastOutline) { lastOutline = o; outline.style.strokeDashoffset = o; }
    if (d !== lastDivs) { lastDivs = d; divs.forEach((l) => { l.style.strokeDashoffset = d; }); }

    const days = idx < 2 ? 0 : idx === 2 ? Math.ceil(lp * 7) : 7;
    if (days !== lastDays) { lastDays = days; dayDots.forEach((el, i) => el.classList.toggle('on', i < days)); }
  };

  $$('.rail button', hero).forEach((b) => b.addEventListener('click', () => {
    const range = hero.offsetHeight - innerHeight, top = scrollY + hero.getBoundingClientRect().top;
    scrollTo({ top: top + range * (+b.dataset.go + .5) / STEPS, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- comparsa al scroll ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .img-reveal, .gem-art:not([data-manual])').forEach((el) => io.observe(el));

  /* ---------- menu mobile ---------- */
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

  /* ---------- FAQ ---------- */
  $$('.q button').forEach((b) => b.addEventListener('click', () => {
    const q = b.closest('.q'), open = !q.classList.contains('open');
    q.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open);
  }));

  /* ---------- scorrimento: barra, header, catena, parallasse con inerzia ---------- */
  const top = $('.top'), bar = $('.progress span');
  const par = reduce ? [] : $$('[data-speed]').map((el) => ({ el, s: +el.dataset.speed, y: 0 }));
  let lastY = scrollY, ticking = false;

  function frame() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    top.classList.toggle('scrolled', y > 30);
    top.classList.toggle('hide', y > lastY && y > 400 && menu.hidden);
    lastY = y;

    heroFrame();

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
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  request();

  /* ---------- cursore e pulsanti magnetici (solo con mouse) ---------- */
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
