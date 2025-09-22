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
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  // Common refs used below
  const titleLink = document.querySelector('header h1 a');
  const homeIcon = document.querySelector('.nav-home a');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (isHome && !isMobile) {
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    // Initialize on load
    onScroll();

    // Active nav highlighting via IntersectionObserver (restored)
    const links = Array.from(document.querySelectorAll('nav a[href*="#"]'));
    const homeLink = document.querySelector('.nav-home a');
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

    function clearActive() { links.forEach(l => l.classList.remove('active')); if (homeLink) homeLink.classList.remove('active'); }
    function setActive(id) {
      clearActive();
      const item = map.get(id);
      if (item) item.link.classList.add('active');
    }
    function setActiveHome() { clearActive(); if (homeLink) homeLink.classList.add('active'); }

    const observer = new IntersectionObserver((entries) => {
      // If at (or very near) top, highlight Home icon
      if ((window.scrollY || window.pageYOffset || 0) <= 10) {
        setActiveHome();
        return;
      }
      // Choose the entry whose top is closest to the top and is intersecting
      let candidate = null;
      let minTop = Infinity;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const top = e.boundingClientRect.top;
        if (top >= -20 && top < minTop) {
          minTop = top;
          candidate = e;
        }
      });
      if (!candidate) {
        // Fallback: pick the highest ratio intersecting entry
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          if (!candidate || e.intersectionRatio > candidate.intersectionRatio) candidate = e;
        });
      }
      if (candidate) setActive(candidate.target.id);
    }, { root: null, rootMargin: '-120px 0px -60% 0px', threshold: [0.1, 0.25, 0.5, 0.75] });

    map.forEach(v => observer.observe(v.sec));

    links.forEach(l => l.addEventListener('click', () => {
      const u = new URL(l.getAttribute('href'), window.location.origin);
      const id = (u.hash || '').slice(1);
      if (id) setActive(id);
    }));

    // Also set Home active immediately when clicking title or home icon
    if (titleLink) titleLink.addEventListener('click', () => setActiveHome());
    if (homeIcon) homeIcon.addEventListener('click', () => setActiveHome());
  } else {
    // Static, compact header for non-home pages
    header.classList.add('static', 'compact');
    header.style.setProperty('--header-height', `${MIN_H}px`);
    header.style.setProperty('--logo-size', `${MIN_LOGO}px`);
    header.style.setProperty('--uni-logo-height', `${MIN_UNI}px`);
    header.style.setProperty('--title-size', `${MIN_TITLE_REM}rem`);
    header.style.setProperty('--video-opacity', `${MIN_OPACITY}`);
  }

  // On mobile (home or not), enforce compact, static header vars
  if (isMobile) {
    header.classList.add('compact');
    header.style.setProperty('--header-height', `64px`);
    header.style.setProperty('--logo-size', `40px`);
    header.style.setProperty('--uni-logo-height', `36px`);
    header.style.setProperty('--title-size', `1.6rem`);
    header.style.setProperty('--video-opacity', `0`);
  }

  // Mobile menu interactions
  if (navToggle && mobileMenu) {
    function toggleMenu(force) {
      const open = (typeof force === 'boolean') ? force : !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      if (open) mobileMenu.removeAttribute('hidden'); else mobileMenu.setAttribute('hidden', '');
    }
    navToggle.addEventListener('click', () => toggleMenu());
    // Close when clicking a link
    mobileMenu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // Smooth-scroll for internal anchors when on home
      try {
        const u = new URL(a.getAttribute('href'), window.location.origin);
        const hash = u.hash;
        if (hash && (isHome || u.pathname.endsWith('/index.html') || u.pathname === '/')) {
          const id = hash.slice(1);
          const sec = document.getElementById(id);
          if (sec) {
            e.preventDefault();
            toggleMenu(false);
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
      } catch(_) {}
      // Otherwise just close and let navigation proceed
      toggleMenu(false);
    });
    // Close on ESC
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
    // Close menu when resizing to desktop
    window.addEventListener('resize', () => { if (window.innerWidth > 640) toggleMenu(false); });
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
  if (titleLink) {
    titleLink.addEventListener('click', function(ev) {
      const p = window.location.pathname || '/';
      if (p === '/' || p.endsWith('/index.html')) {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Smooth scroll for the home icon in nav when already on homepage
  if (homeIcon) {
    homeIcon.addEventListener('click', function(ev) {
      const p = window.location.pathname || '/';
      if (p === '/' || p.endsWith('/index.html')) {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});
