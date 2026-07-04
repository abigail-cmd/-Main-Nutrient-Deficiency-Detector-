// routes/mainRoutes.js

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { getFullBMIAndCalorieData } = require("../rules/bmiCalorie");
const { compareAllNutrients } = require("../rules/nutritionRules");
const { scoreAllNutrients, buildScoringSummary } = require("../rules/scoringEngine");
const { buildRecommendationSummary } = require("../rules/recommendationEngine");
const {
  saveAssessment,
  getAllAssessments,
  getAssessmentById,
  deleteAssessmentById,
} = require("../db/database");
const { generateAssessmentPdf } = require("../utils/pdfReport");
const { requireAdminAccess } = require("../middleware/auth");
const { getNutrientInfo, getStatusExplanation, RDA_EXPLAINER } = require("../rules/nutrientInfo");

// Limit admin login attempts: since it's a single shared password with no
// per-account lockout, this is the only thing standing between it and an
// unlimited brute-force guess. 10 attempts per 15 minutes per IP.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: format activity level for display
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

// Home page
router.get("/", (req, res) => {
  res.render("index", {
    title: "Nutritional Deficiency Detection System",
    errorMessage: null,
    oldInput: {},
    isAdmin: req.session.isAdmin || false,
    RDA_EXPLAINER,
  });
});

// Admin login page
router.get("/admin/login", (req, res) => {
  res.render("admin-login", {
    title: "Admin Login",
    errorMessage: null,
  });
});

// Admin login submit
router.post("/admin/login", adminLoginLimiter, (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || "abiadmin123";
  if (req.body.password === adminPassword) {
    req.session.isAdmin = true;
    return res.redirect("/dashboard");
  }
  return res.status(401).render("admin-login", {
    title: "Admin Login",
    errorMessage: "Invalid admin password.",
  });
});

