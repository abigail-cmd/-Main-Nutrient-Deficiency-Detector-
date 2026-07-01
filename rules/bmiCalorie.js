// rules/bmiCalorie.js

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function validateBasicInputs({ age, gender, weight, height, activityLevel }) {
  const a = toNumber(age);
  const w = toNumber(weight);
  const h = toNumber(height);

  if (!a || !w || !h) {
    throw new Error("Age, weight, and height must be valid numbers.");
  }

  if (a < 9 || a > 80) {
    throw new Error("Age must be between 9 and 80 years for this system.");
  }

  if (w < 20 || w > 250) {
    throw new Error("Weight must be between 20 kg and 250 kg.");
  }

  if (h < 100 || h > 250) {
    throw new Error("Height must be between 100 cm and 250 cm.");
  }

  if (!gender || !["male", "female"].includes(gender.toLowerCase())) {
    throw new Error("Gender must be 'male' or 'female'.");
  }

  const allowedActivityLevels = [
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ];

  if (!allowedActivityLevels.includes(activityLevel)) {
    throw new Error(
      "Activity level must be one of: sedentary, lightly_active, moderately_active, very_active, extra_active."
    );
  }

  return {
    age: a,
    weight: w,
    height: h,
    gender: gender.toLowerCase(),
    activityLevel,
  };
}

function calculateBMI(weight, height) {
  const w = toNumber(weight);
  const hCm = toNumber(height);

  if (!w || !hCm || w <= 0 || hCm <= 0) {
    throw new Error("Valid weight and height are required.");
  }

  const hM = hCm / 100;
  const bmi = w / (hM * hM);

  return Number(bmi.toFixed(2));
}

function getBMICategory(bmi) {
  const value = Number(bmi);

  if (value < 18.5) return "Underweight";
  if (value < 25) return "Normal weight";
  if (value < 30) return "Overweight";
  return "Obese";
}

function getActivityFactor(age, gender, activityLevel) {
  const isTeen = age < 19;

  const teenFactors = {
    male: {
      sedentary: 1.0,
      lightly_active: 1.13,
      moderately_active: 1.26,
      very_active: 1.42,
      extra_active: 1.42,
    },
    female: {
      sedentary: 1.0,
      lightly_active: 1.16,
      moderately_active: 1.31,
      very_active: 1.56,
      extra_active: 1.56,
    },
  };

  const adultFactors = {
    male: {
      sedentary: 1.0,
      lightly_active: 1.11,
      moderately_active: 1.25,
      very_active: 1.48,
      extra_active: 1.48,
    },
    female: {
      sedentary: 1.0,
      lightly_active: 1.12,
      moderately_active: 1.27,
      very_active: 1.45,
      extra_active: 1.45,
    },
  };

  return isTeen
    ? teenFactors[gender][activityLevel]
    : adultFactors[gender][activityLevel];
}

function calculateCalories({ age, gender, weight, height, activityLevel }) {
  const validated = validateBasicInputs({
    age,
    gender,
    weight,
    height,
    activityLevel,
  });

  const { age: a, gender: g, weight: w, height: hCm } = validated;
  const hM = hCm / 100;
  const activityFactor = getActivityFactor(a, g, activityLevel);

  let dailyCalories;
  let methodUsed;

  // Teen equations
  if (a >= 9 && a <= 18) {
    if (g === "male") {
      dailyCalories =
        88.5 - 61.9 * a + activityFactor * (26.7 * w + 903 * hM) + 25;
      methodUsed = "Teen male energy estimation";
    } else {
      dailyCalories =
        135.3 - 30.8 * a + activityFactor * (10.0 * w + 934 * hM) + 25;
      methodUsed = "Teen female energy estimation";
    }
  } else {
    // Adult equations
    if (g === "male") {
      dailyCalories =
        662 - 9.53 * a + activityFactor * (15.91 * w + 539.6 * hM);
      methodUsed = "Adult male energy estimation";
    } else {
      dailyCalories =
        354 - 6.91 * a + activityFactor * (9.36 * w + 726 * hM);
      methodUsed = "Adult female energy estimation";
    }
  }

  // Keep BMR as supporting info using Mifflin for adults, simplified estimate for teens
  let bmr;
  if (a >= 19) {
    if (g === "male") {
      bmr = 10 * w + 6.25 * hCm - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * hCm - 5 * a - 161;
    }
  } else {
    bmr = dailyCalories / activityFactor;
  }

  return {
    bmr: Number(bmr.toFixed(2)),
    dailyCalories: Number(dailyCalories.toFixed(2)),
    methodUsed,
  };
}

function compareCalorieIntake(currentIntake, recommendedCalories) {
  const intake = toNumber(currentIntake);
  const recommended = toNumber(recommendedCalories);

  if (!Number.isFinite(intake) || intake < 0) {
    throw new Error("Current calorie intake must be a valid number.");
  }

  const differenceRaw = Number((intake - recommended).toFixed(2));

  let status = "";
  let remark = "";

  if (differenceRaw < 0) {
    status = "Below Recommended";
    remark = "Your calorie intake is lower than your estimated daily requirement.";
  } else if (differenceRaw > 0) {
    status = "Above Recommended";
    remark = "Your calorie intake is higher than your estimated daily requirement.";
  } else {
    status = "Meets Recommendation";
    remark = "Your calorie intake matches your estimated daily requirement.";
  }

  return {
    currentIntake: intake,
    recommendedCalories: Number(recommended.toFixed(2)),
    difference: Math.abs(differenceRaw),
    direction:
      differenceRaw < 0 ? "below" : differenceRaw > 0 ? "above" : "equal",
    status,
    remark,
  };
}

function getCalorieRemark(calories) {
  const value = Number(calories);

  if (value < 1800) return "Low calorie requirement";
  if (value <= 2500) return "Moderate calorie requirement";
  return "High calorie requirement";
}

function getFullBMIAndCalorieData(data) {
  const validated = validateBasicInputs(data);

  const bmi = calculateBMI(validated.weight, validated.height);
  const bmiCategory = getBMICategory(bmi);

  const { bmr, dailyCalories, methodUsed } = calculateCalories(validated);
  const calorieRemark = getCalorieRemark(dailyCalories);

  let intakeComparison = null;

  if (
    data.currentCalorieIntake !== undefined &&
    data.currentCalorieIntake !== ""
  ) {
    intakeComparison = compareCalorieIntake(
      data.currentCalorieIntake,
      dailyCalories
    );
  }

  return {
    bmi,
    bmiCategory,
    bmr,
    dailyCalories,
    calorieRemark,
    intakeComparison,
    methodUsed,
  };
}

module.exports = {
  calculateBMI,
  getBMICategory,
  calculateCalories,
  compareCalorieIntake,
  getCalorieRemark,
  getFullBMIAndCalorieData,
  validateBasicInputs,
};