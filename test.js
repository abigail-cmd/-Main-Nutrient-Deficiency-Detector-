// test.js

const { getFullBMIAndCalorieData } = require("./rules/bmiCalorie");
const { compareAllNutrients } = require("./rules/nutritionRules");
const { scoreAllNutrients, buildScoringSummary } = require("./rules/scoringEngine");
const { buildRecommendationSummary } = require("./rules/recommendationEngine");

console.log("🧪 RUNNING FULL BACKEND TEST...\n");

// fake input (same structure as your form)
const userInput = {
  fullName: "Test User",
  age: 22,
  gender: "female",
  weight: 65,
  height: 170,
  activityLevel: "sedentary",
  currentCalorieIntake: 1800,

  calories: 1800,
  protein: 40,
  iron: 8,
  calcium: 500,
  vitaminA: 400,
  vitaminC: 30,
  magnesium: 150,
  zinc: 6,
  fiber: 10,
  fat: 50,
  carbohydrates: 200,
};

// STEP 1: BMI + Calories
const bmiCalorieData = getFullBMIAndCalorieData(userInput);
console.log("📊 BMI + CALORIE DATA:");
console.log(bmiCalorieData);

// STEP 2: Nutrient Comparison
const nutrientResults = compareAllNutrients(userInput, {
  age: userInput.age,
  gender: userInput.gender,
  calorieReference: bmiCalorieData.dailyCalories,
});

console.log("\n🥗 RAW NUTRIENT RESULTS:");
console.log(nutrientResults);

// STEP 3: Scoring
const scoredResults = scoreAllNutrients(nutrientResults);
const scoringSummary = buildScoringSummary(scoredResults);

console.log("\n📈 SCORING SUMMARY:");
console.log(scoringSummary);

// STEP 4: Recommendations
const recommendationSummary = buildRecommendationSummary(scoredResults);

console.log("\n💡 RECOMMENDATIONS:");
console.log(recommendationSummary);

console.log("\n✅ BACKEND TEST COMPLETE");