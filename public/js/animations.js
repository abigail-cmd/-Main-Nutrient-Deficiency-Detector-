// Shared scroll-reveal animation for elements marked with
// .anim-fade-up, .anim-fade-in, or .anim-scale.
// Used by both the landing page and the results page so the
// same behaviour no longer has to be duplicated inline in every view.
(function () {
  const els = document.querySelectorAll('.anim-fade-up, .anim-fade-in, .anim-scale');
  if (!els.length) return;

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(function (el) {
    obs.observe(el);
  });
})();

// Grow progress/coverage bars from 0 to their real value on load,
// instead of rendering already-filled. Each bar's target width is
// read from a data-fill attribute (set server-side in the view);
// the actual growth is handled by the width transition already
// defined in CSS for these elements.
(function () {
  const bars = document.querySelectorAll('.js-fill[data-fill]');
  if (!bars.length) return;

  // Wait a frame so the browser paints the 0% starting state first,
  // otherwise the transition can be skipped entirely.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bars.forEach(function (bar) {
        const target = bar.getAttribute('data-fill');
        bar.style.width = target + '%';
      });
    });
  });
})();
