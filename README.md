# NutriDetect — Nutritional Deficiency Detection System

A rule-based web application that evaluates a person's daily nutrient intake against age- and sex-specific Recommended Dietary Allowance (RDA) standards, and returns an interpretable assessment of whether they are deficient, borderline, adequate, or in excess for each nutrient  along with plain-language explanations and food-based recommendations.

This project was designed and built as a final-year academic project, as a lightweight, transparent, non-machine-learning alternative to complex dietary assessment tools, suited to a low-resource setting where accessible, self-service nutrition screening is otherwise hard to come by.

---

## What it does

- **Guided 3-step assessment**: choose which nutrients to track, enter personal details (age, sex, weight, height, activity level), then log intake for each selected nutrient.
- **Age- and sex-specific evaluation**: intake is compared against RDA values that vary by age bracket (9–13, 14–18, 19–50, 51+) and sex — not a single flat number for every user.
- **Four-tier classification**: each nutrient is scored as **Deficient** (<50% of RDA), **Borderline** (50–79%), **Adequate** (80–120%), or **Excess** (>120%), rather than a simple pass/fail.
- **BMI and personalized calorie estimation**: calculates BMI and an individual daily calorie requirement from age, sex, weight, height, and activity level, and compares it against reported intake.
- **Food-based recommendations**: each result comes with practical dietary advice and example foods to address it.
- **Educational content**: explains *why* each nutrient matters and gives everyday food examples (e.g. "1 cup cooked spinach ≈ 6.4mg iron") to help users estimate their own intake more accurately.
- **Visual results**: charts and progress indicators summarizing status across all tracked nutrients.
- **Downloadable PDF report** of the full assessment, including the nutrient reference guide.
- **Admin dashboard**: password-protected area with aggregate statistics across all stored assessments, a full history view, and record management.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server framework | Express.js |
| Views / templating | EJS (server-rendered) |
| Database | SQLite (`sqlite3`) |
| Styling | Tailwind CSS + a small custom stylesheet for bespoke components |
| Charts | Chart.js |
| Icons | Font Awesome |
| PDF generation | PDFKit |
| Session / auth | `express-session`, with `express-rate-limit` on the admin login route |
| Configuration | `dotenv` (environment variables for secrets) |
| Deployment | Render |

No frontend framework (React/Vue) is used — the wizard, animations, and interactivity are hand-written vanilla JavaScript, since the whole app is server-rendered rather than a separate API + SPA.

---

## How it's structured

```
routes/mainRoutes.js        All application routes
rules/
  bmiCalorie.js              BMI + personalized calorie requirement calculation
  nutritionRules.js          Age/sex-specific RDA knowledge base + status classification
  scoringEngine.js           Converts nutrient status into scores and an overall risk level
  recommendationEngine.js    Maps nutrient status to food-based recommendations
  nutrientInfo.js            Educational content: why each nutrient matters + food examples
db/database.js              SQLite table creation, save/read/delete logic
middleware/auth.js          Admin session guard
views/                       EJS templates (landing page, results, admin, etc.)
public/                      Static CSS and client-side JavaScript
```

The rule engine is deliberately split into independent modules — one for input validation and BMI/calorie math, one for the RDA comparison logic, one for scoring, and one for recommendations — so each part can be tested, understood, and modified on its own.

---

## Running it locally

**Prerequisites:** Node.js (v18 or later recommended) and npm installed.

**1. Get the code**
```
git clone <your-repo-url>
cd <project-folder>
```

**2. Install dependencies**
```
npm install
```

**3. Set up environment variables**

Copy the example file and fill in real values:
```
cp .env.example .env
```
Then open `.env` and set:
```
SESSION_SECRET=<a long random string>
ADMIN_PASSWORD=<a password of your choice>
```

**4. Start the app**
```
node app.js
```

**5. Open it in your browser**
```
http://localhost:3000
```

The admin dashboard is available at `/admin/login`, using the password you set in `.env`.

---

## Optional: seed sample data

`seed-test-data.js` populates the database with realistic sample assessments spanning different ages, sexes, and nutrient outcomes, useful for exploring the dashboard and history views without manually submitting the form repeatedly:
```
node seed-test-data.js
```

---

## Author

Developed by **Abigail Elaho**, as an academic final-year project.

---

## Disclaimer

This system is a rule-based educational and self-assessment tool. It does not replace professional medical or dietetic advice, and reference food amounts shown in the app are approximate, common values intended to help estimate intake — not for precise clinical use.
