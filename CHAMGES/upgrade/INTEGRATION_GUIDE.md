# UI Polish Integration Guide
## Bringing Lovable's visual quality into your Node.js project

---

## Step 1 — Add polish.css to your project

Copy `polish.css` into `public/css/polish.css`.

Then in **every view's `<head>`**, add this line **after** your existing stylesheet:

```html
<link rel="stylesheet" href="/css/output.css" />
<link rel="stylesheet" href="/css/polish.css" />   <!-- ADD THIS -->
```

That's it for the CSS. The rest is swapping sections in your EJS files.

---

## Step 2 — result.ejs changes (3 swaps)

### 2a. Replace the BMI + Calorie section
Find this comment in result.ejs:
```
<!-- BMI and Calorie Analysis -->
```
Replace the entire `<section>` block (both the BMI card and the Calorie card) with the
contents of `bmi-card.ejs`.

### 2b. Replace the Focus Nutrients section
Find:
```
<!-- Focus Nutrients -->
```
Replace the entire `<section>` block with the contents of `nutrient-cards.ejs`.
This also adds the "Supporting Nutrients" grid automatically — all non-focus nutrients
get their own polished cards too.

### 2c. Replace the Recommendations sections
Find:
```
<!-- Recommendations -->   (or whatever your heading is)
```
Replace both the Priority and Supporting recommendation sections with the contents
of `recommendations.ejs`.

---

## Step 3 — index.ejs form upgrade

Find the `<form action="/analyze" method="POST" ...>` tag.
Keep the opening `<form>` tag exactly as it is.
Replace **everything inside** the form (from the first `<div class="grid gap-10">` 
down to the submit button) with the contents of `form-fields.ejs`.
Keep the closing `</form>` tag.

---

## Step 4 — history.ejs and dashboard.ejs table upgrade

Find the table section (usually starts with `<section id="history-table">`).
Replace it entirely with the contents of `history-table.ejs`.

Do the same for dashboard.ejs if it uses a similar table layout.

---

## What changes visually

| Element | Before | After |
|---|---|---|
| Nutrient cards | Plain white boxes, text only | Color-coded border+background by status, progress bar, metrics row |
| Status labels | Plain text strings | Colored pill badges (green/yellow/orange/red/purple) |
| BMI card | Simple text block | Icon header, color-coded BMI value, 4-segment scale bar |
| Form inputs | Standard browser inputs | Smooth focus ring, hover state, unit label inside field |
| Form sections | One long flat form | Two grouped cards (Personal Info / Nutrients) with icons |
| Submit button | Basic button | Polished with search icon, loading state on click |
| Table | Basic HTML table | Striped hover rows, uppercase column headers, action button pills |
| Recommendations | Text lists | Cards with food-source pills, colored status badge per item |

---

## No dependencies added

Everything uses plain CSS classes. No new npm packages, no build step changes,
no changes to your routes, rules, or database. Your Tailwind setup stays exactly
the same — polish.css sits on top of it.

---

## Status class mapping

The CSS uses these class names on cards and badges:

| Class | Meaning |
|---|---|
| `adequate` | Normal / Low risk |
| `mild` | Mild deficiency |
| `moderate` | Moderate deficiency |
| `severe` | Severe deficiency / High risk |
| `excess` | Excess intake |

The EJS partials already contain the helper functions that map your existing
status strings (e.g. "Mild Deficiency", "High Risk") to these classes.
