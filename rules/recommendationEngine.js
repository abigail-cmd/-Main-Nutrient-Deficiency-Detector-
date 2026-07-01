// rules/recommendationEngine.js

const foodRecommendations = {
  calories: [
    "Increase intake of balanced meals with healthy carbohydrates, proteins, and fats.",
    "Include foods like rice, potatoes, whole grains, eggs, beans, and healthy oils."
  ],
  protein: [
    "Eat more protein-rich foods such as eggs, beans, fish, chicken, milk, yogurt, and soy products.",
    "Add legumes, groundnuts, or lean meat to your meals regularly."
  ],
  iron: [
    "Eat iron-rich foods such as spinach, beans, liver, red meat, and fortified cereals.",
    "Take vitamin C-rich foods alongside iron-rich meals to improve absorption."
  ],
  calcium: [
    "Consume more milk, yogurt, cheese, sardines, and leafy green vegetables.",
    "Choose calcium-fortified foods when available."
  ],
  vitaminA: [
    "Eat carrots, sweet potatoes, pumpkin, liver, and dark leafy vegetables.",
    "Include orange and deep-green vegetables regularly."
  ],
  vitaminC: [
    "Eat oranges, lemons, guava, peppers, tomatoes, and other fresh fruits.",
    "Try not to overcook vitamin C-rich foods."
  ],
  magnesium: [
    "Eat nuts, seeds, beans, dark leafy vegetables, and whole grains.",
    "Include magnesium-rich snacks like peanuts or seeds in moderation."
  ],
  zinc: [
    "Include foods like meat, shellfish, beans, seeds, nuts, and dairy products.",
    "A balanced mixed diet can help improve zinc intake."
  ],
  fiber: [
    "Eat more vegetables, fruits, beans, oats, and whole grains.",
    "Increase fiber gradually and drink enough water."
  ],
  fat: [
    "Include healthy fat sources such as avocado, nuts, seeds, olive oil, and fish.",
    "Avoid relying only on processed fatty foods."
  ],
  carbohydrates: [
    "Include more healthy carbohydrate sources like rice, oats, bread, potatoes, and fruits.",
    "Choose whole grains when possible."
  ],
};

const excessRecommendations = {
  calories: [
    "Reduce excessive calorie intake by controlling portion sizes and limiting high-sugar, high-fat foods.",
    "Focus on balanced meals and regular physical activity."
  ],
  protein: [
    "Avoid taking more protein than needed from supplements or excessive servings.",
    "Maintain a balanced intake with carbohydrates, fruits, vegetables, and healthy fats."
  ],
  iron: [
    "Avoid unnecessary iron supplementation unless professionally advised.",
    "Review iron-fortified foods and avoid excessive iron intake."
  ],
  calcium: [
    "Avoid excessive use of calcium supplements without guidance.",
    "Keep intake moderate and balanced."
  ],
  vitaminA: [
    "Avoid excessive vitamin A supplements or very frequent high-dose fortified products.",
    "Maintain moderate intake and avoid overuse."
  ],
  vitaminC: [
    "Reduce excessive supplement use if intake is far above normal needs.",
    "Maintain a balanced fruit-based intake."
  ],
  magnesium: [
    "Avoid unnecessary magnesium supplements unless advised.",
    "Keep your intake balanced and moderate."
  ],
  zinc: [
    "Avoid overuse of zinc supplements.",
    "Maintain a balanced intake and do not exceed normal needs."
  ],
  fiber: [
    "Avoid an excessively sudden increase in fiber intake.",
    "Balance fiber intake with adequate hydration."
  ],
  fat: [
    "Reduce fried foods, processed snacks, and heavy fatty meals.",
    "Choose healthier fats in moderate portions."
  ],
  carbohydrates: [
    "Reduce excess refined carbohydrates such as sugary drinks, sweets, and highly processed foods.",
    "Choose better-quality carbohydrate sources in balanced amounts."
  ],
};

function formatLowAdvice(nutrient) {
  return `Your ${nutrient.nutrientName.toLowerCase()} intake is below the recommended level. Current intake is ${nutrient.intake}${nutrient.unit}, while the reference value is ${nutrient.referenceValue}${nutrient.unit}.`;
}

function formatExcessAdvice(nutrient) {
  return `Your ${nutrient.nutrientName.toLowerCase()} intake is above the recommended level. Current intake is ${nutrient.intake}${nutrient.unit}, while the reference value is ${nutrient.referenceValue}${nutrient.unit}.`;
}

