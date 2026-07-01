# v3 Integration Guide

## Files in this folder

| File | What it replaces |
|---|---|
| `pdfReport.js` | `utils/pdfReport.js` — full rewrite, 3 pages, properly laid out |
| `admin-login.ejs` | `views/admin-login.ejs` — split panel design, Font Awesome icons |
| `graphs-section.ejs` | The `<!-- Graphs -->` section inside `views/result.ejs` |

---

## 1. pdfReport.js

Drop into `utils/pdfReport.js`. No other changes needed — same export signature.

**What changed:**
- Page 1: cover with patient info card + 6 summary stat cards + disclaimer
- Page 2: BMI & calorie cards + focus nutrients table with progress bars
- Page 3: priority recommendations (focus nutrients with issues) + supporting notes (non-focus) + general advice
- Page numbers and footer on every page
- Status colour-coded badges on every nutrient

---

## 2. admin-login.ejs

Drop into `views/admin-login.ejs`. Requires Font Awesome — add to `<head>`:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
```

**What changed:**
- Two-column layout: dark green branding panel on left, login form on right
- Password show/hide toggle
- Feature bullets in left panel (Dashboard, History, Secure Access)
- Proper error state with icon

---

## 3. graphs-section.ejs

In `views/result.ejs`:

**Step 1 — Add Font Awesome to `<head>`:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
```

**Step 2 — Replace the graphs section:**
Find `<!-- Graphs -->` and replace the entire `<section id="graphs" ...>` block
with the contents of `graphs-section.ejs`.

**Step 3 — Remove old chart scripts:**
At the bottom of result.ejs, inside the `<script>` block, delete all the existing
chart code (makeBarChart, makeSingleBarChart, makeDoughnutChart, and all the calls
below them). The new chart code is included at the bottom of `graphs-section.ejs`.

**What changed:**
- Coverage bars replace the old "all nutrients" bar chart
- Doughnut + intake vs RDA side by side (clean, properly sized)
- 5 individual mini charts in a responsive 5-column grid
- All colors driven by nutrient status (green/amber/red/purple)
- Font Awesome icons on section headers — no emojis
- Supporting/non-focus nutrients do NOT appear in any chart

---

## Supporting nutrients display

The non-focus nutrients (Carbs, Fat, Fiber, Magnesium, Zinc) are NOT in the charts.
They still appear in the existing Recommendations section under "Supporting Recommendations"
which already uses `item.focus === false` from your backend — no changes needed there.
