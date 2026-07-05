const PDFDocument = require("pdfkit");
const { getNutrientInfo, RDA_EXPLAINER } = require("../rules/nutrientInfo");

function generateAssessmentPdf(res, assessment) {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });

  // Use the date the assessment was actually taken, not today's download
  // date — otherwise every report downloaded today would show today's
  // date regardless of when the assessment happened.
  const date = assessment.createdAt
    ? new Date(assessment.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Only strip characters that are actually illegal in filenames
  // (Windows/Mac/Linux all disallow / \ : * ? " < > |) — everything else,
  // including spaces, is safe to keep for a readable name.
  const displayName = (assessment.fullName || "Patient").trim().replace(/[\/\\:*?"<>|]/g, "");
  const fileName = `${displayName} NutriDetect Report Analysis (${date}).pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  doc.pipe(res);

  // ── Colours ──────────────────────────────────────────────────────────────
  const C = {
    green:       "#065f46",
    greenMid:    "#059669",
    greenLight:  "#d1fae5",
    amber:       "#92400e",
    amberLight:  "#fef9c3",
    red:         "#991b1b",
    redLight:    "#fee2e2",
    orange:      "#9a3412",
    orangeLight: "#fed7aa",
    blue:        "#1e40af",
    blueLight:   "#dbeafe",
    purple:      "#5b21b6",
    purpleLight: "#ede9fe",
    slate:       "#0f172a",
    muted:       "#64748b",
    border:      "#e2e8f0",
    soft:        "#f8fafc",
    white:       "#ffffff",
  };

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const safe = (v, fb = "N/A") =>
    v !== undefined && v !== null && v !== "" ? String(v) : fb;

  function needsPage(h = 60) {
    if (doc.y + h > PAGE_H - 50) { doc.addPage(); drawPageHeader(); }
  }

  function rule(color = C.border, thickness = 0.5) {
    doc.save()
      .strokeColor(color).lineWidth(thickness)
      .moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).stroke()
      .restore();
    doc.moveDown(0.4);
  }

  function sectionHeading(label, title) {
    needsPage(50);
    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(8).fillColor(C.greenMid)
       .text(label.toUpperCase(), MARGIN, doc.y, { characterSpacing: 1 });
    doc.moveDown(0.15);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(C.slate)
       .text(title, MARGIN);
    doc.moveDown(0.3);
    rule(C.greenMid, 1);
  }

  function labelValue(label, value, x, y, w) {
    const ly = y ?? doc.y;
    const lx = x ?? MARGIN;
    const lw = w ?? CONTENT_W;
    doc.font("Helvetica").fontSize(8).fillColor(C.muted)
       .text(label, lx, ly, { width: lw });
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.slate)
       .text(safe(value), lx, doc.y + 1, { width: lw });
  }

  function miniCard(x, y, w, h, label, value, bg = C.soft, valueColor = C.slate) {
    doc.save()
       .roundedRect(x, y, w, h, 6).fillColor(bg).fill()
       .roundedRect(x, y, w, h, 6).strokeColor(C.border).lineWidth(0.5).stroke()
       .restore();
    doc.font("Helvetica").fontSize(7.5).fillColor(C.muted)
       .text(label, x + 8, y + 7, { width: w - 16 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(valueColor)
       .text(safe(value), x + 8, y + 19, { width: w - 16 });
  }

  function statusColor(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("deficient") || s.includes("high")) return { bg: C.redLight,    text: C.red };
    if (s.includes("borderline") || s.includes("moderate")) return { bg: C.amberLight, text: C.amber };
    if (s.includes("excess"))    return { bg: C.purpleLight, text: C.purple };
    return { bg: C.greenLight, text: C.green };
  }

  function statusBadge(label, x, y) {
    const col = statusColor(label);
    const w = doc.font("Helvetica-Bold").fontSize(7.5).widthOfString(label) + 14;
    doc.save()
       .roundedRect(x, y, w, 14, 7).fillColor(col.bg).fill()
       .restore();
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(col.text)
       .text(label, x + 7, y + 3, { width: w - 14 });
    return w;
  }

  function progressBar(x, y, w, pct, status) {
    const col = statusColor(status);
    const filled = Math.min((pct / 100) * w, w);
    doc.save()
       .roundedRect(x, y, w, 6, 3).fillColor(C.border).fill()
       .roundedRect(x, y, filled, 6, 3).fillColor(col.text).fill()
       .restore();
  }

  // ── Page header (used on every page after the first) ──────────────────────
  function drawPageHeader() {
    doc.save()
       .rect(0, 0, PAGE_W, 36).fillColor(C.green).fill()
       .restore();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white)
       .text("Nutritional Deficiency Detection System  —  Assessment Report",
             MARGIN, 13, { align: "center", width: CONTENT_W });
    doc.y = 50;
  }

  // ── Page footer ───────────────────────────────────────────────────────────
  function drawFooters() {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.save()
         .strokeColor(C.border).lineWidth(0.5)
         .moveTo(MARGIN, PAGE_H - 28).lineTo(PAGE_W - MARGIN, PAGE_H - 28).stroke()
         .restore();
      doc.font("Helvetica").fontSize(7.5).fillColor(C.muted)
         .text(
           `Page ${i + 1} of ${range.count}   •   Generated ${new Date().toLocaleDateString()}   •   Educational use only`,
           MARGIN, PAGE_H - 20,
           { align: "center", width: CONTENT_W }
         );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Cover
  // ════════════════════════════════════════════════════════════════════════
  // Dark green header band
  doc.save()
     .rect(0, 0, PAGE_W, 180).fillColor(C.green).fill()
     .restore();

  // Subtle horizontal rule in header
  doc.save()
     .strokeColor(C.greenMid).lineWidth(0.5)
     .moveTo(MARGIN, 155).lineTo(PAGE_W - MARGIN, 155).stroke()
     .restore();

  doc.font("Helvetica").fontSize(9).fillColor("#6ee7b7")
     .text("ASSESSMENT REPORT", MARGIN, 48, {
       align: "center", width: CONTENT_W, characterSpacing: 2,
     });

  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.white)
     .text("Nutritional Deficiency", MARGIN, 68, {
       align: "center", width: CONTENT_W,
     });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.white)
     .text("Detection System", MARGIN, doc.y + 2, {
       align: "center", width: CONTENT_W,
     });

  doc.font("Helvetica").fontSize(9).fillColor("#a7f3d0")
     .text("Rule-Based Nutrient Assessment Platform", MARGIN, 134, {
       align: "center", width: CONTENT_W,
     });

  doc.y = 200;

  // Patient info card
  const infoCardY = 196;
  doc.save()
     .roundedRect(MARGIN, infoCardY, CONTENT_W, 120, 10)
     .fillColor(C.soft).fill()
     .roundedRect(MARGIN, infoCardY, CONTENT_W, 120, 10)
     .strokeColor(C.border).lineWidth(0.5).stroke()
     .restore();

  // Left accent bar
  doc.save()
     .roundedRect(MARGIN, infoCardY, 4, 120, 2)
     .fillColor(C.greenMid).fill()
     .restore();

  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.greenMid)
     .text("PATIENT INFORMATION", MARGIN + 16, infoCardY + 14);

  const col1x = MARGIN + 16;
  const col2x = MARGIN + CONTENT_W / 2;
  const rowH  = 22;
  const startY = infoCardY + 32;

  const infoRows = [
    ["Full Name",    safe(assessment.fullName)],
    ["Age",          safe(assessment.age) + " years"],
    ["Gender",       safe(assessment.gender)],
    ["Weight",       safe(assessment.weight) + " kg"],
    ["Height",       safe(assessment.height) + " cm"],
    ["Activity Level", safe(assessment.activityLevel)],
  ];

  infoRows.forEach(([label, value], i) => {
    const ix = i < 3 ? col1x : col2x;
    const iy = startY + (i % 3) * rowH;
    doc.font("Helvetica").fontSize(7.5).fillColor(C.muted).text(label, ix, iy);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.slate).text(value, ix, iy + 9);
  });

  doc.y = infoCardY + 136;

  // Assessment date + ID row
  doc.font("Helvetica").fontSize(8).fillColor(C.muted)
     .text(
       `Assessment ID: ${safe(assessment.id)}   •   Date: ${assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}`,
       MARGIN, doc.y, { align: "center", width: CONTENT_W }
     );

  doc.moveDown(1.2);

  // Overall summary stat row
  const stats = [
    { label: "Overall Status",    value: safe(assessment.scoringSummary?.overall?.overallStatus) },
    { label: "Risk Level",        value: safe(assessment.scoringSummary?.overall?.overallRiskLevel) },
    { label: "Average Score",     value: safe(assessment.scoringSummary?.overall?.averageScore) },
    { label: "Score %",           value: safe(assessment.scoringSummary?.overall?.percentageScore) + "%" },
    { label: "BMI",               value: safe(assessment.bmi) },
    { label: "BMI Category",      value: safe(assessment.bmiCategory) },
  ];

  const statW = CONTENT_W / 3 - 6;
  const statH = 52;
  const statStartY = doc.y;

  stats.forEach((s, i) => {
    const sx = MARGIN + (i % 3) * (statW + 9);
    const sy = statStartY + Math.floor(i / 3) * (statH + 8);
    miniCard(sx, sy, statW, statH, s.label, s.value);
  });

  doc.y = statStartY + statH * 2 + 24;

  // Disclaimer box at bottom of page 1
  doc.save()
     .roundedRect(MARGIN, doc.y, CONTENT_W, 36, 6)
     .fillColor(C.amberLight).fill()
     .restore();
  doc.font("Helvetica").fontSize(8).fillColor(C.amber)
     .text(
       "This report is an educational and analytical output generated from user-provided intake values. It is not a substitute for professional medical or dietary advice.",
       MARGIN + 10, doc.y + 10, { width: CONTENT_W - 20 }
     );

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2 — BMI & Calorie + Focus Nutrients
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader();

  // BMI + Calorie cards side by side
  sectionHeading("Body Analysis", "BMI & Calorie Summary");

  const bmiCardW = (CONTENT_W - 12) / 2;
  const bmiCardY = doc.y;

  // BMI card
  doc.save()
     .roundedRect(MARGIN, bmiCardY, bmiCardW, 80, 8)
     .fillColor(C.soft).fill()
     .roundedRect(MARGIN, bmiCardY, bmiCardW, 80, 8)
     .strokeColor(C.border).lineWidth(0.5).stroke()
     .restore();

  doc.font("Helvetica").fontSize(7.5).fillColor(C.muted).text("Body Mass Index", MARGIN + 10, bmiCardY + 10);
  const bmiCol = statusColor(assessment.bmiCategory);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(bmiCol.text)
     .text(safe(assessment.bmi), MARGIN + 10, bmiCardY + 22);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(bmiCol.text)
     .text(safe(assessment.bmiCategory), MARGIN + 10, bmiCardY + 48);
  doc.font("Helvetica").fontSize(7.5).fillColor(C.muted)
     .text("Under <18.5  ·  Normal 18.5–24.9  ·  Over 25–29.9  ·  Obese ≥30", MARGIN + 10, bmiCardY + 62, { width: bmiCardW - 20 });

  // Calorie card
  const calX = MARGIN + bmiCardW + 12;
  const calorieData = assessment.calorieComparison || {};
  doc.save()
     .roundedRect(calX, bmiCardY, bmiCardW, 80, 8)
     .fillColor(C.soft).fill()
     .roundedRect(calX, bmiCardY, bmiCardW, 80, 8)
     .strokeColor(C.border).lineWidth(0.5).stroke()
     .restore();

  doc.font("Helvetica").fontSize(7.5).fillColor(C.muted).text("Daily Calorie Comparison", calX + 10, bmiCardY + 10);
  miniCard(calX + 10, bmiCardY + 22, (bmiCardW - 26) / 2, 32, "Your intake", safe(assessment.currentCalorieIntake) + " kcal", C.white);
  miniCard(calX + 10 + (bmiCardW - 26) / 2 + 6, bmiCardY + 22, (bmiCardW - 26) / 2, 32, "Estimated need", safe(assessment.dailyCalories) + " kcal", C.white);
  if (calorieData.difference) {
    const calBadgeColor = (calorieData.direction || "").toLowerCase().includes("above") ? C.red : C.amber;
    doc.font("Helvetica").fontSize(7.5).fillColor(calBadgeColor)
       .text(`${calorieData.difference} kcal ${safe(calorieData.direction)} recommended`, calX + 10, bmiCardY + 62, { width: bmiCardW - 20 });
  }

  doc.y = bmiCardY + 92;

  // ── Focus Nutrients Table ────────────────────────────────────────────────
  sectionHeading("Focus Nutrients (Priority)", "Iron · Calcium · Vitamin A · Vitamin C · Protein");

  const focusNutrients = Object.values(assessment.nutrientResults || {}).filter(n => n.focus);
  const colW = CONTENT_W / focusNutrients.length - 4;

  // Column headers
  const tableHeaderY = doc.y;
  focusNutrients.forEach((n, i) => {
    const cx = MARGIN + i * (colW + 4);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.slate)
       .text(n.nutrientName, cx, tableHeaderY, { width: colW, align: "center" });
  });
  doc.moveDown(0.3);
  rule();

  // Each row: Intake, RDA, %, Status, Score
  const rowLabels = [
    { key: "intake",         label: "Intake",      fmt: n => `${n.intake} ${n.unit}` },
    { key: "referenceValue", label: "RDA",         fmt: n => `${n.referenceValue} ${n.unit}` },
    { key: "percentageMet",  label: "% of RDA",    fmt: n => `${n.percentageMet}%` },
    { key: "status",         label: "Status",      fmt: n => n.status, badge: true },
    { key: "score",          label: "Score",       fmt: n => safe(n.score) },
  ];

  rowLabels.forEach(row => {
    needsPage(28);
    const rowY = doc.y;
    const rowBg = rowLabels.indexOf(row) % 2 === 0 ? C.soft : C.white;
    doc.save().rect(MARGIN, rowY, CONTENT_W, 22).fillColor(rowBg).fill().restore();

    focusNutrients.forEach((n, i) => {
      const cx = MARGIN + i * (colW + 4);
      if (i === 0) {
        doc.font("Helvetica").fontSize(7.5).fillColor(C.muted)
           .text(row.label, MARGIN - 2, rowY + 7, { width: 36 });
      }
      const val = row.fmt(n);
      if (row.badge) {
        statusBadge(val, cx + 4, rowY + 5);
      } else {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(C.slate)
           .text(val, cx, rowY + 7, { width: colW, align: "center" });
      }
    });
    doc.y = rowY + 26;
  });

  // Progress bars row
  needsPage(36);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(7.5).fillColor(C.muted).text("Coverage vs RDA", MARGIN, doc.y);
  doc.moveDown(0.3);
  focusNutrients.forEach((n, i) => {
    const cx = MARGIN + i * (colW + 4);
    progressBar(cx + 4, doc.y, colW - 8, n.percentageMet, n.status);
  });
  doc.moveDown(0.7);

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 3 — Recommendations
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader();

  const priorityRecs = assessment.recommendationSummary?.priorityRecommendations || [];
  const supportingRecs = assessment.recommendationSummary?.supportingRecommendations || [];
  const generalAdvice = assessment.recommendationSummary?.generalAdvice || [];

  // Priority recommendations (focus nutrients with issues)
  sectionHeading("Priority Recommendations", "Focus nutrients requiring dietary attention");

  if (priorityRecs.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(C.muted)
       .text("No priority nutrient concerns detected. All focus nutrients appear within acceptable range.", MARGIN);
    doc.moveDown(0.5);
  } else {
    priorityRecs.forEach(item => {
      needsPage(80);
      const cardY = doc.y;
      const col = statusColor(item.status);

      doc.save()
         .roundedRect(MARGIN, cardY, CONTENT_W, 4, 2).fillColor(col.text).fill()
         .roundedRect(MARGIN, cardY + 4, CONTENT_W, 70, 0).fillColor(C.soft).fill()
         .roundedRect(MARGIN, cardY, CONTENT_W, 74, 4).strokeColor(col.text).lineWidth(0.5).stroke()
         .restore();

      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.slate)
         .text(safe(item.nutrientName), MARGIN + 10, cardY + 10);
      statusBadge(safe(item.status), MARGIN + CONTENT_W - 80, cardY + 8);

      doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
         .text(safe(item.advice), MARGIN + 10, cardY + 26, { width: CONTENT_W - 20 });

      const foods = (item.recommendedFoods || []).join("  ·  ");
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(col.text)
         .text("Recommended foods:", MARGIN + 10, cardY + 52, { continued: true })
         .font("Helvetica").fillColor(C.muted).text("  " + foods, { width: CONTENT_W - 20 });

      doc.y = cardY + 82;
    });
  }

  // Supporting recommendations (non-focus nutrients)
  sectionHeading("Supporting Notes", "Additional tracked nutrients (Carbs, Fat, Fiber, Magnesium, Zinc, Protein*)");

  if (supportingRecs.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(C.muted)
       .text("No concerns noted for supporting nutrients. Continue maintaining balanced intake.", MARGIN);
    doc.moveDown(0.5);
  } else {
    supportingRecs.forEach(item => {
      needsPage(44);
      const col = statusColor(item.status);
      const recY = doc.y;

      doc.save()
         .roundedRect(MARGIN, recY, CONTENT_W, 38, 6)
         .fillColor(C.soft).fill()
         .strokeColor(col.text).lineWidth(0.5).stroke()
         .restore();

      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.slate)
         .text(safe(item.nutrientName), MARGIN + 10, recY + 8, { continued: true });
      doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
         .text("  —  " + safe(item.advice), { width: CONTENT_W - 100 });
      statusBadge(safe(item.status), PAGE_W - MARGIN - 70, recY + 6);

      doc.y = recY + 46;
    });
  }

  // General advice
  if (generalAdvice.length > 0) {
    needsPage(50);
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.slate).text("General Dietary Advice", MARGIN);
    doc.moveDown(0.3);
    generalAdvice.forEach(advice => {
      needsPage(24);
      const aY = doc.y;
      doc.save()
         .circle(MARGIN + 4, aY + 5, 2).fillColor(C.greenMid).fill()
         .restore();
      doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
         .text(advice, MARGIN + 14, aY, { width: CONTENT_W - 14 });
      doc.moveDown(0.4);
    });
  }

  // ── Nutrient Reference Guide (why each nutrient matters + food examples) ──
  const reportedNutrients = Object.values(assessment.nutrientResults || {});
  if (reportedNutrients.length > 0) {
    doc.addPage();
    drawPageHeader();
    sectionHeading("Nutrient Reference Guide", "Why each nutrient matters, and everyday food examples");

    doc.font("Helvetica").fontSize(8).fillColor(C.muted)
       .text(RDA_EXPLAINER, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.8);

    reportedNutrients.forEach(n => {
      const info = getNutrientInfo(n.nutrientKey);
      if (!info) return;

      needsPage(70);
      const blockY = doc.y;

      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.slate)
         .text(safe(n.nutrientName), MARGIN, blockY);

      doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
         .text(info.why, MARGIN, doc.y + 2, { width: CONTENT_W });

      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.greenMid)
         .text("Everyday reference amounts:", MARGIN, doc.y);
      doc.font("Helvetica").fontSize(8).fillColor(C.muted);

      info.examples.forEach(ex => {
        needsPage(14);
        doc.text(`•  ${ex.food}  —  ${ex.amount}`, MARGIN + 8, doc.y);
      });

      doc.moveDown(0.6);
      rule();
    });

    doc.font("Helvetica-Oblique").fontSize(7).fillColor(C.muted)
       .text("Food reference amounts are approximate, common values intended to help estimate intake — not for precise clinical use.",
             MARGIN, doc.y, { width: CONTENT_W });
  }

  // ── Finalize ─────────────────────────────────────────────────────────────
  drawFooters();
  doc.end();
}

module.exports = { generateAssessmentPdf };
