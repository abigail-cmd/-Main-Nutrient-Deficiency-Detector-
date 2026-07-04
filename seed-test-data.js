// seed-test-data.js
//
// Populates the database with 50 realistic test assessments spanning all
// age brackets (9-13, 14-18, 19-50, 51+), both genders, a wide range of
// weights, and a full mix of Deficient / Borderline / Adequate / Excess
// outcomes — including boundary cases right at the age-50/51 line, to
// demonstrate the iron and calcium RDA fixes.
//
// This runs the exact same rule engine your real form submissions use
// (bmiCalorie -> nutritionRules -> scoringEngine -> recommendationEngine),
// then saves each result directly, so the data is indistinguishable from
// a real user having submitted the form. Each record is also backdated
// to a spread of dates over the last ~2 months (instead of all sharing
// today's timestamp), so your History/Dashboard pages don't look like
// 50 submissions happened in the same second.
//
// Usage:  node seed-test-data.js
// Each run adds 50 more records — delete data/nutrition.db first if you
// want to start from a clean slate rather than adding to what's there.

const { getFullBMIAndCalorieData } = require("./rules/bmiCalorie");
const { compareAllNutrients } = require("./rules/nutritionRules");
const { scoreAllNutrients, buildScoringSummary } = require("./rules/scoringEngine");
const { buildRecommendationSummary } = require("./rules/recommendationEngine");
const { saveAssessment, initializeDatabase } = require("./db/database");

function formatActivityLevel(raw) {
  const map = {
    sedentary: "Sedentary",
    lightly_active: "Lightly Active",
    moderately_active: "Moderately Active",
    very_active: "Very Active",
    extra_active: "Extra Active",
  };
  return map[raw] || raw || "N/A";
}