function formatAdequateAdvice(nutrient) {
  return `${nutrient.nutrientName} intake is within an acceptable range. Continue maintaining a balanced intake.`;
}

function getSingleNutrientRecommendation(nutrientResult) {
  const nutrientKey = nutrientResult.nutrientKey;

  if (nutrientResult.status === "Deficient" || nutrientResult.status === "Borderline") {
    return {
      nutrientKey,
      nutrientName: nutrientResult.nutrientName,
      status: nutrientResult.status,
      severity: nutrientResult.severity,
      focus: nutrientResult.focus,
      recommendationType: "increase",
      advice: formatLowAdvice(nutrientResult),
      recommendedFoods: foodRecommendations[nutrientKey] || [
        "Increase intake of balanced nutrient-rich foods."
      ],
    };
  }

  if (nutrientResult.status === "Excess") {
    return {
      nutrientKey,
      nutrientName: nutrientResult.nutrientName,
      status: nutrientResult.status,
      severity: nutrientResult.severity,
      focus: nutrientResult.focus,
      recommendationType: "reduce",
      advice: formatExcessAdvice(nutrientResult),
      recommendedFoods: excessRecommendations[nutrientKey] || [
        "Reduce excessive intake and maintain dietary balance."
      ],
    };
  }

  return {
    nutrientKey,
    nutrientName: nutrientResult.nutrientName,
    status: nutrientResult.status,
    severity: nutrientResult.severity,
    focus: nutrientResult.focus,
    recommendationType: "maintain",
    advice: formatAdequateAdvice(nutrientResult),
    recommendedFoods: [
      "Continue your current balanced dietary pattern."
    ],
  };
}

function getAllNutrientRecommendations(scoredResults) {
  const recommendations = {};

  for (const [nutrientKey, nutrientResult] of Object.entries(scoredResults)) {
    recommendations[nutrientKey] = getSingleNutrientRecommendation(nutrientResult);
  }

  return recommendations;
}

function getPriorityRecommendations(scoredResults) {
  return Object.values(scoredResults)
    .filter(
      (item) =>
        item.focus &&
        (item.status === "Deficient" ||
          item.status === "Borderline" ||
          item.status === "Excess")
    )
    .map((item) => getSingleNutrientRecommendation(item));
}

function getSupportingRecommendations(scoredResults) {
  return Object.values(scoredResults)
    .filter(
      (item) =>
        !item.focus &&
        (item.status === "Deficient" ||
          item.status === "Borderline" ||
          item.status === "Excess")
    )
    .map((item) => getSingleNutrientRecommendation(item));
}

function getGeneralNutritionAdvice(scoredResults) {
  const advice = [];

  const all = Object.values(scoredResults);
  const focusNutrients = all.filter((item) => item.focus);

  const deficientCount = all.filter((item) => item.status === "Deficient").length;
  const excessCount = all.filter((item) => item.status === "Excess").length;
  const focusProblemCount = focusNutrients.filter(
    (item) =>
      item.status === "Deficient" ||
      item.status === "Borderline" ||
      item.status === "Excess"
  ).length;

  if (focusProblemCount >= 2) {
    advice.push(
      "Multiple key nutrients require attention. Try improving meal variety across proteins, fruits, vegetables, and mineral-rich foods."
    );
  }

  if (deficientCount >= 3) {
    advice.push(
      "Several nutrients are below recommended intake. A more balanced and nutrient-dense eating pattern is advised."
    );
  }

  if (excessCount >= 2) {
    advice.push(
      "Some nutrients appear above recommended levels. Moderation and portion control are important."
    );
  }

  if (advice.length === 0) {
    advice.push(
      "Your nutrient intake appears fairly balanced. Continue maintaining healthy eating habits."
    );
  }

  return advice;
}

function buildRecommendationSummary(scoredResults) {
  const allRecommendations = getAllNutrientRecommendations(scoredResults);
  const priorityRecommendations = getPriorityRecommendations(scoredResults);
  const supportingRecommendations = getSupportingRecommendations(scoredResults);
  const generalAdvice = getGeneralNutritionAdvice(scoredResults);

  return {
    allRecommendations,
    priorityRecommendations,
    supportingRecommendations,
    generalAdvice,
  };
}

module.exports = {
  getSingleNutrientRecommendation,
  getAllNutrientRecommendations,
  getPriorityRecommendations,
  getSupportingRecommendations,
  getGeneralNutritionAdvice,
  buildRecommendationSummary,
};
