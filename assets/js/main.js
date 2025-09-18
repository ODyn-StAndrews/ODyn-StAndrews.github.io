document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector("header");
  if (!header) return;

  // Hysteresis thresholds to avoid flicker near the boundary
  const ADD_THRESHOLD = 160;   // px: add .shrink when scrolling beyond
  const REMOVE_THRESHOLD = 120; // px: remove .shrink when scrolling back above

  let lastState = header.classList.contains('shrink');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    let target = lastState;
    if (y > ADD_THRESHOLD) target = true;
    else if (y < REMOVE_THRESHOLD) target = false;

    if (target !== lastState) {
      lastState = target;
      header.classList.toggle('shrink', target);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initialize on load in case we land scrolled
  onScroll();
});
