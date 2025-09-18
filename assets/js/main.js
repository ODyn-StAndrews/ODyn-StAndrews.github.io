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

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initialize on load
  onScroll();

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
});