// Spreads records across the last ~65 days at varied times of day, so the
// History/Dashboard pages show a realistic-looking timeline instead of
// everything dated "today".
function computeCreatedAt(index, total) {
  const daysAgo = Math.floor((index / total) * 65) + (index % 4);
  const hour = 8 + (index % 12);       // between 8am and 7pm
  const minute = (index * 13) % 60;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const FIVE_FOCUS = ["iron", "calcium", "vitaminA", "vitaminC", "protein"];

const PEOPLE = [
  { fullName: "Amara Okafor",        age: 22, gender: "female", weight: 58,  height: 165, activityLevel: "moderately_active", currentCalorieIntake: 1600, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 700, vitaminA: 500, vitaminC: 40, protein: 35 } },
  { fullName: "Michael Adeyemi",      age: 25, gender: "male",   weight: 75,  height: 178, activityLevel: "very_active", currentCalorieIntake: 2400, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Grace Nwosu",          age: 55, gender: "female", weight: 68,  height: 160, activityLevel: "sedentary", currentCalorieIntake: 1500, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Halima Bello",         age: 50, gender: "female", weight: 65,  height: 162, activityLevel: "lightly_active", currentCalorieIntake: 1700, selectedNutrients: FIVE_FOCUS, values: { iron: 10, calcium: 900, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Emeka Chukwu",         age: 60, gender: "male",   weight: 80,  height: 175, activityLevel: "sedentary", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 3, calcium: 400, vitaminA: 300, vitaminC: 20, protein: 20 } },
  { fullName: "David Okonkwo",        age: 16, gender: "male",   weight: 60,  height: 170, activityLevel: "very_active", currentCalorieIntake: 2600, selectedNutrients: FIVE_FOCUS, values: { iron: 11, calcium: 1300, vitaminA: 900, vitaminC: 75, protein: 52 } },
  { fullName: "Chiamaka Eze",         age: 15, gender: "female", weight: 52,  height: 158, activityLevel: "moderately_active", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 900, vitaminA: 500, vitaminC: 40, protein: 30 } },
  { fullName: "Ngozi Umeh",           age: 35, gender: "female", weight: 90,  height: 168, activityLevel: "sedentary", currentCalorieIntake: 2200, selectedNutrients: FIVE_FOCUS, values: { iron: 25, calcium: 1600, vitaminA: 1400, vitaminC: 150, protein: 100 } },
  { fullName: "Tunde Bakare",         age: 40, gender: "male",   weight: 95,  height: 180, activityLevel: "very_active", currentCalorieIntake: 2800, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 90 } },
  { fullName: "Comfort Adeleke",      age: 70, gender: "female", weight: 70,  height: 155, activityLevel: "sedentary", currentCalorieIntake: 1500, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1200, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Ifeanyi Obi",          age: 10, gender: "male",   weight: 32,  height: 138, activityLevel: "moderately_active", currentCalorieIntake: 1800, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1300, vitaminA: 600, vitaminC: 45, protein: 34 } },
  { fullName: "Blessing Yakubu",      age: 11, gender: "female", weight: 35,  height: 142, activityLevel: "lightly_active", currentCalorieIntake: 1600, selectedNutrients: FIVE_FOCUS, values: { iron: 4, calcium: 700, vitaminA: 300, vitaminC: 20, protein: 20 } },
  { fullName: "Segun Afolabi",        age: 45, gender: "male",   weight: 110, height: 175, activityLevel: "sedentary", currentCalorieIntake: 2100, selectedNutrients: ["iron","calcium","vitaminA","vitaminC","protein","magnesium","zinc","fiber","fat","carbohydrates"], values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 70, magnesium: 200, zinc: 5, fiber: 15, fat: 90, carbohydrates: 130 } },
  { fullName: "Funmilayo Ojo",        age: 28, gender: "female", weight: 55,  height: 163, activityLevel: "very_active", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 18, calcium: 1000, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Chinedu Nnamdi",       age: 33, gender: "male",   weight: 68,  height: 172, activityLevel: "moderately_active", currentCalorieIntake: 2200, selectedNutrients: FIVE_FOCUS, values: { iron: 5, calcium: 600, vitaminA: 400, vitaminC: 30, protein: 35 } },
  { fullName: "Patience Effiong",     age: 62, gender: "female", weight: 75,  height: 158, activityLevel: "lightly_active", currentCalorieIntake: 1600, selectedNutrients: FIVE_FOCUS, values: { iron: 6, calcium: 1100, vitaminA: 700, vitaminC: 75, protein: 40 } },
  { fullName: "Ibrahim Suleiman",     age: 19, gender: "male",   weight: 70,  height: 176, activityLevel: "very_active", currentCalorieIntake: 2800, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 85 } },
  { fullName: "Aisha Mohammed",       age: 19, gender: "female", weight: 60,  height: 167, activityLevel: "moderately_active", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 9, calcium: 500, vitaminA: 350, vitaminC: 38, protein: 23 } },
  { fullName: "Oluwaseun Adekunle",   age: 51, gender: "male",   weight: 85,  height: 179, activityLevel: "sedentary", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 4, calcium: 500, vitaminA: 450, vitaminC: 45, protein: 28 } },
  { fullName: "Precious Etim",        age: 48, gender: "female", weight: 62,  height: 164, activityLevel: "moderately_active", currentCalorieIntake: 1800, selectedNutrients: FIVE_FOCUS, values: { iron: 3.6, calcium: 300, vitaminA: 200, vitaminC: 20, protein: 15 } },

  { fullName: "Kelechi Amadi",        age: 27, gender: "male",   weight: 82,  height: 180, activityLevel: "moderately_active", currentCalorieIntake: 2300, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Yetunde Bankole",      age: 31, gender: "female", weight: 60,  height: 166, activityLevel: "lightly_active", currentCalorieIntake: 1800, selectedNutrients: FIVE_FOCUS, values: { iron: 6, calcium: 550, vitaminA: 300, vitaminC: 35, protein: 25 } },
  { fullName: "Abubakar Sani",        age: 58, gender: "male",   weight: 90,  height: 174, activityLevel: "sedentary", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Rita Okoro",           age: 44, gender: "female", weight: 70,  height: 160, activityLevel: "moderately_active", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 12, calcium: 800, vitaminA: 600, vitaminC: 60, protein: 40 } },
  { fullName: "Femi Adisa",           age: 13, gender: "male",   weight: 45,  height: 150, activityLevel: "very_active", currentCalorieIntake: 2200, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1300, vitaminA: 600, vitaminC: 45, protein: 34 } },
  { fullName: "Zainab Lawal",         age: 14, gender: "female", weight: 48,  height: 155, activityLevel: "moderately_active", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 400, vitaminC: 30, protein: 25 } },
  { fullName: "Chukwuemeka Iwu",      age: 37, gender: "male",   weight: 100, height: 182, activityLevel: "sedentary", currentCalorieIntake: 2500, selectedNutrients: FIVE_FOCUS, values: { iron: 15, calcium: 1400, vitaminA: 1200, vitaminC: 130, protein: 120 } },
  { fullName: "Adaeze Nnaji",         age: 26, gender: "female", weight: 52,  height: 160, activityLevel: "extra_active", currentCalorieIntake: 2400, selectedNutrients: FIVE_FOCUS, values: { iron: 20, calcium: 1100, vitaminA: 750, vitaminC: 80, protein: 55 } },
  { fullName: "Musa Garba",           age: 65, gender: "male",   weight: 75,  height: 170, activityLevel: "lightly_active", currentCalorieIntake: 1800, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 950, vitaminA: 850, vitaminC: 85, protein: 50 } },
  { fullName: "Folake Ige",           age: 9,  gender: "female", weight: 30,  height: 132, activityLevel: "moderately_active", currentCalorieIntake: 1600, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1300, vitaminA: 600, vitaminC: 45, protein: 34 } },
  { fullName: "Emmanuel Udo",         age: 20, gender: "male",   weight: 65,  height: 173, activityLevel: "very_active", currentCalorieIntake: 2600, selectedNutrients: FIVE_FOCUS, values: { iron: 4, calcium: 500, vitaminA: 450, vitaminC: 45, protein: 28 } },
  { fullName: "Titilayo Fashola",     age: 39, gender: "female", weight: 85,  height: 162, activityLevel: "sedentary", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 14, calcium: 1250, vitaminA: 900, vitaminC: 100, protein: 60 } },
  { fullName: "Suleiman Danjuma",     age: 12, gender: "male",   weight: 40,  height: 145, activityLevel: "moderately_active", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 3, calcium: 600, vitaminA: 250, vitaminC: 15, protein: 15 } },
  { fullName: "Omolara Bakare",       age: 67, gender: "female", weight: 65,  height: 156, activityLevel: "sedentary", currentCalorieIntake: 1500, selectedNutrients: FIVE_FOCUS, values: { iron: 7, calcium: 1150, vitaminA: 680, vitaminC: 70, protein: 42 } },
  { fullName: "Victor Chukwuma",      age: 29, gender: "male",   weight: 78,  height: 177, activityLevel: "very_active", currentCalorieIntake: 2700, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 110 } },
  { fullName: "Hauwa Ibrahim",        age: 17, gender: "female", weight: 55,  height: 160, activityLevel: "moderately_active", currentCalorieIntake: 2000, selectedNutrients: FIVE_FOCUS, values: { iron: 15, calcium: 1300, vitaminA: 700, vitaminC: 65, protein: 46 } },
  { fullName: "Anthony Eze",          age: 53, gender: "male",   weight: 95,  height: 178, activityLevel: "sedentary", currentCalorieIntake: 2200, selectedNutrients: FIVE_FOCUS, values: { iron: 4, calcium: 500, vitaminA: 450, vitaminC: 45, protein: 28 } },
  { fullName: "Chidinma Okeke",       age: 24, gender: "female", weight: 57,  height: 163, activityLevel: "moderately_active", currentCalorieIntake: 1900, selectedNutrients: FIVE_FOCUS, values: { iron: 18, calcium: 1000, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Bashir Aliyu",         age: 41, gender: "male",   weight: 88,  height: 176, activityLevel: "lightly_active", currentCalorieIntake: 2100, selectedNutrients: FIVE_FOCUS, values: { iron: 2, calcium: 300, vitaminA: 200, vitaminC: 15, protein: 18 } },
  { fullName: "Ronke Adebayo",        age: 57, gender: "female", weight: 72,  height: 159, activityLevel: "sedentary", currentCalorieIntake: 1550, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1200, vitaminA: 700, vitaminC: 75, protein: 46 } },
  { fullName: "Peter Nwachukwu",      age: 18, gender: "male",   weight: 68,  height: 174, activityLevel: "very_active", currentCalorieIntake: 2900, selectedNutrients: FIVE_FOCUS, values: { iron: 11, calcium: 1300, vitaminA: 900, vitaminC: 75, protein: 52 } },
  { fullName: "Amina Yusuf",          age: 46, gender: "female", weight: 66,  height: 161, activityLevel: "moderately_active", currentCalorieIntake: 1850, selectedNutrients: FIVE_FOCUS, values: { iron: 9, calcium: 950, vitaminA: 650, vitaminC: 68, protein: 42 } },
  { fullName: "Godwin Etuk",          age: 9,  gender: "male",   weight: 28,  height: 130, activityLevel: "moderately_active", currentCalorieIntake: 1700, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1300, vitaminA: 600, vitaminC: 45, protein: 34 } },
  { fullName: "Stella Uzoma",         age: 34, gender: "female", weight: 95,  height: 165, activityLevel: "sedentary", currentCalorieIntake: 2300, selectedNutrients: FIVE_FOCUS, values: { iron: 22, calcium: 1500, vitaminA: 1300, vitaminC: 140, protein: 95 } },
  { fullName: "Abdulrahman Musa",     age: 49, gender: "male",   weight: 80,  height: 175, activityLevel: "moderately_active", currentCalorieIntake: 2100, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Joyce Anyanwu",        age: 13, gender: "female", weight: 42,  height: 150, activityLevel: "lightly_active", currentCalorieIntake: 1700, selectedNutrients: FIVE_FOCUS, values: { iron: 6, calcium: 1100, vitaminA: 500, vitaminC: 35, protein: 28 } },
  { fullName: "Tobi Fagbenle",        age: 36, gender: "male",   weight: 73,  height: 171, activityLevel: "very_active", currentCalorieIntake: 2600, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Ekaette Bassey",       age: 52, gender: "female", weight: 78,  height: 157, activityLevel: "sedentary", currentCalorieIntake: 1650, selectedNutrients: FIVE_FOCUS, values: { iron: 5, calcium: 900, vitaminA: 600, vitaminC: 60, protein: 35 } },
  { fullName: "Isaac Okorie",         age: 23, gender: "male",   weight: 63,  height: 169, activityLevel: "moderately_active", currentCalorieIntake: 2200, selectedNutrients: FIVE_FOCUS, values: { iron: 8, calcium: 1000, vitaminA: 900, vitaminC: 90, protein: 56 } },
  { fullName: "Mercy Nnadi",          age: 30, gender: "female", weight: 105, height: 164, activityLevel: "sedentary", currentCalorieIntake: 2400, selectedNutrients: FIVE_FOCUS, values: { iron: 30, calcium: 1800, vitaminA: 1600, vitaminC: 200, protein: 140 } },
];

async function seed() {
  await initializeDatabase();
  console.log(`Seeding ${PEOPLE.length} test assessments...\n`);

  for (let i = 0; i < PEOPLE.length; i++) {
    const person = PEOPLE[i];

    const userInput = {
      fullName: person.fullName,
      age: person.age,
      gender: person.gender,
      weight: person.weight,
      height: person.height,
      activityLevel: person.activityLevel,
      activityLevelDisplay: formatActivityLevel(person.activityLevel),
      currentCalorieIntake: person.currentCalorieIntake,
      selectedNutrients: person.selectedNutrients,

      calories: 0,
      protein: person.values.protein || 0,
      iron: person.values.iron || 0,
      calcium: person.values.calcium || 0,
      vitaminA: person.values.vitaminA || 0,
      vitaminC: person.values.vitaminC || 0,
      magnesium: person.values.magnesium || 0,
      zinc: person.values.zinc || 0,
      fiber: person.values.fiber || 0,
      fat: person.values.fat || 0,
      carbohydrates: person.values.carbohydrates || 0,
    };

    const bmiCalorieData = getFullBMIAndCalorieData(userInput);

    const nutrientResults = compareAllNutrients(userInput, {
      age: userInput.age,
      gender: userInput.gender,
      calorieReference: bmiCalorieData.dailyCalories,
    });

    const scoredResults = scoreAllNutrients(nutrientResults);

    const filteredResults = {};
    person.selectedNutrients.forEach(key => {
      if (scoredResults[key]) filteredResults[key] = scoredResults[key];
    });

    const scoringSummary = buildScoringSummary(filteredResults);
    const recommendationSummary = buildRecommendationSummary(filteredResults);

    const fullAssessment = {
      ...userInput,
      ...bmiCalorieData,
      nutrientResults: filteredResults,
      scoringSummary,
      recommendationSummary,
      createdAt: computeCreatedAt(i, PEOPLE.length),
    };

    const saved = await saveAssessment(fullAssessment);
    console.log(`✅ ${person.fullName.padEnd(20)} (${person.gender}, age ${person.age})`.padEnd(45) + `-> id ${saved.id}, dated ${fullAssessment.createdAt.slice(0,10)}`);
  }

  console.log(`\nDone. ${PEOPLE.length} test assessments have been added to your database, spread across the last ~65 days.`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
