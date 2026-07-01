// rules/nutritionRules.js

function getAgeGroup(age) {
  if (age >= 9 && age <= 13) return "9-13";
  if (age >= 14 && age <= 18) return "14-18";
  return "19+";
}

function getReferenceSet(age, gender, calorieReference = 2000) {
  const ageGroup = getAgeGroup(age);
  const g = String(gender || "").toLowerCase();

  const references = {
    "9-13": {
      male: {
        calories: calorieReference,
        protein: 34,
        iron: 8,
        calcium: 1300,
        vitaminA: 600,
        vitaminC: 45,
        magnesium: 240,
        zinc: 8,
        fiber: 31,
        fat: 65,
        carbohydrates: 130,
      },
      female: {
        calories: calorieReference,
        protein: 34,
        iron: 8,
        calcium: 1300,
        vitaminA: 600,
        vitaminC: 45,
        magnesium: 240,
        zinc: 8,
        fiber: 26,
        fat: 65,
        carbohydrates: 130,
      },
    },
    "14-18": {
      male: {
        calories: calorieReference,
        protein: 52,
        iron: 11,
        calcium: 1300,
        vitaminA: 900,
        vitaminC: 75,
        magnesium: 410,
        zinc: 11,
        fiber: 38,
        fat: 75,
        carbohydrates: 130,
      },
      female: {
        calories: calorieReference,
        protein: 46,
        iron: 15,
        calcium: 1300,
        vitaminA: 700,
        vitaminC: 65,
        magnesium: 360,
        zinc: 9,
        fiber: 26,
        fat: 65,
        carbohydrates: 130,
      },
    },
    "19+": {
      male: {
        calories: calorieReference,
        protein: 56,
        iron: 8,
        calcium: 1000,
        vitaminA: 900,
        vitaminC: 90,
        magnesium: 400,
        zinc: 11,
        fiber: 38,
        fat: 70,
        carbohydrates: 130,
      },
      female: {
        calories: calorieReference,
        protein: 46,
        iron: 18,
        calcium: 1000,
        vitaminA: 700,
        vitaminC: 75,
        magnesium: 310,
        zinc: 8,
        fiber: 25,
        fat: 70,
        carbohydrates: 130,
      },
    },
  };

  return {
    ageGroup,
    values: references[ageGroup][g === "male" ? "male" : "female"],
  };
}

function getNutrientDefinitions(age, gender, calorieReference = 2000) {
  const { ageGroup, values } = getReferenceSet(age, gender, calorieReference);

  return {
    calories: {
      label: "Calories",
      unit: "kcal",
      rda: values.calories,
      focus: false,
      ageGroup,
    },
    protein: {
      label: "Protein",
      unit: "g",
      rda: values.protein,
      focus: true,
      ageGroup,
    },
    iron: {
      label: "Iron",
      unit: "mg",
      rda: values.iron,
      focus: true,
      ageGroup,
    },
    calcium: {
      label: "Calcium",
      unit: "mg",
      rda: values.calcium,
      focus: true,
      ageGroup,
    },
    vitaminA: {
      label: "Vitamin A",
      unit: "mcg",
      rda: values.vitaminA,
      focus: true,
      ageGroup,
    },
    vitaminC: {
      label: "Vitamin C",
      unit: "mg",
      rda: values.vitaminC,
      focus: true,
      ageGroup,
    },
    magnesium: {
      label: "Magnesium",
      unit: "mg",
      rda: values.magnesium,
      focus: false,
      ageGroup,
    },
    zinc: {
      label: "Zinc",
      unit: "mg",
      rda: values.zinc,
      focus: false,
      ageGroup,
    },
    fiber: {
      label: "Fiber",
      unit: "g",
      rda: values.fiber,
      focus: false,
      ageGroup,
    },
    fat: {
      label: "Fat",
      unit: "g",
      rda: values.fat,
      focus: false,
      ageGroup,
    },
    carbohydrates: {
      label: "Carbohydrates",
      unit: "g",
      rda: values.carbohydrates,
      focus: false,
      ageGroup,
    },
  };
}

function normalizeNumber(value) {
  const num = Number(value);
  return isNaN(num) || num < 0 ? 0 : num;
}

function calculatePercentage(intake, rda) {
  if (!rda) return 0;
  return Number(((intake / rda) * 100).toFixed(2));
}

function getNutrientStatus(percentage) {
  if (percentage < 50) return "Deficient";
  if (percentage < 80) return "Borderline";
  if (percentage <= 120) return "Adequate";
  return "Excess";
}

function getSeverity(status) {
  switch (status) {
    case "Deficient":
      return "High Risk";
    case "Borderline":
      return "Moderate Risk";
    case "Adequate":
      return "Low Risk";
    case "Excess":
      return "Moderate Risk";
    default:
      return "Unknown";
  }
}

function compareSingleNutrient(nutrientKey, intakeValue, definitions) {
  const nutrient = definitions[nutrientKey];

  if (!nutrient) {
    throw new Error(`Unknown nutrient: ${nutrientKey}`);
  }

  const intake = normalizeNumber(intakeValue);
  const percentage = calculatePercentage(intake, nutrient.rda);
  const status = getNutrientStatus(percentage);
  const differenceRaw = Number((intake - nutrient.rda).toFixed(2));

  return {
    nutrientKey,
    nutrientName: nutrient.label,
    unit: nutrient.unit,
    intake,
    referenceValue: Number(nutrient.rda.toFixed ? nutrient.rda.toFixed(2) : nutrient.rda),
    percentageMet: percentage,
    status,
    severity: getSeverity(status),
    difference: Math.abs(differenceRaw),
    differenceDirection:
      differenceRaw < 0 ? "below" : differenceRaw > 0 ? "above" : "equal",
    focus: nutrient.focus,
    ageGroup: nutrient.ageGroup,
  };
}

function compareAllNutrients(userIntake = {}, options = {}) {
  const { age, gender, calorieReference = 2000 } = options;

  if (!age || !gender) {
    throw new Error("Age and gender are required for nutrient comparison.");
  }

  const definitions = getNutrientDefinitions(age, gender, calorieReference);
  const results = {};

  for (const nutrientKey of Object.keys(definitions)) {
    results[nutrientKey] = compareSingleNutrient(
      nutrientKey,
      userIntake[nutrientKey],
      definitions
    );
  }

  return results;
}

function getFocusNutrients(results) {
  return Object.values(results).filter((n) => n.focus);
}

function getSupportingNutrients(results) {
  return Object.values(results).filter((n) => !n.focus);
}

function summarizeNutrients(results) {
  const all = Object.values(results);
  const focus = getFocusNutrients(results);

  return {
    totalTracked: all.length,
    focusTracked: focus.length,
    deficient: all.filter((n) => n.status === "Deficient").length,
    borderline: all.filter((n) => n.status === "Borderline").length,
    adequate: all.filter((n) => n.status === "Adequate").length,
    excess: all.filter((n) => n.status === "Excess").length,
  };
}

module.exports = {
  getAgeGroup,
  getReferenceSet,
  getNutrientDefinitions,
  compareSingleNutrient,
  compareAllNutrients,
  getFocusNutrients,
  getSupportingNutrients,
  summarizeNutrients,
};