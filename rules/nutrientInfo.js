// rules/nutrientInfo.js
//
// Educational reference content: why each nutrient matters, and everyday
// food examples to help a user estimate their own intake (since most people
// don't know how many grams/mg of a nutrient they actually consume).
// Food amounts are approximate, common reference figures (USDA-based) meant
// to help someone ballpark their intake — not for precise clinical use.
//
// This is the single source of truth for this content on the server-rendered
// pages (results page, nutrient detail page, landing page). The nutrient
// intake form (index.ejs / form-storage.js) is built client-side, so it
// carries a matching copy of the "examples" data for its own use — if you
// update the food examples here, update the copy in form-storage.js too.

const NUTRIENT_INFO = {
  protein: {
    why: "Builds and repairs muscle, skin, and other body tissue, and helps produce enzymes and hormones.",
    examples: [
      { food: "100g grilled chicken breast", amount: "31 g" },
      { food: "2 large eggs", amount: "12 g" },
      { food: "1 cup cooked beans", amount: "15 g" },
    ],
  },
  iron: {
    why: "Carries oxygen in your blood. Too little can cause fatigue and anemia; too much can strain the liver and heart over time.",
    examples: [
      { food: "100g cooked beef", amount: "2.7 mg" },
      { food: "1 cup cooked spinach", amount: "6.4 mg" },
      { food: "1 cup cooked lentils", amount: "6.6 mg" },
    ],
  },
  calcium: {
    why: "Builds and maintains strong bones and teeth, and supports muscle and nerve function.",
    examples: [
      { food: "1 cup milk", amount: "300 mg" },
      { food: "1 cup yogurt", amount: "300 mg" },
      { food: "1 slice cheddar cheese (28g)", amount: "200 mg" },
    ],
  },
  vitaminA: {
    why: "Supports healthy vision, immune function, and skin.",
    examples: [
      { food: "1 medium carrot", amount: "500 mcg" },
      { food: "1/2 cup cooked spinach", amount: "470 mcg" },
      { food: "100g baked sweet potato", amount: "960 mcg" },
    ],
  },
  vitaminC: {
    why: "Supports immune function and wound healing, and helps your body absorb iron from plant foods.",
    examples: [
      { food: "1 medium orange", amount: "70 mg" },
      { food: "1 cup strawberries", amount: "85 mg" },
      { food: "1 red bell pepper", amount: "150 mg" },
    ],
  },
  magnesium: {
    why: "Supports muscle and nerve function, blood sugar control, and bone health.",
    examples: [
      { food: "1 oz (28g) almonds", amount: "80 mg" },
      { food: "1 cup cooked spinach", amount: "157 mg" },
      { food: "1 cup cooked black beans", amount: "120 mg" },
    ],
  },
  zinc: {
    why: "Supports immune function, wound healing, and taste/smell.",
    examples: [
      { food: "100g cooked beef", amount: "4.8 mg" },
      { food: "1 cup chickpeas", amount: "2.5 mg" },
      { food: "1 oz (28g) cashews", amount: "1.6 mg" },
    ],
  },
  fiber: {
    why: "Supports digestion and helps maintain healthy blood sugar and cholesterol levels.",
    examples: [
      { food: "1 cup cooked lentils", amount: "15 g" },
      { food: "1 medium apple (with skin)", amount: "4.4 g" },
      { food: "1 cup cooked oats", amount: "4 g" },
    ],
  },
  fat: {
    why: "Provides energy, supports hormone production, and helps absorb fat-soluble vitamins (A, D, E, K).",
    examples: [
      { food: "1 tbsp olive oil", amount: "14 g" },
      { food: "1/4 avocado", amount: "7 g" },
      { food: "1 oz (28g) almonds", amount: "14 g" },
    ],
  },
  carbohydrates: {
    why: "Your body's main energy source, especially for the brain and muscles during activity.",
    examples: [
      { food: "1 cup cooked rice", amount: "45 g" },
      { food: "1 medium banana", amount: "27 g" },
      { food: "1 slice bread", amount: "15 g" },
    ],
  },
};

// Generic explanation of each classification band — same meaning
// regardless of which nutrient it's attached to.
const STATUS_EXPLANATIONS = {
  Deficient:
    "Intake is below 50% of the recommended amount. This is the highest-priority category — consider increasing intake or speaking with a healthcare provider.",
  Borderline:
    "Intake is 50–79% of the recommended amount — below optimal, but not a severe shortfall.",
  Adequate:
    "Intake is 80–120% of the recommended amount — within the healthy target range.",
  Excess:
    "Intake is above 120% of the recommended amount, which may not be necessary or advisable to sustain long-term.",
};

const RDA_EXPLAINER =
  "RDA (Recommended Dietary Allowance) is the average daily intake of a nutrient considered " +
  "sufficient to meet the needs of nearly all healthy people in a specific age and sex group, as " +
  "set by recognized health authorities such as the NIH and WHO. This system compares your " +
  "reported intake against the RDA for your age and sex to estimate whether you may be falling " +
  "short, meeting, or exceeding recommended levels.";

function getNutrientInfo(key) {
  return NUTRIENT_INFO[key] || null;
}

function getStatusExplanation(status) {
  return STATUS_EXPLANATIONS[status] || "";
}

module.exports = {
  NUTRIENT_INFO,
  STATUS_EXPLANATIONS,
  RDA_EXPLAINER,
  getNutrientInfo,
  getStatusExplanation,
};
