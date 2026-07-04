// Renders the results-page charts (status distribution doughnut,
// intake-vs-RDA grouped bar, and per-nutrient mini bars).
// Reads assessment data from window.__NUTRIENT_RESULTS__ and
// window.__SCORING_SUMMARY__, which are set by a small inline
// script in views/result.ejs (see comment there) before this
// file is loaded, since only the view has access to the
// server-rendered assessment data.

    (function() {
  const nr = window.__NUTRIENT_RESULTS__ || {};
  const ss = window.__SCORING_SUMMARY__ || {};

  const STATUS_COLOR = {
    Deficient:  '#ef4444',
    Borderline: '#f59e0b',
    Adequate:   '#22c55e',
    Excess:     '#8b5cf6',
  };

  function colorForStatus(s) {
    if (!s) return '#22c55e';
    if (s.includes('Deficient'))  return STATUS_COLOR.Deficient;
    if (s.includes('Borderline')) return STATUS_COLOR.Borderline;
    if (s.includes('Excess'))     return STATUS_COLOR.Excess;
    return STATUS_COLOR.Adequate;
  }

  const focusEntries = Object.entries(nr).filter(([,v]) => v.focus);
  const allEntries   = Object.entries(nr);

  // Chart.js global defaults
  Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
  Chart.defaults.font.size   = 11;

  const gridColor = 'rgba(0,0,0,0.05)';
  const tickColor = '#94a3b8';

  // ── Status distribution doughnut ──────────────────────────────────────
  const counts = { Adequate: 0, Borderline: 0, Deficient: 0, Excess: 0 };
  allEntries.forEach(([,v]) => {
    if (v.status === 'Adequate')   counts.Adequate++;
    else if (v.status === 'Borderline') counts.Borderline++;
    else if (v.status === 'Deficient')  counts.Deficient++;
    else if (v.status === 'Excess')     counts.Excess++;
  });
  new Chart(document.getElementById('statusDistributionChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#22c55e','#f59e0b','#ef4444','#8b5cf6'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      cutout: '65%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 9, padding: 10, color: '#475569' } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw}` } },
      },
    },
  });

  // ── Intake vs RDA grouped bar ─────────────────────────────────────────
  new Chart(document.getElementById('intakeVsRdaChart'), {
    type: 'bar',
    data: {
      labels: focusEntries.map(([,v]) => v.nutrientName),
      datasets: [
        {
          label: 'Your intake',
          data: focusEntries.map(([,v]) => v.intake),
          backgroundColor: focusEntries.map(([,v]) => colorForStatus(v.status)),
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'RDA',
          data: focusEntries.map(([,v]) => v.referenceValue),
          backgroundColor: 'rgba(148,163,184,0.2)',
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 9, padding: 10, color: '#475569' } },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: tickColor, maxTicksLimit: 5 },
        },
        x: {
          grid: { display: false },
          ticks: { color: tickColor },
        },
      },
    },
  });

  // ── Individual mini bar charts ────────────────────────────────────────
  focusEntries.forEach(([key, n]) => {
    const el = document.getElementById(`mini_${key}`);
    if (!el) return;
    const col = colorForStatus(n.status);
    new Chart(el, {
      type: 'bar',
      data: {
        labels: ['Intake', 'RDA'],
        datasets: [{
          data: [n.intake, n.referenceValue],
          backgroundColor: [col, 'rgba(148,163,184,0.22)'],
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, display: false },
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
        },
      },
    });
  });

})();
  