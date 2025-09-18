document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector("header");
  if (!header) return;

  // Interpolation ranges
  const MAX_H = 400, MIN_H = 110;
  const MAX_LOGO = 110, MIN_LOGO = 56;
  const MAX_UNI = 68, MIN_UNI = 36;
  const MAX_TITLE_REM = 3.0, MIN_TITLE_REM = 2.0;
  const MAX_OPACITY = 1.0, MIN_OPACITY = 0.0;
  const RANGE = 240; // px of scroll over which to interpolate

  let ticking = false;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    const t = clamp01(y / RANGE);

    // Set CSS variables for smooth transitions
    header.style.setProperty('--header-height', `${lerp(MAX_H, MIN_H, t)}px`);
    header.style.setProperty('--logo-size', `${lerp(MAX_LOGO, MIN_LOGO, t)}px`);
    header.style.setProperty('--uni-logo-height', `${lerp(MAX_UNI, MIN_UNI, t)}px`);
    header.style.setProperty('--title-size', `${lerp(MAX_TITLE_REM, MIN_TITLE_REM, t)}rem`);
    header.style.setProperty('--video-opacity', `${lerp(MAX_OPACITY, MIN_OPACITY, t)}`);

    // Toggle compact class when fully shrunk to allow opaque header styling
    if (t >= 0.99) header.classList.add('compact');
    else header.classList.remove('compact');

    ticking = false;
  }

  const path = window.location.pathname || '/';
  const isHome = (path === '/' || path.endsWith('/index.html'));

  if (isHome) {
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    // Initialize on load
    onScroll();

    // Active nav highlighting by section in view
    const links = Array.from(document.querySelectorAll('nav a[href*="#"]'));
    const map = new Map();
    links.forEach(l => {
      try {
        const u = new URL(l.getAttribute('href'), window.location.origin);
        const id = (u.hash || '').slice(1);
        if (!id) return;
        const sec = document.getElementById(id);
        if (sec) map.set(id, { link: l, sec });
      } catch (_) {}
    });

    function setActive(id) {
      links.forEach(l => l.classList.remove('active'));
      const item = map.get(id);
      if (item) item.link.classList.add('active');
    }

    // Observe sections and update active link
    const observer = new IntersectionObserver((entries) => {
      // Pick the entry closest to top that is intersecting
      let best = null;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      });
      if (best) setActive(best.target.id);
    }, { root: null, rootMargin: '-120px 0px -60% 0px', threshold: [0.25, 0.5, 0.75] });

    map.forEach(v => observer.observe(v.sec));

    // Also set active on click immediately
    links.forEach(l => l.addEventListener('click', () => {
      const u = new URL(l.getAttribute('href'), window.location.origin);
      const id = (u.hash || '').slice(1);
      if (id) setActive(id);
    }));
  } else {
    // Static, compact header for non-home pages
    header.classList.add('static', 'compact');
    header.style.setProperty('--header-height', `${MIN_H}px`);
    header.style.setProperty('--logo-size', `${MIN_LOGO}px`);
    header.style.setProperty('--uni-logo-height', `${MIN_UNI}px`);
    header.style.setProperty('--title-size', `${MIN_TITLE_REM}rem`);
    header.style.setProperty('--video-opacity', `${MIN_OPACITY}`);
  }

  // Simple lightbox for research galleries
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<div class="lightbox-inner"><img alt=""><p class="caption"></p></div>';
  document.body.appendChild(lb);
  lb.addEventListener('click', () => lb.classList.remove('open'));

  document.body.addEventListener('click', function(e) {
    const a = e.target.closest('a.gallery-item');
    if (!a) return;
    e.preventDefault();
    const img = lb.querySelector('img');
    const cap = lb.querySelector('.caption');
    img.src = a.getAttribute('href');
    cap.textContent = a.getAttribute('data-caption') || '';
    lb.classList.add('open');
  });

  // Smooth scroll to top when clicking site title on home page
  const titleLink = document.querySelector('header h1 a');
  if (titleLink) {
    titleLink.addEventListener('click', function(ev) {
      const p = window.location.pathname || '/';
      if (p === '/' || p.endsWith('/index.html')) {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});
