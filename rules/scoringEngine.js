

// rules/scoringEngine.js

function getScoreFromStatus(status) {
  switch (status) {
    case "Deficient":
      return 1;
    case "Borderline":
      return 2;
    case "Adequate":
      return 3;
    case "Excess":
      return 2;
    default:
      return 0;
  }
}

function getRiskLevelFromStatus(status) {
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

function scoreSingleNutrient(nutrientResult) {
  const score = getScoreFromStatus(nutrientResult.status);
  const riskLevel = getRiskLevelFromStatus(nutrientResult.status);

  return {
    ...nutrientResult,
    score,
    riskLevel,
  };
}

function scoreAllNutrients(comparisonResults) {
  const scoredResults = {};

  for (const [nutrientKey, nutrientResult] of Object.entries(comparisonResults)) {
    scoredResults[nutrientKey] = scoreSingleNutrient(nutrientResult);
  }

  return scoredResults;
}

function calculateOverallNutritionScore(scoredResults) {
  const nutrients = Object.values(scoredResults);

  if (nutrients.length === 0) {
    return {
      totalScore: 0,
      averageScore: 0,
      percentageScore: 0,
      overallStatus: "No Data",
      overallRiskLevel: "Unknown",
    };
  }

  const totalScore = nutrients.reduce((sum, nutrient) => sum + nutrient.score, 0);
  const maxPossibleScore = nutrients.length * 3;
  const averageScore = totalScore / nutrients.length;
  const percentageScore = (totalScore / maxPossibleScore) * 100;

  let overallStatus = "";
  let overallRiskLevel = "";

  if (percentageScore < 50) {
    overallStatus = "Poor";
    overallRiskLevel = "High Risk";
  } else if (percentageScore < 70) {
    overallStatus = "Fair";
    overallRiskLevel = "Moderate Risk";
  } else if (percentageScore < 85) {
    overallStatus = "Good";
    overallRiskLevel = "Low Risk";
  } else {
    overallStatus = "Excellent";
    overallRiskLevel = "Very Low Risk";
  }

  return {
    totalScore,
    averageScore: Number(averageScore.toFixed(2)),
    percentageScore: Number(percentageScore.toFixed(2)),
    overallStatus,
    overallRiskLevel,
  };
}

function categorizeScoredResults(scoredResults) {
  const all = Object.values(scoredResults);

  return {
    highRisk: all.filter((item) => item.riskLevel === "High Risk"),
    moderateRisk: all.filter((item) => item.riskLevel === "Moderate Risk"),
    lowRisk: all.filter((item) => item.riskLevel === "Low Risk"),
    veryLowRisk: all.filter((item) => item.riskLevel === "Very Low Risk"),
  };
}

function buildScoringSummary(scoredResults) {
  const categorized = categorizeScoredResults(scoredResults);
  const overall = calculateOverallNutritionScore(scoredResults);

  return {
    overall,
    counts: {
      highRisk: categorized.highRisk.length,
      moderateRisk: categorized.moderateRisk.length,
      lowRisk: categorized.lowRisk.length,
      veryLowRisk: categorized.veryLowRisk.length,
    },
    categories: categorized,
  };
}

module.exports = {
  getScoreFromStatus,
  getRiskLevelFromStatus,
  scoreSingleNutrient,
  scoreAllNutrients,
  calculateOverallNutritionScore,
  categorizeScoredResults,
  buildScoringSummary,
};