// Admin logout
router.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// Analyze form submission
router.post("/analyze", async (req, res) => {
  try {
    // Parse which nutrients the user selected from the form
    const selectedRaw = req.body.selectedNutrients || "";
    const selectedNutrients = selectedRaw
      ? selectedRaw.split(",").map(s => s.trim()).filter(Boolean)
      : ["iron", "calcium", "vitaminA", "vitaminC", "protein"]; // default to focus 5

    // ── Server-side validation gate ──────────────────────────────────────────
    // The frontend blocks blank fields with JS, but that can be bypassed
    // (JS disabled, devtools, or a direct POST). Re-check here so the
    // backend never silently treats a missing/blank field as 0.
    const REQUIRED_PERSONAL_FIELDS = ["fullName", "age", "gender", "activityLevel", "weight", "height", "currentCalorieIntake"];
    const missingPersonal = REQUIRED_PERSONAL_FIELDS.filter(
      f => req.body[f] === undefined || String(req.body[f]).trim() === ""
    );
    const missingNutrients = selectedNutrients.filter(
      k => req.body[k] === undefined || String(req.body[k]).trim() === ""
    );
    if (missingPersonal.length > 0 || missingNutrients.length > 0) {
      return res.status(400).render("index", {
        title: "Nutritional Deficiency Detection System",
        errorMessage: "All fields are required. Please complete every personal-information field and provide an intake value for each nutrient you selected.",
        oldInput: req.body,
        isAdmin: req.session.isAdmin || false,
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    const userInput = {
      fullName:             req.body.fullName,
      age:                  Number(req.body.age),
      gender:               req.body.gender,
      weight:               Number(req.body.weight),
      height:               Number(req.body.height),
      activityLevel:        req.body.activityLevel,
      activityLevelDisplay: formatActivityLevel(req.body.activityLevel),
      currentCalorieIntake: Number(req.body.currentCalorieIntake),
      selectedNutrients,    // store which nutrients were chosen

      // Nutrient values — unselected ones sent as 0 by the form
      calories:      Number(req.body.calories)      || 0,
      protein:       Number(req.body.protein)       || 0,
      iron:          Number(req.body.iron)           || 0,
      calcium:       Number(req.body.calcium)        || 0,
      vitaminA:      Number(req.body.vitaminA)       || 0,
      vitaminC:      Number(req.body.vitaminC)       || 0,
      magnesium:     Number(req.body.magnesium)      || 0,
      zinc:          Number(req.body.zinc)            || 0,
      fiber:         Number(req.body.fiber)           || 0,
      fat:           Number(req.body.fat)             || 0,
      carbohydrates: Number(req.body.carbohydrates)  || 0,
    };

    const bmiCalorieData = getFullBMIAndCalorieData(userInput);

    // Run comparison for ALL nutrients (backend needs full picture for scoring)
    const nutrientResults = compareAllNutrients(userInput, {
      age:              userInput.age,
      gender:           userInput.gender,
      calorieReference: bmiCalorieData.dailyCalories,
    });

    const scoredResults    = scoreAllNutrients(nutrientResults);

    // ── KEY CHANGE: filter scoredResults to only selected nutrients ─────────
    // This means the result page, charts, and PDF only show what the user picked
    const filteredResults = {};
    selectedNutrients.forEach(key => {
      if (scoredResults[key]) filteredResults[key] = scoredResults[key];
    });
    // ────────────────────────────────────────────────────────────────────────

    const scoringSummary       = buildScoringSummary(filteredResults);
    const recommendationSummary = buildRecommendationSummary(filteredResults);

    const fullAssessment = {
      ...userInput,
      ...bmiCalorieData,
      activityLevelDisplay: formatActivityLevel(userInput.activityLevel),
      nutrientResults:      filteredResults,   // only selected nutrients stored
      scoringSummary,
      recommendationSummary,
    };

    const savedResult = await saveAssessment(fullAssessment);
    res.redirect(`/result/${savedResult.id}`);

  } catch (error) {
    console.error("Analysis error:", error);
    res.status(400).render("index", {
      title: "Nutritional Deficiency Detection System",
      errorMessage: error.message || "An error occurred while processing the assessment.",
      oldInput: req.body,
      isAdmin: req.session.isAdmin || false,
    });
  }
});

// Result page
router.get("/result/:id", async (req, res) => {
  try {
    const assessment = await getAssessmentById(req.params.id);
    if (!assessment) return res.status(404).send("Assessment not found.");
    res.render("result", {
      title: "Assessment Result",
      assessment,
      isAdmin: req.session.isAdmin || false,
      getNutrientInfo,
      getStatusExplanation,
      RDA_EXPLAINER,
    });
  } catch (error) {
    console.error("Result page error:", error.message);
    res.status(500).send("An error occurred while loading the result.");
  }
});

// Dashboard
router.get("/dashboard", requireAdminAccess, async (req, res) => {
  try {
    const assessments = await getAllAssessments();
    res.render("dashboard", {
      title: "Dashboard",
      assessments,
      isAdmin: true,
      page: "dashboard",
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).send("An error occurred while loading the dashboard.");
  }
});

// History
router.get("/history", requireAdminAccess, async (req, res) => {
  try {
    const assessments = await getAllAssessments();
    res.render("history", {
      title: "Assessment History",
      assessments,
      isAdmin: true,
      page: "history",
    });
  } catch (error) {
    console.error("History error:", error.message);
    res.status(500).send("An error occurred while loading history.");
  }
});

// Nutrient details
router.get("/nutrient/:id/:nutrientKey", async (req, res) => {
  try {
    const { id, nutrientKey } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment) return res.status(404).send("Assessment not found.");
    const nutrientData = assessment.nutrientResults?.[nutrientKey];
    const recommendationData = assessment.recommendationSummary?.allRecommendations?.[nutrientKey];
    if (!nutrientData) return res.status(404).send("Nutrient details not found.");
    res.render("nutrient-details", {
      title: `${nutrientData.nutrientName} Details`,
      assessment,
      nutrientData,
      recommendationData,
      nutrientInfo: getNutrientInfo(nutrientKey),
      statusExplanation: getStatusExplanation(nutrientData.status),
      isAdmin: req.session.isAdmin || false,
    });
  } catch (error) {
    console.error("Nutrient details error:", error.message);
    res.status(500).send("An error occurred while loading nutrient details.");
  }
});

// PDF report
router.get("/report/:id/pdf", async (req, res) => {
  try {
    const assessment = await getAssessmentById(req.params.id);
    if (!assessment) return res.status(404).send("Assessment not found.");
    generateAssessmentPdf(res, assessment);
  } catch (error) {
    console.error("PDF generation error:", error.message);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

// Delete assessment
router.post("/assessment/:id/delete", requireAdminAccess, async (req, res) => {
  try {
    const result = await deleteAssessmentById(req.params.id);
    if (!result.deleted) return res.status(404).send("Assessment not found.");
    res.redirect("/history");
  } catch (error) {
    console.error("Delete assessment error:", error.message);
    res.status(500).send("An error occurred while deleting the assessment.");
  }
});

module.exports = router;
